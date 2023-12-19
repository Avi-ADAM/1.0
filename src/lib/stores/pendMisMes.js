import { SendTo } from '$lib/send/sendTo.svelte';
import { writable } from 'svelte/store';

export const pendMisMes = writable({});
export const pendMasMes = writable({});
export const meAskMisMes = writable({})
export const askMisMes = writable({});
export const meAskMasMes = writable({});
export const askMasMes = writable({});
export const forum = writable({})
export const nowId = writable(0)

export async function initialForum (all = false,ids = []){
    if(all == false && ids.length >0){
        let que = `{
            forums(filters: {id:{in: [${ids}]}}){

            }
        }`;
    await SendTo
    }
}