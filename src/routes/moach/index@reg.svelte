<script>
  //	import { draw } from 'svelte/transition';
    //     import Tooltip from './../../lib/celim/tooltip.svelte'
  import Gantt from '../../lib/components/prPr/gantt/gant.svelte'
  import Header from '../../lib/components/header/header.svelte'
  import { RingLoader
} from 'svelte-loading-spinners'
    import Uplad from '../../lib/components/userPr/uploadPic.svelte';
    import axios from 'axios';
    import Editb from '../../lib/components/prPr/editp.svelte'
        import Hand from '../../lib/components/prPr/hand.svelte'
        import Handd from '../../lib/components/prPr/handd.svelte'
        import Mashman from '../../lib/components/prPr/mashmam.svelte'
    import Hamatanot from '../../lib/components/prPr/hamatanot.svelte'
   import { idPr } from '../../lib/stores/idPr.js';
  // import { idM } from '../../lib/stores/idM.js';
 import Mission from '../../lib/components/prPr/mission.svelte';
  import ChoosMission from '../../lib/components/prPr/choosMission.svelte';
    import ChoosNeed from '../../lib/components/prPr/chosNed.svelte';
   import TotalNeeds from '../../lib/components/prPr/totalNeeds.svelte';
   import { total } from '../../lib/stores/total.js';
 //   import { beforeUpdate, tick } from 'svelte';
    import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
   import OpenM from '../../lib/components/prPr/openM.svelte';
    import PendsM from '../../lib/components/prPr/pendsM.svelte';
        import Betaha from '../../lib/components/prPr/betaha.svelte';
       import Fini from '../../lib/components/prPr/fini.svelte';
       import Hach from '../../lib/components/prPr/hachcal.svelte';

//import { validate_component } from 'svelte/internal';
 import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';
let idL;

let isOpen = false;
let a = 0;
  let fmiData = [];
  let tahaS = false;
  let bmiData = [];
  let mission1 = [];
    let dow;
      let cow;
      let hosaf;
  let error2 = null;
async function findM() {
      const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
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
        'Content-Type': 'application/json',
      };
    
        try {
            const res = await fetch("https://new-zuhk.onrender.com/missions?_limit=-1", {
              method: "GET",
              headers: {
                'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },
            }).then(checkStatus)
          .then(parseJSON);
            mission1 = res;
            console.log(res); 
        } catch (e) {
            error2 = e;
        }
};
let ti = ""
let bmimData = [];
    let addN = false;
    let addM =  false;
    let hosafa = "הוספת פעולות נדרשות לריקמה";
    let hosafat = "הוספת משאבים נדרשים לריקמה";
    let cencel = "ביטול";
    let showvd = false;

   let totalneed = false;
  // total.subscribe(newwork => {
  //  totalneed = newwork;
  //  });
    let error1 = null;
      let srcP; 
   let desP;
   let projectname;
  let token; 
  let linkP;
  
 
  let descPri;
  let omiData = [];
  let pmiData = [];
  let project = [];
let projectUsers =[];
let vallues = [];
let ata = [];
let restime;
let valit;
let user = [];
let rikmashes = [];
let lll;
let opmash = [];
let noofopenm = 0;
let salee = [];
let trili = [];
let projects = prog();
let meData = start ();

//sale {id in}
let users;
async function start () {
  if ($idPr !== 0){
  // ולידציה שהיוזר חבר ברקמה
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
 let idL = cookieValueId;
  let  token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
    const idpree = 0;
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
        'Authorization': bearer1,
        'Content-Type': 'application/json',
      };
        try {
            const res = await fetch("https://new-zuhk.onrender.com/graphql" , {//+ $idPr
              method: "POST",
              headers: {
                'Authorization': bearer1,
                 'Content-Type': 'application/json'
              }, body: 
        JSON.stringify({query:
          `{project(id:"${$idPr}"){
            projectName 
             user_1s {id}}
            me{id}}
              `} )
            }).then(checkStatus)
          .then(parseJSON);
            ata = res.data.project;
             projectUsers = ata.user_1s;
             const x = projectUsers.map(c => c.id)
             if (x.includes(idL)){
                      
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
        'Authorization': bearer1,
        'Content-Type': 'application/json',
      };
        try {
            const res = await fetch("https://new-zuhk.onrender.com/graphql" , {//+ $idPr
              method: "POST",
              headers: {
                'Authorization': bearer1,
                 'Content-Type': 'application/json'
              }, body: 
JSON.stringify({query:
          `{project(id:"${$idPr}"){
            tosplits (where:{finished : false}){prectentage vots {what users_permissions_user {id}}}
            projectName
            descripFor
            publicDescription
            sales {id in matanot {name id} users_permissions_user {id username}}
            matanotof { id name price quant kindOf }
            finnished_missions {id missionName mesimabetahalich {created_at} created_at why total descrip hearotMeyuchadot users_permissions_user {id username}}
            rikmashes{id name kindOf total hm price agprice sp {id } spnot users_permissions_user {id username}}
             user_1s {id username profilePic {url formats}}
              mesimabetahaliches (where:{finnished: false}) {
             id created_at hearotMeyuchadot howmanyhoursalready name descrip hoursassinged perhour privatlinks publicklinks users_permissions_user {id username}}
            open_missions (where:{archived: false }) { id name hearotMeyuchadot descrip noofhours perhour sqadualed
                                    privatlinks publicklinks
                                    rishon {id}
                                    skills { id skillName}
                                    tafkidims {id roleDescription}
                                    work_ways {id workWayName} 
                                    mission { id}
                                    created_at
                        } 
                        open_mashaabims (where: {archived: false }){id kindOf hm descrip price easy name spnot sqadualed sqadualedf }
             pendms (where:{archived: false }) {id name hearotMeyuchadot descrip noofhours perhour sqadualed
                                    privatlinks publicklinks
                                    rishon {id}
                                    skills { id skillName}
                                    tafkidims {id roleDescription}
                                    work_ways {id workWayName} 
                                    mission { id}
                                    created_at
                                    users  {what why id users_permissions_user {id}} }
            vallues {valueName}
            linkToWebsite
            profilePic {url  formats }
            restime
          } 
        me{id}}
          `} )
}).then(checkStatus)
          .then(parseJSON);
            meData = res.data.project;
            project = res.data.project;
            projectname = res.data.project.projectName;
            desP = project.publicDescription
            linkP = res.data.project.linkToWebsite
            meData.descripFor = descPri;
            projectUsers = project.user_1s;
            restime = project.restime;
            if (project.mesimabetahaliches.length > 0){
            bmiData = project.mesimabetahaliches;
            } else if (project.mesimabetahaliches.length == null) {
            bmiData.push(project.mesimabetahaliches);
            }
              if (project.sales.length > 0){
            salee = project.sales;
            } else if (project.sales.length == null) {
            salee.push(project.sales);
            }
            salee = salee
              if (project.matanotof.length > 0){
            bmimData = project.matanotof;
            } else if (project.matanotof.length == null) {
            bmimData.push(project.matanotof);
            }
             if (project.open_mashaabims.length > 0){
            opmash = project.open_mashaabims;
            } else if (project.open_mashaabims.length == null) {
            opmash.push(project.open_mashaabims);
            }
            if (project.finnished_missions.length > 0){
            fmiData = project.finnished_missions;
            } else if (project.finnished_missions.length == null) {
            fmiData.push(project.finnished_missions);
            }
             if (project.rikmashes.length > 0){
            rikmashes = project.rikmashes;
            } else if (project.rikmashes.length == null) {
            rikmashes.push(project.rikmashes);
            }
            rikmashes = rikmashes
          //  if (project.open_missions.length > 1){
            bmimData = bmimData
            omiData = project.open_missions;
          //  } else if (project.open_missions.length == null){
          //  omiData.push(project.open_missions);
          //  }
            if (project.pendms.length > 0){
            pmiData = project.pendms;
            } else if (project.pendms.length == null){
            pmiData.push(project.pendms);
            }
        //    omiData = omiData;
            pmiData = pmiData;
            bmiData = bmiData;
            vallues = project.vallues;
            valit = vallues.map(c => c.valueName);
            linkP = meData.linkToWebsite;
             noofopenm = opmash.length;
            noofopen = project.open_missions.length;
            if (project.profilePic !== null){
            srcP = project.profilePic.url;
            }
            trili = meData.tosplits;
           pre(projectUsers, fmiData)
        } catch (e) {
            error1 = e;
            console.log(error1);
        }
             }
        else {
          goto("/")
        }

           } catch (e) {
            error1 = e;
            console.log(error1);
  } 
  return meData
} 
};
async function prog (){
    if ($idPr == 0){
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
      }; let linkg ="https://new-zuhk.onrender.com/graphql" ;
        try {
             await fetch(linkg, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
          `{  user (id:${idL}) {
                            projects_1s {id projectName }
                            } }`
        })
 })
  .then(r => r.json())
  .then(data => user = data);
   console.log(user)
   if(user.errors){
     if (user.errors[0].message === "Invalid token."){
              goto("./login")
            }
          }
    projects = user.data.user.projects_1s;
    } catch (e) {
            console.log(e)
           
        }
  return projects
      } 
}
    function pre(projectUsers, fmiData){

    }

   let li = [];
   let miData = [];
 let blabla = [];
 let load = false;
async function callbackFunction(event) {
    		cow.scrollIntoView(true);
 load = true;
  const  lim = event.detail.li;
        if (lim.length > 0 || lim > 0){
  showvd = false;
 await refreshM ()
 .then() 
  addM = false;
    li = event.detail.li;
  await  findiM ()
 .then()
 load = false;
  showvd = event.detail.show; 
    blabla = event.detail.bla;
    addM = true;
    		cow.scrollIntoView(true);
	};    
}
async function findiM() {
  var resultString = li.join('&id_in=');
 let link ="https://new-zuhk.onrender.com/missions?id_in=" + resultString ;
  const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
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
            miData = res;
        } catch (e) {
            error1 = e
        }
};

let error8;
let roles = [];
async function findT ()  {
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
        'Content-Type': 'application/json',
      };
    
        try {
            const res = await fetch("https://new-zuhk.onrender.com/tafkidims?_limit=-1", {
              method: "GET",
              headers: {
                 'Content-Type': 'application/json'
              },
            }).then(checkStatus)
          .then(parseJSON);
            roles = res;
        } catch (e) {
            error8 = e
        }
};
let error4 = null;
let skills2 = [];
async function findZ ()  {
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
        'Content-Type': 'application/json',
      };
    
        try {
            const res = await fetch("https://new-zuhk.onrender.com/skills?_limit=-1", {
              method: "GET",
              headers: {
                 'Content-Type': 'application/json'
              },
            }).then(checkStatus)
          .then(parseJSON);
            skills2 = res;
        } catch (e) {
            error4 = e;
        }
};
let workways2 =[];
let error27 = null;
async function findX ()  {
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
        'Content-Type': 'application/json',
      };
    
        try {
            const res = await fetch("https://new-zuhk.onrender.com/work-ways?_limit=-1", {
              method: "GET",
              headers: {
                 'Content-Type': 'application/json'
              },
            }).then(checkStatus)
          .then(parseJSON);
            workways2 = res;
        } catch (e) {
            error27 = e;
            console.log(error27);
        }
};
async function refreshM () {
  console.log("הצליח");
  findX ();
  findZ ();
  findT ();
  console.log("עדכנתי מידע");
};

async function hosa () {
      addM = true;
  await findM ()
  .then ()
		hosaf.scrollIntoView(true);

};

async function removeF (event) {
  const miDatanew = event.detail.data;
  const y = miDatanew.map(c => c.id);
 const id = event.detail.id;
 const index = y.indexOf(id);
 if (index > -1) {
  miDatanew.splice(index, 1);
 };
  if (miDatanew.length > 0) {
 showvd = false;
   addM = false;
   miData = miDatanew;
  showvd = true; 
   blabla = miData.map(c => c.missionName);
  console.log(blabla, miData);

  addM = true;
 } else { 
  miData = miDatanew;
 blabla = miData.map(c => c.missionName);
 showvd = false;

 }
};


async function removeS (event) {
  const miDatanew = event.detail.data;
 showvd = false;
 await refreshM ()
 .then() 
 miData = miDatanew;
  showvd = true; 
  addM = false;
   blabla = miData.map(c => c.missionName);
  await findM ()
 .then ()
 addM = true;
};

async function removeR (event) {
  const miDatanew = event.detail.data;
 showvd = false;
 await refreshM ()
 .then() 
 miData = miDatanew;
  showvd = true; 
  addM = false;
   blabla = miData.map(c => c.missionName);
  await findM ()
 .then ()
 addM = true;
};

async function removeW (event) {
  const miDatanew = event.detail.data;
 showvd = false;
 await refreshM ()
 .then() 
 miData = miDatanew;
  showvd = true; 
  addM = false;
   blabla = miData.map(c => c.missionName);
   await findM ()
 .then ()
 addM = true;
};

async function addskills (event) {
  const mid = event.detail.mid;
 const miDatanew = event.detail.data;
 const y = miDatanew.map(c => c.id);
 const index = y.indexOf(mid);
 
 const id = event.detail.id;
 const filterByReference = (skills2, id)=> {
   let res = [];
   res = skills2.filter(el => {
      return id.find(element => {
         return element === el.id;
      });
   });
   return res;
}
const resp = filterByReference(skills2, id);
 miDatanew[index].skills = resp;
 miDatanew[index].selected2 = [];
 console.log (miDatanew);
 showvd = false;
  await refreshM ()
  .then() 
 miData = miDatanew;
   showvd = true; 
   addM = false;
    blabla = miData.map(c => c.missionName);
   await findM ()
 .then ()
 addM = true;
};


async function addroles (event) {
 const mid = event.detail.mid;
 const miDatanew = event.detail.data;
 const y = miDatanew.map(c => c.id);
 const index = y.indexOf(mid);
 
 const id = event.detail.id;
 const filterByReference = (roles, id)=> {
   let res = [];
   res = roles.filter(el => {
      return id.find(element => {
         return element === el.id;
      });
   });
   return res;
}
const resp = filterByReference(roles, id);
 miDatanew[index].tafkidims = resp;
 miDatanew[index].selected3 = [];
 console.log (miDatanew);
 showvd = false;
 miData = miDatanew;
  showvd = true; 
  addM = false;
   blabla = miData.map(c => c.missionName);
 addM = true;
};

async function adwww (event) {
  console.log("fff")

 const mid = event.detail.mid;
 const miDatanew = event.detail.data;
 const y = miDatanew.map(c => c.id);
 const index = y.indexOf(mid);
 
 const id = event.detail.id;
 const filterByReference = (roles, id)=> {
   let res = [];
   res = roles.filter(el => {
      return id.find(element => {
         return element === el.id;
      });
   });
   return res;
}
const resp = filterByReference(workways2, id);
 miDatanew[index].work_ways = resp;
 miDatanew[index].selected1 = [];
 console.log (miDatanew);
 showvd = false;
  await refreshM ()
  .then() 
 miData = miDatanew;
  showvd = true; 
  addM = false;
   blabla = miData.map(c => c.missionName);
  await findM ()
 .then ()
 addM = true;
 console.log(miData)
};

async function addnewsk (event) { 
 const skob = event.detail.skob;
 const mid = event.detail.mid;
 const miDatanew = event.detail.data;
 const y = miDatanew.map(c => c.id);
 const index = y.indexOf(mid);
 miDatanew[index].skills.push(skob);
 console.log (miDatanew);
 showvd = false;
  await refreshM ()
  .then() 
 miData = miDatanew;
  showvd = true; 
  addM = false;
   blabla = miData.map(c => c.missionName);
  await findM ()
 .then ()
 addM = true;
};
async function addnewr (event) {
  const skob = event.detail.skob;
  const mid = event.detail.mid;
  const miDatanew = event.detail.data;
  const y = miDatanew.map(c => c.id);
  const index = y.indexOf(mid);
  miDatanew[index].tafkidims.push(skob);
  showvd = false;
   await refreshM ()
   .then() 
  miData = miDatanew;
    showvd = true; 
    addM = false;
     blabla = miData.map(c => c.missionName);
    await findM ()
  .then ()
  addM = true;
};

function closeM () {
 addM = false;
 showvd = false ;
 blabla = [];
};

let descripFor;

async function addneww (event) {
  const skob = event.detail.skob;
  const mid = event.detail.mid;
  const miDatanew = event.detail.data;
  const y = miDatanew.map(c => c.id);
  const index = y.indexOf(mid);
  miDatanew[index].work_ways.push(skob);
  showvd = false;
   await refreshM ()
   .then() 
  miData = miDatanew;
  showvd = true; 
  addM = false;
   blabla = miData.map(c => c.missionName);
  await findM ()
  .then ()
  addM = true;
};
let openMA = false;
let cencel1 = "סגירה";

let openMS = false;

function close () {
  showvd = false;
  addM = false;
}
let meDatamm = [];
async function updi (){
 var resultString = needr.join('&id_in=');
 let linkpp ="https://new-zuhk.onrender.com/mashaabims?id_in=" + resultString ;
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
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
            const res = await fetch(linkpp, {
              method: 'GET',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
            }).then(checkStatus)
          .then(parseJSON);
            meDatamm = res;
            
        } catch (e) {
            error1 = e
        }
       
}

function clo () {
  totalneed = false
  addN = false;
  meDatamm = [];
}
let noofopen = 2;

let pendS = false;
let hovered = false;
let hoveredd = false;

function bighand() {
  hovered = !hovered
}
function bighandd() {
  hoveredd = !hoveredd
}
function addp () {
  if (projectUsers.length == 1) {
      a = 0;
            isOpen = true;
  }  else {
    alert("בריקמה עם מס חברים גדול מ-1 יש צורך בהסכמה של כולם, מערכת ההצבעות משתחררת בקרוב ודרכה ניתן יהיה לשנות")
  }
//if project users more then 1
}
function editp () {
  if (projectUsers.length == 1) {
      a = 0;
            isOpen = true;
  } else {
    alert("בריקמה עם מס חברים גדול מ-1 יש צורך בהסכמה של כולם, מערכת ההצבעות משתחררת בקרוב ודרכה ניתן יהיה לשנות")
  }
//if project users more then 1
} 
function editb () {
//if project users more then 1
 if (projectUsers.length == 1) {
      a = 1;
            isOpen = true;
  } else {
    alert("בריקמה עם מס חברים גדול מ-1 יש צורך בהסכמה של כולם, מערכת ההצבעות משתחררת בקרוב ודרכה ניתן יהיה לשנות")
  }
}

const closer = () => {
    isOpen = false;
  a = 0;
};
let files;
function basic (){
      isOpen = true;
      a = 1;
} 
function allbackFunction(event) {
    a = 2;
    files = event.detail.files;
    sendP ();
}
let url1 = "https://new-zuhk.onrender.com/upload";
let meDatap = [];
let mecata = [];
function sendP () {
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
    let linkdi ="https://new-zuhk.onrender.com/projects/" + $idPr ;
  //  let fd = new FormData();
     //   fd.append('files', files[0]);
      axios
     .post( url1, files  ,{
                    headers: {
                        Authorization: bearer1,
                    },
                })
                .then(({ data }) => {
                    const imageId = data[0].id;  
      axios
      .put(linkdi, {
        profilePic: imageId,
                  },
      {
      headers: {
        'Authorization': bearer1
                }})
      .then(response => {
        meDatap = response.data;
       
          srcP = meDatap.profilePic.formats.thumbnail.url;
                    srcP = meDatap.profilePic.formats.small.url;

        srcP = meDatap.profilePic.url;
    isOpen = false;
    a = 0;
                  })
      .catch(error => {
        console.log('צריך לתקן:', error.response);
        if (error.response != undefined) {
          a = 3;
        }
                });
      
})};
let ataN = [];
  
async function upd (projectName_valuei, desPi, linkPi, desPli, selectedi, restimei) {
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
    let linkdi ="https://new-zuhk.onrender.com/projects/" + $idPr ;
   await   axios
      .put(linkdi, {
    projectName: projectName_valuei, 
    publicDescription: desPi,
    linkToWebsite: linkPi,
    descripFor: desPli,
    vallues: selectedi,
    restime: restimei,
                    },
      {
      headers: {
        'Authorization': bearer1
                }})
      .then(resp => {
        mecata = resp.data;
      console.log(mecata);
       projectname  = mecata.projectName;
       desP = mecata.publicDescription;
       restime  = mecata.restime ;
       vallues  = mecata.vallues;
       linkP  = mecata.linkP;
        descripFor = mecata.descripFor;
    isOpen = false;
    a = 0;
                  })
      .catch(error => {
        console.log('צריך לתקן:', error.response);
        if (error.response != undefined) {
          a = 3;
        }
                });
      
    };
    function updete (event) {
    a = 2;
upd (event.detail.projectName_value, event.detail.desP, event.detail.linkP, event.detail.desPl, event.detail.valit, event.detail.restime)
    }
    
   
async function projectn (id) {
    idPr.set(id);
    await  goto("/moach");
    meData = await start()
};
let needr = [];
let loadr = false;
async function needad (event){
        const x = event.detail.x
      if (x.length > 0 || x > 0){
		dow.scrollIntoView(true);
        loadr = true;
      needr = x;
     totalneed = false;
 await updi ()
 .then() 
 loadr = false;
  totalneed = true
		dow.scrollIntoView(true);

  }
}
async function needadm (event){
        const x = event.detail.x
        const y = event.detail.scob
      if (x.length > 0 || x > 0){
		dow.scrollIntoView(true);
        loadr = true;
      needr.push(x);
      needr = needr
     totalneed = false;
 await updi ()
 .then() 
 loadr = false;
  totalneed = true
		dow.scrollIntoView(true);

  }
}

async function wdwd (event) {
    const miDatanew = event.detail.data;
  const y = miDatanew.map(c => c.id);
 const id = event.detail.id;
 const index = y.indexOf(id);
 if (index > -1) {
  miDatanew.splice(index, 1);
 };
 if (miDatanew.length > 0) {
 totalneed = false; 
 meDatamm = miDatanew;
   needr = meDatamm.map(c => c.id);
  totalneed = true; 
  } else {
  totalneed = false; 
 }
}
let hal = false;
let pir = false;
function trym(){
   openMS = true
}
function tryma(){
   openMA = true
}
function masi(){
  loadr = true;
   addN = true;
   		lll.scrollIntoView(true);

}

function titlel (event){
  ti = event.detail.ti
}
    </script>
<svelte:head>
  <title>מוח הריקמה 1❤️1</title>
      <link rel="preload" as="image" href="https://res.cloudinary.com/love1/image/upload/v1642614850/buttonP2_tock4d.svg"  />
       <link rel="preload" as="image" href=" https://res.cloudinary.com/love1/image/upload/v1647481283/mashahab_ge9ant.svg"  />

</svelte:head>
<div class="alli"></div>

    {#if $idPr }
    {#await meData }
<div class="alli grid items-center justify-center">
         <RingLoader size="260" color="#FF0092" unit="px" duration="2s"></RingLoader>
         </div> 
         {:then meData}
         <!--   <Tooltip title="{ti}" >--> 
<DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form">
      <div style="z-index: 400;" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          on:click={closer}>ביטול</button>
          {#if a == 0}
          <Uplad on:message={allbackFunction}/>


          {:else if a == 1}
        <Editb
        on:message={updete}
        selected={valit}
        {restime}
         {desP}
          projectName_value={projectname}
          desPl={descripFor}
          {linkP}/>
          {:else if a == 2}
          <div class="sp bg-gold">
            <h3 class="text-barbi">רק רגע בבקשה</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> 
         {:else if a == 3}
         <h1> אירעה שגיאה</h1>
         <button class="hover:bg-barbi text-barbi hover:text-gold bg-gold rounded-full" on:click={()=> a = 0}>לנסות שוב</button>
         {/if}
  </DialogContent>
  </div>
</DialogOverlay>
<!--{#if idUst.map(c => c.id) == idUsl} 
בנוסף במקרה של רענון יעלם האידי של הרקמה
לכן לוודא שיש ערכים ואם לא לתת אפשרות לבחור רקמה או להחזיר לדף הבית-->

<div dir="rtl" class="all  text-barbi text-center">
  <Header/>
  
  <div>
{#if project.profilePic !== null}
      <img
      width="100" height="100" 
      style="border-radius: 50%; margin-right:auto; margin-left:auto ;"  
      src={srcP}
      alt="profilePic">
      <button
          class="text-barbi hover:bg-barbi hover:text-mturk rounded-full"
          title="עריכת תמונת הפרופיל של הריקמה"
          on:click={editp} 
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.7 14.3L21.7 15.3L19.7 13.3L20.7 12.3C20.8 12.2 20.9 12.1 21.1 12.1C21.2 12.1 21.4 12.2 21.5 12.3L22.8 13.6C22.9 13.8 22.9 14.1 22.7 14.3M13 19.9V22H15.1L21.2 15.9L19.2 13.9L13 19.9M11.21 15.83L9.25 13.47L6.5 17H13.12L15.66 14.55L13.96 12.29L11.21 15.83M11 19.9V19.05L11.05 19H5V5H19V11.31L21 9.38V5C21 3.9 20.11 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H11V19.9Z" />
    </svg>
          </button>
          {:else}
           <button
          class="bg-barbi hover:bg-mturk text-barbi rounded-full"
          title="העלאת תמונת פרופיל לריקמה"
          on:click={addp} 
          >
          <svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M7 19L12 14L13.88 15.88C13.33 16.79 13 17.86 13 19H7M10 10.5C10 9.67 9.33 9 8.5 9S7 9.67 7 10.5 7.67 12 8.5 12 10 11.33 10 10.5M13.09 20H6V4H13V9H18V13.09C18.33 13.04 18.66 13 19 13C19.34 13 19.67 13.04 20 13.09V8L14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H13.81C13.46 21.39 13.21 20.72 13.09 20M18 15V18H15V20H18V23H20V20H23V18H20V15H18Z" />
 </svg>
 </button>
{/if}
           <button
          class=" hover:bg-mturk text-barbi rounded-full"
          title="עריכת פרטי ריקמה"
          on:click={editb} 
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
           <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
          </svg>
          </button>
                     <button
          class=" hover:bg-mturk text-barbi rounded-full"
          title="העמוד הציבורי של הריקמה"
          on:click={goto(`/project/${$idPr}`)}
          >
          <svg class="sv"  style="width:24px;height:24px" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path
           fill="currentColor" d="M14.851 11.923c-.179-.641-.521-1.246-1.025-1.749-1.562-1.562-4.095-1.563-5.657 0l-4.998 4.998c-1.562 1.563-1.563 4.095 0 5.657 1.562 1.563 4.096 1.561 5.656 0l3.842-3.841.333.009c.404 0 .802-.04 1.189-.117l-4.657 4.656c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-1.952-1.951-1.952-5.12 0-7.071l4.998-4.998c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464.493.493.861 1.063 1.105 1.672l-.787.784zm-5.703.147c.178.643.521 1.25 1.026 1.756 1.562 1.563 4.096 1.561 5.656 0l4.999-4.998c1.563-1.562 1.563-4.095 0-5.657-1.562-1.562-4.095-1.563-5.657 0l-3.841 3.841-.333-.009c-.404 0-.802.04-1.189.117l4.656-4.656c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464 1.951 1.951 1.951 5.119 0 7.071l-4.999 4.998c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-.494-.495-.863-1.067-1.107-1.678l.788-.785z"/></svg>
          </button>
  <h1 class="1 ">{projectname}</h1>
  {#if project.publicDescription}
   <p class="2 ">{desP}</p>
  {/if}
  {#if project.descripFor}
   <p>{descripFor}</p>
  {/if}
  {#if linkP}
  <a target="_blank" href={linkP}>לינק לאתר</a>  
  {/if}
  <div class="3  ">
  {#each projectUsers as user}
  
  <a class="textlink hover:text-scale-150 hover:text-gold"
   sveltekit:prefetch href={`/user/${user.id}`}>  <h6 class="textlink hover:text-scale-150 hover:text-gold">{user.username}</h6></a>
 
  {/each}
  <div class="border-2 border-barbi m-2"> 
    <h2 class="text-barbi text-bold underline decoration-mturk">ערכים ומטרות</h2>
  <div class="flex flex-row flex-wrap justify-between"> 

  {#each vallues as vallue, i }
    <p> {vallue.valueName} </p>
  {/each}</div></div>
  <!--
  <div>
 <Fini users={projectUsers} {fmiData}/></div>-->

<div class=" hhh">
   {#if hovered}
  <button on:click={hosa} on:mouseleave={bighand} ><img title={hosafa}  width="240px" height="240px" src="https://res.cloudinary.com/love1/image/upload/v1642614850/buttonP2_tock4d.svg" alt="cheked"></button> 

  {:else}
 <Hand on:hosa={hosa} on:progres={bighand} on:trym={trym}  {noofopen} {openMS} {addM} {hosafa}/>
{/if}
  {#if hoveredd}
  <button on:click={masi} on:mouseleave={bighandd} ><img title={hosafat}  width="240px" height="240px" src="https://res.cloudinary.com/love1/image/upload/v1647481283/mashahab_ge9ant.svg" alt="cheked"></button> 

  {:else}
   <Handd on:trym={tryma} on:masi={masi} on:bighandd={bighandd} {noofopenm} {openMA} {addN} {hosafat}/>

{/if}

</div>
<div dir="ltr">
  {#await meData}
  <div>..</div>
  {:then meData}
<Gantt {bmiData} {pmiData} {omiData} {fmiData}/>
{/await}
</div>
<div class=" m-4 ">

{#if pmiData.length > 0}

  {#if pendS === false}
<button
 class="border  border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 m-4 rounded-full"
on:click={() => pendS = true}> פעולות ממתינות לאישור</button>
{:else}
<button title={cencel1}
  on:click={() => pendS = false}
  class=" hover:bg-barbi text-barbi hover:text-gold font-bold  p-0.5 rounded-full"
   ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
  </svg></button>
 <PendsM {pmiData} user_1s={projectUsers.length}/>
{/if} 
{/if}
<div >

{#if bmiData.length > 0}
 {#if tahaS === false}
<button
 class="border  border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
on:click={() => tahaS = true}> פעולות בתהליך ביצוע</button>
{:else}
<button title={cencel1}
  on:click={() => tahaS = false}
  class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold  p-0.5 rounded-full"
   ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
  </svg></button>
 <Betaha {bmiData} />
{/if} 
{/if}
</div>
  <div class=" m-4 ">

{#if openMS === true && omiData.length > 0}

  <button title={cencel1}
  on:click={() => openMS = false}
  class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold  p-0.5 rounded-full"
   ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
  </svg></button> 
<OpenM omiData={omiData}/>
 {:else if openMS === true && omiData.length == 0}
  <button title={cencel1}
  on:click={() => openMS = false}
  class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold  p-0.5 rounded-full"
   ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
  </svg></button>
 <h2> אין פעולות פתוחות לריקמה זו, מומלץ ליצור כבר עכשיו
   <br>
   (לחצו על היד המחזיקה מנורה שלמעלה)</h2>

  {/if}
     </div>
<div class="m-4 ">

{#if openMA === true && opmash.length > 0}

  <button title={cencel1}
  on:click={() => openMA = false}
  class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold  p-0.5 rounded-full"
   ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
  </svg></button> 
<Mashman meData={opmash}/>
 {:else if openMA === true && opmash.length == 0}
  <button title={cencel1}
  on:click={() => openMA = false}
  class="bg-pink-200 hover:bg-barbi text-mturk hover:text-gold font-bold  p-0.5 rounded-full"
   ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
  </svg></button>
 <h2> אין משאבים מבוקשים לריקמה זו, מומלץ ליצור כבר עכשיו
   <br>
   (לחצו על היד המחזיקה מגנט שלמעלה)</h2>

  {/if}
     </div>
  <!-- כפתור שרק איתו יש את האפשרות כנ"ל על משאבים
  כן להוסיף סקשן שמראה את שלל סוגי המשימות בדיפולט
כולל לפי יוזרים וכו-->

<div >
 {#if addM === true}
   <div bind:this={hosaf}   class=" m-4 border-2 border-barbi rounded" >
<button
 title={cencel}
      on:click={closeM}
       class=" hover:bg-barbi text-barbi hover:text-gold font-bold p-0.5 rounded-full"
       ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
    </svg></button>
  <ChoosMission 
  roles={roles} 
  mission1={mission1} 
  bind:selected={blabla} 
  on:message={callbackFunction}/>
  </div>

 {/if}
     </div>

    </div>

    <div  bind:this={cow}>
      {#if load === true}
        <div class="grid justify-center items-center border-2 border-barbi rounded p-4" >

      <RingLoader size="80" color="#ff00ae" unit="px" duration="2s"></RingLoader>
        </div>
                 {/if}
{#if showvd == true}<Mission 
                                userslength={projectUsers.length}
                                 workways2 ={workways2}
                                 skills2={skills2}
                                 roles={roles}
                                 roles1={roles}
                                 vallues={meData.vallues.map(c => c.id)} 
                                 miData={miData} 
                                 projectId={$idPr}
                                 on:remove={removeF}
                                 on:removeS={removeS}
                                 on:addskills={addskills}
                                 on:addnewsk={addnewsk}
                                 on:removeR={removeR}
                                 on:addroles={addroles}
                                 on:addnewr={addnewr}
                                 on:addneww={addneww}
                                 on:adwww={adwww}
                                 on:removeW={removeW}
                                 on:close={close}
                                 /> {/if}</div>
                              
<div class=" m-4" bind:this={dow}>
 
      {#if addN == true}
      <div id="hosafn" class="m-4 border-2 border-barbi rounded"  >
      <button
      title={cencel}
      on:click={() => addN = false}
       class=" hover:bg-barbi text-barbi hover:text-gold font-bold py-0.5 rounded-full"
       ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
    </svg></button> 
     <ChoosNeed on:str={()=>loadr = false} on:add={needad} on:addm={needadm} selectedi={needr}/>
      </div>
      {/if}    
   
    <div class=" m-4" bind:this={lll} >
       {#if loadr === true}
        <div class="grid justify-center items-center border-2 border-barbi rounded p-4" >

      <RingLoader size="80" color="#ff00ae" unit="px" duration="2s"></RingLoader>
        </div>
                 {/if}
    {#if totalneed === true} 
    
    <TotalNeeds projectId={$idPr} userslength={projectUsers.length} {needr} meData={meDatamm}
                                     on:close={clo}
                                     on:remove={wdwd}
    />{/if}</div>
</div>
    <div class=" p-2">
      <Hamatanot {trili} {fmiData} {rikmashes} {salee} {projectUsers} bmiData={bmimData}/>
      <br>
      {#if fmiData.length > 0 || rikmashes.length > 0}
        <div class="m-4 border-2  border-barbi rounded p-4" >

    <Fini fmiData={fmiData} users={projectUsers} {rikmashes} on:tit={titlel}/>
    <br>
    {#if hal === false}
    <button on:click={() => hal = true} class="border  border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full">
    חישוב רווח בגירסה ראשונית
  </button>
      {:else if hal === true}
       <button
      title={cencel}
      on:click={() => hal = false}
       class=" hover:bg-barbi text-barbi hover:text-gold font-bold py-0.5 rounded-full"
       ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
    </svg></button> 
    
    <Hach meData={rikmashes} fmiData={fmiData} users={projectUsers} {rikmashes}/>
      {/if}
      </div>
    {/if}
    </div>
    
   </div> 
</div>

</div>

  <!-- </Tooltip> {:else}
    לשלוח אותו לרקמה ציבורי לקחת ID וכו'
    <h1 class="bg-white">לא מורשה</h1>
    {/if}-->
    {/await}
 {:else }  
 {#await projects }
<div class="alli grid items-center justify-center">
         <RingLoader size="260" color="#FF0092" unit="px" duration="2s"></RingLoader>
         </div> 
         {:then projects}
 <div class="flex text-center flex-col border-2  border-barbi rounded m-4">
<h1 class="text-barbi font-bold py-2 px-4 m-4 rounded-full">בחירת ריקמה</h1>
 
           {#each projects as data, i}
          
          <button
          class=" border  border-barbi hover:border-gold font-bold border  border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold p-0.5 m-2 rounded-full"
          on:click={()=>projectn(data.id)}
          > {data.projectName}
          </button>
  {/each}

 </div>  {/await}

 {/if}

 <style>
   .alli{
 /*   background: radial-gradient(circle at 0.9% 49.5%, rgb(0, 250, 255) 0%, rgb(2, 255, 187) 100.2%); */
 background: radial-gradient(circle at 0.9%,rgb(2, 255, 187) 0%, rgb(238 232 170)  50%, rgb(2, 255, 187) 100.2%);
     z-index: -1;
  min-width: 100vw;
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
   }
   .hhh{
     display: flex;
     flex-direction: column;
     align-items: center;
     justify-content: center;
   }
    .all{
     min-height: 100vh;
   }
.textlink:hover{
  -webkit-text-stroke: 1px var(--barbi-pink);
}

 :global(li:not(.selected):hover) {
 color: var(--barbi-pink);
    background-color:var(--lturk);    /* unselected but hovered options in the dropdown list */
  }
  :global(ul.tokens > li){
    background-color: var(--barbi-pink);
    color:var(--lturk);
  }

   .sp{
   display: grid;
    justify-content: center;
  align-items: center; 
  }
    :global([data-svelte-dialog-content].content) {
     background-image: url(https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg);
      background-position: center;
      background-size: cover;
      width: 80vw;
  }
  @media (min-width: 568px){
        :global([data-svelte-dialog-content].content) {
width:50vw;
        }
        .hhh{
     display: flex;
     flex-direction: row;
        }
  }
 </style>