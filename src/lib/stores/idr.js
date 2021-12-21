import { writable } from "svelte/store";


export const idr = writable(0);



export const updateidr = () => {
    idr.set()
}

