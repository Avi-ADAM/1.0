<script>
    import { lang } from '$lib/stores/lang.js'
    import { Confetti } from "svelte-confetti"
   import { quintOut } from "svelte/easing";
    import {addslashes} from '$lib/func/uti/string.js'
    import { idPr } from '../../stores/idPr.js';
    import axios from 'axios';
    import { goto } from '$app/navigation';
    import AddnewVal from './addnewval.svelte';
    import MultiSelect from 'svelte-multiselect';
    import { onMount } from 'svelte';
    import Uplad from '../userPr/uploadPic.svelte';
     import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly, scale } from 'svelte/transition';
      import Chooser from '$lib/celim/ui/chooser.svelte'
      const baseUrl = import.meta.env.VITE_URL

let loading = $state(false);
let isOpen = $state(false);
let a = $state(0);
let success = $state(false)
    let before = $state(false);
    let url1 = baseUrl+"/api/upload";
    let linkP = $state("");
    let desP = $state("");
    let desPl = $state("");
    let resP;
    let projectName_value = $state("");
    let token; 
    let timeToP = $state("already");
   let idL;
let run = [];
let imageId = 50;
let files;
  let shgi = $state(false);
    let restime = $state();
    let nam;
    let ont = $state(false)
async function sendP () {
  if(projectName_value.length < 1){
    naex = {"he": "שם הריקמה חייב להיות ארוך יותר", "en": "please choose name for the FreeMate"}
    shgi = true 
  }else{
    if (run.includes(projectName_value)){
   naex = {"he":"השם כבר קיים נא לבחור שם אחר" , "en":"name already exists please try another name"}
  shgi = true; 
} else{
  loading = true;
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
    let bearer1 = 'bearer' + ' ' + token;
//let fd = new FormData();
if (files) {
  //  fd.append('files', files[0]);
  axios
 .post( url1, files  ,{
                headers: {
                    Authorization: bearer1,
                },
            })
            .then(({ data }) => {
                 imageId = data[0].id;
                 sendPP()
            })
            .catch(error => {
    console.log('צריך לתקן:', error.response);
        loading = false;
            });
          } else {
            sendPP()
          }
  }
}
async function sendPP(){
  await newnew()
    .then()
   let d = new Date;
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
    let bearer1 = 'bearer' + ' ' + token;
    try {
           const res = await fetch(baseUrl+"/graphql", {
              method: "POST",
              headers: {
                   'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },  body: JSON.stringify({
                        query: `mutation { createProject(
       data: {
         user_1s: ${idL},
        projectName: "${projectName_value}",
        publishedAt: "${d.toISOString()}",
        publicDescription: """${addslashes(desP)}""",
        linkToWebsite: """${addslashes(linkP)}""",
        descripFor: """${addslashes(desPl)}""",
        vallues:[${find_value_id(selected)}],
        restime: ${restime},
        timeToP:${timeToP},
         profilePic: ${imageId}, 
         isOt:${ont}       
        }  
  ){
  data { id attributes{ projectName}}
}
}
              `})
})
             .then(r => r.json())
  .then(data => resP = data);
        console.log(resP)
         success = true
         idPr.set(resP.data.createProject.data.id);
        before = true;
            loading = false;
    let data = {"name": userName_value, "action": "יצר ריקמה חדשה בשם:", "det": `${projectName_value} והתיאור: ${desP}` }
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
       goto("/moach", );
  })
  .catch((error) => {
    console.error('Error:', error);
  
  })
                  }
      catch(error) {
        console.log('צריך לתקן:', error);
                }
              }
}

let vallues = $state([]);
    let error1 = null;
    let addval = false;
    
    onMount(async () => {
       const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
    token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
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
           const res = await fetch(baseUrl+"/graphql", {
              method: "POST",
              headers: {
                   'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },  body: JSON.stringify({
                        query: `query {
  vallues  (sort: "valueName:asc") {data{ id attributes{  valueName ${$lang == 'he' ? 'localizations{data{attributes{ valueName}} }' : ""}}}}
  projects{data{attributes{  projectName}}}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            vallues = res.data.vallues.data;
            if ($lang == "he" ){
              for (var i = 0; i < vallues.length; i++){
                if (vallues[i].attributes.localizations.data.length > 0){
                vallues[i].attributes.valueName = vallues[i].attributes.localizations.data[0].attributes.valueName
                }
              }
            }          
            vallues = vallues
                        newcontent = false
            const runi = res.data.projects.data;
           run = runi.map(c => c.attributes.projectName)
        } catch (e) {
            error1 = e
        }
    });

let suc = $state(false);
    function find_value_id(value_name_arr){
     var  arr = [];
      for (let j = 0; j< value_name_arr.length; j++ ){
      for (let i = 0; i< vallues.length; i++){
        if(vallues[i].attributes.valueName === value_name_arr[j]){
          arr.push(vallues[i].id);
        }
      }
      }
      return arr;
     };


    let selected = $state([]);
        const placeholder = `${$lang == "he" ? "ערכים ומטרות" : "vallues and goals"}`;

 function project (id) {
         idPr.set(resP.data.createProject.data.id);
    goto("/moach");
  };
  import { RingLoader
} from 'svelte-loading-spinners'
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device.js';
  import MobileModal from '$lib/celim/ui/mobileModal.svelte';
  let { userName_value } = $props();
 const closer = () => {
    isOpen = false;
  a = 0;
  };
  	function callbackFunction(event) {
    a = 2;
    files = event.files;
    isOpen = false;
    suc = true;
	}
  function openen () {
  isOpen = true;
    a = 1
}


  async function newnew (){
    let meData = []
  for (let i = 0; i<selected.length ;i++){
    if (!vallues.map(c => c.attributes.valueName).includes(selected[i])){
      //create new and update vallues
        console.log(selected,vallues)
  let link =baseUrl+"/graphql" ;
  let d = new Date
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation  createVallue {
  createVallue(data: {  valueName: "${selected[i]}",
        publishedAt: "${d.toISOString()}"}) {
    data {
      id
      attributes {
        valueName
      } 

       }
    }
}`   
        })
})
  .then(r => r.json())
  .then(data => meData = data);
const newOb = meData.data.createVallue.data;
    const newValues = vallues ;
    newValues.push(newOb);
       
    vallues = newValues;
    let data = {"name": userName_value, "action": "create ערך חדש בשם:", "det": `${selected[i]}`}
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
              }
            }

  function handleFocusIn(event) {
    if (isMobileOrTablet) {
        setTimeout(() => {
            event.currentTarget.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }, 300);
    }
}

  let ugug = $state(``);
  let valE = $state(false)
    let newcontent = $state(true)
  let addne = $derived({"he":`הוספת "${ugug}"`,"en": `Create "${ugug}"`})
const timeto = {"he":"כמה זמן עד שהריקמה תכניס כסף", "en":"how much time until the FreeMates will be profitable"}
const timetoex = {"he":"חישוב הזמן עד שניתן יהיה לחלק כסף מרגע שאוישו כל המשימות ונתקבלו כל המשאבים הנדרשים", "en" : "the time until money can be splited from when all of the missions has asigned and all the resources has accepted" }
const cvar = {"he":"הריקמה כבר רווחית", "en": "the FreeMates is already profitable"}
const week = {"he":"שבוע" , "en": "week"}
const month = {"he": "חודש", "en": "month"}
const threemonth = {"he": "שלושה חודשים", "en": "three months"}
const halt = {"he": "חצי שנה" , "en": "half a year"}
const year = {"he": "שנה" , "en": "year"}
const toyers = {"he": "שנתיים", "en": "two years"}
const more = {"he": "יותר משנתיים", "en": "more then 2 years" }
const never = {"he": "לעולם לא", "en": "never"}
const om = {"he":"רק רגע בבקשה", "en": "one moment please"}
const cencel = {"he":"ביטול","en": "cencel"}
const crn = {"he":"יצירת ריקמה חדשה", "en": "Create new FreeMates"}
const frn = {"he":"שם הריקמה", "en":"FreeMates name"}
const hours = {"he": "שעות", "en": "hours"}
const hrex = {"he": "לאחר זמן זה חוסר מענה יחשב כהסכמה", "en": "after that: non-voting will consider as agreement"}
const hre = {"he":"זמן תגובה לקבלת החלטות בריקמה", "en":"time to respond to FreeMates voting"}
const teure = {"he": "תיאור שיהיה גלוי לכל", "en": "short description with public visibility"} 
const prte = {"he": "תאור מפורט שגלוי רק בתוך הריקמה", "en":"long description visible only to the FreeMates members"}
const wel = {"he":"לינק לאתר (אם יש)" ,"en":"link to a website (if any)"}
let naex = $state({"he":"השם כבר קיים נא לבחור שם אחר" , "en":"name already exists please try another name"})
const whva = {"he":"אלו ערכים ומטרות הריקמה תקדם" , "en":"which vallues and goals the FreeMates will promote"}
const ladd = {"he":"הוספת לוגו", "en": "add Logo"} 
const su = {"he": "לוגו נוסף בהצלחה", "en": "logo has successfully added"}
const addn = {"he":"הוספת ערך חדש","en": "Add new Vallue"}
const cree = {"he": "ליצור ולפרסם ריקמה", "en": "Create new FreeMate"}
const sur = {"he":"הריקמה נוצרה בהצלחה", "en":"new FreeMates has created"}
const tob = {"he":"מעבר לניהול הריקמה במוח הריקמה", "en":"to the FreeMates brain"}
const inc = {"he":"ניתן להזין את הערך המוערך של ההכנסה אם ידוע, אחרת ניתן יהיה לחשב בהמשך מדף הניהול","en":"if you know the aproximate vallue of income, else you can later caculate it"}
 </script>  
{#if isOpen}
      <div class="center-upload" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          onclick={closer}>{cencel[$lang]}</button>
          {#if a == 1}
          <Uplad current="https://res.cloudinary.com/onelove1/image/upload/v1645805397/pngegg_2_8aeb98b032.png" onMessage={callbackFunction}/>

          {:else if a == 2 && isOpen}
          <div class="sp bg-gold">
            <h3 class="text-barbi">{om[$lang]}</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> 
         {/if}
         </div>
{/if}

<div transition:scale={{ delay: 250, duration: 300, easing: quintOut }} class="a"></div>


  {#if before == false}

<div transition:scale={{ delay: 250, duration: 300, easing: quintOut }} dir="{$lang == "en" ? "ltr" : "rtl"}" class="jho {isMobileOrTablet ? "pb-12" : ""} flex flex-col items-center text-center justify-center">
  <h1 class="text-gold">{crn[$lang]}</h1>
<br>

        <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input name="des" bind:value={projectName_value}  
 type='text' class='input'required >
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="des" class='label'>{frn[$lang]}</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600 bg-slate-50">{naex[$lang]}</small>{/if}
<!----
    <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <textarea name="es"  bind:value={desP}    
 type='text' class='input d' required ></textarea>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="es" class='label'>{teure[$lang]}</label>
  <span class='line'></span>
</div>-->
<br>
<div class="w-full">
<h2 class="text-barbi">{teure[$lang]}</h2>
<RichText bind:outpot={desP}/>
</div>
<!----
   <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <textarea name="s"  bind:value={desPl}     
 type='text' class='input d' required></textarea>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="s" class='label'>{prte[$lang]}</label>
  <span class='line'></span>
</div>-->
<div class="w-full">
    <h2 class="text-barbi">{prte[$lang]}</h2>

<RichText bind:outpot={desPl}/>
</div>
 <div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input name="de"    bind:value={linkP}     
 type='text' class='input' required>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="de" class='label'>{wel[$lang]}</label>
  <span class='line'></span>
</div>
<br>
<div class="">
<h2 
 class=" text-barbi " >{ladd[$lang]}</h2>
<Uplad
  noHeader={true}
 current="https://res.cloudinary.com/onelove1/image/upload/v1645805397/pngegg_2_8aeb98b032.png" onMessage={callbackFunction}/>

{#if suc == true}<small class="text-barbi">{su[$lang]}</small>{/if}
</div>         
<h1 class="midscreenText-2 text-center text-gold">
  {userName_value} 
  {whva[$lang]}
?
</h1> 
{#if !isMobileOrTablet()}
<div class="input-2">
     <MultiSelect
     outerDivClass="!bg-gold !text-barbi"
     inputClass="!bg-gold !text-barbi"
     liSelectedClass="!bg-barbi !text-gold"
      createOptionMsg={addne[$lang]}
     allowUserOptions={"append"}
      loading={newcontent}
      bind:searchText={ugug}
     bind:selected
     {placeholder}
     options={vallues.map(c => c.attributes.valueName)}
     />
  </div>
{:else}
  <MobileModal onClose={()=> valE = false} bind:isOpen={valE} title={placeholder[$lang]}>
        <div class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle p-2">

       <MultiSelect
     outerDivClass="!bg-gold !text-barbi"
     inputClass="!bg-gold !text-barbi"
     liSelectedClass="!bg-barbi !text-gold"
      createOptionMsg={addne[$lang]}
     allowUserOptions={"append"}
      loading={newcontent}
      bind:searchText={ugug}
     bind:selected
     {placeholder}
     options={vallues.map(c => c.attributes.valueName)}
     />
     </div>
  </MobileModal>
{/if}
  <br>
 <div dir="{$lang == "en" ? "ltr" : "rtl"}" class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-gold">{hre[$lang]}</h2>
    <select class:round={$lang == "he"} class:rounden={$lang == "en"} bind:value={restime} class=" form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none">
<option value="feh" selected> 48 {hours[$lang]} </option>
<option value="sth">72 {hours[$lang]} </option>
<option value="nsh">96 {hours[$lang]} </option>
<option value="sevend">{week[$lang]}</option>

</select>
<small style="color: turquoise;">{hrex[$lang]}</small>
</div>
<div dir="{$lang == "en" ? "ltr" : "rtl"}" class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-gold">{timeto[$lang]}</h2>
    <select class:round={$lang == "he"} class:rounden={$lang == "en"} bind:value={timeToP} class=" form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none">
<option value="already" selected>{cvar[$lang]}</option>
<option value="week">{week[$lang]}</option>
<option value="month">{month[$lang]}</option>
<option value="threeM">{threemonth[$lang]}</option>
<option value="sixM">{halt[$lang]}</option>
<option value="oneY">{year[$lang]}</option>
<option value="twoY">{toyers[$lang]}</option>
<option value="more">{more[$lang]}</option>
<option value="never">{never[$lang]}</option>
</select>
<small style="color: turquoise;">{timetoex[$lang]}</small>
</div>
<Chooser tr={{"he":"ריקמה מתמשכת","en":"continuous"}}   
  fl={{"he":"ריקמה חד פעמית","en":"one timed"}} 
  level={{"he":"הריקמה מיועדת להיות אירוע חד פעמי או מתמשך? לדוגמה: הפקת אירוע או הקמת עסק להפקת אירועים","en":"those the FreeMates intend to be a one time think or a continouse one? for exmple: event production vs openting a production company"}} 
  bind:checked={ont} />
  <!-- הדוגמה א טובה צריך לתת פתיחה של מסעדה מול אירוע חד פעמי, גם כדאי לשים בשורה נפרדת של הערות 
{#if ont == true}
<h3 class="text-barbi">{inc[$lang]}</h3>
<input type="number"/>
{/if}-->
  {#if loading == false}

<button 
    class="cen bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold p-4 rounded-full"
     onclick={sendP}
     name="addm">{cree[$lang]}</button>
       {:else}  <RingLoader size="100" color="#ff00ae" unit="px" duration="2s"></RingLoader>
{/if}</div>
{:else}
<div class="aft">
  <h1 class="text-barbi">{sur[$lang]}</h1>
  <button class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"
 onclick={project} >{tob[$lang]}</button>
</div>
{/if}
  {#if success}
  <div style="
position: fixed;
top: -50px;
left: 0;
height: 100vh;
width: 100vw;
display: flex;
justify-content: center;
overflow: hidden;
pointer-events: none;">
      <Confetti rounded size=30 x={[-5, 5]} y={[-5, 5]} delay={[0, 50]} amount=200 duration=10000 colorArray={["url(https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png)"]} fallDistance="100vh"/><!--colorRange={[0, 120]}-->
<Confetti noGravity x={[-5, 5]} y={[-5, 5]} delay={[550, 550]} duration=10000  amount=2000 colorRange={[120, 240]} fallDistance="100vh"/>
<Confetti noGravity x={[-5, 5]} y={[-5, 5]} delay={[1000, 1050]} duration=10000 amount=200 colorRange={[240, 360]} fallDistance="100vh"/>
<Confetti x={[-5, 5]} y={[0, 0.1]} delay={[500, 2000]}  duration=5000 amount=200  />
</div>
{/if}
<style>
 .center-upload {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9;
  background: white;
  border-radius: 1em;
  box-shadow: 0 0 20px #0002;
  padding: 2em;
  display: flex;
  flex-direction: column;
  align-items: center;
}
  textarea::-webkit-resizer {
  border-width: 8px;
  border-style: solid;
  border-color: transparent  transparent var(--gold)  var(--gold);
}
  .a{
     background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
 z-index: -1;
 position: fixed;
  top: 0;
  left: 0;
  min-width: 100vw;
  min-height: 100vh;
  }
select.round {
  background-image:
    linear-gradient(315deg, transparent 50%, rgb(0, 174, 255) 50%),
    linear-gradient(225deg, rgb(0, 174, 255) 50%, transparent 50%),
    radial-gradient(#ddd 70%, transparent 72%);
  background-position:
    calc(0% + 20px) calc(1em + 2px),
    calc(0% + 15px) calc(1em + 2px),
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
}

select.round:focus {
  background-image:
    linear-gradient(315deg, white 50%, transparent 50%),
    linear-gradient(225deg, transparent 50%, white 50%),
    radial-gradient(gray 70%, transparent 72%);
  background-position:
    calc(0% + 15px) 1em,
    calc(0% + 20px) 1em,
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
  border-color: green;
  outline: 0;
}
select.rounden {
  background-image:
    linear-gradient(45deg, transparent 50%, gray 50%),
    linear-gradient(135deg, gray 50%, transparent 50%),
    radial-gradient(#ddd 70%, transparent 72%);
  background-position:
    calc(100% - 20px) calc(1em + 2px),
    calc(100% - 15px) calc(1em + 2px),
    calc(100% - .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
}

select.rounden:focus {
  background-image:
    linear-gradient(45deg, white 50%, transparent 50%),
    linear-gradient(135deg, transparent 50%, white 50%),
    radial-gradient(gray 70%, transparent 72%);
  background-position:
    calc(100% - 15px) 1em,
    calc(100% - 20px) 1em,
    calc(100% - .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
  border-color: green;
  outline: 0;
}
     .sp{
   display: grid;
    justify-content: center;
  align-items: center; 
  }
  .aft{
    display: grid;
    align-items: center;
    justify-content: center;
  }
  .cen{
    margin: 0 auto;

  }
  .jho{
 width: 50%;
 margin: 0 auto;
 
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
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
 color:  var(--gold);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}


.label {

  font-size: 15px;
  position: absolute;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--gold);
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
  font-size: 14px;
  color: turquoise;
  top: 0;
}
.input:focus ,.input:valid  {
  border: 0;
}

@media (max-width:600px){
 
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
 .jho{
 width: 90%;
 margin: 0 auto;
  }
 
}
@media (min-width:601px){
 .d::-webkit-scrollbar {
    width: 17px;
}
}


    h1{
      font-size: 29px;  
    }
    img.bg {
  min-height: 100%;
  min-width: 1024px;
  width: 100%;
  height: auto;
	  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
}


@media screen and (max-width: 1024px) { /* Specific to this particular image */
  img.bg {
    left: 50%;
    margin-left: -512px;   /* 50% */
  }
}  
</style>
