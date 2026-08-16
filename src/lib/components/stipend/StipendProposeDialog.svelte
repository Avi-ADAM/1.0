<script>
  /**
   * The dialog behind every "מלגת קיום" button (docs/PLAN_STIPEND.md §8).
   *
   * One component, three entry points, because the plan's model is one
   * mechanism with parameters rather than four separate flows:
   *
   *   intent 'offer'   — I will fund someone (opened from a member's row, or
   *                      from a mission I want to see finished)
   *   intent 'request' — I need a stipend to keep working here (opened from my
   *                      own mission in progress)
   *   intent 'program' — the rikma should adopt a stipend budget (opened from
   *                      the moach stipend tab)
   *
   * The first two open a bilateral `stipendPledge`; the third opens the
   * rikma-wide `stipendProgram`. Which one a set of terms *needs* is derived
   * from `(k − α)`, and the dialog says so before anything is sent.
   */
  import { t, isRtl } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import StipendTermsFields from './StipendTermsFields.svelte';
  import { consensusScope, computeRecipientTradeoff } from '$lib/stipend/computeStipendEquity.js';
  import { LABEL, MUTED, FAINT, INPUT, WELL, BTN_PRIMARY, BTN_GHOST } from './ui.js';

  /**
   * @typedef {Object} Props
   * @property {boolean} open
   * @property {'offer'|'request'|'program'} [intent]
   * @property {string} projectId
   * @property {string} [projectName]
   * @property {Array<{id:string,username:string}>} [members]
   * @property {string} [myId]
   * @property {string} [funderId] - preselected funder
   * @property {string} [recipientId] - preselected recipient
   * @property {string} [missionId] - scope the pledge to one mission
   * @property {string} [missionName]
   * @property {number|null} [marketRate] - the mission's ₪/hour
   * @property {number|null} [missionValue] - M×H, for the give-up preview
   * @property {number|null} [rikmaTotal] - the rikma's current value
   * @property {any} [policy] - Project.stipendPolicy (null = legacy = bilateral)
   * @property {number|null} [defaultRate]
   * @property {number|null} [defaultCostShare]
   * @property {string|null} [programId]
   * @property {() => void} [onDone]
   */

  /** @type {Props} */
  let {
    open = $bindable(false),
    intent = 'offer',
    projectId,
    projectName = '',
    members = [],
    myId = '',
    funderId = '',
    recipientId = '',
    missionId = '',
    missionName = '',
    marketRate = null,
    missionValue = null,
    rikmaTotal = null,
    policy = null,
    defaultRate = null,
    defaultCostShare = null,
    programId = null,
    onDone
  } = $props();

  const isProgram = $derived(intent === 'program');

  // Opened from a card, the caller knows a mission — not the rikma's member
  // list, its stipend policy or its defaults. Fetch them once on open rather
  // than making every call site thread them through.
  let fetchedMembers = $state([]);
  let fetchedPolicy = $state(undefined);
  let loadingContext = $state(false);
  const memberOptions = $derived(members.length > 0 ? members : fetchedMembers);
  const activePolicy = $derived(fetchedPolicy !== undefined ? fetchedPolicy : policy);


  /**
   * Seeded from the props each time the dialog opens rather than once at
   * construction: the same button can be re-opened after the rikma's defaults
   * changed, and a dialog that quietly kept the first values it ever saw would
   * send terms nobody chose.
   * @returns {import('$lib/stipend/types.js').StipendTerms}
   */
  function seedTerms() {
    return {
      mode: 'equity',
      // A programme exists precisely to let the rikma carry the cost; a
      // bilateral pledge defaults to the model that dilutes nobody.
      costShare: intent === 'program' ? (defaultCostShare ?? 0) : (defaultCostShare ?? 1),
      equityMultiplier: 1,
      stipendRate: defaultRate ?? 0,
      monthlyCap: null,
      totalCap: null,
      noticeCycles: 1,
      revenueTrigger: null,
      recourse: 'nonRecourse'
    };
  }

  /** @type {import('$lib/stipend/types.js').StipendTerms} */
  let terms = $state(seedTerms());

  $effect(() => {
    if (!open || members.length > 0 || fetchedMembers.length > 0 || loadingContext || !projectId) {
      return;
    }
    loadingContext = true;
    executeAction('getStipendOverview', { projectId })
      .then((res) => {
        if (res?.success) {
          fetchedMembers = res.data?.members ?? [];
          fetchedPolicy = res.data?.policyIsDefault ? null : (res.data?.policy ?? null);
          if (!terms.stipendRate && res.data?.defaultRate) {
            terms.stipendRate = Number(res.data.defaultRate);
          }
        }
      })
      .catch((e) => console.warn('[StipendProposeDialog] context load failed:', e))
      .finally(() => (loadingContext = false));
  });

  let chosenFunder = $state('');
  let chosenRecipient = $state('');
  let why = $state('');
  let busy = $state(false);

  // Same reason as seedTerms: the parties come from the props of *this*
  // opening, not from whenever the component happened to be created.
  $effect(() => {
    if (!open) return;
    terms = seedTerms();
    chosenFunder = funderId || (intent === 'offer' ? myId : '');
    chosenRecipient = recipientId || (intent === 'request' ? myId : '');
  });

  const scope = $derived(consensusScope(terms));

  // What the recipient actually trades away, in the two numbers §8 demands are
  // on screen *before* anyone signs: the share and the cash.
  const tradeoff = $derived(
    missionValue != null && missionValue > 0 && Number(terms.stipendRate) > 0 && marketRate
      ? computeRecipientTradeoff({
          missionValue,
          stipendTotal: (Number(terms.stipendRate) / Number(marketRate)) * missionValue,
          rikmaTotalWithout: Math.max(0, (rikmaTotal ?? missionValue) - missionValue),
          terms
        })
      : null
  );

  const title = $derived(
    isProgram
      ? $t('stipend.propose.titleProgram')
      : intent === 'request'
        ? $t('stipend.propose.titleRequest')
        : $t('stipend.propose.titleOffer')
  );

  function close() {
    open = false;
  }

  async function send() {
    if (busy) return;
    busy = true;
    try {
      if (isProgram) {
        const res = await executeAction('proposeStipendProgram', {
          projectId,
          stipendRate: Number(terms.stipendRate) || 0,
          totalCap: Number(terms.totalCap) || 0,
          monthlyCap: terms.monthlyCap != null ? Number(terms.monthlyCap) : undefined,
          mode: terms.mode,
          costShare: Number(terms.costShare),
          equityMultiplier: Number(terms.equityMultiplier),
          revenueTrigger: terms.revenueTrigger != null ? Number(terms.revenueTrigger) : undefined,
          funderId: chosenFunder || undefined,
          marketRate: marketRate ?? undefined,
          why: why || undefined
        });
        if (res?.success === false) throw new Error(String(res?.error?.message ?? res?.error ?? 'failed'));
        toast.success(
          res?.data?.immediate ? $t('stipend.toast.programLive') : $t('stipend.toast.programProposed')
        );
      } else {
        const res = await executeAction('proposeStipendPledge', {
          projectId,
          funderId: String(chosenFunder),
          recipientId: String(chosenRecipient),
          stipendRate: Number(terms.stipendRate) || 0,
          mode: terms.mode,
          costShare: Number(terms.costShare),
          equityMultiplier: Number(terms.equityMultiplier),
          monthlyCap: terms.monthlyCap != null ? Number(terms.monthlyCap) : undefined,
          totalCap: terms.totalCap != null ? Number(terms.totalCap) : undefined,
          noticeCycles: terms.noticeCycles != null ? Number(terms.noticeCycles) : undefined,
          revenueTrigger: terms.revenueTrigger != null ? Number(terms.revenueTrigger) : undefined,
          recourse: terms.recourse,
          scope: missionId ? 'singleMission' : 'allMissions',
          missionIds: missionId ? [String(missionId)] : undefined,
          programId: programId ?? undefined,
          marketRate: marketRate ?? undefined,
          initiatedBy: intent === 'request' ? 'recipient' : chosenFunder === myId ? 'funder' : 'member',
          why: why || undefined
        });
        if (res?.success === false) throw new Error(String(res?.error?.message ?? res?.error ?? 'failed'));
        toast.success($t('stipend.toast.pledgeProposed'));
      }
      open = false;
      onDone?.();
    } catch (e) {
      console.error('[StipendProposeDialog] send failed:', e);
      toast.error(e instanceof Error ? e.message : $t('stipend.toast.error'));
    } finally {
      busy = false;
    }
  }

  const canSend = $derived(
    Number(terms.stipendRate) > 0 &&
      (isProgram
        ? Number(terms.totalCap) > 0
        : !!chosenFunder && !!chosenRecipient && chosenFunder !== chosenRecipient)
  );
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
    dir={$isRtl ? 'rtl' : 'ltr'}
  >
    <div
      class="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-50 p-5 shadow-2xl"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold">{title}</h2>
          {#if projectName}
            <p class={MUTED}>{projectName}</p>
          {/if}
        </div>
        <button type="button" class="text-2xl leading-none text-gray-600 dark:text-gray-300 hover:text-goldink" onclick={close}>×</button>
      </div>

      <p class="mt-2 text-sm text-gray-800 dark:text-gray-100">
        {isProgram ? $t('stipend.propose.introProgram') : $t('stipend.propose.introPledge')}
      </p>

      {#if missionName}
        <p class="mt-2 {MUTED}">
          {$t('stipend.propose.forMission', { name: missionName })}
        </p>
      {/if}

      <div class="mt-4 flex flex-col gap-4">
        {#if !isProgram}
          <label class="flex flex-col gap-1">
            <span class={LABEL}>{$t('stipend.propose.funder')}</span>
            <select
              bind:value={chosenFunder}
              class={INPUT}
            >
              <option value="">{$t('stipend.propose.pick')}</option>
              {#each memberOptions as m (m.id)}
                <option value={m.id}>{m.username}</option>
              {/each}
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class={LABEL}>{$t('stipend.propose.recipient')}</span>
            <select
              bind:value={chosenRecipient}
              class={INPUT}
            >
              <option value="">{$t('stipend.propose.pick')}</option>
              {#each memberOptions as m (m.id)}
                <option value={m.id}>{m.username}</option>
              {/each}
            </select>
          </label>
        {:else}
          <label class="flex flex-col gap-1">
            <span class={LABEL}>{$t('stipend.propose.funderOptional')}</span>
            <select
              bind:value={chosenFunder}
              class={INPUT}
            >
              <option value="">{$t('stipend.propose.noFunderYet')}</option>
              {#each memberOptions as m (m.id)}
                <option value={m.id}>{m.username}</option>
              {/each}
            </select>
            <span class={MUTED}>{$t('stipend.propose.noFunderYetExplain')}</span>
          </label>
        {/if}

        <StipendTermsFields bind:terms {marketRate} policy={activePolicy} showBudget={isProgram} />

        <!-- §8: the recipient must see both numbers before signing. -->
        {#if tradeoff && terms.mode === 'equity'}
          <div class="{WELL} p-3 text-sm">
            <p class="{LABEL} mb-2 block">
              {$t('stipend.tradeoff.title')}
            </p>
            <p>
              {$t('stipend.tradeoff.without', { count: tradeoff.sharePctWithout.toFixed(1) })}
            </p>
            <p class="font-semibold">
              {$t('stipend.tradeoff.with', {
                count: tradeoff.sharePctWith.toFixed(1),
                cash: Math.round(tradeoff.cash)
              })}
            </p>
            {#if tradeoff.equityGivenUp === 0}
              <p class="mt-1 {FAINT}">{$t('stipend.tradeoff.noneGivenUp')}</p>
            {/if}
          </div>
        {/if}

        <label class="flex flex-col gap-1">
          <span class={LABEL}>{$t('stipend.propose.why')}</span>
          <textarea
            bind:value={why}
            rows="2"
            class={INPUT}
          ></textarea>
        </label>

        <p class={MUTED}>
          {scope === 'bilateral'
            ? $t('stipend.propose.scopeNoteBilateral')
            : $t('stipend.propose.scopeNoteRikma')}
        </p>
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
          disabled={busy || !canSend}
          onclick={send}
        >
          {busy ? $t('stipend.actions.sending') : $t('stipend.actions.propose')}
        </button>
      </div>
    </div>
  </div>
{/if}
