import { writable } from 'svelte/store';
import skill from '$lib/data/skills.json'
import tafkidim from '$lib/data/tafkidim.json'
import workways from '$lib/data/workways.json'
export const mi = writable(0)
export const skil = writable(skill)
export const ww = writable(workways);
export const role = writable(tafkidim);