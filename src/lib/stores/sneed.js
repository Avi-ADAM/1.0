import { writable } from "svelte/store";


export const sneed = writable([]);



export const updatesneed = () => {
    sneed.set()
}

