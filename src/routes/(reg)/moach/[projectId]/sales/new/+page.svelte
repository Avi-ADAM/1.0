<script lang="ts">
  import { isRtl } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import ComposeProduct from '$lib/components/products/ComposeProduct.svelte';

  let { data } = $props();

  const t = $derived(
    $lang === 'he'
      ? {
          title: 'יצירת מוצר חדש',
          subtitle: 'מוצר מורכב - מתכון של משימות ומשאבים',
          back: '→ חזרה למכירות'
        }
      : {
          title: 'Create new product',
          subtitle: 'Complex product - a recipe of missions and resources',
          back: '← Back to sales'
        }
  );

  function backToSales() {
    goto(`/moach/${data.projectId}/sales`);
  }

  function handleDone() {
    backToSales();
  }
</script>

<svelte:head>
  <title>
    {data.projectName ? `${data.projectName} · ` : ''}{t.title} · 1lev1
  </title>
</svelte:head>

<div class="page" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="head">
    <button class="back" type="button" onclick={backToSales}>{t.back}</button>
    <div class="titles">
      <h1>{t.title}</h1>
      <p>{t.subtitle}</p>
    </div>
  </div>

  <ComposeProduct
    projectId={data.projectId}
    mode="complex"
    availableMissions={data.availableMissions}
    availableResources={data.availableResources}
    projectMembers={data.projectMembers}
    missionTemplates={data.missionTemplates}
    resourceTemplates={data.resourceTemplates}
    onDone={handleDone}
    onCancel={backToSales}
  />
</div>

<style>
  .page {
    min-height: 100vh;
    background: var(--bg, #1f1c24);
    padding: 1rem;
    color: var(--text, #f4ecd6);
  }

  .head {
    max-width: 760px;
    margin: 0 auto 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .back {
    background: transparent;
    color: var(--gold, #d8a64b);
    border: 1px solid var(--gold, #d8a64b);
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
    font-weight: 600;
  }
  .back:hover {
    background: rgba(216, 166, 75, 0.1);
  }

  .titles h1 {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--gold, #d8a64b);
    margin: 0;
  }
  .titles p {
    margin: 0;
    color: var(--tm, #b6acb1);
    font-size: 0.9rem;
  }
</style>
