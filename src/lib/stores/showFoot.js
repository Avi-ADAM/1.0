import { writable } from "svelte/store";

export const showFoot = writable(true);

export const updateshowv = () => {
    showFoot.set()
}

