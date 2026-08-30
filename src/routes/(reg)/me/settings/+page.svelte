<script>
  import { lang, langUs, doesLang } from '$lib/stores/lang.js';
  import { isRtl, locale, t } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { executeAction } from '$lib/client/actionClient';
  import EditB from '$lib/components/userPr/editBasic.svelte';
  let { data } = $props();

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
  <a href="/me" data-sveltekit-prefetch class="text-sm text-gold hover:underline"
    >{$t('pages.meSettings.back')}</a
  >

  <h1 class="text-2xl font-bold mt-4 mb-6 text-center text-gold">
    {$t('pages.meSettings.title')}
  </h1>

  <div
    class="mb-6 flex items-center justify-between gap-3 flex-wrap rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40"
  >
    <div>
      <p class="font-medium text-gold">{$t('pages.meSettings.onboarding')}</p>
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
