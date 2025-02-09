<script>
  import { toast } from 'svelte-sonner';
import SucssesConf from '$lib/celim/sucssesConf.svelte'
import Tile from '$lib/celim/tile.svelte'
import Share from '$lib/components/share/shareButtons/index.svelte'
import { page } from '$app/stores'
import {
    lang
} from '$lib/stores/lang.js'
import {
    RingLoader
} from 'svelte-loading-spinners';
import {
    goto
} from '$app/navigation'
  import {SendTo} from '$lib/send/sendTo.svelte';
//TODO: get asked from server then show you alr .., find a way to get title
let error1 = null;
let success = false
function project(x) {
    goto('/project/'+x)
}
export let askedarr = []
export let alr = false
async function ask() {
  //TODO: if only me in the freemates and its me create mesimabetahalich
    alr = true
    const inD  = data.alld
 /* const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];           
 const uId = cookieValueId;
 const que1 = `query { usersPermissionsUser (id: ${uId}){
    data {
      id attributes{
        askeds{data{id}}
      }
    }}}`
    const d1 = await SendTo(que1) 
    .then()
    const r = d1.data.usersPermissionsUser.data.attributes.askeds.data;
    if (r.length > 0) {
        const p = r.map(c => c.id);
        askedarr = p;
    }
        let d = new Date
    let myvote = ``
    let pid = inD.project.data.attributes.user_1s.data.map(t=>t.id)
         if(pid.includes(uId)){
      myvote = `vots: [{
                        what: true
                        users_permissions_user: "${uId}"
                        ide:${uId}
                        zman:"${d.toISOString()}"
                          }
                        ]`
     }
  const as = askedarr;
    as.push(`${data.mId}`);  
 let que = `mutation { updateUsersPermissionsUser(
    id: "${uId}"
      data: { askeds: [${as}] }

  ){
      data {
        attributes{
          askeds{
            data{
              id
            }
          }
        }
      }
  }
  createAsk(
      data:{ open_mission: ${data.mId},
            project: ${inD.project.data.id},
            users_permissions_user: ${uId},
            publishedAt: "${d.toISOString()}",
            ${myvote}
    }
  ){
    data {id}
  }
}`
 const d2 = await SendTo(que) 
    .then()
    const r2 = d2.data
    console.log(r2)
    if (r2 != null){
      let restime = inD.project.data.attributes.restime
       let x = calcX(restime)
     let fd = new Date(Date.now() + x)
         let hiluzId = r2.createAsk.data.id
                        let quee = `mutation 
                        {createTimegrama(
         data:{
           date: "${fd.toISOString()}",
           whatami: "ask",
      ask: ${hiluzId},
          }
        ){
          data {id}
        }
      }`
    const d3 = await SendTo(quee)
    .then()
    const r3 = d3.data
    console.log(r3)
    if (r3 != null){
      success = true
     setTimeout(function(){  
    success = false
  },15000)
  toast.success(`${fnnn[$lang]}`);
}
    }*/
}

export let data

$: hovered = false
function hover(a){
}
console.log(data)
const fnnn = {"he": "הבקשה נשלחה בהצלחה","en":"request has sent sucsesfully"}

const headi = {
    "he": "הצעת שירות",
    "en": "suggested service"
}
const om = {
    "he": "משימה פתוחה",
    "en": "open mission"
}
const requireSkills = {
    "he": "כישורים נדרשים:",
    "en": "required skills:"
}
const seePr = {
    "he": "לצפיה בריקמה",
    "en": "see the freeMates page"
}
const requiredRoles = {
    "he": "תפקידים נדרשים:",
    "en": "required roles:"
}
const requiredWW = {
    "he":"דרכי עבודה מבוקשות:",
    "en":"ways of work for the mission:"
    }
    function reg (){
  if ($lang == "he"){
    goto("/",)
  } else if ($lang == "en"){
    goto("/en",)
  } else if ($lang == "ar"){
    goto("/ar",)
  } else {
    goto("/",)
  }
}
function login () { 
    goto (`/login?from=availableMission/${data.mId}`,)
}
    let wid
    const mand = {"he": "המשימה אוישה בהצלחה", "en": "the mission has already assigned"}
    const alri = {"he": "כבר הגשת בקשה לבצע את המשימה הזו", "en": "you have already requested to do this mission"}
const iwantto = {"he":"אני אשמח לקבל!","en":"I want to get it!"}
const info ={"he": "בכדי לבקש להצטרף לצוות ולבצע את המשימה וגם בכדי לקבל הצעות למשימות, לפתוח רקמות (פרויקטים) חדשות ולהתנהל בהן בהסכמה יש להתחבר או להירשם","en":"You are not connected" }
const registratio = { "he": "להרשמה", "en": "To Registration"} 
const logi = { "he": "להתחברות", "en":"To Login"} 
    const perho = {"he":"לשעה","en":"per hour"}
        const hourss = {"he":"שעות","en":"hours"}
        const monhly = {"he":"בחודש", "en": "per month"}
const foreg = {"he":"כדי לראות את כל המידע נדרשת התחברות או הרשמה","en":"some information is available only for registersd users"}
 import { Head } from 'svead'
  import { calcX } from '$lib/func/calcX.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import MissionCard from '$lib/components/cards/missionCard.svelte';

  let title = 'service on 1💗1'
  let image = `https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png`
  let description = $page.data.alld?.descrip || om[$lang]
  let url = $page.url.toString()
 $: console.log(data.alld)
  //TODO: header nav menu $page.a.title[$lang] ??
</script>
<Head title="{ headi[$lang]}" {description} {image} {url} />
<SucssesConf {success} />
{#await data.alld}
<div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex align-middle content-center justify-center ">
<RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
</div>
{:then a}
{#if data != null}
{#if data.archived != true}
<div bind:clientWidth={wid} dir="rtl"  style="overflow-y:auto" class=" d mb-4 sm:pt-4 w-full   lg:w-1/2 mx-auto">
    <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
    </div>-->
    <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
   
      <div class="relative flex items-center space-x-1">
            <div class="relative">
                <img src={a.projectcreates?.data[0].attributes.profilePic.data?.attributes.url}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
            </div>
            <div class="flex flex-col leading-tight">
                <div class="sm:text-sm text-md mt-1 flex items-center">
                    <span class="text-barbi text-center mr-3 sm:text-2xl lg:text-4xl text-xl">{headi[$lang]}</span>
                </div>
                <span class="pn ml-1 text-lg sm:text-xl lg:text-2xl text-grey-200 ">{a.projectcreates?.data[0].attributes.projectName}</span>
            </div>
        </div>
        <div>
    <button on:click={()=>project(a.projectcreates.data[0].id)} class="px-4 py-2 hover:text-barbi text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink rounded text-lg lg:text-2xl font-bold mt-2 mx-4 border-2 border-gold leading-4" >{seePr[$lang]}</button>
        </div>
    </div>
    {#if a.pic.data}
    <img src={a.pic.data.attributes.url} alt="cover image" class="w-full h-48 object-cover rounded-t lg:rounded-t-none lg:rounded-l"/>
    {/if}
    <div  class=" lg:bg-gray-700 bg-transparent rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal ">
         <div  class="mb-8">
              <div class="  mb-2">
        <div class="flex flex-row justify-between">
            <div class="px-2">
            <h2 class="text-barbi font-bold text-xl lg:text-4xl underline ">{a.name}</h2>
          {#if a.desc !== null && a.desc !== "null"  && a.desc !== "undefined"  && a.desc !== undefined}
           <RichText outpot={a.desc} editable={false}/>
           {/if}
   
    {#if a.sqadualed || a.dates}
                                <p
                  style="line-height: 1;"
                  class="text-sm text-gray-100 flex items-center lg:text-2xl m-5"
                >
                  <img
                    class="w-12 lg:w-24"
                    src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
                    alt="howmuch"
                  />
                {#if a.sqadualed}
                <span> {new Date(a.sqadualed).toLocaleDateString($lang)}</span>
                {/if}
                 {#if a.dates}
                <span> - {new Date(a.dates).toLocaleDateString()}</span>
                {/if}
                  </p>
                {/if}
                {#if a.projectcreates?.data[0].attributes.open_missions.data.length > 1}
                <h3 class="text-barbi font-bold text-xl lg:text-2xl underline ">{om[$lang]}</h3>
                {#each a.projectcreates?.data[0].attributes.open_missions.data as open }
                  <MissionCard data={open.attributes} />
                {/each}
                {/if}
     <p style="line-height: 1;" class="text-sm text-gray-100 flex items-center lg:text-2xl m-5">
        <img  class="w-12 lg:w-24"  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
        <span>
        {a.price ? a.price.toLocaleString('en-US', {maximumFractionDigits:2}) : ``}
        {#if a.kindOf == "perhour"}
        {perho[$lang]}
        {a.noofhours} {hourss[$lang]}
        {/if}
        {#if a.kindOf == "monthly"}
        {monhly[$lang]}
        {/if}
         </span>
    </p>
        </div>
            <div class="">
                <Share
                slug="{"services/"+$page.data.mId}"
	 title="{a.title ? a.title[$lang] : null}"
     desc="servise"
     hashtags={['1💗1','consensus']}
	 quote="{a.title ? a.title[$lang] : null}"
	 related={[]}
	 via={''}
	 />
            </div>
        </div>
        <div>
          <!----
        {#if a.skills?.data.length > 0}
        <h3 class="text-barbi font-bold text-xl lg:text-2xl underline ">{requireSkills[$lang]}</h3>
        <ul class="list-disc">
            {#each a.skills.data as skill}
            <li class="text-md text-gray-100 flex items-center lg:text-xl m-2" >{skill.attributes.skillName}</li>
            {/each}
        </ul>
        {/if}
        {#if a.tafkidims.data.length > 0}
                <h3 class="text-barbi font-bold text-xl lg:text-2xl underline ">{requiredRoles[$lang]}</h3>
        <ul class="list-disc">
            {#each a.tafkidims.data as role}
            <li class="text-md text-gray-100 flex items-center lg:text-xl m-2" >{role.attributes.roleDescription}</li>
            {/each}
        </ul>
        {/if}
        {#if a.work_ways.data.length > 0}
                <h3 class="text-barbi font-bold text-xl lg:text-2xl underline ">{requiredWW[$lang]}</h3>
        <ul class="list-disc">
            {#each a.work_ways.data as workWay}
            <li class="text-md text-gray-100 flex items-center lg:text-xl m-2" >{workWay.attributes.workWayName}</li>
            {/each}
        </ul>
        {/if}-->
        </div>

          {#if $page.data.tok != false}
          <div class="flex justify-center">
            {#if alr == false && !a.users?.data.map(c => c.id).includes(data.uid)}
          <button on:click={ask} on:mouseenter={()=>hovered = true} on:mouseleave={()=>hovered = false} class:button-perl={hovered == false} class:button-gold={hovered == true}
            class=" mx-auto mt-7 text-3xl px-4 py-3 hover:text-black hover:font-bold  text-barbi">{iwantto[$lang]}</button>
        {:else if a.users.data.map(c => c.id).includes(data.uid)}
        <h3 class="button-perl text-barbi px-4 py-1">{alri[$lang]}</h3>
            {/if}
        </div>
          {:else}
          <div class="flex justify-center">
                <div class="mx-8 mt-7 text-barbi hover:text-black " on:mouseenter={()=>hovered = true} on:mouseleave={()=>hovered = false} class:button-perl={hovered == false} class:button-gold={hovered == true} >
                    <p class="text-center font-bold text-2xl p-2 ">{info[$lang]}</p>
                <div class="flex flex-row flex-auto justify-between">
                    <button class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4" on:click={reg}>{registratio[$lang]}</button>
                    <button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4 " on:click={login}>{logi[$lang]}</button>
                </div>
            </div>
        </div>
          {/if}
          </div>
          </div>
          </div>
          </div >
          {:else}
          <div class="text-center pt-14">
          <h1 class="text-barbi sm:text-xl my-5">{mand[$lang]}</h1>
               {#if $page.data.tok != false}
            <a href="/lev" class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2  sm:text-xl">לצפיה במשימות אחרות ובכל העדכונים שלך</a>
          {:else}
            <div class="  w-screen">
    <div class="w-1/2 mx-auto border border-barbi button-bronze">
<h3 class="font-bold text-2xl p-2">{info[$lang]}</h3>
<div class="flex flex-row flex-auto justify-between">
<button class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4" on:click={reg}>{registratio[$lang]}</button>
<button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4 " on:click={login}>{logi[$lang]}</button>
</div></div></div>
          {/if}
        </div>
          {/if}
          {:else}
          <div class="text-center pt-14 ">
          <h3 class="text-barbi sm:text-xl my-5">error | שגיאה</h3>
                    {#if $page.data.tok != false}
                    <a href="/lev" class="text-lturk hover:text-barbi hover:border-barbi border border-gold rounded-xl px-4 py-2  sm:text-xl">לצפיה במשימות אחרות ובכל העדכונים שלך</a>
          {:else}
            <div class="  w-screen">
    <div class="w-1/2 mx-auto border border-barbi button-bronze">
<h1 class=" font-bold text-2xl p-2">{info[$lang]}</h1>
<div class="flex flex-row flex-auto justify-between">
<button class=" m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4" on:click={reg}>{registratio[$lang]}</button>
<button class="m-2 border border-gold hover:border-barbi bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold  py-2 px-4 " on:click={login}>{logi[$lang]}</button>
</div></div></div>
          {/if}
                </div>
          {/if}
          {/await}