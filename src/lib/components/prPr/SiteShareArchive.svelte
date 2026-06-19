<script>
  import { locale, isRtl } from '$lib/translations';
  /**
   * SiteShareArchive — M5 (PLAN_SITE_SHARE_PER_MEMBER §6).
   *
   * Standing site-share archive for the moach split screen. Self-loading (like
   * OpenSiteShareReminder, independent of the moach store / arr pipeline). The
   * SAME component serves both sides; the action decides which by comparing the
   * project to the platform:
   *   - platform / main rikma → receiving archive (total in, who received how much,
   *     per source rikma);
   *   - any regular rikma → giving archive (what this rikma gave to 1💗1, per member).
   * Two values everywhere: committed (the obligation) vs received (settled transfer).
   * Renders nothing when there's no site-share data for the project.
   */
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { executeAction } from '$lib/client/actionClient';
  import Lowding from '$lib/celim/lowding.svelte';

  let { projectId } = $props();

  let data = $state(null);
  let loading = $state(true);

  const i18n = {
    he: {
      titleIn: 'ארכיון חלק האתר — שהתקבל',
      titleOut: 'ארכיון חלק האתר — מה נתנו ל‑1💗1',
      totalIn: 'סך הכל נכנס',
      totalOut: 'סך הכל נתנו',
      committed: 'התחייבו',
      received: 'התקבל',
      whoReceived: 'מי קיבל כמה',
      bySource: 'לפי ריקמה נותנת',
      whoGave: 'מי נתן כמה',
      inTransit: 'בדרך',
      empty: 'עדיין אין נתינות חלק‑אתר לרשום כאן.',
      anon: 'ללא שם'
    },
    en: {
      titleIn: 'Site-share archive — received',
      titleOut: 'Site-share archive — what we gave to 1💗1',
      totalIn: 'Total received',
      totalOut: 'Total given',
      committed: 'Committed',
      received: 'Received',
      whoReceived: 'Who received how much',
      bySource: 'By giving rikma',
      whoGave: 'Who gave how much',
      inTransit: 'in transit',
      empty: 'No site-share giving to show here yet.',
      anon: 'Unnamed'
    },
    ar: {
      titleIn: 'أرشيف حصة الموقع — المُستلَم',
      titleOut: 'أرشيف حصة الموقع — ما قدّمناه لـ1💗1',
      totalIn: 'إجمالي المُستلَم',
      totalOut: 'إجمالي المُعطى',
      committed: 'مُلتزَم',
      received: 'مُستلَم',
      whoReceived: 'من استلم وكم',
      bySource: 'حسب النسيج المُعطي',
      whoGave: 'من أعطى وكم',
      inTransit: 'قيد التحويل',
      empty: 'لا توجد بعد مساهمات حصة الموقع لعرضها هنا.',
      anon: 'بدون اسم'
    }
  };
  let t = $derived(i18n[$lang] || i18n.en);
  let isHe = $derived($locale === 'he');

  let isPlatform = $derived(!!data?.isPlatformView);
  let hasData = $derived(
    !!data && ((Number(data.totalCommitted) || 0) > 0 || (Number(data.totalReceived) || 0) > 0)
  );

  const fmt = (n) => `₪${(Number(n) || 0).toLocaleString()}`;

  async function load() {
    if (!projectId) {
      loading = false;
      return;
    }
    try {
      const res = await executeAction('getSiteShareArchive', { projectId: String(projectId) });
      if (res?.success) data = res.data ?? null;
    } catch (e) {
      console.error('[SiteShare] archive load failed:', e);
    } finally {
      loading = false;
    }
  }

  onMount(load);
</script>

{#if loading}
  <div class="flex justify-center p-8"><Lowding /></div>
{:else if hasData}
  <div dir={$isRtl ? 'rtl' : 'ltr'} class="space-y-6">
    <h2 class="text-xl font-bold text-primary">
      {isPlatform ? t.titleIn : t.titleOut}
    </h2>

    <!-- Headline totals -->
    <div class="ssa-total">
      <div class="ssa-total-main">
        <span class="ssa-total-label">{isPlatform ? t.totalIn : t.totalOut}</span>
        <span class="ssa-total-value">{fmt(data.totalReceived)}</span>
      </div>
      <div class="ssa-total-sub">
        {t.committed}: <b>{fmt(data.totalCommitted)}</b> · {t.received}: <b>{fmt(data.totalReceived)}</b>
      </div>
    </div>

    {#if isPlatform}
      <!-- Who received how much -->
      {#if data.byReceiver?.length}
        <section>
          <h3 class="ssa-h3">{t.whoReceived}</h3>
          <ul class="ssa-list">
            {#each data.byReceiver as r (r.userId)}
              <li class="ssa-row">
                <span class="ssa-who">
                  {#if r.pic}<img src={r.pic} alt="" class="ssa-pic" />{/if}
                  <span>{r.username || t.anon}</span>
                </span>
                <span class="ssa-amts">
                  <b>{fmt(r.received)}</b>
                  {#if r.inTransit > 0}<span class="ssa-chip">{t.inTransit} {fmt(r.inTransit)}</span>{/if}
                </span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <!-- Per source rikma -->
      {#if data.bySourceRikma?.length}
        <section>
          <h3 class="ssa-h3">{t.bySource}</h3>
          <ul class="ssa-list">
            {#each data.bySourceRikma as rk (rk.rikmaId ?? rk.rikmaName)}
              <li class="ssa-row">
                <span class="ssa-who">
                  {#if rk.pic}<img src={rk.pic} alt="" class="ssa-pic" />{/if}
                  <span>{rk.rikmaName || t.anon}</span>
                </span>
                <span class="ssa-amts">
                  <b>{fmt(rk.received)}</b>
                  <span class="ssa-muted">/ {fmt(rk.committed)}</span>
                </span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    {:else if data.byMember?.length}
      <!-- Giving view — who gave how much -->
      <section>
        <h3 class="ssa-h3">{t.whoGave}</h3>
        <ul class="ssa-list">
          {#each data.byMember as m (m.userId)}
            <li class="ssa-row">
              <span class="ssa-who">
                {#if m.pic}<img src={m.pic} alt="" class="ssa-pic" />{/if}
                <span>{m.username || t.anon}</span>
              </span>
              <span class="ssa-amts">
                <b>{fmt(m.received)}</b>
                <span class="ssa-muted">/ {fmt(m.committed)}</span>
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
{:else if data}
  <p class="text-sm text-gray-400">{t.empty}</p>
{/if}

<style>
  .ssa-total {
    border: 1px solid var(--gold, #c9a227);
    border-radius: 14px;
    padding: 16px 20px;
    background: rgba(201, 162, 39, 0.06);
  }
  .ssa-total-main {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .ssa-total-label {
    font-weight: 700;
    color: #8a6d00;
  }
  .ssa-total-value {
    font-size: 1.8rem;
    font-weight: 900;
    color: #8a6d00;
  }
  .ssa-total-sub {
    margin-top: 6px;
    font-size: 0.85rem;
    opacity: 0.8;
  }
  .ssa-h3 {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #eee;
  }
  .ssa-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ssa-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    background: #f9fafb;
    border-radius: 8px;
  }
  .ssa-who {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .ssa-who span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ssa-pic {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .ssa-amts {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .ssa-muted {
    color: #9ca3af;
    font-size: 0.85rem;
  }
  .ssa-chip {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(201, 162, 39, 0.15);
    color: #8a6d00;
    font-weight: 700;
  }
</style>
