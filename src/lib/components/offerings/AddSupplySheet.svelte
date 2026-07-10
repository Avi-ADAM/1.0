<script>
  import { t, isRtl } from '$lib/translations';

  /**
   * "Add your supply" sheet — PLAN_USER_OFFERINGS §4.3 (M4).
   *
   * Opened from the FAB on /demand (the target of the quorum "suppliers" CTA).
   * Four supply paths: mission offer / resource / product → the "my offerings"
   * sections on /me; threshold offer → the maagadim layer on the map (picked
   * pool opens the existing MaagadOfferForm on /maagad/[id]).
   *
   * Props:
   *  - isLoggedIn: boolean — anonymous users are routed to signup first.
   *  - onShowMaagadim(): void — the demand page switches the map to the
   *    maagadim-only view (the offer itself is made from a pool's page).
   *  - onClose(): void
   */

  let { isLoggedIn = false, onShowMaagadim, onClose } = $props();

  const next = encodeURIComponent('/demand?lens=supply');

  const options = $derived([
    {
      emoji: '🛠️',
      labelKey: 'demand.add_mission',
      hintKey: 'demand.add_mission_hint',
      href: isLoggedIn ? '/me#my-mission-offers' : `/signup?next=${next}`
    },
    {
      emoji: '📦',
      labelKey: 'demand.add_resource',
      hintKey: 'demand.add_resource_hint',
      href: isLoggedIn ? '/me#my-resources' : `/signup?next=${next}`
    },
    {
      emoji: '🎁',
      labelKey: 'demand.add_product',
      hintKey: 'demand.add_product_hint',
      href: isLoggedIn ? '/me#my-products' : `/signup?next=${next}`
    }
  ]);

  function thresholdClick() {
    if (!isLoggedIn) return; // anchor below handles the signup redirect
    onShowMaagadim?.();
    onClose?.();
  }
</script>

<div
  class="fixed inset-0 z-[1100] bg-black/50 flex items-end sm:items-center justify-center"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose?.();
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose?.();
  }}
>
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
  >
    <div class="px-4 py-3 bg-gradient-to-l from-barbi to-mpink text-white flex items-center justify-between">
      <div>
        <h2 class="text-lg font-bold">{$t('demand.add_supply_title')}</h2>
        <p class="text-xs opacity-80">{$t('demand.add_supply_sub')}</p>
      </div>
      <button class="text-xl leading-none" onclick={() => onClose?.()} aria-label="✕">✕</button>
    </div>

    <div class="p-3 space-y-2">
      {#if !isLoggedIn}
        <p class="text-xs text-gray-600 dark:text-gray-300 bg-gold/20 dark:bg-gold/10 rounded-xl px-3 py-2">
          {$t('demand.add_login')}
        </p>
      {/if}

      {#each options as opt (opt.labelKey)}
        <a
          href={opt.href}
          class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2.5 hover:border-barbi transition-colors"
        >
          <span class="text-2xl">{opt.emoji}</span>
          <span>
            <span class="block text-sm font-semibold text-gray-900 dark:text-gray-100">{$t(opt.labelKey)}</span>
            <span class="block text-xs text-gray-500 dark:text-gray-400">{$t(opt.hintKey)}</span>
          </span>
        </a>
      {/each}

      {#if isLoggedIn}
        <button
          class="w-full flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2.5 hover:border-barbi transition-colors text-start"
          onclick={thresholdClick}
        >
          <span class="text-2xl">🤝</span>
          <span>
            <span class="block text-sm font-semibold text-gray-900 dark:text-gray-100">{$t('demand.add_threshold')}</span>
            <span class="block text-xs text-gray-500 dark:text-gray-400">{$t('demand.add_threshold_hint')}</span>
          </span>
        </button>
      {:else}
        <a
          href={`/signup?next=${next}`}
          class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2.5 hover:border-barbi transition-colors"
        >
          <span class="text-2xl">🤝</span>
          <span>
            <span class="block text-sm font-semibold text-gray-900 dark:text-gray-100">{$t('demand.add_threshold')}</span>
            <span class="block text-xs text-gray-500 dark:text-gray-400">{$t('demand.add_threshold_hint')}</span>
          </span>
        </a>
      {/if}
    </div>
  </div>
</div>
