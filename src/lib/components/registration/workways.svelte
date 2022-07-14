  <script>
    import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
    import { workways1 } from './workways1.js';
    import { onMount } from 'svelte';
    import Addneww from '../addnew/addnewWorkway.svelte';
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
              import { lang } from '$lib/stores/lang.js'

    let workways2 = [];
    let error1 = null
    
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
  workWays { id workWayName  ${$lang == 'he' ? 'localizations{workWayName }' : ""}}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            workways2 = res.data.workWays
                       if ($lang == "he" ){
              for (var i = 0; i < workways2.length; i++){
                if (workways2[i].localizations.length > 0){
                workways2[i].workWayName = workways2[i].localizations[0].workWayName
                }
              }
            }
            workways2 = workways2
        } catch (e) {
            error1 = e
        }
    });


    function find_workway_id(workway_arr){
     var  arr = [];
      for (let j = 0; j< workway_arr.length; j++ ){
      for (let i = 0; i< workways2.length; i++){
        if(workways2[i].workWayName === workway_arr[j]){
          arr.push(workways2[i].id);
        }
      }
      }
      return arr;
     };



    let selected = [];
 
     const placeholder = `${$lang == "he" ? "דרכי יצירה מתאימות" : "ways of creation"}`;

  
 
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
		txx: 8
	} );
    workways1.set(find_workway_id(selected));
   
	}
function back() {
		show.update(n => n - 1);
     dispatch ('progres',{
		tx: 0,
		txx: 16
	} );
    workways1.set(find_workway_id(selected));
   
	}



 import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';

let isOpen = false;
 const close = () => {
    isOpen = false;
   
  };
    function addnew (event){
    const newOb = event.detail.skob;
    const newN = event.detail.skob.workWayName;
    isOpen = false;
    const newValues = workways2 ;
    newValues.push(newOb);
    workways2 = newValues;
    const newSele = selected;
    selected.push(newN);
    selected = newSele;
}   
    const srca = {"he": "https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg","en": "https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg"}
    const srcb = {"he":"https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg", "en": "https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg"}
    const addn = {"he":"הוספת דרך חדשה","en": "Add new way"}
    const ws = {"he": "מה הם העדפות היצירה שלך?","en": "How do you preffer to Create?"}
  </script>
 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="content"   aria-label="form">
      <div dir="{$lang == "en" ? "ltr" : "rtl"}" >
 <Addneww rn={workways2.map(c => c.workWayName)} on:b={close} addW={true} on:addww={addnew}/>
      
  </DialogContent>
  </div>
</DialogOverlay>

<h1 class="midscreenText-2">
    {userName_value}
<br/>
 {ws[$lang]}
   </h1> 
   <div dir="{$lang == "en" ? "ltr" : "rtl"}" class="input-2">
     <MultiSelect
     bind:selected
     {placeholder}
     options={workways2.map(c => c.workWayName)}
     /></div>
    <div dir="{$lang == "en" ? "ltr" : "rtl"}" class="input-2-2">
      <button
      on:click={() => isOpen = true} 
      class="bg-lturk hover:bg-barbi text-barbi hover:text-lturk font-bold py-1 px-1 rounded-full"
      >{addn[$lang]}</button>
    </div>
  <button class="button-in-1-2" on:click="{$lang == "he" ? increment : back}">
    <img alt="go" style="height:15vh;" src="{srca[$lang]}"/>
    </button>
  <button class="button-2" on:click="{$lang == "en" ? increment : back}">
    <img alt="go" style="height:15vh;" src="{srcb[$lang]}"/>
    </button>


<style>
    .midscreenText-2 {
      grid-column: 1 /5;
  grid-row: 1/ 2;
  align-self: center;
  justify-self: center;
  font-size: 1.8rem;
  line-height: normal;
text-shadow: 1px 1px purple;
  color: var(--barbi-pink);
  margin-top: 59px;
  background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png);
 background-size: 29.5rem 9.75rem;
  height: 9.75rem;
  width: 29.5rem;
  text-align: center;
    padding: 1rem 1rem 0rem 1rem; 
 
   -webkit-text-size-adjust: 100%; 
}
 @media (max-width:500px){
	 .midscreenText-2 {
		   background-size: 15.25rem 5rem;
  height: 5rem;
  width: 15.25rem;
  font-size: 0.9rem;
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
</style>