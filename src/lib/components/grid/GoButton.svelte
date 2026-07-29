<script>
  import { isRtl, t } from '$lib/translations';
  import { goto } from "$app/navigation";
  import Arrow from "$lib/celim/icons/arrow.svelte";
  let { id } = $props();
    function gotoM(){
        if (id) {
            goto('/availableMission/'+id)
        }
    }
</script>
<button onclick={gotoM} title={$t('common.status.goToMission')} class="hover:scale-125 transition-all" disabled={!id}>
  <Arrow back={!$isRtl}/></button>