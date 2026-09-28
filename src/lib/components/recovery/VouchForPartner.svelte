<script lang="ts">
  /**
   * The guardian's side of T9b: type the code the user reads over the phone,
   * compare the fingerprint (computed HERE from the keys the vouch will name),
   * confirm the out-of-band check, sign.
   */
  import { t } from '$lib/translations';
  import { lookupRecoveryRequest, vouchForRecovery, type RecoveryLookup } from '$lib/client/recovery';

  let code = $state('');
  let request = $state<RecoveryLookup | null>(null);
  let confirmed = $state(false);
  let busy = $state(false);
  let message = $state('');

  const cleanCode = $derived(code.replace(/[\s-]/g, '').toUpperCase());

  async function check() {
    busy = true;
    message = '';
    request = null;
    confirmed = false;
    try {
      const res = await lookupRecoveryRequest(cleanCode);
      if (res.ok) request = res.request;
      else message = res.reason === 'not_found' || res.reason === 'http_404'
        ? $t('recovery.vouch.notFound')
        : $t('recovery.error', { reason: res.reason });
    } finally {
      busy = false;
    }
  }

  async function sign() {
    if (!request) return;
    busy = true;
    try {
      const res = await vouchForRecovery(request);
      if (res.ok) {
        message = $t('recovery.vouch.done');
        request = null;
        code = '';
      } else {
        message = $t('recovery.error', { reason: res.reason });
      }
    } finally {
      busy = false;
    }
  }
</script>

<section class="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40">
  <h2 class="font-semibold text-goldink">{$t('recovery.vouch.title')}</h2>
  <p class="text-sm text-zinc-500">{$t('recovery.vouch.desc')}</p>
  <form class="flex gap-2" onsubmit={(e) => { e.preventDefault(); check(); }}>
    <input
      class="w-44 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-transparent px-2 py-1 font-mono uppercase tracking-widest"
      maxlength="10"
      placeholder={$t('recovery.vouch.codePlaceholder')}
      bind:value={code}
      dir="ltr"
      autocomplete="off"
    />
    <button class="rounded-lg border px-3 py-1 text-sm disabled:opacity-40" disabled={busy || cleanCode.length !== 8}>
      {$t('recovery.vouch.check')}
    </button>
  </form>

  {#if request}
    <div class="space-y-2 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800/60">
      <p class="font-semibold">{$t('recovery.vouch.who', { name: request.username ?? $t('recovery.vouch.unknownUser') })}</p>
      <p>{$t('recovery.vouch.already', { count: request.vouchers.length, threshold: request.threshold })}</p>
      {#if request.protestedAt}
        <p class="rounded bg-amber-100 p-2 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">{$t('recovery.vouch.protestedWarn')}</p>
      {/if}
      <p>{$t('recovery.vouch.fingerprintAsk')}</p>
      <p class="text-center font-mono text-2xl tracking-widest" dir="ltr">{request.fingerprint}</p>
      <label class="flex items-start gap-2">
        <input type="checkbox" class="mt-1" bind:checked={confirmed} />
        <span>{$t('recovery.vouch.confirm')}</span>
      </label>
      <button
        class="rounded-full bg-emerald-600 px-4 py-1.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
        disabled={busy || !confirmed}
        onclick={sign}
      >{$t('recovery.vouch.sign')}</button>
    </div>
  {/if}

  {#if message}<p class="text-sm" role="status">{message}</p>{/if}
</section>
