<script>
  /**
   * The rikma itself, as `createWeave` will receive it: name, what it is, who
   * it is looking for, its site, values, place, currency and consent clock.
   * These used to surface only after creation; they are all here now, and all
   * editable until the click.
   *
   * Stateless like the row panel: raw values go up through `onField`.
   */
  import { t } from '$lib/translations';
  import { fieldRaw, fieldValueError } from '$lib/assistant/reviewEdits';
  import { RESTIMES } from '$lib/assistant/types';

  /**
   * @typedef {import('$lib/assistant/reviewEdits').FieldEdits} FieldEdits
   * @typedef {keyof FieldEdits} Field
   * @typedef {Object} Props
   * @property {Record<string, any>} fields - The draft's fields as stored.
   * @property {FieldEdits} edits - The owner's pending edits.
   * @property {boolean} readonly
   * @property {(field: Field, raw: string | boolean) => void} onField
   */

  /** @type {Props} */
  let { fields, edits, readonly, onField } = $props();

  const val = (/** @type {Field} */ f) => edits[f] ?? fieldRaw(fields, f);
  const err = (/** @type {Field} */ f) => fieldValueError(f, edits[f]);
  const cls = (/** @type {Field} */ f) =>
    `rounded-xl border p-2 bg-surface2 text-surfaceInk placeholder:text-surfaceMuted disabled:opacity-70 ${err(f) ? 'border-red-500' : 'border-barbi/40'}`;
  let hasCoords = $derived(typeof fields?.location?.lat === 'number' && typeof fields?.location?.lng === 'number');
</script>

{#snippet errorFor(/** @type {Field} */ f)}
  {@const e = err(f)}
  {#if e}<span class="text-xs text-red-700 dark:text-red-300" role="alert">{$t(`rikmaImport.field.${f === 'linkToWebsite' && e === 'invalid' ? 'linkInvalid' : e}`)}</span>{/if}
{/snippet}

{#snippet line(/** @type {Field} */ f, /** @type {string} */ hint, /** @type {Record<string, any>} */ attrs)}
  <label class="flex flex-col gap-1 text-sm">
    <span class="font-semibold">{$t(`rikmaImport.field.${f}`)}</span>
    <input
      class={cls(f)}
      value={String(val(f))}
      disabled={readonly}
      aria-invalid={!!err(f)}
      oninput={(e) => onField(f, e.currentTarget.value)}
      {...attrs}
    />
    {#if hint}<span class="text-xs text-surfaceMuted">{hint}</span>{/if}
    {@render errorFor(f)}
  </label>
{/snippet}

{#snippet area(/** @type {Field} */ f)}
  <label class="flex flex-col gap-1 text-sm">
    <span class="font-semibold">{$t(`rikmaImport.field.${f}`)}</span>
    <textarea
      class="{cls(f)} min-h-20"
      dir="auto"
      value={String(val(f))}
      disabled={readonly}
      aria-invalid={!!err(f)}
      oninput={(e) => onField(f, e.currentTarget.value)}
    ></textarea>
    {@render errorFor(f)}
  </label>
{/snippet}

<div class="flex flex-col gap-3 rounded-2xl border border-barbi/40 p-4 bg-surface2" data-testid="rikma-fields">
  <h2 class="text-lg font-semibold">{$t('rikmaImport.field.heading')}</h2>
  {@render line('name', '', { 'aria-required': 'true' })}
  {@render area('publicDescription')}
  {@render area('descripFor')}
  {@render line('linkToWebsite', '', { type: 'url', dir: 'ltr', placeholder: 'https://' })}
  {@render line('vals', $t('rikmaImport.field.valsHint'), {})}

  <div class="flex flex-wrap items-end gap-4">
    <label class="flex flex-col gap-1 text-sm flex-1 min-w-48">
      <span class="font-semibold">{$t('rikmaImport.field.place')}</span>
      <input
        class={cls('place')}
        value={String(val('place'))}
        disabled={readonly}
        aria-invalid={!!err('place')}
        oninput={(e) => onField('place', e.currentTarget.value)}
      />
      {#if hasCoords}<span class="text-xs text-surfaceMuted">{$t('rikmaImport.field.pinned')}</span>{/if}
      {@render errorFor('place')}
    </label>
    <label class="flex items-center gap-2 text-sm pb-2">
      <input type="checkbox" checked={val('online') === true} disabled={readonly} onchange={(e) => onField('online', e.currentTarget.checked)} />
      <span>{$t('rikmaImport.field.online')}</span>
    </label>
  </div>

  <div class="flex flex-wrap items-start gap-4">
    <label class="flex flex-col gap-1 text-sm">
      <span class="font-semibold">{$t('rikmaImport.field.currency')}</span>
      <input
        class="w-24 {cls('currency')}"
        dir="ltr"
        maxlength="3"
        value={String(val('currency'))}
        disabled={readonly}
        aria-invalid={!!err('currency')}
        oninput={(e) => onField('currency', e.currentTarget.value)}
      />
      <span class="text-xs text-surfaceMuted">{$t('rikmaImport.field.currencyHint')}</span>
      {@render errorFor('currency')}
    </label>
    <label class="flex flex-col gap-1 text-sm flex-1 min-w-48">
      <span class="font-semibold">{$t('rikmaImport.field.restime')}</span>
      <select class={cls('restime')} value={String(val('restime'))} disabled={readonly} onchange={(e) => onField('restime', e.currentTarget.value)}>
        {#each RESTIMES as r (r)}
          <option value={r} selected={r === val('restime')}>{$t(`rikmaImport.restime.${r}`)}</option>
        {/each}
      </select>
      <span class="text-xs text-surfaceMuted">{$t('rikmaImport.field.restimeHint')}</span>
    </label>
  </div>
</div>
