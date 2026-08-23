
<script>
  import Tile from '$lib/celim/tile.svelte'

  let { onUser, onMesima, projectId } = $props();
import { lang } from '$lib/stores/lang.js'
import { t } from '$lib/translations';
  import { RingLoader
} from 'svelte-loading-spinners';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
let projectUsers =$state([]);
let srcP = $state();
let error1 = null;
let vallues  = $state([])

      // `linkToWebsite` is a string or null — an empty array as the initial
      // value is truthy, so `{#if linkP}` would open the link on nothing.
      let linkP  =$state()
       let githublink = $state();
         let fblink = $state(), discordlink = $state(), twiterlink = $state();
let projecto = $state([]);
/**
 * Resolves to the project and returns it — it must never write to `project`
 * itself. `{#await project}` re-runs whenever its input changes, and the
 * reassignment happened inside this promise's continuation: the await block
 * then swapped pending→then from a microtask, outside the guard that stops it
 * rendering into a subtree that is already destroyed or mid-outro (the lev
 * dialog fades for a full second). Effects built under an inert parent read
 * their deriveds back as Svelte's internal UNINITIALIZED symbol, so
 * `title={$t(…)}` threw "Cannot convert a Symbol value to a string" and took
 * the whole flush — every other card on the page — down with it.
 */
async function xyd () {
        let proj;
        try {
            const res = await sendToSer({ id: projectId }, "49GetProjectById", 0, 0, false, fetch);
            // A GraphQL error comes back as `{ errors: [...] }` with no `data`,
            // and a project the user cannot read comes back as `data: null`.
            // Both used to blow up on the next line and land in {:catch} with
            // nothing to go on, so name them.
            if (!res?.data?.project?.data) {
              throw new Error(
                `49GetProjectById returned no project for id=${projectId}` +
                  (res?.errors ? `: ${JSON.stringify(res.errors)}` : '')
              );
            }
            proj = res.data.project.data;
            const a = proj.attributes ?? {};
            projectUsers = a.user_1s?.data ?? [];
            projecto = a.open_missions?.data ?? [];
            vallues = a.vallues?.data ?? [];
            if ($lang == "he"){
              for (var i = 0; i < vallues.length; i++){
                const loc = vallues[i]?.attributes?.localizations?.data ?? [];
                if (loc.length > 0){
                vallues[i].attributes.valueName = loc[0].attributes.valueName
                }
              }
            }
            vallues = vallues
       linkP = a.linkToWebsite;
        // The schema spells these all-lowercase (see STRAPI_SCHEMA_REFERENCE);
        // the camelCase reads here always resolved to undefined, so the icons
        // never appeared even for a rikma that has the links.
        githublink = a.githublink;
             fblink = a.fblink;
              discordlink = a.discordlink;
              twiterlink= a.twiterlink;
            // Strapi only generates a size when the upload is bigger than it, so
            // a small logo has a `thumbnail` and nothing else. Reading `.small`
            // unconditionally threw a TypeError, and the {:catch} then reported
            // the whole rikma as unloadable over a missing image size.
            const pic = a.profilePic?.data?.attributes;
            const fmts = pic?.formats ?? {};
            srcP = fmts.small?.url || fmts.medium?.url || fmts.thumbnail?.url || pic?.url || '';

        } catch (e) {
            error1 = e
            console.error('[rikma] load failed for project', projectId, e)
            throw e
        }
        return proj
    };

    function us (x){
      onUser?.({id: x});
    }
     function mesima (x){
      onMesima?.({id: x});
    }
    function hover(c){
      console.log("hover")
    }
    // Plain `let`, not `$state`: the await block's input has to stay the one
    // stable promise for its whole life — see the note on `xyd`.
    let project = xyd();

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
          title={$t('lev.rikma.discordLink')}
          >
          <img style="width:24px;height:24px" src="https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg" alt="Discord"/>
          </a>
                      {/if}
            {#if linkP}
                     <a
                               rel="noreferrer"
                     target="_blank" href={linkP}
          class=" hover:bg-mturk text-barbi rounded-full"
          title={$t('lev.rikma.websiteLink')}
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
          title={$t('lev.rikma.twitterLink')}
          >
          <img style="width:24px;height:24px" src="https://visualpharm.com/assets/700/Twitter-595b40b65ba036ed117d4613.svg" alt="Twitter"/>
          </a>
                      {/if}
                      
                        {#if githublink}
                     <a
                               rel="noreferrer"
                     target="_blank" href={githublink}
          class=" hover:bg-white text-barbi rounded-full"
          title={$t('lev.rikma.githubLink')}
          >
          <img style="width:24px;height:24px" src="https://visualpharm.com/assets/720/Github-595b40b65ba036ed117d442f.svg" alt="GitHub"/>
          </a>
                      {/if}
                       {#if fblink}
                     <a
                               rel="noreferrer"
                     target="_blank" href={fblink}
          class=" hover:bg-white text-barbi rounded-full"
          title={$t('lev.rikma.facebookLink')}
          >
          <img style="width:24px;height:24px" src="https://res.cloudinary.com/love1/image/upload/v1639258134/NicePng_oro-png_2336309_rkhbf8.png" alt="Facebook"/>
          </a>
                      {/if}
</div>
  </div>
 
<h1 class="q">{project.attributes.projectName}</h1>
 {#if project.attributes.publicDescription !== null}
    <div class="border border-gold rounded m-2 p-2"> 
            <RichText editable={false} outpot={project.attributes.publicDescription}/>
   <!----<pre style="overflow-y:auto;  white-space: pre-wrap;" class="2 d max-h-24 p-2 text-gold">{project.attributes.publicDescription}</pre>-->
    </div>
   {/if}
 <div dir="ltr" class="flex items-center justify-center">
    <div dir="ltr" class="flex -space-x-2 ">
        {#each projectUsers as user}
  <button title="{user.attributes.username}" onclick={()=>us(user.id)}><img class="inline-block h-8 w-8 rounded-full ring-2 ring-gold" src="{user.attributes.profilePic.data != null ? user.attributes.profilePic.data.attributes.url : "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"}" alt=""></button>
  <!--{#if hover}
    <h6 class="textlink hover:text-scale-150 hover:text-gold"></h6>
    {/if}-->
  {/each}
    </div>
    </div>
     {#if vallues.length > 0}
     <div style="margin: 2px; text-align:center; padding: 10px; border: 2px solid var(--mturk);"  class="drop-shadow-xl shadow-gold">

     <h2 class="mt-2 text-sm text-barbi text-center " style="text-shadow: 1px 1px var(--gold);">{$t('lev.rikma.valuesAndObjectives')}</h2>
            <div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 m-1"> 
                {#each vallues as vallue}<p onmouseenter={()=>hover($t('lev.cards.common.wwneed'))} onmouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
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
<h3 style="color: var(--barbi-pink) ;text-shadow: 1px 1px var(--gold);" class="5">{$t('lev.rikma.openMissions')}</h3>
<div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 "> 
                {#each projecto as om }<p onmouseenter={()=>hover($t('lev.cards.common.wwneed'))}
                   onmouseleave={()=>hover("0")} class="m-0 cursor-pointer hover:scale-105	" style="text-shadow:none;" onclick={()=>mesima(om.id)}>
              <Tile bg="wow"   word={om.attributes.name}/></p>{/each}
    </div>
</div>
</div>
{:catch}
  <p dir="auto" class="p-4 text-center text-barbi">{$t('lev.rikma.loadError')}</p>
{/await}
<style>
  
  .q{
font-size: 220%;
text-align: center;
color: var(--barbi-pink);
  }
</style>
