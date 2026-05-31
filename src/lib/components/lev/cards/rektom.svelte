<script>
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import Lev from '../../../celim/lev.svelte';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import No from '../../../celim/no.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import Chaticon from '$lib/celim/chaticon.svelte';

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
   * @property {any} [hearotMeyuchadot]
   * @property {any} [spnot]
   * @property {boolean} [already]
   * @property {any} src2
   * @property {number} [perhour]
   * @property {number} [noofhours]
   * @property {(x: any) => void} [onHover]
   * @property {(alr: any) => void} [onAgree]
   * @property {(alr: any) => void} [onDecline]
   * @property {() => void} [onNego]
   * @property {() => void} [onTochat]
   *
   * -- פרופס חדשים למשא ומתן --
   * @property {string} [glowColor]
   * @property {Array} [users]
   * @property {number} [activeOrder]
   * @property {boolean} [negotiationMode]
   * @property {boolean} [isRishon]
   * @property {any[]} [negopendmissions]
   * @property {number} [orderon]
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
    hearotMeyuchadot,
    spnot,
    already = $bindable(false),
    src2,
    perhour = 0,
    noofhours = 0,
    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat,
    projectId,
    // הגדרות עיצוב מודרני
    glowColor = 'orange',
    users = [],
    activeOrder = 0,
    onProj,
    // משא ומתן
    negotiationMode = false,
    isRishon = false,
    negopendmissions = [],
    orderon = 0,
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

  function nego(alr) {
    already = true;
    onNego?.(alr);
  }

  function tochat() {
    onTochat?.();
  }

  function handleProjectClick() {
    onProj?.();
  }

  // טקסט כותרת:
  // isRishon (isSelfProposal) = חבר פרויקט שיצר ישירות → אישרור כפול: גם ה"צורך" וגם שהחבר נותן אותו
  // אחרת = ספק חיצוני הציע → אישרור השמה רגיל בלבד
  const cardTypeText = $derived(
    isRishon
      ? { he: 'אישרור השמה ושיתוף משאב', en: 'Resource Assignment & Share Approval' }
      : { he: 'אישרור בקשה לשיתוף משאב', en: 'Resource Request Approval' }
  );

  // הצגת הערות מיוחדות (hearotMeyuchadot או spnot)
  const specialNotes = $derived(
    (hearotMeyuchadot && hearotMeyuchadot !== 'null' && hearotMeyuchadot !== 'undefined' && hearotMeyuchadot.length > 0)
      ? hearotMeyuchadot
      : (spnot && spnot !== 'null' && spnot !== 'undefined' && spnot.length > 0)
        ? spnot
        : null
  );
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
    cardType={cardTypeText[$lang] ?? cardTypeText['he']}
    cardTitle={openmissionName}
    memberCount={noofusersNo + noofusersOk + noofusersWaiting || 0}
    {glowColor}
    onProjectClick={handleProjectClick}
  >
    {#snippet actions()}
      {#if negotiationMode}
        <span class="text-sm bg-gold text-white px-2 py-1 rounded-full">
          {$lang === 'he' ? 'מצב משא ומתן' : 'Negotiation Mode'}
        </span>
      {/if}
      {#if negopendmissions && negopendmissions.length > 0}
        <span class="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
          {$lang === 'he'
            ? `${negopendmissions.length} משא ומתן`
            : `${negopendmissions.length} negotiations`}
        </span>
      {/if}
    {/snippet}
  </CardHeader>

  <!-- אזור תוכן הקלף -->
  <div
    class="d {isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700'} transition-all duration-300 p-4 flex-1 overflow-y-auto d flex flex-col space-y-4"
  >
    <!-- פרטי משתמש -->
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
          {isRishon
            ? ($lang === 'he' ? 'חבר/ת הריקמה המציע/ה:' : 'Team member proposing:')
            : ($lang === 'he' ? 'מציע/ה את המשאב:' : 'Resource offered by:')}
        </p>
        <p class="text-gray-900 dark:text-white font-bold text-base mb-1">
          {useraplyname}
        </p>
      </div>
    </div>

    <!-- פרטי שווי ועלות -->
    <div
      class="bg-gray-100 dark:bg-gray-900/50 p-4 rounded-xl space-y-3 border border-gray-200 dark:border-gray-700/50"
    >
      <div class="flex items-center gap-3 flex-wrap">
        <img
          style="width:2.5rem;"
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="howmuch"
          class="flex-shrink-0"
        />
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base flex-1">
          <div class="flex items-center gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {$lang === 'he' ? 'עלות:' : 'Cost:'}
            </span>
            <span
              onmouseenter={() => hover($lang === 'he' ? 'עלות רשומה' : 'Listed cost')}
              onmouseleave={() => hover('0')}
              class="text-gray-900 dark:text-white font-bold"
            >
              {price}
            </span>
          </div>
          <span class="text-gray-400 hidden sm:inline">|</span>
          <div class="flex items-center gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {$lang === 'he' ? 'שווי מוצע:' : 'Offered value:'}
            </span>
            <span
              onmouseenter={() => hover($lang === 'he' ? 'ההצעה שהתקבלה' : 'Submitted offer')}
              onmouseleave={() => hover('0')}
              class="text-barbi font-bold"
            >
              {myp}
            </span>
          </div>
          <span class="text-gray-400 hidden sm:inline">|</span>
          <div class="flex items-center gap-1">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {$lang === 'he' ? 'שווי הריקמה:' : 'Our value:'}
            </span>
            <span
              onmouseenter={() => hover($lang === 'he' ? 'ההצעה של הריקמה' : 'Our offer')}
              onmouseleave={() => hover('0')}
              class="text-gray-700 dark:text-gray-300 font-medium"
            >
              {easy}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- תאריך יעד -->
    {#if deadline}
      <div
        class="flex gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <img
          class="w-5 h-5 flex-shrink-0"
          src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
          alt="calendar"
        />
        <span>{new Date(deadline).toLocaleDateString($lang)}</span>
      </div>
    {/if}

    <!-- תיאור המשאב -->
    {#if missionDetails && missionDetails.trim().length > 0}
      <div
        class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-900/20 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
      >
        <p class="text-xs font-bold text-barbi mb-1">
          {$lang === 'he' ? 'תיאור המשאב:' : 'Resource description:'}
        </p>
        <RichText outpot={missionDetails} editable={false} />
      </div>
    {/if}

    <!-- הערות מיוחדות -->
    {#if specialNotes}
      <div
        class="text-sm text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700"
      >
        <p class="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
          {$lang === 'he' ? 'הערות מיוחדות:' : 'Special notes:'}
        </p>
        <p class="text-gray-700 dark:text-gray-300">{specialNotes}</p>
      </div>
    {/if}
  </div>

  <!-- תצוגת סטטוס הצבעות מודרנית -->
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
        <!-- כפתור אישור -->
        <button
          class="flex-[2] py-2 flex justify-center items-center bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          onmouseenter={() => hover($t('lev.cards.confirmApprove'))}
          onmouseleave={() => hover('0')}
          onclick={() => agree('f')}
        >
          <Lev />
          <span class="ms-2 text-xs sm:text-sm whitespace-nowrap">{$t('lev.cards.confirmApprove')}</span>
        </button>

        <!-- כפתור משא ומתן (isRishon) או דחיה (שאר חברי הריקמה) -->
        <button
          aria-label={isRishon
            ? negotiationMode
              ? ($lang === 'he' ? 'יציאה ממשא ומתן' : 'Exit Negotiation')
              : ($lang === 'he' ? 'משא ומתן' : 'Negotiate')
            : $t('lev.cards.confirmDecline')}
          onmouseenter={() =>
            hover(
              isRishon
                ? negotiationMode
                  ? ($lang === 'he' ? 'יציאה ממשא ומתן' : 'Exit Negotiation')
                  : ($lang === 'he' ? 'משא ומתן' : 'Negotiate')
                : $t('lev.cards.confirmDecline')
            )}
          onmouseleave={() => hover('0')}
          onclick={() => isRishon ? nego('f') : decline('f')}
          class="flex-1 py-2 flex justify-center items-center font-bold rounded-xl transition-all {isRishon
            ? 'bg-white dark:bg-gray-800 border-2 border-gold text-gold hover:bg-gold/10 ' + (negotiationMode ? 'ring-2 ring-gold' : '')
            : 'bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}"
        >
          {#if isRishon}
            {#if negotiationMode}
              <!-- X icon for exit nego -->
              <svg class="w-5 h-5" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
              </svg>
              <span class="ms-2 text-xs sm:text-sm whitespace-nowrap">
                {$lang === 'he' ? 'יציאה' : 'Exit'}
              </span>
            {:else}
              <!-- Negotiate icon -->
              <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="24">
                <path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"/>
              </svg>
              <span class="ms-2 text-xs sm:text-sm whitespace-nowrap">
                {$lang === 'he' ? 'משא ומתן' : 'Negotiate'}
              </span>
            {/if}
          {:else}
            <No />
            <span class="ms-2 text-xs sm:text-sm whitespace-nowrap">{$t('lev.cards.confirmDecline')}</span>
          {/if}
        </button>

        <!-- כפתור צ'אט -->
        {#if onTochat}
          <button
            aria-label={$lang === 'he' ? "צ'אט" : 'Chat'}
            onmouseenter={() => hover($lang === 'he' ? "צ'אט" : 'Chat')}
            onmouseleave={() => hover('0')}
            class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-blue-500 text-blue-500 hover:bg-blue-50 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            onclick={() => tochat()}
          >
            <Chaticon />
          </button>
        {/if}
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
