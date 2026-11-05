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
  /** The user's direction of travel in degrees (0 = north), drawn as an arrow. */
  heading?: number;
  /**
   * When set, the camera stays centered on this point (live navigation) and
   * fitTo is ignored.
   */
  followUser?: LatLng;
  /** Called when the user drags the map, so the screen can pause following. */
  onUserPan?: () => void;
  /** Points the map should frame; defaults to from/to. Pass a memoized array. */
  fitTo?: LatLng[];
};
