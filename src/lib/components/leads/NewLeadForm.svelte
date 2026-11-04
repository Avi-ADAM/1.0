<script lang="ts">
  /**
   * "+ Lead" — an enquiry that arrived by phone or in person
   * (docs/inprogress/PLAN_LEADS.md §4.1). `source: manual` is the one source
   * that needs no consent record: the member is the one who heard it.
   * A repeat of someone already in the table folds into their lead.
   */
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';

  let { projectId, onDone }: { projectId: string; onDone: (leadId: string, duplicated: boolean) => void } = $props();

  let name = $state('');
  let phone = $state('');
  let email = $state('');
  let organization = $state('');
  let message = $state('');
  let busy = $state(false);
  let error = $state('');

  let canSave = $derived(name.trim().length > 0 && (phone.trim().length > 0 || email.trim().length > 0));

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (!canSave || busy) return;
    busy = true;
    error = '';
    try {
      const res = await executeAction(
        'createLead',
        {
          projectId,
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          organization: organization.trim() || undefined,
          message: message.trim() || undefined,
          source: 'manual'
        },
        { showErrorToast: false }
      );
      if (!res.success) {
        error = actionErrorText(res, $t('shop.leads.err.save'));
        return;
      }
      const d = res.data as { leadId?: string; duplicated?: boolean };
      if (d?.duplicated) toast($t('shop.leads.new.duplicated'));
      if (d?.leadId) onDone(String(d.leadId), !!d.duplicated);
    } finally {
      busy = false;
    }
  }
</script>

<form class="nl" onsubmit={save}>
  <h2 class="sh-title nl-title">{$t('shop.leads.new.title')}</h2>
  <p class="nl-hint">{$t('shop.leads.new.hint')}</p>
  <label class="sh-field">
    {$t('shop.leads.field.name')}
    <input class="sh-input" bind:value={name} required maxlength="200" autocomplete="off" />
  </label>
  <div class="nl-row">
    <label class="sh-field">
      {$t('shop.leads.field.phone')}
      <input class="sh-input" type="tel" bind:value={phone} maxlength="40" dir="ltr" autocomplete="off" />
    </label>
    <label class="sh-field">
      {$t('shop.leads.field.email')}
      <input class="sh-input" type="email" bind:value={email} maxlength="200" dir="ltr" autocomplete="off" />
    </label>
  </div>
  <label class="sh-field">
    {$t('shop.leads.field.organization')}
    <input class="sh-input" bind:value={organization} maxlength="200" autocomplete="off" />
  </label>
  <label class="sh-field">
    {$t('shop.leads.field.message')}
    <textarea class="sh-input" bind:value={message} maxlength="4000"></textarea>
  </label>
  {#if !canSave && name.trim()}<p class="nl-hint">{$t('shop.leads.new.needContact')}</p>{/if}
  {#if error}<p class="nl-err" role="alert">{error}</p>{/if}
  <button type="submit" class="sh-btn sh-btn-primary sh-btn-lg" disabled={!canSave || busy}>{$t('shop.leads.new.save')}</button>
</form>

<style>
  .nl {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .nl-title {
    font-size: 22px;
  }
  .nl-hint {
    margin: 0;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .nl-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
  }
  .nl-err {
    margin: 0;
    color: var(--sh-warn);
    font-size: 14px;
  }
</style>
