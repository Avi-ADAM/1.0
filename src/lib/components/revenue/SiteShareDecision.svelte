<script>
  import { t, locale, isRtl } from '$lib/translations';
  /**
   * SiteShareDecision — the single shared decision UI for the per-member site
   * share (PLAN_SITE_SHARE_PER_MEMBER §2/§3). The SAME component renders in all
   * three collection gates (creation, lev-approval, the persistent reminder), so
   * the choice is consistent everywhere. Presentational + emits: the parent owns
   * `computeSiteShare` (the proposal) and the `decideSiteShare` action call.
   *
   * Personal framing: this is THIS member's contribution out of THEIR OWN share —
   * it does NOT reduce what the other partners split (that decoupling is M1).
   */
  import { untrack } from 'svelte';

  let {
    /** computeSiteShare suggestion on the member's personal share. */
    proposed = 0,
    /** The personal share the suggestion was computed from (shown for context). */
    basis = 0,
    /** Currency symbol for display. */
    currency = '₪',
    /** Existing decision to prefill when re-deciding: { des_status, amount, direction, reason }. */
    initial = null,
    /** Disable controls while the parent's action is in flight. */
    busy = false,
    /** Tighter chrome for inline placement (e.g. inside the money card). */
    compact = false,
    /** Emitted on confirm/skip: { decision:'decided'|'skipped', amount, direction, reason }. */
    onDecide
  } = $props();

  // Seed the editable form once from `initial` (untrack: we want only its value
  // at mount, not a reactive subscription). Parents remount per decision via
  // {#key …}, so a later `initial` change arrives as a fresh component.
  let direction = $state(untrack(() => initial?.direction ?? 'as_is'));
  let custom = $state(untrack(() => (initial?.amount > 0 ? initial.amount : 0)));
  let reason = $state(untrack(() => initial?.reason ?? ''));


  // 0 is a valid contribution. In adjust mode we honour an explicit 0 (no silent
  // fallback to `proposed`); only a blank/NaN field falls back.
  let finalAmount = $derived(
    direction === 'as_is'
      ? Math.max(0, Number(proposed) || 0)
      : Number.isFinite(Number(custom))
        ? Math.max(0, Number(custom))
        : Math.max(0, Number(proposed) || 0)
  );
  let needsReason = $derived(direction === 'less' && !String(reason).trim());
  let settled = $derived(initial?.des_status === 'decided' || initial?.des_status === 'skipped');

  function pick(dir) {
    direction = dir;
    if (dir !== 'as_is' && !(Number(custom) > 0)) custom = proposed;
    if (dir === 'as_is') reason = '';
  }

  function confirm() {
    // 0 is acceptable — it records a closed (skipped) decision server-side.
    if (busy || needsReason || finalAmount < 0) return;
    onDecide?.({
      decision: 'decided',
      amount: Number(finalAmount),
      direction,
      reason: String(reason).trim() || null
    });
  }

  function skip() {
    if (busy) return;
    onDecide?.({ decision: 'skipped', amount: 0, direction: 'as_is', reason: null });
  }
</script>

<div class="ssd" class:compact dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="ssd-head">
    <span class="ssd-title">{$t('lev.revenue.siteShareDecision.title')}</span>
    <span class="ssd-amount">{Number(finalAmount).toFixed(2)} {currency}</span>
  </div>

  <p class="ssd-sub">
    {$t('lev.revenue.siteShareDecision.sub', { basis: Number(basis).toFixed(2), proposed: Number(proposed).toFixed(2), currency })}
  </p>

  {#if settled}
    <p class="ssd-settled">
      {initial?.des_status === 'skipped'
        ? $t('lev.revenue.siteShareDecision.skipped')
        : $t('lev.revenue.siteShareDecision.gave', { amount: Number(initial?.amount || 0).toFixed(2), currency })}
    </p>
  {/if}

  <div class="ssd-options">
    <label class="ssd-opt">
      <input type="radio" name="ssdDir" checked={direction === 'as_is'} onchange={() => pick('as_is')} disabled={busy} />
      <span>{$t('lev.revenue.siteShareDecision.asIs', { proposed: Number(proposed).toFixed(2) })}</span>
    </label>
    <label class="ssd-opt">
      <input type="radio" name="ssdDir" checked={direction === 'more'} onchange={() => pick('more')} disabled={busy} />
      <span>{$t('lev.revenue.siteShareDecision.more')}</span>
    </label>
    <label class="ssd-opt">
      <input type="radio" name="ssdDir" checked={direction === 'less'} onchange={() => pick('less')} disabled={busy} />
      <span>{$t('lev.revenue.siteShareDecision.less')}</span>
    </label>
  </div>

  {#if direction !== 'as_is'}
    <div class="ssd-adjust">
      <label class="ssd-field">
        <span>{$t('lev.revenue.siteShareDecision.amount')}</span>
        <input type="number" min="0" step="0.01" bind:value={custom} disabled={busy} />
      </label>
      <label class="ssd-field ssd-reason">
        <span>{direction === 'less' ? $t('lev.revenue.siteShareDecision.reasonReq') : $t('lev.revenue.siteShareDecision.reasonOpt')}</span>
        <input type="text" bind:value={reason} placeholder={$t('lev.revenue.siteShareDecision.placeholder')} disabled={busy} />
      </label>
    </div>
  {/if}

  <div class="ssd-actions">
    <button type="button" class="ssd-confirm" onclick={confirm} disabled={busy || needsReason || finalAmount < 0}>
      {$t('lev.revenue.siteShareDecision.confirm')}
    </button>
    <button type="button" class="ssd-skip" onclick={skip} disabled={busy}>
      {$t('lev.revenue.siteShareDecision.skip')}
    </button>
  </div>
</div>

<style>
  .ssd {
    border: 1px solid var(--tm, rgba(0, 0, 0, 0.12));
    border-radius: 12px;
    padding: 14px 16px;
    background: var(--bg2, rgba(255, 255, 255, 0.04));
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .ssd.compact {
    padding: 10px 12px;
    gap: 8px;
  }
  .ssd-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
  }
  .ssd-title {
    font-weight: 700;
    color: var(--gold-l, var(--gold, inherit));
  }
  .ssd-amount {
    font-weight: 800;
    font-size: 1.1rem;
  }
  .ssd-sub {
    margin: 0;
    font-size: 0.85rem;
    opacity: 0.85;
    line-height: 1.4;
  }
  .ssd-settled {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--gold-l, var(--gold, inherit));
  }
  .ssd-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
  }
  .ssd-opt {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  .ssd-adjust {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .ssd-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.8rem;
  }
  .ssd-field input {
    padding: 6px 8px;
    border-radius: 8px;
    border: 1px solid var(--tm, rgba(0, 0, 0, 0.2));
    background: transparent;
    color: inherit;
  }
  .ssd-reason {
    flex: 1 1 180px;
  }
  .ssd-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .ssd-confirm,
  .ssd-skip {
    padding: 8px 16px;
    border-radius: 999px;
    font-weight: 700;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .ssd-confirm {
    background: var(--gold, #c9a227);
    color: #1a1a1a;
  }
  .ssd-confirm:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ssd-skip {
    background: transparent;
    border-color: var(--tm, rgba(0, 0, 0, 0.2));
    color: inherit;
  }
  .ssd-skip:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
