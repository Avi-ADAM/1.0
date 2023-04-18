<script>
    import MultiSelect from 'svelte-multiselect';
    import { onMount } from 'svelte';
    import Addnewnee from '../addnew/addNewNeed.svelte';
   //// import { sneed } from '../../stores/sneed.js';
  //  import { total } from '../../stores/total.js';
    import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
    //let  userName_value;
    let token; 
 export let needss = [];
  //  let error = null
    let addnee = false;  
  let isLow = true
onMount(async () => {
         const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
 
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
        const parseJSON = (resp) => (resp.json ? resp.json() : resp);
        const checkStatus = (resp) => {
        if (resp.status >= 200 && resp.status < 300) {
          return resp;
        }
        return parseJSON(resp).then((resp) => {
          throw resp;
        });
      };
      let linkg ="https://meaim.onrender.com/graphql" ;
        try {
             await fetch(linkg, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
          `{  mashaabims {data{id attributes{
                           name
                            } }}}`
        })
 })
  .then(r => r.json())
  .then(data => needss = data.data.mashaabims.data);
   console.log(needss)
   dispatch("str")
    isLow = false
    } catch (e) {
            console.log(e)
           
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

export let selctedi = [];
export let selected = [];
    const placeholder = `הוספת משאבים נדרשים `;

function newn(event) {
  addnee = false;
    const skob = event.detail.skob
  needss.push(skob)
  selected.push(event.detail.name)
  needss = needss
  selected = selected
    dispatch( "addm",{
      x: event.detail.id, 
      skob: event.detail.skob
    })
	};

function incremen() {
    dispatch( "add",{
      x: find_need_id(selected)
    })
	};
  </script>
  <div dir="rtl" style="max-width: 100%" >
    <h1 >הוספת משאבים נדרשים </h1>
    <div class="items-center">
      <div class="gg w-min	pb-1">
        <MultiSelect
        bind:selected
        {placeholder}
        loading={isLow}
        options={needss.map(c => c.attributes.name)}
        on:change={incremen}
        /></div>
      
       <Addnewnee {addnee} on:newn={newn} onmo={true} color={"--barbi-pink"}/>
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