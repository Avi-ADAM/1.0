<script>
  import { lang } from '$lib/stores/lang.js';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { toggleScrollable, isScrolable } from './isScrolable.svelte.js';
  import AuthorityBadge from '../../ui/AuthorityBadge.svelte';
  import Lev from '../../../celim/lev.svelte';
  import No from '../../../celim/no.svelte';
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
    onHover,
    onAgree,
    onDecline,
    onNego,
    onTochat,
    onProj
  } = $props();

  const ishur = { he: 'אישור קבלת', en: 'Approve receiving', ar: 'تأكيد الاستلام' };
  const me = { he: 'מאת', en: 'from', ar: 'من' };
  
  // תרגומים
  const translations = {
    transferMoney: { he: 'אישור העברת כספים', en: 'Approve money transfer', ar: 'تأكيد تحويل الأموال' },
    receiveMoney: { he: 'אישור קבלת כספים', en: 'Approve receiving money', ar: 'تأكيد استلام الأموال' },
    transferring: { he: 'העברת', en: 'Transferring', ar: 'تحويل' },
    receiving: { he: 'קבלת', en: 'Receiving', ar: 'استلام' },
    receiver: { he: 'מקבל', en: 'Receiver', ar: 'المستلم' },
    
    // הודעות מצב התחלתי
    coordinateWith: { 
      he: (name) => `💬 מומלץ לתאם עם ${name} את הדרך המועדפת להעברת הכסף`,
      en: (name) => `💬 It's recommended to coordinate with ${name} the preferred way to transfer the money`,
      ar: (name) => `💬 يُنصح بالتنسيق مع ${name} حول الطريقة المفضلة لتحويل الأموال`
    },
    coordinateReceive: {
      he: (name) => `💬 מומלץ לתאם עם ${name} את הדרך המועדפת לקבלת הכסף`,
      en: (name) => `💬 It's recommended to coordinate with ${name} the preferred way to receive the money`,
      ar: (name) => `💬 يُنصح بالتنسيق مع ${name} حول الطريقة المفضلة لاستلام الأموال`
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
      en: (name, amount) => `${name} confirmed that they transferred ${amount} to you`,
      ar: (name, amount) => `${name} أكد أنه حول لك ${amount}`
    },
    pleaseConfirm: {
      he: 'אנא סמן אם קיבלת או פנה אליו בצ\'אט אם נדרש בירור',
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
      he: 'אישור שהעברתי את הכסף',
      en: 'Confirm I transferred the money',
      ar: 'تأكيد أنني حولت الأموال'
    },
    confirmReceived: {
      he: 'אישור שקיבלתי את הכסף',
      en: 'Confirm I received the money',
      ar: 'تأكيد أنني استلمت الأموال'
    },
    openChat: {
      he: 'פתיחת צ\'אט לתיאום',
      en: 'Open chat to coordinate',
      ar: 'فتح الدردشة للتنسيق'
    },
    openChatClarify: {
      he: 'פתיחת צ\'אט לבירור',
      en: 'Open chat for clarification',
      ar: 'فتح الدردشة للتوضيح'
    },
    viewHistory: {
      he: 'לצפיה בהיסטוריית השיחה',
      en: 'View conversation history',
      ar: 'عرض سجل المحادثة'
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

  function project() {
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
  dir="rtl"
  style="overflow-y:auto"
  class="d {isVisible
    ? $lang == 'he'
      ? 'boxleft'
      : 'boxright'
    : ''} leading-normal {isMobileOrTablet()
    ? 'w-full h-full'
    : ' w-[90%] h-[90%]'} bg-white lg:w-[90%]"
>
  <div
    class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre"
  >
    <div class="relative flex items-center space-x-1">
      <button onclick={project}>
        <AuthorityBadge
          logoSrc={src}
          {projectName}
          size={isMobileOrTablet() ? 80 : 120}
        />
      </button>
      <div class="flex flex-col leading-tight ml-4">
        <div class="sm:text-lg text-md mt-1 flex items-center">
          <span class="text-barbi text-center mr-3 sm:text-3xl text-xl">
            {kind == 'send' ? translations.transferMoney[$lang] : translations.receiveMoney[$lang]}
          </span>
        </div>
      </div>
    </div>
  </div>

  <div
    dir={$lang == "en" ? "ltr" : "rtl"}
    class="{isScrolable.value
      ? 'bg-white'
      : 'bg-gray-200'} transition-all-300 rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal"
  >
    <div class="mb-8">
      <div class="text-center mb-6">
        <h3 class="text-2xl font-bold text-barbi mb-4">
          {kind == 'send' ? translations.transferring[$lang] : translations.receiving[$lang]} {amount}
        </h3>
      </div>

      <div class="flex flex-row align-middle justify-center gap-4 mb-6">
        <div class="text-center">
          <img
            src={sendpropic || "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"}
            class="rounded-full w-16 h-16 mb-2 mx-auto border-2 border-barbi"
            alt="Avatar"
          />
          <h5 class="text-base font-medium leading-tight">{sendname}</h5>
          <p class="text-sm text-gray-500">{me[$lang]}</p>
        </div>

        <div class="flex items-center">
          <svg
            class="w-8 h-8 text-barbi"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
        </div>

        <div class="text-center">
          <img
            src={respropic || "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png"}
            class="rounded-full w-16 h-16 mb-2 mx-auto border-2 border-gold"
            alt="Avatar"
          />
          <h5 class="text-base font-medium leading-tight">{resname}</h5>
          <p class="text-sm text-gray-500">{translations.receiver[$lang]}</p>
        </div>
      </div>

      <!-- הודעות סטטוס -->
      <div class="mt-4 p-4 rounded-lg bg-gray-50">
        {#if !sendcon && !confirmed}
          <!-- מצב התחלתי - אף אחד עדיין לא אישר -->
          <p class="text-center text-gray-700 mb-2">
            {#if kind == 'send'}
              {translations.coordinateWith[$lang](resname)}
            {:else}
              {translations.coordinateReceive[$lang](sendname)}
            {/if}
          </p>
        {:else if sendcon && !confirmed}
          <!-- הנותן אישר שהעביר, המקבל עדיין לא אישר -->
          {#if kind == 'send'}
            <p class="text-center text-green-600 font-medium mb-2">
              {translations.confirmedTransfer[$lang]}
            </p>
            <p class="text-center text-gray-600 text-sm">
              {translations.waitingConfirmation[$lang](resname)}
            </p>
          {:else}
            <p class="text-center text-blue-600 font-medium mb-2">
              {translations.senderConfirmed[$lang](sendname, amount)}
            </p>
            <p class="text-center text-gray-700 text-sm">
              {translations.pleaseConfirm[$lang]}
            </p>
          {/if}
        {:else if confirmed}
          <!-- שני הצדדים אישרו -->
          <p class="text-center text-green-600 font-medium">
            {translations.completed[$lang]}
          </p>
        {/if}
      </div>
    </div>
  </div>

  {#if low == false}
    {#if !sendcon && !confirmed}
      <!-- מצב התחלתי - כפתורים לשני הצדדים -->
      <button
        onmouseenter={() => hover(kind == 'send' ? translations.confirmTransferred[$lang] : translations.confirmReceived[$lang])}
        onmouseleave={() => hover('0')}
        onclick={() => agree('f')}
        class="btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
        name="approve"
      >
        <Lev />
      </button>
      <button
        onmouseenter={() => hover(translations.openChat[$lang])}
        onmouseleave={() => hover('0')}
        onclick={() => tochat()}
        class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110"
        name="chat"
      >
        <Chaticon />
      </button>
    {:else if sendcon && !confirmed}
      {#if kind == 'send'}
        <!-- הנותן אישר - רק כפתור צ'אט -->
        <button
          onmouseenter={() => hover(translations.openChat[$lang])}
          onmouseleave={() => hover('0')}
          class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110"
          onclick={() => tochat()}
        >
          <Chaticon />
        </button>
      {:else}
        <!-- המקבל צריך לאשר -->
        <button
          onmouseenter={() => hover(translations.confirmReceived[$lang])}
          onmouseleave={() => hover('0')}
          onclick={() => agree('f')}
          class="btna bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink hover:text-gold text-barbi hover:scale-110"
          name="approve"
        >
          <Lev />
        </button>
        <button
          onmouseenter={() => hover(translations.openChatClarify[$lang])}
          onmouseleave={() => hover('0')}
          onclick={() => tochat()}
          class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-mpink hover:text-gold hover:scale-110"
          name="chat"
        >
          <Chaticon />
        </button>
      {/if}
    {:else if confirmed}
      <!-- הושלם - רק כפתור צ'אט -->
      <button
        onmouseenter={() => hover(translations.viewHistory[$lang])}
        onmouseleave={() => hover('0')}
        class="btnc bg-gradient-to-br hover:from-gold hover:via-mpink hover:to-gold from-mpink via-gold via-wow via-gold to-mpink text-gold hover:text-barbi hover:scale-110"
        onclick={() => tochat()}
      >
        <Chaticon />
      </button>
    {/if}
  {:else if low == true}
    <Lowbtn isCart="true" />
  {/if}
</div>

<style>
</style>
