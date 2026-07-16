<script>
  import { lang } from '$lib/stores/lang.js';
  import { t, isRtl} from '$lib/translations';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import moment from 'moment';
  import tr from '$lib/translations/tr.json';

  // רכיבים מודרניים חדשים
  import CardHeader from './CardHeader.svelte';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {any} mashName
   * @property {any} easy
   * @property {any} myp
   * @property {any} price
   * @property {any} total
   * @property {any} descrip
   * @property {any} projectName
   * @property {any} src
   * @property {any} spnot
   * @property {any} deadLine
   * @property {any} sqadualedf
   * @property {any} [kindOf]
   * @property {boolean} [recurring] - recurring monthly/yearly expense
   * @property {number} [cycleSize] - every N months/years
   * @property {boolean} [already]
   *
   * <!-- Props חדשים עבור הסגנון המודרני -->
   * @property {string} [glowColor]
   * @property {Array} [user_1s]
   * @property {Array} [users]
   * @property {number} [activeOrder]
   * @property {Function} [onProj]
   *
   * @property {(payload: { x: any }) => void} [onHover]
   * @property {(payload: { alr: any, y: string }) => void} [onAgree]
   * @property {(payload: { alr: any, y: string }) => void} [onDecline]
   * @property {(payload: { alr: any, y: string }) => void} [onNego]
   * @property {() => void} [onAccept]
   * @property {string|null} [myRoundProposedBy]
   * @property {any} [myRound]
   * @property {() => void} [onTochat]
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    mashName,
    easy,
    myp,
    price,
    total,
    descrip,
    projectName,
    src,
    spnot,
    deadLine,
    sqadualedf,
    kindOf,
    recurring = false,
    cycleSize = 1,
    already = $bindable(false),

    // Props מודרניים (ברירת מחדל ירוק עבור dowegeot לפי המסמך)
    glowColor = 'blue',

    onProj,

    onHover,
    onAgree,
    onDecline,
    onNego,
    onAccept,
    myRoundProposedBy = null, // 'project' → rikma countered my application (B2)
    myRound = null, // latest round terms on my application (my own / rikma counter)
    onTochat,
    // Wish/maagad-sourced need (PLAN_HUB_LEV_DEMAND_SYNC r2): the Askm flow
    // needs a rikma — the offer is made on the source page instead.
    offerHref = null
  } = $props();

  const offerAtSource = {
    he: 'להצעה בעמוד המקור',
    en: 'Offer on the source page'
  };

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
    onProj?.();
  }

  const askedVal = {
    en: 'asked value',
    he: 'הצעת הריקמה'
  };
  const myval = {
    en: 'my value',
    he: 'ההצעה שלי'
  };
  const head = {
    he: 'הצעה לשיתוף משאב בריקמה',
    en: 'Suggestion for sharing a resource with FreeMates'
  };
  const recurHead = {
    he: '🔁 משאב חוזר · אישרור כל מחזור',
    en: '🔁 Recurring resource · approved each cycle'
  };

  // Per-cycle amount for a recurring expense (value-for-calc, falling back to price).
  let perCycle = $derived(Number(easy) > 0 ? Number(easy) : Number(price) || 0);
  // Number of cycles between start (deadLine) and end (sqadualedf). null when
  // open-ended (no end date) → total can't be computed.
  let cycleCount = $derived(
    (() => {
      if (!recurring || !deadLine || !sqadualedf) return null;
      const unit = kindOf === 'yearly' ? 'years' : 'months';
      const n = moment(sqadualedf).diff(moment(deadLine), unit, true);
      return n > 0 ? n : null;
    })()
  );
  // Estimated total investment over the whole window.
  let recurTotal = $derived(
    cycleCount != null ? Math.round(perCycle * cycleCount) : null
  );
  let unitWord = $derived(
    kindOf === 'yearly'
      ? { per: 'לשנה', many: 'שנים', one: 'שנה' }
      : { per: 'לחודש', many: 'חודשים', one: 'חודש' }
  );
  let cycleCountLabel = $derived(
    cycleCount != null
      ? (() => {
          const rounded = Math.round(cycleCount * 10) / 10;
          return rounded === 1
            ? unitWord.one
            : `${rounded} ${unitWord.many}`;
        })()
      : ''
  );
</script>

<!-- Container מודרני עם אפקטי Glow -->
<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isVisible
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
          : '2, 255, 187'}
>
  <!-- CardHeader מודרני -->
  <CardHeader
    logoSrc={src}
    {projectName}
    cardType={recurring ? recurHead[$lang] : head[$lang]}
    cardTitle={mashName}
    {glowColor}
    onProjectClick={handleProjectClick}
  />

  <!-- Content Area -->
  <div
    class="d {isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700'} transition-all-300 p-4 flex-1 overflow-y-auto space-y-5"
  >
    <!-- ההצעה שלי — מוצגת כשהגשתי התאמה אישית (סבב מו"מ על המועמדות שלי) -->
    {#if myRound}
      {@const byCandidate = myRound.proposedBy !== 'project'}
      {@const roundDate = myRound.createdAt ? new Date(myRound.createdAt) : null}
      {@const descChanged = myRound.descrip && myRound.descrip !== descrip}
      {@const notesChanged = myRound.spnot && myRound.spnot !== spnot}
      {@const easyChanged = myRound.easy != null && myRound.easy !== easy}
      {@const priceChanged = myRound.price != null && myRound.price !== price}
      <div
        class="rounded-xl border-2 p-3 space-y-2 {byCandidate
          ? 'border-barbi bg-barbi/5'
          : 'border-gold bg-gold/5'}"
      >
        <div
          class="font-bold text-sm flex items-center gap-2 {byCandidate
            ? 'text-barbi'
            : 'text-yellow-700 dark:text-yellow-400'}"
        >
          <span
            class="px-2 py-0.5 rounded-full text-xs {byCandidate
              ? 'bg-barbi/20'
              : 'bg-gold/30'}"
          >
            {byCandidate ? tr.nego.candidateRound[$lang] : tr.nego.projectRound[$lang]}
          </span>
          {#if roundDate && !isNaN(roundDate.getTime())}
            <span class="text-xs font-normal text-gray-500 dark:text-gray-400">
              {roundDate.toLocaleDateString($lang)}
            </span>
          {/if}
        </div>
        {#if myRound.easy != null || myRound.price != null}
          <div
            class="flex flex-wrap items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100"
          >
            <img
              style="width:1.5rem;"
              src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
              alt=""
            />
            <span
              class={byCandidate ? 'text-barbi' : 'text-yellow-700 dark:text-yellow-400'}
            >
              {(myRound.easy ?? easy)?.toLocaleString?.() ?? (myRound.easy ?? easy)}
              {askedVal[$lang]}
              {#if myRound.price != null}
                · {(myRound.price)?.toLocaleString?.() ?? myRound.price} שווי מקובל
              {/if}
            </span>
            {#if easyChanged || priceChanged}
              <span class="text-xs text-gray-500 dark:text-gray-400">
                ({tr.nego.rikmaReq[$lang]}: {easy}{price ? ` · ${price}` : ''})
              </span>
            {/if}
          </div>
        {/if}
        {#if myRound.name && myRound.name !== mashName}
          <div class="text-xs text-gray-600 dark:text-gray-300">
            <span class="font-medium">{tr.common.nameLabel[$lang]}:</span>
            <span class="text-gray-400 line-through mx-1">{mashName}</span>
            → <span class="font-semibold">{myRound.name}</span>
          </div>
        {/if}
        {#if descChanged}
          <div class="rounded-lg bg-white/70 dark:bg-gray-900/40 p-2">
            <div
              class="font-semibold text-xs mb-1 {byCandidate
                ? 'text-barbi'
                : 'text-yellow-700 dark:text-yellow-400'}"
            >
              {tr.nego.updatedDescription[$lang]}
            </div>
            <div class="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
              <RichText outpot={myRound.descrip} editable={false} trans={true} />
            </div>
          </div>
        {/if}
        {#if notesChanged}
          <div class="rounded-lg bg-white/70 dark:bg-gray-900/40 p-2">
            <div
              class="font-semibold text-xs mb-1 {byCandidate
                ? 'text-barbi'
                : 'text-yellow-700 dark:text-yellow-400'}"
            >
              {tr.nego.updatedNotes[$lang]}
            </div>
            <div class="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
              <RichText outpot={myRound.spnot} editable={false} trans={true} />
            </div>
          </div>
        {/if}
      </div>
    {/if}

    <!-- שווי והצעות -->
    <div class="flex flex-col space-y-4">
      {#if recurring}
        <!-- באנר משאב חוזר: עלות למחזור + תדירות + סך השקעה משוער / ללא סיום -->
        <div
          class="flex flex-col gap-1.5 p-3 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20"
        >
          <div class="flex items-center flex-wrap gap-2">
            <span class="text-lg">🔁</span>
            <span
              onmouseenter={() => hover('עלות משוערת למחזור')}
              onmouseleave={() => hover('0')}
              class="font-bold text-barbi text-base sm:text-lg"
            >
              {perCycle.toLocaleString()} ₪ {unitWord.per}
            </span>
            {#if cycleSize > 1}
              <span class="text-sm text-gray-600 dark:text-gray-300">
                · כל {cycleSize} {unitWord.many}
              </span>
            {/if}
          </div>
          {#if recurTotal != null}
            <div
              onmouseenter={() => hover('סך השקעה משוער לכל התקופה')}
              onmouseleave={() => hover('0')}
              class="text-sm text-gray-700 dark:text-gray-200"
            >
              סך השקעה משוער:
              <span class="font-black text-gray-900 dark:text-white"
                >{recurTotal.toLocaleString()} ₪</span
              >
              <span class="text-gray-500 dark:text-gray-400"
                >({perCycle.toLocaleString()} × {cycleCountLabel})</span
              >
            </div>
          {:else}
            <div class="text-sm font-semibold text-gray-800 dark:text-gray-100">
              ♾️ ללא תאריך סיום — עד לסימון כהושלם
            </div>
          {/if}
          <div class="text-xs text-gray-500 dark:text-gray-400">
            בכל מחזור ייפתח חיוב לאישור ההוצאה בפועל מול הריקמה
          </div>
        </div>
      {/if}
      <div
        class="flex items-center flex-wrap gap-2 text-sm sm:text-lg text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-900/50 p-3 rounded-xl w-fit"
      >
        <img
          style="width:2.5rem;"
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="howmuch"
        />
        <span
          role="contentinfo"
          onmouseenter={() => hover(askedVal[$lang])}
          onmouseleave={() => hover('0')}
          class="font-bold text-barbi"
        >
          {easy}
          {askedVal[$lang]}
        </span>
        <span class="text-gray-400 font-light">/</span>
        <span
          role="contentinfo"
          onmouseenter={() => hover(myval[$lang])}
          onmouseleave={() => hover('0')}
          class="font-bold"
        >
          {myp}
          {myval[$lang]}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <h3
          onmouseenter={() => hover('שווי')}
          onmouseleave={() => hover('0')}
          class="text-lg font-bold text-gray-900 dark:text-gray-100"
        >
          {price}
          <span class="text-sm font-normal text-gray-500 dark:text-gray-400"
            >שווי מקובל</span
          >
        </h3>
        {#if total}
          <span class="text-gray-300 dark:text-gray-600">|</span>
          <p
            onmouseenter={() => hover('סך הכל')}
            onmouseleave={() => hover('0')}
            class="font-semibold text-gray-700 dark:text-gray-300"
          >
            {total}
          </p>
        {/if}
      </div>

      <!-- תאריכים -->
      {#if deadLine || sqadualedf}
        <div
          class="flex items-center text-sm lg:text-base text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg w-fit border border-blue-100 dark:border-blue-800/50"
        >
          <img
            class="w-5 lg:w-6 ml-2 rtl:mr-2"
            src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
            alt="calendar"
          />
          {#if deadLine}
            <span>{new Date(deadLine).toLocaleDateString()}</span>
          {/if}
          {#if deadLine && sqadualedf}
            <span class="mx-1.5">-</span>
          {/if}
          {#if sqadualedf}
            <span>{new Date(sqadualedf).toLocaleDateString()}</span>
          {/if}
        </div>
      {/if}

      <!-- תיאור והערות -->
      <div class="space-y-3 mt-2">
        {#if descrip !== null && descrip !== 'null'}
          <div class="text-gray-800 dark:text-gray-200">
            <RichText outpot={descrip} editable={false} />
          </div>
        {/if}

        {#if spnot && spnot !== undefined && spnot !== null && spnot !== 'undefined'}
          <div
            onmouseenter={() => hover('הערות')}
            onmouseleave={() => hover('0')}
            class="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-xl text-gray-700 dark:text-gray-300"
          >
            <RichText outpot={spnot} editable={false} />
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Actions Footer מודרני -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    {#if low == false}
      {#if offerHref}
        <!-- מקור משאלה/מאגד: ההצעה מוגשת בעמוד המקור -->
        <button
          onmouseenter={() => hover('לא מתאים לי')}
          onmouseleave={() => hover('0')}
          class="flex-1 py-2 flex justify-center items-center gap-2 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-all"
          onclick={() => decline('f')}
        >
          <div class="w-8 h-8"><No /></div>
          <span class="whitespace-nowrap">{$t('lev.cards.decline')}</span>
        </button>
        <a
          href={offerHref}
          onmouseenter={() => hover(offerAtSource[$lang] ?? offerAtSource.he)}
          onmouseleave={() => hover('0')}
          class="flex-2 py-2 flex justify-center items-center gap-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
        >
          <div class="w-8 h-8 text-white"><Lev /></div>
          <span class="whitespace-nowrap">{offerAtSource[$lang] ?? offerAtSource.he}</span>
        </a>
      {:else if myRoundProposedBy === 'project'}
        <!-- B2: הריקמה הציעה הצעה נגדית — לאשר או להעלות סבב נגדי -->
        <button
          onmouseenter={() => hover($t('lev.cards.acceptCounter'))}
          onmouseleave={() => hover('0')}
          class="flex-2 py-2 flex justify-center items-center gap-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          onclick={() => onAccept?.()}
        >
          <div class="w-8 h-8 text-white"><Lev /></div>
          <span class="whitespace-nowrap">{$t('lev.cards.acceptCounter')}</span>
        </button>
        <button
          onmouseenter={() => hover($t('lev.cards.proposeOther'))}
          onmouseleave={() => hover('0')}
          class="flex-1 py-2 flex justify-center items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gold text-gold hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-bold rounded-xl transition-all"
          onclick={() => nego('f')}
        >
          <span class="whitespace-nowrap">{$t('lev.cards.proposeOther')}</span>
        </button>
      {:else if already === false}
        <button
          onmouseenter={() => hover('לא מתאים לי')}
          onmouseleave={() => hover('0')}
          class="flex-1 py-2 flex justify-center items-center gap-2 bg-white dark:bg-gray-800 border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-all"
          onclick={() => decline('f')}
        >
          <div class="w-8 h-8"><No /></div>
          <span class="whitespace-nowrap">{$t('lev.cards.decline')}</span>
        </button>
        <button
          onmouseenter={() => hover('הצעה מקבילה')}
          onmouseleave={() => hover('0')}
          class="flex-1 py-2 flex justify-center items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gold text-gold hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-bold rounded-xl transition-all"
          onclick={() => nego('f')}
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path
              fill="currentColor"
              d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
            />
          </svg>
          <span class="whitespace-nowrap">הצעה מקבילה</span>
        </button>
        <button
          onmouseenter={() => hover('אני רוצה')}
          onmouseleave={() => hover('0')}
          class="flex-2 py-2 flex justify-center items-center gap-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          onclick={() => agree('f')}
        >
          <div class="w-8 h-8 text-white"><Lev /></div>
          <span class="whitespace-nowrap">{$t('lev.cards.approve')}</span>
        </button>
      {/if}
    {:else if low == true}
      <div class="w-full flex justify-center">
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
