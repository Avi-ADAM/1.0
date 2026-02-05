import { SendTo } from '$lib/send/sendTo.svelte';
import { io } from 'socket.io-client';
import { get, writable } from 'svelte/store';
import { socketClient } from '$lib/stores/socketClient';
  const baseUrl = import.meta.env.VITE_URL

const inFlightForumFetches = new Set();

export const username = writable("")
export const pendMisMes = writable({});
export const pendMasMes = writable({});
export const meAskMisMes = writable({})
export const askMisMes = writable({});
export const meAskMasMes = writable({});
export const askMasMes = writable({});
export const forum = writable({})
export const userProjects = writable([]);
export const nowId = writable(0)
export const nowChatId = writable(0)
export const isChatOpen = writable(false)
export const isChatLoading = writable(false);
export const newChat = writable({
  started:false,
  created: false,
  id: 0,
  md: { mbId:0, pid:0}
});
export function initialWebS(token, id) {
  console.log('🔌 [pendMisMes] Setting up unified chat notification listener', id);
  
  // Register notification listener for real-time chat updates
  return socketClient.onNotification((notification) => {
    // Check if it's a chat message notification
    const n = notification;
    const isChatMessage = 
      n.actionKey === 'createChatMessage' || 
      n.metadata?.type === 'chatMessage' ||
      (n.updateStrategy && n.updateStrategy.config?.dataKeys?.includes('chat'));

    if (isChatMessage) {
      const forumId = n.metadata?.forumId || 
                     (n.updateStrategy && n.updateStrategy.config?.forumId);
      
      if (forumId) {
        console.log('💬 [pendMisMes] Refreshing chat data for forum:', forumId);
        // Targeted refresh for the specific forum
        initialForum(false, [String(forumId)], id);
      }
    }
  });
}
export async function initialForum (all = false,ids = [],myId = 0){
  const idsToFetch = [];
  if (ids.length > 0) {
    const currentForums = get(forum);
    for (let i = 0; i < ids.length; i++) {
      const fid = String(ids[i]);
      if (inFlightForumFetches.has(fid)) continue;

      inFlightForumFetches.add(fid);
      idsToFetch.push(fid);

      if (fid in currentForums) {
        currentForums[fid].loading = true;
      } else {
        currentForums[fid] = { loading: true };
      }
    }
    if (idsToFetch.length > 0) {
      forum.set(currentForums);
    }
  }
  const idsLiteral = idsToFetch.map((fid) => `"${fid}"`).join(',');
  let que = ``
  if(all == true){
    isChatLoading.set(true)
      que = `{
       usersPermissionsUser (id:${myId}) {data{ attributes{
                            username
                            projects_1s {data {id attributes{ 
                              projectName 
                              profilePic{data{attributes{url formats}}} 
                              forums{
                                data{id attributes{
                                  subject spec done 
                                  mesimabetahaliches {data{attributes{name}}} 
                                  messages(filters:{archived: {ne:true}}){data{id attributes{
                                    content when users_permissions_user{data{id attributes{username profilePic{data{attributes{url formats}}}}}}
                                  }}}
                                }}
                              }
                            }}}
                            halukasres{
                              data {
                                id
                                attributes {
                                  amount
                                  usersend {data {id attributes {username}}}
                                  userrecive {data {id attributes {username}}}
                                  project {data {id attributes {projectName profilePic{data{attributes{url formats}}}}}}
                                  forum {
                                    data {
                                      id
                                      attributes {
                                        subject spec done
                                        messages(filters:{archived: {ne:true}}) {
                                          data {
                                            id
                                            attributes {
                                              content when 
                                              users_permissions_user{data{id attributes{username profilePic{data{attributes{url formats}}}}}}
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            halukasend{
                              data {
                                id
                                attributes {
                                  amount
                                  usersend {data {id attributes {username}}}
                                  userrecive {data {id attributes {username}}}
                                  project {data {id attributes {projectName profilePic{data{attributes{url formats}}}}}}
                                  forum {
                                    data {
                                      id
                                      attributes {
                                        subject spec done
                                        messages(filters:{archived: {ne:true}}) {
                                          data {
                                            id
                                            attributes {
                                              content when 
                                              users_permissions_user{data{id attributes{username profilePic{data{attributes{url formats}}}}}}
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            } }}
      }`;

  }else if(all == false && idsToFetch.length >0){
       que = `{
            forums(filters: {id:{in: [${idsLiteral}]}}){
                data{id attributes{
                    subject spec done
                    project { data { id attributes { projectName profilePic{data{attributes{url formats}}} } } }
                    mesimabetahaliches { data { attributes { name } } }
                    sheiruts { data { attributes { name } } }
                    messages(filters:{archived: {ne:true}}, sort:["when:asc"]){data{id attributes{
                        content when users_permissions_user{data{id attributes{username profilePic{data{attributes{url formats}}}}}}
                    }}}
                }}
            }
        }`;
      }
         try {
           if (all === false && idsToFetch.length === 0) {
             return "ok";
           }

           if (all === false && idsToFetch.length > 0) {
             ids = idsToFetch;
           }
           let res4 = await SendTo(que).then(
             (res4) => (res4 = res4)
           );
            console.log(res4)
           if (res4.data != null) {
            console.log(res4.data,"res4")
            if(all == true){
              username.set(res4.data.usersPermissionsUser.data.attributes.username)

              // חילוץ רשימת הפרויקטים
              const projects = res4.data.usersPermissionsUser.data.attributes.projects_1s.data.map(project => ({
                id: project.id,
                projectName: project.attributes.projectName,
                profilePic: project.attributes.profilePic.data?.attributes?.formats?.thumbnail?.url ||
                           project.attributes.profilePic.data?.attributes?.url ||
                           null
              }));
              userProjects.set(projects);
              console.log(userProjects.subscribe((projects) => {
                console.log(projects);
              }))
              function extractForums(data) {
                let forums = [];
                const currentForums = get(forum);
                
                // Extract forums from projects (mesimabetahaliches)
                data.usersPermissionsUser.data.attributes.projects_1s.data.forEach(
                  (project) => {
                    if (project.attributes.forums.data.length > 0) {
                      project.attributes.forums.data.forEach(
                        (forumo) =>{
                          // רק אם יש mesimabetahaliches (לא haluka)
                          if (forumo.attributes.mesimabetahaliches?.data?.[0]) {
                            if (forumo.id in currentForums) {
                              currentForums[forumo.id].loading = true;
                              currentForums[forumo.id].md = {
                                pid:project.id,
                                projectName: project.attributes.projectName,
                                projectPic: project.attributes.profilePic.data?.attributes?.formats?.thumbnail
                                  ? project.attributes.profilePic.data.attributes.formats.thumbnail.url
                                  : project.attributes.profilePic.data?.attributes?.url,
                                mesimaName:
                                  forumo.attributes.mesimabetahaliches.data[0]
                                    .attributes.name
                              };
                            } else {
                              currentForums[forumo.id] = {
                                loading: true,
                                md: {
                                  pid: project.id,
                                  projectName: project.attributes.projectName,
                                  projectPic: project.attributes.profilePic.data
                                    ?.attributes?.formats?.thumbnail
                                    ? project.attributes.profilePic.data
                                        .attributes.formats.thumbnail.url
                                    : project.attributes.profilePic.data?.attributes?.url,
                                  mesimaName:
                                    forumo.attributes.mesimabetahaliches.data[0]
                                      .attributes.name
                                }
                              };
                            }
                            forums.push(forumo);
                          }
                        }
                      )
                    }
                  }
                );
                
                // Extract forums from halukas (received)
                if (data.usersPermissionsUser.data.attributes.halukasres?.data) {
                  data.usersPermissionsUser.data.attributes.halukasres.data.forEach(
                    (haluka) => {
                      if (haluka.attributes.forum?.data && haluka.attributes.project?.data) {
                        const forumo = haluka.attributes.forum.data;
                        const project = haluka.attributes.project.data;
                        const senderId = haluka.attributes.usersend.data.id;
                        const receiverId = haluka.attributes.userrecive.data.id;
                        
                        if (forumo.id in currentForums) {
                          currentForums[forumo.id].loading = true;
                          currentForums[forumo.id].md = {
                            pid: project.id,
                            projectName: project.attributes.projectName,
                            projectPic: project.attributes.profilePic.data?.attributes?.formats?.thumbnail
                              ? project.attributes.profilePic.data.attributes.formats.thumbnail.url
                              : project.attributes.profilePic.data?.attributes?.url,
                            halukId: haluka.id,
                            transferDetails: `קבלת ${haluka.attributes.amount} מ-${haluka.attributes.usersend.data.attributes.username}`,
                            senderId: senderId,
                            receiverId: receiverId,
                            participants: [String(senderId), String(receiverId)]
                          };
                        } else {
                          currentForums[forumo.id] = {
                            loading: true,
                            md: {
                              pid: project.id,
                              projectName: project.attributes.projectName,
                              projectPic: project.attributes.profilePic.data?.attributes?.formats?.thumbnail
                                ? project.attributes.profilePic.data.attributes.formats.thumbnail.url
                                : project.attributes.profilePic.data?.attributes?.url,
                              halukId: haluka.id,
                              transferDetails: `קבלת ${haluka.attributes.amount} מ-${haluka.attributes.usersend.data.attributes.username}`,
                              senderId: senderId,
                              receiverId: receiverId,
                              participants: [String(senderId), String(receiverId)]
                            }
                          };
                        }
                        forums.push(forumo);
                      }
                    }
                  );
                }
                
                // Extract forums from halukas (sent)
                if (data.usersPermissionsUser.data.attributes.halukasend?.data) {
                  data.usersPermissionsUser.data.attributes.halukasend.data.forEach(
                    (haluka) => {
                      if (haluka.attributes.forum?.data && haluka.attributes.project?.data) {
                        const forumo = haluka.attributes.forum.data;
                        const project = haluka.attributes.project.data;
                        const senderId = haluka.attributes.usersend.data.id;
                        const receiverId = haluka.attributes.userrecive.data.id;
                        
                        if (forumo.id in currentForums) {
                          currentForums[forumo.id].loading = true;
                          currentForums[forumo.id].md = {
                            pid: project.id,
                            projectName: project.attributes.projectName,
                            projectPic: project.attributes.profilePic.data?.attributes?.formats?.thumbnail
                              ? project.attributes.profilePic.data.attributes.formats.thumbnail.url
                              : project.attributes.profilePic.data?.attributes?.url,
                            halukId: haluka.id,
                            transferDetails: `העברת ${haluka.attributes.amount} ל-${haluka.attributes.userrecive.data.attributes.username}`,
                            senderId: senderId,
                            receiverId: receiverId,
                            participants: [String(senderId), String(receiverId)]
                          };
                        } else {
                          currentForums[forumo.id] = {
                            loading: true,
                            md: {
                              pid: project.id,
                              projectName: project.attributes.projectName,
                              projectPic: project.attributes.profilePic.data?.attributes?.formats?.thumbnail
                                ? project.attributes.profilePic.data.attributes.formats.thumbnail.url
                                : project.attributes.profilePic.data?.attributes?.url,
                              halukId: haluka.id,
                              transferDetails: `העברת ${haluka.attributes.amount} ל-${haluka.attributes.userrecive.data.attributes.username}`,
                              senderId: senderId,
                              receiverId: receiverId,
                              participants: [String(senderId), String(receiverId)]
                            }
                          };
                        }
                        forums.push(forumo);
                      }
                    }
                  );
                }
                forum.set(currentForums);
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

           if (all === false && idsToFetch.length > 0) {
             const currentForums = get(forum);
             for (const fid of idsToFetch) {
               if (currentForums?.[fid]) {
                 currentForums[fid].loading = false;
               }
             }
             forum.set(currentForums);
           }
         }

    if (all === false && idsToFetch.length > 0) {
      for (const fid of idsToFetch) {
        inFlightForumFetches.delete(fid);
      }
    }
    return "ok"
}

export function forums(dat, myId, all = false) {
  const currentForums = get(forum);
  const forumsList = dat?.forums?.data || [];

  for (let t = 0; t < forumsList.length; t++) {
    const forumData = forumsList[t];
    const fid = String(forumData.id);
    const attrs = forumData.attributes || {};

    try {
      // 1. Prepare metadata from server response
      const project = attrs.project?.data;
      const projectPic = project?.attributes?.profilePic?.data?.attributes?.formats?.thumbnail?.url ||
        project?.attributes?.profilePic?.data?.attributes?.url;
      const mesimaName = attrs.mesimabetahaliches?.data?.[0]?.attributes?.name;
      const sheirutName = attrs.sheiruts?.data?.[0]?.attributes?.name;

      // Ensure the forum entry exists in our local copy
      if (!currentForums[fid]) {
        currentForums[fid] = { messages: [], loading: true };
      }
      
      // 2. Merge Metadata (don't overwrite existing fields if new ones are missing)
      if (!currentForums[fid].md) currentForums[fid].md = {};
      
      const md = currentForums[fid].md;
      if (project?.id) md.pid = project.id;
      if (project?.attributes?.projectName) md.projectName = project.attributes.projectName;
      if (projectPic) md.projectPic = projectPic;
      if (mesimaName) md.mesimaName = mesimaName;
      if (sheirutName) md.transferDetails = `מכירה: ${sheirutName}`;

      // 3. Process Messages locally to avoid triggering store reactivity mid-loop
      const messagesData = attrs.messages?.data || [];
      currentForums[fid].messages = messagesData.map(msg => {
        const msgAttrs = msg.attributes || {};
        const msgUser = msgAttrs.users_permissions_user?.data;
        const userPic = msgUser?.attributes?.profilePic?.data?.attributes?.formats?.thumbnail?.url ||
                       msgUser?.attributes?.profilePic?.data?.attributes?.url ||
                       'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';

        return {
          message: msgAttrs.content || '',
          what: true,
          pic: userPic,
          pending: false,
          sentByMe: String(msgUser?.id) === String(myId),
          timestamp: msgAttrs.when,
          messageId: msg.id,
          username: msgUser?.attributes?.username || ''
        };
      });

      // 4. Force loading to false for this forum
      currentForums[fid].loading = false;

    } catch (e) {
      console.error(`Error processing forum ${fid}:`, e);
      if (currentForums[fid]) {
        currentForums[fid].loading = false;
      }
    }
  }

  // Final single store update
  forum.set({ ...currentForums });
  isChatLoading.set(false);
  return "ok";
}
export function addMes(
  why = '',
  id = 0,
  pending = true,
  sentByMe = true,
  pic = '',
  date = Date.now(),
  messageId = 0,
  username = ""
) {
  console.log('📝 [addMes] Adding message to forum', { forumId: id, messageId, pending, sentByMe });
  let aarr = get(forum);
  
  // Ensure the forum entry exists
  if (!(id in aarr)) {
    aarr[id] = { messages: [] };
  }
  
  let arr = aarr[id].messages || [];
  
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
  
  // Create new references for reactivity
  aarr[id] = {
    ...aarr[id],
    messages: [...arr]
  };
  forum.set({ ...aarr });
  return;
}
export function updSend(
  id = 0,
  messageId = 0
) {
  console.log('🚀 [updSend] Marking message as sent', { forumId: id, messageId });
  let aarr = get(forum);
  let arr = aarr[id]?.messages ?? [];
  
  if (arr.length > 0) {
    // Create a new object for the last message to trigger reactivity
    const lastIndex = arr.length - 1;
    const updatedMessage = { 
      ...arr[lastIndex], 
      pending: false 
    };
    
    // Also update messageId if provided and not 0
    if (messageId) updatedMessage.messageId = messageId;
    
    // Update array with new message object
    arr[lastIndex] = updatedMessage;
    
    // Update store with deep fresh references
    aarr[id] = {
      ...aarr[id],
      messages: [...arr]
    };
    
    forum.set({ ...aarr });
  } else {
    console.warn('⚠️ [updSend] No messages found in forum to mark as sent', id);
  }
}
