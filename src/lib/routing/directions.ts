import type { IconName } from '@/data/locations';
import { haversineMeters, type LatLng } from '@/lib/geo';
import { campusGraph, type EdgeKind } from './graph';
import type { Route } from './router';

export type Maneuver =
  | 'depart' | 'straight' | 'slight-left' | 'slight-right' | 'left' | 'right'
  | 'sharp-left' | 'sharp-right' | 'u-turn' | 'cross' | 'stairs' | 'arrive';

export type Step = {
  maneuver: Maneuver;
  instruction: string;
  meters: number;
  /** Route.coords index range this step covers. */
  startIndex: number;
  endIndex: number;
};

export const MANEUVER_ICON: Record<Maneuver, IconName> = {
  depart: 'map-marker-outline',
  straight: 'arrow-up',
  'slight-left': 'arrow-top-left',
  'slight-right': 'arrow-top-right',
  left: 'arrow-left-top',
  right: 'arrow-right-top',
  'sharp-left': 'arrow-left-bottom',
  'sharp-right': 'arrow-right-bottom',
  'u-turn': 'arrow-u-down-left',
  cross: 'walk',
  stairs: 'stairs',
  arrive: 'flag-checkered',
};

const KIND_LABEL: Record<EdgeKind, string> = {
  road: 'the road',
  service: 'the service road',
  parking: 'the parking lot',
  footway: 'the footpath',
  sidewalk: 'the sidewalk',
  crossing: 'the crosswalk',
  path: 'the path',
  steps: 'the stairs',
  cycleway: 'the bike path',
  pedestrian: 'the walkway',
  track: 'the trail',
};

/** Compass bearing from a to b in degrees, 0 = north. */
function bearing(a: LatLng, b: LatLng) {
  const toRad = Math.PI / 180;
  const y = Math.sin((b.lng - a.lng) * toRad) * Math.cos(b.lat * toRad);
  const x =
    Math.cos(a.lat * toRad) * Math.sin(b.lat * toRad) -
    Math.sin(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.cos((b.lng - a.lng) * toRad);
  return (Math.atan2(y, x) / toRad + 360) % 360;
}

const COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];

/** Point about `meters` along the path from index i (forward with dir 1, backward with -1). */
function pointAlong(coords: LatLng[], i: number, dir: 1 | -1, meters: number): LatLng {
  let left = meters;
  let j = i;
  while (j + dir >= 0 && j + dir < coords.length) {
    const d = haversineMeters(coords[j], coords[j + dir]);
    if (d >= left) return coords[j + dir];
    left -= d;
    j += dir;
  }
  return coords[j];
}

function turnAt(coords: LatLng[], i: number): { maneuver: Maneuver; angle: number } {
  const before = bearing(pointAlong(coords, i, -1, 20), coords[i]);
  const after = bearing(coords[i], pointAlong(coords, i, 1, 20));
  const angle = ((after - before + 540) % 360) - 180; // -180..180, negative = left
  const a = Math.abs(angle);
  const side = angle < 0 ? 'left' : 'right';
  const maneuver: Maneuver =
    a < 30 ? 'straight' : a < 60 ? (`slight-${side}` as Maneuver) : a < 135 ? side : a < 170 ? (`sharp-${side}` as Maneuver) : 'u-turn';
  return { maneuver, angle };
}

const TURN_TEXT: Partial<Record<Maneuver, string>> = {
  straight: 'Continue',
  'slight-left': 'Bear left',
  'slight-right': 'Bear right',
  left: 'Turn left',
  right: 'Turn right',
  'sharp-left': 'Turn sharp left',
  'sharp-right': 'Turn sharp right',
  'u-turn': 'Turn around',
};

type Segment = { label: string; kind: EdgeKind; named: boolean; start: number; end: number; meters: number };

/** Turn-by-turn steps for a route. */
export function buildSteps(route: Route, fromName: string, toName: string): Step[] {
  const g = campusGraph();
  const { coords } = route;

  // 1. One segment per stretch of the same street or path type. Unnamed paths are
  //    also split at real turns, so a winding run of footpaths still gets
  //    "turn left" steps; named streets just follow their curves.
  const segs: Segment[] = [];
  route.edges.forEach(({ edge }, k) => {
    const i = route.networkStart + k; // edge k runs coords[i] -> coords[i + 1]
    const kind = g.edgeKind[edge];
    // Stairs and crosswalks often carry the street's name in OSM; they still
    // need their own step.
    const name = kind === 'steps' || kind === 'crossing' ? '' : g.edgeName[edge];
    const label = name || KIND_LABEL[kind];
    const meters = g.edgeLength[edge];
    const last = segs[segs.length - 1];
    const sameWay = last && last.label === label;
    const turned = sameWay && !name && Math.abs(turnAt(coords, i).angle) >= 60;
    if (sameWay && !turned) {
      last.end = i + 1;
      last.meters += meters;
    } else {
      segs.push({ label, kind, named: !!name, start: i, end: i + 1, meters });
    }
  });

  // 2. Fold tiny pieces (intersection stubs, short links) into the previous
  //    segment, keep back-to-back crosswalks as one, then rejoin neighbors that
  //    ended up with the same label. Stairs always get their own step.
  const merged: Segment[] = [];
  for (const s of segs) {
    const prev = merged[merged.length - 1];
    const tiny = s.meters < 15 && s.kind !== 'crossing' && s.kind !== 'steps';
    const bothCrossings = prev?.kind === 'crossing' && s.kind === 'crossing';
    const sameLabel = prev?.label === s.label && (s.named || Math.abs(turnAt(coords, s.start).angle) < 60);
    if (prev && (tiny || bothCrossings || sameLabel)) {
      prev.end = s.end;
      prev.meters += s.meters;
    } else {
      merged.push({ ...s });
    }
  }

  const steps: Step[] = [];
  const startConnector = haversineMeters(coords[0], coords[route.networkStart]);
  merged.forEach((s, idx) => {
    if (idx === 0) {
      const dir = COMPASS[Math.round(bearing(coords[s.start], pointAlong(coords, s.start, 1, 25)) / 45) % 8];
      steps.push({
        maneuver: 'depart',
        instruction: `From ${fromName}, head ${dir} on ${s.label}`,
        meters: s.meters + startConnector,
        startIndex: 0,
        endIndex: s.end,
      });
      return;
    }
    let maneuver: Maneuver;
    let instruction: string;
    if (s.kind === 'crossing') {
      maneuver = 'cross';
      instruction = 'Cross the street at the crosswalk';
    } else if (s.kind === 'steps') {
      maneuver = 'stairs';
      instruction = 'Take the stairs';
    } else {
      maneuver = turnAt(coords, s.start).maneuver;
      const verb = TURN_TEXT[maneuver]!;
      instruction = `${verb} ${s.kind === 'parking' ? 'into' : 'onto'} ${s.label}`;
    }
    steps.push({ maneuver, instruction, meters: s.meters, startIndex: s.start, endIndex: s.end });
  });

  // Start and destination snapped to the same spot on the network: it's a
  // short walk with no turns.
  if (!merged.length) {
    const dir = COMPASS[Math.round(bearing(coords[0], coords[coords.length - 1]) / 45) % 8];
    steps.push({
      maneuver: 'depart',
      instruction: `Head ${dir} to ${toName}`,
      meters: route.meters,
      startIndex: 0,
      endIndex: coords.length - 1,
    });
  }

  const endConnector = haversineMeters(coords[route.networkEnd], coords[coords.length - 1]);
  if (merged.length) {
    // The last step also covers the short walk from the network to the door.
    steps[steps.length - 1].endIndex = coords.length - 1;
    steps[steps.length - 1].meters += endConnector;
  }
  steps.push({
    maneuver: 'arrive',
    instruction: `Arrive at ${toName}`,
    meters: 0,
    startIndex: coords.length - 1,
    endIndex: coords.length - 1,
  });
  return steps;
}
