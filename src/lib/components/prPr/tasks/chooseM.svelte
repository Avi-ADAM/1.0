<script>
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { buildPublishAsMissionUrl } from '$lib/acts/publishAsMission.js';

  const moachStore = getMoachStore();
  let projectId = $derived(page.params.projectId);


  /**
   * @typedef {Object} Props
   * @property {any} taskId
   * @property {Array<any>} [bmiData]
   * @property {() => void} [onClose]
   */

  /** @type {Props} */
  let { taskId, bmiData = [], onClose } = $props();

  let loading = $state(false);
  let error = $state(false);
  let success = $state(false);
  let selected = $state('');

  let filtered = $derived(bmiData.filter(
    (e) => e.attributes.users_permissions_user.data.id === page.data.uid
  ));

  /**
   * The act being taken, looked up from the store the acts page already fills.
   *
   * Only `modal.id` travels through `openModal('assign', id)`, but the
   * create-a-mission path below wants the act's name, description and roles to
   * prefill the mission form — so read the row back rather than widening the
   * modal's contract.
   */
  let act = $derived.by(() => {
    const acts = moachStore.state.projects[projectId]?.base?.acts?.data ?? [];
    const found = acts.find((a) => String(a?.id ?? '') === String(taskId));
    if (!found) return null;
    return { id: found.id, ...(found.attributes ?? found) };
  });

  /**
   * Held across the whole navigation, not just the click. The create page
   * resolves the act's vocabulary against the catalogue before the form can
   * open — seconds, sometimes — and `goto` resolves only once that load
   * settles. Without awaiting it the modal would close instantly onto an
   * unchanged screen with nothing to say a form was on its way.
   */
  let opening = $state(false);

  /**
   * "I have no mission for this yet" — open the mission form prefilled from the
   * act, carrying `fromAct` so the act is attached to whatever gets created.
   *
   * `assignActToMe` asks the create page to also put the act in this member's
   * hands, but only once the mission is a real mesimabetahalich. If the rikma
   * has to vote (`pendm`) or the mission goes out for candidates
   * (`openMission`), claiming the act now would assert an assignment nobody has
   * agreed to yet.
   */
  async function createMission() {
    if (!act || opening) return;
    opening = true;
    try {
      await goto(`${buildPublishAsMissionUrl(projectId, act, $lang)}&assignActToMe=1`);
      onClose?.();
    } finally {
      opening = false;
    }
  }

  async function add() {
    loading = true;
    const selectedMission = filtered.find((m) => m.attributes.name === selected);
    const selectedId = selectedMission?.id ?? null;

    try {
      const result = await executeAction('updateTask', {
        mesimabetahaliches: [selectedId],
        uid: [page.data.uid],
        isAssigned: true,
        id: taskId,
        projectId
      });

      if (result.success) {
        loading = false;
        success = true;
        moachStore.refreshBase(projectId, fetch);
        setTimeout(() => onClose?.(), 5000);
      } else {
        loading = false;
        error = true;
      }
    } catch {
      loading = false;
      error = true;
    }
  }
</script>

{#if filtered.length !== 0}
  <h2 class="text-gold text-center text-lg">{$t('mission.chooseM.heading')}</h2>
  <div class="w-full flex flex-row items-center justify-center gap-2 p-4">
    <select
      bind:value={selected}
      class="bg-gold text-barbi font-bold rounded-lg px-3 py-2 border border-barbi focus:outline-none focus:ring-2 focus:ring-barbi"
    >
      <option value="">{$t('mission.chooseM.heading')}</option>
      {#each filtered as mission}
        <option value={mission.attributes.name}>{mission.attributes.name}</option>
      {/each}
    </select>
    {#if selected}
      <Button onClick={add} {loading} {success} {error}>
        <Arrow back={$lang === 'en'} />
      </Button>
    {/if}
  </div>
{:else}
  <span class="text-sm text-gold block px-4 pt-4 text-center">
    {$t('mission.chooseM.emptyState')}
  </span>
{/if}

<!-- Available in both states: the picker only lists missions you already run,
     and "none of these" is a legitimate answer even when the list is not
     empty. The old empty state just told the member to go find the create tab
     themselves, which ended the flow. -->
{#if act}
  <div class="flex justify-center pb-4 {filtered.length === 0 ? 'pt-3' : 'pt-0'}">
    <button
      type="button"
      onclick={createMission}
      disabled={opening}
      aria-busy={opening}
      class="inline-flex items-center gap-1.5 rounded-lg border border-gold/40 px-3 py-2 text-sm font-bold text-gold transition-colors hover:bg-gold/10 disabled:opacity-60"
    >
      {#if opening}
        <svg class="spin" viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <circle
            cx="12" cy="12" r="9" fill="none" stroke="currentColor"
            stroke-width="3" stroke-linecap="round" stroke-dasharray="40 20"
          />
        </svg>
        {$t('mission.actsTable.openingForm')}
      {:else}
        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        {$t('mission.chooseM.createMission')}
      {/if}
    </button>
  </div>
{/if}

<style>
  .spin {
    animation: choose-spin 0.8s linear infinite;
  }

  @keyframes choose-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    .spin { animation-duration: 2.4s; }
  }
</style>
