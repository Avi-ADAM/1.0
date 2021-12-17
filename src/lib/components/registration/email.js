import { writable } from "svelte/store";

export const email = writable('');   

export const updateEmail = () => {
    email.set()
}