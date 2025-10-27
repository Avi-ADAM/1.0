// Animation and visual effects utilities for lev page

export function prcnt(a, b) {
  return parseInt((a * b) / 100, 10);
}

export function sortNumber(a, b) {
  return a - b;
}

export function gen(w, h) {
  let xMax = prcnt(16, w);
  let yMin = prcnt(7, h);
  let yMax = prcnt(25, h);
  let x = [];
  let y = [];
  let xyz = [];
  let step = 0;
  let a = w / 2;
  let b = w / 4.5;
  let e = b / 2;
  let initX = (a + Math.random() * b - e) | 0;
  
  for (let i = 0; i < 50; i++) {
    let g = (20 + Math.random() * yMax) | 0;
    step += g;
    y[i] = step | 0;
    if (step > h) {
      break;
    }
  }
  
  y.push(0);
  y.sort(sortNumber);
  x[0] = initX;
  
  for (let i = 0; i < y.length; i++) {
    if (y[i + 1] - y[i] < yMin) {
      x[i + 1] = x[i] + Math.floor(Math.random() * 10 - 8);
    } else {
      x[i + 1] = x[i] + Math.floor(Math.random() * xMax - xMax / 2);
    }
    xyz[i] = x[i] + ',' + y[i] + ' ';
  }
  
  return { xyz, initX };
}

export function createFlashAnimation(elem, initX, low, cards) {
  let c = 0;
  
  function flash() {
    if (low == true && cards == false) {
      elem.style.backgroundImage =
        'radial-gradient(ellipse farthest-corner at ' +
        initX +
        'px top, #ffaaff 0%, #ee88ff 16%, #000 100%)';
      let r = (30 + Math.random() * 70) | 0;
      c++;
      setTimeout(function () {
        flkr();
      }, r);
    }
  }

  function flkr() {
    elem.style.backgroundImage =
      'radial-gradient(ellipse farthest-corner at ' +
      initX +
      'px top, #000 0%, #000 100%)';
    let r = (16 + Math.random() * 30) | 0;
    if (c > 6) {
      clear();
    } else {
      setTimeout(function () {
        flash();
      }, r);
    }
  }

  function clear() {
    if (low == true) {
      elem.style.backgroundImage =
        'radial-gradient(ellipse farthest-corner at center top, #000 0%, #000 100%)';
    } else {
      elem.style.backgroundImage = '';
    }
  }
  
  return { flash, clear };
}

export function reverseString(str) {
  return str.split('').reverse().join('');
}