<script lang="ts">
  import { isRtl, t } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ProductForm from '$lib/components/products/ProductForm.svelte';

  let { data } = $props();

  // Arriving from the quick create-product flow (CreateProductFlow "expand
  // to full form", PLAN_USER_OFFERINGS): hydrate the saved draft and open on
  // a fixed price — the draft carries one number.
  const fromQuick = page.url.searchParams.get('fromQuick') === '1';
  const DRAFT_KEY = 'offerings.productDraft.v1';
  const quickInit = (() => {
    if (!fromQuick || typeof localStorage === 'undefined') {
      return { draft: null, pricing: 'cost' as const };
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return { draft: JSON.parse(raw)?.draft ?? null, pricing: 'fixed' as const };
    } catch {
      /* corrupt/blocked storage — open empty */
    }
    return { draft: null, pricing: 'cost' as const };
  })();

  // Opened from the manage tab, "back" returns there; the simple sales page otherwise.
  const fromManage = page.url.searchParams.get('from') === 'manage';
  const backHref = $derived(
    fromManage ? `/moach/${data.projectId}/sales/manage/products` : `/moach/${data.projectId}/sales`
  );

  function backToSales() {
    goto(backHref);
  }

  /** Saving opens the full editor — more pictures, variants and stock are added there. */
  function handleDone({ matana }: { matana: unknown }) {
    if (fromQuick && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* noop */
      }
    }
    const id = (matana as { id?: string | number } | null)?.id;
    goto(id != null ? `/moach/${data.projectId}/sales/manage/products/${id}` : backHref);
  }
</script>

<svelte:head>
  <title>
    {data.projectName ? `${data.projectName} · ` : ''}{$t('shopEditor.form.title')} · 1lev1
  </title>
</svelte:head>

<div class="page" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="head">
    <button class="back" type="button" onclick={backToSales}>{$t('shopEditor.create.back')}</button>
  </div>

  <ProductForm
    projectId={data.projectId}
    projectName={data.projectName}
    initialPricing={quickInit.pricing}
    initialDraft={quickInit.draft}
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
    background: #140b12;
    padding: 1rem 1rem 8rem;
    color: #f4ecd6;
  }

  .head {
    max-width: 1180px;
    margin: 0 auto 0.75rem;
    text-align: start;
  }
  .back {
    background: transparent;
    color: var(--gold, #d8a64b);
    border: 1px solid var(--gold, #d8a64b);
    border-radius: 8px;
    padding: 6px 12px;
    min-height: 40px;
    cursor: pointer;
    font-weight: 600;
  }
  .back:hover {
    background: rgba(216, 166, 75, 0.1);
  }
</style>
