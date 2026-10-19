<script lang="ts">
  import '$lib/styles/shop.css';
  import { page } from '$app/state';
  import { t, locale } from '$lib/translations';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import {
    isWaiting,
    salesSummary,
    type ShopOrder,
    type ShopSaleRow
  } from '$lib/shop/manage';
  import { forgetSettled, shownStatus } from '$lib/shop/pendingMarks.svelte';

  let { data, children } = $props();
  const fmtMoney = useFormatMoney();

  let projectId = $derived(page.params.projectId ?? '');
  let base = $derived(`/moach/${projectId}/sales/manage`);
  let projectName = $derived(data.projectBase?.projectName ?? '');
  let orders = $derived<ShopOrder[]>(data.shop?.orders ?? []);

  // A fresh load already shows what the server accepted.
  $effect(() => {
    forgetSettled(orders);
  });

  /** Orders as they are shown — a mark still in its undo window counts as done. */
  let shown = $derived(orders.map((o) => ({ ...o, status: shownStatus(o) })));
  let waiting = $derived(shown.filter(isWaiting));
  let shortOrders = $derived(shown.filter((o) => o.shortUnits > 0));
  let shortUnits = $derived(shortOrders.reduce((s, o) => s + o.shortUnits, 0));
  let badge = $derived(waiting.length + shortOrders.filter((o) => !isWaiting(o)).length);
  let oldest = $derived(
    waiting.reduce<string | null>((min, o) => {
      const at = o.paidAt ?? o.createdAt;
      return at && (!min || at < min) ? at : min;
    }, null)
  );
  let oldestWhen = $derived(oldest ? formatWhen(oldest, clock.minutes, $locale || 'he')?.short ?? '' : '');

  // The sales arrive streamed; the strip fills in when they do.
  let sales = $state<ShopSaleRow[] | null>(null);
  $effect(() => {
    const p = data.sales;
    let live = true;
    Promise.resolve(p).then((r) => {
      if (live) sales = r?.sales ?? [];
    });
    return () => {
      live = false;
    };
  });
  let summary = $derived(sales ? salesSummary(sales, clock.minutes) : null);

  const TABS = ['orders', 'products', 'stock', 'fulfillment', 'sales', 'connect'] as const;
  function hrefOf(tab: (typeof TABS)[number]) {
    return tab === 'orders' ? base : `${base}/${tab}`;
  }
  // One order on a phone is its own screen (canvas "MobileOrder"): the page draws
  // its own header, so the manage header and tabs step aside there.
  let onOrder = $derived(page.url.pathname.includes('/sales/manage/orders/'));
  let active = $derived.by(() => {
    const rest = page.url.pathname.split('/sales/manage')[1] ?? '';
    const seg = rest.split('/').filter(Boolean)[0];
    return (TABS as readonly string[]).includes(seg) ? seg : 'orders';
  });

  // The active tab scrolls into view on narrow screens (Russian and Spanish
  // labels do not fit five across at 375px — UX_COPY §3.1).
  let tabsEl: HTMLElement | undefined = $state();
  $effect(() => {
    active;
    tabsEl?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
</script>

<svelte:head>
  <title>{projectName ? `${projectName} · ` : ''}{$t('shop.manage.title')} · 1lev1</title>
</svelte:head>

<div class="shop-ui sh-manage" class:sh-on-order={onOrder} dir={$locale === 'he' || $locale === 'ar' ? 'rtl' : 'ltr'}>
  <header class="sh-head">
    <a class="sh-btn sh-btn-quiet sh-btn-icon sh-back" href="/moach/{projectId}/sales" aria-label={$t('shop.manage.back')}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="sh-flip"><path d="M9 18l6-6-6-6" /></svg>
    </a>
    <div class="sh-head-text">
      <nav class="sh-crumbs" aria-label={$t('shop.manage.crumbSales')}>
        {#if projectName}<span>{projectName}</span> ›{/if}
        <a href="/moach/{projectId}/sales">{$t('shop.manage.crumbSales')}</a> › <span>{$t('shop.manage.crumbManage')}</span>
      </nav>
      <h1 class="sh-title sh-h1">{$t('shop.manage.title')}</h1>
    </div>
  </header>

  <section class="sh-kpis" aria-label={$t('shop.kpi.label')}>
    <div class="sh-kpi sh-card">
      <span class="sh-section-label">{$t('shop.kpi.awaitingSplit')}</span>
      <span class="sh-kpi-value sh-gold"><bdi>{summary ? fmtMoney(summary.awaiting) : '—'}</bdi></span>
      <a class="sh-kpi-sub" href="/moach/{projectId}/sales">{$t('shop.kpi.toSplit')}</a>
    </div>
    <a class="sh-kpi sh-card sh-kpi-link" href={base}>
      <span class="sh-section-label">{$t('shop.kpi.waiting')}</span>
      <span class="sh-kpi-value">{waiting.length}</span>
      <span class="sh-kpi-sub">{waiting.length ? $t('shop.kpi.oldest', { when: oldestWhen }) : $t('shop.kpi.noneWaiting')}</span>
    </a>
    <a class="sh-kpi sh-card sh-kpi-link" class:sh-kpi-warn={shortOrders.length > 0} href="{base}/stock?f=short">
      <span class="sh-section-label">{$t('shop.kpi.short')}</span>
      <span class="sh-kpi-value">{shortOrders.length}</span>
      <span class="sh-kpi-sub">
        {#if shortUnits}{shortUnits === 1 ? $t('shop.kpi.shortUnitsOne') : $t('shop.kpi.shortUnits', { count: shortUnits })}{:else}&nbsp;{/if}
      </span>
    </a>
    <div class="sh-kpi sh-card">
      <span class="sh-section-label">{$t('shop.kpi.month')}</span>
      <span class="sh-kpi-value"><bdi>{summary ? fmtMoney(summary.recent) : '—'}</bdi></span>
      <span class="sh-kpi-sub">{summary ? $t('shop.kpi.monthSub', { count: summary.recentCount, share: summary.siteShare }) : ''}</span>
    </div>
  </section>

  <nav class="sh-tabs" aria-label={$t('shop.tabs.label')} bind:this={tabsEl}>
    {#each TABS as tab (tab)}
      <a href={hrefOf(tab)} aria-current={active === tab ? 'page' : undefined} data-sveltekit-noscroll>
        {$t(`shop.tabs.${tab}`)}
        {#if tab === 'orders' && badge > 0}
          <span class="sh-badge" aria-label={$t('shop.tabs.waiting', { count: badge })}>{badge}</span>
        {/if}
      </a>
    {/each}
  </nav>

  <div class="sh-body">
    {@render children()}
  </div>
</div>

<style>
  .sh-manage {
    max-width: 1400px;
    margin: 0 auto;
    background: var(--sh-page);
    min-height: 100dvh;
    padding: 12px 16px 96px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .sh-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sh-head-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .sh-h1 {
    font-size: 26px;
  }
  .sh-crumbs {
    display: none;
    font-size: 13px;
    color: var(--sh-muted);
  }
  :global([dir='ltr']) .sh-flip {
    transform: scaleX(-1);
  }
  .sh-kpis {
    display: none;
  }
  .sh-kpi {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    min-width: 0;
    color: var(--sh-ink);
  }
  .sh-kpi-link:hover {
    border-color: var(--sh-gold-line);
  }
  .sh-kpi-value {
    font-family: var(--sh-display);
    font-size: 30px;
    line-height: 1;
    color: var(--sh-ink);
  }
  .sh-gold {
    color: var(--sh-gold);
  }
  .sh-kpi-sub {
    font-size: 12px;
    color: var(--sh-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  a.sh-kpi-sub {
    color: var(--sh-gold);
    font-weight: 700;
  }
  .sh-kpi-warn {
    border-color: var(--sh-warn-line);
    background: var(--sh-warn-tint);
  }
  .sh-tabs {
    display: flex;
    gap: 2px;
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid var(--sh-line);
    margin: 0 -16px;
    padding: 0 12px;
    position: sticky;
    top: 0;
    z-index: 5;
    background: color-mix(in srgb, var(--sh-card) 92%, transparent);
    backdrop-filter: blur(12px);
  }
  .sh-tabs::-webkit-scrollbar {
    display: none;
  }
  .sh-tabs a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 46px;
    padding: 0 14px;
    border-bottom: 2px solid transparent;
    color: var(--sh-muted);
    font-size: 15px;
    white-space: nowrap;
  }
  .sh-tabs a[aria-current='page'] {
    color: var(--sh-ink);
    font-weight: 700;
    border-bottom-color: var(--sh-accent);
  }
  .sh-badge {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 9999px;
    background: var(--sh-accent);
    color: var(--sh-on-accent);
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  @media (max-width: 899px) {
    .sh-on-order .sh-head,
    .sh-on-order .sh-tabs {
      display: none;
    }
  }
  .sh-body {
    min-width: 0;
  }
  @media (min-width: 900px) {
    .sh-manage {
      padding: 20px 28px 48px;
      border-radius: var(--sh-radius-lg);
      min-height: auto;
      gap: 18px;
    }
    .sh-back {
      display: none;
    }
    .sh-crumbs {
      display: block;
    }
    .sh-h1 {
      font-size: 32px;
    }
    .sh-kpis {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .sh-tabs {
      margin: 0;
      padding: 0;
      position: static;
      background: transparent;
      backdrop-filter: none;
    }
  }
</style>
