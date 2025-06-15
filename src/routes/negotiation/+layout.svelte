<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  
  export let data
  
  // מידע על הדיון הנוכחי
  $: negotiationId = $page.params.id;
  $: isNewNegotiation = negotiationId === '0';
  
  onMount(() => {
    // עדכון כותרת הדף
    if (data?.negotiation?.topic) {
      document.title = `דיון: ${data.negotiation.topic} - מערכת יישוב מחלוקות`;
    } else if (isNewNegotiation) {
      document.title = 'דיון חדש - מערכת יישוב מחלוקות';
    } else {
      document.title = 'מערכת יישוב מחלוקות';
    }
  });
</script>

<svelte:head>
  <!-- Meta tags for sharing -->
  {#if data?.negotiation?.topic}
    <meta property="og:title" content="דיון: {data.negotiation.topic}" />
    <meta property="og:description" content="הצטרף לדיון פתוח ויישוב מחלוקות" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="{$page.url.href}" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="דיון: {data.negotiation.topic}" />
    <meta name="twitter:description" content="הצטרף לדיון פתוח ויישוב מחלוקות" />
  {:else if isNewNegotiation}
    <meta property="og:title" content="צור דיון חדש - מערכת יישוב מחלוקות" />
    <meta property="og:description" content="פתח דיון חדש וזמן אחרים להשתתף" />
    <meta property="og:type" content="website" />
    
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="צור דיון חדש - מערכת יישוב מחלוקות" />
    <meta name="twitter:description" content="פתח דיון חדש וזמן אחרים להשתתף" />
  {/if}
  
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta charset="utf-8" />
</svelte:head>

<!-- הודעת ניווט לצורך נגישות -->
<div class="sr-only">
  <h1>מערכת יישוב מחלוקות</h1>
  {#if data?.negotiation?.topic}
    <p>דיון פתוח בנושא: {data.negotiation.topic}</p>
  {:else if isNewNegotiation}
    <p>יצירת דיון חדש</p>
  {/if}
</div>

<!-- תוכן הדף -->
<main class="min-h-screen">
  <slot />
</main>

<style>
  /* מחלקה לקוראי מסך */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  
  main {
    direction: rtl;
  }
  
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
</style>