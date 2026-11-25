import { haversineMeters, type LatLng, type TravelMode } from '@/lib/geo';
import { BIKE, CAR, CAR_BACKWARD_ONLY, CAR_FORWARD_ONLY, FOOT, campusGraph, type EdgeKind, type Graph } from './graph';
import { MinHeap } from './MinHeap';
import { SpatialIndex, spatialEngineReady, toXY } from '../spatial/engine';

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
  /** Unrounded travel time, including any fixed overhead (for ranking). */
  seconds: number;
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

// Rerouting a moving user. The route may start at any network node near
// them, not just the closest one; each costs its distance plus a penalty for
// how far it is off their direction of travel (half of TURN_PENALTY_M for a
// node straight to the side, all of it for one straight behind). So someone
// walking straight gets a route that carries on ahead, not one that starts on
// a path to their right because it happens to be a few meters closer.
const TURN_PENALTY_M = 120;
// Nodes this close are underfoot: reaching one costs no penalty, but the
// route's first edge from it is then its first move, so that edge is
// penalized for its angle the same way instead.
const UNDERFOOT_M = 5;
// A route whose first edge doubles back (more than this off the heading)...
const UTURN_DEG = 120;
// ...costs this many extra meters.
const UTURN_PENALTY_M = 80;
// Start candidates: the nearest nodes, out to this far.
const START_CANDIDATES = 48;
const START_RADIUS_M = 120;

// Per travel mode: a k-d tree over the network nodes that mode can use.
const nodeIndexes = new Map<TravelMode, { index: SpatialIndex; nodes: Int32Array }>();

function nodeIndex(g: Graph, mode: TravelMode) {
  let entry = nodeIndexes.get(mode);
  if (!entry && spatialEngineReady()) {
    const ok = reachable(g, mode);
    const nodes: number[] = [];
    for (let n = 0; n < g.nodeCount; n++) if (ok[n]) nodes.push(n);
    const xy = new Float64Array(nodes.length * 2);
    nodes.forEach((n, i) => {
      const [x, y] = toXY({ lat: g.lat[n], lng: g.lng[n] });
      xy[2 * i] = x;
      xy[2 * i + 1] = y;
    });
    const index = SpatialIndex.fromXY(xy);
    if (index) nodeIndexes.set(mode, (entry = { index, nodes: Int32Array.from(nodes) }));
  }
  return entry;
}

/** The k nearest network nodes a mode can use, nearest first: the C++ k-d tree when it's loaded, else a scan. */
function nearestNodes(g: Graph, mode: TravelMode, p: LatLng, k: number): { node: number; meters: number }[] {
  const [px, py] = toXY(p);
  const entry = nodeIndex(g, mode);
  if (entry) {
    return entry.index.kNearestXY(px, py, k).map(({ id, dist2 }) => ({ node: entry.nodes[id], meters: Math.sqrt(dist2) }));
  }
  const ok = reachable(g, mode);
  const all: { node: number; meters: number }[] = [];
  for (let n = 0; n < g.nodeCount; n++) {
    if (!ok[n]) continue;
    const [x, y] = toXY({ lat: g.lat[n], lng: g.lng[n] });
    all.push({ node: n, meters: Math.hypot(x - px, y - py) });
  }
  return all.sort((a, b) => a.meters - b.meters).slice(0, k);
}

/** Closest network node a mode can use. */
function snap(g: Graph, mode: TravelMode, p: LatLng): number {
  return nearestNodes(g, mode, p, 1)[0]?.node ?? -1;
}

/** Unit vector (east, north) of a compass heading. */
const headingVector = (deg: number): [number, number] => [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)];

/**
 * Where a moving user's route may start, with the extra meters each costs for
 * being off their direction of travel (see TURN_PENALTY_M).
 */
function startCandidates(g: Graph, mode: TravelMode, p: LatLng, heading: number): { node: number; meters: number; extra: number }[] {
  const [hx, hy] = headingVector(heading);
  const [px, py] = toXY(p);
  const near = nearestNodes(g, mode, p, START_CANDIDATES);
  return near
    .filter((c, i) => i === 0 || c.meters <= START_RADIUS_M)
    .map(({ node, meters }) => {
      if (meters <= UNDERFOOT_M) return { node, meters, extra: 0 };
      const [x, y] = toXY({ lat: g.lat[node], lng: g.lng[node] });
      const cos = ((x - px) * hx + (y - py) * hy) / meters;
      return { node, meters, extra: (TURN_PENALTY_M * (1 - cos)) / 2 };
    });
}

/**
 * Extra meters for a route's first edge, from start node a to b: scaled by its
 * angle off the heading when a is underfoot (that edge is where the route
 * starts), else only if it doubles back on the heading (a U-turn at a node ahead).
 */
function firstEdgePenalty(g: Graph, a: number, b: number, heading: [number, number], underfoot: boolean): number {
  const [ax, ay] = toXY({ lat: g.lat[a], lng: g.lng[a] });
  const [bx, by] = toXY({ lat: g.lat[b], lng: g.lng[b] });
  const len = Math.hypot(bx - ax, by - ay);
  if (len < 1) return 0;
  const cos = ((bx - ax) * heading[0] + (by - ay) * heading[1]) / len;
  if (underfoot) return (TURN_PENALTY_M * (1 - cos)) / 2;
  return cos < Math.cos((UTURN_DEG * Math.PI) / 180) ? UTURN_PENALTY_M : 0;
}

/**
 * Shortest (by travel time) route between two points for a travel mode, using
 * A*. Pass the user's heading when rerouting while moving, so the route starts
 * in the direction they're already going: then the search starts from every
 * node near them at once (multi-source A*), each at the cost of walking to it
 * plus a penalty for being off their heading, and a first edge that doubles
 * back costs extra too.
 */
export function findRoute(from: LatLng, to: LatLng, mode: TravelMode, opts: { heading?: number } = {}): Route | null {
  const g = campusGraph();
  const profile = PROFILES[mode];
  const goal = snap(g, mode, to);
  if (goal < 0) return null;
  const connectorSpeed = PROFILES.walk.speed('footway');
  const starts =
    opts.heading === undefined
      ? [{ node: snap(g, mode, from), meters: 0, extra: 0 }]
      : startCandidates(g, mode, from, opts.heading);
  if (!starts.length || starts[0].node < 0) return null;
  const heading = opts.heading === undefined ? undefined : headingVector(opts.heading);
  const underfoot = new Set(starts.filter((c) => c.meters <= UNDERFOOT_M).map((c) => c.node));

  // Admissible heuristic: straight-line distance at the mode's top speed.
  let topSpeed = 0;
  for (const k of ['road', 'cycleway', 'footway', 'service'] as EdgeKind[]) topSpeed = Math.max(topSpeed, profile.speed(k) / Math.min(1, profile.penalty(k)));
  const goalPt = { lat: g.lat[goal], lng: g.lng[goal] };
  const h = (n: number) => haversineMeters({ lat: g.lat[n], lng: g.lng[n] }, goalPt) / topSpeed;

  const cost = new Float64Array(g.nodeCount).fill(Infinity);
  const prevAdj = new Int32Array(g.nodeCount).fill(-1); // adjacency slot used to reach each node
  const done = new Uint8Array(g.nodeCount);
  const open = new MinHeap();
  for (const c of starts) {
    // Seconds to walk to the node, counting the off-heading penalty.
    const c0 = (c.meters + c.extra) / connectorSpeed;
    if (c0 < cost[c.node]) {
      cost[c.node] = c0;
      open.push(c.node, c0 + h(c.node));
    }
  }

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
      let c = cost[n] + (g.edgeLength[e] / profile.speed(kind)) * profile.penalty(kind);
      // The route's first edge, out of the node it starts at.
      if (heading && prevAdj[n] < 0) c += firstEdgePenalty(g, n, t, heading, underfoot.has(n)) / connectorSpeed;
      if (c < cost[t]) {
        cost[t] = c;
        prevAdj[t] = k;
        open.push(t, c + h(t));
      }
    }
  }
  if (cost[goal] === Infinity) return null;

  // Walk back from the goal to recover the path.
  const edges: { edge: number; dir: number }[] = [];
  const nodePath = [goal];
  // Back to the start node the search came from (the one with no predecessor).
  for (let n = goal; prevAdj[n] >= 0; ) {
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
    seconds: seconds + profile.overheadMin * 60,
  };
}
