<script>
  import { locale, isRtl } from '$lib/translations';
  /**
   * SplitsArchive — M5 comprehensive distribution archive (PLAN_SITE_SHARE_PER_MEMBER §6).
   *
   * The full "all splits" archive for a rikma's moach split screen:
   *   1. all-time per-member summary (how much each member got across every split),
   *   2. per-split list (each tosplit: who got how much — collapsible),
   *   3. the site-share archive (giving to the main rikma) — reused as-is via the
   *      existing SiteShareArchive component.
   *
   * Self-loading (like OpenSiteShareReminder). Per-member figures mirror the
   * haluka card exactly: מגיע (fair share) · בפועל (= מגיע + נתן − קיבל) · נותן ·
   * מקבל, plus the actual transfer list (who gave to whom) from the real halukas.
   */
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { executeAction } from '$lib/client/actionClient';
  import Lowding from '$lib/celim/lowding.svelte';
  import SiteShareArchive from './SiteShareArchive.svelte';

  let { projectId } = $props();

  let data = $state(null);
  let loading = $state(true);
  let expanded = $state({}); // splitId -> bool

  const i18n = {
    he: {
      summary: 'סיכום חלוקות לאורך זמן',
      totalDistributed: 'סך הכל חולק',
      splits: 'חלוקות',
      allSplits: 'כל החלוקות',
      whoGot: 'מי קיבל כמה',
      open: 'פתוחה',
      finished: 'הושלמה',
      transfers: 'העברות',
      giver: 'נותן',
      receiver: 'מקבל',
      due: 'מגיע',
      actual: 'בפועל',
      gave: 'נתן',
      got: 'קיבל',
      empty: 'עדיין לא היו חלוקות בריקמה.',
      anon: 'ללא שם',
      participated: 'חלוקות'
    },
    en: {
      summary: 'Distribution summary over time',
      totalDistributed: 'Total distributed',
      splits: 'splits',
      allSplits: 'All splits',
      whoGot: 'Who got how much',
      open: 'Open',
      finished: 'Done',
      transfers: 'transfers',
      giver: 'gives',
      receiver: 'gets',
      due: 'Due',
      actual: 'Actual',
      gave: 'gave',
      got: 'got',
      empty: 'No splits in the rikma yet.',
      anon: 'Unnamed',
      participated: 'splits'
    },
    ar: {
      summary: 'ملخّص التوزيعات عبر الزمن',
      totalDistributed: 'إجمالي الموزّع',
      splits: 'توزيعات',
      allSplits: 'كل التوزيعات',
      whoGot: 'من حصل وكم',
      open: 'مفتوحة',
      finished: 'مكتملة',
      transfers: 'تحويلات',
      giver: 'يُعطي',
      receiver: 'يستلم',
      due: 'مستحق',
      actual: 'فعلي',
      gave: 'أعطى',
      got: 'استلم',
      empty: 'لا توجد توزيعات في النسيج بعد.',
      anon: 'بدون اسم',
      participated: 'توزيعات'
    }
  };
  let t = $derived(i18n[$lang] || i18n.en);
  let isHe = $derived($locale === 'he');

  const fmt = (n) => `₪${(Number(n) || 0).toLocaleString()}`;
  const fmtDate = (s) => {
    if (!s) return '';
    try {
      return new Date(s).toLocaleDateString($lang === 'en' ? 'en-GB' : $lang, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '';
    }
  };

  let splits = $derived(data?.splits ?? []);
  let byMember = $derived(data?.byMember ?? []);
  let hasSplits = $derived(splits.length > 0);

  async function load() {
    if (!projectId) {
      loading = false;
      return;
    }
    try {
      const res = await executeAction('getRikmaSplitsArchive', { projectId: String(projectId) });
      if (res?.success) data = res.data ?? null;
    } catch (e) {
      console.error('[SplitsArchive] load failed:', e);
    } finally {
      loading = false;
    }
  }

  onMount(load);
</script>

{#if loading}
  <section class="bg-white p-6 rounded-xl shadow-sm">
    <div class="flex justify-center p-8"><Lowding /></div>
  </section>
{:else}
  {#if hasSplits}
    <!-- All-time per-member summary -->
    <section class="bg-white p-6 rounded-xl shadow-sm" dir={$isRtl ? 'rtl' : 'ltr'}>
      <h2 class="text-xl font-bold text-primary mb-3">{t.summary}</h2>
      <div class="sa-total">
        <span class="sa-total-label">{t.totalDistributed}</span>
        <span class="sa-total-value">{fmt(data.totalDistributed)}</span>
        <span class="sa-total-meta">{data.splitsCount} {t.splits}</span>
      </div>
      <ul class="sa-list mt-4">
        {#each byMember as m (m.userId)}
          <li class="sa-row">
            <span class="sa-who">
              {#if m.pic}<img src={m.pic} alt="" class="sa-pic" />{/if}
              <span>{m.username || t.anon}</span>
            </span>
            <span class="sa-amts">
              <b>{fmt(m.total)}</b>
              {#if m.given > 0}<span class="sa-neg">{t.gave} {fmt(m.given)}</span>{/if}
              {#if m.received > 0}<span class="sa-pos">{t.got} {fmt(m.received)}</span>{/if}
              <span class="sa-muted">{m.splitsCount} {t.participated}</span>
            </span>
          </li>
        {/each}
      </ul>
    </section>

    <!-- Per-split list -->
    <section class="bg-white p-6 rounded-xl shadow-sm" dir={$isRtl ? 'rtl' : 'ltr'}>
      <h2 class="text-xl font-bold text-primary mb-3">{t.allSplits}</h2>
      <div class="space-y-2">
        {#each splits as s (s.id)}
          <div class="sa-split">
            <button
              type="button"
              class="sa-split-head"
              onclick={() => (expanded = { ...expanded, [s.id]: !expanded[s.id] })}
            >
              <span class="sa-split-title">
                <span class="sa-chev" class:open={expanded[s.id]} aria-hidden="true">▾</span>
                <span class="sa-split-name">{s.name || `#${s.id}`}</span>
                <span class="sa-badge" class:done={s.finished}>
                  {s.finished ? t.finished : t.open}
                </span>
              </span>
              <span class="sa-split-meta">
                <b>{fmt(s.total)}</b>
                {#if s.createdAt}<span class="sa-muted">{fmtDate(s.createdAt)}</span>{/if}
              </span>
            </button>

            {#if expanded[s.id]}
              <ul class="sa-list sa-split-body">
                {#each s.allocations as a (a.userId + '-' + s.id)}
                  <li class="sa-alloc">
                    <div class="sa-alloc-head">
                      <span class="sa-who">
                        {#if a.pic}<img src={a.pic} alt="" class="sa-pic" />{/if}
                        <span>{a.username || t.anon}</span>
                        {#if a.isNoten}<span class="sa-tag">{t.giver}</span>
                        {:else if a.isMekabel}<span class="sa-tag get">{t.receiver}</span>{/if}
                      </span>
                      <span class="sa-figs">
                        <span class="sa-fig">
                          <span class="sa-fig-l">{t.due}</span>
                          <span>{fmt(a.amount)}</span>
                        </span>
                        <span class="sa-fig">
                          <span class="sa-fig-l">{t.actual}</span>
                          <b class="sa-fig-actual">{fmt(a.actual)}</b>
                        </span>
                        {#if a.noten > 0}
                          <span class="sa-fig">
                            <span class="sa-fig-l">{t.gave}</span>
                            <span class="sa-neg">{fmt(a.noten)}</span>
                          </span>
                        {/if}
                        {#if a.meca > 0}
                          <span class="sa-fig">
                            <span class="sa-fig-l">{t.got}</span>
                            <span class="sa-pos">{fmt(a.meca)}</span>
                          </span>
                        {/if}
                      </span>
                    </div>
                    {#if a.transfers.length > 0}
                      <div class="sa-xfers">
                        {#each a.transfers as x (x.toId + '-' + x.amount)}
                          <span class="sa-xfer">→ {x.toName}: <b>{fmt(x.amount)}</b></span>
                        {/each}
                      </div>
                    {/if}
                  </li>
                {/each}
              </ul>
              {#if s.transferCount > 0}
                <div class="sa-transfers">
                  {s.confirmedTransferCount}/{s.transferCount} {t.transfers}
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {:else if data}
    <section class="bg-white p-6 rounded-xl shadow-sm">
      <p class="text-sm text-gray-400">{t.empty}</p>
    </section>
  {/if}

  <!-- Site-share archive (giving to the main rikma) -->
  <section class="bg-white p-6 rounded-xl shadow-sm">
    <SiteShareArchive {projectId} />
  </section>
{/if}

<style>
  .sa-total {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex-wrap: wrap;
  }
  .sa-total-label {
    font-weight: 700;
    color: #8a6d00;
  }
  .sa-total-value {
    font-size: 1.6rem;
    font-weight: 900;
    color: #8a6d00;
  }
  .sa-total-meta {
    font-size: 0.85rem;
    color: #9ca3af;
  }
  .sa-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sa-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    background: #f9fafb;
    border-radius: 8px;
  }
  .sa-who {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .sa-who > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sa-pic {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  .sa-amts {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .sa-muted {
    color: #9ca3af;
    font-size: 0.85rem;
  }
  .sa-split {
    border: 1px solid #eee;
    border-radius: 10px;
    overflow: hidden;
  }
  .sa-split-head {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    background: #fff;
    border: none;
    cursor: pointer;
    text-align: inherit;
  }
  .sa-split-title {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .sa-split-name {
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sa-chev {
    transition: transform 0.2s ease;
    color: #9ca3af;
  }
  .sa-chev.open {
    transform: rotate(180deg);
  }
  .sa-split-meta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .sa-badge {
    font-size: 0.7rem;
    padding: 2px 8px;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
    font-weight: 700;
  }
  .sa-badge.done {
    background: #dcfce7;
    color: #166534;
  }
  .sa-split-body {
    padding: 0 12px 10px;
  }
  .sa-alloc {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 12px;
    background: #f9fafb;
    border-radius: 8px;
  }
  .sa-alloc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .sa-figs {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    white-space: nowrap;
    flex-wrap: wrap;
  }
  .sa-fig {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.1;
  }
  .sa-fig-l {
    font-size: 0.65rem;
    color: #9ca3af;
  }
  .sa-fig-actual {
    color: #166534;
  }
  .sa-neg {
    color: #b91c1c;
    font-size: 0.85rem;
  }
  .sa-pos {
    color: #166534;
    font-size: 0.85rem;
  }
  .sa-xfers {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .sa-xfer {
    font-size: 0.72rem;
    padding: 2px 8px;
    border-radius: 6px;
    background: #eff6ff;
    color: #1e40af;
  }
  .sa-tag {
    font-size: 0.65rem;
    padding: 1px 6px;
    border-radius: 999px;
    background: #fee2e2;
    color: #991b1b;
    font-weight: 700;
  }
  .sa-tag.get {
    background: #dcfce7;
    color: #166534;
  }
  .sa-transfers {
    padding: 0 14px 10px;
    font-size: 0.8rem;
    color: #9ca3af;
  }
</style>
