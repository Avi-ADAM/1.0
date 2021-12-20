import { writable } from "svelte/store";

export const workways1 = writable();   

export const updateWorkways1 = () => {
    // a writable store has a `set` method to change its value
    workways1.set()
}