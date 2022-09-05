<script>
   export let blue = false;
   export let gray = false;
   export let red = false;
   export let green = false;
   export let yellow = false;
   export let indigo = false;
   export let purple = false;
   export let pink = false;
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
   }
   //gray red green yellow indigo purple pink
</script>
<span class:bg-blue-200={blue == true} class:text-blue-800={blue == true}
        class:bg-gray-200={gray == true} class:text-gray-800={gray == true}
        class:bg-red-200={red == true} class:text-red-800={red == true}
        class:bg-green-200={green == true} class:text-green-800={green == true}
        class:bg-yellow-200={yellow == true} class:text-yellow-800={yellow == true}
        class:bg-indigo-200={indigo == true} class:text-indigo-800={indigo == true}
        class:bg-purple-200={purple == true} class:text-purple-800={purple == true}
        class:bg-pink-200={pink == true} class:text-pink-800={pink == true}
 class="text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">{word}</span>
