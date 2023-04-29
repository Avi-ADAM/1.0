
<script>
import { onMount } from 'svelte';
import { lang } from '$lib/stores/lang.js'
    import { liUN } from '$lib/stores/liUN.js';
import axios from 'axios';
import { idr } from '../../stores/idr.js';
import Addnewskil from './addNewSkillToRole.svelte';
import MultiSelect from 'svelte-multiselect';
import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
export let rn = [];
export let color = "--gold"
let idro;
idr.subscribe(newwork => {
idro = newwork;
});
export let mid = -1;
 let selected;
 let id;
 let meData = [];
    const placeholder = `${$lang == "he" ? "כישורים קשורים" : "related skills"}`;

let tafkidimslist = [];
let skillslist = [];
let roleName_value;
let desR;
export let skills2 = [];
let error1 = null;
let shgi = false;
let link ="https://tov.onrender.com/api/tafkidims";

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
            const res = await fetch("https://tov.onrender.com/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  skills { data{ id attributes{ skillName ${$lang == 'he' ? 'localizations { data {attributes{skillName} }}' : ""}}
}
} }`})
            }).then(checkStatus)
          .then(parseJSON);
            skills2 = res.data.skills.data
            if ($lang == "he" ){
              for (var i = 0; i < skills2.length; i++){
                if (skills2[i].attributes.localizations.data.length > 0){
                skills2[i].attributes.skillName = skills2[i].attributes.localizations.data[0].attributes.skillName
                }
              }
            }
            skills2 = skills2
        } catch (e) {
            error1 = e
            console.log(error1)
        }
    });

    function dispatchrole (meData, id) {
  dispatch('addnewrole', {
    id: id,
    mid: mid,
    skob: meData
    } );
};

async function addrole () {
  shgi = false;
if (rn.includes(roleName_value)){
  shgi = true;
  console.log("shgia")
} else {
  let d = new Date
skillslist = find_skill_id(selected);
   let link ="https://tov.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation  createTafkidim {
  createTafkidim(data: {  roleDescription: "${roleName_value}",
          descrip: "${desR}",
          skills: [${skillslist}],
          publishedAt: "${d.toISOString()}"
        }
          ) {
    data {
      id
      attributes {
        roleDescription ${$lang == 'he' ? 'localizations { data {attributes{roleDescription} }}' : ""}
      } 

       }
    }
}`   
        })
})
  .then(r => r.json())
  .then(data => meData = data);
      //  skillIdStore.set(meData.id);
        id = meData.data.createTafkidim.data.id;
  //  skillslist.push(idro);
        dispatchrole (meData.data.createTafkidim.data, id);
        addR = false;
        let userName_value = $liUN
         let data = {"name": userName_value, "action": "יצר תפקיד חדש בשם:", "det": `${roleName_value} והתיאור: ${desR} והכישורים: ${selected.join(" , ")}` }
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
export let addR = false;

const cencel = {"he":"ביטול","en": "cencel"}
const adds = {"he":"הוספת כישור חדש","en": "Add new Skill"}

const addn = {"he":"הוספת תפקיד חדש","en": "Add new Role"}
const valn = {"he":"שם התפקיד", "en": "Role name"}
const des = {"he": "תיאור קצר", "en": "Role short description"}
const btnTitles = {"he": "הוספה", "en": "Add"}
const errmsg = {"he": "השם כבר קיים","en":"name already exists"}
const nom = {"he": "לא קיים עדיין ברשימה, ניתן להוסיף בלחיצה על כפתור \"הוספת כישור חדש\" שלמטה","en":"Not on the list yet , add it with the \"Add new skill\" button bellow"}
let addsk = false;
let newsk;
function finnish (event) {
   const newOb = event.detail.skob;
   const newN = event.detail.name;
    const newValues = skillslist;
        newValues.push(newOb);

        skillslist = newValues;
       const newSele = selected;

    selected.push(newN);

    selected = newSele;
  addsk = false;
};
function dispatchb () {
   addR = false
  dispatch('b', {
    } );
};

</script>

<div style="--the:{`var(${color})`};" dir="{$lang == "en" ? "ltr" : "rtl"}">
{#if addR == false}
<button 
class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-0.5 px-4 rounded-full"
on:click={() => addR = true}>{addn[$lang]}</button>
{:else}


<button title={cencel[$lang]}
on:click={dispatchb}
class=" hover:bg-barbi hover:text-mturk text-gold font-bold rounded-full"
 ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button> 
  

    <h1 class="font-bold" style="font-size: 1rem; line-height: normal; color: var(--barbi-pink); ">{addn[$lang]}</h1>    
<div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input  bind:value={roleName_value}
 type='text' class='input' required>
  <label  style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="name" class='label'>{valn[$lang]}</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">{errmsg[$lang]}</small>{/if}

   <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input bind:value={desR}  
 type='text' class='input' required>
  <label  style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="des" class='label'>{des[$lang]}</label>
  <span class='line'></span>
</div>
<br>
   <div dir="{$lang == "en" ? "ltr" : "rtl"}">
      <MultiSelect
        noMatchingOptionsMsg={nom[$lang]}
      bind:selected
      {placeholder}
      options={skills2.map(c => c.attributes.skillName)}
      />
     </div>
     <div>
      <br>
      {#if addsk == false}
      <button
       on:click={() => addsk = true} 
       class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold px-1 rounded-full"
       >{adds[$lang]}</button>
       <br/>
       <div class="grid items-center justify-center">
    <button on:click={addrole}
    title="{btnTitles[$lang]}"
    class=" hover:bg-barbi hover:text-mturk text-gold font-bold py-1 px-2 rounded-full" 
    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
    </svg></button>
    </div>
      {:else} 
      <button title={cencel[$lang]}
    on:click={() => addsk = false}
     class=" hover:bg-barbi hover:text-mturk text-gold font-bold p-1 rounded-full"
     ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
    </svg></button>
      <Addnewskil {color} rn={skills2.map(c => c.attributes.skillName)} on:finnish={finnish}/>{/if}</div>
  
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


