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
  import { DialogOverlay, DialogContent 
} from 'svelte-accessible-dialog';
 import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
import { idPr } from './../../stores/idPr.js';

const dispatch = createEventDispatcher();
export let mId;
export let why;
export let what;
export let shows = false;
export let deadline;
export let projectName = "ONE";
export let missionBName = "do x";
export let role = "programer";
export let skills = ["html", "css"];
export let useraplyname = "do x like y in z";
export let src = "coin.png";
export let src2 = " ";
export let projectId;
export let link = "https://strapi-k4vr.onrender.com/project/";
export let linkU = "https://strapi-k4vr.onrender.com/user/";
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
export let whatt;
export let noofusersOk;
export let noofusersNo;
export let already;
let resP = [];
let lang;
export let stylef = '24px';
export let askId;
export let users;
    
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
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;
    uids.push(userId);
    uids = uids;
    console.log(uids);
    //add rating for app +5 for declin -5, nego mean demends for apruval
     if (noofpu - 1 === noofusersOk) {
            console.log("create new finnished and add vote and archive fiapp")
        try {
            await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Authorization': bearer1,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation 
                        { createFinnishedMission(
           input: { 
             data: {
              missionName: "${missionBName}",
              why: "${why}",
              noofhours: ${nhours},
              mesimabetahalich: ${mId},
              perhour: ${valph},
              total: ${valph*nhours},
              project: ${projectId},
              hearotMeyuchadot: "${hearotMeyuchadot}",
              descrip: "${missionDetails}",
              users_permissions_user: "${userId}",
              finiapruval: "${askId}",
              mission: ${missId}
   }
}){finnishedMission {id }}
updateMesimabetahalich(
  input:  {
    where: {id: "${mId}"}
  data: {finnished: true}
}
) {mesimabetahalich{id finnished}}
 updateFiniapruval(
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
    ){finiapruval{id}}
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
                            updateFiniapruval(
                            input:{
                                where: {id: "${askId}" }
                                data: { vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                            }
                        ){finiapruval{id}}
                     
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
    // text and more hours if needed ,
    masa = true;
        no = false;
        isOpen = true;
}

async function decline() {
        console.log("decline0");
    // negativ rating and reason text!! בועה שמראה לאחרחם את ההתנגדות הסיבה ואפשרות להגיב      
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
    const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    idL = cookieValueId;
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
updateFiniapruval(
  input: {
    where: {id: "${askId}"}
  data: {vots: [${userss}, 
                                       {
                                           why: "${whyy}"
                                        what: false
                                        users_permissions_user: "${idL}"
                                      }
                                    ] }
}
) {finiapruval {id vots {id}}}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            isOpen = false;
            dispatch('decline', {
                asked: id
            })

        } catch (e) {
            error1 = e
            console.log(error1);
        }
        
}
function open () {
        masa = false;
        no = true;
        isOpen = true;
    console.log("if another uprove explain why you decline")
}
let isOpen = false;
let whyy = " ";
let no;
let masa;
function close() {
     isOpen = false;
    no = false; 
    masa = false;
}
  function project (id) {
    idPr.set(id);
    goto("/moach", );
  };

</script>

 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly={{y: 450, opacity: 0.5, duration: 1000}}>
  <DialogContent aria-label="form">
      <div dir="rtl" class="flex items-center flex-col" >
              <button on:click={close} class=" hover:bg-barbi text-barbi hover:text-gold font-bold rounded-full"
title="ביטול"
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
{#if no === true}
<h1 style="font-size:2em;">יש לנמק מדוע </h1>
      <input  minlength="26"  type="text" bind:value={whyy} placeholder=" מדוע המשימה לא הושלמה">
         <br/>   <button class="add" disabled={whyy.length < 26} on:click={decline}>אישור</button>
{:else if masa === true}
      <input minlength="26"  type="text" bind:value={whyy} placeholder="יש לנמק מדוע ההצעה נדחית על ידך">
<input type="number" placeholder="add moree hours">
 
{/if}
      </div>
  </DialogContent>
  </div>
</DialogOverlay>


<div transition:fly={{y: 250, opacity: 0.9, duration: 2000} }
    style="--the:{stylef};"
    >
    {#if shows === false}
    <div
        on:mouseenter={toggleShow}

        class="normSml"
        in:scale="{{ duration: 3200, opacity: 0.5, start: 1.56 }}"
        >
        <svg  version="1.1"  viewBox="-106 -106 212 212" xmlns="http://www.w3.org/2000/svg">
            <title>בקשה לאישור ביצוע משימה בהצלחה</title>
            <defs>
                <linearGradient id="lg" x1="1" y1="1" spreadMethod="pad">
                    <stop offset="0" style="stop-color: rgb(100, 71, 105);"/>
                        <stop offset="1" style="stop-color: rgb(54, 241, 155);"/>
                            </linearGradient>
                            <linearGradient id="lgb" x1="1" y1="1">
                                <stop offset="0" style="stop-color: rgb(125, 105, 155);"/>
                                    <stop offset="1" style="stop-color: rgb(0, 100, 120);"/>
                                        </linearGradient>
                                        </defs>
           <circle stroke-opacity="0.01" r="100" fill-opacity="0.01" fill="url(#lg)" transform="rotate(135)" stroke="url(#lgb)" stroke-width="6" style="fill-rule: nonzero; paint-order: fill;"/>
            <circle r="80" fill-opacity="0.01" fill="url(#lg)" transform="rotate(315)" stroke="none"/>
                  
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
                               <text fill="#FF0092" text-anchor="middle" x='0' y='46' style="margin: 2px; font-size: 24px; line-height: 1; font-weight: bold;">{useraplyname}</text>
                           </a>   
                   <path fill-opacity="0.01"  d="M -79.587 0 C -81.732 -2.923 -75.008 -81.366 0 -80.446 C 74.342 -79.534 81.282 -3.522 80.257 0"/>
                       <text color="#EEE8AA" width="208.55" x="-90" y="-90" style="white-space: pre-wrap;">
                           <textPath color="#FF0092" x="-90" y="-90" class="curved-text" startOffset={st} xlink:href="#curve">
                               {missionBName}
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
            <img on:click={project(projectId)} style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src2} width="32" height="32" alt="projectlogo" title={projectName,"לחיצה למעבר ללוח הבקרה של ריקמה" }>
            <a sveltekit:prefetch style="margin-top: 2px; margin-bottom: 2px" href={`${link}${projectId}`}><h3 style="margin: 2px; font-size: 13px; line-height: 1; font-weight: bold;">{projectName, "לחיצה למעבר לדף הציבורי של ריקמה "}</h3></a>
            <h1 style="margin: 7px; font-size: 13px; font-weight: bold; color: var(--barbi-pink); line-height: 0.7; ">{missionBName}</h1>
            <img style="margin-top: 0px; margin-bottom: 0px; margin-right:auto; margin-left: auto; border-radius: 50%;" src={src} width="32" height="32" alt="user aplly pic" title={useraplyname}>
            <a sveltekit:prefetch style="margin-top: 2px; margin-bottom: 2px" href={`${linkU}${userId}`}><h3 style="margin: 2px; font-size: 13px; line-height: 1; font-weight: bold;">{useraplyname}</h3></a>
            <h5 style=" margin: 2px; font-size: 13px; font-weight: bold; line-height: 1;">{why}</h5>
            <h6 style="margin: 2px; font-size: 13px; font-weight: bold; line-height: 1;">{missionDetails}</h6>
         
            <p style="margin: 7px;"><span style="color:green" title="בעד">{noofusersOk} </span><span style="color:aqua" title="לא הצביעו">{noofusersWaiting} </span><span style="color:var(--barbi-pink)" title="נגד">{noofusersNo} </span></p>
            {#if !already}
            <button1 on:click={agree} style="margin: 0;" class = "btn" name="requestToJoin"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button1>
            <button3 on:click= {ask} style="margin: 0;" class = "btn" name="negotiate"><i class="far fa-comments"></i></button3>
            <button2 on:click={open} style="margin: 0;" class = "btn"name="decline"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button2>
        {/if}
        </div>
        {/if}
        </div>

<style>
    input[type=text]{
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
     border: 1px solid var(--lturk);
     padding-left: 10px;
     padding-right: 10px;
    }
    
input[type=text]:focus {
     outline: none;
     border: 2px solid var(--lturk);
     color: #2d9fd9;
}
  
input[type=text]:invalid {
    -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
  border: 2px dashed var(--lturk);
    color: red;
     padding-left: 10px;
     padding-right: 10px;
}
    .add{
        color : var(--barbi-pink);
        background-color: var(--gold);
        padding: 0.5em;
         -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
    }
    .add:hover {
        color: var(--gold);
        background-color: var(--barbi-pink);
                padding: 0.5em;
                 -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
    }
    .add:disabled{
        color: red;
        background-color: grey;
                padding: 0.5em;
                 -webkit-border-radius: 20px;
    -moz-border-radius: 20px;
     border-radius: 20px;
    }
#curve {
    fill: transparent;
}

.curved-text {
    fill: #99039e;
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
    max-width: 137.5px;
    max-height: 137.5px;
    aspect-ratio: 1 /1;

    background-color: rgb(100, 224, 137);
    border-radius: 50%;

    background: url(https://res.cloudinary.com/love1/image/upload/v1643838283/newcoin_mxgoxa.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: 125px 125px;

}

.normSml:hover {
    color: var(--barbi-pink);
    height: 195px;
    width: 195px;
    border-radius: 50%;
    line-height: 0.5;
    text-align: center;
    background: url(https://res.cloudinary.com/love1/image/upload/v1643838283/newcoin_mxgoxa.svg);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
}

.normSmlHover {
    color: var(--barbi-pink);
    height: 195px;
    width: 195px;
    border-radius: 50%;
    line-height: 0.5;
    text-align: center;
    background: url(https://res.cloudinary.com/love1/image/upload/v1643838283/newcoin_mxgoxa.svg);
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
    margin-right: 4px;
    margin-left: 4px;
}

.btn:hover {
    opacity: 1;
    padding: 6px;
}

@media only screen and (min-device-width: 375px) and (max-device-width: 812px) and (-webkit-min-device-pixel-ratio: 3) and (orientation: portrait) {
    .normSml {
        text-align: center;
        line-height: 0.5;
        align-items: center;
        justify-content: safe center;
        color: var(--barbi-pink);
        min-height: 125px;
        min-width: 125px;
        max-width: 125px;
        background-color: rgb(100, 224, 137);
        border-radius: 50%;
        background: url(newcoin.svg);
        background-position: center;
        background-repeat: no-repeat;
    background-size: 125px 125px;

    }

    .normSml:hover {
        color: var(--barbi-pink);
        height: 195px;
        width: 195px;
        border-radius: 50%;
        line-height: 0.5;
        text-align: center;
        background: url(newcoin.svg);
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
    }

    .normSmlHover {
        color: var(--barbi-pink);
        height: 195px;
        width: 195px;
        border-radius: 50%;
        line-height: 0.5;
        text-align: center;
        background: url(coin.svg);
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
        margin-right: 4px;
        margin-left: 4px;
    }

    .btn:hover {
        opacity: 1;
        padding: 6px;
    }

}
@media  (min-width: 375px) {
    .normSml {
        text-align: center;
        line-height: 0.5;
        align-items: center;
        justify-content: safe center;
        color: var(--barbi-pink);
        min-height: 125px;
        min-width: 125px;
        max-width: 125px;
        background-color: rgb(100, 224, 137);
        border-radius: 50%;
        background: url(newcoin.svg);
        background-position: center;
        background-repeat: no-repeat;
    background-size: 125px 125px;

    }

    .normSml:hover {
        color: var(--barbi-pink);
        height: 195px;
        width: 195px;
        border-radius: 50%;
        line-height: 0.5;
        text-align: center;
        background: url(newcoin.svg);
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
    }

    .normSmlHover {
        color: var(--barbi-pink);
        height: 195px;
        width: 195px;
        border-radius: 50%;
        line-height: 0.5;
        text-align: center;
        background: url(coin.svg);
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
        margin-right: 4px;
        margin-left: 4px;
    }

    .btn:hover {
        opacity: 1;
        padding: 6px;
    }

}
</style>
