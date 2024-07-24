import { sendToSer } from "$lib/send/sendToSer.svelte";
import { writable } from "svelte/store";

export const missionList = writable([]);
export async function updateM (){
    await sendToSer({},"12mission",null,null,false,fetch).then(d=> missionList.set(d.data.missions.data))
}