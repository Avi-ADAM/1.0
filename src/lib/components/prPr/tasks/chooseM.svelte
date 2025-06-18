<script>
  import { page } from '$app/stores';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import MultiSelect from 'svelte-multiselect';
  import { lang } from '$lib/stores/lang.js';
  import { createEventDispatcher } from 'svelte';
  import {sendToSer} from '$lib/send/sendToSer.js';
  const dispatch = createEventDispatcher();
   let placeholder = {
    he: 'בחירת משימה בתהליך',
    ar: ' اختيار المهمة المتابعة',
    en: 'choose mission in progress'
  };
  let loading = $state(false);
  
  let error = $state(false);
  
  let success = $state(false);
  
   async function add () {
    loading = true
    
    console.log(selected);
    const selectedMission = filtered.find(
      (mission) => mission.attributes.name === selected[0]
    );
    const selectedId = selectedMission ? selectedMission.id : null; // קבלת ה-ID המתאים

    console.log(selectedId); // הדפסת ה-ID
    await sendToSer (
        {
            mesimabetahaliches: [selectedId],
            uid: [$page.data.uid],
            isAssigned: true,
            id: taskId
        },
        '31updateTask'
        ,null,null,false,fetch
    ).then((data) => {
        console.log(data);
        if (data.data != null) {
          loading = false
          success = true
          setTimeout(() => {
            dispatch('close');
          }, 5000);
        }else{
          loading = false
          error = true
        }
    }).catch((error) => {
        console.log(error);
        loading = false
        error = true
    });
    //TODO: update task on table directly or from io connection
  };
  let { taskId, bmiData = [] } = $props();
  let filtered = bmiData.filter(
    (e) => e.attributes.users_permissions_user.data.id === $page.data.uid
  );
  
  let selected = $state([]);
  const noM = {
    he: 'לא נמצאו משימות בתהליך עבורך כדאי ליצור משימה חדשה בטאב יצירה',
    en: 'no missions in progress found for you, you may want to create a new one in the "add" tab ',
    ar: 'لم يتم العثور على مهام في الحالة المتابعة لك، قد تريد إنشاء مهمة جديدة في علامة "إضافة" '
  };
</script>
{#key bmiData}
{#if filtered.length !== 0}
<h2 class="text-gold text-center text-lg">{placeholder[$lang]}</h2>
  <div class=" w-full flex-row flex items-center justify-center space-x-2">
    <MultiSelect
      ulOptionsClass="bg-gold"
      liSelectedClass="bg-barbi text-gold"
      bind:selected
      placeholder={placeholder[$lang]}
      options={filtered.map((c) => c.attributes.name)}
      maxSelect={1}
    />
    {#if selected[0]}
      <Button on:click={add} {loading} {success} {error}
        ><Arrow back={$lang == 'en' ? true : false} /></Button
      >
    {/if}
  </div>
{:else}
<span class="text-sm text-gold">
  {noM[$lang]}
</span>
{/if}
{/key}
