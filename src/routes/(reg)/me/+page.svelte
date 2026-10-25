<script>
  import Dialog from '$lib/celim/ui/dialog.svelte';
  import { page } from '$app/state';
  import { liUN } from '$lib/stores/liUN.js';
  import Close from '$lib/celim/close.svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
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
  /** The creation form was opened prefilled from an assistant draft. */
  let baciDrafted = $state(false);
  /** Leave the creation form — and drop ?action=createproject, or a refresh would reopen it. */
  function closeCreate() {
    addP = false;
    if (page.url.searchParams.has('action')) {
      goto('/me', { replaceState: true, noScroll: true, keepFocus: true });
    }
  }
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
        `[me/close] ignored empty list for "${a}" - kept ${existing.length} existing item(s) to avoid wiping the relation`
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

  import { toast } from 'svelte-sonner';
  import { decodeProjectDraft, sanitizeProjectDraft } from '$lib/prefill/projectDraft';
  import ProfileBadge from '$lib/components/userPr/ProfileBadge.svelte';
  import Diamond from '$lib/components/userPr/Diamond.svelte';
  import MeOrb from '$lib/components/me/MeOrb.svelte';
  import CreateProductFlow from '$lib/components/offerings/CreateProductFlow.svelte';
  import { layoutOrbit } from '$lib/me/orbitLayout';
  import { readOfferings } from '$lib/offerings/counts.js';
  import CrNewProject from '$lib/celim/icons/crNewProject.svelte';
  import Grow from '$lib/celim/icons/grow.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { isRtl } from '$lib/translations';
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
        // An agent-prepared form arrives as one opaque `draft` (see
        // $lib/prefill/projectDraft.ts). The per-field params below are older
        // links: a URL decoded once on its way here silently loses everything
        // after the first `&` inside `details`, so never go back to them.
        const draft = params.has('draft')
          ? await decodeProjectDraft(params.get('draft'))
          : sanitizeProjectDraft({
              name: params.get('name'),
              desc: params.get('desc'),
              details: params.get('details'),
              url: params.get('url'),
              vals: params.get('vals')?.split(','),
              res: params.get('res'),
              profit: params.get('profit'),
              ont: params.has('ont') ? params.get('ont') === 'true' : undefined
            });
        if (draft) {
          baciStore.update((s) => ({
            ...s,
            projectName_value: draft.name,
            desP: draft.desc ?? s.desP,
            desPl: draft.details ?? s.desPl,
            linkP: draft.url ?? s.linkP,
            selected: draft.vals ?? s.selected,
            restime: draft.res ?? s.restime,
            timeToP: draft.profit ?? s.timeToP,
            ont: draft.ont ?? s.ont
          }));
          baciDrafted = true;
        } else if (params.has('draft')) {
          // Opening an empty form as if it were the prepared one is exactly the
          // silent loss this replaced — say so.
          toast.error($t('pages.me.draftUnreadable'), { duration: 12000 });
        }
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
      await goto('/me', {
        replaceState: true,
        noScroll: true,
        keepFocus: true
      });
      guid();
    }
  });
  // `/me#my-resources` (the demand sheet's "add a resource") means "add to my
  // resources", not "scroll to them": the orbit never scrolls, so the anchor
  // alone can do nothing. Open the resources editor instead.
  let handledHash = '';
  $effect(() => {
    const hash = page.url.hash;
    const editor = editors.mashaabims;
    if (hash === handledHash || !editor) return;
    handledHash = hash;
    if (hash === '#my-resources') editor.open();
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
  });
  // --- The orbit -------------------------------------------------------------
  // Everything the member has orbits the badge as one large circle each — see
  // $lib/me/orbitLayout.ts for where they go and when they stack instead.
  let vw = $state(0);
  let vh = $state(0);
  /** The footer bar's height in px, which the bar publishes as `--foot-h`. */
  let footPx = $state(0);
  // Edit animates its panel in from the side by half the screen width.
  let width = $derived(vw);

  function readFootH() {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue('--foot-h')
      .trim();
    const n = parseFloat(raw) || 0;
    return raw.endsWith('rem')
      ? n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
      : n;
  }
  onMount(() => {
    footPx = readFootH();
    // The bar sets `--foot-h` from its own effect, which may run after ours,
    // and changes it when the member switches bar modes.
    const mo = new MutationObserver(() => (footPx = readFootH()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    return () => mo.disconnect();
  });

  /**
   * Products / missions / done / open acts, and the items behind them — null
   * until they arrive. Read after the page is up, never in the load: the
   * circles render their counts as "…" meanwhile.
   * @type {import('$lib/offerings/counts.js').Offerings | null}
   */
  let counts = $state(null);
  let creatingProduct = $state(false);
  async function loadCounts() {
    try {
      const res = await sendToSer(
        { uid: String(data.uid) },
        '276myOfferingsViaUser',
        0,
        0,
        false,
        fetch
      );
      counts = readOfferings(res?.data?.usersPermissionsUser?.data?.attributes);
    } catch (e) {
      console.warn('me: offering counts failed', e);
      counts = readOfferings(null);
    }
  }
  onMount(() => {
    loadCounts();
    // Deep link from AddSupplySheet: /me?createProduct=1 opens the flow.
    if (page.url.searchParams.get('createProduct') === '1') creatingProduct = true;
  });

  /** The concierge summary's links: the one draft, or the wish that moved. */
  let draftsHref = $derived(
    data.concierge?.onlyDraftId
      ? `/concierge/new?draft=${data.concierge.onlyDraftId}`
      : '/concierge?tab=drafts'
  );
  let updatesHref = $derived(
    data.concierge?.updatesWishId ? `/concierge/${data.concierge.updatesWishId}` : '/concierge'
  );

  /**
   * The Edit instances, opened from their circle's edit button.
   * @type {Record<string, { open: () => void, cancel: () => void }>}
   */
  let editors = $state({});
  /** An editor's side panel is open — the orbit steps back behind it. */
  let editing = $derived(['a1', 'a2', 'a3', 'a4', 'a5'].includes(current));
  /** Which editor each panel state belongs to, and the colour of its circle. */
  const EDITOR_OF = {
    a1: { key: 'skills', accent: '#16a34a' },
    a2: { key: 'tafkidims', accent: '#db2777' },
    a3: { key: 'mashaabims', accent: '#4f46e5' },
    a4: { key: 'vallues', accent: '#ca8a04' },
    a5: { key: 'workWays', accent: '#0d9488' }
  };
  /** Close the open editor the way its own cancel button does. */
  function closeEditor() {
    editors[EDITOR_OF[current]?.key]?.cancel();
  }

  /**
   * The circles, in reading order: what the member is *doing* first (rikmas,
   * missions, acts, products, concierge), then who they *are* (skills, roles,
   * resources, values, ways of working). Someone who came only to order
   * something gets the concierge first — the rest of their profile is empty.
   */
  let orbs = $derived.by(() => {
    const doing = [
      { key: 'rikmas', title: $t('pages.me.myfr'), accent: '#e6007e', icon: '🧶', count: meData?.projects_1s?.data?.length ?? 0, tour: $t('pages.me.message9'), body: rikmasOrb, actions: rikmasActions },
      { key: 'missions', title: $t('me.orbit.missions'), accent: '#7c3aed', icon: '🛠️', href: '/me/offerings', count: counts?.missions ?? null, tour: $t('me.orbit.missionsTour'), body: missionsOrb, actions: missionsActions },
      { key: 'acts', title: $t('me.orbit.acts'), accent: '#0284c7', icon: '✅', href: '/myacts', count: counts?.acts ?? null, tour: $t('me.orbit.actsTour'), body: actsOrb, actions: actsActions },
      { key: 'products', title: $t('me.orbit.products'), accent: '#ea580c', icon: '🎁', href: '/deals/sales-center', count: counts?.products ?? null, tour: $t('me.orbit.productsTour'), body: productsOrb, actions: productsActions },
      { key: 'concierge', title: $t('me.concierge.title'), accent: '#b38728', icon: '🛎️', href: '/concierge', tour: $t('me.orbit.conciergeTour'), body: conciergeOrb, actions: conciergeActions }
    ];
    if (isConciergeCustomer) doing.unshift(...doing.splice(4, 1));
    const cat = (key, title, accent, icon, list, tour, editor) => ({
      key,
      title: $t('pages.editPic.myThing', { name: title }),
      accent,
      icon,
      count: list?.length ?? 0,
      tour,
      body: categoryOrb,
      actions: categoryActions,
      list,
      editor
    });
    return [
      ...doing,
      cat('skills', $t('pages.me.sk'), '#16a34a', '🧠', meData?.skills?.data, $t('pages.me.message2'), 'skills'),
      cat('roles', $t('pages.me.rl'), '#db2777', '🎭', meData?.tafkidims?.data, $t('pages.me.message3'), 'tafkidims'),
      cat('resources', $t('pages.me.ms'), '#4f46e5', '🧰', meData?.sps?.data, $t('pages.me.message4'), 'mashaabims'),
      cat('values', $t('pages.me.valuesLabel'), '#ca8a04', '💛', meData?.vallues?.data, $t('pages.me.message5'), 'vallues'),
      cat('workways', $t('pages.me.ww'), '#0d9488', '🌿', meData?.work_ways?.data, $t('pages.me.message6'), 'workWays')
    ];
  });
  /** Which attribute holds each category item's name. */
  const CATEGORY_FIELD = {
    skills: 'skillName',
    roles: 'roleDescription',
    resources: 'name',
    values: 'valueName',
    workways: 'workWayName'
  };

  let layout = $derived(
    layoutOrbit({
      width: vw,
      height: vh,
      reserveBottom: footPx,
      count: orbs.length,
      rtl: $isRtl
    })
  );
  let orbit = $derived(layout.mode === 'orbit' ? layout : null);

  /**
   * Someone who came to order through the concierge and has not (yet) joined
   * anything: no rikma, no skills, no roles, but wishes. For them the tour of
   * roles/skills/resources is noise and the concierge badge is the way in.
   * @param {any} d page data
   */
  function conciergeCustomerOf(d) {
    const m = d?.meData;
    return (
      (d?.concierge?.total ?? 0) > 0 &&
      !(m?.projects_1s?.data?.length ?? 0) &&
      !(m?.skills?.data?.length ?? 0) &&
      !(m?.tafkidims?.data?.length ?? 0)
    );
  }
  let isConciergeCustomer = $derived(conciergeCustomerOf(data));
  let showSaveDialog = $state(data.showGuide && !conciergeCustomerOf(data));
</script>

<svelte:head>
  <title>{$t('pages.me.title')}</title>
</svelte:head>
<svelte:window
  bind:innerWidth={vw}
  bind:innerHeight={vh}
  onkeydown={(e) => {
    if (e.key === 'Escape' && editing && !mass) closeEditor();
  }}
/>

<!-- ── what each circle holds ─────────────────────────────────────────────── -->
{#snippet editIcon()}
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
    />
  </svg>
{/snippet}

{#snippet plusIcon()}
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
  </svg>
{/snippet}

{#snippet categoryOrb(orb)}
  {#if orb.list?.length}
    {#each orb.list as item (item.id)}
      {#if orb.key === 'resources'}
        <!-- A resource says where it stands — out in a rikma or free to offer —
             and opens its own calendar, the same two facts the editor shows. -->
        {@const invested = item.attributes?.panui === false}
        <a
          class="orb-chip link"
          class:muted={invested}
          href="/me/resources?sp={item.id}"
          dir="auto"
          title={invested ? $t('pages.editPic.onin') : $t('me.orbit.available')}
        >
          {#if invested}
            <Grow width={14} height={14} />
          {:else}
            <span class="free-dot" aria-hidden="true"></span>
          {/if}
          <span>{item.attributes?.name}</span>
          <span class="sr-only">· {invested ? $t('pages.editPic.onin') : $t('me.orbit.available')}</span>
        </a>
      {:else}
        <span class="orb-chip" dir="auto">{item.attributes?.[CATEGORY_FIELD[orb.key]]}</span>
      {/if}
    {/each}
  {:else}
    <p class="orb-empty">{$t('me.orbit.empty')}</p>
  {/if}
{/snippet}
{#snippet categoryActions(orb)}
  <button
    type="button"
    class="orb-btn"
    title={$t('pages.editPic.edito')}
    aria-label={`${$t('pages.editPic.edito')} · ${orb.title}`}
    onclick={() => editors[orb.editor]?.open()}
  >
    {@render editIcon()}
  </button>
{/snippet}

{#snippet rikmasOrb()}
  {#if meData?.projects_1s?.data?.length}
    {#each meData.projects_1s.data as rikma (rikma.id)}
      <a class="orb-chip link" href="/moach/{rikma.id}" dir="auto" data-sveltekit-preload-data
        >{rikma.attributes.projectName}</a
      >
    {/each}
  {:else}
    <p class="orb-empty">{$t('me.orbit.emptyRikmas')}</p>
  {/if}
{/snippet}
{#snippet rikmasActions()}
  <!-- The lamp, with its heart cursor — the way a new rikma has always been
       started here. -->
  <button
    type="button"
    class="new-rikma"
    title={$t('pages.me.crnfr')}
    aria-label={$t('pages.me.crnfr')}
    onclick={() => {
      iwant = false;
      addP = true;
    }}
  >
    <CrNewProject />
  </button>
{/snippet}

{#snippet loadingStat()}
  <p class="orb-stat">…</p>
{/snippet}

{#snippet missionsOrb()}
  {#if !counts}
    {@render loadingStat()}
  {:else if counts.doing.length || counts.offers.length}
    {#each counts.doing as m (m.id)}
      <a
        class="orb-chip link"
        href={m.projectId ? `/moach/${m.projectId}/progress/${m.id}` : '/me/offerings'}
        dir="auto"
        title={$t('me.orbit.inProgress')}>⏳ {m.name}</a
      >
    {/each}
    {#each counts.offers as o (o.id)}
      <a class="orb-chip link muted" href="/me/offerings" dir="auto" title={$t('me.orbit.offered')}
        >{o.name}</a
      >
    {/each}
    {#if counts.done}
      <span class="orb-chip" title={$t('offerings.badges.done_tip')}
        >✓ {$t('me.orbit.done', { count: counts.done })}</span
      >
    {/if}
  {:else}
    <p class="orb-empty">{$t('me.orbit.emptyMissions')}</p>
  {/if}
{/snippet}
{#snippet missionsActions()}
  <a
    class="orb-btn"
    href="/timers"
    title={$t('me.orbit.toTimers')}
    aria-label={$t('me.orbit.toTimers')}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15,1H9V3H15M11,14H13V8H11M19.03,7.39L20.45,5.97C20,5.46 19.55,5 19.04,4.56L17.62,6C16.07,4.74 14.12,4 12,4A9,9 0 0,0 3,13A9,9 0 0,0 12,22C17,22 21,17.97 21,13C21,10.88 20.26,8.93 19.03,7.39M12,20A7,7 0 0,1 5,13A7,7 0 0,1 12,6A7,7 0 0,1 19,13A7,7 0 0,1 12,20Z"
      />
    </svg>
  </a>
  <a
    class="orb-btn"
    href="/me/offerings?new=1"
    title={$t('offerings.badges.add_mission')}
    aria-label={$t('offerings.badges.add_mission')}>{@render plusIcon()}</a
  >
{/snippet}

{#snippet actsOrb()}
  {#if !counts}
    {@render loadingStat()}
  {:else if counts.openActs.length}
    {#each counts.openActs as act (act.id)}
      <a
        class="orb-chip link"
        href={act.projectId ? `/moach/${act.projectId}/acts` : '/myacts'}
        dir="auto">{act.name}</a
      >
    {/each}
  {:else}
    <p class="orb-empty">{$t('me.orbit.emptyActs')}</p>
  {/if}
{/snippet}
{#snippet actsActions()}
  <a class="orb-link" href="/myacts">{$t('me.orbit.actsOpen')}</a>
{/snippet}

{#snippet productsOrb()}
  {#if !counts}
    {@render loadingStat()}
  {:else if counts.productList.length}
    {#each counts.productList as product (product.id)}
      <a
        class="orb-chip link"
        href={product.projectId
          ? `/moach/${product.projectId}/sales/manage/products`
          : '/deals/sales-center'}
        dir="auto">{product.name || '—'}</a
      >
    {/each}
  {:else}
    <p class="orb-empty">{$t('me.orbit.emptyProducts')}</p>
  {/if}
{/snippet}
{#snippet productsActions()}
  <button
    type="button"
    class="orb-btn"
    title={$t('offerings.badges.add_product')}
    aria-label={$t('offerings.badges.add_product')}
    onclick={() => (creatingProduct = true)}>{@render plusIcon()}</button
  >
{/snippet}

{#snippet conciergeOrb()}
  {@const c = data.concierge}
  {#if c?.total > 0}
    {#if c.updates > 0}
      <a
        class="orb-chip link hot"
        href={updatesHref}
        title={$t('me.concierge.updatesTip', { count: c.updates })}
        ><b>{c.updates}</b> {$t('me.concierge.updates')}</a
      >
    {/if}
    {#if c.drafts > 0}
      <a
        class="orb-chip link"
        href={draftsHref}
        title={$t('me.concierge.draftsTip', { count: c.drafts })}
        ><b>{c.drafts}</b> {$t('me.concierge.drafts')}</a
      >
    {/if}
    {#if c.ordered > 0}
      <a
        class="orb-chip link"
        href="/concierge"
        title={$t('me.concierge.orderedTip', { count: c.ordered })}
        ><b>{c.ordered}</b> {$t('me.concierge.ordered')}</a
      >
    {/if}
    {#if isConciergeCustomer}
      <p class="orb-empty">{$t('me.concierge.customerHint')}</p>
    {/if}
  {:else}
    <p class="orb-empty">{$t('me.orbit.conciergeEmpty')}</p>
  {/if}
{/snippet}
{#snippet conciergeActions()}
  <a
    class="orb-btn"
    href="/concierge/new"
    title={$t('me.concierge.newWish')}
    aria-label={$t('me.concierge.newWish')}>{@render plusIcon()}</a
  >
{/snippet}
{#if (!online || data.loadError) && meData}
  <div class="stale-banner" dir="rtl">
    {$lang === 'he'
      ? 'אין חיבור - מוצג מידע שמור'
      : 'No connection - showing saved data'}
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
    <Spinner size="lg" />
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
              <Spinner size="lg" />
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
      <Spinner />
    </div>
  {/if}
  {#if addP == false}
    <div class="me-page-bg transition-colors duration-500" class:stack={!orbit}>
      <!-- כדורים מרחפים ברקע לסימטריה מלאה -->
      <div class="bg-orb bg-orb-tr"></div>
      <div class="bg-orb bg-orb-bl"></div>

      <div
        class="me-field"
        class:ready={vw > 0}
        class:editing={editing}
        inert={editing}
        style:height={orbit ? `${vh}px` : null}
      >
        <div
          class="me-center"
          style={orbit
            ? `left:${orbit.center.x}px;top:${orbit.center.y}px;width:${orbit.center.w}px;height:${orbit.center.h}px`
            : null}
        >
          <ProfileBadge
            contained
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

            <!-- תמונה + הגדרות, עם מילים: אייקון עיפרון לבד לא אמר לאף אחד "הגדרות" -->
            {#snippet buttonsContent()}
              {#if updX == 0 && addpic == 0}
                <TourItem message={$uPic ? $t('pages.me.message7') : $t('pages.me.message8')}>
                  <button
                    type="button"
                    onclick={openen}
                    class="badge-pill"
                    title={$uPic ? $t('pages.me.message7') : $t('pages.me.message8')}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M4,4H7L9,2H15L17,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7M12,9A3,3 0 0,1 15,12A3,3 0 0,1 12,15A3,3 0 0,1 9,12A3,3 0 0,1 12,9Z"
                      />
                    </svg>
                    {$t('me.orbit.photo')}
                  </button>
                </TourItem>
              {/if}
              {#if a == 0}
                <TourItem message={$t('pages.me.message11')}>
                  <a
                    href="/me/settings"
                    data-sveltekit-prefetch
                    title={$t('pages.me.editbas')}
                    class="badge-pill"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
                      />
                    </svg>
                    {$t('me.orbit.settings')}
                  </a>
                </TourItem>
              {/if}
            {/snippet}

            {#snippet diamondContent()}
              <!-- היהלום כבר מציג "סך הכל הרווחתי", ולכן הוא גם הכניסה הטבעית
                   לעמוד שמפרק את המספר הזה לאורך זמן ולפי רקמה. -->
              <a href="/me/income" data-sveltekit-prefetch title={$t('me.income.title')}>
                <TourItem message={$t('pages.me.message10')}>
                  <Diamond total={total != null ? total : 0} title={$t('pages.me.sofartit')} />
                </TourItem>
              </a>
            {/snippet}
          </ProfileBadge>
        </div>

        <div class="me-orbs">
          {#each orbs as orb, i (orb.key)}
            {@const p = orbit?.orbs[i]}
            <div
              class="me-orb-slot"
              id={orb.key === 'resources' ? 'my-resources' : undefined}
              style:--i={i}
              style={p
                ? `left:${p.x - orbit.size / 2}px;top:${p.y - orbit.size / 2}px;width:${orbit.size}px`
                : null}
            >
              <TourItem message={orb.tour}>
                <MeOrb
                  title={orb.title}
                  accent={orb.accent}
                  icon={orb.icon}
                  href={orb.href}
                  count={orb.count}
                >
                  {@render orb.body(orb)}
                  {#snippet actions()}
                    {@render orb.actions(orb)}
                  {/snippet}
                </MeOrb>
              </TourItem>
            </div>
          {/each}
        </div>
      </div>

      <!-- העורכים: כפתור העריכה בעיגול מגדיל אותו לעיגול גדול באמצע המסך ובו
           העורך. כשהם סגורים הם לא מציירים כלום — את הרשימה מציג העיגול. -->
      {#if editing && !mass}
        <!-- Tapping outside the circle closes it, like its own cancel button. -->
        <button
          type="button"
          class="editor-scrim"
          aria-label={$t('pages.editPic.cencel')}
          onclick={closeEditor}
        ></button>
      {/if}
      {#if addNs1 == true}
        <div
          class="category-wrapper"
          class:editor-orb={current === 'a1'}
          style:--accent={EDITOR_OF.a1.accent}
        >
          <Edit
            bind:this={editors.skills}
            face={false}
            {width}
            onAddnew={addnew}
            onClose={close}
            onRemove={remove}
            onOpen={open}
            bgi={'green'}
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
        </div>
        <div
          class="category-wrapper"
          class:editor-orb={current === 'a2'}
          style:--accent={EDITOR_OF.a2.accent}
        >
          <Edit
            bind:this={editors.tafkidims}
            face={false}
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
        </div>
        <div
          class="category-wrapper"
          class:editor-orb={current === 'a3' && mass !== true}
          style:--accent={EDITOR_OF.a3.accent}
          class:whole={mass === true}
        >
          <Edit
            bind:this={editors.mashaabims}
            face={false}
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
        <div
          class="category-wrapper"
          class:editor-orb={current === 'a4'}
          style:--accent={EDITOR_OF.a4.accent}
        >
          <Edit
            bind:this={editors.vallues}
            face={false}
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
        </div>
        <div
          class="category-wrapper"
          class:editor-orb={current === 'a5'}
          style:--accent={EDITOR_OF.a5.accent}
        >
          <Edit
            bind:this={editors.workWays}
            face={false}
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
      {/if}

      {#if creatingProduct}
        <CreateProductFlow
          uid={data.uid}
          onDone={() => {
            creatingProduct = false;
            loadCounts();
          }}
          onClose={() => (creatingProduct = false)}
        />
      {/if}

      <TourItem message={$t('pages.me.message12')}>
        <div class="footer-tour-anchor" aria-hidden="true"></div>
      </TourItem>
    </div>
  {:else if addP == true}
    <Addnew userName_value={meData.username} drafted={baciDrafted} onBack={closeCreate} />
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

  :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
    width: 80vw;
    padding: 0px;
    margin: auto auto;
  }
  :global([data-svelte-dialog-content].content) {
    padding: 0px;
    margin: auto auto;
  }
  @media (min-width: 892px) {
    :global([data-svelte-dialog-overlay].content) {
      width: 50vw;
    }
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

  .sp {
    display: grid;
    justify-content: center;
    align-items: center;
  }

  /* The crown sits in the badge's SVG, so it is sized in the badge's own
     units and scales with it — a `vh` height here ignored the badge's size. */
  .ceterr {
    height: 92px;
    width: auto;
    margin: 0 auto;
  }

  /* ── the badge's two buttons: a word each, not a bare icon ───────────────
     Inside the SVG's foreignObject, so these px are badge units (500 wide):
     22 units is ~14px on a 320px badge and grows with it. */
  .badge-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 16px 5px 14px;
    border-radius: 999px;
    border: 2px solid var(--gold, #d4af37);
    background: rgba(255, 253, 247, 0.92);
    color: #7a1050;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.2;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(122, 16, 80, 0.18);
    transition: transform 0.15s;
  }
  .badge-pill:hover {
    transform: scale(1.06);
  }
  .badge-pill svg {
    width: 24px;
    height: 24px;
  }
  :global(.dark) .badge-pill {
    background: rgba(20, 28, 46, 0.92);
    color: #ffd7ec;
  }

  /* ── an editor: its circle grows into the middle of the screen ──────────
     The disc follows the theme because the editor's tiles do (Tile is light
     ink on dark only under .dark). It scrolls inside the disc; the mask fades
     the cut so nothing looks sliced by it. */
  .editor-orb {
    /* A circle where the screen allows it; on a short wide screen it widens
       into an ellipse rather than shrinking the editor into a porthole. */
    --editor-h: min(calc(100dvh - var(--foot-h, 0px) - 24px), 640px);
    --editor-w: min(92vw, max(var(--editor-h), calc(var(--editor-h) * 1.5)), 760px);
    position: fixed;
    z-index: 77;
    left: 50%;
    top: calc((100dvh - var(--foot-h, 0px)) / 2);
    translate: -50% -50%;
    width: var(--editor-w);
    height: var(--editor-h);
    border-radius: 50%;
    padding: 9% 15%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: safe center;
    gap: 0.5rem;
    text-align: center;
    overflow-y: auto;
    overflow-x: hidden;
    /* A scrollbar is a straight line on a round edge; the fade says "more". */
    scrollbar-width: none;
    background: radial-gradient(
        circle at 50% 30%,
        color-mix(in srgb, var(--accent) 14%, #fffdf7),
        #fffdf7 72%
      );
    color: #2b2620;
    border: 6px solid color-mix(in srgb, var(--accent) 80%, white);
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.45),
      0 0 60px -10px var(--accent);
    -webkit-mask: linear-gradient(transparent, #000 9%, #000 91%, transparent);
    mask: linear-gradient(transparent, #000 9%, #000 91%, transparent);
    animation: editor-in 0.35s cubic-bezier(0.2, 0.8, 0.3, 1.15) both;
  }
  /* The editor was written for the night-sky panel: white title, gold icons.
     On the light disc those two go to ink. */
  .editor-orb :global(.text-white) {
    color: #2b2620;
  }
  .editor-orb :global(.text-gold) {
    color: #8a6510;
  }
  :global(.dark) .editor-orb {
    background: radial-gradient(
        circle at 50% 30%,
        color-mix(in srgb, var(--accent) 30%, #1b2440),
        #0f172a 72%
      );
    color: #f1ede4;
  }
  :global(.dark) .editor-orb :global(.text-white) {
    color: #fff;
  }
  :global(.dark) .editor-orb :global(.text-gold) {
    color: var(--gold);
  }
  .editor-orb::-webkit-scrollbar {
    display: none;
  }
  /* The editor's own column takes the disc's width, so its pickers do too. */
  .editor-orb > :global(div) {
    width: 100%;
  }
  @keyframes editor-in {
    from {
      scale: 0.35;
      opacity: 0;
    }
  }
  /* A phone is too narrow for a readable disc: the same panel, rounded. */
  @media (max-width: 479px) {
    .editor-orb {
      width: calc(100vw - 24px);
      height: auto;
      max-height: calc(100dvh - var(--foot-h, 0px) - 24px);
      border-radius: 28px;
      padding: 1.25rem 0.9rem;
      justify-content: flex-start;
      -webkit-mask: none;
      mask: none;
    }
  }
  .editor-scrim {
    position: fixed;
    inset: 0;
    z-index: 76;
    background: rgba(15, 23, 42, 0.35);
    cursor: default;
  }

  /* The lamp that starts a new rikma, at the size of a circle's buttons. */
  .new-rikma {
    display: inline-grid;
    place-items: center;
    transition: transform 0.2s;
  }
  .new-rikma:hover {
    transform: scale(1.25);
  }
  .new-rikma :global(svg) {
    width: 2.3em;
    height: 2.3em;
  }

  /* "Free to offer" on a resource chip — a dot, so the invested ones (the
     sprout) are the ones that stand out. */
  .free-dot {
    flex: none;
    width: 0.55em;
    height: 0.55em;
    border-radius: 50%;
    background: #16a34a;
    box-shadow: 0 0 0 2px color-mix(in srgb, #16a34a 25%, transparent);
  }

  .body {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    overflow: clip;
    position: relative;
  }

  .me-page-bg {
    position: relative;
    width: 100%;
    height: 100dvh;
    /* `clip`, not just `hidden`: an `overflow:hidden` box is still a scroll
       container, so a scrollIntoView() inside it — a `/me#my-resources` deep
       link, a focused circle — could scroll the orbit up with no scrollbar to
       get back. `hidden` stays first for browsers without `clip`. */
    overflow: hidden;
    overflow: clip;
    /* `clip` (unlike `hidden`) does not form a block formatting context, so a
       child's top margin would collapse through and push the 100dvh page down
       — taller than the viewport, which trips mobileFooter's "page fits" check
       and adds --foot-pad on top. `flow-root` contains it. */
    display: flow-root;
    background: radial-gradient(
      circle at bottom center,
      var(--gold) 0%,
      #fdfbfb 70%
    );
    transition: background 0.5s ease;
  }
  /* The honeycomb is taller than the screen and scrolls like any page. */
  .me-page-bg.stack {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
    /* A page that scrolls gets the footer's reserve as body padding, which
       would show as a dark band under the gradient. Paint over it instead —
       the content height mobileFooter measures stays the same. */
    padding-bottom: var(--foot-pad, 0px);
    margin-bottom: calc(-1 * var(--foot-pad, 0px));
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

  /* ── the orbit ───────────────────────────────────────────────────────────
     Positions come from $lib/me/orbitLayout.ts as inline left/top/width; the
     CSS only says "absolutely, inside the field". */
  .me-field {
    position: relative;
    z-index: 2;
    width: 100%;
  }
  .me-center,
  .me-orb-slot {
    position: absolute;
  }
  /* The SSR render cannot know the screen, so it renders the honeycomb; the
     circles fade in once the client has measured and placed them, instead of
     visibly jumping from one layout to the other. */
  .me-orbs {
    opacity: 0;
    transition: opacity 0.35s ease;
  }
  .me-field.ready .me-orbs {
    opacity: 1;
  }
  /* An editor panel is open: the orbit dims and stops taking clicks (inert)
     so the panel reads as the one thing on screen. */
  .me-field.editing {
    opacity: 0.25;
    filter: blur(2px);
    transition:
      opacity 0.25s,
      filter 0.25s;
  }
  .me-field.ready .me-orb-slot {
    animation: orb-in 0.5s calc(var(--i) * 40ms) both cubic-bezier(0.2, 0.8, 0.3, 1.2);
  }
  @keyframes orb-in {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }

  /* ── the honeycomb (a screen too small to orbit at a readable size) ───── */
  .stack .me-field {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.25rem 12px 2rem;
  }
  .stack .me-center {
    position: relative;
    width: min(78vw, 380px, calc((100dvh - var(--foot-h, 0px)) * 0.6 * 5 / 7));
    aspect-ratio: 5 / 7;
  }
  .stack .me-orbs {
    width: 100%;
    max-width: 1180px;
    margin-top: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
    justify-items: center;
  }
  .stack .me-orb-slot {
    position: relative;
    width: 100%;
    max-width: 250px;
  }
  /* A phone gets exactly two columns, the second dropped half a circle — a
     coin field rather than a table. */
  @media (max-width: 559px) {
    .stack .me-orbs {
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      padding-bottom: 26%;
    }
    .stack .me-orb-slot:nth-child(even) {
      translate: 0 50%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .me-field.ready .me-orb-slot,
    .editor-orb {
      animation: none;
    }
    .me-orbs,
    .badge-pill {
      transition: none;
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
