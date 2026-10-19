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
  import { STARTER_REPO_URL, rikmaApiUrl, starterDeployUrl, starterNetlifyUrl, type StarterProvider } from '$lib/shop/starter';
  import { t, locale } from '$lib/translations';
  import { clock } from '$lib/stores/clock.svelte';
  import { formatWhen } from '$lib/time/formatWhen';
  import SalesApiIntegration from '$lib/components/prPr/SalesApiIntegration.svelte';
  import ShopStarterKey from '$lib/components/shop/ShopStarterKey.svelte';
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

  // The starter's deploy link fills Vercel's env form for the member: the rikma
  // address always, the orders key while it is still in hand (just created).
  let starterKey = $state('');
  // How buyers pay decides which keys Vercel's form requires (each listed one is mandatory there).
  const PAY_CHOICES: { id: string; providers: StarterProvider[] }[] = [
    { id: 'stripe', providers: ['stripe'] },
    { id: 'paypal', providers: ['paypal'] },
    { id: 'both', providers: ['stripe', 'paypal'] }
  ];
  let payChoice = $state('stripe');
  let payProviders: StarterProvider[] = $derived(PAY_CHOICES.find((c) => c.id === payChoice)?.providers ?? ['stripe']);
  let rikmaUrl = $derived(rikmaApiUrl(base?.slug || projectId));
  // Vercel project names are lowercase letters, digits and dashes.
  let starterProject = $derived(
    `${String(base?.slug ?? '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || `rikma-${projectId}`}-shop`.slice(0, 90)
  );
  let deployOpts = $derived({
    rikmaUrl,
    ordersKey: starterKey || undefined,
    projectName: starterProject,
    providers: payProviders
  });
  let deployHref = $derived(starterDeployUrl(deployOpts));
  let netlifyHref = $derived(starterNetlifyUrl(deployOpts));
</script>

<div class="cn">
  <!-- One card, two ways in (the starter is the recommended one): a ready-made shop
       with its own key, or an existing site that reports each sale. Keys with
       other scopes stay on the rikma's API page. -->
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

    <!-- 1 · the starter (PLAN_SHOP_CUSTOMER_EXPERIENCE §7.4): "we have no server" stops being the reason not to connect. -->
    <div class="cn-way cn-way-rec">
      <div class="cn-way-head">
        <h3 class="sh-title cn-title-sm">{$t('shop.connect.starterTitle')}</h3>
        <span class="sh-chip sh-chip-accent">{$t('shop.connect.recommended')}</span>
      </div>
      <p class="cn-body">{$t('shop.connect.starterBody')}</p>
      <h4 class="cn-step">{$t('shop.connect.starterStepKey')}</h4>
      <ShopStarterKey {projectId} {rikmaUrl} bind:rawKey={starterKey} />
      <h4 class="cn-step">{$t('shop.connect.starterStepDeploy')}</h4>
      <div class="cn-pay">
        <span class="cn-pay-label" id="cn-pay-label">{$t('shop.connect.payLabel')}</span>
        <div class="sh-pills" role="group" aria-labelledby="cn-pay-label">
          {#each PAY_CHOICES as c (c.id)}
            <button type="button" class="sh-pill" aria-pressed={payChoice === c.id} onclick={() => (payChoice = c.id)}>
              {$t(`shop.connect.pay_${c.id}`)}
            </button>
          {/each}
        </div>
      </div>
      <p class="cn-hint">{starterKey ? $t('shop.connect.starterDeployReady') : $t('shop.connect.starterDeployHint')}</p>
      <div class="cn-actions">
        <a class="sh-btn sh-btn-primary" href={deployHref} target="_blank" rel="noopener">{$t('shop.connect.starterDeploy')}</a>
        <a class="sh-btn sh-btn-primary" href={netlifyHref} target="_blank" rel="noopener">{$t('shop.connect.starterDeployNetlify')}</a>
        <a class="sh-btn sh-btn-outline" href={STARTER_REPO_URL} target="_blank" rel="noopener">{$t('shop.connect.starterRepo')}</a>
      </div>
    </div>

    <!-- 2 · an existing site reports each sale (PLAN §7.3: SalesApiIntegration moved here). -->
    <div class="cn-way">
      <h3 class="sh-title cn-title-sm">{$t('shop.connect.siteTitle')}</h3>
      <p class="cn-body">{$t('shop.connect.siteBody')}</p>
      <div class="cn-panel">
        <SalesApiIntegration {projectId} rikmaSlug={base?.slug ?? null} bmiData={products} projectUsers={users} />
      </div>
    </div>

    <p class="cn-hint">
      {$t('shop.connect.otherKeys')}
      <a class="cn-docs" href="/moach/{projectId}/api">{$t('shop.connect.docs')}</a>
    </p>
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
  .cn-hint {
    font-size: 13px;
    line-height: 1.5;
    color: var(--sh-muted);
  }
  .cn-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .cn-panel {
    min-width: 0;
  }
  .cn-way {
    text-align: start;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border-radius: var(--sh-radius);
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
    min-width: 0;
  }
  .cn-way-rec {
    border-color: var(--sh-gold-line);
  }
  .cn-way-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .cn-pay {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .cn-pay-label {
    font-size: 14px;
    font-weight: 700;
  }
  .cn-step {
    /* The global h4 face (Glad) draws a 1 as a ב — the step number must read. */
    font-family: 'Heebo', system-ui, sans-serif;
    font-size: 15px;
    font-weight: 800;
    margin-top: 4px;
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
