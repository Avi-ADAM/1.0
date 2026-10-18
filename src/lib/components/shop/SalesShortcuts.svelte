<script lang="ts">
  /**
   * What the plain sales page gains (UX_COPY_SHOP_SALES §2, canvas "Main"):
   * one banner when site orders wait — amber when one is short on stock — and
   * the way into "manage sales". Without the banner, orders from the site
   * would vanish for anyone who never opens the manage screens.
   */
  import '$lib/styles/shop.css';
  import { t } from '$lib/translations';

  let {
    projectId,
    banner = null
  }: { projectId: string; banner?: { kind: 'short' | 'toShip'; count: number } | null } = $props();

  let base = $derived(`/moach/${projectId}/sales/manage`);
  let text = $derived(
    !banner
      ? ''
      : banner.kind === 'short'
        ? banner.count === 1
          ? $t('shop.banner.shortOne')
          : $t('shop.banner.short', { count: banner.count })
        : banner.count === 1
          ? $t('shop.banner.toShipOne')
          : $t('shop.banner.toShip', { count: banner.count })
  );
</script>

<div class="shop-ui sc">
  {#if banner}
    <a class="sc-banner" class:sc-short={banner.kind === 'short'} href={banner.kind === 'short' ? `${base}/stock?f=short` : base}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>
      <span class="sc-text">{text}</span>
      <span class="sc-cta">{$t('shop.banner.cta')}</span>
      <svg class="sc-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
    </a>
  {/if}

  <a class="sc-manage sh-card" href={base}>
    <span class="sc-icon" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
    </span>
    <span class="sc-manage-text">
      <span class="sc-manage-title">{$t('shop.manage.cta')}</span>
      <span class="sc-manage-hint">{$t('shop.manage.hint')}</span>
    </span>
    <svg class="sc-chev sc-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
  </a>
</div>

<style>
  .sc {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 1100px;
    margin: 0 auto 16px;
    padding: 0 16px;
  }
  .sc-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 56px;
    padding: 0 16px;
    border-radius: var(--sh-radius);
    background: var(--sh-accent);
    color: var(--sh-on-accent) !important;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--sh-accent) 30%, transparent);
  }
  .sc-banner.sc-short {
    background: var(--sh-warn);
    color: var(--sh-on-warn) !important;
    box-shadow: none;
  }
  .sc-text {
    flex: 1 1 auto;
    font-size: 15px;
    font-weight: 700;
  }
  .sc-cta {
    font-size: 14px;
    font-weight: 700;
  }
  :global([dir='ltr']) .sc-chev {
    transform: scaleX(-1);
  }
  .sc-manage {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px;
    color: var(--sh-ink) !important;
  }
  .sc-manage:hover {
    border-color: var(--sh-gold-line);
  }
  .sc-icon {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: var(--sh-radius-sm);
    background: var(--sh-accent-tint);
    color: var(--sh-accent-ink);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sc-manage-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
  }
  .sc-manage-title {
    font-size: 16px;
    font-weight: 700;
  }
  .sc-manage-hint {
    font-size: 13px;
    color: var(--sh-muted);
  }
  .sc-muted {
    color: var(--sh-muted);
  }
</style>
