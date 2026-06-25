<script>
  import { formatTime } from "../utils";
import { onMount, onDestroy } from "svelte";
import { lang } from "$lib/stores/lang";
const timero = {"he":"מונה זמן לסיום הדיון", "en":"time counter for end of discution"}
  let { timegramaDate, onHover = () => {} } = $props();
function hover(text) {
    onHover?.(text);
}
let zman = $state()
let timer;
  onMount(()=>{
    let cr = new Date(timegramaDate)
    const tick = () => { zman = cr.getTime() - Date.now(); }; // ms left (negative once passed)
    tick();
    timer = setInterval(tick, 1000);
  })
  onDestroy(() => clearInterval(timer))
</script>
<div class="flex items-center justify-center m-1 "><span role="contentinfo" aria-label="{timero[$lang]}" class="bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre text-center text-barbi p-2 sm:text-2xl text-lg" style:font-family="Digital" onmouseenter={()=>hover(timero[$lang])} onmouseleave={()=>hover("0")}  style="font-weight: 300; letter-spacing: 1px; text-shadow: 1px 1px black;">
    {formatTime(zman)}
</span></div>
