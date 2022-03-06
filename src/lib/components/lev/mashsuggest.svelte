<script>
    import {  fly } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
     import { onMount } from 'svelte';
         import { clickOutside } from './outsidclick.js';

 const dispatch = createEventDispatcher();

	  export let shows = true;
    export let kindOf;
    export let projectName;
    export let mashName;
    export let descrip;
    export let src;
    export let projectId;
    export let linki = "/project/";
    export let oid = 0;
    export let spnot = "";
    export let easy = 0;
    export let price = 0;
    export let myp = 0;
    export let total = 0;
    export let askedarr =[];
    export let declineddarr = [];
    export let id;
    export let i;
let already = false;
    let token;
    let uId;

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
function less () {
    dispatch('less', {
    id: i
    } );
}
let miData = [];
  function project (id) {
    idPr.set(id);
    goto("/moach", );
  };
async function agree() {
  already = true;
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
    let link = 'https://strapi-k4vr.onrender.com/graphql';
    try {
             await fetch(link, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { 
  createAskm(
    input: {
      data:{ open_mashaabim: ${oid},
            project: ${projectId},
            sp: ${id}
            users_permissions_user: ${uId}
    }
    }
  ){
    askm {id}
  }
}`   
} )})
  .then(r => r.json())
  .then(data => miData = data);
         console.log(miData)
         less ();
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
    let link = 'https://strapi-k4vr.onrender.com/graphql';
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
class="hover:scale-150 duration-1000 ease-in" transition:fly={{y:450, duration: 2200, opacity: 0.5}}>
<Swiper
  on:swiper={setSwiperRef}
  effect={"flip"}
    loop={true}
  loopFillGroupWithBlank={true}
  grabCursor={true}
  modules={[EffectFlip, Navigation]}
  flipEffect={{ slideShadows: false}}
  class="mySwiper"
  navigation={{
    nextEl: `.normSml${oid}`,
    prevEl: `.normSmll${oid}`,
  }}
>
  <SwiperSlide
    ><div
	class="{`normSml${oid}`}" id="normSml" 
><div>
        <img class="img" src={src}  alt="logo">
        <button on:click={project(projectId)} class="hover:scale-150 lt" >{projectName}</button>
        <h1 style="color: var(--barbi-pink); " class="ltn">{mashName}</h1>
        <h3 class="ltn" title="שווי">{price}</h3>
        <h3 class="ltn" ><span style="color: var(--gold)" title="ההצעה שלי">{easy}</span> /<span  title="ההצעה של הריקמה"> {myp}</span> </h3>
        {#if total} <p>{total}</p>{/if}
   </div>
</div> </SwiperSlide
  ><SwiperSlide
    ><div class="{`normSmll${oid}`}" id="normSmll"
>
	
    {#if descrip !== null }<h6 class="ab">{descrip}</h6>{/if}
    <h5 class="bc">{spnot}</h5>

{#if already === false}
    <button on:click={agree(oid)} class="btn a" name="requestToJoin" title="אני רוצה"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5C2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" /></svg></button>
<!--<button on:click={nego(oid)} name="negotiate" class="btn" title="משא ומתן"><i class="far fa-comments"></i></button>
   --> <button   on:click={decline(oid)} class="btn b" name="decline" title="לא מתאים לי"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg></button>
    {/if}
</div>
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
  .a{
        margin-right: 30px;
        grid-column: 1/2;
    }
    .b{
        margin-left: 30px;
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

         background: url(https://res.cloudinary.com/love1/image/upload/v1646313201/turkiz_v5a7c8.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto auto auto;
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
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1 /1;
         background-color: rgb(100, 224, 137);
         border-radius: 50%;
         text-shadow: 1px 1px  rgb(63, 56, 18);

         background: url(https://res.cloudinary.com/love1/image/upload/v1646313201/turkiz_v5a7c8.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;

    }
	
    .normSmlHover{
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
        background: url(https://res.cloudinary.com/love1/image/upload/v1646313201/turkiz_v5a7c8.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    }
    .btn{ 
        grid-row: 3/ 4;
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
        margin-right: 30px;
    }
    .b{
        margin-left: 30px;
    }
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