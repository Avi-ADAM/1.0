<script>
  import { page } from '$app/state';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';

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
  <span class="text-sm text-gold block p-4 text-center">
    {$t('mission.chooseM.emptyState')}
  </span>
{/if}
