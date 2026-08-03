<script>
  import { t } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { DISCOVERY_LINKS, activeDiscoveryLink } from './discoveryLinks.js';

  /**
   * Footer tab for the five public discovery pages. They cannot each own a
   * tab — the bar is already at capacity — so they share one that opens a
   * small sheet. Below 400px this tab is hidden and the same list appears
   * inside the "more" menu instead.
   *
   * @typedef {Object} Props
   * @property {boolean} [vertical] - Footer is in its upward column mode.
   * @property {string} [itemClass] - Shared per-item classes from the footer.
   * @property {string} [extraClass] - Responsive visibility from the footer.
   */
  let { vertical = false, itemClass = '', extraClass = '' } = $props();

  let showMenu = $state(false);

  let activeLink = $derived(activeDiscoveryLink(page.url.pathname));

  function navigateTo(path) {
    goto(path);
    showMenu = false;
  }
</script>

<div class="{vertical ? 'relative' : 'relative h-full'} {extraClass}">
  <button
    onclick={() => (showMenu = !showMenu)}
    type="button"
    aria-expanded={showMenu}
    class="{activeLink ? 'border-b-2 border-gold' : ''} {vertical
      ? 'w-full'
      : 'h-full w-full'} {itemClass}"
  >
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
        d="M12 21a9 9 0 100-18 9 9 0 000 18zm3.75-12.75l-2.03 5.72-5.72 2.03 2.03-5.72 5.72-2.03z"
      />
    </svg>
    <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">
      {$t('common.footer.discover')}
    </span>
  </button>

  {#if showMenu}
    <!-- Backdrop: the sheet is wider than its tab, so tapping away must close it -->
    <button
      type="button"
      aria-label={$t('common.footer.close')}
      class="fixed inset-0 z-40 cursor-default"
      onclick={() => (showMenu = false)}
    ></button>

    <!-- `left-1/2 -translate-x-1/2` and not a logical inset: this tab sits
         mid-bar in both directions, so centring on it keeps the sheet inside
         the viewport either way. -->
    <div
      class="absolute z-50 min-w-44 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 {vertical
        ? 'bottom-0 start-full ms-2'
        : 'bottom-full mb-2 left-1/2 -translate-x-1/2'}"
    >
      <div class="py-1" role="menu" aria-orientation="vertical">
        <div
          class="px-4 pt-1 pb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500"
        >
          {$t('common.footer.discoverLabel')}
        </div>
        {#each DISCOVERY_LINKS as link (link.key)}
          <button
            onclick={() => navigateTo(link.href)}
            class="flex items-center w-full text-start px-4 py-2 text-sm whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 {activeLink?.key ===
            link.key
              ? 'text-barbi font-semibold'
              : 'text-gray-700 dark:text-gray-200'}"
            role="menuitem"
            aria-current={activeLink?.key === link.key ? 'page' : undefined}
          >
            <span aria-hidden="true">{link.emoji}</span>
            <span class="mx-2">{$t(`common.footer.discover_${link.key}`)}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
