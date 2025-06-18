<script>
  import { formatTime } from "../utils";
import { createEventDispatcher, onMount } from "svelte";
import { lang } from "$lib/stores/lang";
const dispatch = createEventDispatcher();
const timero = {"he":"מונה זמן לסיום הדיון", "en":"time counter for end of discution"}
  let { timegramaDate } = $props();
function hover(text) {
    dispatch("hover", {
        text: text,
    });
}
let zman = $state()
  onMount(()=>{
    let cr = new Date(timegramaDate)
       setInterval(() => {
        //how much time left
   zman = -(Date.now() - cr) 
      }, 1)
  })
</script>
<div class="flex items-center justify-center m-1 "><span role="contentinfo" aria-label="{timero[$lang]}" class="bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre text-center text-barbi p-2 sm:text-2xl text-lg" style:font-family="Digital" onmouseenter={()=>hover(timero[$lang])} onmouseleave={()=>hover("0")}  style="font-weight: 300; letter-spacing: 1px; text-shadow: 1px 1px black;">
    {formatTime(zman)}
</span></div> 
