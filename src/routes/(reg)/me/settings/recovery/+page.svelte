<script lang="ts">
  /**
   * /me/settings/recovery — T9b social recovery (PLAN_T9_SOCIAL_RECOVERY §4).
   *
   * One page, three roles: the owner names guardians and can stop a recovery
   * that isn't theirs; a guardian approves a partner's new device; a device
   * that lost all its siblings recovers itself. The recovery banner (onboarding,
   * settings, /me/devices) links here.
   */
  import { onMount } from 'svelte';
  import { t, isRtl } from '$lib/translations';
  import { loadIdentity } from '$lib/crypto/identity';
  import { loadRecoveryOverview, type RecoveryOverview } from '$lib/client/recovery';
  import GuardianSetup from '$lib/components/recovery/GuardianSetup.svelte';
  import RecoveryAlerts from '$lib/components/recovery/RecoveryAlerts.svelte';
  import VouchForPartner from '$lib/components/recovery/VouchForPartner.svelte';
  import RecoverThisDevice from '$lib/components/recovery/RecoverThisDevice.svelte';
  import GuardingRequests from '$lib/components/recovery/GuardingRequests.svelte';

  let overview = $state<RecoveryOverview>({ effective: null, pending: null, recoveries: [], guarding: [] });
  let myDevice = $state<string | null>(null);
  let error = $state('');

  const mine = $derived(overview.recoveries.find((r) => r.devicePubKey === myDevice) ?? null);

  async function refresh() {
    const res = await loadRecoveryOverview();
    if (res.ok) {
      overview = { effective: res.effective, pending: res.pending, recoveries: res.recoveries, guarding: res.guarding };
      error = '';
    } else {
      error = $t('recovery.error', { reason: res.reason });
    }
  }

  onMount(async () => {
    myDevice = (await loadIdentity())?.devicePubB64 ?? null;
    await refresh();
  });
</script>

<svelte:head>
  <title>{$t('recovery.title')} · 1💗1</title>
</svelte:head>

<main class="min-h-screen w-full mx-auto max-w-3xl p-4 md:p-8 space-y-5" dir={$isRtl ? 'rtl' : 'ltr'}>
  <a href="/me/settings" data-sveltekit-prefetch class="text-sm text-goldink hover:underline">
    {$t('recovery.back')}
  </a>

  <h1 class="text-2xl font-bold text-center text-goldink">{$t('recovery.title')}</h1>
  <p class="text-sm text-zinc-600 dark:text-zinc-400">{$t('recovery.intro')}</p>

  {#if error}
    <p class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800" role="alert">{error}</p>
  {/if}

  <RecoveryAlerts recoveries={overview.recoveries} {myDevice} onchange={refresh} />

  <GuardianSetup effective={overview.effective} pending={overview.pending} onsaved={refresh} />

  <GuardingRequests guarding={overview.guarding} onchange={refresh} />

  <VouchForPartner />

  <RecoverThisDevice progress={mine} onchange={refresh} />
</main>
