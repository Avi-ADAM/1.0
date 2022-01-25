import { writable } from "svelte/store";

export const missionNew = writable();

export const updateshowv = () => {
    missionNew.set()
}

