
const colors = require('tailwindcss/colors');

const config = {
	mode: "jit",
	content: [
		"./src/**/*.{html,js,svelte,ts}",
	
	],
	theme: { 
		scale: {
			'0': '0',
		   '25': '.25',
			'50': '.5',
			'75': '.75',
			'90': '.9',
		   '95': '.95',
			'100': '1',
		   '105': '1.05',
		   '110': '1.1',
			'125': '1.25',
			'150': '1.5',
		   '200': '2',
		   '290': '2.9',
		  },
		extend: {
			colors: {
				stgold: "#574010",
					gra: "#BF953F",
					grb: "#FCF6BA",
					grc: "#B38728",
					grd: "#FBF5B7",
					gre: "#AA771c",
					graa: "#ffc857",
					grbb: "#3e2f5b",
					barbi: '#FF0092',
					gold: '#EEE8AA',
					lturk: 'rgb(103, 232, 249)',
					mturk: 'rgb(34, 211, 238)',
					sturk: '#CCFBF1',
					lpink: 'rgb(251, 207, 232)', 
					mpink: 'rgb(244, 114, 182)',
				pinki: 'rgb(242, 229, 242)',
				    wow: 'rgb(2, 255, 187)',
				wow2: 'rgb(50, 99, 86)',

				blueg: 'rgb(116, 191, 255)',
				oranges: 'rgb(254, 172, 49);',
				wowt: "rgb(3, 55, 47)"
		}
		
		
	  }
			}

	
};

module.exports = config;
