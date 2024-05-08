
<script>
  import Tile from '$lib/celim/tile.svelte'
	import { crossfade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	const [send, receive] = crossfade({
		duration:1500,
		easing: quintOut
	});
   import Grow from '$lib/celim/icons/grow.svelte'
              import { lang } from '$lib/stores/lang.js'
   // import AddSkil from './addSkil.svelte';
    import { skillsNew } from '../../stores/skillsNew.js';
    import MultiSelect from 'svelte-multiselect';
    import { createEventDispatcher } from 'svelte';
    import Addnewsk from '../addnew/addNewSkill.svelte';
    import Addneww from '../addnew/addnewWorkway.svelte';
    import Addnewv from '../addnew/addnewval.svelte';
    import Addnewr from '../addnew/addNewRole.svelte';
    import Addnewn from '../addnew/addNewNeed.svelte';
    import Newsp from './newsp.svelte';
    import Edsp from './editsp.svelte'


import { slide, fly } from 'svelte/transition';
const baseUrl = import.meta.env.VITE_URL

let newskillslist, idLi, name
 const dispatch = createEventDispatcher();
//export let addNs;
export let bgi = "wow"
    export let valc = "skillName";
    export let data = [];
    export let meData = [];
    export let datan ="";
    let token;
    //for the options of multiselect
    let allvn = []
     export let addS = false;
    let listt = [];
    export let kish;
    export let linkp = "skills";
    let error1 = null;
    export let addSl = false;
   async function get  () {
      const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idLi = cookieValueId;
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
            let more = ``
            if ($lang == "he"){
              more =  `localizations{ data {attributes{ ${valc} }}}`
            }
              const res = await  fetch(baseUrl+"/graphql", {
              method: "POST",
              headers: {
                'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  ${linkp} {data{ id attributes {${valc} ${more}}}}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
              meData = res.data[linkp].data;
                             if ($lang == "he" ){
              for (var i = 0; i < meData.length; i++){
                if (meData[i].attributes.localizations.data.length > 0){
                meData[i].attributes[valc] = meData[i].attributes.localizations.data[0].attributes[valc]
                }
              }
            }
            meData = meData
              allvn = meData.map(c => c.attributes[valc]);
              newcontent = false
          } catch (e) {
              error1 = e
              console.log(error1);
          }
      };

  export let placeholder =" בחירת כישורים" ;
  skillsNew.subscribe(newwork => {
    newskillslist  = newwork;
    });
let uid;
/*
function deleteitem (skillId){
  console.log(skillId);
    const index = skillslist.indexOf(skillId);
if (index > -1) {
  skillslist.splice(index, 1);
  };
console.log("skillslist",skillslist);
};    */
let miData = [];
let g = false;
let needr = [];

async function increment() {
      g = true;
       let more = ``
            if ($lang == "he"){
              more =  `localizations { data{attributes{ ${valc} }}}`
            }
     if (datan !== "mash"){
       let list = data.map(c => c.id);
  const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  uid = cookieValueId;
    token  = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    let link =baseUrl+"/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',

        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body:
        JSON.stringify({query:
           `mutation { updateUsersPermissionsUser(
    id:${uid}
      data: { ${kish}: [${list}] }

  ){
      data {
        attributes{
          ${kish}{ data {
              id attributes{ ${valc} ${more}}}
          }
      }
  }
}
}
`
        })
})
  .then(r => r.json())
  .then(data => miData = data.data);
         console.log(miData,miData.updateUsersPermissionsUser.data.attributes[kish])
           if ($lang == "he" ){
              for (var i = 0; i < miData.updateUsersPermissionsUser.data.attributes[kish].data.length; i++){
                const t = miData.updateUsersPermissionsUser.data.attributes[kish].data
                if (t[i].attributes.localizations.data.length > 0){
                t[i].attributes[valc] = t[i].attributes.localizations.data[0].attributes[valc]
                }
              }
            }
            miData = miData
         addSl = false;
 dispatch('close', {
    linkp: linkp,
    list: miData.updateUsersPermissionsUser.data.attributes[kish].data
    } );
    g = false;
        } catch (e) {
            error1 = e
        }
      }  else{
        g = false;
      }
    };


  import { RingLoader
} from 'svelte-loading-spinners'
export let Valname = "כישורים";
let yy = 0;
export let masss = false;
function find_id(arra){
     var  arr = [];
      for (let j = 0; j< arra.length; j++ ){
      for (let i = 0; i< meData.length; i++){
        if(meData[i].attributes[valc] === arra[j]){
          arr.push(meData[i].id);
        }
      }
      }
      return arr;
     };
function find_name(arra){
     var  arr = [];
      for (let j = 0; j< arra.length; j++ ){
      for (let i = 0; i< meData.length; i++){
        if(meData[i].id === arra[j]){
          arr.push(meData[i].attributes[valc]);
        }
      }
      }
      return arr;
     };

const filterByReference = (allob, id)=> {
  console.log(id)
   let res = [];
   res = allob.filter(el => {
      return id.find(element => {
         return element === el.id;
      });
   });
   return res;
}

function addSK (id){
       if (datan !== "mash"){

  yy = 1;
  listt = data;
const oldob = data;
const old = oldob.map(c => c.id);//.map(String)
const neww = find_id(id);
let array3 = old.concat(neww);
array3 = [...new Set([...old,...neww])];

const resp = filterByReference(meData, array3);
const datana = resp;
  dispatch('add', {
    data: datana,
    linkp: kish,
    valc: valc,
    a: datan
    } );
  }
}

function adm (id){
 if (datan === "mash" && id.length > 0) {
    const neww = find_id(id);
         needr = neww;
        updi ()
      }
    }

function min(id, nj){
  if (datan !== "mash" ){
  yy = 2;
  listt = data;
const oldob = data;
const x = oldob.map(c => c.id);
const indexy = x.indexOf(id);
oldob.splice(indexy, 1);

dispatch('remove', {
    data: oldob,
    linkp: kish
    } );
  } else if (datan === "mash"){
    dispatch('delm', {
    id: id,
    nj: nj
    } );
  }
}

function open () {
  //if there is no already , but to check changes
get ();
  dispatch('open', {
    linkp: linkp,
    } );
};

function bitul () {
  if (yy == 0){
    listt = data;
  }
 dispatch('close', {
    linkp: linkp,
    list: listt,
    } );
};

export let addR = false;
export let addW = false;
function addnewM (event) {
  console.log(needr);
  const id = event.detail.id;
const oldob = needr;
const old = oldob;
const newi = [id];
let array3 = old.concat(newi);
array3 = [...new Set([...old,...newi])];
const skob = event.detail.skob;
const slectednew = meData;
slectednew.push(skob);
meData = slectednew
 allvn = meData.map(c => c.attributes[valc]);
  needr = array3;
  const oldsel = data.selected2
  oldsel.push(event.detail.name);
  data.selected2 = oldsel;
        updi ()
}

function addnew (event) {
  yy = 3;
listt = data;
const id = event.detail.id;
const oldob = data;
const old = oldob.map(c => c.id);
const newi = [id];
let array3 = old.concat(newi);
array3 = [...new Set([...old,...newi])];
const skob = event.detail.skob;
addS = false;
addR = false;
addW = false;

dispatch('addnew', {
    id: array3,
    data: data,
    skob: skob,
    linkp: kish
    } );

};
let meDatamm = [];
function bitulm (){
  masss = false;
   dispatch('massss', {
            mass: false
          })
          needr = []
          data.selected2 = []
          meDatamm = []
}
async function updi (){
   let res = []
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
      let linkg =baseUrl+"/graphql" ;
        try {
             await fetch(linkg, {
              method: 'POST',

        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body:
        JSON.stringify({query:
          `{  mashaabims (filters:{id: {in:[${needr}]}}){data{ id attributes{
          name descrip kindOf  price linkto
        } }}}`
        })
 })
  .then(r => r.json())
  .then(data => res = data);
    meDatamm = res.data.mashaabims.data
            g = false;
              masss = true;
             dispatch('massss', {
            mass: true
          })
    } catch (e) {
            console.log(e)
        }
}
function clodd (event) {
  const  id = event.detail.id
  const  name = event.detail.name
  const  skob = event.detail.skob
  const oldob = data;
  const x = oldob.map(c => c.id);
  const indexy = x.indexOf(id);
  oldob.splice(indexy, 1);
  data.push(skob)
  data = data
  console.log(id)
masss = false
addSl = false
 dispatch('close', {
    linkp: linkp,
    list: data

    } );
   dispatch('massss', {
            mass: false
          })
        }

function clohh (event) {
const  id = event.detail.id
const  name = event.detail.name
const  skob = event.detail.skob
const oldob = data;
const old = oldob.map(c => c.id).map(String);
const neww = find_id(id);
let array3 = old.concat(neww);
array3 = [...new Set([...old,...neww])];

const resp = filterByReference(meData, array3);
const datana = resp;
  dispatch('add', {
    data: datana,
    linkp: kish,
    valc: valc,
    a: datan
    } );
data.push(skob)
data = data
  console.log(id)
masss = false
addSl = false
 dispatch('close', {
    linkp: linkp,
    list: data

    } );
   dispatch('massss', {
            mass: false
          })
}
async function wdwd (event) {
    const miDatanew = event.detail.data;
  const y = miDatanew.map(c => c.id);
const id = event.detail.id;
const index = y.indexOf(id);
if (index > -1) {
  miDatanew.splice(index, 1);
};
if (miDatanew.length > 0) {
  masss = false
   meDatamm = miDatanew;
   needr = meDatamm.map(c => c.id);
   const old = data.selected2;
   const tor = find_name(event.detail.id)
   const indexd = old.indexOf(tor);
  if (index > -1) {
  old.splice(indexd, 1);
};
 data.selected2 = old
   masss = true
} else {
   masss = false
    dispatch('massss', {
            mass: false
          })
}
}
let newcontent = true;
let xd = []
let ed = false;
async function edit (id){
  g = true
  console.log(id)
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
              const res = await  fetch(baseUrl+"/graphql", {
              method: "POST",
              headers: {
                'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  sp (id: "${id}") {data{
     id  attributes{
     name
       descrip
             kindOf
             unit
             spnot
             price
             myp
             linkto
             users_permissions_user {data{id}}
             sdate
             fdate
     }}}
     me {id}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
              xd = res.data.sp.data;
              console.log(res);
              if (xd.attributes.users_permissions_user.data.id = res.data.me.id){//
                              console.log(xd);
                  ed = true;
            g = false;
              masss = true;
             dispatch('massss', {
            mass: true
          })
              }
          } catch (e) {
              error1 = e
              console.log(error1);
          }

}
//style="margin:auto; overflow:auto;"
const cencel = {"he":"ביטול","en": "cencel"}
const less = {"he":"הסרה", "en": "remove"}
const bef = {"he":"ה" , "en": "My "}
const aft = {"he": " שלי", "en": ""}
const edito = {"he":"עריכה", "en":"edit"}
const edbef = {"he": "עריכת ה", "en": "edit My "}
const edaft = {"he": " שלי ", "en": ""}
const rem = {"he": "הסרת " , "en": "remove "}
const adbf = {"he":" בחירת ", "en": "choose more "}
const adaf = {"he":" נוספים", "en": ""}
const om = {"he":"רק רגע בבקשה", "en": "one moment please"}
const onin = {"he":"מושקע בריקמה", "en": "invested on FreeMates"}
//add new msg
$: searchText = ``
  $: addn = {"he": ` \"${searchText}\" לא קיים עדיין ברשימה, ניתן להוסיף בלחיצה על כפתור  \"הוספת חדש\" שלמטה`,"en":`\"${searchText}\" Not on the list yet , add it with the \"Add new\" button bellow`}

export let width = 1
$: anim = datan == "work" || datan == "val" ? -(width/2) : width/2
  </script>
{#if masss === true}

<div class="grid items-center align-center justify-center" >
<button class=" hover:bg-barbi text-gold font-bold rounded-full"
style="width:24px; height:24px; margin: 0 auto;"
title="{cencel[$lang]}"
on:click={bitulm}
><svg  style="width:24px; height:24px;" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>
{#if ed === false}
  <Newsp {needr} meData={meDatamm}  on:close={clohh} on:remove={wdwd}/>
{:else if ed === true}
  <Edsp  meData={xd}  on:close={clodd} />
{/if}
</div>
{:else}

      {#if addSl == false}
      <div class="another button-perl " style="margin: auto"
				in:fly={{x: anim , duration: 1500}} out:fly={{x: anim-(width/5) ,y: -100, duration: 1500, opacity: 0.5}}>

        <h2 style="font-weight: 400;  color: var(--barbi-pink); text-shadow: 1px 1px #feeb02 ; " class="th">{bef[$lang]}{Valname}{aft[$lang]}</h2>
     {#if data.length > 0}
        <div class="  flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 mb-1">
          {#each data as dat, i}
          <p
          class="m-0 " style="text-shadow:none; white-space:none;" >
              <Tile big={width > 640} sm={width > 640} bg="{bgi}" gr={ datan === "mash" && dat.attributes.panui === false ? true : false}  word={dat.attributes[valc]}/></p>{/each}
    </div>
    {/if}

        <!--
        מובייל , רקמות? להוסיף חץ כאייקון? צבע שונה לכל דבר??
          {#if data} <span class="d"> {#each data as dat, i}
           <p style="margin: 0; line-height: 1;  padding: auto;" class="t">{dat[valc]}</p>
           {/each} </span>{/if}-->
<button
class=" hover:bg-barbi text-mturk rounded-full h-6 w-6"
title="{edito[$lang]}"
on:click={open}
><svg  class="e" viewBox="0 0 24 24">
 <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
</svg>
</button>
</div>
{:else if  addSl == true}
{#if g == false}
<div>
<button class=" hover:bg-barbi text-gold  font-bold rounded-full"
title="{cencel[$lang]}"
on:click={bitul}
><svg  style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button>

   <p class="text-center text-md text-white">{edbef[$lang]}{Valname}{edaft[$lang]}</p>
     {#if data}
      {#each data as da, i}
  <div transition:slide|local="{{delay: 150, duration: 1000, easing: quintOut }}" class="text-center text-sm text-lturk md:text-xl">

    {#if datan === "mash" }
    {#if da.attributes.panui != false}
       <button class="text-gold hover:text-barbi"  title={less[$lang]} on:click={min(da.id , da.attributes[valc])}><svg style="width:17px;height:17px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
    </svg></button>
    <button
class=" hover:bg-barbi text-mturk rounded-full "
title="{edito[$lang]}"
on:click={edit(da.id)}
><svg  style="width:17px;height:17px" viewBox="0 0 24 24">
 <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
</svg>
</button>
{:else}
<button
class=" hover:bg-barbi text-mturk rounded-full "
title="{onin[$lang]}">
<Grow width="17" height="17"/></button>
{/if}
{:else}
   <button class="text-gold hover:text-barbi"  title={less[$lang]} on:click={min(da.id , da.attributes[valc])}><svg style="width:17px;height:17px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
    </svg></button>
{/if}{da.attributes[valc]}
  </div>

   {/each}
   {#if datan === "mash" && yy == 2}
   <button
        on:click={increment}
         title="{rem[$lang]}{Valname} "
    class="bt hover:bg-barbi text-gold hover:text-mturk font-bold py-1 px-2 m-4 rounded-full hover:scale-150"
    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
    </svg>
    </button>
   {/if}
   {/if}
<br>

  <div > <h3 class="text-center text-sm text-barbi">{adbf[$lang]}{Valname }{adaf[$lang]}</h3> 
    <div class="flex flex-row-reverse"> <MultiSelect
      bind:selected={data.selected2}
           bind:searchText
                noMatchingOptionsMsg={addn[$lang]}
      {placeholder}
      options={allvn}
      --sms-width={"200px"}
      on:change={addSK(data.selected2)}
      loading={newcontent}
      />
      {#if datan === "mash" && data?.selected2?.length > 0}
      <button on:click={adm(data.selected2)}>✅</button>
      {/if}
    </div>
  </div>
       <!--      allowUserOptions={"append"}-->

      {#if datan == "skil"}
<Addnewsk rn={allvn} on:addnewskill={addnew} addS={addS}/>
{:else if datan == "taf"}
<Addnewr rn={allvn} on:addnewrole={addnew} addR={addR}/>

{:else if datan == "mash"}

<Addnewn rr={13} on:newn={addnewM} addW={addW}/>


{:else if datan == "val"}
<Addnewv rn={allvn} on:addnew={addnew}/>

{:else if datan == "work"}
<Addneww rn={allvn} on:addww={addnew}/>

{/if} </div>
  {#if datan !== "mash" && yy > 0}
      <button
        on:click={increment}
         title="{adbf[$lang]}{Valname}{adaf[$lang]}"
    class="bt hover:bg-barbi text-gold hover:text-mturk font-bold py-1 px-2 m-4 rounded-full hover:scale-150"
    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
    </svg>
    </button>
    {/if}
     {:else if g == true}
          <div class="sp ">
            <h3 class="text-barbi">{om[$lang]}</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div>
          {/if}




{/if} {/if}

 <style>
   :global(div.multiselect){
    background-color: var(--gold);
    color: var(--barbi-pink)
   }
    .bt{
    animation: changeColor 2s infinite ease;
  }
   .bt:hover{
    animation: changeColors 2s infinite ease;
  }
  @keyframes changeColor{
  from { color: var(--gold); }
  to { color: var(--barbi-pink); }
}
 @keyframes changeColors{
  from { color: var(--gold); }
  to { color: aqua; }
}
   @media (max-width: 528px){
     .th{
       font-size: 12px;
     }
     .t{
       font-size: 13px;
     }
     .d{
       max-height: 15vh;
       overflow-y: scroll;
     }
        .another{
    max-height: 20vh;
     min-height: 20vh;
     width: 27vw;
        }
          .e{
 width:17px;
 height:17px;
   }
   
   .e{
 width:24px;
 height:24px;
   }
  }
   .another{
              text-shadow: 1px 1px  aqua;
padding: 1em;
     /* background: -webkit-linear-gradient(top, #8f6B29, #FDE08D, #DF9F28);
	background-image: linear-gradient(top, #8f6B29, #FDE08D, #DF9F28);

     background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438850/to_ha8xmq.svg);
     background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
           filter: drop-shadow(0 25px 25px rgba(1, 61, 61, 0.15));

    */
      display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
        max-height: 25vh;
     min-height: 25vh;
     max-width: 37vw;
     min-width: 27vw;
       color: #9900cd;

    }
    .d{
       max-height: 20vh;
       overflow-y: scroll;
     }
       @media (min-width: 528px){

        .another{
          max-width: 25vw;
        }
       }


 </style>
