<script>
  import { isRtl, t } from '$lib/translations';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import CardHeader from './CardHeader.svelte';
  import Lev from '../../../celim/lev.svelte';
  import Lowbtn from '$lib/celim/lowbtn.svelte';
  import Chaticon from '../../../celim/chaticon.svelte';

  /**
   * @typedef {Object} Props
   * @property {boolean} [low]
   * @property {boolean} [isVisible]
   * @property {string} sendpropic
   * @property {string} sendname
   * @property {string} respropic
   * @property {string} resname
   * @property {string} projectId
   * @property {string} kind - 'send' or 'recive'
   * @property {string} projectName
   * @property {string} src
   * @property {string} amount
   * @property {boolean} already
   * @property {boolean} [sendcon] - האם הנותן אישר שהעביר
   * @property {boolean} [confirmed] - האם המקבל אישר שקיבל
   * @property {number | null} [forumId] - Forum ID for existing chat
   * @property {string} [glowColor]
   * @property {Array} [user_1s]
   * @property {Array} [users]
   * @property {number} [activeOrder]
   * @property {(payload: { x: any }) => void} [onHover]
   * @property {(payload: { alr: any, y: string }) => void} [onAgree]
   * @property {(payload: { alr: any, y: string }) => void} [onDecline]
   * @property {(payload: { alr: any, y: string }) => void} [onNego]
   * @property {() => void} [onTochat]
   * @property {(payload: { id: any }) => void} [onProj]
   */

  /** @type {Props} */
  let {
    low = false,
    isVisible = false,
    sendpropic = '',
    sendname = '',
    respropic = '',
    resname = '',
    projectId = '',
    kind = '',
    projectName = '',
    src = '',
    amount = '',
    already = $bindable(false),
    sendcon = false,
    confirmed = false,
    forumId = null,
    glowColor = 'red', // Default for this card type based on guide

    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat,
    onProj
  } = $props();

  function hover(x) {
    onHover?.({ x: x });
  }

  function agree(alr) {
    console.log('didigetCard agree called with:', alr);
    already = true;
    onAgree?.({ alr: alr, y: 'a' });
    console.log('onAgree callback called');
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
    onProj?.({ id: projectId });
  }
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
  class="d {isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'} lg:w-[90%] {isVisible
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isVisible
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
    logoSrc={src}
    {projectName}
    cardType={kind == 'send'
      ? $t('lev.cards.didiget.transferMoney')
      : $t('lev.cards.didiget.receiveMoney')}
    cardTitle={`${kind == 'send' ? $t('lev.cards.didiget.transferring') : $t('lev.cards.didiget.receiving')} ${amount}`}
    memberCount={2}
    {glowColor}
    onProjectClick={handleProjectClick}
  />

  <!-- Content Area -->
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="bg-white dark:bg-slate-800 transition-all duration-300 p-4 flex-1 overflow-y-auto space-y-6"
  >
    <!-- Avatars Row -->
    <div class="flex flex-row items-center justify-center gap-6 mt-2">
      <div class="text-center">
        <div class="relative w-16 h-16 mb-2 mx-auto">
          <img
            src={sendpropic ||
              'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
            class="rounded-full w-16 h-16 border-2 border-barbi shadow-sm"
            alt="Avatar"
          />
          {#if sendcon}
            <span
              class="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white border-2 border-white dark:border-gray-800 shadow"
              title={kind == 'send'
                ? $t('lev.cards.didiget.confirmedTransfer')
                : $t('lev.cards.didiget.senderConfirmed', { name: sendname, amount })}
              aria-label={$t('lev.cards.didiget.senderConfirmedBadge')}
            >
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5"
                ><path
                  fill="currentColor"
                  d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"
                /></svg
              >
            </span>
          {:else}
            <span
              class="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-700 text-white border-2 border-white dark:border-gray-800 shadow"
              title={$t('lev.cards.didiget.senderPendingBadge')}
              aria-label={$t('lev.cards.didiget.senderPendingBadge')}
            >
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5"
                ><path
                  fill="currentColor"
                  d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"
                /></svg
              >
            </span>
          {/if}
        </div>
        <h5
          class="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight"
        >
          {sendname}
        </h5>
        <p class="text-xs text-gray-500 dark:text-gray-400">{$t('lev.cards.didiget.from')}</p>
      </div>

      <div class="flex items-center pb-4">
        <svg
          class="w-8 h-8 text-barbi dark:text-barbi opacity-70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d={$isRtl
              ? 'M11 17l-5-5m0 0l5-5m-5 5h12'
              : 'M13 7l5 5m0 0l-5 5m5-5H6'}
          />
        </svg>
      </div>

      <div class="text-center">
        <div class="relative w-16 h-16 mb-2 mx-auto">
          <img
            src={respropic ||
              'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'}
            class="rounded-full w-16 h-16 border-2 border-gold shadow-sm"
            alt="Avatar"
          />
          {#if confirmed}
            <span
              class="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white border-2 border-white dark:border-gray-800 shadow"
              title={$t('lev.cards.didiget.receiverConfirmedBadge')}
              aria-label={$t('lev.cards.didiget.receiverConfirmedBadge')}
            >
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5"
                ><path
                  fill="currentColor"
                  d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"
                /></svg
              >
            </span>
          {:else}
            <span
              class="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-700 text-white border-2 border-white dark:border-gray-800 shadow"
              title={$t('lev.cards.didiget.receiverPendingBadge')}
              aria-label={$t('lev.cards.didiget.receiverPendingBadge')}
            >
              <svg viewBox="0 0 24 24" class="w-3.5 h-3.5"
                ><path
                  fill="currentColor"
                  d="M12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22C6.47,22 2,17.5 2,12A10,10 0 0,1 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"
                /></svg
              >
            </span>
          {/if}
        </div>
        <h5
          class="text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight"
        >
          {resname}
        </h5>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {$t('lev.cards.didiget.receiver')}
        </p>
      </div>
    </div>

    <!-- Status Box -->
    <div
      class="p-4 rounded-xl bg-gray-100 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700/50"
    >
      {#if !sendcon && !confirmed}
        <!-- מצב התחלתי - אף אחד עדיין לא אישר -->
        <p
          class="text-center text-gray-700 dark:text-gray-300 text-sm font-medium"
        >
          {#if kind == 'send'}
            {$t('lev.cards.didiget.coordinateWith', { name: resname })}
          {:else}
            {$t('lev.cards.didiget.coordinateReceive', { name: sendname })}
          {/if}
        </p>
      {:else if sendcon && !confirmed}
        <!-- הנותן אישר שהעביר, המקבל עדיין לא אישר -->
        {#if kind == 'send'}
          <p
            class="text-center text-green-600 dark:text-green-400 font-bold mb-1"
          >
            {$t('lev.cards.didiget.confirmedTransfer')}
          </p>
          <p class="text-center text-gray-600 dark:text-gray-400 text-xs">
            {$t('lev.cards.didiget.waitingConfirmation', { name: resname })}
          </p>
        {:else}
          <p
            class="text-center text-blue-600 dark:text-blue-400 font-bold mb-1"
          >
            {$t('lev.cards.didiget.senderConfirmed', { name: sendname, amount })}
          </p>
          <p class="text-center text-gray-700 dark:text-gray-300 text-xs">
            {$t('lev.cards.didiget.pleaseConfirm')}
          </p>
        {/if}
      {:else if confirmed}
        <!-- שני הצדדים אישרו -->
        <p class="text-center text-green-600 dark:text-green-400 font-bold">
          {$t('lev.cards.didiget.completed')}
        </p>
      {/if}
    </div>
  </div>

  <!-- Actions Footer -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-3 border-t border-gray-100 dark:border-gray-700"
  >
    {#if low == false}
      {#if !sendcon && !confirmed}
        <!-- מצב התחלתי - כפתורים לשני הצדדים -->
        <button
          onmouseenter={() => hover($t('lev.cards.didiget.openChat'))}
          onmouseleave={() => hover('0')}
          class="flex-1 py-2 px-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          onclick={(e) => {
            e.stopPropagation();
            tochat();
          }}
        >
          <div class="w-6 h-6"><Chaticon /></div>
          <span class="text-sm">{$t('lev.cards.didiget.openChat')}</span>
        </button>

        <button
          onmouseenter={() =>
            hover(
              kind == 'send'
                ? $t('lev.cards.didiget.confirmTransferred')
                : $t('lev.cards.didiget.confirmReceived')
            )}
          onmouseleave={() => hover('0')}
          onclick={(e) => {
            e.stopPropagation();
            agree('f');
          }}
          class="flex-2 py-2 px-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
        >
          <div class="w-6 h-6"><Lev /></div>
          <span class="text-sm"
            >{kind == 'send'
              ? $t('lev.cards.didiget.confirmTransferred')
              : $t('lev.cards.didiget.confirmReceived')}</span
          >
        </button>
      {:else if sendcon && !confirmed}
        {#if kind == 'send'}
          <!-- הנותן אישר - רק כפתור צ'אט -->
          <button
            onmouseenter={() => hover($t('lev.cards.didiget.openChat'))}
            onmouseleave={() => hover('0')}
            class="w-full py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            onclick={(e) => {
              e.stopPropagation();
              tochat();
            }}
          >
            <div class="w-6 h-6"><Chaticon /></div>
            <span>{$t('lev.cards.didiget.openChat')}</span>
          </button>
        {:else}
          <!-- המקבל צריך לאשר -->
          <button
            onmouseenter={() => hover($t('lev.cards.didiget.openChatClarify'))}
            onmouseleave={() => hover('0')}
            class="flex-1 py-2 px-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            onclick={(e) => {
              e.stopPropagation();
              tochat();
            }}
          >
            <div class="w-6 h-6"><Chaticon /></div>
            <span class="text-sm">{$t('lev.cards.didiget.openChatClarify')}</span>
          </button>

          <button
            onmouseenter={() => hover($t('lev.cards.didiget.confirmReceived'))}
            onmouseleave={() => hover('0')}
            onclick={(e) => {
              e.stopPropagation();
              agree('f');
            }}
            class="flex-2 py-2 px-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <div class="w-6 h-6"><Lev /></div>
            <span class="text-sm">{$t('lev.cards.didiget.confirmReceived')}</span>
          </button>
        {/if}
      {:else if confirmed}
        <!-- הושלם - רק כפתור צ'אט -->
        <button
          onmouseenter={() => hover($t('lev.cards.didiget.viewHistory'))}
          onmouseleave={() => hover('0')}
          class="w-full py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          onclick={(e) => {
            e.stopPropagation();
            tochat();
          }}
        >
          <div class="w-6 h-6"><Chaticon /></div>
          <span>{$t('lev.cards.didiget.viewHistory')}</span>
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
