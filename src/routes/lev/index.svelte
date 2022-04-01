<script>
import Mid from "../../lib/components/lev/midi.svelte"
  import MissionInProgress from "../../lib/components/lev/missionInProgress.svelte"
    import ProjectSuggestor from "../../lib/components/lev/projectSuggestor.svelte"
   // import DecisionMaking from "../../lib/components/lev/decisionMaking.svelte";
    import Reqtojoin from '../../lib/components/lev/reqtojoin.svelte';
    import { onMount } from 'svelte';
    import PendingM from "../../lib/components/lev/pandingMesima.svelte";
    import PendingMa from "../../lib/components/lev/pmas.svelte"
    import Welcomt from "../../lib/components/lev/welcomTo.svelte";
    import Fiappru from '../../lib/components/lev/fiappru.svelte';
    import { goto } from '$app/navigation';
        import { isEqual } from 'lodash';
        import Mashsug from '../../lib/components/lev/mashsuggest.svelte'
        import Reqtom from '../../lib/components/lev/reqtom.svelte'
        import Weget from '../../lib/components/lev/weget.svelte'

let low = true;

  //  import Viewport from 'svelte-viewport-info'
    let idL;
    let meData = [];
    let miData = [];
    let token;
    let askedarr = [];
    let declineddarr = [];
    let d = [];
    let sk = [];
    var dictids = {};
    var dictasked = [];
    let askedcoin = [];
let error1 = null;
    let mtaha = [];  
let pmashd = 0;
let mashs = 0;
let maap = 0; 
    let sug =  0
let pen = 0
let ask = 0
let wel = 0;
let askma = 0;
let beta = 0
let des = 0
let fia = 0;
let fiapp = [];
let askedm = [];
let askm = 0;
let ma = 0;
let wegets = [];
function mesimabetahalicha (data) {
    const mtahan = data.data.user.mesimabetahaliches;
        for (var i = 0; i < mtahan.length; i++) {
            mtaha[i] = mtahan[i];
    }
    beta = mtaha.length;
  //  createD()
    bubleUiAngin(pends,mtaha, walcomen,askedcoin, meData );
}

function ishursium (dati){
 const start = dati.data.user.projects_1s
      const myid = dati.data.user.id;
  for (var i = 0; i < start.length; i++) {
            for (var j = 0; j < start[i].finiapruvals.length; j++){
                      const rt = letters(start[i].finiapruvals[j].missname); 
                    fiapp.push({
                            uid: start[i].finiapruvals[j].users_permissions_user.id,
                            username: start[i].finiapruvals[j].users_permissions_user.username,
                            src: start[i].finiapruvals[j].users_permissions_user.profilePic.formats.thumbnail.url,
                            hearotMeyuchadot: start[i].finiapruvals[j].mesimabetahalich.hearotMeyuchadot,
                            missionDetails: start[i].finiapruvals[j].mesimabetahalich.descrip,
                             nhours: start[i].finiapruvals[j].noofhours,
                          mId: start[i].finiapruvals[j].mesimabetahalich.id,
                             perhour: start[i].finiapruvals[j].mesimabetahalich.perhour,
                            missId: start[i].finiapruvals[j].mesimabetahalich.mission.id,
                           // deadline: start[i].asks[j].open_mission.sqadualed,
                            openName: start[i].finiapruvals[j].missname,
                            omid: start[i].finiapruvals[j].id,
                            askId: start[i].finiapruvals[j].id,
                            why: start[i].finiapruvals[j].why,
                            whatt: start[i].finiapruvals[j].what,
                            users: start[i].finiapruvals[j].vots,
                           name: rt[0],
                          stylef: rt[1], 
                           st: rt[2],
                            projectId: start[i].finiapruvals[j].project.id,
                            projectName : start[i].finiapruvals[j].project.projectName,
                            noof: start[i].finiapruvals[j].project.user_1s.length,
                            src2: start[i].finiapruvals[j].project.profilePic.formats.thumbnail.url,
                            myid: dati.data.user.id

                              });
            }
  }
    console.log(fiapp)
 for (var k = 0; k < fiapp.length; k++) {
     const x = fiapp[k].users
             fiapp[k].uids = [];
     for (var z = 0; z < x.length; z++){
      fiapp[k].uids.push(x[z].users_permissions_user.id);
              fiapp[k].what = [];
   fiapp[k].what.push(x[z].what);
 }
 }    

    for (var t = 0; t <fiapp.length; t++){
    const allid = fiapp[t].uids;
    const myid = fiapp[t].myid;
    fiapp[t].already = false;
    fiapp[t].noofusersOk = 0;
    fiapp[t].noofusersNo = 0;
    fiapp[t].whyno = [];
    fiapp[t].whyes = [];
    fiapp[t].mypos = null;
    if(allid.includes(myid)){
      fiapp[t].already = true;
    for (var l=0; l< fiapp[t].users.length; l++){
        if (fiapp[t].users[l].users_permissions_user.id === myid)
      fiapp[t].mypos = fiapp[t].users[l].what;
              }
    }

        for (var r=0; r< fiapp[t].users.length; r++){
            if (fiapp[t].users[r].what === true) {
                fiapp[t].noofusersOk += 1;
                fiapp[t].whyes.push(fiapp[t].users[r].why)
            }else if (fiapp[t].users[r].what === false) {
                 fiapp[t].noofusersNo += 1;
               fiapp[t].whyno.push(fiapp[t].users[r].why)
            }
        }

    const noofusersWaiting = fiapp[t].noof - fiapp[t].users.length;
    fiapp[t].noofusersWaiting = noofusersWaiting;
                        console.log(fiapp,"hguyg")

    }
    fiapp = fiapp
    console.log(fiapp)
    fia = fiapp.length;
//createD()
}
function crMaap(hh){
    const start = hh.data.user.projects_1s
      const myid = hh.data.user.id;
  for (var i = 0; i < start.length; i++) {
            for (var j = 0; j < start[i].maaps.length; j++){
                if(start[i].maaps.length > 0){
                      const rt = letters(start[i].maaps[j].sp.name); 
                    wegets.push({
                            uid: start[i].maaps[j].sp.users_permissions_user.id,
                            username: start[i].maaps[j].sp.users_permissions_user.username,
                            src: start[i].maaps[j].sp.users_permissions_user.profilePic.formats.thumbnail.url,
                             myp: start[i].maaps[j].sp.myp,
                            spid: start[i].maaps[j].sp.id,
                            omid: start[i].maaps[j].open_mashaabim.id,
                            askId: start[i].maaps[j].id,
                            users: start[i].maaps[j].vots,
                            openName: start[i].maaps[j].sp.name,
                            easy: start[i].maaps[j].open_mashaabim.easy,
                            price: start[i].maaps[j].open_mashaabim.price,
                            sqadualed: start[i].maaps[j].open_mashaabim.sqadualed,
                            sqadualedf: start[i].maaps[j].open_mashaabim.sqadualedf,
                            spnot: start[i].maaps[j].open_mashaabim.spnot,
                            kindOf: start[i].maaps[j].open_mashaabim.kindOf,
                            name: rt[0],
                            stylef: rt[1], 
                            st: rt[2],
                            projectId: start[i].id,
                            projectName : start[i].projectName,
                            noof: start[i].user_1s.length,
                            src2: start[i].profilePic.formats.thumbnail.url,
                            myid: hh.data.user.id
                              });
                                                                    console.log(hh.data.user.projects_1s)

            }
        }
  }
    console.log(wegets)
 for (var k = 0; k < wegets.length; k++) {
     const x = wegets[k].users
             wegets[k].uids = [];
     for (var z = 0; z < x.length; z++){
      wegets[k].uids.push(x[z].users_permissions_user.id);
              wegets[k].what = [];
   wegets[k].what.push(x[z].what);
 }
 }    

    for (var t = 0; t <wegets.length; t++){
    const allid = wegets[t].uids;
    const myid = wegets[t].myid;
    wegets[t].already = false;
    wegets[t].noofusersOk = 0;
    wegets[t].noofusersNo = 0;
    wegets[t].whyno = [];
    wegets[t].whyes = [];
    wegets[t].mypos = null;
    if(allid.includes(myid)){
      wegets[t].already = true;
    for (var l=0; l< wegets[t].users.length; l++){
        if (wegets[t].users[l].users_permissions_user.id === myid)
      wegets[t].mypos = wegets[t].users[l].what;
              }
    }

        for (var r=0; r< wegets[t].users.length; r++){
            if (wegets[t].users[r].what === true) {
                wegets[t].noofusersOk += 1;
                wegets[t].whyes.push(wegets[t].users[r].why)
            }else if (wegets[t].users[r].what === false) {
                 wegets[t].noofusersNo += 1;
               wegets[t].whyno.push(wegets[t].users[r].why)
            }
        }

    const noofusersWaiting = wegets[t].noof - wegets[t].users.length;
    wegets[t].noofusersWaiting = noofusersWaiting;
                        console.log(wegets,"hguyg")

    }
    wegets = wegets
    console.log(wegets)
    maap = wegets.length;

}
let orech;
let adder = [];
let check;
let wi = 125
function createD(){
  //  console.log('Viewport Width x Height:     ',Viewport.Width+'x'+Viewport.Height)
  //     if (Viewport.Width >= 1640){
  //        check = 15
  //    } else if (Viewport.Width >= 1240){
  //        check = 12
  //    } else if (Viewport.Width >= 950){
  //        check = 9
  //    } else {
  //        check = 6
  //    }
  //    if (Viewport.Height >= 840 && Viewport.Height < 1040){
  //     if (Viewport.Width >= 1640){
  //        check = 25
  //    } else if (Viewport.Width >= 1240){
  //        check = 20
  //    } else if (Viewport.Width >= 950){
  //        check = 15
  //    } else {
  //        check = 10
  //    }
  //    } else if (Viewport.Height >= 1040){
  //      if (Viewport.Width >= 1640){
  //        check = 35
  //    } else if (Viewport.Width >= 1240){
  //        check = 28
  //    } else if (Viewport.Width >= 950){
  //        check = 21
  //    } else {
  //        check = 14
  //    }  
  //    }
  //    if (Viewport.Width >= 550){
  //        wi = 75;
  //    }
  check = 4
     orech = fia +  sug + pen + ask + wel + beta + des;
    if (orech < check &&  adder.length === 0){
        for (var i = orech; i < check; i++){
        adder.push(
 `<svg class="svggg" viewBox="0 0 100 100" >
  <circle fill="none" id="d" cx="50" cy="50" r="50"/>
 </svg>`
        )
        }
 adder = adder
    }
}
async function createasked (da) {
  const start = da.data.user.projects_1s
  for (var i = 0; i < start.length; i++) {
            for (var j = 0; j < start[i].asks.length; j++){
                       const rt = letters(start[i].asks[j].open_mission.name);
                      let src21 = ``;
                       if (start[i].asks[j].project.profilePic){
                       src21 = start[i].asks[j].project.profilePic.formats.thumbnail.url
                    } else{
                        src21 = start[i].asks[j].project.profilePic
                    }
                    dictasked.push({
                            uid: start[i].asks[j].users_permissions_user.id,
                            username: start[i].asks[j].users_permissions_user.username,
                            src: start[i].asks[j].users_permissions_user.profilePic.formats.thumbnail.url,
                            publicklinks: start[i].asks[j].open_mission.publicklinks,
                            privatlinks: start[i].asks[j].open_mission.privatlinks,
                            hearotMeyuchadot: start[i].asks[j].open_mission.hearotMeyuchadot,
                            missionDetails: start[i].asks[j].open_mission.descrip,
                            nhours: start[i].asks[j].open_mission.noofhours,
                            perhour: start[i].asks[j].open_mission.perhour,
                            missId: start[i].asks[j].open_mission.mission.id,
                            deadline: start[i].asks[j].open_mission.sqadualed,
                            openName: start[i].asks[j].open_mission.name,
                            omid: start[i].asks[j].open_mission.id,
                            askId: start[i].asks[j].id,
                            users: start[i].asks[j].vots,
                            decid: start[i].asks[j].open_mission.declined,
                            name: rt[0],
                            stylef: rt[1], 
                            st: rt[2],
                            projectId: start[i].asks[j].project.id,
                            projectName : start[i].asks[j].project.projectName,
                            noof: start[i].asks[j].project.user_1s.length,
                            src2: src21,
                            myid: da.data.user.id
                               //   uid: start[i].asks[j].users[k].id,
                                //  omid: start[i].open_missions[j].id,
                                //  project: start[i].id
                              });
            }

  }
  dictasked = dictasked 
  console.log(dictasked) 
  if (dictasked.length > 0){
  for (var k = 0; k < dictasked.length; k++) {
     const x = dictasked[k].users
     dictasked[k].uids = [];
     dictasked[k].what = [];
     for (var z = 0; z < x.length; z++){
      dictasked[k].uids.push(x[z].users_permissions_user.id);
           dictasked[k].what.push(x[z].what);
 }
 }    

 for (var t = 0; t <dictasked.length; t++){
    const allid = dictasked[t].uids;
    const myid = dictasked[t].myid;
    dictasked[t].already = false;
     dictasked[t].noofusersOk = 0;
     dictasked[t].noofusersNo = 0;

    if(allid.includes(myid)){
      dictasked[t].already = true;
    //  dictasked.splice(t, 1);
    //  dictasked. = dictasked
    } 
    if (dictasked.length > 0 ){
        for (var r=0; r< dictasked[t].users.length; r++){
            if (dictasked[t].users[r].what === true) {
                
                 dictasked[t].noofusersOk += 1;
               
            }else if (dictasked[t].users[r].what === false) {
              
                 dictasked[t].noofusersNo += 1;
               
            }
        }}
            if (dictasked.length > 0){

    const noofusersWaiting = dictasked[t].noof - dictasked[t].users.length;
    dictasked[t].noofusersWaiting = noofusersWaiting;
        
    }}}
    var filters = [false];

 var result = dictasked.filter(val=>filters.includes(val.already)); 
 dictasked = result
  askedcoin = dictasked;
  ask = askedcoin.length;
}


async function createmask (da) {
  const start = da.data.user.projects_1s
  for (var i = 0; i < start.length; i++) {
            for (var j = 0; j < start[i].askms.length; j++){
                       const rt = letters(start[i].askms[j].open_mashaabim.name);
                      let src21 = ``;
                       if (start[i].profilePic){
                       src21 = start[i].profilePic.formats.thumbnail.url
                    } else{
                        src21 = start[i].profilePic
                    }
                    askedm.push({
                            uid: start[i].askms[j].users_permissions_user.id,
                            username: start[i].askms[j].users_permissions_user.username,
                            src: start[i].askms[j].users_permissions_user.profilePic.formats.thumbnail.url,
                            price: start[i].askms[j].open_mashaabim.price,
                            easy: start[i].askms[j].open_mashaabim.easy,
                            spnot: start[i].askms[j].open_mashaabim.spnot,
                            descrip: start[i].askms[j].open_mashaabim.descrip,
                            hm: start[i].askms[j].open_mashaabim.hm,
                            myp: start[i].askms[j].sp.myp,
                            kindOf: start[i].askms[j].open_mashaabim.kindOf,
                            spid: start[i].askms[j].sp.id,
                            deadline: start[i].askms[j].open_mashaabim.sqadualed,
                            openName: start[i].askms[j].open_mashaabim.name,
                            omid: start[i].askms[j].open_mashaabim.id,
                            askId: start[i].askms[j].id,
                            users: start[i].askms[j].vots,
                            name: rt[0],
                            stylef: rt[1], 
                            st: rt[2],
                            projectId: start[i].id,
                            projectName : start[i].projectName,
                            noof: start[i].user_1s.length,
                            src2: src21,
                            myid: da.data.user.id
                              });
            }

  }
  askedm = askedm 
  console.log(askedm) 
  if (askedm.length > 0){
  for (var k = 0; k < askedm.length; k++) {
     const x = askedm[k].users
     askedm[k].uids = [];
     askedm[k].what = [];
     for (var z = 0; z < x.length; z++){
      askedm[k].uids.push(x[z].users_permissions_user.id);
           askedm[k].what.push(x[z].what);
 }
 }    

 for (var t = 0; t <askedm.length; t++){
    const allid = askedm[t].uids;
    const myid = askedm[t].myid;
    askedm[t].already = false;
     askedm[t].noofusersOk = 0;
     askedm[t].noofusersNo = 0;

    if(allid.includes(myid)){
      askedm[t].already = true;
    //  dictasked.splice(t, 1);
    //  dictasked. = dictasked
    } 
    if (askedm.length > 0 ){
        for (var r=0; r< askedm[t].users.length; r++){
            if (askedm[t].users[r].what === true) {
                
                 askedm[t].noofusersOk += 1;
               
            }else if (askedm[t].users[r].what === false) {
              
                 askedm[t].noofusersNo += 1;
               
            }
        }}
            if (askedm.length > 0){

    const noofusersWaiting = askedm[t].noof - askedm[t].users.length;
    askedm[t].noofusersWaiting = noofusersWaiting;
        
    }}}
    var filters = [false];

 var result = askedm.filter(val=>filters.includes(val.already)); 
 askedm = result
  askedm = askedm;
  askma = askedm.length;
}


function letters(data){
    let namer = [];
    let st = 175;
    let stylef = '24px';
    if ((/[\u0590-\u05FF]/).test(data) | (/[\u0600-\u06FF]/).test(data)) {
        let sep = "";
        sep = data.split(' ').filter(w => w !== '');
        for (let i = 0; i < sep.length; i++) {
            if ((/[\u0590-\u05FF]/).test(sep[i]) | (/[\u0600-\u06FF]/).test(sep[i])) {
                namer[i] = sep[i].split("").reverse().join("");

            } else {
                namer[i] = sep[i];

            }
        }
        const x = namer.reverse().join(" ");
        data = x; 
        st = 175;
    }


 //  if (data.length >= 2 && data.length < 4) {
 //       st = 185;
 //    } 
 // else if (data.length >= 4 && data.length < 5) {
 //       st = 180;
 //    } 
 // else if (data.length >= 5 && data.length < 6) {
 //       st = 170;
 //    } else if (data.length >= 6 && data.length < 7) {
 //       st = 165
 //    } else if (data.length >= 7 && data.length < 8) {
 //       st = 160
 //    }else if (data.length >= 8 && data.length < 9) {
 //       st = 150
 //    }else if (data.length >= 9 && data.length < 10) {
 //           st = 140
 //    }else if (data.length >= 10 && data.length < 11) {
 //           st = 130;
 //    }else if (data.length >= 11 && data.length < 12) {
 //           st = 135;
 //           stylef = '29px';
 //   } else  if (data.length >= 12 && data.length <13) {
 //               st = 130;
 //               stylef = '29px';
 //    }else  if (data.length >= 13 && data.length <14) {
 //               st = 125;
 //               stylef = '25px';
 //    }else  if (data.length >= 14 && data.length <15) {
 //               st = 125;
 //               stylef = '25px';
 //    }else  if (data.length >= 15 && data.length <17) {
 //               st = 125;
 //               stylef = '25px';
 //    }else  if (data.length >= 17 && data.length <19) {
 //               st = 130;
 //               stylef = '19px';
 //    }else  if (data.length >= 19 && data.length <20) {
 //               st = 130;
 //               stylef = '17px';
 //    }else  if (data.length >= 20 && data.length <21) {
 //               st = 125;
 //               stylef = '17px';
 //    }else  if (data.length >= 21 && data.length <22) {
 //               st = 125;
 //               stylef = '16px';
 //    } else  if (data.length >= 22){
 //                      st = 125;
 //        stylef = '14px';
 //   }

    if (data.length >= 15 && data.length < 19) {
        stylef = '21px';
        st = 165
     } else if (data.length >= 19 && data.length < 20) {
            stylef = '20px';
            st = 155
     } else  if (data.length >= 20 && data.length <21) {
            stylef = '18px';
            st = 150
     } else  if (data.length >= 21){
         stylef = '16px';
         st = 145
    }
    return [data, stylef, st];
}
function deloi (event ){
   const newasked = wegets;
   const todel = event.detail.asked
   newasked.splice(todel, 1);
   wegets = newasked;
   ma = wegets.length;
   start()
}

function deloid (event ){
   const newasked = fiapp;
   const todel = event.detail.asked
   newasked.splice(todel, 1);
   fiapp = newasked;
   fia = fiapp.length;
   start()
}

function delo (event ){
   const newasked = askedcoin;
   const todel = event.detail.asked
   newasked.splice(todel, 1);
   askedcoin = newasked;
   ask = askedcoin.length;
}

function delom (event ){
   const newasked = askedm;
   const todel = event.detail.asked
   newasked.splice(todel, 1);
   askedm = newasked;
   askm = askedm.length;
}
const filterArrayd = (arr1, arr2) => {
   const filterede = arr1.filter(el => {
      return arr2.indexOf(el) === -1;
   });
   return filterede;
};
const filterArray = (arr1, arr2) => {
   const filterede = arr1.filter(el => {
      return arr2.indexOf(el) !== -1;
   });
   return filterede;
};
async function showOpenPro (mi) {
  const r = mi.data.user.askeds;
  if (r.length > 0) { 
    const p = r.map(c => c.id);
  askedarr = p;
  }
   const r1 = mi.data.user.declined;
  if (r1.length > 0) { 
    const p1 = r1.map(c => c.id);
 declineddarr = p1;
  }
    const x = mi.data.user.skills;
  const t = mi.data.user.work_ways;
  const y = mi.data.user.tafkidims;
  const mytaf = y.map(c => c.id);
  const mysk = x.map(c => c.id);

 for (var i = 0; i < y.length; i++) {
    const q = y[i].open_missions;
    var l = [];
    var z = [];
    var www = [];
    var wwn = [];
    var rate = [];
    var mtaf = [];
    var msk = [];
    for (var j = 0; j < q.length; j++) {
        l[j] = q[j].id;
        z[j] = q[j].work_ways.map(c => c.id);
        mtaf[j] = q[j].tafkidims.map(c => c.id);
        msk[j] = q[j].skills.map(c => c.id);
        const tafn = filterArrayd(mtaf[j], mytaf);
        const skn = filterArrayd(msk[j], mysk);
        if (t.length > 0) {
            var s = t.map(c => c.id);
            www[j] = filterArray(z[j], s);
            wwn[j] = filterArrayd(z[j], s);
            if (www[j].length > 0 && wwn[j].length === 0) {
                if (q[j].id in dictids) {
                    dictids[q[j].id] += 1;
                } else {
                    dictids[q[j].id] = www[j].length + 1;
                    if (msk[j].length > 0) {
                        if (mysk.length > 0) {
                            if (skn.length > 0) {
                                dictids[q[j].id] -= (skn.length * 2);
                            }
                        } else {
                            dictids[q[j].id] -= (msk[j].length * 2)
                        }
                    } 
                    if (mtaf[j].length > 0) {
                        if (tafn.length > 0) {
                            dictids[q[j].id] -= tafn.length;
                        }
                    }
                }
            } else if (www[j].length > 0 && wwn[j].length > 0) {
                if (q[j].id in dictids) {
                    dictids[q[j].id] += 1
                } else {
                    dictids[q[j].id] = 1 + www[j].length - wwn[j].length;
                    if (msk[j].length > 0) {
                        if (mysk.length > 0) {
                            if (skn.length > 0) {
                                dictids[q[j].id] -= (skn.length * 2);
                            }
                        } else {
                            dictids[q[j].id] -= (msk[j].length * 2)
                        }
                    }
                    if (mtaf[j].length > 0) {
                        if (tafn.length > 0) {
                            dictids[q[j].id] -= tafn.length;
                        }
                    }
                }
            } else if (www[j].length === 0 && wwn[j].length > 0) {
                if (q[j].id in dictids) {
                    dictids[q[j].id] += 1
                } else {
                    dictids[q[j].id] = 1 - (2 * wwn[j].length);
                    if (msk[j].length > 0) {
                        if (mysk.length > 0) {
                            if (skn.length > 0) {
                                dictids[q[j].id] -= (skn.length * 2);
                            }
                        } else {
                            dictids[q[j].id] -= (msk[j].length * 2);
                        }
                    }
                    if (mtaf[j].length > 0) {
                        if (tafn.length > 0) {
                            dictids[q[j].id] -= tafn.length;
                        }
                    }
                }
            } else if (www[j].length === 0 && wwn[j].length === 0) {
                if (q[j].id in dictids) {
                    dictids[q[j].id] += 1
                } else {
                    dictids[q[j].id] = 1;
                    if (msk[j].length > 0) {
                        if (mysk.length > 0) {
                            if (skn.length > 0) {
                                dictids[q[j].id] -= (skn.length * 2);
                            }
                        } else {
                            dictids[q[j].id] -= (msk[j].length * 2);
                        }
                    }
                    if (mtaf[j].length > 0) {
                        if (tafn.length > 0) {
                            dictids[q[j].id] -= tafn.length;
                        }
                    }
                }
            }
        } else if (t.length == 0) {
            if (q[j].id in dictids) {
                dictids[q[j].id] += 1
            } else {
                dictids[q[j].id] = 1;
                if (msk[j].length > 0) {
                    if (mysk.length > 0) {
                        if (skn.length > 0) {
                            dictids[q[j].id] -= (skn.length * 2);
                        }
                    } else {
                        dictids[q[j].id] -= (msk[j].length * 2);
                    }
                }
                if (mtaf[j].length > 0) {
                    if (tafn.length > 0) {
                        dictids[q[j].id] -= tafn.length;
                    }
                }
            }
        }
    }

    d[i] = [l, z, www, wwn, rate, dictids];

 }
  


    for (var i = 0; i < x.length; i++){
    const q = x[i].open_missions;
    var l = [];
    var z =[];
    var www = [];
    var wwn = [];
    var rate = [];
    var mtaf =[];
    var msk = [];
  for (var j = 0; j < q.length; j++){
      l[j] = q[j].id;
    z[j] = q[j].work_ways.map(c => c.id);
    mtaf[j] = q[j].tafkidims.map(c => c.id);
    msk[j] = q[j].skills.map(c => c.id);
     var s = t.map(c => c.id);
     const  tafn = filterArrayd(mtaf[j], mytaf); 
     const  skn = filterArrayd(msk[j], mysk); 
   www[j] = filterArray(z[j], s);
   wwn[j] = filterArrayd(z[j], s);  
    if (q[j].id in dictids){
          dictids[q[j].id] += 2}
      else{
   if (t.length > 0)  {
       if (www[j].length > 0 && wwn[j].length === 0) {
        dictids[q[j].id] = www[j].length + 2;
       if (skn.length > 0 ) {
        dictids[q[j].id] -= (skn.length * 2); 
        } 
       if (tafn.length > 0 ) {
        dictids[q[j].id] -= tafn.length; 
        } 
      
        } else if (www[j].length > 0 && wwn[j].length > 0) {
   
        dictids[q[j].id] = 2 + www[j].length - wwn[j].length;
        if (skn.length > 0 ) {
        dictids[q[j].id] -= (skn.length * 2); 
        } 
       if (tafn.length > 0 ) {
        dictids[q[j].id] -= tafn.length; 
        } 
   
  } else if (www[j].length === 0 && wwn[j].length > 0){
    
        dictids[q[j].id] = 2 - (2 * wwn[j].length);
        if (skn.length > 0 ) {
        dictids[q[j].id] -= (skn.length * 2); 
        } 
       if (tafn.length > 0 ) {
        dictids[q[j].id] -= tafn.length; 
        } 
      
  } else if (www[j].length === 0 && wwn[j].length === 0){
    
        dictids[q[j].id] = 2;
        if (skn.length > 0 ) {
        dictids[q[j].id] -= (skn.length * 2); 
        } 
       if (tafn.length > 0 ) {
        dictids[q[j].id] -= tafn.length;  
  }
   }
   }
   else if (t.length === 0){
   
        dictids[q[j].id] = 2;     
        if (skn.length > 0 ) {
        dictids[q[j].id] -= (skn.length * 2); 
        } 
       if (tafn.length > 0 ) {
        dictids[q[j].id] -= tafn.length; 
     }
    }
  }
    
 }
   
    
 sk[i] = [l, z, www, wwn, rate]; 


    } 
 let asanddec =  askedarr.concat(declineddarr);
 asanddec = [...new Set([...askedarr,...declineddarr])];
  const filteredw = Object.keys(dictids)
  .filter(key => !asanddec.includes(key))
  .reduce((obj, key) => {
    obj[key] = dictids[key];
    return obj;
  }, {});
 var keysSorted = Object.keys(filteredw).sort(function(a,b){return filteredw[a]-filteredw[b]})
 // add declined filter add sort by value
 if (keysSorted.length > 0){
  var resultString = keysSorted.join('&id_in=');
 let link ="https://oneloveone.onrender.com/open-missions?id_in=" + resultString ;
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
        const parseJSON = (resp) => (resp.json ? resp.json() : resp);
        const checkStatus = (resp) => {
        if (resp.status >= 200 && resp.status < 300) {
          return resp;
        }
        return parseJSON(resp).then((resp) => {
          throw resp;
        });
      };
      const headers = {
        'Content-Type': 'application/json'   
      };
        try {
            const res = await fetch(link, {
              method: 'GET',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
            }).then(checkStatus)
          .then(parseJSON);
            meData = res;
        } catch (e) {
            error1 = e
        }
        for (var i = 0; i <meData.length; i++){
            if(meData[i].project.profilePic){
         meData[i].srcb = meData[i].project.profilePic.formats.thumbnail.url
            }
        }}
        sug = meData.length;
     createD()

    };
    // מיון ראשוני עדיף לפי האם סיים כבר משימה כזו 

     let nam = ""
        let total = ""
              let  picLink = ""
    function midd (min){
        const dd = min.data.user
         nam = dd.username
         total = dd.total
        if (dd.profilePic.formats.thumbnail.url){
      picLink = dd.profilePic.formats.thumbnail.url
        } else if (dd.profilePic.small.thumbnail.url){
        picLink = dd.profilePic.small.thumbnail.url
        } else if (dd.profilePic.url){
                 picLink = dd.profilePic.url
        }
    }
    let tickSpeed = 60000 * 5;
let sdsa = [];

let miDataold = [];

let counter = 0;

onMount(async () => {
      if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js', { scope: '/' }).then(function(reg) {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}; 
  const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  if (cookieValue != null) {
      const cookieValu = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
  token  = cookieValu; 
  start ();
  setInterval(start, tickSpeed);

  } else {
            goto ("/",)
    }
})
let walcomenold= [];
async function start () { 
  console.log("start");
  miDataold = miData
    let bearer1 = 'bearer' + ' ' + token;
    let link ="https://oneloveone.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
`{ user (id:${idL})  
          { 
              haskama
          askms (where:{archived: false }){ id
                                    vots  {what why id users_permissions_user {id}}
                                     open_mashaabim { id  price descrip spnot kindOf  sqadualedf sqadualed linkto created_at hm name easy }
                                      project {projectName id user_1s {id} profilePic {url formats }}
                                       users_permissions_user {haskama username id profilePic {url formats } } }
              sps {id name price myp mashaabim {id price open_mashaabims (where:{archived: false } ){ declinedsps { id } id price descrip spnot kindOf users { id }  sqadualedf sqadualed linkto created_at hm name easy project {projectName id user_1s {id}
                            profilePic {url formats }}}}} 
              mesimabetahaliches  (where:{forappruval: false, finnished: false }){
             id stname timer hearotMeyuchadot name descrip hoursassinged perhour privatlinks publicklinks howmanyhoursalready  admaticedai mission {id}
              project{projectName id user_1s {id}
                            profilePic {url formats }}}
            welcom_tops (where:{clicked: false }){
                project { id projectName}
            }
              skills 
            { id open_missions(where:{archived: false }) 
                { id skills { id } 
                    tafkidims {id}  
                    work_ways { id} 
                } 
                }
                id
                username
                hervachti
                 profilePic {url formats }  
                     askeds  { id} 
                     declined { id} 
                     work_ways { id } 
                     tafkidims { id 
                        open_missions (where:{archived: false }) { id 
                            skills { id } 
                            work_ways { id } 
                            tafkidims {id}
                        } 
                        } 
                            projects_1s { projectName id user_1s {id haskamaz haskamac haskama} profilePic {url formats } 
                            maaps(where:{archived: false }){id created_at name  sp{id name myp users_permissions_user { username id profilePic {url formats } }}
                            open_mashaabim{id name sqadualed sqadualedf kindOf spnot easy} vots {what why id users_permissions_user { id}}}
                                pmashes (where:{archived: false }){ id hm project {projectName id 
                                        profilePic {url formats } 
                                        user_1s { id haskama}
                                } sqadualedf sqadualed linkto created_at name descrip easy price kindOf spnot mashaabim {id} diun {what why id users_permissions_user {id} order}  users  {what why id users_permissions_user {id}}} 
                                open_mashaabims { id name project { id } mashaabim { sps {name price kindOf spnot id myp users_permissions_user {username id profilePic {url formats }}}}}  
                                askms(where:{archived: false }){ id 
                                     vots  {what why id users_permissions_user {id}}
                                       users_permissions_user { username id profilePic {url formats } }
                        open_mashaabim { id  price descrip spnot kindOf  sqadualedf sqadualed linkto created_at hm name easy }
                          sp { id price myp }}
                                asks (where:{archived: false }){ id
                                    vots  {what why id users_permissions_user {id}}
                                     open_mission { id mission {id} declined { id} sqadualed publicklinks noofhours perhour privatlinks descrip hearotMeyuchadot name}
                                      project {projectName id user_1s {id} profilePic {url formats }}
                                       users_permissions_user { username id profilePic {url formats } } }
                                finiapruvals (where:{archived: false}) {
              id missname why what {url formats} noofhours mesimabetahalich {id perhour hearotMeyuchadot descrip mission {id} } vots  {what why id users_permissions_user {id}}
            project {projectName id 
                                        profilePic {url formats } 
                                        user_1s { id}
            } users_permissions_user { username id profilePic {url formats } } }
                                       pendms (where:{archived: false }) {id name hearotMeyuchadot descrip noofhours perhour sqadualed
                                    privatlinks publicklinks
                                    rishon {id}
                                    skills { id skillName}
                                    tafkidims {id roleDescription}
                                    work_ways {id workWayName} 
                                    mission { id}
                                    vallues { id}
                                    users  {what why id users_permissions_user {id}} 
                                    project {projectName id 
                                        profilePic {url formats } 
                                        user_1s { id}
                                }
                            }
                                     open_missions(where:{archived: false }) {id declined { id} users  {id} } 
                                    } 
                                 }
}`
        })
  })
  .then(r => r.json())
  .then(data => miData = data);
  counter += 1;
  if (isEqual(miData,miDataold)) {
   console.log("nada")
   } else {
      console.log("tada")
   console.log (miData)
   miData = miData
   askedm = [];
   fiapp = [];
   dictasked = [];
   pends = [];
   adder = [];
   walcomenold = walcomen;
   walcomen = [];
   askedcoin = [];
   mtaha = [];
   meData = [];
    sdsa = [];
    pmashes = [];
    huca = [];
    wegets=[];
                 midd(miData);
            makeWalcom(miData);
           showOpenPro (miData);
           createasked (miData); // לא עבד כשלא היו משימות פתוחות.. כפילויות אחרי מחיקה
           createpends (miData);
           mesimabetahalicha (miData);
          ishursium(miData);
          sds(miData);
          pmash(miData)
          sps(miData)
          createmask(miData)
          crMaap(miData)
                  low = false

      //    createD()
  }
        } catch (e) {
            error1 = e
                        goto ("/login",)
        }
} ;
let pmashes = [];
let huca = [];
function mdon(){
    start()
}

function sps(pp){
         
      for (let i = 0; i < pp.data.user.sps.length; i++){
        const y = pp.data.user.sps[i];
                  console.log("ppkk", huca)
          if (y.mashaabim.open_mashaabims.length > 0){
                        console.log("pp", huca)

                for (let t = 0; t < pp.data.user.sps[i].mashaabim.open_mashaabims.length; t++){
               const  x = pp.data.user.sps[i].mashaabim.open_mashaabims[t]
                const z = pp.data.user.sps[i].mashaabim.open_mashaabims[t].project;
                        const declineddarra = pp.data.user.sps[i].mashaabim.open_mashaabims[t].declinedsps.map(c => c.id)
                if (!declineddarra.includes(y.id)){
  huca.push({
      declineddarra: declineddarra,
                projectid: z.id,
                projectName: z.projectName,
                srcb: z.profilePic.formats.thumbnail.url,
                 id:  x.id,
                 price: x.price,
                 mashname: x.name,
                 myp: y.myp,
                 easy: x.easy,
                 kindOf: x.kindOf,
                 spnot: x.spnot,
                 descrip: x.descrip,
                 oid: y.id,
                 already: false
  })
 }
                }}
      }
      huca = huca
 mashs = huca.length
    }
 
let penm = 0;
function pmash (data) {
    //rishonnnn so to create openM first avilable only to rishon then to rest of users..
    const myid = data.data.user.id;
    const projects = data.data.user.projects_1s;
    for (var i = 0; i < projects.length; i++) {
        for (var j = 0; j < projects[i].pmashes.length; j++) {
            console.log("gi")

            const pend = projects[i].pmashes[j]
                    pmashes.push({
                                  name: pend.name,
                                  projectId: pend.project.id,
                                  hearotMeyuchadot: pend.spnot,
                                  descrip: pend.descrip,
                                  kindOf: pend.kindOf,
                                  created_at: pend.created_at,
                                  projectName: pend.project.projectName,
                                  user_1s: pend.project.user_1s,
                                  src: pend.project.profilePic.formats.thumbnail.url,
                                  users: pend.users,
                                  myid: myid,
                                  mshaabId: pend.mashaabim.id, 
                                  hm: pend.hm,
                                  price: pend.price,
                                  easy: pend.easy,
                                  linkto: pend.linkto,
                                  sqadualed: pend.sqadualed,
                                   sqadualedf: pend.sqadualedf,
                                   pendId: pend.id,
                                   diun: pend.diun,
                              });
               
    }
     }
   console.log("gi")
   for (var k = 0; k < pmashes.length; k++) {
     const x = pmashes[k].users
             pmashes[k].uids = [];
     for (var z = 0; z < x.length; z++){
      pmashes[k].uids.push(x[z].users_permissions_user.id);
              pmashes[k].what = [];
   pmashes[k].what.push(x[z].what);
 }
 }    

    for (var t = 0; t <pmashes.length; t++){
    const allid = pmashes[t].uids;
    const myid = pmashes[t].myid;
    pmashes[t].already = false;
    pmashes[t].noofusersOk = 0;
    pmashes[t].noofusersNo = 0;
    pmashes[t].whyno = [];
    pmashes[t].whyes = [];
    pmashes[t].mypos = null;
    if(allid.includes(myid)){
      pmashes[t].already = true;
    for (var l=0; l< pmashes[t].users.length; l++){
        if (pmashes[t].users[l].users_permissions_user.id === myid)
      pmashes[t].mypos = pmashes[t].users[l].what;
              }
    }
        for (var r=0; r< pmashes[t].users.length; r++){
            if (pmashes[t].users[r].what === true) {
                pmashes[t].noofusersOk += 1;
                pmashes[t].whyes.push(pmashes[t].users[r].why)
            }else if (pmashes[t].users[r].what === false) {
                 pmashes[t].noofusersNo += 1;
               pmashes[t].whyno.push(pmashes[t].users[r].why)
            }
        }
    const noofusersWaiting = pmashes[t].user_1s.length - pmashes[t].users.length;
    pmashes[t].noofusersWaiting = noofusersWaiting;
        
    }
    pmashd = pmashes.length;
    console.log(pmashes)
   // bubleUiAngin(pends)
}

function sds (mta) {
    console.log("sdsa")
  for (let i = 0; i < mta.data.user.projects_1s.length; i++){
    if (mta.data.user.projects_1s[i].open_mashaabims.length > 0){
  for (let j = 0; j < mta.data.user.projects_1s[i].open_mashaabims.length; j++){
  for (let m = 0; m < mta.data.user.projects_1s[i].open_mashaabims[j].mashaabim.sps.length; m++){
      const y = mta.data.user.projects_1s[i].open_mashaabims[j]
      const z = mta.data.user.projects_1s[i]
  const x = mta.data.user.projects_1s[i].open_mashaabims[j].mashaabim.sps[m];
                      sdsa.push({
                projectid: z.id,
                projectName: z.projectName,
                srcb: z.profilePic.formats.thumbnail.url,
                 id:  x.id,
                 price: x.price,
                 mashname: x.name,
                 myp: x.myp,
                 kindOf: x.kindOf,
                 spnot: x.spnot,
                 descrip: x.descrip,
                 oid: y.id
                      })
  }
  }
 }
 }
 sdsa = sdsa
 console.log(sdsa, "u")
}
let walcomen = [] ;
function makeWalcom (ata) {
        const usernames = ata.data.user.username;

    for (var i = 0; i < ata.data.user.welcom_tops.length; i++) {
       const wal = ata.data.user.welcom_tops[i];
        walcomen.push({
    id: wal.project.id,
    username: usernames,
    projectName: wal.project.projectName,
  })
    }
    walcomen = walcomen;
    wel = walcomen.length;
      if (!isEqual(walcomen,walcomenold) && counter > 1 ) {
        if (walcomenold.length < walcomen.length){
    // Create and show the notification
    const rikn = walcomen[walcomen.length - 1].projectName
    
    let img = 'https://res.cloudinary.com/love1/image/upload/v1648817031/maskable_icon_x128_tt2kgj.png';
    let text = `שלום ${usernames} ! הצטרפת בהצלחה לרקמת ${rikn}` ;
    navigator.serviceWorker.register('sw.js');
Notification.requestPermission(function(result) {
  if (result === 'granted') {
    navigator.serviceWorker.ready.then(function(registration) {
      registration.showNotification('1❤️1', { body: text, icon: img });
    });
  }
});
  
   // let notification = new Notification('1❤️1', { body: text, icon: img });
        }
    }

}    

let pends = [];
function createpends (data) {
    //rishonnnn so to create openM first avilable only to rishon then to rest of users..
    const myid = data.data.user.id;
    const projects = data.data.user.projects_1s;
    for (var i = 0; i < projects.length; i++) {
        for (var j = 0; j < projects[i].pendms.length; j++) {
            const pend = projects[i].pendms[j]
                    pends.push({
                                  name: pend.name,
                                  projectId: pend.project.id,
                                  hearotMeyuchadot: pend.hearotMeyuchadot,
                                  descrip: pend.descrip,
                                  noofhours: pend.noofhours,
                                  perhour: pend.perhour,
                                  projectName: pend.project.projectName,
                                  user_1s: pend.project.user_1s,
                                  src: pend.project.profilePic.formats.thumbnail.url,
                                  users: pend.users,
                                  myid: myid,
                                  missionId: pend.mission.id, 
                                  skills: pend.skills,
                                  tafkidims: pend.tafkidims,
                                  workways: pend.work_ways,
                                  vallues: pend.vallues,
                                  privatlinks: pend.privatlinks,
                                   publicklinks: pend.publicklinks,
                                   mdate: pend.sqadualed,
                                   pendId: pend.id,
                              });
               
 }
 }
 for (var k = 0; k < pends.length; k++) {
     const x = pends[k].users
     for (var z = 0; z < x.length; z++){
        pends[k].uids = [];
      pends[k].uids.push(x[z].users_permissions_user.id);
              pends[k].what = [];

           pends[k].what.push(x[z].what);
 }
 }    

 for (var t = 0; t <pends.length; t++){
    const allid = pends[t].uids;
    const myid = pends[t].myid;
    pends[t].already = false;
 pends[t].noofusersOk = 0;
 pends[t].noofusersNo = 0;

    if(allid.includes(myid)){
      pends[t].already = true;
          
    }
        for (var r=0; r< pends[t].users.length; r++){
            if (pends[t].users[r].what === true) {
                
                 pends[t].noofusersOk += 1;
               
            }else if (pends[t].users[r].what === false) {
              
                 pends[t].noofusersNo += 1;
               
            }
        }
    const noofusersWaiting = pends[t].user_1s.length - pends[t].users.length;
    pends[t].noofusersWaiting = noofusersWaiting;
        
    }
    pen = pends.length;
    bubleUiAngin(pends)
}
function less (event) {
    const id = event.detail.id;
    const newdata = meData;
    const y = meData.map(c => c.id);
    const index = y.indexOf(id);
    newdata.splice(index, 1);
    meData = newdata;
    start()
};  
function lessi (event) {
    const id = event.detail.id;
    const newdata = huca;
    const y = huca.map(c => c.id);
    const index = y.indexOf(id);
    newdata.splice(index, 1);
    huca = newdata;
    start()
};  
let shows = true;
function show(event){
    shows = true;
}

function coinLapach (event){
  start()
}

// one function to rull them all , pass all the difrrent to one arry then to sort by important then to have them render with if to check wwhat kind and which component.....
function showonly (event){
  const value = event.detail.data;
  let hide = document.querySelectorAll(".fiap, .welc, .sugg, .pend, .asks,.betaha, .desi, .ppmash, .pmashs, .pmaap, .askmap" )
  for(let i=0;i<hide.length;i++){
        hide[i].style.display='none'}
  let show = document.getElementsByClassName(value)
          for(let i=0;i<show.length;i++){
          show[i].style.display=''}

}
function showall (event){
 var show = document.querySelectorAll(".fiap, .welc, .sugg, .pend, .asks,.betaha, .desi, .ppmash, .pmashs, .pmaap, .askmap" )

     for(let i=0;i<show.length;i++){
        show[i].style.display=''}
}
function bubleUiAngin(pendsi, mtahai, walcomeni ,askedcoini, meDatai ){
// let arr1 = [...pendsi, ...mtahai, ...walcomeni, ...askedcoini, ...meDatai];
}
</script>

<svelte:head>
  <title>לב 1❤️1</title>
</svelte:head>
<!-- לשים בלוק של פוראיצ' על כל משימה בתהליך  הצעת משימה והחלטה ולמשוך שם משימה וכו' משם -->
<div class="screen"> 
    
{#each adder as add }
   {@html add}
 {/each}
 

{#each mtaha as taha, i}
   <div class="betaha normSml" style="display:'';"><MissionInProgress
    noofpu={taha.project.user_1s.length}
    oldzman={taha.timer}
    stname={taha.stname}
    mId={taha.id}
    missId={taha.mission.id}
    missionName={taha.name}
    projectId={taha.project.id}
    projectName={taha.project.projectName}
    missionDetails={taha.descrip}
    src={taha.project.profilePic.formats.thumbnail.url}
    link={taha.privatlinks}
    dueDateOrCountToDedline ={taha.admaticedai}
    hoursdon ={taha.howmanyhoursalready}
    hourstotal = {taha.hoursassinged}
    perhour = {taha.perhour}
    on:done={mdon}
    /></div>

{/each}
{#each pmashes as pen, i}
    <div  class="normSml ppmash" style="display:''"
 ><PendingMa
        on:show={show}
        on:coinLapach={coinLapach}
        mypos={pen.mypos}
        diun={pen.diun}
        whyno={pen.whyno}
      descrip={pen.descrip}
      projectName = {pen.projectName}
      name = {pen.name}
              hearotMeyuchadot = {pen.hearotMeyuchadot}
              kindOf = {pen.kindOf} 
              src = {pen.src}
               noofusersWaiting={pen.noofusersWaiting}
                projectId={pen.projectId}
                uids={pen.uids}
                what={pen.what}
                noofusersOk={pen.noofusersOk}
                created_at={pen.created_at}
                noofusersNo={pen.noofusersNo}
                already={pen.already}
                noofusers={pen.user_1s.length}
                mshaabId={pen.mshaabId}
                hm={pen.hm}
                price={pen.price}
                easy={pen.easy}
                sqadualed={pen.sqadualed}
                sqadualedf={pen.sqadualedf}
                linkto={pen.linkto}
                pendId={pen.pendId}
                users={pen.users}
                shows={shows}
                /></div>
{/each}

{#each pends as pen, i}
    <div  class="normSml pend" style="display:''"
 ><PendingM
        on:show={show}
        on:coinLapach={coinLapach}
      descrip={pen.descrip}
      projectName = {pen.projectName}
      name = {pen.name}
              hearotMeyuchadot = {pen.hearotMeyuchadot}
              noofhours = {pen.noofhours} 
              src = {pen.src}
               noofusersWaiting={pen.noofusersWaiting}
                projectId={pen.projectId}
                uids={pen.uids}
                what={pen.what}
                noofusersOk={pen.noofusersOk}
                total={pen.noOfHours * pen.perhour}
                perhour={pen.perhour}
                noofusersNo={pen.noofusersNo}
                already={pen.already}
                noofusers={pen.user_1s.length}
                missionId={pen.missionId}
                skills={pen.skills}
                tafkidims={pen.tafkidims}
                workways={pen.workways}
                mdate={pen.mdate}
                vallues={pen.vallues}
                pendId={pen.pendId}
                users={pen.users}
                shows={shows}
                /></div>
{/each}
    
{#each  wegets  as da, i}
        <div  class="pmaap normSml" style="display:'';"><Weget
            on:acsept={deloid}
            on:decline={deloid}
            mId={da.mId}
            noofusersWaiting={da.noofusersWaiting}
            uids={da.uids}
            kindOf={da.kindOf}
            noofusersOk={da.noofusersOk}
            noofusersNo={da.noofusersNo}
            already={da.already}
            users={da.users}
            askId={da.askId}
            myp={da.myp}
            projectName = {da.projectName}
            useraplyname ={da.username}
            userId ={ da.uid} 
            spid = {da.spid} 
            src = {da.src}
            price={da.price}
            hm={da.hm}
            src2 = {da.src2}
            why={da.why}
            whatt={da.whatt}
            missionBName={da.openName}
            name={da.name}
            projectId={da.projectId}
               noofpu={da.noof}
            sqadualedf={da.sqadualedf}
             sqadualed={da.sqadualed}
            spnot={da.spnot}
            easy ={da.easy}
            nhours={da.nhours}
            deadline={da.deadline}
                missId={da.missId}
                id={da.id}
                openMid={da.omid}
                stylef={da.stylef}
                st={da.st}
                declined={da.decid}
                /></div>
{/each}
    
{#each  fiapp  as da, i}
        <div  class="fiap normSml" style="display:'';"><Fiappru
            on:acsept={deloi}
            on:decline={deloi}
            mId={da.mId}
            noofusersWaiting={da.noofusersWaiting}
            uids={da.uids}
            what={da.what}
            noofusersOk={da.noofusersOk}
            noofusersNo={da.noofusersNo}
            already={da.already}
            users={da.users}
            askId={da.askId}
            projectName = {da.projectName}
            useraplyname ={da.username}
            userId ={ da.uid} 
            missionDetails = {da.descrip} 
            src = {da.src}
            src2 = {da.src2}
            why={da.why}
            whatt={da.whatt}
            missionBName={da.openName}
            name={da.name}
            projectId={da.projectId}
               noofpu={da.noof}
            publicklinks={da.publicklinks}
             privatlinks={da.privatlinks}
            hearotMeyuchadot={da.hearotMeyuchadot}
            valph ={da.perhour}
            nhours={da.nhours}
            deadline={da.deadline}
                missId={da.missId}
                id={da.id}
                openMid={da.omid}
                stylef={da.stylef}
                st={da.st}
                declined={da.decid}
                /></div>
{/each}

{#each  walcomen  as aba, i} 
   <div  class="normSml welc" style="display:'';"><Welcomt 
    id={aba.id}
       username={aba.username}
       projectName={aba.projectName}
       /></div>
{/each}



{#each  askedcoin  as da, i}
        <div  class="asks normSml" style="display:'';"><Reqtojoin
            on:acsept={delo}
            on:decline={delo}
            noofusersWaiting={da.noofusersWaiting}
            uids={da.uids}
            what={da.what}
            noofusersOk={da.noofusersOk}
            noofusersNo={da.noofusersNo}
            already={da.already}
            users={da.users}
            askId={da.askId}
            projectName = {da.projectName}
            useraplyname ={da.username}
            userId ={ da.uid} 
            missionDetails = {da.descrip} 
            src = {da.src}
            src2 = {da.src2}
            openmissionName={da.openName}
            name={da.name}
            projectId={da.projectId}
               noofpu={da.noof}
            publicklinks={da.publicklinks}
             privatlinks={da.privatlinks}
            hearotMeyuchadot={da.hearotMeyuchadot}
            valph ={da.perhour}
            nhours={da.nhours}
            deadline={da.deadline}
                missId={da.missId}
                id={da.id}
                openMid={da.omid}
                stylef={da.stylef}
                st={da.st}
                declined={da.decid}
                /></div>
{/each}

{#each  askedm  as da, i}
        <div  class="askmap normSml" style="display:'';"><Reqtom
            on:acsept={delom}
            on:decline={delom}
            noofusersWaiting={da.noofusersWaiting}
            uids={da.uids}
            what={da.what}
            noofusersOk={da.noofusersOk}
            noofusersNo={da.noofusersNo}
            already={da.already}
            users={da.users}
            askId={da.askId}
            projectName = {da.projectName}
            useraplyname ={da.username}
            userId ={ da.uid} 
            missionDetails = {da.descrip} 
            src = {da.src}
            src2 = {da.src2}
            openmissionName={da.openName}
            name={da.name}
            projectId={da.projectId}
               noofpu={da.noof}
            myp={da.myp}
             easy={da.easy}
            spnot={da.spnot}
            price ={da.price}
            deadline={da.deadline}
                missId={da.missId}
                id={da.id}
                openMid={da.omid}
                stylef={da.stylef}
                st={da.st}
                declined={da.decid}
                spid={da.spid}
                /></div>
{/each}

{#each meData as data, i}
    <div  class="sugg normSml" style="display:''"><ProjectSuggestor
      on:less={less}
      askedarr={askedarr}
      {declineddarr}
      deadLine = {data.sqadualed}
      oid = {data.id}
              projectName = {data.project.projectName}
              role ={data.tafkidims.map(c => c.roleDescription)}
              skills ={ data.skills.map(c => c.skillName)} 
              missionDetails = {data.descrip} 
              notes = {data.hearotMeyuchadot}
              src = {data.srcb}
               missionName={data.name}
                projectId={data.project.id}
                workways={data.workways}
                noOfHours={data.noOfHours}
                perhour={data.perhour}
                total={data.noofhours * data.perhour}
                /></div>
{/each}
{#each huca as data, i}
    <div  class="pmashs normSml" style="display:''"><Mashsug
      on:less={lessi}
      i={i}
      askedarr={askedarr}
     declineddarra= {data.declineddarra}
      deadLine = {data.sqadualed}
      oid = {data.oid}
      id = {data.id}
      price= {data.price}
      myp={data.myp}
      already= {data.already}
              projectName = {data.projectName}
              missionDetails = {data.descrip} 
              notes = {data.hearotMeyuchadot}
              src = {data.srcb}
               mashName={data.mashname}
                projectId={data.projectid}
                descrip={data.descrip}
                spnot={data.spnot}
                easy={data.easy}
                /></div>
    {/each}

<!--
        <div  class="normSml desi" style="display:'';"><DecisionMaking  decisionName={"?לפתוח קבוצת ווצאפ"} projectName={"פסיפס"} projectId={6}/></div> 
    <div class="normSml desi"><DecisionMaking decisionName={"?מה לבנות קודם"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"} deadLine={"10.7.2021"}/></div> 


   <div class="normSml"><DecisionMaking decisionName={"?להוסיף גם מכירה"} projectName={"BARB"} src={"barbi.jpeg"} projectId={2}/></div> 
  <div class="normSml"><ProjectSuggestor missionName={"לבנות וידאו צ'ט"} projectId={1}/></div>
   <div class="normSml"><MissionInProgress missionName={" מפת מיקום החותמים"} projectId={1}/></div>
   <div class="normSml"><DecisionMaking decisionName={"?לחפש מתכנת"} projectName={"BARB"} projectId={2} src={"barbi.jpeg"}/></div> 
  <div class="normSml"><ProjectSuggestor missionName={"להוסיף דאטהבייס"} projectId={1}/></div> 
   <div class="normSml"><MissionInProgress missionName={" עיצוב עמוד הבית"} projectName= {"BARB"} projectId={2} src={"barbi.jpeg"}/></div>
    <div class="normSml"><ProjectSuggestor missionName={"בניית מערכת תשלומים"} projectId={1}/></div>
    <div class="normSml"><MissionInProgress missionName={" הרשמה ולוגין"} projectId={1}/></div>
   <div class="normSml"><ProjectSuggestor missionName={"תמונות לחיצות"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
 
    <div class="normSml"><MissionInProgress missionName={" צור ריקמה חדש "} projectId={1}/></div>
    <div class="normSml"><ProjectSuggestor missionName={"סליקה ותשלומים"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
    <div class="normSml"><MissionInProgress missionName={"מנוע מיון בועות "} projectId={1}/></div>
    <div class="normSml"><DecisionMaking decisionName={"?לחפש מתכנת"} projectId={1}/></div> 
    <div class="normSml"><DecisionMaking decisionName={"?מה לבנות קודם"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"} deadLine={"10.7.2021"}/></div> 
    <div class="normSml"><DecisionMaking decisionName={"?לחפש קופירייטר"} projectId={1}/></div> 
   <div class="normSml"><ProjectSuggestor missionName={"פרסום בפייסבוק"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
   <div class="normSml"><MissionInProgress missionName={" חיבור לסטראפי של בועות"} projectId={1}/></div>
    <div class="normSml"><ProjectSuggestor missionName={"קמפיין פייסבוק"} projectId={1}/></div>
    <div class="normSml"><MissionInProgress missionName={" עיצוב עמוד מוצר "} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
    <div class="normSml"><ProjectSuggestor missionName={"קמפיין טיקטוק"} projectId={1}/></div>
    <div class="normSml"><MissionInProgress missionName={" הצעות לרקמות strapiב "} projectId={1}/></div>
    <div class="normSml"><DecisionMaking  decisionName={"?לחפש מתכנת"} projectName={"פסיפס"} projectId={6}/></div> 
    <div class="normSml"><MissionInProgress missionName={" החלטות strapiב "} projectId={1} /></div>
   <div class="normSml"><ProjectSuggestor missionName={"ייעוץ משפטי"} projectId={1}/></div>
   <div class="normSml"><MissionInProgress missionName={" משימות strapiב "} projectId={1}/></div>
    <div class="normSml"><ProjectSuggestor  missionName={"הנהלת חשבונות"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
    <div class="normSml"><MissionInProgress missionName={"הזנת מוצרים"}  projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
   <div class="normSml"><ProjectSuggestor missionName={"ייבוא מסין"} projectId={2} projectName={"BARB"} src={"barbi.jpeg"}/></div>
-->
    <div 
 class="midCom">
        <Mid 
on:showall={showall}
on:showonly={showonly}
{total}
picLink={picLink} {ask}
{wel}
name={nam}
{low}
{sug}
{pen}
{beta}
{fia}
pmash={pmashd}
{mashs}
{maap}
{askma}
des={0}  />
    </div>
</div> 



<style>
 
  /*  .svggg{
        min-width:75px; 
        min-height:75px;
        aspect-ratio: 1;
    }
@media (min-width:550){
     .svggg{
        width:125px; 
        height:125px;
    }
} */
    @media  (max-width: 839px) {
    
    .screen{
background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);        display: grid;
        grid-template-columns: repeat(4, 1fr);
                grid-template-rows: repeat(4, 1fr);

        grid-row: center;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
        overflow: scroll;
    }

    .midCom{
    grid-row: 2/ 4;
    grid-column: 2 /4;
    align-self: center;
   /* justify-self: center;*/
    border-radius: 50%; 
    }

    .normSml{
    align-items: center;
    }
   
    .normSml:hover{
        
        border-radius: 50%;
    }
}
  
    @media (min-width: 840px){
    
    .screen{
background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
        display: grid;
        grid-template-columns: repeat(6, 1fr);
                grid-template-rows: repeat(4, 1fr);

        grid-row: center;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
        overflow: scroll;
    }
    .midCom{
        grid-row: 2 / 4;
    grid-column: 3 /5;
      align-self: center;
      
        border-radius: 50%; 
    }

    .normSml{
       
        align-items: center;
        
        
    }
    .normSml:hover{
        
        border-radius: 50%;
    }

    }

 @media  (min-width: 1240px){
    .screen{
        padding:20px 20px;
       background-image: url(https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg) !important;
        background-size: cover;
        height: 100vh !important;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(4, 1fr);
        grid-row: center;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
        overflow: auto;

    }
    .midCom{
        padding: 20px  20px;
        grid-row: 2 / 4;
    grid-column: 4 /6;
      align-self: center;
    }
    
    .normSml{
    margin:  0;
    }
    .normSml:hover{
        
        border-radius: 50%;
    }
    }
     @media  (min-width: 1640px){
    .screen{
        grid-template-columns: repeat(10, 1fr);

    }
     .midCom{
        padding: 13px  0px;
        grid-row: 2 / 4;
    grid-column: 5 /7;
      align-self: center;
          }
    }
 @media (min-height: 840px){
    .midCom{
        grid-row: 3 / 5;
    }
    .screen{
    grid-template-rows: repeat(6, 1fr);

    }
    }
   @media (min-height: 1040px){
    .midCom{
        grid-row: 4 / 5;
    }
     .screen{
    grid-template-rows: repeat(8, 1fr);

    }
    }
</style>
