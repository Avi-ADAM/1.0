// Data processing utilities for lev page
import { getProjectData } from '$lib/stores/projectStore.js';
import { getOccurrence } from '$lib/func/getOccurrence.svelte';
import { montsi } from '$lib/func/montsi.svelte';
import { kindOfTranslation } from '$lib/func/kindOfTranslate.svelte';
import tr from '$lib/translations/tr.json';

export function letters(data) {
  let namer = [];
  let st = 175;
  let stylef = '24px';
  if (/[\u0590-\u05FF]/.test(data) | /[\u0600-\u06FF]/.test(data)) {
    let sep = '';
    sep = data.split(' ').filter((w) => w !== '');
    for (let i = 0; i < sep.length; i++) {
      if (/[\u0590-\u05FF]/.test(sep[i]) | /[\u0600-\u06FF]/.test(sep[i])) {
        namer[i] = sep[i].split('').reverse().join('');
      } else {
        namer[i] = sep[i];
      }
    }
    const x = namer.reverse().join(' ');
    data = x;
    st = 275;
  }

  if (data.length >= 15 && data.length < 19) {
    stylef = '21px';
    st = 275;
  } else if (data.length >= 19 && data.length < 20) {
    stylef = '20px';
    st = 255;
  } else if (data.length >= 20 && data.length < 21) {
    stylef = '18px';
    st = 270;
  } else if (data.length >= 21) {
    stylef = '16px';
    st = 285;
  }
  return [data, stylef, st];
}

export function txx(na) {
  let tx = 680;
  if (na.length < 10) {
    tx = 440;
  } else if (na.length < 20) {
    tx = 580;
  } else if (na.length < 28) {
    tx = 680;
  } else if (na.length > 28) {
    tx = 780;
  }
  return tx;
}

export function checkStb(dat) {
  let hst;
  if (dat.length < 4) {
    hst = 165;
  } else if (dat.length < 5) {
    hst = 180;
  } else if (dat.length < 8) {
    hst = 185;
  } else if (dat.length < 16) {
    hst = 200;
  } else if (dat.length < 24) {
    hst = 240;
  } else if (dat.length < 32) {
    hst = 250;
  }
  return hst;
}

export function checkHst(dat) {
  let hst;
  if (dat.length < 4) {
    hst = 160;
  } else if (dat.length < 5) {
    hst = 170;
  } else if (dat.length < 8) {
    hst = 190;
  } else if (dat.length < 16) {
    hst = 195;
  } else if (dat.length < 24) {
    hst = 260;
  } else if (dat.length < 32) {
    hst = 285;
  }
  return hst;
}

export const filterArrayd = (arr1, arr2) => {
  const filterede = arr1.filter((el) => {
    return arr2.indexOf(el) === -1;
  });
  return filterede;
};

export const filterArray = (arr1, arr2) => {
  const filterede = arr1.filter((el) => {
    return arr2.indexOf(el) !== -1;
  });
  return filterede;
};