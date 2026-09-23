<!--
  MoneyInput — an amount and the currency it is typed in
  (docs/PLAN_MULTI_CURRENCY.md §1.1: "you write in your currency").

  The currency defaults to the writer's own. When it differs from the rikma's,
  a line under the field says what the rikma will record, at today's rate —
  the conversion happens on the server (`normalizeEntry`), this is only the
  preview, so nobody is surprised by the number that shows up on the lev.

  Send `currency` to the action as `entryCurrency`, beside the amount.

  @example
    <MoneyInput bind:value={total} bind:currency={entryCurrency} label={$t('…')} />
    executeAction('createSale', { total, entryCurrency, … })
-->
<script lang="ts">
  import { t } from '$lib/translations';
  import { useMoney, useRikmaCurrency } from '$lib/money/context.svelte';
  import { DEFAULT_CURRENCY, normalizeCode } from '$lib/money/currencies.js';
  import { convert } from '$lib/money/convert.js';
  import { formatMoney } from '$lib/money/format.js';
  import CurrencyPicker from './CurrencyPicker.svelte';

  type Props = {
    value: number | string | null;
    /** The currency typed in. Starts as the writer's own when not given. */
    currency?: string;
    /** The rikma's currency; omitted ⇒ the enclosing rikma's, else ILS. */
    rikmaCurrency?: string | null;
    label?: string;
    id?: string;
    min?: number;
    step?: number | string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    class?: string;
    oninput?: (value: number | null) => void;
  };

  let {
    value = $bindable(),
    currency = $bindable(),
    rikmaCurrency,
    label,
    id = `money-${Math.random().toString(36).slice(2, 8)}`,
    min = 0,
    step = 'any',
    placeholder,
    required = false,
    disabled = false,
    class: className = '',
    oninput
  }: Props = $props();

  const money = useMoney();
  const enclosing = useRikmaCurrency();

  // The writer's own currency, once — a later change of the reader preference
  // must not silently re-denominate a number already typed.
  if (!normalizeCode(currency)) currency = money.currency;

  const rikma = $derived(normalizeCode(rikmaCurrency) ?? enclosing() ?? DEFAULT_CURRENCY);
  const n = $derived(value === '' || value == null ? null : Number(value));
  const preview = $derived.by(() => {
    if (n == null || !Number.isFinite(n) || !currency || currency === rikma) return null;
    const c = convert(n, currency, rikma, money.fx);
    return c === null
      ? { text: $t('money.noRate'), ok: false }
      : { text: $t('money.inRikma', { amount: formatMoney(c, rikma, money.lang) }), ok: true };
  });
</script>

<div class="money-input {className}">
  {#if label}
    <label for={id} class="block text-sm font-medium mb-1">{label}</label>
  {/if}
  <div class="flex items-stretch gap-1" dir="ltr">
    <input
      {id}
      type="number"
      inputmode="decimal"
      {min}
      {step}
      {placeholder}
      {required}
      {disabled}
      bind:value
      oninput={() => oninput?.(n)}
      class="min-w-0 flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-surface px-2 py-1.5 text-sm"
    />
    <CurrencyPicker bind:value={currency} compact {disabled} ariaLabel={$t('money.currency')} />
  </div>
  {#if preview}
    <p class="text-xs mt-1 {preview.ok ? 'text-zinc-500' : 'text-amber-600'}" role="status">{preview.text}</p>
  {/if}
</div>
