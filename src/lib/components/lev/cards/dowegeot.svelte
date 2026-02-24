<script>
  import { lang } from '$lib/stores/lang.js';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { toggleScrollable, isScrolable } from './isScrolable.svelte.js';

  // Modernization Imports
  import CardHeader from './CardHeader.svelte';
  import VoteStatusDisplay from './VoteStatusDisplay.svelte';
  import { getProjectData } from '$lib/stores/projectStore';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} agprice
   * @property {any} useraplyname
   * @property {any} src2
   * @property {any} missionBName
   * @property {boolean} [already]
   * @property {any} yers
   * @property {any} projectName
   * @property {any} src
   * @property {any} kindOf
   * @property {any} noofusersWaiting
   * @property {any} noofusersOk
   * @property {any} noofusersNo
   * @property {any} monts
   * @property {number} [hm]
   * @property {any} spnot
   * @property {boolean} [allr]
   * @property {(payload: { x: any }) => void} [onHover]
   * @property {(payload: { alr: any, y: string }) => void} [onAgree]
   * @property {(payload: { alr: any, y: string }) => void} [onDecline]
   * @property {(payload: { alr: any, y: string }) => void} [onNego]
   * @property {() => void} [onTochat]
   * @property {string} [glowColor]
   * @property {Array} [user_1s]
   * @property {Array} [users]
   * @property {number} [activeOrder]
   * @property {Function} [onProj]
   * @property {number} [noOfusers]
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    agprice,
    useraplyname,
    src2,
    missionBName,
    already = $bindable(false),
    yers,
    projectName,
    src,
    kindOf,
    noofusersWaiting,
    noofusersOk,
    noofusersNo,
    monts,
    hm = 1,
    spnot,
    allr = false,
    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat,
    // Modern Props
    glowColor = 'teal',
    users = [],
    projectId,
    activeOrder = 0,
    onProj,
    noOfusers = 0
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
  function handleProjectClick() {
    if (onProj) onProj();
  }

  const neged = { he: 'נדרש בירור', en: 'negotiation needed' };
  const negedT = {
    he: 'סך ההצבעות להליך בירור',
    en: 'total votes for negotiation'
  };
  const bead = { he: 'בעד', en: 'in favor' };
  const notyet = { he: 'טרם', en: 'not yet' };
  const notyetT = { he: 'לא הצביעו', en: 'not voted yet' };
  const leshana = { he: 'לשנה', en: 'per year' };
  const oneyear = { he: 'שנה אחת', en: 'one year' };
  const years = { he: 'שנים', en: 'years' };
  const intotal = { he: 'סך הכל', en: 'in total' };
  const onemonth = { he: 'חודש אחד', en: 'one month' };
  const lehodesh = { he: 'לחודש', en: 'per month' };
  const months = { he: 'חודשים', en: 'months' };
  const perunit = { he: 'ליחידה', en: 'per unit' };
  const units = { he: 'יחידות', en: 'units' };
  const oneunit = { he: 'יחידה אחת', en: 'one unit' };
  const head = {
    he: 'אישור קבלת משאב בהצלחה',
    en: 'approval of getting a resorce sucsessfully'
  };
  const totalinfavor = { he: 'סך ההצבעות בעד', en: 'total votes in favor' };
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
  <!-- Header -->
  <CardHeader
    logoSrc={src2}
    {projectName}
    cardType={head[$lang]}
    cardTitle={missionBName}
    memberCount={noOfusers}
    {glowColor}
    onProjectClick={handleProjectClick}
  />

  <!-- Content Area -->
  <div
    class=" d {isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto d space-y-4"
  >
    <div class="flex flex-col space-y-3">
      <div
        class="flex items-center mt-2 bg-gray-100 dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-gray-600"
      >
        <img
          class="w-12 h-12 rounded-full mx-4 object-cover border-2 border-barbi/30"
          src={src.length > 0
            ? src
            : 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
          alt="user profile"
        />
        <div class="flex flex-col">
          <p class="text-gray-900 dark:text-gray-100 font-bold mb-1">
            {useraplyname}
          </p>
        </div>
      </div>
      <!-- Price Calculation -->
      <div
        class="text-base sm:text-lg text-gray-800 dark:text-gray-200 flex items-center space-x-2 space-x-reverse"
      >
        <img
          style="width:2.5rem;"
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="howmuch"
        />
        {#if kindOf === 'perUnit'}
          <p>
            <span
              onmouseenter={() =>
                hover({ he: 'שווי ליחידה', en: 'per unit vallue' })}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {agprice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              {perunit[$lang]}
            </span>
            *
            <span
              onmouseenter={() => hover({ he: 'כמות', en: 'amount' })}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {hm == 1 ? `${oneunit[$lang]}` : `${hm} ${units[$lang]}`}
            </span>
            =
            <span
              onmouseenter={() => hover({ he: 'סך הכל', en: 'in total' })}
              onmouseleave={() => hover('0')}
              class="font-bold"
            >
              {(agprice * hm).toLocaleString('en-US', {
                maximumFractionDigits: 2
              })}
              {intotal[$lang]}
            </span>
          </p>
        {:else if kindOf === 'total' || kindOf === 'rent'}
          <p>
            <span
              onmouseenter={() =>
                hover({ he: 'שווי מוצע', en: 'offered vallue' })}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {agprice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </span>
          </p>
        {:else if kindOf === 'monthly'}
          <p>
            <span
              onmouseenter={() =>
                hover({ he: 'שווי לחודש', en: 'monthly vallue' })}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {agprice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              {lehodesh[$lang]}
            </span>
            *
            <span
              onmouseenter={() =>
                hover({ he: 'כמות חודשים', en: 'number of months' })}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {monts == 1 ? `${onemonth[$lang]}` : `${monts} ${months[$lang]}`}
            </span>
            =
            <span
              onmouseenter={() => hover({ he: 'סך הכל', en: 'in total' })}
              onmouseleave={() => hover('0')}
              class="font-bold"
            >
              {intotal[$lang]}
              {(agprice * monts).toLocaleString('en-US', {
                maximumFractionDigits: 2
              })}
            </span>
          </p>
        {:else if kindOf === 'yearly'}
          <p>
            <span
              onmouseenter={() =>
                hover({ he: 'שווי לשנה', en: 'yearly vallue' })}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {agprice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              {leshana[$lang]}
            </span>
            *
            <span
              onmouseenter={() =>
                hover({ he: 'מספר השנים', en: 'number of years' })}
              onmouseleave={() => hover('0')}
              style="color:var(--barbi-pink)"
            >
              {yers == 1 ? `${oneyear[$lang]}` : `${yers} ${years[$lang]}`}
            </span>
            =
            <span
              onmouseenter={() => hover({ he: 'סך הכל', en: 'in total' })}
              onmouseleave={() => hover('0')}
              class="font-bold"
            >
              {intotal[$lang]}
              {(agprice * yers).toLocaleString('en-US', {
                maximumFractionDigits: 2
              })}
            </span>
          </p>
        {/if}
      </div>

      <!-- Notes -->
      {#if spnot !== null && spnot !== 'null' && spnot !== 'undefined' && spnot !== undefined}
        <p
          class="cd d max-h-16 text-gray-700 dark:text-gray-300 text-base sm:text-lg bg-gray-50 dark:bg-slate-800 p-3 rounded-lg border border-gray-100 dark:border-gray-600"
        >
          {spnot}
        </p>
      {/if}

      <!-- User and Vote summary -->
    </div>
  </div>

  <!-- Vote Status Display Details (if available) -->
  {#if user_1s && user_1s.length > 0}
    <div class="px-4 pb-4 bg-gray-200 dark:bg-slate-700 transition-all-300">
      <VoteStatusDisplay votes={users || []} members={user_1s} {activeOrder} />
    </div>
  {/if}

  <!-- Footer Actions -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    {#if low == false}
      {#if already === false && allr === false}
        <button
          class="flex-1 py-2 flex justify-center items-center bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold rounded-xl transition-all"
          onclick={() => decline('f')}
          onmouseenter={() => hover({ he: 'התנגדות', en: 'objection' })}
          onmouseleave={() => hover('0')}
        >
          <No />
        </button>
        <button
          class="flex-2 py-2 flex justify-center items-center bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          onclick={() => agree('f')}
          onmouseenter={() => hover({ he: 'אישור', en: 'appruve' })}
          onmouseleave={() => hover('0')}
        >
          <Lev />
        </button>
      {/if}
    {:else if low == true}
      <Lowbtn isCart="true" />
    {/if}
  </div>
</div>

<style>
  .cd {
    overflow-y: auto;
  }

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
