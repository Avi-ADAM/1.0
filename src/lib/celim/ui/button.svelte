<script>
  import { createEventDispatcher } from "svelte";
        const dispatch = createEventDispatcher();
    import { lang } from "$lib/stores/lang";
    import Lowding from '$lib/celim/lowding.svelte'
  import List from "../icons/list.svelte";
  import SucssesConf from "../sucssesConf.svelte";
  import Succses from "../icons/succses.svelte";
  import Err from "../icons/err.svelte";
    export let loading = false, success = false, error = false, text = {"he": "יצירה", "en": "Create"},name = "button"
   
    function onclick (){
        if(success == false)
        dispatch("click")
    }
    $: hover = false
</script>    
<button
        class="cursor-pointer transition-all  px-6 py-2 rounded-lg
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px] 
 border-barbi 
 bg-[length:200%_auto] animate-gradientx
 bg-[linear-gradient(to_right,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]  
  hover:bg-[linear-gradient(to_right,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.mpink),theme(colors.fuchsia.400),theme(colors.barbi))]
   font-bold p-2 "
   on:focus={()=>hover = true}
   on:blur={()=>hover = false}
   on:mouseenter={()=>hover = true}
   on:mouseleave={()=>hover = false}
        on:click={onclick}
        name="{name}"><div class="flex flex-row align-center justify-center items-center gap-4">	
        <h2 class="text-transparent font-extrabold text-xl md:text-2xl  bg-clip-text bg-[length:auto_200%] animate-gradienty 
        {hover == false  ? "bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.700),theme(colors.wow),theme(colors.fuchsia.700),theme(colors.barbi))]"
        : "bg-[linear-gradient(to_top,theme(colors.gra),theme(colors.grc),theme(colors.grd),theme(colors.gold),theme(colors.grd),theme(colors.grc),theme(colors.gra))]"}	
">{text[$lang]}</h2>
{#if loading}
<div class="w-8 h-8">
<Lowding color={hover ? "var(--gold)":"var(--barbi-pink)"}/></div>
{/if}
{#if  success}
 <Succses color={hover ? "var(--gold)":"var(--barbi-pink)"}/>  
{/if}
{#if error}
<Err />
{/if}
</div>
</button
      >
<SucssesConf {success}/>
