<script>
  import MultiSelect from 'svelte-multiselect';
  import { onMount } from 'svelte';
  import Addnewnee from '../addnew/addNewNeed.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { lang } from '$lib/stores/lang';
  import { t } from '$lib/translations';

  let addnee = $state(false);
  let isLow = $state(true);

  onMount(async () => {
    try {
      const result = await sendToSer({}, '204getAllMashaabims', 0, 0, false, fetch);
      needss = result.data?.mashaabims?.data ?? [];
      onStr?.();
      isLow = false;
    } catch (e) {
      console.log(e);
    }
  });


    function find_need_id(need_name_arr){
     var  arr1 = [];
      for (let j = 0; j< need_name_arr.length; j++ ){
      for (let i = 0; i< needss.length; i++){
        if(needss[i].attributes.name === need_name_arr[j]){
          arr1.push(needss[i].id);
        }
      }
      }
      return arr1;
     };

  let { needss = $bindable([]), selctedi = [], selected = $bindable([]) , onStr, onAddm, onAdd } = $props();
    const placeholder = `הוספת משאבים נדרשים `;

function newn(event) {
  addnee = false;
    const skob = event.skob
  needss.push(skob)
  selected.push(event.name)
  needss = needss
  selected = selected
    onAddm?.({
      x: event.id, 
      skob: event.skob
    })
	};

function incremen() {
    onAdd?.({
      x: find_need_id(selected)
    })
	};
  </script>
  <div dir="rtl" style="max-width: 100%" >
    <h1>{$t('project.chosNed.addResources')}</h1>
    <div class="items-center">
      <div class="gg w-min	pb-1">
        <MultiSelect
        bind:selected
        {placeholder}
        loading={isLow}
        options={needss.map(c => c.attributes.name)}
        onchange={incremen}
        /></div>
      
       <Addnewnee {addnee} onNewn={newn} onmo={true} color={"--barbi-pink"}/>
      </div>
     
    </div>
      <style>
        h1{
            font-size: 29px;  
            color: var(--barbi-pink);
          }
          .gg{
            margin: 0 auto;
          }
        </style>
