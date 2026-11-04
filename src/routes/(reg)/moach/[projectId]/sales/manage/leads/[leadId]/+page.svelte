<script lang="ts">
  /**
   * One lead (docs/inprogress/PLAN_LEADS.md §4.2): who they are, how to reach
   * them, what they asked, and everything that happened since — then the one
   * step forward. There is no "became a customer" button: that follows from
   * money (a paid order or a reported sale), so success cannot be typed in.
   */
  import { page } from '$app/state';
  import { goto, invalidate } from '$app/navigation';
  import { CONTACTS_EXPORTED, mergeNoteOf } from '$lib/leads/merge';
  import { t, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { shopOrdersKey } from '$lib/shop/keys.js';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { stageOf } from '$lib/leads/stage';
  import { attentionReason } from '$lib/leads/attention';
  import { DEFAULT_LEAD_SETTINGS } from '$lib/leads/settings';
  import { checkManualTransition, type ManualActivityKind } from '$lib/leads/status';
  import { STAGE_CHIP, dayOf, followUpIso, leadKey, mailtoHref, telHref, whatsappHref } from '$lib/leads/display';
  import ShopSheet from '$lib/components/shop/ShopSheet.svelte';
  import LeadLogForm from '$lib/components/leads/LeadLogForm.svelte';
  import LeadPauseForm from '$lib/components/leads/LeadPauseForm.svelte';

  let { data } = $props();
  const fmtMoney = useFormatMoney();

  let projectId = $derived(page.params.projectId ?? '');
  let base = $derived(`/moach/${projectId}/sales/manage`);
  let uid = $derived<string | null>(data.uid ?? null);
  let lead = $derived(data.lead);
  let settings = $derived(data.leadSettings ?? DEFAULT_LEAD_SETTINGS);

  let stage = $derived(
    stageOf(
      { status: lead.status },
      // A sale linked to the lead is read by the sync, not here: a stored `won` stands for it.
      { orderStatuses: lead.orders.map((o) => o.status), saleCount: lead.status === 'won' ? 1 : 0 }
    )
  );
  let attention = $derived(
    attentionReason(
      { status: stage, createdAt: lead.createdAt, lastActivityAt: lead.lastActivityAt, followUpAt: lead.followUpAt },
      clock.minutes,
      settings
    )
  );
  let locked = $derived(stage === 'offered' || stage === 'won');
  const when = (iso: string | null) => formatWhen(iso, clock.minutes, $locale || 'he');

  let tel = $derived(telHref(lead.phone));
  let wa = $derived(whatsappHref(lead.phone));
  let mail = $derived(mailtoHref(lead.email));

  function refresh() {
    invalidate(leadKey(lead.id));
    invalidate(shopOrdersKey(projectId));
  }

  // ── contact → "log it?" ──
  let suggest = $state<ManualActivityKind | null>(null);
  let logKind = $state<ManualActivityKind>('call');
  function reached(kind: ManualActivityKind) {
    suggest = kind;
  }

  // ── status ──
  let busy = $state(false);
  async function setStatus(to: 'new' | 'contacted' | 'talking' | 'spam') {
    if (busy || checkManualTransition(lead.status, to)) return;
    if (to === 'spam' && !confirm($t('shop.leads.status.spamConfirm'))) return;
    busy = true;
    try {
      const res = await executeAction('updateLeadStatus', { projectId, leadId: lead.id, status: to }, { showErrorToast: false });
      if (!res.success) toast.error(actionErrorText(res, $t('shop.leads.err.save')));
      else refresh();
    } finally {
      busy = false;
    }
  }

  async function take() {
    if (!lead.actId || !uid || busy) return;
    busy = true;
    try {
      const res = await executeAction(
        'updateTask',
        { id: lead.actId, projectId, uid: [uid], isAssigned: true, myIshur: true },
        { showErrorToast: false }
      );
      if (!res.success) toast.error(actionErrorText(res, $t('shop.leads.err.save')));
      else {
        toast.success($t('shop.leads.taken'));
        // The owner is written by the task sync, a moment after the click.
        setTimeout(refresh, 1500);
      }
    } finally {
      busy = false;
    }
  }

  // ── the plan: next step and the day to come back ──
  let nextAction = $state('');
  let day = $state('');
  $effect(() => {
    nextAction = lead.nextAction ?? '';
    day = dayOf(lead.followUpAt);
  });
  let planChanged = $derived(nextAction.trim() !== (lead.nextAction ?? '') || day !== dayOf(lead.followUpAt));
  async function savePlan(e: SubmitEvent) {
    e.preventDefault();
    if (!planChanged || busy) return;
    busy = true;
    try {
      const res = await executeAction(
        'updateLeadPlan',
        { projectId, leadId: lead.id, nextAction: nextAction.trim(), followUpAt: day ? (followUpIso(day) ?? '') : '' },
        { showErrorToast: false }
      );
      if (!res.success) toast.error(actionErrorText(res, $t('shop.leads.err.save')));
      else {
        toast.success($t('shop.leads.plan.saved'));
        refresh();
      }
    } finally {
      busy = false;
    }
  }

  let pauseOpen = $state(false);

  // ── merge (L5): the same person wrote twice ──
  // The other leads come from the layout's streamed pipeline.
  let others = $state<Array<{ id: string; name: string | null; organization: string | null }>>([]);
  $effect(() => {
    const p = data.pipeline;
    const self = lead.id;
    let live = true;
    Promise.resolve(p).then((r) => {
      if (live) others = (r?.leads ?? []).filter((l) => l.id !== self).map((l) => ({ id: l.id, name: l.name, organization: l.organization }));
    });
    return () => {
      live = false;
    };
  });
  let mergeTarget = $state('');
  async function mergeInto() {
    if (!mergeTarget || busy) return;
    if (!confirm($t('shop.leads.merge.confirm'))) return;
    busy = true;
    try {
      const res = await executeAction('mergeLeads', { projectId, keepId: mergeTarget, mergeId: lead.id }, { showErrorToast: false });
      if (!res.success) toast.error(actionErrorText(res, $t('shop.leads.err.save')));
      else {
        toast.success($t('shop.leads.merge.done'));
        invalidate(shopOrdersKey(projectId));
        goto(`${base}/leads/${mergeTarget}`);
      }
    } finally {
      busy = false;
    }
  }
  // Where this lead went, if it was folded into another one.
  let mergedInto = $derived(
    lead.activities.map((a) => (a.kind === 'system' ? mergeNoteOf(a.body) : null)).find((n) => n?.dir === 'into') ?? null
  );

  function activityText(a: (typeof lead.activities)[number]): string {
    if (a.kind === 'system') {
      const note = mergeNoteOf(a.body);
      if (note) return $t(note.dir === 'into' ? 'shop.leads.timeline.mergedInto' : 'shop.leads.timeline.mergedFrom');
      if (a.body === CONTACTS_EXPORTED) return $t('shop.leads.timeline.contactsExported');
    }
    if (a.kind === 'statusChange' && a.toStatus) {
      return $t('shop.leads.timeline.statusChange', {
        from: a.fromStatus ? $t(`shop.leads.stage.${a.fromStatus}`) : '—',
        to: $t(`shop.leads.stage.${a.toStatus}`)
      });
    }
    return $t(`shop.leads.timeline.${a.kind}`);
  }
  function actorText(a: (typeof lead.activities)[number]): string {
    if (!a.actorId) return $t('shop.leads.timeline.bySystem');
    return a.actorId === uid ? $t('shop.leads.owner.you') : (a.actorName ?? '');
  }
</script>

<svelte:head>
  <title>{lead.name ?? ''} · {$t('shop.tabs.pipeline')} · 1lev1</title>
</svelte:head>

<a class="ld-back" href="{base}/pipeline">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="ld-flip"><path d="M9 18l6-6-6-6" /></svg>
  {$t('shop.leads.page.back')}
</a>

<div class="ld">
  {#if mergedInto}
    <a class="ld-merged sh-card" href="{base}/leads/{mergedInto.id}">{$t('shop.leads.merge.banner')}</a>
  {/if}
  <header class="ld-head sh-card">
    <div class="ld-who">
      <h2 class="sh-title ld-name">{lead.name ?? '—'}</h2>
      {#if lead.organization}<p class="ld-org">{lead.organization}</p>{/if}
      <div class="ld-tags">
        <span class="sh-chip {STAGE_CHIP[stage]}">{$t(`shop.leads.stage.${stage}`)}</span>
        {#if stage === 'paused' && lead.pausedReason}<span class="sh-chip sh-chip-muted">{$t(`shop.leads.reason.${lead.pausedReason}`)}</span>{/if}
        {#if attention}<span class="sh-chip sh-chip-warn">{$t(`shop.leads.attention.${attention}`)}</span>{/if}
        <span class="ld-muted">{lead.sourceLabel ?? $t(`shop.leads.source.${lead.source ?? 'api'}`)} · <time datetime={when(lead.createdAt)?.iso} title={when(lead.createdAt)?.full}>{when(lead.createdAt)?.short}</time></span>
      </div>
    </div>
    <div class="ld-owner">
      <span class="sh-section-label">{$t('shop.leads.col.owner')}</span>
      {#if lead.ownerId}
        <span>{lead.ownerId === uid ? $t('shop.leads.owner.you') : (lead.ownerName ?? '')}</span>
      {:else if lead.actId && uid}
        <button type="button" class="sh-btn sh-btn-primary" disabled={busy} onclick={take}>{$t('shop.leads.action.take')}</button>
      {:else}
        <span class="ld-muted">{$t('shop.leads.owner.nobody')}</span>
      {/if}
    </div>
  </header>

  <div class="ld-grid">
    <div class="ld-col">
      <!-- reach them -->
      <section class="sh-card ld-box" aria-labelledby="ld-contact">
        <h3 id="ld-contact" class="sh-section-label">{$t('shop.leads.page.contact')}</h3>
        <div class="ld-contact">
          {#if lead.phone}
            <span class="ld-value" dir="ltr">{lead.phone}</span>
            <span class="ld-links">
              {#if tel}<a class="sh-btn sh-btn-outline ld-link" href={tel} onclick={() => reached('call')}>{$t('shop.leads.page.call')}</a>{/if}
              {#if wa}<a class="sh-btn sh-btn-outline ld-link" href={wa} target="_blank" rel="noopener noreferrer" onclick={() => reached('whatsapp')}>WhatsApp</a>{/if}
            </span>
          {/if}
          {#if lead.email}
            <span class="ld-value" dir="ltr">{lead.email}</span>
            {#if mail}<span class="ld-links"><a class="sh-btn sh-btn-outline ld-link" href={mail} onclick={() => reached('email')}>{$t('shop.leads.page.email')}</a></span>{/if}
          {/if}
          {#if lead.city || lead.address}
            <span class="ld-value">{[lead.address, lead.city].filter(Boolean).join(', ')}</span>
          {/if}
        </div>
        {#if suggest}
          <div class="ld-suggest" role="status">
            <span>{$t('shop.leads.page.logIt')}</span>
            <button type="button" class="sh-btn sh-btn-primary ld-link" onclick={() => { logKind = suggest ?? 'call'; suggest = null; document.getElementById('ld-log')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
              {$t('shop.leads.page.logYes')}
            </button>
            <button type="button" class="sh-btn sh-btn-quiet ld-link" onclick={() => (suggest = null)}>{$t('shop.leads.page.logNo')}</button>
          </div>
        {/if}
      </section>

      <!-- what they asked -->
      {#if lead.message || lead.details.length || lead.products.length}
        <section class="sh-card ld-box" aria-labelledby="ld-asked">
          <h3 id="ld-asked" class="sh-section-label">{$t('shop.leads.page.asked')}</h3>
          {#if lead.message}<p class="ld-message">{lead.message}</p>{/if}
          {#if lead.products.length}
            <p class="ld-muted">{$t('shop.leads.page.products')}: {lead.products.map((p) => p.name).join(', ')}</p>
          {/if}
          {#if lead.details.length}
            <dl class="ld-details">
              {#each lead.details as [k, v] (k)}
                <dt>{k}</dt>
                <dd>{v}</dd>
              {/each}
            </dl>
          {/if}
        </section>
      {/if}

      <!-- the log -->
      <section class="sh-card ld-box" aria-labelledby="ld-timeline">
        <h3 id="ld-timeline" class="sh-section-label">{$t('shop.leads.page.timeline')}</h3>
        <div id="ld-log" class="ld-log">
          {#key logKind}
            <LeadLogForm {projectId} leadId={lead.id} initialKind={logKind} onDone={refresh} />
          {/key}
        </div>
        {#if lead.activities.length === 0}
          <p class="ld-muted">{$t('shop.leads.timeline.empty')}</p>
        {:else}
          <ol class="ld-timeline">
            {#each lead.activities as a (a.id)}
              <li class="ld-entry" class:ld-system={!a.actorId}>
                <div class="ld-entry-head">
                  <span class="ld-entry-kind">
                    {activityText(a)}{#if a.direction} · {$t(`shop.leads.log.${a.direction}`)}{/if}
                  </span>
                  <span class="ld-muted">
                    {actorText(a)} · <time datetime={when(a.at)?.iso} title={when(a.at)?.full}>{when(a.at)?.short}</time>
                  </span>
                </div>
                {#if a.kind === 'system' && mergeNoteOf(a.body)}
                  {@const note = mergeNoteOf(a.body)}
                  <a class="ld-entry-body" href="{base}/leads/{note?.id}">{$t('shop.leads.merge.open')}</a>
                {:else if a.body && !(a.kind === 'system' && a.body === CONTACTS_EXPORTED)}
                  <p class="ld-entry-body">{a.body}</p>
                {/if}
              </li>
            {/each}
          </ol>
        {/if}
      </section>
    </div>

    <div class="ld-col">
      <!-- the next step -->
      <section class="sh-card ld-box" aria-labelledby="ld-next">
        <h3 id="ld-next" class="sh-section-label">{$t('shop.leads.page.nextStep')}</h3>
        {#if stage === 'won'}
          <p class="ld-muted">{$t('shop.leads.page.wonHint')}</p>
        {:else}
          <a class="sh-btn sh-btn-primary sh-btn-lg ld-wide" href="/moach/{projectId}/sales?lead={lead.id}">{$t('shop.leads.page.reportSale')}</a>
          <p class="ld-muted">{$t('shop.leads.page.reportSaleHint')}</p>
        {/if}
      </section>

      <!-- the plan -->
      <section class="sh-card ld-box" aria-labelledby="ld-plan">
        <h3 id="ld-plan" class="sh-section-label">{$t('shop.leads.plan.title')}</h3>
        <form class="ld-plan" onsubmit={savePlan}>
          <label class="sh-field">
            {$t('shop.leads.plan.next')}
            <input class="sh-input" bind:value={nextAction} maxlength="300" placeholder={$t('shop.leads.plan.nextPlaceholder')} />
          </label>
          <label class="sh-field">
            {$t('shop.leads.plan.backOn')}
            <input class="sh-input" type="date" bind:value={day} />
          </label>
          <button type="submit" class="sh-btn sh-btn-outline" disabled={!planChanged || busy}>{$t('shop.leads.plan.save')}</button>
        </form>
      </section>

      <!-- where it stands -->
      <section class="sh-card ld-box" aria-labelledby="ld-status">
        <h3 id="ld-status" class="sh-section-label">{$t('shop.leads.status.title')}</h3>
        {#if locked}
          <p class="ld-muted">{$t(stage === 'won' ? 'shop.leads.status.lockedWon' : 'shop.leads.status.lockedOffered')}</p>
        {:else}
          <div class="sh-pills" role="group" aria-label={$t('shop.leads.status.title')}>
            {#each ['new', 'contacted', 'talking'] as const as s (s)}
              <button type="button" class="sh-pill" aria-pressed={lead.status === s} disabled={busy} onclick={() => setStatus(s)}>
                {$t(`shop.leads.stage.${s}`)}
              </button>
            {/each}
          </div>
          <div class="ld-status-more">
            <button type="button" class="sh-btn sh-btn-outline" disabled={busy} onclick={() => (pauseOpen = true)}>
              {lead.status === 'paused' ? $t('shop.leads.status.repause') : $t('shop.leads.action.pause')}
            </button>
            {#if lead.status !== 'spam'}
              <button type="button" class="sh-btn sh-btn-quiet" disabled={busy} onclick={() => setStatus('spam')}>{$t('shop.leads.status.spam')}</button>
            {/if}
          </div>
          {#if lead.status === 'paused' && lead.pausedNote}<p class="ld-muted">{lead.pausedNote}</p>{/if}
        {/if}
      </section>

      <!-- the same person twice (L5) -->
      {#if !mergedInto && lead.status !== 'spam' && others.length > 0}
        <section class="sh-card ld-box" aria-labelledby="ld-merge">
          <h3 id="ld-merge" class="sh-section-label">{$t('shop.leads.merge.title')}</h3>
          <p class="ld-muted">{$t('shop.leads.merge.hint')}</p>
          <select class="sh-input" bind:value={mergeTarget} aria-label={$t('shop.leads.merge.pick')}>
            <option value="">{$t('shop.leads.merge.pick')}</option>
            {#each others as o (o.id)}
              <option value={o.id}>{o.name ?? '—'}{o.organization ? ` · ${o.organization}` : ''}</option>
            {/each}
          </select>
          <button type="button" class="sh-btn sh-btn-outline" disabled={!mergeTarget || busy} onclick={mergeInto}>
            {$t('shop.leads.merge.cta')}
          </button>
        </section>
      {/if}

      <!-- what is linked -->
      {#if lead.orders.length || lead.previousLeadId}
        <section class="sh-card ld-box" aria-labelledby="ld-linked">
          <h3 id="ld-linked" class="sh-section-label">{$t('shop.leads.page.linked')}</h3>
          <ul class="ld-linked">
            {#each lead.orders as o (o.id)}
              <li>
                <a href="{base}/orders/{o.id}">{$t('shop.order.number', { number: '' })}<bdi>{o.number}</bdi></a>
                <span class="ld-muted">· {o.total != null ? fmtMoney(o.total, o.currency) : ''}</span>
              </li>
            {/each}
            {#if lead.previousLeadId}
              <li><a href="{base}/leads/{lead.previousLeadId}">{$t('shop.leads.page.previous')}</a></li>
            {/if}
          </ul>
        </section>
      {/if}

      {#if lead.consentAt || lead.sourceUrl}
        <p class="ld-muted ld-foot">
          {#if lead.consentAt}{$t('shop.leads.page.consent', { when: when(lead.consentAt)?.short ?? '' })}{/if}
          {#if lead.sourceUrl}
            · <a href={lead.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">{$t('shop.leads.page.sourcePage')}</a>
          {/if}
        </p>
      {/if}
    </div>
  </div>
</div>

<ShopSheet bind:open={pauseOpen} label={$t('shop.leads.pause.title')}>
  <LeadPauseForm {projectId} leadId={lead.id} onDone={() => { pauseOpen = false; refresh(); }} />
</ShopSheet>

<style>
  .ld-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--sh-muted) !important;
    margin-bottom: 12px;
  }
  :global([dir='ltr']) .ld-flip {
    transform: scaleX(-1);
  }
  .ld {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .ld-head {
    padding: 16px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
  }
  .ld-who {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ld-name {
    font-size: 26px;
    margin: 0;
  }
  .ld-org {
    margin: 0;
    color: var(--sh-muted);
  }
  .ld-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
  }
  .ld-owner {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
  .ld-muted {
    font-size: 13px;
    color: var(--sh-muted);
    margin: 0;
  }
  .ld-grid {
    display: grid;
    gap: 14px;
  }
  .ld-col {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }
  .ld-box {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ld-box h3 {
    margin: 0;
  }
  .ld-contact {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px 12px;
    align-items: center;
  }
  .ld-value {
    font-size: 15px;
    color: var(--sh-ink);
    overflow-wrap: anywhere;
  }
  .ld-links {
    display: flex;
    gap: 6px;
    justify-content: flex-end;
  }
  .ld-link {
    min-height: 38px;
    padding: 0 12px;
  }
  .ld-suggest {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: var(--sh-radius-sm);
    background: var(--sh-card-2);
    font-size: 14px;
  }
  .ld-message {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .ld-details {
    display: grid;
    grid-template-columns: max-content minmax(0, 1fr);
    gap: 4px 12px;
    margin: 0;
    font-size: 14px;
  }
  .ld-details dt {
    color: var(--sh-muted);
  }
  .ld-details dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
  .ld-log {
    padding-bottom: 12px;
    border-bottom: 1px solid var(--sh-line);
  }
  .ld-timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .ld-entry {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-inline-start: 12px;
    border-inline-start: 2px solid var(--sh-gold-line);
  }
  .ld-system {
    border-inline-start-color: var(--sh-line);
  }
  .ld-entry-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
  }
  .ld-entry-kind {
    font-weight: 700;
    font-size: 14px;
  }
  .ld-entry-body {
    margin: 0;
    font-size: 14px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  .ld-wide {
    width: 100%;
    justify-content: center;
  }
  .ld-plan {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ld-merged {
    padding: 12px 16px;
    font-weight: 700;
    color: var(--sh-ink) !important;
    border-color: var(--sh-gold-line);
  }
  .ld-status-more {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ld-linked {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ld-foot {
    padding: 0 4px;
  }
  @media (min-width: 900px) {
    .ld-grid {
      grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
      align-items: start;
    }
  }
</style>
