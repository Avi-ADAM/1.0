<script>
  /**
   * "Find someone to fund our members" (docs/PLAN_STIPEND.md §12.2).
   *
   * A rikma whose income is two years away usually has no member who can
   * carry anyone. Rather than inventing a donor mechanism, the need goes out
   * as an ordinary **open resource request**: money, monthly, for N months,
   * linked to the approved programme. From there the existing machinery does
   * the work — it appears in search, the matching engine suggests it to people
   * who offer that kind of resource, and whoever takes it joins the rikma
   * through the normal path and becomes a partner.
   *
   * That is also why the programme's `k` matters: an outsider who funds is
   * taking a real risk, and the risk premium is how the rikma can offer them
   * something for it without inventing a separate investor class.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { LABEL, MUTED, INPUT, WELL, BTN_PRIMARY, BTN_GHOST } from './ui.js';

  /**
   * @typedef {Object} Props
   * @property {any} program - the StipendProgramRow to fund; null closes the dialog
   * @property {string} [projectName]
   * @property {() => void} [onDone]
   */

  /** @type {Props} */
  let { program = $bindable(null), projectName = '', onDone } = $props();

  let months = $state(12);
  let name = $state('');
  let descrip = $state('');
  let busy = $state(false);

  const budget = $derived(Number(program?.totalCap ?? 0));
  const monthly = $derived(months > 0 && budget > 0 ? Math.round(budget / months) : 0);

  function close() {
    program = null;
  }

  async function publish() {
    if (busy || !program) return;
    busy = true;
    try {
      const res = await executeAction('publishStipendFundingRequest', {
        programId: String(program.id),
        months: Number(months) || 12,
        name: name || undefined,
        descrip: descrip || undefined
      });
      if (res?.success === false) {
        throw new Error(actionError(res));
      }
      const suggested = res?.data?.suggested ?? 0;
      toast.success(
        suggested > 0
          ? $t('stipend.funding.publishedWithMatches', { count: suggested })
          : $t('stipend.funding.published')
      );
      program = null;
      onDone?.();
    } catch (e) {
      console.error('[StipendFundingRequestDialog] publish failed:', e);
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

{#if program}
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
    dir={$isRtl ? 'rtl' : 'ltr'}
  >
    <div
      class="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 p-5 shadow-2xl"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold">{$t('stipend.funding.title')}</h2>
          {#if projectName}<p class={MUTED}>{projectName}</p>{/if}
        </div>
        <button type="button" class="text-2xl leading-none text-gray-600 dark:text-gray-300 hover:text-goldink" onclick={close}>×</button>
      </div>

      <p class="mt-2 text-sm text-gray-800 dark:text-gray-100">{$t('stipend.funding.intro')}</p>

      <div class="mt-4 flex flex-col gap-4">
        <div class="{WELL} p-3 text-sm space-y-1">
          <p class="font-bold">{program.name}</p>
          <p>{$t('stipend.terms.rate')}: ₪{program.stipendRate}</p>
          <p>{$t('stipend.terms.totalCap')}: ₪{budget.toLocaleString()}</p>
          <p class={MUTED}>
            {$t(`stipend.mode.${program.mode}Explain`)}
          </p>
        </div>

        <label class="flex flex-col gap-1">
          <span class={LABEL}>{$t('stipend.funding.months')}</span>
          <input
            type="number"
            min="1"
            step="1"
            bind:value={months}
            class={INPUT}
          />
          {#if monthly > 0}
            <span class={MUTED}>
              {$t('stipend.funding.monthly', { count: monthly.toLocaleString() })}
            </span>
          {/if}
        </label>

        <label class="flex flex-col gap-1">
          <span class={LABEL}>{$t('stipend.funding.name')}</span>
          <input
            type="text"
            bind:value={name}
            placeholder={$t('stipend.funding.namePlaceholder')}
            class={INPUT}
          />
        </label>

        <label class="flex flex-col gap-1">
          <span class={LABEL}>{$t('stipend.funding.descrip')}</span>
          <textarea
            bind:value={descrip}
            rows="3"
            placeholder={$t('stipend.funding.descripPlaceholder')}
            class={INPUT}
          ></textarea>
        </label>

        <p class={MUTED}>{$t('stipend.funding.joinNote')}</p>
      </div>

      <div class="mt-5 flex gap-2">
        <button
          type="button"
          class="flex-1 {BTN_GHOST} py-3 text-sm"
          onclick={close}
        >
          {$t('stipend.actions.cancel')}
        </button>
        <button
          type="button"
          class="flex-[2] {BTN_PRIMARY} py-3 text-sm"
          disabled={busy}
          onclick={publish}
        >
          {busy ? $t('stipend.actions.sending') : $t('stipend.funding.action')}
        </button>
      </div>
    </div>
  </div>
{/if}
