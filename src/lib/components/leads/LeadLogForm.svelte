<script lang="ts">
  /**
   * "Log a conversation" (docs/inprogress/PLAN_LEADS.md §4.1–4.2): a call, a
   * message, a meeting or a note. The first outgoing contact with a new lead
   * marks it "contacted" — the server decides that (`statusAfterActivity`).
   */
  import { t } from '$lib/translations';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { MANUAL_ACTIVITY_KINDS, type ManualActivityKind } from '$lib/leads/status';

  let {
    projectId,
    leadId,
    initialKind = 'call',
    onDone
  }: {
    projectId: string;
    leadId: string;
    initialKind?: ManualActivityKind;
    onDone: () => void;
  } = $props();

  let kind = $state<ManualActivityKind>(initialKind);
  let direction = $state<'out' | 'in'>('out');
  let body = $state('');
  let busy = $state(false);
  let error = $state('');

  let isContact = $derived(kind !== 'note');
  let canSave = $derived(isContact || body.trim().length > 0);

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!canSave || busy) return;
    busy = true;
    error = '';
    try {
      const res = await executeAction(
        'logLeadActivity',
        {
          projectId,
          leadId,
          kind,
          direction: isContact && kind !== 'meeting' ? direction : undefined,
          body: body.trim() || undefined
        },
        { showErrorToast: false }
      );
      if (!res.success) {
        error = actionErrorText(res, $t('shop.leads.err.save'));
        return;
      }
      body = '';
      onDone();
    } finally {
      busy = false;
    }
  }
</script>

<form class="lf" onsubmit={save}>
  <div class="sh-pills" role="group" aria-label={$t('shop.leads.log.kindLabel')}>
    {#each MANUAL_ACTIVITY_KINDS as k (k)}
      <button type="button" class="sh-pill" aria-pressed={kind === k} onclick={() => (kind = k)}>
        {$t(`shop.leads.kind.${k}`)}
      </button>
    {/each}
  </div>
  {#if isContact && kind !== 'meeting'}
    <div class="sh-seg" role="group" aria-label={$t('shop.leads.log.directionLabel')}>
      <button type="button" aria-pressed={direction === 'out'} onclick={() => (direction = 'out')}>
        {$t('shop.leads.log.out')}
      </button>
      <button type="button" aria-pressed={direction === 'in'} onclick={() => (direction = 'in')}>
        {$t('shop.leads.log.in')}
      </button>
    </div>
  {/if}
  <label class="sh-field">
    <span>{isContact ? $t('shop.leads.log.whatWasSaid') : $t('shop.leads.log.note')}</span>
    <textarea class="sh-input" bind:value={body} maxlength="4000"></textarea>
  </label>
  {#if error}<p class="lf-err" role="alert">{error}</p>{/if}
  <button type="submit" class="sh-btn sh-btn-primary" disabled={!canSave || busy}>{$t('shop.leads.log.save')}</button>
</form>

<style>
  .lf {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .lf-err {
    margin: 0;
    color: var(--sh-warn);
    font-size: 14px;
  }
</style>
