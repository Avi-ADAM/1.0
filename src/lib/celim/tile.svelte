<script>
  import {lang} from '$lib/stores/lang.js'
     import Grow from '$lib/celim/icons/grow.svelte'
     export let animate = false
  export let gr = false
  export let pic = false
  export let src = ""
  export let alt = ""
  export let single = false
  export let reverse = false
  export let big = false
  export let sm = false
    export let openi = false;
    export let closei = false;
   export let blue = false;
   export let gray = false;
   export let red = false;
   export let green = false;
   export let yellow = false;
   export let indigo = false;
   export let purple = false;
   export let pink = false;
      export let wow = false;
     export let gold = false;
     export let neww = false;
   export let word = "word";
   export let bg = "blue"
   $: if (bg == "blue"){
    blue = true;
   } else if (bg == "pink"){
    pink = true;
   } else if (bg == "yellow"){
    yellow = true;
   } else if (bg == "green"){
    green = true;
   } else if (bg == "indigo"){
    indigo = true;
   } else if (bg == "gray"){
    gray = true;
   } else if (bg == "red"){
    red = true;
   } else if (bg == "purple"){
    purple = true;
   } else if (bg == "wow"){
     wow = true;
   }else if (bg == "gold"){
     gold = true;
   }else if(bg == "neww"){
     neww = true;
   }
   //gray red green yellow indigo purple pink
</script>
<span class:line-through={closei == true}
class:hover:bg-blue-400={blue == true}
class:hover:bg-gold={gold == true}
        class:hover:bg-wow={wow == true}
        class:hover:bg-gray-400={gray == true}
        class:hover:bg-red-400={red == true}
        class:hover:bg-green-400={green == true}
        class:hover:bg-yellow-400={yellow == true}
        class:hover:bg-indigo-400={indigo == true}
        class:hover:bg-purple-400={purple == true}
        class:hover:bg-pink-300={pink == true}
        class:bg-blue-200={blue == true} class:text-blue-800={blue == true}
        class:bg-neww={wow == true} class:text-wowt={wow == true}
        class:bg-gray-200={gray == true} class:text-gray-800={gray == true}
        class:bg-red-200={red == true} class:text-red-800={red == true}
        class:bg-green-200={green == true} class:text-green-800={green == true}
        class:bg-yellow-200={yellow == true} class:text-yellow-800={yellow == true}
        class:bg-indigo-200={indigo == true} class:text-indigo-800={indigo == true}
        class:bg-purple-200={purple == true} class:text-purple-800={purple == true}
        class:bg-pink-200={pink == true} class:text-pink-800={pink == true}
        class:hover:bg-[linear-gradient(to_right,theme(colors.gold),theme(colors.grb),theme(colors.grb),theme(colors.gold))]={gold == true}
  class:bg-[length:200%_auto]={gold==true } 
  class:animate-gradientxslow={gold == true && animate == true}
  class:bg-[linear-gradient(to_bottom_right,theme(colors.gra),theme(colors.gold),theme(colors.grc),theme(colors.gra))]={gold == true && animate == false}
class:bg-[linear-gradient(to_left,theme(colors.gra),theme(colors.grb),theme(colors.grc),theme(colors.grd),theme(colors.gre),theme(colors.grd),theme(colors.grc),theme(colors.grb),theme(colors.gra))]={gold == true && animate == true}
class:text-blue-900={gold == true}
class:py-0.5={sm == false}
class:px-2.5={sm == false}
class:text-xs={sm == false}
class:text-xl={big == true}
class:px-5={big == true}
class:py-1={big == true}
class:font-sans={$lang == "en"}
class:flex-row-reverse={reverse == true}
class:mr-2={single != true}
class:mb-2={single != true}
class:flex-wrap={pic == true}
 class="drop-shadow-lg {neww ? "animate-shine  rounded-full border bg-[linear-gradient(110deg,#EEE8AA,45%,#d4c48b,55%,#EEE8AA)] bg-[length:200%_100%] px-3 py-1 font-medium text-neutral-900 transition-colors" : "rounded-full transition-all duration-300"}  shadow-fuchsia-400 decoration-slate-100  font-semibold inline-flex items-center  ">
   {#if pic}
  <span class=" mx-1">
 <img src={src} alt={alt} class:min-w-12={big == true} class:h-12={big == true} class:min-w-7={big == false} class:h-7={big == false} class=" border-2 border-white max-w-max  rounded-full"/>
</span>
 {/if}
 {@html word}
 {#if closei}
      <svg aria-hidden="true" class="w-3 h-3 sm:w-5 sm:h-5 bg-slate-100 rounded-full mx-1"  fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
 {/if}
  {#if openi}
  <svg aria-hidden="true" class="w-3 h-3 sm:w-6 sm:h-6 bg-slate-100 rounded-full mx-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
 {/if}
 {#if gr}
  <span class=" mx-0.5">
 <Grow width="{big ? 26 :13}" height="{big ? 26 :13}"/>
</span>
 {/if}

 </span>
