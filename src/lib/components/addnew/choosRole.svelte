<script>
  import { isRtl } from '$lib/translations';
import MultiSelect from 'svelte-multiselect';
import { missionNew } from '../../stores/missionNew';
  import { onMount } from 'svelte';
             import { lang } from '$lib/stores/lang.js'

function inc() {
     missionNew.set(find_role_id(selected));
  };
  let roles1 = $state([]);
  let error1 = null;
   let loading = $state(true)
  function find_role_id(role_name_arr){
   var  arr = [];
    for (let j = 0; j< role_name_arr.length; j++ ){
    for (let i = 0; i< roles1.length; i++){
      if(roles1[i].attributes.roleDescription === role_name_arr[j]){
        arr.push(roles1[i].id);
      }
    }
    }
    return arr;
   };


  onMount(async () => {
      try {
          const res = await fetch(`/api/vocab/list?kind=roles&lang=${$lang}`).then((r) => r.json());
            roles1 = res?.data ?? []
                       if ($lang == "he" ){
              for (var i = 0; i < roles1.length; i++){
                if (roles1[i].attributes.localizations?.data?.length > 0){
                roles1[i].attributes.roleDescription = roles1[i].attributes.localizations.data[0].attributes.roleDescription
                }
              }
            }
            roles1 = roles1
            loading = false
      } catch (e) {
          error1 = e
      }
  });

  let { selected = $bindable([]) } = $props();
      const placeholder = `${$lang == "he" ? "בחירת תפקידים נדרשים" : "needed roles"}`;

const adds = {"he":"בחירת תפקידים נדרשים","en": "Add needed roles"}
  const nom = {"he": "לא קיים עדיין ברשימה, ניתן להוסיף בלחיצה על כפתור \"הוספת תפקיד חדש\" שלמטה","en":"Not on the list yet , add it with the \"Add new roll\" button bellow"}

</script>


<div dir="{$isRtl ? 'rtl' : 'ltr'}">
  <lebel for="choos">{adds[$lang]}</lebel>
<MultiSelect
id="choos"
  onChange={inc}
bind:selected
{placeholder}
          noMatchingOptionsMsg={nom[$lang]}
{loading}
options={roles1.map(c => c.attributes.roleDescription)}
/> </div>
