<script>
  import { isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { toggleScrollable, isScrolable } from './isScrolable.svelte.js';
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

  const ishur = {
    he: 'אישור קבלת',
    en: 'Approve receiving',
    ar: 'تأكيد الاستلام'
  };
  const me = { he: 'מאת', en: 'from', ar: 'من' };

  // תרגומים
  const translations = {
    transferMoney: {
      he: 'אישור העברת כספים',
      en: 'Approve money transfer',
      ar: 'تأكيد تحويل الأموال'
    },
    receiveMoney: {
      he: 'אישור קבלת כספים',
      en: 'Approve receiving money',
      ar: 'تأكيد استلام الأموال'
    },
    transferring: { he: 'העברת', en: 'Transferring', ar: 'تحويل' },
    receiving: { he: 'קבלת', en: 'Receiving', ar: 'استلام' },
    receiver: { he: 'מקבל', en: 'Receiver', ar: 'المستلم' },

    // הודעות מצב התחלתי
    coordinateWith: {
      he: (name) => `💬 מומלץ לתאם עם ${name} את הדרך המועדפת להעברת הכסף`,
      en: (name) =>
        `💬 It's recommended to coordinate with ${name} the preferred way to transfer the money`,
      ar: (name) =>
        `💬 يُنصح بالتنسيق مع ${name} حول الطريقة المفضلة لتحويل الأموال`
    },
    coordinateReceive: {
      he: (name) => `💬 מומלץ לתאם עם ${name} את הדרך המועדפת לקבלת הכסף`,
      en: (name) =>
        `💬 It's recommended to coordinate with ${name} the preferred way to receive the money`,
      ar: (name) =>
        `💬 يُنصح بالتنسيق مع ${name} حول الطريقة المفضلة لاستلام الأموال`
    },

    // הודעות אחרי שהנותן אישר
    confirmedTransfer: {
      he: '✓ אישרת שהעברת את הכסף',
      en: '✓ You confirmed that you transferred the money',
      ar: '✓ أكدت أنك حولت الأموال'
    },
    waitingConfirmation: {
      he: (name) => `ממתין לאישור מ-${name} שקיבל`,
      en: (name) => `Waiting for confirmation from ${name} that they received`,
      ar: (name) => `في انتظار التأكيد من ${name} أنه استلم`
    },
    senderConfirmed: {
      he: (name, amount) => `${name} אישר שהעביר לך ${amount}`,
      en: (name, amount) =>
        `${name} confirmed that they transferred ${amount} to you`,
      ar: (name, amount) => `${name} أكد أنه حول لك ${amount}`
    },
    pleaseConfirm: {
      he: "אנא סמן אם קיבלת או פנה אליו בצ'אט אם נדרש בירור",
      en: 'Please confirm if you received or contact them via chat if clarification is needed',
      ar: 'يرجى التأكيد إذا استلمت أو التواصل عبر الدردشة إذا كان هناك حاجة للتوضيح'
    },

    // הודעת השלמה
    completed: {
      he: '✓ ההעברה הושלמה בהצלחה',
      en: '✓ The transfer was completed successfully',
      ar: '✓ تم التحويل بنجاح'
    },

    // כפתורים
    confirmTransferred: {
      he: 'אישור העברה',
      en: 'Confirm Transfer',
      ar: 'تأكيد التحويل'
    },
    confirmReceived: {
      he: 'אישור קבלה',
      en: 'Confirm Receipt',
      ar: 'تأكيد الاستلام'
    },
    openChat: {
      he: "צ'אט לתיאום",
      en: 'Chat to coordinate',
      ar: 'دردشة للتنسيق'
    },
    openChatClarify: {
      he: "צ'אט לבירור",
      en: 'Chat for clarification',
      ar: 'دردشة للتوضيح'
    },
    viewHistory: {
      he: 'היסטוריית שיחה',
      en: 'Chat history',
      ar: 'سجل المحادثة'
    }
  };

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
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$isRtl ? 'rtl' : 'ltr'}
  style="overflow-y:auto"
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
      ? translations.transferMoney[$lang]
      : translations.receiveMoney[$lang]}
    cardTitle={`${kind == 'send' ? translations.transferring[$lang] : translations.receiving[$lang]} ${amount}`}
    memberCount={2}
    {glowColor}
    onProjectClick={handleProjectClick}
  />

  <!-- Content Area -->
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-50 dark:bg-slate-700'} transition-all duration-300 p-4 flex-1 overflow-y-auto space-y-6"
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
                ? translations.confirmedTransfer[$lang]
                : translations.senderConfirmed[$lang](sendname, amount)}
              aria-label="אישר העברה"
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
              title="טרם אישר העברה"
              aria-label="טרם אישר העברה"
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
        <p class="text-xs text-gray-500 dark:text-gray-400">{me[$lang]}</p>
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
            d={$lang === 'en'
              ? 'M13 7l5 5m0 0l-5 5m5-5H6'
              : 'M11 17l-5-5m0 0l5-5m-5 5h12'}
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
              title="אישר קבלה"
              aria-label="אישר קבלה"
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
              title="טרם אישר קבלה"
              aria-label="טרם אישר קבלה"
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
          {translations.receiver[$lang]}
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
            {translations.coordinateWith[$lang](resname)}
          {:else}
            {translations.coordinateReceive[$lang](sendname)}
          {/if}
        </p>
      {:else if sendcon && !confirmed}
        <!-- הנותן אישר שהעביר, המקבל עדיין לא אישר -->
        {#if kind == 'send'}
          <p
            class="text-center text-green-600 dark:text-green-400 font-bold mb-1"
          >
            {translations.confirmedTransfer[$lang]}
          </p>
          <p class="text-center text-gray-600 dark:text-gray-400 text-xs">
            {translations.waitingConfirmation[$lang](resname)}
          </p>
        {:else}
          <p
            class="text-center text-blue-600 dark:text-blue-400 font-bold mb-1"
          >
            {translations.senderConfirmed[$lang](sendname, amount)}
          </p>
          <p class="text-center text-gray-700 dark:text-gray-300 text-xs">
            {translations.pleaseConfirm[$lang]}
          </p>
        {/if}
      {:else if confirmed}
        <!-- שני הצדדים אישרו -->
        <p class="text-center text-green-600 dark:text-green-400 font-bold">
          {translations.completed[$lang]}
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
          onmouseenter={() => hover(translations.openChat[$lang])}
          onmouseleave={() => hover('0')}
          class="flex-1 py-2 px-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          onclick={(e) => {
            e.stopPropagation();
            tochat();
          }}
        >
          <div class="w-6 h-6"><Chaticon /></div>
          <span class="text-sm">{translations.openChat[$lang]}</span>
        </button>

        <button
          onmouseenter={() =>
            hover(
              kind == 'send'
                ? translations.confirmTransferred[$lang]
                : translations.confirmReceived[$lang]
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
              ? translations.confirmTransferred[$lang]
              : translations.confirmReceived[$lang]}</span
          >
        </button>
      {:else if sendcon && !confirmed}
        {#if kind == 'send'}
          <!-- הנותן אישר - רק כפתור צ'אט -->
          <button
            onmouseenter={() => hover(translations.openChat[$lang])}
            onmouseleave={() => hover('0')}
            class="w-full py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            onclick={(e) => {
              e.stopPropagation();
              tochat();
            }}
          >
            <div class="w-6 h-6"><Chaticon /></div>
            <span>{translations.openChat[$lang]}</span>
          </button>
        {:else}
          <!-- המקבל צריך לאשר -->
          <button
            onmouseenter={() => hover(translations.openChatClarify[$lang])}
            onmouseleave={() => hover('0')}
            class="flex-1 py-2 px-2 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            onclick={(e) => {
              e.stopPropagation();
              tochat();
            }}
          >
            <div class="w-6 h-6"><Chaticon /></div>
            <span class="text-sm">{translations.openChatClarify[$lang]}</span>
          </button>

          <button
            onmouseenter={() => hover(translations.confirmReceived[$lang])}
            onmouseleave={() => hover('0')}
            onclick={(e) => {
              e.stopPropagation();
              agree('f');
            }}
            class="flex-2 py-2 px-2 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            <div class="w-6 h-6"><Lev /></div>
            <span class="text-sm">{translations.confirmReceived[$lang]}</span>
          </button>
        {/if}
      {:else if confirmed}
        <!-- הושלם - רק כפתור צ'אט -->
        <button
          onmouseenter={() => hover(translations.viewHistory[$lang])}
          onmouseleave={() => hover('0')}
          class="w-full py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          onclick={(e) => {
            e.stopPropagation();
            tochat();
          }}
        >
          <div class="w-6 h-6"><Chaticon /></div>
          <span>{translations.viewHistory[$lang]}</span>
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
