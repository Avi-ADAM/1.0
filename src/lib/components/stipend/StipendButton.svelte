<script>
  /**
   * The "subsistence stipend" entry point (docs/PLAN_STIPEND.md §8).
   *
   * One button, wherever the question naturally comes up:
   *   - on my own mission in progress   → "I need a stipend to keep at this"
   *   - on someone else's work, or on a member's row → "I'll fund this"
   *   - in the rikma's stipend tab       → "let's adopt a programme"
   *
   * It only renders where a stipend is actually possible: a rikma that turned
   * the feature off gets no button rather than a button that fails.
   */
  import { t } from '$lib/translations';
  import { effectiveStipendPolicy } from '$lib/stipend/computeStipendEquity.js';
  import StipendProposeDialog from './StipendProposeDialog.svelte';
  // The default fill is the gold/barbi contract pair, so the button reads the
  // same in personal and business, day and night. See ./ui.js.
  import { BTN_PRIMARY } from './ui.js';

  /**
   * @typedef {Object} Props
   * @property {'offer'|'request'|'program'} [intent]
   * @property {string} projectId
   * @property {string} [projectName]
   * @property {Array<{id:string,username:string}>} [members]
   * @property {string} [myId]
   * @property {string} [funderId]
   * @property {string} [recipientId]
   * @property {string} [missionId]
   * @property {string} [missionName]
   * @property {number|null} [marketRate]
   * @property {number|null} [missionValue]
   * @property {number|null} [rikmaTotal]
   * @property {any} [policy] - Project.stipendPolicy (null = legacy = bilateral)
   * @property {number|null} [defaultRate]
   * @property {number|null} [defaultCostShare]
   * @property {string|null} [programId]
   * @property {string} [label]
   * @property {string} [icon]
   * @property {string} [className]
   * @property {() => void} [onDone]
   */

  /** @type {Props} */
  let {
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
    label = '',
    icon = '💗',
    className = '',
    onDone
  } = $props();

  let open = $state(false);

  const enabled = $derived(effectiveStipendPolicy(policy) !== 'off');
  const text = $derived(
    label ||
      (intent === 'request'
        ? $t('stipend.button.request')
        : intent === 'program'
          ? $t('stipend.button.program')
          : $t('stipend.button.offer'))
  );
</script>

{#if enabled}
  <button
    type="button"
    class={className ||
      `flex-1 py-1.5 px-3 ${BTN_PRIMARY} transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5`}
    onclick={(e) => {
      e.stopPropagation();
      open = true;
    }}
    title={text}
  >
    <span aria-hidden="true">{icon}</span>
    <span>{text}</span>
  </button>

  <StipendProposeDialog
    bind:open
    {intent}
    {projectId}
    {projectName}
    {members}
    {myId}
    {funderId}
    {recipientId}
    {missionId}
    {missionName}
    {marketRate}
    {missionValue}
    {rikmaTotal}
    {policy}
    {defaultRate}
    {defaultCostShare}
    {programId}
    {onDone}
  />
{/if}
