<script lang="ts">
  import { isRtl } from '$lib/translations';
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

  const labels = {
    title:         { he: 'הזהות הקריפטוגרפית שלך', en: 'Your cryptographic identity' },
    explainer:     {
      he: 'באתר קיים מנגנון שמייצר עבורך מפתח חתימה דיגיטלי הנשמר רק בדפדפן שלך. השרת לא מחזיק עותק. מרגע שהוא מוגדר, כל פעולה משמעותית (הצבעה, אישור, הצטרפות) נחתמת על ידך — ואפילו אנחנו לא יכולים לזייף אותה.',
      en: 'This site generates a digital signing key for you that lives only in your browser. The server never holds a copy. Once it is set up, every meaningful action you take (vote, approve, join) is signed by you — and even we cannot forge it.'
    },
    status:        { he: 'סטטוס', en: 'Status' },
    fingerprint:   { he: 'טביעת המפתח', en: 'Fingerprint' },
    fullKey:       { he: 'הצג מפתח מלא', en: 'Show full key' },
    hideKey:       { he: 'הסתר', en: 'Hide' },
    algo:          { he: 'אלגוריתם', en: 'Algorithm' },
    createdAt:     { he: 'נוצר ב', en: 'Created at' },
    signedEvents:  { he: 'אירועים חתומים שלך', en: 'Your signed events' },
    retry:         { he: 'נסה שוב', en: 'Retry' },
    backToMe:      { he: 'חזרה לפרופיל', en: 'Back to profile' },
    nothing:       { he: '— אין נתון —', en: '— no data —' }
  };

  const t = (key: keyof typeof labels) => labels[key][$lang === 'en' ? 'en' : 'he'] ?? labels[key].he;

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
  <title>{t('title')} · 1lev1</title>
</svelte:head>

<main class="mx-auto max-w-2xl p-4 md:p-8 text-zinc-800 dark:text-zinc-100" dir={$isRtl ? 'rtl' : 'ltr'}>
  <a href="/me" class="text-sm text-zinc-500 hover:underline">← {t('backToMe')}</a>

  <h1 class="text-2xl font-bold mt-4 mb-2">{t('title')}</h1>
  <p class="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
    {t('explainer')}
  </p>

  <section class="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 md:p-5 space-y-4 bg-white/60 dark:bg-zinc-900/40">

    <div class="flex items-center justify-between gap-3 flex-wrap">
      <span class="font-medium">{t('status')}</span>
      <ConsentStatusBadge expanded lang={$lang === 'en' ? 'en' : 'he'} />
    </div>

    <div class="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
      <span class="text-zinc-500">{t('algo')}</span>
      <span class="font-mono">{consentStatus.algo ?? t('nothing')}</span>

      <span class="text-zinc-500">{t('createdAt')}</span>
      <span class="font-mono">
        {consentStatus.createdAt
          ? new Date(consentStatus.createdAt).toLocaleString($lang === 'en' ? 'en-US' : 'he-IL')
          : t('nothing')}
      </span>

      <span class="text-zinc-500">{t('fingerprint')}</span>
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
            {showFullKey ? t('hideKey') : t('fullKey')}
          </button>
        {:else}
          {t('nothing')}
        {/if}
      </span>

      {#if signedEventCount !== null}
        <span class="text-zinc-500">{t('signedEvents')}</span>
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
          {t('retry')}
        </button>
      </div>
    {/if}
  </section>
</main>
