<script>
  import { page } from '$app/state';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';

  const moachStore = getMoachStore();
  let projectId = $derived(page.params.projectId);

  const placeholder = {
    he: 'בחירת משימה בתהליך',
    ar: 'اختيار المهمة المتابعة',
    en: 'choose mission in progress'
  };

  const noM = {
    he: 'לא נמצאו משימות בתהליך עבורך כדאי ליצור משימה חדשה בטאב יצירה',
    en: 'no missions in progress found for you, you may want to create a new one in the "add" tab',
    ar: 'لم يتم العثور على مهام في الحالة المتابعة لك، قد تريد إنشاء مهمة جديدة في علامة "إضافة"'
  };

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

    await sendToSer(
      {
        mesimabetahaliches: [selectedId],
        uid: [page.data.uid],
        isAssigned: true,
        id: taskId
      },
      '31updateTask',
      null,
      null,
      false,
      fetch
    ).then((data) => {
      if (data.data != null) {
        loading = false;
        success = true;
        moachStore.refreshBase(projectId, fetch);
        setTimeout(() => onClose?.(), 5000);
      } else {
        loading = false;
        error = true;
      }
    }).catch(() => {
      loading = false;
      error = true;
    });
  }
</script>

{#if filtered.length !== 0}
  <h2 class="text-gold text-center text-lg">{placeholder[$lang]}</h2>
  <div class="w-full flex flex-row items-center justify-center gap-2 p-4">
    <select
      bind:value={selected}
      class="bg-gold text-barbi font-bold rounded-lg px-3 py-2 border border-barbi focus:outline-none focus:ring-2 focus:ring-barbi"
    >
      <option value="">{placeholder[$lang]}</option>
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
    {noM[$lang]}
  </span>
{/if}
