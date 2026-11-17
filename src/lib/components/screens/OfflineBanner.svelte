<script>
  /**
   * Says so when the browser has no network, and — briefly — when it comes
   * back. The reconnect and the background refresh themselves happen in
   * socketClient (resume) and the realtime bus (resync); this is only the
   * explanation, so a member does not act on a screen they cannot trust.
   */
  import { t } from '$lib/translations';
  import { isOnline } from '$lib/stores/network';

  let showBack = $state(false);

  // Driven by the store's subscription, not an $effect: the flag and the timer
  // are not reactive reads, so nothing re-runs and cancels the "back" timer.
  $effect(() => {
    let wasOffline = false;
    let backTimer;
    const off = isOnline.subscribe((on) => {
      clearTimeout(backTimer);
      if (!on) {
        wasOffline = true;
        showBack = false;
      } else if (wasOffline) {
        wasOffline = false;
        showBack = true;
        backTimer = setTimeout(() => (showBack = false), 4000);
      }
    });
    return () => {
      off();
      clearTimeout(backTimer);
    };
  });
</script>

{#if !$isOnline}
  <div
    class="sticky top-0 z-50 border-b border-gold bg-black/85 px-4 py-2 text-center"
    role="status"
    aria-live="polite"
  >
    <p class="text-barbi text-sm sm:text-base font-bold">
      {$t('ui.offline.title')}
      <span class="text-gold font-normal">{$t('ui.offline.body')}</span>
    </p>
  </div>
{:else if showBack}
  <div
    class="sticky top-0 z-50 border-b border-gold bg-black/85 px-4 py-2 text-center"
    role="status"
    aria-live="polite"
  >
    <p class="text-gold text-sm sm:text-base">{$t('ui.offline.back')}</p>
  </div>
{/if}
