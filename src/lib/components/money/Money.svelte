<!--
  Money — an amount, in the reader's currency, and saying so
  (docs/PLAN_MULTI_CURRENCY.md §1.3).

  The same promise `<Translated>` makes for words: a conversion is never
  presented as what someone wrote. When the reader's currency differs from the
  stored one the number is prefixed `≈`, and the stored amount, the day of the
  rate, and — when the writer typed it in a third currency — what they typed,
  are all in the tooltip (or inline, with `detail="inline"`).

  No rate for a currency ⇒ the stored amount in its own currency, unconverted.
  Never a guessed number.

  `<bdi>` because an LTR "$1,200" dropped into a Hebrew sentence (or "₪" into
  an English one) reorders the surrounding run without it.

  @example A sale in its rikma's currency.
    <Money amount={sale.in} currency={rikmaCur} entry={sale} />

  @example Legacy call sites that only ever knew shekels.
    <Money amount={price} />
-->
<script lang="ts">
  import { t } from '$lib/translations';
  import { useMoney, useProjectCurrency, useRikmaCurrency } from '$lib/money/context.svelte';
  import { entryOriginal } from '$lib/money/convert.js';
  import { DEFAULT_CURRENCY, normalizeCode } from '$lib/money/currencies.js';
  import { formatMoney, type FormatOpts } from '$lib/money/format.js';

  type Props = {
    /** The stored amount — in `currency`. */
    amount: number | string | null | undefined;
    /**
     * The currency `amount` is stored in: the rikma's. Omitted ⇒ the enclosing
     * rikma's (moach pages provide it), else legacy ILS.
     */
    currency?: string | null;
    /**
     * The rikma this amount belongs to, for a page that shows several at once
     * (the heart). Resolved through the page's project→currency map.
     */
    projectId?: string | number | null;
    /** The row, when it may carry `entryCurrency`/`entryRate` (what the writer typed). */
    // Any row: typed entity interfaces share no declared key with this shape, so a
    // narrower type rejects them. Only `entryCurrency` / `entryRate` are read.
    entry?: any;
    fraction?: FormatOpts['fraction'];
    notation?: FormatOpts['notation'];
    /** `tooltip` (default) or `inline`: "≈$40 (₪120)". */
    detail?: 'tooltip' | 'inline';
    class?: string;
  };

  let {
    amount,
    currency,
    projectId,
    entry = null,
    fraction,
    notation,
    detail = 'tooltip',
    class: className = ''
  }: Props = $props();

  const money = useMoney();
  const rikmaCurrency = useRikmaCurrency();
  const projectCurrency = useProjectCurrency();

  const n = $derived(amount == null || amount === '' ? null : Number(amount));
  const from = $derived(
    normalizeCode(currency) ?? projectCurrency(projectId) ?? rikmaCurrency() ?? DEFAULT_CURRENCY
  );
  const v = $derived(money.view(n, from, { fraction, notation }));
  const typed = $derived(entryOriginal(n, entry));
  const typedText = $derived(
    typed && typed.currency !== money.currency
      ? formatMoney(typed.amount, typed.currency, money.lang, { fraction })
      : ''
  );

  const tip = $derived(
    [
      v.converted ? $t('money.converted', { original: v.original, date: money.fx?.date ?? '' }) : '',
      typedText ? $t('money.writtenAs', { original: typedText }) : ''
    ]
      .filter(Boolean)
      .join(' · ')
  );
</script>

{#if n !== null && Number.isFinite(n)}
  <bdi class="money {className}" title={tip || undefined}>{v.text}</bdi>{#if detail === 'inline' && v.converted}
    <bdi class="money-orig">({v.original})</bdi>
  {/if}
{/if}

<style>
  .money {
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .money-orig {
    opacity: 0.7;
    font-size: 0.85em;
    white-space: nowrap;
  }
</style>
