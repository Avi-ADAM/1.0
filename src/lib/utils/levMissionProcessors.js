// Mission processing utilities for lev page
import { getProjectData } from '$lib/stores/projectStore.js';
import { letters, txx } from './levDataProcessors.js';
import tr from '$lib/translations/tr.json';

export function mesimabetahalicha(data, mtaha, beta, lang) {
  const mtahan = data.data.usersPermissionsUser.data.attributes.mesimabetahaliches.data;

  for (let i = 0; i < mtahan.length; i++) {
    mtaha[i] = { ...mtahan[i].attributes };
    mtaha[i].id = mtahan[i].id;
    mtaha[i].tx = txx(mtahan[i].attributes.name);
    mtaha[i].ani = 'mtaha';
    mtaha[i].azmi = 'mesima';
    mtaha[i].restime = getProjectData(
      mtahan[i].attributes.project.data.id,
      'restime'
    );
    mtaha[i].projectId = mtahan[i].attributes.project.data.id;
    mtaha[i].pl = 0 + i;
    mtaha[i].usernames = data.data.usersPermissionsUser.data.attributes.username;
    mtaha[i].noofpu = getProjectData(
      mtahan[i].attributes.project.data.id,
      'noof'
    );
    mtaha[i].projectName = getProjectData(
      mtahan[i].attributes.project.data.id,
      'pn'
    );
    mtaha[i].src = getProjectData(mtahan[i].attributes.project.data.id, 'pp');
    mtaha[i].pu = getProjectData(mtahan[i].attributes.project.data.id, 'us');
  }

  beta = mtaha.length;
  localStorage.setItem('beta', beta);
  
  return { mtaha, beta };
}

export function ishursium(dati, fiapp, fia, lang, idL) {
  const start = dati.data.usersPermissionsUser.data.attributes.projects_1s.data;
  const myid = dati.data.usersPermissionsUser.data.id;
  
  for (let i = 0; i < start.length; i++) {
    for (let j = 0; j < start[i].attributes.finiapruvals.data.length; j++) {
      const rt = letters(
        start[i].attributes.finiapruvals.data[j].attributes.missname
      );
      let src22 = getProjectData(
        start[i].id,
        'upic',
        start[i].attributes.finiapruvals.data[j].attributes
          .users_permissions_user.data.id
      );
      fiapp.push({
        uid: start[i].attributes.finiapruvals.data[j].attributes
          .users_permissions_user.data.id,
        username: getProjectData(
          start[i].id,
          'un',
          start[i].attributes.finiapruvals.data[j].attributes
            .users_permissions_user.data.id
        ),
        src: src22,
        hearotMeyuchadot:
          start[i].attributes.finiapruvals.data[j].attributes.mesimabetahalich
            .data.attributes.hearotMeyuchadot,
        missionDetails:
          start[i].attributes.finiapruvals.data[j].attributes.mesimabetahalich
            .data.attributes.descrip,
        nhours: start[i].attributes.finiapruvals.data[j].attributes.noofhours,
        mId: start[i].attributes.finiapruvals.data[j].attributes
          .mesimabetahalich.data.id,
        perhour:
          start[i].attributes.finiapruvals.data[j].attributes.mesimabetahalich
            .data.attributes.perhour,
        missId:
          start[i].attributes.finiapruvals.data[j].attributes.mesimabetahalich
            .data.attributes.mission.data.id,
        openName:
          start[i].attributes.finiapruvals.data[j].attributes.missname,
        omid: start[i].attributes.finiapruvals.data[j].id,
        askId: start[i].attributes.finiapruvals.data[j].id,
        why: start[i].attributes.finiapruvals.data[j].attributes.why,
        whatt:
          start[i].attributes.finiapruvals.data[j].attributes.what?.data
            ?.attributes?.url,
        whattid:
          start[i].attributes.finiapruvals.data[j].attributes.what?.data?.id,
        users: start[i].attributes.finiapruvals.data[j].attributes.vots,
        name: rt[0],
        stylef: rt[1],
        st: rt[2],
        projectId:
          start[i].attributes.finiapruvals.data[j].attributes.project.data.id,
        timegramaDate:
          start[i].attributes.finiapruvals.data[j].attributes.timegrama?.data?.attributes?.date || null,
        timegramaId:
          start[i].attributes.finiapruvals.data[j].attributes.timegrama?.data?.id || null,  
        projectName: getProjectData(start[i].id, 'pn'),
        noof: getProjectData(start[i].id, 'noof'),
        src2: getProjectData(start[i].id, 'pp'),
        myid: myid,
        ani: 'fiapp',
        azmi: 'ishrur',
        pl: -2
      });
    }
  }
  
  // Process voting data
  for (let k = 0; k < fiapp.length; k++) {
    const x = fiapp[k].users;
    fiapp[k].uids = [];
    for (let z = 0; z < x.length; z++) {
      fiapp[k].uids.push(x[z].users_permissions_user.data.id);
      fiapp[k].what = [];
      fiapp[k].what.push(x[z].what);
    }
  }

  for (let t = 0; t < fiapp.length; t++) {
    const allid = fiapp[t].uids;
    const myid = fiapp[t].myid;
    fiapp[t].already = false;
    fiapp[t].noofusersOk = 0;
    fiapp[t].noofusersNo = 0;
    fiapp[t].whyno = [];
    fiapp[t].whyes = [];
    fiapp[t].mypos = null;
    if (allid.includes(myid)) {
      fiapp[t].already = true;
      fiapp[t].pl += 20;

      for (let l = 0; l < fiapp[t].users.length; l++) {
        if (fiapp[t].users[l].users_permissions_user.id === myid)
          fiapp[t].mypos = fiapp[t].users[l].what;
      }
    }

    for (let r = 0; r < fiapp[t].users.length; r++) {
      if (fiapp[t].users[r].what === true) {
        fiapp[t].noofusersOk += 1;
        fiapp[t].whyes.push(fiapp[t].users[r].why);
      } else if (fiapp[t].users[r].what === false) {
        fiapp[t].noofusersNo += 1;
        fiapp[t].whyno.push(fiapp[t].users[r].why);
      }
    }

    const noofusersWaiting = fiapp[t].noof - fiapp[t].users.length;
    fiapp[t].noofusersWaiting = noofusersWaiting;
  }
  
  fia = fiapp.length;
  localStorage.setItem('fia', fia);
  
  return { fiapp, fia };
}