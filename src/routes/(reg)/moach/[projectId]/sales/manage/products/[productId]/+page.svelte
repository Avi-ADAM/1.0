<script lang="ts">
  /** The seller's product page: the same form that created it (PLAN_PRODUCT_FORM_UNIFIED). */
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { t } from '$lib/translations';
  import ProductForm from '$lib/components/products/ProductForm.svelte';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';

  let { data } = $props();
  let projectId = $derived(page.params.projectId ?? '');
  // Arriving from a new product whose pictures or variants did not save.
  let initialOpen = $derived(page.url.searchParams.get('open') === 'variants' ? ('variants' as const) : null);
</script>

{#if data.editor.failed}
  <ShopNotice title={$t('shop.err.load')} action={{ label: $t('shop.err.refresh'), href: page.url.pathname }} />
{:else if data.editor.product}
  {#key data.editor.product.id}
    <div class="pf-page">
      <ProductForm
        {projectId}
        projectName={data.projectBase?.projectName ?? ''}
        product={data.editor.product}
        rikmaAxes={data.editor.rikmaAxes}
        takenSkus={data.editor.takenSkus}
        availableMissions={data.pickers.availableMissions}
        availableResources={data.pickers.availableResources}
        projectMembers={data.pickers.projectMembers}
        missionTemplates={data.pickers.missionTemplates}
        resourceTemplates={data.pickers.resourceTemplates}
        viewerId={data.viewerId}
        {initialOpen}
        onCancel={() => goto(`/moach/${projectId}/sales/manage/products`)}
      />
    </div>
  {/key}
{/if}

<style>
  .pf-page {
    background: #140b12;
    border-radius: var(--sh-radius-lg);
    padding: 16px 16px 24px;
    color: #f4ecd6;
  }
</style>
