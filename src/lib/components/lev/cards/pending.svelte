<script>
  import Chaticon from '../../../celim/chaticon.svelte';
  import { onMount } from 'svelte';
  import tr from '$lib/translations/tr.json';
  import { lang } from '$lib/stores/lang.js';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import { restim } from '$lib/func/restime.svelte';
  import { formatTime } from '../utils';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import NegotiationHistory from '../../ui/NegotiationHistory.svelte';

  // רכיבים מודרניים חדשים
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import { getProjectData } from '$lib/stores/projectStore';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} projectName
   * @property {any} src
   * @property {any} name
   * @property {any} descrip
   * @property {any} noofusersNo
   * @property {any} noofusersOk
   * @property {any} noofusersWaiting
   * @property {any} hearotMeyuchadot
   * @property {any} mypos
   * @property {any} perhour
   * @property {any} noofhours
   * @property {any} [skills]
   * @property {boolean} [isKavua]
   * @property {any} [tafkidims]
   * @property {any} [workways]
   * @property {any} restime
   * @property {any} createdAt
   * @property {any} already
   * @property {boolean} [allr]
   * @property {any} timegramaDate
   * @property {any} [acts]
   * @property {(payload: { x: any }) => void} [onHover]
   * @property {(payload: { alr: any, y: string }) => void} [onAgree]
   * @property {(payload: { alr: any, y: string }) => void} [onDecline]
   * @property {(payload: { alr: any, y: string }) => void} [onNego]
   * @property {() => void} [onTochat]
   */

  let {
    low = false,
    isVisible = false,
    projectName,
    src,
    name,
    descrip,
    noofusersNo,
    noofusersOk,
    noofusersWaiting,
    hearotMeyuchadot,
    mypos,
    perhour,
    noofhours,
    skills = [],
    isKavua = false,
    tafkidims = [],
    workways = [],
    restime,
    createdAt,
    already = $bindable(),
    allr = false,
    timegramaDate,
    acts = { data: [] },
    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat,
    sqadualed,
    negotiationMode = false,
    negopendmissions = [],
    dates,
    // פרופס מודרניים
    glowColor = 'blue',
    users = [],
    projectId,
    activeOrder = 0,
    onProj
  } = $props();
  let user_1s = $derived.by(() => {
    return getProjectData(projectId, 'us') || [];
  });
  let zman = $state();

  onMount(() => {
    let x = restim(restime);
    let cr = new Date(timegramaDate);
    let crr = cr.getTime();
    setInterval(() => {
      zman = -(Date.now() - cr);
    }, 1);
  });

  function hover(x) {
    onHover?.({ x: x });
  }
  function agree(alr) {
    already = true;
    onAgree?.({ alr: alr, y: 'a' });
  }
  function decline(alr) {
    already = true;
    onDecline?.({ alr: alr, y: 'd' });
  }
  function nego(alr) {
    onNego?.({ alr: alr, y: 'n' });
  }
  function tochat() {
    onTochat?.();
  }
  function handleProjectClick() {
    onProj?.({ projectName });
  }

  const t = {
    acts: { he: 'מטלות:', en: 'Tasks:' },
    wwneed: { he: 'דרכי עבודה מבוקשות:', en: 'ways of work for the mission:' },
    skneed: { he: 'הכישורים הנדרשים:', en: 'needed skills:' },
    rneed: { he: 'תפקיד מבוקש:', en: 'requested role:' },
    perMonth: { he: 'לחודש', en: 'per month' },
    formonth: { he: 'בכל חודש', en: 'every month' },
    onPrevious: { he: 'על גרסה קודמת', en: 'on previous version' }
  };
  const timero = {
    he: 'מונה זמן לסיום הדיון',
    en: 'time counter for end of discution'
  };
</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
  class="d {isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'} lg:w-[90%] {isVisible
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
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
          : '116, 191, 255'}
>
  <!-- Header Card המודרני -->
  <CardHeader
    logoSrc={src}
    {projectName}
    cardType={tr?.pending.head[$lang]}
    cardTitle={name}
    {glowColor}
    onProjectClick={handleProjectClick}
  />

  <!-- אזור תוכן נגלל -->
  <div
    class="d {isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700'} transition-all duration-300 flex-1 overflow-y-auto flex flex-col"
  >
    <!-- Timer Banner -->
    <div
      class="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-3 flex justify-center items-center"
    >
      <div class="flex items-center gap-2">
        <svg
          class="w-5 h-5 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path></svg
        >
        <span
          role="contentinfo"
          aria-label={timero[$lang]}
          class="text-blue-500 dark:text-blue-400 text-xl sm:text-2xl font-bold whitespace-nowrap"
          style:font-family="Digital"
          onmouseenter={() => hover(timero[$lang])}
          onmouseleave={() => hover('0')}
          style="letter-spacing: 2px;"
        >
          {formatTime(zman)}
        </span>
      </div>
    </div>

    <!-- תוכן הקלף המרכזי -->
    <div class="p-4 space-y-5">
      <!-- שורת תמחור (משוואה) -->
      <div
        class="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 shadow-sm"
      >
        <div
          class="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-sm sm:text-lg text-gray-700 dark:text-gray-300 font-medium"
        >
          <div
            class="flex items-center gap-1"
            onmouseenter={() => hover(tr?.common.valph[$lang])}
            onmouseleave={() => hover('0')}
          >
            <img
              class="w-6 h-6 sm:w-8 sm:h-8"
              src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
              alt="howmuch"
            />
            <span>{perhour} {tr?.common.perhour[$lang]}</span>
          </div>
          <span class="text-gray-400 font-bold">*</span>
          <div
            class="flex items-center gap-1"
            onmouseenter={() => hover(tr?.common.noofhours[$lang])}
            onmouseleave={() => hover('0')}
          >
            <span
              >{noofhours.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              {tr?.common.hours[$lang]}
              {isKavua ? t.formonth[$lang] : ''}</span
            >
          </div>
          <span class="text-gray-400 font-bold">=</span>
          <div
            class="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold"
            onmouseenter={() => hover(tr.mission.total[$lang])}
            onmouseleave={() => hover('0')}
          >
            <span
              >{(noofhours * perhour).toLocaleString('en-US', {
                maximumFractionDigits: 2
              })}
              {isKavua ? t.perMonth[$lang] : ''}</span
            >
          </div>
        </div>
      </div>

      <!-- תאריכים מתוכננים -->
      {#if sqadualed || dates}
        <div
          class="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm sm:text-base font-medium"
        >
          <svg
            class="w-5 h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path></svg
          >
          {#if sqadualed}
            <span>{new Date(sqadualed).toLocaleDateString($lang)}</span>
          {/if}
          {#if dates}
            <span> - {new Date(dates).toLocaleDateString($lang)}</span>
          {/if}
        </div>
      {/if}

      <!-- תיאור והערות (RichText) -->
      {#if descrip && descrip !== 'null'}
        <div class="text-gray-700 dark:text-gray-200">
          <RichText outpot={descrip} editable={false} />
        </div>
      {/if}
      {#if hearotMeyuchadot}
        <div
          class="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 rounded-r-lg text-gray-700 dark:text-gray-300 text-sm"
        >
          <RichText outpot={hearotMeyuchadot} editable={false} />
        </div>
      {/if}

      <!-- תגים: כישורים, תפקידים, דרכי עבודה -->
      <div class="space-y-4">
        {#if skills?.data?.length > 0}
          <div>
            <span
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block"
              >{t.skneed[$lang]}</span
            >
            <div class="flex flex-wrap gap-2">
              {#each skills.data as skill}
                <Tile
                  sm={true}
                  big={true}
                  bg="green"
                  word={skill.attributes.skillName}
                />
              {/each}
            </div>
          </div>
        {/if}

        {#if tafkidims?.data?.length > 0}
          <div>
            <span
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block"
              >{t.rneed[$lang]}</span
            >
            <div class="flex flex-wrap gap-2">
              {#each tafkidims.data as rol}
                <Tile
                  sm={true}
                  big={true}
                  bg="pink"
                  word={rol.attributes.roleDescription}
                />
              {/each}
            </div>
          </div>
        {/if}

        {#if workways?.data?.length > 0}
          <div>
            <span
              class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block"
              >{t.wwneed[$lang]}</span
            >
            <div class="flex flex-wrap gap-2">
              {#each workways.data as wo}
                <Tile
                  sm={true}
                  big={true}
                  bg="yellow"
                  word={wo.attributes.workWayName}
                />
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- רשימת מטלות -->
      {#if acts?.data?.length > 0}
        <div
          class="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50"
        >
          <span
            class="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 block"
            >{t.acts[$lang]}</span
          >
          <ul class="space-y-2">
            {#each acts.data as datai}
              <li
                class="flex items-start gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
              >
                <span class="mt-0.5">✅</span>
                <span class="text-gray-700 dark:text-gray-200 font-medium"
                  >{datai.attributes.shem}</span
                >
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <!-- היסטוריית משא ומתן -->
      <NegotiationHistory
        {negopendmissions}
        openmissionName={name}
        {noofhours}
        {perhour}
        missionDetails={descrip}
        {hearotMeyuchadot}
        {acts}
      />
    </div>
  </div>

  <!-- תצוגת מצב הצבעה -->
  <div
    class="bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800"
  >
    {#if user_1s && user_1s.length > 0}
      <div class="px-4 py-2">
        <VoteStatusDisplay
          votes={users || []}
          members={user_1s}
          {activeOrder}
        />
      </div>
    {:else}
      <!-- תצוגה מודרנית למונה הצבעות כאשר אין מערך משתמשים -->
      <div
        class="flex justify-between items-center px-4 py-3 text-sm font-medium"
      >
        <div
          class="flex items-center gap-1 text-green-500 dark:text-green-400"
          onmouseenter={() => hover(tr?.vots.totalin[$lang])}
          onmouseleave={() => hover('0')}
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"
            ><path
              fill-rule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clip-rule="evenodd"
            ></path></svg
          >
          <span>{noofusersOk} {tr?.vots.inFavor[$lang]}</span>
        </div>
        <div
          class="flex items-center gap-1 text-blue-500 dark:text-blue-400"
          onmouseenter={() => hover(tr?.vots.notyet[$lang])}
          onmouseleave={() => hover('0')}
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"
            ><path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
              clip-rule="evenodd"
            ></path></svg
          >
          <span>{noofusersWaiting} {tr?.vots.notyet[$lang]}</span>
        </div>
        <div
          class="flex items-center gap-1 text-purple-500 dark:text-purple-400"
          onmouseenter={() => hover(t.onPrevious[$lang])}
          onmouseleave={() => hover('0')}
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"
            ><path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path></svg
          >
          <span>{noofusersNo} {t.onPrevious[$lang]}</span>
        </div>
      </div>
    {/if}
  </div>

  <!-- Footer עם כפתורי פעולה -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3"
  >
    {#if !low}
      {#if already === false && allr === false}
        <button
          class="flex-1 py-2.5 bg-white dark:bg-gray-800 border-2 border-yellow-500 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
          onclick={() => nego('f')}
          onmouseenter={() => hover(tr?.common.nego[$lang])}
          onmouseleave={() => hover('0')}
        >
          <span class="hidden sm:inline">{tr?.common.nego[$lang]}</span>
          <svg
            class="w-5 h-5 group-hover:scale-110 transition-transform"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
            />
          </svg>
        </button>
        <button
          class="flex-2 py-2.5 bg-gradient-to-r from-blue-500 to-blue-400 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
          onclick={() => agree('f')}
          onmouseenter={() => hover(tr?.common.approve[$lang])}
          onmouseleave={() => hover('0')}
        >
          <span class="group-hover:scale-110 transition-transform"><Lev /></span
          >
          <span>{tr?.common.approve[$lang]}</span>
        </button>
      {/if}
      <button
        class="flex-1 py-2.5 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
        onclick={() => tochat()}
        onmouseenter={() => hover(tr?.common.watchthe[$lang])}
        onmouseleave={() => hover('0')}
      >
        <span class="group-hover:scale-110 transition-transform"
          ><Chaticon /></span
        >
        <span>{tr?.common.watchthe[$lang]}</span>
      </button>
    {:else}
      <Lowbtn isCart={true} />
    {/if}
  </div>
</div>

<style>
  .flex-2 {
    flex: 2;
  }

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
