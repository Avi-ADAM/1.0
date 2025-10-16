<script>
  import Chaticon from '../../../celim/chaticon.svelte';
  import { lang } from '$lib/stores/lang.js';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { calculateTimeLeft } from '$lib/func/uti/timeLeft';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import AuthorityBadge from '../../ui/AuthorityBadge.svelte';
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
    onTochat
  } = $props();
  $effect(() => {
    console.log('Nego Mashes:', timeGramaDate);
  });
  let timeLeft = $state(0);
  let timerInterval = null;

  // Handle timer logic in the component
  function initTimer(timegramaDate) {
    // Clear existing interval
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Calculate initial time
    timeLeft = calculateTimeLeft(timegramaDate);

    // Update every second
    timerInterval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(timegramaDate);
      if (newTimeLeft <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        timeLeft = 0;
        // Handle auto-approval here
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
  // Get the previous offer (last item in nego_mashes is the previous version)
  const previousOffer =
    nego_mashes && nego_mashes.length > 0
      ? nego_mashes[nego_mashes.length - 1]?.attributes
      : null;
  const hasUpdatedOffer = previousOffer !== null;

  // Format time left
  function formatTimeLeft(seconds) {
    if (seconds <= 0) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Compare current values with previous offer and show changes
  function getChanges() {
    if (!previousOffer) return [];

    const changes = [];

    // Compare current name with previous name
    if (name && previousOffer.name && previousOffer.name !== name) {
      changes.push({
        type: 'name',
        old: previousOffer.name,
        new: name,
        label: 'שם'
      });
    }

    // Compare current description with previous description
    if (descrip && previousOffer.descrip && previousOffer.descrip !== descrip) {
      changes.push({
        type: 'descrip',
        old: previousOffer.descrip,
        new: descrip,
        label: 'תיאור'
      });
    }

    // Compare current price with previous price
    if (price && previousOffer.price && previousOffer.price !== price) {
      changes.push({
        type: 'price',
        old: previousOffer.price,
        new: price,
        label: 'מחיר'
      });
    }

    // Compare current easy value with previous easy value
    if (easy && previousOffer.easy && previousOffer.easy !== easy) {
      changes.push({
        type: 'easy',
        old: previousOffer.easy,
        new: easy,
        label: 'שווי מוצע'
      });
    }

    // Compare current quantity with previous quantity
    if (hm && previousOffer.hm && previousOffer.hm !== hm) {
      changes.push({
        type: 'hm',
        old: previousOffer.hm,
        new: hm,
        label: 'כמות'
      });
    }
    console.log(changes);
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
  class=" d {isVisible
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} leading-normal {isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'} bg-white lg:w-[90%]"
>
  <div
    class="flex flex-wrap sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre gap-2"
  >
    <div class="relative flex items-center space-x-1 flex-1 min-w-0">
      <AuthorityBadge
        logoSrc={src}
        {projectName}
        size={isMobileOrTablet() ? 80 : 120}
      />
      <div class="flex flex-col leading-tight ml-4 min-w-0 flex-1">
        <div class="sm:text-lg text-md mt-1 flex items-center">
          <span class="text-barbi text-center mr-3 sm:text-3xl text-xl">
            {hasUpdatedOffer
              ? ' הצבעה על הצעה מתוקנת למשאב חדש'
              : 'הצבעה על אישור משאב חדש'}
          </span>
        </div>
        <div class="text-gray-900 font-bold text-lg sm:text-2xl truncate">
          {name}
        </div>
      </div>
    </div>

    <!-- Timer - responsive positioning -->
    {#if timeLeft > 0}
      <div
        class="flex flex-col items-center justify-center w-full sm:w-auto sm:justify-end"
      >
        <div class="text-xs text-gray-600 whitespace-nowrap">
          אישור אוטומטי בעוד:
        </div>
        <div
          class="text-lg font-bold text-red-600 bg-yellow-100 px-2 py-1 rounded whitespace-nowrap"
        >
          {formatTimeLeft(timeLeft)}
        </div>
      </div>
    {/if}
  </div>

  <div
    class="{isScrolable.value
      ? 'bg-white'
      : 'bg-gray-200'} transition-all-300 rounded-b lg:rounded-b-none lg:rounded-r p-4 mb-12 flex flex-col justify-between leading-normal"
  >
    <div class="mb-8">
      <p style="line-height: 1;" class=" text-gray-600 flex items-center">
        <img
          style="width:2.5rem;"
          class=""
          src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
          alt="howmuch"
        />
        {#if kindOf === 'perUnit'}
          <span
            onmouseenter={() => hover(' שווי ליחידה')}
            onmouseleave={() => hover('0')}
            style="color:var(--barbi-pink)"
          >
            {easy > 0 ? easy.toLocaleString() : price.toLocaleString()} ליחידה
          </span>
          *
          <span
            onmouseenter={() => hover('כמות')}
            onmouseleave={() => hover('0')}
            style="color:var(--barbi-pink)"
          >
            {hm == 1 ? 'יחידה אחת' : `${hm.toLocaleString()} יחידות`}
          </span>
          =
          <span
            onmouseenter={() => hover('סך הכל')}
            onmouseleave={() => hover('0')}
          >
            {easy > 0
              ? (easy * hm).toLocaleString()
              : (price * hm).toLocaleString()}
          </span>
        {:else if kindOf === 'total' || kindOf === 'rent'}
          <span
            onmouseenter={() => hover('שווי מוצע')}
            onmouseleave={() => hover('0')}
            style="color:var(--barbi-pink)"
          >
            {easy > 0 ? easy.toLocaleString() : price.toLocaleString()}
          </span>
        {:else if kindOf === 'monthly'}
          <span
            onmouseenter={() => hover('שווי לחודש')}
            onmouseleave={() => hover('0')}
            style="color:var(--barbi-pink)"
          >
            {easy > 0 ? easy.toLocaleString() : price.toLocaleString()} לחודש
          </span>
          *
          <span
            onmouseenter={() => hover('כמות חודשים')}
            onmouseleave={() => hover('0')}
            style="color: var(--barbi-pink)"
          >
            {monts == 1 ? 'חודש אחד' : `${monts.toLocaleString()} חודשים`}
          </span>
          =
          <span
            onmouseenter={() => hover('סך הכל')}
            onmouseleave={() => hover('0')}
          >
            {easy > 0
              ? (easy * monts).toLocaleString()
              : (price * monts).toLocaleString()}
          </span>
        {:else if kindOf === 'yearly'}
          <span
            onmouseenter={() => hover('שווי לשנה')}
            onmouseleave={() => hover('0')}
            style="color:var(--barbi-pink)"
          >
            {easy > 0 ? easy.toLocaleString() : price.toLocaleString()} לשנה
          </span>
          *
          <span
            onmouseenter={() => hover('מספר שנים')}
            onmouseleave={() => hover('0')}
            style="color: var(--barbi-pink)"
          >
            {yers === 1 ? 'שנה אחת' : `${yers.toLocaleString()} שנים`}
          </span>
          =
          <span
            onmouseenter={() => hover('סך הכל')}
            onmouseleave={() => hover('0')}
          >
            {easy > 0
              ? (easy * yers).toLocaleString()
              : (price * yers).toLocaleString()}
          </span>
        {/if}
      </p>

      {#if descrip !== null && descrip !== 'null'}
        <RichText outpot={descrip} editable={false} />
      {/if}
      {#if hearotMeyuchadot}
        <p
          onmouseenter={() => hover('הערות')}
          onmouseleave={() => hover('0')}
          class="text-grey-700 max-h-16 cd d"
        >
          {hearotMeyuchadot !== undefined &&
          hearotMeyuchadot !== null &&
          hearotMeyuchadot !== 'undefined'
            ? hearotMeyuchadot
            : ''}
        </p>
      {/if}
    </div>

    <!-- Voting Status -->
    <div class="flex items-center mb-4">
      <p>
        <span
          onmouseenter={() => hover('סך ההצבעות בעד')}
          onmouseleave={() => hover('0')}
          style="color:#7EE081;">{noofusersOk}-בעד</span
        >
        <span
          onmouseenter={() => hover('לא הצביעו')}
          onmouseleave={() => hover('0')}
          style="color:#0000cc;"
          >{noofusersWaiting}-טרם
        </span><span
          onmouseenter={() => hover('כמות ההצבעות על גרסאות קודמות')}
          onmouseleave={() => hover('0')}
          style="color:#80037e;">{noofusersNo}-על גרסה קודמת</span
        >
      </p>
    </div>
    {#if hasUpdatedOffer}
      <!-- Updated Offer Header -->
      <div class="mb-4 p-3 bg-blue-50 border-r-4 border-blue-400 rounded">
        <h3 class="text-lg font-bold text-blue-800 mb-2">הצעה מתוקנת פעילה</h3>
        {#if changes.length > 0}
          <div class="text-sm text-blue-700">
            <strong>השיפורים שבוצעו:</strong>
            <ul class="mt-1 mr-4">
              {#each changes as change}
                {@const oldText =
                  change.type === 'descrip'
                    ? stripHtml(change.old)
                    : change.old?.toString()}
                {@const newText =
                  change.type === 'descrip'
                    ? stripHtml(change.new)
                    : (change.new?.toString() ?? '')}
                <li class="flex items-center gap-2 mb-1">
                  <span class="font-medium">{change.label}:</span>
                  <span
                    class="text-gray-500 line-through text-xs max-w-[100px] truncate"
                  >
                    {oldText}
                  </span>
                  <span class="text-green-600 font-medium">
                    {$lang == 'he' ? '←' : '→'}
                  </span>
                  <span
                    class="text-green-600 font-medium max-w-[100px] truncate"
                  >
                    {newText}
                  </span>
                </li>
              {/each}
            </ul>
          </div>
        {:else}
          <div class="text-sm text-blue-700">הוגשה הצעה מתוקנת למשאב</div>
        {/if}
      </div>
    {/if}
  </div>

  {#if low == false}
    {#if already === false && allr === false}
      <button
        onmouseenter={() => hover('אישור')}
        onmouseleave={() => hover('0')}
        onclick={() => agree('f')}
        class="btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
        name="requestToJoin"
      >
        <Lev />
      </button>
      <button
        onmouseenter={() => hover('משא ומתן')}
        onmouseleave={() => hover('0')}
        onclick={() => nego('f')}
        class="btnb bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110"
        name="negotiate"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
          /></svg
        ></button
      >
      <!-- Always show chat button when there's an updated offer -->
      {#if hasUpdatedOffer}
        <button
          onmouseenter={() => hover('צפייה בדיון')}
          onmouseleave={() => hover('0')}
          onclick={() => tochat()}
          class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110"
          ><Chaticon /></button
        >
      {/if}
    {:else if already === true && mypos === true && noofusersNo > 0 && allr === false}
      <button
        onmouseenter={() => hover('משא ומתן')}
        onmouseleave={() => hover('0')}
        onclick={() => nego('alr')}
        class="btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
        name="negotiate"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
          class="btin"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
          /></svg
        ></button
      >
      <button
        onmouseenter={() => hover('תגובה')}
        onmouseleave={() => hover('0')}
        onclick={() => tochat()}
        class="btnb bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110"
        ><Chaticon class="btin" /></button
      >
    {:else if already === true && mypos === false && noofusersOk > 0 && allr === false}
      <button
        onmouseenter={() => hover('אישור')}
        onmouseleave={() => hover('0')}
        onclick={() => agree('alr')}
        class="btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
        name="requestToJoin"
      >
        <Lev />
      </button>
      <button
        onmouseenter={() => hover('משא ומתן')}
        onmouseleave={() => hover('0')}
        onclick={() => nego('alr')}
        class="btnb bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-red-400 hover:scale-110"
        name="negotiate"
        title="משא ומתן"
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          version="1.1"
          class="btin"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="M12.75,3.94C13.75,3.22 14.91,2.86 16.22,2.86C16.94,2.86 17.73,3.05 18.59,3.45C19.45,3.84 20.13,4.3 20.63,4.83C21.66,6.11 22.09,7.6 21.94,9.3C21.78,11 21.22,12.33 20.25,13.27L12.66,20.86C12.47,21.05 12.23,21.14 11.95,21.14C11.67,21.14 11.44,21.05 11.25,20.86C11.06,20.67 10.97,20.44 10.97,20.16C10.97,19.88 11.06,19.64 11.25,19.45L15.84,14.86C16.09,14.64 16.09,14.41 15.84,14.16C15.59,13.91 15.36,13.91 15.14,14.16L10.55,18.75C10.36,18.94 10.13,19.03 9.84,19.03C9.56,19.03 9.33,18.94 9.14,18.75C8.95,18.56 8.86,18.33 8.86,18.05C8.86,17.77 8.95,17.53 9.14,17.34L13.73,12.75C14,12.5 14,12.25 13.73,12C13.5,11.75 13.28,11.75 13.03,12L8.44,16.64C8.25,16.83 8,16.92 7.73,16.92C7.45,16.92 7.21,16.83 7,16.64C6.8,16.45 6.7,16.22 6.7,15.94C6.7,15.66 6.81,15.41 7.03,15.19L11.63,10.59C11.88,10.34 11.88,10.11 11.63,9.89C11.38,9.67 11.14,9.67 10.92,9.89L6.28,14.5C6.06,14.7 5.83,14.81 5.58,14.81C5.3,14.81 5.06,14.71 4.88,14.5C4.69,14.3 4.59,14.06 4.59,13.78C4.59,13.5 4.69,13.27 4.88,13.08C7.94,10 9.83,8.14 10.55,7.45L14.11,10.97C14.5,11.34 14.95,11.53 15.5,11.53C16.2,11.53 16.75,11.25 17.16,10.69C17.44,10.28 17.54,9.83 17.46,9.33C17.38,8.83 17.17,8.41 16.83,8.06L12.75,3.94M14.81,10.27L10.55,6L3.47,13.08C2.63,12.23 2.15,10.93 2.04,9.16C1.93,7.4 2.41,5.87 3.47,4.59C4.66,3.41 6.08,2.81 7.73,2.81C9.39,2.81 10.8,3.41 11.95,4.59L16.22,8.86C16.41,9.05 16.5,9.28 16.5,9.56C16.5,9.84 16.41,10.08 16.22,10.27C16.03,10.45 15.8,10.55 15.5,10.55C15.23,10.55 15,10.45 14.81,10.27V10.27Z"
          /></svg
        ></button
      >
      <button
        onmouseenter={() => hover('תגובה')}
        onmouseleave={() => hover('0')}
        class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110"
        onclick={() => tochat()}
        ><Chaticon />
      </button>
    {:else}
      <button
        onmouseenter={() => hover('לצפיה בדיון')}
        onmouseleave={() => hover('0')}
        class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110"
        onclick={() => tochat()}
        ><Chaticon />
      </button>
    {/if}
  {:else if low == true}
    <Lowbtn isCart="true" />
  {/if}
</div>

<style>
  .cd {
    overflow-y: auto;
  }
</style>
