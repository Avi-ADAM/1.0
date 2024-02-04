import { SendTo } from '$lib/send/sendTo.svelte';
import { io } from 'socket.io-client';
import { writable } from 'svelte/store';
  const baseUrl = import.meta.env.VITE_URL

export const pendMisMes = writable({});
export const pendMasMes = writable({});
export const meAskMisMes = writable({})
export const askMisMes = writable({});
export const meAskMasMes = writable({});
export const askMasMes = writable({});
export const forum = writable({})
export const nowId = writable(0)
/*export async function initialWebS (token,id){
    const socket = io(baseUrl, {
        auth: {
          token: token
        },id
      });

      //  wait until socket connects before adding event listeners
      socket.on('connect', () => {
        console.log('connected',id);
        socket.on('message:create', (datan) => {
          console.log('io= ', datan);
          //get array of relevant forum ids\
                      console.log(
                        'yallla cvar, geula',
                        datan.data.attributes.forums.data.id
                      );

          let array = []
          if(array.includes(datan.data.attributes.forums.data.id)){
            console.log("yallla cvar, geula")
          }
        })
    })
}*/
export async function initialForum (all = false,ids = [],myId = 0){
  for (let i = 0; i < ids.length; i++) {
    if(ids[i] in forum){
      forum[ids[i]].loading = true 
    }else{
    forum[ids[i]] = {loading: true}; 
    }
  }
  let que = ``
  if(all == true){
      que = `{
       usersPermissionsUser (id:${myId}) {data{ attributes{
                            projects_1s {data {id attributes{ projectName profilePic{data{attributes{url formats}}} forums{
                                data{id attributes{
                    subject spec done mesimabetahaliches {data{attributes{name}}} messages(filters:{archived: {ne:true}}){data{id attributes{
                        content when users_permissions_user{data{id attributes{username profilePic{data{attributes{url formats}}}}}}
                    }}}
                }}
                            } }}}
                            } }}
      }`;
          console.log('store');

  }else if(all == false && ids.length >0){
       que = `{
            forums(filters: {id:{in: [${ids}]}}){
                data{id attributes{
                    subject spec done messages(filters:{archived: {ne:true}}){data{id attributes{
                        content when users_permissions_user{data{id attributes{username profilePic{data{attributes{url formats}}}}}}
                    }}}
                }}
            }
        }`;
      }
         try {
           let res4 = await SendTo(que).then(
             (res4) => (res4 = res4)
           );
            console.log(res4)
           if (res4.data != null) {
            console.log(res4.data,"res4")
            if(all == true){
              function extractForums(data) {
                let forums = [];
                data.usersPermissionsUser.data.attributes.projects_1s.data.forEach(
                  (project) => {
                    if (project.attributes.forums.data.length > 0) {
                      project.attributes.forums.data.forEach(
                        (forumo) =>{
                          if (forumo.id in forum) {
                            forum[forumo.id].loading = true;
                            forum[forumo.id].md = {
                              projectName: project.attributes.projectName,
                              projectPic: project.attributes.profilePic.data?.attributes?.formats?.thumbnail
                                ? project.attributes.profilePic.data.attributes.formats.thumbnail.url
                                : project.attributes.attributes.url,
                              mesimaName:
                                forumo.attributes.mesimabetahaliches.data[0]
                                  .attributes.name
                            };
                          } else {
                            forum[forumo.id] = {
                              loading: true,
                              md: {
                                projectName: project.attributes.projectName,
                                projectPic: project.attributes.profilePic.data
                                  ?.attributes?.formats?.thumbnail
                                  ? project.attributes.profilePic.data
                                      .attributes.formats.thumbnail.url
                                  : project.attributes.attributes.url,
                                mesimaName:
                                  forumo.attributes.mesimabetahaliches.data[0]
                                    .attributes.name
                              }
                            };
                          }
                        }
                      )
                      forums.push(...project.attributes.forums.data);
                    }
                  }
                );
                return forums;
              }

              // Usage:
              let arr = extractForums(res4.data)
             
               let arry = { forums:{data: arr}};
              forums(arry, myId, all);

            }else{
                          forums(res4.data, myId, all);
            }
           } else {
             console.error(res4);
           }
         } catch (e) {
           console.error(e);
         }
    
}

export function forums(dat,myId,all=false) {
  let oldForums = forum;
  //check for is forum by id if not cr
  console.log(dat)
    for (let t = 0; t < dat.forums.data.length; t++) {
      //TODO: add loading object, if already then new = [] update ALL messages then and add to forum
      if (dat.forums.data[t].id in forum){
        forum[dat.forums.data[t].id].messages = [];
      }
        for (
          let index = 0;
          index < dat.forums.data[t].attributes.messages.data.length;
          index++
        ) {
          const element = dat.forums.data[t].attributes.messages.data[index];
          console.log(dat.forums.data[t].attributes.messages.data,element);
          addMes(
            element.attributes.content,
            dat.forums.data[t].id,
            false,
            element.attributes.users_permissions_user.data.id === myId,
            element.attributes.users_permissions_user.data.attributes.profilePic
              .data?.attributes?.formats?.thumbnail.url ||
              'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png',
            element.attributes.when,
            element.id,
            element.attributes.users_permissions_user.data.attributes.username
          );
        }
          if (dat.forums.data[t].id in forum) {
            forum[dat.forums.data[t].id].loading = false;
          }
}
/*
  let old = forum;
  old[arr1[index].pendId] = arr;
  pendMisMes.set(forums);
  localStorage.setItem('pendMisMes', JSON.stringify(forum));*/
}
export function addMes(
  why = '',
  id = 0,
  pending = true,
  sentByMe = true,
  pic = '',
  date = new Date.now(),
  messageId = 0,
  username = ""
) {
  let aarr = forum;
  let arr;
  if (id in aarr) {
    arr = aarr[id]?.messages ?? [];
  } else {
    aarr[id] = {
      messages: []
    };
    arr = [];
  }
  arr.push({
    message: why,
    what: true,
    pic: pic,
    pending: pending,
    sentByMe: sentByMe,
    timestamp: date,
    messageId,
    username
  });
  aarr[id].messages = arr;
  forum.set(aarr);
  return;
}
export function updSend(
  id = 0,
  messageId = 0
) {
  let aarr = forum;
  let arr = aarr[id]?.messages ?? [];
  //let mesIn = arr.findIndex((obj) => obj.messageId == messageId);
  console.log(arr[arr.length -1],arr,aarr)
  arr[arr.length - 1].pending = false;
  aarr[id].messages = arr;
  forum.set(aarr);
}