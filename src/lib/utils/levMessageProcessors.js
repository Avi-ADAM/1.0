// Message processing utilities for lev page
import { getProjectData } from '$lib/stores/projectStore.js';
import { montsi } from '$lib/func/montsi.svelte';
import { kindOfTranslation } from '$lib/func/kindOfTranslate.svelte';
import tr from '$lib/translations/tr.json';

export function createMessagesForAsked(dictasked, lang, idL, askMisMes) {
  if (dictasked.length > 0) {
    for (let t = 0; t < dictasked.length; t++) {
      const myid = dictasked[t].myid;
      
      dictasked[t].messeges = [];
      dictasked[t].messeges.push({
        message: `${dictasked[t].username} ${tr?.ask.askedTo[lang]} ${dictasked[t].openName}`,
        what: true,
        pic: dictasked[t].src,
        timestamp: new Date(dictasked[t].createdAt),
        sentByMe: false,
        changed: false
      });
      
      if (dictasked[t].users.length > 0) {
        for (let x = 0; x < dictasked[t].users.length; x++) {
          let src22 = getProjectData(
            dictasked[t].projectId,
            'upic',
            dictasked[t].users[x].users_permissions_user.data.id
          );
          dictasked[t].messeges.push({
            message: `${getProjectData(
              dictasked[t].projectId,
              'un',
              dictasked[t].users[x].users_permissions_user.data.id
            )}  
              ${
                dictasked[t].users[x].what == true
                  ? tr?.vots.inFavor[lang]
                  : tr?.vots.against[lang]
              } `,
            what: dictasked[t].users[x].what,
            pic: src22,
            timestamp: new Date(dictasked[t].users[x].zman),
            sentByMe: dictasked[t].users[x].users_permissions_user.data.id === myid ? true : false,
            changed: false
          });
        }
      }
      
      if (dictasked[t].chat?.length > 0) {
        for (let x = 0; x < dictasked[t].chat.length; x++) {
          let src22 = dictasked[t].pid.includes(dictasked[t].chat[x].ide)
            ? getProjectData(dictasked[t].projectId, 'upic', dictasked[t].chat[x].ide)
            : dictasked[t].src;
          dictasked[t].messeges.push({
            message: dictasked[t].chat[x].why,
            what: true,
            pic: src22,
            timestamp: new Date(dictasked[t].chat[x].zman),
            sentByMe: dictasked[t].chat[x].ide === myid ? true : false,
            changed: false
          });
        }
      }
      
      dictasked[t].messeges = dictasked[t].messeges
        .sort(function (a, b) {
          return b.timestamp - a.timestamp;
        })
        .reverse();
        
      let old = askMisMes;
      old[dictasked[t].askId] = dictasked[t].messeges;
      askMisMes = old;
    }
  }
  
  return { dictasked, askMisMes };
}

export function createNegoMessages(items, lang, myid, projectId) {
  const messages = [];
  
  for (let x = 0; x < items.length; x++) {
    let src22 = getProjectData(
      projectId,
      'upic',
      items[x].attributes.users_permissions_user.data.id
    );
    
    messages.push({
      message: `<span class="underline">${getProjectData(
        projectId,
        'un',
        items[x].attributes.users_permissions_user.data.id
      )}
        ${tr?.nego.didNego[lang]}</span>
        ${createNegoDetails(items[x], lang)}`,
      what: true,
      pic: src22,
      timestamp: new Date(items[x].attributes.createdAt),
      sentByMe: items[x].attributes.users_permissions_user.data.id === myid ? true : false
    });
  }
  
  return messages;
}

function createNegoDetails(negoItem, lang) {
  // This would contain the detailed negotiation message creation logic
  // Moving the complex negotiation message building logic here
  return ''; // Placeholder - would contain the full negotiation details
}

export function createVotingMessages(users, lang, myid, projectId) {
  const messages = [];
  
  for (let x = 0; x < users.length; x++) {
    let src22 = getProjectData(
      projectId,
      'upic',
      users[x].users_permissions_user.data.id
    );
    
    messages.push({
      message: `${getProjectData(
        projectId,
        'un',
        users[x].users_permissions_user.data.id
      )} ${tr?.vots.inFavor[lang]}`,
      what: users[x].what,
      pic: src22,
      timestamp: new Date(users[x].zman),
      sentByMe: users[x].users_permissions_user.data.id === myid ? true : false,
      changed: false
    });
  }
  
  return messages;
}