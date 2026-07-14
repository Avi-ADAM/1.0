<script>
  import { lang } from '$lib/stores/lang.js';
  import { isRtl } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { executeAction } from '$lib/client/actionClient';
  import EditB from '$lib/components/userPr/editBasic.svelte';
  let { data } = $props();

  let meData = $state(data.meData);
  let mail = $state(data.meData?.email);
  let lango = $state(data.meData?.lang || 'he');
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
      noMail
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
    sendD();
  }

  // The guided tour walks elements that only exist on /me itself, so
  // resuming it means navigating back there and letting it kick off.
  function onGuid() {
    goto('/me?tour=1');
  }

  const t = {
    he: {
      title: 'הגדרות',
      back: '← חזרה לפרופיל',
      onboarding: 'פתיחת מדריך ההצטרפות',
      onboardingDesc: 'לעבור שוב על תהליך ההצטרפות וההכרות עם 1💗1'
    },
    en: {
      title: 'Settings',
      back: '← Back to profile',
      onboarding: 'Open onboarding',
      onboardingDesc: 'Go through the 1💗1 onboarding flow again'
    }
  };
  const tr = $derived(t[$lang] ?? t.he);
</script>

<svelte:head>
  <title>{tr.title} · 1💗1</title>
</svelte:head>

<main
  class="min-h-screen w-full mx-auto max-w-3xl p-4 md:p-8"
  dir={$isRtl ? 'rtl' : 'ltr'}
>
  <a href="/me" data-sveltekit-prefetch class="text-sm text-gold hover:underline"
    >{tr.back}</a
  >

  <h1 class="text-2xl font-bold mt-4 mb-6 text-center text-gold">
    {tr.title}
  </h1>

  <div
    class="mb-6 flex items-center justify-between gap-3 flex-wrap rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 bg-white/60 dark:bg-zinc-900/40"
  >
    <div>
      <p class="font-medium text-gold">{tr.onboarding}</p>
      <p class="text-sm text-zinc-500">{tr.onboardingDesc}</p>
    </div>
    <a
      href="/onboard"
      data-sveltekit-prefetch
      class="shrink-0 px-4 py-2 rounded-full bg-gradient-to-br from-barbi to-mpink text-gold font-bold hover:brightness-110"
    >
      {tr.onboarding}
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
