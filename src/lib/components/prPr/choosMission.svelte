<script>
    import { page } from '$app/stores';
  import MobileModal from '$lib/celim/ui/mobileModal.svelte';
  import MultiSelect from 'svelte-multiselect';
  import Arrow from '$lib/celim/icons/arrow.svelte';
  import { showFoot } from '$lib/stores/showFoot';
    import { createEventDispatcher } from 'svelte';
    import {lang } from '$lib/stores/lang.js' 
    import {mi} from './mi.js'
    import { skil, ww, role } from './mi.js';
  import Button from '$lib/celim/ui/button.svelte';
  import Mission from "./mission.svelte";
  import { idPr } from '../../stores/idPr.js'
 const dispatch = createEventDispatcher();
 export let pn, pl, restime,projectUsers, alit;
 const baseUrl = import.meta.env.VITE_URL

 let newcontent = true;
let newcontentR = true;
let newcontentW = true;
let error8
async function findT() {
    /*TODO: כאשר מחפשים כישורים וכן לגבי כל שאר האובייקטים להציג את היגרסה העברית והאנגלית כך שהחיפוש יוכל למצוא את כולן*/ 
    const parseJSON = (resp) => (resp.json ? resp.json() : resp);
    const checkStatus = (resp) => {
      if (resp.status >= 200 && resp.status < 300) {
        return resp;
      }
      return parseJSON(resp).then((resp) => {
        throw resp;
      });
    };
    try {
      const res = await fetch(baseUrl + '/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query {
    skills {data{ id attributes{ skillName ${
      $lang == 'he' ? 'localizations{data {attributes{ skillName}} }' : ''
    } }}}
     tafkidims {data{ id attributes{ roleDescription ${
       $lang == 'he'
         ? 'localizations{data {attributes{ roleDescription}} }'
         : ''
     }}}}
     workWays {data{ id attributes{ workWayName ${
       $lang == 'he' ? 'localizations{data {attributes{ workWayName}} }' : ''
     } } }}
 }
              `
        })
      })
        .then(checkStatus)
        .then(parseJSON);
    let  skills2 = res.data.skills.data;
      if ($lang == 'he') {
        for (var i = 0; i < skills2.length; i++) {
          if (skills2[i].attributes.localizations.data.length > 0) {
            skills2[i].attributes.skillName =
              skills2[i].attributes.localizations.data[0].attributes.skillName;
          }
        }
      }
      skills2 = skills2;
     let roles = res.data.tafkidims.data;
      if ($lang == 'he') {
        for (var i = 0; i < roles.length; i++) {
          if (roles[i].attributes.localizations.data.length > 0) {
            roles[i].attributes.roleDescription =
              roles[
                i
              ].attributes.localizations.data[0].attributes.roleDescription;
          }
        }
      }
      roles = roles;
    let  workways2 = res.data.workWays.data;
      if ($lang == 'he') {
        for (var i = 0; i < workways2.length; i++) {
          if (workways2[i].attributes.localizations.data.length > 0) {
            workways2[i].attributes.workWayName =
              workways2[
                i
              ].attributes.localizations.data[0].attributes.workWayName;
          }
        }
      }
      workways2 = workways2;
      skil.set(skills2);
      ww.set(workways2);
      role.set(roles);
      newcontent = false;
      newcontentR = false;
      newcontentW = false;
    } catch (e) {
      error8 = e;
      console.log(error8);
    }
}

export let selected = [];

export let mission1 = [];


function find_mission_id(mission_name_arr){
     var  arr = [];
      for (let j = 0; j< mission_name_arr.length; j++ ){
      for (let i = 0; i< mission1.length; i++){
        if(mission1[i].attributes.missionName === mission_name_arr[j]){
          arr.push(mission1[i].id);
        }
      }
      }
      return arr;
};
let moving = [];
const placeholder = {"he":`בחירה מרשימה או יצירת חדשה`,"en":"choose from list or create new"};


const head = {"he":"הוספת פעולות הנדרשות להקמה או לתפקוד הריקמה","en":"choose missions that require to initiate or to oporate the FreeMate"}
let id = 0
$: ugug = ``;
 $: addn = {"he":`יצירת משימה חדשה: "${ugug}"`,"en": `Create new mission: "${ugug}"`}
 let name = ""
 function add(){
  let isNew = false
  if (selected.length > 0) {
    before = true
          before = false;
          findT()
          
  if (!mission1.map(c => c.attributes.missionName).includes(selected[0])){
    isNew = true
    name = selected[0]
    id = 0
  }else{
    name = selected[0]   
    id = find_mission_id(selected)
  }

 }
}
 $: before = true
 const mn = {
  "he": "שם המשימה",
  "en": "mission name"
}

let noRiset = true
let showMobileModal = false;

function openMobileModal() {
  showMobileModal = true;
  if ($page.data.isDesktop === false) {
    showFoot.set(false);
  }
}

function closeMobileModal() {
  showMobileModal = false;
  if ($page.data.isDesktop === false) {
    showFoot.set(true);
  }
}

</script>

<div dir="{$lang == 'he' ? 'rtl' : 'ltr'}" >
  <slot>
<h2 class="text-barbi font-bold">{head[$lang]}</h2>
  </slot>
            {#if before}
        <h3>{mn[$lang]}</h3>
      {/if}
      {#if before && noRiset}
      {#if $page.data.isDesktop}
      <div  class=" w-full flex-row	flex items-center justify-center  space-x-2">
          <MultiSelect
          closeDropdownOnSelect='desktop'
          ulOptionsClass="bg-gold"
          liSelectedClass='bg-barbi text-gold'
        loading={mission1.length > 0 ? false : true}
        createOptionMsg={addn[$lang]}
        allowUserOptions={"append"}
         bind:searchText={ugug}
          bind:selected
          placeholder={placeholder[$lang]}
          options={mission1.map(c => c.attributes.missionName)}
        maxSelect={1}
          />
          {#if selected[0]}
        <Button on:click={add} ><Arrow back={$lang == "en" ? true : false}/></Button>
        {/if}</div>
        {:else}
        <Button on:click={openMobileModal}>{placeholder[$lang]}</Button>

        <MobileModal isOpen={showMobileModal} title={placeholder[$lang]}>
          <div  class=" w-full flex-row	flex items-center justify-center  space-x-2">
            <MultiSelect
            --sms-open-z-index={10000}
            closeDropdownOnSelect='desktop'
            ulOptionsClass="bg-gold"
            liSelectedClass='bg-barbi text-gold'
          loading={mission1.length > 0 ? false : true}
          on:focus={() => {!$page?.data?.isDesktop ?  showFoot.set(false) : null}}
          on:blur={() => {!$page?.data?.isDesktop ?  showFoot.set(true) : null}}
          createOptionMsg={addn[$lang]}
          allowUserOptions={"append"}
           bind:searchText={ugug}
            bind:selected
            placeholder={placeholder[$lang]}
            options={mission1.map(c => c.attributes.missionName)}
          maxSelect={1}
            />
            {#if selected[0]}
          <Button on:click={add} ><Arrow back={$lang == "en" ? true : false}/></Button>
          {/if}</div>
        </MobileModal>
      {/if}
        {/if}
{#if before == false}
        <Mission    
        {name}
        {id}
         {pn}
        {pl}
        {restime}
        {newcontent}
        {newcontentR}
        {newcontentW}
        pu={projectUsers}
        userslength={projectUsers.length}
        vallues={alit}
        projectId={$idPr}
        on:close={()=>dispatch('close')}/>
        {/if}
 </div>



