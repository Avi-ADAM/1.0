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
        wowt: 'var(--wowt)',
        // Identity colour families routed through CSS variables so the
        // appearance layer can retheme them. The personal values below are
        // byte-identical to stock Tailwind, so the default look is unchanged;
        // only `html.business` overrides them. The rgb()/<alpha-value> form
        // is what keeps opacity modifiers (`bg-pink-500/50`) working — a
        // plain `var(--x)` would break the 66 call sites that use them.
        // gray/slate/zinc/stone (already neutral), blue/sky/indigo (already
        // business), green/emerald/teal (success) and red/orange (danger)
        // deliberately keep their stock values in both themes.
        pink: {
          50: 'rgb(var(--c-pink-50) / <alpha-value>)',
          100: 'rgb(var(--c-pink-100) / <alpha-value>)',
          200: 'rgb(var(--c-pink-200) / <alpha-value>)',
          300: 'rgb(var(--c-pink-300) / <alpha-value>)',
          400: 'rgb(var(--c-pink-400) / <alpha-value>)',
          500: 'rgb(var(--c-pink-500) / <alpha-value>)',
          600: 'rgb(var(--c-pink-600) / <alpha-value>)',
          700: 'rgb(var(--c-pink-700) / <alpha-value>)',
          800: 'rgb(var(--c-pink-800) / <alpha-value>)',
          900: 'rgb(var(--c-pink-900) / <alpha-value>)',
          950: 'rgb(var(--c-pink-950) / <alpha-value>)',
        },
        fuchsia: {
          50: 'rgb(var(--c-fuchsia-50) / <alpha-value>)',
          100: 'rgb(var(--c-fuchsia-100) / <alpha-value>)',
          200: 'rgb(var(--c-fuchsia-200) / <alpha-value>)',
          300: 'rgb(var(--c-fuchsia-300) / <alpha-value>)',
          400: 'rgb(var(--c-fuchsia-400) / <alpha-value>)',
          500: 'rgb(var(--c-fuchsia-500) / <alpha-value>)',
          600: 'rgb(var(--c-fuchsia-600) / <alpha-value>)',
          700: 'rgb(var(--c-fuchsia-700) / <alpha-value>)',
          800: 'rgb(var(--c-fuchsia-800) / <alpha-value>)',
          900: 'rgb(var(--c-fuchsia-900) / <alpha-value>)',
          950: 'rgb(var(--c-fuchsia-950) / <alpha-value>)',
        },
        rose: {
          50: 'rgb(var(--c-rose-50) / <alpha-value>)',
          100: 'rgb(var(--c-rose-100) / <alpha-value>)',
          200: 'rgb(var(--c-rose-200) / <alpha-value>)',
          300: 'rgb(var(--c-rose-300) / <alpha-value>)',
          400: 'rgb(var(--c-rose-400) / <alpha-value>)',
          500: 'rgb(var(--c-rose-500) / <alpha-value>)',
          600: 'rgb(var(--c-rose-600) / <alpha-value>)',
          700: 'rgb(var(--c-rose-700) / <alpha-value>)',
          800: 'rgb(var(--c-rose-800) / <alpha-value>)',
          900: 'rgb(var(--c-rose-900) / <alpha-value>)',
          950: 'rgb(var(--c-rose-950) / <alpha-value>)',
        },
        purple: {
          50: 'rgb(var(--c-purple-50) / <alpha-value>)',
          100: 'rgb(var(--c-purple-100) / <alpha-value>)',
          200: 'rgb(var(--c-purple-200) / <alpha-value>)',
          300: 'rgb(var(--c-purple-300) / <alpha-value>)',
          400: 'rgb(var(--c-purple-400) / <alpha-value>)',
          500: 'rgb(var(--c-purple-500) / <alpha-value>)',
          600: 'rgb(var(--c-purple-600) / <alpha-value>)',
          700: 'rgb(var(--c-purple-700) / <alpha-value>)',
          800: 'rgb(var(--c-purple-800) / <alpha-value>)',
          900: 'rgb(var(--c-purple-900) / <alpha-value>)',
          950: 'rgb(var(--c-purple-950) / <alpha-value>)',
        },
        violet: {
          50: 'rgb(var(--c-violet-50) / <alpha-value>)',
          100: 'rgb(var(--c-violet-100) / <alpha-value>)',
          200: 'rgb(var(--c-violet-200) / <alpha-value>)',
          300: 'rgb(var(--c-violet-300) / <alpha-value>)',
          400: 'rgb(var(--c-violet-400) / <alpha-value>)',
          500: 'rgb(var(--c-violet-500) / <alpha-value>)',
          600: 'rgb(var(--c-violet-600) / <alpha-value>)',
          700: 'rgb(var(--c-violet-700) / <alpha-value>)',
          800: 'rgb(var(--c-violet-800) / <alpha-value>)',
          900: 'rgb(var(--c-violet-900) / <alpha-value>)',
          950: 'rgb(var(--c-violet-950) / <alpha-value>)',
        },
        amber: {
          50: 'rgb(var(--c-amber-50) / <alpha-value>)',
          100: 'rgb(var(--c-amber-100) / <alpha-value>)',
          200: 'rgb(var(--c-amber-200) / <alpha-value>)',
          300: 'rgb(var(--c-amber-300) / <alpha-value>)',
          400: 'rgb(var(--c-amber-400) / <alpha-value>)',
          500: 'rgb(var(--c-amber-500) / <alpha-value>)',
          600: 'rgb(var(--c-amber-600) / <alpha-value>)',
          700: 'rgb(var(--c-amber-700) / <alpha-value>)',
          800: 'rgb(var(--c-amber-800) / <alpha-value>)',
          900: 'rgb(var(--c-amber-900) / <alpha-value>)',
          950: 'rgb(var(--c-amber-950) / <alpha-value>)',
        },
        yellow: {
          50: 'rgb(var(--c-yellow-50) / <alpha-value>)',
          100: 'rgb(var(--c-yellow-100) / <alpha-value>)',
          200: 'rgb(var(--c-yellow-200) / <alpha-value>)',
          300: 'rgb(var(--c-yellow-300) / <alpha-value>)',
          400: 'rgb(var(--c-yellow-400) / <alpha-value>)',
          500: 'rgb(var(--c-yellow-500) / <alpha-value>)',
          600: 'rgb(var(--c-yellow-600) / <alpha-value>)',
          700: 'rgb(var(--c-yellow-700) / <alpha-value>)',
          800: 'rgb(var(--c-yellow-800) / <alpha-value>)',
          900: 'rgb(var(--c-yellow-900) / <alpha-value>)',
          950: 'rgb(var(--c-yellow-950) / <alpha-value>)',
        },
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
