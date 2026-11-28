import type { CampusLocation } from '@/data/locations';
import type { Endpoint } from '@/lib/endpoints';
import type { LatLng, TravelMode } from '@/lib/geo';
import type { Compass } from '@/lib/useCompass';
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
  /**
   * The phone's compass. While walking (or standing), the arrow points where
   * the phone points, turning the instant it turns; faster than that it
   * follows the GPS direction of travel.
   */
  compass?: Compass;
  /** Keep the camera on the user (live navigation); fitTo is ignored while true. */
  follow?: boolean;
  /** Called when the user drags the map, so the screen can pause following. */
  onUserPan?: () => void;
  /** Points the map should frame; defaults to from/to. Pass a memoized array. */
  fitTo?: LatLng[];
  /**
   * Pixels at the bottom of the map covered by other UI (the directions sheet
   * on phones). The camera keeps the user and fitted routes above it.
   */
  bottomInset?: number;
  /**
   * Planning (not navigating): a new route draws itself in and a traveler for
   * this mode races along it (web).
   */
  revealMode?: TravelMode;
  /** Outline and color every parking lot around campus, with the listed lots' names shown. */
  showParking?: boolean;
  /** Navigating on the route: cut the drawn route at the moving dot, every frame (web). */
  trimRouteToUser?: boolean;
};
