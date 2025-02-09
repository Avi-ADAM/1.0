<script>
  import { run } from 'svelte/legacy';

  import RichText from "$lib/celim/ui/richText.svelte";
import Nego from "$lib/components/prPr/negoPend.svelte";
  import { sanitizeUserInput } from "$lib/func/uti/sanitizeUserInput.svelte";
  import { lang } from "$lib/stores/lang.js";
  import { onMount } from "svelte";
  import { MultiSelect } from "svelte-multiselect";
  /** @type {{data: any}} */
  let { data } = $props();
    let tex

  let c = []
  let y = []
 
  onMount(()=>{
    y = c
    lang.set(data.lang)
  })
  function oncli (){
   // y.push(0)
    //y = y
    //console.log(y,c)
    let data = {user: "useraplyname", projectName :"projectName", projectSrc: "https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png", missionName: "openmissionName", email: "babayofnet@gmail.com", lang: "he" , kind: "exeptedMission"}//username email projectname projectsrc lang openmissionName
            fetch('/api/sma', {
            method: 'POST',  
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })
            .then((response) => response)
            .then((data) => {
              console.log('Success:', data);            
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
run(() => {
    console.log(outpot)
  });

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
<MultiSelect
--sms-open-z-index={10000}
  createOptionMsg={addn[$lang]}
  allowUserOptions={true}
  bind:searchText
  loading={newcontentW}
  bind:selected
  placeholder={placeholder[$lang]}
  options={ww.map((c) => c.attributes.workWayName)}
  
/>
<button class="w-3.5 h-3.5 me-2 text-green-500 text-barbi bg-gray-500" onclick={oncli}>ooooo</button>

<RichText bind:outpot/>
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
    <input bind:value={tex} type="text" on:change={()=>console.log(sanitizeUserInput(tex),tex)}>
-->