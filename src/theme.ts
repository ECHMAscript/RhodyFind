// URI / Rhody color palette and shared design tokens.
export const colors = {
  navy: '#041E42',
  keaney: '#68ABE8',
  white: '#FFFFFF',
  gold: '#C69214',
  gray: '#9A9B9D',

  navySoft: '#0B2D5C',
  keaneyTint: '#EAF3FC',
  text: '#0E1A2B',
  textMuted: '#5B6573',
  border: '#E3E8EF',
  surface: '#FFFFFF',
  background: '#F5F8FC',
  danger: '#E5484D',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#041E42',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
};

// Layout breakpoints that match the design mocks (mobile 390, laptop 1024, desktop 1440).
export const breakpoints = { tablet: 768, laptop: 1024 };
