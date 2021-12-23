import { writable } from "svelte/store";


export const idM = writable();



export const updateidM = () => {
    // a writable store has a `set` method to change its value
    idM.set()
}

