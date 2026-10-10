<script>
  // Test-only: a CardHeader inside the context a LevCard would provide.
  import CardHeader from './cards/CardHeader.svelte';
  import { setLevItem } from './levItemContext.js';

  let { item } = $props();
  setLevItem(() => item);
</script>

<CardHeader projectName="הרקמה" cardType="סוג" cardTitle="כותרת" />
