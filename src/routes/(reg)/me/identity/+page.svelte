<script lang="ts">
  import { isRtl, t } from '$lib/translations';
  /**
   * /me/identity — your cryptographic identity at a glance.
   *
   * Shows the user's local device public key fingerprint, full key (toggle),
   * the registration status with the mirror, and what it all means.
   *
   * Acts as the first proof-of-concept that the consent infrastructure is
   * live: every visitor here will see their key was created and published
   * (or see exactly why it wasn't).
   */
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import ConsentStatusBadge from '$lib/components/consent/ConsentStatusBadge.svelte';
  import {
    consentStatus,
    bootstrapConsentIdentity
  } from '$lib/consent/bootstrap.svelte';

  let showFullKey = $state(false);
  let signedEventCount = $state<number | null>(null);


  const label = (key: string) => $t(`me.identity.${key}`);

  onMount(async () => {
    if (browser && page.data?.uid) {
      await bootstrapConsentIdentity(page.data.uid);
      // Best-effort: ask the mirror how many of our events it knows about.
      try {
        const userId = page.data.uid;
        const res = await fetch(`/api/consent/keys/${encodeURIComponent(userId)}`, {
          credentials: 'include'
        });
        if (res.ok) {
          const body = await res.json().catch(() => null);
          if (body?.ok && Array.isArray(body.keys)) {
            signedEventCount = body.keys.length;
          }
        }
      } catch {
        // metric is non-critical
      }
    }
  });

  async function retry() {
    if (page.data?.uid) {
      await bootstrapConsentIdentity(page.data.uid);
    }
  }
</script>

<svelte:head>
  <title>{label('title')} · 1lev1</title>
</svelte:head>

<main class="mx-auto max-w-2xl p-4 md:p-8 text-zinc-800 dark:text-zinc-100" dir={$isRtl ? 'rtl' : 'ltr'}>
  <a href="/me" class="text-sm text-zinc-500 hover:underline">← {label('backToMe')}</a>

  <h1 class="text-2xl font-bold mt-4 mb-2">{label('title')}</h1>
  <p class="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
    {label('explainer')}
  </p>

  <section class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 md:p-5 space-y-4 bg-white/60 dark:bg-zinc-900/40">

    <div class="flex items-center justify-between gap-3 flex-wrap">
      <span class="font-medium">{label('status')}</span>
      <ConsentStatusBadge expanded lang={$lang === 'en' ? 'en' : 'he'} />
    </div>

    <div class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
      <span class="text-zinc-500">{label('algo')}</span>
      <span class="font-mono">{consentStatus.algo ?? label('nothing')}</span>

      <span class="text-zinc-500">{label('createdAt')}</span>
      <span class="font-mono">
        {consentStatus.createdAt
          ? new Date(consentStatus.createdAt).toLocaleString($lang === 'en' ? 'en-US' : 'he-IL')
          : label('nothing')}
      </span>

      <span class="text-zinc-500">{label('fingerprint')}</span>
      <span class="font-mono break-all">
        {#if consentStatus.devicePubB64}
          {showFullKey
            ? consentStatus.devicePubB64
            : consentStatus.devicePubB64.slice(0, 16) + '…'}
          <button
            type="button"
            class="ms-2 text-emerald-600 hover:underline text-xs"
            onclick={() => (showFullKey = !showFullKey)}
          >
            {showFullKey ? label('hideKey') : label('fullKey')}
          </button>
        {:else}
          {label('nothing')}
        {/if}
      </span>

      {#if signedEventCount !== null}
        <span class="text-zinc-500">{label('signedEvents')}</span>
        <span class="font-mono">{signedEventCount}</span>
      {/if}
    </div>

    {#if consentStatus.kind === 'error' || consentStatus.kind === 'local-only'}
      <div class="pt-2 border-t border-zinc-200 dark:border-zinc-700">
        {#if consentStatus.reason}
          <p class="text-xs text-rose-600 dark:text-rose-400 mb-2">
            {consentStatus.reason}
          </p>
        {/if}
        <button
          type="button"
          onclick={retry}
          class="px-3 py-1.5 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {label('retry')}
        </button>
      </div>
    {/if}
  </section>
</main>
