<script>
  import { t } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { DISCOVERY_LINKS } from './discoveryLinks.js';

  /**
   * The footer's "more" menu. It is also the overflow home for the tabs the
   * bar drops as it narrows — chat and discovery below 400px, deals and the
   * profile tab below 520px — so every tab stays reachable at every width.
   *
   * @typedef {Object} Props
   * @property {() => void} [onChat] - Opens the chat panel (a callback, not a route).
   */
  let { onChat } = $props();

  let showMenu = $state(false);

  // SVG Icons
  const profileIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;
  const timersIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  const calendarIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12v-.008zM12 18h.008v.008H12v-.008zM15.75 12h.008v.008h-.008v-.008zM15.75 15h.008v.008h-.008v-.008zM15.75 18h.008v.008h-.008v-.008zM18.75 12h.008v.008h-.008v-.008zM18.75 15h.008v.008h-.008v-.008zM18.75 18h.008v.008h-.008v-.008zM3.75 12h.008v.008H3.75v-.008zM3.75 15h.008v.008H3.75v-.008zM3.75 18h.008v.008H3.75v-.008z" /></svg>`;
  const salesIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>`;
  const meetingIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>`;
  const dealsIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>`;
  const chatIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>`;
  const myActsIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.375M9 18h3.375m-3.562-12C8.344 3.97 9.878 3 12 3s3.656.97 3.812 3m-7.625 0h7.625m-7.625 0A1.5 1.5 0 005.25 7.5v12a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5v-12a1.5 1.5 0 00-1.5-1.5m-7.625 0h7.625" /></svg>`;

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function navigateTo(path) {
    goto(path);
    showMenu = false; // Close menu after navigation
  }
</script>

<div
  class="relative inline-flex flex-col items-center justify-center h-full px-2 rounded-e-full"
>
  <button
    onclick={toggleMenu}
    type="button"
    class="inline-flex flex-col items-center justify-center gap-0.5 text-barbi h-full w-full hover:bg-gray-50 dark:hover:bg-gray-800 group"
  >
    <svg
      class="w-6 h-6 transition-transform duration-200 {showMenu
        ? 'rotate-180'
        : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="3"
        d="M19 9l-7 7-7-7"
      ></path>
    </svg>
    <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">
      {$t('common.footer.more')}
    </span>
    <span class="sr-only">
      {$t('common.footer.profileMenu')}
    </span>
  </button>

  {#if showMenu}
    <!-- Backdrop, so tapping away closes a menu that is wider than its tab -->
    <button
      type="button"
      aria-label={$t('common.footer.close')}
      class="fixed inset-0 z-40 cursor-default"
      onclick={() => (showMenu = false)}
    ></button>

    <!-- `end-0`, not the static position: this is the bar's edge tab, so an
         unanchored menu grows straight off-screen and `body { overflow-x:
         hidden }` clips it. Anchoring the outer edge makes it open inward —
         correct in both RTL and LTR. -->
    <div
      class="absolute z-50 end-0 bottom-full mb-2 max-w-[calc(100vw-1rem)] bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800"
    >
      <div
        class="py-1"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu"
      >
        <!-- Profile gets its own footer tab from 520px up -->
        <button
          onclick={() => navigateTo('/me')}
          class="flex min-[520px]:hidden items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html profileIcon}
          <span class="mx-2">
            {$t('common.footer.profile')}
          </span>
        </button>
        <!-- Chat moves in here on screens too narrow for its footer tab -->
        <button
          onclick={() => {
            onChat?.();
            showMenu = false;
          }}
          class="hidden max-[399px]:flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html chatIcon}
          <span class="mx-2">
            {$t('lev.cards.saleCard.chat')}
          </span>
        </button>
        <!-- Likewise the five discovery pages, which share a tab from 400px up -->
        <div class="hidden max-[399px]:block">
          <div
            class="px-4 pt-1 pb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500"
          >
            {$t('common.footer.discoverLabel')}
          </div>
          {#each DISCOVERY_LINKS as link (link.key)}
            <button
              onclick={() => navigateTo(link.href)}
              class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              role="menuitem"
            >
              <span aria-hidden="true">{link.emoji}</span>
              <span class="mx-2">{$t(`common.footer.discover_${link.key}`)}</span>
            </button>
          {/each}
        </div>
        <!-- Deals moves in here on screens too narrow for its footer tab -->
        <button
          onclick={() => navigateTo('/deals')}
          class="hidden max-[519px]:flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html dealsIcon}
          <span class="mx-2">
            {$t('common.footer.deals')}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/myacts')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html myActsIcon}
          <span class="mx-2">
            {$t('common.footer.myActs')}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/deals/sales-center')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html salesIcon}
          <span class="mx-2">
            {$t('common.footer.salesCenter')}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/timers')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html timersIcon}
          <span class="mx-2">
            {$t('common.footer.timers')}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/myCalander')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html calendarIcon}
          <span class="mx-2">
            {$t('common.footer.calendar')}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/meeting')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html meetingIcon}
          <span class="mx-2">
            {$t('common.footer.meeting')}
          </span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ניתן להוסיף כאן סגנונות ספציפיים אם צריך */
</style>
