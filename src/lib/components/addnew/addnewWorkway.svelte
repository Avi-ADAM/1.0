
<script>
    import axios from 'axios';
    import { createEventDispatcher } from 'svelte';
     const dispatch = createEventDispatcher();
    
   
    export let mid = -1;
     let id;
     let meData = [];
  
    let Name_value;
    let error1 = null;
    
    export let rn = [];
    let shgi = false;
   
    
        function dispatchww (meData) {
          console.log(meData);
      dispatch('addww', {
        id: meData.data.createWorkWay.workWay.id,
        mid: mid,
        skob: meData.data.createWorkWay.workWay,
        name: meData.data.createWorkWay.workWay.workwayName,
        } );
    };
    
   async function addww () {
       shgi = false;
if (rn.includes(Name_value)){
  shgi = true;
} else {
let link ="https://strapi-k4vr.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation { createWorkWay(
    input: {
       data: {workWayName: "${Name_value}" }
    }
  ){
          workWay{
              id workWayName
          }
  }
}`   
        })
})
  .then(r => r.json())
  .then(data => meData = data);

            dispatchww (meData, id);
            addW = false;}
      catch(error) {
        console.log('צריך לתקן:', error);
                };}
    };    
    

    export let addW = false;
    let cencel = " ביטול"
  function dispatchb () {
   addW = false
  dispatch('b', {
    } );
};
export let color = "--gold";
    </script>
    <div style="--the:{`var(${color})`};">
      
    {#if addW == false}
    <button style="--the:{color};"
    class="bg-gold hover:bg-barbi text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
    on:click={() => addW = true}>הוספת חדשה</button>
    {:else}

    
    <button title={cencel}
    on:click={dispatchb}
    class=" hover:bg-barbi text-gold hover:text-mturk font-bold  p-0.5 rounded-full"
     ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
      <path fill="currentColor" d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41" />
    </svg></button> 
      
    <div>
        <h1 style="font-size: 1rem; line-height: normal; color: var(--barbi-pink);">הוספת דרך חדשה</h1>    
    </div>

<div dir="rtl" class='textinput'>
  <input         bind:value={Name_value}
 type='text' class='input' required>
  <label for="name" class='label'>שם</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">השם כבר קיים</small>{/if}

<br/>


       <button on:click={addww}
       title="הוספת סוג משימה חדש"
       class=" hover:bg-barbi hover:text-mturk text-gold font-bold py-1 px-2 rounded-full" 
       ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
         <path fill="currentColor" d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z" />
       </svg></button>

{/if}</div>
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
  border-bottom: solid 1px var(--gold);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
  color:var( --the, var(--gold));
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
  color:var( --the, var(--gold));
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

    
        
      
    
    