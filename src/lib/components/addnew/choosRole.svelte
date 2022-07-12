<script>
import MultiSelect from 'svelte-multiselect';
import { missionNew } from '../../stores/missionNew';
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
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
          const res = await fetch("https://i18.onrender.com/tafkidims?_limit=-1", {
            method: "GET",
            headers: {
               'Content-Type': 'application/json'
            },
          }).then(checkStatus)
        .then(parseJSON);
          roles1 = res
      } catch (e) {
          error1 = e
      }
  });

  let selected;
  const placeholder = `בחירת תפקידים נדרשים`;

</script>


<div>
  <lebel for="choos">בחירת תפקידים נדרשים</lebel>
<MultiSelect
id="choos"
  on:change={inc}
bind:selected
{placeholder}
options={roles1.map(c => c.roleDescription)}
/> </div>