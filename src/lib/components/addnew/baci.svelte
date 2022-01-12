<script>
  
    import { idPr } from '../../stores/idPr.js';
    import axios from 'axios';
    import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
    import AddnewVal from './addNewval.svelte';
    import MultiSelect from 'svelte-multiselect';
    import { onMount } from 'svelte';

    let url1 = "https://strapi-k4vr.onrender.com/upload";
    let linkP;
    let desP;
    let desPl;
    let resP;
    let projectName_value;
    let token; 
   let idL;

let imageId = 5;
let files;
function sendP () {
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
let fd = new FormData();
if (files) {
    fd.append('files', files[0]);
  axios
 .post( url1, fd  ,{
                headers: {
                    Authorization: bearer1,
                },
            })
            .then(({ data }) => {
                 imageId = data[0].id;
 
  axios
  .post('https://strapi-k4vr.onrender.com/projects', {
    user_1s: idL,
    projectName: projectName_value, 
    publicDescription: desP,
    profilePic: imageId,
    linkToWebsite: linkP,
    descripFor: desPl,
    vallues: find_value_id(selected)
              },
  {
  headers: {
    'Authorization': bearer1
            }})
  .then(response => {
    console.log('הצליח', response.data);
    resP = response.data; 
    idPr.set(resP.id);
    goto("/projectPrivat", );
              })
  .catch(error => {
    console.log('צריך לתקן:', error.response);
            });
  console.log("hh")
})} else {
  axios
  .post('https://strapi-k4vr.onrender.com/projects', {
    user_1s: idL,
        profilePic: imageId,
    projectName: projectName_value, 
    publicDescription: desP,
    linkToWebsite: linkP,
    descripFor: desPl,
    vallues: find_value_id(selected)
              },
  {
  headers: {
    'Authorization': bearer1
            }})
  .then(response => {
    console.log('הצליח', response.data);
    resP = response.data; 
    idPr.set(resP.id);
    goto("/projectPrivat", );
              })
  .catch(error => {
    console.log('צריך לתקן:', error.response);
            });
  console.log("hh")



}

}
;


let vallues = [];
    let error1 = null;
    let addval = false;
    
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
            const res = await fetch("https://strapi-k4vr.onrender.com/vallues?_limit=-1", {
              method: "GET",
              headers: {
                 'Content-Type': 'application/json'
              },
            }).then(checkStatus)
          .then(parseJSON);
            vallues = res
        } catch (e) {
            error1 = e
        }
    });


    function find_value_id(value_name_arr){
     var  arr = [];
      for (let j = 0; j< value_name_arr.length; j++ ){
      for (let i = 0; i< vallues.length; i++){
        if(vallues[i].valueName === value_name_arr[j]){
          arr.push(vallues[i].id);
        }
      }
      }
      return arr;
     };


    let selected;
    const placeholder = `ערכים ומטרות`;
 
export let userName_value;

  </script>  
<img class="bg" src="https://res.cloudinary.com/love1/image/upload/v1641997213/4nd_us6lck.svg" alt="bg">
<div dir="rtl" class="jho">
  <h1>יצירת פרויקט חדש</h1>
<br>

        <div dir="rtl" class='textinput'>
  <input name="des" bind:value={projectName_value}  
 type='text' class='input'required >
  <label for="des" class='label'>שם הפרויקט</label>
  <span class='line'></span>
</div>
    <div dir="rtl" class='textinput'>
  <input name="es"  bind:value={desP}    
 type='text' class='input' required >
  <label for="es" class='label'>תיאור קצר הגלוי לכול</label>
  <span class='line'></span>
</div>
   <div dir="rtl" class='textinput'>
  <input name="s"  bind:value={desPl}     
 type='text' class='input' required>
  <label for="s" class='label'>תיאור מפורט עם נראות סלקטיבית</label>
  <span class='line'></span>
</div>
 <div dir="rtl" class='textinput'>
  <input name="de"    bind:value={linkP}     
 type='text' class='input' required>
  <label for="de" class='label'>
לינק לאתר</label>
  <span class='line'></span>
</div>
<br>
<label style="color:  var(--barbi-pink); margin: 0 auto;" for="avatar">הוסף לוגו</label>
<input type="file"
style="color: var(--barbi-pink); margin: 0 auto;"
       id="avatar" name="avatar"
       accept="image/png, image/jpeg"
       bind:files={files}
       >
         
<h1 class="midscreenText-2">
  {userName_value} 
 אלו ערכים ומטרות הפרויקט יקדם
?
</h1> 

 <div  class="input-2">
   <MultiSelect
   bind:selected
   {placeholder}
   options={vallues.map(c => c.valueName)}
   /></div>
   <div  class="input-2-2">
    <button
    on:click={() => addval = true} 
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >הוספת ערך חדש</button>
  {#if addval == true} <AddnewVal/>{/if}</div>
  <br>
  <br>
<button 
    class="cen bg-pink-500 hover:bg-pink-700 text-white font-bold p-4 rounded"
     on:click="{sendP}"
     name="addm">ליצור ולפרסם פרויקט </button>



</div>
<style>
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
  font-family: 'Roboto', sans-serif;
  border: none;
  margin: 0;
  padding: 10px 0;
  outline: none;
  border-bottom: solid 1px var(--gold);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
 color:  var(--barbi-pink);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}

.label {
  font-family: 'Roboto', sans-serif;
  font-size: 15px;
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
  font-size: 11px;
  color: var(--gold);
  top: 0;
}

@media (max-width:600px){
 
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
 .jho{
 width: 100%;
 margin: 0 auto;
  }
 
}
    h1{
      font-size: 29px;  
      color:  var(--barbi-pink);  
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