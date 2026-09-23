<!--
  CurrencyPicker — a native <select> of currencies, named in the reader's
  language by Intl ("שקל חדש", "US Dollar"), the common ones first.

  Native on purpose: it is keyboard- and screen-reader-complete for free, and
  on a phone it opens the platform's own wheel/list, which beats any custom
  dropdown for a 60-row list.
-->
<script lang="ts">
  import { t } from '$lib/translations';
  import { useMoney } from '$lib/money/context.svelte';
  import { COMMON_CURRENCIES, SUPPORTED_CURRENCIES } from '$lib/money/currencies.js';
  import { currencyName, currencySymbol } from '$lib/money/format.js';

  type Props = {
    value: string;
    onchange?: (code: string) => void;
    /** Visible label; omit when the surrounding form already labels it (then pass `ariaLabel`). */
    label?: string;
    ariaLabel?: string;
    disabled?: boolean;
    /** Short form for inline money inputs: "₪ ILS" instead of the full name. */
    compact?: boolean;
    id?: string;
    class?: string;
  };

  let {
    value = $bindable(),
    onchange,
    label,
    ariaLabel,
    disabled = false,
    compact = false,
    id,
    class: className = ''
  }: Props = $props();

  const money = useMoney();

  const others = $derived(
    SUPPORTED_CURRENCIES.filter((c) => !COMMON_CURRENCIES.includes(c))
      .map((c) => ({ code: c, name: currencyName(c, money.lang) }))
      .sort((a, b) => a.name.localeCompare(b.name, money.lang))
  );
  // A value outside the supported list (a rikma set to it elsewhere) must still show.
  const extra = $derived(value && !SUPPORTED_CURRENCIES.includes(value) ? [value] : []);

  function text(code: string) {
    const sym = currencySymbol(code, money.lang);
    if (compact) return sym === code ? code : `${sym} ${code}`;
    return `${currencyName(code, money.lang)} (${sym === code ? code : `${sym} ${code}`})`;
  }
</script>

{#if label}
  <label class="block text-sm font-medium mb-1" for={id}>{label}</label>
{/if}
<select
  {id}
  class="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-surface px-2 py-1.5 text-sm {className}"
  aria-label={label ? undefined : (ariaLabel ?? $t('money.currency'))}
  {disabled}
  bind:value
  onchange={() => onchange?.(value)}
>
  {#each extra as code (code)}
    <option value={code}>{text(code)}</option>
  {/each}
  <optgroup label={$t('money.common')}>
    {#each COMMON_CURRENCIES as code (code)}
      <option value={code}>{text(code)}</option>
    {/each}
  </optgroup>
  <optgroup label={$t('money.all')}>
    {#each others as o (o.code)}
      <option value={o.code}>{text(o.code)}</option>
    {/each}
  </optgroup>
</select>
