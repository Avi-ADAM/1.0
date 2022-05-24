import { writable } from "svelte/store";

export const newp = writable();

export const updateNewp = () => {
    newp.set()
}