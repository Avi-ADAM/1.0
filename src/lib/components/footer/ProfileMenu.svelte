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
  const guideIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`;
  const growIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>`;
  const quorumIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>`;
  const consensusIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>`;
  const whyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>`;

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
        <!-- The guide (/guid) had no entry point anywhere in the app; "more" is
             where a reference page belongs, so it sits last, after the tools —
             together with the three public explainer landings, which a member
             could otherwise only reach by leaving for the home page. -->
        <button
          onclick={() => navigateTo('/guid')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700"
          role="menuitem"
        >
          {@html guideIcon}
          <span class="mx-2">
            {$t('common.footer.guide')}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/grow')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html growIcon}
          <span class="mx-2">
            {$t('common.footer.grow')}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/quorum')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html quorumIcon}
          <span class="mx-2">
            {$t('common.footer.quorum')}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/consensus')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html consensusIcon}
          <span class="mx-2">
            {$t('common.footer.consensus')}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/why')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html whyIcon}
          <span class="mx-2">
            {$t('common.footer.why')}
          </span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ניתן להוסיף כאן סגנונות ספציפיים אם צריך */
</style>
