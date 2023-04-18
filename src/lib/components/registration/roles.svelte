<script>
    import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
    import { roles2 } from './roles2.js';
    import { onMount } from 'svelte';
    import Addnewrole from '../addnew/addNewRole.svelte';
 import { createEventDispatcher } from 'svelte';
           import { lang } from '$lib/stores/lang.js'
    import jroles from '$lib/data/tafkidim.json'
    import enjrole from '$lib/data/tafkidimEn.json'
 const dispatch = createEventDispatcher();
    let roles1 = [];
    let error1 = null;
    let addrole = 0;
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
      let newcontent = true

    onMount(async () => {
     if ($lang == "he" ){
      roles1 = jroles
          } else if (lang == "en"){
            roles1 = enjrole
          }
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
            const res = await fetch("https://meaim.onrender.com/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  tafkidims { data { id attributes{ roleDescription  ${$lang == 'he' ? 'localizations {data {attributes{roleDescription } }}' : ""}}
}
}
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
            newcontent = false
        } catch (e) {
            error1 = e
        }
    });


    


    let selected = [];
     const placeholder = `${$lang == "he" ? "תפקידים מועדפים" : "preferred roles"}`;

 
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
    const newN = event.detail.skob.attributes.roleDescription;
    isOpen = false;
    const newValues = roles1 ;
    newValues.push(newOb);
       
    roles1 = newValues;
   const newSele = selected;

selected.push(newN);

selected = newSele;

  }
  const nom = {"he": "לא קיים עדיין ברשימה, ניתן להוסיף בלחיצה על כפתור \"הוספת תפקיד חדש\" שלמטה","en":"Not on the list yet , add it with the \"Add new roll\" button bellow"}
      const srca = {"he": "https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg","en": "https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg"}
    const srcb = {"he":"https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg", "en": "https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg"}
    const addn = {"he":"הוספת תפקיד חדש","en": "Add new Role"}
  const what = {"he": "יש לך תפקיד מועדף?","en": "Do you have a preferred role?"}
  </script>
 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="content"  aria-label="form">
      <div class="a"dir="{$lang == "en" ? "ltr" : "rtl"}" >
           
              <Addnewrole rn={roles1.map(c => c.attributes.roleDescription)} on:b={close} 
                addR={true} on:addnewrole={addnew}/>
  </DialogContent>
  </div>
</DialogOverlay>
  
<h1 class="midscreenText-2">
    {userName_value}
    <br/>
     {what[$lang]}
   </h1> 
   <div dir="{$lang == "en" ? "ltr" : "rtl"}" class="input-2">
     <MultiSelect
       --sms-max-width={"60vw"}
          noMatchingOptionsMsg={nom[$lang]}
           loading={newcontent}
     bind:selected
     {placeholder}
     options={roles1.map(c => c.attributes.roleDescription)}
     /></div>
    <!-- 
           on:change={(e) => alert(`You ${e.detail.type}ed '${e.detail.token}'`)}
-->
      <div dir="{$lang == "en" ? "ltr" : "rtl"}" class="input-2-2">
      <button
      on:click={() => isOpen = true} 
      class="button-silver hover:text-barbi font-bold py-1 px-1 rounded-full"
      >{addn[$lang]}</button>
    </div>
    <button class="button-in-1-2" on:click="{back}">
    <img alt="go" style="height:15vh;" src="{srca[$lang]}"/>
    </button>
  <button class="button-2" on:click="{increment}">
    <img alt="go" style="height:15vh;" src="{srcb[$lang]}"/>
    </button>


<style>

    :global([data-svelte-dialog-content].content) {
  background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);

      width: 80vw;
  }
  @media (min-width: 501px){
  
        :global([data-svelte-dialog-content].content) {
 background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);

width:78vw;
        }
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
text-shadow: 1px 1px purple;
  color: var(--barbi-pink);
  margin-top: 59px;
  background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png);
 background-size: 29.5rem 9.75rem;
  height: 9.75rem;
  width: 29.5rem;
  text-align: center;
    padding: 1rem ; 
   -webkit-text-size-adjust: 100%; 
}
 @media (max-width:500px){
	 .midscreenText-2 {
       font-size: 0.8rem;
		   background-size: 15.25rem 5rem;
  height: 5rem;
  width: 15.25rem;
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