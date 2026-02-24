<script>
  import Chaticon from '../../../celim/chaticon.svelte';
  import tr from '$lib/translations/tr.json';
  import { lang } from '$lib/stores/lang.js';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { formatTime } from '../utils';
  import TimetToTimegrama from './timetToTimegrama.svelte';
  import { toggleScrollable, isScrolable } from './isScrolable.svelte.js';

  // רכיבים מודרניים חדשים
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import { getProjectData } from '$lib/stores/projectStore';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} projectName
   * @property {any} whatt
   * @property {any} timegramaDate
   * @property {any} src
   * @property {any} why
   * @property {any} src2
   * @property {any} missionBName
   * @property {any} missionDetails
   * @property {any} noofusersNo
   * @property {any} noofusersOk
   * @property {any} noofusersWaiting
   * @property {any} hearotMeyuchadot
   * @property {any} mypos
   * @property {any} valph
   * @property {any} nhours
   * @property {any} useraplyname
   * @property {any} already
   * @property {boolean} [allr]
   * @property {(payload: { x: any }) => void} [onHover] - Callback for hover event
   * @property {(payload: { alr: any, y: string }) => void} [onAgree] - Callback for agree event
   * @property {(payload: { alr: any, y: string }) => void} [onDecline] - Callback for decline event
   * @property {(payload: { alr: any, y: string }) => void} [onNego] - Callback for nego event
   * @property {() => void} [onTochat] - Callback for tochat event
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    projectName,
    whatt,
    timegramaDate,
    src,
    why,
    src2,
    missionBName,
    missionDetails,
    noofusersNo,
    noofusersOk,
    noofusersWaiting,
    hearotMeyuchadot,
    mypos,
    valph,
    nhours,
    useraplyname,
    already = $bindable(),
    allr = false,
    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat,

    // Props מודרניים
    glowColor = 'teal',
    projectId,
    users = [],
    activeOrder = 0,
    onProj
  } = $props();
  let user_1s = $derived.by(() => {
    return getProjectData(projectId, 'us') || [];
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

  const neged = { he: 'נגד', en: 'against' };
  const bead = { he: 'בעד', en: 'in favor' };
  const notyet = { he: 'טרם', en: 'not yet' };
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
  class="d {isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'} lg:w-[90%] {isVisible
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
          : glowColor === 'orange'
            ? '254, 172, 49'
            : glowColor === 'purple'
              ? '168, 85, 247'
              : glowColor === 'red'
                ? '239, 68, 68'
                : glowColor === 'teal'
                  ? '20, 184, 166'
                  : '2, 255, 187'}
>
  <!-- כותרת מודרנית -->
  <CardHeader
    logoSrc={src2}
    {projectName}
    cardType={tr.headers.misfini[$lang]}
    cardTitle={missionBName}
    memberCount={user_1s?.length ||
      noofusersOk + noofusersWaiting + noofusersNo}
    {glowColor}
    onProjectClick={() => onProj?.()}
  />

  <!-- תוכן הקלף -->
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700/50'} transition-all duration-300 p-4 flex-1 overflow-y-auto d space-y-4"
  >
    <!-- חישוב תשלום / שעות -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 gap-3 shadow-sm"
    >
      <div class="flex items-center gap-3">
        <div
          class="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-100 dark:border-gray-700"
        >
          <img
            class="w-8 h-8"
            src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
            alt="howmuch"
          />
        </div>
        <div
          class="text-sm font-medium text-gray-600 dark:text-gray-400 flex flex-wrap items-center gap-1"
        >
          <span
            class="hover:text-gray-900 dark:hover:text-white transition-colors"
            onmouseenter={() => hover(`${tr.common.valph[$lang]}`)}
            onmouseleave={() => hover('0')}
            >{valph} {tr.common.perhour[$lang]}</span
          >
          <span class="text-gray-400 px-1 font-bold">*</span>
          <span
            class="hover:text-gray-900 dark:hover:text-white transition-colors"
            onmouseenter={() =>
              hover(
                `${tr.common.noofhours?.[$lang] || tr.common.hours[$lang]}`
              )}
            onmouseleave={() => hover('0')}
            >{(nhours || 0).toLocaleString('en-US', {
              maximumFractionDigits: 2
            })}
            {tr.common.hours[$lang]}</span
          >
        </div>
      </div>
      <div
        class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl border border-green-100 dark:border-green-800/30"
        onmouseenter={() => hover(`${tr.common.total[$lang]}`)}
        onmouseleave={() => hover('0')}
      >
        <span class="text-green-500 dark:text-green-400 text-sm font-normal"
          >=</span
        >
        {((nhours || 0) * (valph || 0)).toLocaleString('en-US', {
          maximumFractionDigits: 2
        })}
      </div>
    </div>

    <!-- פרטי משימה -->
    {#if missionDetails !== null && missionDetails !== 'null' && missionDetails !== 'undefined' && missionDetails !== undefined}
      <div
        class="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm cd"
      >
        {missionDetails}
      </div>
    {/if}

    <!-- הערות מיוחדות -->
    {#if hearotMeyuchadot && hearotMeyuchadot !== 'null' && hearotMeyuchadot !== 'undefined'}
      <div
        class="flex gap-2 text-gray-600 dark:text-gray-400 text-sm bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-100 dark:border-yellow-900/30 cd"
        onmouseenter={() => hover(`${tr.common.notes[$lang]}`)}
        onmouseleave={() => hover('0')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5 text-yellow-500 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="12" cy="12" r="10"></circle><line
            x1="12"
            y1="16"
            x2="12"
            y2="12"
          ></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg
        >
        <span class="italic">{hearotMeyuchadot}</span>
      </div>
    {/if}

    <!-- קישורים וקבצים -->
    <div class="flex flex-col sm:flex-row gap-2">
      {#if why !== undefined && why !== null && why !== 'undefined'}
        {#if why.startsWith('http')}
          <a
            target="_blank"
            href={why}
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-800/30"
            onmouseenter={() => hover(`${tr.common.finalwords[$lang]}`)}
            onmouseleave={() => hover('0')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              ><path
                d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              ></path><path
                d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              ></path></svg
            >
            {tr.common.link ? tr.common.link[$lang] : 'Link'}
          </a>
        {:else}
          <div
            class="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm cd"
            onmouseenter={() => hover(`${tr.common.finalwords[$lang]}`)}
            onmouseleave={() => hover('0')}
          >
            {why}
          </div>
        {/if}
      {/if}
      {#if whatt}
        <a
          target="_blank"
          href={whatt}
          class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-barbi/10 text-barbi rounded-xl text-sm font-medium hover:bg-barbi/20 transition-colors border border-barbi/20"
          onmouseenter={() => hover(`${tr.finiapp.file[$lang]}`)}
          onmouseleave={() => hover('0')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            ><path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            ></path><polyline points="14 2 14 8 20 8"></polyline><line
              x1="16"
              y1="13"
              x2="8"
              y2="13"
            ></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline
              points="10 9 9 9 8 9"
            ></polyline></svg
          >
          {tr.finiapp.file[$lang]}
        </a>
      {/if}
    </div>

    <!-- משתמש מבקש וסיכום הצבעות -->
    <div
      class="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mt-2"
    >
      <img
        class="w-12 h-12 rounded-full border-2 border-green-500/20 p-0.5 object-cover flex-shrink-0"
        src={src ??
          'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
        alt="user"
      />
      <div class="ml-4 mr-4 flex-1 overflow-hidden">
        <p
          class="text-gray-900 dark:text-white font-bold text-sm mb-1 truncate"
        >
          {useraplyname}
        </p>
        <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div
            class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md"
            onmouseenter={() => hover(`${tr.vots.totalin[$lang]}`)}
            onmouseleave={() => hover('0')}
          >
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"
            ></span>{noofusersOk}
            {bead[$lang]}
          </div>
          <div
            class="flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md"
            onmouseenter={() => hover(`${tr.vots.notyet[$lang]}`)}
            onmouseleave={() => hover('0')}
          >
            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"
            ></span>{noofusersWaiting}
            {notyet[$lang]}
          </div>
          <div
            class="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md"
            onmouseenter={() => hover(`${tr.vots.totalno[$lang]}`)}
            onmouseleave={() => hover('0')}
          >
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"
            ></span>{noofusersNo}
            {neged[$lang]}
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center mt-2">
      <TimetToTimegrama {timegramaDate} />
    </div>
  </div>

  <!-- תצוגת משתמשים והצבעות (במידה והוזרק מה-DB המודרני) -->
  {#if user_1s && user_1s.length > 0}
    <div class="px-4 pb-3 bg-white dark:bg-slate-800">
      <VoteStatusDisplay votes={users || []} members={user_1s} {activeOrder} />
    </div>
  {/if}

  <!-- Footer פעולות -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    {#if !low}
      {#if already === false && allr === false}
        <button
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-all flex justify-center items-center"
          onmouseenter={() => hover({ he: 'התנגדות', en: 'objection' })}
          onmouseleave={() => hover('0')}
          onclick={() => decline('f')}
        >
          <No class="w-6 h-6" />
        </button>

        <button
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-yellow-500 text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-bold rounded-xl transition-all flex justify-center items-center"
          onmouseenter={() => hover(`${tr.common.nego[$lang]}`)}
          onmouseleave={() => hover('0')}
          onclick={() => nego('f')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-6 h-6"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
            />
          </svg>
        </button>

        <button
          class="flex-2 py-2 bg-gradient-to-r from-emerald-400 to-green-500 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex justify-center items-center"
          onmouseenter={() => hover({ he: 'אישור', en: 'approve' })}
          onmouseleave={() => hover('0')}
          onclick={() => agree('f')}
        >
          <Lev class="w-6 h-6" />
        </button>
      {/if}
    {:else if low == true}
      <Lowbtn isCart="true" />
    {/if}
  </div>
</div>

<style>
  .flex-2 {
    flex: 2;
  }

  .cd {
    overflow-y: auto;
    max-height: 5rem;
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
