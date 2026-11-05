#!/usr/bin/env node
// Builds src/data/campusGraph.json — the walkway/road network the app routes on —
// from OpenStreetMap data for the URI Kingston campus.
//
//   node scripts/build-campus-graph.mjs              # download from the OSM API
//   node scripts/build-campus-graph.mjs map.json     # use a saved OSM JSON export
//
// Map data © OpenStreetMap contributors, available under the ODbL.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BBOX = [-71.545, 41.477, -71.517, 41.495]; // west, south, east, north
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data/campusGraph.json');

// Must match src/lib/routing/graph.ts.
const FOOT = 1, BIKE = 2, CAR = 4, CAR_FORWARD_ONLY = 8, CAR_BACKWARD_ONLY = 16;
const KINDS = ['road', 'service', 'parking', 'footway', 'sidewalk', 'crossing', 'path', 'steps', 'cycleway', 'pedestrian', 'track'];

const ROADS = new Set(['primary', 'primary_link', 'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'unclassified', 'residential', 'living_street', 'service']);
const FOOT_ONLY = new Set(['footway', 'path', 'pedestrian', 'steps', 'track', 'cycleway', 'corridor']);

const yes = (v) => v === 'yes' || v === 'designated' || v === 'permissive';
const no = (v) => v === 'no' || v === 'private';

function kindOf(t) {
  const hw = t.highway;
  if (hw === 'service') return t.service === 'parking_aisle' || t.service === 'parking' ? 'parking' : 'service';
  if (ROADS.has(hw)) return 'road';
  if (hw === 'footway') return t.footway === 'sidewalk' ? 'sidewalk' : t.footway === 'crossing' ? 'crossing' : 'footway';
  if (hw === 'corridor') return 'footway';
  return KINDS.includes(hw) ? hw : null;
}

function flagsOf(t) {
  const hw = t.highway;
  if (!ROADS.has(hw) && !FOOT_ONLY.has(hw)) return 0;
  if (t.area === 'yes' && hw !== 'pedestrian') return 0;
  const blocked = no(t.access);
  let f = 0;
  if (no(t.foot) ? false : yes(t.foot) || !blocked) f |= FOOT;
  if (hw !== 'steps' && (yes(t.bicycle) || (!blocked && !no(t.bicycle)))) f |= BIKE;
  if (ROADS.has(hw) && !blocked && t.motor_vehicle !== 'no' && t.access !== 'permit') f |= CAR;
  if (f & CAR) {
    if (t.oneway === 'yes' || t.oneway === '1' || t.junction === 'roundabout') f |= CAR_FORWARD_ONLY;
    else if (t.oneway === '-1') f |= CAR_BACKWARD_ONLY;
  }
  return f;
}

async function load() {
  const file = process.argv[2];
  if (file) return JSON.parse(fs.readFileSync(file, 'utf8'));
  const url = `https://api.openstreetmap.org/api/0.6/map.json?bbox=${BBOX.join(',')}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'RhodyFind campus graph builder' } });
  if (!res.ok) throw new Error(`OSM API ${res.status}: ${await res.text()}`);
  return res.json();
}

const data = await load();
const osmNodes = new Map(data.elements.filter((e) => e.type === 'node').map((n) => [n.id, n]));

const nodeIndex = new Map(); // OSM id -> graph index
const nodes = []; // flat [lat*1e6, lng*1e6, ...]
const edges = []; // flat [a, b, flags, nameIndex, kindIndex, ...]
const names = [''];
const nameIndex = new Map([['', 0]]);

const idx = (id) => {
  let i = nodeIndex.get(id);
  if (i === undefined) {
    const n = osmNodes.get(id);
    if (!n) return -1;
    i = nodes.length / 2;
    nodeIndex.set(id, i);
    nodes.push(Math.round(n.lat * 1e6), Math.round(n.lon * 1e6));
  }
  return i;
};

for (const w of data.elements) {
  if (w.type !== 'way' || !w.tags?.highway) continue;
  const flags = flagsOf(w.tags);
  const kind = kindOf(w.tags);
  if (!flags || !kind) continue;
  const name = w.tags.name ?? '';
  if (!nameIndex.has(name)) nameIndex.set(name, names.push(name) - 1);
  for (let k = 1; k < w.nodes.length; k++) {
    const a = idx(w.nodes[k - 1]);
    const b = idx(w.nodes[k]);
    if (a < 0 || b < 0 || a === b) continue;
    edges.push(a, b, flags, nameIndex.get(name), KINDS.indexOf(kind));
  }
}

const graph = {
  attribution: '© OpenStreetMap contributors, ODbL',
  bbox: BBOX,
  kinds: KINDS,
  names,
  nodes,
  edges,
};
fs.writeFileSync(OUT, JSON.stringify(graph));
console.log(`${nodes.length / 2} nodes, ${edges.length / 5} edges, ${names.length - 1} street names -> ${path.relative(process.cwd(), OUT)} (${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
