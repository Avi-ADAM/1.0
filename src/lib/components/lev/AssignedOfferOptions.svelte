<script>
  /**
   * The other answers of a member a resource was offered to, beside bringing it
   * (docs/inprogress/PLAN_RESOURCE_ASSIGNMENT.md): refine the terms (a candidate
   * counter round), pass it to another member, or step back from it. None of
   * them is a veto — stepping back lifts an obligation off yourself, and the
   * resource opens to everyone.
   */
  import { t, isRtl } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { page } from '$app/state';
  import { executeAction } from '$lib/client/actionClient';
  import { getProjectData } from '$lib/stores/projectStore.js';

  /**
   * @typedef {Object} Props
   * @property {string|number} askmId
   * @property {string|number} projectId
   * @property {() => void} [onTerms] - open the terms editor (candidate counter)
   * @property {(r: { mode: 'withdraw' | 'reassign' }) => void} [onDone]
   * @property {() => void} [onCancel]
   */

  /** @type {Props} */
  let { askmId, projectId, onTerms, onDone, onCancel } = $props();

  /** @type {'' | 'reassign' | 'withdraw'} */
  let step = $state('');
  let toUserId = $state('');
  let why = $state('');
  let sending = $state(false);

  const others = $derived(
    (getProjectData(projectId, 'us') || []).filter(
      (/** @type {any} */ m) => m?.id != null && String(m.id) !== String(page.data?.uid ?? '')
    )
  );

  async function send() {
    if (sending || !step) return;
    if (step === 'reassign' && !toUserId) {
      toast.warning($t('lev.assignedOptions.pickMember'));
      return;
    }
    sending = true;
    try {
      const result = await executeAction('releaseAssignedResource', {
        askmId: String(askmId),
        projectId: String(projectId),
        mode: step,
        ...(step === 'reassign' ? { toUserId } : {}),
        ...(why.trim() ? { why: why.trim() } : {})
      });
      if (!result.success) {
        toast.error(result.error?.message ?? $t('lev.assignedOptions.failed'));
        return;
      }
      toast.success($t(step === 'reassign' ? 'lev.assignedOptions.passed' : 'lev.assignedOptions.withdrawn'));
      onDone?.({ mode: step });
    } catch (e) {
      console.error(e);
      toast.error($t('lev.assignedOptions.failed'));
    } finally {
      sending = false;
    }
  }

  const choice =
    'flex min-h-11 w-full items-start gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-start hover:bg-gray-50 dark:hover:bg-gray-800';
</script>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="flex flex-col gap-3 p-4 text-[#2a1420] dark:text-gray-100">
  <h3 class="m-0 text-lg font-bold">{$t('lev.assignedOptions.title')}</h3>

  {#if step === ''}
    <button type="button" class={choice} onclick={() => onTerms?.()}>
      <span>
        <span class="block font-semibold">{$t('lev.assignedOptions.terms')}</span>
        <span class="block text-sm text-gray-600 dark:text-gray-300">{$t('lev.assignedOptions.termsHint')}</span>
      </span>
    </button>
    {#if others.length > 0}
      <button type="button" class={choice} onclick={() => (step = 'reassign')}>
        <span>
          <span class="block font-semibold">{$t('lev.assignedOptions.reassign')}</span>
          <span class="block text-sm text-gray-600 dark:text-gray-300">{$t('lev.assignedOptions.reassignHint')}</span>
        </span>
      </button>
    {/if}
    <button type="button" class={choice} onclick={() => (step = 'withdraw')}>
      <span>
        <span class="block font-semibold">{$t('lev.assignedOptions.withdraw')}</span>
        <span class="block text-sm text-gray-600 dark:text-gray-300">{$t('lev.assignedOptions.withdrawHint')}</span>
      </span>
    </button>
    <button
      type="button"
      onclick={() => onCancel?.()}
      class="min-h-11 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-bold"
    >
      {$t('lev.provideAssigned.cancel')}
    </button>
  {:else}
    {#if step === 'reassign'}
      <label class="flex flex-col gap-1 text-sm">
        <span class="font-semibold">{$t('lev.assignedOptions.toWhom')}</span>
        <select
          bind:value={toUserId}
          class="min-h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3"
        >
          <option value="" disabled>{$t('lev.assignedOptions.pickMember')}</option>
          {#each others as m (m.id)}
            <option value={String(m.id)}>{m.attributes?.username ?? m.id}</option>
          {/each}
        </select>
        <span class="text-xs text-gray-500 dark:text-gray-400">{$t('lev.assignedOptions.reassignNote')}</span>
      </label>
    {:else}
      <p class="m-0 text-sm text-gray-600 dark:text-gray-300">{$t('lev.assignedOptions.withdrawNote')}</p>
    {/if}
    <label class="flex flex-col gap-1 text-sm">
      <span class="font-semibold">{$t('lev.assignedOptions.why')}</span>
      <textarea
        bind:value={why}
        rows="2"
        maxlength="500"
        class="rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
      ></textarea>
    </label>
    <div class="flex gap-2 pt-1">
      <button
        type="button"
        onclick={send}
        disabled={sending}
        aria-busy={sending}
        class="flex-[2] min-h-11 rounded-xl bg-gradient-to-r from-barbi to-mpink font-extrabold text-white shadow-md disabled:opacity-60"
      >
        {step === 'reassign' ? $t('lev.assignedOptions.reassignSubmit') : $t('lev.assignedOptions.withdrawSubmit')}
      </button>
      <button
        type="button"
        onclick={() => (step = '')}
        class="flex-1 min-h-11 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-bold"
      >
        {$t('lev.assignedOptions.back')}
      </button>
    </div>
  {/if}
</div>
