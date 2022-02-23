import { writable } from "svelte/store";


export const total = writable(0);



export const updatesTotal = () => {
    total.set()
}

