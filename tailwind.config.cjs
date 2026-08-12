//const colors = require('tailwindcss/colors');
//  mode: 'jit',
/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');
const plugin = require('tailwindcss/plugin');

const config = {
  content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/@avitest/gridcraft/dist/themes/**/*.svelte'],
  // `dark:` used to fall back to Tailwind's default `media` strategy, so the
  // ~1.5k dark utilities followed the OS alone and the `.dark` token block in
  // app.postcss never activated (nothing ever added the class). Switching to
  // `selector` puts day/night under the appearance control; the inline script
  // in app.html still seeds the class from `prefers-color-scheme` when the
  // visitor has not chosen, so OS-following behaviour is preserved.
  darkMode: 'selector',
  theme: {
    screens: {
      xs: '475px',
      ...defaultTheme.screens
    },
    scale: {
      0: '0',
      25: '.25',
      50: '.5',
      75: '.75',
      90: '.9',
      95: '.95',
      100: '1',
      105: '1.05',
      110: '1.1',
      125: '1.25',
      150: '1.5',
      200: '2',
      290: '2.9'
    },
    extend: {
      fontFamily: {
        'rubik': ['Rubik', 'sans-serif'],
        'litt': ['Bellefair', 'Gan']
      },
      backgroundImage: {
        goldGrad:
          'linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771c, #FBF5B7, #B38728, #FCF6BA, #BF953F)',
        goldTobr:
          'linear-gradient(to bottom right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771c, #FBF5B7, #B38728, #FCF6BA, #BF953F)',
        liteGoldTobr:
          'linear-gradient(to bottom right, #BF953F, #EEE8AA, #B38728)',
        goldShain:
          'linear-gradient(110deg, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771c, #FBF5B7, #B38728, #FCF6BA, #BF953F)',
        customGradient:
          'linear-gradient(to right, #ff7e5f, #feb47b, #86e3ce, #d4a5a5, #ffdfd3, #d4a5a5, #86e3ce, #feb47b, #ff7e5f)',
        colorfulGrad:
          'linear-gradient(to left, var(--grb), var(--gra), var(--grc))'
      },
      animation: {
        shine: "shine 2s linear infinite",
        gradientx: 'gradientx 25s linear infinite',
        gradientxslow: 'gradientx 16s linear infinite',
        gradienty: 'gradienty 8s linear infinite'
      },
      keyframes: {
        gradientx: {
          to: { 'background-position': '200% center' }
        },
        gradienty: {
          to: { 'background-position': 'center 200%' }
        },
        shine: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" },
        },

      },
      colors: {
        ...defaultTheme.colors,
        accentForeground: 'var(--accent-foreground)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        greeni: '#2effa8',
        bluesun: '#2c384a',
        accent: '#B38728',
        blu: 'var(--blu)',
        silver: 'var(--silver)',
        stgold: 'var(--stgold)',
        gra: 'var(--gra)',
        grb: 'var(--grb)',
        grc: 'var(--grc)',
        grd: 'var(--grd)',
        gre: 'var(--gre)',
        graa: 'var(--graa)',
        grbb: 'var(--grbb)',
        barbi: 'var(--barbi-pink)',
        gold: 'var(--gold)',
        // `gold` is the *light* side of the gold/barbi pair — it is the page
        // wash and the text laid on top of `bg-barbi`. Using it as ink on a
        // white surface (the `bg-white border-gold text-gold` outline button)
        // renders at ~1.2:1 and is effectively invisible. `goldink` is the
        // readable counterpart for exactly that role.
        goldink: 'var(--goldink)',
        neww: 'var(--neww)',
        lturk: 'var(--lturk)',
        mturk: 'var(--mturk)',
        sturk: 'var(--sturk)',
        lpink: 'var(--lpink)',
        mpink: 'var(--mpink)',
        pinki: 'var(--pinki)',
        wow: 'var(--wow)',
        wow2: 'var(--wow2)',
        blueg: 'var(--blueg)',
        oranges: 'var(--oranges)',
        wowt: 'var(--wowt)'
      },
      borderRadius: {
        theme: 'var(--radius-theme)'
      },
      boxShadow: {
        theme: 'var(--shadow-theme)'
      }
    }
  },
  // Was `Plugins:` (capital P). Tailwind only reads `plugins`, so this whole
  // block was silently ignored and the `personal:` / `business:` variants were
  // never generated — every `business:bg-…` class in the tree was dead text.
  plugins: [
    plugin(function ({ addVariant }) {
      // הוספת variants עבור personal ו-business
      addVariant('personal', '.personal &');
      addVariant('business', '.business &');

      // variants עם מצבים נוספים
      addVariant('personal-hover', '.personal &:hover');
      addVariant('business-hover', '.business &:hover');
      addVariant('personal-focus', '.personal &:focus');
      addVariant('business-focus', '.business &:focus');

      // variants עם responsive
      addVariant('personal-sm', '@media (min-width: 640px) { .personal & }');
      addVariant('personal-md', '@media (min-width: 768px) { .personal & }');
      addVariant('personal-lg', '@media (min-width: 1024px) { .personal & }');
      addVariant('business-sm', '@media (min-width: 640px) { .business & }');
      addVariant('business-md', '@media (min-width: 768px) { .business & }');
      addVariant('business-lg', '@media (min-width: 1024px) { .business & }');
    }),
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.animate-fade-in-up': {
          'animation': 'fadeInUp 0.6s ease-out',
        },
        '.animate-slide-in-right': {
          'animation': 'slideInRight 0.5s ease-out',
        },
        '.animate-bounce-in': {
          'animation': 'bounceIn 0.8s ease-out',
        },
      });
    }),

  ],
};

module.exports = config;
