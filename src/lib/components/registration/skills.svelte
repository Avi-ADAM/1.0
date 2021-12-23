<script>
    import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
    import { skills1 } from './skills1.js';
    import { onMount } from 'svelte';
   import Addnewskill from '../addnew/addNewSkill.svelte';
  import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
    let skills2 = [];
    let error1 = null;
    let addskil = 0;
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
  skills { id skillName}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            skills2 = res.data.skills
        } catch (e) {
            error1 = e
        }
    });


    function find_skill_id(skill_name_arr){
     var  arr = [];
      for (let j = 0; j< skill_name_arr.length; j++ ){
      for (let i = 0; i< skills2.length; i++){
        if(skills2[i].skillName === skill_name_arr[j]){
          arr.push(skills2[i].id);
        }
      }
      }
      return arr;
     };


    let selected = [];  

    const placeholder = `הכישורים שלי`;
	
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
    skills1.set(find_skill_id(selected));
    dispatch ('progres',{
		tx: 0,
		txx: 16
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
    const newN = event.detail.skob.skillName;
    isOpen = false;
    const newValues = skills2 ;
    newValues.push(newOb);
       
    skills2 = newValues;
   const newSele = selected;

selected.push(newN);

selected = newSele;

  }
  </script>
  
 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent aria-label="form">
      <div dir="rtl" >
             
      <Addnewskill addS={true} on:b={close} on:addnewskill={addnew}/>
  </DialogContent>
  </div>
</DialogOverlay>

  
    <h1 class="midscreenText-2">
      
     {userName_value}
     <br/>
  ?  מה הן היכולות שלך
  </h1>
<div  class="input-2">
  <MultiSelect
  bind:selected
  {placeholder}
  options={skills2.map(c => c.skillName)}
  /></div>
<div  class="input-2-2">
  <button
  on:click={() => isOpen = true} 
      class="bg-lturk hover:bg-barbi text-barbi hover:text-lturk font-bold py-1 px-1 rounded"
  >הוספת כישור שאינו ברשימה</button>
  </div>
    <button class="button-in-1-2 hover:bg-gold hover:text-barbi" on:click="{increment}">
    להמשיך
    </button>
  

<style>

    .midscreenText-2 {
      grid-column: 1 /4;
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
    .input-2-2{
    grid-column: 1/4;
    grid-row: 5/6;
    text-align: center;

    }
    .button-in-1-2{
    grid-column: 2/3;
    grid-row: 8/9;
    background: var(--barbi-pink);
    border-radius: 50%;
    color: var(--gold);
    }
   
    .input-2{
    grid-column: 2/3;
    grid-row: 2/3;
    text-align: center;
            margin-top: -8vh;

    }
   
 
    </style>