<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { RingLoader } from 'svelte-loading-spinners';
  import { executeAction } from '$lib/client/actionClient';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { t, isRtl } from '$lib/translations';

  /**
   * Create-product flow (PLAN_USER_OFFERINGS, profile feedback 2026-07-13):
   * step 1 — where should the product live: a NEW rikma (created to contain
   * it) or an EXISTING rikma the user is a member of; step 2 — the product
   * form opens immediately after the choice. The draft (values + choice) is
   * auto-saved to localStorage so stopping midway loses nothing.
   *
   * Props: { uid, onDone(result), onClose() }
   */

  let { uid, onDone, onClose } = $props();

  const DRAFT_KEY = 'offerings.productDraft.v1';

  let step = $state(/** @type {'where' | 'form'} */ ('where'));
  let mode = $state(/** @type {'new' | 'existing'} */ ('new'));
  let projects = $state(/** @type {{ id: string; name: string }[]} */ ([]));
  let projectId = $state('');
  let saving = $state(false);
  let error1 = $state(null);

  let draft = $state({
    name: '',
    descrip: '',
    price: null,
    quant: null,
    kindOf: 'total',
    rikmaName: ''
  });

  onMount(async () => {
    // Restore an interrupted draft (values + where-choice).
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved?.draft) draft = { ...draft, ...saved.draft };
        if (saved?.mode === 'new' || saved?.mode === 'existing') mode = saved.mode;
        if (saved?.projectId) projectId = String(saved.projectId);
        if (saved?.step === 'form') step = 'form';
      }
    } catch {
      /* corrupt draft — start clean */
    }

    try {
      const res = await sendToSer({ uid: String(uid) }, '275myRikmasLite', 0, 0, false, fetch);
      projects = (
        res?.data?.usersPermissionsUser?.data?.attributes?.projects_1s?.data ?? []
      ).map((p) => ({ id: String(p.id), name: p.attributes?.projectName ?? '' }));
    } catch (e) {
      console.warn('rikmas load failed', e);
    }
  });

  // Auto-save the draft on every change (cheap, debounce-free — tiny object).
  $effect(() => {
    const snapshot = JSON.stringify({ draft, mode, projectId, step });
    try {
      localStorage.setItem(DRAFT_KEY, snapshot);
    } catch {
      /* storage full/blocked — draft is best-effort */
    }
  });

  function choose(next) {
    mode = next;
    step = 'form';
    if (mode === 'new' && !draft.rikmaName && draft.name) {
      draft.rikmaName = draft.name;
    }
  }

  const canSubmit = $derived(
    !!draft.name?.trim() &&
      Number(draft.price) > 0 &&
      (mode === 'existing' ? !!projectId : true)
  );

  async function create() {
    error1 = null;
    saving = true;
    try {
      const params = {
        name: draft.name,
        descrip: draft.descrip || null,
        price: Number(draft.price),
        quant: draft.quant != null && draft.quant !== '' ? Number(draft.quant) : null,
        kindOf: draft.kindOf
      };
      if (mode === 'existing') params.projectId = projectId;
      else if (draft.rikmaName?.trim()) params.newRikmaName = draft.rikmaName.trim();
      // No rikma name in 'new' mode falls back to the home rikma server-side.

      const result = await executeAction('createPersonalMatanot', params);
      if (!result.success) {
        error1 = result.error?.message || $t('offerings.products.save_failed');
      } else {
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* noop */
        }
        onDone?.(result.data);
      }
    } catch (e) {
      error1 = e?.message || String(e);
    }
    saving = false;
  }

  /**
   * "Expand to the full form" — image, complex products (missions+resources
   * recipe) live in /moach/[id]/sales/new. The draft is already persisted, so
   * the full form hydrates it via ?fromQuick=1. In 'new' mode the rikma is
   * created first (we have its name) and the user lands on its full form —
   * the system knows where they came from and finishes the journey there.
   */
  async function expandToFull() {
    error1 = null;
    if (mode === 'existing') {
      if (!projectId) {
        error1 = $t('offerings.flow.pick_rikma');
        return;
      }
      goto(`/moach/${projectId}/sales/new?fromQuick=1`);
      onClose?.();
      return;
    }
    const rikmaName = draft.rikmaName?.trim() || draft.name?.trim();
    if (!rikmaName) {
      error1 = $t('offerings.flow.rikma_name');
      return;
    }
    saving = true;
    try {
      const result = await executeAction('createWeave', { projectName: rikmaName });
      if (!result.success || !result.data?.projectId) {
        error1 = result.error?.message || $t('offerings.products.save_failed');
      } else {
        goto(`/moach/${result.data.projectId}/sales/new?fromQuick=1`);
        onClose?.();
      }
    } catch (e) {
      error1 = e?.message || String(e);
    }
    saving = false;
  }
</script>

<div
  class="fixed inset-0 z-[1200] bg-black/60 flex items-end sm:items-center justify-center overflow-y-auto p-3"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
  onclick={(e) => {
    if (e.target === e.currentTarget) onClose?.();
  }}
  onkeydown={(e) => {
    if (e.key === 'Escape') onClose?.();
  }}
>
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="w-full sm:max-w-md bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden my-4"
  >
    <div class="px-4 py-3 bg-gradient-to-l from-barbi to-mpink text-white flex items-center justify-between">
      <h2 class="text-lg font-bold">🎁 {$t('offerings.flow.title')}</h2>
      <button class="text-xl leading-none" onclick={() => onClose?.()} aria-label="✕">✕</button>
    </div>

    <div class="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
      {#if error1}
        <p class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl px-3 py-2">
          {error1}
        </p>
      {/if}

      {#if step === 'where'}
        <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {$t('offerings.flow.where')}
        </p>
        <button
          class="w-full flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-3 hover:border-barbi transition-colors text-start"
          onclick={() => choose('new')}
        >
          <span class="text-2xl">🌱</span>
          <span>
            <span class="block text-sm font-semibold text-gray-900 dark:text-gray-100">{$t('offerings.flow.new_rikma')}</span>
            <span class="block text-xs text-gray-500 dark:text-gray-400">{$t('offerings.flow.new_rikma_hint')}</span>
          </span>
        </button>
        <button
          class="w-full flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-3 hover:border-barbi transition-colors text-start disabled:opacity-40"
          onclick={() => choose('existing')}
          disabled={projects.length === 0}
        >
          <span class="text-2xl">🧬</span>
          <span>
            <span class="block text-sm font-semibold text-gray-900 dark:text-gray-100">{$t('offerings.flow.existing_rikma')}</span>
            <span class="block text-xs text-gray-500 dark:text-gray-400">{$t('offerings.flow.existing_rikma_hint')}</span>
          </span>
        </button>
      {:else}
        <button
          class="text-xs text-gray-500 dark:text-gray-400 hover:text-barbi"
          onclick={() => (step = 'where')}
        >
          → {$t('offerings.flow.back')}
        </button>

        {#if mode === 'existing'}
          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.flow.pick_rikma')}</span>
            <select
              bind:value={projectId}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            >
              <option value="" disabled>—</option>
              {#each projects as p (p.id)}
                <option value={p.id}>{p.name}</option>
              {/each}
            </select>
          </label>
        {:else}
          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.flow.rikma_name')}</span>
            <input
              type="text"
              bind:value={draft.rikmaName}
              placeholder={$t('offerings.flow.rikma_name_ph')}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            />
          </label>
        {/if}

        <label class="block">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.name')}</span>
          <input
            type="text"
            bind:value={draft.name}
            class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            required
          />
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.descrip')}</span>
          <textarea
            bind:value={draft.descrip}
            rows="2"
            class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
          ></textarea>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.price')}</span>
            <input
              type="number"
              min="0"
              bind:value={draft.price}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
              required
            />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.quant')}</span>
            <input
              type="number"
              min="0"
              bind:value={draft.quant}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            />
          </label>
        </div>
        <label class="block">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.kind')}</span>
          <select
            bind:value={draft.kindOf}
            class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
          >
            <option value="total">{$t('offerings.products.kind_total')}</option>
            <option value="monthly">{$t('offerings.products.kind_monthly')}</option>
            <option value="yearly">{$t('offerings.products.kind_yearly')}</option>
            <option value="daily">{$t('offerings.products.kind_daily')}</option>
            <option value="unlimited">{$t('offerings.products.kind_unlimited')}</option>
          </select>
        </label>

        <p class="text-xs text-gray-500 dark:text-gray-400">💾 {$t('offerings.flow.draft_note')}</p>

        <!-- Escape hatch to the full product form (image, complex recipe) -->
        <button
          class="w-full flex items-center gap-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-500 px-3 py-2 text-start hover:border-barbi transition-colors disabled:opacity-50"
          onclick={expandToFull}
          disabled={saving}
        >
          <span class="text-lg">🧩</span>
          <span>
            <span class="block text-sm font-semibold text-gray-700 dark:text-gray-200">{$t('offerings.flow.expand')}</span>
            <span class="block text-xs text-gray-500 dark:text-gray-400">{$t('offerings.flow.expand_hint')}</span>
          </span>
        </button>

        {#if saving}
          <div class="flex justify-center py-1">
            <RingLoader size="32" color="#ff00ae" unit="px" duration="2s"></RingLoader>
          </div>
        {:else}
          <button
            class="w-full py-2.5 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
            disabled={!canSubmit}
            onclick={create}
          >
            {$t('offerings.products.create')}
          </button>
        {/if}
      {/if}
    </div>
  </div>
</div>
