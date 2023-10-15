<script>
import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Tour, TourTip } from 'svelte-tour';
  	import { Toasts } from 'as-toast';
import { browser } from '$app/environment';

import { lang } from '$lib/stores/lang.js'
  import { initializeApp } from "firebase/app";
  import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_API,
  authDomain: import.meta.env.VITE_AUTH,
  projectId: import.meta.env.VITE_projectId,
  storageBucket: import.meta.env.VITE_storageBucket,
  messagingSenderId: import.meta.env.VITE_messagingSenderId,
  appId: import.meta.env.VITE_appId,
  measurementId:import.meta.env.VITE_measurementId
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
  import { getMessaging, onMessage } from "firebase/messaging";

$: if(browser){
  const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  console.log('Message received. ', payload);
  // ...
});
}
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
function login () { 
    goto (`/login${data.from ? "?from=" + data.from : ""}`,)
}
const info ={"he": "הגעת לעמוד הדורש הרשמה","en":"This page is for registred users only" }
const registratio = { "he": "להרשמה", "en": "To Registration"} 
const logi = { "he": "להתחברות", "en":"To Login"} 
</script>


{#if isAuthed}
<main >
  <slot></slot>
  <Tour TourTip={TourTip}></Tour>
<span style:z-index="9999">
  <Toasts />
</span>
</main>
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
