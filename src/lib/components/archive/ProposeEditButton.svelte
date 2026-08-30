<script>
  /**
   * Proposing a change to an object's terms (PLAN_OBJECT_ARCHIVAL — phase 4).
   *
   * The everyday case: the person carrying a mission needs more hours than
   * were agreed, or the hourly value was set wrong. That is a change to the
   * shared contract, so it goes through the same consent as everything else —
   * but it is not a removal, and calling it "archive" would read as one. Hence
   * `editObject`, which is also what finally closes the half-built
   * `Decision.moreHours` / `newHours` pair.
   *
   * In a rikma of one it simply applies.
   */
  import { Drawer } from 'vaul-svelte';
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';

  /**
   * @typedef {Object} Props
   * @property {'openMission'|'missionInProgress'|'openResource'|'resourceInProgress'|'matanot'} targetKind
   * @property {string|number} targetId
   * @property {string} [targetName]
   * @property {number|null} [currentHm] - hours/quantity agreed today
   * @property {number|null} [currentPrice] - hourly value / unit price today
   * @property {boolean} [soleMember]
   * @property {string} [label]
   * @property {string} [icon] - leading glyph, kept in its own element so RTL bidi
   *   reordering can't swap it with the label (see mc-btn siblings in MissionControls)
   * @property {string} [className]
   * @property {() => void} [onDone]
   */

  /** @type {Props} */
  let {
    targetKind,
    targetId,
    targetName = '',
    currentHm = null,
    currentPrice = null,
    soleMember = false,
    label = '',
    icon = '',
    className = '',
    onDone
  } = $props();

  let open = $state(false);
  let hm = $state(/** @type {number|null} */ (null));
  let price = $state(/** @type {number|null} */ (null));
  let why = $state('');
  let sending = $state(false);

  // Open on today's terms, so a proposal about the hours cannot accidentally
  // restate the rate as something it never was.
  $effect(() => {
    if (!open) return;
    hm = currentHm;
    price = currentPrice;
    why = '';
  });

  const changed = $derived(
    (hm != null && Number(hm) !== Number(currentHm)) ||
      (price != null && Number(price) !== Number(currentPrice))
  );

  // Moving the hourly value of a mission that is already running is the one
  // change with a consequence beyond the terms themselves: the hours logged so
  // far are closed at the old value first. Nobody should discover that after
  // signing (src/lib/server/timers/flushRateChange.ts).
  const priceMoved = $derived(
    targetKind === 'missionInProgress' &&
      price != null &&
      currentPrice != null &&
      Number(price) !== Number(currentPrice)
  );

  async function submit() {
    if (sending || !changed) return;
    sending = true;
    try {
      const res = await executeAction('proposeObjectEdit', {
        targetKind,
        targetId: String(targetId),
        why: why.trim() || undefined,
        newValues: {
          hm: hm != null ? Number(hm) : undefined,
          price: price != null ? Number(price) : undefined
        }
      });
      if (res?.success === false)
        throw new Error(String(res?.error ?? 'failed'));
      toast.success(
        res?.data?.immediate
          ? $t('archive.edit.applied')
          : $t('archive.edit.proposed')
      );
      open = false;
      onDone?.();
    } catch (e) {
      console.error('[ProposeEditButton] proposal failed:', e);
      toast.error(e instanceof Error ? e.message : $t('archive.toast.error'));
    } finally {
      sending = false;
    }
  }
</script>

<button
  type="button"
  onclick={() => (open = true)}
  class={className ||
    'text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}
>
  {#if icon}<span aria-hidden="true">{icon}</span>{/if}
  <span>{label || $t('archive.edit.button')}</span>
</button>

<!--
  z-1300/1301: these drawers are portalled to <body>, so they compete with the
  lev sheet — the fixed, opaque z-900 panel a card is mounted into in the coin
  and list views (LevSheet.svelte). At the old z-60/61 the proposal opened
  behind it and the button looked dead. Same layer as the timer dialogs.
-->
<Drawer.Root bind:open>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/50 z-[1300]" />
    <Drawer.Content
      class="bg-white dark:bg-gray-800 flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 max-h-[92vh] z-[1301]"
    >
      <div
        class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 my-3"
      ></div>

      <div class="overflow-y-auto px-5 pb-6 space-y-5">
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">
            {$t('archive.edit.title')}
          </h2>
          <p class="text-sm text-gray-500">{targetName}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-sm text-gray-600 dark:text-gray-400"
              >{$t('archive.nego.hm')}</span
            >
            <input
              type="number"
              min="0"
              step="0.5"
              bind:value={hm}
              class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
            />
            {#if currentHm != null}
              <span class="text-xs text-gray-400">
                {$t('archive.nego.was', { value: String(currentHm) })}
              </span>
            {/if}
          </label>
          <label class="block">
            <span class="text-sm text-gray-600 dark:text-gray-400"
              >{$t('archive.nego.price')}</span
            >
            <input
              type="number"
              min="0"
              bind:value={price}
              class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
            />
            {#if currentPrice != null}
              <span class="text-xs text-gray-400">
                {$t('archive.nego.was', { value: String(currentPrice) })}
              </span>
            {/if}
          </label>
        </div>

        <label class="block">
          <span class="text-sm text-gray-600 dark:text-gray-400"
            >{$t('archive.propose.why')}</span
          >
          <textarea
            rows="3"
            bind:value={why}
            placeholder={$t('archive.edit.whyPlaceholder')}
            class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
          ></textarea>
        </label>

        {#if priceMoved}
          <p
            class="text-xs rounded-lg border border-amber-300 dark:border-amber-500/60 bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 p-2.5"
          >
            {$t('archive.edit.rateNote')}
          </p>
        {/if}

        <p class="text-xs text-gray-500">
          {soleMember
            ? $t('archive.propose.immediateNote')
            : $t('archive.edit.note')}
        </p>

        <div class="flex gap-3 pt-1">
          <button
            type="button"
            onclick={() => (open = false)}
            class="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 py-3"
          >
            {$t('archive.nego.cancel')}
          </button>
          <button
            type="button"
            onclick={submit}
            disabled={sending || !changed}
            class="flex-[2] rounded-xl bg-gradient-to-r from-barbi to-mpink text-white font-semibold py-3 disabled:opacity-60"
          >
            {sending ? $t('archive.nego.sending') : $t('archive.edit.submit')}
          </button>
        </div>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>

<style>
  .mc-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 11px;
    border-radius: 9999px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    background: rgba(15, 23, 42, 0.72);
    color: #cbd5e1;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.4;
    cursor: pointer;
    transition:
      border-color 0.12s,
      color 0.12s,
      background 0.12s;
  }
  .mc-btn:hover {
    border-color: black;
    color: black;
    background: rgba(238, 232, 170, 0.12);
  }
</style>
