<script>
import Addnewskil from './addNewSkill.svelte';
           import { lang } from '$lib/stores/lang.js'

let addskil = false;
import Addnewro from './addNewRole.svelte';
let addro = false;
import MultiSelect from 'svelte-multiselect';
import { onMount } from 'svelte';
//import ChoosRole from './choosRole.svelte';
import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
export let missionNewId;
let newName;
export let skills2 = [];
export let roles = [];
let error1 = null
let token;
let meData = [];
function dis () {
  dispatch('new', {
    id: missionNewId,
    name: newName,
    } );
};      
let selectedrole = []
    
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
            const res = await fetch("https://strapi-87gh.onrender.com/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  skills {data{ id attributes{ skillName ${$lang == 'he' ? 'localizations{data{attributes{ skillName }}}' : ""}}}}
    tafkidims {data{ id attributes{ roleDescription ${$lang == 'he' ? 'localizations{data{attributes{ roleDescription }}}' : ""}}}}
}
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
             roles = res.data.tafkidims.data
                       if ($lang == "he" ){
              for (var i = 0; i < roles.length; i++){
                if (roles[i].attributes.localizations.data.length > 0){
                roles[i].attributes.roleDescription = roles[i].attributes.localizations.data[0].attributes.roleDescription
                }
              }
            }
            roles = roles
            loading = false
        } catch (e) {
            error1 = e
        }
        
    });
let missionName_value;
    let selected;  
    let skillslist =[];
    let tafkidimslist = [];
  

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
       function find_role_id(role_name_arr){
   var  arr = [];
    for (let j = 0; j< role_name_arr.length; j++ ){
    for (let i = 0; i< roles.length; i++){
      if(roles[i].attributes.roleDescription === role_name_arr[j]){
        arr.push(roles[i].id);
      }
    }
    }
    return arr;
   };

     let desM;
    const placeholder = `בחירת כישורים נדרשים`;
     let loading = true

async function subm() {
  const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
tafkidimslist= find_role_id(selectedrole)
  skillslist = find_skill_id(selected);
  let d = new Date
   let linkg ="https://strapi-87gh.onrender.com/graphql" ;
              try {
             await fetch(linkg, {
              method: 'POST',
       
        headers: {
            'Content-Type': 'application/json',
               'Authorization': bearer1
                  },
        body: 
        JSON.stringify({query: 
          ` mutation { createMission(
       data: {
        missionName: "${missionName_value}",
         skills: [${skillslist}],
        tafkidims: [${tafkidimslist}],
        descrip: "${desM}",
        publishedAt: "${d.toISOString()}"       
    }
  ){
         data{
              id attributes{missionName}
          }
  }
 }`
        })
 })
  .then(r => r.json())
  .then(data => meData = data);
      console.log(meData)
        missionNewId = meData.data.createMission.data.id;
        newName = meData.data.createMission.data.attributes.missionName;
          dis ();
    } catch (e) {
            console.log(e)
        }
    };
    
let cencel = "ביטול"
function addnew (event){ 
    const newOb = event.detail.skob;
    const newN = event.detail.skob.attributes.skillName;
    const newValues = skills2 ;
    newValues.push(newOb);   
    skills2 = newValues;
   const newSele = selected;
selected.push(newN);
selected = newSele;
  }
        const nom = {"he":"חסר ברשימה, ניתן להוסיפו עם הכפתור \"הוספת כישור חדש\" למטה","en": "Missing, you can use the \"Add new Skill\" button bellow to add it"}
 function addnewrole (event){
    console.log("ezra")
    const newOb = event.detail.skob;
    const newN = event.detail.skob.attributes.roleDescription;
    const newValues = roles ;
    newValues.push(newOb);
       
    roles = newValues;
   const newSele = selectedrole;

selectedrole.push(newN);

selectedrole = newSele;

  }
      const placeholderr = { "he" : "בחירת תפקידים נדרשים" ,"en" :"needed roles"};

const adds = {"he":"בחירת תפקידים נדרשים","en": "Add needed roles"}
  const nomv = {"he": "לא קיים עדיין ברשימה, ניתן להוסיף בלחיצה על כפתור \"הוספת תפקיד חדש\" שלמטה","en":"Not on the list yet , add it with the \"Add new roll\" button bellow"}
</script>
 
    
  <div class="grid items-center text-center justify-items-center ">
    <h1 class="text-center">הוספת משימה חדשה</h1>
</div>
<div style="width: 50%; margin: 0 auto;">
  
     <div dir="rtl" class='textinput'>
  <input type="text"  id="nam" name="nam"   bind:value={missionName_value}  class='input' required>
  <label for="nam" class='label'  >שם המשימה</label>
  <span class='line'></span>
</div>
  
   <div dir="rtl" class='textinput'>
  <input type="text"  id="des" name="des" bind:value={desM}  class='input' required>
  <label for="des" class='label' >תיאור קצר</label>
  <span class='line'></span>
</div>

    <lebel for="selectskill">בחירת כישורים נדרשים</lebel>
        <MultiSelect
      bind:selected
      options={skills2.map(c => c.attributes.skillName)}
      id="selectskill"
      {placeholder}
      loading={loading}
        noMatchingOptionsMsg={nom[$lang]}
      />
    
     
     <Addnewskil on:addnewskill={addnew} nobr={false} color={"--barbi-pink"} />

     <div dir="{$lang == "en" ? "ltr" : "rtl"}">
  <lebel for="choos">{adds[$lang]}</lebel>
<MultiSelect
id="choos"
bind:selected={selectedrole}
      placeholder={placeholderr[$lang]}
          noMatchingOptionsMsg={nomv[$lang]}
{loading}
options={roles.map(c => c.attributes.roleDescription)}
/> </div>
   <!--<ChoosRole selected={selectedrole}/>--> 

<div>
  
   <Addnewro  on:addnewrole={addnewrole} rn={roles.map(d=>d.attributes.roleDescription)} color={"--barbi-pink"}/>
<button
 on:click={subm} 
 class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-6 px-4 m-4 rounded-full"
 >יצירת והוספת משימה חדשה</button>
 
</div>
</div>


<style>
  h1 {
    color: var(--barbi-pink);
  }
  
       .textinput {
  position: relative;
  width: 100%;
  display: block;
}

.input {

  border: none;
  margin: 0;
  padding: 10px 0;
  outline: none;
  border-bottom: solid 1px var(--gold);
  font-size: 18px;
  margin-top: 12px;
  width: 100%;
 color:  var(--gold);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}


.label {

  font-size: 18px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--barbi-pink);
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
  font-size: 15px;
  color: var(--mturk);
  top: 0;
} 
  </style>