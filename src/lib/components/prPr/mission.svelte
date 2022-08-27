<script>
  import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly } from 'svelte/transition';
        import Close from '$lib/celim/close.svelte'
  import SveltyPicker from 'svelty-picker'
  
  let myDate = '11:00';
    import MultiSelect from 'svelte-multiselect';
    import { lang } from '$lib/stores/lang.js'
    import Addnewro from '../addnew/addNewRole.svelte';
   import { createEventDispatcher } from 'svelte';
  import AddNewSkill from '../addnew/addNewSkill.svelte';
  import AddNewWorkway from '../addnew/addnewWorkway.svelte';
import { RingLoader
} from 'svelte-loading-spinners'

 const dispatch = createEventDispatcher();
export let newcontent = true;
export let newcontentR = true;
export let newcontentW = true;

let token; 

export let miData = [];
let error1 = null;

export let userslength = 0;
export let projectId; 
let spnot = [];
export let roles1;   
export let workways2 = [];
    let error2 = null;

    function find_role_id(role_name_arr){
     var  arr = [];
      for (let j = 0; j< role_name_arr.length; j++ ){
      for (let i = 0; i< roles1.length; i++){
        if(roles1[i].roleDescription === role_name_arr[j]){
          arr.push(roles1[i].id);
        }
      }
      }
      return arr;
     };

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

const placeholder = `סוג המשימה`;
let selected = [];
const placeholder1 = `בחירת כל הכישורים הרלוונטיים`;
export let skills2 = [];
let selected1 = [];
export let roles = [];
    let selected3;
   const placeholder4 = 'בחירת תפקידים נדרשים';
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
    export let vallues = [];
    let idL;
    console.log(miData);

    let miDatan = [];
let linkop;
let pendq = '';
let qwerys =``;
let rishon4 = ``;
let rishonves4 = ``;
let already = false;
async function increment() {
  already = true;
  // ולידציה שהיוזר חבר ברקמה מהקוקיות ומאקספורט של רשימת חברים
// א השמה של לעצמי אם לבד לעשות קוורי למיסיון אין פרוגרס ריקמה גדול לאסקד
// סיימתי את המשימה אם לבד השמה של קוורי לפינישד מיסיון אם עוד לפיניאפרובל 
  
console.log(miData);
  console.log("xke", miData.map(c => c.selected1));
  const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
  console.log(idL);
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
  if (userslength > 1) {
linkop = "createPendm";
 qwerys = "pendm";
pendq = ` users: [
     {
      what: true
      users_permissions_user: "${idL}"
    }
  ]`;
} else if (userslength === 1) {
  linkop = "createOpenMission"; 
  qwerys = "openMission";
}
  for (const element of miData) {
     if (element.myM === true){
        rishon4= `rishon: "${rishon}"`
        //create asked or in progres if alone
        //as
        if (userslength === 1) {
         
        } else {
          //ליצור אופן ואז לחלץ אידי וליצור אסקד
   `
  createAsk(
    input: {
      data:{ open_mission: ${lechaletz},
            project: ${projectId},
            users_permissions_user: ${idL}
    }
    }
  ){
    ask {id}
  }`
        }
    } else {
        rishon4 = ``;
    }
      if (element.done === true){
        rishonves4= `rishonves: "${rishonves}"`
        //create finiapruval or finished if alone
          if (userslength === 1) {

        } else {
           
        }
    } else {
        rishonves4 = ``;
    }
    const skills = element.skills.map(c => c.id);
        const work_ways = element.work_ways.map(c => c.id);
    const tafkidims = element.tafkidims.map(c => c.id);
const nhours = (element.nhours > 0) ? element.nhours : 0;
const valph = (element.valph > 0) ? element.valph : 0;
const date = (element.date !== undefined) ? ` sqadualed: "${new Date(element.date).toISOString()}",` : ``;
const dates = (element.dates !== undefined) ? ` dates: "${new Date(element.dates).toISOString()}",` : ``;
const pb = (element.publicklinks !== undefined || element.publicklinks !== "undefined") ? element.publicklinks : "";
const pv = (element.privatlinks !== undefined || element.privatlinks !== "undefined") ? element.privatlinks : "";

//publicklinks save to mission also othet new data
    // הפרדה של קישורים בפסיק
   
 let link = 'https://i18.onrender.com/graphql';
    try {
             await fetch(link, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query:
          `mutation { ${linkop}(
    input: {
      data: {project: "${projectId}",
             mission:  "${element.id}",
             work_ways: [${work_ways}],
             hearotMeyuchadot: "${element.spnot}",
             name: "${element.missionName}",
             descrip: "${element.descrip}",
             skills: [${skills}], 
             tafkidims: [${tafkidims}],
             vallues:  [${vallues}],
             noofhours: ${nhours},
             perhour: ${valph},   
             privatlinks: "${pv}",
             publicklinks: "${pb}",
             ${date} 
             ${dates}
             ${rishon4}
             ${rishonves4}
                         ${pendq} 

      }
    }
  ) {${qwerys}{id project{id }}}
} `   
} )})
  .then(r => r.json())
  .then(data => miDatan = data);
         console.log(miDatan)
             dispatch('close',{md:miDatan});
        } catch (e) {
            error1 = e
        }
        
	}

};


let cencel = " ביטול"
let addS = false;
let rishon = 0;
let rishonves = 0;
function myMission ()  {
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
function shifter ()  {
  isOpen = true;
  console.log("", days)
}
function myMissionH ()  {
 // Get the checkbox
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
   const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idL = cookieValueId;
  rishonves = idL;
};

function minww (id, mid) {
const y = miData.map(c => c.id);
const index = y.indexOf(mid);
const oldww = miData[index].work_ways;
const x = oldww.map(c => c.id);
const indexy = x.indexOf(id);
miData[index].work_ways.splice(indexy, 1);
dispatch('removeW', {
    data: miData
    } );
};

function minrole (id, mid) {
const y = miData.map(c => c.id);
const index = y.indexOf(mid);
const oldroles = miData[index].tafkidims;
const x = oldroles.map(c => c.id);
const indexy = x.indexOf(id);
miData[index].tafkidims.splice(indexy, 1);
dispatch('removeR', {
    data: miData
    } );
};

function minSkill (id, mid) {
const y = miData.map(c => c.id);
const index = y.indexOf(mid);
const oldskills = miData[index].skills;
const x = oldskills.map(c => c.id);
const indexy = x.indexOf(id);
console.log(indexy);
miData[index].skills.splice(indexy, 1);
console.log(miData[index].skills);
dispatch('removeS', {
    data: miData
    } );
};

let less = "הסרה";

function remove (id){
console.log(id); 
dispatch('remove', {
    id: id,
    data: miData
    } );
};



function addR (id, mid) {
  console.log(id, mid);
const y = miData.map(c => c.id);
const index = y.indexOf(mid);
const oldrolesob = miData[index].tafkidims;
const oldroles = oldrolesob.map(c => c.id);
const newroles = find_role_id(id);
let array3 = oldroles.concat(newroles);
array3 = [...new Set([...oldroles,...newroles])];
dispatch('addroles', {
    id: array3,
    data: miData,
    mid: mid
    } );
  
}; 

function addW (id, mid) {
const y = miData.map(c => c.id);
const index = y.indexOf(mid);
const oldwwob = miData[index].work_ways;
const oldww = oldwwob.map(c => c.id);
const neww = find_workway_id(id);
let array3 = oldww.concat(neww);
array3 = [...new Set([...oldww,...neww])];
console.log("fff")

dispatch('adwww', {
    id: array3,
    data: miData,
    mid: mid
    } );
  
}; 

function addSK (id , mid) {
const y = miData.map(c => c.id);
const index = y.indexOf(mid);
const oldskillsob = miData[index].skills;
const oldskills = oldskillsob.map(c => c.id);
const newskills = find_skill_id(id);
let array3 = oldskills.concat(newskills);
array3 = [...new Set([...oldskills,...newskills])];
dispatch('addskills', {
    id: array3,
    data: miData,
    mid: mid
    } );
  
};

function addnewsk (event) {

const id = event.detail.id;
const mid = event.detail.mid;
const y = miData.map(c => c.id);
const index = y.indexOf(mid);
const oldskillsob = miData[index].skills;
const oldskills = oldskillsob.map(c => c.id);
const newskills = [id];
let array3 = oldskills.concat(newskills);
array3 = [...new Set([...oldskills,...newskills])];
const skob = event.detail.skob;
dispatch('addnewsk', {
    id: array3,
    data: miData,
    mid: mid,
    skob: skob,
    } );
};


function addnewrole (event){
const id = event.detail.id;
const mid = event.detail.mid;
const y = miData.map(c => c.id);
const index = y.indexOf(mid);
const oldtafkidimsob = miData[index].tafkidims;
const oldtafkidims = oldtafkidimsob.map(c => c.id);
const newtafkidims = [id];
let array3 = oldtafkidims.concat(newtafkidims);
array3 = [...new Set([...oldtafkidims,...newtafkidims])];
const skob = event.detail.skob;
dispatch('addnewr', {
    id: array3,
    data: miData,
    mid: mid,
    skob: skob,
    } );
};


function addww (event) {
  console.log(event.detail.id);
console.log(event.detail.mid);
const id = event.detail.id;
const mid = event.detail.mid;
const y = miData.map(c => c.id);
const index = y.indexOf(mid);
const oldwwob = miData[index].selected1;
const oldww = oldwwob.map(c => c.id);
const neww = [id];
let array3 = oldww.concat(neww);
array3 = [...new Set([...oldww,...neww])];
const skob = event.detail.skob;
dispatch('addneww', {
    id: array3,
    data: miData,
    mid: mid,
    skob: skob,
    } );
};
let isOpen = false;
const closer = () => {
    isOpen = false;
};
const isshi = {"he":"האם זו משימת משמרות?","en":"is it shifts mission? "}
const editsi = {"he":"עריכת סידור המשמרות", "en": "edit shifts"}
let days = [{"name" :{"he": "ראשון", "en": "Sunday"}, id: 1, st: "11:00", cl: "17:00", shiftp:1, shifts:[{st: "11:00", cl: "17:00",ii:1}]}
            ,{"name" :{"he": "שני", "en": "Monday"}, id: 2, st: "11:00", cl: "17:00",shiftp:1, shifts:[{st: "11:00", cl: "17:00",ii:1}]}
            ,{"name" :{"he": "שלישי", "en": "Tuesday"}, id: 3, st: "11:00", cl: "17:00",shiftp:1, shifts:[{st: "11:00", cl: "17:00",ii:1}]}
            ,{"name" :{"he": "רביעי", "en": "Wednesday"}, id: 4, st: "11:00", cl: "17:00",shiftp:1, shifts:[{st: "11:00", cl: "17:00",ii:1}]}
            ,{"name" :{"he": "חמישי", "en": "Thursday"}, id: 5, st: "11:00", cl: "17:00", shiftp:1, shifts:[{st: "11:00", cl: "17:00",ii:1}]}
            ,{"name" :{"he": "שישי", "en": "Friday"}, id: 6, st: "11:00", cl: "17:00", shiftp:1, shifts:[{st: "11:00", cl: "17:00",ii:1}]}
            ,{"name" :{"he": "שבת", "en": "Saturday"}, id: 7, st: null, cl: null, shiftp:0, shifts:[]}];
const headingd = {"he":"יום בשבוע","en": "week day"};
const headinga = {"he":"שעת פתיחה","en": "opening hour"};
const headingb = {"he":"שעת סגירה","en": "closing hour"};
const headingc = {"he":"מספר המשמרות","en": "number of shifts"};
const headinge = {"he":"שעת פתיחת משמרת","en": "starting hour for shift"};
const headingf = {"he":"שעת סגירת משמרת","en": "finishing hour for shift"};
const headingr = {"he":"מספר הפרטים במשמרת","en": "shift partisipant number"};
let shift = [{"ii": 1}];
let shifts = 1
function shifterr (o){
    days[o].shifts.push({st: "11:00", cl: "17:00",ii:1})
  days = days

 for (let i = 0; i< days.length; i++ ){
    if (days[i].shiftp > shifts){
      shifts = days[i].shiftp
      shift = [...Array(shifts).fill(0).map(x => ({ ii: ''}))]

    }
  }
   shift = shift
  console.log(days,shift)
}

  </script>

  <DialogOverlay style="z-index: 700;" {isOpen} onDismiss={closer} >
        <div style="z-index: 700;" transition:fly|local={{y: 450, opacity: 0.5, duration: 1000}}>
  <DialogContent aria-label="form" class="contenti">
      <div style="z-index: 400; overflow-x: auto;" dir="rtl" class="d" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          on:click={closer}><Close/></button>
  
 <table dir="rtl" class="d" style="overflow-x: auto; font-size: 95%;">
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >{editsi[$lang]}</h1>
    </caption>
       <tr class="gg">
          <th class="gg ddd">{headingd[$lang]}</th>
                    {#each days as day}
          <td class="gg" style="font-size: 1rem">{day.name[$lang]}</td>
          {/each}
        </tr>
        
         <tr >
          <th class="ddd">{headinga[$lang]}</th>
                              {#each days as day}

          <td  ><SveltyPicker inputClasses="form-control" format="hh:ii" bind:value={day.st}></SveltyPicker>
</td>
          {/each}
        </tr>
         <tr >
          <th class="ddd">{headingb[$lang]}</th>
                              {#each days as day}

          <td ><SveltyPicker inputClasses="form-control" format="hh:ii" bind:value={day.cl}></SveltyPicker></td>
{/each}
        </tr>
        <tr >
          <th class="ddd">{headingc[$lang]}</th>
                              {#each days as day, i}

          <td > <div dir="rtl" class='textinput'>
  <input type="number"  id={`shif${i}`} on:change="{()=>shifterr(i)}" name="parti" bind:value={day.shiftp} class='input' required>
  <label for="{`shif${i}`}" class='label'>{headingc[$lang]}</label>
  <span class='line'></span>
</div></td>
{/each}
        </tr>

       {#each shift as shi, t}
  <tr >
          <th class="ddd">{headinge[$lang]}</th>
                              {#each days as day, i}
          {#if day.shifts[t] != undefined}

          <td  ><SveltyPicker inputClasses="form-control" format="hh:ii" bind:value={day.shifts[t].st}></SveltyPicker></td>
          {:else}
          <td  ></td>      
          {/if}
   {/each}
        </tr>
         <tr >
          <th class="ddd">{headingf[$lang]}</th>
                              {#each days as day, i}
                    {#if day.shifts[t] != undefined}
     <td ><SveltyPicker inputClasses="form-control" format="hh:ii" bind:value={day.shifts[t].cl}></SveltyPicker></td>
       {:else}
          <td  ></td>  
     {/if}
          {/each}
        </tr>
        <tr >
          <th class="ddd">{headingr[$lang]}</th>
                              {#each days as day, i}
                    {#if day.shifts[t] != undefined}
          <td style="font-size: 3rem">
             <div dir="rtl" class='textinput'>
  <input type="number"  id={`part${i}`} name="part"  bind:value={day.shifts[t].ii} class='input' required>
  <label for="{`part${i}`}" class='label'>{headingr[$lang]}</label>
  <span class='line'></span>
</div>
          </td>
            {:else}
          <td  ></td>  
                    {/if}
{/each}
        </tr>

        {/each}

</table>
</DialogContent>
  </div>
</DialogOverlay>


  {#if error1 !== null}
  {error1}
  {:else}
  <div class="dd md:items-center border-2 border-gold rounded  p-4" >
  <div class="body items-center d">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >משימות שנבחרו</h1>
    </caption>
        <tr class="gg">
          <th class="gg">הסרת המשימה שנבחרה</th>
          {#each miData as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
            <button
             title='הסרה'
             on:click={remove(data.id)}><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path fill="currentColor" d="M4,2H11A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M17.59,12L15,9.41L16.41,8L19,10.59L21.59,8L23,9.41L20.41,12L23,14.59L21.59,16L19,13.41L16.41,16L15,14.59L17.59,12Z" />
          </svg></button></td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">שם</th>
      {#each miData as data, i}
            <td class="ggr">
                <div dir="rtl" class='textinput'>
  <input type="text"  id="inputii" name="nam" bind:value={data.missionName} class='input' required>
  <label for="nam" id="labelii" class='label' >שם</label>
  <span class='line'></span>
</div>
            </td>
            {/each}
          </tr> <tr>
            <th>תיאור</th>
            {#each miData as data, i}
            <td>
                      <div dir="rtl" class='textinput'>
  <textarea type="text"  id="des" name="des"  bind:value={data.descrip} class='input d' required></textarea>
  <label for="des" class='label' >תיאור</label>
  <span class='line'></span>
</div>
            </td>
              {/each}
            </tr> <tr>
              <th>כישורים נדרשים</th>
              {#each miData as data, i}
            <td>
              {#each data.skills as da, i}
               <button class="p-2 m-1" title={less} on:click={minSkill(da.id, data.id)}><svg style="width:20px;height:20px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>{$lang == "en" ? da.skillName : da.localizations[0].skillName}</button>
              {/each}
              </td>
            {/each}
          </tr> <tr>
            <th>בחירת כישורים נוספים </th>
            {#each miData as data, i}
            <td> <MultiSelect
              loading={newcontent}
              bind:selected={data.selected2}
              {placeholder1}
              options={skills2.map(c => c.skillName)}
              on:change={addSK(data.selected2, data.id)}
              />
              <AddNewSkill color={"--barbi-pink"} mid={data.id} on:addnewskill={addnewsk} addS={addS} roles1={roles} />
                </td>
              {/each}
            </tr> <tr>
              <th>הגדרת תפקיד</th>
              {#each miData as data, i}
            <td>
              {#each data.tafkidims as ta, i}
              <button class="p-2 m-1" title={less} on:click={minrole(ta.id, data.id)}><svg style="width:20px;height:20px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>{$lang == "en" ? ta.roleDescription : ta.localizations[0].roleDescription}</button>
            {/each}
            </td>
            {/each}
          </tr>
          <tr>
            <th>בחירת תפקידים אחרים </th>
            {#each miData as data, i}
            <td> <MultiSelect
              loading={newcontentR}
              bind:selected={data.selected3}
              on:add={(event) => console.log(event)}
              {placeholder4}
              options={roles.map(c => c.roleDescription)}
              on:change={addR(data.selected3, data.id)}
              />
              <Addnewro color={"--barbi-pink"} mid={data.id} on:addnewrole={addnewrole}   />
            </td>
              {/each}
            </tr> <tr>
              <th>סוג משימה</th>
              {#each miData as data, i}
            <td>
              {#each data.work_ways as dm, i}
               <button class="p-2 m-1" title={less} on:click={minww(dm.id, data.id)}><svg style="width:20px;height:20px" viewBox="0 0 24 24">
                <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>{$lang == "en" ? dm.workWayName : dm.localizations[0].workWayName}   </button>
              {/each}
              </td>
            {/each}
          </tr>
          <tr>
            <th>סוג המשימה</th>
            {#each miData as data, i}
            <td><MultiSelect
              loading={newcontentW}
              bind:selected={data.selected1} 
              {placeholder}
              options={workways2.map(c => c.workWayName)}
              on:change={addW(data.selected1, data.id)}
              />
              <AddNewWorkway color={"--barbi-pink"} mid={data.id} on:addww={addww}/>
            </td>
              {/each}
            </tr> <tr>
              <th>תאריך התחלה</th>
              {#each miData as data, i}
            <td><input type="datetime-local" bind:value={data.date}  ></td>
            {/each}
          </tr><tr>
              <th>תאריך סיום</th>
              {#each miData as data, i}
            <td><input type="datetime-local" bind:value={data.dates}  ></td>
            {/each}
          </tr> <tr>
            <th>קישורים ציבוריים</th>
            {#each miData as data, i}
            <td>
                       <div dir="rtl" class='textinput'>
  <input type="text"  id="kisu" name="kisu"   bind:value={data.publicklinks} class='input' required>
  <label for="kisu" class='label' >קישורים ציבוריים</label>
  <span class='line'></span>
</div>
             </td>
             {/each}
        </tr><tr>
          <th>הערות יחודיות לריקמה שלי</th>
          {#each miData as data, i}
          <td>
                                  <div dir="rtl" class='textinput'>
  <textarea type="text"  id="hearotMeyuchadot2" name="hearotMeyuchadot2"  bind:value={data.spnot} class='input d' required></textarea>
  <label for="hearotMeyuchadot2" class='label' >הערות מיוחדות</label>
  <span class='line'></span>
</div>
           </td>
           {/each}
      </tr><tr>
        <th>קישורים יחודיים לריקמה שלי</th>
        {#each miData as data, i}
        <td>
                         <div dir="rtl" class='textinput'>
  <input type="text"  id="link" name="link"    bind:value={data.privatlinks} class='input' required>
  <label for="link" class='label'>קישור לאתר בו מבוצעת המשימה </label>
  <span class='line'></span>
</div>
         </td>
         {/each}
    </tr><tr style="display:''" id="hoursD">
          <th >כמה שעות זה אמור לקחת? </th>
          {#each miData as data, i}
          <td>
                                             <div dir="rtl" class='textinput'>
  <input type="number"  id="hoursn" name="hoursn"  bind:value={data.nhours} class='input' required>
  <label for="hoursn" class='label'>כמה שעות זה אמור לקחת? </label>
  <span class='line'></span>
</div>
          </td>
          {/each}
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה שעה ?</th>
          {#each miData as data, i}
          <td>
                           <div dir="rtl" class='textinput'>
  <input type="number"  id="vallueperhourn" name="vallueperhourn" 
                                            bind:value={data.valph} class='input' required>
  <label for="vallueperhourn" class='label'>כמה שווה שעה? </label>
  <span class='line'></span>
</div>
          </td>
          {/each}
        </tr>
        <tr>
          <th>{isshi[$lang]}</th>
          {#each miData as data, i}
          <td>
            <input
            bind:checked={data.isshif} 
            type="checkbox" id="isss" name="is" value="no" on:click={()=> shifter()}>
            <label for="isss">{isshi[$lang]}</label>
          </td>
          {/each}
    </tr>
    <tr style="display:''" id="ophour">
          <th >כמה שעות זה אמור לקחת? </th>
          {#each miData as data, i}
          <td>
        <button >{editsi[$lang]}</button>
          </td>
          {/each}
        </tr>
        <!--<tr>
          <th>השמת המשימה לעצמי</th>
          {#each miData as data, i}
          <td>
            <input
            bind:checked={data.myM} 
            type="checkbox" id="tomeC" name="tome" value="tome" on:click={()=> myMission()}>
            <label for="tome">השמת המשימה לעצמי</label>
          </td>
          {/each}
    </tr><tr>
          <th>השמת המשימה ל-1 מהריקמה שלי</th>
          {#each miData as data, i}
          <td>
            <input
            bind:checked={data.myM} 
            type="checkbox" id="tomeC" name="tome" value="tome" on:click={()=> myMission()}>
            <label for="tome">השמת המשימה ל-1 </label>
          </td>
          {/each}
    </tr><tr style="display:none" id="doneC" >
      <th>ביצעתי כבר את המשימה</th>
      {#each miData as data, i}
      <td>
        <input 
        bind:checked={data.done} 
        type="checkbox" id="done" name="done" value="done" on:click={()=> myMissionH()}>
        <label for="done">ביצעתי כבר את המשימה</label>
      </td>
      {/each}
    </tr><tr style="display:none" id="hoursC">
      <th>כמה שעות זה לקח לי? </th>
      {#each miData as data, i}
      <td>        <div dir="rtl" class='textinput'>
  <input type="number" placeholder="0" id="hours" name="hours"   bind:value={data.nhours} class='input' required>
  <label for="hours" class='label'>כמה שעות זה לקח לי? </label>
  <span class='line'></span>
</div>
      </td>
      {/each}
    </tr><tr style="display:none" id="vallueperhourC">
      <th>כמה שווה שעה? </th>
      {#each miData as data, i}
      <td>
                           <div dir="rtl" class='textinput'>
  <input type="number"  id="vallueperhour" name="vallueperhour" placeholder="0"
                                           bind:value={data.valph} class='input' required>
  <label for="vallueperhour" class='label'>כמה שווה שעה? </label>
  <span class='line'></span>
</div>
      </td>
      {/each}
    </tr>--><tr >
      <th>שווי סך הכל למשימה </th>
      {#each miData as data, i}
      <td>
      {#if data.valph > 0 & data.nhours > 0}
      
      {data.valph * data.nhours}
      
      {:else} <p>0</p>
      {/if}
      </td>
      {/each}
    </tr>
    </table>
  </div>
 <div>
   {#if already === false}
  <button 
  on:click={increment}
  class=" m-4 border  border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
  type="submit" 
  name="addm">פרסום משימות </button>
      {:else}
           <RingLoader size="80" color="#ff00ae" unit="px" duration="2s"></RingLoader>
  {/if}
  </div> 
</div>

  {/if}
  
   
  <style>
    .ddd{
       position: sticky;
     right: 1px ; 
    }
       :global([data-svelte-dialog-content].contenti) {
      background-color:rgba(rgb(247, 250, 36), 0.5);
      width: 90vw;
  }
  @media (min-width: 768px){
        :global([data-svelte-dialog-content].contenti) {
width:90vw;
        }
        }
  textarea::-webkit-resizer {
  border-width: 8px;
  border-style: solid;
  border-color: transparent  transparent var(--barbi-pink)  var(--barbi-pink);
}
 .d::-webkit-scrollbar {
    width: 10px;
}
   
.d::-webkit-scrollbar-track {
    background-color: #e4e4e4;
    border-radius: 100px;
}
 
.d::-webkit-scrollbar-thumb {
    background-color: #d4aa70;
    border-radius: 100px;
}
.d {
    scrollbar-color: #D4AA70 #e4e4e4;
}
.d::-webkit-scrollbar-thumb {
    background-image: linear-gradient(180deg, #D0368A 0%, #708AD4 99%);
    box-shadow: inset 2px 2px 5px 0 rgba(#fff, 0.5);
    border-radius: 100px;
}
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
     position: sticky;
     bottom: 1px; 
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
     top: 77px; 
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
     width: 96vw;
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
 
  
   :global(li:not(.selected):hover) {
 color: var(--barbi-pink);
    background-color:var(--lturk);    /* unselected but hovered options in the dropdown list */
  }
  :global(ul.tokens > li){
    background-color: var(--barbi-pink);
    color:var(--lturk);
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
  #labelii {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var( --gold);
  user-select: none;
}
  #inputii {
      color:var(--gold);
     
  border: none;
  margin: 0;
  padding: 10px 0;
  outline: none;
  border-bottom: solid 1px var(--mturk);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
  background: transparent;
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
  color:var(--barbi-pink);
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
  color:var( --barbi-pink);
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

.input:focus ~ .line, .input:valid ~ .line, #inputii:valid ~ #labelii, #inputii:focus ~ #labelii {
  width: 100%;
}
 #inputii:valid ~ #labelii, #inputii:focus ~ #labelii {
 font-size: 11px;
  color: var(--mturk);
  top: 0;
 }
.input:focus ~ .label, .input:valid ~ .label {
  font-size: 11px;
  color: #2196F3;
  top: 0;
}
.input:focus, .input:valid, #inputii:valid ~ #labelii, #inputii:focus ~ #labelii   {
 border : 0;
}
  </style>
      
        
   