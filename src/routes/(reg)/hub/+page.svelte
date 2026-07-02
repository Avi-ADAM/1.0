<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import KpiBar from '$lib/components/hub/KpiBar.svelte';
  import HubHeader from '$lib/components/hub/HubHeader.svelte';
  import UrgentVotePill from '$lib/components/hub/UrgentVotePill.svelte';
  import KindShortcut from '$lib/components/hub/KindShortcut.svelte';
  import CustomPurchaseCta from '$lib/components/hub/CustomPurchaseCta.svelte';
  import ActionFeed from '$lib/components/hub/ActionFeed.svelte';
  import HubSkeleton from '$lib/components/hub/HubSkeleton.svelte';
  import FirstSteps from '$lib/components/hub/FirstSteps.svelte';

  /** @type {{ data: import('./$types').PageData }} */
  let { data } = $props();

  const t = {
    he: { shortcuts: 'קיצורי דרך', lev: 'הלב', moach: 'מוח', me: 'הפרופיל שלי', feed: 'ממתין לטיפולך' },
    en: { shortcuts: 'Shortcuts', lev: 'The Heart', moach: 'Brain', me: 'My profile', feed: 'Waiting for you' },
    ar: { shortcuts: 'اختصارات', lev: 'القلب', moach: 'العقل', me: 'ملفي', feed: 'بانتظارك' },
    ru: { shortcuts: 'Ярлыки', lev: 'Сердце', moach: 'Мозг', me: 'Мой профиль', feed: 'Ждут вас' }
  };

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
  const feedTypeLabels: Record<string, Record<string, string>> = {
    pends: { he: 'מועמדות למשימה', en: 'Mission application', ar: 'ترشح لمهمة', ru: 'Заявка на миссию' },
    fiapp: { he: 'אישור סיום', en: 'Completion approval', ar: 'اعتماد إنجاز', ru: 'Подтверждение завершения' },
    askedm: { he: 'בקשת משאב', en: 'Resource request', ar: 'طلب مورد', ru: 'Запрос ресурса' },
    wegets: { he: 'אישור משאב', en: 'Resource approval', ar: 'اعتماد مورد', ru: 'Одобрение ресурса' },
    hachla: { he: 'החלטת פרויקט', en: 'Project decision', ar: 'قرار مشروع', ru: 'Решение проекта' },
    haluk: { he: 'הצעת חלוקה', en: 'Split proposal', ar: 'اقتراح توزيع', ru: 'Предложение о разделе' },
    sheirutp: { he: 'בקשת רכישה', en: 'Purchase request', ar: 'طلب شراء', ru: 'Запрос на покупку' }
  };

  let labels = $derived(t[$lang as keyof typeof t] ?? t.he);
  let dir = $derived(($lang === 'he' || $lang === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr');

  function toFeedItems(topFive: any[]) {
    return topFive.map((f: any) => {
      const typeLabel = feedTypeLabels[f.type]?.[$lang] ?? feedTypeLabels[f.type]?.he ?? '';
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
    { icon: '💗', label: labels.lev,   href: '/lev',   badge: 0 },
    { icon: '🧠', label: labels.moach, href: '/moach', badge: 0 },
    { icon: '👤', label: labels.me,    href: '/me',    badge: 0 }
  ]);
</script>

<svelte:head>
  <title>Hub</title>
</svelte:head>

<div {dir} class="hub-shell relative min-h-[100dvh] bg-bluesun text-white font-rubik overflow-hidden">
  <!-- Atmospheric gold glow anchored to the header -->
  <div class="glow pointer-events-none absolute inset-x-0 top-0 h-72" aria-hidden="true"></div>

  <main
    class="relative mx-auto w-full max-w-md px-4 space-y-5
           pt-[calc(env(safe-area-inset-top)+1.5rem)]
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

      <HubHeader username={summary.username} profilePic={summary.profilePic} />

      {#if isNewUser}
        <div class="stagger" style="--i:1">
          <FirstSteps username={summary.username} />
        </div>
      {:else}
        {#if summary.kpi.urgent > 0}
          <div class="stagger" style="--i:1">
            <UrgentVotePill count={summary.kpi.urgent} href="/lev?focus=votes" />
          </div>
        {/if}

        <div class="stagger" style="--i:2">
          <KpiBar
            votes={summary.kpi.votes}
            urgent={summary.kpi.urgent}
            suggestions={summary.kpi.suggestions}
            activePurchases={summary.kpi.activePurchases}
            activeSales={summary.kpi.activeSales}
          />
        </div>

        <div class="stagger" style="--i:3">
          <CustomPurchaseCta />
        </div>

        <section class="stagger" style="--i:4">
          <h2 class="section-title">{labels.shortcuts}</h2>
          <div class="flex gap-3">
            {#each shortcuts as s (s.href)}
              <KindShortcut icon={s.icon} label={s.label} href={s.href} badge={s.badge} />
            {/each}
          </div>
        </section>

        {#if summary.topFive.length > 0}
          <section class="stagger" style="--i:5">
            <h2 class="section-title">{labels.feed}</h2>
            <ActionFeed items={toFeedItems(summary.topFive)} />
          </section>
        {/if}
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
