<script>
     import { clickOutside } from './outsidclick.js';
    import { scale, fly } from 'svelte/transition';
    import axios from 'axios';
    import { createEventDispatcher } from 'svelte';
     import { onMount } from 'svelte';
 const dispatch = createEventDispatcher();

	  export let shows = true;
    export let deadLine = "11.11.2022";
    export let projectName = "ONE";
    export let missionName = "do x";
    export let role = "programer";
    export let skills = [];
    export let missionDetails = "do x like y in z";
    export let src = "coin.png";
    export let projectId;
    export let linki = "/project/";
    export let oid = 0;
    export let notes = "";
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
    let link = 'https://oneloveone.onrender.com/graphql';
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
    let link = 'https://oneloveone.onrender.com/graphql';
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
  slideTo(1)
 }
  import { Swiper, SwiperSlide } from "swiper/svelte";

  // Import Swiper styles
  import "swiper/css";

  import "swiper/css/effect-flip";
  import "./style.css";

  // import required modules
  import { EffectFlip, Navigation } from "swiper";
 
</script>
<div 
use:clickOutside on:click_outside={toggleShow} 
class="hover:scale-150 duration-1000 ease-in"     in:scale="{{ duration: 3200, opacity: 0.5, start: 1.56 }}"
>
<Swiper
  on:swiper={setSwiperRef}
  effect={"flip"}
  speed={1000}
    loop={true}
  loopFillGroupWithBlank={true}
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
	class="{`normSml${oid}-${projectId}`}" id="normSml" 
><div>

        <img class="img" src={src}  alt="logo">
        <a sveltekit:prefetch  href={`${linki}${projectId}`}><h3 class="hover:text-lturk lt" >{projectName}</h3></a>
        <h1 style="color: rgb(87, 208, 248 ); " class="ltn">{missionName}</h1>
        {#if total} <p>{total}</p>{/if}
   
</div>
</SwiperSlide
  ><SwiperSlide
    ><div class="{`normSmll${oid}-${projectId}`} " id="normSmll"
>
          <h3 class="ltn" >{skills.map(d=> d.skillName).join(' ')}</h3>

   {#if deadLine} <h5 class="lt ab">{deadLine}</h5>{/if}
    <h6 class="ltn bc" style=" line-height: 0.7;">{missionDetails}</h6>
    <h5 class="lt cd">{role.map(d=> d.roleDescription).join(' ')}</h5>
{#if already === false}
    <button on:click={agree(oid)} class="btn a" name="requestToJoin" title="אני רוצה"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
   <!--<button on:click={nego(oid)} name="negotiate" class="btn" title="משא ומתן"><i class="far fa-comments"></i></button>
   -->  <button   on:click={decline(oid)} class="btn b" name="decline" title="לא מתאים לי"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
    {/if}

</SwiperSlide
  >
</Swiper>
</div>

<style>
  .ab{
        grid-column: 1/3;
        grid-row: 1/ 2;

    }
    .bc{
        grid-column: 1/3;
        grid-row: 2/ 3;

    }
      .cd{
        grid-column: 1/3;
        grid-row: 3/ 4;

    }
      .de{
        grid-column: 1/3;
        grid-row: 4/ 5;

    }
  .a{
        grid-column: 1/2;
    }
    .b{
        grid-column: 2/3;
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
        grid-row: 4/ 5;
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