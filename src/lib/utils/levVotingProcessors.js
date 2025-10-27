// Voting and decision processing utilities for lev page
import { getProjectData } from '$lib/stores/projectStore.js';
import { getOccurrence } from '$lib/func/getOccurrence.svelte';
import tr from '$lib/translations/tr.json';

export function processVotingData(items, myid) {
  for (let k = 0; k < items.length; k++) {
    const x = items[k].users;
    items[k].uids = [];
    for (let z = 0; z < x.length; z++) {
      items[k].uids.push(x[z].users_permissions_user.data.id);
      items[k].what = [];
      items[k].what.push(x[z].what);
    }
  }

  for (let t = 0; t < items.length; t++) {
    const allid = items[t].uids;
    items[t].already = false;
    items[t].noofusersOk = 0;
    items[t].noofusersNo = 0;
    items[t].whyno = [];
    items[t].whyes = [];
    items[t].mypos = null;
    
    if (allid.includes(myid)) {
      items[t].already = true;
      items[t].pl += 20;
      for (let l = 0; l < items[t].users.length; l++) {
        if (items[t].users[l].users_permissions_user.data.id === myid)
          items[t].mypos = items[t].users[l].what;
      }
    }

    for (let r = 0; r < items[t].users.length; r++) {
      if (items[t].users[r].what === true) {
        items[t].noofusersOk += 1;
        items[t].whyes.push(items[t].users[r].why);
      } else if (items[t].users[r].what === false) {
        items[t].noofusersNo += 1;
        items[t].whyno.push(items[t].users[r].why);
      }
    }

    const noofusersWaiting = items[t].noof - items[t].users.length;
    items[t].noofusersWaiting = noofusersWaiting;
  }
  
  return items;
}

export function processComplexVoting(items, myid, orderon = null) {
  for (let k = 0; k < items.length; k++) {
    const x = items[k].users;
    items[k].uids = [];
    for (let z = 0; z < x.length; z++) {
      items[k].uids.push(x[z].users_permissions_user.data.id);
    }
  }
  
  for (let t = 0; t < items.length; t++) {
    const allid = items[t].uids;
    items[t].already = false;
    items[t].noofusersOk = 0;
    items[t].noofusersNo = 0;
    items[t].cv = 0;
    items[t].mypos = null;
    
    const currentOrder = orderon || items[t].orderon || 0;
    
    if (allid.includes(myid)) {
      for (let l = 0; l < items[t].users.length; l++) {
        if (items[t].users[l].users_permissions_user.data.id === myid) {
          if (items[t].users[l].order == currentOrder) {
            items[t].already = true;
            items[t].pl += 48;
            items[t].mypos = items[t].users[l].what;
          }
        }
      }
    }
    
    for (let r = 0; r < items[t].users.length; r++) {
      if (items[t].users[r].order == currentOrder) {
        items[t].cv += 1;
        items[t].noofusersOk += 1;
      } else {
        if (getOccurrence(items[t].uids, items[t].users[r].users_permissions_user.data.id) > 1) {
          const results = items[t].users.filter((obj) => {
            return obj.users_permissions_user.data.id === items[t].users[r].users_permissions_user.data.id;
          });
          items[t].cv += 1;
          items[t].noofusersNo += 1;
          for (let n = 0; n < results.length; n++) {
            if (results[n].order === currentOrder) {
              items[t].cv -= 1;
              items[t].noofusersNo -= 1;
            }
          }
        } else {
          items[t].cv += 1;
          items[t].noofusersNo += 1;
        }
      }
    }
    
    const noofusersWaiting = items[t].user_1s.length - items[t].cv;
    items[t].noofusersWaiting = noofusersWaiting;
  }
  
  return items;
}

export function hachla(data, hachlatot, hachlot, lang, idL) {
  const myid = data.data.usersPermissionsUser.data.id;
  let src24 = '';
  if (data.data.usersPermissionsUser.data.attributes.profilePic.data !== null) {
    src24 = data.data.usersPermissionsUser.data.attributes.profilePic.data.attributes.url;
  } else {
    src24 = '';
  }
  
  const projects = data.data.usersPermissionsUser.data.attributes.projects_1s.data;
  
  for (let i = 0; i < projects.length; i++) {
    const proj = projects[i];
    
    // Process decisions
    for (let j = 0; j < projects[i].attributes.decisions.data.length; j++) {
      const pend = projects[i].attributes.decisions.data[j].attributes;
      let newpicid;
      let newpic = "";
      if (pend.kind == 'pic') {
        newpicid = pend.newpic.data.id;
        newpic = pend.newpic.data.attributes.url;
      }
      hachlatot.push({
        newpicid: newpicid,
        mysrc: src24,
        projectId: proj.id,
        kind: pend.kind,
        created_at: pend.createdAt,
        projectName: getProjectData(proj.id, 'pn'),
        user_1s: getProjectData(proj.id, 'us'),
        src: getProjectData(proj.id, 'pp'),
        noofpu: getProjectData(proj.id, 'noof'),
        timegramaId: pend.timegrama?.data?.id || null,
        timegramaDate: pend.timegrama?.data?.attributes?.date || null,
        restime: getProjectData(proj.id, 'restime'),
        users: pend.vots,
        myid: myid,
        newpic: newpic,
        pendId: projects[i].attributes.decisions.data[j].id,
        ani: 'hachla',
        azmi: 'hachla',
        pl: 1 + pend.vots.length,
        messege: []
      });
    }
    
    // Process service requests
    for (let j = 0; j < projects[i].attributes.sheirutpends.data.length; j++) {
      const pend = projects[i].attributes.sheirutpends.data[j].attributes;
      hachlatot.push({
        mysrc: src24,
        kind: "sheirutpends",
        spdata: pend,
        projectId: proj.id,
        created_at: pend.createdAt,
        projectName: getProjectData(proj.id, 'pn'),
        user_1s: getProjectData(proj.id, 'us'),
        src: getProjectData(proj.id, 'pp'),
        noofpu: getProjectData(proj.id, 'noof'),
        timegramaId: pend.timegrama?.data?.id || null,
        timegramaDate: pend.timegrama?.data?.attributes?.date || null,
        restime: getProjectData(proj.id, 'restime'),
        users: pend.vots,
        myid: myid,
        newpic: "",
        pendId: projects[i].attributes.sheirutpends.data[j].id,
        ani: 'hachla',
        azmi: 'hachla',
        pl: 1 + pend.vots.length,
        messege: []
      });
    }
  }
  
  // Process voting data for decisions
  for (let k = 0; k < hachlatot.length; k++) {
    const x = hachlatot[k].users;
    hachlatot[k].uids = [];
    for (let z = 0; z < x.length; z++) {
      hachlatot[k].uids.push(x[z].users_permissions_user.data.id);
    }
  }
  
  for (let t = 0; t < hachlatot.length; t++) {
    const allid = hachlatot[t].uids;
    const myid = hachlatot[t].myid;
    hachlatot[t].already = false;
    hachlatot[t].noofusersOk = 0;
    hachlatot[t].noofusersNo = 0;
    hachlatot[t].cv = 0;
    hachlatot[t].mypos = null;
    
    if (allid.includes(myid)) {
      hachlatot[t].already = true;
      hachlatot[t].pl += 48;
      for (let l = 0; l < hachlatot[t].users.length; l++) {
        if (hachlatot[t].users[l].users_permissions_user.data.id === myid)
          if (hachlatot[t].users[l].order !== 1) {
            hachlatot[t].mypos = hachlatot[t].users[l].what;
          }
      }
    }
    
    for (let r = 0; r < hachlatot[t].users.length; r++) {
      if (hachlatot[t].users[r].order !== 1) {
        hachlatot[t].cv += 1;
        if (hachlatot[t].users[r].what === true) {
          hachlatot[t].noofusersOk += 1;
        } else if (hachlatot[t].users[r].what === false) {
          hachlatot[t].noofusersNo += 1;
        }
      }
    }
    
    const noofusersWaiting = hachlatot[t].user_1s.length - hachlatot[t].cv;
    hachlatot[t].noofusersWaiting = noofusersWaiting;
    
    if (hachlatot[t].users.length > 0) {
      for (let x = 0; x < hachlatot[t].users.length; x++) {
        let src22 = '';
        hachlatot[t].messege.push({
          message: `${getProjectData(
            hachlatot[t].projectId,
            'un',
            hachlatot[t].users[x].users_permissions_user.data.id
          )}  
                     ${
                       hachlatot[t].users[x].what == true
                         ? 'בעד'
                         : ` נגד
                      ${
                        hachlatot[t].users[x].why !== null
                          ? `בנימוק: ${hachlatot[t].users[x].why}`
                          : ``
                      }`
                     }`,
          what: hachlatot[t].users[x].what,
          pic: src22,
          sentByMe: hachlatot[t].users[x].users_permissions_user.data.id === myid ? true : false,
          changed: hachlatot[t].users[x].order == 1 ? true : false
        });
      }
    }
  }

  hachlot = hachlatot.length;
  localStorage.setItem('halu', hachlot);
  
  return { hachlatot, hachlot };
}