<script>
     import { clickOutside } from './outsidclick.js';
    import { scale, fly } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';

 const dispatch = createEventDispatcher();

    export let deadLine;
    export let projectName;
    export let missionName;
    export let role;
    export let skills = [];
    export let missionDetails;
    export let src = "coin.png";
    export let projectId;
    export let linki = "/project/";
    export let oid = 0;
    export let workways= "";
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
    id: oid
    } );
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
    let link = 'https://onelovevone.onrender.com/graphql';
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
    let link = 'https://onelovevone.onrender.com/graphql';
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
    swiperRef.slideTo(index , 400);
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
let u = "הצעה להצטרפות לריקמה"
let hovered = false;
function hover (id){
  if (id == "0"){
u = "הצעה להצטרפות לריקמה"
  } else {
    u = id
  }
    dispatch("hover", {id: u});

}
function hoverede(){
   hovered = !hovered
    if (hovered == false){
    u = "לב המערכת"
  } else {
u = "הצעה להצטרפות לריקמה"
  }
  dispatch("hover", {id: u});
 }
 
$: pcli = 0
function linke (){
    pcli += 1;
    if(pcli >= 2){
        dispatch("proj", {id: projectId});
    }
}
  
</script>
<div
style="position: relative;" 
style:z-index={hovered === false ? 1 : 6} 
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
  class="mySwiper"
  navigation={{
    nextEl: `.normSml${oid}-${projectId}`,
    prevEl: `.normSmll${oid}-${projectId}`,
  }}
>
  <SwiperSlide
    ><div
	 id="normSml" 
><div class="{`normSml${oid}-${projectId}`}"></div>

        <img on:click={()=>linke()} on:mouseenter={()=>hover(` לחיצה כפולה לצפיה בעמוד הציבורי של ריקמת ${projectName} `)} on:mouseleave={()=>hover("0")} class="img" src={src}  alt="logo">
        <button on:click={()=>linke()} on:mouseenter={()=>hover("לחיצה כפולה לצפיה בעמוד הציבורי של הריקמה")} on:mouseleave={()=>hover("0")}  ><h3 class="hover:text-lturk lt" >{projectName}</h3></button>
        <h1 on:mouseenter={()=>hover("שם המשימה המוצעת")} on:mouseleave={()=>hover("0")} style="color: rgb(87, 208, 248 ); " class="ltn">{missionName}</h1>
        {#if total} <p>{total}</p>{/if}
   
</div>
</SwiperSlide
  ><SwiperSlide
    ><div   id="normSmll"
><div class="{`normSmll${oid}-${projectId}`} xyz"></div>
          <h3 on:mouseenter={()=>hover("הכישורים הנדרשים")} on:mouseleave={()=>hover("0")} class="ltn ab" >{skills.map(d=> d.skillName).join(' ')}</h3>

   {#if deadLine} <h5 on:mouseenter={()=>hover("תאריך אחרון לביצוע")} on:mouseleave={()=>hover("0")} class="lt bc">{deadLine}</h5>{/if}
    <p on:mouseenter={()=>hover("פרטי המשימה")} on:mouseleave={()=>hover("0")} class="ltn cd" style=" line-height: 0.7;">{missionDetails}</p>
    <p on:mouseenter={()=>hover("תפקיד מבוקש")} on:mouseleave={()=>hover("0")} class="lt de">{role.map(d=> d.roleDescription).join(' ')}</p>
{#if already === false}
    <button on:mouseenter={()=>hover("אני רוצה")} on:mouseleave={()=>hover("0")} on:click={agree(oid)} class="btn a" name="requestToJoin" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
   <!--<button on:click={nego(oid)} name="negotiate" class="btn" title="משא ומתן"><i class="far fa-comments"></i></button>
   -->  <button on:mouseenter={()=>hover("לא מתאים לי")} on:mouseleave={()=>hover("0")}  on:click={decline(oid)} class="btn b" name="decline" ><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
    {/if}
</div>
</SwiperSlide
  >
</Swiper>
</div>
<style>
  .xyz{
            grid-column: 1/4;

  }
  .ab{
        grid-column: 1/4;
        grid-row: 1/ 2;

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
     margin: 2px;
    font-size: 8px;
     line-height: 1; 
     font-weight: bold;
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
         margin: 7px;
    font-size: 13px;
      }
      .lt{
   margin: 2px;
    font-size: 13px;
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