<script>
import Addnewro from '../addnew/addNewRole.svelte';
import {
    createEventDispatcher
} from 'svelte';
import AddNewSkill from '../addnew/addNewSkill.svelte';
  import AddNewWorkway from '../addnew/addnewWorkway.svelte';

import MultiSelect from 'svelte-multiselect';
import {
    onMount
} from 'svelte';
import { lang } from '$lib/stores/lang.js'
const dispatch = createEventDispatcher();
export let descrip = "";
export let projectName = "";
export let name1 = "";
export let hearotMeyuchadot = "";
export let noofhours = 0;
export let perhour = 0;
export let projectId;
export let uids = [];
export let what = [];
export let noofusersOk;
export let noofusersNo;
export let noofusersWaiting;
export let total = 0;
export let noofusers;
export let already;
export let mypos;
export let skills = [];
export let tafkidims = [];
export let workways = [];
export let vallues;
export let publicklinks;
export let privatlinks;
export let mdate;
export let pendId;
export let users;
let miDatan = [];
let error1;
let bearer1;
let token;
let idL;
let no = false;
let masa = false;
let data;
let isOpen;
let less = "";
let placeholder4 = `בחירת תפקידים`;
let roles = [];
let why = '';
let skills2 = [];
let placeholder1 = `בחירת כישורים`;
let addS = false;
let descrip2 = descrip;
let name2 = name1;
let selected2 = [];
let selected3 = [];
let selected1 = [];
let workways2 = [];
const plww = {"he":`סוג משימה`,"en":`mission kind`};
let mdate2 = mdate;
let hearotMeyuchadot2 = hearotMeyuchadot;
let privatlinks2 = privatlinks;
let noofhours2 = noofhours;
let perhour2 = perhour;
let myM;
let done;
let skills3 = skills;
let tafkidims2 = tafkidims; 
let workways3 = workways;

function min(a, b) {
const newArr = a;
const x = newArr.map(c => c.id);
const indexy = x.indexOf(b);
newArr.splice(indexy, 1);
skills3 = newArr;
skills3 = skills3;
}

function minR(a, b) {
const newArr = a;
const x = newArr.map(c => c.id);
const indexy = x.indexOf(b);
newArr.splice(indexy, 1);
tafkidims2 = newArr;
tafkidims2 = tafkidims2;
}

function minW(a, b) {
const newArr = a;
const x = newArr.map(c => c.id);
const indexy = x.indexOf(b);
newArr.splice(indexy, 1);
workways2 = newArr;
workways2 = workways2;
}

const filterByReference = (allob, id)=> {
   let res = [];
   res = allob.filter(el => {
      return id.find(element => {
         return element === el.id;
      });
   });
   return res;
}

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

function addR(id, data, allob) {

const oldob = data;
const old = oldob.map(c => c.id);
const neww = find_skill_id(id);
let array3 = old.concat(neww);
array3 = [...new Set([...old,...neww])];
const resp = filterByReference(allob, array3);
skills3 = resp;
}

function add(id, data, allob) {
const oldob = data;
const old = oldob.map(c => c.id);
const neww = find_skill_id(id);
let array3 = old.concat(neww);
array3 = [...new Set([...old,...neww])];
const resp = filterByReference(allob, array3);
tafkidims2 = resp;
}
function addW(id, data, allob) {
const oldob = data;
const old = oldob.map(c => c.id);
const neww = find_skill_id(id);
let array3 = old.concat(neww);
array3 = [...new Set([...old,...neww])];
const resp = filterByReference(allob, array3);
workways3 = resp;
}
 function addnewW (event){
    
    const newOb = event.detail.skob;
    const newN = event.detail.skob.workWayName;
    const newValues = workways2 ;
    newValues.push(newOb);
    workways2 = newValues;
    const newSele = selected1;
    newSele.push(newN);
    selected1 = newSele;

  }
 function addnew (event){
    
    const newOb = event.detail.skob;
    const newN = event.detail.skob.skillName;
    const newValues = skills2 ;
    newValues.push(newOb);
    skills2 = newValues;
    const newSele = selected2;
    newSele.push(newN);
    selected2 = newSele;

  }
   function addnewR (event){
    
    const newOb = event.detail.skob;
    const newN = event.detail.skob.roleDescription;
    const newValues = roles ;
    newValues.push(newOb);
    roles = newValues;
    const newSele = selected3;
    newSele.push(newN);
    selected3 = newSele;

  }
let rishon = 0;
function myMission() {
     var checkBox = document.getElementById("tomeC");

  var text = document.getElementById("doneC");
  console.log(text);
  if (text.style.display == "none"){
    text.style.display = "";
  } else {
    text.style.display = "none";
  }
 const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
 rishon = idL;
}
let rishonves = 0;
function myMissionH() {
 const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
 rishonves = idL;
 var checkBox = document.getElementById("done");
  // Get the output text
  var text = document.getElementById("hoursC");
  var text2 = document.getElementById("vallueperhourC");
  var text3 = document.getElementById("vallueperhourN");
  var text4 = document.getElementById("hoursD");
  var text5 = document.getElementById("vallueperM");
  // If the checkbox is checked, display the output text
  if (text.style.display == "none"){
    text.style.display = "";
    text2.style.display = "";
    text3.style.display = "none";
    text4.style.display = "none";
    text5.style.display = "none";
  } else {
    text.style.display = "none";
    text2.style.display = "none";
    text3.style.display = "";
    text4.style.display = "";
    text5.style.display = "";
  }
}

function arraysEqual(a1,a2) {
    return JSON.stringify(a1)==JSON.stringify(a2);
}
function close (){
    dispatch('close')
}
 let name4 = ``;
     let descrip4 = ``;
     let hearotMeyuchadot4 = ``; 
     let noofhours4 = ``;
     let perhour4 = ``;
     let skills4 = ``;
     let roles4 = ``;
     let ww4 = ``;
     let rishon4 = ``;
          let rishonves4 = ``;
          let what4 = true;
function objToString (obj) {
    let str = '';
    for (let i = 0; i < obj.length; i++) {
        
     const length = Object.keys(obj[i]).length;
        let t = 0;
    for (const [p, val] of Object.entries(obj[i])) {
      const last = t === length - 1; 
        t++;
        if (typeof(val) == "string") {
        str += `${p}:"${val}"\n`;
    } else if (typeof(val) == "number"|"boolean") {
        str += `${p}:${val}\n`;
    } else if (typeof(val) == 'null'){
      str += `${p}:${val.map(c => c.id)}\n`;
    }
        if (last) {
          str += "},"
    }
    if (t == 1){
      str += "{"
    }
    }}
    return str;
}
function objToStringC (obj) {
   const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    let str = '';
    for (let i = 0; i < obj.length; i++) {
      if(obj[i].users_permissions_user.id == idL && what4 == false) {
        obj[i].order = 1
      } else if (obj[i].users_permissions_user.id == idL && what4 == true) {
        obj[i].order = 1
      }
        const length = Object.keys(obj[i]).length;
        let t = 0;
    for (const [p, val] of Object.entries(obj[i])) {
      const last = t === length - 1; 
        t++;
        if (typeof(val) == "string") {
        str += `${p}:"${val}"\n`;
    } else if (typeof(val) == "number"|"boolean") {
        str += `${p}:${val}\n`;
    } else if (typeof(val) == 'null'){
      str += `${p}:${val.map(c => c.id)}\n`;
    }
        if (last) {
          str += "},"
    }
    if (t == 1){
      str += "{"
    }
    }}
    return str;
}
export let masaalr = false;
let userss;
async function increment() {
  dispatch("load")
 
      const date = (mdate2 !== undefined) ? ` sqadualed: ${mdate2}` : ``;
      const negoss = ``;
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
    token  = cookieValue; 
     bearer1 = 'bearer' + ' ' + token;
    if (rishon !== 0){
        rishon4= `rishon: "${rishon}"`
    } else {
        rishon4 = ``;
    }
      if (rishonves !== 0){
        rishonves4= `rishonves: "${rishonves}"`
    } else {
        rishonves4 = ``;
    }
     if (name1 === name2){
          name4 = ``
     } else {
         name4 = `name: "${name2}"`
         what4 = false;
     }
      if (descrip === descrip2){
          descrip4 = ``
     } else {
         descrip4 = `descrip: "${descrip2}"`
                  what4 = false;

     }
    if (hearotMeyuchadot === hearotMeyuchadot2){
          hearotMeyuchadot4 = ``
     } else {
         hearotMeyuchadot4 = `hearotMeyuchadot: "${hearotMeyuchadot2}"`
         what4 = false;

     }
     if (noofhours === noofhours2){
          noofhours4 = ``
     } else {
         noofhours4 = `noofhours: ${noofhours2}`
         what4 = false;

     }
     if (perhour === perhour2){
         perhour4 = ``;
     } else {
         perhour4 = `perhour: ${perhour2}`;
         what4 = false;
     }
     const skillsId = skills.map(c => c.id);
     const skills2Id = skills3.map(c => c.id);
     const roId = tafkidims.map(c => c.id);
     const ro2Id = tafkidims2.map(c => c.id);
     const wwId = workways.map(c => c.id);
     const ww2Id = workways3.map(c => c.id);
     if (arraysEqual(skillsId, skills2Id) === false){
            skills4 = ` skills: [${skills2Id}], `;
                     what4 = false;

    } else {
        skills4 =``;
    }
     if (arraysEqual(roId, ro2Id) === false){
            roles4 = ` tafkidims: [${ro2Id}], `;
                     what4 = false;

    }  else {
            roles4 = ``;
    }
     if (arraysEqual(wwId, ww2Id) === false){
            ww4 = ` work_ways: [${ww2Id}], `;
                     what4 = false;

    } else {
        ww4 = ``;
    }
    let another = ``
 if (what4 == true && masaalr == true && mypos == false || what4 == true && masaalr == false || what4 == false){

    if (what4 == false){
    another = `,{
      what: true
      users_permissions_user: "${idL}"
      order: 4
    }`
    } 
     if (masaalr == true){
        userss = objToStringC(users)
  } else{
        userss = objToString(users)
  }
 try {
             await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: //${negoss} {rishons} {rishonveses}?
        JSON.stringify({query:
          `mutation { updatePendm(
      input: {
      where: {id: ${pendId}}
      data:  { users:[ ${userss}, 
     {
      what: ${what4}
      users_permissions_user: "${idL}"
      order: ${what4 == true ? 2 : 3}
    }
    ${another}
  ], nego:[  
{
    users_permissions_user: "${idL}"  
    ${noofhours4}
    ${hearotMeyuchadot4}
    ${descrip4}
    ${name4}
    ${perhour4}
    ${skills4}
    ${roles4}
    ${ww4}
    ${rishon4}
    ${rishonves4}
 }

  ]
      }
    }
  ){pendm { users { users_permissions_user { id}}}}
 } `   
// make coin desapire
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
         close();
        } catch (e) {
            error1 = e
            console.log(error1)
        }
      }
}
let linkg = "https://beosher.onrender.com/graphql"
onMount(async () => {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('jwt='))
        .split('=')[1];
    const cookieValueId = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='))
        .split('=')[1];
    idL = cookieValueId;
    token = cookieValue;
    bearer1 = 'bearer' + ' ' + token;

    try {
        await fetch(linkg, {
                method: 'POST',
                headers: {
                    'Authorization': bearer1,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: `{skills { id skillName} tafkidims {id roleDescription}workWays {id workWayName} } `
                })
            })
            .then(r => r.json())
            .then(data => miDatan = data.data);

    } catch (e) {
        error1 = e
        console.log(error1)
    }
    skills2 = miDatan.skills;
    roles = miDatan.tafkidims;
    workways2 = miDatan.workWays;
    console.log(skills2)
})
</script>

<table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">
        <h1 class="md:text-center text-2xl md:text-2xl font-bold"
            >הצעת שינוי ל{name1}</h1>
    </caption>
      <tr class="ggr">
        <th class="ggr" ></th>
        <td class="ggr">מקור</td>
        <td class="ggr">שינוי</td>
    </tr> 
    <tr >
        <th  >שם</th>
        <td >{name1}</td>
        <td >
                  <div dir="rtl" class='textinput'>
  <input type="text"  id="nam" name="nam" bind:value={name2} class='input' required>
  <label for="nam" class='label' >שם</label>
  <span class='line'></span>
</div>
        </td>
    </tr> <tr>
        <th>תיאור</th>
        <td>{descrip}</td>
        <td>
                                  <div dir="rtl" class='textinput'>
  <input type="text"  id="des" name="des" bind:value={descrip2} class='input' required>
  <label for="des" class='label' >תיאור</label>
  <span class='line'></span>
</div>
        </td>
    </tr> <tr>
        <th>כישורים נדרשים</th>
         <td> {#each skills as da, i}
        {da.skillName}   
            {/each}</td>
        <td>
            {#each skills3 as da, i}
            <button class="p-2 m-1" title={less} on:click={min(skills3 ,da.id)}><svg style="width:20px;height:20px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>{da.skillName}   </button>
            {/each}
        </td>
    </tr> <tr>
        <th>בחירת כישורים נוספים </th>
        <td></td>
        <td> <MultiSelect
            bind:selected={selected2}
            {placeholder1}
            options={skills2.map(c => c.skillName)}
            on:change={add(selected2, skills3, skills2)}
            />
            <AddNewSkill on:addnewskill={addnew} addS={addS} roles1={roles} />
            </td>
            </tr> <tr>
                <th>הגדרת תפקיד</th>
                  <td> {#each tafkidims as ga, i}
        {ga.roleDescription}   
            {/each}</td>
                <td>
                    {#each tafkidims2 as ta, i}
                    <button class="p-2 m-1" title={less} on:click={minR(tafkidims2, ta.id)}><svg style="width:20px;height:20px" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                    </svg>{ta.roleDescription}</button>
                    {/each}
                </td>
            </tr>
            <tr>
                <th>בחירת תפקידים אחרים </th>
                <td></td>
                <td> <MultiSelect
                    bind:selected={selected3}
                    on:add={(event) => console.log(event)}
                    {placeholder4}
                    options={roles.map(c => c.roleDescription)}
                    on:change={addR(selected3, tafkidims2, roles)}
                    />
                    <Addnewro  on:addnewrole={addnewR}   />
                    </td>
                    </tr> <tr>
                        <th>סוג משימה</th>
                         <td> {#each workways as oa, i}
        {oa.workWayName}   
            {/each}</td>
                        <td>
                            {#each workways3 as dm, i}
                            <button class="p-2 m-1" title={less} on:click={minW(workways3, dm.id)}><svg style="width:20px;height:20px" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                            </svg>{dm.workWayName}   </button>
                            {/each}
                        </td>
                    </tr>
                    <tr>
                        <th> הוספת סוג משימה</th>
                        <td></td>
                        <td><MultiSelect
                            bind:selected={selected1}
                            placeholder={plww[$lang]}
                            options={workways2.map(c => c.workWayName)}
                            on:change={addW(selected1, workways3, workways2 )}
                            />
                            <AddNewWorkway  on:addww={addnewW}/>
                                </td>
                                </tr> <tr>
                                    <th>תאריך ביצוע</th>
                                    <td>{mdate}</td>
                                    <td><input type="datetime-local" bind:value={mdate2}  ></td>
                                </tr> <tr>
                                    <th>הערות יחודיות לריקמה שלי</th>
                                    <td>{hearotMeyuchadot}</td>
                                    <td>
                                                              <div dir="rtl" class='textinput'>
  <input type="text"  id="hearotMeyuchadot2" name="hearotMeyuchadot2"  bind:value={hearotMeyuchadot2} class='input' required>
  <label for="hearotMeyuchadot2" class='label' >הערות מיוחדות</label>
  <span class='line'></span>
</div>
                                    </td>
                                </tr><tr>
                                    <th>קישור לביצוע המשימה</th>
                                    <td>{privatlinks}</td>
                                    <td>
                                                             <div dir="rtl" class='textinput'>
  <input type="text"  id="link" name="link"  bind:value={privatlinks2} class='input' required>
  <label for="link" class='label'>קישור לאתר בו מבוצעת המשימה </label>
  <span class='line'></span>
</div>
                                    </td>
                                </tr><tr style="display:''" id="hoursD">
                                    <th >כמה שעות זה אמור לקחת? </th>
                                    <td>{noofhours}</td>
                                    <td>
                                                             <div dir="rtl" class='textinput'>
  <input type="number" placeholder="0" id="hoursn" name="hoursn"  bind:value={noofhours2} class='input' required>
  <label for="hoursn" class='label'>כמה שעות זה אמור לקחת? </label>
  <span class='line'></span>
</div>
                                    </td>
                                </tr><tr style="display:''" id="vallueperhourN" >
                                    <th>כמה שווה שעה ?</th>
                                    <td>{perhour}</td>
                                    <td>
                                              <div dir="rtl" class='textinput'>
  <input type="number"  id="vallueperhourn" name="vallueperhourn" placeholder="0"
                                            bind:value={perhour2} class='input' required>
  <label for="vallueperhourn" class='label'>כמה שווה שעה? </label>
  <span class='line'></span>
</div>
                                    </td>
                                </tr>
                                
                                <!--<tr>
                                    <th>השמת המשימה לעצמי</th>
                                    <td></td>
                                    <td>
                                        <input
                                            bind:checked={myM}
                                            type="checkbox" id="tomeC" name="tome" value="tome" on:click={()=> myMission()}>
                                        <label for="tome">השמת המשימה לעצמי</label>
                                    </td>
                                </tr><tr style="display:none" id="doneC" >
                                    <th>ביצעתי כבר את המשימה</th>
                                    <td></td>
                                    <td>
                                        <input
                                            bind:checked={done}
                                            type="checkbox" id="done" name="done" value="done" on:click={()=> myMissionH()}>
                                        <label for="done">ביצעתי כבר את המשימה</label>
                                    </td>
                                </tr><tr style="display:none" id="hoursC">
                                    <th>כמה שעות זה לקח לי? </th>
                                    <td>{noofhours}</td>
                                    <td>
                                                                           <div dir="rtl" class='textinput'>
  <input type="number" placeholder="0" id="hours" name="hours"  bind:value={noofhours2} class='input' required>
  <label for="hours" class='label'>כמה שעות זה לקח לי? </label>
  <span class='line'></span>
</div>
                                    </td>
                                </tr>--><tr style="display:none" id="vallueperhourC">
                                    <th>כמה שווה שעה? </th>
                                    <td>{perhour}</td>
                                    <td>
                                         <div dir="rtl" class='textinput'>
  <input type="number"  id="vallueperhour" name="vallueperhour" placeholder="0"
                                            bind:value={perhour2} class='input' required>
  <label for="vallueperhour" class='label'>כמה שווה שעה? </label>
  <span class='line'></span>
</div>
                                        <input >
                                    </td>
                                </tr><tr >
                                    <th>שווי סך הכל למשימה </th>
                                    <td>
                                         {#if noofhours > 0 & perhour> 0}

                                        {noofhours * perhour}

                                        {:else} <p>0</p>
                                        {/if}
                                    </td>
                                    <td>
                                        {#if noofhours2 > 0 & perhour2 > 0}

                                        {noofhours2 * perhour2}

                                        {:else if noofhours > 0 & perhour> 0} 
                                        {noofhours * perhour}

                                        {:else} <p>0</p>
                                        {/if}
                                    </td>
                                </tr>
                                </table>
                                <div>
                                    <button
                                        on:click={increment}
                                        class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
                                        type="submit"
                                        name="addm">העלאת השינויים להצבעה</button> </div>
<style>
     .gg{ 
     position: sticky;
     top: 1px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
      color: rgb(132, 241, 223);
  }
   .ggd{ 
 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
                  color: rgb(132, 241, 223);


  }
  .ggr{ 
    position: sticky;
     top: 1px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     opacity: 1;
            color: rgb(132, 241, 223);

  }
  .ggr:hover, .gg:hover, .ggd:hover {
    background:var(--barbi-pink);
  } 
    .dd{
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
    .body {
      overflow-x: auto;
      overflow-y: auto;
     height: 100vh;
     width: 100vw;
     padding-left: 0.5em;
     padding-right: 0.5em;
    }
  
  table, th, td {
  border-collapse: collapse;
  border-width: 4px;
  border-color: rgb(103, 232, 249);
border-radius: 4%;
  }
  table {
  text-align: center;
  color: var(--barbi-pink);
  margin: 0 auto;
 
  }
 
  th{
     background-color: #6b0f1a;
     background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
     color: rgb(132, 241, 223);
   }
  td{
     background-color: #5efaf2;
     background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
  }
 th:hover{
       background:var(--barbi-pink);

 }
  td:hover {
    background:rgb(132, 241, 223);
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
  border-bottom: solid 1px var(--mturk);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
 color:  var(--barbi-pink);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}


.label {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--mturk);
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
  color: var(--barbi-pink);
  top: 0;
} 
</style>