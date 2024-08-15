import { sendToSer } from "$lib/send/sendToSer.svelte";
import { writable } from "svelte/store";
export const isOnline = writable(false);
export const myUserMeeting = writable(0);
export async function initiatePgishot(idL) {
    await sendToSer({id:idL},"23myUserMeeting",null,null,false,
        fetch).then(d=> {
            console.log(d,d.data,d.data?.pgishausers?.data[0]?.attributes?.available)
            myUserMeeting.set(d.data?.pgishausers?.data[0]?.id ?? 0)
        isOnline.set(d.data?.pgishausers?.data[0]?.attributes?.available ?? false)
        })
}