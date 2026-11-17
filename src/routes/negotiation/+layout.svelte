<script>
    import { page } from '$app/state';
    import { t, isRtl } from '$lib/translations';

    let {data,children} = $props()

    // The discussion this route shows (see +page.svelte: reference only — real
    // negotiations run on the consensus site).
    let negotiationId = $derived(page.params.id);
    let isNewNegotiation = $derived(negotiationId === '0');
  </script>

  <svelte:head>
    <title>{data?.negotiation?.topic
      ? $t('negotiation.layout.docOpen', { topic: data.negotiation.topic })
      : isNewNegotiation
        ? $t('negotiation.layout.docNew')
        : $t('negotiation.layout.docDefault')}</title>
    <!-- Meta tags for sharing -->
    {#if data?.negotiation?.topic}
      <meta property="og:title" content={$t('negotiation.layout.docOpen', { topic: data.negotiation.topic })} />
      <meta property="og:description" content={$t('negotiation.layout.joinDesc')} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="{page.url.href}" />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={$t('negotiation.layout.docOpen', { topic: data.negotiation.topic })} />
      <meta name="twitter:description" content={$t('negotiation.layout.joinDesc')} />
    {:else if isNewNegotiation}
      <meta property="og:title" content={$t('negotiation.layout.docNew')} />
      <meta property="og:description" content={$t('negotiation.layout.newDesc')} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={$t('negotiation.layout.docNew')} />
      <meta name="twitter:description" content={$t('negotiation.layout.newDesc')} />
    {/if}

    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8" />
  </svelte:head>

  <!-- Screen-reader outline of where you are -->
  <div class="sr-only">
    <h1>{$t('negotiation.layout.docDefault')}</h1>
    {#if data?.negotiation?.topic}
      <p>{$t('negotiation.layout.srTopic', { topic: data.negotiation.topic })}</p>
    {:else if isNewNegotiation}
      <p>{$t('negotiation.layout.srNew')}</p>
    {/if}
  </div>

  <!-- Page content -->
  <main class="min-h-screen" dir={$isRtl ? 'rtl' : 'ltr'}>
    {@render children()}
  </main>

  <style>
    /* screen-reader-only */
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

    :global(body) {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
  </style>
