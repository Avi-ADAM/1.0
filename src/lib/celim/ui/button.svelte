<script>
  import { createEventDispatcher } from "svelte";
        const dispatch = createEventDispatcher();
    import { lang } from "$lib/stores/lang";
    export let loading = false, success = false, error = false, text = "",name = "button"
   
    function onclick (){
        dispatch("click")
    }
</script>    
<button
        class="cursor-pointer transition-all  px-6 py-2 rounded-lg
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px] 
 border-barbi 
 bg-[length:200%_auto] animate-gradientx
 bg-[linear-gradient(to_right,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]  
  hover:bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.400),theme(colors.mpink),theme(colors.lpink),theme(colors.mpink),theme(colors.fuchsia.400),theme(colors.barbi))]
   font-bold p-2 "
        on:click={onclick}
        name="{name}">
        <h2 class="text-transparent font-extrabold text-xl md:text-2xl  bg-clip-text bg-[length:auto_200%] animate-gradienty 
        bg-[linear-gradient(to_top,theme(colors.barbi),theme(colors.fuchsia.700),theme(colors.wow),theme(colors.lpink),theme(colors.wow),theme(colors.fuchsia.700),theme(colors.barbi))]
        hover:bg-[linear-gradient(to_right,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]  
">{text[$lang]}</h2></button
      >
