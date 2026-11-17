<script>
  /**
   * SaleLifecycle — the life-story of a product/sale chain: the product
   * (matanot), its recipe (the missions and resources it is made of — a
   * complex-product sale is itself a process, so every ingredient links to
   * its own process page), the sale records with the holder-consent state,
   * and the revenue split status.
   */
  import LifecycleStation from './LifecycleStation.svelte';
  import { mediaUrl, saleEffective } from '$lib/utils/processLifecycle';
  import { parseSiteShareNote } from '$lib/revenue/parseSiteShareNote';
  import { isRtl, t } from '$lib/translations';
  import { lang as uiLang } from '$lib/stores/lang.js';

  let { chain, projectId, lang = 'en' } = $props();


  let base = $derived(`/moach/${projectId}`);

  let matanot = $derived(chain?.matanot ?? null);
  let recipeMissions = $derived(chain?.recipeMissions ?? []);
  let recipeResources = $derived(chain?.recipeResources ?? []);
  let sales = $derived(chain?.sales ?? []);
  let hasRecipe = $derived(recipeMissions.length > 0 || recipeResources.length > 0);
  let splitSales = $derived(sales.filter((sale) => (sale.attributes?.tosplits?.data ?? []).length > 0));

  let stations = $derived(
    [
      matanot && 'product',
      hasRecipe && 'recipe',
      sales.length > 0 && 'sales',
      splitSales.length > 0 && 'split'
    ].filter(Boolean)
  );
  function isLast(key) {
    return stations[stations.length - 1] === key;
  }

  function formatDate(value) {
    if (!value) return '';
    try {
      return new Date(value).toLocaleDateString(
        $uiLang,
        { day: 'numeric', month: 'short', year: 'numeric' }
      );
    } catch {
      return '';
    }
  }

  // The process-page ref of the mission/resource chain an ingredient links to.
  function recipeMissionRef(recipe) {
    const attrs = recipe?.attributes ?? {};
    if (attrs.mesimabetahalich?.data?.id) return `bm-${attrs.mesimabetahalich.data.id}`;
    if (attrs.pendm?.data?.id) return `pendm-${attrs.pendm.data.id}`;
    return null;
  }
  function recipeResourceRef(recipe) {
    const attrs = recipe?.attributes ?? {};
    if (attrs.pmash?.data?.id) return `pmash-${attrs.pmash.data.id}`;
    return null;
  }
  function recipeMissionName(recipe) {
    const attrs = recipe?.attributes ?? {};
    return (
      attrs.mesimabetahalich?.data?.attributes?.name ??
      attrs.pendm?.data?.attributes?.name ??
      attrs.notes ??
      `#${recipe.id}`
    );
  }
  function recipeResourceName(recipe) {
    const attrs = recipe?.attributes ?? {};
    return attrs.pmash?.data?.attributes?.name ?? attrs.notes ?? `#${recipe.id}`;
  }

  function saleBadge(attrs) {
    if (attrs.holderStatus === 'open') return { text: $t('moach.saleLife.awaitingHolder'), cls: 'pl-badge--gold' };
    if (attrs.holderStatus === 'self') return { text: $t('moach.saleLife.selfReport'), cls: 'pl-badge--green' };
    if (attrs.holderStatus === 'confirmed') return { text: $t('moach.saleLife.holderConfirmed'), cls: 'pl-badge--green' };
    return { text: $t('moach.saleLife.counted'), cls: 'pl-badge--green' };
  }
</script>

<div class="pl" dir={$isRtl ? 'rtl' : 'ltr'}>
  <!-- ── 1 · Product ──────────────────────────────────────────────────────── -->
  {#if matanot}
    {@const attrs = matanot.attributes ?? {}}
    <LifecycleStation
      label={$t('moach.saleLife.product')}
      name={attrs.name ?? `#${matanot.id}`}
      status={attrs.archived
        ? { text: $t('moach.saleLife.archived'), tone: 'grey' }
        : attrs.appruved
          ? { text: $t('moach.saleLife.approved'), tone: 'green' }
          : { text: $t('moach.saleLife.pendingApproval'), tone: 'gold' }}
      createdAt={attrs.createdAt}
      href={`${base}/object/matanot/${matanot.id}`}
      hrefLabel={$t('moach.saleLife.objectPage')}
      tone="gold"
      isLast={isLast('product')}
      {lang}
    >
      <div class="pl-facts">
        <span class="pl-fact">{attrs.fixPrice ? $t('moach.saleLife.fixPrice') : $t('moach.saleLife.dynamicPrice')}</span>
        {#if attrs.price != null}<span class="pl-fact">{$t('moach.saleLife.price')}: {attrs.price}</span>{/if}
        {#if attrs.estimatedPrice != null && attrs.price == null}
          <span class="pl-fact">{$t('moach.saleLife.estimated')}: {attrs.estimatedPrice}</span>
        {/if}
        {#if attrs.quant != null}<span class="pl-fact">{$t('moach.saleLife.quant')}: {attrs.quant}</span>{/if}
        {#if attrs.kindOf}<span class="pl-fact">{attrs.kindOf}</span>{/if}
      </div>
    </LifecycleStation>
  {/if}

  <!-- ── 2 · Recipe — the missions & resources the product is made of ────── -->
  {#if hasRecipe}
    <LifecycleStation label={$t('moach.saleLife.recipe')} name="" tone="sky" isLast={isLast('recipe')} {lang}>
      {#if recipeMissions.length > 0}
        <div class="pl-votes">
          <h4 class="pl-subheading">{$t('moach.saleLife.recipeMissions')} ({recipeMissions.length})</h4>
          <div class="pl-cards">
            {#each recipeMissions as recipe (recipe.id)}
              {@const attrs = recipe.attributes ?? {}}
              {@const ref = recipeMissionRef(recipe)}
              <div class="pl-card">
                <div class="pl-card-head">
                  <span class="pl-card-name">{recipeMissionName(recipe)}</span>
                  {#if attrs.hoursPerUnit != null}
                    <span class="pl-fact">{attrs.hoursPerUnit} {$t('moach.saleLife.hours')} {$t('moach.saleLife.perUnit')}</span>
                  {/if}
                  {#if attrs.assignedMember?.data?.attributes?.username}
                    <span class="pl-fact">{$t('moach.saleLife.by')}: {attrs.assignedMember.data.attributes.username}</span>
                  {/if}
                  <span class="pl-card-links">
                    {#if ref}
                      <a class="pl-action" href={`${base}/processes/${ref}`}>{$t('moach.saleLife.processOf')}</a>
                    {/if}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
      {#if recipeResources.length > 0}
        <div class="pl-votes">
          <h4 class="pl-subheading">{$t('moach.saleLife.recipeResources')} ({recipeResources.length})</h4>
          <div class="pl-cards">
            {#each recipeResources as recipe (recipe.id)}
              {@const attrs = recipe.attributes ?? {}}
              {@const ref = recipeResourceRef(recipe)}
              <div class="pl-card">
                <div class="pl-card-head">
                  <span class="pl-card-name">{recipeResourceName(recipe)}</span>
                  {#if attrs.quantityPerUnit != null}
                    <span class="pl-fact">{attrs.quantityPerUnit} {$t('moach.saleLife.perUnit')}</span>
                  {/if}
                  {#if attrs.pricePerUnit != null}
                    <span class="pl-fact">{$t('moach.saleLife.price')}: {attrs.pricePerUnit}</span>
                  {/if}
                  <span class="pl-card-links">
                    {#if ref}
                      <a class="pl-action" href={`${base}/processes/${ref}`}>{$t('moach.saleLife.processOf')}</a>
                    {/if}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </LifecycleStation>
  {/if}

  <!-- ── 3 · Sale records — holder consent, donations, site-share ─────────── -->
  {#if sales.length > 0}
    <LifecycleStation label={$t('moach.saleLife.sales')} name="" tone="rose" isLast={isLast('sales')} {lang}>
      <div class="pl-cards">
        {#each sales as sale (sale.id)}
          {@const attrs = sale.attributes ?? {}}
          {@const holder = attrs.users_permissions_user?.data}
          {@const siteShare = attrs.isSiteShareIncome ? parseSiteShareNote(attrs.note) : null}
          {@const badge = saleBadge(attrs)}
          <div class="pl-card" class:pl-card--pending={!saleEffective(attrs)}>
            <div class="pl-card-head">
              <span class="pl-card-name">{attrs.in != null ? attrs.in : '—'}</span>
              {#if attrs.date}<span class="pl-fact">{formatDate(attrs.date)}</span>{/if}
              {#if holder}
                <span class="pl-fact pl-fact--user">
                  {#if holder.attributes?.profilePic?.data?.attributes?.url}
                    <img class="pl-avatar" src={mediaUrl(holder.attributes.profilePic.data.attributes.url)} alt={holder.attributes.username} loading="lazy" />
                  {/if}
                  {$t('moach.saleLife.holder')}: {holder.attributes?.username}
                </span>
              {/if}
              <span class="pl-badge {badge.cls}">{badge.text}</span>
              {#if attrs.isDonation}<span class="pl-badge pl-badge--blue">💗 {$t('moach.saleLife.donation')}</span>{/if}
              {#if attrs.isSiteShareIncome}<span class="pl-badge pl-badge--blue">{$t('moach.saleLife.siteShare')}</span>{/if}
              <span class="pl-badge {attrs.splited ? 'pl-badge--green' : 'pl-badge--grey'}">
                {attrs.splited ? $t('moach.saleLife.splited') : $t('moach.saleLife.notSplited')}
              </span>
              <span class="pl-card-links">
                <a class="pl-action" href={`${base}/object/sale/${sale.id}`}>{$t('moach.saleLife.objectPage')}</a>
              </span>
            </div>
            {#if siteShare}
              <p class="pl-note">
                {$t('moach.saleLife.siteShare')} · {$t('moach.saleLife.siteSharePaid')}: {siteShare.paid ?? '—'}
                {#if siteShare.fromProjectId}
                  · {$t('moach.saleLife.siteShareFrom')} #{siteShare.fromProjectId}
                {/if}
                {#if siteShare.reason}
                  · {siteShare.reason}
                {/if}
              </p>
            {:else if attrs.note && !attrs.isSiteShareIncome}
              <p class="pl-note">{attrs.note}</p>
            {/if}
          </div>
        {/each}
      </div>
    </LifecycleStation>
  {/if}

  <!-- ── 4 · Revenue split ────────────────────────────────────────────────── -->
  {#if splitSales.length > 0}
    <LifecycleStation label={$t('moach.saleLife.split')} name="" tone="green" isLast={isLast('split')} {lang}>
      <div class="pl-cards">
        {#each splitSales as sale (sale.id)}
          {#each sale.attributes?.tosplits?.data ?? [] as tosplit (tosplit.id)}
            <div class="pl-card">
              <div class="pl-card-head">
                <span class="pl-card-name">#{tosplit.id}</span>
                <span class="pl-badge {tosplit.attributes?.finished ? 'pl-badge--green' : 'pl-badge--gold'}">
                  {tosplit.attributes?.finished ? $t('moach.saleLife.splited') : $t('moach.saleLife.notSplited')}
                </span>
                <span class="pl-card-links">
                  <a class="pl-action" href={`${base}/splits/${tosplit.id}`}>{$t('moach.saleLife.toSplit')}</a>
                </span>
              </div>
            </div>
          {/each}
        {/each}
      </div>
    </LifecycleStation>
  {/if}
</div>

<style>
  /* Shares the .pl-* vocabulary of ProcessLifecycle so both chain kinds render
     identically inside the process page card. */
  .pl { display: flex; flex-direction: column; padding: 14px 16px; }

  .pl-facts { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }

  .pl-fact {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--pcv-text-2, #78716c);
    background: var(--badge-grey-bg, rgba(107,114,128,.08));
    padding: 2px 8px;
    border-radius: 6px;
  }
  .pl-fact--user { font-weight: 600; color: var(--pcv-text, #1c1917); }

  .pl-avatar { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

  .pl-subheading {
    margin: 0;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--pcv-text-3, #a8a29e);
  }

  .pl-votes { display: flex; flex-direction: column; gap: 6px; }

  .pl-cards { display: flex; flex-direction: column; gap: 8px; }

  .pl-card {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 10px;
    border: 1px solid var(--pcv-node-border, #e7e5e4);
    background: var(--pcv-card, #ffffff);
  }
  .pl-card--pending { border-style: dashed; opacity: 0.85; }

  .pl-card-head { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }

  .pl-card-name { font-size: 12px; font-weight: 700; color: var(--pcv-text, #1c1917); }

  .pl-card-links { display: inline-flex; align-items: center; gap: 4px; margin-inline-start: auto; }

  .pl-action {
    font-size: 11px;
    font-weight: 600;
    color: var(--badge-gold-text, #b45309);
    text-decoration: none;
    padding: 2px 8px;
    border-radius: 9999px;
    background: var(--badge-gold-bg, rgba(245,158,11,.08));
    transition: filter 0.12s;
    white-space: nowrap;
  }
  .pl-action:hover { filter: brightness(1.1); }

  .pl-badge {
    display: inline-flex;
    align-items: center;
    padding: 1px 7px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }
  .pl-badge--blue  { background: var(--badge-sky-bg, rgba(2,132,199,.10));    color: var(--badge-sky-text, #0369a1); }
  .pl-badge--gold  { background: var(--badge-gold-bg, rgba(217,119,6,.10));   color: var(--badge-gold-text, #b45309); }
  .pl-badge--green { background: var(--badge-green-bg, rgba(5,150,105,.10));  color: var(--badge-green-text, #065f46); }
  .pl-badge--grey  { background: var(--badge-grey-bg, rgba(107,114,128,.10)); color: var(--badge-grey-text, #6b7280); }

  .pl-note {
    margin: 0;
    font-size: 11px;
    line-height: 1.45;
    color: var(--pcv-text-2, #78716c);
  }
</style>
