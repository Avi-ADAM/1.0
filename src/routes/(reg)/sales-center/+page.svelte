<script>
  import { onMount } from 'svelte';
  import { lang } from '$lib/stores/lang.js';
  import { salesService } from '$lib/services/salesService.js';
  import SaleComponent from '$lib/components/sales/SaleComponent.svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { toast } from 'svelte-sonner';
  import { page } from '$app/state';

  let loading = $state(true);
  let error = $state(null);
  let products = $state([]);
  let filteredProducts = $state([]);
  let searchTerm = $state('');
  let selectedProject = $state('all');
  let projects = $state([]);
  let userId = $state(null);
  let token = $state(null);
  let projectUsersCache = $state(new Map());
  let activeSales = $state(new Map()); // Track active sale operations
  let saleOperationId = $state(0); // Counter for unique operation IDs
  let expandedCards = $state(new Set()); // Track expanded cards

  // Localization
  const texts = {
    he: {
      title: 'מרכז מכירות',
      subtitle: 'ניהול כל המכירות שלך ממקום אחד',
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
      unlimited: 'ללא הגבלה'
    },
    en: {
      title: 'Sales Center',
      subtitle: 'Manage all your sales from one place',
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
      unlimited: 'Unlimited'
    }
  };

  let t = $derived(texts[$lang] || texts.he);

  // Initialize authentication
  onMount(async () => {
    try {
      // Get authentication data from cookies
      

      const cookieValueId = document.cookie
        .split('; ')
        .find((row) => row.startsWith('id='))
        ?.split('=')[1];

      if ( !cookieValueId) {
        error = 'Authentication required';
        loading = false;
        return;
      }

      token = page.data.tok;
      userId = cookieValueId;

      await loadProducts();
    } catch (e) {
      console.error('Error initializing sales center:', e);
      error = t.error;
      loading = false;
    }
  });

  async function loadProducts() {
    try {
      loading = true;
      error = null;

      const result = await salesService.getUserSellableProducts(userId, token, {
        useCache: true,
        cacheTTL: 15,
        includeLoadingState: true
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const { products: userProducts, projects: userProjects } = result.data;
      products = userProducts;
      projects = userProjects;

      // Clear any stale active sales when reloading products
      activeSales.clear();

      // Show cache indicator if data is from cache
      if (result.fromCache) {
        toast.info(
          $lang === 'he' ? 'נתונים נטענו מהמטמון' : 'Data loaded from cache'
        );
      }

      filterProducts();
    } catch (e) {
      console.error('Error loading products:', e);
      error = t.error;
      toast.error(t.error);

      // Show retry button for retryable errors
      if (e.retryable) {
        toast.error(
          $lang === 'he'
            ? 'שגיאה זמנית - נסה שוב'
            : 'Temporary error - please retry'
        );
      }
    } finally {
      loading = false;
    }
  }

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
    if (products.length > 0) {
      filterProducts();
    }
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
    // Clear cache and reload products
    salesService.clearAllCache();
    await loadProducts();

    toast.success(
      $lang === 'he' ? 'נתוני המוצרים עודכנו' : 'Product data refreshed'
    );
  }

  function getProjectName(product) {
    return (
      product.attributes.projectcreates?.data?.[0]?.attributes?.projectName ||
      'Unknown Project'
    );
  }

  async function getProjectUsers(product) {
    const projectId = product.attributes.projectcreates?.data?.[0]?.id;
    if (!projectId) return [];

    // Check cache first
    if (projectUsersCache.has(projectId)) {
      return projectUsersCache.get(projectId);
    }

    try {
      const result = await salesService.getProjectProducts(projectId, token, {
        useCache: true,
        cacheTTL: 30
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      const users = result.data.project.users;
      projectUsersCache.set(projectId, users);
      return users;
    } catch (error) {
      console.error('Failed to fetch project users:', error);
      return [];
    }
  }
</script>

<svelte:head>
  <title>{t.title}</title>
</svelte:head>

<div
  class="min-h-screen bg-gradient-to-br from-gra to-grb p-4"
  dir={$lang === 'he' ? 'rtl' : 'ltr'}
>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1
        class="text-4xl font-bold text-royal-blue mb-2 font-litt drop-shadow-lg glow-text"
      >
        {t.title}
      </h1>
      <p class="text-lg text-royal-blue/90 drop-shadow glow-text">
        {t.subtitle}
      </p>
    </div>

    {#if loading}
      <div class="flex flex-col items-center justify-center py-20">
        <RingLoader size="60" color="var(--gold)" />
        <p class="mt-4 text-royal-blue font-medium drop-shadow glow-text">
          {t.loading}
        </p>
      </div>
    {:else if error}
      <div class="text-center py-20">
        <div
          class="bg-red-500/20 border border-red-400 text-royal-blue px-4 py-3 rounded mb-4 max-w-md mx-auto backdrop-blur-sm glow-text"
        >
          {error}
        </div>
        <button
          class="bg-gold hover:bg-gold/80 text-grb font-bold px-6 py-2 rounded transition-colors"
          onclick={loadProducts}
        >
          {$lang === 'he' ? 'לא להתייאש לנסות שוב' : 'Try Again'}
        </button>
      </div>
    {:else}
      <!-- Filters and Search -->
      <div
        class="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8 shadow-lg border border-white/20"
      >
        <div class="flex flex-col md:flex-row gap-4 items-center">
          <!-- Search -->
          <div class="flex-1 min-w-0">
            <div class="textinput">
              <input
                type="text"
                id="search-input"
                class="input w-full"
                bind:value={searchTerm}
                placeholder={t.search}
                required
              />
              <div class="line"></div>
            </div>
          </div>

          <!-- Project Filter -->
          <div class="min-w-48">
            <label for="project-filter" class="sr-only"
              >{t.filterByProject}</label
            >
            <select
              id="project-filter"
              bind:value={selectedProject}
              class="w-full p-3 rounded border border-white/30 bg-white/10 backdrop-blur-sm text-royal-blue glow-text focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold"
            >
              <option value="all">{t.allProjects}</option>
              {#each projects as project}
                <option value={project.id}>{project.name}</option>
              {/each}
            </select>
          </div>

          <!-- Refresh Button -->
          <div class="flex-shrink-0">
            <button
              onclick={refreshProductData}
              class="p-3 rounded border border-white/30 bg-white/10 backdrop-blur-sm text-royal-blue glow-text hover:bg-gold hover:text-grb hover:border-gold focus:outline-none focus:ring-2 focus:ring-gold transition-all duration-200"
              title={t.refresh}
              aria-label={t.refresh}
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Products Grid -->
      {#if filteredProducts.length === 0}
        <div class="text-center py-20">
          <div
            class="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md mx-auto border border-white/20"
          >
            <h3
              class="text-xl font-bold text-royal-blue mb-2 drop-shadow glow-text"
            >
              {t.noProducts}
            </h3>
            <p class="text-royal-blue/80 drop-shadow glow-text">
              {t.noProductsDesc}
            </p>
          </div>
        </div>
      {:else}
        <div               dir={$lang === 'he' ? 'rtl' : 'ltr'}
 class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {#each filteredProducts as product (product.id)}
            <div
              class="bg-white/10 backdrop-blur-md rounded-lg shadow-lg border border-white/20 hover:shadow-xl hover:bg-white/15 transition-all duration-300 overflow-hidden"
              dir={$lang === 'he' ? 'rtl' : 'ltr'}
            >
              <!-- Product Header -->
              <div class="p-6 pb-4"    dir={$lang === 'he' ? 'rtl' : 'ltr'}>
                <div
                  class="flex flex-row justify-between items-start mb-4"

               dir={$lang === 'he' ? 'rtl' : 'ltr'}>
                  <div
                    class="flex-1 min-w-0 {$lang === 'he'
                      ? 'text-right'
                      : 'text-left'}"
                  >
                    <h3
                      class="text-xl font-bold text-royal-blue mb-2 font-litt truncate drop-shadow glow-text"
                    >
                      {product.attributes.name}
                    </h3>
                    <p class="text-sm text-royal-blue/70 drop-shadow glow-text">
                      {getProjectName(product)}
                    </p>
                  </div>

                  <!-- Action Buttons -->
                  <div
                    class="flex gap-2 "
                      dir={$lang === 'he' ? 'rtl' : ''}
                  >
                    <button
                      onclick={() =>
                        shareProduct(product.id, product.attributes.name)}
                      class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-royal-blue glow-text border border-white/30 hover:border-white/50 transition-all duration-200"
                      title={t.share}
                      aria-label={t.share}
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                      class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-royal-blue glow-text border border-white/30 hover:border-white/50 transition-all duration-200"
                      title={t.viewProduct}
                      aria-label={t.viewProduct}
                    >
                      <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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

                <!-- Product Details -->
                <div class="space-y-3 mb-4">
                  <div
                    class="flex justify-between items-center "
                  >
                    <span class="text-royal-blue/80 text-sm glow-text"
                      >{t.price}:</span
                    >
                    <span
                      class="font-bold text-royal-blue text-lg drop-shadow glow-text"
                    >
                      {product.attributes.price}
                      {t.shekel}
                    </span>
                  </div>

                  <div
                    class="flex justify-between items-center "
                  >
                    <span class="text-royal-blue/80 text-sm glow-text"
                      >{t.quantity}:</span
                    >
                    <span
                      class="font-bold text-royal-blue drop-shadow glow-text"
                    >
                      {product.attributes.quant === -1 ? t.unlimited : product.attributes.quant}
                    </span>
                  </div>

                  <div
                    class="flex justify-between items-center "
                  >
                    <span class="text-royal-blue/80 text-sm glow-text"
                      >{t.type}:</span
                    >
                    <span
                      class="text-royal-blue capitalize drop-shadow glow-text"
                    >
                      {product.attributes.kindOf}
                    </span>
                  </div>
                </div>

                <!-- Expand/Collapse Button -->
                <button
                  onclick={() => toggleCardExpansion(product.id)}
                  class="w-full py-2 px-4 rounded-lg bg-gold/20 hover:bg-gold/30 text-royal-blue glow-text border border-gold/50 hover:border-gold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <span class="font-medium">
                    {isCardExpanded(product.id) ? t.collapse : t.expand}
                  </span>
                  <svg
                    class="w-4 h-4 transition-transform duration-200 {isCardExpanded(
                      product.id
                    )
                      ? 'rotate-180'
                      : ''}"
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
              </div>

              <!-- Expandable Sale Section -->
              {#if isCardExpanded(product.id)}
                <div class="px-6 pb-6 border-t border-white/20 pt-4 bg-white/5">
                  {#if product.attributes.quant > 0 || product.attributes.quant === -1}
                    {#await getProjectUsers(product)}
                      <div class="text-center py-4">
                        <div class="animate-pulse">
                          <div
                            class="h-4 bg-white/20 rounded w-3/4 mx-auto mb-2"
                          ></div>
                          <div class="h-8 bg-white/20 rounded"></div>
                        </div>
                      </div>
                    {:then projectUsers}
                      {#if isSaleInProgress(product.id)}
                        <div class="text-center py-4">
                          <div
                            class="flex items-center justify-center space-x-2 {$lang ===
                            'he'
                              ? 'space-x-reverse'
                              : ''}"
                          >
                            <div
                              class="animate-spin rounded-full h-4 w-4 border-b-2 border-gold"
                            ></div>
                            <span
                              class="text-royal-blue text-sm drop-shadow glow-text"
                            >
                              {t.processing}
                            </span>
                          </div>
                        </div>
                      {:else}
                        <SaleComponent
                          productId={product.id}
                          productName={product.attributes.name}
                          availableQuantity={product.attributes.quant}
                          price={product.attributes.price}
                          kindOf={product.attributes.kindOf}
                          projectId={product.attributes.projectcreates
                            ?.data?.[0]?.id || ''}
                          {projectUsers}
                          onStart={() => handleSaleStart(product.id)}
                          onDone={(saleData, operationId) =>
                            handleSaleSuccess(
                              product.id,
                              saleData,
                              operationId
                            )}
                          onError={(error, operationId) =>
                            handleSaleError(product.id, operationId, error)}
                        />
                      {/if}
                    {:catch error}
                      <div class="text-center py-4">
                        <span
                          class="text-red-400 text-sm drop-shadow glow-text"
                        >
                          {$lang === 'he'
                            ? 'שגיאה בטעינת נתוני הפרויקט'
                            : 'Error loading project data'}
                        </span>
                      </div>
                    {/await}
                  {:else}
                    <div class="text-center py-4">
                      <span
                        class="text-red-400 font-bold drop-shadow glow-text"
                      >
                        {$lang === 'he' ? 'אזל מהמלאי' : 'Out of Stock'}
                      </span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>

<style>
  /* Custom styles for the sales center */
  .textinput {
    position: relative;
    width: 100%;
    display: block;
  }

  .input {
    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px rgba(255, 255, 255, 0.5);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    color: #4169e1;
    -webkit-tap-highlight-color: transparent;
    background: transparent;
    text-shadow:
      0 0 8px rgba(65, 105, 225, 0.8),
      0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .input::placeholder {
    color: rgba(65, 105, 225, 0.6);
  }

  .label {
    font-size: 15px;
    position: absolute;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: rgba(65, 105, 225, 0.8);
    user-select: none;
    text-shadow:
      0 0 8px rgba(65, 105, 225, 0.8),
      0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .line {
    height: 2px;
    background-color: var(--gold);
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    width: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  }

  .input:focus ~ .line,
  .input:valid ~ .line {
    width: 100%;
  }

  .input:focus ~ .label,
  .input:valid ~ .label {
    font-size: 14px;
    color: var(--gold);
    top: 0;
  }

  .input:focus,
  .input:valid {
    border: 0;
  }

  select {
    font-family: 'Bellefair', 'Gan';
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  select option {
    background-color: var(--grb);
    color: #4169e1;
    text-shadow: none;
  }



  [dir='rtl'] .space-x-2 > * + * {
    margin-left: 0;
    margin-right: 0.5rem;
  }

  [dir='rtl'] .space-x-reverse > * + * {
    margin-left: 0.5rem;
    margin-right: 0;
  }


 

  /* Royal Blue Color Definition */
  .text-royal-blue {
    color: #4169e1;
  }

  .text-royal-blue\/70 {
    color: rgba(65, 105, 225, 0.7);
  }

  .text-royal-blue\/80 {
    color: rgba(65, 105, 225, 0.8);
  }

  .text-royal-blue\/90 {
    color: rgba(65, 105, 225, 0.9);
  }

  /* Glowing text effect */
  .glow-text {
    text-shadow:
      0 0 8px rgba(65, 105, 225, 0.8),
      0 0 16px rgba(65, 105, 225, 0.6),
      0 1px 3px rgba(0, 0, 0, 0.5);
  }

  /* Enhanced contrast and readability */
  .drop-shadow {
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  /* Smooth transitions for all interactive elements */
  button,
  select,
  input {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Focus states for accessibility */
  button:focus-visible,
  select:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
</style>
