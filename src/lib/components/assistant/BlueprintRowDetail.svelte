<script>
  /**
   * One review row, opened: everything that row will be created with.
   *
   * A mission is created from its description, hours, rate, roles, skills,
   * ways of working and whether it recurs — all of it is here, editable until
   * the click, with quick − / + steppers on hours and rate. A row that already
   * exists shows the same panel locked: it is changed on the site from now on.
   *
   * The panel holds no state of its own. Every keystroke goes up as a raw form
   * value (`onSpec`), and the review screen turns those into the session's ops.
   */
  import { t } from '$lib/translations';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { SPEC_DEFS, effectiveSpec, fieldError, rawOf, rowValue, stepNumber } from '$lib/assistant/reviewEdits';

  /**
   * @typedef {import('$lib/assistant/reviewEdits').RowEdit} RowEdit
   * @typedef {import('$lib/assistant/reviewEdits').Raw} Raw
   * @typedef {Object} Props
   * @property {{ key: string, group: string, label: string, spec?: Record<string, any> }} row
   * @property {RowEdit} [edit] - The owner's pending edits to this row.
   * @property {boolean} readonly
   * @property {string} [currency]
   * @property {string[]} [brings] - Partners: the rows this partner holds.
   * @property {(field: string, raw: Raw | undefined) => void} onSpec
   * @property {(field: string, html: string) => void} onHtml - The rich editor reports every change, the first one included.
   */

  /** @type {Props} */
  let { row, edit, readonly, currency = '', brings = [], onSpec, onHtml } = $props();

  let defs = $derived(SPEC_DEFS[row.group] ?? {});
  let spec = $derived(effectiveSpec(/** @type {any} */ (row), edit));
  let calc = $derived(rowValue(row.group, spec));

  /** What a control shows: the owner's typing, else the stored value. */
  const val = (/** @type {string} */ field) => edit?.spec?.[field] ?? rawOf(defs[field], row.spec?.[field]);
  const text = (/** @type {string} */ field) => String(val(field));
  const checked = (/** @type {string} */ field) => val(field) === true;
  const err = (/** @type {string} */ field) => fieldError(row.group, field, edit?.spec?.[field]);
  const border = (/** @type {string} */ field) => (err(field) ? 'border-red-500' : 'border-barbi/30');
  const fmt = (/** @type {number} */ n) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  function bump(/** @type {string} */ field, /** @type {number} */ delta, /** @type {number} */ max) {
    onSpec(field, stepNumber(edit?.spec?.[field], row.spec?.[field], delta, max));
  }

  const inputCls =
    'rounded-lg border p-1 bg-surface2 text-surfaceInk placeholder:text-surfaceMuted disabled:opacity-70';
  const stepBtnCls =
    'h-8 w-8 rounded-lg border border-barbi/40 bg-surface2 text-surfaceInk font-bold hover:bg-barbi/15 disabled:opacity-40';
</script>

{#snippet errorFor(/** @type {string} */ field)}
  {@const e = err(field)}
  {#if e}<span class="text-xs text-red-700 dark:text-red-300" role="alert">{$t(`rikmaImport.row.${e}`)}</span>{/if}
{/snippet}

{#snippet number(
  /** @type {string} */ field,
  /** @type {string} */ label,
  /** @type {string} */ unit,
  /** @type {number} */ step = 0,
  /** @type {string} */ minusLabel = '',
  /** @type {string} */ plusLabel = '',
  /** @type {number} */ max = 10_000
)}
  <div class="flex flex-col gap-1 text-sm">
    <label for="spec-{row.key}-{field}">{label}</label>
    <span class="flex items-center gap-1.5">
      {#if step > 0 && !readonly}
        <button
          type="button"
          class={stepBtnCls}
          aria-label={minusLabel}
          onclick={() => bump(field, -step, max)}
        >
          −
        </button>
      {/if}
      <input
        id="spec-{row.key}-{field}"
        class="w-24 {inputCls} {border(field)} text-center"
        inputmode="decimal"
        value={text(field)}
        disabled={readonly}
        aria-invalid={!!err(field)}
        oninput={(e) => onSpec(field, e.currentTarget.value)}
      />
      {#if step > 0 && !readonly}
        <button
          type="button"
          class={stepBtnCls}
          aria-label={plusLabel}
          onclick={() => bump(field, step, max)}
        >
          +
        </button>
      {/if}
      {#if unit}<span class="text-xs">{unit}</span>{/if}
    </span>
    {@render errorFor(field)}
  </div>
{/snippet}

{#snippet list(/** @type {string} */ field)}
  <label class="flex flex-col gap-1 text-sm">
    <span>{$t(`rikmaImport.row.${field}`)}</span>
    <input
      class="{inputCls} {border(field)}"
      value={text(field)}
      disabled={readonly}
      aria-invalid={!!err(field)}
      oninput={(e) => onSpec(field, e.currentTarget.value)}
    />
    {@render errorFor(field)}
  </label>
{/snippet}

{#snippet check(/** @type {string} */ field, /** @type {string} */ label)}
  <label class="flex items-center gap-2 text-sm">
    <input type="checkbox" checked={checked(field)} disabled={readonly} onchange={(e) => onSpec(field, e.currentTarget.checked)} />
    <span>{label}</span>
  </label>
{/snippet}

{#snippet kindOf()}
  <label class="flex flex-col gap-1 text-sm">
    <span>{$t('rikmaImport.row.kindOfLabel')}</span>
    <select
      class="{inputCls} border-barbi/30"
      value={text('kindOf')}
      disabled={readonly}
      onchange={(e) => onSpec('kindOf', e.currentTarget.value)}
    >
      {#each defs.kindOf?.options ?? [] as k (k)}
        <option value={k} selected={k === text('kindOf')}>{$t(`rikmaImport.kindOf.${k}`)}</option>
      {/each}
    </select>
  </label>
{/snippet}

{#snippet description(/** @type {string} */ field)}
  <div class="flex flex-col gap-1 text-sm">
    <span>{$t('rikmaImport.row.descrip')}</span>
    {#if readonly && !row.spec?.[field]}
      <p class="text-xs italic text-surfaceMuted">{$t('rikmaImport.row.noDescrip')}</p>
    {:else}
      <!-- Shown and edited through the site's rich editor, which parses the HTML into its own schema: an agent's markup can format the text, never run in it. -->
      <div class="rounded-lg border border-barbi/30 bg-surface2 text-surfaceInk p-1 min-h-16">
        {#key readonly}
          <RichText
            bind:outpot={() => String(val(field) ?? ''), (html) => onHtml(field, String(html ?? ''))}
            editable={!readonly}
            sml={true}
            placeholder={$t('rikmaImport.row.descripPlaceholder')}
          />
        {/key}
      </div>
    {/if}
    {@render errorFor(field)}
  </div>
{/snippet}

<div class="flex flex-col gap-3 rounded-lg border border-surfaceLine bg-surface p-3" data-testid="row-detail">
  {#if row.group === 'rikmaMissions'}
    {@render description('descrip')}
    <div class="flex flex-wrap items-end gap-4">
      {@render number(
        'hours',
        checked('recurring') ? $t('rikmaImport.row.hoursMonthly') : $t('rikmaImport.row.hours'),
        '',
        1,
        $t('rikmaImport.hoursControl.minus'),
        $t('rikmaImport.hoursControl.plus'),
        10_000
      )}
      {@render number(
        'ratePerHour',
        $t('rikmaImport.row.ratePerHour'),
        currency,
        10,
        $t('rikmaImport.hoursControl.rateMinus'),
        $t('rikmaImport.hoursControl.ratePlus'),
        100_000_000
      )}
      {@render check('recurring', $t('rikmaImport.row.recurringToggle'))}
    </div>
    <p class="text-sm font-semibold text-surfaceInk" data-testid="row-value">
      {#if calc}
        {$t('rikmaImport.row.value')}:
        <span dir="ltr">{$t('rikmaImport.row.calc', { left: fmt(calc.left), right: fmt(calc.right), value: fmt(calc.value) })}</span>
        {currency}
        {#if spec.recurring === true}{$t('rikmaImport.row.period.monthly')}{/if}
      {:else}
        <span class="font-normal text-surfaceMuted">{$t('rikmaImport.row.noValue')}</span>
      {/if}
    </p>
    <div class="grid gap-3 sm:grid-cols-3">
      {@render list('roles')}
      {@render list('skills')}
      {@render list('workways')}
    </div>
    <p class="text-xs text-surfaceMuted">{$t('rikmaImport.row.listHint')}</p>
  {:else if row.group === 'rikmaResources'}
    {@render description('descrip')}
    <div class="flex flex-wrap items-end gap-4">
      {@render kindOf()}
      {@render number('quantity', $t('rikmaImport.row.quantity'), '', 1, $t('rikmaImport.hoursControl.minus'), $t('rikmaImport.hoursControl.plus'), 1_000_000)}
    </div>
    {#if calc}
      <p class="text-sm font-semibold text-surfaceInk" data-testid="row-value">
        {$t('rikmaImport.row.value')}:
        <span dir="ltr">{$t('rikmaImport.row.calc', { left: fmt(calc.left), right: fmt(calc.right), value: fmt(calc.value) })}</span>
        {currency}
      </p>
    {/if}
  {:else if row.group === 'products'}
    <label class="flex flex-col gap-1 text-sm">
      <span>{$t('rikmaImport.row.desc')}</span>
      <textarea
        class="{inputCls} {border('desc')} min-h-20"
        dir="auto"
        value={text('desc')}
        disabled={readonly}
        aria-invalid={!!err('desc')}
        oninput={(e) => onSpec('desc', e.currentTarget.value)}
      ></textarea>
      {@render errorFor('desc')}
    </label>
    <div class="flex flex-wrap items-end gap-4">
      {@render kindOf()}
      {#if !checked('unlimited') && spec.kindOf !== 'unlimited'}
        {@render number('quant', $t('rikmaImport.row.quant'), '', 1, $t('rikmaImport.hoursControl.minus'), $t('rikmaImport.hoursControl.plus'), 1_000_000)}
      {/if}
      {@render check('unlimited', $t('rikmaImport.row.unlimited'))}
      {@render check('isOnline', $t('rikmaImport.row.isOnline'))}
    </div>
  {:else if row.group === 'partners'}
    <label class="flex flex-col gap-1 text-sm">
      <span>{$t('rikmaImport.row.email')}</span>
      <input
        class="{inputCls} {border('email')}"
        type="email"
        dir="ltr"
        value={text('email')}
        disabled={readonly}
        aria-invalid={!!err('email')}
        oninput={(e) => onSpec('email', e.currentTarget.value)}
      />
      {@render errorFor('email')}
    </label>
    {#if brings.length}
      <p class="text-sm text-surfaceInk">{$t('rikmaImport.row.brings', { names: brings.join(', ') })}</p>
    {/if}
  {/if}
</div>
