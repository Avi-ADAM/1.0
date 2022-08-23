<script>
     import { clickOutside } from './outsidclick.js';
    import { scale, fly } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte'
                   import { lang } from '$lib/stores/lang.js'
import Lowbtn from '$lib/celim/lowbtn.svelte'
	import dayjs from 'dayjs';

 const dispatch = createEventDispatcher();
     export let low = false;

export let coinlapach;
    export let deadLine;
    export let projectName;
    export let missionName;
    export let role = [];
    export let skills = [];
    export let missionDetails;
    export let src = "coin.png";
    export let projectId;
    export let linki = "/project/";
    export let oid = 0;
    export let workways= [];
    export let noOfHours = 0;
    export let perhour = 0;
    export let total = 0;
    export let askedarr =[];
    export let declineddarr = [];
let already = false;
    let token;
    let uId;


function less (oid) {
    console.log("less")
    dispatch('less', {
 ani: "prsug",
                coinlapach: coinlapach    } );
}
let miData = [];

async function agree(oid) {
  already = true;
const as = askedarr;
 as.push(`${oid}`);
 console.log(as)
const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  uId = cookieValueId;
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
    let link = 'https://i18.onrender.com/graphql';
    try {
             await fetch(link, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { updateUser(
    input: {
      where: { id: "${uId}" }
      data: { askeds: [${as}] }
    }
  ){
      user {
          askeds{
              id
          }
      }
  }
  createAsk(
    input: {
      data:{ open_mission: ${oid},
            project: ${projectId},
            users_permissions_user: ${uId}
    }
    }
  ){
    ask {id}
  }
}`   
} )})
  .then(r => r.json())
  .then(data => miData = data);
         console.log(miData)
         less (oid);
        } catch (e) {
            error1 = e
        }
    }; 
    
    
  
function nego(oid) {
        console.log("nego", oid);
	}

async function decline(oid) {
  already = true;
        console.log("decline", oid);
       const ds = declineddarr;
 ds.push(`${oid}`);
 console.log(ds)
const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  uId = cookieValueId;
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
    let link = 'https://i18.onrender.com/graphql';
    try {
             await fetch(link, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { updateUser(
    input: {
      where: { id: "${uId}" }
      data: {declined: [${ds}] }
    }
  ){
      user {
          askeds{
              id
          }
      }
  }
}`   
} )})
  .then(r => r.json())
  .then(data => miData = data);
         console.log(miData)
         less (oid);
        } catch (e) {
            error1 = e
        }
        
	}
//out:fly={{duration: 2200, opacity: 0.5, y: 450}}

 let swiperRef = null;

  const setSwiperRef = ({ detail }) => {
    const [swiper] = detail;
    // set swiper instance
    setTimeout(() => {
      swiperRef = swiper;
    });
  };

  
 const slideTo = (index) => {
    if (swiperRef !== null){
    swiperRef.slideTo(index , 400);
    }
  };
 function toggleShow (){
  slideTo(0)
 }
  import { Swiper, SwiperSlide } from "swiper/svelte";

  // Import Swiper styles
  import "swiper/css";

  import "swiper/css/effect-flip";
  import "./style.css";

  // import required modules
  import { EffectFlip, Navigation } from "swiper";
let u = {"he":"הצעה להצטרפות לריקמה", "en":"suggested FreeMates to join and do mission"}
let hovered = false;
function hover (id){
  if (id == "0"){
     u = {"he":"הצעה להצטרפות לריקמה", "en":"suggested FreeMates to join and do mission"}
  } else {
    u = id
  }
    dispatch("hover", {id: u[$lang]});

}
function hoverede(){
   hovered = !hovered
    if (hovered == false){
    u = {"he":"לב המערכת","en": "heart of 1❤️1"}
  } else {
     u = {"he":"הצעה להצטרפות לריקמה", "en":"suggested FreeMates to join and do mission"}
  }
  dispatch("hover", {id: u[$lang]});
 }
 
$: pcli = 0
function linke (){
    pcli += 1;
    if(pcli >= 2){
        dispatch("proj", {id: projectId});
    }
}
function project () {

        dispatch("proj", {id: projectId});
} 
 onMount(function(){
 if ($lang == "he" ){
              for (var i = 0; i < skills.length; i++){
                if (skills[i].localizations.length > 0){
                skills[i].skillName = skills[i].localizations[0].skillName
                }
              }
              for (var i = 0; i < role.length; i++){
                if (role[i].localizations.length > 0){
                role[i].roleDescription = role[i].localizations[0].roleDescription
                }
              }
              for (var i = 0; i < workways.length; i++){
                if (workways[i].localizations.length > 0){
                workways[i].workWayName = workways[i].localizations[0].workWayName
                }
              }
            }
            role = role
            skills = skills
            workways = workways;
})
  function hoverc (event){
   if (event.detail.x == "0"){
     u = {"he":"הצעה להצטרפות לריקמה", "en":"suggested FreeMates to join and do mission"}
  } else {
    u = event.detail.x
  }
    dispatch("hover", {id: u[$lang]});
}
 import Cards from './cards/sugestmi.svelte'
export let cards = false;
function claf (event){
  let o = event.detail.alr
  let d = event.detail.y
  console.log(o,d)
  if (d == "a"){
    agree(oid)
  } else if (d == "d"){
    decline(oid)
  }
}
</script>
{#if cards == false}
<div
style="position: relative;" 
style:z-index={hovered === false ? 11 : 16}  
on:mouseenter={()=> hoverede()} 
on:mouseleave={()=> hoverede()} 
use:clickOutside on:click_outside={toggleShow} 
class="hover:scale-290 duration-1000 ease-in"     in:scale="{{ duration: 3200, opacity: 0.5, start: 1.56 }}"
>
<Swiper  dir="rtl"
  on:swiper={setSwiperRef}
  effect={"flip"}
  speed={1000}

  grabCursor={true}
  modules={[EffectFlip, Navigation]}
  flipEffect={{ slideShadows: false}}
  class="mySwiper swiperg"
  navigation={{
    nextEl: `.normSml${oid}-${projectId}`,
    prevEl: `.normSmll${oid}-${projectId}`,
  }}
>
  <SwiperSlide class="swiper-slideg"
    ><div
	 id="normSml" 
><div class="{`normSml${oid}-${projectId}`}"></div>

        <img on:click={()=>linke()} on:mouseenter={()=>hover({"he":` לחיצה כפולה לצפיה בעמוד הציבורי של ריקמת ${projectName} `, "en":`click two times to view the publick profile of ${projectName}`})} on:mouseleave={()=>hover("0")} class="img" src={src}  alt="logo">
        <button on:click={()=>linke()} on:mouseenter={()=>hover({"he":` לחיצה כפולה לצפיה בעמוד הציבורי של ריקמת ${projectName} `, "en":`click two times to view the publick profile of ${projectName}`})} on:mouseleave={()=>hover("0")}  ><h7 class="hover:text-lturk pn" >{projectName}</h7></button>
        <h1 on:mouseenter={()=>hover({"he":"המשימה המוצעת","en": "suggested mission"})} on:mouseleave={()=>hover("0")} style="color: rgb(87, 208, 248 ); " class="lt">{missionName}</h1>
        {#if total} <p class="lt">{total}</p>{/if}
   
</div>
</SwiperSlide
  ><SwiperSlide class="swiper-slideg"
    ><div   id="normSmll"
><div class="{`normSmll${oid}-${projectId}`} xyz"></div>
    <div class="ltn ab d ">  {#each skills as skill}<p style="text-shadow:none;" on:mouseenter={()=>hover({"he":"הכישורים הנדרשים","en": "needed skills"})} on:mouseleave={()=>hover("0")}  ><span class="bg-gold rounded-full pl-1 pr-1 opacity-60">{skill.skillName}</span></p>{/each}
</div> 
   {#if deadLine != undefined && deadLine != "undefined"} <h5 on:mouseenter={()=>hover({"he":"תאריך אחרון לביצוע","en": "last date to do the mission"})} on:mouseleave={()=>hover("0")} class="lt bc">{dayjs(deadLine).format("dddd, MMMM Do YYYY, H:mm:ss ")}</h5>{/if}
    <h4 on:mouseenter={()=>hover({"he":"פרטי המשימה","en":"mission details"})} on:mouseleave={()=>hover("0")} class="ltn cd d" style=" line-height: 0.9;">{missionDetails}</h4>
    <p on:mouseenter={()=>hover({"he":"תפקיד מבוקש", "en":"requested role"})} on:mouseleave={()=>hover("0")} class="ltn de d">{role.map(d=> d.roleDescription).join(' ')}</p>
{#if low == false}
    {#if already === false}
    <button on:mouseenter={()=>hover({"he":"אני רוצה","en":"yes I want"})} on:mouseleave={()=>hover("0")} on:click={agree(oid)} class="btn a" name="requestToJoin" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
   <!--<button on:click={nego(oid)} name="negotiate" class="btn" title="משא ומתן"><i class="far fa-comments"></i></button>
   -->  <button on:mouseenter={()=>hover({"he":"לא מתאים לי", "en": "not for me"})} on:mouseleave={()=>hover("0")}  on:click={decline(oid)} class="btn b" name="decline" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
    {/if}
     {:else if low == true}
          <Lowbtn/>
        {/if}
</div>
</SwiperSlide
  >
</Swiper>
</div>
{:else}
<Cards 
on:project={project} 
 on:agree={claf}
  on:decline={claf}
  on:hover={hoverc}
  {low}
  {missionName}
  {noOfHours}
  {perhour}
  {already} 
  {missionDetails}
  {skills}
  {role}
  {projectName}
   {src} 
 {workways}
   />
{/if}
<style>
  .xyz{
            grid-column: 1/4;

  }
  .pn{
     margin: 5px;
    font-size: 7px;
     line-height: 1; 
     font-weight: bold;
  }
  .ab{
        grid-column: 1/4;
        grid-row: 1/ 2;
        margin-top: 18px;
    }
    .bc{
        grid-column: 1/4;
        grid-row: 2/ 3;

    }
      .cd{
        grid-column: 1/4;
        grid-row: 3/ 4;

    }
      .de{
        grid-column: 1/4;
        grid-row: 4/ 5;

    }
  .a{
        grid-column: 1/2;
    }
    .b{
        grid-column: 3/4;
    }
  .ltb{
    margin: 0px;
     font-size: 9px; 
     font-weight: bold;
      line-height: 1;
  }
  .ltn{
    font-size: 8px;
     line-height: 1; 
     font-weight: bold;
     height: 100%;
     overflow-y: auto;
  }
  .lt{
   margin: 1px;
    font-size: 8px;
     line-height: 1; 
     font-weight: bold;
  }
  .img{
    margin-top: 0px;
     margin-bottom: 0px;
      margin-right:auto;
       margin-left: auto;
     border-radius: 50%;
     width: 22px;
     height: 22px;
  }
	#normSml{
        white-space: normal;
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
         text-shadow: 1px 1px  rgb(63, 56, 18);

         background: url(https://res.cloudinary.com/love1/image/upload/v1643838569/cleenCoin1_xpsitt.png);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;

    }
	 #normSmll{
        white-space: normal;
        text-align: center; 
        align-items: center;
        justify-content: safe center;
        color: var(--barbi-pink);
      min-height: 75px;
    min-width: 75px;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 /1;
         border-radius: 50%;
         text-shadow: 1px 1px  rgb(63, 56, 18);
                     background: url(https://res.cloudinary.com/love1/image/upload/v1643838569/cleenCoin1_xpsitt.png);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto auto auto;
    }
  /*  .normSmlHover{
        text-shadow: 1px 1px var(--gold);
        color: var(--barbi-pink);
        min-height: 115px;
    min-width: 115px;
    max-width: 325px;
    max-height: 325px;
    aspect-ratio: 1/ 1;
        border-radius: 50%;
        line-height: 0.5;
        text-align: center;
        background: url(https://res.cloudinary.com/love1/image/upload/v1643838569/cleenCoin1_xpsitt.png);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    }*/
    .btn{ 
        
        background-color: rgb(87, 208, 248);
        border-radius: 50%;
        color: var(--barbi-pink);
        text-align: center;
        opacity: 0.6;
  transition: 0.3s;
  padding: 2px;
  margin-right: 4px;
  margin-left: 4px;
        grid-row: 5/ 6;
    }
    

.btn:hover {
    opacity: 1;
    padding: 6px;
    }
    @media  (min-width: 550px) {
    
      .ltb{
    margin: 0px;
     font-size: 17px; 
      }
      .ltn{
    font-size: 10px;
      }
      .lt{
   margin: 2px;
    font-size: 13px;
      }
         .pn{
   margin: 5px;
   padding-left: 8px;
   padding-right: 8px;
    font-size: 10px;
      }
      
      
    .img{
     width: 32px;
     height: 32px;
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
    }
</style>
