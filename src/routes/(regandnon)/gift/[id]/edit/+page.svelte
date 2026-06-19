<script lang="ts">
  import { isRtl } from '$lib/translations';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js';
  import ComposeProduct from '$lib/components/products/ComposeProduct.svelte';

  let { data } = $props();

  // Project ID lives on data.alld.projectcreates.data[0].id from the parent
  // /gift/[id] load. We rely on the same data shape here.
  const projectId = $derived(
    data.alld?.projectcreates?.data?.[0]?.id ?? ''
  );

  const t = $derived(
    $lang === 'he'
      ? {
          missingProject: 'לא נמצא פרויקט למוצר',
          back: 'חזרה למוצר'
        }
      : {
          missingProject: 'No project linked to this product',
          back: 'Back to product'
        }
  );

  function onDone(result: { matana: unknown }) {
    const m = result?.matana as { id?: string } | undefined;
    goto('/gift/' + (m?.id ?? data.mId));
  }

  function onCancel() {
    goto('/gift/' + data.mId);
  }
</script>

<div class="container mx-auto px-4 py-6 max-w-4xl" dir={$isRtl ? 'rtl' : 'ltr'}>
  {#if projectId}
    <ComposeProduct
      {projectId}
      mode="complex"
      {onDone}
      {onCancel}
    />
  {:else}
    <div class="text-center text-pink-500 mt-10">{t.missingProject}</div>
    <button class="mx-auto block mt-4 px-4 py-2 border rounded" onclick={onCancel}>
      {t.back}
    </button>
  {/if}
</div>
