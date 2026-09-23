<!--
  CurrencySymbol — the symbol of the currency an input's amount is written in:
  the given one, else the enclosing rikma's, else legacy ₪.

  For the unit label beside a number field. A field whose writer should be able
  to pick another currency wants `<MoneyInput>` instead.
-->
<script lang="ts">
  import { useMoney, useRikmaCurrency } from '$lib/money/context.svelte';
  import { DEFAULT_CURRENCY, normalizeCode } from '$lib/money/currencies.js';
  import { currencySymbol } from '$lib/money/format.js';

  let { currency, class: className = '' }: { currency?: string | null; class?: string } = $props();

  const money = useMoney();
  const rikma = useRikmaCurrency();
  const code = $derived(normalizeCode(currency) ?? rikma() ?? DEFAULT_CURRENCY);
</script>

<span class={className} title={code}>{currencySymbol(code, money.lang)}</span>
