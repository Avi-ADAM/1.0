<script>
    import Addnewro from './addNewRoleToSkill.svelte';
    import MultiSelect from 'svelte-multiselect';
    import { onMount } from 'svelte';
               import { lang } from '$lib/stores/lang.js'
    import { liUN } from '$lib/stores/liUN.js';
 //   import { skillIdStore } from './store/skillIdStore.js'
    import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
export let roles1 = [];
export let mid = -1;
 let selected;
 let id;
     const placeholder = `${$lang == "he" ? "תפקידים קשורים" : "related Roles"}`;

    let addro = false;    

    let tafkidimslist = [];
    let skillName_value;
    let desS;
    let meData;
    let error1 = null;
    let link ="https://beoni.onrender.com/api/skills";
    export let rn = [];
    let shgi = false;
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
          const res = await fetch("https://beoni.onrender.com/graphql", {
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
      } catch (e) {
          error1 = e
      }
  });

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
function dispatchskillid (meData, id) {
  dispatch('addnewskill', {
    id: id,
    mid: mid,
    skob: meData.data.createSkill.data
    } );
};

async function addNewSkill() {
   shgi = false;
if (rn.includes(skillName_value)){
  shgi = true;
} else {
    let d = new Date
  tafkidimslist = find_role_id(selected);
    let link ="https://beoni.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation   {
  createSkill(data: {  skillName: "${skillName_value}",
          descrip: "${desS}",
          tafkidims: [${tafkidimslist}],
                publishedAt: "${d.toISOString()}"
}
          ) {
    data {
      id
      attributes {
        skillName ${$lang == 'he' ? 'localizations {data {attributes{skillName } }}' : ""}
      } 

       }
    }
}`   
        })
})
  .then(r => r.json())
  .then(data => meData = data);
      //  skillIdStore.set(meData.id);
        id = meData.data.createSkill.data.id;
        dispatchskillid (meData, id);
        addS = false;
               let userName_value = liUN.get()
         let data = {"name": userName_value, "action": "יצר כישור חדש בשם:", "det": `${skillName_value} והתיאור: ${desS} והתפקידים: ${tafkidimslist.join(", ")}`}
   fetch("/api/ste", {
  method: 'POST', // or 'PUT'
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
  .then((response) => response)
  .then((data) => {
    console.log('Success:', data);

  })
  .catch((error) => {
    console.error('Error:', error);
  
  })
       }
      catch(error) {
        console.log('צריך לתקן:', error.response);
        error = error1 
        console.log(error1)
                };}
    };     

export let addS = false;
export const nobr = true
       const cencel = {"he":"ביטול","en": "cencel"}
const adds = {"he":"הוספת כישור חדש","en": "Add new Skill"}
const nom = {"he": "לא קיים עדיין ברשימה, ניתן להוסיף בלחיצה על כפתור \"הוספת תפקיד חדש\" שלמטה","en":"Not on the list yet , add it with the \"Add new roll\" button bellow"}

const addn = {"he":"הוספת תפקיד חדש","en": "Add new Role"}
const valn = {"he":"שם הכישור", "en": "Skill name"}
const des = {"he": "תיאור קצר", "en": "Skill short description"}
const btnTitles = {"he": "הוספה", "en": "Add"}
const errmsg = {"he": "השם כבר קיים","en":"name already exists"}
let newrole;
function finnish (event) {
  const newOb = event.detail.skob;
   const newN = event.detail.name;
    const newValues = tafkidimslist;
        newValues.push(newOb);

        tafkidimslist = newValues;
       const newSele = selected;

    selected.push(newN);

    selected = newSele;

  addro = event.detail.addro;
}
function dispatchb () {
   addS = false
  dispatch('b', {
    } );
};
export let color = "--gold";
  </script>
  <div style="--the:{`var(${color})`};" dir="{$lang == "en" ? "ltr" : "rtl"}">
{#if addS == false}
<button style="--the:{color};"
class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-0.5 px-4 rounded-full"
on:click={() => addS = true}>{adds[$lang]}</button>
{:else}
<button title={cencel[$lang]}
on:click={dispatchb}
              class=" hover:bg-barbi text-gold hover:text-lturk font-bold py-1 px-1 rounded-full text-center"
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>



 <h1 style="font-size: 1rem; line-height: normal; color: var(--barbi-pink); ">{adds[$lang]}</h1>    

  
  <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input    bind:value={skillName_value}
 type='text' class='input' required>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="name" class='label'>{valn[$lang]}</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">{errmsg[$lang]}</small>{/if}

           <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input bind:value={desS}  
 type='text' class='input' required>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="des" class='label'>{des[$lang]}</label>
  <span class='line'></span>
</div>
      
     <br>
<div dir="{$lang == "en" ? "ltr" : "rtl"}">
  <MultiSelect
  --sms-max-width={"60vw"}
  bind:selected
  {placeholder}
  noMatchingOptionsMsg={nom[$lang]}
  options={roles1.map(c => c.attributes.roleDescription)}
  /></div>
  <br>
<div>
  {#if addro == false}
  <button
   on:click={() => addro = true} 
   class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold  px-1 rounded-full"
   >{addn[$lang]}</button>
      <br>
   <br>

   <div class="grid align-middle justify-center">
<button on:click={addNewSkill}
title="{btnTitles[$lang]}"
class=" hover:bg-barbi hover:text-mturk text-gold font-bold py-1 px-2 rounded-full" 
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
</svg>
</button>
</div>
  {:else} 
  <br>
  <button title={cencel[$lang]}
on:click={() => addro = false}
 class=" hover:bg-barbi hover:text-mturk  font-bold p-1 rounded-full" class:text-mturk={nobr == true} class:text-gold={nobr == false}
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
  <Addnewro {color} rn={roles1.map(c => c.roleDescription)} on:finnish={finnish}/>
  {/if}
</div>
 
{/if}

</div>

<style>
 .textinput {
  position: relative;
  width: 80%;
  display: block;
}

.input {

  border: none;
  margin: 0;
  padding: 10px 0;
  outline: none;
  border-bottom: solid 1px var(--gold);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
  color:var( --the, var(--gold));
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}

.label {

  font-size: 15px;
  position: absolute;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var( --the, var(--gold));
  user-select: none;
}

.line {
  height: 2px;
  background-color: #2196F3;
  position: absolute;
  transform: translateX(-50%);
  left: 50%;
  bottom: 0;
  width: 0;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
}

.input:focus ~ .line, .input:valid ~ .line {
  width: 100%;
}

.input:focus ~ .label, .input:valid ~ .label {
  font-size: 11px;
  color: #2196F3;
  top: 0;
}

@media (max-width:600px){
 
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
 
}
</style>