<script context="module">

	export const prerender = true;
 
</script>

   
<svelte:head>
	<title>הסכמה עולמית על ביטחון ושלום</title>
  <!-- Global site tag (gtag.js) - Google Analytics -->
<!--<script async src="https://www.googletagmanager.com/gtag/js?id=UA-191152109-2">
</script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'UA-191152109-2');
</script>-->
</svelte:head>

<script>
  // import { page } from '$app/stores'
    //const emaili = $page.url.searchParams.get('code')
      import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';

      import { userName } from '../lib/stores/store.js';
  import Amana1 from "../lib/components/main/amana.svelte"
  import One from "../lib/components/main/bein.svelte"
  import { show } from '../lib/components/registration/store-show.js';
  import { regHelper } from '../lib/stores/regHelper.js';
  import { onMount } from 'svelte';
      import { email } from '../lib/components/registration/email.js'

  let idx = 1;
let error;
onMount(async () => {
  //console.log(emaili)
  if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js', { scope: '/' }).then(function(reg) {
    // registration worked
    console.log('Registration succeeded. Scope is ' + reg.scope);
  }).catch(function(error) {
    // registration failed
    console.log('Registration failed with ' + error);
  });
 }; 
        const parseJSON = (resp) => (resp.json ? resp.json() : resp);
        const checkStatus = (resp) => {
        if (resp.status >= 200 && resp.status < 300) {
          return resp;
        }
        return parseJSON(resp).then((resp) => {
          throw resp;
        });
      };
      const headers = {
        'Content-Type': 'application/json',
      };
    
        try {
            const res = await fetch("https://new-zuhk.onrender.com/chezins/count", {
              method: "GET",
              headers: {
                 'Content-Type': 'application/json'
              },
            }).then(checkStatus)
          .then(parseJSON);
 idx = res + 2
        } catch (e) {
            error = e
        }
    });
	let user;

   let kvar;
    onMount(async () => {
    if (document.cookie) {
     
const unt = document.cookie
  .split('; ')
  .find(row => row.startsWith('un='))
  if (unt != null) {
  const un = document.cookie
  .split('; ')
  .find(row => row.startsWith('un='))
  .split('=')[1];
   userName.set(un);}
const regt = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  if (regt != null) {
  const reg = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];

user = reg;}
 const cookieValuet = document.cookie
  .split('; ')
  .find(row => row.startsWith('email='))
  if (cookieValuet != null){
const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('email='))
  .split('=')[1];    kvar  = cookieValue; 
    email.set(cookieValue);
}}
    });


  let regHelperL = 0;

  
regHelper.subscribe(value => {
  regHelperL = value;
});


	function toggle() {
		regHelperL = 0;
    show.set(0);
    regHelper.set(0)
	}
</script>

<div class="main">
{#if user > 0}
{ goto("/lev", )}
{:else}
  {#if kvar}
<One {idx} />

<!--
todo: אמנה חתומה ל5 שניות ואז להעביר לעמוד הבית לקחת פרטים מהקוקיות או מלוקלסטורג'--> 
{:else}
{#if regHelperL == 1}
<One {idx}/>
	
{/if}


{#if regHelperL == 0}
<Amana1 {idx}/>
	 
{/if}
  
{/if}
{/if}
 </div>


<style>

:global(.multiselect) {
  color:#02a2ff;
  /* top-level wrapper div */
}

:global(li.selected) {
  border: var(--sms-focus-border, 1pt solid var(--sms-active-color, cornflowerblue))
  /* selected options in the dropdown list */
}
:global(li:not(.selected):hover) {
  color: #FF0092;
  /* unselected but hovered options in the dropdown list */
}

:global(li.active) {
  color:#EEE8AA;
  /* active means element was navigated to with up/down arrow keys */
  /* ready to be selected by pressing enter */
}

	:root {
  --primary-light: #a6f9d6;
  --primary: #5be2a9;
  --primary-dark: #53ce9a;
  --secondary: #1e2145;
  --white: #fff;
  --grey: #e6e6ff;
  --grey-dark: #6d7098;
  --red: #ff6b6b;
}
button:disabled {
  background-color: var(--grey);
}

button:focus:not(:disabled) {
  box-shadow: 0 0 0 4px var(--primary-light);
}

button:hover:not(:disabled) {
 
  background: radial-gradient(skyblue 20%, var(--barbi-pink))
		skyblue ;
}

*, *:after, *:before {
	box-sizing: border-box;
}
@media (min-width: 1100px) {
  
.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100%;
    height: 100vh;
		box-sizing: border-box;
      margin:0px ;
     background-image: url(https://res.cloudinary.com/love1/image/upload/v1639597594/Prismatic-Hearts-World-Map-4_ge7z9u.svg);
background-position: center; 
  background-repeat: no-repeat; 
  background-size: cover;
	} 
}

@media (max-width: 1099px) {
.main {
		flex: 1;
		display: flex;
		flex-direction: column;
	
	} 
}
@media (max-width: 720px) {
.main {
		flex: 1;
		display: flex;
 width: 100vw;	
 padding: 0;
	} 
}
</style>
