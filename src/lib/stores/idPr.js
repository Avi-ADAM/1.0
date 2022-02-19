import { writable } from "svelte/store";


export const idPr = writable(0);



export const updateidPr = () => {
    // a writable store has a `set` method to change its value
    idPr.set()
}

