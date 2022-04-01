
<script> 
  import { onMount } from 'svelte';
  import axios from 'axios'
	import { draw } from 'svelte/transition';
 import Addnew from '../../lib/components/addnew/baci.svelte';
import Addnewp from '../../lib/components/userPr/uploadPic.svelte';
import { uPic } from  '../../lib/stores/uPic.js';
import Edit from '../../lib/components/userPr/edit.svelte';
import EditB from '../../lib/components/userPr/editBasic.svelte';

//import Profile from '../../lib/components/userPr/new.svelte';
//import { addS } from '../../lib/stores/addS.js';
import { idPr } from '../../lib/stores/idPr.js';
    import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';

let isOpen = false;

    let current = "";

    let url1 = "https://oneloveone.onrender.com/upload";
    let updX = 0;
    let meData = [];
  let token; 
  let files;
  let idLi;
  let myP =[];
  let skil =[];
  let taf =[];
  let mash = [];
  let val = [];
  let work = [];
  let total = 0;
  let odata = [];
    let allvn;
  let picLink;
  let idL; 
  let addSl = false;
let addSl1 = false;
let addSl2 = false;
let addSl3 = false;
let addSl4 = false;
let addSl5 = false;
 let a = 0;
let addNs1 = true;  
  let error1 = null;
  let addpic = 0;
  let addP = false;
    let st = 0;
    let stylef = '31px';

function letters(data){
  console.log(data);
  
   if (data.length >= 2 && data.length < 4) {
        st = 185;
     } 
  else if (data.length >= 4 && data.length < 5) {
        st = 180;
     } 
  else if (data.length >= 5 && data.length < 6) {
        st = 170;
     } else if (data.length >= 6 && data.length < 7) {
        st = 165
     } else if (data.length >= 7 && data.length < 8) {
        st = 160
     }else if (data.length >= 8 && data.length < 9) {
        st = 150
     }else if (data.length >= 9 && data.length < 10) {
            st = 140
     }else if (data.length >= 10 && data.length < 11) {
            st = 130;
     }else if (data.length >= 11 && data.length < 12) {
            st = 135;
            stylef = '29px';
    } else  if (data.length >= 12 && data.length <13) {
                st = 130;
                stylef = '29px';
     }else  if (data.length >= 13 && data.length <14) {
                st = 125;
                stylef = '25px';
     }else  if (data.length >= 14 && data.length <15) {
                st = 125;
                stylef = '25px';
     }else  if (data.length >= 15 && data.length <17) {
                st = 125;
                stylef = '25px';
     }else  if (data.length >= 17 && data.length <19) {
                st = 130;
                stylef = '19px';
     }else  if (data.length >= 19 && data.length <20) {
                st = 130;
                stylef = '17px';
     }else  if (data.length >= 20 && data.length <21) {
                st = 125;
                stylef = '17px';
     }else  if (data.length >= 21 && data.length <22) {
                st = 125;
                stylef = '16px';
     } else  if (data.length >= 22){
                       st = 125;
         stylef = '14px';
    }
   // if ((/[\u0590-\u05FF]/).test(data) | (/[\u0600-\u06FF]/).test(data)) {
    //  st += 20;
    //  }
}
//
    function sendP () {
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idLi = cookieValueId;
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
    let link ="https://oneloveone.onrender.com/users/" + idLi ;
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
      .put(link, {
        profilePic: imageId,
                  },
      {
      headers: {
        'Authorization': bearer1
                }})
      .then(response => {
        meData = response.data;
        uPic.set(meData.profilePic.formats.thumbnail.url);
            picLink =  $uPic;
            uPic.set(meData.profilePic.formats.small.url);
            picLink =  $uPic;
    updX = 0;
    isOpen = false;
    a = 0;
  //  updpic.set(0);
                  })
      .catch(error => {
        console.log('צריך לתקן:', error.response);
                });
      
    })};
    let meDataa = [];

function project (id) {
    idPr.set(id);
    goto("/moach", );
  };
let mail;
onMount(async () => {
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
      let linkgra = 'https://oneloveone.onrender.com/graphql';
    try {
             await fetch(linkgra, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `query { user( id: ${idL}) 
          { frd
            bio
            email 
            username 
            hervachti
            profilePic {url formats }
            projects_1s { id projectName} 
            skills { id skillName} 
            sps (where: {archived: false }) {id  name}
            tafkidims { id roleDescription}
            vallues {id valueName}
            work_ways {id workWayName}
          } me { id }
 } `   
 } )})
  .then(r => r.json())
  .then(data => meDataa = data);
         console.log(meDataa)
         if (meDataa.data.me.id === idL && meDataa.data.me != null){
   meData =  meDataa.data.user
       mail = meData.email;
          letters(meData.username);
            myP = meData.projects_1s;
            skil = meData.skills;
            taf = meData.tafkidims;
            val = meData.vallues;
            mash = meData.sps;
            work = meData.work_ways;         
        //    roundText (meData.username);
           /// pics = meData.profilePic.formats.small.url;
            total = meData.hervachti ? meData.hervachti : 0;
            uPic.set(meData.profilePic.formats.thumbnail.url);
            picLink =  $uPic;
            uPic.set(meData.profilePic.formats.small.url);
            picLink = $uPic;
            total = meData.hervachti;
          } else {
            goto("/login")
          }
        } catch (e) {
            error1 = e
        }
    });
  
let userName_value;
let biog;
let frd;
function sendD () {
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idLi = cookieValueId;
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
    let link ="https://oneloveone.onrender.com/users/" + idLi 
      axios
      .put(link, {
        username: userName_value, 
    bio: biog,
    frd: frd
                  },
      {
      headers: {
        'Authorization': bearer1
                }})
      .then(response => {
        meData = response.data;
       
    isOpen = false;
    a = 0;
  //  updpic.set(0);
                  })
      .catch(error => {
        console.log('צריך לתקן:', error.response);
                });
      
};
    
 
 
function callbackFunction(event) {
    a = 2;
    files = event.detail.files;
    console.log(files);
    sendP ();
	}
  	function callbackFunctio(event) {
    a = 2;
    userName_value = event.detail.un;
   // emailL = event.detail.em;
    biog = event.detail.bi;
    frd = event.detail.frd;
    sendD ();
}


function remove (event) {
  const miDatanew = event.detail.data;
  const linkp = event.detail.linkp;
  addNs1 = false;
  meData[linkp] = miDatanew;
  skil = meData.skills;
            taf = meData.tafkidims;
            val = meData.vallues;
            mash = meData.sps;
            work = meData.work_ways;
            addNs1 = true;
};

async function add (event) {
 const linkp = event.detail.linkp;
 const miDatanew = event.detail.data; 
 const valc = event.detail.valc;
 const a = event.detail.a;
 miDatanew.selected2 = [];
 console.log (miDatanew);
 addNs1 = false;
 const meDatanew = meData;
 meDatanew[linkp] = miDatanew;
 console.log (meDatanew);
 meData = meDatanew;
 skil = meData.skills;
            taf = meData.tafkidims;
            val = meData.vallues;
            mash = meData.sps;
            work = meData.work_ways;
  addNs1 = true;
  console.log(a)
};

async function addnew (event) { 
  const linkp = event.detail.linkp;
 const skob = event.detail.skob;
 const miDatanew = event.detail.data;
 miDatanew.push(skob);
 console.log (miDatanew);
 addNs1 = false;
 const meDatanew = meData;
 meDatanew[linkp] = miDatanew;
 console.log (meDatanew);
 meData = meDatanew;
 skil = meData.skills;
            taf = meData.tafkidims;
            val = meData.vallues;
            mash = meData.sps;
            work = meData.work_ways;
  addNs1 = true;
};
const closer = () => {
    isOpen = false;
    updX = 0;
  addpic = 0;
  a = 0;
};
function basic (){
      isOpen = true;
      a = 1;
}
function openen () {
  isOpen = true;
  updX = 1;
  addpic = 1;
}

function open (event){

 addSl1 = false;
 addSl2 = false;
 addSl3 = false;
 addSl4 = false;
 addSl5 = false;  
 const a = event.detail.linkp;
  console.log(addSl);
  if (a == "tafkidims"){
 current = "a2"
    addSl2 = true;
  }
  else if (a == "skills"){
    current = "a1";
    addSl1 = true;
  }
  else if (a == "vallues"){
    current = "a4"
        addSl4 = true;

  }
  else if (a == "mashaabims"){
    current = "a3"
    addSl3 = true;
  }
  else if (a == "workWays"){
    current = "a5";
            addSl5 = true;

  }
};

function close (event){
  const a = event.detail.linkp;
  if (a == "tafkidims"){
    taf = event.detail.list
  }
  else if (a == "skills"){
    skil = event.detail.list;
  }
  else if (a == "vallues"){
  val = event.detail.list;
  }
  else if (a == "mashaabims"){
   mash = event.detail.list;
  }
  else if (a == "workWays"){
    work = event.detail.list;
  }
  current = "l";
  addSl1 = false;
 addSl2 = false;
 addSl3 = false;
 addSl4 = false;
 addSl5 = false;  
}


  import { RingLoader
} from 'svelte-loading-spinners';
let mass = false;

function massss (event){
  console.log("here")
  if (event.detail.mass == true){
  mass = true;
  } else  if (event.detail.mass == false){
    mass = false;
  }
}
let messege;
let spid;
function delm ( event){
  isOpen = true;
  a = 3
  const nj = event.detail.nj;
  spid = event.detail.id
  messege = `המשאב ${nj} ימחק האם להמשיך?`
}
let miDa = [];
async function han (){
  a = 2
 console.log(spid)
   const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
 let linkgra = 'https://oneloveone.onrender.com/graphql';
    try {
             await fetch(linkgra, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { updateSp(
    input: {
      where: {id: ${spid} }
      data: { 
        archived: true
      }
    }
  ) {sp {id }}
 } `   
 } )})
  .then(r => r.json())
  .then(data => miDa = data);
         console.log(miDa)
        const tor = miDa.data.updateSp.sp.id
        const oldob = mash
        const x = oldob.map(c => c.id);
        const indexy = x.indexOf(tor);
        oldob.splice(indexy, 1);
        mash = oldob;
        a = 0;
        isOpen = false;
        } catch (e) {
            error1 = e
        }
}
</script>
  <svelte:head>
  <title>פרופיל והגדרות 1❤️1</title>
</svelte:head>
 <DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form" class="content">
      <div style="z-index: 400;" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          on:click={closer}>ביטול</button>
          {#if a == 0}
          <Addnewp on:message={callbackFunction}/>


          {:else if a == 1}
          <EditB frd={meData.frd} {mail} un={meData.username} bi={meData.bio} on:message={callbackFunctio}/>
          {:else if a == 3}
          <div class="grid items-center text-center justify-center"><h3 class="text-barbi">{messege}</h3> 
          <button 
  class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
  on:click={han}
  >מחיקה</button>
          </div>
          {:else if a == 2}
          <div class="sp bg-gold">
            <h3 class="text-barbi">רק רגע בבקשה</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> {/if}
  </DialogContent>
  </div>
</DialogOverlay>

{#if addP == false}
<div class="body"  style="--the:{stylef};">
  <div >
  <a  target="_self" href="/lev"><img
    title=" ללב המערכת"
    class="ceterr name"
    src='https://res.cloudinary.com/love1/image/upload/v1641481504/newC_qq5z3l.svg'
    alt="link"></a></div>

  <div id="circular-text"  class="userName" >
    <svg width="45vw" height="9vw" viewBox="0 0 500 100">
    <path id="curve" d="M73.2,148.6c4-6.1,65.5-96.8,178.6-95.6c111.3,1.2,170.8,90.3,175.1,97" />
    <text width="500" id="text" >
      <textPath  text-anchor="center" class="curved-text" xlink:href="#curve" startOffset="{st}">{meData.username}</textPath>
    </text>
  </svg>
    </div>
  
  <div class="flexi">
     
  {#if addNs1 == true} 
  {#key addSl}
  <div class:selected="{current === 'a1'}" class:a1="{current !== 'a1'}"><Edit   on:addnew={addnew} on:close={close} on:remove={remove} on:open={open}   on:add={add} addSl={addSl1} meData={odata} allvn={allvn}  Valname={"כישורים"} valc={"skillName"} data={skil} datan={"skil"} linkp={"skills"} kish={"skills"} placeholder ={" בחירת כישורים"}/>  </div>
  <div class:selected="{current === 'a2'}" class:a2="{current !== 'a2'}"><Edit   on:addnew={addnew} on:close={close} on:remove={remove} on:open={open}  on:add={add} addSl={addSl2} meData={odata} allvn={allvn}  Valname={"תפקידים"} valc={"roleDescription"} data={taf} datan={"taf"} linkp={"tafkidims"} kish={"tafkidims"} placeholder ={" בחירת תפקידים"}/>  </div>
  <div class:selected="{current === 'a3' && mass !== true}" class:a3="{current !== 'a3' }" class:whole="{mass === true}"><Edit on:delm={delm} on:massss={massss}  on:addnew={addnew} on:close={close} on:remove={remove} on:open={open}  on:add={add} addSl={addSl3} meData={odata} allvn={allvn}  Valname={"משאבים"} valc={"name"} data={mash} datan={"mash"} linkp={"mashaabims"} kish={"sps"} placeholder ={" בחירת משאבים"}/> </div>
  <div class:selectedl="{current === 'a4'}" class:a4="{current !== 'a4'}"><Edit  on:addnew={addnew}  on:close={close} on:remove={remove} on:open={open}   on:add={add} addSl={addSl4} meData={odata} allvn={allvn}  Valname={"ערכים"} valc={"valueName"} data={val} datan={"val"} linkp={"vallues"} kish={"vallues"} placeholder ={" בחירת ערכים"}/>  </div>
  <div class:selectedl="{current === 'a5'}" class:a5="{current !== 'a5'}"><Edit  on:addnew={addnew}  on:close={close} on:remove={remove} on:open={open}    on:add={add} addSl={addSl5} meData={odata} allvn={allvn}  Valname={"דרכי היצירה"} valc={"workWayName"} data={work} datan={"work"} linkp={"workWays"} kish={"work_ways"} placeholder ={" בחירת דרכים"}/> </div>
  {/key}
   {/if}
    <!-- או גלילה לעשות רינדור עד מקסימום מסויים  של תפקידים כישורים וכו'ואז ההמשך בהרחבה של זה-->


  {#if $uPic}
    <div class="centr"></div>

  <div class="middle"></div>
  <!-- <Profile src={picLink}/>--> 
  <div
  class="imgpr"
  >
    <img
    class="imgpr"
  
    src={picLink}
    alt="profilePic">
    </div>
   {#if updX == 0}
   <button
     on:click={openen}
     class=" hover:bg-barbi text-mturk rounded-full edit"
     title="עריכת תמונת פרופיל"
     >  <svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path transition:draw="{{duration: 1000}}" fill="currentColor" d="M22.7 14.3L21.7 15.3L19.7 13.3L20.7 12.3C20.8 12.2 20.9 12.1 21.1 12.1C21.2 12.1 21.4 12.2 21.5 12.3L22.8 13.6C22.9 13.8 22.9 14.1 22.7 14.3M13 19.9V22H15.1L21.2 15.9L19.2 13.9L13 19.9M11.21 15.83L9.25 13.47L6.5 17H13.12L15.66 14.55L13.96 12.29L11.21 15.83M11 19.9V19.05L11.05 19H5V5H19V11.31L21 9.38V5C21 3.9 20.11 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H11V19.9Z" />
</svg>
          </button>
        
  {/if}
  {:else}
      <div class="centr"></div>

    <div class="middleu"> 
  {#if addpic == 0}    
    <button
      on:click={openen}
 class=" hover:bg-barbi text-mturk rounded-full haalaa"
     title=" העלאת תמונת פרופיל" > <svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path transition:draw="{{duration: 1000}}" fill="currentColor" d="M7 19L12 14L13.88 15.88C13.33 16.79 13 17.86 13 19H7M10 10.5C10 9.67 9.33 9 8.5 9S7 9.67 7 10.5 7.67 12 8.5 12 10 11.33 10 10.5M13.09 20H6V4H13V9H18V13.09C18.33 13.04 18.66 13 19 13C19.34 13 19.67 13.04 20 13.09V8L14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H13.81C13.46 21.39 13.21 20.72 13.09 20M18 15V18H15V20H18V23H20V20H23V18H20V15H18Z" />
</svg>
    </button>

         
{/if}
    </div>
{/if}
        
         <div class="a6"  >
          
<div class="another" dir="rtl">
  
    <h6 class="cot">הרקמות שלי</h6>
<span class="d">
           {#each myP as data, i}
           <div class="cont" >  
            <a  class="pt hover:text-gold" sveltekit:prefetch href={`/project/${data.id}`} >{data.projectName}</a>
          <!--<h3 class="pt">{data.projectName}</h3> `http://localhost:3000/project/${data.id}`--> <button
          class=" hover:bg-barbi text-mturk rounded-full"
          title="עריכה"
          on:click={project(data.id)}
          ><svg class="sv" viewBox="0 0 24 24">
           <path transition:draw="{{duration: 1000}}" fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
          </svg>
          </button>
           </div>
  {/each}</span>

<button   
style="    z-index: 7;"
class=" hover:scale-150 "     
    on:click={() => addP = true} 
    title="יצירת ריקמה חדשה">
<svg class="svgh" width="29" height="29"  version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 1209.872 1699.001" style="enable-background:new 0 0 1209.872 1699.001;" xml:space="preserve">
<style type="text/css">
	
</style>

<g class="n svgh" >
	<path   class="st2 svgh"  d="M626.407,50.022c-7.193-0.778-14.386-0.539-21.585-0.225c-7.199-0.314-14.392-0.553-21.585,0.225
		C251.878,55.423,34.711,353.506,78.035,650.425c23.893,167.215,115.647,257.266,171.46,316.006
		c120.016,126.058,98.977,162.49,139.248,225.625c-21.847,28.048-24.026,71.245-1.648,99.612
		c-17.364,28.58-17.665,68.765,4.713,94.775c-20.476,31.982-18.608,77.175,8.345,100.906
		c-5.833,37.263,21.687,100.389,96.352,99.134c1.835,7.057,2.615,35.574,28.544,52.411c22.791,15.301,33.22,8.487,120.829,10.596
		c13.537,0.213,27.393-2.995,38.715-10.596c25.906-16.821,26.712-45.365,28.544-52.411c69.851,1.174,102.81-57.885,96.352-99.134
		c27.183-23.933,28.625-69.231,8.345-100.906c22.378-26.01,22.077-66.196,4.713-94.775c22.378-28.367,20.199-71.564-1.648-99.612
		c18.569-29.111,27.339-62.953,42.134-93.907c40.361-89.323,118.845-144.285,175.146-219.92
		C1278.898,552.106,1058.01,57.057,626.407,50.022z"/>
	<g>
		<path class="st1 svgh" d="M524.2,322.601c48.714,52.887,44.272,124.135-12.19,172.027c46.6,39.059,62.963,107.336,29.43,160.439
			c-21.599-8.771-47.219-9.905-68.41,0.62c-15.397-10.737-34.816-15.521-53.314-11.269c-14.058-51.802-57.926-76.267-110.562-64.442
			c0-12.952-2.87-25.904-9.444-37.155c20.766-1.914,41.142-10.418,55.99-25.249c21.952,26.53,58.082,34.106,89.726,13.891
			c8.221,17.169,22.396,31.539,40.132,38.803c2.906-7.194,5.723-14.405,8.717-21.545c-36.456-15.635-47.837-72.308-8.523-99.453
			c-4.43-6.414-8.806-12.863-13.236-19.26c-24.93,16.638-38.218,47.839-33.984,77.394c-24.695,20.091-53.098,13.835-68.269-9.143
			c7.335-14.263,9.798-31.113,5.262-46.617c33.944-20.88,37.112-62.047,22.485-93.251c47.074-1.22,78.651-30.766,80.175-77.022
			c22.378-7.016,40.061-26.241,45.111-49.168c-7.389-1.931-14.813-3.703-22.307-5.191c-9.078,40.401-58.74,44.695-86.395,13.129
			c-5.971,5.014-11.747,10.223-17.488,15.468c14.635,16.726,35.472,28.19,57.903,29.271
			c-12.072,102.836-178.404,29.849-144.847-52.677c9.459-25.101,38.855-44.549,72.096-30.794
			C493.056,37.494,609.684,207.751,524.2,322.601z M286.208,279.616c15.991,41.547,43.497,61.444,79.91,74.452
			c32.534,25.859,18.474,85.043-26.028,83.081c25.214,28.823,16.994,54.331-9.639,70.395
			c-57.774,33.943-73.298-18.663-141.941,17.311c-43.266-51.995,2.963-129.5,66.887-128.263
			C221.842,360.836,220.778,286.18,286.208,279.616z M278.695,614.9c56.62-24.962,104.915-20.123,119.634,39.707
			c-17.346,12.793-26.79,34.834-23.867,56.22c-62.888,42.087-43.474,132.334,37.988,140.542
			c4.057,29.944,26.453,54.98,54.253,65.629c3.154-7.087,5.599-14.44,8.434-21.634c-50.724-20.729-57.526-88.132,2.959-104.308
			c-1.719-7.53-3.366-15.078-5.05-22.609c-29.82,6.607-52.852,26.297-60.313,59.48c-64.036-8.064-70.705-74.236-11.535-105.141
			c-14.002-59.62,33.091-71.614,70.324-36.783c66.736-56.035,146.207,56.851,67.755,140.435
			c92.475,100.044-11.622,222.972-100.392,132.267c-67.741,27.295-108.964-11.979-99.843-80.902
			c-70.81,20.231-114.179-35.714-93.305-105.424c-66.112-20.811-90.579-79.246-87.564-143.235
			C167.241,497.084,324.8,511.164,278.695,614.9z"/>
		<path class="st0 svgh" d="M827.386,201.408c33.147-13.716,62.603,5.603,72.096,30.794c33.577,82.577-132.791,155.377-144.847,52.677
			c22.431-1.081,43.268-12.545,57.903-29.271c-5.741-5.245-11.517-10.454-17.488-15.468c-27.647,31.557-77.315,27.28-86.395-13.129
			c-7.495,1.488-14.919,3.26-22.307,5.191c5.05,22.928,22.733,42.152,45.111,49.168c1.524,46.257,33.105,75.801,80.175,77.022
			c-14.488,30.908-11.75,72.193,22.485,93.251c-4.536,15.504-2.073,32.354,5.262,46.617c-15.126,22.91-43.508,29.288-68.269,9.143
			c4.235-29.554-9.054-60.756-33.984-77.394c-4.43,6.396-8.806,12.846-13.236,19.26c39.299,27.134,27.947,83.812-8.523,99.453
			c2.994,7.141,5.812,14.352,8.717,21.545c17.736-7.265,31.911-21.634,40.132-38.803c31.218,19.942,67.449,13.031,89.726-13.891
			c14.848,14.83,35.224,23.335,55.99,25.249c-6.573,11.251-9.444,24.203-9.444,37.155c-52.583-11.813-96.491,12.589-110.562,64.442
			c-18.498-4.252-37.917,0.532-53.314,11.269c-21.191-10.525-46.812-9.391-68.41-0.62c-33.571-53.164-17.113-121.428,29.43-160.439
			c-56.477-47.905-60.891-119.154-12.19-172.027c-75.922-102.004,5.287-223.719,84.02-180.337
			C794.058,155.889,811.901,178.498,827.386,201.408z M954.25,396.593c63.903-1.237,110.171,76.246,66.887,128.263
			c-15.694-8.225-37.67-20.541-78.882-8.363c-46.737,13.978-119.009-26.402-72.698-79.343
			c-44.501,1.961-58.568-57.218-26.028-83.081c35.043-12.519,63.386-31.523,79.91-74.452
			C988.214,286.114,988.173,360.442,954.25,396.593z M963.906,772.381c20.839,69.591-22.337,125.7-93.305,105.424
			c9.123,68.938-32.481,108.044-99.843,80.902c-89.352,91.299-192.353-32.78-100.392-132.267
			c-78.548-83.687,0.915-196.557,67.755-140.435c36.775-34.403,84.439-23.315,70.324,36.783
			c58.943,30.786,52.747,97.046-11.535,105.141c-7.412-32.964-30.243-52.818-60.313-59.48c-1.683,7.53-3.331,15.078-5.05,22.609
			c60.391,16.15,53.744,83.554,2.959,104.308c2.835,7.194,5.28,14.547,8.434,21.634c27.8-10.649,50.196-35.685,54.253-65.629
			c81.536-8.215,100.853-98.471,37.988-140.542c2.924-21.386-6.52-43.428-23.867-56.22c14.762-60.007,63.078-64.641,119.634-39.707
			c-37.249-83.81,51.987-98.654,90.062-61.323C1069.097,599.65,1069.536,739.131,963.906,772.381z"/>
	</g>
</g>
</svg>

 </button> 
</div> 
     
      <!-- <lord-icon
        src="https://cdn.lordicon.com/mecwbjnp.json"
      trigger="loop-on-hover"
                   colors="primary:#ee66aa,secondary:#66eece"
               style="width:42px;height:42px;">
                  </lord-icon> -->
             
    
</div> 
<div class="anotheri">
  <svg class="svgg"  viewBox="10.359 38.373 262.893 179.464" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:bx="https://boxy-svg.com">
  <defs>
    <linearGradient id="imagebot_157">
      <stop offset="0" stop-color="#0a062b" id="imagebot_163"/>
      <stop offset="0.3468" stop-opacity="0.49565" stop-color="#6c6a7d" id="imagebot_162"/>
      <stop offset="0.6936" stop-opacity="0.81739" stop-color="#fff" id="imagebot_161"/>
      <stop offset="1" stop-color="#fff" id="imagebot_160"/>
    </linearGradient>
    <linearGradient y2="1.514" x2="0.5001" y1="-0.51459" x1="0.5001" id="imagebot_93" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.4996" y1="-2.65064" x2="1.00013" x1="-4.8456" id="imagebot_89" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49971" x2="0.99988" y1="-4.99448" x1="1.0669" id="imagebot_87" xlink:href="#imagebot_157"/>
    <linearGradient y2="1.77514" x2="-0.37134" y1="-3.8068" x1="3.40966" id="imagebot_85" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50003" x2="1" y1="1.92588" x1="-5.24042" id="imagebot_81" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.75443" x2="0.50379" y1="-6.03192" x1="-0.84719" id="imagebot_79" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.94216" x2="0.50003" y1="-0.26224" x1="0.51008" id="imagebot_77" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.94217" x2="0.50003" y1="-0.26224" x1="0.25504" id="imagebot_75" xlink:href="#imagebot_157"/>
    <linearGradient y2="1.99375" x2="3.16872" y1="-3.43627" x1="-3.42408" id="imagebot_73" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50016" y1="0.62035" x2="1.0001" x1="-1.31168" id="imagebot_71" xlink:href="#imagebot_157"/>
    <linearGradient y2="1.18674" x2="0.50064" y1="0.14799" x1="-0.87891" id="imagebot_69" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.4998" y1="-6.30046" x2="1" x1="-0.13897" id="imagebot_61" xlink:href="#imagebot_157"/>
    <linearGradient y2="1.50378" x2="2.08832" y1="2.19154" x1="-4.26029" id="imagebot_59" xlink:href="#imagebot_157"/>
    <linearGradient y2="1.84015" x2="0.50005" y1="-4.80646" x1="1.16279" id="imagebot_57" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50041" y1="0.44243" x2="1.00015" x1="-0.75383" id="imagebot_55" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.5" y1="-8.90769" x2="0.99999" x1="1.1809" id="imagebot_51" xlink:href="#imagebot_157"/>
    <linearGradient y2="-0.00296" x2="0.45775" y1="2.19267" spreadMethod="reflect" x1="0.00244" id="imagebot_11" xlink:href="#imagebot_157"/>
    <linearGradient y2="1.30359" x2="0.50107" y1="-4.11695" x1="-1.56046" id="imagebot_49" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50019" x2="0.99987" y1="0.78922" x1="-0.92385" id="imagebot_43" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50016" x2="0.99993" y1="2.6134" x1="-1.58599" id="imagebot_41" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.56323" x2="1.08309" y1="-0.48316" x1="0.85825" id="imagebot_39" xlink:href="#imagebot_157"/>
    <linearGradient y2="2.23286" x2="0.50079" y1="-5.66364" x1="-0.21469" id="imagebot_37" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.5" x2="0.99993" y1="-9.15231" x1="0.46352" id="imagebot_31" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.5001" y1="0.79866" x2="0.99997" x1="-0.83402" id="imagebot_29" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50006" x2="1.00024" y1="0.80341" x1="-1.12791" id="imagebot_27" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.94847" x2="0.25133" y1="-0.42672" x1="0.69697" id="imagebot_25" xlink:href="#imagebot_157"/>
    <linearGradient y2="3.64392" x2="0.50002" y1="-2.6436" x1="0.50002" id="imagebot_95" xlink:href="#imagebot_157"/>
    <linearGradient y2="2.55336" x2="0.49958" y1="-1.55322" x1="0.49958" id="imagebot_91" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.15209" x2="0.56083" y1="2.10713" spreadMethod="reflect" x1="0.56083" id="imagebot_21" xlink:href="#imagebot_157"/>
    <linearGradient y2="-0.05124" x2="0.52052" y1="3.04636" spreadMethod="reflect" x1="0.52052" id="imagebot_15" xlink:href="#imagebot_157"/>
    <linearGradient y2="-0.08424" x2="1.18311" y1="1.88491" spreadMethod="reflect" x1="2.93564" id="imagebot_13" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.12131" x2="1.15228" y1="6.10503" spreadMethod="reflect" x1="2.26418" id="imagebot_17" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.65448" x2="1.19613" y1="5.86894" spreadMethod="reflect" x1="-1.35607" id="imagebot_19" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.91611" x2="0.96843" y1="2.69946" spreadMethod="reflect" x1="0.96843" id="imagebot_23" xlink:href="#imagebot_157"/>
    <linearGradient y2="-0.06767" x2="0.4851" y1="2.37543" spreadMethod="reflect" x1="-0.45528" id="imagebot_9" xlink:href="#imagebot_157"/>
    <linearGradient y2="-1.8682" x2="0.68846" y1="-0.34899" spreadMethod="reflect" x1="0.66906" id="imagebot_35" xlink:href="#imagebot_157"/>
    <linearGradient y2="1.00484" x2="-0.50025" y1="-0.62784" x1="-0.53558" id="imagebot_33" xlink:href="#imagebot_157"/>
    <linearGradient y2="1.07964" x2="2.34358" y1="-0.79724" x1="0.00929" id="imagebot_53" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.97138" x2="-1.3928" y1="-0.41552" x1="-1.37268" id="imagebot_63" xlink:href="#imagebot_157"/>
    <linearGradient y2="1.09425" x2="0.69783" y1="-0.41918" x1="0.91038" id="imagebot_45" xlink:href="#imagebot_157"/>
    <linearGradient y2="-1.64248" x2="1.65337" y1="-0.27353" spreadMethod="reflect" x1="1.50616" id="imagebot_47" xlink:href="#imagebot_157"/>
    <linearGradient y2="-1.74116" x2="-0.25904" y1="-0.39123" spreadMethod="reflect" x1="-0.4246" id="imagebot_65" xlink:href="#imagebot_157"/>
    <linearGradient y2="-2.49309" x2="1.26778" y1="-0.58648" spreadMethod="reflect" x1="2.67907" id="imagebot_83" xlink:href="#imagebot_157"/>
    <linearGradient y2="-2.91076" x2="0.56842" y1="-0.92543" spreadMethod="reflect" x1="0.55094" id="imagebot_67" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49989" x2="1" y1="0.49989" x1="-0.00011" id="imagebot_98" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.4999" x2="1" y1="0.4999" x1="0.00008" id="imagebot_100" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49992" x2="0.99996" y1="0.49992" x1="-0.00006" id="imagebot_102" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49986" x2="1" y1="0.49986" x1="-0.0001" id="imagebot_104" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49997" x2="1" y1="0.49997" x1="-0.00088" id="imagebot_106" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49998" x2="1" y1="0.49998" x1="-0.00005" id="imagebot_108" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49999" x2="1" y1="0.49999" x1="-0.00004" id="imagebot_110" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49992" x2="0.99996" y1="0.49992" x1="-0.00004" id="imagebot_112" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49974" x2="0.99993" y1="0.49974" x1="-0.00005" id="imagebot_114" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49991" x2="1" y1="0.49991" x1="-0.00005" id="imagebot_116" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49995" x2="0.99998" y1="0.49995" x1="-0.00003" id="imagebot_118" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49996" x2="0.99998" y1="0.49996" x1="-0.00004" id="imagebot_120" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50005" x2="0.99998" y1="0.50005" x1="-0.00002" id="imagebot_122" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49991" x2="1" y1="0.49991" x1="0.00013" id="imagebot_124" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50021" x2="1" y1="0.50021" x1="0.00016" id="imagebot_126" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49998" x2="1" y1="0.49998" x1="0.00001" id="imagebot_128" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49971" x2="1" y1="0.49971" x1="-0.00007" id="imagebot_130" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50015" x2="0.99998" y1="0.50015" x1="0.00001" id="imagebot_132" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49997" x2="1" y1="0.49997" x1="-0.00005" id="imagebot_134" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49997" x2="1" y1="0.49997" x1="-0.00005" id="imagebot_136" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49981" x2="1.00002" y1="0.49981" x1="0.00001" id="imagebot_138" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49998" x2="1" y1="0.49998" x1="-0.00001" id="imagebot_140" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49979" x2="1.00003" y1="0.49979" x1="0.00002" id="imagebot_142" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49989" x2="1.00003" y1="0.49989" x1="0.00003" id="imagebot_144" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49999" x2="1.00003" y1="0.49999" x1="0.00003" id="imagebot_146" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.5" x2="1.00003" y1="0.5" x1="0.00004" id="imagebot_148" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49966" x2="0.99996" y1="0.49966" x1="-0.00005" id="imagebot_150" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.50001" x2="1.00008" y1="0.50001" x1="0.00006" id="imagebot_152" xlink:href="#imagebot_157"/>
    <linearGradient y2="0.49993" x2="1.00008" y1="0.49993" x1="0.00005" id="imagebot_154" xlink:href="#imagebot_157"/>
    <filter height="200%" width="200%" y="-50%" x="-50%" id="imagebot_164_blur">
      <feGaussianBlur stdDeviation="17.1" in="SourceGraphic"/>
    </filter>
    <radialGradient gradientUnits="userSpaceOnUse" cx="462.659" cy="513.872" r="30.951" id="gradient-44">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="414.677" cy="520.905" r="17.033" id="gradient-45">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="520.353" cy="515.464" r="26.738" id="gradient-46">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="389.199" cy="536.838" r="8.449" id="gradient-47">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="389.031" cy="553.826" r="8.281" id="gradient-48">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="400.204" cy="536.836" r="11.169" id="gradient-49">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="456.03" cy="626.206" r="23.201" id="gradient-50">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="569.261" cy="543.509" r="8.449" id="gradient-51">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="573.569" cy="545.106" r="4.141" id="gradient-52">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="410.928" cy="585.077" r="21.898" id="gradient-53">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="410.929" cy="585.077" r="21.899" id="gradient-54">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="558.256" cy="527.367" r="11.169" id="gradient-55">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="400.199" cy="552.977" r="11.169" id="gradient-56">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="505.606" cy="623.358" r="26.378" id="gradient-57">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="488.846" cy="627.953" r="20.536" id="gradient-58">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="533.267" cy="590.658" r="23.884" id="gradient-59">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="554.849" cy="578.592" r="22.862" id="gradient-60">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="557.157" cy="561.483" r="20.563" id="gradient-61">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="567.431" cy="544.39" r="10.281" id="gradient-62">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="438.107" cy="552.342" r="26.738" id="gradient-63">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="413.447" cy="552.971" r="16.137" id="gradient-64">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="415.067" cy="586.62" r="17.757" id="gradient-65">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="429.589" cy="568.81" r="32.281" id="gradient-66">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="543.773" cy="544.389" r="17.033" id="gradient-67">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="448.95" cy="595.497" r="19.36" id="gradient-68">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="448.95" cy="594.859" r="19.36" id="gradient-69">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="447.217" cy="562.706" r="17.627" id="gradient-70">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="541.951" cy="558.786" r="15.201" id="gradient-71">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="533.268" cy="590.66" r="23.883" id="gradient-72">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="495.791" cy="556.566" r="30.951" id="gradient-73">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="488.849" cy="597.087" r="20.536" id="gradient-74">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="517.911" cy="591.54" r="18.68" id="gradient-75">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="499.236" cy="571.99" r="37.359" id="gradient-76">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="517.911" cy="558.788" r="18.68" id="gradient-77">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="480.54" cy="562.709" r="18.681" id="gradient-78">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="480.541" cy="594.864" r="18.681" id="gradient-79">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="462.66" cy="519.507" r="30.95" id="gradient-80">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="513.161" cy="519.51" r="33.93" id="gradient-81">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="438.435" cy="521.292" r="40.792" id="gradient-82">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="438.441" cy="534.36" r="40.792" id="gradient-83">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="520.018" cy="525.779" r="40.792" id="gradient-84">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="445.3" cy="540.63" r="33.93" id="gradient-85">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="520.02" cy="538.85" r="40.79" id="gradient-86">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="495.791" cy="540.633" r="30.951" id="gradient-87">
      <stop offset="0" style="stop-color: rgba(255, 0, 251, 1)"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 150, 1)"/>
    </radialGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="310.778" y1="161.583" x2="310.778" y2="220.333" id="gradient-1" gradientTransform="matrix(4.538021, 0.000001, 0, 1.297314, -1099.540463, -56.774407)">
      <stop offset="0" style="stop-color: rgb(52, 217, 203);"/>
      <stop offset="0.347" style="stop-opacity: 0.49565; stop-color: rgb(162, 114, 162);"/>
      <stop offset="0.694" style="stop-opacity: 0.81739; stop-color: rgb(217, 190, 243);"/>
      <stop offset="1" style="stop-color: rgb(180, 241, 205);"/>
    </linearGradient>
    <filter id="drop-shadow-filter-0" x="-500%" y="-500%" width="1000%" height="1000%" bx:preset="drop-shadow 1 10 10 2 0.66 rgba(192,157,192,1)">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="10" dy="10"/>
      <feComponentTransfer result="offsetblur">
        <feFuncA id="spread-ctrl" type="linear" slope="1.32"/>
      </feComponentTransfer>
      <feFlood flood-color="rgba(192,157,192,1)"/>
      <feComposite in2="offsetblur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <radialGradient gradientUnits="userSpaceOnUse" cx="0" cy="-7.695" r="115.453" id="gradient-2">
      <stop offset="0" style="stop-color: rgba(86, 126, 151, 1)"/>
      <stop offset="1" style="stop-color: rgb(19, 125, 190);"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="0" cy="-7.695" r="115.453" id="gradient-3">
      <stop offset="0" style="stop-color: rgb(85, 218, 209);"/>
      <stop offset="1" style="stop-color: rgb(221, 209, 94);"/>
    </radialGradient>
  </defs>
      <title>סך הכל הרווחתי</title>
  <g id="imagebot_2" style="" transform="matrix(1.133505, 0, 0, 1, -5.338863, -2.934956)">
    <g filter="url(#imagebot_164_blur)" id="imagebot_164" transform="translate(0.000976563 0) matrix(1 0 0 1 -349.55 -446.51)">
      <path stroke-width="0" id="imagebot_165" d="M493.61,508.95L459.228,518.7949L431.708,512.5018L493.61,508.95z" style="fill: url(#gradient-44);"/>
      <path stroke-width="0" id="imagebot_166" d="M431.71,512.51L401.307,529.3L397.6433,526.3499L431.71,512.51z" style="fill: url(#gradient-45);"/>
      <path stroke-width="0" id="imagebot_167" d="M547.09,517.77L528.87,521.9757L493.615,508.9527L547.09,517.77z" style="fill: url(#gradient-46);"/>
      <path stroke-width="0" id="imagebot_168" d="M380.75,544.25L389.0328,547.3248L397.6478,526.3518L380.75,544.25z" style="fill: url(#gradient-47);"/>
      <path stroke-width="0" id="imagebot_169" d="M380.75,544.06L380.75,544.2475L380.87501,544.2787L380.75,544.05995L380.75,544.06zM380.87501,544.27875L389.03121,560.30975L397.18741,563.37225L389.03121,547.31025L380.87501,544.27905zM397.18701,563.37275L397.31201,563.5915L397.31201,563.404L397.18701,563.3728z" opacity="0.77155" style="fill: url(#gradient-48);"/>
      <path stroke-width="0" id="imagebot_170" d="M397.65,526.35L389.035,547.323L411.373,542.3709L397.65,526.35z" style="fill: url(#gradient-49);"/>
      <path stroke-width="0" id="imagebot_171" d="M432.83,609.85L479.231,642.563L468.311,615.701L432.83,609.85z" style="fill: url(#gradient-50);"/>
      <path stroke-width="0" id="imagebot_172" d="M577.71,553.23L569.4271,536.965L560.8121,533.789L577.71,553.23z" style="fill: url(#gradient-51);"/>
      <path stroke-width="0" id="imagebot_173" d="M577.71,553.04L569.4271,549.9652L569.4271,536.9732L577.71,553.2382L577.71,553.04z" style="fill: url(#gradient-52);"/>
      <path stroke-width="0" id="imagebot_174" d="M389.03,560.31L432.827,609.845L397.313,563.385L389.03,560.31z" style="fill: url(#gradient-53);"/>
      <path stroke-width="0" id="imagebot_175" d="M389.03,560.31L429.988,599.946L432.8275,609.8446L389.03,560.31z" style="fill: url(#gradient-54);"/>
      <path stroke-width="0" id="imagebot_176" d="M560.81,533.79L569.425,536.966L547.087,517.769L560.81,533.79z" style="fill: url(#gradient-55);"/>
      <path stroke-width="0" id="imagebot_177" d="M389.03,547.32L397.3127,563.585L411.3677,542.368L389.03,547.32z" style="fill: url(#gradient-56);"/>
      <path stroke-width="0" id="imagebot_178" d="M509.38,613.34L479.228,642.559L531.984,604.157L509.38,613.34z" style="fill: url(#gradient-57);"/>
      <path stroke-width="0" id="imagebot_179" d="M468.31,615.7L479.23,642.562L509.382,613.343L468.31,615.7z" style="fill: url(#gradient-58);"/>
      <path stroke-width="0" id="imagebot_180" d="M557.15,567.98L509.383,613.336L531.987,604.1529L557.15,567.98z" style="fill: url(#gradient-59);"/>
      <path stroke-width="0" id="imagebot_181" d="M557.15,567.98L531.986,604.153L577.711,553.032L557.15,567.98z" style="fill: url(#gradient-60);"/>
      <path stroke-width="0" id="imagebot_182" d="M577.72,553.03L577.37624,553.28L577.72,553.2488L577.72,553.03004L577.72,553.03zM577.37624,553.28L557.15724,554.9988L536.87624,569.7178L557.15724,567.999L577.37624,553.28zM536.87624,569.718L536.59499,569.7492L536.59499,569.9367L536.87624,569.71795z" opacity="0.77155" style="fill: url(#gradient-61);"/>
      <path stroke-width="0" id="imagebot_183" d="M557.15,554.99L577.712,553.2315L560.814,533.7905L557.15,554.99z" style="fill: url(#gradient-62);"/>
      <path stroke-width="0" id="imagebot_184" d="M411.37,542.37L429.59,562.314L464.845,551.188L411.37,542.37z" style="fill: url(#gradient-63);"/>
      <path stroke-width="0" id="imagebot_185" d="M397.31,563.58L429.585,562.3068L411.365,542.3628L397.31,563.58z" style="fill: url(#gradient-64);"/>
      <path stroke-width="0" id="imagebot_186" d="M397.31,563.39L432.824,609.85L429.5848,575.307L397.31,563.39z" style="fill: url(#gradient-65);"/>
      <path stroke-width="0" id="imagebot_187" d="M429.59,562.31L397.778,563.56L429.59,575.31L461.402,574.06L429.59,562.31zM461.402,574.06L461.87075,574.21625L461.87075,574.02875L461.402,574.05995L461.402,574.06zM397.777,563.56L397.30824,563.40375L397.30824,563.59125L397.777,563.56005z" opacity="0.77155" style="fill: url(#gradient-66);"/>
      <path stroke-width="0" id="imagebot_188" d="M526.74,547.63L557.143,554.989L560.8068,533.79L526.74,547.63z" style="fill: url(#gradient-67);"/>
      <path stroke-width="0" id="imagebot_189" d="M429.59,575.3L432.8292,609.843L468.3102,615.6933L429.59,575.3z" style="fill: url(#gradient-68);"/>
      <path stroke-width="0" id="imagebot_190" d="M429.59,575.3L468.31,615.693L461.8653,574.026L429.59,575.3z" style="fill: url(#gradient-69);"/>
      <path stroke-width="0" id="imagebot_191" d="M429.59,562.31L461.865,574.227L464.8446,551.184L429.59,562.31z" style="fill: url(#gradient-70);"/>
      <path stroke-width="0" id="imagebot_192" d="M536.59,569.94L557.152,554.992L526.749,547.633L536.59,569.94z" style="fill: url(#gradient-71);"/>
      <path stroke-width="0" id="imagebot_193" d="M536.59,569.74L509.384,613.338L557.151,567.982L536.59,569.74z" style="fill: url(#gradient-72);"/>
      <path stroke-width="0" id="imagebot_194" d="M464.84,551.19L499.222,565.494L526.742,547.638L464.84,551.19z" style="fill: url(#gradient-73);"/>
      <path stroke-width="0" id="imagebot_195" d="M499.23,578.48L468.313,615.695L509.385,613.3383L499.23,578.48z" style="fill: url(#gradient-74);"/>
      <path stroke-width="0" id="imagebot_196" d="M499.23,578.48L509.385,613.339L536.591,569.742L499.23,578.48z" style="fill: url(#gradient-75);"/>
      <path stroke-width="0" id="imagebot_197" d="M499.22,565.49L462.408,574.0838L499.22,578.49L536.064,569.865L499.22,565.49zM536.064,569.865L536.59525,569.9275L536.59525,569.74L536.064,569.865zM462.408,574.0838L461.87675,574.0213L461.87675,574.2088L462.408,574.0838z" opacity="0.77155" style="fill: url(#gradient-76);"/>
      <path stroke-width="0" id="imagebot_198" d="M499.23,565.49L536.591,569.9412L526.7493,547.6342L499.23,565.49z" style="fill: url(#gradient-77);"/>
      <path stroke-width="0" id="imagebot_199" d="M461.86,574.23L499.221,565.4913L464.839,551.1873L461.86,574.23z" style="fill: url(#gradient-78);"/>
      <path stroke-width="0" id="imagebot_200" d="M461.86,574.03L468.3047,615.697L499.2217,578.482L461.86,574.03z" style="fill: url(#gradient-79);"/>
      <g id="imagebot_201" opacity="0.84052">
        <path stroke-width="0" id="imagebot_202" d="M493.61,508.95L431.709,512.5018L479.225,530.0648L493.61,508.95z" style="fill: url(#gradient-80);"/>
        <path stroke-width="0" id="imagebot_203" d="M547.09,517.77L493.616,508.9528L479.231,530.0678L547.09,517.77z" style="fill: url(#gradient-81);"/>
        <path stroke-width="0" id="imagebot_204" d="M431.71,512.51L397.643,526.35L479.226,530.0732L431.71,512.51z" style="fill: url(#gradient-82);"/>
        <path stroke-width="0" id="imagebot_205" d="M397.65,526.35L411.373,542.371L479.233,530.073L397.65,526.35z" style="fill: url(#gradient-83);"/>
        <path stroke-width="0" id="imagebot_206" d="M560.81,533.79L547.087,517.769L479.227,530.067L560.81,533.79z" style="fill: url(#gradient-84);"/>
        <path stroke-width="0" id="imagebot_207" d="M411.37,542.37L464.845,551.1872L479.23,530.0722L411.37,542.37z" style="fill: url(#gradient-85);"/>
        <path stroke-width="0" id="imagebot_208" d="M526.74,547.63L560.81,533.79L479.23,530.07L526.74,547.63z" style="fill: url(#gradient-86);"/>
        <path stroke-width="0" id="imagebot_209" d="M464.84,551.19L526.741,547.6382L479.225,530.0752L464.84,551.19z" style="fill: url(#gradient-87);"/>
      </g>
    </g>
    <g transform="translate(0.000976563 0) matrix(1 0 0 1 -349.55 -446.51)" id="imagebot_96">
      <path d="M496.59,523.25L459.229,518.7988L493.611,508.9539L496.59,523.25z" opacity="0.58621" id="imagebot_153" fill="url(#imagebot_154)"/>
      <path d="M496.59,523.05L487.9076,589.448L459.2286,531.789L496.59,523.05z" opacity="0.58621" id="imagebot_151" fill="url(#imagebot_152)"/>
      <path d="M459.25,518.81L422.406,527.4038L459.25,531.7788L496.062,523.185L459.25,518.81zM496.062,523.185L496.59325,523.2475L496.59325,523.06L496.062,523.185zM422.406,527.4038L421.87475,527.3413L421.87475,527.5288L422.406,527.4038z" opacity="0.58621" id="imagebot_149" fill="url(#imagebot_150)"/>
      <path d="M459.23,531.79L450.5476,591.593L421.8686,527.339L459.23,531.79z" opacity="0.58621" id="imagebot_147" fill="url(#imagebot_148)"/>
      <path d="M459.23,531.79L487.909,589.449L450.548,591.5927L459.23,531.79z" opacity="0.58621" id="imagebot_145" fill="url(#imagebot_146)"/>
      <path d="M459.23,518.8L421.869,527.5387L431.7107,512.5067L459.23,518.8z" opacity="0.58621" id="imagebot_143" fill="url(#imagebot_144)"/>
      <path d="M421.87,527.54L401.308,529.2985L431.711,512.5085L421.87,527.54z" opacity="0.58621" id="imagebot_141" fill="url(#imagebot_142)"/>
      <path d="M421.87,527.34L450.549,591.594L401.309,542.288L421.87,527.34z" opacity="0.58621" id="imagebot_139" fill="url(#imagebot_140)"/>
      <path d="M421.87,527.34L421.58875,527.55875L421.87,527.52755L421.87,527.34005L421.87,527.34zM421.58875,527.55875L401.30775,529.30875L381.02675,544.02775L401.30775,542.27775L421.58875,527.55875zM381.02675,544.02775L380.7455,544.05895L380.7455,544.24645L381.02675,544.0277z" opacity="0.58621" id="imagebot_137" fill="url(#imagebot_138)"/>
      <path d="M528.87,534.97L487.912,589.451L496.5944,523.053L528.87,534.97z" opacity="0.58621" id="imagebot_135" fill="url(#imagebot_136)"/>
      <path d="M528.87,534.97L522.8802,593.528L487.9122,589.4519L528.87,534.97z" opacity="0.58621" id="imagebot_133" fill="url(#imagebot_134)"/>
      <path d="M528.87,521.96L497.058,523.21L528.87,534.96L560.62,533.71L528.87,521.96zM560.62,533.71L561.15125,533.8975L561.15125,533.67875L560.62,533.70995L560.62,533.71zM497.058,523.21L496.58925,523.05375L496.58925,523.24125L497.058,523.21005z" opacity="0.58621" id="imagebot_131" fill="url(#imagebot_132)"/>
      <path d="M528.87,521.98L496.595,523.2532L493.6155,508.9572L528.87,521.98z" opacity="0.58621" id="imagebot_129" fill="url(#imagebot_130)"/>
      <path d="M487.91,589.45L479.2276,642.558L450.5486,591.593L487.91,589.45z" opacity="0.58621" id="imagebot_127" fill="url(#imagebot_128)"/>
      <path d="M561.14,533.89L528.865,521.973L547.085,517.7673L561.14,533.89z" opacity="0.58621" id="imagebot_125" fill="url(#imagebot_126)"/>
      <path d="M561.14,533.7L522.875,593.531L528.8648,534.973L561.14,533.7z" opacity="0.58621" id="imagebot_123" fill="url(#imagebot_124)"/>
      <path d="M450.55,591.59L479.229,642.555L429.989,599.944L450.55,591.59z" opacity="0.58621" id="imagebot_121" fill="url(#imagebot_122)"/>
      <path d="M401.31,542.29L429.989,599.949L380.749,544.048L401.31,542.29z" opacity="0.58621" id="imagebot_119" fill="url(#imagebot_120)"/>
      <path d="M401.31,542.29L450.55,591.596L429.988,599.9494L401.31,542.29z" opacity="0.58621" id="imagebot_117" fill="url(#imagebot_118)"/>
      <path d="M522.88,593.53L479.23,642.562L487.9124,589.454L522.88,593.53z" opacity="0.58621" id="imagebot_115" fill="url(#imagebot_116)"/>
      <path d="M401.31,529.3L380.748,544.248L397.646,526.35L401.31,529.3z" opacity="0.58621" id="imagebot_113" fill="url(#imagebot_114)"/>
      <path d="M429.99,599.95L479.23,642.561L432.829,609.848L429.99,599.95z" opacity="0.58621" id="imagebot_111" fill="url(#imagebot_112)"/>
      <path d="M569.43,549.96L522.882,593.526L561.147,533.695L569.43,549.96z" opacity="0.58621" id="imagebot_109" fill="url(#imagebot_110)"/>
      <path d="M569.43,549.96L531.988,604.156L522.8825,593.526L569.43,549.96z" opacity="0.58621" id="imagebot_107" fill="url(#imagebot_108)"/>
      <path d="M569.43,549.96L561.1473,533.695L561.1473,533.89311L569.43,536.96791L569.43,549.96z" opacity="0.58621" id="imagebot_105" fill="url(#imagebot_106)"/>
      <path d="M569.43,536.97L561.1473,533.8952L547.0923,517.7732L569.43,536.97z" opacity="0.58621" id="imagebot_103" fill="url(#imagebot_104)"/>
      <path d="M380.75,544.05L429.99,599.951L389.032,560.315L380.75,544.05z" opacity="0.58621" id="imagebot_101" fill="url(#imagebot_102)"/>
      <path d="M531.98,604.16L479.224,642.562L522.874,593.53L531.98,604.16z" opacity="0.58621" id="imagebot_99" fill="url(#imagebot_100)"/>
      <path d="M577.71,553.04L531.985,604.161L569.427,549.965L577.71,553.04z" opacity="0.58621" id="imagebot_97" fill="url(#imagebot_98)"/>
    </g>
    <g transform="translate(0.000976563 0) matrix(1 0 0 1 -349.55 -446.51)" id="imagebot_6">
      <path d="M493.61,508.95L459.228,518.7949L431.708,512.5018L493.61,508.95z" id="imagebot_94" fill="url(#imagebot_95)"/>
      <path d="M431.71,512.51L401.307,529.3L397.6433,526.3499L431.71,512.51z" id="imagebot_92" fill="url(#imagebot_93)"/>
      <path d="M547.09,517.77L528.87,521.9757L493.615,508.9527L547.09,517.77z" id="imagebot_90" fill="url(#imagebot_91)"/>
      <path d="M380.75,544.25L389.0328,547.3248L397.6478,526.3518L380.75,544.25z" id="imagebot_88" fill="url(#imagebot_89)"/>
      <path d="M380.75,544.06L380.75,544.2475L380.87501,544.2787L380.75,544.05995L380.75,544.06zM380.87501,544.27875L389.03121,560.30975L397.18741,563.37225L389.03121,547.31025L380.87501,544.27905zM397.18701,563.37275L397.31201,563.5915L397.31201,563.404L397.18701,563.3728z" opacity="0.77155" id="imagebot_86" fill="url(#imagebot_87)"/>
      <path d="M397.65,526.35L389.035,547.323L411.373,542.3709L397.65,526.35z" id="imagebot_84" fill="url(#imagebot_85)"/>
      <path d="M432.83,609.85L479.231,642.563L468.311,615.701L432.83,609.85z" id="imagebot_82" fill="url(#imagebot_83)"/>
      <path d="M577.71,553.23L569.4271,536.965L560.8121,533.789L577.71,553.23z" id="imagebot_80" fill="url(#imagebot_81)"/>
      <path d="M577.71,553.04L569.4271,549.9652L569.4271,536.9732L577.71,553.2382L577.71,553.04z" id="imagebot_78" fill="url(#imagebot_79)"/>
      <path d="M389.03,560.31L432.827,609.845L397.313,563.385L389.03,560.31z" id="imagebot_76" fill="url(#imagebot_77)"/>
      <path d="M389.03,560.31L429.988,599.946L432.8275,609.8446L389.03,560.31z" id="imagebot_74" fill="url(#imagebot_75)"/>
      <path d="M560.81,533.79L569.425,536.966L547.087,517.769L560.81,533.79z" id="imagebot_72" fill="url(#imagebot_73)"/>
      <path d="M389.03,547.32L397.3127,563.585L411.3677,542.368L389.03,547.32z" id="imagebot_70" fill="url(#imagebot_71)"/>
      <path d="M509.38,613.34L479.228,642.559L531.984,604.157L509.38,613.34z" id="imagebot_68" fill="url(#imagebot_69)"/>
      <path d="M468.31,615.7L479.23,642.562L509.382,613.343L468.31,615.7z" id="imagebot_66" fill="url(#imagebot_67)"/>
      <path d="M557.15,567.98L509.383,613.336L531.987,604.1529L557.15,567.98z" id="imagebot_64" fill="url(#imagebot_65)"/>
      <path d="M557.15,567.98L531.986,604.153L577.711,553.032L557.15,567.98z" id="imagebot_62" fill="url(#imagebot_63)"/>
      <path d="M577.72,553.03L577.37624,553.28L577.72,553.2488L577.72,553.03004L577.72,553.03zM577.37624,553.28L557.15724,554.9988L536.87624,569.7178L557.15724,567.999L577.37624,553.28zM536.87624,569.718L536.59499,569.7492L536.59499,569.9367L536.87624,569.71795z" opacity="0.77155" id="imagebot_60" fill="url(#imagebot_61)"/>
      <path d="M557.15,554.99L577.712,553.2315L560.814,533.7905L557.15,554.99z" id="imagebot_58" fill="url(#imagebot_59)"/>
      <path d="M411.37,542.37L429.59,562.314L464.845,551.188L411.37,542.37z" id="imagebot_56" fill="url(#imagebot_57)"/>
      <path d="M397.31,563.58L429.585,562.3068L411.365,542.3628L397.31,563.58z" id="imagebot_54" fill="url(#imagebot_55)"/>
      <path d="M397.31,563.39L432.824,609.85L429.5848,575.307L397.31,563.39z" id="imagebot_52" fill="url(#imagebot_53)"/>
      <path d="M429.59,562.31L397.778,563.56L429.59,575.31L461.402,574.06L429.59,562.31zM461.402,574.06L461.87075,574.21625L461.87075,574.02875L461.402,574.05995L461.402,574.06zM397.777,563.56L397.30824,563.40375L397.30824,563.59125L397.777,563.56005z" opacity="0.77155" id="imagebot_50" fill="url(#imagebot_51)"/>
      <path d="M526.74,547.63L557.143,554.989L560.8068,533.79L526.74,547.63z" id="imagebot_48" fill="url(#imagebot_49)"/>
      <path d="M429.59,575.3L432.8292,609.843L468.3102,615.6933L429.59,575.3z" id="imagebot_46" fill="url(#imagebot_47)"/>
      <path d="M429.59,575.3L468.31,615.693L461.8653,574.026L429.59,575.3z" id="imagebot_44" fill="url(#imagebot_45)"/>
      <path d="M429.59,562.31L461.865,574.227L464.8446,551.184L429.59,562.31z" id="imagebot_42" fill="url(#imagebot_43)"/>
      <path d="M536.59,569.94L557.152,554.992L526.749,547.633L536.59,569.94z" id="imagebot_40" fill="url(#imagebot_41)"/>
      <path d="M536.59,569.74L509.384,613.338L557.151,567.982L536.59,569.74z" id="imagebot_38" fill="url(#imagebot_39)"/>
      <path d="M464.84,551.19L499.222,565.494L526.742,547.638L464.84,551.19z" id="imagebot_36" fill="url(#imagebot_37)"/>
      <path d="M499.23,578.48L468.313,615.695L509.385,613.3383L499.23,578.48z" id="imagebot_34" fill="url(#imagebot_35)"/>
      <path d="M499.23,578.48L509.385,613.339L536.591,569.742L499.23,578.48z" id="imagebot_32" fill="url(#imagebot_33)"/>
      <path d="M499.22,565.49L462.408,574.0838L499.22,578.49L536.064,569.865L499.22,565.49zM536.064,569.865L536.59525,569.9275L536.59525,569.74L536.064,569.865zM462.408,574.0838L461.87675,574.0213L461.87675,574.2088L462.408,574.0838z" opacity="0.77155" id="imagebot_30" fill="url(#imagebot_31)"/>
      <path d="M499.23,565.49L536.591,569.9412L526.7493,547.6342L499.23,565.49z" id="imagebot_28" fill="url(#imagebot_29)"/>
      <path d="M461.86,574.23L499.221,565.4913L464.839,551.1873L461.86,574.23z" id="imagebot_26" fill="url(#imagebot_27)"/>
      <path d="M461.86,574.03L468.3047,615.697L499.2217,578.482L461.86,574.03z" id="imagebot_24" fill="url(#imagebot_25)"/>
      <g opacity="0.84052" id="imagebot_7">
        <path d="M493.61,508.95L431.709,512.5018L479.225,530.0648L493.61,508.95z" id="imagebot_22" fill="url(#imagebot_23)"/>
        <path d="M547.09,517.77L493.616,508.9528L479.231,530.0678L547.09,517.77z" id="imagebot_20" fill="url(#imagebot_21)"/>
        <path d="M431.71,512.51L397.643,526.35L479.226,530.0732L431.71,512.51z" id="imagebot_18" fill="url(#imagebot_19)"/>
        <path d="M397.65,526.35L411.373,542.371L479.233,530.073L397.65,526.35z" id="imagebot_16" fill="url(#imagebot_17)"/>
        <path d="M560.81,533.79L547.087,517.769L479.227,530.067L560.81,533.79z" id="imagebot_14" fill="url(#imagebot_15)"/>
        <path d="M411.37,542.37L464.845,551.1872L479.23,530.0722L411.37,542.37z" id="imagebot_12" fill="url(#imagebot_13)"/>
        <path d="M526.74,547.63L560.81,533.79L479.23,530.07L526.74,547.63z" id="imagebot_10" fill="url(#imagebot_11)"/>
        <path d="M464.84,551.19L526.741,547.6382L479.225,530.0752L464.84,551.19z" id="imagebot_8" fill="url(#imagebot_9)"/>
      </g>
    </g>
    <title>סך הכל הרווחתי</title>
  </g>
  <path d="M 310.778 152.849 L 406.216 171.904 L 406.216 210.013 L 310.778 229.067 L 215.34 210.013 L 215.34 171.904 Z" style="fill: url(#gradient-1); fill-opacity: 0.73;" transform="matrix(0.999813, 0.019346, -0.019346, 0.999813, -163.843097, -95.620727)" bx:shape="n-gon 310.778 190.958 110.202 38.109 6 0 1@0cc060df"/>
  <text style="fill: url(#gradient-2); font-family: Arial, sans-serif; font-size: 54.1178px; font-weight: 700; line-height: 288.628px; stroke: url(#gradient-3); text-anchor: middle; white-space: pre; filter: url(#drop-shadow-filter-0);" transform="matrix(0.627037, 0.018356, -0.018632, 0.636449, 145.136673, 107.674744)"><tspan>{total}<tspan x="0" dy="1em">​</tspan> </tspan><tspan x="0" dy="1em">​</tspan><tspan>💗</tspan></text>
</svg> 
  
</div>
{#if a == 0}
<div class="anothere">
  <button 
  on:click={basic} 
  title="עריכת פרטים בסיסיים"
  class=" hover:bg-barbi text-mturk rounded-full"
  ><svg  style="width:24px;height:24px" viewBox="0 0 24 24">
 <path transition:draw="{{duration: 1000}}" fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
</svg></button>
</div>
{/if}
</div>

</div>
{:else if addP == true}
<button title="ביטול"
  on:click={() => addP = false}
  style="margin: 0 auto;"
  class=" hover:bg-barbi text-barbi hover:text-gold font-bold  p-0.5 rounded-full"
   ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
  </svg></button>
  <Addnew userName_value={meData.username}/> 
  {/if}
 <!-- המשימות שסיימתי-->         

  <style>
 
  .name { transition: all .2s ease-in-out;
    transform-origin: center;

  }
.name:hover { transform: scale(1.5) translateY(-25%) translateX(-25%); }
     .d{
       max-height: 15vh;
       overflow-y: scroll;
     }
     .d::-webkit-scrollbar {
    width: 10px;
}
 
.d::-webkit-scrollbar-track {
    background-color: #e4e4e4;
    border-radius: 100px;
}
 
.d::-webkit-scrollbar-thumb {
    background-color: #d4aa70;
    border-radius: 100px;
}
.d {
    scrollbar-color: #D4AA70 #e4e4e4;
}
.d::-webkit-scrollbar-thumb {
    background-image: linear-gradient(180deg, #D0368A 0%, #708AD4 99%);
    box-shadow: inset 2px 2px 5px 0 rgba(#fff, 0.5);
    border-radius: 100px;
}
      :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
                width: 80vw;
  }
    .whole{
      position: absolute;
      top: 0;
      left: 0;
      min-width: 99.9vw;
      min-height: 100vh;
        z-index: 700;
      background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438541/4nd_w3gv33.svg);
    background-repeat: no-repeat;
    background-size: cover;
    }
    .st0{fill:#FFFFFF;
     animation: mymove 5s infinite;
}

@keyframes mymove {
  from {fill: #FFFFFF;}
  50% {fill: var(--gold)}
  to {fill: #FFFFFF;}
}
@keyframes mymove2 {
  from {
    fill: #FFFFFF;
    filter: drop-shadow(0px 0px 8px #ffe7f8);
  }
  25% {
  fill: var(--gold);
      filter: drop-shadow(0px 0px 8px #6150f7);
  }
  50% {
    fill:var(--barbi-pink);
      filter: drop-shadow(0px 0px 8px #f773cf);

  }

  75% {fill: var(--gold);
        filter: drop-shadow(0px 0px 8px #6150f7);

  }
  to{fill: #FFFFFF;
      filter: drop-shadow(0px 0px 8px #ffe7f8);

  }
}
@keyframes mymove1 {
  from {fill: var(--gold);}
  50% {fill: #FFFFFF;}
  to{fill: var(--gold)}
}
  .st1{fill:var(--gold);
       animation: mymove1 5s infinite;
  }
  .st2{fill:var(--barbi-pink);}

  .svgh:hover{
    fill: #fff;
           animation: mymove2 2s infinite;
          filter: drop-shadow(0px 0px 8px #f561c9);
   /*   -webkit-filter: drop-shadow(  0 0 7px #fff,
      0 0 10px #fff,
      0 0 21px #fff,
      0 0 42px #0fa,
      0 0 82px #0fa,
      0 0 92px #0fa,
      0 0 102px #0fa,
      0 0 151px #0fa);
  filter: drop-shadow( 0 0 7px #fff,
      0 0 10px #fff,
      0 0 21px #fff,
      0 0 42px #0fa,
      0 0 82px #0fa,
      0 0 92px #0fa,
      0 0 102px #0fa,
      0 0 151px #0fa );*/

     
  }
    .n{
       cursor: url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg), auto;
  
    }
    
.n:hover:before {
  transform: scale(1.2);
  box-shadow: 0 0 15px #d35400;
  filter: blur(3px);
}

.n:hover {
  color: #ffa502;
  box-shadow: 0 0 15px #d35400;
  text-shadow: 0 0 15px #d35400;
}
    .cot{
    color:var(--barbi-pink);
     margin: 0 auto; 
     padding:0;  
   text-shadow: 1px 1px  #feeb02;
    }
    .pt{
      color:aqua;
       text-shadow: 1px 1px  #9900cd;
    }
    .sp{
   display: grid;
    justify-content: center;
  align-items: center; 
  }
  
  @media (max-width: 528px) {
     :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
                width: 80vw;
  }
    .cont{
      white-space: none;
      line-height: 1;
    }
    .sv{
      width:8px
      ;height:8px;
    }
    .cot{
         font-size: 10px ;
    }
    .pt{
      font-size: 8px;
    }
    .d{
       max-height: 15vh;
       overflow-y: scroll;
     }
/*    .a1 {
 max-height: 25vh;
     min-height: 25vh;

}
 .a2  {
  max-height: 25vh;
      min-height: 25vh;

}
.a3  {
  max-height: 25vh;
      min-height: 25vh;

}
.a4  {
  max-height: 25vh;
      min-height: 25vh;
}
.a5 {
  max-height: 25vh;
    min-height: 25vh;

}
.a6 {
  max-height: 25vh;
  min-height: 25vh;

}*/
    .another{
 max-height: 20vh;
  min-height: 20vh;
         max-width: 35vw;
     
  }
}
    .anothere{
      position : absolute;
      top: 59.2%;
          left: 54%;
    }
    .edit{
    z-index: 20;
     margin-right:auto; 
     margin-left:auto ; 
     position: absolute ; 
     top: 59.2%;
      left: 46%; 
       transform: translate(-50%, -50%);
    }

    .svgg{
      width: 24vw;
       height: 24vh;
    }
    .haalaa {
    position: absolute;
    transform: translate(-50%, -50%);
     top: 59.2%;
      left: 46%; 
    z-index: 16; 
    }
    .centr{
       max-height: 20.52vh;
    max-width: 19.68vh;
    min-height: 20.52vh;
    min-width: 19.68vh;
}
.middle{
    
      max-height: 19.68vh;
    max-width: 19.68vh;
    min-width: 19.68vh;
    
      }
      .imgpr{
        height: 16vh;
        width: 16vh;
            top:48.5%;

      }
             .userName{
    top: 55.5%;
       }
         .name{
             top: 24%;
              
           }
                 .ceterr{
      height: 7vh;
       width:auto;
         margin: 0 auto;
    }
           .anotheri{
  top: 64%;
  }
      @media (min-width: 420px) {
          .userName{
    top: 55.5%;
       }
      }
@media (min-width: 529px) {
     .d::-webkit-scrollbar {
    width: 12px;
}
  .cont{
      white-space: nowrap;
    }
    .sv{
      width:13px
      ;height:13px;
    }
  .cot{
         font-size:17px;
    }
  .pt{
    font-size: 13px;
  }
  .anotheri{
  top: 84%;
  }
  .haalaa {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 65.2%;
    left: 48%;
    }
  .anothere{
      top: 65.2%;
          left: 52%;
          }
  .edit{
        top: 65.2%;
      left: 48%; 
  }
    .centr{
       max-height: 36.36vh;
    max-width: 35.2vh;
    min-height: 36.36vh;
    min-width: 35.2vh;
}
.middle{
    
      max-height: 35.2vh;
    max-width: 35.2vh;
    min-width:  35.2vh;
    
      }
      .imgpr{
        height: 27.2vh;
        width: 27.2vh;
    top:47%;
      }
         .userName{
    top: 60.5%;
       }
        .name{
             top: 29%;
           }

}
@media (min-width: 892px) {
    :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
                width: 50vw;
  }
  .haalaa {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 72.2%;
    left: 48%;
    }
  .anothere{
      top: 72.2%;
          left: 52%;
          }
  .edit{
        top: 72.2%;
      left: 48%; 
  }
    .centr{
       max-height: 53.12vh;
    max-width: 51.2vh;
    min-height: 53.12vh;
    min-width: 51.2vh;
}
.middle{
    
      max-height: 51.2vh;
    max-width: 51.2vh;
    min-width:  51.2vh;
    
      }
      .imgpr{
        height: 41.6vh;
        width: 41.6vh;
        top:47%;

      }
       .userName{
    top: 65.5%;
       }
           .name{
             top: 10%;
           }
}
@media (min-height: 500px)  {
    .name{
             top: 37%;
           }
            .ceterr{
      height: 7vh;
       width:auto;
         margin: 0 auto;
    }
}
@media (min-height: 620px) and (min-width: 892px) {
    .name{
             top: 20%;
           }
}
@media (min-height: 500px) and (min-width: 520px) {
    .name{
             top: 22%;
               
           }
           .ceterr{
 height: 10vh;
       width:auto;
         margin: 0 auto;
           }
}
@media (min-height: 620px) and (min-width: 520px) {
    .name{
             top: 20%;
           }
}

     :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
                width: 80vw;
  }
  :global(data-svelte-dialog-overlay){
        z-index: 700;
                width: 50vw;

  }
#curve {
  fill: transparent;
}

.curved-text{
  fill: var(--barbi-pink) /* rgb(238 12 109)*/;
  text-anchor: center;
    font-size: var(--the, 31px);
    text-shadow: 1px 1px  rgb(63, 56, 18);
}
  .userName{
      position: absolute;
    transform: translate(-50%, -50%);
    left: 50%; 
   
    z-index: 10;
    }
  

.a1{
  position: absolute;
    transform: translate(-50%, -50%);
    top:20%;
    left: 70%;
    overflow: auto;
}
.a2{
  position: absolute;
    transform: translate(-50%, -50%);
    top:50%;
    left: 86%;
}
.a3{
  position: absolute;
    transform: translate(-50%, -50%);
    top:80%;
    left: 70%;
}
.a6{
  position: absolute;
    transform: translate(-50%, -50%);
    top:20%;
    left: 30%;
}
.a4{
  position: absolute;
    transform: translate(-50%, -50%);
    top:50%;
    left: 14%;
}
.a5{
  position: absolute;
    transform: translate(-50%, -50%);
    top:80%;
    left: 30%;
} 
  @media (min-width: 348px) {
 .a2  {
  left: 80%

}
.a4  {
  left: 20%
}
  }
.selected {
  z-index: 289;

  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  padding: 5rem 1rem 0.6rem;
  border-left: 1px solid #aaa;
  overflow-y: auto;
  overflow-x: auto;
	width: 17rem;
  display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438541/4nd_w3gv33.svg);
     background-position:right center; 
    background-repeat: no-repeat; 
    background-size: cover;
}
.selectedl {
  z-index: 289;
background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438541/4nd_w3gv33.svg);
     background-position: left center; 
    background-repeat: no-repeat; 
    background-size: cover;
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  padding: 5rem 1rem 0.6rem;
  overflow-y: scroll;
    overflow-x: auto;

	width: 17rem;
  display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
}
  
    .imgpr {
      position: absolute;
    transform: translate(-50%, -50%);
    left: 50%;
     z-index: 1;
    border-radius: 50%;
      margin-right:auto; 
      margin-left:auto; 
   

/*   max-width: 100%;
   max-height: 250px !important; */
 }
  .body{ 
    width: 100vw;
    height: 100vh;
   /*  background: url(https://res.cloudinary.com/love1/image/upload/v1640438668/amana_kocsdt.svg) !important;
      background-position: center; 
      background-size: cover !important;
      background-repeat: no-repeat !important; */
background-color: #fff000;
background-image: linear-gradient(180deg, #fff000 0%, #ed008c 74%);
    }
    .centr{
      position: absolute;
    transform: translate(-50%, -50%);
    top:50%;
    left: 50%; 
   
/*    min-height: 332px;
    min-width: 320px;*/
    background: url(https://res.cloudinary.com/love1/image/upload/v1640438986/goldenP_bz4wu5.svg);/*13ndp*/
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    z-index: 6;
    }
    .name{
    
  position: absolute;
    transform: translate(-50%, -50%);
    left: 50%; 
    z-index: 10;
  /*  background: url(ceter.png);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: contain;*/
    
    }
    
    .another{ background: -webkit-linear-gradient(top, #8f6B29, #FDE08D, #DF9F28);
	background-image: linear-gradient(top, #8f6B29, #FDE08D, #DF9F28);
      /*
     background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438850/to_ha8xmq.svg);
     background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;*/
    padding: 1em;
    border-radius: 15%;
      display:flex;
      flex-direction: column;
       align-items: center;
      justify-content: center;
      z-index: -1;
    }
      .middle{
      /*  grid-row: 1 / 3;
    grid-column: 3 /5; */
      align-self: center;
      max-height: 320px;
    max-width: 320px;
        border-radius: 50%; 
      /*    position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%); */
          text-align: center;
   display: flex;
   align-items: center;
  
    border-radius: 50%;
    
      }
  
      
 .by{
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Anonymous Pro", "Monospace";
  font-size: 30px;
 }    
#circular-text {
 /* position: relative;
  border-radius: 100%;
  padding: 20px;
 */ 
}


@-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }

#circular-text span {
 /* position: absolute;
  transform-origin: top left; */
}
.anotheri{
  position : absolute;
          left: 50%;
          transform: translate(-50%, -50%);
      display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .anothere{
      position : absolute;
          transform: translate(-50%, -50%);
                  z-index: 209;   
     background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
      display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  </style>         