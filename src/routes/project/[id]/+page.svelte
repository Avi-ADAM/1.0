<script>
  import Header from '$lib/components/header/header.svelte';
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';
  import { RingLoader } from 'svelte-loading-spinners';
  import SheirutShow from '$lib/components/prPr/sheirut/sheirutShow.svelte';
  import Close from '$lib/celim/close.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Tile from '$lib/celim/tile.svelte';

  export let data;
  console.log(data)
  let projectId = data.projectId;
  let project = data.projectData;
  let isRegisteredUser = data.isRegisteredUser;

  let projectUsers = project.attributes.user_1s.data;
  let projecto = project.attributes.open_missions.data;
  let vallues = project.attributes.vallues.data;
  let srcP = project.attributes.profilePic.data ? project.attributes.profilePic.data.attributes.formats ? project.attributes.profilePic.data.attributes.formats.thumbnail.url : project.attributes.profilePic.data.attributes.url : null;
  let linkP = project.attributes.linkToWebsite;
  let githublink = project.attributes.githubLink;
  let fblink = project.attributes.fblink;
  let discordlink = project.attributes.discordLink;
  let twiterlink = project.attributes.twiterLink;
  let restime = project.attributes.restime;


  const showl = {"he":"הצגת השירותים שלנו","en":"show services"}
  let show = false;

  $: unregisteredUserMessage = {
    "he": "הנך צופה בריקמה (פרויקט שיתופי) זו ללא הרשמה.  <a href=\"/\" class=\"underline\">ביכולתך להירשם</a> כדי להנות מהאתר ולשתף פעולה.",
    "en": "You are viewing this project as an unregistered user. Please <a href=\"/\" class=\"underline\">register</a> to access more features."
  };

 $: if ($lang == "he"){
    for (let i = 0; i < vallues.length; i++){
      if (vallues[i].attributes.localizations.data.length > 0){
        vallues[i].attributes.valueName = vallues[i].attributes.localizations.data[0].attributes.valueName
      }
    }
  }

  function us (x){
    console.log(x)
    goto(`/user/${x}`)   
  }

  function mesima (x){
    goto(`/availableMission/${x}`)   
  }

  function hover(c){
    console.log("hover")
  }
$: w = 0
$: isMobileOrTablet = w < 568 ? true : false
  const githublinkde = {"he":"לינק לגיטהב של הריקמה","en":"link to the FreeMates GitHub"}
  const fblinkde = {"he":"לינק לפייסבוק של הריקמה","en":"link to the FreeMates Facebook"}
  const discordlinkde = {"he":"לינק לדיסקורד של הריקמה","en":"link to the FreeMates Discord"}
  const twiterlinkde = {"he":"לינק לטוויטר של הריקמה","en":"link to the FreeMates twitter"}
  const tower = {"he": "לינק לאתר", "en": "link to website"}
  const vap = {"he": "ערכים ומטרות", "en": "vallues and objectives"}
  const frm = {"he": " משימות פנויות בריקמה", "en":"Open missions"}
  $: heass = {"he": ` 1💗1 | ${project.attributes ? project.attributes.projectName : "ריקמה"}` ,"en": ` 1💗1 | ${project.attributes ? project.attributes.projectName : "FreeMate"}`}
</script>

<svelte:head>
  <title>{heass[$lang]}</title>
</svelte:head>
{#if isRegisteredUser}

  <Header/>
{/if}
{#if project}
  <div bind:clientWidth={w} class="w-screen d overflow-y-auto h-screen bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400 ">
    <div dir="rtl"  class="h-screen d lg:w-1/2 mx-auto ">

      {#if !isRegisteredUser}
        <div class="bg-goldShain text-barbi p-4 text-center" style='text-shadow: white 1px 1px 1px'>
          {@html unregisteredUserMessage[$lang]}
        </div>
      {/if}

      <div>
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
              target="_blank" href={discordlink}
              class=" hover:bg-mturk text-barbi rounded-full"
              title={discordlinkde[$lang]}
              rel="noreferrer"
            >
              <img style="width:24px;height:24px" src="https://res.cloudinary.com/love1/image/upload/v1662563246/discord-icon-svgrepo-com_d4vk6m.svg" alt="Discord"/>
            </a>
          {/if}
          {#if linkP}
            <a
              target="_blank" href={linkP}
              rel="noreferrer"
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
          <RichText editable={false} outpot={project.attributes.publicDescription}/>
        </div>
      {/if}
      <div dir="ltr" class="flex items-center justify-center">
        <div dir="ltr" class="flex -space-x-2 ">
          {#each projectUsers as user}
            <button title="{user.attributes.username}" on:click={()=>us(user.id)}><img class="inline-block h-8 w-8 rounded-full ring-2 ring-gold" src="{user.attributes.profilePic.data != null ? user.attributes.profilePic.data.attributes.url : "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"}" alt=""></button>
          {/each}
        </div>
      </div>

      {#if vallues.length > 0}
        <div style="margin: 2px; text-align:center; padding: 10px; border: 2px solid var(--mturk);"  class="drop-shadow-xl shadow-gold">
          <h2 class="mt-2 text-sm text-barbi text-center " style="text-shadow: 1px 1px var(--gold);">{vap[$lang]}</h2>
          <div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 m-1"> 
            {#each vallues as vallue}
              <p on:mouseenter={()=>hover({"he":"דרכי עבודה מבוקשות","en":"ways of work for the mission"})} on:mouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
                <Tile bg="gold" sm={true} big={true}  word={vallue.attributes.valueName}/>
              </p>
            {/each}
          </div>
        </div>
      {/if}

      <div style="margin: 2px; text-align:center; padding: 10px; border: 2px solid var(--mturk);"  class="drop-shadow-xl {isMobileOrTablet ? "pb-12" : ""}">
        <h3 style="color: var(--barbi-pink) ;text-shadow: 1px 1px var(--gold);" class="5">{frm[$lang]}</h3>
        <div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 "> 
          {#each projecto as om }
            <p on:mouseenter={()=>hover({"he":"משימות פנויות בריקמה","en":"open missions in the FreeMate"})} on:mouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
              <button on:click={()=>mesima(om.id)}>  <Tile bg="wow"  sm={true} big={true} word={om.attributes.name}/></button>
            </p>
          {/each}
        </div>
        {#if project.attributes.sheiruts?.data?.length >0}
          <div class="{isMobileOrTablet ? "pb-12" : ""} ">
            {#if show === false}
              <button   
                class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
                on:click={()=>show = true}>{showl[$lang]}
              </button>
            {:else} 
              <div class="flex flex-col items-center justify-center  p-8 mx-auto bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"> 
                <button   
                  class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
                  on:click={()=>show = false}><Close/>
                </button>
                <SheirutShow
                  wb={true} 
                  projectName={project.attributes.projectName} 
                  pid={projectId} 
                  restime={restime}
                  sheirutim={project.attributes.sheiruts}/>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
{:else}
  <div class="h-screen grid align-middle justify-center bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400">
    <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  </div>
{/if}

<style>
  .q{
    font-size: 220%;
    text-align: center;
    color: var(--barbi-pink);
  }
</style>
