<!-- @migration-task Error while migrating Svelte code: Unexpected token
https://svelte.dev/e/js_parse_error -->
<!-- @migration-task Error while migrating Svelte code: Unexpected token
https://svelte.dev/e/js_parse_error -->
<!-- @migration-task Error while migrating Svelte code: Unexpected token
https://svelte.dev/e/js_parse_error -->
<!-- @migration-task Error while migrating Svelte code: Unexpected token
https://svelte.dev/e/js_parse_error -->
<script>
    import MultiSelect from 'svelte-multiselect';
    import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
    import { valluss } from './valluss.js';
    import { onMount } from 'svelte';
   import { lang } from '$lib/stores/lang.js'
    import jvals from '$lib/data/vallues.json'
    import enjvals from '$lib/data/valluesEn.json'
/**
 * Callback prop: יורה כאשר יש שינוי התקדמות.
 * מיגרציה ל‑Svelte 5: כל ה‑props מרוכזים בהגדרה אחת.
 * @typedef {Object} Props
 * @property {string} [userName_value]
 * @property {number} [show_value]
 * @property {(payload: {tx: number, txx: number}) => void} [onProgres]
 */
/**
 * @type {Props}
 */
let {
  userName_value = $bindable(),
  show_value = $bindable(0),
  onProgres
} = $props<{
  userName_value?: string,
  show_value?: number,
  onProgres?: (payload: {tx: number, txx: number}) => void
}>();'$app/stores';
  import Skip from '$lib/celim/icons/skip.svelte';
  import Tile from '$lib/celim/tile.svelte';
    let vallues = $state([]);
    let error1 = null;
    let newcontent = $state(true)
 onMount(async () =>{
     if ($lang == "he" ){
       vallues = jvals
           } else if (lang == "en"){
             vallues = enjvals
           }
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
            const res = await fetch(baseUrl+"/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },  body: JSON.stringify({
                        query: `query {
  vallues (sort: "valueName:asc"){
    data{
      id
      attributes {valueName ${$lang == 'he' ? 'localizations{ data { attributes{ valueName } } }' : ""}}
}
}
}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            vallues = res.data.vallues.data
            if ($lang == "he" ){
              for (var i = 0; i < vallues.length; i++){
                if (vallues[i].attributes.localizations.data.length > 0){
                vallues[i].attributes.valueName = vallues[i].attributes.localizations.data[0].attributes.valueName
                }
              }
            }
            vallues = vallues
            newcontent = false
        } catch (e) {
            error1 = e
        }
    });


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
    const placeholder = `${$lang == "he" ? " בחירת ערכים ומטרות" : "vallues and goals"}`;

 
  /**
   * @typedef {Object} Props
   * @property {any} userName_value
   * @property {number} [show_value]
   */

  /** @type {Props} */
  

userName.subscribe(value => {
  userName_value = value;
});

show.subscribe(newValue => {
  show_value = newValue;
});

function increment() {
  newnew()
		show.update(n => n + 1);
    onProgres?.({ tx: 0, txx: 20 })
	}
function toend() {
  newnew()
		show.set(5);
    onProgres?.({ tx: 0, txx: 4 })
	}

  function back() {
    newnew()
		show.update(n => n - 1);
    onProgres?.({ tx: 600, txx: 20 })
	}

 const baseUrl = import.meta.env.VITE_URL

  let meData = []
async function newnew (){
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
    let userName_value = $userName
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
                  valluss.set(find_value_id(selected));
                      console.log($valluss)

            }

  

  let ugug = $state(``);
  
      const srca = {"he": "https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg","en": "https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg"}
    const srcb = {"he":"https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg", "en": "https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg"}
  let addn = $derived({"he":`הוספת "${ugug}"`,"en": `Create "${ugug}"`})
  const what = {"he": "אלו ערכים ומטרות ברצונך לקדם?","en": "which vallues you wish to promote?"}
  const skipt = {"he":"דילוג לסוף ההרשמה, ניתן יהיה להוסיף את הפרטים בכל עת מעמוד הפרופיל","en":"skip to end of registration, you can always add those details from your profile page"}
   const info = {"he":"כאשר העבודה שלך מגשימה את הערכים ומקדמת את המטרות שלך היא הופכת ליצירה מהנה, אנו נסייע לך לקדם את הערכים והמטרות שלך","en":"When your work aligns with your values and advances your goals, it becomes enjoyable creation. We will assist you in promoting your values and goals."}
  let focused = false
  </script>


  
<h1  class="midscreenText-2" dir="{$lang == "en" ? "ltr" : "rtl"}">
  {userName_value}
  <br/>
{what[$lang]}
</h1> 
{#if !focused && !$page.data.isDesktop || $page.data.isDesktop}
<div class="info">
<Tile word={info[$lang]} big={$page.data.isDesktop} bg="gold" animate={true} sm={$page.data.isDesktop}/>
</div> 
{/if}
   <div  class="input-2" dir="{$lang == "en" ? "ltr" : "rtl"}">
     <MultiSelect
     liSelectedStyle="z-index: 1000;"
      --sms-width={"50vw"}
      createOptionMsg={addn[$lang]}
     allowUserOptions={"append"}
      loading={newcontent}
      bind:searchText={ugug}
     bind:selected
     {placeholder}
     options={vallues.map(c => c.attributes.valueName)}
     />
    </div>
 
     <button class="button-in-2 " onclick={back}>
    <img alt="go" style="height:15vh;" src="{srcb[$lang]}"/>
    </button>
    <button class="button-end bg-sturk p-1 rounded-full" onclick={toend} title="{skipt[$lang]}">
    <Skip/>
    </button>
  <button class="button-2" onclick={increment}>
    <img alt="go" style="height:15vh;" src="{srca[$lang]}"/>
    </button>

<style>
    .midscreenText-2 {
      transition: all 1s ease-in;
      grid-column: 1 /5;
  grid-row: 1/ 2;
  align-self: center;
  justify-self: center;
  font-size: 1.8rem;
  line-height: normal;
text-shadow: 1px 1px purple;
  color: var(--barbi-pink);
  margin-top: 68px;
  background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png);
 background-size: 29.5rem 9.75rem;
  height: 9.75rem;
  width: 29.5rem;
  text-align: center;
    padding: 1rem 1rem 0rem 1rem; 
   -webkit-text-size-adjust: 100%; 
}
 @media (max-width:500px){
	 .midscreenText-2 {
		   background-size: 15.25rem 5rem;
  height: 5rem;
  width: 15.25rem;
  font-size: 0.7rem;
  margin-top: 26vh;
	 }
 .input-2{
    grid-column: 2/4;
    grid-row: 4/5;
        margin-top:0;
   align-self: center;
  justify-self: center;
    }
    .info{
    grid-column: 2/4;
    grid-row: 2/3;
        margin-top:0;
       align-self: center;
  justify-self: center;
    }
}
    .button-in-2{
    grid-column: 1/2;
    grid-row: 7 / 8;
    align-self: center;
    justify-self: center;
  }
    .button-2{
      grid-column: 4/5;
    grid-row: 7 / 8;
       align-self: center;
    justify-self: center;
  }
   .button-end{
      grid-column: 2/4;
    grid-row: 7 / 8;
       align-self: center;
    justify-self: center;
  }
      .input-2{
    grid-column: 2/4;
    grid-row: 3/4;
     align-self: center;
  justify-self: center;
    
    }
    .info{
    grid-column: 2/4;
    grid-row: 2/3;
     align-self: center;
  justify-self: center;
    }
    .input-2-2{
    grid-column: 1/5;
    grid-row: 5/6;
    text-align: center;
    }

    </style>