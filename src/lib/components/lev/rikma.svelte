
<script>
  import Tile from '$lib/celim/tile.svelte'

  import {
    createEventDispatcher
} from 'svelte';
 const dispatch = createEventDispatcher();
import { lang } from '$lib/stores/lang.js'
  import { RingLoader
} from 'svelte-loading-spinners';
export let projectId;
let projectUsers =[];
let token;
let idL;
let srcP;
let error1 = null;
let vallues  = []
      let linkP  =[]
       let githublink;
         let fblink, discordlink, twiterlink;
let projecto = [];
async function xyd () {
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
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
        'Content-Type': 'application/json'   
      };
        let link ="https://beosher.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
          `{  project (id:${projectId}) {data{attributes{ projectName  user_1s {data{ id attributes{ username profilePic {data{attributes{ url}}}}}}
          linkToWebsite     
           githublink fblink discordlink  twiterlink  vallues {data{attributes{ valueName ${$lang == 'he' ? 'localizations{data{attributes{ valueName }}}' : ""}}}}
                        publicDescription    profilePic {data{attributes{ url formats }}}   open_missions (filters:{archived:{eq: false} }) {data{ id attributes{ name}}}}
        }}}`
        })
})
  .then(r => r.json())
  .then(data => project = data.data.project.data);
            projectUsers = project.attributes.user_1s.data;
            projecto = project.attributes.open_missions.data;
                vallues = project.attributes.vallues.data;
            if ($lang == "he"){
              for (var i = 0; i < vallues.length; i++){
                if (vallues[i].attributes.localizations.data.length > 0){
                vallues[i].attributes.valueName = vallues[i].attributes.localizations.data[0].attributes.valueName
                }
              }
            }
            vallues = vallues
            srcP =`${project.attributes.profilePic.data.attributes.formats.small.url}`
       linkP = project.attributes.linkToWebsite;
        githublink = project.attributes.githubLink;
             fblink = project.attributes.fblink;
              discordlink = project.attributes.discordLink;
              twiterlink= project.attributes.twiterLink;
            srcP =`${project.attributes.profilePic.data.attributes.formats.small.url}`
           
        } catch (e) {
            error1 = e
        }
        return project
    };

    function us (x){
      console.log(x)
      dispatch('user',{id:x})
    }
     function mesima (x){
      dispatch('mesima',{id:x})
    }
    function hover(c){
      console.log("hover")
    }
    let project = xyd();

 const githublinkde = {"he":"לינק לגיטהב של הריקמה","en":"link to the FreeMates GitHub"}
   const fblinkde = {"he":"לינק לפייסבוק של הריקמה","en":"link to the FreeMates Facebook"}
   const discordlinkde = {"he":"לינק לדיסקורד של הריקמה","en":"link to the FreeMates Discord"}
   const twiterlinkde = {"he":"לינק לטוויטר של הריקמה","en":"link to the FreeMates twitter"}
    const tower = {"he": "לינק לאתר", "en": "link to website"}
   const vap = {"he": "ערכים ומטרות", "en": "vallues and objectives"}
    const frm = {"he": " משימות פנויות בריקמה", "en":"Open missions"}
</script>
 {#await project}
 <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
 {:then project}

<div dir="rtl" >

  <div class="4">
    {#if srcP}
    <img
    width="100" height="100" 
    style="border-radius: 50%; margin-right:auto; margin-left:auto ;"  
    src={srcP}
    alt="profilePic">
  {/if}
        <div class="flex flex-row items-center justify-center">
            {#if discordlink}
                     <a
                               rel="noreferrer"
                     target="_blank" href={discordlink}
          class=" hover:bg-mturk text-barbi rounded-full"
          title={discordlinkde[$lang]}
          >
          <img style="width:24px;height:24px" src="https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg" alt="Discord"/>
          </a>
                      {/if}
            {#if linkP}
                     <a
                               rel="noreferrer"
                     target="_blank" href={linkP}
          class=" hover:bg-mturk text-barbi rounded-full"
          title={tower[$lang]}
          >
          <svg class="sv"  style="width:24px;height:24px" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path
           fill="currentColor" d="M14.851 11.923c-.179-.641-.521-1.246-1.025-1.749-1.562-1.562-4.095-1.563-5.657 0l-4.998 4.998c-1.562 1.563-1.563 4.095 0 5.657 1.562 1.563 4.096 1.561 5.656 0l3.842-3.841.333.009c.404 0 .802-.04 1.189-.117l-4.657 4.656c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-1.952-1.951-1.952-5.12 0-7.071l4.998-4.998c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464.493.493.861 1.063 1.105 1.672l-.787.784zm-5.703.147c.178.643.521 1.25 1.026 1.756 1.562 1.563 4.096 1.561 5.656 0l4.999-4.998c1.563-1.562 1.563-4.095 0-5.657-1.562-1.562-4.095-1.563-5.657 0l-3.841 3.841-.333-.009c-.404 0-.802.04-1.189.117l4.656-4.656c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464 1.951 1.951 1.951 5.119 0 7.071l-4.999 4.998c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-.494-.495-.863-1.067-1.107-1.678l.788-.785z"/></svg>
          </a>
                      {/if}
                          
                         {#if twiterlink}
                     <a
                               rel="noreferrer"
                     target="_blank" href={twiterlink}
          class=" hover:bg-white text-barbi rounded-full"
          title={twiterlinkde[$lang]}
          >
          <img style="width:24px;height:24px" src="https://visualpharm.com/assets/700/Twitter-595b40b65ba036ed117d4613.svg" alt="Twitter"/>
          </a>
                      {/if}
                      
                        {#if githublink}
                     <a
                               rel="noreferrer"
                     target="_blank" href={githublink}
          class=" hover:bg-white text-barbi rounded-full"
          title={githublinkde[$lang]}
          >
          <img style="width:24px;height:24px" src="https://visualpharm.com/assets/720/Github-595b40b65ba036ed117d442f.svg" alt="GitHub"/>
          </a>
                      {/if}
                       {#if fblink}
                     <a
                               rel="noreferrer"
                     target="_blank" href={fblink}
          class=" hover:bg-white text-barbi rounded-full"
          title={fblinkde[$lang]}
          >
          <img style="width:24px;height:24px" src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png" alt="Facebook"/>
          </a>
                      {/if}
</div>
  </div>
 
<h1 class="q">{project.attributes.projectName}</h1>
 {#if project.attributes.publicDescription !== null}
    <div class="border border-gold rounded m-2 p-2"> 
   <pre style="overflow-y:auto;  white-space: pre-wrap;" class="2 d max-h-24 p-2 text-gold">{project.attributes.publicDescription}</pre>
    </div>
   {/if}
 <div dir="ltr" class="flex items-center justify-center">
    <div dir="ltr" class="flex -space-x-2 ">
        {#each projectUsers as user}
  <button title="{user.attributes.username}" on:click={()=>us(user.id)}><img class="inline-block h-8 w-8 rounded-full ring-2 ring-gold" src="{user.attributes.profilePic.data != null ? user.attributes.profilePic.data.attributes.url : "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"}" alt=""></button>
  <!--{#if hover}
    <h6 class="textlink hover:text-scale-150 hover:text-gold"></h6>
    {/if}-->
  {/each}
    </div>
    </div>
     {#if vallues.length > 0}
     <div style="margin: 2px; text-align:center; padding: 10px; border: 2px solid var(--mturk);"  class="drop-shadow-xl shadow-gold">

     <h2 class="mt-2 text-sm text-barbi text-center " style="text-shadow: 1px 1px var(--gold);">{vap[$lang]}</h2>
            <div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 m-1"> 
                {#each vallues as vallue}<p on:mouseenter={()=>hover({"he":"דרכי עבודה מבוקשות","en":"ways of work for the mission"})} on:mouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
              <Tile bg="gold"   word={vallue.attributes.valueName}/></p>{/each}
    </div>
    </div>
    {/if}

<!--<div style="background-color: var(--mturk); margin: 2px; text-align:center; padding: 10px; border: 2px solid var(--gold);" class="3 drop-shadow-xl">
    <h2 style="color: var(--barbi-pink);
" >1 ברקמה </h2>
{#each projectUsers as user}
<button  ><p class="text-gold hover:text-barbi">{user.username}</p></button>
<br>
{/each}
</div>-->
<div style="margin: 2px; text-align:center; padding: 10px; border: 2px solid var(--mturk);"  class="drop-shadow-xl ">
<h3 style="color: var(--barbi-pink) ;text-shadow: 1px 1px var(--gold);" class="5">{frm[$lang]}</h3>
<div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 "> 
                {#each projecto as om }<p on:mouseenter={()=>hover({"he":"דרכי עבודה מבוקשות","en":"ways of work for the mission"})}
                   on:mouseleave={()=>hover("0")} class="m-0 cursor-pointer hover:scale-105	" style="text-shadow:none;" on:click={mesima(om.id)}>
              <Tile bg="wow"   word={om.attributes.name}/></p>{/each}
    </div>
</div>
</div>
{/await}
<style>
  
  .q{
font-size: 220%;
text-align: center;
color: var(--barbi-pink);
  }
</style>