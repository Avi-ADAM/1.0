<!--
  DealEditsPanel — requests for more hours (or another rate) on the parts of a wish deal
  (QA_CONCIERGE_E2E C-14, $lib/sheirut/dealEdit).

  A version that raises a part above what the customer agreed waits for her signature: her
  silence is not her yes. She approves the version on the table or puts her own hours and
  rate on it, with a reason — never a flat "no". The members see the same list read-only;
  they sign in their heart, as with any proposal in the rikma.
-->
<script lang="ts">
  import Money from '$lib/components/money/Money.svelte';
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import type { DealEditView } from '$lib/sheirut/dealEdit';

  let {
    edits,
    isCustomer = false,
    busy = false,
    onSign,
    onCounter
  }: {
    edits: DealEditView[];
    isCustomer?: boolean;
    busy?: boolean;
    onSign?: (decisionId: string) => void | Promise<void>;
    onCounter?: (decisionId: string, terms: { hours: number | null; rate: number | null; why: string }) => void | Promise<void>;
  } = $props();

  /** Which request has its counter form open, and what is typed in it. */
  let openFor = $state<string | null>(null);
  let hours = $state('');
  let rate = $state('');
  let why = $state('');

  function openCounter(e: DealEditView) {
    openFor = e.decisionId;
    hours = String(e.standing.hm ?? e.missionHours ?? '');
    rate = String(e.standing.price ?? e.missionRate ?? '');
    why = '';
  }

  const toNum = (s: string) => (String(s).trim() === '' ? null : Number(s));
  const fmtH = (n: number | null | undefined) => String(Math.round((Number(n) || 0) * 100) / 100);
  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '');

  async function sendCounter(e: DealEditView) {
    await onCounter?.(e.decisionId, { hours: toNum(hours), rate: toNum(rate), why: why.trim() });
    openFor = null;
  }
</script>

<Panel title={$t('deals.edit.title')}>
  <p class="de-explain">{$t('deals.edit.explain')}</p>

  {#each edits as e (e.decisionId)}
    <div class="de-item">
      <div class="de-head">
        <span class="de-name">{e.missionName}</span>
        {#if e.providerName}<span class="de-who">· {e.providerName}</span>{/if}
      </div>

      <div class="de-row">
        <span>{$t('deals.edit.agreed', { hours: fmtH(e.agreedHours) })}</span>
        <span><Money amount={e.cap} /></span>
      </div>
      <div class="de-row strong">
        <span>
          {$t('deals.edit.proposed', { hours: fmtH(e.standing.hm ?? e.missionHours) })}
          × <Money amount={e.standing.price ?? e.missionRate} />
        </span>
        <span><Money amount={e.standing.value} /></span>
      </div>
      {#if e.raise > 0}
        <div class="de-raise">{$t('deals.edit.raise')} <Money amount={e.raise} /></div>
      {/if}
      {#if e.standing.why}<p class="de-why">“{e.standing.why}”</p>{/if}

      {#if e.rounds.length > 1}
        <ol class="de-history">
          {#each e.rounds.slice(0, -1) as r (r.order)}
            <li>
              {$t('deals.edit.round', { order: String(r.order) })}
              {#if r.proposedByName}· {r.proposedByName}{/if}:
              {fmtH(r.hm ?? e.missionHours)} × <Money amount={r.price ?? e.missionRate} />
              {#if r.why}— {r.why}{/if}
            </li>
          {/each}
        </ol>
      {/if}

      <p class="de-status">
        {#if !e.needsCustomer}
          {$t('deals.edit.noRaise')}
        {:else if e.customersPending.length > 0}
          {isCustomer && !e.viewerSigned ? $t('deals.edit.waitsForYou') : $t('deals.edit.waitsForCustomer')}
        {:else if e.membersPending.length > 0 && !e.membersMatured}
          {$t('deals.edit.waitsForRikma', { when: fmtDate(e.deadline) })}
        {:else}
          {$t('deals.edit.applying')}
        {/if}
      </p>

      {#if isCustomer && e.needsCustomer && !e.viewerSigned}
        {#if openFor === e.decisionId}
          <div class="de-form">
            <label>
              <span>{$t('deals.edit.hours')}</span>
              <input type="number" min="0" step="0.25" bind:value={hours} />
            </label>
            <label>
              <span>{$t('deals.edit.rate')}</span>
              <input type="number" min="0" step="1" bind:value={rate} />
            </label>
            <label class="wide">
              <span>{$t('deals.edit.why')}</span>
              <textarea rows="2" bind:value={why} placeholder={$t('deals.edit.whyPh')}></textarea>
            </label>
            <div class="de-actions">
              <button class="de-btn primary" disabled={busy || why.trim().length < 8} onclick={() => sendCounter(e)}>
                {$t('deals.edit.send')}
              </button>
              <button class="de-btn" disabled={busy} onclick={() => (openFor = null)}>{$t('deals.edit.back')}</button>
            </div>
          </div>
        {:else}
          <div class="de-actions">
            <button class="de-btn primary" disabled={busy} onclick={() => onSign?.(e.decisionId)}>
              {$t('deals.edit.approve')}
            </button>
            <button class="de-btn" disabled={busy} onclick={() => openCounter(e)}>{$t('deals.edit.counter')}</button>
          </div>
        {/if}
      {/if}
    </div>
  {/each}
</Panel>

<style>
  .de-explain { font-size: 12px; color: var(--gold); line-height: 1.5; margin: 0 0 12px; }
  .de-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
  .de-item:last-child { border-bottom: none; }
  .de-head { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .de-who { font-weight: 400; color: var(--gold-l); margin-inline-start: 4px; }
  .de-row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--gold); padding: 2px 0; }
  .de-row.strong { font-size: 13px; font-weight: 800; color: var(--gold-l); }
  .de-raise { font-size: 12px; font-weight: 700; color: var(--pink-l); margin-top: 2px; }
  .de-why { font-size: 12px; color: var(--text); font-style: italic; margin: 6px 0 0; }
  .de-history { margin: 6px 0 0; padding-inline-start: 18px; font-size: 11px; color: var(--gold); }
  .de-status { font-size: 11px; color: var(--gold-l); margin: 8px 0 0; }
  .de-form { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
  .de-form label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--gold); }
  .de-form label.wide { grid-column: 1 / -1; }
  .de-form input,
  .de-form textarea {
    background: var(--s3);
    color: var(--text);
    border: 1px solid var(--border-g);
    border-radius: 8px;
    padding: 6px 8px;
    font-size: 13px;
    font-family: inherit;
  }
  .de-actions { grid-column: 1 / -1; display: flex; gap: 8px; margin-top: 10px; }
  .de-btn {
    flex: 1;
    padding: 9px;
    border-radius: 10px;
    border: 1px solid var(--border-g);
    background: transparent;
    color: var(--gold-l);
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
  }
  .de-btn.primary { background: linear-gradient(135deg, var(--pink), var(--pink-l)); border: none; color: #fff; }
  .de-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
