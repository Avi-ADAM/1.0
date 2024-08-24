<script>
  import {username} from '$lib/stores/pendMisMes'
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  import {page} from '$app/stores'
  import Close from "$lib/celim/close.svelte";
  import Button from "$lib/celim/ui/button.svelte";
import TextInput from "$lib/celim/ui/input/textInput.svelte";
  import RichText from "$lib/celim/ui/richText.svelte";
  import { sendToSer } from "$lib/send/sendToSer.svelte";
  import { lang } from "$lib/stores/lang";
  import { onMount } from "svelte";
  import { MultiSelect } from "svelte-multiselect";
  import {nutifyUser} from '$lib/func/nutifyUser.svelte';
  const placeholder = {"he": "צירוף לפגישה","en":	"Choose Users to add to your meeting"}
  const addn = {"he": "עוד פרטים על הפגישה","en": "Add meeting details"}	
  const head = {"he": "יצירת פגישת זהב חדשה","en":	"Create New Gold Meeting"}
  const explanetion = {"he":"פגישת זהב היא פגישה ללא תאריך מוגדר מראש, זמן הפגישה נקבע בזמן הזהב הזמן שנוח ומסתדר לכל המשתתפים והמשתתפות.",
  "en":"Gold meeting is a meeting without a predefined date, the time of meeting is set in the golden timing when it is compteble for all the participant's."}
  const second = {"he": "בכדי שהקסם יקרה יש לעדכן סטטוס ללייב בכל פעם שיש לך זמן לפגישה, ניתן לעדכן כאן למעלה או דרך הבוט שלנו לטלגרם",
  "en":	"For the magic to happen, you have to update the status to live when you are avauilable for the meeting, you can update it in the top or through our telegram bot."} 
   let name;
   $: sucsses = false
   $: loadingBtn = false
   $: error = false
   let outpot
   let explanetionOpen = false
   let users = []
   let selected = []
   let loading = true
   onMount(async() => {
      await sendToSer({},"17getUsers",null,null,false,fetch).then((data)=>{users = data.data.
usersPermissionsUsers.data;
let me = $page.data.uid
      selected.push(users.filter(u => u.id == me)[0].attributes.username)
      selected = selected
      loading = false})
   })
   function create (){
    loadingBtn = true
    let d = new Date()
    let publishedAt = d.toISOString()
    sendToSer({name,outpot,publishedAt},"18createNewMeeting",null,null,false,fetch).then((data)=>{
      let me = $page.data.uid
      if(data.data != null){
        console.log(data, data.data.createPgisha.data.id)
        selected.forEach(us => {
          //get user id from username
          let id = users.filter(u => u.attributes.username == us)[0].id
          if(id != me) {
          sendToSer({id,pgishaId:data.data.createPgisha.data.id},"19CreatePendMeeting",null,null,false,fetch).then((data)=>{
            console.log(data)
            if(data.data != null){
              //notify the requested user
              let title = {'he':`${$username} רוצה לקבוע איתך פגישה`,"en":`${username} want to have a meeting with you`}
              let body = {'he':`${$username} רוצה לקבוע איתך ${selected.length > 2 ? `ועם עוד ${selected.length}`: ""} פגישה בנושא: ${name} `
              ,"en":`${username} want to have a meeting with you ${selected.length > 2 ? `and ${selected.length - 2} others` : ""} on the subject ${name} `}
              nutifyUser(id,title,body,$lang,fetch).then((data)=>{
                console.log(data)
              })
              //check that it is the last run of the for loop
              if(selected.indexOf(us) == selected.length - 1){
                loadingBtn = false
                sucsses = true
                setTimeout(()=>{dispatch("close")}, 5000)
              }

            }
          })
        }else{
              const uid = encodeURIComponent("meeting-"+data.data.createPgisha.data.id+"-"+$page.data.uid);
          sendToSer({id,pgishaId:data.data.createPgisha.data.id,uid,publishedAt},"20CreateUserMeeting",null,null,false,fetch).then((data)=>{
            console.log(data)
            if(data.data != null){
              //check that it is the last run of the for loop
              if(selected.indexOf(us) == selected.length - 1){
                loadingBtn = false
                sucsses = true
                setTimeout(()=>{dispatch("close")}, 5000)
              }

            }
          })
        }
        });

      }else{
        loadingBtn = false
        error = true
      }
    }).catch((e)=>{
      console.log(e)
      loadingBtn = false
      error = true
    })
   }
</script>
<div dir={$lang == "he" || $lang == "ar" ? "rtl" : "ltr"} class="flex flex-col p-4 min-h-[85vh]  h-fit"	>
  <div  class="text-center gap-2 flex flex-row justify-center items-center" >
<h1 class="font-bold text-center underline text-decoration-solid"	  style="font-size: 1rem; line-height: normal; color: var(--barbi-pink); ">{head[$lang]}</h1>
{#if explanetionOpen == false}
  <button class="text-center ww" style="font-size: 0.8rem; line-height: normal; color: white; " on:click={() => explanetionOpen = true}>?</button>
  {/if}
  </div>
  {#if explanetionOpen}
<div class="text-center justify-center bg-wow bg-opacity-25" style="font-size: 0.8rem; line-height: normal; color: var(--barbi-pink); ">
  <button class="text-center" style="font-size: 0.8rem; line-height: normal; color: var(--barbi-pink); " on:click={() => explanetionOpen = false}><Close/></button>
  <p class="text-center" style="font-size: 0.8rem; line-height: normal; color: var(--barbi-pink); ">{explanetion[$lang]}</p>
  <p class="text-center" style="font-size: 0.8rem; line-height: normal; color: var(--barbi-pink); ">{second[$lang]}</p>
 </div>
  {/if}
<TextInput color="barbi" bind:text={name} label={{"he": "שם הפגישה","en":	"Meeting Name"}} />
<h3 class="text-start underline decoration-barbi text-barbi">{addn[$lang]}</h3>
<RichText {outpot} />
<h3 class="text-start underline decoration-barbi text-barbi">{placeholder[$lang]}</h3>
<MultiSelect {loading} bind:selected options={users.map(c => c.attributes.username)} placeholder={placeholder[$lang]}/>
<div class="flex items-center justify-center w-full">
  <div class="w-fit  m-4">
  <Button on:click={create} loading={loadingBtn} {error} success={sucsses}/>
  </div></div>
</div>
<style>
  
  .ww{
    
      width: 20px;
      height: 20px;
      border-radius: 50%;
      	background: rgb(26, 188, 156);
	background: -moz-linear-gradient(-45deg, rgba(26, 188, 156, 1) 0%, rgba(142, 68, 173, 1) 100%);
	background: -webkit-linear-gradient(-45deg, rgba(26, 188, 156, 1) 0%, rgba(142, 68, 173, 1) 100%);
	background: linear-gradient(135deg, rgba(26, 188, 156, 1) 0%, rgba(142, 68, 173, 1) 100%);

      box-shadow: 0 5px 15px 0px rgba(0,0,0,0.6);
	transform: translatey(0px);
	animation: float 6s ease-in-out infinite;
    }
    @keyframes float {
	0% {
		box-shadow: 0 5px 15px 0px rgba(0,0,0,0.6);
		transform: translatey(0px);
	}
	50% {
		box-shadow: 0 25px 15px 0px rgba(0,0,0,0.2);
		transform: translatey(10px);
	}
	100% {
		box-shadow: 0 5px 15px 0px rgba(0,0,0,0.6);
		transform: translatey(0px);
	}
}
</style>