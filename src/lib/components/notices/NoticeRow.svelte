<script lang="ts">
  /**
   * NoticeRow — one thing that waits for the viewer, said as one sentence
   * (docs/inprogress/PLAN_SMART_NOTICES.md), instead of the full card.
   *
   * Three actions, in this order of weight:
   *   - **expand** — the primary, wide button: reading the whole thing before
   *     signing is what we want most people to do.
   *   - **approve** — secondary (outline), only when the notice carries an
   *     approval and its action refuses terms that moved since they were shown
   *     (ROUND_GUARDED_ACTIONS). The figures it signs are the ones on screen.
   *   - **hide** — an icon. Not a rejection: nothing about the thing changes.
   *     When a silence clock runs on it, the row says so before it hides —
   *     otherwise hiding would quietly become "approve without reading".
   *
   * A hidden notice renders compact, with a way back.
   *
   * Colours come from the concierge palette (`--cg-*`, concierge.css) with
   * neutral fallbacks, so the hub and the heart can host the same row later.
   */
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { executeAction } from '$lib/client/actionClient';
  import {
    ROUND_GUARDED_ACTIONS,
    formatDeadline,
    resolveNoticeText,
    resolveTerm,
    type Notice,
    type Translate
  } from '$lib/notices';

  interface Props {
    notice: Notice;
    /** Called when the row is followed — the bell closes its panel. */
    onfollow?: (notice: Notice) => void;
    /**
     * Opens a heart item in place (on the heart). Without it a heart item
     * follows `expand.href` — the heart filtered to its kind and rikma.
     */
    onexpand?: (notice: Notice) => void;
    /** The approval went through. */
    onapproved?: (notice: Notice) => void;
    /** The notice was hidden / brought back — the host moves it. */
    onhidden?: (notice: Notice) => void;
    onrestored?: (notice: Notice) => void;
  }

  let { notice, onfollow, onexpand, onapproved, onhidden, onrestored }: Props = $props();

  const tr: Translate = (key, params) => $t(key, params);

  let sentence = $derived(resolveNoticeText(notice.sentence, tr, $lang));
  let detail = $derived(resolveNoticeText(notice.detail, tr, $lang));
  let figures = $derived(notice.terms.map((term) => resolveTerm(term, tr, $lang)));
  let when = $derived(notice.clockRuns && notice.deadline ? formatDeadline(notice.deadline, $lang) : '');
  let clock = $derived(when ? $t('notices.ui.clock', { when }) : '');
  let expandLabel = $derived(`${$t('notices.ui.expand')}: ${sentence}`);

  let canApprove = $derived(!!notice.approve && ROUND_GUARDED_ACTIONS.has(notice.approve.actionKey));

  /** idle → busy → signed | moved | failed */
  let phase: 'idle' | 'busy' | 'signed' | 'moved' | 'failed' = $state('idle');
  let confirmHide = $state(false);
  let hiding = $state(false);

  async function approve() {
    if (!notice.approve || phase === 'busy') return;
    phase = 'busy';
    const res = await executeAction(notice.approve.actionKey as any, notice.approve.params as any, {
      showErrorToast: false
    });
    if (res.success) {
      phase = 'signed';
      onapproved?.(notice);
    } else if (res.error?.code === 'ROUND_MOVED' || res.error?.code === 'AMOUNT_MOVED') {
      phase = 'moved';
    } else {
      phase = 'failed';
    }
  }

  function askHide() {
    // Silence completes what is hidden, too — say it before hiding, not after.
    if (clock) confirmHide = true;
    else void hide();
  }

  /** A folded row (groupNotices) stands for several notices: act on all of them. */
  const keys = $derived(notice.groupKeys ?? [notice.key]);

  async function each(actionKey: 'dismissNotice' | 'restoreNotice') {
    let ok = true;
    for (const noticeKey of keys) {
      const res = await executeAction(actionKey, { noticeKey });
      ok = ok && res.success;
    }
    return ok;
  }

  async function hide() {
    if (hiding) return;
    hiding = true;
    const ok = await each('dismissNotice');
    hiding = false;
    confirmHide = false;
    if (ok) onhidden?.(notice);
  }

  async function restore() {
    if (hiding) return;
    hiding = true;
    const ok = await each('restoreNotice');
    hiding = false;
    if (ok) onrestored?.(notice);
  }
</script>

{#if notice.hidden}
  <article class="nr nr-hidden">
    <p class="nr-sentence">{sentence}</p>
    <button type="button" class="nr-restore" disabled={hiding} onclick={restore}>
      {$t('notices.ui.unhide')}
    </button>
  </article>
{:else}
  <article class="nr" class:urgent={notice.urgent} class:done={phase === 'signed'}>
    <p class="nr-sentence">
      {#if (notice.count ?? 1) > 1}<span class="nr-count">×{notice.count}</span>{/if}{sentence}
    </p>

    {#if detail}
      <p class="nr-detail">“{detail}”</p>
    {/if}

    {#if figures.length}
      <ul class="nr-terms">
        {#each figures as figure, i (i)}
          <li>{figure}</li>
        {/each}
      </ul>
    {/if}

    {#if clock}
      <p class="nr-clock">{clock}</p>
    {/if}

    {#if confirmHide}
      <div class="nr-confirm" role="alert">
        <p>{$t('notices.ui.hideClock', { when })}</p>
        <div class="nr-confirm-actions">
          <button type="button" class="nr-ghost" disabled={hiding} onclick={hide}>{$t('notices.ui.hideConfirm')}</button>
          <button type="button" class="nr-ghost" onclick={() => (confirmHide = false)}>{$t('notices.ui.hideCancel')}</button>
        </div>
      </div>
    {/if}

    <div class="nr-actions">
      {#if notice.expand.kind === 'href' || !onexpand}
        <!-- A heart item without a host to open it in place follows its deep link. -->
        <a
          class="nr-expand"
          href={notice.expand.href}
          aria-label={expandLabel}
          onclick={() => onfollow?.(notice)}>{$t('notices.ui.expand')}</a
        >
      {:else}
        <button
          type="button"
          class="nr-expand"
          aria-label={expandLabel}
          onclick={() => {
            onexpand?.(notice);
            onfollow?.(notice);
          }}>{$t('notices.ui.expand')}</button
        >
      {/if}

      {#if canApprove && (phase === 'idle' || phase === 'busy')}
        <button
          type="button"
          class="nr-approve"
          disabled={phase === 'busy'}
          aria-label={`${$t('notices.ui.approve')}: ${sentence}`}
          onclick={approve}
        >
          {phase === 'busy' ? $t('notices.ui.approving') : $t('notices.ui.approve')}
        </button>
      {/if}

      {#if phase !== 'signed'}
        <button
          type="button"
          class="nr-hide"
          aria-label={`${$t('notices.ui.hide')}: ${sentence}`}
          title={$t('notices.ui.hide')}
          disabled={hiding}
          onclick={askHide}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 5 10 7a13.4 13.4 0 0 1-3.2 3.9M6.3 6.3A13.6 13.6 0 0 0 2 12c1 2 5 7 10 7a9.9 9.9 0 0 0 4.2-.9" />
          </svg>
        </button>
      {/if}
    </div>

    {#if phase === 'signed'}
      <p class="nr-status ok" role="status">{$t('notices.ui.signed')}</p>
    {:else if phase === 'moved'}
      <p class="nr-status warn" role="status">{$t('notices.ui.moved')}</p>
    {:else if phase === 'failed'}
      <p class="nr-status warn" role="status">{$t('notices.ui.failed')}</p>
    {/if}
  </article>
{/if}

<style>
  .nr {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 11px;
    border-radius: 12px;
    background: var(--cg-s2, var(--surface2, #f4f4f5));
    color: var(--cg-ink, var(--surfaceInk, #18181b));
    border-inline-start: 3px solid var(--cg-gold, #d4a017);
    text-align: start;
  }
  .nr.urgent {
    border-inline-start-color: var(--cg-pink, #e11d48);
  }
  .nr.done {
    border-inline-start-color: var(--cg-mint-d, #059669);
  }
  .nr-hidden {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    opacity: 0.75;
    border-inline-start-color: var(--cg-muted, #71717a);
  }
  .nr-hidden .nr-sentence {
    flex: 1;
    min-width: 0;
    font-weight: 500;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nr-count {
    display: inline-block;
    margin-inline-end: 6px;
    padding: 0 6px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    background: var(--cg-s3, #e4e4e7);
    unicode-bidi: isolate;
  }
  .nr-sentence {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
  .nr-detail {
    margin: 0;
    font-size: 12px;
    line-height: 1.4;
    color: var(--cg-muted, var(--surfaceMuted, #52525b));
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .nr-terms {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .nr-terms li {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    background: var(--cg-s3, var(--surface, #e4e4e7));
    color: var(--cg-ink, var(--surfaceInk, #18181b));
  }
  .nr-clock {
    margin: 0;
    font-size: 11px;
    color: var(--cg-muted, var(--surfaceMuted, #52525b));
  }
  .nr.urgent .nr-clock {
    color: var(--cg-pink, #e11d48);
    font-weight: 700;
  }
  .nr-actions {
    display: flex;
    align-items: stretch;
    gap: 6px;
    margin-top: 2px;
  }
  .nr-expand,
  .nr-approve,
  .nr-hide,
  .nr-restore,
  .nr-ghost {
    font: inherit;
    cursor: pointer;
  }
  .nr-expand {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    border: 0;
    border-radius: 10px;
    /* The concierge's primary fill (.btn-jewel), so it reads as the main action. */
    background: linear-gradient(
      135deg,
      var(--cg-g-metal-a, #bf953f),
      var(--cg-g-metal-b, #fcf6ba) 30%,
      var(--cg-g-metal-c, #b38728) 60%,
      var(--cg-g-metal-d, #aa771c)
    );
    color: var(--cg-on-metal, #574010);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }
  .nr-expand:hover {
    filter: brightness(1.06);
  }
  /* Secondary: an outline, narrower — present, never the obvious tap. */
  .nr-approve {
    flex: 0 0 auto;
    min-height: 44px;
    min-width: 72px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1.5px solid var(--cg-goldhi, #b38728);
    background: transparent;
    color: var(--cg-goldhi, #7c5a10);
    font-size: 12px;
    font-weight: 700;
  }
  .nr-approve:disabled {
    opacity: 0.6;
    cursor: progress;
  }
  .nr-hide {
    flex: 0 0 44px;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--cg-muted, #71717a);
  }
  .nr-hide:hover {
    background: var(--cg-s3, #e4e4e7);
  }
  .nr-restore,
  .nr-ghost {
    min-height: 36px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid rgb(var(--cg-fg-rgb, 0 0 0) / 0.15);
    background: transparent;
    color: var(--cg-ink, #18181b);
    font-size: 12px;
    font-weight: 600;
  }
  .nr-confirm {
    padding: 8px 10px;
    border-radius: 10px;
    background: var(--cg-s3, #e4e4e7);
    font-size: 12px;
    line-height: 1.45;
  }
  .nr-confirm p {
    margin: 0 0 6px;
  }
  .nr-confirm-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .nr-status {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
  }
  .nr-status.ok {
    color: var(--cg-mint-d, #047857);
  }
  .nr-status.warn {
    color: var(--cg-pink-d, #be123c);
  }
  .nr-expand:focus-visible,
  .nr-approve:focus-visible,
  .nr-hide:focus-visible,
  .nr-restore:focus-visible,
  .nr-ghost:focus-visible {
    outline: 2px solid var(--cg-goldhi, #f59e0b);
    outline-offset: 2px;
  }
</style>
