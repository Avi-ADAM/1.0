<script>
  import Bein from "$lib/components/main/bein.svelte";
  import { show } from "$lib/components/registration/store-show.js";
  import { onMount } from "svelte";

  onMount(() => {
    // Start onboarding at the first profile step (Values)
    show.set(1);
  });
</script>

<Bein mode="onboarding" />
