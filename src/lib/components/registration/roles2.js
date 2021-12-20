import { writable } from "svelte/store";

export const roles2 = writable();   

export const updateRoles2 = () => {
    // a writable store has a `set` method to change its value
    roles2.set()
}