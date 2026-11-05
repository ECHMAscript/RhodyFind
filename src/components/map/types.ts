import type { CampusLocation } from '@/data/locations';
import type { Endpoint } from '@/lib/endpoints';
import type { LatLng } from '@/lib/geo';

export type CampusMapProps = {
  places: CampusLocation[];
  from?: Endpoint;
  to?: Endpoint;
  onPlacePress?: (place: CampusLocation) => void;
  /** Path to draw between from and to; a straight line is drawn when absent. */
  route?: LatLng[];
  /** Part of the route to emphasize (the current navigation step). */
  highlight?: LatLng[];
  /** The user's live position. */
  user?: LatLng;
  /** Points the map should frame; defaults to from/to. Pass a memoized array. */
  fitTo?: LatLng[];
};
