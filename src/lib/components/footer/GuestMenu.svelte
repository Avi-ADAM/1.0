<script>
  import { t } from '$lib/translations';
  import { goto } from '$app/navigation';

  /**
   * The footer's "more" menu for a visitor who is not signed in.
   *
   * It is deliberately *not* `ProfileMenu`: every entry there (/me, /myacts,
   * /timers, /myCalander, /deals/*) sits behind the `(reg)` layout's server
   * guard, so a guest tapping one would only ever land on /login. This menu
   * lists the pages a guest can actually open, plus the two tabs the bar sheds
   * below 400px (guide, login) so nothing becomes unreachable.
   *
   * @typedef {Object} Props
   * @property {string} [loginHref] - /login carrying the current page as `from`.
   */
  let { loginHref = '/login' } = $props();

  let showMenu = $state(false);

  const growIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" /></svg>`;
  const guideIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`;
  const quorumIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>`;
  const consensusIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" /></svg>`;
  const whyIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>`;
  const faqIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>`;
  const loginIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>`;

  function navigateTo(path) {
    goto(path);
    showMenu = false;
  }
</script>

<div
  class="relative inline-flex flex-col items-center justify-center h-full px-2 rounded-e-full"
>
  <button
    onclick={() => (showMenu = !showMenu)}
    type="button"
    aria-expanded={showMenu}
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
  </button>

  {#if showMenu}
    <!-- Backdrop, so tapping away closes a menu wider than its tab -->
    <button
      type="button"
      aria-label={$t('common.footer.close')}
      class="fixed inset-0 z-40 cursor-default"
      onclick={() => (showMenu = false)}
    ></button>

    <!-- `end-0`: this is the bar's edge tab, so an unanchored menu grows
         straight off-screen and `body { overflow-x: hidden }` clips it. -->
    <div
      class="absolute z-50 end-0 bottom-full mb-2 max-w-[calc(100vw-1rem)] bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800"
    >
      <div class="py-1" role="menu" aria-orientation="vertical">
        <!-- The guide and login own footer tabs from 400px up; below that the
             bar sheds them and they live here instead. -->
        <button
          onclick={() => navigateTo('/guid')}
          class="hidden max-[399px]:flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html guideIcon}
          <span class="mx-2">{$t('common.footer.guide')}</span>
        </button>
        <button
          onclick={() => navigateTo(loginHref)}
          class="hidden max-[399px]:flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html loginIcon}
          <span class="mx-2">{$t('common.footer.login')}</span>
        </button>
        <!-- The three standalone explainer landings. Each is a public page with
             no entry point anywhere in the app except the home page's own nav,
             so this menu is where a visitor finds them. -->
        <button
          onclick={() => navigateTo('/grow')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html growIcon}
          <span class="mx-2">{$t('common.footer.grow')}</span>
        </button>
        <button
          onclick={() => navigateTo('/quorum')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html quorumIcon}
          <span class="mx-2">{$t('common.footer.quorum')}</span>
        </button>
        <button
          onclick={() => navigateTo('/consensus')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html consensusIcon}
          <span class="mx-2">{$t('common.footer.consensus')}</span>
        </button>
        <button
          onclick={() => navigateTo('/why')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html whyIcon}
          <span class="mx-2">{$t('common.footer.why')}</span>
        </button>
        <button
          onclick={() => navigateTo('/faq')}
          class="flex items-center w-full text-start px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 border-t border-gray-100 dark:border-gray-700"
          role="menuitem"
        >
          {@html faqIcon}
          <span class="mx-2">{$t('common.footer.faq')}</span>
        </button>
      </div>
    </div>
  {/if}
</div>
