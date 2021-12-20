<script>
    import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
    import { roles2 } from './roles2.js';
    import { onMount } from 'svelte';
  //  import Addnewrole from '../addnew/addNewRole.svelte';
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
            const res = await fetch("https://strapi-k4vr.onrender.com/graphql", {
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
    roles2.set(find_role_id(selected));
    dispatch ('progres',{
		tx: 0,
		txx: 14
	} )
    console.log("xke", selected);
    console.log("id", find_role_id(selected));
	}
// import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
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
    console.log(selected)

selected.push(newN);

selected = newSele;

  }
  </script><!--
 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form">
      <div dir="rtl" >
           
              <Addnewrole on:b={close} addR={true} on:addnewrole={addnew}/>
  </DialogContent>
  </div>
</DialogOverlay>
-->
  
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

      <div  class="input-2-2">
      <button
      on:click={() => isOpen = true} 
      class="bg-lturk hover:bg-barbi text-barbi hover:text-lturk font-bold py-1 px-1 rounded"
      >הוספת תפקיד שאינו ברשימה</button>
    </div>-->
   <button class="button-in-2" on:click="{increment}">
להמשיך      </button>


<style>
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
 
  
    .button-in-2{
    grid-column: 2/3;
    grid-row: 7 / 8;
     background: var(--barbi-pink);
    border-radius: 50%;
    color: var(--gold);
    padding: 5px;
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