<script>
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

function project(x) {
    goto('/project/'+x)
}
export let askedarr = []
export let alr = false
async function ask() {
    alr = true
    const inD  = await data.streamed.alld.then(data);
  const cookieValueId = document.cookie
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
  const as = askedarr;
    as.push(`${data.mId}`);  
    let d = new Date
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
    }
  ){
    data {id}
  }
}`
 const d2 = await SendTo(que) 
    .then(console.log(d2))
    
}
export let data

$: hovered = false
function hover(a){

}
console.log(data.streamed)
const headi = {
    "he": "הצעה למשימה",
    "en": "suggested mission"
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
const info ={"he": "בכדי לבקש להצטרף לצוות ולבצע את המשימה וגם בכדי לקבל הצעות למשימות, לפתוח רקמות (פרויקטים) חדשות ולהתנהל בהן בהסכמה יש להתחבר או להירשם","en":"You are not connected" }
const registratio = { "he": "להרשמה", "en": "To Registration"} 
const logi = { "he": "להתחברות", "en":"To Login"} 
const foreg = {"he":"חלק מהמידע גלוי רק למשתמשים רשומים","en":"some information is available only for registersd users"}
</script>
<svelte:head>
  <title>{$page.data.alld?.title[$lang] ?? headi[$lang]}</title>
</svelte:head>
{#await data.streamed.alld}
<div class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex align-middle content-center justify-center ">
<RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
</div>
{:then data}
{#if data != null}
{#if data.archived != true}
<div dir="rtl"  style="overflow-y:auto" class=" d mb-4 pt-4 w-full   lg:w-1/2 mx-auto">
    <!-- <div class="h-48 lg:h-auto lg:w-48 flex-none bg-cover rounded-t lg:rounded-t-none lg:rounded-l text-center overflow-hidden bg-gold" style:background-image={`url('${src2}')`} title="">
    </div>-->
    <div class="flex sm:items-center justify-between py-3 border-b-2 border-b-gray-200 bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre">
        <div class="relative flex items-center space-x-1">
            <div class="relative">
                <img src={data.project.data.attributes.profilePic.data?.attributes.url}  alt="" class="w-10 sm:w-16 h-10 sm:h-16  rounded-full">
            </div>
            <div class="flex flex-col leading-tight">
                <div class="sm:text-sm text-md mt-1 flex items-center">
                    <span class="text-barbi text-center mr-3 sm:text-2xl lg:text-4xl text-xl">{headi[$lang]}</span>
                </div>
                <span class="pn ml-1 text-lg sm:text-xl lg:text-2xl text-grey-200 ">{data.project.data.attributes.projectName}</span>
            </div>
        </div>
        <div>
    <button on:click={()=>project(data.project.data.id)} class="px-4 py-2 hover:text-barbi text-gold bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink rounded text-lg lg:text-2xl font-bold mt-2 mx-4 border-2 border-gold leading-4" >{seePr[$lang]}</button>
        </div>
    </div>
    <div  class=" lg:dark:bg-gray-700 bg-transparent rounded-b lg:rounded-b-none lg:rounded-r p-4 flex flex-col justify-between leading-normal ">
         <div  class="mb-8">
              <div class="  mb-2">
        <div class="flex flex-row justify-between">
            <div class="px-2">
            <h2 class="text-barbi font-bold text-xl lg:text-4xl underline ">{data.name}</h2>
            {#if data.descrip !== null && data.descrip !== "null"  && data.descrip !== "undefined"  && data.descrip !== undefined} 
           <p class="cd d max-h-16 text-gray-100 text-lg lg-text-2xl">{data.descrip}</p>{/if}
    {#if data.hearotMeyuchadot}
    <p on:mouseenter={()=>hover("הערות")} on:mouseleave={()=>hover("0")} class="text-gray-100 lg:text-2xl max-h-16 cd text-sm d">{data.hearotMeyuchadot !== undefined && data.hearotMeyuchadot !== null && data.hearotMeyuchadot !== "undefined" ? data.hearotMeyuchadot : ""}</p>
    {:else}
    
<div role="status" class="space-y-2.5 animate-pulse max-w-lg">
    <div class="flex items-center w-full space-x-2">
        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-32"></div>
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
    </div>
    <div class="flex items-center w-full space-x-2 max-w-[480px]">
    <small class="text-barbi text-lg leading-3">{foreg[$lang]}</small>
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
    </div>
    <div class="flex items-center w-full space-x-2 max-w-[400px]">
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-80"></div>
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
    </div>
    <div class="flex items-center w-full space-x-2 max-w-[480px]">
        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
                <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
    </div>
    <div class="flex items-center w-full space-x-2 max-w-[440px]">
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-32"></div>
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24"></div>
        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-full"></div>
    </div>
    <div class="flex items-center w-full space-x-2 max-w-[360px]">
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
        <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-80"></div>
        <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-full"></div>
    </div>
    <span class="sr-only">for registered users only...</span>
    </div>
    {/if}
     <p style="line-height: 1;" class="text-sm text-gray-100 flex items-center lg:text-2xl m-5">
        <img  class="w-12 lg:w-24"  src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg" alt="howmuch"/>
        <span on:mouseenter={()=>hover({"he":"שווי לשעה","en":"vallue per hour"})} on:mouseleave={()=>hover("0")} > {data.perhour.toLocaleString('en-US', {maximumFractionDigits:2})} לשעה </span> * <span on:mouseenter={()=>hover({"he":"כמות השעות", "en":"amount of hours"})} on:mouseleave={()=>hover("0")}  > {data.noofhours.toLocaleString('en-US', {maximumFractionDigits:2})} שעות </span> = <span on:mouseenter={()=>hover({"he":"סך הכל","en": "total"})} on:mouseleave={()=>hover("0")}>{(data.noofhours * data.perhour).toLocaleString('en-US', {maximumFractionDigits:2})} </span>
    </p>
        </div>
            <div class="">
                <Share 
                slug="{"/availableMission/"+$page.data.mId}"
	 title="{data.title[$lang]}"
     desc="its new thing"
     hashtags={['1💗1','consensus']}
	 quote="{data.title[$lang]}"
	 related={[]}
	 via={''}
	 />
            </div>     
        </div>
                   
    {#if data.skills.data.length > 0}
    <small class="text-barbi text-sm lg:text-2xl">{requireSkills[$lang]}</small>
    <div class="border border-gold flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 lg:p-4 ">
        {#each data.skills.data as skill}
        <p 
        on:mouseenter={()=>hover({"he":"הכישורים הנדרשים","en": "needed skills"})} 
        on:mouseleave={()=>hover("0")}  >
            <Tile sm={true} pink={true} word={skill.attributes.skillName}/></p>
                {/each}
                </div>
                {/if}
                {#if data.tafkidims.data.length > 0}  
                <small class="text-sm text-barbi lg:text-2xl">{requiredRoles[$lang]}</small>
                <div class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle d  cd p-2">
                    {#each data.tafkidims.data as rol}
                    <p on:mouseenter={()=>hover({"he":"תפקיד מבוקש", "en":"requested role"})} on:mouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
    <Tile sm={true} word={rol.attributes.roleDescription} wow={true}/></p>{/each}
      </div>
      {/if}
      {#if data.work_ways.data.length > 0}  <small class="text-sm lg:text-2xl text-barbi">{requiredWW[$lang]}</small>
      <div class="border border-gold flex sm:flex-row flex-wrap lg:p-4 justify-center align-middle d cd p-2 ">
          {#each data.work_ways.data as rol}
          <p on:mouseenter={()=>hover({"he":"דרכי עבודה מבוקשות","en":"ways of work for the mission"})} on:mouseleave={()=>hover("0")} class="m-0" style="text-shadow:none;" >
              <Tile bg="gold" sm={true}  word={rol.attributes.workWayName}/>
          </p>
          {/each}
          </div>
          {/if}
          {#if $page.data.tok != false}
          <div class="flex justify-center">
            {#if alr == false}
          <button on:click={ask} on:mouseenter={()=>hovered = true} on:mouseleave={()=>hovered = false} class:button-perl={hovered == false} class:button-gold={hovered == true}  
            class=" mx-auto mt-7 text-3xl px-4 py-3 hover:text-black hover:font-bold  text-barbi">אני אשמח לבצע</button>
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
          </div>
          {:else}
          <div class="text-center pt-14">
          <h1 class="text-barbi sm:text-xl my-5">המשימה אוישה בהצלחה</h1>
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
          