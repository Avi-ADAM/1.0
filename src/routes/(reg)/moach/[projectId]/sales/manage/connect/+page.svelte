<script lang="ts">
  /**
   * Connections (canvas "DesktopConnect"): the site that reports sales and
   * orders, and the rikma's support page with its donations. The panels are
   * the ones that already worked on the sales page — moved here, so the plain
   * page can stay about money (PLAN §7.3: `SalesApiIntegration` moves to this tab).
   */
  import { page } from '$app/state';
  import { invalidate } from '$app/navigation';
  import { shopOrdersKey } from '$lib/shop/keys';
  import { t, locale } from '$lib/translations';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import SalesApiIntegration from '$lib/components/prPr/SalesApiIntegration.svelte';
  import SupportPageToggle from '$lib/components/revenue/SupportPageToggle.svelte';
  import DonateDialog from '$lib/components/revenue/DonateDialog.svelte';
  import type { ShopOrder, ShopProductRow } from '$lib/shop/manage';

  let { data } = $props();
  let projectId = $derived(page.params.projectId ?? '');
  let base = $derived(data.projectBase ?? {});
  let users = $derived(base?.user_1s?.data ?? []);
  let members = $derived(
    users.map((u: any) => ({ id: String(u.id), username: u.attributes?.username ?? '' }))
  );
  let products = $derived(
    (data.catalog?.products ?? [])
      .filter((p: ShopProductRow) => p.status !== 'archived')
      .map((p: ShopProductRow) => ({ id: p.id, attributes: { name: p.name } }))
  );

  let lastSiteOrder = $derived(
    (data.shop?.orders ?? []).find((o: ShopOrder) => o.source === 'api') as ShopOrder | undefined
  );
  let lastWhen = $derived(
    lastSiteOrder ? formatWhen(lastSiteOrder.paidAt ?? lastSiteOrder.createdAt, clock.minutes, $locale || 'he') : null
  );

  let donateOpen = $state(false);
</script>

<div class="cn">
  <section class="cn-main sh-card">
    <div class="cn-head">
      <div>
        <h2 class="sh-title cn-title">{$t('shop.connect.apiTitle')}</h2>
        <p class="cn-body">{$t('shop.connect.apiBody')}</p>
      </div>
      <span class="sh-chip {lastSiteOrder ? 'sh-chip-ok' : 'sh-chip-muted'}">
        {lastSiteOrder && lastWhen ? $t('shop.connect.statusLive', { when: lastWhen.short }) : $t('shop.connect.statusNone')}
      </span>
    </div>
    <a class="cn-docs" href="/moach/{projectId}/api">{$t('shop.connect.docs')}</a>
    <div class="cn-panel">
      <SalesApiIntegration {projectId} rikmaSlug={base?.slug ?? null} bmiData={products} projectUsers={users} />
    </div>
  </section>

  <aside class="cn-side">
    <section class="sh-card cn-box">
      <h2 class="sh-title cn-title-sm">{$t('shop.connect.supportTitle')}</h2>
      <SupportPageToggle {projectId} value={base?.supportPage ?? 'off'} />
    </section>
    <section class="sh-card cn-box">
      <h2 class="sh-title cn-title-sm">{$t('shop.connect.recordDonation')}</h2>
      <p class="cn-body">{$t('shop.connect.donationHint')}</p>
      <button type="button" class="sh-btn sh-btn-outline" onclick={() => (donateOpen = true)}>{$t('shop.connect.recordDonation')}</button>
    </section>
  </aside>
</div>

<DonateDialog
  bind:isOpen={donateOpen}
  {projectId}
  projectName={base?.projectName ?? ''}
  {members}
  isRegisteredUser={true}
  isMember={true}
  uid={data.uid ?? null}
  mode="record"
  onDone={() => invalidate(shopOrdersKey(projectId))}
/>

<style>
  .cn {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }
  .cn-main,
  .cn-box {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .cn-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }
  .cn-title {
    font-size: 22px;
  }
  .cn-title-sm {
    font-size: 19px;
  }
  .cn-body {
    font-size: 14px;
    line-height: 1.6;
    margin-top: 4px;
  }
  .cn-docs {
    font-size: 14px;
    font-weight: 700;
  }
  .cn-panel {
    min-width: 0;
  }
  .cn-side {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  @media (min-width: 1100px) {
    .cn {
      grid-template-columns: minmax(0, 1fr) 360px;
    }
  }
</style>
