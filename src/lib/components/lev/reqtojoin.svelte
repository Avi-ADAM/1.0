<script>
import {
    clickOutside
} from './outsidclick.js';
import {
    scale,
    fly
} from 'svelte/transition';
import {
    createEventDispatcher
} from 'svelte';

const dispatch = createEventDispatcher();
export let shows = false;
export let deadline;
export let projectName = "ONE";
export let openmissionName = "do x";
export let role = "programer";
export let skills = ["html", "css"];
export let useraplyname = "do x like y in z";
export let src = "coin.png";
export let src2 = " ";
export let projectId;
export let link = "/project/";
export let linkU = "/user/";
export let userId;
export let missionDetails = "";
export let name;
export let noofpu = 0;
export let publicklinks;
export let privatlinks;
export let hearotMeyuchadot;
export let nhours = 0;
export let valph = 0;
export let missId;
export let id;
export let openMid;
export let st = 188;
export let declined = [];
export let noofusersWaiting;
export let uids;
export let what;
export let noofusersOk;
export let noofusersNo;
export let already;
let resP = [];
let lang;
export let stylef = '24px';
export let askId;
export let users;
    //
    //axios
    // .post('https://translation.googleapis.com/language/translate/v2/detect?key=AIzaSyBd6vOhf0c3AH4yw2FXbHWfIbjJD0BX0pg', {
    //  "q": `"${openmissionName}"` 
    //             })
    //   .then(response => {
    // console.log('הצליח', response.data);
    //  resP = response.data; 
    //lang = resP.data.detections[0][0].language;
    // console.log(lang)
    

let idL;
let bearer1; 
let token;
function toggleShow() {
    shows = !shows
};
let error1;
let miDatan = [];
let linkg = 'https://strapi-k4vr.onrender.com/graphql';

function objToString (obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
        
    for (const [p, val] of Object.entries(obj[i])) {
        if (typeof(val) == "string"|"number"|"boolean") {
        str += `{${p}:${val}\n},`;
    } else if (typeof(val) == 'null'){
                str += `{${p}:${val.map(c => c.id)}\n},`;
    }
    }}
    return str;
}
    const userss = objToString(users)
let welcome = ``;
let adduser = ``;
let adduser2 = ``;
async function agree() {
    const date = (deadline !== undefined) ? ` admaticedai: ${deadline}` : ``;
    
    
    console.log("agree")
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
    const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    idL = cookieValueId;
     console.log(idL);
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
  //  uids.push(userId);
   // uids = uids;
    console.log(uids);
    if (uids.includes(userId)){
        welcome = ``;
        adduser2 = ``;
        adduser = ``;
        console.log(welcome, "member");
    } else {
        welcome = `createWelcomTop(
  input: {
    data: {users_permissions_user: "${userId}",
          project: "${projectId}"}
        }
) {welcomTop{id}}`;
adduser = `updateProject(
input: {
  where: {id: "${projectId}"}
 data: {user_1s: ["${idL}","${userId}"]}
}
  ){project {user_1s {id}}}`;
        adduser2 = `updateProject(
input: {
  where: {id: "${projectId}"}
 data: {user_1s: ${uids}}
}
  ){project {user_1s {id}}}`
        console.log(welcome, "not member");

    }
    //add to pr users create missioninprogres, create welcom ballun;  first check for no of pr users and full consent ,(delete or save for refernce but put archive ) openM and asked 
    if (noofpu === 1) {
        console.log("agree, ecsepted")
        
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createMesimabetahalich(
    input: {
      data: {project: "${projectId}",
             mission:  "${missId}",
             hearotMeyuchadot: "${hearotMeyuchadot}",
             name: "${openmissionName}",
             descrip: "${missionDetails}",
             hoursassinged: ${nhours},
             perhour: ${valph},   
             privatlinks: "${privatlinks}",
             publicklinks: "${publicklinks}", 
             users_permissions_user: "${userId}",
            ${date}
                  }
    }
  ) {mesimabetahalich{project{id }}}

updateOpenMission(
  input:  {
    where: {id: "${openMid}"}
  data: {archived: true}
}
) {openMission{id archived}}
${welcome}
${adduser}
 updateAsk(
                            input:{
                                where: {id: "${askId}" }
                                data: { archived: true,
                                    vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){ask{id}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('acsept', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }

    } else if (noofpu - 1 === noofusersOk) {
            console.log("create new as above and add vote and archive asked")
    
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createMesimabetahalich(
    input: {
      data: {project: "${projectId}",
             mission:  "${missId}",
             hearotMeyuchadot: "${hearotMeyuchadot}",
             name: "${openmissionName}",
             descrip: "${missionDetails}",
             hoursassinged: ${nhours},
             perhour: ${valph},   
             privatlinks: "${privatlinks}",
             publicklinks: "${publicklinks}", 
             users_permissions_user: "${userId}",
            ${date}
                  }
    }
  ) {mesimabetahalich{project{id }}}

updateOpenMission(
  input:  {
    where: {id: "${openMid}"}
  data: {archived: true}
}
) {openMission{id archived}}
${welcome}
${adduser2}
 updateAsk(
                            input:{
                                where: {id: "${askId}" }
                                data: { archived: true,
                                    vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){ask{id}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('acsept', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }
        } else {

        console.log("just add vote to asked and update to not show for me again")
         try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        {
                            updateAsk(
                            input:{
                                where: {id: "${askId}" }
                                data: { vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){ask{id}}
                     
                    }
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('acsept', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }

    }
    }
;

function ask() {
    console.log("nego")
    // plain text? list? terms???
}

async function decline() {
        console.log("decline0");
const declineda = declined.map(c => c.id)
    declineda.push(userId)
        console.log("decline1");

    // delete asked coin forever but keep asked on user ////matrix(1, 0, 0, 1, -61.718609, -47.72295)
        if (noofpu === 1) {
    console.log("decline2");
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
    const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    idL = cookieValueId;
    console.log(idL);
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    //add already declined ids
                    body: JSON.stringify({
                        query: `mutation 
                        { 
updateOpenMission(
  input: {
    where: {id: "${openMid}"}
  data: {declined: [${declineda}]}
}
) {openMission{id declined {id}}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            dispatch('decline', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }
        } else if (noofpu > 1 ) { 
    console.log("if another uprove explain why you decline")

        }
}
</script>

<div transition:fly={{y: 250, opacity: 0.9, duration: 2000} }
    style="--the:{stylef};"
    >
    {#if shows === false}
    <div
        on:mouseenter={toggleShow}

        class="normSml"
        in:scale="{{ duration: 3200, opacity: 0.5, start: 1.56 }}"
        >
        <svg  version="1.1" viewBox="-106 -106 212 212" xmlns="http://www.w3.org/2000/svg">
            <title>בקשה להצטרפות לפרוייקט</title>
            <defs>
                <linearGradient id="lg" x1="1" y1="1" spreadMethod="pad">
                    <stop offset="0" style="stop-color: rgb(243, 71, 255);"/>
                        <stop offset="1" style="stop-color: rgb(173, 241, 255);"/>
                            </linearGradient>
                            <linearGradient id="lgb" x1="1" y1="1">
                                <stop offset="0" style="stop-color: rgb(185, 185, 255);"/>
                                    <stop offset="1" style="stop-color: rgb(0, 170, 170);"/>
                                        </linearGradient>
                                        </defs>
                                        <circle r="100" fill="url(#lg)" transform="rotate(135)" stroke="url(#lgb)" stroke-width="6" style="fill-rule: nonzero; paint-order: fill;"/>
                                         <circle r="80" fill="url(#lg)" transform="rotate(315)" stroke="none"/>
                                               
                                                         <a sveltekit:prefetch x='0' y='40' style="margin-top: 2px; margin-bottom: 2px" href={`${linkU}${userId}`}>
                                                <foreignObject x='0' y='0' width='56px' height='56px' transform="translate(-28,-28)" >
                                                    <img
                                                        width='56px'
                                                        height='56px'
                                                        alt={useraplyname}
                                                        src={src}
                                                        style="border-radius: 50%;"
                                                        title={useraplyname}
                                                        /> 
                                                     </foreignObject>     
                                                            <text fill="#EEE8AA " text-anchor="middle" x='0' y='46' style="margin: 2px; font-size: 24px; line-height: 1; font-weight: bold;">{useraplyname}</text>
                                                        </a>        

                                                
                                                
                                                <path id="curve" d="M -79.587 0 C -81.732 -2.923 -75.008 -81.366 0 -80.446 C 74.342 -79.534 81.282 -3.522 80.257 0"/>
                                                    <text color="#EEE8AA" width="208.55" x="-90" y="-90" style="white-space: pre-wrap;">
                                                        <textPath color="#EEE8AA" x="-90" y="-90" class="curved-text" startOffset={st} xlink:href="#curve">
                                                            {openmissionName}
                                                        </textPath>
                                                    </text>
                                              <a sveltekit:prefetch x="0" y="-40"   xlink:href="{`${link}${projectId}`}">
                                                    <text fill="#FF0092" text-anchor="middle"  x="0" y="-29"   style="font-size: 15px; line-height: 1; font-weight: bold; white-space: pre;">{projectName}</text>
                                                    <foreignObject x='0' y='-60 ' width='40px' height='40px' transform="translate(-20,-20)" >
                                                    <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="40" height="40" alt="projectlogo" title={projectName}>
                                                    
                                                </foreignObject>
                                                </a>  
                                         <!--     <g  x='-90' y='0' width="29" height="29">
<path fill="currentColor" d="M256 8C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 48c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m140.204 130.267l-22.536-22.718c-4.667-4.705-12.265-4.736-16.97-.068L215.346 303.697l-59.792-60.277c-4.667-4.705-12.265-4.736-16.97-.069l-22.719 22.536c-4.705 4.667-4.736 12.265-.068 16.971l90.781 91.516c4.667 4.705 12.265 4.736 16.97.068l172.589-171.204c4.704-4.668 4.734-12.266.067-16.971z"></path>
                                                  </g> -->   
                                                </svg>
                                                    <!--  <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="32" height="32" alt="projectlogo" title={projectName}>
        <a sveltekit:prefetch style="margin-top: 2px; margin-bottom: 2px" href={`${link}${projectId}`}><h3 style="margin: 2px; font-size: 13px; line-height: 1; font-weight: bold;">{projectName}</h3></a>
        <h1 style="margin: 7px; font-size: 13px; font-weight: bold; color: rgb(87, 208, 248 ); line-height: 0.7; ">{openmissionName}</h1>
        <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src} width="32" height="32" alt="user aplly pic" title={useraplyname}>
        <a sveltekit:prefetch style="margin-top: 2px; margin-bottom: 2px" href={`${linkU}${userId}`}><h3 style="margin: 2px; font-size: 13px; line-height: 1; font-weight: bold;">{useraplyname}</h3></a>        
        <button1 on:click={agree} style="margin: 0;" class = "btn" name="requestToJoin"><i class="far fa-check-circle"></i></button1>
        <button3 on:click= {nego} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>
        <button2 on:click={decline} style="margin: 0;" class = "btn"name="decline"><i class="far fa-times-circle"></i></button2>
        <button on:click={agree} style="margin: 0;" class = "btn" name="requestToJoin"><i class="far fa-check-circle"></i></button>
                                                    <button on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button>
                                                    <button on:click={decline} style="margin: 0;" class = "btn"name="decline"><i class="far fa-times-circle"></i></button>
                                                    -->
                                                    </div>

{:else}
        <div class="normSmlHover"
            on:mouseleave={toggleShow}
            in:scale="{{ duration: 1000, opacity: 0.5, start: 0.64 }}"
            use:clickOutside on:click_outside={toggleShow}>
            <img class="timg" src={src2}  alt="projectlogo" title={projectName}>
            <a sveltekit:prefetch class="flink"  href={`${link}${projectId}`}
            ><h3 class="hflink">{projectName}</h3></a>
            <h1 class="na">{openmissionName}</h1>
            <img class="seimg" src={src}  alt="user apply pic" title={useraplyname}>
            <a sveltekit:prefetch class="slink" href={`${linkU}${userId}`}
            ><h3 class="hslink">{useraplyname}</h3></a>
            <h5 class="hslink">{deadline}</h5>
            <h6 class="hslink">{missionDetails}</h6>
            <h5 class="hslink">{role}</h5>
            <h6 class="hslink">{skills}</h6>
               <p class="vo"><span style="color:var(--gold)" title="בעד">{noofusersOk} </span><span style="color:aqua" title="לא הצביעו">{noofusersWaiting} </span><span style="color:var(--barbi-pink)" title="נגד">{noofusersNo} </span></p>
            {#if !already}
            <button on:click={agree}  class = "btn a" name="requestToJoin"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
          <!-- <button3 on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>--> 
            <button on:click={decline}  class = "btn b"name="decline"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
        {/if}
        </div>
        {/if}
        </div>

<style>
    .a{
        margin-right: 20px;
    }
    .b{
        margin-left: 20px;
    }
    .vo{
   margin: 1px;
   font-size: 8px;
    }
    .hslink{
        margin: 0px;
         font-size: 8px;
          line-height: 1;
         font-weight: bold;
    }
    .slink{
        margin-top: 0px;
         margin-bottom: 0px
    }
    .seimg{
        margin-top: 0px;
         margin-bottom: 0px;
          margin-right:auto;
           margin-left: auto;
         border-radius: 50%;
          width: 22px;
       height: 22px;
    }
    .na{
        margin: 1px;
         font-size: 8px;
          font-weight: bold; 
          color: var(--gold); 
        line-height: 0.7;
    }
    .hflink{
        margin: 0px;
         font-size: 8px;
          line-height: 1;
         font-weight: bold;
    }
    .flink{
        margin-top: 0px;
         margin-bottom: 0px
    }
    .timg{
    margin-top: 0px;
     margin-bottom: 0px;
      margin-right:auto;
       margin-left: auto; 
       border-radius: 50%;
       width: 22px;
       height: 22px;
}
    #curve {
    fill: transparent;
}

.curved-text {
    fill: #d0f5f6;
    text-align: center;
    font-size: var(--the, 24px);
}

.normSml {

    text-align: center;
    line-height: 0.5;
    align-items: center;
    justify-content: safe center;
    color: var(--barbi-pink);
    min-height: 75px;
    min-width: 75px;
    max-width: 75px;
    max-height: 75px;

    background-color: rgb(100, 224, 137);
    border-radius: 50%;

    background: url(https://res.cloudinary.com/love1/image/upload/v1643838617/coin_ngsrxn.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;

}

.normSml:hover {
    color: var(--barbi-pink);
    height: 115px;
    width: 115px;
    border-radius: 50%;
    line-height: 0.5;
    text-align: center;
    background: url(https://res.cloudinary.com/love1/image/upload/v1643838617/coin_ngsrxn.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.normSmlHover {
    color: var(--barbi-pink);
    height: 115px;
    width: 115px;
    border-radius: 50%;
    line-height: 0.5;
    text-align: center;
    background: url(https://res.cloudinary.com/love1/image/upload/v1643838617/coin_ngsrxn.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.btn {

    background-color: rgb(87, 208, 248);
    border-radius: 50%;
    color: var(--barbi-pink);
    text-align: center;
    opacity: 0.6;
    transition: 0.3s;
    padding: 2px;

}

.btn:hover {
    opacity: 1;
    padding: 6px;
}
@media  (min-width: 550px) {
     .a{
        margin-right: 56px;
    }
    .b{
        margin-left: 56px;
    }
     .vo{
   margin: 7px;
      font-size: 13px;
    }
     .hslink{
        margin: 2px;
         font-size: 13px;
          line-height: 1;
         font-weight: bold;
    }
     .slink{
        margin-top: 2px;
         margin-bottom: 2px
    }
    .seimg{
         width: 32px;
       height: 32px;
    }
     .na{
        margin: 7px;
         font-size: 13px;
          font-weight: bold; 
          color: var(--gold); 
        line-height: 0.7;
    }
  .hflink{
        margin: 2px;
         font-size: 13px;
          line-height: 1;
         font-weight: bold;
    }
    .flink{
        margin-top: 2px;
         margin-bottom: 2px
    }
	.normSml{
        min-height: 125px;
        min-width: 125px;
        max-width: 125px;
        max-height: 125px;
  }
   .normSmlHover{

        height: 195px;
        width: 195px;
   }
   .timg{
       height: 32px;
       height: 32px;
   }
    }
</style>
