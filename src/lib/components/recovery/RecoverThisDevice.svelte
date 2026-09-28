<script lang="ts">
  /**
   * The new device's side of T9b: open a request, read the code and the
   * fingerprint to each guardian, watch the vouches arrive, wait out the 24h
   * protest window, register. The server re-derives the decision from the
   * signed vouches when the device registers.
   */
  import { t } from '$lib/translations';
  import {
    openRecoveryRequest,
    completeRecovery,
    type RecoveryRequest,
    type RecoveryInProgress
  } from '$lib/client/recovery';

  let {
    progress,
    onchange
  }: { progress: RecoveryInProgress | null; onchange: () => void } = $props();

  let request = $state<RecoveryRequest | null>(null);
  let busy = $state(false);
  let message = $state('');
  let done = $state(false);
  // Opened by the user, or already under way (the overview lists this device).
  let open = $state(false);
  const expanded = $derived(open || !!progress);

  const fmt = (ts: number) => new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const ready = $derived(!!progress?.readyAt && progress.readyAt <= Date.now());

  async function start() {
    busy = true;
    message = '';
    try {
      const res = await openRecoveryRequest();
      if (res.ok) {
        request = res;
        onchange();
      } else {
        message = res.reason === 'no_guardians' ? $t('recovery.recover.noGuardians') : $t('recovery.error', { reason: res.reason });
      }
    } finally {
      busy = false;
    }
  }

  async function complete() {
    busy = true;
    message = '';
    try {
      const res = await completeRecovery();
      if (res.ok) {
        done = true;
        onchange();
      } else {
        message = $t('recovery.error', { reason: res.reason });
      }
    } finally {
      busy = false;
    }
  }
</script>

<section class="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40">
  <h2 class="font-semibold text-goldink">{$t('recovery.recover.title')}</h2>
  {#if done}
    <p class="text-sm text-emerald-700 dark:text-emerald-300" role="status">{$t('recovery.recover.done')}</p>
  {:else if !expanded}
    <button class="text-sm text-goldink underline" onclick={() => (open = true)}>{$t('recovery.recover.desc')}</button>
  {:else}
    <p class="text-sm text-zinc-500">{$t('recovery.recover.desc')}</p>

    {#if request}
      <div class="space-y-2 rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800/60">
        <p class="text-sm">{$t('recovery.recover.code')}</p>
        <p class="font-mono text-3xl tracking-[0.3em]" dir="ltr">{request.code.slice(0, 4)}-{request.code.slice(4)}</p>
        <p class="text-sm">{$t('recovery.recover.fingerprint')}</p>
        <p class="font-mono text-2xl tracking-widest" dir="ltr">{request.fingerprint}</p>
        <p class="text-xs text-zinc-500">{$t('recovery.recover.readTo')}</p>
        <p class="text-xs">
          {$t('recovery.recover.guardians')}: {request.guardians.map((g) => g.username ?? g.id).join(', ')}
        </p>
      </div>
    {:else}
      <button
        class="rounded-full bg-gradient-to-br from-barbi to-mpink px-4 py-2 text-sm font-bold text-gold hover:brightness-110 disabled:opacity-40"
        disabled={busy}
        onclick={start}
      >{$t('recovery.recover.start')}</button>
    {/if}

    {#if progress}
      <div class="space-y-1 text-sm">
        {#if progress.threshold}
          <p>{$t('recovery.recover.progress', { count: progress.vouchers.length, threshold: progress.threshold })}</p>
        {/if}
        {#if progress.protestedAt}
          <p class="text-rose-600">{$t('recovery.recover.protested')}</p>
        {/if}
        {#if progress.readyAt && !ready}
          <p>{$t('recovery.recover.waiting', { date: fmt(progress.readyAt) })}</p>
        {/if}
      </div>
    {/if}

    <div class="flex flex-wrap gap-2">
      {#if request || progress}
        <button class="rounded-lg border px-3 py-1 text-sm" disabled={busy} onclick={onchange}>{$t('recovery.recover.refresh')}</button>
      {/if}
      {#if ready}
        <button
          class="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
          disabled={busy}
          onclick={complete}
        >{$t('recovery.recover.complete')}</button>
      {/if}
    </div>
  {/if}
  {#if message}<p class="text-sm" role="status">{message}</p>{/if}
</section>
