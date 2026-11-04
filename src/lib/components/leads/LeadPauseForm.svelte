<script lang="ts">
  /**
   * "Not now" (docs/inprogress/PLAN_LEADS.md §2.1) — never "lost". A reason
   * from a short list makes it countable; a day to come back brings the lead
   * back into "needs attention" by itself (`followUpDue`).
   */
  import { t } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { PAUSED_REASONS, type PausedReason } from '$lib/leads/status';
  import { followUpIso } from '$lib/leads/display';

  let { projectId, leadId, onDone }: { projectId: string; leadId: string; onDone: () => void } = $props();

  let reason = $state<PausedReason | null>(null);
  let note = $state('');
  let day = $state('');
  let busy = $state(false);
  let error = $state('');

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!reason || busy) return;
    busy = true;
    error = '';
    try {
      const res = await executeAction(
        'updateLeadStatus',
        {
          projectId,
          leadId,
          status: 'paused',
          pausedReason: reason,
          pausedNote: note.trim() || undefined,
          followUpAt: followUpIso(day) ?? undefined
        },
        { showErrorToast: false }
      );
      if (!res.success) {
        error = actionErrorText(res, $t('shop.leads.err.save'));
        return;
      }
      onDone();
    } finally {
      busy = false;
    }
  }
</script>

<form class="pf" onsubmit={save}>
  <h2 class="sh-title pf-title">{$t('shop.leads.pause.title')}</h2>
  <p class="pf-hint">{$t('shop.leads.pause.hint')}</p>
  <fieldset class="pf-reasons">
    <legend class="sh-section-label">{$t('shop.leads.pause.why')}</legend>
    <div class="sh-pills">
      {#each PAUSED_REASONS as r (r)}
        <button type="button" class="sh-pill" aria-pressed={reason === r} onclick={() => (reason = r)}>
          {$t(`shop.leads.reason.${r}`)}
        </button>
      {/each}
    </div>
  </fieldset>
  <label class="sh-field">
    {$t('shop.leads.pause.note')}
    <textarea class="sh-input" bind:value={note} maxlength="2000"></textarea>
  </label>
  <label class="sh-field">
    {$t('shop.leads.pause.comeBack')}
    <input class="sh-input" type="date" bind:value={day} />
  </label>
  {#if error}<p class="pf-err" role="alert">{error}</p>{/if}
  <button type="submit" class="sh-btn sh-btn-primary sh-btn-lg" disabled={!reason || busy}>{$t('shop.leads.pause.save')}</button>
</form>

<style>
  .pf {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .pf-title {
    font-size: 22px;
  }
  .pf-hint {
    margin: 0;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .pf-reasons {
    border: 0;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .pf-err {
    margin: 0;
    color: var(--sh-warn);
    font-size: 14px;
  }
</style>
