<script>
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import Lev from '../../../celim/lev.svelte';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import No from '../../../celim/no.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';

  // ייבוא רכיבים מודרניים
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import { getProjectData } from '$lib/stores/projectStore';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} projectName
   * @property {any} src
   * @property {any} openmissionName
   * @property {any} missionDetails
   * @property {any} useraplyname
   * @property {any} noofusersNo
   * @property {any} noofusersOk
   * @property {any} noofusersWaiting
   * @property {any} deadline
   * @property {any} easy
   * @property {any} myp
   * @property {any} price
   * @property {boolean} [already]
   * @property {any} src2
   * @property {number} [perhour]
   * @property {number} [noofhours]
   * @property {(x: any) => void} [onHover]
   * @property {(alr: any) => void} [onAgree]
   * @property {(alr: any) => void} [onDecline]
   *
   * -- פרופס חדשים למערכת המודרנית --
   * @property {string} [glowColor]
   * @property {Array} [user_1s]
   * @property {Array} [users]
   * @property {number} [activeOrder]
   * @property {() => void} [onProj]
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    projectName,
    src,
    openmissionName,
    missionDetails,
    useraplyname,
    noofusersNo,
    noofusersOk,
    noofusersWaiting,
    deadline,
    easy,
    myp,
    price,
    already = $bindable(false),
    src2,
    perhour = 0,
    noofhours = 0,
    onHover,
    onAgree,
    onDecline,
    projectId,
    // הגדרות עיצוב מודרני
    glowColor = 'orange',
    users = [],
    activeOrder = 0,
    onProj
  } = $props();
  let user_1s = $derived.by(() => {
    return getProjectData(projectId, 'us') || [];
  });
  function hover(x) {
    onHover?.(x);
  }

  function agree(alr) {
    already = true;
    onAgree?.(alr);
  }

  function decline(alr) {
    already = true;
    onDecline?.(alr);
  }

  function handleProjectClick() {
    onProj?.();
  }
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
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isVisible
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
  <!-- Header המודרני -->
  <CardHeader
    logoSrc={src2}
    {projectName}
    cardType={$lang == 'he'
      ? 'הצבעה על שיתוף משאב והצטרפות לריקמה'
      : 'Resource Share & Join Vote'}
    cardTitle={openmissionName}
    memberCount={noofusersNo + noofusersOk + noofusersWaiting || 0}
    {glowColor}
    onProjectClick={handleProjectClick}
  />

  <!-- אזור תוכן הקלף -->
  <div
    class="d {isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700'} transition-all duration-300 p-4 flex-1 overflow-y-auto d flex flex-col space-y-4"
  >
    <!-- פרטי משתמש והצבעות היסטוריות -->
    <div
      class="flex items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
    >
      <img
        class="w-12 h-12 rounded-full border-2 border-[rgba(var(--glow-rgb),0.5)] mr-4 ml-4 object-cover"
        src={src?.length > 0
          ? src
          : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
        alt="User Profile"
      />
      <div class="text-sm flex-1">
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
          {$t('lev.cards.requesterDetails')}
        </p>
        <p class="text-gray-900 dark:text-white font-bold text-base mb-1">
          {useraplyname}
        </p>
      </div>
    </div>

    <!-- תיבת פרטי שווי הצעות (מודרני ורספונסיבי ל-Dark Mode) -->
    <div
      class="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-xl space-y-3 border border-gray-200 dark:border-gray-700/50"
    >
      <div
        class="text-sm sm:text-lg text-gray-700 dark:text-gray-300 flex items-center flex-wrap gap-2 leading-tight"
      >
        <img
          style="width:2.5rem;"
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="howmuch"
        />
        <span
          onmouseenter={() => hover('ההצעה שהתקבלה')}
          onmouseleave={() => hover('0')}
          class="text-barbi font-bold"
        >
          {myp} השווי המוצע
        </span>
        <span class="text-gray-400">/</span>
        <span
          onmouseenter={() => hover('ההצעה של הריקמה')}
          onmouseleave={() => hover('0')}
          class="text-gray-800 dark:text-gray-200 font-medium"
        >
          {easy} השווי שהצענו
        </span>
      </div>
      <h3
        onmouseenter={() => hover('שווי')}
        onmouseleave={() => hover('0')}
        class="text-lg font-bold text-gray-900 dark:text-white mt-2"
      >
        {price}
        <span class="text-sm font-normal text-gray-500 dark:text-gray-400"
          >שווי מקובל</span
        >
      </h3>
    </div>

    <!-- פירוט משימה (RichText) -->
    {#if missionDetails}
      <div class="text-gray-800 dark:text-gray-200">
        <RichText outpot={missionDetails} editable={false} />
      </div>
    {/if}
  </div>

  <!-- תצוגת סטטוס הצבעות מודרנית (במידה ויש מידע מתאים) -->
  {#if user_1s && user_1s.length > 0}
    <div
      class="px-4 pb-4 {isScrolable.value
        ? 'bg-white dark:bg-slate-800'
        : 'bg-gray-50 dark:bg-slate-700'}"
    >
      <VoteStatusDisplay votes={users || []} members={user_1s} {activeOrder} />
    </div>
  {/if}

  <!-- Footer כפתורי פעולה -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    {#if low == false}
      {#if already === false}
        <button
          class="flex-1 py-2 flex justify-center items-center bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-all"
          onmouseenter={() => hover($t('lev.cards.confirmDecline'))}
          onmouseleave={() => hover('0')}
          onclick={() => decline('f')}
        >
          <No />
          <span class="ms-2">{$t('lev.cards.confirmDecline')}</span>
        </button>
        <button
          class="flex-2 py-2 flex justify-center items-center bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          onmouseenter={() => hover($t('lev.cards.confirmApprove'))}
          onmouseleave={() => hover('0')}
          onclick={() => agree('f')}
        >
          <Lev />
          <span class="ms-2">{$t('lev.cards.confirmApprove')}</span>
        </button>
      {/if}
    {:else if low == true}
      <div class="w-full">
        <Lowbtn isCart={true} />
      </div>
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
