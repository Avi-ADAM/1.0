<script>
  import Chaticon from '../../../celim/chaticon.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { calculateTimeLeft } from '$lib/func/uti/timeLeft';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';

  // רכיבים מודרניים
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
   * @property {any} kindOf
   * @property {any} easy
   * @property {any} price
   * @property {any} monts
   * @property {any} yers
   * @property {any} hm
   * @property {boolean} [already]
   * @property {boolean} [allr]
   * @property {any} [nego_mashes] - Counter offers array
   * @property {number} [timeGramaDate] - Time left for automatic approval in seconds
   * @property {(payload: { x: any }) => void} [onHover] - Callback for hover event
   * @property {(payload: { alr: any, y: string }) => void} [onAgree] - Callback for agree event
   * @property {(payload: { alr: any, y: string }) => void} [onDecline] - Callback for decline event
   * @property {(payload: { alr: any, y: string }) => void} [onNego] - Callback for nego event
   * @property {() => void} [onTochat] - Callback for tochat event
   *
   * // מאפיינים חדשים לסגנון המודרני
   * @property {string} [glowColor]
   * @property {Array} [user_1s]
   * @property {Array} [users]
   * @property {number} [activeOrder]
   * @property {Function} [onProj]
   */

  /** @type {Props} */
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
    kindOf,
    easy,
    price,
    monts,
    yers,
    hm,
    already = $bindable(),
    allr = false,
    nego_mashes = [],
    timeGramaDate,
    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat,
    // פרופס מודרניים (ברירת מחדל ירוק לאישור משאב)
    glowColor = 'green',
    users = [],
    activeOrder = 0,
    projectId,
    onProj
  } = $props();
  let user_1s = $derived.by(() => {
    return getProjectData(projectId, 'us') || [];
  });
  $effect(() => {
    console.log('Nego Mashes:', timeGramaDate);
  });

  let timeLeft = $state(0);
  let timerInterval = null;

  function initTimer(timegramaDate) {
    if (timerInterval) clearInterval(timerInterval);
    timeLeft = calculateTimeLeft(timegramaDate);
    timerInterval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(timegramaDate);
      if (newTimeLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timeLeft = 0;
        console.log('Time expired - auto approval triggered');
      } else {
        timeLeft = newTimeLeft;
      }
    }, 1000);
  }

  function cleanup() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  $effect(() => {
    if (timeGramaDate) {
      initTimer(timeGramaDate);
    }
    return () => cleanup();
  });

  const previousOffer =
    nego_mashes && nego_mashes.length > 0
      ? nego_mashes[nego_mashes.length - 1]?.attributes
      : null;
  const hasUpdatedOffer = previousOffer !== null;

  function formatTimeLeft(seconds) {
    if (seconds <= 0) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function getChanges() {
    if (!previousOffer) return [];
    const changes = [];
    if (name && previousOffer.name && previousOffer.name !== name) {
      changes.push({
        type: 'name',
        old: previousOffer.name,
        new: name,
        label: 'שם'
      });
    }
    if (descrip && previousOffer.descrip && previousOffer.descrip !== descrip) {
      changes.push({
        type: 'descrip',
        old: previousOffer.descrip,
        new: descrip,
        label: 'תיאור'
      });
    }
    if (price && previousOffer.price && previousOffer.price !== price) {
      changes.push({
        type: 'price',
        old: previousOffer.price,
        new: price,
        label: 'מחיר'
      });
    }
    if (easy && previousOffer.easy && previousOffer.easy !== easy) {
      changes.push({
        type: 'easy',
        old: previousOffer.easy,
        new: easy,
        label: 'שווי מוצע'
      });
    }
    if (hm && previousOffer.hm && previousOffer.hm !== hm) {
      changes.push({
        type: 'hm',
        old: previousOffer.hm,
        new: hm,
        label: 'כמות'
      });
    }
    return changes;
  }

  const changes = getChanges();

  function stripHtml(html) {
    if (!html) return '';
    return String(html).replace(/(<([^>]+)>)/gi, '');
  }

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
  <!-- Header המודרני -->
  <CardHeader
    logoSrc={src}
    {projectName}
    cardType={hasUpdatedOffer ? 'הצעה מתוקנת' : 'אישור משאב'}
    cardTitle={name}
    memberCount={noofusersOk + noofusersWaiting + noofusersNo}
    {glowColor}
    onProjectClick={onProj}
  />

  <!-- אזור תוכן מרכזי נגלל -->
  <div
    class="d {isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700/50'} transition-all duration-300 p-4 flex-1 overflow-y-auto space-y-4"
  >
    <!-- טיימר (מיקום מודרני מותאם) -->
    {#if timeLeft > 0}
      <div
        class="flex items-center justify-between px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-xl"
      >
        <span class="text-sm font-medium text-yellow-800 dark:text-yellow-400"
          >אישור אוטומטי בעוד:</span
        >
        <span
          class="text-lg font-bold text-red-600 dark:text-red-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm"
        >
          {formatTimeLeft(timeLeft)}
        </span>
      </div>
    {/if}

    <!-- פרטי משאב ומחירים -->
    <div
      class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <div
        class="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base flex-wrap"
      >
        <img
          style="width:2rem;"
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="howmuch"
        />

        {#if kindOf === 'perUnit'}
          <span
            onmouseenter={() => hover('שווי ליחידה')}
            onmouseleave={() => hover('0')}
            class="text-barbi dark:text-pink-400 font-bold"
          >
            {easy > 0 ? easy.toLocaleString() : price.toLocaleString()} ליחידה
          </span>
          <span class="text-gray-400">×</span>
          <span
            onmouseenter={() => hover('כמות')}
            onmouseleave={() => hover('0')}
            class="text-barbi dark:text-pink-400 font-bold"
          >
            {hm == 1 ? 'יחידה אחת' : `${hm.toLocaleString()} יחידות`}
          </span>
          <span class="text-gray-400">=</span>
          <span
            onmouseenter={() => hover('סך הכל')}
            onmouseleave={() => hover('0')}
            class="font-black text-gray-900 dark:text-white"
          >
            {easy > 0
              ? (easy * hm).toLocaleString()
              : (price * hm).toLocaleString()}
          </span>
        {:else if kindOf === 'total' || kindOf === 'rent'}
          <span
            onmouseenter={() => hover('שווי מוצע')}
            onmouseleave={() => hover('0')}
            class="text-barbi dark:text-pink-400 font-bold text-lg"
          >
            {easy > 0 ? easy.toLocaleString() : price.toLocaleString()}
          </span>
        {:else if kindOf === 'monthly'}
          <span
            onmouseenter={() => hover('שווי לחודש')}
            onmouseleave={() => hover('0')}
            class="text-barbi dark:text-pink-400 font-bold"
          >
            {easy > 0 ? easy.toLocaleString() : price.toLocaleString()} לחודש
          </span>
          <span class="text-gray-400">×</span>
          <span
            onmouseenter={() => hover('כמות חודשים')}
            onmouseleave={() => hover('0')}
            class="text-barbi dark:text-pink-400 font-bold"
          >
            {monts == 1 ? 'חודש אחד' : `${monts.toLocaleString()} חודשים`}
          </span>
          <span class="text-gray-400">=</span>
          <span
            onmouseenter={() => hover('סך הכל')}
            onmouseleave={() => hover('0')}
            class="font-black text-gray-900 dark:text-white"
          >
            {easy > 0
              ? (easy * monts).toLocaleString()
              : (price * monts).toLocaleString()}
          </span>
        {:else if kindOf === 'yearly'}
          <span
            onmouseenter={() => hover('שווי לשנה')}
            onmouseleave={() => hover('0')}
            class="text-barbi dark:text-pink-400 font-bold"
          >
            {easy > 0 ? easy.toLocaleString() : price.toLocaleString()} לשנה
          </span>
          <span class="text-gray-400">×</span>
          <span
            onmouseenter={() => hover('מספר שנים')}
            onmouseleave={() => hover('0')}
            class="text-barbi dark:text-pink-400 font-bold"
          >
            {yers === 1 ? 'שנה אחת' : `${yers.toLocaleString()} שנים`}
          </span>
          <span class="text-gray-400">=</span>
          <span
            onmouseenter={() => hover('סך הכל')}
            onmouseleave={() => hover('0')}
            class="font-black text-gray-900 dark:text-white"
          >
            {easy > 0
              ? (easy * yers).toLocaleString()
              : (price * yers).toLocaleString()}
          </span>
        {/if}
      </div>

      <!-- תיאור והערות -->
      <div class="mt-4 space-y-3">
        {#if descrip !== null && descrip !== 'null'}
          <div class="text-gray-600 dark:text-gray-300">
            <RichText outpot={descrip} editable={false} />
          </div>
        {/if}

        {#if hearotMeyuchadot && hearotMeyuchadot !== 'undefined'}
          <div
            onmouseenter={() => hover('הערות')}
            onmouseleave={() => hover('0')}
            class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 italic border-l-4 border-gray-300 dark:border-gray-500 max-h-24 overflow-y-auto"
          >
            {hearotMeyuchadot}
          </div>
        {/if}
      </div>
    </div>

    <!-- תיבת שינויים - הצעות מתוקנות -->
    {#if hasUpdatedOffer}
      <div
        class="p-4 bg-blue-50 dark:bg-blue-900/20 border-r-4 border-blue-400 dark:border-blue-500 rounded-xl"
      >
        <h3
          class="text-base font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path></svg
          >
          הצעה מתוקנת פעילה
        </h3>
        {#if changes.length > 0}
          <div class="text-sm text-blue-800 dark:text-blue-200">
            <strong class="block mb-2 text-blue-900 dark:text-blue-100"
              >השיפורים שבוצעו:</strong
            >
            <ul class="space-y-2 mr-1">
              {#each changes as change}
                {@const oldText =
                  change.type === 'descrip'
                    ? stripHtml(change.old)
                    : change.old?.toString()}
                {@const newText =
                  change.type === 'descrip'
                    ? stripHtml(change.new)
                    : (change.new?.toString() ?? '')}
                <li
                  class="flex items-center gap-3 bg-white/60 dark:bg-gray-800/60 p-2 rounded-lg"
                >
                  <span class="font-bold min-w-[60px]">{change.label}:</span>
                  <span
                    class="text-gray-500 dark:text-gray-400 line-through text-xs max-w-[120px] truncate"
                    title={oldText}
                  >
                    {oldText}
                  </span>
                  <span class="text-blue-500 dark:text-blue-400 font-bold"
                    >{$lang == 'he' ? '←' : '→'}</span
                  >
                  <span
                    class="text-green-600 dark:text-green-400 font-bold max-w-[120px] truncate"
                    title={newText}
                  >
                    {newText}
                  </span>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <div class="text-sm text-blue-700 dark:text-blue-300">
            הוגשה הצעה מתוקנת למשאב, אנא עברו עליה.
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <!-- סטטוס הצבעות -->
  {#if user_1s && user_1s.length > 0}
    <div class="pt-2">
      <VoteStatusDisplay votes={users || []} members={user_1s} {activeOrder} />
    </div>
  {:else}
    <!-- תצוגת רזרבה במקרה ואין members -->
    <div class="flex items-center gap-4 text-sm font-medium pt-2 pb-2">
      <span
        onmouseenter={() => hover('סך ההצבעות בעד')}
        onmouseleave={() => hover('0')}
        class="text-green-500 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full"
      >
        {noofusersOk} בעד
      </span>
      <span
        onmouseenter={() => hover('לא הצביעו')}
        onmouseleave={() => hover('0')}
        class="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full"
      >
        {noofusersWaiting} טרם
      </span>
      {#if noofusersNo > 0}
        <span
          onmouseenter={() => hover('כמות ההצבעות על גרסאות קודמות')}
          onmouseleave={() => hover('0')}
          class="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-full"
        >
          {noofusersNo} גרסה קודמת
        </span>
      {/if}
    </div>
  {/if}

  <!-- Footer כפתורים מודרני -->
  {#if !low}
    <div
      class="p-4 bg-gray-50 dark:bg-gray-900/60 flex gap-3 border-t border-gray-100 dark:border-gray-800"
    >
      <!-- מצב 1: טרם הצביע -->
      {#if !already && !allr}
        <!-- כפתור שיח (אם יש תיקונים) -->
        <button
          onmouseenter={() => hover($t('lev.cards.viewChat'))}
          onmouseleave={() => hover('0')}
          onclick={() => tochat()}
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-blue-400 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Chaticon class="w-5 h-5" />
          <span>{$t('lev.cards.viewChat')}</span>
        </button>

        <!-- משא ומתן -->
        <button
          onmouseenter={() => hover($t('lev.cards.negotiate'))}
          onmouseleave={() => hover('0')}
          onclick={() => nego('f')}
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-orange-400 dark:border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
            /></svg
          >
          <span>{$t('lev.cards.negotiate')}</span>
        </button>

        <!-- אישור הראשי -->
        <button
          onmouseenter={() => hover($t('lev.cards.confirmApprove'))}
          onmouseleave={() => hover('0')}
          onclick={() => agree('f')}
          class="flex-2 py-2 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <Lev class="w-8 h-8 drop-shadow-md" />
          <span>{$t('lev.cards.confirmApprove')}</span>
        </button>

        <!-- מצב 2: כבר הצביע חיובי, אבל יש מתנגדים -->
      {:else if already && mypos && noofusersNo > 0 && !allr}
        <button
          onmouseenter={() => hover($t('lev.cards.replyChat'))}
          onmouseleave={() => hover('0')}
          onclick={() => tochat()}
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-blue-400 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Chaticon />
          <span>{$t('lev.cards.replyChat')}</span>
        </button>
        <button
          onmouseenter={() => hover($t('lev.cards.newNegotiation'))}
          onmouseleave={() => hover('0')}
          onclick={() => nego('alr')}
          class="flex-2 py-2 bg-white dark:bg-gray-800 border-2 border-orange-400 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span>{$t('lev.cards.toNegotiate')}</span>
          <svg class="w-5 h-5" viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86..."
            ></path></svg
          >
        </button>

        <!-- מצב 3: התנגד, אבל יש תומכים -->
      {:else if already && !mypos && noofusersOk > 0 && !allr}
        <button
          onmouseenter={() => hover($t('lev.cards.replyChat'))}
          onmouseleave={() => hover('0')}
          onclick={() => tochat()}
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-blue-400 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Chaticon />
          <span>{$t('lev.cards.replyChat')}</span>
        </button>
        <button
          onmouseenter={() => hover($t('lev.cards.negotiate'))}
          onmouseleave={() => hover('0')}
          onclick={() => nego('alr')}
          class="flex-1 py-2 bg-white dark:bg-gray-800 border-2 border-orange-400 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24"
            ><path fill="currentColor" d="M12.75,3.94C13.75,3.22 14.91,2.86..."
            ></path></svg
          >
          <span>{$t('lev.cards.negotiate')}</span>
        </button>
        <button
          onmouseenter={() => hover($t('lev.cards.confirmApprove'))}
          onmouseleave={() => hover('0')}
          onclick={() => agree('alr')}
          class="flex-2 py-2 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <Lev className="w-6 h-6" />
          <span>{$t('lev.cards.confirmApprove')}</span>
        </button>

        <!-- מצב 4: כל שאר המצבים (כבר הוחלט סופית / הכל אושר) -->
      {:else}
        <button
          onmouseenter={() => hover($t('lev.cards.viewChat'))}
          onmouseleave={() => hover('0')}
          onclick={() => tochat()}
          class="flex-1 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Chaticon className="w-5 h-5" />
          <span>{$t('lev.cards.viewChat')}</span>
        </button>
      {/if}
    </div>
  {:else}
    <div
      class="p-2 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl"
    >
      <Lowbtn isCart={true} />
    </div>
  {/if}
</div>

<style>
  .flex-2 {
    flex: 2;
  }
  .flex-1 {
    flex: 1;
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
