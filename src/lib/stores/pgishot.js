import { sendToSer } from "$lib/send/sendToSer.svelte";
import { io } from "socket.io-client";
import { writable, get } from "svelte/store";
const baseUrl = import.meta.env.VITE_URL
export const whoToFollow = writable({});
export const meetingsData = writable({});
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
            if(whoToFollow[datan.data.id]){
                //check if more partners
                if(meetingsData[whoToFollow[datan.data.id]].pgishausers.data.length < 2){
                    //check for every partner if availiable
                }else{
                    //nutify
                }
            }
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
            myUserMeeting.set(d.data?.pgishausers?.data[0]?.id || 0)
        isOnline.set(d.data?.pgishausers?.data[0]?.attributes?.available || false)
        console.log(d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data,get(myUserMeeting))

        if(d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data.length > 0){
            let users = {}
            let meetings = {}
            for(let i=0;i<d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data.length;i++){
                meetings[d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.id] = d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]
                meetings[d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.id].messages = []
                meetings[d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.id].kind = "meeting"

                meetings[d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.id].messages.push({
                  timestamp: d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i].attributes.publishedAt,
                  message: "הפגישה נוצרה"
                })
                for(let j=0;j<d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.attributes?.pgishausers?.data.length;j++){
                  console.log(d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.attributes?.pgishausers?.data[j]?.id, get(myUserMeeting))
                    if(d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.attributes?.pgishausers?.data[j]?.id !== get(myUserMeeting)){
                        if(!users[d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.attributes?.pgishausers?.data[j]?.id]){
                          users[d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.attributes.pgishausers?.data[j]?.id] = {meetings:[d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.id],status:d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.attributes.pgishausers?.data[j]?.attributes.available}
                        }else{
                            users[d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.attributes.pgishausers?.data[j]?.id].meetings.push(d.data?.pgishausers?.data[0]?.attributes?.pgishas?.data[i]?.id)
                        }

                }
            }
        }
        whoToFollow.set(users)
        meetingsData.set(meetings)
        console.log(users,meetings)
        }
        })
}