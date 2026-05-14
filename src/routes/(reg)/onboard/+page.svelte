<script>
  import Bein from "$lib/components/main/bein.svelte";
  import { show } from "$lib/components/registration/store-show.js";
  import { onMount } from "svelte";
  import { lang } from '$lib/stores/lang.js';

  onMount(() => {
    // Start onboarding at the first profile step (Values)
    show.set(1);
  });
</script>

<svelte:head>
  <title>הרשמה · 1lev1</title>
</svelte:head>

<Bein mode="onboarding" />
