<script>
  import { isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import SaleComponent from '$lib/components/sales/SaleComponent.svelte';
  import CreateProductFlow from '$lib/components/offerings/CreateProductFlow.svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { toast } from 'svelte-sonner';
  import { invalidateAll } from '$app/navigation';

  let { data } = $props();
  let creatingProduct = $state(false);

  // PLAN_sale_holder_consent — my open sale reports still awaiting the
  // claimed holder's consent (or my turn to respond after a counter).
  let openSaleClaims = $derived(data.openSaleClaims ?? []);
  let myTurnClaims = $derived(openSaleClaims.filter((c) => c.myTurn));
  let waitingClaims = $derived(openSaleClaims.filter((c) => !c.myTurn));

  let loading = $state(false);
  let error = $state(null);
  let products = $state([...data.products]);
  let filteredProducts = $state([...data.products]);
  let searchTerm = $state('');
  let selectedProject = $state('all');
  let activeSales = $state(new Map());
  let saleOperationId = $state(0);
  let expandedCards = $state(new Set());

  // Sync products from server after invalidateAll refresh
  $effect(() => {
    products = [...data.products];
  });

  // Localization
  const texts = {
    he: {
      title: 'המוצרים שלי',
      subtitle: 'כל המוצרים שלך מכל הרקמות — וניהול המכירות ממקום אחד',
      newProduct: 'מוצר חדש',
      search: 'חיפוש מוצרים...',
      filterByProject: 'סינון לפי פרויקט',
      allProjects: 'כל הפרויקטים',
      noProducts: 'לא נמצאו מוצרים',
      noProductsDesc: 'אין לך מוצרים זמינים למכירה כרגע',
      loading: 'המוצרים נטענים...',
      error: 'שגיאה בטעינת המוצרים',
      productName: 'שם המוצר',
      price: 'מחיר',
      quantity: 'כמות זמינה',
      project: 'פרויקט',
      actions: 'פעולות',
      sellButton: 'מכירה',
      shekel: '₪',
      refresh: 'רענן נתונים',
      processing: 'עיבוד מכירה...',
      expand: 'הרחבה',
      collapse: 'כיווץ',
      share: 'שיתוף',
      viewProduct: 'צפייה במוצר',
      type: 'סוג',
      unlimited: 'ליחידה - ללא הגבלה',
      outOfStock: 'אזל מהמלאי',
      tryAgain: 'לא להתייאש, לנסות שוב'
    },
    en: {
      title: 'My Products',
      subtitle: 'All your products from every weave — and sales management in one place',
      newProduct: 'New product',
      search: 'Search products...',
      filterByProject: 'Filter by project',
      allProjects: 'All Projects',
      noProducts: 'No products found',
      noProductsDesc: 'You have no products available for sale at the moment',
      loading: 'Loading products...',
      error: 'Error loading products',
      productName: 'Product Name',
      price: 'Price',
      quantity: 'Available Quantity',
      project: 'Project',
      actions: 'Actions',
      sellButton: 'Sell',
      shekel: '₪',
      refresh: 'Refresh data',
      processing: 'Processing sale...',
      expand: 'Expand',
      collapse: 'Collapse',
      share: 'Share',
      viewProduct: 'View Product',
      type: 'Type',
      unlimited: 'Unlimited',
      outOfStock: 'Out of Stock',
      tryAgain: 'Try Again'
    }
  };

  let t = $derived(texts[$lang] || texts.he);

  function filterProducts() {
    let filtered = products;

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((product) =>
        product.attributes.name.toLowerCase().includes(search)
      );
    }

    // Filter by project
    if (selectedProject !== 'all') {
      filtered = filtered.filter(
        (product) =>
          product.attributes.projectcreates?.data?.[0]?.id === selectedProject
      );
    }

    filteredProducts = filtered;
  }

  // Reactive filtering
  $effect(() => {
    filterProducts();
  });

  function handleSaleStart(productId) {
    // Generate unique operation ID and track the sale
    const operationId = ++saleOperationId;
    activeSales.set(productId, operationId);
    return operationId;
  }

  function handleSaleSuccess(productId, saleData, operationId) {
    // Check if this is still the active operation for this product
    if (activeSales.get(productId) !== operationId) {
      console.warn('Ignoring outdated sale success callback');
      return;
    }

    // Clear the active sale
    activeSales.delete(productId);

    // Update product quantity after successful sale
    const productIndex = products.findIndex((p) => p.id === productId);
    if (productIndex !== -1) {
      const currentQuantity = products[productIndex].attributes.quant;

      // Don't update quantity if it's unlimited (-1)
      if (currentQuantity !== -1) {
        const newQuantity = Math.max(0, currentQuantity - saleData.unit);
        products[productIndex].attributes.quant = newQuantity;
      }
      products = [...products]; // Trigger reactivity
      filterProducts();

      // Show success message with details
      const productName = products[productIndex].attributes.name;
      toast.success(
        $lang === 'he'
          ? `מכירה של ${saleData.unit} יחידות מ"${productName}" בוצעה בהצלחה!`
          : `Sale of ${saleData.unit} units of "${productName}" completed successfully!`
      );
    } else {
      toast.success(
        $lang === 'he' ? 'המכירה בוצעה בהצלחה!' : 'Sale completed successfully!'
      );
    }
  }

  function handleSaleError(productId, operationId, error) {
    // Check if this is still the active operation for this product
    if (activeSales.get(productId) !== operationId) {
      console.warn('Ignoring outdated sale error callback');
      return;
    }

    // Clear the active sale
    activeSales.delete(productId);

    // Show error message
    const errorMessage =
      error ||
      ($lang === 'he' ? 'שגיאה בביצוע המכירה' : 'Error processing sale');
    toast.error(errorMessage);
  }

  function isSaleInProgress(productId) {
    return activeSales.has(productId);
  }

  function toggleCardExpansion(productId) {
    if (expandedCards.has(productId)) {
      expandedCards.delete(productId);
    } else {
      expandedCards.add(productId);
    }
    expandedCards = new Set(expandedCards); // Trigger reactivity
  }

  function isCardExpanded(productId) {
    return expandedCards.has(productId);
  }

  function shareProduct(productId, productName) {
    const url = `${window.location.origin}/gift/${productId}`;

    if (navigator.share) {
      navigator
        .share({
          title: productName,
          text:
            $lang === 'he'
              ? `צפה במוצר: ${productName}`
              : `Check out this product: ${productName}`,
          url: url
        })
        .catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard
        .writeText(url)
        .then(() => {
          toast.success(
            $lang === 'he' ? 'הקישור הועתק ללוח' : 'Link copied to clipboard'
          );
        })
        .catch(() => {
          toast.error(
            $lang === 'he' ? 'שגיאה בהעתקת הקישור' : 'Failed to copy link'
          );
        });
    }
  }

  function viewProduct(productId) {
    window.open(`/gift/${productId}`, '_blank');
  }

  async function refreshProductData() {
    loading = true;
    try {
      await invalidateAll();
      toast.success($lang === 'he' ? 'נתוני המוצרים עודכנו' : 'Product data refreshed');
    } catch {
      toast.error(t.error);
    } finally {
      loading = false;
    }
  }

  function getProjectName(product) {
    return (
      product.attributes.projectcreates?.data?.[0]?.attributes?.projectName ||
      'Unknown Project'
    );
  }
</script>

<svelte:head>
  <title>{t.title}</title>
</svelte:head>

<main class="page-wrap" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="page-top anim">
    <div>
      <h1 class="page-title">{t.title} <span class="accent">🎁</span></h1>
      <p class="page-sub">{t.subtitle}</p>
    </div>
    <button class="new-btn" onclick={() => (creatingProduct = true)}>
      ➕ {t.newProduct}
    </button>
  </div>

  {#if openSaleClaims.length > 0}
    <div class="claims-banner anim">
      {#if myTurnClaims.length > 0}
        <p class="claims-line claims-turn">
          {$lang === 'he'
            ? `יש לך ${myTurnClaims.length} דיווח${myTurnClaims.length > 1 ? 'ים' : ''} שממתין${myTurnClaims.length > 1 ? 'ים' : ''} לתגובתך בעמוד הלב`
            : `You have ${myTurnClaims.length} sale report${myTurnClaims.length > 1 ? 's' : ''} awaiting your response on the heart page`}
        </p>
      {/if}
      {#if waitingClaims.length > 0}
        <p class="claims-line claims-waiting">
          {$lang === 'he'
            ? `${waitingClaims.length} דיווח${waitingClaims.length > 1 ? 'ים' : ''} ממתין${waitingClaims.length > 1 ? 'ים' : ''} להסכמת מחזיק הכסף`
            : `${waitingClaims.length} sale report${waitingClaims.length > 1 ? 's' : ''} awaiting the holder's consent`}
        </p>
      {/if}
    </div>
  {/if}

  {#if loading}
    <div class="state-block">
      <RingLoader size="60" color="var(--gold)" />
      <p class="loading-text">{t.loading}</p>
    </div>
  {:else if error}
    <div class="state-block">
      <div class="error-box">{error}</div>
      <button class="retry-btn" onclick={refreshProductData}>{t.tryAgain}</button>
    </div>
  {:else}
    <!-- Filters and Search -->
    <div class="filters-bar anim">
      <input
        type="text"
        id="search-input"
        class="search-input"
        bind:value={searchTerm}
        placeholder={t.search}
      />

      <label for="project-filter" class="sr-only">{t.filterByProject}</label>
      <select id="project-filter" bind:value={selectedProject} class="project-select">
        <option value="all">{t.allProjects}</option>
        {#each data.projects as project}
          <option value={project.id}>{project.name}</option>
        {/each}
      </select>

      <button
        onclick={refreshProductData}
        class="refresh-btn"
        title={t.refresh}
        aria-label={t.refresh}
      >
        <svg class="icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          ></path>
        </svg>
      </button>
    </div>

    <div class="section-label">{t.productName}</div>

    <!-- Products Grid -->
    {#if filteredProducts.length === 0}
      <div class="empty">
        <p class="empty-text">{t.noProducts}</p>
        <p class="empty-sub">{t.noProductsDesc}</p>
      </div>
    {:else}
      <div class="products-grid">
        {#each filteredProducts as product (product.id)}
          <div class="product-card">
            <div class="product-head">
              <div class="product-info">
                <h3 class="product-name">{product.attributes.name}</h3>
                <p class="product-project">{getProjectName(product)}</p>
              </div>
              <div class="product-actions">
                <button
                  onclick={() => shareProduct(product.id, product.attributes.name)}
                  class="icon-btn"
                  title={t.share}
                  aria-label={t.share}
                >
                  <svg class="icon-svg-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                    ></path>
                  </svg>
                </button>

                <button
                  onclick={() => viewProduct(product.id)}
                  class="icon-btn"
                  title={t.viewProduct}
                  aria-label={t.viewProduct}
                >
                  <svg class="icon-svg-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>

            <div class="product-details">
              <div class="detail-row">
                <span class="dl">{t.price}:</span>
                <span class="dv gold">{product.attributes.price} {t.shekel}</span>
              </div>
              <div class="detail-row">
                <span class="dl">{t.quantity}:</span>
                <span class="dv">
                  {product.attributes.quant === -1 ? t.unlimited : product.attributes.quant}
                </span>
              </div>
              <div class="detail-row">
                <span class="dl">{t.type}:</span>
                <span class="dv">{product.attributes.kindOf}</span>
              </div>
            </div>

            <button class="expand-btn" onclick={() => toggleCardExpansion(product.id)}>
              <span>{isCardExpanded(product.id) ? t.collapse : t.expand}</span>
              <svg
                class="chevron"
                class:open={isCardExpanded(product.id)}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>

            {#if isCardExpanded(product.id)}
              <div class="sale-panel">
                {#if product.attributes.quant > 0 || product.attributes.quant === -1}
                  {@const projectId = product.attributes.projectcreates?.data?.[0]?.id}
                  {@const projectUsers = data.projectUsersMap?.[projectId] ?? []}
                  {#if isSaleInProgress(product.id)}
                    <div class="sale-processing" dir={$isRtl ? 'rtl' : 'ltr'}>
                      <div class="spinner"></div>
                      <span>{t.processing}</span>
                    </div>
                  {:else}
                    <SaleComponent
                      productId={product.id}
                      productName={product.attributes.name}
                      availableQuantity={product.attributes.quant}
                      price={product.attributes.price}
                      kindOf={product.attributes.kindOf}
                      projectId={projectId || ''}
                      {projectUsers}
                      onStart={() => handleSaleStart(product.id)}
                      onDone={(saleData, operationId) =>
                        handleSaleSuccess(product.id, saleData, operationId)}
                      onError={(error, operationId) =>
                        handleSaleError(product.id, operationId, error)}
                    />
                  {/if}
                {:else}
                  <p class="out-of-stock">{t.outOfStock}</p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</main>

{#if creatingProduct}
  <CreateProductFlow
    uid={data.uid}
    onDone={async () => {
      creatingProduct = false;
      await invalidateAll();
    }}
    onClose={() => (creatingProduct = false)}
  />
{/if}

<style>
  /* .page-top / .page-title / .page-sub / .accent are global — see app.postcss */

  .new-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    background: var(--gold-d, rgba(212, 175, 55, 0.18));
    color: var(--gold-l);
    border: 1px solid var(--gold, rgba(212, 175, 55, 0.4));
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    white-space: nowrap;
  }
  .new-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  }

  /* ── Claims banner ── */
  .claims-banner {
    max-width: 48rem;
    margin: 0 auto 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .claims-line {
    text-align: center;
    padding: 8px 16px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 0.9rem;
  }
  .claims-turn {
    background: var(--pink-d);
    color: var(--pink-l);
    border: 1px solid var(--pink);
  }
  .claims-waiting {
    background: var(--gold-d);
    color: var(--gold-l);
    border: 1px solid var(--border-g);
  }

  /* ── Loading / error state ── */
  .state-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 80px 24px;
  }
  .loading-text {
    color: var(--tm);
    font-size: 14px;
  }
  .error-box {
    background: var(--pink-d);
    border: 1px solid var(--pink);
    color: var(--text);
    padding: 12px 20px;
    border-radius: 10px;
    max-width: 420px;
    text-align: center;
  }
  .retry-btn {
    padding: 10px 22px;
    border-radius: 10px;
    background: var(--gold-d);
    color: var(--gold-l);
    border: 1px solid var(--gold);
    font-weight: 700;
    cursor: pointer;
  }

  /* ── Filters bar ── */
  .filters-bar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: var(--s1);
    border: 1px solid var(--border);
    border-radius: var(--rl);
    padding: 18px 20px;
    margin-bottom: 24px;
  }
  @media (min-width: 768px) {
    .filters-bar {
      flex-direction: row;
      align-items: center;
    }
  }
  .search-input,
  .project-select {
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--s2);
    color: var(--text);
    font-size: 14px;
    font-family: 'Heebo', sans-serif;
  }
  .search-input {
    flex: 1;
    min-width: 0;
  }
  .search-input::placeholder {
    color: var(--tm);
  }
  .search-input:focus,
  .project-select:focus {
    outline: none;
    border-color: var(--gold);
  }
  .project-select {
    min-width: 180px;
  }
  .project-select option {
    background: var(--s2);
    color: var(--text);
  }
  .refresh-btn {
    flex-shrink: 0;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--s2);
    color: var(--tm);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .refresh-btn:hover {
    border-color: var(--gold);
    color: var(--gold-l);
    background: var(--gold-d);
  }
  .icon-svg {
    width: 20px;
    height: 20px;
  }
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

  /* ── Empty state ── */
  .empty {
    text-align: center;
    color: var(--tm);
    font-size: 14px;
    padding: 48px 24px;
    background: var(--s2);
    border: 1px dashed var(--border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .empty-text {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
  }
  .empty-sub {
    font-size: 13px;
    color: var(--tm);
    margin: 0;
  }

  /* ── Products grid ── */
  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
    gap: 18px;
    margin-bottom: 40px;
  }
  .product-card {
    background: var(--s1);
    border: 1px solid var(--border);
    border-radius: var(--rl);
    padding: 20px;
    transition: all 0.2s;
  }
  .product-card:hover {
    border-color: var(--border-g);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  }
  .product-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 14px;
  }
  .product-info {
    min-width: 0;
  }
  .product-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .product-project {
    font-size: 12px;
    color: var(--tm);
  }
  .product-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  .icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--s2);
    border: 1px solid var(--border);
    color: var(--tm);
    cursor: pointer;
    transition: all 0.2s;
  }
  .icon-btn:hover {
    border-color: var(--gold);
    color: var(--gold-l);
  }
  .icon-svg-sm {
    width: 16px;
    height: 16px;
  }

  .product-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }
  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
  }
  .dl {
    color: var(--tm);
  }
  .dv {
    font-weight: 700;
    color: var(--text);
  }
  .dv.gold {
    color: var(--gold-l);
  }

  .expand-btn {
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    background: var(--gold-d);
    border: 1px solid var(--border-g);
    color: var(--gold-l);
    font-weight: 600;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .expand-btn:hover {
    background: rgba(200, 150, 12, 0.28);
  }
  .chevron {
    width: 14px;
    height: 14px;
    transition: transform 0.2s;
  }
  .chevron.open {
    transform: rotate(180deg);
  }

  .sale-panel {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--border);
  }
  .sale-processing {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 0;
    color: var(--tm);
    font-size: 13px;
  }
  [dir='rtl'] .sale-processing {
    flex-direction: row-reverse;
  }
  .spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--border);
    border-bottom-color: var(--gold);
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .out-of-stock {
    text-align: center;
    padding: 12px 0;
    color: #f87171;
    font-weight: 700;
    font-size: 13px;
  }

  @media (max-width: 600px) {
    .products-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
