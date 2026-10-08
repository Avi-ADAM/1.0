<script lang="ts">
  import Money from '$lib/components/money/Money.svelte';
  import { goto, invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import Panel from '$lib/components/Panel.svelte';
  import DonutChart from '$lib/components/deals/DonutChart.svelte';
  import MissionList from '$lib/components/deals/MissionList.svelte';
  import ResourcePanel from '$lib/components/deals/ResourcePanel.svelte';
  import CostPanel from '$lib/components/deals/CostPanel.svelte';
  import DealDuePanel from '$lib/components/deals/DealDuePanel.svelte';
  import DealEditsPanel from '$lib/components/deals/DealEditsPanel.svelte';
  import DealOffersPanel from '$lib/components/deals/DealOffersPanel.svelte';
  import DealPartsPanel from '$lib/components/deals/DealPartsPanel.svelte';
  import type { DealCandidacyView } from '$lib/sheirut/dealOffers';
  import ApprovalPanel from '$lib/components/deals/ApprovalPanel.svelte';
  import DealTimeline from '$lib/components/deals/DealTimeline.svelte';
  import ForumPanel from '$lib/components/deals/ForumPanel.svelte';
  import PartiesPanel from '$lib/components/deals/PartiesPanel.svelte';
  import DealStages from '$lib/components/deals/DealStages.svelte';
  import CustomerPayment from '$lib/components/lev/cards/CustomerPayment.svelte';
  import { paymentState } from '$lib/sheirut/paymentState';
  import { saleToDealDetail } from '$lib/services/dealsService';
  import { missionsFromDue, missionCounts, workProgressPct } from '$lib/sheirut/dealProgress';
  import { displayHours } from '$lib/timers/precision';
  import { t } from '$lib/translations';

  let { data } = $props();

  const sale = $derived(data.sale);
  const kind = $derived(data.kind);
  const deal = $derived(sale && kind ? saleToDealDetail(sale, kind) : null);
  // A wish deal is billed by the hours its rikma approved, capped per part (C-14), and is
  // paid part by part as each provider confirms theirs (C-19) — every number on the page
  // reads `due` (`computeDealDue`), the same fact the status and the parts panel show.
  const due = $derived(data.due ?? null);
  const totalCost = $derived(due ? due.due : (deal?.totalCost ?? 0));
  const paid = $derived(due ? due.paid : (deal?.paid ?? 0));
  const costBreakdown = $derived(
    due
      ? {
          missions: due.lines.filter((l) => l.kind === 'mission').reduce((s, l) => s + l.due, 0),
          resources: due.lines.filter((l) => l.kind === 'resource').reduce((s, l) => s + l.due, 0)
        }
      : (deal?.costBreakdown ?? { missions: 0, resources: 0 })
  );

  // "Next payment" opens the lev purchase card's own flow (CustomerPayment) — on a copy
  // it may record the transfer on, refreshed whenever the page reloads the deal.
  let payDeal = $state<any>(null);
  $effect.pre(() => {
    payDeal = sale ? { ...sale } : null;
  });
  const pay = $derived(sale ? paymentState(sale, due, kind === 'purchase') : null);

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

  /** Run an action; the handler's own answer, or a thrown error with the server's words. */
  async function runAction(actionKey: string, params: Record<string, unknown>) {
    const res = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actionKey, params })
    });
    const out = await res.json();
    if (!out?.success) throw new Error(out?.error?.message || `${actionKey} failed`);
    return out.data;
  }

  /** The deal's own conversation: made on first use, then written to. */
  async function sendMessage(text: string) {
    if (!deal) throw new Error('no deal');
    const raw = ((deal as any).raw ?? {}) as { projectId?: unknown; forumId?: unknown };
    const projectId = String(raw.projectId ?? '');
    let forumId = Number(raw.forumId) > 0 ? String(raw.forumId) : null;
    if (!forumId) {
      const ensured = await runAction('ensureSheirutForum', { projectId, sheirutId: deal.sheirutId });
      forumId = ensured?.forumId ? String(ensured.forumId) : null;
    }
    if (!forumId) throw new Error('no forum');
    await runAction('createChatMessage', { forumId, message: text });
    await invalidateAll();
  }

  let forumPanel: ReturnType<typeof ForumPanel> | undefined = $state();

  /**
   * There is no flat "no" on this platform: someone who does not accept what is
   * put in front of them says what is wrong and the other side answers or
   * proposes another version (QA C-15). So "reject" opens the conversation — the
   * deal's chat, with somewhere to write — instead of pointing at a chat that had
   * none.
   */
  /* QA C-19 — the parts of the deal still open in its rikma: the customer signs each
   * candidacy (it is added to what she pays); and "paid" waits for every provider to
   * confirm receiving their part in full. */
  const offers = $derived(data.offers ?? null);

  // The work itself (QA C-21): a wish deal's parts are its due lines, and the
  // providers' own notes come with the page. Other deals keep what they had.
  const missionList = $derived(due ? missionsFromDue(due) : (deal?.missionList ?? []));
  const missions = $derived(due ? missionCounts(missionList) : (deal?.missions ?? { done: 0, inProgress: 0, total: 0 }));
  const hours = $derived(
    due
      ? {
          done: displayHours(missionList.reduce((s, m) => s + m.hoursDone, 0)),
          total: displayHours(missionList.reduce((s, m) => s + m.hours, 0))
        }
      : (deal?.hours ?? { done: 0, total: 0 })
  );
  const progressPct = $derived(
    (due && workProgressPct(missionList)) ?? deal?.progressPct ?? 0
  );
  const updates = $derived(data.updates ?? []);
  const fmtDay = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
  };
  const parts = $derived(data.parts ?? null);
  let signingId: string | null = $state(null);
  let confirmingPart = $state(false);

  async function signOffer(c: DealCandidacyView) {
    if (signingId) return;
    signingId = c.side + c.id;
    try {
      await runAction('signDealOffer', { side: c.side, id: c.id });
      toast.success($t('deals.offers.signedToast'));
      await invalidateAll();
    } catch (err) {
      console.error(err);
      toast.error($t('deals.offers.error'));
    } finally {
      signingId = null;
    }
  }

  async function confirmMyPart() {
    if (!deal || confirmingPart) return;
    confirmingPart = true;
    try {
      await runAction('confirmDealPartReceived', { sheirutId: deal.sheirutId });
      toast.success($t('deals.parts.confirmedToast'));
      await invalidateAll();
    } catch (err) {
      console.error(err);
      toast.error($t('deals.parts.error'));
    } finally {
      confirmingPart = false;
    }
  }

  /** C-14: requests for more hours on the deal's parts — the customer approves or counters. */
  const edits = $derived(data.edits ?? []);
  let editBusy = $state(false);

  async function signEdit(decisionId: string) {
    if (editBusy) return;
    editBusy = true;
    try {
      const out = await runAction('signDealEdit', { decisionId });
      toast.success(out?.consensus ? $t('deals.edit.appliedToast') : $t('deals.edit.signedToast'));
      await invalidateAll();
    } catch (err) {
      console.error(err);
      toast.error($t('deals.edit.error'));
    } finally {
      editBusy = false;
    }
  }

  async function counterEdit(decisionId: string, terms: { hours: number | null; rate: number | null; why: string }) {
    if (editBusy) return;
    editBusy = true;
    try {
      await runAction('counterDealEdit', { decisionId, ...terms });
      toast.success($t('deals.edit.counteredToast'));
      await invalidateAll();
    } catch (err) {
      console.error(err);
      toast.error($t('deals.edit.error'));
    } finally {
      editBusy = false;
    }
  }

  async function handleReject(_id: string) {
    toast.info($t('deals.rejectToChat'));
    forumPanel?.focus();
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
    <DealStages stages={data.stages ?? []} />
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
          <div class="hs-v gold"><Money amount={totalCost} /></div>
          <div class="hs-l">{due ? $t('deals.due.heroLabel') : 'עלות כוללת'}</div>
        </div>
        <div class="hs">
          <div class="hs-v" style="color:#4ade80"><Money amount={paid} /></div>
          <div class="hs-l">שולם</div>
        </div>
        <div class="hs">
          <div class="hs-v">{progressPct}%</div>
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
        {#if missions.total > 0}
          <div class="anim anim-d2">
            <Panel title={$t('deals.progress.missions')}>
              <DonutChart
                done={missions.done}
                inProgress={missions.inProgress}
                total={missions.total}
                hoursDone={hours.done}
                hoursTotal={hours.total}
              />
              <MissionList missions={missionList} />
            </Panel>
          </div>
        {/if}

        {#if updates.length > 0}
          <div class="anim anim-d2">
            <Panel title={$t('deals.progress.updates')}>
              <ul class="upd-list">
                {#each updates as u (u.id)}
                  <li class="upd">
                    <div class="upd-head">
                      <strong>{u.who}</strong>
                      {#if u.missionName}<span class="upd-mission">· {u.missionName}</span>{/if}
                      <span class="upd-when">{fmtDay(u.at)}</span>
                    </div>
                    <p class="upd-text">{u.text}</p>
                  </li>
                {/each}
              </ul>
            </Panel>
          </div>
        {/if}

        <div class="anim anim-d3">
          <ResourcePanel resources={deal.resourceList} />
        </div>

        <div class="anim anim-d4">
          <ForumPanel bind:this={forumPanel} messages={deal.messages} onSend={sendMessage} />
        </div>
      </div>

      <div class="col-right">
        {#if due}
          <div class="anim anim-d2">
            <DealDuePanel {due} />
          </div>
        {/if}

        {#if edits.length > 0}
          <div class="anim anim-d2">
            <DealEditsPanel
              {edits}
              isCustomer={kind === 'purchase'}
              busy={editBusy}
              onSign={signEdit}
              onCounter={counterEdit}
            />
          </div>
        {/if}

        {#if offers}
          <div class="anim anim-d2">
            <DealOffersPanel
              view={offers}
              isCustomer={kind === 'purchase'}
              busyId={signingId}
              onSign={signOffer}
              onTalk={() => forumPanel?.focus()}
            />
          </div>
        {/if}

        {#if parts}
          <div class="anim anim-d2">
            <DealPartsPanel {parts} viewerId={data.viewerId} busy={confirmingPart} onConfirm={confirmMyPart} />
          </div>
        {/if}

        <div class="anim anim-d2">
          <CostPanel
            {totalCost}
            {paid}
            {costBreakdown}
            {pendingCost}
            remaining={due ? due.remaining : null}
            inTransit={due ? due.inTransit : 0}
            {pay}
          >
            {#snippet payment()}
              {#if payDeal}<CustomerPayment
                buble={payDeal}
                {due}
                myId={data.viewerId}
                myName={data.viewerName}
                onAskChat={() => forumPanel?.focus()}
                onSent={() => invalidateAll()}
              />{/if}
            {/snippet}
          </CostPanel>
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
  .upd-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
  .upd { padding: 10px 12px; background: var(--s2); border: 1px solid var(--border); border-radius: 10px; }
  .upd-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; font-size: 12px; color: var(--gold-l); }
  .upd-mission { color: var(--gold); }
  .upd-when { margin-inline-start: auto; color: var(--gold); font-size: 11px; }
  .upd-text { margin: 6px 0 0; font-size: 13px; line-height: 1.5; color: var(--text, #f3efe6); white-space: pre-wrap; }

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
