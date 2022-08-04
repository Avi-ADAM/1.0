<script>
import MultiSelect from 'svelte-multiselect';
import { missionNew } from '../../stores/missionNew';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
             import { lang } from '$lib/stores/lang.js'

 const dispatch = createEventDispatcher();
  function inc() {

    missionNew.set(find_role_id(selected));
  };
  let roles1 = [];
  let error1 = null;
   
  function find_role_id(role_name_arr){
   var  arr = [];
    for (let j = 0; j< role_name_arr.length; j++ ){
    for (let i = 0; i< roles1.length; i++){
      if(roles1[i].roleDescription === role_name_arr[j]){
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
          const res = await fetch("https://i18.onrender.com/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  tafkidims { id roleDescription ${$lang == 'he' ? 'localizations{roleDescription }' : ""}}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            roles1 = res.data.tafkidims
                       if ($lang == "he" ){
              for (var i = 0; i < roles1.length; i++){
                if (roles1[i].localizations.length > 0){
                roles1[i].roleDescription = roles1[i].localizations[0].roleDescription
                }
              }
            }
            roles1 = roles1
      } catch (e) {
          error1 = e
      }
  });

  let selected;
      const placeholder = `${$lang == "he" ? "בחירת תפקידים נדרשים" : "needed roles"}`;

const adds = {"he":"בחירת תפקידים נדרשים","en": "Add needed roles"}
</script>


<div dir="{$lang == "en" ? "ltr" : "rtl"}">
  <lebel for="choos">{adds[$lang]}</lebel>
<MultiSelect
id="choos"
  on:change={inc}
bind:selected
{placeholder}
options={roles1.map(c => c.roleDescription)}
/> </div>