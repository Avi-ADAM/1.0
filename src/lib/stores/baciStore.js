import { writable } from 'svelte/store';

const getInitialState = () => ({
    projectName_value: "",
    desP: "",
    desPl: "",
    linkP: "",
    imageId: 50,
    selected: [],
    restime: "feh",
    timeToP: "already",
    ont: false
});

export const baciStore = writable(getInitialState());

export const resetBaciStore = () => {
    baciStore.set(getInitialState());
};
