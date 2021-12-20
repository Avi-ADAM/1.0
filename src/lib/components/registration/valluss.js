import { writable } from "svelte/store";

export const valluss = writable();   

export const updatevalluess = () => {
    // a writable store has a `set` method to change its value
    valluss.set()
}