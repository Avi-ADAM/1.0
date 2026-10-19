<script lang="ts">
  /** The seller's product editor — the screen is `ProductEditor` (canvas "DesktopProduct"). */
  import { page } from '$app/state';
  import { t } from '$lib/translations';
  import ProductEditor from '$lib/components/shop/ProductEditor.svelte';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';

  let { data } = $props();
  let projectId = $derived(page.params.projectId ?? '');
</script>

{#if data.editor.failed}
  <ShopNotice title={$t('shop.err.load')} action={{ label: $t('shop.err.refresh'), href: page.url.pathname }} />
{:else if data.editor.product}
  {#key data.editor.product.id}
    <ProductEditor
      {projectId}
      product={data.editor.product}
      rikmaAxes={data.editor.rikmaAxes}
      takenSkus={data.editor.takenSkus}
    />
  {/key}
{/if}
