<script>
  import { goto } from "$app/navigation";
  import Arrow from "$lib/celim/icons/arrow.svelte";
  import {lang} from '$lib/stores/lang'
  const go = {'he':'לדף המשימה', 'en':"go to mission page"}
  let { id } = $props();
    function gotoM(){
        if (id) {
            goto('/availableMission/'+id)
        }
    }
</script>
<button onclick={gotoM} title={go[$lang]} class="hover:scale-125 transition-all" disabled={!id}>
  <Arrow back={$lang !== "he"}/></button>