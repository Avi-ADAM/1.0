<script>
    import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
          import { lang } from '$lib/stores/lang.js';
            import { page } from '$app/stores';

    import { show } from './store-show.js';
    import { skills1 } from './skills1.js';
    import { onMount } from 'svelte';
   import Addnewskill from '../addnew/addNewSkill.svelte';
  import { createEventDispatcher } from 'svelte';
      import jskill from '$lib/data/skills.json'
    import enjskill from '$lib/data/skillsen.json'
 const dispatch = createEventDispatcher();
    let skills2 = [];
    let error1 = null; 
    let addskil = 0;
    const baseUrl = import.meta.env.VITE_URL

    let newcontent = true
    onMount(async () => {
           if ($lang == "he" ){
       skills2 = jskill
           } else if (lang == "en"){
             skills2 = enjskill
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
            const res = await fetch(baseUrl+"/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  skills (sort: "skillName") { data{ id attributes{ skillName ${$lang == 'he' ? 'localizations { data {attributes{skillName} }}' : ""}}
}
} }
              `})
            }).then(checkStatus)
          .then(parseJSON);
            skills2 = res.data.skills.data;
             if ($lang == "he" ){
              for (var i = 0; i < skills2.length; i++){
                if (skills2[i].attributes.localizations.data.length > 0){
                skills2[i].attributes.skillName = skills2[i].attributes.localizations.data[0].attributes.skillName
                }
              }
            }
            skills2 = skills2
                         console.log(skills2)

            newcontent = false
        } catch (e) {
            error1 = e
        }
        
    });

    function find_skill_id(skill_name_arr){
     var  arr = [];
      for (let j = 0; j< skill_name_arr.length; j++ ){
      for (let i = 0; i< skills2.length; i++){
        if(skills2[i].attributes.skillName === skill_name_arr[j]){
          arr.push(skills2[i].id);
        }
      }
      }
      return arr;
     };


    let selected = [];  
    const placeholder = `${$lang == "he" ? "הכישורים שלי" : "My skills"}`;

	
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
		txx: 16
	} );
    skills1.set(find_skill_id(selected));
	}
  function toend() {
        skills1.set(find_skill_id(selected));

		show.set(5);
    dispatch ('progres',{
		tx: 0,
		txx: 4
	} )
	}
function back() {
		show.update(n => n - 1);
       dispatch ('progres',{
		tx: 600,
		txx: 20
	} );
    skills1.set(find_skill_id(selected));
	}
 import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';
  import Skip from '$lib/celim/icons/skip.svelte';

let isOpen = false;
 const close = () => {
    isOpen = false;
  };
   function addnew (event){ 
    const newOb = event.detail.skob;
    const newN = event.detail.skob.attributes.skillName;
    isOpen = false;
    const newValues = skills2 ;
    newValues.push(newOb);   
    skills2 = newValues;
   const newSele = selected;
selected.push(newN);
selected = newSele;
  }
      const nom = {"he":"חסר ברשימה, ניתן להוסיפו עם הכפתור \"הוספת כישור חדש\" למטה","en": "Missing, you can use the \"Add new Skill\" button bellow to add it"}

    const addn = {"he":"הוספת כישור חדש","en": "Add new Skill"}
    const srca = {"he": "https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg","en": "https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg"}
    const srcb = {"he":"https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg", "en": "https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg"}
  const ws = {"he": "מה הן היכולות שלך?","en": "What you can do?"}
 const skipt = {"he":"דילוג לסוף ההרשמה, ניתן יהיה להוסיף את הפרטים בכל עת מעמוד הפרופיל","en":"skip to end of registration, you can always add those details from your profile page"}

  let focused=false
 </script>
  
 <DialogOverlay {isOpen} onDismiss={close} >
        <div transition:fly|local={{y: 450, opacity: 0.5, duration: 2000}}>
  <DialogContent class="content"  aria-label="form">
      <div dir="{$lang == "en" ? "ltr" : "rtl"}" >
             
      <Addnewskill rn={skills2.map(c => c.attributes.skillName)} addS={true} on:b={close} on:addnewskill={addnew}/>
  </DialogContent>
  </div>
</DialogOverlay>
  
    <h1 style:margin-top={focused && !$page.data.isDesktop ? "1vh": !$page.data.isDesktop ? "26vh" : ""} class="midscreenText-2">
      
     {userName_value} 
     <br/>
    {ws[$lang]}
  </h1>
<div dir="{$lang == "en" ? "ltr" : "rtl"}" class="input-2">
  <MultiSelect
        on:focus={()=>focused=true}
      on:blur={()=>focused=false}
        loading={newcontent}
  bind:selected
  noMatchingOptionsMsg={nom[$lang]}
  {placeholder}
  options={skills2.map(c => c.attributes.skillName)}
  /></div>
<div dir="{$lang == "en" ? "ltr" : "rtl"}" class="input-2-2">
  <button
  on:click={() => isOpen = true} 
      class="button-silver hover:text-barbi font-bold py-1 px-2 rounded-full"
  >{addn[$lang]}</button>
  </div>
    <button class="button-in-1-2" on:click="{back}">
    <img alt="go" style="height:15vh;" src="{srca[$lang]}"/>
    </button>
       <button class="button-end bg-sturk p-1 rounded-full" on:click="{toend}" title="{skipt[$lang]}">
    <Skip/>
    </button>
  <button class="button-2" on:click="{increment}">
    <img alt="go" style="height:15vh;" src="{srcb[$lang]}"/>
    </button>

<style>

    .midscreenText-2 {
            transition: all 1s ease-in;
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
  padding-top: 1rem ; 
   -webkit-text-size-adjust: 100%; 
}
 @media (min-width:501px){

  :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
                width: 50vw;
  }
}
 @media (max-width:500px){
     :global([data-svelte-dialog-overlay].content) {
    z-index: 700;
                width: 80vw;
  }
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
           align-self: center;
    justify-self: center;
  }
    
}
    .input-2-2{
    grid-column: 1/5;
    grid-row: 5/6;
    text-align: center;
    margin: 0 auto;
    }
    .button-in-1-2{
    grid-column: 1/2;
    grid-row: 8/9;
    align-self: center;
    justify-self: center;
  }
    .button-2{
      grid-column: 4/5;
      grid-row:8/9;
       align-self: center;
    justify-self: center;
  }
    .button-end{
      grid-column: 2/4;
      grid-row:8/9;
       align-self: center;
    justify-self: center;
  }
   
    .input-2{
    grid-column: 2/4;
    grid-row: 2/3;
    text-align: center;
            margin-top: -4vh;
               align-self: center;
    justify-self: center;
  

    }
   
 
    </style>