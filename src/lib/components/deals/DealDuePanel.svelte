<!--
  DealDuePanel — what a wish deal costs, part by part (QA_CONCIERGE_E2E C-14).

  Each part is billed by the hours its rikma approved, never above the price agreed for it.
  The agreed price is shown as the ceiling, so nobody reads the approved figure as a
  discount someone took — it is the same number the partners' shares follow.
-->
<script lang="ts">
  import Money from '$lib/components/money/Money.svelte';
  import Panel from '$lib/components/Panel.svelte';
  import { t } from '$lib/translations';
  import type { DealDue } from '$lib/sheirut/dealDue';
  import { displayHours } from '$lib/timers/precision';

  let { due }: { due: DealDue } = $props();

  const hours = (n: number | undefined) => String(displayHours(n));
</script>

<Panel title={$t('deals.due.title')}>
  <p class="dd-explain">{$t('deals.due.explain')}</p>

  <ul class="dd-lines">
    {#each due.lines as line (line.key)}
      <li class="dd-line">
        <div class="dd-head">
          <span class="dd-name">{line.name}</span>
          {#if line.providerName}<span class="dd-who">· {line.providerName}</span>{/if}
        </div>
        <div class="dd-nums">
          <span class="dd-due"><Money amount={line.due} /></span>
          <span class="dd-cap">{$t('deals.due.capLabel')} <Money amount={line.cap} /></span>
        </div>
        <div class="dd-meta">
          {#if line.kind === 'resource'}
            <span>{$t('deals.due.resource')}</span>
          {:else}
            <span>{$t('deals.due.hours', { approved: hours(line.approvedHours), agreed: hours(line.agreedHours) })}</span>
            <span class="dd-chip {line.closed ? 'done' : 'open'}">
              {line.matched === false
                ? $t('deals.due.notStarted')
                : line.closed
                  ? $t('deals.due.closed')
                  : $t('deals.due.open')}
            </span>
          {/if}
        </div>
        {#if line.overrun > 0}
          <div class="dd-overrun">{$t('deals.due.overrun')} <Money amount={line.overrun} /></div>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="dd-sum">
    <div class="dd-row strong">
      <span>{$t('deals.due.total')}</span>
      <span><Money amount={due.due} /></span>
    </div>
    <div class="dd-row">
      <span>{$t('deals.due.cap')}</span>
      <span><Money amount={due.cap} /></span>
    </div>
    {#if due.unused > 0}
      <div class="dd-row">
        <span>{$t('deals.due.unused')}</span>
        <span><Money amount={due.unused} /></span>
      </div>
    {/if}
    {#if due.excess > 0}
      <div class="dd-row warn">
        <span>{$t('deals.due.excess')}</span>
        <span><Money amount={due.excess} /></span>
      </div>
    {/if}
  </div>

  <p class="dd-status {due.final ? 'final' : ''}">
    {due.final ? $t('deals.due.final') : $t('deals.due.running')}
  </p>
</Panel>

<style>
  .dd-explain { font-size: 12px; color: var(--gold); line-height: 1.5; margin: 0 0 12px; }
  .dd-lines { list-style: none; margin: 0; padding: 0; }
  .dd-line { padding: 10px 0; border-bottom: 1px solid var(--border); }
  .dd-line:last-child { border-bottom: none; }
  .dd-head { font-size: 13px; font-weight: 700; color: var(--text); }
  .dd-who { font-weight: 400; color: var(--gold-l); margin-inline-start: 4px; }
  .dd-nums { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-top: 4px; }
  .dd-due { font-size: 15px; font-weight: 800; color: var(--gold-l); }
  .dd-cap { font-size: 11px; color: var(--gold); }
  .dd-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; font-size: 11px; color: var(--gold); }
  .dd-chip { padding: 1px 8px; border-radius: 99px; font-weight: 700; }
  .dd-chip.done { background: rgba(74, 222, 128, 0.15); color: #4ade80; }
  .dd-chip.open { background: var(--gold-d); color: var(--gold-l); }
  .dd-overrun { margin-top: 4px; font-size: 11px; color: var(--pink-l); }
  .dd-sum { margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border-g); }
  .dd-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; color: var(--gold); }
  .dd-row.strong { font-size: 14px; font-weight: 800; color: var(--gold-l); }
  .dd-row.warn { color: var(--pink-l); }
  .dd-status { margin: 10px 0 0; font-size: 11px; color: var(--gold); line-height: 1.5; }
  .dd-status.final { color: #4ade80; }
</style>
