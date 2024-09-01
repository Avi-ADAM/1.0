<script>

import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Tour, TourTip } from 'svelte-tour';
    import { Toaster } from 'svelte-sonner';

import { lang } from '$lib/stores/lang.js'
 // import { getAnalytics } from "firebase/analytics";
  import { initialForum, forum } from '$lib/stores/pendMisMes.js';
  import Foot from '$lib/components/footer/foot.svelte';
 import { initialWebS } from '$lib/stores/pendMisMes.js';
import { showFoot } from '$lib/stores/showFoot.js';
  import { initialWebSP } from '$lib/stores/pgishot.js';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional



// Initialize Firebase
/*const app = firebase()
  import { getMessaging, onMessage } from "firebase/messaging";
  import firebase from '$lib/func/firebase.js';

$: if(browser){
  const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  console.log('Message received. ', payload);
  // ...
});
}*/
export let data
let isAuthed = false;
let token;
onMount(async () => {

    const cookieRe = document.cookie
  .split('; ')
  .find(row => row.startsWith('when='))
  if (cookieRe != null) {
  const cookieR = document.cookie
  .split('; ')
  .find(row => row.startsWith('when='))
  .split('=')[1];
  const today = Date.now()
  if(new Date(cookieR +2592000000) < today ){
    goto("login")
  }
  }
    if (data.tok){
    isAuthed = true
    initialForum(true,[],data.uid)
    console.log(data.uid,$forum)
    initialWebS(data.tok,data.uid)
    initialWebSP(data.tok,data.uid)

}else{
   const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
         if (cookieValue != null) {
  const cookieT = document.cookie
  .split('; ')
  .find(row => row.startsWith('when='))
  .split('=')[1];
          if(cookieT != null){
                isAuthed = true
          }
         }
}
});
function reg (){
  if ($lang == "he"){
    goto("/",)
  } else if ($lang == "en"){
    goto("/en",)
  } else if ($lang == "ar"){
    goto("/ar",)
  } else {
    goto("/",)
  }
}
$: console.log($forum)
function login () { 
    goto (`/login${data.from ? "?from=" + data.from : ""}`,)
}


const info ={"he": "הגעת לעמוד הדורש הרשמה","en":"This page is for registred users only" }
const registratio = { "he": "להרשמה", "en": "To Registration"} 
const logi = { "he": "להתחברות", "en":"To Login"} 

</script>


{#if isAuthed}
{#if $showFoot}
<main class="h-screen min-w-screen absolute top-0 left-0">
  <Foot un={data.un} idL={data.uid}/>
  <Tour TourTip={TourTip}></Tour>
  <Toaster toastOptions={{
		style: `dir: ${$lang == "en" ? "ltr" : "rtl"}; text-align: ${$lang == "en" ? "left" : "right"}; `,
  }} richColors  closeButton position="top-center" />
      </main>
 {/if}
  <slot></slot>

  {:else}
<div class="a  bg-gradient-to-br from-gra to-grb">
    <div class="b border border-barbi button-bronze">
<h1 class=" font-bold text-2xl p-2">{info[$lang]}</h1>
<div class="flex flex-row flex-auto justify-between">
<button class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4" on:click={reg}>{registratio[$lang]}</button>
<button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4 " on:click={login}>{logi[$lang]}</button>
</div></div></div>
{/if}
<style>
   .ww2{
      top: calc(100% - 105px);
      right: calc(100% - 55px);
            width: 50px;
      height: 50px;
   }
    .ww3{
      top: calc(100% - 35px);
      right: calc(100% - 35px);
            width: 25px;
      height: 25px;
        box-shadow: 0 5px 15px 0px rgba(0,0,0,0.6);

   }
    .ww1{
      top: calc(100% - 55px);
      right: calc(100% - 105px);
            width: 50px;
      height: 50px;
    }
 .ww{

      border-radius: 50%;
      	background: rgb(26, 188, 156);
	background: -moz-linear-gradient(-45deg, rgba(26, 188, 156, 1) 0%, rgba(142, 68, 173, 1) 100%);
	background: -webkit-linear-gradient(-45deg, rgba(26, 188, 156, 1) 0%, rgba(142, 68, 173, 1) 100%);
	background: linear-gradient(135deg, rgba(26, 188, 156, 1) 0%, rgba(142, 68, 173, 1) 100%);

      box-shadow: 0 10px 30px 0px rgba(0,0,0,0.6);
	transform: translatey(0px);
	animation: float 6s ease-in-out infinite;
    }
    @keyframes float {
	0% {
		box-shadow: 0 5px 15px 0px rgba(0,0,0,0.6);
		transform: translatey(0px);
	}
	50% {
		box-shadow: 0 25px 15px 0px rgba(0,0,0,0.2);
		transform: translatey(-20px);
	}
	100% {
		box-shadow: 0 5px 15px 0px rgba(0,0,0,0.6);
		transform: translatey(0px);
	}
}
    .b{
        display: grid;
        align-items: center;
        justify-content: center;
    }
    .a{
      
        height: 100vh;
        width: 100vw;
         display: grid;
        align-items: center;
        justify-content: center;
    }
</style>
