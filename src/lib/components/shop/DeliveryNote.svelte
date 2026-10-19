<script lang="ts">
  /**
   * The delivery note — invisible on screen, the only thing on paper
   * (`.sh-print` in shop.css). Plain black on white, the rikma's name on top,
   * what goes in the box, and where it goes. No prices: the note travels in
   * the parcel, and a gift is a gift.
   */
  import { t, locale } from '$lib/translations';
  import { page } from '$app/state';
  import { addressExtras, addressLine, type ShopOrder } from '$lib/shop/manage';

  let { order }: { order: ShopOrder } = $props();
  let extras = $derived(addressExtras(order.delivery.address, (k, v) => $t(k, v)));
  let rikma = $derived(page.data?.projectBase?.projectName ?? '');
  let date = $derived(
    new Intl.DateTimeFormat($locale || 'he', { dateStyle: 'long' }).format(
      new Date(order.paidAt ?? order.createdAt ?? Date.now())
    )
  );
</script>

<div class="sh-print dn" aria-hidden="true">
  <header>
    <div>
      <div class="dn-rikma">{rikma}</div>
      <h1>{$t('shop.order.printTitle')}</h1>
    </div>
    <div class="dn-num">
      <div>{$t('shop.order.number', { number: order.number })}</div>
      <div>{date}</div>
    </div>
  </header>
  <section class="dn-to">
    <strong>{order.buyer.name ?? ''}</strong>
    {#if order.delivery.address}<div>{addressLine(order.delivery.address)}</div>{/if}
    {#if extras}<div>{extras}</div>{/if}
    {#if order.shipping?.kind === 'pickup' && order.shipping.pickupPointName}
      <div>{$t('shop.order.ship.pickupAt', { name: order.shipping.pickupPointName })}</div>
    {:else if order.shipping?.name}
      <div>{order.shipping.name}</div>
    {/if}
    {#if order.delivery.address?.notes}<div>{order.delivery.address.notes}</div>{/if}
    {#if order.buyer.phone}<div><bdi>{order.buyer.phone}</bdi></div>{/if}
  </section>
  <table>
    <thead>
      <tr><th>{$t('shop.order.lines.title')}</th><th>{$t('shop.order.lines.sku')}</th><th>#</th></tr>
    </thead>
    <tbody>
      {#each order.lines as line, i (i)}
        <tr>
          <td>{line.name}{#if line.optionLabel} · {line.optionLabel}{/if}</td>
          <td><bdi>{line.sku ?? ''}</bdi></td>
          <td>{line.quantity}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  {#if order.note}<p class="dn-note">{order.note}</p>{/if}
</div>

<style>
  .dn {
    font-family: system-ui, sans-serif;
    font-size: 12pt;
    padding: 12mm;
  }
  .dn header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #000;
    padding-bottom: 6mm;
    margin-bottom: 6mm;
  }
  .dn h1 {
    font-size: 20pt;
    margin: 2mm 0 0;
    color: #000;
  }
  .dn-rikma {
    font-size: 11pt;
  }
  .dn-num {
    text-align: end;
    font-size: 12pt;
  }
  .dn-to {
    display: flex;
    flex-direction: column;
    gap: 1mm;
    margin-bottom: 8mm;
    font-size: 13pt;
  }
  .dn table {
    width: 100%;
    border-collapse: collapse;
  }
  .dn th,
  .dn td {
    border-bottom: 1px solid #999;
    padding: 2mm 1mm;
    text-align: start;
    color: #000;
  }
  .dn-note {
    margin-top: 8mm;
    white-space: pre-line;
    color: #000;
  }
</style>
