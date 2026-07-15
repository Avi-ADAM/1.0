<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import Panel from '$lib/components/Panel.svelte';
  import DonutChart from '$lib/components/deals/DonutChart.svelte';
  import MissionList from '$lib/components/deals/MissionList.svelte';
  import ResourcePanel from '$lib/components/deals/ResourcePanel.svelte';
  import CostPanel from '$lib/components/deals/CostPanel.svelte';
  import ApprovalPanel from '$lib/components/deals/ApprovalPanel.svelte';
  import DealTimeline from '$lib/components/deals/DealTimeline.svelte';
  import ForumPanel from '$lib/components/deals/ForumPanel.svelte';
  import PartiesPanel from '$lib/components/deals/PartiesPanel.svelte';
  import { saleToDealDetail } from '$lib/services/dealsService';

  let { data } = $props();

  const sale = $derived(data.sale);
  const kind = $derived(data.kind);
  const deal = $derived(sale && kind ? saleToDealDetail(sale, kind) : null);

  const pendingCost = $derived(
    deal ? deal.pendingApprovals.reduce((sum, a) => sum + a.cost, 0) : 0
  );

  const STATUS_LABEL: Record<string, string> = {
    active: 'בביצוע',
    pending: 'בתיאום',
    approval: 'ממתין לאישור',
    done: 'הושלם ✓'
  };

  let isProcessing = $state(false);

  async function handleApprove(approvalId: string) {
    if (!deal || isProcessing) return;
    isProcessing = true;

    try {
      let actionKey: string;
      let params: Record<string, unknown>;

      const sheirutId = deal.sheirutId;
      const projectId = String((deal as any).raw?.projectId ?? '');

      if (approvalId.startsWith('deliver-')) {
        actionKey = 'addVote';
        params = { type: 'weFinnish', id: sheirutId, projectId };
      } else if (approvalId.startsWith('recv-')) {
        actionKey = 'updateSheirut';
        params = { id: sheirutId, projectId, iGotIt: true };
      } else {
        return;
      }

      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionKey, params })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error?.message || 'Failed');

      toast.success('הפעולה בוצעה בהצלחה');
      await invalidateAll();
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בביצוע הפעולה');
    } finally {
      isProcessing = false;
    }
  }

  async function handleReject(_id: string) {
    toast.info('לפתיחת דיון, השתמש בצ׳אט עם הצד השני');
  }
</script>

<svelte:head>
  <title>{deal ? `${deal.product} · עסקאות` : 'עסקה'}</title>
</svelte:head>

<main class="page-wrap">
  <button class="back-btn anim" onclick={() => goto('/deals')}>
    ← חזרה לכל העסקאות
  </button>

  {#if !deal}
    <div class="state">
      <div class="missing">
        <div class="missing-title">העסקה לא נמצאה</div>
        <div class="missing-sub">ייתכן שהיא הושלמה או שאינה בהרשאתך.</div>
      </div>
    </div>
  {:else}
    <div class="hero anim anim-d1">
      <div class="hero-icon" style="background:{deal.iconBg}">{deal.icon}</div>
      <div class="hero-info">
        <h1 class="hero-product">{deal.product}</h1>
        <p class="hero-project">{deal.project} · {deal.category}</p>
        <div class="hero-badges">
          <span class="status-badge {deal.status}">{STATUS_LABEL[deal.status]}</span>
          <span class="chip">{kind === 'purchase' ? 'אתה הקונה' : 'אתה במכירה'}</span>
          {#if deal.startDate !== '—'}
            <span class="chip">התחיל {deal.startDate}</span>
          {/if}
          {#if deal.endDate !== '—'}
            <span class="chip">סיום: {deal.endDate}</span>
          {/if}
        </div>
      </div>
      <div class="hero-stats">
        <div class="hs">
          <div class="hs-v gold">₪ {deal.totalCost.toLocaleString()}</div>
          <div class="hs-l">עלות כוללת</div>
        </div>
        <div class="hs">
          <div class="hs-v" style="color:#4ade80">₪ {deal.paid.toLocaleString()}</div>
          <div class="hs-l">שולם</div>
        </div>
        <div class="hs">
          <div class="hs-v">{deal.progressPct}%</div>
          <div class="hs-l">התקדמות</div>
        </div>
        {#if deal.pendingApprovals.length > 0}
          <div class="hs">
            <div class="hs-v pink">{deal.pendingApprovals.length}</div>
            <div class="hs-l">לאישורך</div>
          </div>
        {/if}
      </div>
    </div>

    <div class="detail-grid">
      <div class="col-left">
        {#if deal.missions.total > 0}
          <div class="anim anim-d2">
            <Panel title="משימות" actionLabel="הצג הכל →">
              <DonutChart
                done={deal.missions.done}
                inProgress={deal.missions.inProgress}
                total={deal.missions.total}
                hoursDone={deal.hours.done}
                hoursTotal={deal.hours.total}
              />
              <MissionList missions={deal.missionList} />
            </Panel>
          </div>
        {/if}

        <div class="anim anim-d3">
          <ResourcePanel resources={deal.resourceList} />
        </div>

        <div class="anim anim-d4">
          <ForumPanel messages={deal.messages} />
        </div>
      </div>

      <div class="col-right">
        <div class="anim anim-d2">
          <CostPanel
            totalCost={deal.totalCost}
            paid={deal.paid}
            costBreakdown={deal.costBreakdown}
            {pendingCost}
          />
        </div>

        {#if deal.pendingApprovals.length > 0}
          <div class="anim anim-d3">
            <ApprovalPanel
              approvals={deal.pendingApprovals}
              onApprove={handleApprove}
              onReject={handleReject}
              {isProcessing}
            />
          </div>
        {/if}

        {#if deal.timeline.length > 0}
          <div class="anim anim-d4">
            <DealTimeline events={deal.timeline} />
          </div>
        {/if}

        <div class="anim anim-d5">
          <PartiesPanel parties={deal.parties} />
        </div>
      </div>
    </div>
  {/if}
</main>

<style>
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: var(--tm);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 28px;
    padding: 8px 14px;
    background: var(--s2);
    border: 1px solid var(--border);
    border-radius: 10px;
    transition: all 0.2s;
    font-family: 'Heebo', sans-serif;
  }
  .back-btn:hover { color: var(--gold-l); border-color: var(--border-g); }

  .hero {
    background: var(--s1);
    border: 1px solid var(--border-g);
    border-radius: var(--rl);
    padding: 32px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 28px;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(to bottom, var(--gold), var(--pink));
  }

  .hero-icon {
    width: 72px;
    height: 72px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    border: 1px solid var(--border-g);
    flex-shrink: 0;
  }

  .hero-info { flex: 1; min-width: 0; }
  .hero-product { font-size: 24px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
  .hero-project { font-size: 14px; color: var(--tm); margin-bottom: 10px; }
  .hero-badges  { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

  .status-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 4px 12px;
    border-radius: 20px;
  }
  .status-badge.active   { background: rgba(74,222,128,.1);  color: #4ade80;       border: 1px solid rgba(74,222,128,.25); }
  .status-badge.pending  { background: var(--gold-d);         color: var(--gold-l); border: 1px solid var(--border-g);      }
  .status-badge.approval { background: var(--pink-d);         color: var(--pink-l); border: 1px solid rgba(200,21,95,.3);   }
  .status-badge.done     { background: rgba(148,163,184,.1);  color: #94a3b8;       border: 1px solid rgba(148,163,184,.2); }
  .chip {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    background: var(--s3);
    color: var(--tm);
    border: 1px solid var(--border);
  }

  .hero-stats {
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
    flex-shrink: 0;
  }
  .hs { text-align: center; }
  .hs-v { font-size: 22px; font-weight: 800; color: var(--text); }
  .hs-v.gold { color: var(--gold-l); }
  .hs-v.pink { color: var(--pink-l); }
  .hs-l { font-size: 10px; color: var(--td); margin-top: 2px; font-weight: 600; letter-spacing: 0.5px; }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 20px;
  }
  .col-left, .col-right {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
  }

  .missing {
    text-align: center;
    background: var(--s2);
    border: 1px dashed var(--border);
    border-radius: 12px;
    padding: 40px 30px;
  }
  .missing-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 6px;
  }
  .missing-sub {
    font-size: 13px;
    color: var(--tm);
  }

  @media (max-width: 1000px) {
    .detail-grid { grid-template-columns: 1fr; }
    .hero { flex-direction: column; align-items: flex-start; }
    .hero-stats { flex-wrap: wrap; }
  }
</style>
