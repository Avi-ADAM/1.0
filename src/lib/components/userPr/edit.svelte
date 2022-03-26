
<script> 
   
    import { onMount } from 'svelte';
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


import { fly } from 'svelte/transition';


 const dispatch = createEventDispatcher();
//export let addNs;
    export let valc = "skillName";
    export let data = [];
    export let meData = [];
    export let datan ="";
    let token; 
    let allvn = []
     export let addS = false;
    let list = [];
    let listt = [];
    export let kish;
//  export let a = "";
    export let linkp = "skills";
    let link =`https://oneloveone.onrender.com/graphql?_limit=-1`;
    let error1 = null;
    export let addSl = false;
let idLi;
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
              const res = await  fetch("https://oneloveone.onrender.com/graphql", {
              method: "POST",
              headers: {
                'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  ${linkp} { id ${valc}}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
              meData = res.data[linkp];
              allvn = meData.map(c => c[valc]);
              console.log(res);
          } catch (e) {
              error1 = e
              console.log(error1);
          }
      };
 
  let name;
  let newskillslist;
  export let placeholder =" בחירת כישורים" ;
  skillsNew.subscribe(newwork => {
    newskillslist  = newwork;
    });
let uid;

function deleteitem (skillId){
  console.log(skillId);
    const index = skillslist.indexOf(skillId);
if (index > -1) {
  skillslist.splice(index, 1);
  };
console.log("skillslist",skillslist);
};    
let miData = [];
let g = false;
let needr = [];

async function increment() {
      g = true;
     
     if (datan !== "mash"){
       console.log(datan,"dd")
       let list = data.map(c => c.id);
     const linkpe = linkp;
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
    let link ="https://oneloveone.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation { updateUser(
    input: {
      where: { id: "${uid}" }
      data: { ${kish}: [${list}] }
    }
  ){
      user {
          ${kish}{
              id ${valc}
          }
      }
  }
}`   
        })
})
  .then(r => r.json())
  .then(data => miData = data);
         console.log(miData)
         addSl = false;
 dispatch('close', {
    linkp: linkp,
    list: miData.data.updateUser.user[kish]

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
        if(meData[i][valc] === arra[j]){
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
          arr.push(meData[i][valc]);
        }
      }
      }
      return arr;
     };
let less = "הסרה";

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
 allvn = meData.map(c => c[valc]);
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
          meDatamm = []
}
async function updi (){
var resultString = needr.join('&id_in=');
let linkpp ="https://oneloveone.onrender.com/mashaabims?id_in=" + resultString ;
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
            const res = await fetch(linkpp, {
              method: 'GET',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
            }).then(checkStatus)
          .then(parseJSON);
            meDatamm = res;
            g = false;
              masss = true;
             dispatch('massss', {
            mass: true
          })
        } catch (e) {
            error1 = e
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
              const res = await  fetch("https://oneloveone.onrender.com/graphql", {
              method: "POST",
              headers: {
                'Authorization': bearer1,
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  sp (id: "${id}") {
     id 
     name
       descrip
             kindOf
             unit
             spnot  
             price
             myp   
             linkto
             users_permissions_user {id}
             sdate
             fdate
     }
     me {id}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
              xd = res.data.sp;
              console.log(res);
              if (xd.users_permissions_user.id = res.data.me.id){
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
  </script>
{#if masss === true}

<div class="grid items-center align-center justify-center" >
<button class=" hover:bg-barbi text-gold font-bold rounded-full" 
style="width:24px; height:24px; margin: 0 auto;"
title="ביטול"
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
      <div class="another" style="margin: auto"> 
 
        <h6 style="font-weight: bold;  color: var(--barbi-pink); text-shadow: 1px 1px  aqua; " class="th">ה{Valname} שלי</h6>
       {#if data} <span class="d"> {#each data as dat, i}
           <p style="margin: 0; line-height: 1; color:aqua; padding: auto;" class="t">{dat[valc]}</p>
           {/each} </span>{/if}
<button
class=" hover:bg-barbi text-mturk rounded-full "
title="עריכה"
on:click={open} 
><svg  class="e" viewBox="0 0 24 24">
 <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
</svg>
</button> 
</div>
{:else if  addSl == true}
{#if g == false}
<div class="anotherE"  transition:fly={{x: 350, y: 200 ,opacity: 0.5}}>
<button class=" hover:bg-barbi text-gold  font-bold rounded-full"
title="ביטול"
on:click={bitul}
><svg  style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button> 
 
   <h6 class="text-center text-sm text-barbi">עריכת ה{Valname} שלי </h6>
     {#if data} {#each data as da, i}
  <div class="text-center text-sm text-lturk">
       <button class="text-gold hover:text-barbi"  title={less} on:click={min(da.id , da[valc])}><svg style="width:17px;height:17px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
    </svg></button>
    {#if datan === "mash"}<button
class=" hover:bg-barbi text-mturk rounded-full "
title="עריכה"
on:click={edit(da.id)} 
><svg  style="width:17px;height:17px" viewBox="0 0 24 24">
 <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
</svg>
</button> {/if}{da[valc]}
  </div>
 
   {/each} 
   {#if datan === "mash" && yy == 2}
   <button
        on:click={increment} 
         title="הסרת {Valname} "
    class="bt hover:bg-barbi text-gold hover:text-mturk font-bold py-1 px-2 m-4 rounded-full hover:scale-150" 
    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
    </svg>
    </button>
   {/if}
   {/if}
<br>
 
  <span > <h3 class="text-center text-sm text-barbi">  בחירת {Valname } נוספים </h3>  <MultiSelect
      bind:selected={data.selected2}
      {placeholder}
      options={allvn}
      on:change={addSK(data.selected2)}
      on:blur={adm(data.selected2)}
      /></span>
       
     
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
         title="הוספת {Valname} חדשים"
    class="bt hover:bg-barbi text-gold hover:text-mturk font-bold py-1 px-2 m-4 rounded-full hover:scale-150" 
    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
    </svg>
    </button> 
    {/if}
     {:else if g == true}
          <div class="sp ">
            <h3 class="text-barbi">רק רגע בבקשה</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div>
          {/if}
        

 

{/if} {/if}

 <style>
   
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
       font-size: 10px;
     }
     .d{
       max-height: 15vh;
       overflow-y: scroll;
     }
        .another{
    max-height: 20vh;
     min-height: 20vh;
     max-width: 25vW;
        }
          .e{
 width:17px;
 height:17px;
   }
      .d::-webkit-scrollbar {
    width: 10px;
}

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
     @media (min-width: 529px){
          .d::-webkit-scrollbar {
    width: 12px;
}
   .e{
 width:24px;
 height:24px; 
   }
  }
   .another{
              text-shadow: 1px 1px  var(--barbi-pink);
padding: 1em;
      border-radius: 15%;
      background: -webkit-linear-gradient(top, #8f6B29, #FDE08D, #DF9F28);
	background-image: linear-gradient(top, #8f6B29, #FDE08D, #DF9F28);
      /*
     background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438850/to_ha8xmq.svg);
     background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;*/
      display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
        max-height: 29vh;
     min-height: 20vh;
     max-width: 25vW;
     min-width: 10vw;
    }
    .d{
       max-height: 20vh;
       overflow-y: scroll;
     }
    
  
 </style>