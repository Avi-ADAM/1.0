<script>
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { executeAction } from '$lib/client/actionClient';
  import { getQuickActions, getActProgress } from '$lib/acts/actStatus.js';
  import { buildPublishAsMissionUrl } from '$lib/acts/publishAsMission.js';

  /**
   * The quick actions on a ticket row, gated by `getQuickActions` — accept or
   * hand back, move the progress, report it done, validate it, take it,
   * publish it.
   *
   * Every write goes through the Unified Action System (`executeAction`)
   * rather than the raw qids proxy, so `updateTask`'s `projectMember` rule and
   * notification fan-out apply. (The assignee cell this replaced called
   * `sendToSer('31updateTask')` straight from the component, bypassing both;
   * `/myacts` still marks tasks done through `62MarkActDone` the same way.)
   *
   * @typedef {Object} Props
   * @property {any} row - The act row.
   * @property {string} projectId
   * @property {string|number|null} [viewerId]
   * @property {(row:any, patch:Record<string, any>) => void} [onPatched] - Optimistic local update.
   * @property {(row:any) => void} [onAssign] - "I'll do it" — opens the mission picker.
   * @property {boolean} [compact] - Icon-only, for the desktop row.
   */

  /** @type {Props} */
  let { row, projectId, viewerId = null, onPatched, onAssign, compact = false } = $props();

  let busy = $state(/** @type {string|null} */ (null));
  /** Which action is showing its confirm/edit popover, if any. */
  let openPanel = $state(/** @type {string|null} */ (null));
  let draftProgress = $state(0);

  let actions = $derived(getQuickActions(row, viewerId));

  /**
   * `updateTask` needs the project id to authorize, and the act id to write.
   * `patch` is applied locally first so the row settles immediately; a failed
   * call rolls it back rather than leaving the table lying about state.
   */
  async function run(kind, params, patch) {
    if (busy) return;
    busy = kind;
    const rollback = Object.fromEntries(Object.keys(patch).map((k) => [k, row?.[k]]));
    onPatched?.(row, patch);
    try {
      const res = await executeAction('updateTask', {
        id: String(row.id),
        projectId: String(projectId),
        ...params
      });
      if (!res?.success) throw new Error(res?.error?.message ?? 'action failed');
      openPanel = null;
      toast.success($t('common.status.success'));
    } catch (err) {
      console.error('[ActQuickActions] %s failed', kind, err);
      onPatched?.(row, rollback);
      toast.error($t('common.misc.genericError'));
    } finally {
      busy = null;
    }
  }

  /** The assignee accepting the assignment. */
  const approve = () => run('approve', { myIshur: true }, { myIshur: true });

  /**
   * Handing the act back — not a rejection of anyone, and not a dead end.
   *
   * It clears the assignment so the act returns to the unplaced pool, where
   * the next member can take it or publish it as a mission. Refusing to offer
   * this is what would actually close the conversation: the alternative is an
   * act sitting on someone who has already said they cannot do it.
   */
  const decline = () =>
    run(
      'decline',
      { isAssigned: false, uid: [], myIshur: false },
      { isAssigned: false, myIshur: false, my: { data: [] } }
    );

  /** The doer reporting the work finished — hands it to the creator to validate. */
  const done = () => run('done', { naasa: true, status: 100 }, { naasa: true, status: 100 });

  /** The creator confirming the work is done. */
  const validate = () => run('validate', { valiIshur: true }, { valiIshur: true });

  /** Move the progress dial without leaving the table. */
  function saveProgress() {
    const value = Math.max(0, Math.min(100, Math.round(Number(draftProgress) || 0)));
    // 100% is a claim that the work is finished, which is `naasa`'s job — and
    // `naasa` is what starts the validation the creator has to answer. Leave
    // the last point to the explicit "done" button rather than reporting
    // completion as a side effect of dragging a slider.
    run('progress', { status: Math.min(value, 99) }, { status: Math.min(value, 99) });
  }

  /**
   * Navigate, with the spinner held until the route actually settles.
   *
   * The create page runs a vocabulary resolution that can take seconds before
   * the mission form opens, and `goto` resolves only once the load finishes —
   * so awaiting it is what keeps the button spinning across the whole gap
   * instead of leaving the member on an unchanged screen wondering.
   */
  async function navigate(kind, url) {
    if (busy) return;
    busy = kind;
    try {
      await goto(url);
    } catch (err) {
      console.error('[ActQuickActions] navigation to %s failed', url, err);
      toast.error($t('common.misc.genericError'));
    } finally {
      busy = null;
    }
  }

  /**
   * Hand the act to the mission form. Nothing is written here — the act is
   * only linked once the member actually publishes, which the create page
   * does via `linkActToMission`.
   */
  const publish = () => navigate('publish', buildPublishAsMissionUrl(projectId, row, $lang));

  /** Actions that open a panel first rather than firing immediately. */
  const PANELS = { progress: true, done: true, decline: true };

  function activate(kind) {
    if (PANELS[kind]) {
      if (kind === 'progress') draftProgress = getActProgress(row);
      openPanel = openPanel === kind ? null : kind;
      return;
    }
    if (kind === 'approve') return approve();
    if (kind === 'validate') return validate();
    if (kind === 'take') return onAssign?.(row);
    if (kind === 'publish') return publish();
  }

  const META = {
    approve: { labelKey: 'common.approve', tone: 'primary', icon: 'check' },
    decline: { labelKey: 'mission.actsTable.decline', tone: 'muted', icon: 'undo' },
    progress: { labelKey: 'tasks.updateProgress', tone: 'primary', icon: 'gauge' },
    done: { labelKey: 'tasks.markDone', tone: 'success', icon: 'flag' },
    validate: { labelKey: 'mission.actsTable.validate', tone: 'success', icon: 'double-check' },
    take: { labelKey: 'mission.actsTable.takeTask', tone: 'primary', icon: 'hand' },
    publish: { labelKey: 'mission.actsTable.publishAsMission', tone: 'accent', icon: 'megaphone' }
  };

  const HINTS = {
    decline: 'mission.actsTable.declineHint',
    publish: 'mission.actsTable.publishAsMissionHint'
  };

  const hintFor = (kind) => (HINTS[kind] ? $t(HINTS[kind]) : $t(META[kind].labelKey));

  function onKeydown(e) {
    if (e.key === 'Escape' && openPanel) openPanel = null;
  }
</script>

<svelte:window onkeydown={onKeydown} />

{#if actions.length}
  <div class="act-actions" class:compact>
    {#each actions as kind (kind)}
      {@const meta = META[kind]}
      <div class="act-slot">
        <button
          type="button"
          class="act-action act-action--{meta.tone}"
          class:act-action--open={openPanel === kind}
          disabled={busy !== null}
          aria-busy={busy === kind}
          aria-expanded={PANELS[kind] ? openPanel === kind : undefined}
          title={hintFor(kind)}
          aria-label={$t(meta.labelKey)}
          onclick={(e) => {
            // The whole row opens the act; an action must not do both.
            e.stopPropagation();
            activate(kind);
          }}
        >
          {#if busy === kind}
            <svg class="act-action__spin" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="40 20" />
            </svg>
          {:else if meta.icon === 'check'}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          {:else if meta.icon === 'undo'}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" />
            </svg>
          {:else if meta.icon === 'gauge'}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 21a9 9 0 1 1 9-9" /><path d="m12 12 4-3" />
            </svg>
          {:else if meta.icon === 'flag'}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M4 21V4h9l1 2h6v9h-7l-1-2H4" />
            </svg>
          {:else if meta.icon === 'double-check'}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m1 13 4 4L15 7" /><path d="m9 15 2 2L23 5" />
            </svg>
          {:else if meta.icon === 'hand'}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v7M10 10.5V6a2 2 0 0 0-4 0v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-1a2 2 0 1 1 4 0" />
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          {/if}
          <span class="act-action__label">{$t(meta.labelKey)}</span>
        </button>

        {#if openPanel === kind}
          <!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
          <div class="act-pop" onclick={(e) => e.stopPropagation()}>
            {#if kind === 'progress'}
              <label class="act-pop__row">
                <span>{$t('tasks.progress')}</span>
                <output class="act-pop__value">{draftProgress}%</output>
                <input type="range" min="0" max="100" step="5" bind:value={draftProgress} />
              </label>
              <div class="act-pop__buttons">
                <button type="button" class="act-pop__btn" onclick={() => (openPanel = null)}>
                  {$t('tasks.cancel')}
                </button>
                <button
                  type="button"
                  class="act-pop__btn act-pop__btn--go"
                  disabled={busy !== null}
                  onclick={saveProgress}
                >
                  {$t('tasks.save')}
                </button>
              </div>
            {:else}
              <p class="act-pop__ask">
                {kind === 'done'
                  ? $t('tasks.confirmMarkDone')
                  : $t('mission.actsTable.confirmDecline')}
              </p>
              <div class="act-pop__buttons">
                <button type="button" class="act-pop__btn" onclick={() => (openPanel = null)}>
                  {$t('tasks.cancel')}
                </button>
                <button
                  type="button"
                  class="act-pop__btn act-pop__btn--go"
                  disabled={busy !== null}
                  onclick={() => (kind === 'done' ? done() : decline())}
                >
                  {$t('tasks.yes')}
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  .act-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .act-slot {
    position: relative;
    display: inline-flex;
  }

  .act-action {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.3;
    white-space: nowrap;
    border: 1px solid color-mix(in srgb, var(--tone) 34%, transparent);
    background: color-mix(in srgb, var(--tone) 12%, transparent);
    color: var(--tone);
    cursor: pointer;
    transition: background-color 0.15s ease, transform 0.15s ease;
  }

  .act-action:hover:not(:disabled) {
    background: color-mix(in srgb, var(--tone) 22%, transparent);
  }

  .act-action:active:not(:disabled) {
    transform: translateY(1px);
  }

  .act-action--open {
    background: color-mix(in srgb, var(--tone) 26%, transparent);
  }

  .act-action:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .act-action:focus-visible {
    outline: 2px solid var(--tone);
    outline-offset: 2px;
  }

  /* Light by default, dark opts in. The global `--gold-l` / `--pink-l` are
     defined on `:root` (dark) and `html.business` but never on
     `html.personal`, so leaning on them alone would paint dark-mode tones on
     a personal-theme light page. Light values are 700 steps (≥4.5:1 on the
     table's white surface); dark values are 400 steps. */
  .act-action--primary { --tone: #a16207; }
  .act-action--success { --tone: #15803d; }
  .act-action--accent { --tone: #be185d; }
  .act-action--muted { --tone: #5b6676; }

  :global(.dark) .act-action--primary { --tone: var(--gold-l); }
  :global(.dark) .act-action--success { --tone: var(--success); }
  :global(.dark) .act-action--accent { --tone: var(--pink-l); }
  :global(.dark) .act-action--muted { --tone: var(--tm); }

  /* Compact = the desktop row, where the label would blow the column out.
     The label stays in the DOM for the accessible name and the tooltip. */
  .compact .act-action {
    padding: 0.35rem;
  }

  .compact .act-action__label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .act-action__spin {
    animation: act-spin 0.8s linear infinite;
  }

  @keyframes act-spin {
    to { transform: rotate(360deg); }
  }

  /* ── Popover ──────────────────────────────────────────────────────── */
  .act-pop {
    position: absolute;
    top: calc(100% + 0.4rem);
    inset-inline-end: 0;
    z-index: 30;
    width: max-content;
    min-width: 12rem;
    max-width: 16rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.6rem;
    border-radius: 12px;
    font-size: 0.75rem;
    text-align: start;
    color: #1f2937;
    background: #ffffff;
    border: 1px solid rgba(15, 23, 42, 0.12);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.16);
  }

  :global(.dark) .act-pop {
    color: var(--text);
    background: var(--s2);
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  }

  .act-pop__ask {
    line-height: 1.45;
  }

  .act-pop__row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.35rem;
    align-items: center;
    font-weight: 600;
  }

  .act-pop__row input[type='range'] {
    grid-column: 1 / -1;
    width: 100%;
    accent-color: #a16207;
  }

  :global(.dark) .act-pop__row input[type='range'] {
    accent-color: var(--gold-l);
  }

  .act-pop__value {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }

  .act-pop__buttons {
    display: flex;
    justify-content: flex-end;
    gap: 0.35rem;
  }

  .act-pop__btn {
    padding: 0.3rem 0.7rem;
    border-radius: 8px;
    font-size: 0.72rem;
    font-weight: 700;
    cursor: pointer;
    color: inherit;
    background: transparent;
    border: 1px solid rgba(15, 23, 42, 0.16);
  }

  :global(.dark) .act-pop__btn {
    border-color: rgba(255, 255, 255, 0.14);
  }

  .act-pop__btn--go {
    color: #ffffff;
    background: #a16207;
    border-color: transparent;
  }

  :global(.dark) .act-pop__btn--go {
    color: var(--s1);
    background: var(--gold-l);
  }

  .act-pop__btn:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (prefers-reduced-motion: reduce) {
    .act-action { transition: none; }
    .act-action__spin { animation-duration: 2.4s; }
  }
</style>
