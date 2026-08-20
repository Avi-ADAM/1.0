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
  import {
    consensusScope,
    computeRecipientTradeoff,
    effectiveStipendPolicy
  } from '$lib/stipend/computeStipendEquity.js';
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

  /**
   * The dialog can change its own mind about which agreement this is.
   *
   * A member sets terms that dilute the rikma, is told the rikma only allows
   * stipends that dilute nobody, and is pointed at "a stipend program" — which
   * used to be a dead end: the program lives on the moach tab, and nothing on
   * this screen led there. The escalation now happens in place, carrying the
   * terms already typed, because it is the same conversation: the program *is*
   * how you ask the rikma for exactly these terms.
   */
  let intentOverride = $state(/** @type {'offer'|'request'|'program'|null} */ (null));
  const activeIntent = $derived(intentOverride ?? intent);
  const isProgram = $derived(activeIntent === 'program');

  // Opened from a card, the caller knows a mission — not the rikma's member
  // list, its stipend policy or its defaults. Fetch them once on open rather
  // than making every call site thread them through.
  let fetchedMembers = $state([]);
  /** In-progress missions of the rikma, so the proposal can name the work. */
  let fetchedMissions = $state([]);
  let fetchedPolicy = $state(undefined);
  let loadingContext = $state(false);
  const memberOptions = $derived(members.length > 0 ? members : fetchedMembers);
  const activePolicy = $derived(fetchedPolicy !== undefined ? fetchedPolicy : policy);


  /**
   * Seeded from the props each time the dialog opens rather than once at
   * construction: the same button can be re-opened after the rikma's defaults
   * changed, and a dialog that quietly kept the first values it ever saw would
   * send terms nobody chose.
   * Takes the intent as an argument rather than reading `activeIntent`: this
   * runs inside the on-open effect, and reading the override there would make
   * the effect depend on state it also resets — clicking "open a program"
   * would immediately undo itself.
   * @param {'offer'|'request'|'program'} forIntent
   * @returns {import('$lib/stipend/types.js').StipendTerms}
   */
  function seedTerms(forIntent) {
    return {
      mode: 'equity',
      // A programme exists precisely to let the rikma carry the cost; a
      // bilateral pledge defaults to the model that dilutes nobody.
      costShare: forIntent === 'program' ? (defaultCostShare ?? 0) : (defaultCostShare ?? 1),
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
  // A placeholder only: the dialog renders nothing until `open`, and the effect
  // below reseeds from the caller's intent every time it opens.
  let terms = $state(seedTerms('offer'));

  /**
   * Fetched once per dialog session. The guard used to skip the fetch whenever
   * the caller had passed `members` — which silently starved everything *else*
   * the overview carries (the mission list above all), because no call site
   * passes those.
   */
  let contextLoaded = $state(false);

  $effect(() => {
    if (!open || contextLoaded || loadingContext || !projectId) return;
    loadingContext = true;
    contextLoaded = true;
    executeAction('getStipendOverview', { projectId })
      .then((res) => {
        if (res?.success) {
          fetchedMembers = res.data?.members ?? [];
          fetchedMissions = res.data?.missions ?? [];
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
  /**
   * Which work the stipend is for. A subsistence stipend is never abstract —
   * somebody is doing something they cannot afford to keep doing — so the
   * mission travels with the proposal through every intent, including the
   * escalation to a rikma-wide program.
   *
   * Held as `"<kind>:<id>"`, because a mission in progress and an open mission
   * are different tables that share an id space — keying either the options or
   * the choice on the bare id makes `mesimabetahalich 142` and
   * `open_mission 142` the same row, which they are not.
   */
  let chosenMission = $state('');
  let why = $state('');
  let busy = $state(false);

  // Same reason as seedTerms: the parties come from the props of *this*
  // opening, not from whenever the component happened to be created.
  $effect(() => {
    if (!open) return;
    terms = seedTerms(intent);
    chosenFunder = funderId || (intent === 'offer' ? myId : '');
    chosenRecipient = recipientId || (intent === 'request' ? myId : '');
    // The prop is a mission *in progress* — that is the only kind a card can
    // open this dialog from.
    chosenMission = missionId ? `inProgress:${missionId}` : '';
  });

  /**
   * Every mission a stipend could be attached to. Not filtered by recipient —
   * it is the other way round: **the mission decides who is paid**. Picking one
   * that is in progress names its performer; picking one that is still open
   * names nobody, and whoever takes it signs the pledge then.
   */
  const missionOptions = $derived(fetchedMissions);
  const missionKey = (m) => `${m.kind}:${m.id}`;
  const chosenMissionRow = $derived(
    fetchedMissions.find((m) => missionKey(m) === chosenMission) ?? null
  );
  /** True while the chosen mission has nobody on it yet. */
  const missionIsOpen = $derived(chosenMissionRow?.kind === 'open');
  /** The mission's own ₪/hour is the ceiling; the caller's prop wins if given. */
  const effectiveMarketRate = $derived(marketRate ?? chosenMissionRow?.perhour ?? null);

  /**
   * The recipient is derived from the work, never picked on its own: a stipend
   * pays the person doing the mission. This runs after the mission changes and
   * is the only writer of `chosenRecipient` once a mission is chosen.
   */
  $effect(() => {
    if (!chosenMissionRow) return;
    chosenRecipient = chosenMissionRow.userId ? String(chosenMissionRow.userId) : '';
  });

  const scope = $derived(consensusScope(terms));

  /**
   * These terms dilute every member, and the rikma has not agreed to that in
   * general — so they need the rikma's vote. That is what a program is.
   * (An existing program the caller already pointed at is the vote, so no
   * escalation is offered there.)
   */
  const needsProgram = $derived(
    !isProgram &&
      scope === 'rikma' &&
      !programId &&
      effectiveStipendPolicy(activePolicy) === 'bilateral'
  );

  // M×H of the work being funded — the caller's number when it opened from a
  // mission card, otherwise the mission the member just picked here.
  const effectiveMissionValue = $derived(
    missionValue ??
      (chosenMissionRow?.hours != null && chosenMissionRow?.perhour != null
        ? Number(chosenMissionRow.hours) * Number(chosenMissionRow.perhour)
        : null)
  );

  // What the recipient actually trades away, in the two numbers §8 demands are
  // on screen *before* anyone signs: the share and the cash.
  const tradeoff = $derived(
    effectiveMissionValue != null &&
    effectiveMissionValue > 0 &&
    Number(terms.stipendRate) > 0 &&
    effectiveMarketRate
      ? computeRecipientTradeoff({
          missionValue: effectiveMissionValue,
          stipendTotal:
            (Number(terms.stipendRate) / Number(effectiveMarketRate)) * effectiveMissionValue,
          rikmaTotalWithout: Math.max(
            0,
            (rikmaTotal ?? effectiveMissionValue) - effectiveMissionValue
          ),
          terms
        })
      : null
  );


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

  /** Keep every number the member already typed; only the ask changes. */
  function escalateToProgram() {
    intentOverride = 'program';
  }

  const title = $derived(
    isProgram
      ? $t('stipend.propose.titleProgram')
      : activeIntent === 'request'
        ? $t('stipend.propose.titleRequest')
        : $t('stipend.propose.titleOffer')
  );

  function close() {
    open = false;
    // Next opening starts from the caller's intent again, not from wherever
    // this session escalated to.
    intentOverride = null;
  }

  async function send() {
    if (busy) return;
    busy = true;
    try {
      if (isProgram) {
        const res = await executeAction('proposeStipendProgram', {
          projectId,
          stipendRate: Number(terms.stipendRate) || 0,
          // Exactly one of the two is sent: a closed total, or a monthly
          // ceiling that runs until stopped. Sending 0 for the unused one
          // would read as "a budget of nothing" on the card.
          totalCap: Number(terms.totalCap) > 0 ? Number(terms.totalCap) : undefined,
          monthlyCap: Number(terms.monthlyCap) > 0 ? Number(terms.monthlyCap) : undefined,
          mode: terms.mode,
          costShare: Number(terms.costShare),
          equityMultiplier: Number(terms.equityMultiplier),
          revenueTrigger: terms.revenueTrigger != null ? Number(terms.revenueTrigger) : undefined,
          funderId: chosenFunder || undefined,
          // A program is normally *for* someone, for a named piece of work —
          // the rikma is voting on being diluted, and it deserves to know for
          // what. These write the concrete pledge under the programme.
          recipientId: chosenRecipient || undefined,
          // One of the two, never both: an open mission has no
          // `mesimabetahalich` to scope hours by yet — it carries the need
          // itself until somebody takes it.
          missionIds: chosenMissionRow && !missionIsOpen ? [String(chosenMissionRow.id)] : undefined,
          openMissionId: chosenMissionRow && missionIsOpen ? String(chosenMissionRow.id) : undefined,
          marketRate: effectiveMarketRate ?? undefined,
          why: why || undefined
        });
        if (res?.success === false) throw new Error(actionError(res));
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
          scope: 'singleMission',
          missionIds: chosenMissionRow ? [String(chosenMissionRow.id)] : undefined,
          programId: programId ?? undefined,
          marketRate: effectiveMarketRate ?? undefined,
          initiatedBy: activeIntent === 'request' ? 'recipient' : chosenFunder === myId ? 'funder' : 'member',
          why: why || undefined
        });
        if (res?.success === false) throw new Error(actionError(res));
        toast.success($t('stipend.toast.pledgeProposed'));
      }
      close();
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
      // The mission is the meter: no mission, no monthly amount, nothing to
      // propose. Same rule the server enforces.
      !!chosenMission &&
      (isProgram
        ? // Either ceiling will do — a closed total, or a monthly amount that
          // renews until someone stops it. What a program may not have is
          // neither, which would put an unknown sum to the vote.
          Number(terms.totalCap) > 0 || Number(terms.monthlyCap) > 0
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

      {#if isProgram && intentOverride === 'program'}
        <p class="mt-2 {MUTED}">{$t('stipend.propose.escalated')}</p>
      {/if}

      {#if missionName}
        <p class="mt-2 {MUTED}">
          {$t('stipend.propose.forMission', { name: missionName })}
        </p>
      {/if}

      <div class="mt-4 flex flex-col gap-4">
        <!-- The mission comes first, because it decides the rest: it is the
             meter the monthly payment is computed on (hours approved on it
             that month × the stipend rate), its ₪/hour is the ceiling the rate
             is checked against, and whoever is doing it is who gets paid. -->
        <label class="flex flex-col gap-1">
          <span class={LABEL}>{$t('stipend.propose.mission')} *</span>
          <select bind:value={chosenMission} class={INPUT}>
            <option value="">{$t('stipend.propose.missionPick')}</option>
            {#each missionOptions as m (missionKey(m))}
              <option value={missionKey(m)}>
                {m.kind === 'open' ? `🔓 ${m.name}` : m.name}{m.username
                  ? ` · ${m.username}`
                  : ''}{m.perhour ? ` · ₪${m.perhour}/${$t('stipend.card.hour')}` : ''}
              </option>
            {/each}
          </select>
          {#if chosenMissionRow}
            <span class={MUTED}>
              {chosenMissionRow.hours != null && chosenMissionRow.perhour != null
                ? $t('stipend.card.missionValue', {
                    hours: chosenMissionRow.hours,
                    rate: chosenMissionRow.perhour,
                    value: Math.round(
                      Number(chosenMissionRow.hours) * Number(chosenMissionRow.perhour)
                    )
                  })
                : $t('stipend.propose.missionExplain')}
            </span>
          {:else}
            <span class={MUTED}>{$t('stipend.propose.missionExplain')}</span>
          {/if}
        </label>

        <!-- Derived, not chosen: the person doing the mission is the person the
             stipend pays. An open mission has nobody yet, and that is a legal
             state — the taker signs the pledge when they take it. -->
        {#if chosenMissionRow}
          <div class="flex flex-col gap-1">
            <span class={LABEL}>{$t('stipend.propose.recipient')}</span>
            {#if missionIsOpen}
              <p class="text-sm font-semibold text-goldink">
                {$t('stipend.propose.openMissionNoTaker')}
              </p>
              <span class={MUTED}>{$t('stipend.propose.openMissionExplain')}</span>
            {:else}
              <p class="text-sm font-bold text-gray-900 dark:text-white">
                {chosenMissionRow.username || $t('stipend.propose.noRecipientYet')}
              </p>
              <span class={MUTED}>{$t('stipend.propose.recipientDerived')}</span>
            {/if}
          </div>
        {/if}

        <label class="flex flex-col gap-1">
          <span class={LABEL}>
            {isProgram ? $t('stipend.propose.funderOptional') : $t('stipend.propose.funder')}
          </span>
          <select bind:value={chosenFunder} class={INPUT}>
            <option value="">
              {isProgram ? $t('stipend.propose.noFunderYet') : $t('stipend.propose.pick')}
            </option>
            {#each memberOptions as m (m.id)}
              {#if m.id !== chosenRecipient}
                <option value={m.id}>{m.username}</option>
              {/if}
            {/each}
          </select>
          {#if isProgram}
            <span class={MUTED}>{$t('stipend.propose.noFunderYetExplain')}</span>
          {/if}
          <!-- Naming someone else as the payer is a request, not a decision:
               their signature is required and silence will not stand in for it. -->
          {#if chosenFunder && chosenFunder !== myId}
            <span class={MUTED}>{$t('stipend.propose.funderMustSign')}</span>
          {/if}
        </label>

        <StipendTermsFields
          bind:terms
          marketRate={effectiveMarketRate}
          policy={activePolicy}
          showBudget={isProgram}
          allowRikmaScope={isProgram}
        />

        {#if needsProgram}
          <!-- Not a refusal: the way to have exactly these terms, stated as the
               next step rather than as a rule the member broke. -->
          <div class="{WELL} p-3 flex flex-col gap-2">
            <p class="text-sm font-semibold">{$t('stipend.propose.needsProgramTitle')}</p>
            <p class={MUTED}>{$t('stipend.propose.needsProgramExplain')}</p>
            <button
              type="button"
              class="{BTN_GHOST} self-start px-3 py-2 text-sm"
              onclick={escalateToProgram}
            >
              🗳️ {$t('stipend.propose.openProgram')}
            </button>
          </div>
        {/if}

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
