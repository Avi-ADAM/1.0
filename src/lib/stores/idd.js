import { writable } from "svelte/store";


export const idd = writable(0);

export const updateIdd = () => {
    idd.set()
}

