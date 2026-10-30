<script>
  import TimerDialogs from '../timers/TimerDialogs.svelte';
  import { nutifi } from '$lib/func/nutifi.svelte';
  import { toast } from 'svelte-sonner';
  import RangeSlider from 'svelte-range-slider-pips';
  import { lang } from '$lib/stores/lang.js';
  import { locale, t, isRtl} from '$lib/translations';
  import { fly } from 'svelte/transition';
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { idPr } from '../../stores/idPr.js';
  import { onMount } from 'svelte';
  import { timers, updateTimers, lockTimerForEdit, fetchTimers } from '$lib/stores/timers.js';
  import { startTimer } from '$lib/func/timers.js';
  import { stopTimer } from '$lib/func/timers.js';
  /**
   * @typedef {Object} Props
   * @property {boolean} [isVisible]
   * @property {any} coinlapach
   * @property {any} stname
   * @property {boolean} [modal]
   * @property {boolean} [iskvua]
   * @property {boolean} [low]
   * @property {number} [status] - tween store
   * @property {any} [tasks]
   * @property {any} restime
   * @property {number} [tx]
   * @property {string} [dueDateOrCountToDedline]
   * @property {string} [projectName]
   * @property {string} [missionName]
   * @property {string} [missionDetails]
   * @property {any} hearotMeyuchadot
   * @property {string} [src]
   * @property {string} [link]
   * @property {string} [linkDescription]
   * @property {any} projectId
   * @property {string} [linkP]
   * @property {any} hourstotal
   * @property {number} [hoursdon]
   * @property {any} mId
   * @property {any} missId - add in gr
   * @property {any} noofpu - addtopr
   * @property {any} pu
   * @property {any} perhour
   * @property {any} usernames
   * @property {any} zman
   * @property {any} oldzman
   * @property {number} [lapse]
   * @property {boolean} [cards]
   * @property {(payload: { id: any }) => void} [onProj]
   * @property {(payload: { ani: string, coinlapach: any }) => void} [onDone]
   * @property {(payload: { id: string }) => void} [onHover]
   * @property {() => void} [onModal]
   */

  /** @type {Props} */
  let {
    isVisible = false,
    coinlapach,
    stname = $bindable(),
    modal = $bindable(false),
    iskvua = false,
    low = false,
    status = $bindable(0),
    tasks = [],
    restime,
    tx = 680,
    dueDateOrCountToDedline = '11:11',
    projectName = 'ONE',
    missionName = 'do x',
    missionDetails = 'do x in y',
    hearotMeyuchadot,
    src = 'coin.png',
    link,
    linkDescription = 'לביצוע',
    projectId,
    linkP = '/project/',
    hourstotal,
    hoursdon = $bindable(0),
    mId,
    missId,
    noofpu,
    pu,
    perhour,
    usernames,
    zman = $bindable(),
    oldzman,
    lapse = $bindable(0),
    cards = false,
    onProj,
    onDone,
    onHover,
    forumId,
    onModal
  } = $props();
  const baseUrl = import.meta.env.VITE_URL;

  // ===== Single source of truth: the $timers store =====
  // All timer state is DERIVED from the store (same model as timer.svelte).
  // No local clock, no parallel mutable state — so remote socket updates from
  // other devices/tabs reflect here immediately and the animation can't desync.
  let storeTimer = $derived($timers?.find((t) => String(t.mId) === String(mId)));
  let isRunning = $derived(!!storeTimer?.running);
  let activeTimerData = $derived(
    storeTimer?.attributes?.activeTimer?.data?.attributes
  );
  let storeTotalHours = $derived(activeTimerData?.totalHours || 0);
  let storeTimers = $derived(activeTimerData?.timers || []);

  // Live display clock, defined by primitive values so a remote refresh that
  // doesn't change the running segment won't restart the interval (no jump).
  let localZman = $state(0);
  let runningStartMs = $derived(
    isRunning && storeTimers.length > 0
      ? new Date(storeTimers[storeTimers.length - 1].start).getTime()
      : null
  );
  let baseMs = $derived(storeTotalHours * 3600000);
  $effect(() => {
    const start = runningStartMs;
    const base = baseMs;
    if (start != null) {
      const tick = () => {
        localZman = Date.now() - start + base;
      };
      tick();
      const id = setInterval(tick, 100);
      return () => clearInterval(id);
    }
    localZman = base;
    const { hours, minutes, seconds } = getTimeComponents(localZman);
    elapsedTime = `${hours}:${minutes}:${seconds}`;
  });

  // Mirror the live clock / store into the bindable props the coin + card read.
  let running = $derived(isRunning);
  $effect(() => {
    zman = localZman;
  });
  $effect(() => {
    lapse = localZman;
  });
  $effect(() => {
    const h = storeTimer?.attributes?.howmanyhoursalready;
    if (h !== undefined && h !== null) hoursdon = h;
  });

  // Helper: write a timer update back to the global store (optimistic + result).
  // Ids compare as strings: the store holds GraphQL ids (strings) and the card may
  // get a number — a strict === matched nothing, so a started timer showed only
  // after a reload (QA_CONCIERGE_E2E C-12).
  function updateStore(isRun, res = null) {
    updateTimers(
      $timers.map((t) =>
        String(t.mId) === String(mId)
          ? {
              ...t,
              running: isRun,
              attributes: {
                ...t.attributes,
                activeTimer: {
                  ...t.attributes.activeTimer,
                  data: res || t.attributes.activeTimer?.data,
                  isActive: isRun
                }
              }
            }
          : t
      )
    );
  }

  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }

  let show = true;
  let mstotal = hourstotal * 3600000;
  let showSaveDialog = $state(false);
  let showClearDialog = $state(false);
  let showSaveFinal = $state(false);
  let dialogEdit = $state(true);
  let elapsedTime = $state('00:00:00');
  let taskSearchTerm = $state('');

  let x = $state(0);
  let already = $state(false);
  let pmcli = $state(0);

  function project(id) {
    pmcli += 1;
    if (pmcli >= 2) {
      idPr.set(id);
      goto('/moach');
    }
  }
  let zmani;

  let selectedTasks = $state([]);

  let miatan;
  onMount(async () => {
    // Normalize `status` into the [value] array shape the RangeSlider expects.
    if (status == null) {
      status = 0;
    }
    if (status >= 0) {
      const numi = status;
      status = [];
      status.push(numi);
      status = status;
    }

    // Initialize selected tasks from the active timer (display state is derived
    // live from the store via the $effect block above — no manual interval here).
    selectedTasks =
      storeTimer?.attributes?.activeTimer?.data?.attributes?.acts?.data?.map(
        (task) => task.id
      ) ?? [];
  });

  /** להוסיף פונקציה לבקשת תוספת שעות
 * $: if (percentage(zman,mstotal) >= 100 && running == true){
           azor ()
    let text = `שלום ${usernames} הטיימר של  ${missionName} נעצר מפני שמכסת השעות שסוכמה הסתיימה, יש ליצור משימה חדשה` ;
    nutifi("1💗1 טיימר נעצר",text,"lev" )
        }**/

  let error1;

  async function azor() {
    const timerDataToStop = storeTimer?.attributes?.activeTimer?.data;
    if (!timerDataToStop) return;

    // 1. Optimistic stop (UI reflects the store immediately)
    updateStore(false);

    // 2. Server action (routes through /api/action → broadcasts socket to other devices)
    try {
      const result = await stopTimer(
        timerDataToStop,
        fetch,
        false,
        projectId,
        page.data.uid
      );

      if (result) {
        updateStore(false, result);

        toast.info($t('lev.missionInProgress.timerStopped'));
        const { hours, minutes, seconds } = getTimeComponents(localZman);
        elapsedTime = `${hours}:${minutes}:${seconds}`;
        showSaveDialog = true;
        lockTimerForEdit(mId);
        dialogEdit = false;
      }
    } catch (e) {
      error1 = e;
      updateStore(true); // revert
      toast.warning($t('lev.missionInProgress.error'));
      console.error('Error stopping timer:', e);
    }
  }
  function getTimeComponents(milliseconds) {
    if (!milliseconds) return { hours: 0, minutes: 0, seconds: 0 };
    const totalSeconds = Math.floor(milliseconds / 1000);
    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60
    };
  }
  async function start() {
    const activeTimer = storeTimer?.attributes?.activeTimer;
    const currentData = activeTimer?.data;
    const currentTimerId = currentData?.attributes?.saved ? 0 : currentData?.id || 0;
    const now = new Date().toISOString();

    // 1. Optimistic start: append a new running segment
    const currentTimers = currentData?.attributes?.timers || [];
    const optimisticData = {
      ...currentData,
      id: currentData?.id,
      attributes: {
        ...currentData?.attributes,
        isActive: true,
        timers: [...currentTimers, { start: now, stop: null }]
      }
    };
    updateStore(true, optimisticData);

    // 2. Server action (broadcasts socket to other devices/tabs)
    try {
      const result = await startTimer(
        activeTimer,
        mId,
        page.data.uid,
        projectId,
        fetch,
        currentTimerId,
        false
      );
      if (result) updateStore(true, result);
      // A mission that became "in progress" after the store was loaded is not in
      // it at all, so the update above had nothing to land on (C-12): reload it.
      if (!$timers.some((t) => String(t.mId) === String(mId))) {
        await fetchTimers(page.data.uid, fetch);
      }
    } catch (e) {
      error1 = e;
      updateStore(false); // revert
      console.error('Error starting timer:', e);
    }
  }

  // Save / clear are handled by the shared TimerDialogs (which routes through the
  // unified action system and therefore broadcasts to other devices). The card's
  // onSave/onClear simply open the relevant dialog and lock the timer for editing.
  function save() {
    showSaveDialog = true;
    dialogEdit = false;
    lockTimerForEdit(mId);
  }

  function handleClearClick() {
    showClearDialog = true;
    lockTimerForEdit(mId);
  }

  // The card's ✏ button. Same routing as MissionControls.openTimerEditor: with
  // unsaved time on the clock the member wants the save menu, otherwise they
  // want the interval list — the button's own label says which. Taking the edit
  // lock here is what stops a socket refresh from swapping the timer out from
  // under the open dialog; the card used to just flip `showSaveDialog` and skip
  // it entirely.
  let hasUnsavedTime = $derived(
    !activeTimerData?.saved && (storeTimers.length > 0 || storeTotalHours > 0)
  );

  function openTimerEditor() {
    if (hasUnsavedTime) {
      showSaveDialog = true;
      dialogEdit = false;
    } else {
      showClearDialog = true;
    }
    lockTimerForEdit(mId);
  }

  // this is a very imperfect way to have the dials rotate smoothly back to 0
  // set a transition on the minutes and seconds dial, but only when lapse is set to 0
  // remove it when lapse is then more than 0
  let seconds = $state();
  let minutes = $state();
  // to avoid constantly setting transition to none add a boolean to short-circuit the second conditional
  let transitioned;

  function done() {
    // Two different reasons not to submit yet, and each gets its own words: a
    // running timer has hours that are not saved; zero hours means nothing was
    // logged at all (QA_CONCIERGE_E2E C-11 — the old text blamed a timer either way).
    if ($timers.find((t) => String(t.mId) === String(mId))?.attributes?.activeTimer?.data != null) {
      toast.warning($t('lev.missionInProgress.timerRunning'));
      return;
    }
    if (!hoursdon) {
      toast.warning($t('lev.missionInProgress.noHours'));
      return;
    }
    already = true;
    a = 1;
    //file upload in a chlon kofetz and then archived,, future build smart contracts on blockchain
    isOpen = true;
  }
  function opentask() {
    a = 4;
    isOpen = true;
  }
  let isOpen = $state(false);
  function close() {
    isOpen = false;
    already = false;
  }
  let errorM = {
    ein: 'יש להעלות קובץ המכיל את ביצוע המשימה או לתאר במילים',
    timer: ' יש לכבות את הטיימר לפני הגשת המשימה לאישור'
  };
  let activE = $state();
  let why = $state();
  let what = $state();
  let butt = $state(false);
  async function afterwhy() {
    butt = true;
    already = true;

    // --- keep local validations for fast UX feedback ---
    if (!why && !what) {
      activE = errorM.ein;
      butt = false;
      already = false;
      return;
    }
    if (running) {
      activE = errorM.timer;
      butt = false;
      already = false;
      return;
    }

    // --- 1) upload file through SvelteKit endpoint ---
    let newwhat = false;
    if (what && what[0]) {
      const files = what[0] ?? what;
      const fd = new FormData();
      fd.append('files', files);
      try {
        const resp = await fetch('/api/upload', {
          method: 'POST',
          body: fd
        });
        if (!resp.ok) throw new Error('Upload failed');
        const data = await resp.json();
        newwhat = data[0]?.id ?? false;
        console.log('upload ok', newwhat);
      } catch (err) {
        console.error('upload failed', err);
        activE = 'העלאת הקובץ נכשלה, נסה שוב';
        butt = false;
        already = false;
        return;
      }
    }

    // --- 2) call the unified server action ---
    // executeAction (not a raw fetch) so the S2b shadow-sign registry fires:
    // mission.complete gets signed and routed into the project's Space.
    try {
      const result = await executeAction('completeMission', {
        missionId: String(mId),
        why: why ?? '',
        what: newwhat ? String(newwhat) : undefined,
        hoursdon: hoursdon
      }, { showErrorToast: false }); // the dialog shows its own error (error1)
      console.log('completeMission action result', result);

      if (!result.success) {
        // A database failure is reported by the server in English and says nothing
        // the member can act on (QA C-22) — they get the localized message; the
        // details stay in the console. A validation message is the action's own words.
        const raw = result.error?.code === 'STRAPI_ERROR' ? '' : result.error?.message;
        console.error('[completeMission]', result.error);
        throw new Error(raw || $t('lev.missionInProgress.error'));
      }

      isOpen = false;
      onDone?.({ ani: 'minp', coinlapach: coinlapach });
    } catch (e) {
      error1 = e;
      console.log(error1);
      isOpen = true;
      activE =
        e instanceof TypeError ? $t('lev.missionInProgress.error') : (error1?.message ?? error1);
      butt = false;
      already = false;
    }
  }


  let u = 'משימה בתהליך ביצוע';
  function hover(id) {
    if (id == '0') {
      u = 'משימה בתהליך ביצוע';
    } else {
      u = id;
    }

    onHover?.({ id: u });
  }

  function hoverc(event) {
    if (event.x == '0') {
      u = 'הצבעה על בקשה לחלוקת הרווחים שנצברו לרקמה';
    } else {
      u = event.x;
    }
    onHover?.({ id: u });
  }
  import Cards from './cards/inpro.svelte';
  import { executeAction } from '$lib/client/actionClient';
  import { calcX } from '$lib/func/calcX.svelte';

  function claf(event) {
    let o = event.alr;
    let d = event.y;
    console.log(o, d);
  }
  async function stat() {
    a = 3;
    try {
      await executeAction('updateMissionStatus', {
        mId: String(mId),
        projectId: String(projectId),
        status: status[0],
      });
      isOpen = false;
      toast.success(`${$t('lev.missionInProgress.saved')}`);
    } catch (e) {
      error1 = e;
      isOpen = false;
      toast.warning($t('lev.missionInProgress.error'));
    }
  }
  function clicked(t) {
    op[t] = true;
    console.log(t, 'rfweiofjw', op);
  }
  async function taskishor(id) {
    try {
      const result = await executeAction('updateTask', {
        id: String(id),
        projectId: String(projectId),
        myIshur: true
      });
      if (result.success) {
        toast.success($t('lev.missionInProgress.success'));
        // Optimistic UI: switch button to "done" style
        const task = localTasks.find((t) => t.id == id);
        if (task) task.attributes.myIshur = true;
      } else {
        toast.warning($t('lev.missionInProgress.error'));
      }
    } catch (e) {
      console.error(e);
      toast.warning(`${$t('lev.missionInProgress.error')}`, { description: e.message });
    }
  }
  async function busabe(id) {
    try {
      const result = await executeAction('updateTask', {
        id: String(id),
        projectId: String(projectId),
        naasa: true
      });
      if (result.success) {
        toast.success($t('lev.missionInProgress.success'));
        // Optimistic UI: remove task from list and reset slider states
        localTasks = localTasks.filter((t) => t.id != id);
        op = {};
      } else {
        toast.warning($t('lev.missionInProgress.error'));
      }
    } catch (e) {
      console.error(e);
      toast.warning(`${$t('lev.missionInProgress.error')}`, { description: e.message });
    }
  }
  async function valiIshor(id) {
    try {
      const result = await executeAction('updateTask', {
        id: String(id),
        projectId: String(projectId),
        valiIshur: true
      });
      if (result.success) {
        toast.success($t('lev.missionInProgress.success'));
        // Final approval — task fully done, remove from list
        localTasks = localTasks.filter((t) => t.id != id);
        op = {};
      } else {
        toast.warning($t('lev.missionInProgress.error'));
      }
    } catch (e) {
      console.error(e);
      toast.warning(`${$t('lev.missionInProgress.error')}`, { description: e.message });
    }
  }
  async function updStat(id, st, i) {
    try {
      const result = await executeAction('updateTask', {
        id: String(id),
        projectId: String(projectId),
        status: st[0]
      });
      if (result.success) {
        toast.success($t('lev.missionInProgress.success'));
        op[i] = false;
      } else {
        toast.warning($t('lev.missionInProgress.error'));
      }
    } catch (e) {
      console.error(e);
      toast.warning(`${$t('lev.missionInProgress.error')}`, { description: e.message });
    }
  }
  let a = $state(1);
  // storeTimer is derived from $timers, and the live clock drives `zman`/`localZman`
  // via the $effect block near the top — no manual onMount/interval needed here.
  $effect(() => {
    if (percentage(zman, mstotal) == 90) {
      let text = `שלום ${usernames} נשארו רק עשרה אחוזים לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה`;
      nutifi('1💗1 טיימר קרוב לסיום', text, 'lev');
    } else if (percentage(zman, mstotal) == 95) {
      let text = `שלום ${usernames} נשארו רק חמישה אחוזים לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה`;
      nutifi('1💗1 טיימר קרוב לסיום', text, 'lev');
    }
  });
  $effect(() => {
    if (mstotal - zman == 300000) {
      let text = `שלום ${usernames} נשארו רק חמש דקות לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה`;
      nutifi('1💗1 טיימר קרוב לסיום', text, 'lev');
    } else if (mstotal - zman == 60000) {
      console.log('timer stop min');
      let text = `שלום ${usernames} נשארה רק דקה לטיימר של  ${missionName} כדאי להתכונן וליצור משימה חדשה`;
      nutifi('1💗1 טיימר קרוב לסיום', text, 'lev');
    }
  });
  // lapse refers to the number of milliseconds in the stopwatch

  // rotation refers to the degrees applied to the minutes dial to have a full rotation for 60 seconds
  // multiply the value by 60 for the seconds dial to have a full rotation every second
  let rotation = $derived(((lapse / 1000 / 60) * 360) % 360);
  let op = $state({});
  let msdonf = $derived(hoursdon * 3600000);
  // Local mutable copy of tasks for optimistic UI updates.
  // For the sender: tasks prop doesn't change (excludeSender:true) → optimistic update persists.
  // For receivers: the realtime bus re-reads the mtaha slice (act:<id>) → tasks prop changes → $effect syncs here.
  let localTasks = $state([...tasks]);
  $effect(() => {
    localTasks = [...tasks];
  });
</script>

<!--
  Only mount the dialogs once the mission actually has a timers-store entry:
  every handler inside them reads `timer.mId`, and with no entry the first
  click threw. The ✏ button is gated on the same `storeTimer`, so this never
  hides a reachable dialog.

  The callback is `onUpdateTimer`. It was written `onUpdate-timer` — a Svelte 4
  `on:update-timer` left over from the runes migration — which is not the prop
  TimerDialogs declares, so it was never called: a save or a clear reached the
  card only through the delayed refetch that `unlockTimerForEdit({refresh:true})`
  schedules. The payload is the plain object TimerDialogs passes, not a
  `{ detail }` wrapper.
-->
{#if storeTimer}
  <TimerDialogs
    timer={storeTimer}
    bind:showSaveDialog
    bind:showClearDialog
    bind:showSaveFinal
    bind:dialogEdit
    bind:elapsedTime
    bind:selectedTasks
    bind:taskSearchTerm
    onUpdateTimer={({ timer: updated, running, hoursdon: donenow }) => {
      if (updated) {
        // Write the result back to the global store (single source of truth);
        // storeTimer/isRunning/zman re-derive automatically.
        updateStore(running, updated);
      } else {
        // A save answers with { success, missionId } and carries no timer —
        // that is not a failure, it just means the store has nothing new to
        // take beyond "this is no longer running".
        updateStore(false);
      }

      // Outside the branch above on purpose: a save is exactly the case that
      // moves the monthly counter *and* carries no timer, so nesting this in
      // the `updated` branch dropped the new hours every time.
      if (donenow !== undefined) {
        updateTimers(
          $timers.map((t) =>
            String(t.mId) === String(mId)
              ? {
                  ...t,
                  attributes: {
                    ...t.attributes,
                    howmanyhoursalready: donenow
                  }
                }
              : t
          )
        );
      }
    }}
  />
{/if}

<!--<svelte:window on:beforeunload={beforeUnload}/>-->

<DialogOverlay {isOpen} onDismiss={close} class="overlay">
  <div transition:fly|local={{ y: 450, opacity: 0.5, duration: 2000 }}>
    <DialogContent aria-label="form" class="content surface-dialog">
      <div
        dir={$isRtl ? 'rtl' : 'ltr'}
        class="p-6 space-y-4"
      >
        <button
          onclick={close}
          class="absolute top-4 {$locale === 'he' || $locale === 'ar'
            ? 'left-4'
            : 'right-4'} text-surfaceMuted hover:text-surfaceInk"
        >
          {$t('lev.missionInProgress.cancel')}
        </button>
        {#if a == 1}
          <div class="space-y-4">
            <h5 class="text-xl font-semibold text-surfaceInk">
              {$t('lev.missionInProgress.uploadTitle')}
            </h5>
            <p class="text-sm text-surfaceMuted">
              {$t('lev.missionInProgress.uploadDescription')}
            </p>

            <div class="space-y-3">
              <label class="block">
                <span class="text-sm font-medium text-surfaceInk"
                  >{$t('lev.missionInProgress.fileLabel')}</span
                >
                <input
                  type="file"
                  bind:files={what}
                  class="mt-1 block w-full text-sm text-surfaceMuted
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gold file:text-barbi
                        hover:file:bg-yellow-600
                        file:cursor-pointer"
                />
              </label>

              <label class="block">
                <span class="text-sm font-medium text-surfaceInk"
                  >{$t('lev.missionInProgress.descriptionPlaceholder')}</span
                >
                <textarea
                  bind:value={why}
                  placeholder={$t(
                    'lev.missionInProgress.descriptionPlaceholder'
                  )}
                  rows="4"
                  class="mt-1 block w-full rounded-lg border border-gold focus:border-yellow-600 focus:ring focus:ring-yellow-200 focus:ring-opacity-50 p-3 text-surfaceInk"
                ></textarea>
              </label>
            </div>

            {#if butt == false}
              <button
                onclick={afterwhy}
                class="w-full bg-gold hover:bg-yellow-600 text-barbi font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                {$t('lev.missionInProgress.submitButton')}
              </button>
            {:else}
              <div class="text-center text-surfaceMuted py-3">
                {$t('lev.missionInProgress.pleaseWait')}
              </div>
            {/if}

            {#if activE}
              <div class="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {activE}
              </div>
            {/if}
          </div>
        {:else if a == 2}
          <div
            dir="ltr"
            class="flex flex-col justify-center items-center w-full"
          >
            <h2 class="text-center">{$t('lev.missionInProgress.statusLabel')}</h2>
            <div class="w-full">
              <RangeSlider
                bind:values={status}
                suffix="%"
                pipstep="20"
                float
                pips
                all="label"
                hoverable
              />
            </div>
            <button
              onclick={stat}
              class="text-center text-barbi border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb to-gr-c"
              >{$t('lev.missionInProgress.save')}</button
            >
          </div>
        {:else if a == 3}
          <h2>{$t('lev.missionInProgress.oneMonent')}</h2>
        {:else if a == 4}
          <div class="space-y-3">
            <!-- Tasks header -->
            <div class="flex items-center gap-2">
              <h5 class="text-base font-bold text-surfaceInk">
                {$t('lev.missionInProgress2.tasks')}
              </h5>
              <span
                class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full"
              >{tasks.length}</span>
            </div>

            <!-- Task list -->
            <div class="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {#each localTasks as task, i}
                <div
                  class="bg-surface rounded-xl border border-surfaceLine shadow-sm overflow-hidden"
                >
                  <!-- Task name + description -->
                  <div
                    class="px-3 py-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-surfaceLine"
                  >
                    <h6 class="font-bold text-surfaceInk text-sm leading-snug">
                      {task.attributes.shem}
                    </h6>
                    {#if task.attributes.des}
                      <p class="text-surfaceMuted text-xs mt-0.5 leading-relaxed">
                        {task.attributes.des}
                      </p>
                    {/if}
                  </div>

                  <!-- Progress + buttons -->
                  <div class="px-3 py-2 space-y-2">
                    {#key op}
                      {#if op[i] != true}
                        <!-- Progress bar (click to edit) -->
                        <div
                          onmouseenter={() => hover($t('lev.missionInProgress.statusLabel'))}
                          onmouseleave={() => hover('0')}
                          onclick={() => clicked(i)}
                          onkeypress={() => clicked(i)}
                          role="button"
                          tabindex="0"
                          title={$t('lev.missionInProgress2.clickToUpdate')}
                          class="cursor-pointer border-2 rounded-xl border-purple-300 hover:border-purple-500 overflow-hidden transition-colors bg-surface2"
                        >
                          <div
                            class="bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 flex items-center justify-center"
                            style="width: {task.attributes.status == null ? 0 : task.attributes.status}%; min-height: 1.75rem;"
                          >
                            {#if (task.attributes.status || 0) > 10}
                              <span class="text-white text-xs font-bold px-1"
                                >{task.attributes.status}%</span
                              >
                            {/if}
                          </div>
                          {#if !(task.attributes.status > 0)}
                            <div class="text-center text-xs text-surfaceMuted py-1">0%</div>
                          {/if}
                        </div>
                      {:else if op[i] == true}
                        <div class="space-y-2" dir="ltr">
                          <RangeSlider
                            bind:values={task.attributes.status}
                            suffix="%"
                            pipstep="20"
                            float
                            pips
                            all="label"
                            hoverable
                          />
                          <button
                            onclick={() => updStat(task.id, task.attributes.status, i)}
                            class="w-full py-1.5 text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                          >{$t('lev.missionInProgress.save')}</button>
                        </div>
                      {/if}
                    {/key}

                    <!-- Approval / Done / Validate button -->
                    <div class="flex pt-0.5">
                      {#if task.attributes.naasa === true}
                        {#if String(task.attributes.vali?.data?.id) === String(page.data.uid)}
                          <!-- Current user is the validator → can give final approval -->
                          <button
                            onclick={() => valiIshor(task.id)}
                            class="flex-1 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all flex items-center justify-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                            {$t('lev.missionInProgress2.approveFinish')}
                          </button>
                        {:else}
                          <!-- Waiting for validator -->
                          <span class="flex-1 py-1.5 text-xs text-center text-amber-600 bg-amber-50 border border-amber-200 rounded-lg font-medium flex items-center justify-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24">
                              <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                            </svg>
                            {$t('lev.missionInProgress2.pendingApproval')}
                          </span>
                        {/if}
                      {:else if task.attributes.myIshur == false}
                        <!-- Assignee hasn't confirmed yet -->
                        <button
                          onclick={() => taskishor(task.id)}
                          class="flex-1 py-1.5 text-xs font-semibold border-2 border-surfaceLine text-surfaceMuted rounded-lg hover:border-purple-500 hover:text-purple-700 transition-all bg-surface"
                        >{$t('lev.missionInProgress.save')}</button>
                      {:else}
                        <!-- Assignee confirmed → can mark as done -->
                        <button
                          onclick={() => busabe(task.id)}
                          class="flex-1 py-1.5 text-xs font-bold bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-600 hover:to-teal-600 transition-all"
                        >{$t('lev.missionInProgress.done')}</button>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div></DialogContent
    >
  </div>
</DialogOverlay>
<Cards
  onStart={start}
  onDone={done}
  onSave={save}
  onHover={hoverc}
  onTask={opentask}
  onAzor={azor}
  onClear={handleClearClick}
  onStatusi={function () {
    a = 2;
    isOpen = true;
  }}
  {isVisible}
  onEditTimer={openTimerEditor}
  {low}
  tasks={localTasks}
  {storeTimer}
  {forumId}
  {dueDateOrCountToDedline}
  {hearotMeyuchadot}
  {x}
  {iskvua}
  {zman}
  {already}
  {projectName}
  {src}
  {missionDetails}
  {link}
  {missionName}
  missionId={mId}
  {projectId}
  myId={String(page.data.uid ?? '')}
  {linkDescription}
  {running}
  {show}
  {hourstotal}
  {hoursdon}
  {perhour}
  {status}
/>

<style>

  svg {
    font-family: 'Roboto Mono', monospace;
    color: hsl(0, 0%, 5%);
  }
  /*
    .normSmlHover{
        min-height: 115px;
    min-width: 115px;
    max-width: 325px;
    max-height: 325px;
    aspect-ratio: 1/ 1;
        color: var(--barbi-pink);

        border-radius: 50%;
        line-height: 0.6; 
        text-align: center;
        background: url(https://res.cloudinary.com/love1/image/upload/v1643838415/diamondlight1_db635m.jpg);
    background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
    }*/

  :global([data-svelte-dialog-content].content) {
    width: 80vw;
    z-index: 60;
  }
  :global([data-svelte-dialog-overlay].overlay) {
    z-index: 100;
  }
  @media (min-width: 568px) {
    :global([data-svelte-dialog-content].content) {
      width: 50vw;
      z-index: 60;
    }
    :global([data-svelte-dialog-overlay].overlay) {
      z-index: 100;
    }
  }
</style>
