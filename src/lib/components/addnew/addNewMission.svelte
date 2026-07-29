<script>
  import { isRtl, t } from '$lib/translations';
import Addnewskil from './addNewSkill.svelte';
           import { lang } from '$lib/stores/lang.js'
import { executeAction } from '$lib/client/actionClient';
let addskil = false;
import Addnewro from './addNewRole.svelte';
let addro = false;
import MultiSelect from 'svelte-multiselect';
import { onMount } from 'svelte';
//import ChoosRole from './choosRole.svelte';
/**
 * @param {Object} props - Component properties
 * @param {(payload: { id: any, name: any }) => void} [props.onNew] - Callback for when a new mission is created.
 */
let { missionNewId = $bindable(), skills2 = $bindable([]), roles = $bindable([]), onNew } = $props();
let error1 = null
let newName;
function dis () {
  onNew?.({
    id: missionNewId,
    name: newName,
    } );
};
let selectedrole = $state([])
    
    onMount(async () => {
        try {
            // Read skills + roles through the proxy (no direct Strapi access).
            const [sk, ro] = await Promise.all([
              fetch(`/api/vocab/list?kind=skills&lang=${$lang}`).then((r) => r.json()),
              fetch(`/api/vocab/list?kind=roles&lang=${$lang}`).then((r) => r.json())
            ]);

            skills2 = sk?.data ?? [];
             if ($lang == "he" ){
              for (let i = 0; i < skills2.length; i++){
                if (skills2[i].attributes.localizations?.data?.length > 0){
                skills2[i].attributes.skillName = skills2[i].attributes.localizations.data[0].attributes.skillName
                }
              }
            }
            skills2 = skills2
             roles = ro?.data ?? []
                       if ($lang == "he" ){
              for (let i = 0; i < roles.length; i++){
                if (roles[i].attributes.localizations?.data?.length > 0){
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
let missionName_value = $state();
    let selected = $state([]);  
    let skillslist =[];
    let tafkidimslist = [];
  

    function find_skill_id(skill_name_arr){
     let  arr = [];
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
   let  arr = [];
    for (let j = 0; j< role_name_arr.length; j++ ){
    for (let i = 0; i< roles.length; i++){
      if(roles[i].attributes.roleDescription === role_name_arr[j]){
        arr.push(roles[i].id);
      }
    }
    }
    return arr;
   };

     let desM = $state();
     let loading = $state(true)

async function subm() {
  tafkidimslist = find_role_id(selectedrole);
  skillslist = find_skill_id(selected);
  try {
    const result = await executeAction('createMissionTemplate', {
      missionName: missionName_value,
      descrip: desM,
      skillIds: skillslist.map(String),
      roleIds: tafkidimslist.map(String)
    });
    if (!result.success) {
      console.log(result.error);
      return;
    }
    missionNewId = result.data.id;
    newName = missionName_value;
    dis();
  } catch (e) {
    console.log(e);
  }
};
    
function addnew (event){ 
    const newOb = event.skob;
    const newN = event.skob.attributes.skillName;
    const newValues = skills2 ;
    newValues.push(newOb);   
    skills2 = newValues;
   const newSele = selected;
selected.push(newN);
selected = newSele;
  }
 function addnewrole (event){
    console.log("ezra")
    const newOb = event.skob;
    const newN = event.skob.attributes.roleDescription;
    const newValues = roles ;
    newValues.push(newOb);
       
    roles = newValues;
   const newSele = selectedrole;

selectedrole.push(newN);

selectedrole = newSele;

}
</script>
 
    
  <div class="grid items-center text-center justify-items-center ">
    <h1 class="text-center">{$t('addnew.addNewMission.addnewhed')}</h1>
</div>
<div style="width: 50%; margin: 0 auto;">
  
     <div dir="rtl" class='textinput'>
  <input type="text"  id="nam" name="nam"   bind:value={missionName_value}  class='input' required>
  <label for="nam" class='label'>{$t('addnew.addNewMission.miname')}</label>
  <span class='line'></span>
</div>
  
   <div dir="rtl" class='textinput'>
  <input type="text"  id="des" name="des" bind:value={desM}  class='input' required>
  <label for="des" class='label'>{$t('addnew.addNewMission.sho')}</label>
  <span class='line'></span>
</div>

    <lebel for="selectskill">{$t('addnew.addNewMission.chsk')}</lebel>
        <MultiSelect
      bind:selected
      options={skills2.map(c => c.attributes.skillName)}
      id="selectskill"
      placeholder={$t('addnew.addNewMission.placeholder')}
      loading={loading}
        noMatchingOptionsMsg={$t('addnew.addNewMission.nom')}
      />
    
     
     <Addnewskil onAddnewskill={addnew} nobr={false} color={"--barbi-pink"} />

     <div dir="{$isRtl ? 'rtl' : 'ltr'}">
  <lebel for="choos">{$t('addnew.addNewMission.adds')}</lebel>
<MultiSelect
id="choos"
bind:selected={selectedrole}
      placeholder={$t('addnew.addNewMission.placeholderr')}
          noMatchingOptionsMsg={$t('addnew.addNewMission.nomv')}
{loading}
options={roles.map(c => c.attributes.roleDescription)}
/> </div>
   <!--<ChoosRole selected={selectedrole}/>--> 

<div>
  
   <Addnewro  onAddnewrole={addnewrole} rn={roles.map(d=>d.attributes.roleDescription)} color={"--barbi-pink"}/>
<button
 onclick={subm} 
 class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold py-6 px-4 m-4 rounded-full"
 >{$t('addnew.addNewMission.yeve')}</button>
 
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
