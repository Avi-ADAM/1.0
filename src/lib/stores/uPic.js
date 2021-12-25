import { writable } from 'svelte/store';

export const uPic = writable();
export const updpic = writable(0);
export const updatePic = () => {
    updpic.set()
};

export const updateuPic = () => {
    uPic.set()
};
