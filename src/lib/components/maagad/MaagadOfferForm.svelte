<script lang="ts">
  import { t } from '$lib/translations';

  type Props = {
    maagadId: string;
    onDone?: (offerId: string) => void;
    onCancel?: () => void;
  };

  let { maagadId, onDone, onCancel }: Props = $props();

  let title = $state('');
  let description = $state('');
  let unitPrice = $state<number | null>(null);
  let minParticipants = $state<number | null>(null);
  let maxParticipants = $state<number | null>(null);
  let signDeadline = $state('');
  let recurrence = $state<'one_time' | 'weekly' | 'biweekly' | 'monthly'>('one_time');
  let cancellationTerms = $state('');

  let submitting = $state(false);
  let errorMsg = $state('');

  const valid = $derived(
    title.trim().length > 0 &&
      unitPrice !== null &&
      unitPrice >= 0 &&
      minParticipants !== null &&
      minParticipants >= 2 &&
      (maxParticipants === null || maxParticipants >= (minParticipants ?? 2)) &&
      signDeadline !== '' &&
      new Date(signDeadline).getTime() > Date.now()
  );

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!valid || submitting) return;
    submitting = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'createMaagadOffer',
          params: {
            maagadId,
            title: title.trim(),
            description: description.trim() || undefined,
            unitPrice,
            minParticipants,
            maxParticipants: maxParticipants ?? undefined,
            signDeadline: new Date(signDeadline).toISOString(),
            recurrence,
            cancellationTerms: cancellationTerms.trim() || undefined
          }
        })
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || json?.message || 'failed');
      }
      onDone?.(json?.data?.offerId ?? '');
    } catch (e: any) {
      errorMsg = e?.message || String(e);
    } finally {
      submitting = false;
    }
  }
</script>

<form class="offer-form" onsubmit={submit}>
  <h3>{$t('demand.offer_form_title')}</h3>

  <label>
    <span>{$t('demand.field_title')} *</span>
    <input type="text" bind:value={title} required maxlength="120" />
  </label>

  <label>
    <span>{$t('demand.field_desc')}</span>
    <textarea bind:value={description} rows="3"></textarea>
  </label>

  <div class="grid2">
    <label>
      <span>{$t('demand.field_price')} *</span>
      <input type="number" bind:value={unitPrice} min="0" step="0.01" required />
    </label>
    <label>
      <span>{$t('demand.field_deadline')} *</span>
      <input type="datetime-local" bind:value={signDeadline} required />
    </label>
    <label>
      <span>{$t('demand.field_min')} *</span>
      <input type="number" bind:value={minParticipants} min="2" step="1" required />
    </label>
    <label>
      <span>{$t('demand.field_max')}</span>
      <input type="number" bind:value={maxParticipants} min={minParticipants ?? 2} step="1" />
    </label>
  </div>

  <label>
    <span>{$t('demand.field_recurrence')}</span>
    <select bind:value={recurrence}>
      <option value="one_time">{$t('demand.rec_one_time')}</option>
      <option value="weekly">{$t('demand.rec_weekly')}</option>
      <option value="biweekly">{$t('demand.rec_biweekly')}</option>
      <option value="monthly">{$t('demand.rec_monthly')}</option>
    </select>
  </label>

  <label>
    <span>{$t('demand.field_cancellation')}</span>
    <textarea bind:value={cancellationTerms} rows="2" placeholder={$t('demand.cancellation_ph')}></textarea>
  </label>

  {#if errorMsg}
    <p class="error">{errorMsg}</p>
  {/if}

  <div class="actions">
    <button type="submit" class="primary" disabled={!valid || submitting}>
      {submitting ? '…' : $t('demand.submit_offer')}
    </button>
    {#if onCancel}
      <button type="button" class="ghost" onclick={() => onCancel?.()}>
        {$t('demand.cancel')}
      </button>
    {/if}
  </div>
</form>

<style>
  .offer-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    background: rgba(120, 120, 160, 0.07);
    border: 1px solid rgba(120, 120, 160, 0.2);
    border-radius: 1rem;
    padding: 1rem;
  }
  h3 {
    font-weight: 700;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.85rem;
  }
  input,
  textarea,
  select {
    border: 1px solid rgba(120, 120, 160, 0.3);
    border-radius: 0.6rem;
    padding: 0.45rem 0.6rem;
    background: white;
    font: inherit;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.6rem;
  }
  @media (max-width: 560px) {
    .grid2 {
      grid-template-columns: 1fr;
    }
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .primary {
    background: #7c3aed;
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    font-weight: 600;
  }
  .primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ghost {
    background: transparent;
    border: 1px solid rgba(120, 120, 160, 0.35);
    border-radius: 9999px;
    padding: 0.5rem 1.1rem;
    cursor: pointer;
  }
  .error {
    color: #dc2626;
    font-size: 0.85rem;
  }
</style>
