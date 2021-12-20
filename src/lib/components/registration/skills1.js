import { writable } from "svelte/store";

export const skills1 = writable();   

export const updateSkills1 = () => {
    // a writable store has a `set` method to change its value
    skills1.set()
}