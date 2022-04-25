<script>
           import Tooltip from './../../lib/celim/tooltip.svelte';
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
        import Hal from '../../lib/components/lev/halukaask.svelte'
       import Rikma from '../../lib/components/lev/rikma.svelte'
        import Hevel from '../../lib/components/lev/hevel.svelte'
        import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
        import { fly } from 'svelte/transition';
        let low = true;
                let milon = {fiap : true, welc: true, sugg: true, pend: true, asks: true, betaha: true, desi: true, ppmash: true, pmashs: true, pmaap: true, askmap: true}
              let isOpen = false;
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
let ask = 0;
let halu = 0;
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
let arr1 = []
function close() {
  isOpen = false;
}
let eizeish, eizep
let mode = 0;
function user(event){
  isOpen = false
 eizeish = event.detail.id
 mode = 1
 isOpen = true
}
function proj(event){
  isOpen = false
 eizep = event.detail.id
 mode =2
 isOpen = true
}
function mesimabetahalicha (data) {
    const mtahan = data.data.user.mesimabetahaliches;
        for (var i = 0; i < mtahan.length; i++) {
            mtaha[i] = mtahan[i];
            mtaha[i].ani = "mtaha"
            mtaha[i].pl = 0 + i
    }
    beta = mtaha.length;
     if (!isEqual(mtaha,mtahaold) && counter > 1 ) {
        if (mtahaold.length < mtaha.length){
    // Create and show the notification
            const usernames = data.data.user.username;
    const rikn = mtaha[mtaha.length - 1].project.projectName
    
    let img = 'https://res.cloudinary.com/love1/image/upload/v1648817031/maskable_icon_x128_tt2kgj.png';
    let text = `שלום ${usernames} !יש לך משימה חדשה לביצוע ברקמת ${rikn}` ;
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
function gvots(data){
  for (var k = 0; k < data.length; k++) {
     const x = data[k].users //בעיה לפעמים זה vots
             data[k].uids = [];
     for (var z = 0; z < x.length; z++){
      data[k].uids.push(x[z].users_permissions_user.id);
              data[k].what = [];
   data[k].what.push(x[z].what);
 }
 }    

    for (var t = 0; t <data.length; t++){
    const allid = data[t].uids;
    const myid = data[t].myid;
    data[t].already = false;
    data[t].noofusersOk = 0;
    data[t].noofusersNo = 0;
    data[t].whyno = [];
    data[t].whyes = [];
    data[t].mypos = null;
    if(allid.includes(myid)){
      data[t].already = true;
      data[t].pl = 20;
    for (var l=0; l< data[t].users.length; l++){
        if (data[t].users[l].users_permissions_user.id === myid)
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
    }
}
function ishursium (dati){
 const start = dati.data.user.projects_1s
      const myid = dati.data.user.id;
  for (var i = 0; i < start.length; i++) {
            for (var j = 0; j < start[i].finiapruvals.length; j++){
                      const rt = letters(start[i].finiapruvals[j].missname); 
                                     let src22 = "";
                     if (start[i].finiapruvals[j].users_permissions_user.profilePic !== null){
                       src22 = start[i].finiapruvals[j].users_permissions_user.profilePic.formats.thumbnail.url
                    }  
                      fiapp.push({
                            uid: start[i].finiapruvals[j].users_permissions_user.id,
                            username: start[i].finiapruvals[j].users_permissions_user.username,
                            src: src22,
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
                            myid: dati.data.user.id,
                            ani: "fiapp",
                            pl: -2
                              });
            }
  }
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
            fiapp[t].pl += 20;

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
    }
    fiapp = fiapp
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
                            myid: hh.data.user.id,
                            ani: "wegets",
                            pl: -1 + start[i].maaps[j].vots.length
                              });

            }
        }
  }
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
     orech = arr1.lenght;
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
                     let src22 = "";
                     if (start[i].asks[j].users_permissions_user.profilePic !== null){
                       src22 = start[i].asks[j].users_permissions_user.profilePic.formats.thumbnail.url
                    } 
                    dictasked.push({
                            uid: start[i].asks[j].users_permissions_user.id,
                            username: start[i].asks[j].users_permissions_user.username,
                            src: src22,
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
                            myid: da.data.user.id,
                            ani: "askedcoin",
                            pl: 1 + i + j
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
                    let src22 = "";
                     if (start[i].askms[j].users_permissions_user.profilePic !== null){
                       src22 = start[i].askms[j].users_permissions_user.profilePic.formats.thumbnail.url
                    } 
                    askedm.push({
                            uid: start[i].askms[j].users_permissions_user.id,
                            username: start[i].askms[j].users_permissions_user.username,
                            src: src22,
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
                            myid: da.data.user.id,
                            ani: "askedm",
                            pl: 2 + i + j
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
        st = 5;
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
        st = 225
     } else if (data.length >= 19 && data.length < 20) {
            stylef = '20px';
            st = 255
     } else  if (data.length >= 20 && data.length <21) {
            stylef = '18px';
            st = 270
     } else  if (data.length >= 21){
         stylef = '16px';
         st = 285
    }
    return [data, stylef, st];
}
function deloi (event ){
   const newasked = wegets;
   const todel = event.detail.asked
   newasked.splice(todel, 1);
   wegets = newasked;
   ma = wegets.length;
 counter = 0;
   start()}

function deloid (event ){
   const newasked = fiapp;
   const todel = event.detail.asked
   newasked.splice(todel, 1);
   fiapp = newasked;
   fia = fiapp.length;
   counter = 0;
   start()
}

function delo (event ){
   const newasked = askedcoin;
   const todel = event.detail.asked
   newasked.splice(todel, 1);
   askedcoin = newasked;
   ask = askedcoin.length;
   counter = 0;
   start()
}

function delom (event ){
   const newasked = askedm;
   const todel = event.detail.asked
   newasked.splice(todel, 1);
   askedm = newasked;
   askm = askedm.length;
   counter = 0;
   start()

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

                // [500,300,100] // need to split 
                // a = 100
                // ["500",400]
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
  var resultString = keysSorted.join(' , ');
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
    let link ="https://onelovevone.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
            `{openMissions (where: {id_in: [${resultString}]}){ id
            project { id projectName profilePic {url formats }}
            sqadualed
            tafkidims {roleDescription}
            skills {skillName}
            descrip
            hearotMeyuchadot
            name
            work_ways {workWayName id}
            noofhours perhour
            }
            }`
           })
  })
  .then(r => r.json())
  .then(data => meData = data.data.openMissions);
       meData.data
        for (var i = 0; i <meData.length; i++){
          meData[i].ani = "meData",
          meData[i].pl = 10 + i
        }
         bubleUiAngin()
        arr1 = arr1 
        console.log(arr1)
         } catch (e) {
            error1 = e
        }} else{
          tyu = true
        }
        sug = meData.length;
    };
    // מיון ראשוני עדיף לפי האם סיים כבר משימה כזו 
let tyu = false
     let nam = ""
        let total = ""
              let  picLink = ""
function midd (min){
        const dd = min.data.user
         nam = dd.username
         total = dd.total
         if(dd.profilePic !== null){
        if (dd.profilePic.formats.thumbnail.url){
      picLink = dd.profilePic.formats.thumbnail.url
        } else if (dd.profilePic.small.thumbnail.url){
        picLink = dd.profilePic.small.thumbnail.url
        } else if (dd.profilePic.url){
                 picLink = dd.profilePic.url
        }}
}
    let tickSpeed = 60000 * 5;
let sdsa = [];

let miDataold = [];
let mtahaold = [];
let counter = 0;
    function reverseString(str) {
    return str.split("").reverse().join("");
}
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
  await start ();
  setInterval(start, tickSpeed);
     let isSafari = window.navigator.userAgent.indexOf("Safari") > -1 ;

     if (isSafari) {
  await start()
  .then()
  if ((/[\u0590-\u05FF]/).test(nam) || (/[\u0600-\u06FF]/).test(nam)) {
 nam = reverseString(nam)
  nam = nam        
}
  } 
  } else {
            goto ("/",)
    }
})
let walcomenold= [];
async function start () { 
  console.log("start");
  miDataold = miData
    let bearer1 = 'bearer' + ' ' + token;
    let link ="https://onelovevone.onrender.com/graphql" ;
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
            tosplits (where: {finished: false}) {id name vots  {what why id users_permissions_user {id}}}              
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
   mtahaold = mtaha;
   mtaha = [];
   meData = [];
    sdsa = [];
    pmashes = [];
    huca = [];
    wegets=[];
    haluask = [];
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
          rashbi(miData);
          if (tyu = true){
                 bubleUiAngin()
        arr1 = arr1 
          }
                  low = false

  }
        } catch (e) {
            error1 = e
        }
} ;
let pmashes = [];
let huca = [];
function mdon(){
    start()
}
let haluask = [];
function rashbi (data){
 const myid = data.data.user.id;
    const projects = data.data.user.projects_1s;
    for (var i = 0; i < projects.length; i++) {
        for (var j = 0; j < projects[i].tosplits.length; j++) {
            const halu = projects[i].tosplits[j]
                    haluask.push({
                                  name: halu.name,
                                  projectId: projects[i].id,
                                  projectName: projects[i].projectName,
                                  user_1s: projects[i].user_1s,
                                  src:projects[i].profilePic.formats.thumbnail.url,
                                  users: halu.vots,
                                  myid: myid,
                                   pendId: halu.id,
                                   noofusers: projects[i].user_1s.length,
                                    ani: "haluk",
                                  pl: 1 + halu.vots.length
                              });
               
 }
 }
 for (var k = 0; k < haluask.length; k++) {
     const x = haluask[k].users
     for (var z = 0; z < x.length; z++){
        haluask[k].uids = [];
      haluask[k].uids.push(x[z].users_permissions_user.id);
              haluask[k].what = [];

           haluask[k].what.push(x[z].what);
 }
 }    

 for (var t = 0; t <haluask.length; t++){
    const allid = haluask[t].uids;
    const myid = haluask[t].myid;
    haluask[t].already = false;
 haluask[t].noofusersOk = 0;
 haluask[t].noofusersNo = 0;

    if(allid.includes(myid)){
      haluask[t].already = true;
       haluask[t].pl += 25    
    }
        for (var r=0; r< haluask[t].users.length; r++){
            if (haluask[t].users[r].what === true) {
                
                 haluask[t].noofusersOk += 1;
               
            }else if (haluask[t].users[r].what === false) {
              
                 haluask[t].noofusersNo += 1;
               
            }
        }
    const noofusersWaiting = haluask[t].user_1s.length - haluask[t].users.length;
    haluask[t].noofusersWaiting = noofusersWaiting;
        
    }
    halu = haluask.length;
console.log(haluask);
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
                 already: false, 
                 ani: "huca",
                 pl: 6
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
                                    ani: "pmashes",
                                  pl: 1 + pend.users.length
                              });
               
    }
     }
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
            pmashes[t].pl += 48
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
    ani: "walcomen",
    pl: 1
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
                                  projectId: projects[i].id,
                                  hearotMeyuchadot: pend.hearotMeyuchadot,
                                  descrip: pend.descrip,
                                  noofhours: pend.noofhours,
                                  perhour: pend.perhour,
                                  projectName: projects[i].projectName,
                                  user_1s: projects[i].user_1s,
                                  src: projects[i].profilePic.formats.thumbnail.url,
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
                                    ani: "pends",
                                  pl: 1 + pend.users.length
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
       pends[t].pl = 25    
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
  //  bubleUiAngin(pends)
}
function less (event) {
    const id = event.detail.id;
    const newdata = meData;
    const y = meData.map(c => c.id);
    const index = y.indexOf(id);
    newdata.splice(index, 1);
    meData = newdata;
    counter = 0;
    start()
};  
function lessi (event) {
    const id = event.detail.id;
    const newdata = huca;
    const y = huca.map(c => c.id);
    const index = y.indexOf(id);
    newdata.splice(index, 1);
    huca = newdata;
     counter = 0;
    start()
};  
let shows = true;
function show(event){
    shows = true;
}

function coinLapach (event){
 counter = 0;
    start()}

// one function to rull them all , pass all the difrrent to one arry then to sort by important then to have them render with if to check wwhat kind and which component.....


function showonly (event){
    const value = event.detail.data;
 for (const key in milon) {
        milon[key] = false
    }
    
    milon[value] = true;

}
function showall (event){
for (const key in milon) {
        milon[key] = true
    }

}
function bubleUiAngin(){
 arr1 = [  ...walcomen, ...askedcoin, ...meData, ...mtaha, ...pmashes, ...pends, ...wegets, ...fiapp, ...askedm, ...huca, ...haluask ].sort(({pl:a}, {pl:b}) => a - b)
     createD()
     //sp;it to 2 4 diif ways , elgo if lengt > 3 split first 3 then 2 , another 5 and 4 ,, pay ottention to heart 
}
let u = "מסך הלב"
function hover(event){
    u = event.detail.id
}
</script>

<svelte:head>
  <title>לב 1❤️1</title>
</svelte:head>
<DialogOverlay class="overlay" {isOpen} onDismiss={close} >
        <div transition:fly|local={{y: 450, opacity: 0.5, duration: 1000}}>
  <DialogContent aria-label="form" class="content">
 <div dir="rtl" class="grid items-center justify-center text-center">
              <button style="margin: 0 auto;" on:click={close} class="hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
     title="סגירה"
    ><svg style="width:48px;height:48px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
   </svg></button>
   <br/>
   {#if mode == 1}
    <Hevel userId={eizeish} on:proj={proj}/>
    {:else if mode == 2}
    <Rikma projectId={eizep} on:user={user}/>
    {/if}
  </div>
  </DialogContent>
  </div>
</DialogOverlay>
<!-- לשים בלוק של פוראיצ' על כל משימה בתהליך  הצעת משימה והחלטה ולמשוך שם משימה וכו' משם -->
<Tooltip title="{u}" ispic="true">
<div class="screen" > 
    
{#each adder as add }
   {@html add}
 {/each}

{#each arr1 as buble, i}
{#if buble.ani === "haluk"}
 <div class="normSml halu"><Hal    
    user_1s={buble.user_1s}
          on:hover={hover}
 on:proj={proj}
 on:user={user}
    myid={buble.myid}
    pendId={buble.pendId}
    mypos={buble.mypos}
    projectName={buble.projectName} 
    name={buble.name} 
    src={buble.src}
    projectId={buble.projectId}
    noofusersOk={buble.noofusersOk}
    noofusersNo={buble.noofusersNo}
    noofusersWaiting={buble.noofusersWaiting}
    noofusers={buble.noofusers}
    already={buble.already}
    created_at={buble.created_at}
    users={buble.users}
    diun={buble.diun}
    order={buble.order}
                               /></div>
{:else if buble.ani === "mtaha" &&  milon.betaha == true}
 <div   class="betaha normSml" ><MissionInProgress
  on:proj={proj}
 on:user={user}  
  on:hover={hover}
    noofpu={buble.project.user_1s.length}
    oldzman={buble.timer}
    stname={buble.stname}
    mId={buble.id}
    missId={buble.mission.id}
    missionName={buble.name}
    projectId={buble.project.id}
    projectName={buble.project.projectName}
    missionDetails={buble.descrip}
    src={buble.project.profilePic.formats.thumbnail.url}
    link={buble.privatlinks}
    dueDateOrCountToDedline ={buble.admaticedai}
    hoursdon ={buble.howmanyhoursalready}
    hourstotal = {buble.hoursassinged}
    perhour = {buble.perhour}
    on:done={mdon}
    /></div>
{:else if buble.ani === "pmashes" && milon.ppmash == true}
    <div class="normSml ppmash" 
 ><PendingMa
        on:show={show}
              on:hover={hover}
  on:proj={proj}
 on:user={user}
        on:coinLapach={coinLapach}
        mypos={buble.mypos}
        diun={buble.diun}
        whyno={buble.whyno}
      descrip={buble.descrip}
      projectName = {buble.projectName}
      name = {buble.name}
              hearotMeyuchadot = {buble.hearotMeyuchadot}
              kindOf = {buble.kindOf} 
              src = {buble.src}
               noofusersWaiting={buble.noofusersWaiting}
                projectId={buble.projectId}
                uids={buble.uids}
                what={buble.what}
                noofusersOk={buble.noofusersOk}
                created_at={buble.created_at}
                noofusersNo={buble.noofusersNo}
                already={buble.already}
                noofusers={buble.user_1s.length}
                mshaabId={buble.mshaabId}
                hm={buble.hm}
                price={buble.price}
                easy={buble.easy}
                sqadualed={buble.sqadualed}
                sqadualedf={buble.sqadualedf}
                linkto={buble.linkto}
                pendId={buble.pendId}
                users={buble.users}
                shows={shows}
                /></div>
{:else if buble.ani === "pends" && milon.pend == true}
    <div  class="normSml pend" 
 ><PendingM
        on:show={show}
              on:hover={hover}
  on:proj={proj}
 on:user={user}
        on:coinLapach={coinLapach}
      descrip={buble.descrip}
      projectName = {buble.projectName}
      name = {buble.name}
              hearotMeyuchadot = {buble.hearotMeyuchadot}
              noofhours = {buble.noofhours} 
              src = {buble.src}
               noofusersWaiting={buble.noofusersWaiting}
                projectId={buble.projectId}
                uids={buble.uids}
                what={buble.what}
                noofusersOk={buble.noofusersOk}
                total={buble.noOfHours * buble.perhour}
                perhour={buble.perhour}
                noofusersNo={buble.noofusersNo}
                already={buble.already}
                noofusers={buble.user_1s.length}
                missionId={buble.missionId}
                skills={buble.skills}
                tafkidims={buble.tafkidims}
                workways={buble.workways}
                mdate={buble.mdate}
                vallues={buble.vallues}
                pendId={buble.pendId}
                users={buble.users}
                shows={shows}
                /></div>
{:else if buble.ani === "wegets" && milon.pmaap == true}
        <div class="pmaap normSml" ><Weget
            on:acsept={deloid}
            on:decline={deloid}
                  on:hover={hover}
          on:proj={proj}
 on:user={user}
            mId={buble.mId}
            noofusersWaiting={buble.noofusersWaiting}
            uids={buble.uids}
            kindOf={buble.kindOf}
            noofusersOk={buble.noofusersOk}
            noofusersNo={buble.noofusersNo}
            already={buble.already}
            users={buble.users}
            askId={buble.askId}
            myp={buble.myp}
            projectName = {buble.projectName}
            useraplyname ={buble.username}
            userId ={ buble.uid} 
            spid = {buble.spid} 
            src = {buble.src}
            price={buble.price}
            hm={buble.hm}
            src2 = {buble.src2}
            why={buble.why}
            whatt={buble.whatt}
            missionBName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
               noofpu={buble.noof}
            sqadualedf={buble.sqadualedf}
             sqadualed={buble.sqadualed}
            spnot={buble.spnot}
            easy ={buble.easy}
            nhours={buble.nhours}
            deadline={buble.deadline}
                missId={buble.missId}
                id={buble.id}
                openMid={buble.omid}
                stylef={buble.stylef}
                st={buble.st}
                declined={buble.decid}
                /></div>
{:else if buble.ani === "fiapp" && milon.fiap == true}
            <div  class="fiap normSml" ><Fiappru
            on:acsept={deloi}
            on:decline={deloi}
                  on:hover={hover}
    on:proj={proj} 
 on:user={user}
             mId={buble.mId}
            noofusersWaiting={buble.noofusersWaiting}
            uids={buble.uids}
            what={buble.what}
            noofusersOk={buble.noofusersOk}
            noofusersNo={buble.noofusersNo}
            already={buble.already}
            users={buble.users}
            askId={buble.askId}
            projectName = {buble.projectName}
            useraplyname ={buble.username}
            userId ={ buble.uid} 
            missionDetails = {buble.descrip} 
            src = {buble.src}
            src2 = {buble.src2}
            why={buble.why}
            whatt={buble.whatt}
            missionBName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
               noofpu={buble.noof}
            publicklinks={buble.publicklinks}
             privatlinks={buble.privatlinks}
            hearotMeyuchadot={buble.hearotMeyuchadot}
            valph ={buble.perhour}
            nhours={buble.nhours}
            deadline={buble.deadline}
                missId={buble.missId}
                id={buble.id}
                openMid={buble.omid}
                stylef={buble.stylef}
                st={buble.st}
                declined={buble.decid}
                /></div>
{:else if buble.ani === "walcomen" && milon.welc == true}
   <div  class="welc normSml" ><Welcomt 
    id={buble.id}
          on:hover={hover}

       username={buble.username}
       projectName={buble.projectName}
       /></div>
{:else if buble.ani === "askedcoin" && milon.asks == true}
        <div  class="asks normSml" ><Reqtojoin
            on:acsept={delo}
                  on:hover={hover}
            on:proj={proj}
     on:user={user}
            on:decline={delo}
            noofusersWaiting={buble.noofusersWaiting}
            uids={buble.uids}
            what={buble.what}
            noofusersOk={buble.noofusersOk}
            noofusersNo={buble.noofusersNo}
            already={buble.already}
            users={buble.users}
            askId={buble.askId}
            projectName = {buble.projectName}
            useraplyname ={buble.username}
            userId ={ buble.uid} 
            missionDetails = {buble.descrip} 
            src = {buble.src}
            src2 = {buble.src2}
            openmissionName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
               noofpu={buble.noof}
            publicklinks={buble.publicklinks}
             privatlinks={buble.privatlinks}
            hearotMeyuchadot={buble.hearotMeyuchadot}
            valph ={buble.perhour}
            nhours={buble.nhours}
            deadline={buble.deadline}
                missId={buble.missId}
                id={buble.id}
                openMid={buble.omid}
                stylef={buble.stylef}
                st={buble.st}
                declined={buble.decid}
                /></div>
{:else if buble.ani === "askedm" && milon.askmap == true}
        <div  class="askmap normSml" ><Reqtom
            on:acsept={delom}
            on:decline={delom}
                  on:hover={hover}
            on:proj={proj}
 on:user={user}
            noofusersWaiting={buble.noofusersWaiting}
            uids={buble.uids}
            what={buble.what}
            noofusersOk={buble.noofusersOk}
            noofusersNo={buble.noofusersNo}
            already={buble.already}
            users={buble.users}
            askId={buble.askId}
            projectName = {buble.projectName}
            useraplyname ={buble.username}
            userId ={ buble.uid} 
            missionDetails = {buble.descrip} 
            src = {buble.src}
            src2 = {buble.src2}
            openmissionName={buble.openName}
            name={buble.name}
            projectId={buble.projectId}
               noofpu={buble.noof}
            myp={buble.myp}
             easy={buble.easy}
            spnot={buble.spnot}
            price ={buble.price}
            deadline={buble.deadline}
                missId={buble.missId}
                id={buble.id}
                openMid={buble.omid}
                stylef={buble.stylef}
                st={buble.st}
                declined={buble.decid}
                spid={buble.spid}
                /></div>
{:else if buble.ani === "meData" && milon.sugg == true}
    <div class="sugg normSml" ><ProjectSuggestor
      on:less={less}
            on:hover={hover}
      on:proj={proj}
 on:user={user}
      askedarr={askedarr}
      {declineddarr}
      deadLine = {buble.sqadualed}
      oid = {buble.id}
              projectName = {buble.project.projectName}
                role ={buble.tafkidims}
              skills ={ buble.skills} 
              missionDetails = {buble.descrip} 
              notes = {buble.hearotMeyuchadot}
              src = {buble.project.profilePic.formats.thumbnail.url}
               missionName={buble.name}
                projectId={buble.project.id}
                workways={buble.workways}
                noOfHours={buble.noofhours}
                perhour={buble.perhour}
                total={buble.noofhours * buble.perhour}
                /></div>
{:else if buble.ani === "huca" && milon.pmashs == true}
    <div  class="pmashs normSml" ><Mashsug
      on:less={lessi}
      on:hover={hover}
      on:proj={proj}
 on:user={user}
      i={i}
      askedarr={askedarr}
     declineddarra= {buble.declineddarra}
      deadLine = {buble.sqadualed}
      oid = {buble.oid}
      id = {buble.id}
      price= {buble.price}
      myp={buble.myp}
      already= {buble.already}
              projectName = {buble.projectName}
              missionDetails = {buble.descrip} 
              notes = {buble.hearotMeyuchadot}
              src = {buble.srcb}
               mashName={buble.mashname}
                projectId={buble.projectid}
                descrip={buble.descrip}
                spnot={buble.spnot}
                easy={buble.easy}
                /></div>
{/if}
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
        on:hover={hover}
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
</Tooltip>


<style>
   :global([data-svelte-dialog-content].content) {
      width: 80vw;
      z-index: 1000;
  }
    :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
  @media (min-width: 568px){
        :global([data-svelte-dialog-content].content) {
width:60vw;
      z-index: 1000;

        }
          :global([data-svelte-dialog-overlay].overlay) {
    z-index: 1000;
  }
}
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
.normSml{
       transition: all 1000ms ease-in-out;
}
.normSml:nth-child(1):hover{
   transform: translate(75%,75%);
   z-index: 998;
}.normSml:nth-child(2):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(3):hover{
   transform: translateY(75%);
   z-index: 998;
}
    @media  (max-width: 839px) {
    .normSml:nth-child(4):hover{
   transform: translate(-75%,75%);
   z-index: 998;
}.normSml:nth-child(5):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(6):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(8):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(n+9):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(4n+9):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(4n+12):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
    .screen{
background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);       
 display: grid;
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
         .normSml:nth-child(4):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(5):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(6):hover{
   transform: translate(-75%,75%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(10):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(11):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(14):hover{
   transform: translateX(-75%);
   z-index: 998;
}
.normSml:nth-child(n+15):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(6n+15):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(6n+20):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
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
 /* .normSml:nth-child(1){
    position: absolute;
    top: 18%;   
    left: 50%;
    transform: translate(-50%, -50%);
  }  
  .normSml:nth-child(2){
    position: absolute;
    top: 9%;
    left: 40%;
    transform: translate(-50%, -50%);
  } 
  .normSml:nth-child(3){
    position: absolute;
    top: 9%;
    left: 60%;
    transform: translate(-50%, -50%);
  } 
    .normSml:nth-child(4){
    position: absolute;
    top: 18%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
  .normSml:nth-child(5){
    position: absolute;
    top: 18%;
    left: 70%;
    transform: translate(-50%, -50%);
  } 
    .normSml:nth-child(6){
    position: absolute;
    top: 20%;
    left: 20%;
    transform: translate(-50%, -50%);
  } 
  .normSml:nth-child(7){
    position: absolute;
    top: 20%;
    left: 80%;
    transform: translate(-50%, -50%);
  }  
   .normSml:nth-child(8){
    position: absolute;
    top: 30%;
    left: 70%;
    transform: translate(-50%, -50%);
  }  
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  }  
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } 
   .normSml:nth-child(9){
    position: absolute;
    top: 30%;
    left: 30%;
    transform: translate(-50%, -50%);
  } */  
.normSml:nth-child(1):hover{
    transform: translate(75%,75%);
   z-index: 998;
}.normSml:nth-child(2):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(3):hover{
   transform: translateY(75%);
   z-index: 998;
}
        .normSml:nth-child(4):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(5):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(6):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(8):hover{
   transform: translate(-75%,75%);
   z-index: 998;
}.normSml:nth-child(9):hover{
   transform: translateX(75%);
   z-index: 998;
}
.normSml:nth-child(10):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(11):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(14):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(15):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(16):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(17):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(18):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(19):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(20):hover{
   transform: translateX(-75%);
   z-index: 998;
}
.normSml:nth-child(n+21):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(8n+21):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(8n+28):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
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
        overflow: auto;

    }
    .midCom{
      /*  position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);*/
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
/*
 @media  (min-width: 1240px){
    .screen{
        padding:20px 20px;
       background-image: url(https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg) !important;
        background-size: cover;
        height: 100vh !important;
        display: grid;
        grid-template-columns: 200px;
        grid-template-rows: 75px;
        grid-gap: 37.5px;
        grid-row: center;
        align-items: center;
        justify-content: center;
        width: 100vw;
        height: 100vh;
        overflow: auto;

    }
    .midCom{
        padding: 20px  20px;
        grid-row: 3  / 5;
    grid-column: 2 /4;
      align-self: center;
    }
    .normSml:nth-child(6){
margin-left: 125px
    }
      .normSml:nth-child(7){
margin-left: 125px
    }  .normSml:nth-child(8){
margin-left: 125px
    }  .normSml:nth-child(9){
margin-left: 125px
    }  .normSml:nth-child(10){
margin-left: 125px
    }
    .normSml{
    margin:  0;
    }
    .normSml:hover{
        
        border-radius: 50%;
    }
    }*/
     @media  (min-width: 1640px){
           .normSml:nth-child(4):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(5):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(6):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(8):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(9):hover{
   transform: translateY(75%);
   z-index: 998;
}.normSml:nth-child(10):hover{
   transform: translate(-75%,75%);
   z-index: 998;
}.normSml:nth-child(11):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(20):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(21):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(28):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(29):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(36):hover{
   transform: translateX(-75%);
   z-index: 998;
}
.normSml:nth-child(37):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(46):hover{
   transform: translateX(-75%);
   z-index: 998;
}
.normSml:nth-child(n+47):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(10n+47):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(10n+56):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
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
 @media (min-height: 750px){
   @media (max-width: 839px){
   .normSml:nth-child(6):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(7):hover{
   transform: translateX(0%);
   z-index: 998;
}.normSml:nth-child(8):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(9):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(10):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(11):hover{
   transform: translateX(75%);
   z-index: 998;
}.normSml:nth-child(12):hover{
   transform: translateX(-75%);
   z-index: 998;
}.normSml:nth-child(13):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(16):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}.normSml:nth-child(n+17):hover{
   transform: translateY(-75%);
   z-index: 998;
}.normSml:nth-child(4n+17):hover{
   transform: translate(75%,-75%);
   z-index: 998;
}.normSml:nth-child(4n+20):hover{
   transform: translate(-75%,-75%);
   z-index: 998;
}
   }
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
