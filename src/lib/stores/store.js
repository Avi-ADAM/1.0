import { writable } from 'svelte/store';
export const userName = writable("אל.פלוני");
export const updateName = () => {
    userName.set()
}
