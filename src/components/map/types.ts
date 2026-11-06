import type { CampusLocation } from '@/data/locations';
import type { Endpoint } from '@/lib/endpoints';
import type { LatLng } from '@/lib/geo';
import type { LiveFix } from '@/lib/useWatchPosition';

export type CampusMapProps = {
  places: CampusLocation[];
  from?: Endpoint;
  to?: Endpoint;
  onPlacePress?: (place: CampusLocation) => void;
  /** Path to draw between from and to; a straight line is drawn when absent. */
  route?: LatLng[];
  /** Part of the route to emphasize (the current navigation step). */
  highlight?: LatLng[];
  /** The user's live GPS fix. The map glides the dot between fixes and shows heading. */
  userFix?: LiveFix;
  /** Keep the camera on the user (live navigation); fitTo is ignored while true. */
  follow?: boolean;
  /** Called when the user drags the map, so the screen can pause following. */
  onUserPan?: () => void;
  /** Points the map should frame; defaults to from/to. Pass a memoized array. */
  fitTo?: LatLng[];
};
