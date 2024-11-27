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
        class="cursor-pointer transition-all duration-300 px-8 py-2 rounded-xl
border-b-[4px] hover:brightness-105 hover:-translate-y-[2px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-95 active:translate-y-[2px] 
border-barbi shadow-lg hover:shadow-xl
bg-[length:200%_auto] animate-gradientx
bg-[linear-gradient(to_right,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]  
hover:bg-[linear-gradient(to_right,theme(colors.gold),theme(colors.amber.400),theme(colors.yellow.300),theme(colors.amber.400),theme(colors.gold))]
font-bold font-rubik"
   on:focus={()=>hover = true}
   on:blur={()=>hover = false}
   on:mouseenter={()=>hover = true}
   on:mouseleave={()=>hover = false}
        on:click={onclick}
        title="{text[$lang]}"
        name="{name}"><div class="flex flex-row align-center justify-center items-center gap-4"><slot>	
        <h2 class="text-transparent font-extrabold text-xl md:text-2xl  bg-clip-text bg-[length:auto_200%] animate-gradienty transition-all duration-300 tracking-wide
        {hover == false  ? "bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.pink.400),theme(colors.mpink),theme(colors.pink.400),theme(colors.barbi))]"
        : "bg-[linear-gradient(to_top,theme(colors.pink.300),theme(colors.fuchsia.400),theme(colors.mpink),theme(colors.fuchsia.400),theme(colors.pink.300))]"}	
">{text[$lang]}</h2></slot>
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
</button>
<SucssesConf {success}/>
