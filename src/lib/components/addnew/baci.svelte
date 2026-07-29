<script>
  import { isRtl, t } from '$lib/translations';
    import { lang } from '$lib/stores/lang.js'
    import { Confetti } from "svelte-confetti"
   import { quintOut } from "svelte/easing";
    import { idPr } from '../../stores/idPr.js';
    import { baciStore, resetBaciStore } from '$lib/stores/baciStore.js';
    import { executeAction } from '$lib/client/actionClient';
    import { goto } from '$app/navigation';
    import AddnewVal from './addnewval.svelte';
    import MultiSelect from 'svelte-multiselect';
    import { onMount } from 'svelte';
    import Uplad from '../userPr/uploadPic.svelte';
     import { DialogOverlay, DialogContent } from 'svelte-accessible-dialog';
      import {  fly, scale } from 'svelte/transition';
      import Chooser from '$lib/celim/ui/chooser.svelte'

let loading = $state(false);
let isOpen = $state(false);
let a = $state(0);
let success = $state(false)
    let before = $state(false);
    let url1 = "/api/upload";
let run = [];
let files;
  let shgi = $state(false);
  let naex = $state('');
    let nam;
async function sendP() {
  if ($baciStore.projectName_value.length < 1) {
    naex = $t('addnew.baci.nameTooShort');
    shgi = true;
    return;
  }
  if (run.includes($baciStore.projectName_value)) {
    naex = $t('addnew.baci.naex');
    shgi = true;
    return;
  }
  loading = true;
  // Upload the cover image (if any) through the server proxy, which reads the
  // JWT from the HttpOnly cookie — the token never touches the client.
  if (files) {
    try {
      const upRes = await fetch(url1, { method: 'POST', body: files });
      if (!upRes.ok) throw new Error('upload failed');
      const uploaded = await upRes.json();
      $baciStore.imageId = uploaded[0].id;
    } catch (error) {
      console.log('צריך לתקן:', error);
      loading = false;
      return;
    }
  }
  await sendPP();
}

async function sendPP() {
  // Resolve the selected vallues: known ones → ids (client already loaded the
  // list); unknown ones → names the server will mint. Project creation + vallue
  // minting happen server-side via the unified action, so no JWT on the client.
  const knownNames = vallues.map((c) => c.attributes.valueName);
  const vallueIds = [];
  const newVallueNames = [];
  for (const sel of $baciStore.selected) {
    const idx = knownNames.indexOf(sel);
    if (idx >= 0) {
      vallueIds.push(String(vallues[idx].id));
    } else {
      newVallueNames.push(sel);
    }
  }

  try {
    const result = await executeAction('createWeave', {
      projectName: $baciStore.projectName_value,
      publicDescription: $baciStore.desP,
      descripFor: $baciStore.desPl,
      linkToWebsite: $baciStore.linkP,
      restime: $baciStore.restime,
      timeToP: $baciStore.timeToP,
      imageId: $baciStore.imageId ? String($baciStore.imageId) : undefined,
      isOt: $baciStore.ont,
      vallueIds,
      newVallueNames
    });

    if (!result.success) {
      loading = false;
      return; // executeAction already surfaced the error toast
    }

    success = true;
    idPr.set(result.data.projectId);
    before = true;
    loading = false;

    // Site-activity feed entry (same-origin internal endpoint, no token).
    const data = {
      name: userName_value,
      action: 'יצר ריקמה חדשה בשם:',
      det: `${$baciStore.projectName_value} והתיאור: ${$baciStore.desP}`
    };
    fetch('/api/ste', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(() => {
        resetBaciStore();
        goto('/moach');
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  } catch (error) {
    console.log('צריך לתקן:', error);
    loading = false;
  }
}

let vallues = $state([]);
    let error1 = null;
    let addval = false;
    
    onMount(async () => {
        // Read vallue options + existing project names through the secure proxy,
        // which injects the JWT from the HttpOnly cookie (no token on the client).
        try {
           const res = await fetch('/api/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data: { queId: 'baciFormData' } })
            });
            const json = await res.json();
            if (!res.ok || !json?.data) throw json;
            vallues = json.data.vallues.data;
            if ($lang == "he" ){
              for (var i = 0; i < vallues.length; i++){
                if (vallues[i].attributes.localizations.data.length > 0){
                vallues[i].attributes.valueName = vallues[i].attributes.localizations.data[0].attributes.valueName
                }
              }
            }
            vallues = vallues
                        newcontent = false
            const runi = json.data.projects.data;
           run = runi.map(c => c.attributes.projectName)
        } catch (e) {
            error1 = e
        }
    });

let suc = $state(false);

        const placeholder = $t('addnew.baci.valuesAndGoals');

 function project () {
    // idPr was already set to the new weave id in sendPP().
    goto("/moach");
  };
  import { RingLoader
} from 'svelte-loading-spinners'
  import RichText from '$lib/celim/ui/richText.svelte';
  import { isMobileOrTablet } from '$lib/utilities/device.js';
  import MobileModal from '$lib/celim/ui/mobileModal.svelte';
  let { userName_value } = $props();
 const closer = () => {
    isOpen = false;
  a = 0;
  };
  	function callbackFunction(event) {
    a = 2;
    files = event.files;
    isOpen = false;
    suc = true;
	}
  function openen () {
  isOpen = true;
    a = 1
}


  function handleFocusIn(event) {
    if (isMobileOrTablet) {
        setTimeout(() => {
            event.currentTarget.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }, 300);
    }
}

  let ugug = $state(``);
  let valE = $state(false)
    let newcontent = $state(true)

 </script>  
{#if isOpen}
      <div class="center-upload" dir="rtl" >
             <button class=" hover:bg-barbi text-mturk rounded-full"
          onclick={closer}>{$t('addnew.baci.cencel')}</button>
          {#if a == 1}
          <Uplad current="https://res.cloudinary.com/onelove1/image/upload/v1645805397/pngegg_2_8aeb98b032.png" onMessage={callbackFunction}/>

          {:else if a == 2 && isOpen}
          <div class="sp bg-gold">
            <h3 class="text-barbi">{$t('addnew.baci.om')}</h3>
          <br>
         <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> 
         {/if}
         </div>
{/if}

<div transition:scale={{ delay: 250, duration: 300, easing: quintOut }} class="a"></div>


  {#if before == false}

<div transition:scale={{ delay: 250, duration: 300, easing: quintOut }} dir="{$isRtl ? 'rtl' : 'ltr'}" class="jho {isMobileOrTablet ? "pb-12" : ""} flex flex-col items-center text-center justify-center">
  <h1 class="text-gold">{$t('addnew.baci.crn')}</h1>
<br>

        <div dir="{$isRtl ? 'rtl' : 'ltr'}" class='textinput'>
  <input name="des" bind:value={$baciStore.projectName_value}
 type='text' class='input'required >
  <label style:right={$isRtl ? "0" : "none"} style:left={$isRtl ? "none" : "0"} for="des" class='label'>{$t('addnew.baci.frn')}</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600 bg-slate-50">{naex}</small>{/if}
<!----
    <div dir="{$isRtl ? 'rtl' : 'ltr'}" class='textinput'>
  <textarea name="es"  bind:value={desP}    
 type='text' class='input d' required ></textarea>
  <label style:right={$isRtl ? "0" : "none"} style:left={$isRtl ? "none" : "0"} for="es" class='label'>{$t('addnew.baci.teure')}</label>
  <span class='line'></span>
</div>-->
<br>
<div class="w-full">
<h2 class="text-barbi">{$t('addnew.baci.teure')}</h2>
<RichText bind:outpot={$baciStore.desP}/>
</div>
<!----
   <div dir="{$isRtl ? 'rtl' : 'ltr'}" class='textinput'>
  <textarea name="s"  bind:value={$baciStore.desPl}
 type='text' class='input d' required></textarea>
  <label style:right={$isRtl ? "0" : "none"} style:left={$isRtl ? "none" : "0"} for="s" class='label'>{$t('addnew.baci.prte')}</label>
  <span class='line'></span>
</div>-->
<div class="w-full">
    <h2 class="text-barbi">{$t('addnew.baci.prte')}</h2>

<RichText bind:outpot={$baciStore.desPl}/>
</div>
 <div dir="{$isRtl ? 'rtl' : 'ltr'}" class='textinput'>
  <input name="de"    bind:value={$baciStore.linkP}
 type='text' class='input' required>
  <label style:right={$isRtl ? "0" : "none"} style:left={$isRtl ? "none" : "0"} for="de" class='label'>{$t('addnew.baci.wel')}</label>
  <span class='line'></span>
</div>
<br>
<div class="">
<h2 
 class=" text-barbi " >{$t('addnew.baci.ladd')}</h2>
<Uplad
  noHeader={true}
 current="https://res.cloudinary.com/onelove1/image/upload/v1645805397/pngegg_2_8aeb98b032.png" onMessage={callbackFunction}/>

{#if suc == true}<small class="text-barbi">{$t('addnew.baci.su')}</small>{/if}
</div>         
<h1 class="midscreenText-2 text-center text-gold">
  {userName_value} 
  {$t('addnew.baci.whva')}
?
</h1> 
{#if !isMobileOrTablet()}
<div class="input-2">
     <MultiSelect
     outerDivClass="!bg-gold !text-barbi"
     inputClass="!bg-gold !text-barbi"
     liSelectedClass="!bg-barbi !text-gold"
      createOptionMsg={$t('addnew.baci.addne', { name: ugug })}
     allowUserOptions={"append"}
      loading={newcontent}
      bind:searchText={ugug}
     bind:selected={$baciStore.selected}
     {placeholder}
     options={vallues.map(c => c.attributes.valueName)}
     />
  </div>
{:else}
  <MobileModal onClose={()=> valE = false} bind:isOpen={valE} title={placeholder}>
        <div class="border border-gold flex flex-row lg:p-4 flex-wrap justify-center align-middle p-2">

       <MultiSelect
     outerDivClass="!bg-gold !text-barbi"
     inputClass="!bg-gold !text-barbi"
     liSelectedClass="!bg-barbi !text-gold"
      createOptionMsg={$t('addnew.baci.addne', { name: ugug })}
     allowUserOptions={"append"}
      loading={newcontent}
      bind:searchText={ugug}
     bind:selected={$baciStore.selected}
     {placeholder}
     options={vallues.map(c => c.attributes.valueName)}
     />
     </div>
  </MobileModal>
{/if}
  <br>
 <div dir="{$isRtl ? 'rtl' : 'ltr'}" class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-gold">{$t('addnew.baci.hre')}</h2>
    <select class:round={$isRtl} class:rounden={!$isRtl} bind:value={$baciStore.restime} class=" form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none">
<option value="feh" selected> 48 {$t('addnew.baci.hours')} </option>
<option value="sth">72 {$t('addnew.baci.hours')} </option>
<option value="nsh">96 {$t('addnew.baci.hours')} </option>
<option value="sevend">{$t('addnew.baci.week')}</option>

</select>
<small style="color: turquoise;">{$t('addnew.baci.hrex')}</small>
</div>
<div dir="{$isRtl ? 'rtl' : 'ltr'}" class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-gold">{$t('addnew.baci.timeto')}</h2>
    <select class:round={$isRtl} class:rounden={!$isRtl} bind:value={$baciStore.timeToP} class=" form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none">
<option value="already" selected>{$t('addnew.baci.cvar')}</option>
<option value="week">{$t('addnew.baci.week')}</option>
<option value="month">{$t('addnew.baci.month')}</option>
<option value="threeM">{$t('addnew.baci.threemonth')}</option>
<option value="sixM">{$t('addnew.baci.halt')}</option>
<option value="oneY">{$t('addnew.baci.year')}</option>
<option value="twoY">{$t('addnew.baci.toyers')}</option>
<option value="more">{$t('addnew.baci.more')}</option>
<option value="never">{$t('addnew.baci.never')}</option>
</select>
<small style="color: turquoise;">{$t('addnew.baci.timetoex')}</small>
</div>
<Chooser tr={$t('addnew.baci.continuous')}   
  fl={$t('addnew.baci.oneTimed')} 
  level={$t('addnew.baci.continuousLevel')} 
  bind:checked={$baciStore.ont} />
  <!-- הדוגמה א טובה צריך לתת פתיחה של מסעדה מול אירוע חד פעמי, גם כדאי לשים בשורה נפרדת של הערות 
{#if ont == true}
<h3 class="text-barbi">{$t('addnew.baci.inc')}</h3>
<input type="number"/>
{/if}-->
  {#if loading == false}

<button 
    class="cen bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink  text-gold hover:text-barbi font-bold p-4 rounded-full"
     onclick={sendP}
     name="addm">{$t('addnew.baci.cree')}</button>
       {:else}  <RingLoader size="100" color="#ff00ae" unit="px" duration="2s"></RingLoader>
{/if}</div>
{:else}
<div class="aft">
  <h1 class="text-barbi">{$t('addnew.baci.sur')}</h1>
  <button class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"
 onclick={project} >{$t('addnew.baci.tob')}</button>
</div>
{/if}
  {#if success}
  <div style="
position: fixed;
top: -50px;
left: 0;
height: 100vh;
width: 100vw;
display: flex;
justify-content: center;
overflow: hidden;
pointer-events: none;">
      <Confetti rounded size=30 x={[-5, 5]} y={[-5, 5]} delay={[0, 50]} amount=200 duration=10000 colorArray={["url(https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png)"]} fallDistance="100vh"/><!--colorRange={[0, 120]}-->
<Confetti noGravity x={[-5, 5]} y={[-5, 5]} delay={[550, 550]} duration=10000  amount=2000 colorRange={[120, 240]} fallDistance="100vh"/>
<Confetti noGravity x={[-5, 5]} y={[-5, 5]} delay={[1000, 1050]} duration=10000 amount=200 colorRange={[240, 360]} fallDistance="100vh"/>
<Confetti x={[-5, 5]} y={[0, 0.1]} delay={[500, 2000]}  duration=5000 amount=200  />
</div>
{/if}
<style>
 .center-upload {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9;
  background: white;
  border-radius: 1em;
  box-shadow: 0 0 20px #0002;
  padding: 2em;
  display: flex;
  flex-direction: column;
  align-items: center;
}
  textarea::-webkit-resizer {
  border-width: 8px;
  border-style: solid;
  border-color: transparent  transparent var(--gold)  var(--gold);
}
  .a{
     background-color: #000000;
background-image: linear-gradient(147deg, #000000 0%, #04619f 74%);
 z-index: -1;
 position: fixed;
  top: 0;
  left: 0;
  min-width: 100vw;
  min-height: 100vh;
  }
select.round {
  background-image:
    linear-gradient(315deg, transparent 50%, rgb(0, 174, 255) 50%),
    linear-gradient(225deg, rgb(0, 174, 255) 50%, transparent 50%),
    radial-gradient(#ddd 70%, transparent 72%);
  background-position:
    calc(0% + 20px) calc(1em + 2px),
    calc(0% + 15px) calc(1em + 2px),
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
}

select.round:focus {
  background-image:
    linear-gradient(315deg, white 50%, transparent 50%),
    linear-gradient(225deg, transparent 50%, white 50%),
    radial-gradient(gray 70%, transparent 72%);
  background-position:
    calc(0% + 15px) 1em,
    calc(0% + 20px) 1em,
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
  border-color: green;
  outline: 0;
}
select.rounden {
  background-image:
    linear-gradient(45deg, transparent 50%, gray 50%),
    linear-gradient(135deg, gray 50%, transparent 50%),
    radial-gradient(#ddd 70%, transparent 72%);
  background-position:
    calc(100% - 20px) calc(1em + 2px),
    calc(100% - 15px) calc(1em + 2px),
    calc(100% - .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
}

select.rounden:focus {
  background-image:
    linear-gradient(45deg, white 50%, transparent 50%),
    linear-gradient(135deg, transparent 50%, white 50%),
    radial-gradient(gray 70%, transparent 72%);
  background-position:
    calc(100% - 15px) 1em,
    calc(100% - 20px) 1em,
    calc(100% - .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
  border-color: green;
  outline: 0;
}
     .sp{
   display: grid;
    justify-content: center;
  align-items: center; 
  }
  .aft{
    display: grid;
    align-items: center;
    justify-content: center;
  }
  .cen{
    margin: 0 auto;

  }
  .jho{
 width: 50%;
 margin: 0 auto;
 
  }
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
 color:  var(--gold);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}


.label {

  font-size: 15px;
  position: absolute;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--gold);
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
  font-size: 14px;
  color: turquoise;
  top: 0;
}
.input:focus ,.input:valid  {
  border: 0;
}

@media (max-width:600px){
 
.textinput {
  position: relative;
  width: 100%;
  display: block;
}
 .jho{
 width: 90%;
 margin: 0 auto;
  }
 
}
@media (min-width:601px){
 .d::-webkit-scrollbar {
    width: 17px;
}
}


    h1{
      font-size: 29px;  
    }
    img.bg {
  min-height: 100%;
  min-width: 1024px;
  width: 100%;
  height: auto;
	  position: fixed;
  top: 0;
  left: 0;
  z-index: -1;
}


@media screen and (max-width: 1024px) { /* Specific to this particular image */
  img.bg {
    left: 50%;
    margin-left: -512px;   /* 50% */
  }
}  
</style>
