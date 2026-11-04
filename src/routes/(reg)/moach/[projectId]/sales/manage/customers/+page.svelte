<script lang="ts">
  /**
   * Customers (docs/inprogress/PLAN_LEADS.md §5.5, L6) — everyone who paid,
   * one row per person: won leads and paid orders folded by phone or email
   * (`buildCustomers`). A view, not a list to keep: it follows the leads and
   * the orders, and nothing here is edited.
   */
  import { page } from '$app/state';
  import { t, locale } from '$lib/translations';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { buildCustomers, matchesCustomer, type Customer } from '$lib/leads/customers';
  import { mailtoHref, telHref } from '$lib/leads/display';
  import type { ShopOrder } from '$lib/shop/manage';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';

  let { data } = $props();
  const fmtMoney = useFormatMoney();

  let projectId = $derived(page.params.projectId ?? '');
  let base = $derived(`/moach/${projectId}/sales/manage`);
  let orders = $derived<ShopOrder[]>(data.shop?.orders ?? []);
  let customers = $derived(
    buildCustomers(
      data.customerLeads ?? [],
      orders.map((o) => ({
        id: o.id,
        number: o.number,
        status: o.status,
        name: o.buyer?.name ?? null,
        email: o.buyer?.email ?? null,
        phone: o.buyer?.phone ?? null,
        total: o.total,
        currency: o.currency,
        at: o.paidAt ?? o.createdAt
      }))
    )
  );
  let query = $state('');
  let list = $derived(customers.filter((c) => matchesCustomer(c, query)));

  const when = (iso: string | null) => formatWhen(iso, clock.minutes, $locale || 'he');
  const hrefOf = (c: Customer) => (c.leadIds[0] ? `${base}/leads/${c.leadIds[0]}` : `${base}/orders/${c.orderIds[0]}`);
  const spent = (c: Customer) => c.totals.map((x) => fmtMoney(x.amount, x.currency)).join(' · ') || '—';
</script>

{#if data.customerLeads === null && customers.length === 0}
  <ShopNotice title={$t('shop.leads.err.notReady')} body={$t('shop.leads.err.notReadyBody')} />
{:else if customers.length === 0}
  <ShopNotice title={$t('shop.customers.empty.title')} body={$t('shop.customers.empty.body')} />
{:else}
  <div class="cu-tools">
    <p class="cu-count">{$t('shop.customers.count', { count: customers.length })}</p>
    <label class="sh-search cu-search">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <span class="sr-only">{$t('shop.customers.search')}</span>
      <input type="search" bind:value={query} placeholder={$t('shop.customers.search')} />
    </label>
  </div>

  {#if list.length === 0}
    <ShopNotice title={$t('shop.empty.filtered')} action={{ label: $t('shop.empty.clearFilter'), onclick: () => (query = '') }} />
  {:else}
    <ul class="cu-list">
      {#each list as c (c.key)}
        <li class="cu-card sh-card">
          <a class="cu-top" href={hrefOf(c)}>
            <span class="cu-name">{c.name}{#if c.organization}<span class="cu-muted"> · {c.organization}</span>{/if}</span>
            <span class="cu-sum sh-num"><bdi>{spent(c)}</bdi></span>
          </a>
          <div class="cu-meta">
            <span>{c.orders === 1 ? $t('shop.customers.ordersOne') : $t('shop.customers.orders', { count: c.orders })}</span>
            {#if c.leadIds.length}<span class="sh-chip sh-chip-ok">{$t('shop.customers.fromLead')}</span>{/if}
            {#if c.lastAt}
              <span class="cu-muted">{$t('shop.customers.last', { when: when(c.lastAt)?.short ?? '' })}</span>
            {/if}
          </div>
          <div class="cu-contact">
            {#if c.phone}
              {@const tel = telHref(c.phone)}
              {#if tel}<a href={tel} dir="ltr">{c.phone}</a>{:else}<span dir="ltr">{c.phone}</span>{/if}
            {/if}
            {#if c.email}
              {@const mail = mailtoHref(c.email)}
              {#if mail}<a href={mail} dir="ltr">{c.email}</a>{:else}<span dir="ltr">{c.email}</span>{/if}
            {/if}
          </div>
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .cu-tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  }
  .cu-count {
    margin: 0;
    font-size: 14px;
    color: var(--sh-muted);
  }
  .cu-search {
    width: min(360px, 100%);
  }
  .cu-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
    gap: 10px;
  }
  .cu-card {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .cu-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    color: var(--sh-ink) !important;
  }
  .cu-name {
    font-weight: 700;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .cu-sum {
    font-weight: 700;
    color: var(--sh-gold);
    white-space: nowrap;
  }
  .cu-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    font-size: 13px;
  }
  .cu-muted {
    color: var(--sh-muted);
    font-weight: 400;
  }
  .cu-contact {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: 13px;
    overflow-wrap: anywhere;
  }
</style>
