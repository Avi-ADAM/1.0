<script>
    import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
    import { roles2 } from './roles2.js';
    import { onMount } from 'svelte';
    import Addnewrole from '../addnew/addNewRole.svelte';
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
    let roles1 = [];
    let error1 = null;
    let addrole = 0;
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
            const res = await fetch("https://oneloveone.onrender.com/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  tafkidims { id roleDescription}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            roles1 = res.data.tafkidims
        } catch (e) {
            error1 = e
        }
    });


    


    let selected = [];
    const placeholder = ` תפקידים מועדפים`;

 
let userName_value;
let show_value = 0;

userName.subscribe(value => {
  userName_value = value;
});

show.subscribe(newValue => {
  show_value = newValue;
});

function increment() {
		show.update(n => n + 1);
     dispatch ('progres',{
		tx: 0,
		txx: 11
	} );
    roles2.set(find_role_id(selected));
   
	}
  function back() {
		show.update(n => n - 1);
      dispatch ('progres',{
		tx: 0,
		txx: 20
	} );
    roles2.set(find_role_id(selected));
  
	}
 import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';

let isOpen = false;
 const close = () => {
    isOpen = false;
   
  };

   function addnew (event){
    
    const newOb = event.detail.skob;
    const newN = event.detail.skob.roleDescription;
    isOpen = false;
    const newValues = roles1 ;
    newValues.push(newOb);
       
    roles1 = newValues;
   const newSele = selected;

selected.push(newN);

selected = newSele;

  }
  </script>
 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent style="background-image: url(https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg);  background-position: center; background-size: cover;"  aria-label="form">
      <div class="a" dir="rtl" >
           
              <Addnewrole rn={roles1.map(c => c.roleDescription)} on:b={close} addR={true} on:addnewrole={addnew}/>
  </DialogContent>
  </div>
</DialogOverlay>
  
<h1 class="midscreenText-2">
    {userName_value}
    <br/>
     ?
  יש לך תפקיד מועדף
   </h1> 
   <div  class="input-2">
     <MultiSelect
     bind:selected
     {placeholder}
     options={roles1.map(c => c.roleDescription)}
     /></div>
    <!-- 
           on:change={(e) => alert(`You ${e.detail.type}ed '${e.detail.token}'`)}
-->
      <div  class="input-2-2">
      <button
      on:click={() => isOpen = true} 
      class="bg-lturk hover:bg-barbi text-barbi hover:text-lturk font-bold py-1 px-1 rounded-full"
      >הוספת תפקיד שאינו ברשימה</button>
    </div>
    <button class="button-in-1-2" on:click="{increment}">
    <img alt="go" style="height:15vh;" src="https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg"/>
    </button>
  <button class="button-2" on:click="{back}">
    <img alt="go" style="height:15vh;" src="https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg"/>
    </button>


<style>

    :global([data-svelte-dialog-content].content) {
     background-image: url(https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg);
      background-position: center;
      background-size: cover;
  }
  :global(.multiselect) {
    background-color: var(--gold) !important ;
  /* top-level wrapper div */
}
 
    .midscreenText-2 {
      grid-column: 1 /5;
  grid-row: 1/ 2;
  align-self: center;
  justify-self: center;
  font-size: 2rem;
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
 
   .button-in-1-2{
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