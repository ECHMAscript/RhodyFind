import { haversineMeters, type LatLng, type TravelMode } from '@/lib/geo';
import { BIKE, CAR, CAR_BACKWARD_ONLY, CAR_FORWARD_ONLY, FOOT, campusGraph, type EdgeKind, type Graph } from './graph';
import { MinHeap } from './MinHeap';

type Profile = {
  /** Whether this mode may travel the edge in the given direction (+1 A→B, -1 B→A). */
  allows: (flags: number, kind: EdgeKind, dir: number) => boolean;
  /** Travel speed on an edge kind, in meters per second. */
  speed: (kind: EdgeKind) => number;
  /** Extra cost factor for route choice only (e.g. prefer paths over roads when walking). */
  penalty: (kind: EdgeKind) => number;
  /** Fixed minutes added to the trip (parking, waiting for the shuttle). */
  overheadMin: number;
};

const MPH = 0.44704;

const carAllows = (flags: number, _kind: EdgeKind, dir: number) =>
  (flags & CAR) !== 0 &&
  !(dir > 0 && flags & CAR_BACKWARD_ONLY) &&
  !(dir < 0 && flags & CAR_FORWARD_ONLY);

const carSpeed = (kind: EdgeKind) => (kind === 'parking' ? 8 : kind === 'service' ? 15 : 25) * MPH;

const PROFILES: Record<TravelMode, Profile> = {
  walk: {
    allows: (flags) => (flags & FOOT) !== 0,
    speed: (kind) => (kind === 'steps' ? 0.7 : 1) * 3 * MPH,
    penalty: (kind) => (kind === 'road' ? 1.15 : kind === 'parking' ? 1.1 : 1),
    overheadMin: 0,
  },
  skate: {
    allows: (flags, kind) => (flags & FOOT) !== 0 && kind !== 'steps',
    speed: (kind) => (kind === 'track' ? 4 : 8) * MPH,
    penalty: (kind) => (kind === 'road' ? 1.1 : 1),
    overheadMin: 0,
  },
  bike: {
    allows: (flags) => (flags & BIKE) !== 0,
    speed: (kind) =>
      (kind === 'footway' || kind === 'sidewalk' || kind === 'pedestrian' || kind === 'crossing' ? 7 : 10) * MPH,
    penalty: (kind) => (kind === 'cycleway' ? 0.95 : 1),
    overheadMin: 1,
  },
  drive: { allows: carAllows, speed: carSpeed, penalty: () => 1, overheadMin: 2 },
  // Shuttle stops aren't mapped yet, so the shuttle follows the road network
  // with a fixed wait added.
  shuttle: { allows: carAllows, speed: (kind) => carSpeed(kind) * 0.8, penalty: () => 1, overheadMin: 4 },
};

export type Route = {
  mode: TravelMode;
  /** Full path, including the short connectors from the start/end points to the network. */
  coords: LatLng[];
  /** Graph edges traveled, in order, with the direction each was traveled in. */
  edges: { edge: number; dir: number }[];
  /** coords index where the network part of the path starts and ends. */
  networkStart: number;
  networkEnd: number;
  meters: number;
  minutes: number;
};

// Nodes reachable by a mode from the main part of the network. Small islands
// (a lone footpath that OSM doesn't connect to anything) are excluded so
// snapping never lands somewhere a route can't leave.
const reachableCache = new Map<TravelMode, Uint8Array>();

function reachable(g: Graph, mode: TravelMode): Uint8Array {
  let seen = reachableCache.get(mode);
  if (seen) return seen;
  const { allows } = PROFILES[mode];
  const comp = new Int32Array(g.nodeCount).fill(-1);
  const sizes: number[] = [];
  const stack: number[] = [];
  for (let s = 0; s < g.nodeCount; s++) {
    if (comp[s] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    comp[s] = id;
    stack.push(s);
    while (stack.length) {
      const n = stack.pop()!;
      size++;
      for (let k = g.adjStart[n]; k < g.adjStart[n + 1]; k++) {
        const e = g.adjEdge[k];
        // Connectivity ignores one-way restrictions; A* enforces them.
        if (!allows(g.edgeFlags[e] & ~(CAR_FORWARD_ONLY | CAR_BACKWARD_ONLY), g.edgeKind[e], 1)) continue;
        const t = g.adjTarget[k];
        if (comp[t] < 0) {
          comp[t] = id;
          stack.push(t);
        }
      }
    }
    sizes.push(size);
  }
  const main = sizes.indexOf(Math.max(...sizes));
  seen = new Uint8Array(g.nodeCount);
  for (let n = 0; n < g.nodeCount; n++) if (comp[n] === main && sizes[main] > 1) seen[n] = 1;
  reachableCache.set(mode, seen);
  return seen;
}

// When the user is moving, a node behind them costs this many extra meters,
// so a reroute continues forward instead of starting with a U-turn.
const BEHIND_PENALTY_M = 35;

/**
 * Closest network node a mode can use. A linear scan is fine for ~5,500 nodes.
 * With a heading (degrees), nodes behind the user are avoided unless they are
 * clearly the only nearby option.
 */
function snap(g: Graph, mode: TravelMode, p: LatLng, heading?: number): number {
  const ok = reachable(g, mode);
  const kx = 111_320 * Math.cos((p.lat * Math.PI) / 180);
  const ky = 110_540;
  const hx = heading === undefined ? 0 : Math.sin((heading * Math.PI) / 180);
  const hy = heading === undefined ? 0 : Math.cos((heading * Math.PI) / 180);
  let best = -1;
  let bestCost = Infinity;
  for (let n = 0; n < g.nodeCount; n++) {
    if (!ok[n]) continue;
    const dy = (g.lat[n] - p.lat) * ky;
    const dx = (g.lng[n] - p.lng) * kx;
    const d = Math.hypot(dx, dy);
    // Behind = more than 90 degrees off the direction of travel (and not right underfoot).
    const behind = heading !== undefined && d > 8 && dx * hx + dy * hy < 0;
    const cost = d + (behind ? BEHIND_PENALTY_M : 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = n;
    }
  }
  return best;
}

/**
 * Shortest (by travel time) route between two points for a travel mode, using
 * A*. Pass the user's heading when rerouting while moving, so the route starts
 * in the direction they're already going.
 */
export function findRoute(from: LatLng, to: LatLng, mode: TravelMode, opts: { heading?: number } = {}): Route | null {
  const g = campusGraph();
  const profile = PROFILES[mode];
  const start = snap(g, mode, from, opts.heading);
  const goal = snap(g, mode, to);
  if (start < 0 || goal < 0) return null;

  // Admissible heuristic: straight-line distance at the mode's top speed.
  let topSpeed = 0;
  for (const k of ['road', 'cycleway', 'footway', 'service'] as EdgeKind[]) topSpeed = Math.max(topSpeed, profile.speed(k) / Math.min(1, profile.penalty(k)));
  const goalPt = { lat: g.lat[goal], lng: g.lng[goal] };
  const h = (n: number) => haversineMeters({ lat: g.lat[n], lng: g.lng[n] }, goalPt) / topSpeed;

  const cost = new Float64Array(g.nodeCount).fill(Infinity);
  const prevAdj = new Int32Array(g.nodeCount).fill(-1); // adjacency slot used to reach each node
  const done = new Uint8Array(g.nodeCount);
  const open = new MinHeap();
  cost[start] = 0;
  open.push(start, h(start));

  while (open.size) {
    const n = open.pop();
    if (done[n]) continue; // stale heap entry
    if (n === goal) break;
    done[n] = 1;
    for (let k = g.adjStart[n]; k < g.adjStart[n + 1]; k++) {
      const e = g.adjEdge[k];
      const kind = g.edgeKind[e];
      if (!profile.allows(g.edgeFlags[e], kind, g.adjDir[k])) continue;
      const t = g.adjTarget[k];
      const c = cost[n] + (g.edgeLength[e] / profile.speed(kind)) * profile.penalty(kind);
      if (c < cost[t]) {
        cost[t] = c;
        prevAdj[t] = k;
        open.push(t, c + h(t));
      }
    }
  }
  if (start !== goal && prevAdj[goal] < 0) return null;

  // Walk back from the goal to recover the path.
  const edges: { edge: number; dir: number }[] = [];
  const nodePath = [goal];
  for (let n = goal; n !== start; ) {
    const k = prevAdj[n];
    edges.push({ edge: g.adjEdge[k], dir: g.adjDir[k] });
    n = g.adjDir[k] > 0 ? g.edgeA[g.adjEdge[k]] : g.edgeB[g.adjEdge[k]];
    nodePath.push(n);
  }
  edges.reverse();
  nodePath.reverse();

  const coords: LatLng[] = [from, ...nodePath.map((n) => ({ lat: g.lat[n], lng: g.lng[n] })), to];
  let seconds = 0;
  let networkMeters = 0;
  for (const { edge } of edges) {
    networkMeters += g.edgeLength[edge];
    seconds += g.edgeLength[edge] / profile.speed(g.edgeKind[edge]);
  }
  // The connectors to and from the network are walked.
  const connectorMeters = haversineMeters(from, coords[1]) + haversineMeters(coords[coords.length - 2], to);
  seconds += connectorMeters / PROFILES.walk.speed('footway');

  return {
    mode,
    coords,
    edges,
    networkStart: 1,
    networkEnd: coords.length - 2,
    meters: networkMeters + connectorMeters,
    minutes: Math.max(1, Math.round(seconds / 60 + profile.overheadMin)),
  };
}
