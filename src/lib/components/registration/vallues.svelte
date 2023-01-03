<script>
    import MultiSelect from 'svelte-multiselect';
    import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
    import { valluss } from './valluss.js';
    import { onMount } from 'svelte';
   import { lang } from '$lib/stores/lang.js'
    import jvals from '$lib/data/vallues.json'
    import enjvals from '$lib/data/valluesEn.json'
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher(); 
    let vallues = [];
    let error1 = null;
    let newcontent = true
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
            const res = await fetch("http://localhost:1337/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },  body: JSON.stringify({
                        query: `query {
  vallues {
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


    let selected = [];
    const placeholder = `${$lang == "he" ? "ערכים ומטרות" : "vallues and goals"}`;

 
export let userName_value;
export let show_value = 0;

userName.subscribe(value => {
  userName_value = value;
});

show.subscribe(newValue => {
  show_value = newValue;
});

function increment() {
  newnew()
		show.update(n => n + 1);
    dispatch ('progres',{
		tx: 0,
		txx: 20
	} )
	}

  function back() {
    newnew()
		show.update(n => n - 1);
    dispatch ('progres',{
		tx: 600,
		txx: 20
	} )
	}

 
  let meData = []
async function newnew (){
  for (let i = 0; i<selected.length ;i++){
    if (!vallues.map(c => c.attributes.valueName).includes(selected[i])){
      //create new and update vallues
        console.log(selected,vallues)
  let link ="http://localhost:1337/graphql" ;
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

  

  $: ugug = ``;
      const srca = {"he": "https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg","en": "https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg"}
    const srcb = {"he":"https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg", "en": "https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg"}
  $: addn = {"he":`הוספת "${ugug}"`,"en": `Create "${ugug}"`}
  const what = {"he": "אלו ערכים ומטרות ברצונך לקדם?","en": "which vallues you wish to promote?"}
  </script>


  
<h1 class="midscreenText-2" dir="{$lang == "en" ? "ltr" : "rtl"}">
  {userName_value}
  <br/>
{what[$lang]}
</h1> 
  {#key vallues}
   <div  class="input-2" dir="{$lang == "en" ? "ltr" : "rtl"}">
     <MultiSelect
      addOptionMsg={addn[$lang]}
     allowUserOptions={"append"}
      loading={newcontent}
      bind:searchText={ugug}
     bind:selected
     {placeholder}
     options={vallues.map(c => c.attributes.valueName)}
     />
    </div>
     {/key}
 
     <button class="button-in-2 " on:click="{back}">
    <img alt="go" style="height:15vh;" src="{srcb[$lang]}"/>
    </button>
  <button class="button-2" on:click="{increment}">
    <img alt="go" style="height:15vh;" src="{srca[$lang]}"/>
    </button>

<style>
    .midscreenText-2 {
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
    grid-row: 2/3;
        margin-top:0;

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
   
    .input-2{
    grid-column: 2/4;
    grid-row: 2/3;
    margin-top: -8vh;
    }
    .input-2-2{
    grid-column: 1/5;
    grid-row: 5/6;
    text-align: center;
    }

    </style>