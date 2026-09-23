<script>
  import { lang, langUs, doesLang } from '$lib/stores/lang.js';
  import { isRtl, locale, t } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { executeAction } from '$lib/client/actionClient';
  import EditB from '$lib/components/userPr/editBasic.svelte';
  import GithubIcon from '$lib/celim/icons/github.svelte';
  import { page } from '$app/state';
  import { invalidateAll } from '$app/navigation';
  import {
    autoTranslate,
    AUTO_TRANSLATE_VALUES,
    setAutoTranslate,
    adoptFromProfile
  } from '$lib/stores/autoTranslate.js';
  import CurrencyPicker from '$lib/components/money/CurrencyPicker.svelte';
  import { useMoney, setDisplayCurrency, adoptCurrencyFromProfile } from '$lib/money/context.svelte';
  import { formatMoney } from '$lib/money/format.js';
  let { data } = $props();

  // The reader's display currency (PLAN_MULTI_CURRENCY D-C9).
  const money = useMoney();
  let currencyVal = $state(money.currency);

  // Locales that render left-to-right; everything else is RTL. Mirrors
  // LangSwitch.svelte — saving a preferred language here must flip the same
  // stores/cookie it does, or the site keeps rendering in the old language
  // even though Strapi's `lang` field updated.
  const LTR_LOCALES = ['en', 'ru', 'es'];

  function syncDisplayLanguage(code) {
    if (!code || $lang === code) return;
    lang.set(code);
    locale.set(code);
    langUs.set(code);
    doesLang.set(true);
    document.cookie =
      `lang=${code}; path=/; expires=` + new Date(2027, 0, 1).toUTCString();
    document.documentElement.setAttribute('dir', LTR_LOCALES.includes(code) ? 'ltr' : 'rtl');
    document.documentElement.setAttribute('lang', code);
  }

  function toLocationValue(loc) {
    return {
      location_mode: loc?.location_mode ?? 'unspecified',
      isOnline: loc?.location_mode === 'online',
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      radius: loc?.radius ?? 15,
      location_hint: loc?.location_hint ?? ''
    };
  }

  let meData = $state(data.meData);
  let mail = $state(data.meData?.email);
  let lango = $state(data.meData?.lang || 'he');
  let locationVal = $state(toLocationValue(data.meData?.location?.[0]));
  let cards = $state(data.meData?.preferCards ?? true);
  let isG = $state(data.meData?.profilManualAlready ?? false);
  let fblink = $state(data.meData?.fblink),
    twiterlink = $state(data.meData?.twiterlink),
    discordlink = $state(data.meData?.discordlink),
    githublink = $state(data.meData?.githublink),
    noMail = $state(data.meData?.noMail);

  let userName_value;
  let biog;
  let frd;

  $effect(() => {
    if (!data.meData) return;
    meData = data.meData;
    mail = data.meData.email;
    lango = data.meData.lang || 'he';
    locationVal = toLocationValue(data.meData.location?.[0]);
    cards = data.meData.preferCards ?? true;
    fblink = data.meData.fblink;
    twiterlink = data.meData.twiterlink;
    discordlink = data.meData.discordlink;
    githublink = data.meData.githublink;
    noMail = data.meData.noMail;
    isG = data.meData.profilManualAlready;
    // A device that has never chosen picks up the account's answer
    // (PLAN_UGC_TRANSLATION §4.4). A device that *has* chosen keeps its own —
    // adoptFromProfile decides, not this page.
    adoptFromProfile(data.meData.autoTranslate);
    // Same rule for the currency: a device that chose keeps its choice.
    if (adoptCurrencyFromProfile(money, data.meData.currency)) currencyVal = money.currency;
  });

  async function sendD() {
    await executeAction('updateUserBasic', {
      username: userName_value,
      bio: biog,
      frd: frd,
      lang: lango,
      fblink,
      twiterlink,
      discordlink,
      githublink,
      preferCards: cards,
      noMail,
      location: locationVal
    });
    // updateUserBasic's updateStrategy reloads app:meProfile, which this
    // page depends on too, so meData refreshes automatically.
  }

  function onMessage(event) {
    fblink = event.fblink;
    twiterlink = event.twiterlink;
    discordlink = event.discordlink;
    githublink = event.githublink;
    userName_value = event.un;
    noMail = event.noMail;
    biog = event.bi;
    frd = event.frd;
    lango = event.lango;
    cards = event.cards;
    locationVal = event.location;
    syncDisplayLanguage(lango);
    sendD();
  }

  // GitHub account link (PLAN_CODE_RIKMA §3.2). The link itself happens on the
  // server after GitHub confirms the account; this page only starts it and
  // reads back the outcome it was redirected with.
  let githubLogin = $derived(meData?.githubLogin ?? null);
  let githubNotice = $derived(page.url.searchParams.get('github'));
  let githubNoticeText = $derived.by(() => {
    const key = `rikmaCode.status.${githubNotice}`;
    return githubNotice && $t(key) !== key ? $t(key) : '';
  });
  let unlinking = $state(false);
  let unlinkError = $state('');

  async function unlinkGithub() {
    unlinking = true;
    unlinkError = '';
    const res = await executeAction('unlinkGithubAccount', {});
    unlinking = false;
    if (res.success) await invalidateAll();
    else unlinkError = $t('rikmaCode.account.unlinkFailed');
  }

  // The guided tour walks elements that only exist on /me itself, so
  // resuming it means navigating back there and letting it kick off.
  function onGuid() {
    goto('/me?tour=1');
  }

</script>

<svelte:head>
  <title>{$t('pages.meSettings.title')} · 1💗1</title>
</svelte:head>

<main
  class="min-h-screen w-full mx-auto max-w-3xl p-4 md:p-8"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <a href="/me" data-sveltekit-prefetch class="text-sm text-goldink hover:underline"
    >{$t('pages.meSettings.back')}</a
  >

  <h1 class="text-2xl font-bold mt-4 mb-6 text-center text-goldink">
    {$t('pages.meSettings.title')}
  </h1>

  <div
    class="mb-6 flex items-center justify-between gap-3 flex-wrap rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40"
  >
    <div>
      <p class="font-medium text-goldink">{$t('pages.meSettings.onboarding')}</p>
      <p class="text-sm text-zinc-500">{$t('pages.meSettings.onboardingDesc')}</p>
    </div>
    <a
      href="/onboard"
      data-sveltekit-prefetch
      class="shrink-0 px-4 py-2 rounded-full bg-gradient-to-br from-barbi to-mpink text-gold font-bold hover:brightness-110"
    >
      {$t('pages.meSettings.onboarding')}
    </a>
  </div>

  <div
    class="mb-6 flex items-center justify-between gap-3 flex-wrap rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40"
  >
    <div class="min-w-0">
      <p class="font-medium text-goldink">🤖 {$t('mcp.banner.title')}</p>
      <p class="text-sm text-zinc-500">{$t('mcp.banner.desc')}</p>
    </div>
    <!-- `goldink`, not `gold`: the card sits on a white surface, where --gold
         renders at ~1.2:1 and is effectively invisible (see tailwind.config). -->
    <a
      href="/me/settings/mcp"
      data-sveltekit-prefetch
      class="shrink-0 px-4 py-2 rounded-full border border-goldink text-goldink font-bold hover:bg-goldink/10"
    >
      {$t('mcp.banner.cta')}
    </a>
  </div>

  <div
    class="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40"
  >
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="min-w-0">
        <p class="font-medium text-goldink flex items-center gap-2">
          <GithubIcon width={18} />
          {$t('rikmaCode.account.title')}
        </p>
        <p class="text-sm text-zinc-500 mt-1">{$t('rikmaCode.account.desc')}</p>
        {#if githubLogin}
          <p class="text-sm mt-1 font-medium">
            <bdi dir="ltr">{$t('rikmaCode.account.linkedAs', { login: githubLogin })}</bdi>
          </p>
        {/if}
      </div>
      {#if githubLogin}
        <button
          class="shrink-0 px-4 py-2 rounded-full border border-zinc-400 text-zinc-600 dark:text-zinc-300 font-bold hover:bg-zinc-500/10 disabled:opacity-50"
          onclick={unlinkGithub}
          disabled={unlinking}
        >
          {$t('rikmaCode.account.unlink')}
        </button>
      {:else}
        <a
          href={`${data.githubConnectBase ?? ''}/api/v1/github/connect?intent=link&return=${encodeURIComponent(page.url.origin)}`}
          data-sveltekit-reload
          class="shrink-0 px-4 py-2 rounded-full border border-goldink text-goldink font-bold hover:bg-goldink/10"
        >
          {$t('rikmaCode.account.link')}
        </a>
      {/if}
    </div>
    {#if githubNoticeText}
      <p class="text-sm mt-2 text-zinc-600 dark:text-zinc-300" role="status">{githubNoticeText}</p>
    {/if}
    {#if unlinkError}
      <p class="text-sm mt-2 text-red-600" role="alert">{unlinkError}</p>
    {/if}
  </div>

  <!-- Translation of what *other members* wrote (PLAN_UGC_TRANSLATION §4.4).
       Separate from the display-language picker inside <EditB> on purpose:
       that one chooses the language of the site's own chrome; this one only
       says what to do with text the platform did not write. Saved to
       localStorage for the first paint and mirrored to the profile on a
       debounce, so it follows the account to the next device. -->
  <div
    class="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40"
  >
    <p class="font-medium text-goldink">🌐 {$t('translated.pref.title')}</p>
    <p class="text-sm text-zinc-500 mt-1">{$t('translated.pref.desc')}</p>

    <div class="mt-3 flex flex-col gap-2">
      {#each AUTO_TRANSLATE_VALUES as value (value)}
        <label class="flex items-start gap-2 text-sm cursor-pointer">
          <input
            type="radio"
            name="autoTranslate"
            {value}
            checked={$autoTranslate === value}
            onchange={() => setAutoTranslate(value)}
            class="mt-1 shrink-0"
          />
          <span>{$t(`translated.pref.${value}`)}</span>
        </label>
      {/each}
    </div>

    <p class="text-xs text-zinc-400 mt-2">{$t('translated.pref.saved')}</p>
  </div>

  <!-- The reader's currency (PLAN_MULTI_CURRENCY D-C9). Everyone writes in their
       own currency; this only chooses what *this* reader sees amounts in. The
       cookie makes the next server render right, the account copy follows. -->
  <div
    class="mb-6 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40"
  >
    <p class="font-medium text-goldink">💱 {$t('money.pref.title')}</p>
    <p class="text-sm text-zinc-500 mt-1">{$t('money.pref.desc')}</p>
    <div class="mt-3 flex flex-wrap items-center gap-3">
      <CurrencyPicker
        id="display-currency"
        ariaLabel={$t('money.pref.title')}
        bind:value={currencyVal}
        onchange={(code) => setDisplayCurrency(money, code)}
      />
      <span class="text-sm text-zinc-500" dir="ltr">{formatMoney(100, 'ILS', money.lang)} = {money.fmt(100, 'ILS')}</span>
    </div>
    <p class="text-xs text-zinc-400 mt-2">
      {money.chosen ? $t('money.pref.saved') : $t('money.pref.guessed')}
    </p>
  </div>

  {#if meData}
    <EditB
      machshirs={meData?.machshirs.data}
      projectIds={meData.projects_1s.data.map((c) => c.id)}
      isGuidMe={!isG}
      onGuidMeChange={(value) => (isG = !value)}
      checked={cards}
      lango={$lang}
      location={locationVal}
      uid={data.uid}
      {fblink}
      {twiterlink}
      {noMail}
      {discordlink}
      {githublink}
      frd={meData.frd}
      {mail}
      un={meData.username}
      bi={meData.bio}
      {onMessage}
      {onGuid}
    />
  {/if}
</main>
