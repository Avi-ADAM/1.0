<script>
  import RichText from "$lib/celim/ui/richText.svelte";
import Nego from "$lib/components/prPr/negoPend.svelte";
  import { sanitizeUserInput } from "$lib/func/uti/sanitizeUserInput.svelte";
  import { lang } from "$lib/stores/lang.js";
  import { onMount } from "svelte";
  import { MultiSelect } from "svelte-multiselect";
  let { data } = $props();
    let tex

  let c = []
  let y = []
 
  onMount(()=>{
    y = c
    lang.set(data.lang)
  })
  async function oncli (){
    // This is a test function to send a request to the /api/nuti endpoint.
    // You can modify the 'data' object below with your test data.
    let data = {"pn":"1❤️1","pl":"https://res.cloudinary.com/onelove1/image/upload/v1642086751/image_b517641fdc.jpg","pu":[{"id":"144","attributes":{"email":"itaylevy7@gmail.com","noMail":null,"lang":null,"username":"לוי איתי","profilePic":{"data":{"attributes":{"url":"https://res.cloudinary.com/onelove1/image/upload/v1699992601/image_b76270977b.jpg","formats":{"large":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1699992602/large_image_b76270977b.jpg","hash":"large_image_b76270977b","mime":"image/jpeg","name":"large_image.jpg","path":null,"size":162.08,"width":1000,"height":1000,"provider_metadata":{"public_id":"large_image_b76270977b","resource_type":"image"}},"small":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1699992602/small_image_b76270977b.jpg","hash":"small_image_b76270977b","mime":"image/jpeg","name":"small_image.jpg","path":null,"size":55.35,"width":500,"height":500,"provider_metadata":{"public_id":"small_image_b76270977b","resource_type":"image"}},"medium":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1699992602/medium_image_b76270977b.jpg","hash":"medium_image_b76270977b","mime":"image/jpeg","name":"medium_image.jpg","path":null,"size":106.22,"width":750,"height":750,"provider_metadata":{"public_id":"medium_image_b76270977b","resource_type":"image"}},"thumbnail":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1699992600/thumbnail_image_b76270977b.jpg","hash":"thumbnail_image_b76270977b","mime":"image/jpeg","name":"thumbnail_image.jpg","path":null,"size":6.15,"width":156,"height":156,"provider_metadata":{"public_id":"thumbnail_image_b76270977b","resource_type":"image"}}}}}}}},{"id":"82","attributes":{"email":"ohad@gmx.us","noMail":null,"lang":null,"username":"אוהד","profilePic":{"data":{"attributes":{"url":"https://res.cloudinary.com/onelove1/image/upload/v1654801950/image_231eb83bfc.jpg","formats":{"thumbnail":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1654801950/thumbnail_image_231eb83bfc.jpg","hash":"thumbnail_image_231eb83bfc","mime":"image/jpeg","name":"thumbnail_image.jpg","path":null,"size":3.26,"width":156,"height":156,"provider_metadata":{"public_id":"thumbnail_image_231eb83bfc","resource_type":"image"}}}}}}}},{"id":"10","attributes":{"email":"adamvampiro666@gmail.com","noMail":null,"lang":null,"username":"מתיתיהו הגלילי","profilePic":{"data":{"attributes":{"url":"https://res.cloudinary.com/onelove1/image/upload/v1645082055/image_1c2942e7c0.jpg","formats":{"small":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1645082057/small_image_1c2942e7c0.jpg","hash":"small_image_1c2942e7c0","mime":"image/jpeg","name":"small_image.jpg","path":null,"size":31.5,"width":500,"height":500,"provider_metadata":{"public_id":"small_image_1c2942e7c0","resource_type":"image"}},"medium":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1645082057/medium_image_1c2942e7c0.jpg","hash":"medium_image_1c2942e7c0","mime":"image/jpeg","name":"medium_image.jpg","path":null,"size":60.41,"width":750,"height":750,"provider_metadata":{"public_id":"medium_image_1c2942e7c0","resource_type":"image"}},"thumbnail":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1645082055/thumbnail_image_1c2942e7c0.jpg","hash":"thumbnail_image_1c2942e7c0","mime":"image/jpeg","name":"thumbnail_image.jpg","path":null,"size":5.54,"width":156,"height":156,"provider_metadata":{"public_id":"thumbnail_image_1c2942e7c0","resource_type":"image"}}}}}}}},{"id":"1","attributes":{"email":"world2019peace@gmail.com","noMail":null,"lang":"he","username":"ברוך בביוף","profilePic":{"data":{"attributes":{"url":"https://res.cloudinary.com/onelove1/image/upload/v1706576516/image_e568378c00.jpg","formats":{"small":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1706576516/small_image_e568378c00.jpg","hash":"small_image_e568378c00","mime":"image/jpeg","name":"small_image.jpg","path":null,"size":75.88,"width":500,"height":500,"provider_metadata":{"public_id":"small_image_e568378c00","resource_type":"image"}},"thumbnail":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1706576516/thumbnail_image_e568378c00.jpg","hash":"thumbnail_image_e568378c00","mime":"image/jpeg","name":"thumbnail_image.jpg","path":null,"size":10.32,"width":156,"height":156,"provider_metadata":{"public_id":"thumbnail_image_e568378c00","resource_type":"image"}}}}}}}},{"id":"8","attributes":{"email":"barbarit111@gmail.com","noMail":null,"lang":null,"username":"Bבר","profilePic":{"data":{"attributes":{"url":"https://res.cloudinary.com/onelove1/image/upload/v1713796944/image_f8120f6eba.jpg","formats":{"large":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1713796946/large_image_f8120f6eba.jpg","hash":"large_image_f8120f6eba","mime":"image/jpeg","name":"large_image.jpg","path":null,"size":181.75,"width":1000,"height":1000,"provider_metadata":{"public_id":"large_image_f8120f6eba","resource_type":"image"}},"small":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1713796945/small_image_f8120f6eba.jpg","hash":"small_image_f8120f6eba","mime":"image/jpeg","name":"small_image.jpg","path":null,"size":64.34,"width":500,"height":500,"provider_metadata":{"public_id":"small_image_f8120f6eba","resource_type":"image"}},"medium":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1713796946/medium_image_f8120f6eba.jpg","hash":"medium_image_f8120f6eba","mime":"image/jpeg","name":"medium_image.jpg","path":null,"size":119.28,"width":750,"height":750,"provider_metadata":{"public_id":"medium_image_f8120f6eba","resource_type":"image"}},"thumbnail":{"ext":".jpg","url":"https://res.cloudinary.com/onelove1/image/upload/v1713796944/thumbnail_image_f8120f6eba.jpg","hash":"thumbnail_image_f8120f6eba","mime":"image/jpeg","name":"thumbnail_image.jpg","path":null,"size":9.84,"width":156,"height":156,"provider_metadata":{"public_id":"thumbnail_image_f8120f6eba","resource_type":"image"}}}}}}}},{"id":"149","attributes":{"email":"shaharnoa18@icloud.com","noMail":null,"lang":null,"username":"Shahar noa zur","profilePic":{"data":null}}},{"id":"176","attributes":{"email":"shoolisa@gmail.com","noMail":false,"lang":null,"username":"שאולי סמואל ","profilePic":{"data":null}}},{"id":"218","attributes":{"email":"itamar.yafe2@gmail.com","noMail":false,"lang":null,"username":"איתמר ","profilePic":{"data":null}}},{"id":"219","attributes":{"email":"britolam1@gmail.com","noMail":false,"lang":null,"username":"יניב ","profilePic":{"data":null}}}],"pid":"1","uid":"1","kind":"pend","name":"אפיון עיצוב"};

    await fetch('/api/nuti', {
      method: 'POST',  
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then((response) => {
      console.log('Response status:', response.status);
      return response.text();
    })
    .then((text) => {
      console.log('Success:', text);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }
  



  const submitPromt = async (prompt) => {
    // handle prompt for GPT plugin
    return '';
  };

  const handleUpload = async (file) => {
    // handle upload here
    const blob = new Blob([file]);
    const previewUrl = URL.createObjectURL(blob);
    return previewUrl;
  };
/*
let Editor = null
onMount(async()=>{
  Editor = await import('tailwind-editor')

})

    let html = ''
import {TipexEditor} from "@friendofsvelte/tipex";
import "@friendofsvelte/tipex/styles/Tipex.css";
import "@friendofsvelte/tipex/styles/ProseMirror.css";
import "@friendofsvelte/tipex/styles/Controls.css";
import "@friendofsvelte/tipex/styles/EditLink.css";
import "@friendofsvelte/tipex/styles/CodeBlock.css"; // for code block syntax highlighting

let htmlContent = `
<p>This <a target="_blank" rel="noopener noreferrer" href="">content</a> is written by
<a target="_blank" rel="noopener noreferrer" href="http://bishwas.net/">Bishwas</a> in 2023.
</p>`;/
import Editor from '@tinymce/tinymce-svelte';

let apiKey = "no-api-key";
let conf = {
  "height": 500,
  "plugins": [
      "a11ychecker","advlist","advcode","advtable","autolink","checklist","export",
      "lists","link","image","charmap","preview","anchor","searchreplace","visualblocks",
      "powerpaste","fullscreen","formatpainter","insertdatetime","media","table","help","wordcount"
    ],
   "toolbar": "undo redo | a11ycheck casechange blocks | bold italic backcolor | alignleft aligncenter alignright alignjustify | " +
      "bullist numlist checklist outdent indent | removeformat | code table help"
}*/
let outpot = $state(`<hr><hr><hr><hr><hr><hr><hr><hr><hr><h1 style="text-align:center;">     טקסט</h1><hr><hr><hr><hr><hr><hr><hr><p></p>`)


/*
const publicVapidKey = 'xxxxxx';

if ('serviceWorker' in navigator) {
  console.log('Registering service worker');

  run().catch(error => console.error(error));
}
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function run() {
  console.log('Registering service worker');
  const registration = await navigator.serviceWorker.
    register('worker.js');
  console.log('Registered service worker');

  console.log('Registering push');
  const subscription = await registration.pushManager.
    subscribe({
      userVisibleOnly: true,
      // The `urlBase64ToUint8Array()` function is the same as in
      // https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
    // subscription.user = $('.header-user-name').find('span').text();
  console.log('Registered push');

  console.log('Sending push');
  await fetch(`http://localhost:3000/subscribe?user='+$('.header-user-name').find('span').text()`, {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'content-type': 'application/json'
    }
  });
  console.log('Sent push');
}*/
let searchText = $state(),  selected = $state(), addn = {
  he: 'הוספת דרך חדשה',	en: 'add new way'}
let newcontentW
let placeholder = {
  he: 'הוספת דרך חדשה',	en: 'add new way'}
let ww = []
</script>

<button class="w-3.5 h-3.5 me-2 text-green-500 text-barbi bg-gray-500" onclick={oncli}>ooooo</button>

<!----
<main>
  <h1>Hello Tiny</h1>
  <Editor
   {apiKey}
   {conf}
   value="Welcome to TinyMCE Svelte"
  />
</main>



<TipexEditor htmlContent="{htmlContent}"
       style="margin-top: 1rem; margin-bottom: 0rem;"
       class="h-[70vh] border border-neutral-200 dark:border-neutral-700 w-full"/>

<div class="flex">
  {#if Editor != null}
  <svelte:component this={Editor} bind:html={html} />
    <div>
        {html}
    </div>
    {/if}
</div>
<EditorTheme>
  <SvelteEditor
    content={''}
    placeholder="Press 'space' GPT support, type '/' for help"
    onCreated={createdEditor => { editor = createdEditor }}
    onChange={nextEditor => { editor = nextEditor }}

    plugins={{
      selectImage: {
        handleUpload,
      },
    }}

  />
</EditorTheme>

<div>

<Nego 
descrip="  Lorem ipsum dolor sit amet consectetur adipisicing elit. Dicta, labore nulla voluptates corporis est non quia natus magnam id dolor perferendis distinctio doloremque laboriosam at quisquam cum necessitatibus, rem tempora."
 name1 = "יענקל" 
 linkTo = "aaxa"  
   restime="feh" 
   spnot = "דויד"
   hm=1
   easy=40
   price=30
   kindOf="total"
 ></Nego>
    </div>
    <input bind:value={tex} type="text" onchange={()=>console.log(sanitizeUserInput(tex),tex)}>
-->
