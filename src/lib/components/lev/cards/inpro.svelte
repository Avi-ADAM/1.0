<script>
  import { formatTime } from './../utils.js';
  import { lang } from '$lib/stores/lang.js';
  import {
    nowChatId,
    isChatOpen,
    forum,
    newChat
  } from '$lib/stores/pendMisMes.js';
  import { initialForum } from '$lib/stores/pendMisMes.js';
  import { idPr } from '$lib/stores/idPr.js';

  import Lowbtn from '$lib/celim/lowbtn.svelte';
  // import Chaticon from '../../../celim/chaticon.svelte'
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device.js';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import CardHeader from './CardHeader.svelte';
  /**
   * @typedef {Object} Props
   * @property {number} [x]
   * @property {any} [tasks]
   * @property {any} src
   * @property {any} projectName
   * @property {any} already
   * @property {any} zman
   * @property {any} hearotMeyuchadot
   * @property {number} [status]
   * @property {any} dueDateOrCountToDedline
   * @property {any} missionName
   * @property {any} link
   * @property {any} missionDetails
   * @property {any} hoursdon
   * @property {any} hourstotal
   * @property {any} show
   * @property {any} running
   * @property {any} linkDescription
   * @property {number} [lapse]
   * @property {boolean} [low]
   * @property {boolean} [iskvua]
   * @property {boolean} [showSaveDialog]
   * @property {any} storeTimer
   * @property {boolean} [isVisible]
   * @property {any} [startDate]
   * @property {number} [noOfusers]
   * @property {() => void} [onStart] - Callback for start event
   * @property {() => void} [onDone] - Callback for done event
   * @property {() => void} [onSave] - Callback for save event
   * @property {() => void} [onAzor] - Callback for azor event
   * @property {() => void} [onClear] - Callback for clear event
   * @property {(payload: { x: any }) => void} [onHover] - Callback for hover event
   * @property {() => void} [onStatusi] - Callback for statusi event
   * @property {() => void} [onTask] - Callback for task event
   */

  /** @type {Props} */
  let {
    x = 0,
    glowColor = 'blue',
    tasks = [],
    src,
    projectName,
    already = $bindable(),
    zman,
    hearotMeyuchadot,
    status = 0,
    dueDateOrCountToDedline,
    missionName,
    link,
    missionDetails,
    hoursdon,
    hourstotal,
    show,
    running,
    linkDescription,
    lapse = 0,
    low = false,
    iskvua = false,
    forumId,
    showSaveDialog = $bindable(false),
    storeTimer,
    isVisible = false,
    startDate = null,
    noOfusers = 0,
    onStart,
    onDone,
    onSave,
    onAzor,
    onClear,
    onHover,
    onStatusi,
    onTask
  } = $props();
  $effect(() => {
    console.log(forumId);
  });
  function start() {
    onStart?.();
  }
  function done() {
    already = true;
    onDone?.();
  }
  function save() {
    onSave?.();
  }
  function azor() {
    onAzor?.();
  }
  function clear() {
    onClear?.();
  }
  function hover(x) {
    onHover?.({ x: x });
  }
  function statusi() {
    onStatusi?.();
  }
  function opentask() {
    onTask?.();
  }

  // פונקציה לפתיחת צ'אט
  function openChat() {
    if (forumId > 0) {
      // פורום קיים - פותחים אותו
      nowChatId.set(forumId);
      isChatOpen.set(true);
    } else {
      // אין פורום - יוצרים זמני
      newChat.set({
        started: true,
        created: false,
        id: 0,
        md: { mbId: 0, pid: $idPr }
      });
      let tempF = $forum;
      tempF[-1] = {
        loading: false,
        messages: [],
        md: {
          pid: $idPr,
          projectName: projectName,
          projectPic: src,
          mesimaName: missionName
        }
      };
      forum.set(tempF);
      nowChatId.set(-1);
      isChatOpen.set(true);
    }
  }
  // import { textfit } from 'svelte-textfit';
  // let parent;
  let std = $derived(startDate != null ? new Date(startDate) : null);
  let eve = $derived(
    dueDateOrCountToDedline != 'undefined' &&
      dueDateOrCountToDedline != undefined &&
      dueDateOrCountToDedline != null
      ? new Date(dueDateOrCountToDedline)
      : null
  );
  const sta = {
    he: 'סטטוס התקדמות ביצוע המשימה',
    en: 'status of mission progress'
  };
  const deta = { he: 'פרטי המשימה', en: 'mission details' };
  const notes = { he: 'הערות', en: 'notes' };
  const hoursdonTitle = { he: 'שעות בוצעו ונשמרו', en: 'hours done and saved' };
  const from = { he: 'מתוך', en: 'from' };
  const timero = { he: 'מונה זמן', en: 'timer' };
  const totalTitle = {
    he: 'מספר השעות שהוקצו למשימה',
    en: 'total hours assigned to the mission'
  };
  const nooftitle = {
    he: 'מספר השעות שבוצעו ונשמרו',
    en: 'number of hours done and saved'
  };
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  console.log(hearotMeyuchadot);
  const hed = { he: 'משימה בתהליך ביצוע ', en: 'mission in progress' };
  let totali = $derived({
    he: `${iskvua == true ? 'שעות חודשיות' : 'שעות סך הכל'}`,
    en: `${iskvua == true ? 'monthly hours' : 'total hours'}`
  });
  const editButton = { he: 'עריכת הטיימר', en: 'edit Timer' };
</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'}  lg:w-[90%] {isVisible
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb={glowColor === 'gold'
    ? '238, 232, 170'
    : glowColor === 'barbi'
      ? '255, 0, 146'
      : glowColor === 'blue'
        ? '116, 191, 255'
        : glowColor === 'green'
          ? '2, 255, 187'
          : '2, 255, 187'}
>
  <!-- Header -->
  <CardHeader
    logoSrc={src}
    {projectName}
    cardType={hed[$lang]}
    cardTitle={missionName}
    memberCount={noOfusers}
    {glowColor}
  >
    {#snippet actions()}
      <button
        onclick={openChat}
        onkeypress={openChat}
        tabindex="0"
        class="hover:bg-blue-500/20 dark:hover:bg-blue-400/20 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors p-2 rounded-full"
        aria-label={forumId > 0 ? "פתיחת צ'אט קיים" : "פתיחת צ'אט חדש"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          style="width:24px;height:24px"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12,3C6.5,3 2,6.6 2,11C2,13.2 3.1,15.2 5,16.5V22L10.3,18.8C10.9,18.9 11.4,19 12,19C17.5,19 22,15.4 22,11C22,6.6 17.5,3 12,3M12,17C11.5,17 11,17 10.5,16.9L7,19V16.3C5.2,15.2 4,13.2 4,11C4,7.7 7.6,5 12,5C16.4,5 20,7.7 20,11C20,14.3 16.4,17 12,17Z"
          />
        </svg>
      </button>
      {#key isVisible}
        {#if tasks.length > 0}
          <div
            onclick={opentask}
            onkeypress={opentask}
            role="button"
            tabindex="0"
            class="inline-flex items-center justify-center w-8 h-8 text-sm font-bold text-white bg-blue-600 dark:bg-blue-500 border-2 border-white dark:border-gray-700 rounded-full p-2 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors cursor-pointer"
          >
            {tasks.length}
          </div>
        {/if}
      {/key}
    {/snippet}
  </CardHeader>

  <!-- Content -->
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} d transition-all-300 p-4 flex-1 overflow-y-auto space-y-4"
  >
    <!-- Hours Info -->
    <div
      class="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 p-3 rounded-xl border border-purple-200 dark:border-purple-700"
    >
      <img
        style="width:2.5rem;"
        src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
        alt="hours"
        class="flex-shrink-0"
      />
      <div
        class="flex flex-col sm:flex-row sm:items-center gap-1 text-sm sm:text-base"
      >
        <span
          class="font-bold text-gray-800 dark:text-gray-200"
          onmouseenter={() => hover(nooftitle[$lang])}
          onmouseleave={() => hover('0')}
          role="contentinfo"
        >
          {`${hoursdon ? Math.round((hoursdon + Number.EPSILON) * 100) / 100 : 0} ${hoursdonTitle[$lang]}`}
        </span>
        <span class="text-gray-600 dark:text-gray-400">{from[$lang]}</span>
        <span
          class="font-bold text-gray-800 dark:text-gray-200"
          role="contentinfo"
          onmouseenter={() => hover(totalTitle[$lang])}
          onmouseleave={() => hover('0')}
        >
          {hourstotal}
          {totali[$lang]}
        </span>
      </div>
    </div>

    <!-- Dates -->
    {#if std || dueDateOrCountToDedline}
      <div
        class="flex gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <div class="flex items-center gap-2">
          <img
            class="w-5 h-5"
            src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
            alt="calendar"
          />
          <div class="flex items-center gap-1">
            {#if std}
              <span>{new Date(std).toLocaleDateString($lang, options)}</span>
            {/if}
            {#if std && dueDateOrCountToDedline}
              <span>-</span>
            {/if}
            {#if dueDateOrCountToDedline}
              <span>{eve.toLocaleDateString($lang, options)}</span>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Timer Display -->
    <div class="flex items-center justify-center">
      <span
        class="bg-goldGrad bg-[length:200%_auto] animate-gradientx text-center text-wow p-3 sm:text-3xl text-2xl rounded-xl"
        style:font-family="Digital"
        role="contentinfo"
        onmouseenter={() => hover(timero[$lang])}
        onmouseleave={() => hover('0')}
        style="font-weight: 300; letter-spacing: 2px; text-shadow: 2px 2px rgba(0,0,0,0.3);"
      >
        {formatTime(zman)}
      </span>
    </div>

    <!-- Mission Details -->
    {#if missionDetails !== null && missionDetails !== 'null' && missionDetails !== 'undefined' && missionDetails.length > 0}
      <div
        class="text-sm text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-gray-900/20 p-3 rounded-lg"
        onmouseenter={() => hover(deta[$lang])}
        onmouseleave={() => hover('0')}
      >
        <RichText outpot={missionDetails} editable={false} />
      </div>
    {/if}

    <!-- Notes -->
    {#if hearotMeyuchadot !== undefined && hearotMeyuchadot !== null && hearotMeyuchadot !== 'undefined' && hearotMeyuchadot !== 'null' && hearotMeyuchadot.length > 0}
      <div
        class="text-sm text-gray-600 dark:text-gray-400 bg-yellow-50/50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700"
        role="contentinfo"
        onmouseenter={() => hover(notes[$lang])}
        onmouseleave={() => hover('0')}
      >
        <RichText editable={false} outpot={hearotMeyuchadot} />
      </div>
    {/if}

    <!-- Progress Bar -->
    <div
      role="button"
      tabindex="0"
      onmouseenter={() => hover(sta[$lang])}
      onmouseleave={() => hover('0')}
      class="border-2 rounded-2xl border-blue-500 dark:border-blue-400 hover:border-purple-500 dark:hover:border-purple-400 overflow-hidden transition-colors cursor-pointer"
      onclick={() => statusi()}
      onkeypress={() => statusi()}
    >
      <div
        class="rounded-2xl bg-goldGrad bg-[length:200%_auto] animate-gradientx transition-all duration-300"
        style="width: {status == null ? 0 : status[0]}%"
      >
        <div
          style="font-weight: 300; letter-spacing: 1px; text-shadow: 1px 1px black;"
          class="text-center text-white text-xl py-1"
        >
          {status != null ? status[0] : '0'}%
        </div>
      </div>
    </div>
  </div>

  <!-- Actions Footer -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    {#if low == false}
      <!-- Edit Timer Button -->
      {#if storeTimer?.attributes?.activeTimer?.data?.attributes}
        <button
          onmouseenter={() => hover('לחיצה לעריכת הטיימר')}
          onmouseleave={() => hover('0')}
          class="py-2 px-4 bg-white dark:bg-gray-800 border-2 border-yellow-500 dark:border-yellow-400 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-bold rounded-xl transition-all"
          tabindex="0"
          role="button"
          onkeypress={() => (showSaveDialog = true)}
          onclick={() => (showSaveDialog = true)}
        >
          ✏ {editButton[$lang]}
        </button>
      {/if}

      <div class="flex gap-3">
        <!-- Done Button -->
        {#if already === false}
          <button
            onmouseenter={() => hover('לחיצה לסיום המשימה')}
            onmouseleave={() => hover('0')}
            onclick={done}
            class="flex-1 py-2 px-4 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            name="done"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M12 20C7.59 20 4 16.41 4 12S7.59 4 12 4 20 7.59 20 12 16.41 20 12 20M16.59 7.58L10 14.17L7.41 11.59L6 13L10 17L18 9L16.59 7.58Z"
              />
            </svg>
            <span>{$lang === 'he' ? 'סיום משימה' : 'Complete Task'}</span>
          </button>
        {/if}

        <!-- Timer Button -->
        {#if show === true}
          <button
            onmouseenter={() =>
              hover(`${running ? 'עצירת הטיימר' : 'הפעלת טיימר'}`)}
            onmouseleave={() => hover('0')}
            onclick={running ? azor : start}
            class="flex-1 py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            name="start timer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M6,2H18V8H18V8L14,12L18,16V16H18V22H6V16H6V16L10,12L6,8V8H6V2M16,16.5L12,12.5L8,16.5V20H16V16.5M12,11.5L16,7.5V4H8V7.5L12,11.5M10,6H14V6.75L12,8.75L10,6.75V6Z"
              />
            </svg>
            <span
              >{running
                ? $lang === 'he'
                  ? 'הפסקה'
                  : 'Stop'
                : $lang === 'he'
                  ? 'התחלה'
                  : 'Start'}</span
            >
          </button>
        {/if}
      </div>

      <!-- Link Button -->
      {#if link && link != 'undefined'}
        <a
          onmouseenter={() => hover(linkDescription)}
          onmouseleave={() => hover('0')}
          class="py-2 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          href={link}
        >
          <svg
            width="20"
            height="20"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            fill-rule="evenodd"
            clip-rule="evenodd"
          >
            <path
              d="M14.851 11.923c-.179-.641-.521-1.246-1.025-1.749-1.562-1.562-4.095-1.563-5.657 0l-4.998 4.998c-1.562 1.563-1.563 4.095 0 5.657 1.562 1.563 4.096 1.561 5.656 0l3.842-3.841.333.009c.404 0 .802-.04 1.189-.117l-4.657 4.656c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-1.952-1.951-1.952-5.12 0-7.071l4.998-4.998c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464.493.493.861 1.063 1.105 1.672l-.787.784zm-5.703.147c.178.643.521 1.25 1.026 1.756 1.562 1.563 4.096 1.561 5.656 0l4.999-4.998c1.563-1.562 1.563-4.095 0-5.657-1.562-1.562-4.095-1.563-5.657 0l-3.841 3.841-.333-.009c-.404 0-.802.04-1.189.117l4.656-4.656c.975-.976 2.256-1.464 3.536-1.464 1.279 0 2.56.488 3.535 1.464 1.951 1.951 1.951 5.119 0 7.071l-4.999 4.998c-.975.976-2.255 1.464-3.535 1.464-1.28 0-2.56-.488-3.535-1.464-.494-.495-.863-1.067-1.107-1.678l.788-.785z"
            />
          </svg>
          <span>{$lang === 'he' ? 'קישור למשימה' : 'Task Link'}</span>
        </a>
      {/if}
    {:else if low == true}
      <Lowbtn isCart="true" />
    {/if}
  </div>
</div>

<style>
  .shadow-glow {
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05);
  }

  .border-glow {
    border: 2px solid rgba(var(--glow-rgb), 0.5);
    box-shadow:
      0 4px 6px -1px rgba(0, 0, 0, 0.1),
      0 2px 4px -1px rgba(0, 0, 0, 0.06),
      0 0 20px rgba(var(--glow-rgb), 0.4),
      0 0 40px rgba(var(--glow-rgb), 0.3),
      0 0 60px rgba(var(--glow-rgb), 0.2),
      inset 0 0 20px rgba(var(--glow-rgb), 0.05),
      0 0 0 1px rgba(var(--glow-rgb), 0.3);
  }
</style>
