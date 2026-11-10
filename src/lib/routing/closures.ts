/**
 * Corrections to OpenStreetMap from people who've been there: roads that
 * OSM lists as open to cars but that can't really be driven through.
 *
 * Each closure is a chain of points along the road, in OSM's coordinates
 * (degrees x 1,000,000, exactly as stored in data/campusGraph.json). Every
 * road edge between two consecutive points is closed to cars; walking and
 * biking stay open. Matching by coordinates, not edge numbers, keeps a
 * closure in place if the graph is rebuilt from newer map data.
 */
export type RoadClosure = {
  name: string;
  why: string;
  /** [lat, lng] in microdegrees, in order along the road. */
  points: [number, number][];
};

export const CAR_CLOSURES: RoadClosure[] = [
  {
    name: 'East Alumni Avenue, Tyler Road to Upper College Road',
    why: 'A dead end for cars (checked in person, Nov 2026): drivers sent this way between Upper College Road and the engineering buildings get stuck with no way through.',
    points: [
      [41488486, -71526739], // Tyler Road corner, by Avedisian Hall
      [41488478, -71526202],
      [41488460, -71525759],
      [41488444, -71525625],
      [41488379, -71525077],
      [41488358, -71524979], // Upper College Road
    ],
  },
];
