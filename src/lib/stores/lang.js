import { writable } from 'svelte/store';


export const doesLang = writable(false)
export const langUs = writable("te");

export let lang = writable("en");






