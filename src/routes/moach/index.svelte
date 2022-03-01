<script>
  //	import { draw } from 'svelte/transition';
  import Header from '../../lib/components/header/header.svelte'
  import { RingLoader
} from 'svelte-loading-spinners'
    import Uplad from '../../lib/components/userPr/uploadPic.svelte';
    import axios from 'axios';
    import Editb from '../../lib/components/prPr/editp.svelte'
   import { onMount } from 'svelte'; 
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

//import { validate_component } from 'svelte/internal';
 import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';

let isOpen = false;
let a = 0;
  let fmiData = [];
  let tahaS = false;
  let bmiData = [];
  let mission1 = [];
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
            const res = await fetch("https://strapi-k4vr.onrender.com/missions?_limit=-1", {
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
   let meData;
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
let idL;
let vallues = [];
let ata = [];
let restime;
let valit;
let projects = [];
let user = [];
onMount(async () => {
start ()
})
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
  idL = cookieValueId;
    token  = cookieValue; 
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
            const res = await fetch("https://strapi-k4vr.onrender.com/graphql" , {//+ $idPr
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
            const res = await fetch("https://strapi-k4vr.onrender.com/graphql" , {//+ $idPr
              method: "POST",
              headers: {
                'Authorization': bearer1,
                 'Content-Type': 'application/json'
              }, body: 
        JSON.stringify({query:
          `{project(id:"${$idPr}"){
            projectName
            descripFor
            publicDescription
            finnished_missions {id missionName why total descrip hearotMeyuchadot users_permissions_user {id}}
             user_1s {id username profilePic {url formats}}
              mesimabetahaliches {
              hearotMeyuchadot howmanyhoursalready name descrip hoursassinged perhour privatlinks publicklinks }
            open_missions (where:{archived: false }) { id name hearotMeyuchadot descrip noofhours perhour sqadualed
                                    privatlinks publicklinks
                                    rishon {id}
                                    skills { id skillName}
                                    tafkidims {id roleDescription}
                                    work_ways {id workWayName} 
                                    mission { id}
                        } 
             pendms (where:{archived: false }) {id name hearotMeyuchadot descrip noofhours perhour sqadualed
                                    privatlinks publicklinks
                                    rishon {id}
                                    skills { id skillName}
                                    tafkidims {id roleDescription}
                                    work_ways {id workWayName} 
                                    mission { id}
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
            if (project.mesimabetahaliches.length > 1){
            bmiData = project.mesimabetahaliches;
            } else if (project.mesimabetahaliches.length == null) {
            bmiData.push(project.mesimabetahaliches);
            }
            if (project.finnished_missions.length > 1){
            fmiData = project.finnished_missions;
            } else if (project.finnished_missions.length == null) {
            fmiData.push(project.finnished_missions);
            }
          //  if (project.open_missions.length > 1){
            omiData = project.open_missions;
          //  } else if (project.open_missions.length == null){
          //  omiData.push(project.open_missions);
          //  }
            if (project.pendms.length > 1){
            pmiData = project.pendms;
            } else if (project.pendms.length == null){
            pmiData.push(project.pendms);
            }
        //    omiData = omiData;
            pmiData = pmiData;
            bmiData = bmiData;
            vallues = project.vallues;
            valit = vallues.map(c => c.valueName);
             meData.linkToWebsite = linkP;
            noofopen = project.open_missions.length;
            if (project.profilePic !== null){
            srcP = project.profilePic.url;
            }
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
        } } else {
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
      }; let linkg ="https://strapi-k4vr.onrender.com/graphql" ;
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
  .then(data => user = data.data.user);
            console.log(user);
            projects = user.projects_1s;
          console.log(projects);
        } catch (e) {
            error1 = e
        }
        }

    };

    function pre(projectUsers, fmiData){

    }

   let li = [];
   let miData = [];
 let blabla = [];
 let load = false;
async function callbackFunction(event) {

 load = true;
		cow.scrollIntoView({ block: "start"});
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
	};    
}
async function findiM() {
  var resultString = li.join('&id_in=');
 let link ="https://strapi-k4vr.onrender.com/missions?id_in=" + resultString ;
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
            const res = await fetch("https://strapi-k4vr.onrender.com/tafkidims?_limit=-1", {
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
            const res = await fetch("https://strapi-k4vr.onrender.com/skills?_limit=-1", {
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
            const res = await fetch("https://strapi-k4vr.onrender.com/work-ways?_limit=-1", {
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

await findM ()
.then ()
addM = true;
		hosaf.scrollIntoView({ block: "start"});
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
let cencel1 = "סגירה";

let openMS = false;

function close () {
  showvd = false;
  addM = false;
}
let meDatamm = [];
async function updi (){
var resultString = needr.join('&id_in=');
let linkpp ="https://strapi-k4vr.onrender.com/mashaabims?id_in=" + resultString ;
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
}
let noofopen = 2;

let pendS = false;
let hovered = false;
function bighand() {
  hovered = !hovered
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
      let url1 = "https://strapi-k4vr.onrender.com/upload";
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
    let linkdi ="https://strapi-k4vr.onrender.com/projects/" + $idPr ;
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
    let linkdi ="https://strapi-k4vr.onrender.com/projects/" + $idPr ;
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
      let dow;
      let cow;
      let hosaf;
    function scrollTo(dow) {
      console.log(dow)
		dow.scrollIntoView({ block: "center"});
    console.log("done")
	}
function projectn (id) {
    idPr.set(id);
start ()
  };
let needr = [];
let loadr = false;
async function needad (event){
        const x = event.detail.x
      if (x.length > 0 || x > 0){
        scrollTo(dow)
        loadr = true;
                scrollTo(dow)
      needr = x;
     totalneed = false;
 await updi ()
 .then() 
 loadr = false;

     totalneed = true
             scrollTo(dow)

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
    </script>
    <svelte:head>
  <title>מוח הריקמה 1❤️1</title>
</svelte:head>


    {#if $idPr }
    
 <DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
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
<div dir="rtl" class="all bg-lturk text-barbi text-center">
  <Header/>
  <div>
  {#if project.profilePic !== null}
      <img
      width="100" height="100" 
      style="border-radius: 50%; margin-right:auto; margin-left:auto ;"  
      src={srcP}
      alt="profilePic">
      <button
          class="text-pink-200 hover:bg-barbi hover:text-mturk rounded-full"
          title="עריכת תמונת הפרופיל של הריקמה"
          on:click={editp} 
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M22.7 14.3L21.7 15.3L19.7 13.3L20.7 12.3C20.8 12.2 20.9 12.1 21.1 12.1C21.2 12.1 21.4 12.2 21.5 12.3L22.8 13.6C22.9 13.8 22.9 14.1 22.7 14.3M13 19.9V22H15.1L21.2 15.9L19.2 13.9L13 19.9M11.21 15.83L9.25 13.47L6.5 17H13.12L15.66 14.55L13.96 12.29L11.21 15.83M11 19.9V19.05L11.05 19H5V5H19V11.31L21 9.38V5C21 3.9 20.11 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H11V19.9Z" />
</svg>
          </button>
          {:else}
           <button
          class="bg-pink-200 hover:bg-barbi text-mturk rounded-full"
          title="העלאת תמונת פרופיל לריקמה"
          on:click={addp} 
          >
          <svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M7 19L12 14L13.88 15.88C13.33 16.79 13 17.86 13 19H7M10 10.5C10 9.67 9.33 9 8.5 9S7 9.67 7 10.5 7.67 12 8.5 12 10 11.33 10 10.5M13.09 20H6V4H13V9H18V13.09C18.33 13.04 18.66 13 19 13C19.34 13 19.67 13.04 20 13.09V8L14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H13.81C13.46 21.39 13.21 20.72 13.09 20M18 15V18H15V20H18V23H20V20H23V18H20V15H18Z" />
</svg>
</button>
          {/if}
           <button
          class=" hover:bg-barbi text-pink-200 rounded-full"
          title="עריכת פרטי ריקמה"
          on:click={editb} 
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
           <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
          </svg>
          </button>
    </div>
  <h1 class="1 bg-lturk">{projectname}</h1>
  {#if project.publicDescription}
  <h6 class="2 bg-lturk">{desP}</h6>
  {/if}
  {#if project.descripFor}
  <p class="bg-lturk">{descripFor}</p>
  {/if}
  {#if linkP}
  <a class="bg-lturk" href={linkP}>לינק לאתר</a>  
  {/if}
  <div class="3 bg-lturk ">
  {#each projectUsers as user}
  
  <a class="textlink hover:text-scale-150 hover:text-gold"
   sveltekit:prefetch href={`/user/${user.id}`}>  <h6 class="textlink hover:text-scale-150 hover:text-gold">{user.username}</h6></a>
 
  {/each}
  <div class="border-2 border-gold m-2"> 
    <h2 class="text-barbi text-bold underline decoration-gold">ערכים ומטרות</h2>
  <div class="flex flex-row flex-wrap justify-between"> 

  {#each vallues as vallue, i }
    <h3> {vallue.valueName} </h3>
  {/each}</div></div>
  </div>
  <!--
  <div>
 <Fini users={projectUsers} {fmiData}/></div>-->

<div class="bg-lturk" style="width:240px; height:240px; margin: 0 auto;">
   {#if hovered}
  <button on:click={hosa} on:mouseleave={bighand} ><img title={hosafa}  width="240px" height="240px" src="https://res.cloudinary.com/love1/image/upload/v1642614850/buttonP2_tock4d.svg" alt="cheked"></button> 

  {:else}
 
<svg width="240" height="240" viewBox="304.017 285.449 844.373 823.956" id="svg2" version="1.1"  >
  <defs id="defs4">
    <linearGradient id="linearGradient4328">
      <stop style="stop-color:#000000;stop-opacity:1;" offset="0" id="stop4330"/>
      <stop style="stop-color:#000000;stop-opacity:0;" offset="1" id="stop4332"/>
    </linearGradient>
    <linearGradient id="linearGradient4248">
      <stop style="stop-color:#6600ff;stop-opacity:1;" offset="0" id="stop4250"/>
      <stop style="stop-color:#6600ff;stop-opacity:0;" offset="1" id="stop4252"/>
    </linearGradient>
    <linearGradient id="linearGradient4208">
      <stop style="stop-color:#000000;stop-opacity:1;" offset="0" id="stop4210"/>
      <stop style="stop-color:#000000;stop-opacity:0;" offset="1" id="stop4212"/>
    </linearGradient>
    <linearGradient id="linearGradient4190">
      <stop style="stop-color:#3e3748;stop-opacity:1;" offset="0" id="stop4192"/>
      <stop style="stop-color:#3e3748;stop-opacity:0;" offset="1" id="stop4194"/>
    </linearGradient>
    <linearGradient id="linearGradient4172">
      <stop style="stop-color:#d400aa;stop-opacity:1;" offset="0" id="stop4174"/>
      <stop style="stop-color:#d400aa;stop-opacity:0;" offset="1" id="stop4176"/>
    </linearGradient>
    <linearGradient id="linearGradient4160">
      <stop style="stop-color:#8800aa;stop-opacity:1;" offset="0" id="stop4162"/>
      <stop style="stop-color:#8800aa;stop-opacity:0;" offset="1" id="stop4164"/>
    </linearGradient>
    <linearGradient id="linearGradient4166" x1="420" y1="135.21935" x2="311.42856" y2="820.93365" gradientUnits="userSpaceOnUse" xlink:href="#linearGradient4160"/>
    <linearGradient id="linearGradient4178" x1="177.14285" y1="866.64795" x2="351.42856" y2="569.50507" gradientUnits="userSpaceOnUse" xlink:href="#linearGradient4172"/>
    <linearGradient id="linearGradient4196" x1="402.85715" y1="443.79077" x2="371.42856" y2="513.79077" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1, 0, 0, 1, -6.658412, 11.985066)" xlink:href="#linearGradient4190"/>
    <linearGradient id="linearGradient4214" x1="342.36221" y1="547.14288" x2="496.64792" y2="487.14285" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#linearGradient4208"/>
    <linearGradient id="linearGradient41720" gradientUnits="userSpaceOnUse" x1="-365.389" y1="-638.166" x2="-365.389" y2="-438.166" gradientTransform="matrix(1, 0, 0, 1, 0.000153, -0.000343)" xlink:href="#linearGradient4172"/>
    <linearGradient gradientUnits="userSpaceOnUse" x1="4874.692" y1="4161.333" x2="4874.692" y2="7296.596" id="gradient0">
      <stop offset="0" style="stop-color: rgb(187, 0, 185);"/>
      <stop offset="1" style="stop-color: rgba(60, 3, 70, 1)"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5318.561" y1="6142.109" x2="5318.561" y2="6438.701" id="gradient1">
      <stop offset="0" style="stop-color: rgba(144, 6, 169, 1)"/>
      <stop offset="1" style="stop-color: rgba(60, 3, 70, 1)"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5339.43" y1="6299.291" x2="5339.43" y2="9420.939" id="gradient2">
      <stop offset="0" style="stop-color: rgb(207, 1, 175);"/>
      <stop offset="1" style="stop-color: rgba(60, 3, 70, 1)"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5699.934" y1="6421.589" x2="5699.934" y2="6591.243" id="gradient3">
      <stop offset="0" style="stop-color: rgba(144, 6, 169, 1)"/>
      <stop offset="1" style="stop-color: rgba(60, 3, 70, 1)"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5709.335" y1="6702.26" x2="5709.335" y2="6871.909" id="gradient4">
      <stop offset="0" style="stop-color: rgba(144, 6, 169, 1)"/>
      <stop offset="1" style="stop-color: rgba(60, 3, 70, 1)"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5718.738" y1="6982.931" x2="5718.738" y2="7152.58" id="gradient5">
      <stop offset="0" style="stop-color: rgba(144, 6, 169, 1)"/>
      <stop offset="1" style="stop-color: rgba(60, 3, 70, 1)"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="4874.692" y1="4161.333" x2="4874.692" y2="7296.596" id="gradient12">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: #758d29"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5318.561" y1="6142.109" x2="5318.561" y2="6438.701" id="gradient13">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: #758d29"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5339.43" y1="6299.291" x2="5339.43" y2="9420.939" id="gradient14">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: #758d29"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5699.934" y1="6421.589" x2="5699.934" y2="6591.243" id="gradient15">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: #758d29"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5709.335" y1="6702.26" x2="5709.335" y2="6871.909" id="gradient16">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: #758d29"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="5718.738" y1="6982.931" x2="5718.738" y2="7152.58" id="gradient17">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: #758d29"/>
    </linearGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="5238.913" cy="2888.417" r="965.251" id="gradient8">
      <stop offset="0" style="stop-color: rgba(252, 206, 91, 1)"/>
      <stop offset="1" style="stop-color: rgb(228, 252, 74);"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="5254.77" cy="3534.64" r="482.2" id="gradient7">
      <stop offset="0" style="stop-color: rgb(248, 78, 245);"/>
      <stop offset="1" style="stop-color: rgb(251, 255, 138);"/>
    </radialGradient>
    <path id="textpath1" d="M 229.6546981483698 748.2107315063477 Q 374.4493424668908 640.0388565063477 519.2439867854118 748.2107315063477"/>
    <linearGradient id="linearGradient4328-1" x1="367.76151" y1="740.46686" x2="367.76151" y2="600.46686" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#linearGradient4328"/>
    <linearGradient id="linearGradient4248-1" x1="365.71429" y1="638.07648" x2="342.85715" y2="690.93365" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1, 0, 0, 1, 0, 0)" xlink:href="#linearGradient4248"/>
    <path id="textpath0" d="M 263.765625 724.125 Q 360.640625 615.6875 457.515625 724.125"/>
    <path id="textpath2" d="M 172.219 851.969 C 313.781 786.969 455.344 786.969 596.906 851.969"/>
    <path id="path1" d="M 172.21875 851.96875 Q 384.5625 754.46875 596.90625 851.96875"/>
    <path id="path2" d="M 172.21875 851.96875 Q 384.5625 754.46875 596.90625 851.96875"/>
    <path id="path3" d="M 172.21875 851.96875 Q 384.5625 754.46875 596.90625 851.96875"/>
    <path id="path4" d="M 172.21875 851.96875 Q 384.5625 754.46875 596.90625 851.96875"/>
    <path id="path5" d="M 172.219 851.969 C 313.781 786.969 455.344 786.969 596.906 851.969"/>
    <linearGradient id="linearGradient42480" gradientUnits="userSpaceOnUse" x1="393.281" y1="719.281" x2="393.281" y2="876.109" xlink:href="#linearGradient4248"/>
  </defs>
  <g id="layer1" transform="matrix(1.001968, 0, 0, 1, 345.337128, 171.469803)" style="">
    <circle r="394.28571" cy="526.18109" cx="372.04724" id="circle4158" style="fill: rgb(102, 0, 255); fill-opacity: 1; stroke: none; stroke-width: 1.2; stroke-linejoin: bevel; stroke-miterlimit: 4; stroke-dasharray: 14.4, 1.2; stroke-dashoffset: 0; stroke-opacity: 1;"/>
    <circle r="394.28571" cy="526.18109" cx="372.04724" id="circle4170" style="fill: url(#linearGradient4178); fill-opacity: 1; stroke: none; stroke-width: 1.2; stroke-linejoin: bevel; stroke-miterlimit: 4; stroke-dasharray: 14.4, 1.2; stroke-dashoffset: 0; stroke-opacity: 1;"/>
    <circle fill="url(#linearGradient4166)" style=" fill-opacity: 1; stroke: none; stroke-width: 1.2; stroke-linejoin: bevel; stroke-miterlimit: 4; stroke-dasharray: 14.4, 1.2; stroke-dashoffset: 0; stroke-opacity: 1;" id="path4136" cx="372.04724" cy="526.18109" r="394.28571"/>
    <circle r="305.714" cy="529.652" cx="372.047" id="circle4138" fill="rgb(31, 28, 36)" style=" fill-opacity: 1; stroke: none; stroke-width: 1.2; stroke-linejoin: bevel; stroke-miterlimit: 4; stroke-dasharray: 14.4, 1.2; stroke-dashoffset: 0; stroke-opacity: 1;"/>
    <circle r="120" cy="492.047" cx="446.181" id="circle4198" style="fill: url(#linearGradient4214); fill-opacity: 1; stroke: none; stroke-width: 1.2; stroke-linejoin: bevel; stroke-miterlimit: 4; stroke-dasharray: 14.4, 1.2; stroke-dashoffset: 0; stroke-opacity: 1;" transform="matrix(0, 1, 1, 0, -126.658417, 91.985069)"/>
    <circle fill="url(#linearGradient4196)" style=" fill-opacity: 1; stroke: none; stroke-width: 1.2; stroke-linejoin: bevel; stroke-miterlimit: 4; stroke-dasharray: 14.4, 1.2; stroke-dashoffset: 0; stroke-opacity: 1;" id="path4180" cx="365.389" cy="538.166" r="100"/>
   <g transform="matrix(3.031137, 0, 0, 3.031137, 372.679657, 593.32428)">
         <path id="curve" d="M -64.983 -33.564 C -61.345 -35.597 -47.782 -81.5 -0.468 -80.97 C 46.095 -80.44 62.939 -33.076 64.737 -30.119"/>

      <text id="text2" class="s-y1SdroFNffHn" fill="rgb(171, 55, 200)" style=" font-size: 32.9909px; line-height: 121.037px; stroke-width: 42px; word-spacing: -0.8px; white-space: pre;" bx:origin="0.691816 1.299581"><textPath fill="rgb(171, 55, 200)" style=" font-size: 32.9909px; line-height: 121.037px; stroke-width: 42px; word-spacing: -0.8px; white-space: pre;" startOffset="0" class="s-y1SdroFNffHn" xlink:href="#curve">תוחותפ תולועפ</textPath></text>
      <text id="text3" class="s-y1SdroFNffHn" fill="url(#linearGradient42480)" style=" font-size: 32.9909px; line-height: 121.037px; paint-order: stroke markers; stroke-width: 42px; word-spacing: -0.8px; white-space: pre;" transform="matrix(1, 0, 0, 1, -0.998111, 0)" bx:origin="0.691816 1.299581"><textPath startOffset="0" class="s-y1SdroFNffHn" >תוחותפ תולועפ</textPath></text>
    </g>
    {#if addM == false}
    <g id="button"  on:mouseenter={bighand} on:click={hosa} style="">
      <title>{hosafa}</title>
      <g transform="matrix(0.029858, 0, 0, 0.024393, -126.193626, 345.094269)" style="">
        <g id="Layer_2" style=""/>
        <g id="Layer_1" transform="matrix(1, 0, 0, 1, 11188.220703, 2758.716553)" style="">
          <g style="">
            <g style="">
              <g style="">
                <g style="">
                  <g style="">
                    <g style="">
                      <g style="">
                        <g>
                          <g>
                            <path  d="M 6318.957 4764.085 C 6313.357 4157.566 5770.527 4069.96 5748.425 4273.136 C 5718.241 4551.736 5818.078 4564.807 5883.627 4735.953 C 5926.705 4848.507 5967.669 5021.648 5591.185 5084.006 C 5216.038 5146.139 4602.527 5005.119 4605.363 4777.945 C 4607.625 4593.099 4874.812 4403.449 4710.329 4229.19 C 4466.939 3971.114 4171.185 4506.559 4247.505 4873.484 C 4311.03 5178.904 4880.158 5299.052 4880.158 5299.052 C 4685.781 5353.729 4465.01 5294.431 4280.627 5220.928 C 3727.361 5000.533 3650.839 4668.699 3511.562 4825.369 C 3212.151 5162.542 3807.751 5498.303 4213.932 5536.342 C 4498.125 5562.995 4751.162 5515.819 4751.162 5515.819 C 4606.836 5592.122 4456.365 5612.134 4307.605 5627.341 C 3815.567 5677.608 3630.286 5358.153 3511.156 5504.554 C 3303.346 5759.759 3712.183 5969.105 4335.211 5842.249 C 4630.552 5782.046 4839.541 5692.31 4839.541 5692.31 C 4747.521 5794.302 4656.48 5820.259 4550.808 5858.952 C 4203.199 5986.44 3883.686 5856.007 3936.086 6117.988 C 3974.901 6311.921 4398.865 6211.026 4714.354 6046.041 C 4984.905 5904.55 4943.957 5871.792 4943.957 5871.792 L 4936.907 7296.596 L 5748.194 7226.943 L 5708.131 5432.798 C 6061.475 5299.794 6322.714 5171.372 6318.957 4764.085 Z"
                             fill="url(#gradient0)" stroke="url(#gradient12)" style=" "/>
                            <g>
                              <polygon points="4832.027,6142.109 5805.094,6144.867 5803.946,6434.287 4833.332,6438.701 " style="" fill="url(#gradient1)" stroke="url(#gradient13)"/>
                              <polygon points="4784.399,6320.453 5861.002,6299.291 5931.132,9413.135 4747.729,9420.939 " style="" fill="url(#gradient2)" stroke="url(#gradient14)"/>
                            </g>
                          </g>
                        </g>
                        <path  d="M 5747.452 6576.672 C 5786.27 6550.419 5796.42 6497.675 5770.192 6458.889 C 5743.926 6420.071 5691.214 6409.921 5652.396 6436.174 C 5613.628 6462.427 5603.428 6515.139 5629.681 6553.945 C 5655.921 6592.744 5708.665 6602.913 5747.452 6576.672 Z"  style="" fill="url(#gradient3)" stroke="url(#gradient15)"/>
                        <path  d="M 5756.854 6857.334 C 5795.667 6831.081 5805.834 6778.382 5779.569 6739.563 C 5753.33 6700.764 5700.598 6690.583 5661.811 6716.835 C 5623.012 6743.088 5612.843 6795.818 5639.083 6834.618 C 5665.349 6873.419 5718.048 6883.575 5756.854 6857.334 Z" style="" fill="url(#gradient4)" stroke="url(#gradient16)"/>
                        <path  d="M 5766.249 7137.997 C 5805.067 7111.757 5815.236 7059.045 5788.964 7020.226 C 5762.725 6981.44 5709.999 6971.258 5671.213 6997.497 C 5632.414 7023.751 5622.245 7076.476 5648.498 7115.281 C 5674.751 7154.093 5727.449 7164.25 5766.249 7137.997 Z"  style="" fill="url(#gradient5)" stroke="url(#gradient17)"/>
                      </g>
                    </g>
                  </g>
                </g>
                <g style="">
                  <g style="">
                    <g>
                      <g>
                        <g>
                          <path d="M 4852.058 4010.956 C 4781.68 3381.673 3964.893 3066.397 4401.345 2219.095 C 4695.7 1648.041 5896.056 1464.941 6162.084 2466.989 C 6366.766 3237.695 5762.943 3345.993 5674.145 4023.956 L 4852.058 4010.956 Z" style="fill: url(#gradient8);"/>
                        </g>
                        <g>
                          <g>
                            <path d="M 5669.646 4401.217 C 5669.646 4401.217 5794.808 4297.098 5672.824 4228.234 C 5672.824 4228.234 5816.267 4107.348 5674.144 4023.956 L 5481.501 4020.956 C 5504.564 3801.634 5538.343 3582.86 5560.942 3364 C 5574.854 3228.347 5586.266 3092.272 5599.006 2956.51 C 5611.797 2822.484 5635.396 2685.639 5625.942 2550.96 C 5620.994 2480.066 5620.253 2386.458 5553.171 2344.697 C 5507.606 2316.395 5466.718 2369.072 5447.283 2402.89 C 5420.327 2449.751 5404.307 2503.993 5390.363 2557.523 C 5371.324 2473.219 5336.256 2410.5 5272.296 2425.228 C 5194.353 2443.026 5159.22 2604.861 5143.184 2665.625 C 5141.809 2670.757 5140.522 2676.067 5139.015 2681.354 C 5132.474 2648.893 5124.574 2616.602 5114.473 2584.685 C 5091.613 2512.76 5071.305 2415.62 4994.741 2384.947 C 4877.196 2337.812 4840.717 2621.129 4835.986 2679.412 C 4814.199 2951.575 4868.161 3237.266 4919.169 3503.149 C 4944.906 3637.213 4969.406 3771.886 4994.335 3906.083 C 4999.497 3934.144 5002.754 3973.719 5009.224 4013.414 L 4852.058 4010.956 C 4852.058 4010.956 4698.182 4074.336 4839.889 4217.444 C 4839.889 4217.444 4694.606 4288.911 4830.896 4398.063 C 4830.896 4398.063 4699.909 4483.085 4845.205 4562.253 L 5007.461 4571.581 L 5133.815 4721.043 L 5346.889 4732.645 L 5482.835 4590.452 L 5642.04 4584.034 C 5642.041 4584.033 5822.112 4501.853 5669.646 4401.217 Z M 5077.788 4014.574 C 5067.868 3974.785 5063.982 3930.972 5056.845 3892.586 C 5038.689 3794.393 5015.316 3697.433 4998.417 3599.014 C 4960.977 3380.553 4917.687 3163.805 4905.813 2941.813 C 4897.597 2787.927 4886.333 2634.73 4945.211 2489.025 C 4977.012 2410.26 5021.298 2513.467 5032.895 2544.595 C 5051.39 2594.652 5066.823 2644.216 5078.338 2696.187 C 5091.671 2756.29 5098.392 2817.663 5105.98 2878.903 C 5105.645 2912.554 5109.585 2945.228 5119.819 2975.399 C 5119.948 2975.741 5119.977 2975.985 5119.986 2976.282 C 5120.064 2976.282 5120.064 2976.257 5120.179 2976.257 C 5120.992 2978.908 5121.82 2981.541 5122.827 2984.096 C 5136.418 3019.219 5188.659 2996.961 5182.618 2962.708 C 5176.039 2926.206 5170.926 2889.479 5165.892 2852.78 C 5169.874 2743.664 5217.902 2612.499 5257.275 2535.738 C 5305.215 2442.274 5331.928 2650.454 5335.605 2678.921 C 5338.714 2702.274 5340.999 2726.571 5342.819 2751.055 C 5334.197 2802.475 5332.36 2854.237 5348.383 2896.693 C 5360.175 2927.708 5407.216 2913.58 5408.824 2883.895 C 5409.926 2864.557 5411.35 2830.078 5411.176 2788.37 C 5413.206 2780.138 5414.946 2771.747 5415.526 2763.116 C 5418.864 2708.229 5430.148 2657.158 5444.337 2604.378 C 5456.864 2557.94 5470.326 2511.842 5487.589 2467.002 C 5511.87 2404.18 5546.004 2427.169 5552.835 2487.075 C 5559.04 2542.094 5565.787 2594.567 5564.106 2650.157 C 5561.148 2750.484 5545.714 2853.108 5535.178 2952.999 C 5513.12 3161.291 5493.815 3370.139 5476.1 3578.898 C 5463.714 3726.53 5439.085 3872.825 5420.314 4019.951 L 5077.788 4014.574 Z" style="fill: url(#gradient7);"/>
                          </g>
                        </g>
                      </g>
                    </g>
                  </g>
                  <g>
                    <path d="M 4434.165 2676.467 C 4464.255 2609.475 4476.302 2536.732 4501.737 2467.897 C 4520.799 2416.207 4547.016 2370.145 4575.911 2323.468 C 4606.732 2273.723 4637.899 2221.053 4671.469 2173.507 C 4683.01 2157.181 4671.137 2134.711 4650.046 2140.391 C 4582.974 2158.647 4542.019 2196.57 4504.357 2254.72 C 4473.612 2302.267 4446.003 2350.919 4425.076 2403.567 C 4392.457 2485.928 4372.519 2574.62 4372.625 2663.29 C 4372.618 2695.235 4421.022 2705.594 4434.165 2676.467 Z" fill="#FDE29D"/>
                  </g>
                  <g>
                    <path d="M 4821.887 2007.487 C 4821.249 2007.052 4820.734 2006.611 4820.286 2006.05 C 4822.731 2008.972 4825.174 2011.875 4827.667 2014.81 C 4816.848 2000.501 4800.973 1985.068 4780.89 1988.686 C 4788.365 1990.285 4795.969 1991.95 4803.466 1993.532 C 4803.067 1993.374 4802.661 1993.191 4802.161 1992.958 C 4788.084 1986.534 4772.518 1986.401 4759.241 1994.991 C 4746.692 2003.162 4738.498 2018.219 4739.803 2033.355 C 4739.848 2033.79 4739.854 2034.225 4739.874 2034.711 C 4741.501 2027.162 4743.089 2019.584 4744.713 2012.054 C 4736.033 2027.8 4738.446 2047.316 4748.534 2061.699 C 4759.254 2077.039 4776.391 2084.726 4794.747 2083.934 C 4809.971 2083.319 4824.216 2073.74 4831.243 2060.343 C 4839.76 2043.995 4837.388 2019.337 4821.887 2007.487 Z" fill="#FDE29D"/>
                  </g>
                  <g style="">
                    <path d="M 5869.225 3295.542 C 5903.293 3310.314 5931.19 3269.273 5946.579 3245.362 C 5970.454 3208.393 5990.559 3168.353 6011.811 3129.841 C 6030.144 3096.551 6050.565 3061.209 6059.876 3024.163 C 6066.727 2997.336 6066.52 2944.27 6033.32 2933.406 C 6006.513 2924.571 5983.598 2964.853 5974.035 2983.231 C 5954.472 3020.661 5939.528 3060.159 5919.339 3097.502 C 5900.059 3133.243 5881.9 3169.549 5865.352 3206.641 C 5853.643 3232.771 5831.771 3279.333 5869.225 3295.542 Z" fill="#FDE29D"/>
                  </g>
                </g>
              </g>
              <g style=""/>
            </g>
            <g style="">
              <g>
                <path d="M 6352.492 1971.355 C 6396.053 1950.647 6442.192 1913.797 6477.975 1881.754 C 6541.584 1824.902 6591.19 1757.494 6634.533 1685.157 C 6645.179 1667.282 6626.812 1638.197 6605.129 1647.395 C 6519.012 1684.026 6455.1 1726.65 6395.557 1800.43 C 6362.963 1840.944 6289.644 1878.918 6298.33 1940.732 C 6302.216 1968.62 6325.937 1983.879 6352.492 1971.355 Z" fill="#FCCF5B"/>
              </g>
              <g>
                <path d="M 4284.187 1958.358 C 4280.72 1885.927 4218.941 1833.692 4176.188 1780.474 C 4154.685 1753.603 4130.452 1728.929 4108.281 1702.724 C 4083.681 1673.758 4062.526 1642.456 4033.022 1618.414 C 4011.547 1600.935 3968.301 1603.068 3963.301 1637.298 C 3951.437 1717.316 4009.246 1773.975 4060.431 1827.528 C 4113.672 1883.204 4166.644 1950.241 4235.502 1986.72 C 4256.288 1997.666 4285.508 1983.931 4284.187 1958.358 Z" fill="#FCCF5B"/>
              </g>
              <g>
                <path d="M 4333.471 1250.062 C 4322.974 1323.624 4363.915 1393.393 4396.59 1456.731 C 4434.467 1530.244 4482.279 1590.998 4538.97 1650.608 C 4553.543 1665.909 4581.268 1654.117 4580.45 1633.122 C 4577.657 1555.453 4552.576 1490.014 4515.095 1422.761 C 4480.762 1361.237 4449.83 1282.501 4400.482 1231.87 C 4381.205 1212.065 4337.82 1219.534 4333.471 1250.062 Z" fill="#FCCF5B"/>
              </g>
              <g>
                <path d="M 5715.425 1550.833 C 5737.283 1530.083 5750.758 1495.373 5763.35 1468.501 C 5782.121 1428.445 5798.786 1388.463 5814.135 1346.986 C 5830.754 1301.836 5848.101 1256.944 5862.362 1210.946 C 5876.274 1166.015 5897.346 1116.236 5892.868 1068.36 C 5891.638 1055.401 5879.046 1047.124 5866.989 1053.71 C 5828.119 1075.085 5797.612 1120.16 5777.218 1158.589 C 5749.876 1210.518 5726.085 1262.614 5707.591 1318.416 C 5688.478 1376.052 5629.031 1499.76 5687.214 1551.006 C 5695.636 1558.327 5707.216 1558.601 5715.425 1550.833 Z" fill="#FCCF5B"/>
              </g>
              <g>
                <path d="M 6081.638 1697.321 C 6071.076 1708.156 6090.344 1687.755 6090.627 1686.972 C 6092.213 1683.144 6094.21 1679.661 6096.33 1676.107 C 6103.76 1664.234 6111.1 1652.457 6119.219 1640.191 C 6140.691 1607.462 6164.36 1576.144 6188.073 1545.003 C 6234.045 1484.842 6287.813 1426.959 6313.635 1358.021 C 6327.239 1321.809 6282.884 1300.595 6255.033 1313.622 C 6182.029 1347.701 6125.283 1430.7 6080.871 1499.464 C 6057.402 1535.902 5971.922 1671.474 6045.493 1702.247 C 6058.04 1707.46 6071.398 1707.815 6081.638 1697.321 Z" fill="#FCCF5B"/>
              </g>
              <g>
                <path d="M 5346.188 1437.402 C 5371.368 1414.668 5376.764 1371.599 5385.647 1340.378 C 5400.159 1288.803 5404.215 1233.872 5409.799 1180.711 C 5415.689 1124.88 5413.776 1068.122 5409.306 1012.262 C 5405.642 963.845 5398.776 908.797 5369.447 868.667 C 5361.092 857.158 5346.448 857.158 5338.136 868.876 C 5309.147 910.311 5307.211 964.096 5303.789 1013.009 C 5299.893 1068.904 5300.67 1125.395 5298.85 1181.442 C 5297.072 1235.749 5292.792 1289.856 5290.837 1344.192 C 5289.545 1378.084 5291.475 1419.741 5321.507 1440.768 C 5329.281 1446.163 5339.792 1443.169 5346.188 1437.402 Z" fill="#FCCF5B"/>
              </g>
              <g>
                <path d="M 4939.055 1498.333 C 4938.894 1499.796 4938.62 1501.249 4938.452 1502.757 C 4937.334 1511.975 4949.078 1513.483 4954.517 1509.252 C 5007.164 1467.717 4961.386 1356.136 4947.735 1305.87 C 4928.313 1234.67 4908.462 1128.73 4846.832 1080.952 C 4833.48 1070.661 4812.64 1072.968 4807.781 1091.626 C 4786.59 1173.314 4809.573 1259.837 4836.74 1337.281 C 4852.869 1382.978 4884.767 1512.844 4947.886 1512.032 C 4947.838 1505.778 4947.88 1499.54 4947.822 1493.377 C 4946.279 1493.586 4944.819 1493.828 4943.421 1494.015 C 4940.766 1494.374 4939.41 1495.714 4939.055 1498.333 Z" fill="#FCCF5B"/>
              </g>
            </g>
          </g>
        </g>
      </g>
      <circle r="100" cy="-538.166" cx="-365.389" id="button" style="opacity: 0.3; fill-opacity: 1; stroke: none; stroke-width: 1.2; stroke-linejoin: bevel; stroke-miterlimit: 4; stroke-dasharray: 14.4, 1.2; stroke-dashoffset: 0; stroke-opacity: 1; fill: url(#linearGradient41720);" transform="matrix(-1, 0, 0, -1, 0, 0)" role="button"/>
    </g>

    {/if}
    <path d="M 372.047 192.183 C 187.585 192.183 38.049 341.719 38.049 526.181 C 38.049 710.643 187.585 860.179 372.047 860.179 C 556.509 860.179 706.045 710.643 706.045 526.181 C 706.045 341.719 556.509 192.183 372.047 192.183 Z M 372.047 212.007 C 545.56 212.007 686.221 352.667 686.221 526.181 C 686.221 699.694 545.56 840.355 372.047 840.355 C 198.534 840.355 57.873 699.694 57.873 526.181 C 57.873 352.667 198.534 212.007 372.047 212.007 Z" id="circle4344" class="s-y1SdroFNffHn" style="opacity: 0.7; fill: rgb(31, 28, 36); fill-opacity: 1; stroke: none; stroke-width: 1.2; stroke-linejoin: bevel; stroke-miterlimit: 4; stroke-dasharray: 14.4, 1.2; stroke-dashoffset: 0; stroke-opacity: 1;"/>
  

  {#if openMS === false}
    <g class="gg" transform="matrix(1, 0, 0, 1, -1.574639, 41.588951)"  on:click={() => openMS = true} style="">
      <title>הצגת ועריכת פעולות פתוחות</title>
      <rect style=  "opacity: 0.9; fill-opacity: 1; stroke: none; stroke-width: 1.2; stroke-linejoin: bevel; stroke-miterlimit: 4; stroke-dasharray: 14.4, 1.2; stroke-dashoffset: 0; stroke-opacity: 1; " id="rect-1" width="340.857" height="100.571" x="202.619" y="620.895" ry="2.542"/>
      <text dominant-baseline="middle" style= "text-anchor: middle; font-style: normal; font-weight: normal; font-size: 96.8301px; line-height: 125%; font-family: sans-serif; letter-spacing: 0px; word-spacing: 0px; fill: rgb(171, 55, 200); fill-opacity: 1; stroke: none; stroke-width: 1px; stroke-linecap: butt; stroke-linejoin: miter; stroke-opacity: 1; white-space: pre;" x="371" y="682.429" id="text4238"><tspan id="tspan4240" x="371" y="682.429" style="text-anchor: middle; font-size: 96.8px; word-spacing: 0px;">{noofopen}</tspan></text>
      <text id= "text-4" y="682.429" x="371" dominant-baseline="middle" style=" text-anchor: middle; font-style: normal; font-weight: normal; font-size: 96.8301px; line-height: 125%; font-family: sans-serif; letter-spacing: 0px; word-spacing: 0px; fill-opacity: 1; stroke: none; stroke-width: 1px; stroke-linecap: butt; stroke-linejoin: miter; stroke-opacity: 1; white-space: pre; fill: url(#linearGradient4248-1);"><tspan y="682.429" x="371" id="tspan4246" style=" text-anchor: middle; fill-opacity: 1; font-size: 96.8px; word-spacing: 0px; fill: url(#linearGradient42481);">{noofopen}</tspan></text>
    </g>
    {/if}
     
  </g>
  
</svg>  
{/if}
</div>
<div class="bg-lturk m-4 ">


{#if pmiData.length > 0}

  {#if pendS === false}
<button
 class="bg-gold hover:bg-barbi text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
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
 class="bg-gold hover:bg-barbi text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
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
  <div class="bg-lturk m-4 ">

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

  <!-- כפתור שרק איתו יש את האפשרות כנ"ל על משאבים
  כן להוסיף סקשן שמראה את שלל סוגי המשימות בדיפולט
כולל לפי יוזרים וכו-->

<div bind:this={hosaf}>
 {#if addM === true}
   <div  class="bg-lturk m-4 border-2 border-gold rounded" >
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

    <div class="bg-lturk " bind:this={cow}>
      {#if load === true}
        <div class="grid justify-center items-center border-2 border-gold rounded p-4" >

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
                              
    <div class="bg-lturk m-4" >
  {#if addN === false} 
  
      <button
      on:click={() => addN = true}
       class="bg-gold hover:bg-barbi text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
       >{hosafat}</button>
      {:else if addN == true}
      <div id="hosafn" class="bg-lturk m-4 border-2 border-gold rounded" >
      <button
      title={cencel}
      on:click={() => addN = false}
       class=" hover:bg-barbi text-barbi hover:text-gold font-bold py-0.5 rounded-full"
       ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
    </svg></button> 
     <ChoosNeed on:add={needad} selectedi={needr}/>
      </div>
      {/if}    
   
    </div>
    <div class="bg-lturk m-4" bind:this={dow} >
    {#if totalneed === true} 
     {#if loadr === true}
        <div class="grid justify-center items-center border-2 border-gold rounded p-4" >

      <RingLoader size="80" color="#ff00ae" unit="px" duration="2s"></RingLoader>
        </div>
                 {/if}
    <TotalNeeds projectId={$idPr} userslength={projectUsers.length} {needr} meData={meDatamm}
                                     on:close={clo}
                                     on:remove={wdwd}
    />{/if}</div>
   </div> 

  <!--  {:else}
    לשלוח אותו לרקמה ציבורי לקחת ID וכו'
    <h1 class="bg-white">לא מורשה</h1>
    {/if}-->
 {:else }  
 <div class="flex text-center flex-col border-2 border-gold rounded m-4">
<h1 class="text-mturk hover:text-lturk font-bold py-2 px-4 m-4 rounded-full">בחירת ריקמה</h1>
 
           {#each projects as data, i}
          
          <button
          class=" hover:bg-barbi text-barbi bg-gold hover:text-gold p-0.5 m-2 rounded-full"
          on:click={projectn(data.id)}
          > {data.projectName}
          </button>
  {/each}

 </div> 
 {/if}

 <style>
   .gg{
       transition: all 1s;
  transform-origin: 50% 50%;
   }
   .gg:hover{
     transform: scale(1.1);

   }
   #rect-1{
     fill: black;
        transition: all 1s;
  transform-origin: 50% 50%;
   }
   #rect-1:hover{
     fill: #67E8F9;
   }
 
   .all{
     min-height: 100vh;
   }
.textlink:hover{
  -webkit-text-stroke: 1px var(--barbi-pink);
}
#svg2{
  margin: 0 auto;
}

 :global(li:not(.selected):hover) {
 color: var(--barbi-pink);
    background-color:var(--lturk);    /* unselected but hovered options in the dropdown list */
  }
  :global(ul.tokens > li){
    background-color: var(--barbi-pink);
    color:var(--lturk);
  }

#curve {
    fill: transparent;
}

.curved-text {
    fill: #d0f5f6;
    text-align: center;
    font-size: var(--the, 24px);
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
  }
 </style>