<script lang="ts">
  import SaleComponent from '$lib/components/sales/SaleComponent.svelte';
  import { lang } from '$lib/stores/lang.js';

  let {
    products,
    userId
  }: {
    products: Array<{
      id: string;
      name: string;
      price: number;
      quant: number;
      kindOf: string;
      projectId: string;
      projectName: string;
      projectUsers: Array<{ id: string; attributes: { username: string } }>;
    }>;
    userId?: string;
  } = $props();

  let selectedProduct = $state<(typeof products)[0] | null>(null);
  let saleComplete = $state(false);
  let inProgress = $state(false);

  function selectProduct(product: (typeof products)[0]) {
    if (saleComplete || inProgress) return;
    selectedProduct = product;
  }

  // Find the username of the reporting user to pre-select as default holder
  function getDefaultHolder(product: (typeof products)[0]): string {
    if (!userId) return '';
    const self = product.projectUsers.find((u) => String(u.id) === String(userId));
    return self?.attributes?.username ?? '';
  }

  function handleStart() {
    inProgress = true;
  }

  function handleDone() {
    inProgress = false;
    saleComplete = true;
    selectedProduct = null;
  }

  function handleError() {
    inProgress = false;
  }
</script>

<div class="product-list-card">
  {#if saleComplete}
    <div class="sale-done">
      <div class="done-icon">✅</div>
      <div class="done-text">
        {$lang === 'he' ? 'המכירה נרשמה בהצלחה!' : 'Sale recorded successfully!'}
      </div>
    </div>
  {:else if selectedProduct}
    <div class="sale-form-wrapper">
      <button class="back-btn" onclick={() => { selectedProduct = null; inProgress = false; }}>
        ← {$lang === 'he' ? 'חזרה' : 'Back'}
      </button>
      <div class="selected-product-name">{selectedProduct.name}</div>
      <div class="selected-project-name">{selectedProduct.projectName}</div>
      <SaleComponent
        productId={selectedProduct.id}
        productName={selectedProduct.name}
        availableQuantity={selectedProduct.quant}
        price={selectedProduct.price}
        kindOf={selectedProduct.kindOf}
        projectId={selectedProduct.projectId}
        projectUsers={selectedProduct.projectUsers}
        defaultHolder={getDefaultHolder(selectedProduct)}
        onStart={handleStart}
        onDone={handleDone}
        onError={handleError}
      />
    </div>
  {:else}
    <div class="pl-header">
      <div class="pl-badge">🛍️</div>
      <div class="pl-meta">
        <div class="pl-label">
          {products.length}
          {$lang === 'he' ? 'מוצרים זמינים' : 'available products'}
        </div>
        <div class="pl-title">
          {$lang === 'he' ? 'בחר/י מוצר לדיווח מכירה' : 'Choose a product to report a sale'}
        </div>
      </div>
    </div>
    <div class="products-container">
      {#each products as product (product.id)}
        <button class="product-btn" onclick={() => selectProduct(product)}>
          <div class="product-info">
            <span class="product-name">{product.name}</span>
            <span class="project-tag">{product.projectName}</span>
          </div>
          <div class="product-price">{product.price} ₪</div>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .product-list-card {
    background: var(--surface-2, #1a1e26);
    border: 1px solid var(--border-2, rgba(255, 255, 255, 0.1));
    border-radius: var(--radius, 16px);
    padding: 16px;
    margin-top: 10px;
    animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
    width: 100%;
  }

  .pl-header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .pl-badge {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: rgba(212, 175, 55, 0.1);
    display: grid;
    place-items: center;
    font-size: 16px;
    flex-shrink: 0;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .pl-meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pl-label {
    font-size: 10px;
    color: var(--text-3, #a0aec0);
    font-family: var(--font-mono, monospace);
    text-align: right;
  }

  .pl-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text, #ffffff);
    line-height: 1.45;
    text-align: right;
  }

  .products-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .product-btn {
    width: 100%;
    background: var(--surface-3, rgba(255, 255, 255, 0.03));
    border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
    border-radius: 12px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: right;
    color: inherit;
  }

  .product-btn:hover {
    background: rgba(212, 175, 55, 0.08);
    border-color: rgba(212, 175, 55, 0.5);
    transform: translateX(-4px);
  }

  .product-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
  }

  .product-name {
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .project-tag {
    font-size: 10px;
    color: var(--text-3, #a0aec0);
  }

  .product-price {
    font-size: 13px;
    font-weight: 600;
    color: rgba(212, 175, 55, 0.9);
    flex-shrink: 0;
    margin-right: 8px;
  }

  .sale-form-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .back-btn {
    background: none;
    border: none;
    color: var(--text-3, #a0aec0);
    cursor: pointer;
    font-size: 12px;
    text-align: right;
    padding: 4px 0;
  }

  .back-btn:hover {
    color: var(--text, #ffffff);
  }

  .selected-product-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--text, #ffffff);
    text-align: right;
  }

  .selected-project-name {
    font-size: 11px;
    color: var(--text-3, #a0aec0);
    text-align: right;
    margin-bottom: 8px;
  }

  .sale-done {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 0;
  }

  .done-icon {
    font-size: 28px;
  }

  .done-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--text, #ffffff);
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
</style>
