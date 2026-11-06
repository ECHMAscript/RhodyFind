# RhodyFind

Campus location finder for the University of Rhode Island. Pick where you are (or use your
device's location) and RhodyFind shows the closest buildings, dining, libraries, parking and
more — with a map view and estimated walk / bike / skate / shuttle / drive times.

CSC 212 project. Nearest-neighbor search will use a **k-d tree written in C++ and compiled to
WebAssembly**, benchmarked against a brute-force baseline.

## Stack

- **React Native + Expo** (Expo Router) — one codebase for the website and the iOS/Android app
- **Maps** — Leaflet + OpenStreetMap on web, `react-native-maps` on iOS/Android
- **Search** — `src/lib/search.ts` (`findNearest`). Currently a brute-force JS scan; this is the
  function the C++/WebAssembly k-d tree will replace.
- **Routing** — fully in-app: A* over a campus walkway/road graph built from OpenStreetMap
  (`src/lib/routing/`), with turn-by-turn directions and live location following.

## Run it

```bash
npm install
npx expo start --web     # website at http://localhost:8081 (dev mode, live reload)
npm run preview:web      # optimized build at http://localhost:8082 (how the real site feels)
npx expo start           # then scan the QR code with Expo Go for the phone app
npm run build:graph      # re-download campus paths from OpenStreetMap
```

## C++ k-d tree

Nearest-place search and route snapping use a 2-D k-d tree written in C++
(`cpp/kdtree.hpp`), compiled to WebAssembly for the web app. Brute force is the
baseline it is measured against; the app falls back to it where WebAssembly
isn't available.

```bash
npm run test:cpp     # k-d tree vs brute force: results must be identical
npm run bench:cpp    # 100 / 1k / 10k / 100k points -> benchmarks/results.csv
npm run build:wasm   # needs Emscripten (emcc) -> src/wasm/kdtree.js
```

The **Performance** tab charts the recorded native results and can run the same
benchmark live in the browser.

## Layout

```
src/app/            screens (index = home, map = route view)
src/components/     Header, LocationField (autocomplete), TravelModes, map/CampusMap
src/data/           campus locations and the routing graph (both from OpenStreetMap)
src/lib/            distance + travel-time math, search, location hooks
src/lib/routing/    graph, MinHeap, A* router, turn-by-turn directions
scripts/            build-campus-graph.mjs (OSM -> src/data/campusGraph.json)
```

Map data © OpenStreetMap contributors (ODbL).
