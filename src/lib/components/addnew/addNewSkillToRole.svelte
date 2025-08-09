<script>
           import { lang } from '$lib/stores/lang.js'
    import { liUN } from '$lib/stores/liUN.js';
const baseUrl = import.meta.env.VITE_URL

let skillName_value = $state();
    let desS = $state();
    let meData;
    let shgi = $state(false);
async function addNewSkill () {
   shgi = false;
if (rn.includes(skillName_value)){
  shgi = true;
} else {
  let d = new Date;
   let link =baseUrl+"/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation   {
  createSkill(data: {  skillName: "${skillName_value}",
          descrip: "${desS}",
                publishedAt: "${d.toISOString()}"
        }
          ) {
    data {
      id
      attributes {
        skillName
      } 

       }
    }
}`   
        })
})
  .then(r => r.json())
  .then(data => meData = data);
     const id = meData.data.createSkill.data.id;
    finnish (id,meData.data.createSkill.data);
      console.log("some")
          let userName_value = liUN.get()

         let data = {"name": userName_value, "action": "יצר כישור חדש בשם:", "det": `${skillName_value} והתיאור: ${desS} `}
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
        console.log('צריך לתקן:', error)
                };}
    };   


function finnish (id,sec) {
  console.log("ugu")
  onFinnish?.({
    id: id,
    addsk: false,
    scob: sec,
    rob: meData,
    name: skillName_value
    } );
       };
  /**
   * @typedef {Object} Props
   * @property {any} [rn]
   * @property {string} [color]
   * @property {(payload: { id: any, addsk: boolean, scob: any, rob: any, name: any }) => void} [onFinnish] - Callback for finnish event
   */

  /** @type {Props} */
  let { rn = [], color = "--gold", onFinnish } = $props();
const adds = {"he":"הוספת כישור חדש","en": "Add new Skill"}

const valn = {"he":"שם הכישור", "en": "Skill name"}
const des = {"he": "תיאור קצר", "en": "Skill short description"}
const btnTitles = {"he": "הוספה", "en": "Add"}
const errmsg = {"he": "השם כבר קיים","en":"name already exists"}

</script>

  <h1 style="font-size: 1rem; line-height: normal; color: var(--barbi-pink); ">{adds[$lang]}</h1>    

<div style="--the:{`var(${color})`};" dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input    bind:value={skillName_value}
 type='text' class='input' required>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="name" class='label'>{valn[$lang]}</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">{errmsg[$lang]}</small>{/if}

<div dir="{$lang == "en" ? "ltr" : "rtl"}" class='textinput'>
  <input    bind:value={desS}
 type='text' class='input' required>
  <label style:right={$lang == "he" ? "0" : "none"} style:left={$lang == "en" ? "0" : "none"} for="name" class='label'>{des[$lang]}</label>
  <span class='line'></span>
</div>

  <button onclick={addNewSkill}
      title="{btnTitles[$lang]}"
      class=" hover:bg-barbi hover:text-mturk text-gold font-bold py-1 px-2 rounded-full" 
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

  font-size: 15px;
  position: absolute;
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
