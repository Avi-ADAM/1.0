<script>
  /**
   * The answer of a member a resource was offered to (docs/inprogress/PLAN_RESOURCE_ASSIGNMENT.md):
   * bring one of your resources, or create one from the need — and that is
   * your yes. Nothing is registered under your name without it; the rikma
   * registers it once every member agreed too (provideAssignedResource).
   */
  import { t, isRtl } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { onMount } from 'svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { executeAction } from '$lib/client/actionClient';
  import Spinner from '$lib/celim/Spinner.svelte';

  /**
   * @typedef {Object} Props
   * @property {string|number} askmId
   * @property {string|number} projectId
   * @property {string|number|null} [mashaabimId] - the need's template; finds your matching resources
   * @property {string} [name] - the need's name
   * @property {number} [value] - the need's value, the default for a new resource
   * @property {number} [round] - the round you were shown
   * @property {(r: { materialized: boolean }) => void} [onDone]
   * @property {() => void} [onCancel]
   */

  /** @type {Props} */
  let { askmId, projectId, mashaabimId = null, name = '', value = 0, round = 0, onDone, onCancel } = $props();

  /** @type {Array<{id: string, attributes: {name: string}}>} */
  let mine = $state([]);
  let loading = $state(true);
  let sending = $state(false);
  /** '' = create a new one; otherwise the chosen Sp id. */
  let choice = $state('');
  // svelte-ignore state_referenced_locally
  let myValue = $state(Number(value) || 0);

  onMount(async () => {
    if (!mashaabimId) {
      loading = false;
      return;
    }
    try {
      const res = await sendToSer({ idL: '0', mashaabimId: String(mashaabimId) }, 'getUserSpByMashaabim', 0, 0, false, fetch);
      mine = res?.data?.usersPermissionsUser?.data?.attributes?.sps?.data ?? [];
      if (mine.length > 0) choice = String(mine[0].id);
    } catch (e) {
      console.error('[ProvideAssignedResource] loading your resources failed', e);
    } finally {
      loading = false;
    }
  });

  async function submit() {
    if (sending) return;
    sending = true;
    try {
      const result = await executeAction('provideAssignedResource', {
        askmId: String(askmId),
        projectId: String(projectId),
        ...(choice ? { spId: choice } : { create: { myp: Math.max(0, Number(myValue) || 0) } }),
        expectRound: Number(round) || 0
      });
      if (!result.success) {
        toast.error(result.error?.message ?? $t('lev.provideAssigned.failed'));
        return;
      }
      const materialized = result.data?.materialized === true;
      toast.success($t(materialized ? 'lev.provideAssigned.registered' : 'lev.provideAssigned.recorded'));
      onDone?.({ materialized });
    } catch (e) {
      console.error(e);
      toast.error($t('lev.provideAssigned.failed'));
    } finally {
      sending = false;
    }
  }
</script>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="flex flex-col gap-3 p-4 text-[#2a1420] dark:text-gray-100">
  <h3 class="m-0 text-lg font-bold">{$t('lev.provideAssigned.title', { name })}</h3>
  <p class="m-0 text-sm text-gray-600 dark:text-gray-300">{$t('lev.provideAssigned.intro')}</p>

  {#if loading}
    <div class="grid justify-center p-2"><Spinner size="md" /></div>
  {:else}
    <fieldset class="flex flex-col gap-2 border-0 p-0 m-0">
      <legend class="sr-only">{$t('lev.provideAssigned.title', { name })}</legend>
      {#each mine as sp (sp.id)}
        <label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-3">
          <input type="radio" name="provide-choice" value={String(sp.id)} bind:group={choice} class="h-5 w-5 accent-[#c8155f]" />
          <span class="font-semibold">{sp.attributes?.name}</span>
        </label>
      {/each}
      <label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-3">
        <input type="radio" name="provide-choice" value="" bind:group={choice} class="h-5 w-5 accent-[#c8155f]" />
        <span class="font-semibold">
          {mine.length > 0 ? $t('lev.provideAssigned.createInstead') : $t('lev.provideAssigned.create')}
        </span>
      </label>
    </fieldset>

    {#if choice === ''}
      <label class="flex flex-col gap-1 text-sm">
        <span class="font-semibold">{$t('lev.provideAssigned.valueLabel')}</span>
        <input
          type="number"
          min="0"
          inputmode="decimal"
          bind:value={myValue}
          class="min-h-11 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3"
        />
        <span class="text-xs text-gray-500 dark:text-gray-400">{$t('lev.provideAssigned.valueHint')}</span>
      </label>
    {/if}

    <div class="flex gap-2 pt-1">
      <button
        type="button"
        onclick={submit}
        disabled={sending}
        aria-busy={sending}
        class="flex-[2] min-h-11 rounded-xl bg-gradient-to-r from-barbi to-mpink font-extrabold text-white shadow-md disabled:opacity-60"
      >
        {$t('lev.provideAssigned.submit')}
      </button>
      <button
        type="button"
        onclick={() => onCancel?.()}
        class="flex-1 min-h-11 rounded-xl border-2 border-gray-300 dark:border-gray-600 font-bold"
      >
        {$t('lev.provideAssigned.cancel')}
      </button>
    </div>
  {/if}
</div>
