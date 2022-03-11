<script>
    import MultiSelect from 'svelte-multiselect';
    import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
    import { valluss } from './valluss.js';
    import { onMount } from 'svelte';
    import AddnewVal from '../addnew/addnewval.svelte';
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher(); 
    let vallues = [{valueName: "שלום"}];
    let error1 = null;
    let addval = false;
    
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
            const res = await fetch("https://oneloveone.onrender.com/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },  body: JSON.stringify({
                        query: `query {
  vallues { id valueName}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            vallues = res.data.vallues 
        } catch (e) {
            error1 = e
        }
    });


    function find_value_id(value_name_arr){
     var  arr = [];
      for (let j = 0; j< value_name_arr.length; j++ ){
      for (let i = 0; i< vallues.length; i++){
        if(vallues[i].valueName === value_name_arr[j]){
          arr.push(vallues[i].id);
        }
      }
      }
      return arr;
     };


    let selected = [];
    const placeholder = `ערכים ומטרות`;

 
export let userName_value;
export let show_value = 0;

userName.subscribe(value => {
  userName_value = value;
});

show.subscribe(newValue => {
  show_value = newValue;
});

function increment() {
		show.update(n => n + 1);
    valluss.set(find_value_id(selected));
    dispatch ('progres',{
		tx: 0,
		txx: 20
	} )
	}

  function back() {
		show.update(n => n - 1);
    valluss.set(find_value_id(selected));
    dispatch ('progres',{
		tx: 600,
		txx: 20
	} )
	}

  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';

let isOpen = false;
 const close = () => {
    isOpen = false;
   
  };

  function addnew (event){
    
    const newOb = event.detail.skob;
    const newN = event.detail.skob.valueName;
    isOpen = false;
    const newValues = vallues;
    newValues.push(newOb);
       
    vallues = newValues;
   const newSele = selected;

selected.push(newN);

selected = newSele;

  }
  </script>

 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent style="background-image: url(https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg);  background-position: center; background-size: cover;"   aria-label="form">
      <div dir="rtl" >
  <AddnewVal  rn={vallues.map(c => c.valueName)} addS={true} on:b={close} on:addnew={addnew}/>
      
  </DialogContent>
  </div>
</DialogOverlay>
  
<h1 class="midscreenText-2">
  {userName_value}
  <br/>
   ?אלו ערכים ומטרות ברצונך לקדם
  </h1> 
  {#key vallues}
   <div  class="input-2">
     <MultiSelect
     bind:selected
     {placeholder}
     options={vallues.map(c => c.valueName)}
     /></div>
     {/key}
  <div  class="input-2-2">
      <button
      on:click={() => isOpen = true} 
      class="bg-lturk hover:bg-barbi text-barbi hover:text-lturk font-bold py-1 px-1 rounded-full"
      >הוספת ערך חדש</button>
    </div>
     <button class="button-in-2" on:click="{increment}">
    <img alt="go" style="height:15vh;" src="https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg"/>
    </button>
  <button class="button-2" on:click="{back}">
    <img alt="go" style="height:15vh;" src="https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg"/>
    </button>

<style>
    .midscreenText-2 {
      grid-column: 1 /5;
  grid-row: 1/ 2;
  align-self: center;
  justify-self: center;
  font-size: 1.8rem;
  line-height: normal;
  font-weight: 900;
  color: var(--barbi-pink);
  margin-top: 55px;
  background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png);
 background-size: 29.5rem 9.75rem;
  height: 9.75rem;
  width: 29.5rem;
  text-align: center;
  padding-top: 0.5rem ; 
   -webkit-text-size-adjust: 100%; 
}
 @media (max-width:500px){
	 .midscreenText-2 {
		   background-size: 15.25rem 5rem;
  height: 5rem;
  width: 15.25rem;
  font-size: 1rem;
  margin-top: 26vh;
	 }
 .input-2{
    grid-column: 2/4;
    grid-row: 2/3;
        margin-top:0;

    }
}
    .button-in-2{
    grid-column: 1/2;
    grid-row: 7 / 8;
    align-self: center;
    justify-self: center;
  }
    .button-2{
      grid-column: 4/5;
    grid-row: 7 / 8;
       align-self: center;
    justify-self: center;
  }
   
    .input-2{
    grid-column: 2/4;
    grid-row: 2/3;
    margin-top: -8vh;
    }
    .input-2-2{
    grid-column: 1/5;
    grid-row: 5/6;
    text-align: center;
    }
    .multiselect{
      background-color: aqua;
    }
    </style>