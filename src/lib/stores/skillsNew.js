import { writable } from "svelte/store";


export const skillsNew = writable([0]);



export const updateaddS = () => {
    skillsNew.set()
}

