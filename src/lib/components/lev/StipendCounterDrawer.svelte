<script>
  /**
   * The counter-offer drawer for a stipend proposal (PLAN_STIPEND §5).
   *
   * This is the "no" button that does not exist. Every field starts at the
   * standing version's value, so countering is an *edit* of terms rather than a
   * blank form — a member who only wants to change the rate does not silently
   * wipe the caps by leaving them empty.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import StipendTermsFields from '../stipend/StipendTermsFields.svelte';

  /**
   * @typedef {Object} Props
   * @property {boolean} open
   * @property {any} stipend - the StipendDecisionView
   * @property {string} projectId
   * @property {() => void} [onSent]
   */

  /** @type {Props} */
  let { open = $bindable(false), stipend, projectId, onSent } = $props();

  /** @type {import('$lib/stipend/types.js').StipendTerms} */
  let terms = $state(seed());
  let why = $state('');
  let busy = $state(false);

  /** @returns {import('$lib/stipend/types.js').StipendTerms} */
  function seed() {
    const s = stipend?.standing ?? {};
    return {
      mode: s.mode ?? 'equity',
      costShare: s.costShare ?? 1,
      equityMultiplier: s.equityMultiplier ?? 1,
      stipendRate: s.stipendRate ?? 0,
      monthlyCap: s.monthlyCap ?? null,
      totalCap: s.totalCap ?? null,
      noticeCycles: s.noticeCycles ?? 1,
      revenueTrigger: s.revenueTrigger ?? null,
      recourse: s.recourse ?? 'nonRecourse'
    };
  }

  // Re-seed whenever the drawer opens on a (possibly newer) standing round.
  $effect(() => {
    if (open) terms = seed();
  });

  async function send() {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('counterStipendTerms', {
        decisionId: String(stipend.decisionId),
        newTerms: {
          mode: terms.mode,
          costShare: Number(terms.costShare),
          equityMultiplier: Number(terms.equityMultiplier),
          stipendRate: Number(terms.stipendRate),
          monthlyCap: terms.monthlyCap != null ? Number(terms.monthlyCap) : null,
          totalCap: terms.totalCap != null ? Number(terms.totalCap) : null,
          noticeCycles: terms.noticeCycles != null ? Number(terms.noticeCycles) : null,
          revenueTrigger: terms.revenueTrigger != null ? Number(terms.revenueTrigger) : null,
          recourse: terms.recourse
        },
        why: why || undefined
      });
      if (res?.success === false) throw new Error(actionError(res));
      toast.success($t('stipend.toast.countered'));
      open = false;
      onSent?.();
    } catch (e) {
      console.error('[StipendCounterDrawer] counter failed:', e);
      toast.error(e instanceof Error ? e.message : $t('stipend.toast.error'));
    } finally {
      busy = false;
    }
  }

  /**
   * The sentence the action actually threw. The action framework replaces
   * `message` with a generic "An unexpected error occurred" and keeps the real
   * one in `details` — and for a stipend the real one is the whole point ("the
   * rate is above the mission's market rate", "name the mission it pays for").
   * @param {any} res
   */
  function actionError(res) {
    return String(res?.error?.details ?? res?.error?.message ?? res?.error ?? 'failed');
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
    dir={$isRtl ? 'rtl' : 'ltr'}
  >
    <div
      class="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-800 p-5 shadow-2xl"
    >
      <div class="flex items-start justify-between gap-3">
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-50">
          {$t('stipend.counter.title')}
        </h2>
        <button type="button" class="text-2xl leading-none text-gray-500 dark:text-gray-400" onclick={() => (open = false)}
          >×</button
        >
      </div>
      <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">{$t('stipend.counter.intro')}</p>

      <div class="mt-4">
        <StipendTermsFields bind:terms showBudget={stipend?.kind === 'stipendProgram'} />
      </div>

      <label class="mt-4 flex flex-col gap-1">
        <span class="text-xs font-bold uppercase text-gray-600 dark:text-gray-300">{$t('stipend.counter.why')}</span>
        <textarea
          bind:value={why}
          rows="2"
          class="rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-50 px-3 py-2"
        ></textarea>
      </label>

      <p class="mt-2 text-xs text-gray-600 dark:text-gray-300">{$t('stipend.counter.clockNote')}</p>

      <div class="mt-5 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-xl border border-gray-300 dark:border-slate-600 py-3 text-sm"
          onclick={() => (open = false)}
        >
          {$t('stipend.actions.cancel')}
        </button>
        <button
          type="button"
          class="flex-[2] rounded-xl bg-barbi text-gold py-3 text-sm font-bold disabled:opacity-60"
          disabled={busy || !(Number(terms.stipendRate) > 0)}
          onclick={send}
        >
          {busy ? $t('stipend.actions.sending') : $t('stipend.actions.sendCounter')}
        </button>
      </div>
    </div>
  </div>
{/if}
