import type { CampusLocation } from '@/data/locations';
import type { Endpoint } from '@/lib/endpoints';

export type CampusMapProps = {
  places: CampusLocation[];
  from?: Endpoint;
  to?: Endpoint;
  onPlacePress?: (place: CampusLocation) => void;
};
