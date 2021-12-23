import { writable } from "svelte/store";


export const JWT = writable();



export const updateJWT = () => {
    // a writable store has a `set` method to change its value
    JWT.set()
}
