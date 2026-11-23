import { ALBIES_MENU } from './albies';
import type { Menu, MenuItem, MenuKind, MenuOption, MenuSection } from './types';

export type { Menu, MenuItem, MenuKind, MenuOption, MenuSection } from './types';

/** Restaurants with a menu we've transcribed, by place id. */
export const MENUS: Record<string, Menu> = {
  [ALBIES_MENU.placeId]: ALBIES_MENU,
};

export const menuFor = (placeId: string): Menu | undefined => MENUS[placeId];

/** The prices an item can be ordered at: its own, or its section's. */
export const itemOptions = (item: MenuItem, section: MenuSection): MenuOption[] =>
  item.options ?? section.options ?? [];

export type PriceAverage = {
  /** e.g. "Breakfast", "Lunch & dinner", "Drinks". */
  label: string;
  /** Mean of each item's base price, in dollars. */
  average: number;
  /** How many items went into it. */
  count: number;
  low: number;
  high: number;
  /** e.g. "Served all day". */
  note?: string;
};

/**
 * Average prices from a menu. Each item counts once, at its base (first)
 * price: the plain sub, not the combo; the small fries, not the large. Sides,
 * add-ons and desserts are left out of the meal averages.
 *
 * When breakfast and lunch/dinner come off one all-day menu (as at Albie's),
 * lunch and dinner are the same number, so they're shown together.
 */
export function menuAverages(menu: Menu): PriceAverage[] {
  const groups: { label: string; kinds: MenuKind[]; note?: string }[] = [
    { label: 'Breakfast', kinds: ['breakfast'], note: menu.sections.find((s) => s.kind === 'breakfast')?.notes?.[0] },
    { label: 'Lunch & dinner', kinds: ['main'], note: 'Same menu all day' },
    { label: 'Drinks', kinds: ['drink'] },
    { label: 'Desserts', kinds: ['dessert'] },
  ];
  const out: PriceAverage[] = [];
  for (const g of groups) {
    const prices: number[] = [];
    for (const section of menu.sections) {
      if (!g.kinds.includes(section.kind)) continue;
      for (const item of section.items) {
        const base = itemOptions(item, section)[0];
        if (base) prices.push(base.price);
      }
    }
    if (!prices.length) continue;
    out.push({
      label: g.label,
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
      count: prices.length,
      low: Math.min(...prices),
      high: Math.max(...prices),
      note: g.note,
    });
  }
  return out;
}

export const money = (n: number) => `$${n.toFixed(2)}`;
