<script lang="ts">
  /**
   * The owner changes what her published wish asks for — title, description, dates,
   * online or not, place (`updateWishTerms`, PLAN_DIRECT_OFFER §4.3).
   *
   * Said before she saves, not after: whoever already signed a part is asked again,
   * as after a counter. That is the negotiation, not a side effect.
   */
  import { invalidateAll } from '$app/navigation';
  import { toast } from 'svelte-sonner';
  import { t } from '$lib/translations';
  import { paragraphsHtml as toHtml, plainText as plain } from '$lib/wish/plainText';

  type Wish = {
    id: string;
    name?: string | null;
    longDes?: string | null;
    startDate?: string | null;
    finnishDate?: string | null;
    isOnline?: boolean | null;
    locationHint?: string | null;
  };

  let {
    wish,
    actionKey = 'updateWishTerms',
    noteKey = 'concierge.terms_note'
  }: {
    wish: Wish;
    /** `updateDirectOffer` on an offer the provider still holds: nobody else signed yet. */
    actionKey?: 'updateWishTerms' | 'updateDirectOffer';
    noteKey?: string;
  } = $props();

  const day = (iso: string | null | undefined) => (iso ? String(iso).slice(0, 10) : '');
  let open = $state(false);
  let busy = $state(false);
  let error = $state('');
  let name = $state('');
  let longDes = $state('');
  let startDate = $state('');
  let finnishDate = $state('');
  let isOnline = $state(false);
  let place = $state('');

  function start() {
    name = wish.name ?? '';
    longDes = plain(wish.longDes);
    startDate = day(wish.startDate);
    finnishDate = day(wish.finnishDate);
    isOnline = !!wish.isOnline;
    place = wish.locationHint ?? '';
    error = '';
    open = true;
  }

  /** Only what changed — an untouched description stays the HTML it was. */
  function changes(): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (name.trim() !== (wish.name ?? '').trim()) out.name = name.trim();
    if (longDes.trim() !== plain(wish.longDes)) out.longDes = toHtml(longDes.trim());
    if (startDate !== day(wish.startDate)) out.startDate = startDate ? `${startDate}T00:00:00.000Z` : '';
    if (finnishDate !== day(wish.finnishDate)) out.finnishDate = finnishDate ? `${finnishDate}T00:00:00.000Z` : '';
    if (isOnline !== !!wish.isOnline) out.isOnline = isOnline;
    if (place.trim() !== (wish.locationHint ?? '').trim()) out.location_hint = place.trim();
    return out;
  }

  async function save(e: SubmitEvent) {
    e.preventDefault();
    if (busy) return;
    const params = changes();
    if (Object.keys(params).length === 0) {
      open = false;
      return;
    }
    if (params.name === '') {
      error = $t('concierge.terms_name_required');
      return;
    }
    busy = true;
    error = '';
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionKey, params: { ratsonId: String(wish.id), ...params } })
      });
      const out = await res.json();
      if (!out?.success) throw new Error(out?.error?.message || out?.error || 'failed');
      const reopened = Number(out?.data?.reopened ?? 0);
      toast.success(reopened > 0 ? $t('concierge.terms_saved_reopened', { count: reopened }) : $t('concierge.terms_saved'));
      open = false;
      await invalidateAll();
    } catch (err) {
      console.error('[WishTermsEditor] save failed:', err);
      error = $t('concierge.terms_error');
    } finally {
      busy = false;
    }
  }
</script>

{#if !open}
  <button type="button" class="wt-open" onclick={start}>✎ {$t('concierge.terms_edit')}</button>
{:else}
  <form class="wt-form" onsubmit={save} aria-label={$t('concierge.terms_edit')}>
    <p class="wt-note">{$t(noteKey)}</p>
    <label>
      {$t('concierge.terms_name')}
      <input type="text" bind:value={name} maxlength="200" required />
    </label>
    <label>
      {$t('concierge.terms_desc')}
      <textarea rows="4" bind:value={longDes}></textarea>
    </label>
    <div class="wt-row">
      <label>
        {$t('concierge.terms_start')}
        <input type="date" bind:value={startDate} />
      </label>
      <label>
        {$t('concierge.terms_end')}
        <input type="date" bind:value={finnishDate} />
      </label>
    </div>
    <label class="wt-check">
      <input type="checkbox" bind:checked={isOnline} />
      {$t('concierge.terms_online')}
    </label>
    {#if !isOnline}
      <label>
        {$t('concierge.terms_place')}
        <input type="text" bind:value={place} maxlength="200" />
      </label>
    {/if}
    {#if error}<p class="wt-error" role="alert">{error}</p>{/if}
    <div class="wt-actions">
      <button type="submit" class="wt-save" disabled={busy}>{busy ? '⏳' : $t('concierge.terms_save')}</button>
      <button type="button" class="wt-cancel" disabled={busy} onclick={() => (open = false)}>{$t('concierge.terms_cancel')}</button>
    </div>
  </form>
{/if}

<style>
  .wt-open,
  .wt-cancel {
    background: transparent;
    border: 1px solid rgb(var(--cg-gold-rgb, 200 150 12) / 0.22);
    color: var(--cg-muted, var(--tm));
    padding: 7px 12px;
    border-radius: 12px;
    font-size: 12px;
    cursor: pointer;
  }
  .wt-open:hover,
  .wt-cancel:hover {
    color: var(--cg-ink, var(--text));
    border-color: rgb(var(--cg-gold-rgb, 200 150 12) / 0.3);
  }
  .wt-form {
    margin-top: 12px;
    padding: 12px;
    border: 1px solid rgb(var(--cg-gold-rgb, 200 150 12) / 0.25);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .wt-note {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--cg-goldhi, var(--gold-l));
  }
  .wt-form label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: var(--cg-muted, var(--tm));
  }
  .wt-form input[type='text'],
  .wt-form input[type='date'],
  .wt-form textarea {
    background: var(--cg-s1, var(--s2));
    color: var(--cg-ink, var(--text));
    border: 1px solid rgb(var(--cg-gold-rgb, 200 150 12) / 0.25);
    border-radius: 8px;
    padding: 8px 10px;
    font: inherit;
    font-size: 14px;
  }
  .wt-form input:focus-visible,
  .wt-form textarea:focus-visible,
  .wt-open:focus-visible,
  .wt-save:focus-visible,
  .wt-cancel:focus-visible {
    outline: 2px solid var(--cg-goldhi, var(--gold-l));
    outline-offset: 2px;
  }
  .wt-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  .wt-row label {
    flex: 1 1 140px;
  }
  .wt-form .wt-check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--cg-ink, var(--text));
  }
  .wt-error {
    margin: 0;
    font-size: 12px;
    color: var(--cg-pink, var(--pink-l));
  }
  .wt-actions {
    display: flex;
    gap: 8px;
  }
  .wt-save {
    border: none;
    cursor: pointer;
    border-radius: 12px;
    padding: 8px 16px;
    font-weight: 700;
    font-size: 13px;
    color: var(--cg-on-cta, var(--s1));
    background: linear-gradient(135deg, var(--cg-g-pinkd, var(--gold-l)), var(--cg-g-pink, var(--pink)));
  }
  .wt-save:disabled,
  .wt-cancel:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
