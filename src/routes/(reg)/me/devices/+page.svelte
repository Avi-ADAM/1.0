<script lang="ts">
  /**
   * /me/devices — T7 device management (PLAN_user_sovereign_consent Phase 2).
   *
   * Lists this user's signing devices, shows which one is THIS device,
   * whether each is certified (DeviceCert chain) or TOFU-only, and drives:
   *   - pairing: new device shows a 6-char code; an existing device enters
   *     it, the user confirms, a DeviceCert is signed and submitted;
   *   - revocation: any active device can revoke a device (including itself);
   *   - chain reset: the "lost every device" escape hatch, with a protest
   *     window an old device can use to cancel.
   */

  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { loadIdentity } from '$lib/crypto/identity';
  import {
    openPairingAsNewDevice,
    fetchPendingDevice,
    approvePairing,
    revokeDevice,
    requestChainReset,
    protestChainReset
  } from '$lib/client/devicePairing';
  import ConsentBadge from '$lib/components/consent/ConsentBadge.svelte';
  import { lang } from '$lib/stores/lang.js';

  type DeviceRow = {
    devicePubB64: string;
    algo: string;
    label: string;
    revokedAt: number | null;
    revokedReason: 'manual' | 'reset' | null;
    certified: boolean;
    addedAt: number;
  };

  let devices = $state<DeviceRow[]>([]);
  let myDeviceId = $state<string | null>(null);
  let busy = $state(false);
  let message = $state('');

  // pairing — new-device side
  let myCode = $state('');
  // pairing — approving side
  let codeInput = $state('');
  let pendingLabel = $state('');

  const i18n = {
    he: {
      title: 'המכשירים שלי', thisDevice: 'המכשיר הזה', certified: 'מזווג (cert)',
      tofu: 'TOFU בלבד', revoked: 'מבוטל', revokedReset: 'מבוטל (איפוס)',
      revoke: 'בטל מכשיר', pairTitle: 'זיווג מכשיר חדש',
      showCode: 'הצג קוד זיווג למכשיר הזה', codeHint: 'הקלד את הקוד במכשיר מאושר קיים',
      approveTitle: 'אישור מכשיר חדש', codePlaceholder: 'קוד בן 6 תווים',
      check: 'בדוק קוד', approve: 'אשר וחתום', pendingIs: 'ממתין לאישור:',
      resetTitle: 'איפוס שרשרת (איבדתי את כל המכשירים)',
      resetWarn: 'כל המכשירים יבוטלו. אחרי 48 שעות ההרשמה הבאה תיחשב מכשיר ראשון. מכשיר ישן ששרד יכול לבטל את האיפוס בחלון הזה.',
      reset: 'בקש איפוס', protest: 'בטל איפוס (מהמכשיר הזה)', added: 'נוסף'
    },
    en: {
      title: 'My devices', thisDevice: 'This device', certified: 'Paired (cert)',
      tofu: 'TOFU only', revoked: 'Revoked', revokedReset: 'Revoked (reset)',
      revoke: 'Revoke', pairTitle: 'Pair a new device',
      showCode: 'Show pairing code for this device', codeHint: 'Type the code on an existing trusted device',
      approveTitle: 'Approve a new device', codePlaceholder: '6-char code',
      check: 'Check code', approve: 'Approve & sign', pendingIs: 'Pending approval:',
      resetTitle: 'Chain reset (I lost all my devices)',
      resetWarn: 'All devices will be revoked. After 48h the next registration counts as a first device. A surviving old device can cancel during that window.',
      reset: 'Request reset', protest: 'Cancel reset (from this device)', added: 'Added'
    }
  } as const;
  const t = $derived(i18n[$lang as 'he' | 'en'] ?? i18n.he);

  function userId(): string | null {
    if (!browser) return null;
    return document.cookie.split('; ').find((r) => r.startsWith('id='))?.split('=')[1] ?? null;
  }

  async function refresh() {
    const uid = userId();
    if (!uid) return;
    const res = await fetch(`/api/consent/keys/${uid}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      devices = (data.keys ?? []).sort((a: DeviceRow, b: DeviceRow) => b.addedAt - a.addedAt);
    }
  }

  onMount(async () => {
    myDeviceId = (await loadIdentity())?.devicePubB64 ?? null;
    await refresh();
  });

  async function run(fn: () => Promise<{ ok: boolean; reason?: string }>, okMsg: string) {
    busy = true;
    message = '';
    try {
      const res = await fn();
      message = res.ok ? okMsg : `שגיאה: ${res.reason}`;
      if (res.ok) await refresh();
    } finally {
      busy = false;
    }
  }

  async function showMyCode() {
    busy = true;
    message = '';
    try {
      const res = await openPairingAsNewDevice();
      if (res.ok) myCode = res.code;
      else message = `שגיאה: ${res.reason}`;
    } finally {
      busy = false;
    }
  }

  async function checkCode() {
    pendingLabel = '';
    const res = await fetchPendingDevice(codeInput);
    if (res.ok) pendingLabel = res.device.label;
    else message = `שגיאה: ${res.reason}`;
  }

  const activeCount = $derived(devices.filter((d) => !d.revokedAt).length);
  const resetPending = $derived(
    devices.length > 0 && activeCount === 0 && devices.some((d) => d.revokedReason === 'reset')
  );
</script>

<svelte:head><title>{t.title} · 1lev1</title></svelte:head>

<div class="mx-auto max-w-2xl space-y-6 p-4">
  <h1 class="text-2xl font-bold text-primary">{t.title}</h1>

  {#if message}
    <p class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>
  {/if}

  <section class="space-y-2">
    {#each devices as d (d.devicePubB64)}
      <div class="flex flex-wrap items-center gap-3 rounded-xl border p-3
                  {d.revokedAt ? 'opacity-50' : ''}">
        <ConsentBadge
          status={d.revokedAt ? 'unverified' : d.certified ? 'signed' : 'unsigned'}
          title={d.revokedAt
            ? (d.revokedReason === 'reset' ? t.revokedReset : t.revoked)
            : d.certified ? t.certified : t.tofu}
          compact
        />
        <span class="font-medium">{d.label}</span>
        {#if d.devicePubB64 === myDeviceId}
          <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{t.thisDevice}</span>
        {/if}
        <span class="text-xs text-zinc-500">
          {d.certified ? t.certified : t.tofu} · {t.added} {new Date(d.addedAt).toLocaleDateString()}
        </span>
        {#if !d.revokedAt && myDeviceId}
          <button
            class="ms-auto rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-40"
            disabled={busy}
            onclick={() => run(() => revokeDevice(d.devicePubB64), '✓')}
          >{t.revoke}</button>
        {/if}
      </div>
    {/each}
  </section>

  <section class="rounded-xl border p-4">
    <h2 class="mb-2 font-semibold">{t.pairTitle}</h2>
    <div class="space-y-3">
      <div>
        <button class="rounded-lg bg-primary px-3 py-2 text-sm text-white disabled:opacity-40"
                disabled={busy} onclick={showMyCode}>{t.showCode}</button>
        {#if myCode}
          <div class="mt-2 text-center">
            <span class="font-mono text-3xl tracking-[0.4em]">{myCode}</span>
            <p class="text-xs text-zinc-500">{t.codeHint}</p>
          </div>
        {/if}
      </div>

      <hr />

      <div class="space-y-2">
        <h3 class="text-sm font-semibold">{t.approveTitle}</h3>
        <div class="flex gap-2">
          <input
            class="w-40 rounded-lg border px-2 py-1 font-mono uppercase"
            maxlength="6" placeholder={t.codePlaceholder} bind:value={codeInput}
          />
          <button class="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
                  disabled={busy || codeInput.length !== 6} onclick={checkCode}>{t.check}</button>
          {#if pendingLabel}
            <button class="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white disabled:opacity-40"
                    disabled={busy}
                    onclick={() => run(() => approvePairing(codeInput), '✓')}>{t.approve}</button>
          {/if}
        </div>
        {#if pendingLabel}
          <p class="text-sm text-zinc-600">{t.pendingIs} <b>{pendingLabel}</b></p>
        {/if}
      </div>
    </div>
  </section>

  <section class="rounded-xl border border-rose-200 p-4">
    <h2 class="mb-1 font-semibold text-rose-700">{t.resetTitle}</h2>
    <p class="mb-3 text-xs text-zinc-500">{t.resetWarn}</p>
    <div class="flex gap-2">
      <button class="rounded-lg border border-rose-400 px-3 py-1 text-sm text-rose-600 disabled:opacity-40"
              disabled={busy || resetPending}
              onclick={() => run(() => requestChainReset(), '✓')}>{t.reset}</button>
      {#if resetPending}
        <button class="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white disabled:opacity-40"
                disabled={busy}
                onclick={() => run(() => protestChainReset(), '✓')}>{t.protest}</button>
      {/if}
    </div>
  </section>
</div>
