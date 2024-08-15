import { sendToSer } from "$lib/send/sendToSer.svelte";
import { io } from "socket.io-client";
import { writable } from "svelte/store";
const baseUrl = import.meta.env.VITE_URL

export const isOnline = writable(false);
export const myUserMeeting = writable(0);
export async function initialWebSP (token,myId){
    const socket = io(baseUrl, {
        auth: {
          token: token
        }
      });

      //  wait until socket connects before adding event listeners
      socket.on('connect', () => {
        console.log('connected',myId);
        socket.on('pgishauser:update', (datan) => {
          console.log('io= ', datan);
          //get array of relevant forum ids\
                      console.log(
                        'yallla cvar, geula',
                        datan,
                        datan.data
                      );

          if (datan.data.id != myId) {
            //check if one of my meetings parters
          }else if(datan.data.id == myId){

            if(datan.data.attributes.available){
              isOnline.set(true)
            }else{
              isOnline.set(false)
            }
          }
        })
      
    })
}
export async function initiatePgishot(idL) {
    await sendToSer({id:idL},"23myUserMeeting",null,null,false,
        fetch).then(d=> {
            console.log(d,d.data,d.data?.pgishausers?.data[0]?.attributes?.available)
            myUserMeeting.set(d.data?.pgishausers?.data[0]?.id ?? 0)
        isOnline.set(d.data?.pgishausers?.data[0]?.attributes?.available ?? false)
        })
}