<script>
  import { Head } from 'svead';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Share from '$lib/components/share/shareButtons/index.svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { goto } from '$app/navigation';
  //import MissionCard from '$lib/components/cards/missionCard.svelte';

  let { data } = $props();
  let showOpen = $state(false);

  const headi = { he: 'מתנה', en: 'Gift' };
  const seePr = { he: 'לצפיה בריקמה', en: 'See project' };
  const buyNow = { he: 'לקנות עכשיו', en: 'Buy now' };
  const notAvailable = { he: 'לא זמין', en: 'Not available' };
  const unlimited = { he: 'ללא הגבלה', en: 'unlimited' };
  const perMonth = { he: 'חודשי', en: 'monthly' };
  const perYear = { he: 'שנתי', en: 'yearly' };
  const perUnit = { he: 'ליחידה', en: 'per unit' };
  const om = { he: 'משימות פתוחות', en: 'Open Missions' };
  const info ={"he": "בכדי לבקש להצטרף לצוות ולבצע את המשימה וגם בכדי לקבל הצעות למשימות, לפתוח רקמות (פרויקטים) חדשות ולהתנהל בהן בהסכמה יש להתחבר או להירשם","en":"You are not connected" };
  const registratio = { "he": "להרשמה", "en": "To Registration"} 
  const logi = { "he": "להתחברות", "en":"To Login"}
  const left = { he: 'נותרו', en: 'left' };

  function project(x) {
    goto('/project/' + x);
  }

  function handleBuyNow() {
    // Placeholder for buy logic
    console.log('Buy flow TBD for gift ID:', page.data.mId);
    // We can add navigation to a checkout page or open a payment modal here.
  }
  
  function reg (){
    goto($lang === 'he' ? '/' : `/${$lang}`);
  }

  function login () { 
    goto (`/login?from=gift/${data.mId}`);
  }

  function isValidDate(d) {
    return d && new Date(d).getFullYear() > 1970;
  }

  let title = data.alld?.name ? `${headi[$lang]} - ${data.alld.name}` : headi[$lang];
  let image = data.alld?.pic?.data?.attributes?.url || 'https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png';
  let description = data.alld?.desc || headi[$lang];
  let url = page.url.toString();
  $effect(() => {
    console.log(data.alld)
  })
</script>

<Head {title} {description} {image} {url} />

{#if data.alld}
  <div dir={$lang == 'he' ? 'rtl' : 'ltr'} class="w-full lg:w-1/2 mx-auto p-3">
    <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
      <div class="relative flex items-center space-x-1">
        {#if data.alld.projectcreates?.data?.[0]?.attributes?.profilePic?.data?.attributes?.url}
          <img src={data.alld.projectcreates.data[0].attributes.profilePic.data.attributes.url} alt="Project Profile" class="w-10 sm:w-16 h-10 sm:h-16 rounded-full" />
        {/if}
        <div class="flex flex-col leading-tight">
          <div class="sm:text-sm text-md mt-1 flex items-center">
            <span class="text-barbi text-center mr-3 sm:text-2xl lg:text-4xl text-xl">{headi[$lang]}</span>
          </div>
          <span class="pn ml-1 text-lg sm:text-xl lg:text-2xl text-grey-200">{data.alld.projectcreates?.data?.[0]?.attributes?.projectName}</span>
        </div>
      </div>
      {#if data.alld.projectcreates?.data?.[0]?.id}
        <button onclick={() => project(data.alld.projectcreates.data[0].id)} class="px-4 py-2 hover:text-barbi text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink rounded text-lg lg:text-2xl font-bold mt-2 mx-4 border-2 border-gold leading-4">{seePr[$lang]}</button>
      {/if}
    </div>

    {#if data.alld.pic?.data}
      <img src={data.alld.pic.data.attributes.url} alt="Gift" class="w-full h-48 object-cover" />
    {/if}

    <div class="lg:bg-gray-700 bg-transparent rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal">
      <div class="mb-8">
        <div class="flex flex-row justify-between">
          <div class="px-2">
            <h2 class="text-barbi font-bold text-xl lg:text-4xl underline">{data.alld.name}</h2>
            {#if data.alld.desc}
              <RichText outpot={data.alld.desc} editable={false} />
            {/if}
          </div>
          <Share
            slug={"gift/" + page.data.mId}
            title={data.alld.title ? data.alld.title[$lang] : null}
            desc={headi[$lang]}
            hashtags={['1💗1', 'consensus']}
            quote={data.alld.title ? data.alld.title[$lang] : null}
            related={[]}
            via={''}
          />
        </div>

        <!-- Price and Dates -->
        <div class="mt-4 flex items-center justify-between">
            <div class="text-gray-100 lg:text-2xl text-xl flex items-center gap-2">
              <img class="w-8 lg:w-10" src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="price" />
              <span>
                {#if data.alld.price != null}
                  {Number(data.alld.price).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                {/if}
                {#if data.alld.kindOf === 'monthly'} {perMonth[$lang]} {/if}
                {#if data.alld.kindOf === 'yearly'} {perYear[$lang]} {/if}
                {#if data.alld.kindOf === 'total'} {perUnit[$lang]} {/if}
                {#if data.alld.kindOf === 'unlimited'} {unlimited[$lang]} {/if}
              </span>
            </div>
        </div>

        {#if isValidDate(data.alld.startDate) || isValidDate(data.alld.finnishDate)}
          <div class="mt-4 text-gray-200 flex items-center">
             <img class="w-12 lg:w-24" src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg" alt="calendar" />
            {#if isValidDate(data.alld.startDate)}
              <span>{new Date(data.alld.startDate).toLocaleString($lang)}</span>
            {/if}
            {#if isValidDate(data.alld.finnishDate)}
              <span>&nbsp;-&nbsp;{new Date(data.alld.finnishDate).toLocaleString($lang)}</span>
            {/if}
          </div>
        {/if}

        <!-- Buy Button -->
        {#if page.data.tok}
          <div class="mt-6 flex items-center gap-4 {$lang === 'he' ? 'flex-row-reverse' : ''}">
            <button
              class="px-6 py-3 text-xl font-bold border-2 border-gold bg-gradient-to-br from-barbi to-mpink text-gold hover:border-barbi rounded"
              disabled={data.alld.archived === true || (data.alld.quant !== -1 && data.alld.quant <= 0)}
              onclick={handleBuyNow}
            >
              {#if data.alld.archived === true || (data.alld.quant !== -1 && data.alld.quant <= 0)}
                {notAvailable[$lang]}
              {:else}
                {buyNow[$lang]}
              {/if}
            </button>
            {#if data.alld.quant != null}
              <span class="text-gray-300">{data.alld.quant === -1 ? unlimited[$lang] : `${data.alld.quant} ${left[$lang]}`}</span>
            {/if}
          </div>
        {:else}
          <div class="flex justify-center">
            <div class="mx-8 mt-7 text-barbi hover:text-black button-perl">
              <p class="text-center font-bold text-2xl p-2">{info[$lang]}</p>
              <div class="flex flex-row flex-auto justify-between">
                <button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={reg}>{registratio[$lang]}</button>
                <button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4" onclick={login}>{logi[$lang]}</button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Open Missions
        <button class="text-barbi mt-5" onclick={() => showOpen = !showOpen}>
            {showOpen ? 'Hide' : 'Show'} Open Missions
        </button>
        {#if showOpen && data.alld.projectcreates?.data[0].attributes.open_missions?.data.length > 0}
          <h3 class="text-barbi font-bold text-xl lg:text-2xl underline mt-4">{om[$lang]}</h3>
          {#each data.alld.projectcreates?.data[0].attributes.open_missions.data as open}
            <MissionCard data={open.attributes} />
          {/each}
        {/if} -->
      </div>
    </div>
  </div>
{:else if data.archived}
    <div class="text-center p-10 text-barbi">{notAvailable[$lang]}</div>
{:else}
  <div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
    <RingLoader size="260" color="#ff00ae" unit="px" duration="2s" />
  </div>
{/if}
