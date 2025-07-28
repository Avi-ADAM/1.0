<script>
import tr from '$lib/translations/tr.json'
  import Close from '$lib/celim/close.svelte';
import { lang } from '$lib/stores/lang.js'
  import { onMount } from 'svelte';
  let htmlon = $state(``)
onMount(()=>{
    if (text == textb){
    htmlon = text
    } else{
    checkAll(text,textb)
    }
})
let edit = $state(false)
let show2 = $state(false)
  /**
   * @typedef {Object} Props
   * @property {number} [stepState] - original and edit, 3 is original second and edit
   * @property {any} text
   * @property {any} [old]
   * @property {any} [lebel]
   * @property {boolean} [long]
   * @property {any} [textb]
   */

  /** @type {Props} */
  let {
    stepState = 2,
    text,
    old = [],
    lebel = {"he":"עריכה", "en": "edit"},
    long = false,
    textb = $bindable(text)
  } = $props();
function check (lettera, letterb){
    if(lettera == letterb){
        return true
    }else {
        return false
    }
}
function checkAll(a, b) {
    const al = a && a.length > 0 ? a.split(" ") : [];
    const bl = b && b.length > 0 ? b.split(" ") : [];
    let html = '';
    let i = 0; // pointer for al
    let j = 0; // pointer for bl

    while (i < al.length || j < bl.length) {
        if (i < al.length && j < bl.length && al[i] === bl[j]) {
            // Words match
            html += al[i] + ' ';
            i++;
            j++;
        } else {
            // Words don't match. Look ahead to find a sync point.
            let found_b_in_a = -1;
            if (j < bl.length) {
                for (let k = i; k < al.length; k++) {
                    if (al[k] === bl[j]) {
                        found_b_in_a = k;
                        break;
                    }
                }
            }

            let found_a_in_b = -1;
            if (i < al.length) {
                for (let k = j; k < bl.length; k++) {
                    if (bl[k] === al[i]) {
                        found_a_in_b = k;
                        break;
                    }
                }
            }

            if (found_b_in_a !== -1 && (found_a_in_b === -1 || found_b_in_a - i <= found_a_in_b - j)) {
                // It's more likely a deletion from 'a'.
                // Mark words from i to found_b_in_a - 1 as deleted.
                for (let k = i; k < found_b_in_a; k++) {
                    html += `<span class="line-through text-barbi">${al[k]}</span> `;
                }
                i = found_b_in_a;
            } else if (found_a_in_b !== -1) {
                // It's more likely an insertion into 'b'.
                // Mark words from j to found_a_in_b - 1 as added.
                for (let k = j; k < found_a_in_b; k++) {
                    html += `<span class="text-wow">${bl[k]} </span>`;
                }
                j = found_a_in_b;
            } else {
                // No sync point found. Mark al[i] as deleted and bl[j] as added.
                if (i < al.length) {
                    html += `<span class="line-through text-barbi">${al[i]}</span> `;
                    i++;
                }
                if (j < bl.length) {
                    html += `<span class="text-wow">${bl[j]} </span>`;
                    j++;
                }
            }
        }
    }
    htmlon = html.trim();
    console.log(htmlon);
}
    </script>
    <div class="border border-gold border-opacity-20 rounded m-2 flex flex-col align-middle justify-center gap-x-2">

    {#if edit == false}
    <div class="flex flex-row align-middle justify-center gap-x-2">
        <h2 class="underline decoration-mturk">{lebel[$lang]}: </h2>
        <p class="text-gold">{@html htmlon}</p><button onclick={()=>edit = true}>
            {#if text == textb}🖍️{:else}✏️{/if}</button>
        {#if text != textb && show2 != true}
        <button onclick={()=>show2 = true}>📑</button>
        {:else if show2 == true}
        <div class="flex flex-col align-middle justify-center ">
        <button onclick={()=>show2 = false}><Close/></button>
        <small class:text-right={$lang == "he"}>{tr?.nego.original[$lang]}:</small>
        <p>{text}</p>
        <small class:text-right={$lang == "he"} class="text-gold">{tr?.nego.sugestion[$lang]}:</small>
        <p class="text-gold">{textb}</p>
        {#each old  as o, i}
        <small class:text-right={$lang == "he"} class="text-gold">{tr?.nego.oldno[$lang]}:{i+1}</small>
        <p class="text-gold">{o ?? text}</p>
        {/each}
        </div>
        {/if}
        </div>
{:else}

<div dir="rtl" class='textinput max-w-sm mx-auto'>
    {#if long == false}
  <input type="text" oninput={(e)=>console.log(e)} id="des" name="des" bind:value={textb} class='input' required>
  {:else}
      <textarea name="des"  bind:value={textb}     
 type='text' class='input d' required></textarea>
  {/if}
  <label for="des" class='label' >{lebel[$lang]}</label>
  <span class='line '></span>
</div><button onclick={()=>{edit = false
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
