<script>
import MultiSelect from 'svelte-multiselect';
import { missionNew } from '../../stores/missionNew';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
             import { lang } from '$lib/stores/lang.js'
const baseUrl = import.meta.env.VITE_URL

 const dispatch = createEventDispatcher();
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
const parseJSON = (resp) => (resp.json ? resp.json() : resp);
      const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) {
        return resp;
      }
      return parseJSON(resp).then((resp) => {
        throw resp;
      });
    };
    const headers = {
      'Content-Type': 'application/json',
    };
      try {
          const res = await fetch(baseUrl+"/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  tafkidims {data{ id attributes{ roleDescription ${$lang == 'he' ? 'localizations{data{attributes{ roleDescription }}}' : ""}}}}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            roles1 = res.data.tafkidims.data
                       if ($lang == "he" ){
              for (var i = 0; i < roles1.length; i++){
                if (roles1[i].attributes.localizations.data.length > 0){
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

  /** @type {{selected?: any}} */
  let { selected = $bindable([]) } = $props();
      const placeholder = `${$lang == "he" ? "בחירת תפקידים נדרשים" : "needed roles"}`;

const adds = {"he":"בחירת תפקידים נדרשים","en": "Add needed roles"}
  const nom = {"he": "לא קיים עדיין ברשימה, ניתן להוסיף בלחיצה על כפתור \"הוספת תפקיד חדש\" שלמטה","en":"Not on the list yet , add it with the \"Add new roll\" button bellow"}

</script>


<div dir="{$lang == "en" ? "ltr" : "rtl"}">
  <lebel for="choos">{adds[$lang]}</lebel>
<MultiSelect
id="choos"
  on:change={inc}
bind:selected
{placeholder}
          noMatchingOptionsMsg={nom[$lang]}
{loading}
options={roles1.map(c => c.attributes.roleDescription)}
/> </div>