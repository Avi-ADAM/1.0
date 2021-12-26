
<script> 
  import { onMount } from 'svelte';
  import axios from 'axios'
	import { draw } from 'svelte/transition';
// import Addnew from '../../lib/components/addnew/baci.svelte';
import Addnewp from '../../lib/components/userPr/uploadPic.svelte';
import Updatpic from '../../lib/components/userPr/updatePic.svelte';
import { uPic } from  '../../lib/stores/uPic.js';
import Edit from '../../lib/components/userPr/edit.svelte';
//import Profile from '../../lib/components/userPr/new.svelte';
//import { addS } from '../../lib/stores/addS.js';
//import { idPr } from '../../lib/stores/idPr.js';
    import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
   let current = "";

    let url1 = "https://strapi-k4vr.onrender.com/upload";
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
 
let addNs1 = true;  
let addsL = false;
  let error1 = null;
  let addpic = 0;
  let name;
    let totalErning = "2000";
  let addP = 0;

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
    let link ="https://strapi-k4vr.onrender.com/users/" + idLi ;
    let fd = new FormData();
        fd.append('files', files[0]);
      axios
     .post( url1, fd  ,{
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
        console.log('הצליח', response.data);
        meData = response.data;
        uPic.set(meData.profilePic.formats.thumbnail.url);
            picLink = "https://strapi-k4vr.onrender.com" + $uPic;
            uPic.set(meData.profilePic.formats.small.url);
            picLink = "https://strapi-k4vr.onrender.com" + $uPic;
    updX = 0;
  //  updpic.set(0);
                  })
      .catch(error => {
        console.log('צריך לתקן:', error.response);
                });
      console.log("hh")
      
    })};
    

//function project (id) {
//    idPr.set(id);
//    goto("/projectPrivat", );
//  };

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
    let link ="https://strapi-k4vr.onrender.com/users/" + idL ;
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
            console.log(res);
            myP = meData.projects_1s;
            skil = meData.skills;
            taf = meData.tafkidims;
            val = meData.vallues;
            mash = meData.mashaabims;
            work = meData.work_ways;
        //    roundText (meData.username);
           /// pics = meData.profilePic.formats.small.url;
            uPic.set(meData.profilePic.formats.thumbnail.url);
            picLink = "https://strapi-k4vr.onrender.com" + $uPic;
            console.log(picLink);
            uPic.set(meData.profilePic.formats.small.url);
            picLink = "https://strapi-k4vr.onrender.com" + $uPic;
            total = meData.hervachti;
        } catch (e) {
            error1 = e
        }
    });
  
 /// picLink = "http://localhost:5000" + $uPic;
 async function refresh (p, valc) {
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
    let link =`https://strapi-k4vr.onrender.com/${p}?_limit=-1`;
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
              odata = res;
              allvn = odata.map(c => c[valc]);
              console.log(res);
          } catch (e) {
              error1 = e
              console.log(error1);
          }
      };
 
 
	function callbackFunction(event) {
    files = event.detail.files;
    sendP ();
	}


 function remove (event) {
  const miDatanew = event.detail.data;
  const linkp = event.detail.linkp;
  addNs1 = false;
  meData[linkp] = miDatanew;
  skil = meData.skills;
            taf = meData.tafkidims;
            val = meData.vallues;
            mash = meData.mashaabims;
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
            mash = meData.mashaabims;
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
            mash = meData.mashaabims;
            work = meData.work_ways;
  addNs1 = true;
};



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
  current = "l";
  addSl1 = false;
addSl2 = false;
addSl3 = false;
addSl4 = false;
 addSl5 = false;  
}

</script>
<!--
{#if addP == 0}href="/oneHomeGr"-->
<div class="body">
  <div class="name">
  <a href="/" ><img
    title=" לדף הבית, בקרוב ללוח הפעולות"
    style="height: 180px; margin: 0 auto;"
    class="hover:scale-200 hover:transform translate-y-20"
    src='https://res.cloudinary.com/love1/image/upload/v1640439191/crown-7_ug9koc.svg'
    alt="link"></a></div>

  <div id="circular-text"  class="userName" >
    <svg width="500" height="100" viewBox="0 0 500 100">
    <path id="curve" d="M73.2,148.6c4-6.1,65.5-96.8,178.6-95.6c111.3,1.2,170.8,90.3,175.1,97" />
    <text width="500" id="text" >
      <textPath   text-anchor="center" class="curved-text" xlink:href="#curve" startOffset="150">
{meData.username}      </textPath>
    </text>
  </svg>
    </div>
  
  <div class="flexi">
     
  {#if addNs1 == true} 
  {#key addSl}
  <div class:selected="{current === 'a1'}" class:a1="{current !== 'a1'}"><Edit   on:addnew={addnew} on:close={close} on:remove={remove} on:open={open}   on:add={add} addSl={addSl1} meData={odata} allvn={allvn}  Valname={"כישורים"} valc={"skillName"} data={skil} datan={"skil"} linkp={"skills"} placeholder ={" בחירת כישורים"}/>  </div>
  <div class:selected="{current === 'a2'}" class:a2="{current !== 'a2'}"><Edit   on:addnew={addnew} on:close={close} on:remove={remove} on:open={open}  on:add={add} addSl={addSl2} meData={odata} allvn={allvn}  Valname={"תפקידים"} valc={"roleDescription"} data={taf} datan={"taf"} linkp={"tafkidims"} placeholder ={" בחירת תפקידים"}/>  </div>
  <div class:selected="{current === 'a3'}" class:a3="{current !== 'a3'}"><Edit   on:addnew={addnew} on:close={close} on:remove={remove} on:open={open}  on:add={add} addSl={addSl3} meData={odata} allvn={allvn}  Valname={"משאבים"} valc={"name"} data={mash} datan={"mash"} linkp={"mashaabims"} placeholder ={" בחירת משאבים"}/> </div>
  <div class:selectedl="{current === 'a4'}" class:a4="{current !== 'a4'}"><Edit  on:addnew={addnew}  on:close={close} on:remove={remove} on:open={open}   on:add={add} addSl={addSl4} meData={odata} allvn={allvn}  Valname={"ערכים"} valc={"valueName"} data={val} datan={"val"} linkp={"vallues"} placeholder ={" בחירת ערכים"}/>  </div>
  <div class:selectedl="{current === 'a5'}" class:a5="{current !== 'a5'}"><Edit  on:addnew={addnew}  on:close={close} on:remove={remove} on:open={open}    on:add={add} addSl={addSl5} meData={odata} allvn={allvn}  Valname={"דרכי יצירה"} valc={"workWayName"} data={work} datan={"work"} linkp={"workWays"} placeholder ={" בחירת דרכים"}/> </div>
  {/key}
   {/if}
    <!-- או גלילה לעשות רינדור עד מקסימום מסויים  של תפקידים כישורים וכו'ואז ההמשך בהרחבה של זה-->


  {#if $uPic}
    <div class="centr"></div>

  <div class="middle"></div>
  <!-- <Profile src={picLink}/>--> 
  <div
  class="imgpr"
    style="border-radius: 50%;  margin-right:auto; margin-left:auto; height: 260px; width: 260px;"  >
    <img
    class="imgpr"
    style="border-radius: 50%; z-index: 1; margin-right:auto; margin-left:auto; height: 260px; width: 260px;"  
    src={picLink}
    alt="profilePic">
    </div>
   {#if updX == 0}
   <button
     on:click={() => updX = 1 }
     class=" hover:bg-barbi text-mturk rounded"
     style="z-index: 20; margin-right:auto; margin-left:auto ; position: absolute ; top: 72.2%; left: 48%;  transform: translate(-50%, -50%); "
     title="עריכת תמונת פרופיל"
     >  <svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path transition:draw="{{duration: 1000}}" fill="currentColor" d="M22.7 14.3L21.7 15.3L19.7 13.3L20.7 12.3C20.8 12.2 20.9 12.1 21.1 12.1C21.2 12.1 21.4 12.2 21.5 12.3L22.8 13.6C22.9 13.8 22.9 14.1 22.7 14.3M13 19.9V22H15.1L21.2 15.9L19.2 13.9L13 19.9M11.21 15.83L9.25 13.47L6.5 17H13.12L15.66 14.55L13.96 12.29L11.21 15.83M11 19.9V19.05L11.05 19H5V5H19V11.31L21 9.38V5C21 3.9 20.11 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H11V19.9Z" />
</svg>
          </button>
  {:else if updX == 1}<button class="bg-pink-200 hover:bg-barbi text-mturk rounded"
             on:click={ () => updX = 0 }>ביטול</button> 
              <Updatpic on:message={callbackFunction}/>
            
  {/if}
  {:else}
      <div class="centr"></div>

    <div class="middleu"> 
  {#if addpic == 0}    
    <button
      on:click={() => addpic = 1}
      style="  position: absolute;
    transform: translate(-50%, -50%);
    top:50%;
    left: 50%;      z-index: 16;
"
      class="bg-pink-200 hover:bg-barbi text-mturk rounded"
     title=" העלאת תמונת פרופיל" > <svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path transition:draw="{{duration: 1000}}" fill="currentColor" d="M7 19L12 14L13.88 15.88C13.33 16.79 13 17.86 13 19H7M10 10.5C10 9.67 9.33 9 8.5 9S7 9.67 7 10.5 7.67 12 8.5 12 10 11.33 10 10.5M13.09 20H6V4H13V9H18V13.09C18.33 13.04 18.66 13 19 13C19.34 13 19.67 13.04 20 13.09V8L14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H13.81C13.46 21.39 13.21 20.72 13.09 20M18 15V18H15V20H18V23H20V20H23V18H20V15H18Z" />
</svg>
    </button>
  {:else if addpic == 1}  <button class="bg-pink-200 hover:bg-barbi text-mturk rounded"
          on:click={() => addpic = 0}>ביטול</button>
          <Addnewp/>
         
{/if}
    </div>
{/if}
        
         <div class="a6"  >
          
<div class="another" dir="rtl">
  
    <h6 style="font-size:17px; color:var(--barbi-pink); margin: 0 auto; padding:0;     text-shadow: 1px 1px  rgb(63, 56, 18);
">הפרויקטים שלי</h6>
<h1>בקרוב...</h1>
     <!--
   <div >
           {#each myP as data, i}
           <div style="white-space: nowrap;" >  
            <a style="color:aqua; text-shadow: 1px 1px  var(--barbi-pink); font-size:13px; " class="hover:text-gold" sveltekit:prefetch href={`http://localhost:3000/project/${data.id}`} >{data.projectName}</a>
          <button
          class=" hover:bg-barbi text-mturk rounded"
          title="עריכה"
          on:click={project(data.id)}
          ><svg style="width:13px;height:13px" viewBox="0 0 24 24">
           <path transition:draw="{{duration: 1000}}" fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
          </svg>
          </button>
           </div>
  {/each}
</div>
<div style="width:42px; height:42px; ">
<button        
    on:click={() => addP = 1} 
    title="יצירת פרויקט חדש">
 <lord-icon
        src="https://cdn.lordicon.com/mecwbjnp.json"
      trigger="loop-on-hover"
                   colors="primary:#ee66aa,secondary:#66eece"
               style="width:42px;height:42px;">
                  </lord-icon> 
              </button></div>  -->
</div> 
     
    
</div> 
<div class="anotheri">
    <h1 style="font-size:23px; color:aqua">$ {total} סך הכל הרווחתי </h1>
</div>
<div class="anothere">
  <button 
  on:click={()=> alert('soon')} 
  title="עריכת פרטים בסיסיים"
  class=" hover:bg-barbi text-mturk rounded"
  ><svg  style="width:24px;height:24px" viewBox="0 0 24 24">
 <path transition:draw="{{duration: 1000}}" fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
</svg></button>
</div>

</div>
</div>

  <!--
{:else if addP == 1}
<button 
on:click={() => addP = 0} 
class="bg-pink-200 hover:bg-barbi text-mturk rounded"
>ביטול</button> 
  <Addnew userName_value={meData.username}/> 
  {/if}-->
 <!-- המשימות שסיימתי-->         

  <style>
#curve {
  fill: transparent;
}

.curved-text{
  fill: var(--barbi-pink) /* rgb(238 12 109)*/;
  text-anchor: center;
    font-size: 31px;
    text-shadow: 1px 1px  rgb(63, 56, 18);
}
  .userName{
      position: absolute;
    transform: translate(-50%, -50%);
    top: 65.5%;
    left: 50%; 
   
    z-index: 289;
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
    left: 80%;
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
    left: 20%;
}
.a5{
  position: absolute;
    transform: translate(-50%, -50%);
    top:80%;
    left: 30%;
} 
.selected {
  z-index: 289;

  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  padding: 2rem 1rem 0.6rem;
  border-left: 1px solid #aaa;
  overflow-y: auto;
  overflow-x: auto;
	width: 13rem;
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
  padding: 2rem 1rem 0.6rem;
  overflow-y: scroll;
    overflow-x: auto;

	width: 13rem;
  display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
}
  
    .imgpr {
      position: absolute;
    transform: translate(-50%, -50%);
    top:47%;
    left: 50%;
     z-index: 1;

/*   max-width: 100%;
   max-height: 250px !important; */
 }
  .body{ 
    width: 100vw;
    height: 100vh;
      background: url(https://res.cloudinary.com/love1/image/upload/v1640438668/amana_kocsdt.svg) !important;
      background-position: center; 
      background-size: cover !important;
      background-repeat: no-repeat !important; 

    }
    .centr{
      position: absolute;
    transform: translate(-50%, -50%);
    top:50%;
    left: 50%; 
    max-height: 332px;
    max-width: 320px;
       /* border-radius: 50%;*/ 
    min-height: 332px;
    min-width: 320px;
    background: url(https://res.cloudinary.com/love1/image/upload/v1640438986/goldenP_bz4wu5.svg);/*13ndp*/
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
  /*  z-index: 6;*/
    }
    .name{
    
  position: absolute;
    transform: translate(-50%, -50%);
    top: 8%;
    left: 50%; 
    z-index: 10;
  /*  background: url(ceter.png);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: contain;*/
    
    }
    
    .another{
     background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438850/to_ha8xmq.svg);
     background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    padding: 1em;
    border-radius: 15%;
      display:flex;
      flex-direction: column;
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
    min-height: 320px;
    min-width: 320px;
    border-radius: 50%;
    
      }
      .middleu{
        position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
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

#circular-text span {
 /* position: absolute;
  transform-origin: top left; */
}
.anotheri{
  position : absolute;
      top: 90%;
          left: 50%;
          transform: translate(-50%, -50%);
      text-shadow: 1px 1px  rgb(63, 56, 18);
padding: 0.2em;
     background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438792/goldbg_aw7tx0.svg);
     background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
      display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .anothere{
      position : absolute;
      top: 72.2%;
          left: 52%;
          transform: translate(-50%, -50%);
                  z-index: 20;   
     background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
      display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  </style>         