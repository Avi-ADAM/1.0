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
  
import "../app.postcss";
	import { Toasts } from 'as-toast';
  import { lang, doesLang, langUs } from '$lib/stores/lang.js'
  import { onMount } from 'svelte';
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
}

onMount(async () => {
   getLang()
})
</script>


<main>
	<slot />
 <span style:z-index="99999">
<Toasts />
 </span>
</main>
