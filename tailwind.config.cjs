//const colors = require('tailwindcss/colors');
//  mode: 'jit',
/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

const config = {
  content: ['./src/**/*.{html,js,svelte,ts}', './node_modules/@mediakular/gridcraft/dist/themes/**/*.svelte'],
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
          'linear-gradient(to right, #ff7e5f, #feb47b, #86e3ce, #d4a5a5, #ffdfd3, #d4a5a5, #86e3ce, #feb47b, #ff7e5f)'
      },
      animation: {
        shine: "shine 2s linear infinite",
        gradientx: 'gradientx 8s linear infinite',
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
        blu: '#04619f',
        silver: '#BBC2CC',
        stgold: '#574010',
        gra: '#BF953F',
        grb: '#FCF6BA',
        grc: '#B38728',
        grd: '#FBF5B7',
        gre: '#AA771c',
        graa: '#ffc857',
        grbb: '#3e2f5b',
        barbi: '#FF0092',
        gold: '#EEE8AA',
        neww: '#49f3df',
        lturk: 'rgb(103, 232, 249)',
        mturk: 'rgb(34, 211, 238)',
        sturk: '#CCFBF1',
        lpink: 'rgb(251, 207, 232)',
        mpink: 'rgb(244, 114, 182)',
        pinki: 'rgb(242, 229, 242)',
        wow: 'rgb(2, 255, 187)',
        wow2: 'rgb(144, 255, 17)',
        blueg: 'rgb(116, 191, 255)',
        oranges: 'rgb(254, 172, 49);',
        wowt: 'rgb(3, 55, 47)'
      }
    }
  },
  Plugins:[]
};

module.exports = config;
