/** One way to order an item, e.g. { label: 'Platter', price: 13.49 }. */
export type MenuOption = { label: string; price: number };

export type MenuItem = {
  name: string;
  /** What's in it, as the menu board describes it. */
  desc?: string;
  /** Its own price(s). Without one, it uses its section's options. */
  options?: MenuOption[];
  /** A starred favorite on the board. */
  star?: boolean;
  /** Marked "NEW!" on the board. */
  isNew?: boolean;
};

/**
 * What a section is for, used for the average prices: breakfast and mains
 * count as meals; sides, add-ons and desserts don't; drinks are averaged apart.
 */
export type MenuKind = 'breakfast' | 'main' | 'side' | 'addon' | 'dessert' | 'drink';

export type MenuSection = {
  id: string;
  title: string;
  kind: MenuKind;
  /** Prices that apply to every item in the section (Sub / Platter / Combo...). */
  options?: MenuOption[];
  /** Short lines under the title (e.g. "Served all day"). */
  notes?: string[];
  items: MenuItem[];
  /** Small print at the bottom of the section. */
  footnotes?: string[];
};

export type Menu = {
  /** The place id in data/locations.ts. */
  placeId: string;
  name: string;
  phone?: string;
  website?: string;
  /** Where the menu came from, e.g. "Menu board photographed Nov 2026". */
  source: string;
  sections: MenuSection[];
  footnote?: string;
};
