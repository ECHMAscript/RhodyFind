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

## Run it

```bash
npm install
npx expo start --web     # website at http://localhost:8081
npx expo start           # then scan the QR code with Expo Go for the phone app
```

## Layout

```
src/app/            screens (index = home, map = route view)
src/components/     Header, LocationField (autocomplete), TravelModes, map/CampusMap
src/data/           campus locations (coordinates from OpenStreetMap)
src/lib/            distance + travel-time math, search, current-location hook
```

Map data © OpenStreetMap contributors (ODbL).
