<script>
  import { lang } from '$lib/stores/lang.js';
  import { isChatOpen } from '$lib/stores/pendMisMes.js';
  import { navigating } from '$app/state';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Chaticon from '$lib/celim/chaticon.svelte';
  import MoachIcon from '$lib/celim/icons/moachIcon.svelte';
  import Lev from '$lib/celim/lev.svelte';
  import ProfileMenu from '$lib/components/footer/ProfileMenu.svelte';
  import { idPr } from '$lib/stores/idPr';
  /**
   * @typedef {Object} Props
   * @property {string} [initialRout]
   * @property {() => void} [onChat] - Callback for chat event
   * @property {() => void} [onNew] - Callback for new item creation event
   */
  let { initialRout = '', onChat, onNew, isAuthed } = $props();
  function addi(kind) {
    if (kind == 'chat') {
      onChat?.();
    } else {
      onNew?.();
    }
  }
  let activeRoute = $derived(page.url.pathname);

  // Visible tab labels — every footer item carries a word, not just an icon.
  const labels = {
    hub: { he: 'מרכז', en: 'Hub', ar: 'المركز', ru: 'Хаб' },
    moach: { he: 'רקמות', en: 'Rikmot', ar: 'ركموت', ru: 'Рикмот' },
    chat: { he: 'צ׳אט', en: 'Chat', ar: 'دردشة', ru: 'Чат' },
    concierge: { he: 'קונסיירז׳', en: 'Concierge', ar: 'كونسيرج', ru: 'Консьерж' },
    deals: { he: 'עסקאות', en: 'Deals', ar: 'صفقات', ru: 'Сделки' },
    lev: { he: 'הלב', en: 'Heart', ar: 'القلب', ru: 'Сердце' }
  };
  const L = (key) => labels[key][$lang] ?? labels[key].he;

  const brainLeb = { he: 'מוח הרקמות', en: 'brain of organiczations' };
</script>

<div
  class=" fixed z-50 w-full h-14 max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-0 left-1/2 dark:bg-gray-700 dark:border-gray-600"
>
  {#if navigating && navigating.to}
    <div
      class="absolute inset-0 rounded-full border-2 border-gold animate-pulse pointer-events-none"
    ></div>
  {/if}
  <div class="grid h-full max-w-lg grid-cols-7 mx-auto">
    <button
      onclick={() => {
        activeRoute = '/hub';
        goto('/hub');
      }}
      type="button"
      class="{activeRoute == '/hub'
        ? 'border-b-2 border-gold'
        : ''} inline-flex flex-col items-center justify-center gap-0.5 px-2 rounded-s-full hover:bg-gray-50 dark:hover:bg-gray-800 group"
    >
      <div class="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="w-6 h-6 text-barbi"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
          />
        </svg>
        {#if navigating && navigating.to?.url.pathname === '/hub'}
          <div
            class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
          ></div>
        {/if}
      </div>
      <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('hub')}</span>
    </button>

    <button
      onclick={() => {
        activeRoute = '/moach';
        if ($idPr != null) {
          idPr.set(null);
        }
        goto('/moach');
      }}
      type="button"
      class="{activeRoute == '/moach'
        ? 'border-b-2 border-gold'
        : ''} inline-flex flex-col items-center justify-center gap-0.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 group"
    >
      <div class="relative">
        <MoachIcon active={navigating?.to?.url.pathname == '/moach'} />
        {#if navigating && navigating.to?.url.pathname === '/moach'}
          <div
            class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
          ></div>
        {/if}
      </div>
      <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('moach')}</span>
    </button>
    <div
      id="tooltip-home"
      role="tooltip"
      class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
    >
      {brainLeb[$lang]}
      <div class="tooltip-arrow"></div>
    </div>

    <button
      onclick={() => addi('chat')}
      type="button"
      class="{$isChatOpen
        ? 'border-b-2 border-gold'
        : ''} inline-flex flex-col items-center justify-center gap-0.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 group"
    >
      <Chaticon />
      <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('chat')}</span>
    </button>
    <div
      id="tooltip-wallet"
      role="tooltip"
      class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
    >
      רצון חדש
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>
    <div class="flex flex-col items-center justify-center gap-0.5">
      <button
        onclick={() => {
          activeRoute = '/concierge';
          goto('/concierge');
        }}
        type="button"
        class="inline-flex items-center justify-center w-9 h-9 overflow-hidden rounded-full ring-2 ring-gold shadow-lg bg-goldGrad bg-[length:200%_auto] animate-gradientx hover:animate-shine group focus:ring-4 focus:ring-blue-300 focus:outline-none dark:focus:ring-blue-800"
      >
        <img
          src="/logo-concierge.png"
          alt=""
          aria-hidden="true"
          class="w-full h-full object-cover"
        />
        <span class="sr-only">קונסיירז' · רצון חדש</span>
      </button>
      <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('concierge')}</span>
    </div>
    <div
      id="tooltip-new"
      role="tooltip"
      class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
    >
      Create new item
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>
    <button
      onclick={() => {
        activeRoute = '/deals';
        goto('/deals');
      }}
      type="button"
      class="{activeRoute == '/deals'
        ? 'border-b-2 border-gold'
        : ''} inline-flex flex-col items-center justify-center gap-0.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 group"
    >
      <div class="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.8"
          stroke="currentColor"
          class="w-6 h-6 text-barbi"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
        {#if navigating && navigating.to?.url.pathname === '/deals'}
          <div
            class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
          ></div>
        {/if}
      </div>
      <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('deals')}</span>
    </button>
    <button
      onclick={() => {
        activeRoute = '/lev';
        goto('/lev');
      }}
      type="button"
      class="{activeRoute == '/lev'
        ? 'border-b-2 border-gold'
        : ''} inline-flex text-barbi flex-col items-center justify-center gap-0.5 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 group"
    >
      <div class="relative">
        <Lev />
        {#key navigating}
          {#if navigating && navigating.to?.url.pathname === '/lev'}
            <div
              class="absolute -inset-1 rounded-full border-2 border-transparent border-t-gold animate-spin"
            ></div>
          {/if}
        {/key}
      </div>
      <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">{L('lev')}</span>
    </button>
    <div
      id="tooltip-settings"
      role="tooltip"
      class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700"
    >
      Lev
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>

    <ProfileMenu />
  </div>
</div>
