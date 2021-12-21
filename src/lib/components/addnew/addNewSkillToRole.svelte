<script>
    import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
import axios from 'axios';
import { idr } from '../../stores/idr.js';
let skillName_value;
    let desS;
    let link ="https://strapi-k4vr.onrender.com/skills";
    let meData;
function addNewSkill () {
    axios
  .post(link, {
    skillName: skillName_value,
    descrip: desS
              },
  {
  headers: {
            }})
  .then(response => {
    console.log('הצליח', response.data);
    meData = response.data;
    finnish (meData.id);
         idr.set(meData.id);
              })
  .catch(error => {
    console.log('צריך לתקן:', error);
            });
  console.log("hh")
};    


function finnish (id) {
        console.log("hh", id)
  dispatch('finnish', {
    id: id,
    addsk: false,
    rob: meData,
    new: skillName_value
    } );
       };
</script>

  <h1 style="font-size: 2rem; line-height: normal; color: var(--barbi-pink) background-color: var(--gold)">הוספת כישור חדש</h1>    

<div dir="rtl" class='textinput'>
  <input    bind:value={skillName_value}
 type='text' class='input' required>
  <label for="name" class='label'>שם</label>
  <span class='line'></span>
</div>

<div dir="rtl" class='textinput'>
  <input    bind:value={desS}
 type='text' class='input' required>
  <label for="name" class='label'>תיאור קצר</label>
  <span class='line'></span>
</div>

  <button on:click={addNewSkill}
      title="הוספת כישור חדש"
      class="bg-pink-300 hover:bg-barbi text-mturk hover:text-gold font-bold py-1 px-2 rounded" 
      ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
      </svg></button>



<style>
 .textinput {
  position: relative;
  width: 80%;
  display: block;
}

.input {
  font-family: 'Roboto', sans-serif;
  border: none;
  margin: 0;
  padding: 10px 0;
  outline: none;
  border-bottom: solid 1px #212121;
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
  color: #212121;
  -webkit-tap-highlight-color: transparent;
}

.label {
  font-family: 'Roboto', sans-serif;
  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color: #212121;
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
  color: #2196F3;
  top: 0;
}

@media (max-width:600px){
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
 
}
</style>
