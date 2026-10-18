<script lang="ts">
  /**
   * One order, everything the seller needs to send it out (UX_COPY_SHOP_SALES
   * §3.5): what was ordered, who bought it and how to reach them, where it
   * goes, how it was paid and whose till took the money. The actions are
   * `OrderActions` — a sticky bar on a phone, a row in the desktop panel.
   */
  import { t, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import { addressLine, type ShopOrder } from '$lib/shop/manage';

  let {
    order,
    projectId,
    uid = null,
    compact = false
  }: { order: ShopOrder; projectId: string; uid?: string | null; compact?: boolean } = $props();

  const fmtMoney = useFormatMoney();
  const money = (n: number | null) => fmtMoney(n, order.currency);

  let address = $derived(addressLine(order.delivery.address));
  let phoneHref = $derived(order.buyer.phone ? `tel:${order.buyer.phone.replace(/[^\d+]/g, '')}` : null);
  let holderLine = $derived(
    order.holderId && uid && order.holderId === uid
      ? $t('shop.order.holderYou')
      : order.holderName
        ? $t('shop.order.holder', { name: order.holderName })
        : ''
  );

  function stamp(at: string | null): string {
    if (!at) return '';
    const d = new Date(at);
    if (!Number.isFinite(d.getTime())) return '';
    return new Intl.DateTimeFormat($locale || 'he', { dateStyle: 'short', timeStyle: 'short' }).format(d);
  }

  let timeline = $derived(
    [
      order.paidAt || order.createdAt ? { key: 'paid', at: order.paidAt ?? order.createdAt } : null,
      order.shippedAt ? { key: 'shipped', at: order.shippedAt } : null,
      order.fulfilledAt ? { key: 'done', at: order.fulfilledAt } : null,
      order.status === 'cancelled' ? { key: 'cancelled', at: null } : null
    ].filter((x): x is { key: string; at: string | null } => !!x)
  );

  async function copyAddress() {
    const text = [order.buyer.name, address, order.delivery.address?.notes].filter(Boolean).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success($t('shop.order.copied'));
    } catch {
      /* no clipboard (insecure origin) — the address is on screen to select */
    }
  }
</script>

<div class="od" class:od-compact={compact}>
  {#if order.shortUnits > 0}
    <section class="od-short" aria-labelledby="od-short-{order.id}">
      <div class="od-short-head">
        <span class="sh-chip sh-chip-warn">
          {order.shortUnits === 1 ? $t('shop.short.tagOne') : $t('shop.short.tag', { count: order.shortUnits })}
        </span>
        <strong id="od-short-{order.id}">{$t('shop.short.title')}</strong>
      </div>
      <p>
        {order.shortUnits === 1 ? $t('shop.short.bodyOne') : $t('shop.short.body', { count: order.shortUnits })}
      </p>
      <div class="od-row">
        <a class="sh-btn sh-btn-warn" href="/moach/{projectId}/sales/manage/stock?f=short">{$t('shop.short.updateStock')}</a>
        <a class="sh-btn sh-btn-outline" href="#od-buyer-{order.id}">{$t('shop.short.contactBuyer')}</a>
      </div>
    </section>
  {/if}

  <section class="od-card" aria-labelledby="od-lines-{order.id}">
    <h2 class="sh-section-label" id="od-lines-{order.id}">{$t('shop.order.lines.title')}</h2>
    <ul class="od-lines">
      {#each order.lines as line, i (i)}
        <li class="od-line">
          {#if !compact}
            {#if line.imageUrl}
              <img class="od-img" src={line.imageUrl} alt="" loading="lazy" width="52" height="52" />
            {:else}
              <span class="od-img od-img-empty" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /></svg>
              </span>
            {/if}
          {/if}
          <div class="od-line-text">
            <span class="od-line-name">{line.name}</span>
            {#if line.optionLabel || line.sku}
              <span class="od-line-meta">
                {line.optionLabel ?? ''}{#if line.optionLabel && line.sku} · {/if}{#if line.sku}{$t('shop.order.lines.sku')} <bdi class="od-mono">{line.sku}</bdi>{/if}
              </span>
            {/if}
          </div>
          <div class="od-line-sum">
            <span class="sh-num"><bdi>{money(line.lineTotal)}</bdi></span>
            <span class="od-line-meta sh-num"><bdi>{line.quantity} × {money(line.unitPrice)}</bdi></span>
          </div>
        </li>
      {/each}
    </ul>
    <div class="od-total">
      <span>{$t('shop.order.lines.total')}</span>
      <strong class="sh-num"><bdi>{money(order.total)}</bdi></strong>
    </div>
  </section>

  <div class="od-pair">
    <section class="od-card" id="od-buyer-{order.id}" aria-labelledby="od-buyer-h-{order.id}">
      <div class="od-card-head">
        <h2 class="sh-section-label" id="od-buyer-h-{order.id}">{$t('shop.order.buyer.title')}</h2>
        <span class="od-private">{$t('shop.order.buyer.private')}</span>
      </div>
      <div class="od-strong">{order.buyer.name ?? $t('shop.order.buyerUnknown')}</div>
      {#if order.buyer.phone || order.buyer.email}
        <div class="od-row">
          {#if phoneHref}
            <a class="sh-btn sh-btn-outline od-grow" href={phoneHref}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg>
              {$t('shop.order.call')}
            </a>
          {/if}
          {#if order.buyer.email}
            <a class="sh-btn sh-btn-outline od-grow" href="mailto:{order.buyer.email}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
              {$t('shop.order.email')}
            </a>
          {/if}
        </div>
        <div class="od-meta-lines">
          {#if order.buyer.phone}<bdi class="sh-num">{order.buyer.phone}</bdi>{/if}
          {#if order.buyer.email}<bdi>{order.buyer.email}</bdi>{/if}
        </div>
      {:else}
        <p class="od-small">{$t('shop.order.buyer.noContact')}</p>
      {/if}
    </section>

    <section class="od-card" aria-labelledby="od-addr-{order.id}">
      <h2 class="sh-section-label" id="od-addr-{order.id}">{$t('shop.order.address.title')}</h2>
      <div class="od-strong">
        {order.delivery.preference === 'delivery'
          ? $t('shop.order.delivery')
          : $t(`shop.order.${order.delivery.preference}`)}
      </div>
      {#if address}
        <div class="od-address">{address}</div>
        {#if order.delivery.address?.notes}<div class="od-small">{order.delivery.address.notes}</div>{/if}
        <button type="button" class="sh-btn sh-btn-quiet od-self" onclick={copyAddress}>{$t('shop.order.copyAddress')}</button>
      {:else if order.delivery.preference === 'delivery'}
        <p class="od-small">{$t('shop.order.address.none')}</p>
      {/if}
    </section>
  </div>

  {#if order.note}
    <section class="od-card" aria-labelledby="od-note-{order.id}">
      <h2 class="sh-section-label" id="od-note-{order.id}">{$t('shop.order.note.title')}</h2>
      <p class="od-note">{order.note}</p>
    </section>
  {/if}

  <section class="od-card" aria-labelledby="od-pay-{order.id}">
    <h2 class="sh-section-label" id="od-pay-{order.id}">{$t('shop.order.payment.title')}</h2>
    <div>{$t('shop.order.payment.paid', { amount: money(order.total) })}</div>
    {#if order.paymentRef}
      <div class="od-small">{$t('shop.order.payment.ref')} <bdi class="od-mono">{order.paymentRef}</bdi></div>
    {/if}
    {#if order.paymentMethod}
      <div class="od-small">{$t('shop.order.payment.method')}: {order.paymentMethod}</div>
    {/if}
    {#if holderLine}<div class="od-holder">{holderLine}</div>{/if}
  </section>

  <section class="od-timeline" aria-labelledby="od-tl-{order.id}">
    <h2 class="sh-section-label" id="od-tl-{order.id}">{$t('shop.order.timeline.title')}</h2>
    <ol>
      {#each timeline as step (step.key)}
        <li>
          <span class="od-dot od-dot-{step.key}" aria-hidden="true"></span>
          {$t(`shop.order.timeline.${step.key}`)}{#if step.at} · <bdi class="sh-num">{stamp(step.at)}</bdi>{/if}
        </li>
      {/each}
    </ol>
  </section>
</div>

<style>
  .od {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .od-card {
    background: var(--sh-card);
    border: 1px solid var(--sh-line);
    border-radius: var(--sh-radius);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .od-card-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .od-private {
    font-size: 11px;
    color: var(--sh-muted);
  }
  .od-short {
    border-radius: var(--sh-radius);
    background: var(--sh-warn-tint);
    border: 1px solid var(--sh-warn-line);
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .od-short-head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    font-size: 14px;
  }
  .od-short p {
    font-size: 13px;
    line-height: 1.5;
    color: var(--sh-ink);
  }
  .od-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .od-grow {
    flex: 1 1 0;
  }
  .od-self {
    align-self: flex-start;
    font-weight: 600;
  }
  .od-lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .od-line {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .od-img {
    width: 52px;
    height: 52px;
    flex-shrink: 0;
    border-radius: var(--sh-radius-sm);
    object-fit: cover;
    border: 1px solid var(--sh-line);
    background: var(--sh-card);
  }
  .od-img-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sh-muted);
  }
  .od-line-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
  }
  .od-line-name {
    font-size: 15px;
    font-weight: 600;
  }
  .od-line-meta {
    font-size: 12px;
    color: var(--sh-muted);
  }
  .od-line-sum {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 2px;
    font-size: 15px;
    font-weight: 600;
  }
  .od-total {
    display: flex;
    justify-content: space-between;
    padding-top: 10px;
    border-top: 1px solid var(--sh-line);
    font-size: 15px;
  }
  .od-total strong {
    color: var(--sh-gold);
  }
  .od-strong {
    font-size: 16px;
    font-weight: 600;
  }
  .od-meta-lines {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .od-address {
    font-size: 14px;
    line-height: 1.6;
  }
  .od-small {
    font-size: 13px;
    color: var(--sh-muted);
  }
  .od-note {
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-line;
    color: var(--sh-ink);
  }
  .od-mono {
    font-family: var(--sh-mono);
    font-size: 12px;
  }
  .od-holder {
    font-size: 13px;
    font-weight: 600;
    color: var(--sh-ok-ink);
  }
  .od-pair {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  /* Inside the desktop panel, which is a card itself: one step in. */
  .od-compact .od-card {
    background: var(--sh-card-2);
  }
  .od-compact .od-pair {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  .od-timeline {
    padding: 4px 2px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .od-timeline ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .od-timeline li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .od-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--sh-gold);
    flex-shrink: 0;
  }
  .od-dot-shipped {
    background: var(--sh-info-ink);
  }
  .od-dot-done {
    background: var(--sh-ok-ink);
  }
  .od-dot-cancelled {
    background: var(--sh-muted);
  }
</style>
