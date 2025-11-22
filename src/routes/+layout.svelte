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
import { locale } from '$lib/translations';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import ThemeToggle from '$lib/celim/main/ThemeToggle.svelte';
import { Bot } from '$lib/components/bot';
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

  // Ensure locale and lang are synchronized
  $effect(() => {
    if (data?.lang) {
      console.log('Setting locale and lang from data.lang:', data.lang);
      // Sync both stores
      lang.set(data.lang);
      locale.set(data.lang);
      langUs.set(data.lang);
      doesLang.set(true);
    } else if (data && browser) {
      console.log('No data.lang, calling getLang()');
      getLang();
    }
  }) 

function getLang() {
  console.log('getLang called with data:', data)
    let la;
    if(!data?.lang){
    const fromSe = data?.userAgent
    if ($doesLang == false) {
       
   if (fromSe?.includes("he")){
        la = "he"
  } else if (fromSe?.includes("ar")){
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
    
    // Sync all language stores
    lang.set(la);
    locale.set(la);
    langUs.set(la);
    doesLang.set(true);
    document.cookie = `lang=${la}; expires=` + new Date(2026, 0, 1).toUTCString();
}

onMount(() => {
  if (data) {
    // getLang() is now called in the effect above, so we just handle navigation
    let x;
    let user;
    if ($lang != "he" && $lang != "ar" && x == null && user == 0) {
      console.log('after', $lang);
      goto("/en");
    } else if ($lang == "ar" && x == null && user == 0) {
      console.log('Registration', $lang);
      goto("/ar");
    }
  }
});
</script>


<main>
	{@render children?.()}
<Toaster toastOptions={{
  style: `dir: ${$locale == "en" ? "ltr" : "rtl"}; text-align: ${$locale == "en" ? "left" : "right"}; `,
}} richColors  closeButton  position="top-center" />
<Bot {data} />
</main>
