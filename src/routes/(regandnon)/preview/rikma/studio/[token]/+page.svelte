<script>
  import { goto, invalidateAll } from '$app/navigation';
  import { t } from '$lib/translations';
  import BlueprintReview from '$lib/components/assistant/BlueprintReview.svelte';

  let { data } = $props();

  let conflict = $state(false);
  /** @type {'' | 'public' | 'studio'} */
  let copiedKind = $state('');

  async function reload() {
    conflict = true;
    await invalidateAll();
  }

  /** @param {'public' | 'studio'} which @param {string} url */
  async function copyLink(which, url) {
    try {
      await navigator.clipboard.writeText(url);
      copiedKind = which;
      setTimeout(() => {
        if (copiedKind === which) copiedKind = '';
      }, 2500);
    } catch {
      copiedKind = '';
    }
  }

  /** @param {number} expectedVersion @param {Record<string, unknown>[]} ops */
  async function saveOps(expectedVersion, ops) {
    if (data.expired) return { success: false };
    try {
      const res = await fetch('/api/assistant/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ t: data.token, expectedVersion, ops })
      });
      const body = await res.json().catch(() => null);
      if (res.status === 409 && body?.reason === 'claimed') {
        await goto(`/moach/import/${data.studio.session.sessionId}`);
        return { success: false };
      }
      if (!res.ok || !body?.ok) {
        return { success: false, error: { message: body?.message } };
      }
      return { success: true, data: body };
    } catch {
      return { success: false };
    }
  }

  async function proceedToSignupOrClaim() {
    if (data.expired) return;
    await goto(data.studio.nextPath);
  }
</script>

<svelte:head>
  <title>
    {data.expired
      ? $t('rikmaImport.receive.title')
      : `${data.studio.session.fields?.name || $t('rikmaImport.title')} · ${$t('rikmaImport.studio.badge')}`} · 1💗1
  </title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="referrer" content="no-referrer" />
</svelte:head>

{#if data.expired}
  <section
    class="mx-auto max-w-lg my-10 p-6 flex flex-col gap-4 text-start rounded-2xl border border-surfaceLine bg-surface text-surfaceInk shadow-lg"
    data-testid="studio-expired"
  >
    <h1 class="text-xl font-bold">{$t('rikmaImport.receive.title')}</h1>
    <p class="text-sm text-surfaceInk" role="alert">{$t('rikmaImport.receive.expired')}</p>
    <a class="self-start underline text-sm text-surfaceInk" href="/">{$t('rikmaImport.receive.home')}</a>
  </section>
{:else}
  <div class="py-4 px-2 sm:px-4 flex flex-col gap-4">
    <!-- Dual-Link Control Header: Behind the Scenes + Public Rikma Page -->
    <section
      class="mx-auto w-full max-w-3xl p-4 sm:p-5 flex flex-col gap-4 text-start rounded-2xl border border-barbi/40 bg-surface text-surfaceInk shadow-lg"
      data-testid="studio-dual-links"
    >
      <div class="flex flex-col gap-1">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-barbi/15 text-surfaceInk">
            🛠️ {$t('rikmaImport.studio.badge')}
          </span>
          <a
            href={data.studio.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs font-semibold underline text-surfaceInk hover:opacity-80"
          >
            🌐 {$t('rikmaImport.studio.openPublic')} ↗
          </a>
        </div>
        <h2 class="text-lg sm:text-xl font-bold text-surfaceInk mt-1">
          {$t('rikmaImport.studio.greeting', { name: data.studio.recipientName })}
        </h2>
        <p class="text-sm text-surfaceMuted leading-relaxed">
          {$t('rikmaImport.studio.subtitle')}
        </p>
      </div>

      {#if data.studio.signedWaitingEmail}
        <p class="rounded-xl border border-gold/50 bg-gold/10 p-3 text-sm text-surfaceInk" role="status">
          ✉️ {$t('rikmaImport.studio.waitingEmail')}
        </p>
      {/if}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div class="rounded-xl border border-surfaceLine bg-surface2 p-3 flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-surfaceInk">🌐 {$t('rikmaImport.studio.publicLinkLabel')}</span>
            <button
              type="button"
              class="shrink-0 rounded-full border border-barbi/40 px-2.5 py-0.5 font-semibold text-surfaceInk hover:bg-barbi/15"
              onclick={() => copyLink('public', data.studio.previewUrl)}
            >
              {copiedKind === 'public' ? $t('rikmaImport.share.copied') : $t('rikmaImport.share.copy')}
            </button>
          </div>
          <code class="block truncate rounded bg-surface p-1.5 text-[11px] text-surfaceInk border border-surfaceLine" dir="ltr">
            {data.studio.previewUrl}
          </code>
        </div>

        <div class="rounded-xl border border-surfaceLine bg-surface2 p-3 flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold text-surfaceInk">🛠️ {$t('rikmaImport.studio.studioLinkLabel')}</span>
            <button
              type="button"
              class="shrink-0 rounded-full border border-barbi/40 px-2.5 py-0.5 font-semibold text-surfaceInk hover:bg-barbi/15"
              onclick={() => copyLink('studio', data.studio.manageUrl)}
            >
              {copiedKind === 'studio' ? $t('rikmaImport.share.copied') : $t('rikmaImport.share.copy')}
            </button>
          </div>
          <code class="block truncate rounded bg-surface p-1.5 text-[11px] text-surfaceInk border border-surfaceLine" dir="ltr">
            {data.studio.manageUrl}
          </code>
        </div>
      </div>
    </section>

    {#if conflict}
      <p
        class="mx-auto w-full max-w-3xl rounded-xl border-2 border-amber-500 bg-surface text-surfaceInk p-3 text-sm text-start"
        role="status"
      >
        {$t('rikmaImport.conflict')}
      </p>
    {/if}

    {#key data.studio.session.version}
      <BlueprintReview
        session={data.studio.session}
        onConflict={reload}
        studio={{
          save: saveOps,
          proceed: proceedToSignupOrClaim,
          proceedLabel: data.studio.hasAccount
            ? $t('rikmaImport.studio.receiveAndCreate')
            : $t('rikmaImport.studio.signupAndCreate'),
          previewUrl: data.studio.previewUrl,
          expiresAt: data.studio.expiresAt
        }}
      />
    {/key}
  </div>
{/if}
