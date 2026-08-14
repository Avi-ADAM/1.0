<script>
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { goto } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { executeAction } from '$lib/client/actionClient';
  import { getQuickActions } from '$lib/acts/actStatus.js';
  import { buildPublishAsMissionUrl } from '$lib/acts/publishAsMission.js';

  /**
   * The quick actions on a ticket row: accept, validate, take it, publish it.
   *
   * Everything here is a **write**, so it goes through the Unified Action
   * System (`executeAction`) rather than the raw qids proxy — `updateTask`
   * already carries the `projectMember` rule and the notification fan-out.
   * (The assignee cell this replaced called `sendToSer('31updateTask')`
   * straight from the component, bypassing both.)
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

  /** The creator confirming the work is done. */
  const validate = () => run('validate', { valiIshur: true }, { valiIshur: true });

  /**
   * "I'll do it" — opens the mission picker rather than writing.
   *
   * Taking an act is not just `my = me`: the act has to hang off one of the
   * taker's own missions-in-progress, which is what makes the hours it accrues
   * count toward anything. Writing the assignment straight from here skipped
   * that and left the act assigned but attached to nothing.
   */
  const take = () => onAssign?.(row);

  /**
   * Hand the act to the mission form. Nothing is written here — the act is
   * only linked once the member actually publishes, which the create page
   * does via `linkActToMission`.
   */
  const publish = () => goto(buildPublishAsMissionUrl(projectId, row, $lang));

  const HANDLERS = { approve, validate, take, publish };

  const META = {
    approve: { labelKey: 'common.approve', tone: 'primary', icon: 'check' },
    validate: { labelKey: 'mission.actsTable.validate', tone: 'success', icon: 'double-check' },
    take: { labelKey: 'mission.actsTable.takeTask', tone: 'primary', icon: 'hand' },
    publish: { labelKey: 'mission.actsTable.publishAsMission', tone: 'accent', icon: 'megaphone' }
  };

  const hintFor = (kind) =>
    kind === 'publish' ? $t('mission.actsTable.publishAsMissionHint') : $t(META[kind].labelKey);
</script>

{#if actions.length}
  <div class="act-actions" class:compact>
    {#each actions as kind (kind)}
      {@const meta = META[kind]}
      <button
        type="button"
        class="act-action act-action--{meta.tone}"
        disabled={busy !== null}
        aria-busy={busy === kind}
        title={hintFor(kind)}
        aria-label={$t(meta.labelKey)}
        onclick={(e) => {
          // The whole row opens the act; an action must not do both.
          e.stopPropagation();
          HANDLERS[kind]();
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

  :global(.dark) .act-action--primary { --tone: var(--gold-l); }
  :global(.dark) .act-action--success { --tone: var(--success); }
  :global(.dark) .act-action--accent { --tone: var(--pink-l); }

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

  @media (prefers-reduced-motion: reduce) {
    .act-action { transition: none; }
    .act-action__spin { animation-duration: 2.4s; }
  }
</style>
