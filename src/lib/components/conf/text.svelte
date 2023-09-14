<script>
export let state = 2 // original and edit, 3 is original second and edit
export let text;
export let lebel = {"he":"עריכה", "en": "edit"}
import tr from '$lib/translations/tr.json'
  import Close from '$lib/celim/close.svelte';
import { lang } from '$lib/stores/lang.js'
  import { onMount } from 'svelte';
  let htmlon = ``
    export let long = false
onMount(()=>{
    if (text == textb){
    htmlon = text
    } else{
    checkAll(text,textb)
    }
})
let edit = false
let show2 = false
export let textb = text
function check (lettera, letterb){
    if(lettera == letterb){
        return true
    }else {
        return false
    }
}
function checkAll (a, b){
    let al = a.split(" ") ?? []
    let bl = b.split(" ") ?? []
    let t = 0
    htmlon = ``
    console.log(a.split(" "),a.split(""),al[1])
    if(al.length > 0 && bl.length >0){
  for(let i =0; i < bl.length; i++){

    if (check(al[i+t], bl[i]) == true){
        htmlon += `${al[i+t]} `
    } else{
        if(check(al[i+1], bl[i]) == true){
            t = 1
            htmlon += `${al[i+t]} `
        }else if(check(al[i+2], bl[i]) == true){
            t = 2
            htmlon += `${al[i+t]} `
        }else{
             if(al[i] != undefined){
        htmlon+= `<span class="line-through text-barbi">${al[i]}</span> `
        }
        htmlon += `<span class="text-wow">${bl[i]} </span>`
    }
    }
  }
}else if(al.length > 0 && bl.length == 0){
        htmlon+= `<span class="line-through text-barbi">${a}</span> `
}else if(al.length == 0 && bl.length >0){
        htmlon += `<span class="text-wow">${b}</span>`    
}
  console.log(htmlon)
}
    </script>
    <div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">

    {#if edit == false}
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{lebel[$lang]}: </h2>
        <p class="text-gold">{@html htmlon}</p><button on:click={()=>edit = true}>
            {#if text == textb}🖍️{:else}✏️{/if}</button>
        {#if text != textb && show2 != true}
        <button on:click={()=>show2 = true}>📑</button>
        {:else if show2 == true}
        <div class="flex flex-col align-middle justify-center ">
        <button on:click={()=>show2 = false}><Close/></button>
        <small class:text-right={$lang == "he"}>{tr?.nego.original[$lang]}:</small>
        <p>{text}</p>
        <small class:text-right={$lang == "he"} class="text-gold">{tr?.nego.sugestion[$lang]}:</small>
        <p class="text-gold">{textb}</p>
        </div>
        {/if}
        </div>
{:else}

<div dir="rtl" class='textinput max-w-sm mx-auto'>
    {#if long == false}
  <input type="text" on:input={(e)=>console.log(e)} id="des" name="des" bind:value={textb} class='input' required>
  {:else}
      <textarea name="des"  bind:value={textb}     
 type='text' class='input d' required></textarea>
  {/if}
  <label for="des" class='label' >{lebel[$lang]}</label>
  <span class='line '></span>
</div><button on:click={()=>{edit = false
checkAll(text,textb)
}}>✅</button>
{/if}
</div>
<style>
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
  border-bottom: solid 1px var(--mturk);
  font-size: 15px;
  margin-top: 12px;
  width: 100%;
 color:  var(--barbi-pink);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}


.label {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--mturk);
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
  color: var(--barbi-pink);
  top: 0;
} 
</style>