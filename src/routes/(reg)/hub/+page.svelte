<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import KpiBar from '$lib/components/hub/KpiBar.svelte';
  import UrgentVotePill from '$lib/components/hub/UrgentVotePill.svelte';
  import KindShortcut from '$lib/components/hub/KindShortcut.svelte';
  import CustomPurchaseCta from '$lib/components/hub/CustomPurchaseCta.svelte';
  import ActionFeed from '$lib/components/hub/ActionFeed.svelte';
  import HubSkeleton from '$lib/components/hub/HubSkeleton.svelte';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();

  const t = {
    he: {
      shortcuts: 'קיצורי דרך',
      missions: 'משימות בתהליך',
      rikma: 'ריקמות',
      inbound: 'כניסות',
      feed: 'פעילות אחרונה'
    },
    en: {
      shortcuts: 'Shortcuts',
      missions: 'Active missions',
      rikma: 'Connections',
      inbound: 'Inbound',
      feed: 'Recent activity'
    }
  };

  let labels = $derived(t[$lang as keyof typeof t] ?? t.he);

  const shortcuts = $derived([
    { icon: '🧩', label: labels.missions,  href: '/kind/mission',    badge: 0 },
    { icon: '🤝', label: labels.rikma,     href: '/kind/rikma',      badge: 0 },
    { icon: '📨', label: labels.inbound,   href: '/kind/suggestion', badge: 0 }
  ]);
</script>

<svelte:head>
  <title>Hub</title>
</svelte:head>

{#await data.streamed.summary}
  <HubSkeleton />
{:then summary}
  <div dir="rtl" class="min-h-screen bg-bluesun text-white font-rubik">

    <!-- Sticky KPI bar -->
    <KpiBar
      votes={summary.kpi.votes}
      urgent={summary.kpi.urgent}
      suggestions={summary.kpi.suggestions}
      activePurchases={summary.kpi.activePurchases}
      activeSales={summary.kpi.activeSales}
    />

    <div class="max-w-lg mx-auto px-4 pt-4 pb-24 space-y-4">

      <!-- Urgent vote alert -->
      {#if summary.kpi.urgent > 0}
        <UrgentVotePill count={summary.kpi.urgent} />
      {/if}

      <!-- Custom purchase CTA -->
      <CustomPurchaseCta />

      <!-- Kind shortcuts -->
      <section>
        <h2 class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
          {labels.shortcuts}
        </h2>
        <div class="flex gap-3 flex-wrap">
          {#each shortcuts as s (s.href)}
            <KindShortcut icon={s.icon} label={s.label} href={s.href} badge={s.badge} />
          {/each}
        </div>
      </section>

      <!-- Action feed -->
      <section>
        <h2 class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-1">
          {labels.feed}
        </h2>
        <ActionFeed items={summary.topFive} />
      </section>

    </div>
  </div>
{:catch err}
  <p class="text-red-400 text-center p-8" dir="rtl">שגיאה בטעינת הדף: {err.message}</p>
{/await}
