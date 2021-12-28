
<script> 
   
    import { onMount } from 'svelte';
   // import AddSkil from './addSkil.svelte';
    import { skillsNew } from '../../stores/skillsNew.js';
    import axios from 'axios';
    import MultiSelect from 'svelte-multiselect';
    import { createEventDispatcher } from 'svelte';
    import Addnewsk from '../addnew/addNewSkill.svelte';
    import Addneww from '../addnew/addnewWorkway.svelte';
    import Addnewv from '../addnew/addnewval.svelte';
    import Addnewr from '../addnew/addNewRole.svelte';
  //  import Addnewn from '../addnew/addNewNeed.svelte';




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
//  export let a = "";
    export let linkp = "skills";
    let link =`https://strapi-k4vr.onrender.com/graphql?_limit=-1`;
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
        const headers = {
          'Content-Type': 'application/json'   
        };
          try {
              const res = await  fetch("https://strapi-k4vr.onrender.com/graphql", {
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
async function increment() {
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
    let link ="https://strapi-k4vr.onrender.com/graphql" ;
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
      data: { ${linkpe}: [${list}] }
    }
  ){
      user {
          ${linkpe}{
              id
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
    linkp: linkp
    } );
        } catch (e) {
            error1 = e
        }
    };
 
   
export let Valname = "כישורים";  


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
  list = data;
const oldob = data;
const old = oldob.map(c => c.id).map(String);
const neww = find_id(id);
let array3 = old.concat(neww);
array3 = [...new Set([...old,...neww])];
  console.log(array3);  

const resp = filterByReference(meData, array3);
const datana = resp;
console.log(datana)
  dispatch('add', {
    data: datana,
    linkp: linkp,
    valc: valc,
    a: datan
    } );
}

function min(id){
  list = data;
const oldob = data;
const x = oldob.map(c => c.id);
const indexy = x.indexOf(id);
console.log(indexy);
oldob.splice(indexy, 1);
console.log(oldob);
dispatch('remove', {
    data: oldob,
    linkp: linkp
    } );

}

function open () {
get ();
  dispatch('open', {
    linkp: linkp,
    } );
};

function bitul () {
  list = data;
 dispatch('close', {
    linkp: linkp,
    list: list,
    } );
};

export let addR = false;
export let addW = false;
function addnew (event) {
list = data;
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
    linkp: linkp
    } );
  
};

  </script>

      {#if addSl == false}
      <div class="another" style="margin: auto"> 
 
        <h6 style="font-weight: bold;  color: var(--barbi-pink); text-shadow: 1px 1px  aqua; ">ה{Valname} שלי</h6>
       {#if data} {#each data as dat, i}
           <p style="margin: 0; line-height: 1; color:aqua; padding: auto;">{dat[valc]}</p>
           {/each} {/if}
<button
class=" hover:bg-barbi text-mturk rounded"
title="עריכה"
on:click={open} 
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
 <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
</svg>
</button> 
</div>
{:else if  addSl == true}

<div class="anotherE" style="margin:auto; overflow:auto; " transition:fly={{x: 250, opacity: 1}}>
<button class=" hover:bg-barbi text-gold  font-bold rounded"
title="ביטול"
on:click={bitul}
><svg style="width:24px;height:24px" viewBox="0 0 24 24">
  <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
</svg></button> 
 
   <h6 class="text-center text-sm text-barbi">עריכת ה{Valname} שלי </h6>
     {#if data} {#each data as da, i}
  <p class="text-center text-sm text-lturk">
       <button  title={less} on:click={min(da.id)}><svg style="width:20px;height:20px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
    </svg>{da[valc]}</button>
      </p>
 
   {/each} {/if}

 <h3 class="text-center text-sm text-barbi">  בחירת {Valname } נוספים </h3>
  <span >   <MultiSelect
      bind:selected={data.selected2}
      {placeholder}
      options={allvn}
      on:change={addSK(data.selected2 )}
      /></span>
       
     
      {#if datan == "skil"} 
<Addnewsk  on:addnewskill={addnew} addS={addS}/>
{:else if datan == "taf"}
<Addnewr on:addnewrole={addnew} addR={addR}/>

{:else if datan == "mash"}<!--
<Addnewn on:addww={addnew} addW={addW}/>

-->
<h1 style="font-size: 1rem; line-height: normal; color: var(--barbi-pink);">בקרוב...</h1>
{:else if datan == "val"}
<Addnewv/>

{:else if datan == "work"}
<Addneww/>

{/if} </div>
  
      <button
        on:click={increment} 
         title="הוספת {Valname} חדשים"
    class=" hover:bg-barbi text-gold hover:text-mturk font-bold py-1 px-2 rounded" 
    ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
    </svg>
    </button> 
        

 

{/if}
 <style>
   
   .another{
              text-shadow: 1px 1px  var(--barbi-pink);
padding: 1em;
      border-radius: 15%;
     background-image: url(https://res.cloudinary.com/love1/image/upload/v1640438850/to_ha8xmq.svg);
     background-position: center; 
    background-repeat: no-repeat; 
    background-size: cover;
      display:flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
  
 </style>