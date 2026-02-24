<script>
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';

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
    already = $bindable(false),

    // Props מודרניים (ברירת מחדל ירוק עבור dowegeot לפי המסמך)
    glowColor = 'blue',

    onProj,

    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat
  } = $props();

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
</script>

<!-- Container מודרני עם אפקטי Glow -->
<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$lang == 'he' ? 'rtl' : 'ltr'}
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
    cardType={head[$lang]}
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
    <!-- שווי והצעות -->
    <div class="flex flex-col space-y-4">
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
      {#if already === false}
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
        <Lowbtn isCart="true" />
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
