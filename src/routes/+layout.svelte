<!--<script context="module">
  throw new Error("@migration task: Check code was safely removed (https://github.com/sveltejs/kit/discussions/5774#discussioncomment-3292722)");

  // import { locale, loadTranslations } from '$lib/translations';

  // export const load = async ({ url }) => {
  //   const { pathname } = url;

  //   const defaultLocale = 'he'; // get from cookie, user session, ...
  //   
  //   const initLocale = locale.get() || defaultLocale; // set default if no locale already set

  //   await loadTranslations(initLocale, pathname); // keep this just before the `return`

  //   return {};
  // }
</script>-->

<script>
  import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAq9ZNUsrrUw-mHmi8jCjkmcDdR6PpLpLc",
  authDomain: "lev1-9ad4a.firebaseapp.com",
  projectId: "lev1-9ad4a",
  storageBucket: "lev1-9ad4a.appspot.com",
  messagingSenderId: "30082803372",
  appId: "1:30082803372:web:685ddb1486f76123b2a109",
  measurementId: "G-G3F3SSVCKL"
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
import "../app.postcss";
	import { Toasts } from 'as-toast';
  import { lang, doesLang, langUs } from '$lib/stores/lang.js'
  import { onMount } from 'svelte';
  import { browser } from "$app/environment";
export let data
function getLang() {
  console.log(data)
    let la;
    const fromSe = data.userAgent
    if ($doesLang == false) {
       
   if (fromSe.includes("he")){
        la = "he"
  } else if (fromSe.includes("ar")){
        la = "ar"
   } else{
      la = "en"
    }
   }
    
    else {
        la = $langUs
    }
   // if (navigator.languages != undefined)
   //     return navigator.languages[0];
   // return navigator.language;
    lang.set(la)
    document.cookie = `lang=${$lang}; expires=` + new Date(2024, 0, 1).toUTCString();
}

onMount(async () => {
   getLang()
   let x;
   let user;
   if($lang != "he" && $lang != "ar" && x == null && user == 0){
        console.log('after', $lang)
    goto("/en")
  } else if($lang == "ar" && x == null && user == 0){
      console.log('Registration', $lang)

    goto("/ar")
  }
  
})
</script>


<main>
	<slot />
 <span style:z-index="99999">
<Toasts />
 </span>
</main>
