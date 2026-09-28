<script lang="ts">
  /**
   * Recoveries in progress on the user's own account, seen from a device they
   * still hold — with the 24h protest ("This isn't me", plan §9 decision 1).
   * The recovery of THIS device is left to RecoverThisDevice.
   */
  import { t } from '$lib/translations';
  import { protestRecovery, type RecoveryInProgress } from '$lib/client/recovery';

  let {
    recoveries,
    myDevice,
    onchange
  }: { recoveries: RecoveryInProgress[]; myDevice: string | null; onchange: () => void } = $props();

  let busy = $state(false);
  let message = $state('');

  const others = $derived(recoveries.filter((r) => r.devicePubKey !== myDevice));
  const fmt = (ts: number) => new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  async function protest(r: RecoveryInProgress) {
    if (!confirm($t('recovery.alerts.protestConfirm'))) return;
    busy = true;
    message = '';
    try {
      const res = await protestRecovery(r.devicePubKey);
      message = res.ok ? $t('recovery.alerts.protestDone') : $t('recovery.error', { reason: res.reason });
      if (res.ok) onchange();
    } finally {
      busy = false;
    }
  }
</script>

{#if others.length > 0 && myDevice}
  <section class="space-y-3 rounded-xl border-2 border-rose-300 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/40" role="alert">
    <h2 class="font-semibold text-rose-700 dark:text-rose-300">{$t('recovery.alerts.title')}</h2>
    <p class="text-sm text-rose-800 dark:text-rose-200">{$t('recovery.alerts.desc')}</p>
    {#each others as r (r.devicePubKey)}
      <div class="space-y-1 rounded-lg bg-white/70 p-3 text-sm dark:bg-zinc-900/60">
        <p>{$t('recovery.alerts.fingerprint')}: <b class="font-mono" dir="ltr">{r.fingerprint}</b></p>
        {#if r.threshold}
          <p>{$t('recovery.alerts.vouches', { count: r.vouchers.length, threshold: r.threshold })}
            {#if r.vouchers.length}({r.vouchers.map((v) => v.username ?? v.id).join(', ')}){/if}</p>
        {/if}
        {#if r.readyAt}<p class="font-semibold">{$t('recovery.alerts.readyAt', { date: fmt(r.readyAt) })}</p>{/if}
        {#if r.protestedAt}<p class="text-zinc-600 dark:text-zinc-400">{$t('recovery.alerts.protested', { date: fmt(r.protestedAt) })}</p>{/if}
        <button
          class="mt-1 rounded-full bg-rose-600 px-4 py-1.5 font-bold text-white hover:bg-rose-700 disabled:opacity-40"
          disabled={busy}
          onclick={() => protest(r)}
        >{$t('recovery.alerts.protest')}</button>
      </div>
    {/each}
    {#if message}<p class="text-sm" role="status">{message}</p>{/if}
  </section>
{/if}
