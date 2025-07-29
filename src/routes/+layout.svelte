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
/* const app = firebase()
  import { getMessaging, onMessage } from "firebase/messaging";

$: if(browser){
  const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  console.log('Message received. ', payload);
  // ...
});
}*/
import "../app.postcss";
import { Toaster } from 'svelte-sonner';
import { lang, doesLang, langUs } from '$lib/stores/lang.js'
import { theme, themeConfig } from '$lib/stores/theme';
  import { onMount } from 'svelte';
import ThemeToggle from '$lib/celim/main/ThemeToggle.svelte';
  // עדכון המשנה בטעינה
  onMount(() => {
    const unsubscribe = theme.subscribe((currentTheme) => {
      // עדכון classes על ה-document
      document.documentElement.classList.remove('personal', 'business');
      document.documentElement.classList.add(currentTheme);
      
      // עדכון data attribute
      document.documentElement.setAttribute('data-theme', currentTheme);
    });

    return unsubscribe;
  });
 
  /**
   * @typedef {Object} Props
   * @property {any} data - import firebase from "$lib/func/firebase";
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { data, children } = $props();
function getLang() {
  console.log(data)
    let la;
    if(!data.lang){
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
  }else{
    la = data.lang
  }
   // if (navigator.languages != undefined)
   //     return navigator.languages[0];
   // return navigator.language;
    lang.set(la)
    document.cookie = `lang=${$lang}; expires=` + new Date(2026, 0, 1).toUTCString();
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
	{@render children?.()}
<Toaster toastOptions={{
  style: `dir: ${$lang == "en" ? "ltr" : "rtl"}; text-align: ${$lang == "en" ? "left" : "right"}; `,
}} richColors  closeButton  position="top-center" />
</main>
