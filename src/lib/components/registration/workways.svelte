  <script>
    import MultiSelect from 'svelte-multiselect';
  import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
    import { workways1 } from './workways1.js';
    import { onMount } from 'svelte';
 import { createEventDispatcher } from 'svelte';
   import jwork from '$lib/data/workways.json'
    import enjwork from '$lib/data/workwaysEn.json'
 const dispatch = createEventDispatcher();
              import { lang } from '$lib/stores/lang.js'
    let newcontent = true
    let workways2 = [];
    let error1 = null
    
    onMount(async () => {
      if ($lang == "he" ){
       workways2 = jwork
           } else if (lang == "en"){
             workways2 = enjwork
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
            const res = await fetch("https://tov.onrender.com/graphql", {
              method: "POST",
              headers: {
                 'Content-Type': 'application/json'
              },body: JSON.stringify({
                        query: `query {
  workWays(sort: "workWayName") {data{ id attributes{workWayName  ${$lang == 'he' ? 'localizations {data{attributes{workWayName}} }' : ""}}
}}}
              `})
            }).then(checkStatus)
          .then(parseJSON);
            workways2 = res.data.workWays.data
                       if ($lang == "he" ){
              for (var i = 0; i < workways2.length; i++){
                if (workways2[i].attributes.localizations.data.length > 0){
                workways2[i].attributes.workWayName = workways2[i].attributes.localizations.data[0].attributes.workWayName
                }
              }
            }
            workways2 = workways2
            newcontent = false
            console.log(workways2)
        } catch (e) {
            error1 = e
        }
    });


    function find_workway_id(workway_arr){
     var  arr = [];
      for (let j = 0; j< workway_arr.length; j++ ){
      for (let i = 0; i< workways2.length; i++){
        if(workways2[i].attributes.workWayName === workway_arr[j]){
          arr.push(workways2[i].id);
        }
      }
      }
      return arr;
     };



    let selected = [];
 
     const placeholder = `${$lang == "he" ? "דרכי יצירה מתאימות" : "ways of creation"}`;

  
 
let userName_value;
let show_value = 0;

userName.subscribe(value => {
  userName_value = value;
});

show.subscribe(newValue => {
  show_value = newValue;
});

function increment() {
		show.update(n => n + 1);
    dispatch ('progres',{
		tx: 0,
		txx: 8
	} );
   newnew()
	}
function back() {
		show.update(n => n - 1);
     dispatch ('progres',{
		tx: 0,
		txx: 16
	} );
  newnew()   
	}


//add new option and update store
let meData = []
async function newnew (){
  console.log(selected,workways2)
  for (let i = 0; i<selected.length ;i++){
    if (!workways2.map(c => c.attributes.workWayName).includes(selected[i])){
      //create new and update workways2
        let d = new Date
       let link ="https://tov.onrender.com/graphql" ;
        try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation  createWorkWay {
  createWorkWay(data: {  workWayName: "${selected[i]}",
        publishedAt: "${d.toISOString()}"
           }) {
    data {
      id
      attributes {
        workWayName ${$lang == 'he' ? 'localizations { data {attributes{workWayName} }}' : ""}
      } 

       }
    }
}`   
        })
})
  .then(r => r.json())
  .then(data => meData = data);
   const newOb = meData.data.createWorkWay.data;
    const newValues = workways2 ;
    newValues.push(newOb);
       
    workways2 = newValues;
       const newN = meData.data.createWorkWay.data.attributes.workWayName;

    let userName_value = $userName
         let datau = {"name": userName_value, "action": "create דרך יצירה חדשה בשם:", "det":newN}
   fetch("/api/ste", {
  method: 'POST', // or 'PUT'
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(datau),
})
  .then((response) => response)
  .then((data) => {
    console.log('Success:', data,datau);

  })
  .catch((error) => {
    console.error('Error:', error);
  
  })
                  }
      catch(error) {
        console.log('צריך לתקן:', error.response);
        error = error1 
        console.log(error1)
                };
              }
    }
 
  workways1.set(find_workway_id(selected));

}
$: searchText = ``
    const srca = {"he": "https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg","en": "https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg"}
    const srcb = {"he":"https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg", "en": "https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg"}
  $: addn = {"he":`הוספת "${searchText}"`,"en": `Create "${searchText}"`}
    const ws = {"he": "מה הם העדפות היצירה שלך?","en": "How do you preffer to Create?"}
  
  </script>

<h1 class="midscreenText-2">
    {userName_value}
<br/>
 {ws[$lang]}
   </h1> 
   <div dir="{$lang == "en" ? "ltr" : "rtl"}" class="input-2">
     <MultiSelect
     createOptionMsg={addn[$lang]}
     allowUserOptions={"append"}
     loading={newcontent}
     bind:searchText
     bind:selected
     {placeholder}
     options={workways2.map(c => c.attributes.workWayName)}
     /></div>
   
  <button class="button-in-1-2" on:click="{back}">
    <img alt="go" style="height:15vh;" src="{srca[$lang]}"/>
    </button>
  <button class="button-2" on:click="{increment}">
    <img alt="go" style="height:15vh;" src="{srcb[$lang]}"/>
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
  margin-top: 59px;
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
  font-size: 0.9rem;
  margin-top: 26vh;
	 }
 .input-2{
    grid-column: 2/4;
    grid-row: 2/3;
        margin-top:0;

    }
}
    
   
   .button-in-1-2{
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