<script lang="ts">
  /**
   * Write a direct offer (PLAN_DIRECT_OFFER P3): who it is for, what, when, where,
   * and the parts you will do at your price. Nothing is sent from here — the next
   * screen makes the link, when you are ready.
   */
  import { goto } from '$app/navigation';
  import { t } from '$lib/translations';
  import Money from '$lib/components/money/Money.svelte';
  import { cleanLines, missionPrice, offerTotal, resourcePrice, MAX_LINES } from '$lib/offer/directOffer';
  import { paragraphsHtml } from '$lib/wish/plainText';

  type M = { name: string; hours: number | null; ratePerHour: number | null; notes: string };
  type R = { name: string; quantity: number | null; unitPrice: number | null; notes: string };

  let recipientHint = $state('');
  let recipientEmail = $state('');
  let name = $state('');
  let longDes = $state('');
  let startDate = $state('');
  let finnishDate = $state('');
  let isOnline = $state(false);
  let place = $state('');
  let missions = $state<M[]>([{ name: '', hours: null, ratePerHour: null, notes: '' }]);
  let resources = $state<R[]>([]);
  let busy = $state(false);
  let error = $state('');

  const filledM = $derived(missions.filter((m) => m.name.trim() || m.hours || m.ratePerHour));
  const filledR = $derived(resources.filter((r) => r.name.trim() || r.quantity || r.unitPrice));
  const checked = $derived(cleanLines({ missions: filledM, resources: filledR }));
  const total = $derived('lines' in checked ? offerTotal(checked.lines) : null);
  const count = $derived(missions.length + resources.length);

  const addMission = () => (missions = [...missions, { name: '', hours: null, ratePerHour: null, notes: '' }]);
  const addResource = () => (resources = [...resources, { name: '', quantity: null, unitPrice: null, notes: '' }]);
  const dropMission = (i: number) => (missions = missions.filter((_, j) => j !== i));
  const dropResource = (i: number) => (resources = resources.filter((_, j) => j !== i));

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (busy) return;
    error = '';
    if (!recipientHint.trim()) return void (error = $t('directOffer.compose.err.recipient'));
    if (!name.trim()) return void (error = $t('directOffer.compose.err.title'));
    if ('refusal' in checked) return void (error = $t(`directOffer.compose.err.${checked.refusal}`));
    busy = true;
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'draftDirectOffer',
          params: {
            recipientHint: recipientHint.trim(),
            ...(recipientEmail.trim() ? { recipientEmail: recipientEmail.trim() } : {}),
            name: name.trim(),
            longDes: paragraphsHtml(longDes.trim()),
            ...(startDate ? { startDate: `${startDate}T00:00:00.000Z` } : {}),
            ...(finnishDate ? { finnishDate: `${finnishDate}T00:00:00.000Z` } : {}),
            isOnline,
            ...(!isOnline && place.trim() ? { location_hint: place.trim() } : {}),
            missions: checked.lines.missions,
            resources: checked.lines.resources
          }
        })
      });
      const out = await res.json();
      const id = out?.data?.ratsonId ?? out?.data?.data?.ratsonId;
      if (!out?.success || !id) throw new Error(out?.error?.message || 'failed');
      await goto(`/deals/offers/${id}`);
    } catch (err) {
      console.error('[deals/offers/new] could not save the offer:', err);
      error = $t('directOffer.compose.err.failed');
      busy = false;
    }
  }
</script>

<svelte:head>
  <title>{$t('directOffer.compose.title')}</title>
</svelte:head>

<main class="oc">
  <a class="oc-back" href="/deals/offers">← {$t('directOffer.compose.back')}</a>
  <h1>{$t('directOffer.compose.title')}</h1>
  <p class="oc-intro">{$t('directOffer.compose.intro')}</p>

  <form onsubmit={submit} novalidate>
    <fieldset>
      <legend>{$t('directOffer.compose.forWhom')}</legend>
      <label>
        {$t('directOffer.compose.recipient')}
        <input type="text" bind:value={recipientHint} maxlength="120" required />
        <small>{$t('directOffer.compose.recipientHint')}</small>
      </label>
      <label>
        {$t('directOffer.compose.email')}
        <input type="email" bind:value={recipientEmail} maxlength="200" autocomplete="off" />
        <small>{$t('directOffer.compose.emailHint')}</small>
      </label>
    </fieldset>

    <fieldset>
      <legend>{$t('directOffer.compose.what')}</legend>
      <label>
        {$t('directOffer.compose.name')}
        <input type="text" bind:value={name} maxlength="200" required />
      </label>
      <label>
        {$t('directOffer.compose.desc')}
        <textarea rows="5" bind:value={longDes}></textarea>
      </label>
      <div class="oc-row">
        <label>
          {$t('directOffer.compose.start')}
          <input type="date" bind:value={startDate} />
        </label>
        <label>
          {$t('directOffer.compose.end')}
          <input type="date" bind:value={finnishDate} />
        </label>
      </div>
      <label class="oc-check">
        <input type="checkbox" bind:checked={isOnline} />
        {$t('directOffer.compose.online')}
      </label>
      {#if !isOnline}
        <label>
          {$t('directOffer.compose.place')}
          <input type="text" bind:value={place} maxlength="200" />
        </label>
      {/if}
    </fieldset>

    <fieldset>
      <legend>{$t('directOffer.compose.parts')}</legend>
      <p class="oc-hint">{$t('directOffer.compose.partsHint')}</p>

      {#each missions as m, i (i)}
        <div class="oc-line">
          <label class="oc-grow">
            {$t('directOffer.compose.missionName')}
            <input type="text" bind:value={m.name} maxlength="120" />
          </label>
          <label>
            {$t('directOffer.compose.hours')}
            <input type="number" min="0" step="0.5" bind:value={m.hours} />
          </label>
          <label>
            {$t('directOffer.compose.rate')}
            <input type="number" min="0" step="1" bind:value={m.ratePerHour} />
          </label>
          <span class="oc-price">
            {#if m.hours && m.ratePerHour != null}<Money amount={missionPrice({ hours: m.hours, ratePerHour: m.ratePerHour })} />{/if}
          </span>
          <button type="button" class="oc-drop" onclick={() => dropMission(i)} aria-label={$t('directOffer.compose.remove')}>×</button>
        </div>
      {/each}

      {#each resources as r, i (i)}
        <div class="oc-line">
          <label class="oc-grow">
            {$t('directOffer.compose.resourceName')}
            <input type="text" bind:value={r.name} maxlength="120" />
          </label>
          <label>
            {$t('directOffer.compose.qty')}
            <input type="number" min="0" step="1" bind:value={r.quantity} />
          </label>
          <label>
            {$t('directOffer.compose.unitPrice')}
            <input type="number" min="0" step="1" bind:value={r.unitPrice} />
          </label>
          <span class="oc-price">
            {#if r.quantity && r.unitPrice != null}<Money amount={resourcePrice({ quantity: r.quantity, unitPrice: r.unitPrice })} />{/if}
          </span>
          <button type="button" class="oc-drop" onclick={() => dropResource(i)} aria-label={$t('directOffer.compose.remove')}>×</button>
        </div>
      {/each}

      <div class="oc-add">
        <button type="button" onclick={addMission} disabled={count >= MAX_LINES}>+ {$t('directOffer.compose.addMission')}</button>
        <button type="button" onclick={addResource} disabled={count >= MAX_LINES}>+ {$t('directOffer.compose.addResource')}</button>
      </div>

      <p class="oc-total">
        <span>{$t('directOffer.compose.total')}</span>
        <b>{#if total != null}<Money amount={total} />{:else}—{/if}</b>
      </p>
    </fieldset>

    {#if error}<p class="oc-error" role="alert">{error}</p>{/if}
    <button type="submit" class="oc-save" disabled={busy}>{busy ? '⏳' : $t('directOffer.compose.save')}</button>
    <p class="oc-small">{$t('directOffer.compose.saveHint')}</p>
  </form>
</main>

<style>
  .oc {
    max-width: 760px;
    margin: 0 auto;
    padding: 24px 16px 96px;
    color: var(--text);
  }
  .oc-back {
    color: var(--tm);
    font-size: 13px;
    text-decoration: none;
  }
  h1 {
    margin: 18px 0 6px;
    font-size: 24px;
  }
  .oc-intro,
  .oc-hint,
  .oc-small {
    color: var(--tm);
    font-size: 14px;
    line-height: 1.6;
  }
  fieldset {
    border: 1px solid var(--border-g);
    border-radius: 14px;
    padding: 14px 16px;
    margin: 0 0 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--s1);
  }
  legend {
    padding: 0 6px;
    color: var(--gold-l);
    font-weight: 700;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
    color: var(--tm);
  }
  small {
    font-size: 12px;
    color: var(--tm);
  }
  input[type='text'],
  input[type='email'],
  input[type='date'],
  input[type='number'],
  textarea {
    background: var(--s2);
    color: var(--text);
    border: 1px solid var(--border-g);
    border-radius: 8px;
    padding: 8px 10px;
    font: inherit;
    font-size: 14px;
    min-width: 0;
  }
  input:focus-visible,
  textarea:focus-visible,
  button:focus-visible {
    outline: 2px solid var(--gold-l);
    outline-offset: 2px;
  }
  .oc-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
  .oc-row label {
    flex: 1 1 160px;
  }
  .oc-check {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    color: var(--text);
  }
  .oc-line {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }
  .oc-line label {
    flex: 0 1 110px;
  }
  .oc-line .oc-grow {
    flex: 1 1 200px;
  }
  .oc-price {
    min-width: 80px;
    padding-bottom: 8px;
    color: var(--gold-l);
  }
  .oc-drop {
    background: none;
    border: 1px solid var(--border-g);
    color: var(--tm);
    border-radius: 8px;
    width: 34px;
    height: 34px;
    cursor: pointer;
  }
  .oc-add {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .oc-add button {
    background: none;
    border: 1px dashed var(--border-g);
    color: var(--gold-l);
    padding: 8px 14px;
    border-radius: 10px;
    cursor: pointer;
  }
  .oc-add button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .oc-total {
    display: flex;
    justify-content: space-between;
    margin: 4px 0 0;
    font-size: 16px;
  }
  .oc-error {
    color: var(--pink-l);
  }
  .oc-save {
    min-height: 44px;
    padding: 10px 22px;
    border: none;
    border-radius: 14px;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    color: var(--s1);
    background: linear-gradient(135deg, var(--gold-l), var(--pink));
  }
  .oc-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
