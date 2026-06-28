/**
 * 1💗1 brand tokens — pulled from the live site (tailwind.config.cjs + app.postcss)
 * so the promo video matches the real product.
 */
export const theme = {
  colors: {
    // Backgrounds
    navy: '#1e2145', // --secondary on the convention/consent pages
    navyDeep: '#14162e',
    bluesun: '#2c384a',

    // Greens (primary brand accent)
    green: '#5be2a9', // --primary
    greenBright: '#2effa8', // greeni

    // Gold gradient (gra / grb / grc)
    goldA: '#bf953f',
    goldB: '#fcf6ba',
    goldC: '#b38728',

    // Pink (heart / concierge accent)
    pink: '#ff4d9e',

    blu: '#04619f',
    white: '#ffffff',
    muted: 'rgba(255,255,255,0.7)',
  },

  gradients: {
    gold: 'linear-gradient(110deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c, #fbf5b7, #b38728, #fcf6ba, #bf953f)',
    green: 'linear-gradient(120deg, #2effa8, #5be2a9)',
    bg: 'radial-gradient(circle at 50% 20%, #2c384a 0%, #1e2145 55%, #14162e 100%)',
  },

  // Rubik is the site's display font and supports Hebrew.
  font: 'Rubik, system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;
