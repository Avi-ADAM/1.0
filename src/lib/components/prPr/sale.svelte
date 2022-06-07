<script>
    export let projectUsers = [];
import MultiSelect from 'svelte-multiselect';
import { idPr } from '../../stores/idPr.js'
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
export let quant;
let selected;
let total = 0;
export let each = 0;
let hm = 0;
let where = [];
let placeholder = `אצל מי הכסף`;
let already = false;
export let maid;
let valid = true;
$: if (hm > quant){
  valid = false;
} else {
    valid = true;
}
$: if (hm > 0 && each > 0 ){
  total = hm * each;
}
let bearer1;
let token;
let error1;
let idL;
let miDatan = [];
let linkg = 'https://new-zuhk.onrender.com/graphql';
    function find_user_id(user_name_arr){
     var  id = 0;
      for (let i = 0; i< projectUsers.length; i++){
        if(projectUsers[i].username === user_name_arr){
          id = projectUsers[i].id
        }
      }
      return id;
     };
async function add (){
if (valid === true){
already = true;
let quanter = ``
if (hm > 0){
  const quantnew = quant - hm;
  quanter = `updateMatanot(  input: {
      where: {id: ${maid}}
      data:  {quant: ${quantnew} } }){
        matanot{quant id}
      }
`
}

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
                        query: `mutation 
                        { createSale(
    input: {
      data: {project: "${$idPr}",
             matanot:  "${maid}",
             users_permissions_user: "${find_user_id(selected)}",
             in: ${total},
                  }
    }
  ) {sale{id in}}
  ${quanter}
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);
            if(hm > 0){
            dispatch('done', {
                id: miDatan.data.updateMatanot.matanot.id,
                in:  miDatan.data.createSale.in,
                un: miDatan.data.updateMatanot.matanot.quant
            })
          } else {
              dispatch('doners')
          }
        } catch (e) {
            error1 = e
            console.log(error1);
            dispatch('eror')
        }
      } else {
        alert("יש לבדוק אם מספר היחידות שהוזן גבוה ממספר היחידות הקיימות למתנה זו")
      }
}

</script>
<div dir="rtl" class='textinput'>
  <input max={quant} type="number" id="hoursn" name="hoursn"  bind:value={hm} class='input' required>
  <label for="hoursn" class='label'>כמה יחידות? </label>
  <span class='line'></span>
  <small style="color: red; display: {valid ? "none" : ""};">מספר היחידות לא יכול להיות גבוה יותר מ{quant}</small>
</div>
<div dir="rtl" class='textinput'>
  <input type="number" id="hoursn" name="hoursn"  bind:value={each} class='input' required>
  <label for="hoursn" class='label'>כמה ליחידה? </label>
  <span class='line'></span>
</div>
<div dir="rtl" class='textinput'>
  <input type="number" id="hoursn" name="hoursn"  bind:value={total} class='input' required>
  <label for="hoursn" class='label'>סך הכל </label>
  <span class='line'></span>
</div>
  <div>
      <MultiSelect
      maxSelect={1}
      bind:selected
      {placeholder}
      options={projectUsers.map(c => c.username)}
      />
     </div>
{#if already == false}
<div class="flex items-center justify-center">
<button style="margin: 5px auto;"  class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"
 on:click={add} >דיווח</button>
 </div>
 {/if}<style>
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
.input:invalid ~ .line {
    background-color: #f00000;
}
.input:invalid  {
border-bottom: solid 1px #f00000;
}

.input:focus ~ .label, .input:valid ~ .label {
  font-size: 11px;
  color: var(--barbi-pink);
  top: 0;
} 

</style>