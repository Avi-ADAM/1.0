<script>
  import Close from "$lib/celim/close.svelte";
  import AddSheirut from "./sheirut/addSheirut.svelte";
  import SheirutShow from "./sheirut/sheirutShow.svelte";
  import {lang} from '$lib/stores/lang'
  import {idPr} from '$lib/stores/idPr'
    let show = $state(false)
    
    const showl = {"he":"הצגת השירותים שלנו","en":"show services"}
  let {
    sheirutim = [],
    restime,
    usersNum,
    pn,
    pid
  } = $props();
</script>
{#if sheirutim?.data?.length >0}
{#if show === false}
   <button   
            class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
        onclick={()=>show = true}>{showl[$lang]}
    </button>
  {:else} 
      <div class="flex flex-col items-center justify-center sm:w-1/2 p-8 mx-auto bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400"> 
        <button   
                class="m-4 mx-auto border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-lg"
            onclick={()=>show = false}><Close/>
        </button>
    <SheirutShow projectName={pn} pid={$idPr} {sheirutim} {restime}/>
      </div>
    {/if}
    <AddSheirut {restime} {usersNum}/>
{:else}
    <AddSheirut {restime} {usersNum}/>
{/if}