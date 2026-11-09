<script lang="ts">
  /**
   * One customer — the page a row of the customers tab opens (PLAN_LEADS §5.5).
   * Who they are, how to reach them, what they have paid so far, and **every**
   * order they placed, cancelled ones and ones still waiting for payment
   * included: the history. A view over the same fold as the list
   * (`buildCustomers`), addressed by one anchor (`l7` a lead, `o40` an order),
   * so nothing is stored and nothing is edited here.
   */
  import { page } from '$app/state';
  import { t, locale } from '$lib/translations';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { buildCustomers, findCustomerByRef, ordersOfCustomer } from '$lib/leads/customers';
  import { mailtoHref, telHref } from '$lib/leads/display';
  import { orderTaskOf, type ShopOrder } from '$lib/shop/manage';
  import { TASK_CHIP, deliveryText, itemsText } from '$lib/shop/display';
  import ShopNotice from '$lib/components/shop/ShopNotice.svelte';

  let { data } = $props();
  const fmtMoney = useFormatMoney();

  let projectId = $derived(page.params.projectId ?? '');
  let base = $derived(`/moach/${projectId}/sales/manage`);
  let shopOrders = $derived<ShopOrder[]>(data.shop?.orders ?? []);
  let inputs = $derived(
    shopOrders.map((o) => ({
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
  );
  let customer = $derived(findCustomerByRef(buildCustomers(data.customerLeads ?? [], inputs), page.params.ref ?? ''));
  let byId = $derived(new Map(shopOrders.map((o) => [o.id, o])));
  let history = $derived(
    customer
      ? ordersOfCustomer(customer, inputs)
          .map((h) => byId.get(h.id))
          .filter((o): o is ShopOrder => !!o)
      : []
  );

  const when = (iso: string | null) => formatWhen(iso, clock.minutes, $locale || 'he');
  const spent = (totals: Array<{ currency: string | null; amount: number }>) =>
    totals.map((x) => fmtMoney(x.amount, x.currency)).join(' · ') || '—';
</script>

<svelte:head>
  {#if customer}<title>{customer.name} · 1lev1</title>{/if}
</svelte:head>

<a class="cd-back" href="{base}/customers">{$t('shop.customers.detail.back')}</a>

{#if !customer}
  <ShopNotice title={$t('shop.customers.detail.notFound')} action={{ label: $t('shop.customers.detail.back'), href: `${base}/customers` }} />
{:else}
  <div class="cd">
    <header class="cd-head sh-card">
      <h2 class="sh-title cd-name">
        {customer.name}{#if customer.organization}<span class="cd-muted"> · {customer.organization}</span>{/if}
      </h2>
      <div class="cd-contact">
        {#if customer.phone}
          {@const tel = telHref(customer.phone)}
          {#if tel}<a href={tel} dir="ltr">{customer.phone}</a>{:else}<span dir="ltr">{customer.phone}</span>{/if}
        {/if}
        {#if customer.email}
          {@const mail = mailtoHref(customer.email)}
          {#if mail}<a href={mail} dir="ltr">{customer.email}</a>{:else}<span dir="ltr">{customer.email}</span>{/if}
        {/if}
      </div>
      <dl class="cd-stats">
        <div>
          <dt>{$t('shop.customers.detail.paid')}</dt>
          <dd class="sh-num"><bdi>{spent(customer.totals)}</bdi></dd>
        </div>
        <div>
          <dt>{$t('shop.customers.detail.orders')}</dt>
          <dd>{customer.orders === 1 ? $t('shop.customers.ordersOne') : $t('shop.customers.orders', { count: customer.orders })}</dd>
        </div>
        {#if customer.firstAt}
          <div>
            <dt>{$t('shop.customers.detail.since')}</dt>
            <dd>{when(customer.firstAt)?.short ?? ''}</dd>
          </div>
        {/if}
      </dl>
      {#if customer.leadIds[0]}
        <a class="cd-lead" href="{base}/leads/{customer.leadIds[0]}">{$t('shop.customers.detail.lead')}</a>
      {/if}
    </header>

    <h3 class="sh-section-label">{$t('shop.customers.detail.history')}</h3>
    {#if history.length === 0}
      <p class="cd-muted cd-empty">{$t('shop.customers.detail.noOrders')}</p>
    {:else}
      <ul class="cd-list">
        {#each history as o (o.id)}
          {@const task = orderTaskOf(o)}
          <li class="cd-order sh-card">
            <a class="cd-order-top" href="{base}/orders/{o.id}">
              <span class="cd-order-title">{$t('shop.order.number', { number: '' })}<bdi>{o.number}</bdi></span>
              <span class="sh-num cd-order-sum"><bdi>{fmtMoney(o.total, o.currency)}</bdi></span>
            </a>
            <div class="cd-order-tags">
              <span class="sh-chip {TASK_CHIP[task]}">{$t(`shop.status.${task}`)}</span>
              {#if when(o.paidAt ?? o.createdAt)}
                {@const w = when(o.paidAt ?? o.createdAt)}
                <time class="cd-muted" datetime={w?.iso} title={w?.full}>{w?.short}</time>
              {/if}
            </div>
            <div class="cd-muted cd-order-meta">{itemsText($t, o)} · {deliveryText($t, o)}</div>
            {#if o.tracking}
              <div class="cd-muted cd-order-meta">
                {$t('shop.order.tracking.title')}: {#if o.tracking.carrier}<bdi>{o.tracking.carrier}</bdi> {/if}<bdi>{o.tracking.number}</bdi>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  .cd-back {
    display: inline-block;
    margin-bottom: 12px;
    font-size: 14px;
  }
  .cd {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 760px;
  }
  .cd-head {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cd-name {
    font-size: 22px;
    overflow-wrap: anywhere;
  }
  .cd-muted {
    color: var(--sh-muted);
    font-weight: 400;
  }
  .cd-empty {
    font-size: 14px;
  }
  .cd-contact {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  .cd-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin: 0;
  }
  .cd-stats dt {
    font-size: 12px;
    color: var(--sh-muted);
  }
  .cd-stats dd {
    margin: 0;
    font-weight: 700;
  }
  .cd-lead {
    font-size: 14px;
  }
  .cd-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .cd-order {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .cd-order-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    color: var(--sh-ink) !important;
  }
  .cd-order-title {
    font-weight: 700;
  }
  .cd-order-sum {
    font-weight: 700;
    color: var(--sh-gold);
    white-space: nowrap;
  }
  .cd-order-tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    font-size: 13px;
  }
  .cd-order-meta {
    font-size: 13px;
    overflow-wrap: anywhere;
  }
</style>
