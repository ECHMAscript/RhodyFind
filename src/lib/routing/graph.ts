import raw from '@/data/campusGraph.json';
import { haversineMeters } from '@/lib/geo';
import { CAR_CLOSURES } from './closures';

// Edge flags; must match scripts/build-campus-graph.mjs.
export const FOOT = 1;
export const BIKE = 2;
export const CAR = 4;
export const CAR_FORWARD_ONLY = 8;
export const CAR_BACKWARD_ONLY = 16;

export type EdgeKind =
  | 'road' | 'service' | 'parking' | 'footway' | 'sidewalk' | 'crossing'
  | 'path' | 'steps' | 'cycleway' | 'pedestrian' | 'track';

/**
 * Campus walkway/road network in adjacency-list (CSR) form:
 * the neighbors of node n are adjTarget[adjStart[n] .. adjStart[n + 1]).
 */
export type Graph = {
  nodeCount: number;
  lat: Float64Array;
  lng: Float64Array;
  edgeCount: number;
  edgeA: Int32Array;
  edgeB: Int32Array;
  edgeFlags: Uint8Array;
  edgeLength: Float64Array; // meters
  edgeName: string[];
  edgeKind: EdgeKind[];
  adjStart: Int32Array;
  adjTarget: Int32Array;
  adjEdge: Int32Array;
  /** +1 when the adjacency entry walks the edge from A to B, -1 for B to A. */
  adjDir: Int8Array;
};

function build(): Graph {
  const nodeCount = raw.nodes.length / 2;
  const lat = new Float64Array(nodeCount);
  const lng = new Float64Array(nodeCount);
  for (let i = 0; i < nodeCount; i++) {
    lat[i] = raw.nodes[2 * i] / 1e6;
    lng[i] = raw.nodes[2 * i + 1] / 1e6;
  }

  const edgeCount = raw.edges.length / 5;
  const edgeA = new Int32Array(edgeCount);
  const edgeB = new Int32Array(edgeCount);
  const edgeFlags = new Uint8Array(edgeCount);
  const edgeLength = new Float64Array(edgeCount);
  const edgeName: string[] = new Array(edgeCount);
  const edgeKind: EdgeKind[] = new Array(edgeCount);
  const degree = new Int32Array(nodeCount + 1);
  for (let e = 0; e < edgeCount; e++) {
    const a = raw.edges[5 * e];
    const b = raw.edges[5 * e + 1];
    edgeA[e] = a;
    edgeB[e] = b;
    edgeFlags[e] = raw.edges[5 * e + 2];
    edgeName[e] = raw.names[raw.edges[5 * e + 3]];
    edgeKind[e] = raw.kinds[raw.edges[5 * e + 4]] as EdgeKind;
    edgeLength[e] = haversineMeters({ lat: lat[a], lng: lng[a] }, { lat: lat[b], lng: lng[b] });
    degree[a]++;
    degree[b]++;
  }
  closeToCars(edgeA, edgeB, edgeFlags);

  // Prefix sums turn degrees into each node's start offset.
  const adjStart = new Int32Array(nodeCount + 1);
  for (let n = 0; n < nodeCount; n++) adjStart[n + 1] = adjStart[n] + degree[n];
  const fill = adjStart.slice(0, nodeCount);
  const adjTarget = new Int32Array(2 * edgeCount);
  const adjEdge = new Int32Array(2 * edgeCount);
  const adjDir = new Int8Array(2 * edgeCount);
  for (let e = 0; e < edgeCount; e++) {
    const a = edgeA[e];
    const b = edgeB[e];
    let s = fill[a]++;
    adjTarget[s] = b; adjEdge[s] = e; adjDir[s] = 1;
    s = fill[b]++;
    adjTarget[s] = a; adjEdge[s] = e; adjDir[s] = -1;
  }

  return { nodeCount, lat, lng, edgeCount, edgeA, edgeB, edgeFlags, edgeLength, edgeName, edgeKind, adjStart, adjTarget, adjEdge, adjDir };
}

const NO_CAR = ~(CAR | CAR_FORWARD_ONLY | CAR_BACKWARD_ONLY) & 0xff;

/** Applies CAR_CLOSURES: roads that can't really be driven through stay open on foot and by bike. */
function closeToCars(edgeA: Int32Array, edgeB: Int32Array, edgeFlags: Uint8Array) {
  const key = (n: number) => `${raw.nodes[2 * n]},${raw.nodes[2 * n + 1]}`;
  const closed = new Set<string>();
  for (const c of CAR_CLOSURES) {
    for (let i = 0; i + 1 < c.points.length; i++) {
      const p = c.points[i].join(',');
      const q = c.points[i + 1].join(',');
      closed.add(`${p}|${q}`);
      closed.add(`${q}|${p}`);
    }
  }
  for (let e = 0; e < edgeA.length; e++) {
    if (closed.has(`${key(edgeA[e])}|${key(edgeB[e])}`)) edgeFlags[e] &= NO_CAR;
  }
}

let cached: Graph | undefined;

/** The campus graph, built on first use (~5,500 nodes). */
export function campusGraph(): Graph {
  return (cached ??= build());
}
