import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';

export type Category =
  | 'landmark'
  | 'academic'
  | 'dining'
  | 'library'
  | 'parking'
  | 'store'
  | 'recreation'
  | 'restroom'
  | 'printing';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type CampusLocation = {
  id: string;
  name: string;
  category: Category;
  subtitle: string;
  lat: number;
  lng: number;
  /** Major areas (the Quad, the Emporium, ...) get a map pin on every view. */
  major?: boolean;
  /** Which side of the pin a major area's label sits on (default top). */
  labelSide?: 'top' | 'bottom' | 'left' | 'right';
  /** For a restroom or printer: the id of the building it's in. */
  building?: string;
};

export const CATEGORY_META: Record<Category, { label: string; icon: IconName }> = {
  landmark: { label: 'Landmarks', icon: 'map-marker-star' },
  academic: { label: 'Academic', icon: 'school' },
  dining: { label: 'Dining', icon: 'silverware-fork-knife' },
  library: { label: 'Libraries', icon: 'book-open-variant' },
  parking: { label: 'Parking', icon: 'alpha-p-circle' },
  store: { label: 'Stores', icon: 'storefront' },
  recreation: { label: 'Recreation', icon: 'basketball' },
  restroom: { label: 'Bathrooms', icon: 'human-male-female' },
  printing: { label: 'Printing', icon: 'printer' },
};

/** The "See what's closest to you" tiles on the home page, in order. */
export const QUICK_CATEGORIES: Category[] = ['restroom', 'dining', 'printing', 'library', 'academic', 'parking'];

/**
 * Things inside buildings rather than places of their own. They're found by
 * "closest bathroom / printer" searches, but aren't pinned on the map or
 * listed as nearby places.
 */
export const AMENITY_CATEGORIES: Category[] = ['restroom', 'printing'];

export const URI_CENTER = { lat: 41.4865, lng: -71.5295 };

// Coordinates come from OpenStreetMap (© OpenStreetMap contributors, ODbL).
const BUILDINGS: CampusLocation[] = [
  // Landmarks / major areas
  { id: 'quad', name: 'The Quad', category: 'landmark', subtitle: 'Historic quadrangle', lat: 41.48635, lng: -71.52736, major: true },
  { id: 'memorial-union', name: 'Memorial Union', category: 'landmark', subtitle: 'Student center', lat: 41.48506, lng: -71.5299, major: true },
  // Not mapped in OpenStreetMap; placed at the Memorial Union until its exact spot is confirmed.
  { id: 'emporium', name: 'The Emporium', category: 'store', subtitle: 'Campus store · Memorial Union', lat: 41.48525, lng: -71.53012, major: true, labelSide: 'left' },
  { id: 'welcome-center', name: 'Robert J. Higgins Welcome Center', category: 'landmark', subtitle: 'Visitor center & tours', lat: 41.48369, lng: -71.52556, major: true },
  { id: 'ryan-center', name: 'Ryan Center', category: 'recreation', subtitle: 'Arena & events', lat: 41.48779, lng: -71.53572, major: true },
  { id: 'meade-stadium', name: 'Meade Stadium', category: 'recreation', subtitle: 'Football stadium', lat: 41.48813, lng: -71.5346, major: true },
  { id: 'rhody-statue', name: 'Rhody the Ram Statue', category: 'landmark', subtitle: 'Landmark', lat: 41.48392, lng: -71.52573 },
  { id: 'engineering-quad', name: 'Engineering Quadrangle', category: 'landmark', subtitle: 'Quad', lat: 41.48756, lng: -71.52628 },

  // Academic
  { id: 'green-hall', name: 'Green Hall', category: 'academic', subtitle: 'Administration', lat: 41.48473, lng: -71.52738 },
  { id: 'ballentine', name: 'Ballentine Hall', category: 'academic', subtitle: 'College of Business', lat: 41.48742, lng: -71.52779 },
  { id: 'chafee', name: 'Chafee Social Science Center', category: 'academic', subtitle: 'Social sciences', lat: 41.48924, lng: -71.52861 },
  { id: 'tyler', name: 'Tyler Hall', category: 'academic', subtitle: 'Computer Science & Statistics', lat: 41.48901, lng: -71.52691 },
  { id: 'fascitelli-eng', name: 'Fascitelli Center for Advanced Engineering', category: 'academic', subtitle: 'Engineering', lat: 41.48809, lng: -71.52631 },
  { id: 'cbls', name: 'Center for Biotechnology and Life Sciences', category: 'academic', subtitle: 'Life sciences', lat: 41.49005, lng: -71.52825 },
  { id: 'beaupre', name: 'Beaupre Center for Chemical and Forensic Sciences', category: 'academic', subtitle: 'Chemistry', lat: 41.48968, lng: -71.52957 },
  { id: 'avedisian', name: 'Avedisian Hall', category: 'academic', subtitle: 'College of Pharmacy', lat: 41.48929, lng: -71.52735 },
  { id: 'white-hall', name: 'White Hall', category: 'academic', subtitle: 'College of Nursing', lat: 41.48997, lng: -71.53054 },
  { id: 'fine-arts', name: 'Fine Arts Center', category: 'academic', subtitle: 'Art, music & theatre', lat: 41.48846, lng: -71.52364 },
  { id: 'washburn', name: 'Washburn Hall', category: 'academic', subtitle: 'Classrooms', lat: 41.48608, lng: -71.52625 },
  { id: 'lippitt', name: 'Lippitt Hall', category: 'academic', subtitle: 'Classrooms', lat: 41.48732, lng: -71.52722 },
  { id: 'quinn', name: 'Quinn Hall', category: 'academic', subtitle: 'Classrooms', lat: 41.48527, lng: -71.52851 },
  { id: 'edwards', name: 'Edwards Auditorium', category: 'academic', subtitle: 'Auditorium', lat: 41.48516, lng: -71.5263 },
  { id: 'carlotti', name: 'Carlotti Administration Building', category: 'academic', subtitle: 'Enrollment services', lat: 41.48609, lng: -71.52858 },
  { id: 'coastal-institute', name: 'Coastal Institute Kingston', category: 'academic', subtitle: 'Environmental sciences', lat: 41.48996, lng: -71.52653 },
  { id: 'swan-hall', name: 'Swan Hall', category: 'academic', subtitle: 'Humanities classrooms · 60 Upper College Rd', lat: 41.48457, lng: -71.5263 },
  { id: 'pastore-hall', name: 'Pastore Hall', category: 'academic', subtitle: 'Classrooms & labs · 51 Lower College Rd', lat: 41.48455, lng: -71.5284 },

  // Libraries
  { id: 'carothers', name: 'Robert L. Carothers Library', category: 'library', subtitle: 'Main library', lat: 41.48759, lng: -71.5288, major: true },
  { id: 'kingston-library', name: 'Kingston Free Library', category: 'library', subtitle: 'Public library', lat: 41.48065, lng: -71.52523 },

  // Dining
  { id: 'hope-commons', name: 'Hope Commons', category: 'dining', subtitle: 'Dining hall', lat: 41.48716, lng: -71.53108 },
  { id: 'mainfare', name: 'Mainfare Dining Hall', category: 'dining', subtitle: 'Dining hall', lat: 41.48725, lng: -71.53091 },
  { id: 'butterfield', name: 'Butterfield Dining Hall', category: 'dining', subtitle: 'Dining hall', lat: 41.48498, lng: -71.53157 },
  { id: 'rams-den', name: "Ram's Den", category: 'dining', subtitle: 'Café · Memorial Union', lat: 41.48545, lng: -71.5298 },
  { id: 'rhody-market', name: 'Rhody Market', category: 'dining', subtitle: 'Grab & go', lat: 41.48721, lng: -71.53135 },
  // In room 200 of the Memorial Union (URI Memorial Union, Good 5¢ Cigar).
  { id: '193-coffee', name: '193 Coffeehouse', category: 'dining', subtitle: 'Student-run café · Memorial Union', lat: 41.48512, lng: -71.52972 },
  { id: 'dunkin-union', name: "Dunkin' (Memorial Union)", category: 'dining', subtitle: 'Coffee', lat: 41.48551, lng: -71.52994 },
  { id: 'bru-ri', name: 'Bru RI Coffee Bar', category: 'dining', subtitle: 'Café · Kingston', lat: 41.48432, lng: -71.52353 },
  { id: 'kingston-pizza', name: 'Kingston Pizza', category: 'dining', subtitle: 'Restaurant · Kingston', lat: 41.48318, lng: -71.52383 },

  // Parking
  { id: 'ram-lot', name: 'Ram Lot', category: 'parking', subtitle: 'Parking', lat: 41.48863, lng: -71.53634 },
  { id: 'boss-lot', name: 'Boss Lot', category: 'parking', subtitle: 'Parking', lat: 41.48415, lng: -71.53678 },
  { id: 'plains-lot', name: 'Plains Road Lot', category: 'parking', subtitle: 'Commuter parking', lat: 41.49063, lng: -71.53883 },
  { id: 'flagg-lot', name: 'Flagg Road Lot', category: 'parking', subtitle: 'Parking', lat: 41.49195, lng: -71.53442 },
  { id: 'fine-arts-lot', name: 'Fine Arts Lot', category: 'parking', subtitle: 'Parking', lat: 41.48759, lng: -71.52231 },
  { id: 'briar-lane-lot', name: 'Briar Lane Lot', category: 'parking', subtitle: 'Parking', lat: 41.48392, lng: -71.52473 },

  // Stores
  { id: 'four-seasons', name: 'Four Seasons Mart', category: 'store', subtitle: 'Convenience store', lat: 41.48556, lng: -71.52489 },
  { id: 'kingston-mart', name: 'Kingston Mart', category: 'store', subtitle: 'Grocery', lat: 41.48494, lng: -71.52437 },
  { id: 'cvs', name: 'CVS Pharmacy', category: 'store', subtitle: 'Pharmacy', lat: 41.48539, lng: -71.52393 },
  { id: 'post-office', name: 'U.S. Post Office', category: 'store', subtitle: 'Kingston post office', lat: 41.48339, lng: -71.52511 },

  // Recreation
  { id: 'anna-fascitelli', name: 'Anna Fascitelli Fitness and Wellness Center', category: 'recreation', subtitle: 'Gym', lat: 41.48736, lng: -71.53239 },
  { id: 'keaney-gym', name: 'Keaney Gymnasium', category: 'recreation', subtitle: 'Athletics', lat: 41.48612, lng: -71.53605 },
  { id: 'mackal', name: 'Mackal Field House', category: 'recreation', subtitle: 'Indoor track', lat: 41.48518, lng: -71.53594 },
  { id: 'tootell', name: 'Tootell Aquatic Center', category: 'recreation', subtitle: 'Pool', lat: 41.48684, lng: -71.53593 },
  { id: 'boss-arena', name: 'Boss Ice Arena', category: 'recreation', subtitle: 'Ice rink', lat: 41.48388, lng: -71.53802 },
];

// Restrooms, from URI's list of gender-inclusive restrooms (as of 2021):
// building id -> where they are. Quinn and the Welcome Center are from an
// accessibility review (Critique Access). Every building also has standard
// restrooms; these are the ones a public source names.
export const RESTROOMS: Record<string, string> = {
  avedisian: '2nd floor (rooms 230B, 291), 3rd floor (387A)',
  beaupre: '1st floor (room 160)',
  butterfield: '1st floor, room 152 (turn right before you swipe in)',
  carlotti: 'Basement (room 07)',
  chafee: '1st floor (room 103)',
  edwards: '1st floor (rooms 105, 106)',
  'anna-fascitelli': 'Basement (room 06), 1st floor (rooms 106, 107)',
  'green-hall': '1st floor (124, 125), 2nd floor (214, 215), 3rd floor (308, 309)',
  'hope-commons': '1st floor (108), 2nd floor (217, 218, 223, 224)',
  'keaney-gym': '1st floor (room 113A)',
  'memorial-union': '3rd floor (room 321)',
  'pastore-hall': '1st floor (room 114A)',
  carothers: '1st floor (108, 109), 2nd floor (232, 233), 3rd floor (304, 305, 316, 317)',
  'white-hall': 'Basement (room 07), 1st floor (107B)',
};
const REVIEWED_RESTROOMS: Record<string, string> = {
  'welcome-center': 'Accessible restrooms',
  quinn: 'Accessible restrooms on the 1st floor',
};

// Printers for students, from URI ITS "Pay for Print", plus the print shop.
const PRINTERS: Record<string, string> = {
  carothers: 'Color printers: Learning Commons and 24-Hour Study Room, 2nd floor',
  'memorial-union': 'Printer in the 2nd-floor lounge; Campus Copy & Sign Shop on the 1st floor',
  avedisian: 'Printer in the 1st-floor lounge',
};

const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b]));

function inBuilding(category: Category, buildingId: string, subtitle: string): CampusLocation {
  const b = BUILDING_BY_ID[buildingId];
  const kind = category === 'restroom' ? 'Restrooms' : 'Printing';
  return { id: `${category}-${buildingId}`, name: `${kind} · ${b.name}`, category, subtitle, lat: b.lat, lng: b.lng, building: b.id };
}

/** Buildings and places: what the map pins and "nearby" lists show. */
export const PLACES = BUILDINGS;

/** Everything searchable, including restrooms and printers inside buildings. */
export const LOCATIONS: CampusLocation[] = [
  ...BUILDINGS,
  ...Object.entries(RESTROOMS).map(([id, where]) => inBuilding('restroom', id, `Gender-inclusive: ${where}`)),
  ...Object.entries(REVIEWED_RESTROOMS).map(([id, where]) => inBuilding('restroom', id, where)),
  ...Object.entries(PRINTERS).map(([id, where]) => inBuilding('printing', id, where)),
];

export const LOCATION_BY_ID: Record<string, CampusLocation> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, l]),
);
