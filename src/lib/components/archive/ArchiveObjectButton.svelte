<script>
  /**
   * Opening an archive / release proposal on a rikma object
   * (PLAN_OBJECT_ARCHIVAL — phase 3).
   *
   * The single entry point for every object type, so the rules live in one
   * place: a reason is required once hours have accrued, the settlement is
   * chosen up front, and the button says plainly what will happen — in a
   * rikma of one it happens immediately, otherwise it opens a proposal the
   * others can approve, discuss or counter.
   */
  import { Drawer } from 'vaul-svelte';
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { hasAccruedValue } from '$lib/archive/dormancy.js';

  /**
   * @typedef {Object} Props
   * @property {'openMission'|'missionInProgress'|'openResource'|'resourceInProgress'|'matanot'} targetKind
   * @property {string|number} targetId
   * @property {string} [targetName]
   * @property {number} [accruedHours] - hours already logged on the object
   * @property {boolean} [isMine] - I carry this commitment (enables release)
   * @property {boolean} [soleMember] - a rikma of one: this applies immediately
   * @property {string} [label]
   * @property {string} [className]
   * @property {() => void} [onDone]
   */

  /** @type {Props} */
  let {
    targetKind,
    targetId,
    targetName = '',
    accruedHours = 0,
    isMine = false,
    soleMember = false,
    label = '',
    className = '',
    onDone
  } = $props();

  const inProgress = $derived(
    targetKind === 'missionInProgress' || targetKind === 'resourceInProgress'
  );
  const accrued = $derived(hasAccruedValue({ hoursAlready: accruedHours }));
  /** Releasing is only meaningful for a commitment that is mine. */
  const canRelease = $derived(inProgress && isMine);

  let open = $state(false);
  let scope = $state('archive');
  let why = $state('');
  let hoursOutcome = $state('waive');
  let hoursToCredit = $state(0);
  let alsoProposeArchive = $state(false);
  let sending = $state(false);

  $effect(() => {
    if (!open) return;
    scope = canRelease ? 'release' : 'archive';
    why = '';
    hoursOutcome = accrued ? 'credit' : 'waive';
    hoursToCredit = accruedHours ?? 0;
    alsoProposeArchive = false;
  });

  // A removal that touches someone's accrued work must carry a reason; where
  // nothing accrued a reason is welcome but never a gate.
  const missingReason = $derived(accrued && why.trim().length === 0);

  async function submit() {
    if (sending || missingReason) return;
    sending = true;
    try {
      const res = await executeAction('proposeObjectArchive', {
        targetKind,
        targetId: String(targetId),
        scope,
        why: why.trim() || undefined,
        hoursOutcome: inProgress ? hoursOutcome : undefined,
        hoursToCredit: hoursOutcome === 'credit' ? Number(hoursToCredit) : undefined,
        alsoProposeArchive: scope === 'release' ? alsoProposeArchive : undefined
      });
      if (res?.success === false) throw new Error(String(res?.error ?? 'failed'));

      const data = res?.data ?? {};
      if (data.immediate) {
        toast.success(
          data.membershipEnded
            ? $t('archive.toast.appliedAndLeft')
            : $t('archive.toast.applied')
        );
      } else {
        toast.success(
          data.endsMembership
            ? $t('archive.toast.proposedEndsMembership')
            : $t('archive.toast.proposed')
        );
      }
      open = false;
      onDone?.();
    } catch (e) {
      console.error('[ArchiveObjectButton] proposal failed:', e);
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
  {label || $t('archive.propose.button')}
</button>

<Drawer.Root bind:open>
  <Drawer.Portal>
    <Drawer.Overlay class="fixed inset-0 bg-black/50 z-[60]" />
    <Drawer.Content
      class="bg-white dark:bg-gray-800 flex flex-col rounded-t-2xl fixed bottom-0 left-0 right-0 max-h-[92vh] z-[61]"
    >
      <div class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 my-3"></div>

      <div class="overflow-y-auto px-5 pb-6 space-y-5">
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100">
            {$t('archive.propose.title')}
          </h2>
          <p class="text-sm text-gray-500">{targetName}</p>
        </div>

        {#if canRelease}
          <fieldset class="space-y-2">
            <legend class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {$t('archive.propose.scopeQuestion')}
            </legend>
            <label class="flex items-start gap-2 text-sm">
              <input type="radio" value="release" bind:group={scope} class="mt-1" />
              <span>
                <span class="font-medium">{$t('archive.propose.scopeRelease')}</span>
                <span class="block text-xs text-gray-500">
                  {$t('archive.propose.scopeReleaseHint')}
                </span>
              </span>
            </label>
            <label class="flex items-start gap-2 text-sm">
              <input type="radio" value="archive" bind:group={scope} class="mt-1" />
              <span>
                <span class="font-medium">{$t('archive.propose.scopeArchive')}</span>
                <span class="block text-xs text-gray-500">
                  {$t('archive.propose.scopeArchiveHint')}
                </span>
              </span>
            </label>
          </fieldset>
        {/if}

        {#if inProgress && accrued}
          <!-- Someone's work is on this object; what happens to it is part of
               the proposal, not an afterthought. -->
          <fieldset class="space-y-2">
            <legend class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {$t('archive.nego.hoursQuestion')}
            </legend>
            <p class="text-xs text-gray-500">
              {$t('archive.hours.accrued', { count: accruedHours })}
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
                  {$t('archive.hours.creditAmount', { count: accruedHours })}
                </span>
                <input
                  type="number"
                  min="0"
                  max={accruedHours}
                  step="0.5"
                  bind:value={hoursToCredit}
                  class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
                />
              </label>
            {/if}
          </fieldset>
        {/if}

        <label class="block">
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {$t('archive.propose.why')}
            {#if accrued}<span class="text-barbi"> *</span>{/if}
          </span>
          <textarea
            rows="3"
            bind:value={why}
            placeholder={$t('archive.propose.whyPlaceholder')}
            class="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-900 p-2"
          ></textarea>
          {#if missingReason}
            <span class="text-xs text-barbi">{$t('archive.propose.whyRequired')}</span>
          {/if}
        </label>

        {#if scope === 'release' && !soleMember}
          <!-- Withdrawing is mine to decide; whether the rikma still needs the
               thing at all is the rikma's. -->
          <label class="flex items-start gap-2 text-sm">
            <input type="checkbox" bind:checked={alsoProposeArchive} class="mt-1" />
            <span>
              <span class="font-medium">{$t('archive.propose.alsoClose')}</span>
              <span class="block text-xs text-gray-500">{$t('archive.propose.alsoCloseHint')}</span>
            </span>
          </label>
        {/if}

        <p class="text-xs text-gray-500">
          {soleMember
            ? $t('archive.propose.immediateNote')
            : $t('archive.propose.proposalNote')}
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
            disabled={sending || missingReason}
            class="flex-[2] rounded-xl bg-gradient-to-r from-barbi to-mpink text-white font-semibold py-3 disabled:opacity-60"
          >
            {sending
              ? $t('archive.nego.sending')
              : soleMember
                ? $t('archive.propose.submitImmediate')
                : $t('archive.propose.submit')}
          </button>
        </div>
      </div>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
