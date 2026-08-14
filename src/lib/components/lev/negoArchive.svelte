<script>
  /**
   * The negotiation drawer for an archive/edit proposal
   * (PLAN_OBJECT_ARCHIVAL — phase 2).
   *
   * This is what exists instead of a "reject" button. The mode switch is the
   * whole point: "keep it, with changes" turns a removal proposal into an edit
   * proposal without leaving the Decision, so disagreement stays a
   * conversation rather than ending one.
   *
   * Every field opens on the standing version and shows what it was, so a
   * member who only cares about the hours cannot silently wipe the dates.
   */
  import { Drawer } from 'vaul-svelte';
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { counterDefaults } from '$lib/archive/decisionView.js';

  /**
   * @typedef {Object} Props
   * @property {boolean} open
   * @property {any} archive - the ArchiveDecisionView from the card
   * @property {string} projectId
   * @property {() => void} [onClose]
   * @property {() => void} [onSent]
   */

  /** @type {Props} */
  let { open = $bindable(false), archive, projectId, onClose, onSent } = $props();

  const hasHours = $derived(Number(archive?.accruedHours ?? 0) > 0);
  const isInProgress = $derived(
    archive?.targetKind === 'missionInProgress' || archive?.targetKind === 'resourceInProgress'
  );

  let mode = $state('keep');
  let values = $state(/** @type {any} */ ({}));
  let why = $state('');
  let hoursOutcome = $state('waive');
  let hoursToCredit = $state(0);
  let sending = $state(false);

  // Reset to the standing version each time the drawer opens, so a cancelled
  // draft never leaks into the next attempt.
  $effect(() => {
    if (!open || !archive) return;
    mode = 'keep';
    values = { ...counterDefaults(archive) };
    why = '';
    hoursOutcome = archive.standing?.hoursOutcome ?? (hasHours ? 'credit' : 'waive');
    hoursToCredit = archive.standing?.hoursToCredit ?? archive.accruedHours ?? 0;
  });

  const previous = $derived(archive?.standing ?? {});

  /** "was: X" hint — only when the standing version actually had a value. */
  function was(field) {
    const v = previous?.[field];
    if (v == null || v === '') return '';
    return $t('archive.nego.was', { value: String(v) });
  }

  function dateValue(v) {
    if (!v) return '';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }

  async function submit() {
    if (sending) return;
    sending = true;
    try {
      const res = await executeAction('counterObjectChange', {
        decisionId: archive.decisionId,
        projectId,
        mode,
        why: why.trim() || undefined,
        newValues: {
          name: values.name ?? undefined,
          descrip: values.descrip ?? undefined,
          hm: values.hm ?? undefined,
          price: values.price ?? undefined,
          kindOf: values.kindOf ?? undefined,
          sqadualed: values.sqadualed || undefined,
          sqadualedf: values.sqadualedf || undefined
        },
        // Only meaningful when the object is actually leaving.
        hoursOutcome: mode === 'archive' && isInProgress ? hoursOutcome : undefined,
        hoursToCredit:
          mode === 'archive' && hoursOutcome === 'credit' ? Number(hoursToCredit) : undefined
      });
      if (res?.success === false) throw new Error(String(res?.error ?? 'failed'));
      toast.success($t('archive.toast.countered'));
      open = false;
      onSent?.();
    } catch (e) {
      console.error('[negoArchive] counter failed:', e);
      toast.error($t('archive.toast.error'));
    } finally {
      sending = false;
    }
  }
</script>

<Drawer.Root bind:open>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/50 z-[60]" />
    <Drawer.Content
      class="bg-white dark:bg-gray-800 flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 max-h-[92vh] z-[61]"
    >
      <div class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 my-3"></div>

      <div class="overflow-y-auto px-5 pb-6 space-y-5">
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">
          {$t('archive.nego.title')}
        </h2>

        <!-- The mode switch: this is the move that replaces "no". -->
        <fieldset class="space-y-2">
          <legend class="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {$t('archive.nego.modeQuestion')}
          </legend>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              onclick={() => (mode = 'keep')}
              aria-pressed={mode === 'keep'}
              class="rounded-xl border-2 p-3 text-sm text-start transition {mode === 'keep'
                ? 'border-wow bg-wow/10 font-semibold'
                : 'border-gray-200 dark:border-gray-700'}"
            >
              {$t('archive.nego.modeKeep')}
            </button>
            <button
              type="button"
              onclick={() => (mode = 'archive')}
              aria-pressed={mode === 'archive'}
              class="rounded-xl border-2 p-3 text-sm text-start transition {mode === 'archive'
                ? 'border-barbi bg-barbi/10 font-semibold'
                : 'border-gray-200 dark:border-gray-700'}"
            >
              {$t('archive.nego.modeArchive')}
            </button>
          </div>
        </fieldset>

        {#if mode === 'keep'}
          <div class="space-y-3">
            <label class="block">
              <span class="text-sm text-gray-600 dark:text-gray-400">{$t('archive.nego.name')}</span>
              <input
                type="text"
                bind:value={values.name}
                class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
              />
              {#if was('name')}<span class="text-xs text-gray-400">{was('name')}</span>{/if}
            </label>

            <label class="block">
              <span class="text-sm text-gray-600 dark:text-gray-400">{$t('archive.nego.descrip')}</span>
              <textarea
                rows="2"
                bind:value={values.descrip}
                class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
              ></textarea>
            </label>

            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="text-sm text-gray-600 dark:text-gray-400">{$t('archive.nego.hm')}</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  bind:value={values.hm}
                  class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
                />
                {#if was('hm')}<span class="text-xs text-gray-400">{was('hm')}</span>{/if}
              </label>
              <label class="block">
                <span class="text-sm text-gray-600 dark:text-gray-400">{$t('archive.nego.price')}</span>
                <input
                  type="number"
                  min="0"
                  bind:value={values.price}
                  class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
                />
                {#if was('price')}<span class="text-xs text-gray-400">{was('price')}</span>{/if}
              </label>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="text-sm text-gray-600 dark:text-gray-400">{$t('archive.nego.startDate')}</span>
                <input
                  type="date"
                  value={dateValue(values.sqadualed)}
                  onchange={(e) => (values.sqadualed = e.currentTarget.value || null)}
                  class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
                />
              </label>
              <label class="block">
                <span class="text-sm text-gray-600 dark:text-gray-400">{$t('archive.nego.endDate')}</span>
                <input
                  type="date"
                  value={dateValue(values.sqadualedf)}
                  onchange={(e) => (values.sqadualedf = e.currentTarget.value || null)}
                  class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
                />
              </label>
            </div>
          </div>
        {:else if isInProgress && hasHours}
          <!-- Removing an object that carries someone's work is a settlement,
               so the terms of that settlement are the negotiable part. -->
          <fieldset class="space-y-2">
            <legend class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {$t('archive.nego.hoursQuestion')}
            </legend>
            <p class="text-xs text-gray-500">
              {$t('archive.hours.accrued', { count: archive.accruedHours })}
            </p>
            {#each ['credit', 'waive', 'endOfCycle'] as option}
              <label class="flex items-center gap-2 text-sm">
                <input type="radio" value={option} bind:group={hoursOutcome} />
                {$t(`archive.hours.${option}`)}
              </label>
            {/each}
            {#if hoursOutcome === 'credit'}
              <label class="block">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  {$t('archive.hours.creditAmount', { count: archive.accruedHours })}
                </span>
                <input
                  type="number"
                  min="0"
                  max={archive.accruedHours}
                  step="0.5"
                  bind:value={hoursToCredit}
                  class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
                />
              </label>
            {/if}
          </fieldset>
        {/if}

        <label class="block">
          <span class="text-sm text-gray-600 dark:text-gray-400">{$t('archive.nego.why')}</span>
          <textarea
            rows="2"
            bind:value={why}
            placeholder={$t('archive.nego.whyPlaceholder')}
            class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
          ></textarea>
        </label>

        <p class="text-xs text-gray-500">{$t('archive.nego.clockReset')}</p>

        <div class="flex gap-3 pt-1">
          <button
            type="button"
            onclick={() => {
              open = false;
              onClose?.();
            }}
            class="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-3"
          >
            {$t('archive.nego.cancel')}
          </button>
          <button
            type="button"
            onclick={submit}
            disabled={sending}
            class="flex-[2] rounded-xl bg-gradient-to-r from-barbi to-mpink text-white font-semibold py-3 disabled:opacity-60"
          >
            {sending ? $t('archive.nego.sending') : $t('archive.nego.submit')}
          </button>
        </div>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
