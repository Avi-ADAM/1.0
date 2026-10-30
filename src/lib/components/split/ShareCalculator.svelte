<script>
  /**
   * "If we split this much, who gets what" at today's shares. Only a
   * calculation — the actual split is opened from the sales page.
   */
  import { t } from '$lib/translations';
  import { useFormatMoney } from '$lib/money/context.svelte';

  /**
   * @typedef {Object} Props
   * @property {Array<{ uid: string|number, username: string, p: number, color: string, photo: string|null, initial: string }>} members
   * @property {string} salesHref
   */

  /** @type {Props} */
  let { members, salesHref } = $props();

  const fmt = useFormatMoney();
  /** @type {number|null} */
  let amount = $state(null);
  let has = $derived(Number(amount) > 0);
  let shown = $derived(members.filter((m) => m.p > 0));
</script>

<div class="sc">
  <label class="sc-field">
    <span class="sc-label">{$t('moach.split.calcAmount')}</span>
    <input
      type="number"
      inputmode="decimal"
      min="0"
      step="any"
      bind:value={amount}
      placeholder="0"
      class="sc-input"
    />
  </label>

  {#if has}
    <ul class="sc-list">
      {#each shown as m (m.uid)}
        <li class="sc-row" style="--c: {m.color}">
          <span class="sc-ava" class:initial={!m.photo}>
            {#if m.photo}<img src={m.photo} alt="" loading="lazy" />{:else}{m.initial}{/if}
          </span>
          <span class="sc-name">{m.username}</span>
          <span class="sc-p">{m.p.toFixed(2)}%</span>
          <b class="sc-amt">{fmt((m.p / 100) * Number(amount))}</b>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="sc-empty">{$t('moach.split.calcIntro')}</p>
  {/if}

  <p class="sc-note">
    {$t('moach.split.calcNote')}
    <a href={salesHref} class="sc-link">{$t('moach.split.toSales')}</a>
  </p>
</div>

<style>
  .sc {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    color: var(--surface-ink);
  }
  .sc-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-width: 18rem;
  }
  .sc-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--surface-muted);
  }
  .sc-input {
    width: 100%;
    font-size: 1.25rem;
    font-weight: 700;
    padding: 0.55rem 0.8rem;
    border-radius: 0.75rem;
    border: 1px solid var(--surface-line);
    background: var(--surface-2);
    color: var(--surface-ink);
    font-variant-numeric: tabular-nums;
  }
  .sc-input:focus {
    outline: 2px solid var(--surface-accent);
    outline-offset: 1px;
  }
  .sc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .sc-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    background: var(--surface-2);
    border-inline-start: 4px solid var(--c);
  }
  .sc-ava {
    flex-shrink: 0;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 999px;
    overflow: hidden;
    box-shadow: 0 0 0 2px var(--c);
    display: grid;
    place-items: center;
    font-size: 0.8rem;
  }
  .sc-ava img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .sc-ava.initial {
    background: var(--c);
    color: #fff;
    font-weight: 800;
  }
  .sc-name {
    flex: 1;
    min-width: 0;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sc-p {
    font-size: 0.8rem;
    color: var(--surface-muted);
    font-variant-numeric: tabular-nums;
  }
  .sc-amt {
    min-width: 6rem;
    text-align: end;
    font-variant-numeric: tabular-nums;
  }
  .sc-empty,
  .sc-note {
    margin: 0;
    font-size: 0.85rem;
    color: var(--surface-muted);
  }
  .sc-link {
    color: var(--surface-accent);
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
</style>
