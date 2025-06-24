<script>
  import Close from "$lib/celim/close.svelte";
  import Tile from "$lib/celim/tile.svelte";
  import { lang } from "$lib/stores/lang";
  import tr from '$lib/translations/tr.json'
  import { MultiSelect } from "svelte-multiselect";
  import AddNewSkill from "../addnew/addNewSkill.svelte";
  import { find_skill_id } from "$lib/func/findSkillId.svelte";
  import AddNewRole from "../addnew/addNewRole.svelte";
  import AddnewWorkway from "../addnew/addnewWorkway.svelte";
  import { onMount } from "svelte";
  onMount(()=>{
    console.log("datai",datai,dataib)
    if(datai != dataib && datai.length > 0 && dataib.length == 0){
        if(datai[0].remuved != true){
            dataib = JSON.parse(JSON.stringify(datai));  
        }
    }
        if(dataib.length > 0){
            dataibn = dataib.map(c=>c.attributes[valc])
        }
    
  })
    let dati = $state(datai)
  /**
   * @typedef {Object} Props
   * @property {any} [datai]
   * @property {any} [dataib]
   * @property {boolean} [show2]
   * @property {any} [lebel]
   * @property {any} valc
   * @property {boolean} [edit]
   * @property {string} [bgi]
   * @property {boolean} [newcontent]
   * @property {any} [placeholder]
   * @property {any} [alld]
   * @property {any} [nom]
   * @property {boolean} [addS]
   * @property {any} [roles]
   * @property {any} [dataibn]
   */

  /** @type {Props} */
  let {
    datai = $bindable([]),
    dataib = $bindable([]),
    show2 = $bindable(false),
    lebel = {"he":"","en":""},
    valc,
    edit = $bindable(false),
    bgi = "gold",
    newcontent = true,
    placeholder = {},
    alld = $bindable([]),
    nom = {},
    addS = false,
    roles = [],
    dataibn = $bindable([]),
    onAddnew // Svelte 5: Callback prop for addnew event
  } = $props();

function addnew(event) {
    const newOb = event.detail.skob;
    const newN = event.detail.skob.attributes[valc];
    // Svelte 5: Replaced dispatch with callback prop
    onAddnew?.({newOb,newN,valc,dataibn});
}

function check (lettera, letterb){
    if(lettera == letterb){
        return true
    }else {
        return false
    }
}

function checkAll (){
    const allId = find_skill_id(dataibn,alld,valc);
    const allob = alld.filter(t=>allId.includes(t.id))
    dataib = allob
    console.log(allob)
    let al = datai.length > 0 ? datai.map(c=>c.id) : []
    let bl = dataib.length > 0 ? dataib.map(c=>c.id) : []
    console.log(al,bl)
    let mutu = []
  for(let i =0; i < bl.length; i++){
    if (!al.includes(bl[i])){
        dataib[i].added = true
    } else{
        dataib[i].double = true
    }
  }
  for(let i =0; i < al.length; i++){
    if (!bl.includes(al[i])){
        datai[i].remuved = true
    }
  }
  mutu = mutu 
  console.log(mutu)
  datai = datai
  dataib = dataib
     console.log(dati)

    let array3 = dataib.concat(datai);
    if(datai.length > 0 && dataib.length > 0){
        array3 = [...new Set([...dataib, ...datai])];
    }else if(datai.length == 0 && dataib.length > 0){
        array3 = [...new Set([...dataib])];
    }else if(datai.length > 0 && dataib.length == 0){
        array3 = [...new Set([...datai])];
    }
    const fi = array3.filter(t=>t.double != true)
        array3 = fi
    array3 = array3
    dati = array3
    
    dati = dati
    console.log(dati)
}
</script>
<div class="border border-gold border-opacity-20 rounded m-2">
{#if edit == false}
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{lebel[$lang]} </h2>
{#if dati.length > 0}
        <div class="  flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 mb-1">
          {#each dati as dat, i}
          <p
          class="m-0 " style="text-shadow:none; white-space:none;" >
    <Tile sm={true} big={true} bg="{dat.added ? "green" : dat.remuved ? "red" : bgi}" closei={dat.remuved} openi={dat.added} word={dat.attributes[valc]}/></p>{/each}
    </div>
    {/if}
    <button onclick={()=>edit = true}>
     {#if datai == dataib}🖍️{:else}✏️{/if}</button>
        {#if datai != dataib && show2 != true}
        <button onclick={()=>show2 = true}>📑</button>
        {:else if show2 == true}
        <div class="flex flex-col align-middle justify-center ">
        <button onclick={()=>show2 = false}><Close/></button>
        <small class:text-right={$lang == "he"}>{tr?.nego.original[$lang]}:</small>
        {#if datai.length > 0}
        <div class="  flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 mb-1">
          {#each datai as dat, i}
          <p
          class="m-0 " style="text-shadow:none; white-space:none;" >
              <Tile bg="blue" sm={true} big={true}  word={dat.attributes[valc]}/></p>
              {/each}
    </div>
    {/if}
        <small class:text-right={$lang == "he"} class="text-gold">{tr?.nego.sugestion[$lang]}:</small>
        {#if dataib.length > 0}
        <div class="  flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 mb-1">
          {#each dataib as dat, i}
          <p
          class="m-0 " style="text-shadow:none; white-space:none;" >
              <Tile bg="pink" sm={true} big={true}  word={dat.attributes[valc]}/></p>
              {/each}
    </div>
    {/if} 
        </div>
        {/if}
        </div>
{:else}
    <div class="max-w-md mx-auto flex flex-row gap-x-3 justify-center align-middle"> <MultiSelect
        --sms-selected-bg="white"
        --sms-bg="var(--gold)"
        loading={newcontent}
        bind:selected={dataibn}
        placeholder={placeholder[$lang]}
        options={alld.map(c => c.attributes[valc])}
        noMatchingOptionsMsg={nom[$lang]}
        
        />
                <div class="mx-auto">
        {#if valc == "skillName"}
            <AddNewSkill color={"--barbi-pink"}  onAddnewskill={addnew} addS={addS} roles1={roles} />
        {:else if valc == "roleDescription"} 
            <AddNewRole color={"--barbi-pink"}  onAddnewrole={addnew}   />
        {:else if valc == "workWayName"} 
            <AddnewWorkway color={"--barbi-pink"}  onAddww={addnew}/>
        {/if}
                </div>
        <button onclick={()=>{edit = false
checkAll(datai,dataib)
}}>✅</button>
    </div>
{/if}
</div>
