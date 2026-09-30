<script lang="ts">
  import { projectsStore } from '$lib/stores/levStores';
  import { provideProjectCurrencies } from '$lib/money/context.svelte';
  import { t } from '$lib/translations';
  import { onMount } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import KpiBar from '$lib/components/hub/KpiBar.svelte';
  import HubHeader from '$lib/components/hub/HubHeader.svelte';
  import UrgentVotePill from '$lib/components/hub/UrgentVotePill.svelte';
  import KindShortcut from '$lib/components/hub/KindShortcut.svelte';
  import CustomPurchaseCta from '$lib/components/hub/CustomPurchaseCta.svelte';
  import DemandMapTeaser from '$lib/components/hub/DemandMapTeaser.svelte';
  import ActionFeed from '$lib/components/hub/ActionFeed.svelte';
  import HubSkeleton from '$lib/components/hub/HubSkeleton.svelte';
  import FirstSteps from '$lib/components/hub/FirstSteps.svelte';
  import DailyBrief from '$lib/components/hub/DailyBrief.svelte';

  // The heart shows cards from every rikma the member belongs to, each keeping
  // its books in its own currency (PLAN_MULTI_CURRENCY). One lookup for all of
  // them; a card passes its own projectId to <Money>.
  provideProjectCurrencies((pid) =>
    $projectsStore.find((p) => String(p.id) === String(pid))?.attributes?.currencyCode ?? null
  );

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();

  // Feed item type (= lev `ani` value) → icon + localized label.
  // The type doubles as the ?focus= param for the quantum deep-link.
  const feedIcons: Record<string, string> = {
    pends: '🤝',
    fiapp: '✅',
    askedm: '📦',
    wegets: '🔧',
    hachla: '⚖️',
    haluk: '💸',
    sheirutp: '🛍️'
  };

  let dir = $derived(($lang === 'he' || $lang === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr');

  // On a desktop the single phone column left most of the screen empty. From
  // lg up the hub splits: what's on the member's table (status) in the main
  // column, where to go next (actions) in a sticky side column. Below lg the
  // order is the phone's, unchanged.
  const wide = new MediaQuery('min-width: 1024px', false);

  function toFeedItems(topFive: any[]) {
    return topFive.map((f: any) => {
      const typeLabel = f.type ? $t(`common.feedTypes.${f.type}`) : '';
      return {
        id: `${f.type}-${f.id}`,
        type: f.type,
        title: f.title || typeLabel,
        subtitle: f.title && typeLabel ? `${typeLabel} · ${f.projectName}` : f.projectName,
        icon: feedIcons[f.type] ?? '🗳️',
        href: `/lev?focus=${f.type}&project=${f.projectId}`,
        urgent: f.urgent
      };
    });
  }

  const shortcuts = $derived([
    { icon: '💗', label: $t('hub.nav.lev'),   href: '/lev',   badge: 0 },
    { icon: '🧠', label: $t('hub.nav.moach'), href: '/moach', badge: 0 },
    { icon: '👤', label: $t('hub.nav.me'),    href: '/me',    badge: 0 }
  ]);

  onMount(() => {
    // Warm the lev stores while the user reads the hub — /lev is the main
    // destination from here and its full query takes a long time cold.
    // Deferred to idle time so it never competes with the hub's own streamed
    // load, and dynamically imported so the lev data pipeline stays out of
    // the hub bundle. initializeLevData dedupes against the lev page's own
    // load, so navigating mid-prefetch never doubles query 83.
    const schedule = (cb: () => void) =>
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(cb, { timeout: 4000 })
        : window.setTimeout(cb, 1500);

    schedule(async () => {
      if (!page.data.uid) return;
      try {
        const [{ initializeLevData }, { dataMode }, { get }] = await Promise.all([
          import('$lib/utils/levDataLoader'),
          import('$lib/stores/levStores'),
          import('svelte/store')
        ]);
        if (get(dataMode) === 'full') return; // already warm from an earlier visit
        await initializeLevData(page.data.uid, '', page.data.lang ?? 'he');
      } catch (e) {
        console.warn('[hub] lev prefetch failed:', e?.message);
      }
    });
  });
</script>

<svelte:head>
  <title>Hub</title>
</svelte:head>

<div {dir} class="hub-shell relative min-h-[100dvh] bg-bluesun text-white font-rubik overflow-hidden">
  <!-- Atmospheric gold glow anchored to the header -->
  <div class="glow pointer-events-none absolute inset-x-0 top-0 h-72" aria-hidden="true"></div>

  <main
    class="relative mx-auto w-full max-w-md lg:max-w-6xl px-4 lg:px-10 space-y-5 lg:space-y-7
           pt-[calc(env(safe-area-inset-top)+1.5rem)] lg:pt-10
           pb-[calc(env(safe-area-inset-bottom)+6rem)]"
  >
    {#await data.streamed.summary}
      <HubSkeleton />
    {:then summary}
      {@const isNewUser =
        summary.kpi.votes +
          summary.kpi.urgent +
          summary.kpi.suggestions +
          summary.kpi.activePurchases +
          summary.kpi.activeSales ===
          0 && summary.topFive.length === 0}

      {#snippet firstSteps()}
        <div class="stagger" style="--i:1">
          <FirstSteps username={summary.username} />
        </div>
      {/snippet}

      {#snippet urgent()}
        {#if summary.kpi.urgent > 0}
          <div class="stagger" style="--i:1">
            <UrgentVotePill count={summary.kpi.urgent} href="/lev?focus=votes" />
          </div>
        {/if}
      {/snippet}

      {#snippet kpi()}
        <div class="stagger" style="--i:2">
          <KpiBar
            votes={summary.kpi.votes}
            urgent={summary.kpi.urgent}
            suggestions={summary.kpi.suggestions}
            activePurchases={summary.kpi.activePurchases}
            activeSales={summary.kpi.activeSales}
          />
        </div>
      {/snippet}

      <!-- The daily brief (PLAN_DAILY_DIGEST): the same payload the morning
           digest is composed from. Streams in after the summary. -->
      {#snippet dailyBrief(i: number)}
        {#await data.streamed.brief then brief}
          {#if brief}
            <div class="stagger" style="--i:{i}">
              <DailyBrief payload={brief.payload} failed={brief.failed} />
            </div>
          {/if}
        {/await}
      {/snippet}

      {#snippet cta()}
        <div class="stagger" style="--i:3">
          <CustomPurchaseCta />
        </div>
      {/snippet}

      <!-- The public demand map is the recruitment engine — a new user sees
           what the community seeks and offers right now -->
      {#snippet demandMap(i: number)}
        {#await data.streamed.demand then demand}
          <div class="stagger" style="--i:{i}">
            <DemandMapTeaser {demand} />
          </div>
        {/await}
      {/snippet}

      {#snippet shortcutRow()}
        <section class="stagger" style="--i:4">
          <h2 class="section-title">{$t('hub.nav.shortcuts')}</h2>
          <div class="flex gap-3">
            {#each shortcuts as s (s.href)}
              <KindShortcut icon={s.icon} label={s.label} href={s.href} badge={s.badge} />
            {/each}
          </div>
        </section>
      {/snippet}

      {#snippet feed()}
        {#if summary.topFive.length > 0}
          <section class="stagger" style="--i:5">
            <h2 class="section-title">{$t('hub.nav.feed')}</h2>
            <ActionFeed items={toFeedItems(summary.topFive)} />
          </section>
        {/if}
      {/snippet}

      <HubHeader username={summary.username} profilePic={summary.profilePic} />

      {#if wide.current}
        <div class="hub-cols">
          <div class="space-y-6 min-w-0">
            {#if isNewUser}
              {@render firstSteps()}
            {:else}
              {@render urgent()}
              {@render kpi()}
              {@render dailyBrief(3)}
              {@render feed()}
            {/if}
          </div>
          <aside class="hub-side space-y-6 min-w-0">
            {#if isNewUser}
              {@render dailyBrief(2)}
            {:else}
              {@render cta()}
            {/if}
            {@render demandMap(isNewUser ? 2 : 4)}
            {#if !isNewUser}
              {@render shortcutRow()}
            {/if}
          </aside>
        </div>
      {:else if isNewUser}
        {@render firstSteps()}
        <!-- No votes yet does not mean nothing to say: suggestions and
             what's new can already be waiting -->
        {@render dailyBrief(2)}
        {@render demandMap(2)}
      {:else}
        {@render urgent()}
        {@render kpi()}
        {@render dailyBrief(3)}
        {@render cta()}
        {@render demandMap(4)}
        {@render shortcutRow()}
        {@render feed()}
      {/if}
    {:catch err}
      <p class="text-red-400 text-center p-8">שגיאה בטעינת הדף: {err.message}</p>
    {/await}
  </main>
</div>

<style>
  /* Soft radial gold haze behind the greeting — gives the dark canvas depth */
  .glow {
    background: radial-gradient(
      120% 80% at 50% 0%,
      rgba(179, 135, 40, 0.22) 0%,
      rgba(179, 135, 40, 0.06) 38%,
      transparent 70%
    );
  }

  /* Desktop: status column + a narrower sticky actions column */
  .hub-cols {
    display: grid;
    grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
    gap: 2rem;
    align-items: start;
  }
  .hub-side {
    position: sticky;
    top: 1.5rem;
  }

  .section-title {
    margin: 0 0 0.5rem;
    padding-inline: 0.25rem;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.4);
  }

  /* Staggered entrance — each section eases up in sequence on load */
  .stagger {
    animation: rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
    animation-delay: calc(var(--i, 0) * 70ms);
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .stagger {
      animation: none;
    }
  }
</style>
