<script>
  import Dialog from '$lib/celim/ui/dialog.svelte';
  import { page } from '$app/state';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { liUN } from '$lib/stores/liUN.js';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Close from '$lib/celim/close.svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { TourItem } from 'svelte-tour';
  import { run } from 'svelte-tour';
  import { Tour } from 'svelte-tour';
  import TourTip from '$lib/components/tour/tourMeEnd.svelte';
  import { lang, doesLang, langUs } from '$lib/stores/lang.js';
  import { locale, t } from '$lib/translations';
  import { onMount, onDestroy, tick } from 'svelte';
  import { browser } from '$app/environment';
  import { executeAction } from '$lib/client/actionClient';
  import { hydrateUser } from '$lib/stores/userStore.js';
  import { draw } from 'svelte/transition';
  import Addnew from '$lib/components/addnew/baci.svelte';
  import { baciStore } from '$lib/stores/baciStore.js';
  import Addnewp from '$lib/components/userPr/uploadPic.svelte';
  import { uPic } from '$lib/stores/uPic.js';
  import Edit from '$lib/components/userPr/edit.svelte';
  const baseUrl = import.meta.env.VITE_URL;
  //import Profile from '../../lib/components/userPr/new.svelte';
  //import { addS } from '../../lib/stores/addS.js';
  import { idPr } from '$lib/stores/idPr.js';
  import { goto, invalidateAll } from '$app/navigation';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { fly, scale } from 'svelte/transition';
  let { data } = $props();

  let iwant = $state(false);
  let isOpen = $state(false);
  let isOpenM = $state(false);
  let isG = $state(data.meData?.profilManualAlready ?? false);
  let current = $state('');

  // Upload goes through the server proxy (keeps JWT in the HttpOnly cookie)
  let url1 = `/api/upload`;
  let updX = $state(0);
  let files;
  let online = $state(browser ? navigator.onLine : true);

  let skil = [];
  let taf = [];
  let mash = [];
  let val = [];
  let work = [];
  let total = $state(0);
  let odata = [];
  let allvn;
  let picLink = $state(data.picLink);
  let addSl = $state(false);
  let addSl1 = $state(false);
  let addSl2 = $state(false);
  let addSl3 = $state(false);
  let addSl4 = $state(false);
  let addSl5 = $state(false);
  let a = $state(0);
  let addNs1 = $state(true);
  let error1 = null;
  let addpic = $state(0);
  let addP = $state(false);
  let st = $state(0);
  let stylef = $state('31px');
  let meData = $state(data.meData);
  function isUCBrowser() {
    return /UCWEB|UCBrowser/i.test(navigator.userAgent);
  }

  async function sendP() {
    // Check if FormData is empty
    let hasFiles = false;
    for (let pair of files.entries()) {
      hasFiles = true;
      break;
    }

    if (!hasFiles) {
      toast.warning($t('pages.me.pickFile'));
      a = 0;
      return;
    }

    try {
      // 1) Upload the file through the server proxy (reads JWT from cookie)
      const upRes = await fetch(url1, { method: 'POST', body: files });
      if (!upRes.ok) throw new Error('upload failed');
      const uploaded = await upRes.json();
      const imageId = uploaded[0].id;

      // 2) Link the uploaded media to the user via the unified action
      const result = await executeAction('updateUserProfilePic', {
        imageId: String(imageId)
      });

      if (!result.success) {
        a = 0;
        return; // executeAction already surfaced the error toast
      }

      // Server reload (triggered by the action updateStrategy) refreshes
      // picLink / uPic; just close the editor here.
      updX = 0;
      isOpenM = false;
      a = 0;
    } catch (e) {
      error1 = e;
      console.log('An error occurred:', e);
      toast.error($t('pages.me.uploadError'));
      a = 0;
    }
  }
  let load = $state(false);
  function project(id) {
    load = true;
    idPr.set(id);
    goto('/moach');
  }
  /**
   * Sync local state from the server load. Re-runs whenever `data` changes —
   * i.e. after invalidate('app:meProfile') triggered by one of our actions or
   * by a socket notification from another device. This is what makes the
   * profile reactive to updates.
   */
  $effect(() => {
    if (!data.meData) return;
    meData = data.meData;
    picLink = data.picLink;
    total = data.total;
    isG = data.meData.profilManualAlready;
    // Hydrate the app-wide user cache so other pages don't re-fetch.
    hydrateUser(data.meData);
    if (browser) {
      liUN.set(data.meData.username);
      uPic.set(data.avatarSmall);
      if (data.avatarSmall) {
        localStorage.setItem('picLink', JSON.stringify(data.picLink));
      }
    }
  });

  // Keep the language stores in sync with the user's saved preference.
  $effect(() => {
    const lng = data.meData?.lang;
    // Accept every locale the site ships, not just he/en — the old whitelist
    // silently dropped a saved ar/ru/es preference, so those users kept
    // browsing in whatever the cookie happened to hold.
    if (browser && ['he', 'en', 'ar', 'ru', 'es'].includes(lng)) {
      if ($lang !== lng) {
        lang.set(lng);
        locale.set(lng);
        langUs.set(lng);
        doesLang.set(true);
        document.cookie =
          `lang=${lng}; expires=` + new Date(2027, 0, 1).toUTCString();
      }
    }
  });
  function reverseString(str) {
    return str.split('').reverse().join('');
  }
  export const snapshot = {
    capture: () => JSON.parse(JSON.stringify(meData)),
    restore: (value) => (meData = value)
  };
  function getCookie(name) {
    let dc = document.cookie;
    let prefix = name + '=';
    let begin = dc.indexOf('; ' + prefix);
    if (begin == -1) {
      begin = dc.indexOf(prefix);
      if (begin != 0) return null;
    } else {
      begin += 2;
      let end = document.cookie.indexOf(';', begin);
      if (end == -1) {
        end = dc.length;
      }
    }

    return decodeURI(dc.substring(begin + prefix.length, end));
  }
  /*
  onMount(async () => {
     if ((navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1)) {
     await start()
     .then()
  if ((/[\u0590-\u05FF]/).test(meData.username) || (/[\u0600-\u06FF]/).test(meData.username)) {
    meData.username = reverseString(meData.username)
    meData = meData
}
  }
   })*/

  function callbackFunction(event) {
    a = 2;
    files = event.files; // files is already a FormData object from the Addnewp component
    console.log(files);
    sendP();
  }

  function remove(event) {
    const miDatanew = event.data;
    const linkp = event.linkp;
    addNs1 = false;
    meData[linkp].data = miDatanew;
    console.log(miDatanew, meData);
    skil = meData.skills.data;
    taf = meData.tafkidims.data;
    val = meData.vallues.data;
    mash = meData.sps.data;
    work = meData.work_ways.data;
    meData = meData;
    addNs1 = true;
  }

  async function add(event) {
    console.log(event);
    const linkp = event.linkp;
    const miDatanew = event.data;
    const valc = event.valc;
    const a = event.a;
    miDatanew.selected2 = [];
    console.log(miDatanew, meData);
    addNs1 = false;
    const meDatanew = meData;
    meDatanew[linkp].data = miDatanew;
    console.log(meDatanew);
    meData = meDatanew;
    skil = meData.skills.data;
    taf = meData.tafkidims.data;
    val = meData.vallues.data;
    mash = meData.sps.data;
    work = meData.work_ways.data;
    meData = meData;
    addNs1 = true;
    console.log(a);
  }

  async function addnew(event) {
    const linkp = event.linkp;
    const skob = event.skob;
    const miDatanew = event.data;
    miDatanew.push(skob);
    addNs1 = false;
    const meDatanew = meData;
    meDatanew[linkp].data = miDatanew;
    console.log(meDatanew);
    meData = meDatanew;
    skil = meData.skills.data;
    taf = meData.tafkidims.data;
    val = meData.vallues.data;
    mash = meData.sps.data;
    work = meData.work_ways.data;
    meData = meData;
    addNs1 = true;
  }
  const closer = () => {
    isOpen = false;
    isOpenM = false;
    updX = 0;
    addpic = 0;
    a = 0;
  };
  function openen() {
    isOpenM = true;
    updX = 1;
    addpic = 1;
  }

  function open(event) {
    addSl1 = false;
    addSl2 = false;
    addSl3 = false;
    addSl4 = false;
    addSl5 = false;
    const a = event.linkp;
    console.log(addSl);
    if (a == 'tafkidims') {
      current = 'a2';
      addSl2 = true;
    } else if (a == 'skills') {
      current = 'a1';
      addSl1 = true;
    } else if (a == 'vallues') {
      current = 'a4';
      addSl4 = true;
    } else if (a == 'mashaabims') {
      current = 'a3';
      addSl3 = true;
    } else if (a == 'workWays') {
      current = 'a5';
      addSl5 = true;
    }
  }

  function close(event) {
    console.log(event);
    const a = event.linkp;

    if (event.list && event.list.selected2 === undefined) {
      event.list.selected2 = [];
    }

    // Safety net against accidental data loss: genuine removals are applied
    // live via remove()/onRemove during editing, so by the time the editor
    // closes an *empty* list against a still-populated relation means a bug
    // upstream (e.g. a stale snapshot). Keep the existing items instead of
    // clearing them. A real "remove all" leaves the relation already empty
    // here, so this guard never blocks legitimate clears.
    const incoming = Array.isArray(event.list) ? event.list : [];
    const existingMap = {
      tafkidims: meData.tafkidims?.data,
      skills: meData.skills?.data,
      vallues: meData.vallues?.data,
      mashaabims: meData.sps?.data,
      workWays: meData.work_ways?.data
    };
    const existing = existingMap[a] ?? [];

    if (incoming.length === 0 && existing.length > 0) {
      console.warn(
        `[me/close] ignored empty list for "${a}" — kept ${existing.length} existing item(s) to avoid wiping the relation`
      );
    } else if (a == 'tafkidims') {
      meData.tafkidims.data = event.list;
    } else if (a == 'skills') {
      meData.skills.data = event.list;
    } else if (a == 'vallues') {
      meData.vallues.data = event.list;
    } else if (a == 'mashaabims') {
      meData.sps.data = event.list;
    } else if (a == 'workWays') {
      meData.work_ways.data = event.list;
    }
    current = 'l';
    meData = meData;
    addSl1 = false;
    addSl2 = false;
    addSl3 = false;
    addSl4 = false;
    addSl5 = false;
  }

  import { RingLoader } from 'svelte-loading-spinners';
  import { toast } from 'svelte-sonner';
  import CrNewProject from '$lib/celim/icons/crNewProject.svelte';
  import { end } from 'happy-dom/lib/PropertySymbol.js';
  import ProfileBadge from '$lib/components/userPr/ProfileBadge.svelte';
  import Diamond from '$lib/components/userPr/Diamond.svelte';
  import OfferingsBadges from '$lib/components/offerings/OfferingsBadges.svelte';
  let mass = $state(false);

  function massss(event) {
    console.log('here');
    if (event.mass == true) {
      mass = true;
    } else if (event.mass == false) {
      mass = false;
    }
  }
  let messege = $state();
  let spid;
  function delm(event) {
    isOpen = true;
    a = 3;
    const nj = event.nj;
    spid = event.id;
    messege =
      $lang == 'he'
        ? `המשאב ${nj} ימחק האם להמשיך?`
        : `the resource ${nj} will be deleted, do you want to continue?`;
  }
  async function han() {
    a = 2;
    const result = await executeAction('archiveUserResource', {
      spId: String(spid)
    });
    if (result.success) {
      // Optimistic local removal for snappy UX; the action's updateStrategy
      // also reloads the profile to reconcile.
      const oldob = meData.sps.data;
      const x = oldob.map((c) => c.id);
      const indexy = x.indexOf(result.data?.id ?? spid);
      if (indexy > -1) oldob.splice(indexy, 1);
      meData.sps.data = oldob;
      meData = meData;
    }
    a = 0;
    isOpen = false;
  }
  //
  $effect(async () => {
    if (page.url.searchParams.has('action')) {
      await tick();
      if (page.url.searchParams.get('action') === 'createproject') {
        const params = page.url.searchParams;
        baciStore.update((s) => ({
          ...s,
          projectName_value: params.get('name') || s.projectName_value,
          desP: params.get('desc') || s.desP,
          desPl: params.get('details') || s.desPl,
          linkP: params.get('url') || s.linkP,
          selected: params.get('vals')
            ? params.get('vals').split(',').filter(Boolean)
            : s.selected,
          restime: params.get('res') || s.restime,
          timeToP: params.get('profit') || s.timeToP,
          ont: params.has('ont') ? params.get('ont') === 'true' : s.ont
        }));
        iwant = false;
        addP = true;
      } else if (page.url.searchParams.get('action') === 'editbasic') {
        // Old deep link into the settings modal — now a real page.
        goto('/me/settings');
      }
    } else if (page.url.searchParams.get('tour') === '1') {
      // Settings page sent us back here to resume the guided tour, whose
      // TourItems only exist on this page.
      await tick();
      await goto('/me', { replaceState: true, noScroll: true, keepFocus: true });
      guid();
    }
  });
  function guid() {
    isG = true;
    run();
  }

  // --- Connectivity ----------------------------------------------------------
  // Profile refresh on socket events is centralized in +layout.svelte (single
  // listener → patches userStore + invalidates 'app:meProfile'), so this page
  // doesn't open its own socket listener. Here we only track connectivity.
  onMount(() => {
    const goOnline = () => {
      online = true;
      invalidateAll(); // refetch fresh data once connectivity returns
    };
    const goOffline = () => {
      online = false;
    };
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    onDestroy(() => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    });
  });  let width = $state(),
    height = $state();
  let showSaveDialog = $state(data.showGuide);




</script>

<svelte:head>
  <title>{$t('pages.me.title')}</title>
</svelte:head>
{#if (!online || data.loadError) && meData}
  <div class="stale-banner" dir="rtl">
    {$lang === 'he'
      ? 'אין חיבור — מוצג מידע שמור'
      : 'No connection — showing saved data'}
  </div>
{/if}
{#if data.loadError && !meData}
  <div class="body grid items-center justify-center text-center" dir="rtl">
    <div>
      <p class="text-barbi">
        {$lang === 'he'
          ? 'נראה שיש בעיה בחיבור, נא לנסות שוב'
          : 'Seems there is a connection problem, please try again'}
      </p>
      <button
        onclick={() => invalidateAll()}
        class="bg-gradient-to-br from-barbi to-mpink text-gold font-bold py-2 px-4 rounded-full mt-2"
      >
        {$t('pages.me.retry')}
      </button>
    </div>
  </div>
{:else if !meData}
  <div class="body button-gold grid items-center justify-center">
    <Lowding height="30vh" />
  </div>
{:else}
  <Dialog
    bind:showSaveDialog
    dialogHeader={$t('me.guide.header')}
    innerText={$t('me.guide.text')}
    innerDialogButton={$t('me.guide.yes')}
    clearButton={$t('me.guide.no')}
    onSaveTimer={async () => {
      showSaveDialog = false;
      // Resume guide → profilManualAlready=false
      await executeAction('toggleGuideStatus', { show: true });
      document.cookie = `guidMe=again; expires=${new Date(2027, 0, 1).toUTCString()}; path=/`;
      run();
    }}
    onClearTimer={async () => {
      showSaveDialog = false;
      isG = true; // Mark as viewed without showing
      // Stop guide → profilManualAlready=true
      await executeAction('toggleGuideStatus', { show: false });
      document.cookie = `guidMe=done; expires=${new Date(2027, 0, 1).toUTCString()}; path=/`;
    }}
  />
  <DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer}>
    <div
      style="z-index: 700;"
      transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}
    >
      <DialogContent aria-label="form" class="content">
        <div
          style="z-index: 400;"
          dir="rtl"
          class="grid items-center justify-center text-center bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"
        >
          <button
            style="margin: 0 auto;"
            class=" hover:bg-barbi text-mturk rounded-full p-2"
            onclick={closer}><Close /></button
          >

          {#if a == 3}
            <div class="grid items-center text-center justify-center">
              <h3 class="text-barbi">{messege}</h3>
              <button
                class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
                onclick={han}>{$t('pages.me.deletew')}</button
              >
            </div>
          {:else if a == 2}
            <div class="sp bg-gold">
              <h3 class="text-barbi">{$t('pages.me.om')}</h3>
              <br />
              <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"
              ></RingLoader>
            </div>
          {/if}
        </div></DialogContent
      >
    </div>
  </DialogOverlay>
  {#if a == 0 && isOpenM}
    <div class="center-upload">
      <Addnewp onMessage={callbackFunction} current={picLink} />
      <button onclick={closer}>{$t('pages.me.cencel')}</button>
    </div>
  {:else if a == 2 && isOpenM}
    <div class="center-upload">
      <h3 class="text-barbi">{$t('pages.me.om')}</h3>
      <br />
      <RingLoader size="40" color="#ff00ae" unit="px" duration="2s"
      ></RingLoader>
    </div>
  {/if}
  {#if addP == false}
    <div class="body me-page-bg transition-colors duration-500">
      <!-- כדורים מרחפים ברקע לסימטריה מלאה -->
      <div class="bg-orb bg-orb-tr"></div>
      <div class="bg-orb bg-orb-bl"></div>

      <!-- הכנסת הקומפוננטה החדשה שלנו -->
      <ProfileBadge
        username={meData.username}
        avatarUrl={picLink != null
          ? picLink
          : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
      >
        <!-- Snippet לכתר (יוזרק למעלה) -->
        {#snippet crownContent()}
          <a data-sveltekit-prefetch target="_self" href="/lev">
            <TourItem message={$t('pages.me.message1')}>
              <img
                title={$t('pages.me.levtitle')}
                class="ceterr name-hover"
                src="https://res.cloudinary.com/love1/image/upload/v1641481504/newC_qq5z3l.svg"
                alt="link to the heart page"
              />
            </TourItem>
          </a>
        {/snippet}

        <!-- Snippet לכפתורים (יוזרקו למטה בצורה סימטרית) -->
        {#snippet buttonsContent()}
          {#if updX == 0 && $uPic}
            <button
              onclick={openen}
              class="hover:bg-gold text-mturk hover:text-barbi rounded-full"
              title={$t('pages.me.message7')}
            >
              <TourItem message={$t('pages.me.message7')}>
                <svg style="width:32px;height:32px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.7 14.3L21.7 15.3L19.7 13.3L20.7 12.3C20.8 12.2 20.9 12.1 21.1 12.1C21.2 12.1 21.4 12.2 21.5 12.3L22.8 13.6C22.9 13.8 22.9 14.1 22.7 14.3M13 19.9V22H15.1L21.2 15.9L19.2 13.9L13 19.9M11.21 15.83L9.25 13.47L6.5 17H13.12L15.66 14.55L13.96 12.29L11.21 15.83M11 19.9V19.05L11.05 19H5V5H19V11.31L21 9.38V5C21 3.9 20.11 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.11 3.9 21 5 21H11V19.9Z"
                  />
                </svg>
              </TourItem>
            </button>
          {/if}

          {#if a == 0}
            <a
              href="/me/settings"
              data-sveltekit-prefetch
              title={$t('pages.me.editbas')}
              class="hover:bg-gold text-mturk hover:text-barbi rounded-full"
            >
              <TourItem message={$t('pages.me.message11')}>
                <svg style="width:32px;height:32px" viewBox="0 0 24 24">
                  <path
                    transition:draw|local={{ duration: 1000 }}
                    fill="currentColor"
                    d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z"
                  />
                </svg>
              </TourItem>
            </a>
          {/if}

          <!-- במקרה שאין תמונה וצריך כפתור העלאה ענק -->
          {#if !$uPic && addpic == 0}
            <button
              onclick={openen}
              class="hover:bg-gold text-mturk hover:text-barbi rounded-full"
              title={$t('pages.me.message8')}
            >
              <TourItem message={$t('pages.me.message8')}>
                <svg style="width:32px;height:32px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M7 19L12 14L13.88 15.88C13.33 16.79 13 17.86 13 19H7M10 10.5C10 9.67 9.33 9 8.5 9S7 9.67 7 10.5 7.67 12 8.5 12 10 11.33 10 10.5M13.09 20H6V4H13V9H18V13.09C18.33 13.04 18.66 13 19 13C19.34 13 19.67 13.04 20 13.09V8L14 2H6C4.89 2 4 2.9 4 4V20C4 21.11 4.89 22 6 22H13.81C13.46 21.39 13.21 20.72 13.09 20M18 15V18H15V20H18V23H20V20H23V18H20V15H18Z"
                  />
                </svg>
              </TourItem>
            </button>
          {/if}
        {/snippet}

        {#snippet diamondContent()}
          <!-- עוטפים את היהלום במדריך (TourItem) ומעבירים אליו את הסכום והכותרת -->
          <TourItem message={$t('pages.me.message10')}>
            <Diamond
              total={total != null ? total : 0}
              title={$t('pages.me.sofartit')}
            />
          </TourItem>
        {/snippet}
      </ProfileBadge>

      <div class="flexi">
        {#if addNs1 == true}
          {#key addSl}
            <div
              class="category-wrapper {current === 'a1'
                ? `selected ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                : ' a1'}"
            >
              <TourItem message={$t('pages.me.message2')}>
                <Edit
                  {width}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl1}
                  meData={odata}
                  {allvn}
                  Valname={$t('pages.me.sk')}
                  valc={'skillName'}
                  bind:data={meData.skills.data}
                  datan={'skil'}
                  linkp={'skills'}
                  kish={'skills'}
                  placeholder={$t('pages.me.pls')}
                />
              </TourItem>
            </div>
            <div
              class="category-wrapper {current === 'a2'
                ? `selected ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                : ' a2'}"
            >
              <TourItem message={$t('pages.me.message3')}>
                <Edit
                  {width}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl2}
                  meData={odata}
                  {allvn}
                  Valname={$t('pages.me.rl')}
                  valc={'roleDescription'}
                  bgi={'pink'}
                  bind:data={meData.tafkidims.data}
                  datan={'taf'}
                  linkp={'tafkidims'}
                  kish={'tafkidims'}
                  placeholder={$t('pages.me.plt')}
                />
              </TourItem>
            </div>
            <TourItem message={$t('pages.me.message4')}>
              <div
                id="my-resources"
                class="category-wrapper {current === 'a3' && mass !== true
                  ? `selected ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                  : ''}"
                class:a3={current !== 'a3'}
                class:whole={mass === true}
              >
                <Edit
                  {width}
                  onDelm={delm}
                  onMassss={massss}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl3}
                  meData={odata}
                  {allvn}
                  bgi={'indigo'}
                  Valname={$t('pages.me.ms')}
                  valc={'name'}
                  bind:data={meData.sps.data}
                  datan={'mash'}
                  linkp={'mashaabims'}
                  kish={'sps'}
                  placeholder={$t('pages.me.plm')}
                />
              </div>
            </TourItem>

            <div
              class="category-wrapper {current === 'a4'
                ? `selectedl ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                : ' a4'}"
            >
              <TourItem message={$t('pages.me.message5')}>
                <Edit
                  {width}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl4}
                  meData={odata}
                  {allvn}
                  Valname={$t('pages.me.valuesLabel')}
                  bgi={'gold'}
                  valc={'valueName'}
                  bind:data={meData.vallues.data}
                  datan={'val'}
                  linkp={'vallues'}
                  kish={'vallues'}
                  placeholder={$t('pages.me.plv')}
                />
              </TourItem>
            </div>
            <TourItem message={$t('pages.me.message6')}>
              <div
                class="category-wrapper {current === 'a5'
                  ? `selectedl ${isMobileOrTablet ? 'h-[calc(100vh-3rem)]' : 'h-screen'}`
                  : ' a5'}"
              >
                <Edit
                  {width}
                  onAddnew={addnew}
                  onClose={close}
                  onRemove={remove}
                  onOpen={open}
                  onAdd={add}
                  addSl={addSl5}
                  meData={odata}
                  {allvn}
                  Valname={$t('pages.me.ww')}
                  bgi={'yellow'}
                  valc={'workWayName'}
                  bind:data={meData.work_ways.data}
                  datan={'work'}
                  linkp={'workWays'}
                  kish={'work_ways'}
                  placeholder={$t('pages.me.plw')}
                />
              </div>
            </TourItem>
          {/key}
        {/if}
        <!-- או גלילה לעשות רינדור עד מקסימום מסויים  של תפקידים כישורים וכו'ואז ההמשך בהרחבה של זה-->
        <!-- ההיצע שלי (PLAN_USER_OFFERINGS §4.1, קומפקטי): אייקון + מונה + פלוס.
             ההרחבות: מוצרים → /deals/sales-center, משימות → /me/offerings -->
        <div id="my-mission-offers" class="w-full px-2">
          <div id="my-products"></div>
          <OfferingsBadges uid={data.uid} />
        </div>
        <div class="a6">
          <TourItem message={$t('pages.me.message9')}>
            <div
              in:fly|local={{ x: -(width / 2), opacity: 0.5 }}
              out:scale|local={{ opacity: 0.5, start: 0.1 }}
              class="another"
              dir="rtl"
            >
              <h2 class="cot">{$t('pages.me.myfr')}</h2>
              {#if load == false}
                <div class="inner-scroll d pro">
                  {#each meData.projects_1s.data as data, i}
                    <div class="cont">
                      <button
                        onclick={() => project(data.id)}
                        class="pt drop-shadow-lg"
                      >
                        <div
                          class="cont inline-flex items-center sm:text-xl mt-1 mr-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-gradient-to-br from-mpink via-transparent via-lpink to-barbi"
                        >
                          {data.attributes.projectName}<span
                            style="margin-top: 2px ;"
                            ><Arrow
                              width={width > 640 ? 47.4 : 23.7}
                              height={width > 640 ? 35.7 : 17.85}
                            /></span
                          >
                        </div></button
                      >
                    </div>
                  {/each}
                </div>
              {:else}
                <Lowding height="50px" width="50px" />
              {/if}

              <button
                aria-label={$t('pages.me.crnfr')}
                style="z-index: 7;"
                class=" hover:scale-150"
                onclick={() => {
                  iwant = false;
                  addP = true;
                }}
                title={$t('pages.me.crnfr')}
              >
                <CrNewProject />
              </button>
            </div>
          </TourItem>
        </div>
        <TourItem message={$t('pages.me.message12')}>
          <div class="footer-tour-anchor" aria-hidden="true"></div>
        </TourItem>
      </div>
    </div>
  {:else if addP == true}
    <button
      title={$t('pages.me.cencel')}
      onclick={() => (addP = false)}
      style="margin: 0 auto;"
      class=" hover:bg-barbi text-barbi hover:text-gold font-bold p-0.5 rounded-full"
      ><Close /></button
    >
    <Addnew userName_value={meData.username} />
  {/if}
  <!-- המשימות שסיימתי-->
{/if}

<style>
  .stale-banner {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 800;
    text-align: center;
    padding: 0.35rem 0.5rem;
    font-size: 0.85rem;
    background: var(--gold, #d4af37);
    color: #3b2f00;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .center-upload {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9;
    background: white;
    border-radius: 1em;
    box-shadow: 0 0 20px #0002;
    padding: 2em;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .pro {
    max-height: 15vh;
    overflow-y: scroll;
    overflow-x: hidden;
  }

  :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
    width: 80vw;
    padding: 0px;
  }
  .whole {
    position: absolute;
    top: 0;
    left: 0;
    min-width: 99.9vw;
    min-height: 100vh;
    z-index: 100;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438541/4nd_w3gv33.svg);
    background-repeat: no-repeat;
    background-size: cover;
  }

  .n {
    cursor:
      url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg),
      auto;
  }

  .n:hover:before {
    transform: scale(1.2);
    box-shadow: 0 0 15px #d35400;
    filter: blur(3px);
  }

  .n:hover {
    color: #ffa502;
    box-shadow: 0 0 15px #d35400;
    text-shadow: 0 0 15px #d35400;
  }
  .cot {
    color: var(--barbi-pink);
    margin: 0 auto;
    padding: 0;
    text-shadow: 1px 1px #feeb02;
  }
  .pt {
    color: #9900cd;
    text-shadow: 1px 1px aqua;
    font-size: 13px;
    text-align: start;
  }
  .pt:hover {
    color: #574010;
    text-shadow: 1px 1px var(--gold);
  }
  .cont {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    max-width: 100%;
    word-break: break-word;
  }
  .cont > span {
    display: none;
    transition: all 0.5;
  }
  .cont:hover > span {
    display: inline;
  }
  .sp {
    display: grid;
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 528px) {
    :global([data-svelte-dialog-overlay].content) {
      z-index: 700;
      width: 80vw;
    }
    .cont {
      white-space: none;
      line-height: 1;
      font-size: 13px;
    }
    .sv {
      width: 8px;
      height: 8px;
    }
    .cot {
      font-size: 10px;
    }
    .pt {
      font-size: 13px;
    }
    .pro {
      max-height: 15vh;
      overflow-y: scroll;
      overflow-x: hidden;
    }
    .another {
      max-height: 25vh;
      min-height: 25vh;
      max-width: 27vw;
      min-width: 27vw;
    }
  }

  .ceterr {
    height: 12vh;
    width: auto;
    margin: 0 auto;
  }

  @media (min-width: 529px) {
    .d::-webkit-scrollbar {
      width: 12px;
    }

    .sv {
      width: 13px;
      height: 13px;
    }
    .cot {
      font-size: 17px;
    }
    .pt {
      font-size: 13px;
    }
  }
  @media (min-width: 892px) {
    :global([data-svelte-dialog-overlay].content) {
      z-index: 700;
      width: 50vw;
    }
  }
  @media (min-height: 500px) {
    .ceterr {
      height: 12vh;
      width: auto;
      margin: 0 auto;
    }
  }

  @media (min-height: 500px) and (min-width: 520px) {
    .ceterr {
      height: 10vh;
      width: auto;
      margin: 0 auto;
    }
  }

  :global([data-svelte-dialog-content].content) {
    padding: 0px;
    margin: auto auto;
  }
  :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
    width: 80vw;
    margin: auto auto;
  }
  :global(data-svelte-dialog-overlay) {
    z-index: 700;
    width: 50vw;
  }
  .a1 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 17%;
    left: 80%;
    overflow: visible;
    transition: all 1s;
  }
  .a2 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 46%;
    left: 86%;
    overflow: visible;
  }
  .a3 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 76%;
    left: 80%;
    overflow: visible;
  }
  .a6 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 17%;
    left: 20%;
    overflow: visible;
  }
  #my-mission-offers {
    position: relative;
    z-index: 10;
  }
  .a4 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 46%;
    left: 14%;
    overflow: visible;
  }
  .a5 {
    position: absolute;
    transform: translate(-50%, -50%);
    top: 76%;
    left: 20%;
    overflow: visible;
  }
  @media (min-width: 348px) {
    .a2 {
      left: 80%;
    }
    .a4 {
      left: 20%;
    }
  }
  .selected {
    z-index: 77;

    position: fixed;
    top: 0;
    right: 0;
    padding: 2rem 8px 0.6rem;
    border-left: 1px solid #aaa;
    overflow-y: auto;
    overflow-x: auto;
    width: 230px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438541/4nd_w3gv33.svg);
    background-position: right center;
    background-repeat: no-repeat;
    background-size: cover;
  }
  .selectedl {
    z-index: 77;
    background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438541/4nd_w3gv33.svg);
    background-position: left center;
    background-repeat: no-repeat;
    background-size: cover;
    position: fixed;
    top: 0;
    left: 0;
    padding: 5rem 1rem 0.6rem;
    overflow-y: scroll;
    overflow-x: auto;

    width: 17rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  @media (min-width: 720px) {
    .selected,
    .selectedl {
      width: 30vw;
    }
  }

  .body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    padding-bottom: 10vh;
  }

  .me-page-bg {
    position: relative;
    overflow: hidden;
    background: radial-gradient(
      circle at bottom center,
      var(--gold) 0%,
      #fdfbfb 70%
    );
    transition: background 0.5s ease;
  }

  :global(.dark) .me-page-bg {
    background: radial-gradient(
      circle at bottom center,
      rgba(212, 175, 55, 0.15) 0%,
      #0f172a 70%
    );
  }

  /* כדורים מרחפים ברקע למראה פרימיום */
  /* ::before = פינה שמאל-עליון (ורוד), ::after = פינה ימין-תחתון (זהב) */
  .me-page-bg::before,
  .me-page-bg::after {
    content: '';
    position: absolute;
    width: 60vw;
    height: 60vw;
    border-radius: 50%;
    filter: blur(40px);
    z-index: 1;
    opacity: 0.6;
    pointer-events: none;
    animation: orb-float 25s infinite alternate ease-in-out;
  }

  /* פינה שמאל-עליון */
  .me-page-bg::before {
    background: radial-gradient(
      circle,
      var(--barbi-pink, #ff0092) 0%,
      transparent 20%
    );
    top: -20%;
    left: -15%;
  }

  /* פינה ימין-תחתון — מקביל לשמאל-עליון */
  .me-page-bg::after {
    background: radial-gradient(
      circle,
      var(--barbi-pink, #ff0092) 0%,
      transparent 20%
    );
    bottom: -20%;
    right: -15%;
  }

  /* כדורים סימטריים נוספים: ימין-עליון ושמאל-תחתון */
  .bg-orb {
    position: absolute;
    width: 50vw;
    height: 50vw;
    border-radius: 50%;
    filter: blur(40px);
    z-index: 1;
    opacity: 0.5;
    pointer-events: none;
  }

  /* פינה ימין-עליון */
  .bg-orb-tr {
    background: radial-gradient(
      circle,
      hsla(210, 100%, 65%, 0.8) 0%,
      transparent 60%
    );
    top: -15%;
    right: -10%;
    animation: orb-float 28s infinite alternate ease-in-out;
    animation-delay: -6s;
  }

  /* פינה שמאל-תחתון — מקביל לימין-עליון */
  .bg-orb-bl {
    background: radial-gradient(
      circle,
      hsla(280, 100%, 65%, 0.7) 0%,
      transparent 60%
    );
    bottom: -15%;
    left: -10%;
    animation: orb-float 30s infinite alternate-reverse ease-in-out;
    animation-delay: -18s;
  }

  @keyframes orb-float {
    0% {
      transform: translate(0, 0) scale(1) rotate(0deg);
    }
    33% {
      transform: translate(15%, 15%) scale(1.15) rotate(10deg);
    }
    66% {
      transform: translate(-10%, 15%) scale(0.85) rotate(-10deg);
    }
    100% {
      transform: translate(10%, -10%) scale(1.05) rotate(5deg);
    }
  }

  /* שיפור למכלים שיהיו Glassmorphic */
  .another {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  }

  :global(.dark) .another {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .another {
    padding: 0.6em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    z-index: -1;
    height: 28vh;
    width: 27vw;
    overflow: visible;
  }

  .inner-scroll {
    max-height: 20vh;
    width: 100%;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .cot {
    color: var(--barbi-pink);
    margin-top: 0.2em;
    margin-bottom: 0.2em;
    padding: 0;
    text-shadow: 1px 1px #feeb02;
    line-height: 1.1;
  }

  .by {
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: 'Anonymous Pro', 'Monospace';
    font-size: 30px;
  }

  @-moz-keyframes spin {
    100% {
      -moz-transform: rotate(360deg);
    }
  }
  @-webkit-keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
    }
  }
  @keyframes spin {
    100% {
      -webkit-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

  .footer-tour-anchor {
    position: fixed;
    bottom: 3rem;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 1px;
    pointer-events: none;
  }
</style>
