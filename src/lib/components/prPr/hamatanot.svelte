<script>
  /**
   * The rikma's main sales page (canvas "Main" / "DesktopOverview",
   * PLAN_SHOP_CUSTOMER_EXPERIENCE §7.3): how much is waiting to be split, the
   * way to split it, what sold when, and the products. A re-skin on the shop
   * design layer (`$lib/styles/shop.css`) — the money flows are the same ones
   * as before: reporting goes through `SaleComponent` (createSale + holder
   * consent), the split through `whowhat.svelte` (createTosplit /
   * updateTosplitProposal / site share), discovery through
   * `setMatanotDiscovery`.
   */
  import '$lib/styles/shop.css';
  import { useFormatMoney } from '$lib/money/context.svelte';
  import Money from '$lib/components/money/Money.svelte';
  import New from './newmatana.svelte';
  import { SaleComponent } from '$lib/components/sales';
  import dayjs from 'dayjs';
  import 'dayjs/locale/he.js';
  import 'dayjs/locale/ar.js';
  import 'dayjs/locale/ru.js';
  import 'dayjs/locale/es.js';
  import { lang } from '$lib/stores/lang.js';
  import { t, isRtl } from '$lib/translations';
  import { get } from 'svelte/store';
  import { idPr } from '$lib/stores/idPr.js';
  import { page } from '$app/state';
  import { goto, pushState } from '$app/navigation';
  import { pack, hierarchy } from 'd3-hierarchy';
  import Halu from './whowhat.svelte';
  import Spinner from '$lib/celim/Spinner.svelte';
  import ShopSheet from '$lib/components/shop/ShopSheet.svelte';
  import ShareButtons from '$lib/components/share/shareButtons/index.svelte';
  import { toast } from 'svelte-sonner';
  import { isSiteShareNote, parseSiteShareNote } from '$lib/revenue/parseSiteShareNote';
  import { executeAction } from '$lib/client/actionClient';
  import {
    chartSeries,
    filterByStage,
    holderState,
    newestFirst,
    productTotals,
    saleStage,
    salesYears,
    stageShares,
    stageSummary
  } from '$lib/shop/salesOverview';
  import { splitPreview } from '$lib/revenue/splitPreview';

  const fmtMoney = useFormatMoney();

  // Site-share income Sales created before the mutation set a `date` have a null
  // date, which dayjs renders as "Invalid Date". Fall back to a dash.
  function formatSaleDate(date) {
    const d = dayjs(date);
    return date && d.isValid() ? d.format('D.M.YY') : '—';
  }

  // One-line, human-readable summary of a site-share note — never the raw note.
  function siteShareSummary(note) {
    const p = parseSiteShareNote(note);
    if (!p) return note || '';
    const parts = [$t('project.hamatanot.siteShare.label')];
    if (p.fromProjectId)
      parts.push(`${$t('project.hamatanot.siteShare.fromRikma')} #${p.fromProjectId}`);
    if (p.paid !== null)
      parts.push(`${$t('project.hamatanot.siteShare.paid')} ${fmtMoney(p.paid)}`);
    if (p.adjustDirection) {
      const dir =
        p.adjustDirection === 'less'
          ? $t('project.hamatanot.siteShare.less')
          : $t('project.hamatanot.siteShare.more');
      const proposed = p.proposed !== null ? ` (${fmtMoney(p.proposed)})` : '';
      const reason = p.reason ? ` - ${p.reason}` : '';
      parts.push(`${dir}${proposed}${reason}`);
    }
    return parts.join(' · ');
  }

  /**
   * @typedef {Object} Matana
   * @property {string} id
   * @property {{ name: string, price: number, quant: number, kindOf: string, hideFromDiscovery?: boolean }} attributes
   */

  let {
    /** @type {Array<any>} */
    fmiData = [],
    /** @type {Array<any>} */
    rikmashes = [],
    /**
     * Confirmed subsistence-stipend payments (PLAN_STIPEND). They carry the
     * equity credit/debit lines the split table has to fold into each
     * member's contribution total.
     * @type {Array<any>}
     */
    stipendPayments = [],
    /** @type {string} */
    projectId,
    /** @type {Array<any>} */
    trili,
    /** @type {Array<Matana>} */
    bmiData = $bindable([]),
    /** @type {Array<any>} */
    salee = $bindable([]),
    /** @type {Array<any>} */
    projectUsers = [],
    /** @type {any} */
    restime,
    /** The signed-in member — "the money is with you". @type {string | null} */
    uid = null,
    /** @type {string} */
    projectName = '',
    /** What sits under the header: the orders banner and "manage sales". @type {import('svelte').Snippet | undefined} */
    top
  } = $props();

  // ── reporting a sale / a new product — one sheet ──
  let isOpen = $state(false);
  let a = $state(0); // 0 sale · 1 new product · 3 error
  let kindOf = $state();
  let kindUlimit = $state(false);
  let quant = $state(),
    each = $state(),
    maid = $state();
  function sell(id, v, z, isto) {
    maid = id;
    each = v;
    quant = z;
    kindOf = isto;
    kindUlimit = isto == 'unlimited';
    isOpen = true;
    a = 0;
  }
  /** "Report a sale" without a product picked yet: the sheet opens on the picker. */
  function reportSale() {
    const only = bmiData.length === 1 ? bmiData[0] : null;
    if (only) {
      sell(only.id, only.attributes.price, only.attributes.quant, only.attributes.kindOf);
      return;
    }
    maid = undefined;
    isOpen = true;
    a = 0;
  }
  function addnew() {
    isOpen = true;
    a = 1;
  }
  const closer = () => {
    isOpen = false;
    a = 0;
  };
  const sale = (event) => {
    const id = event.id;
    const un = event.un;
    let oldob = bmiData;
    const x = oldob.map((c) => c.id);
    const indexy = x.indexOf(id);

    // עדכון כמות רק אם יש un (לא unlimited) והאינדקס נמצא
    if (un !== undefined && indexy !== -1) {
      oldob[indexy].quant = un;
      bmiData = oldob;
    }

    isOpen = false;
    a = 0;
    salee.push(event.matana);
  };
  function saleUnlimited() {
    // עבור מוצרים unlimited - סגירת הדיאלוג בלבד
    // המכירה כבר נוצרה בשרת, אין צורך לעדכן כמות
    isOpen = false;
    a = 0;
  }
  function done(event) {
    isOpen = false;
    a = 0;
    bmiData.push(event.matana);
    bmiData = bmiData;
    // The quick form sets the basics; variants, the gallery and stock live in the full editor.
    const id = event.matana?.id;
    if (id != null) {
      toast.success($t('project.hamatanot.createdAddVariants'), {
        action: {
          label: $t('project.hamatanot.addVariants'),
          onClick: () => goto(`/moach/${projectId}/sales/manage/products/${id}`)
        }
      });
    }
  }

  /** @type {string | null} */
  let discoveryBusyId = $state(null);

  /**
   * Show / hide one product in the public products directory (/gift).
   * Hiding is only about that listing — the product keeps its own page, stays
   * on the rikma's page and can still be sold. null-legacy reads as "shown".
   * @param {Matana} data
   */
  async function toggleDiscovery(data) {
    if (discoveryBusyId) return;
    const next = !data.attributes.hideFromDiscovery;
    discoveryBusyId = data.id;
    try {
      const res = await executeAction('setMatanotDiscovery', {
        matanotId: String(data.id),
        hideFromDiscovery: next
      });
      if (!res.success) throw new Error(res.error?.message ?? 'failed');
      bmiData = bmiData.map((p) =>
        p.id === data.id ? { ...p, attributes: { ...p.attributes, hideFromDiscovery: next } } : p
      );
      toast.success(
        next ? $t('project.hamatanot.discovery.nowHidden') : $t('project.hamatanot.discovery.nowShown')
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      discoveryBusyId = null;
    }
  }

  // ── the split screen: its own history entry, so a phone's back button returns ──
  let splitOpen = $derived(!!page.state?.salesSplit);
  function openSplit() {
    pushState('', { salesSplit: true });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  }
  function closeSplit() {
    if (page.state?.salesSplit) history.back();
  }

  // A sale can reference a gift (matanot) that was deleted or not populated,
  // leaving matanot.data === null. Guard the whole chain so the component never
  // crashes on render/hydration; fall back to a generic label.
  function getMatanaName(sale) {
    const linked = sale?.attributes?.matanot?.data?.attributes?.name;
    if (linked) return linked;
    // Site-share income Sales carry no product; label them by their nature.
    if (isSiteShareNote(sale?.attributes?.note)) {
      return $t('project.hamatanot.siteShare.label');
    }
    return get(t)('project.hamatanot.unknownProduct');
  }
  const holderOf = (sale) => sale?.attributes?.users_permissions_user?.data;
  const initialOf = (name) => (String(name || '?').trim().charAt(0) || '?').toUpperCase();

  // Holder-consent status chip (PLAN_sale_holder_consent). holderStatus is
  // null for legacy sales predating this feature — shown as unverified but
  // still counted (grandfathered).
  function holderChip(sale) {
    const hs = holderState(sale);
    if (hs === 'self') return { cls: 'sh-chip-ok', text: $t('project.misc.verifiedSelf') };
    if (hs === 'open')
      return {
        cls: 'sh-chip-accent',
        text: $t('project.misc.awaitingHolderConsent', { holderName: holderOf(sale)?.attributes?.username ?? '' })
      };
    if (hs === 'timeout') return { cls: 'sh-chip-gold', text: $t('project.hamatanot.autoApproved') };
    if (hs === 'confirmed') return { cls: 'sh-chip-ok', text: $t('project.hamatanot.confirmed') };
    return { cls: 'sh-chip-muted', text: $t('project.hamatanot.unverifiedLegacy') };
  }
  const STAGE_KEY = { waiting: 'awaiting', voting: 'pending', split: 'split' };

  // ── the headline ──
  let summary = $derived(stageSummary(salee));
  let shares = $derived(stageShares(summary));
  let proposal = $derived(trili?.[0] ?? null);
  let proposalYes = $derived(
    (proposal?.attributes?.vots ?? []).filter((v) => v?.what === true).length
  );
  let preview = $derived(
    proposal
      ? null
      : splitPreview({ users: projectUsers, fmiData, rikmashes, stipendPayments, sales: salee })
  );
  let flows = $derived(
    preview && preview.revach > 0.01 ? preview.rows.filter((r) => r.x > 0.01 || r.ihave > 0.01) : []
  );

  // ── the chart ──
  /** @type {'daily' | 'monthly' | 'yearly'} */
  let chartPeriod = $state('daily');
  let selectedChartYear = $state(dayjs().year());
  let availableYears = $derived(salesYears(salee));
  $effect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedChartYear)) {
      selectedChartYear = availableYears[0];
    }
  });
  $effect(() => {
    dayjs.locale($lang);
  });
  const DAYS = 14;
  let series = $derived(chartSeries(salee, chartPeriod, { year: selectedChartYear, days: DAYS }));
  let seriesMax = $derived(series.reduce((m, p) => Math.max(m, p.total), 0));
  let bars = $derived.by(() => {
    void $lang;
    return series.map((p, i) => ({
      ...p,
      label:
        chartPeriod === 'daily'
          ? dayjs(p.key).format('D.M')
          : chartPeriod === 'monthly'
            ? dayjs(`${p.key}-01`).format('MMM')
            : p.key,
      height: seriesMax > 0 ? Math.max(2, (Math.max(0, p.total) / seriesMax) * 100) : 2,
      // The phone shows the last week; the desktop the last two.
      older: chartPeriod === 'daily' && i < series.length - 7,
      last: i === series.length - 1
    }));
  });
  let chartTitle = $derived(
    chartPeriod === 'daily'
      ? $t('project.hamatanot.salesByDate')
      : chartPeriod === 'monthly'
        ? $t('project.hamatanot.salesByMonth')
        : $t('project.hamatanot.salesByYear')
  );

  // ── by product ──
  let byProduct = $derived(productTotals(salee, getMatanaName));
  const BUBBLE_FILLS = ['var(--sh-accent)', 'var(--sh-gold)', 'var(--sh-info-ink)', 'var(--sh-ok-ink)', 'var(--sh-ink)', 'var(--sh-muted)'];
  const BUBBLE = 320;
  let bubbles = $derived.by(() => {
    const top = byProduct.filter((p) => p.amount > 0).slice(0, BUBBLE_FILLS.length);
    if (top.length === 0) return [];
    const root = hierarchy({ children: top.map((p, i) => ({ ...p, i })) }).sum((d) => d.amount ?? 0);
    const layout = /** @type {any} */ (pack()).size([BUBBLE, BUBBLE]).padding(6);
    return layout(root).leaves().map((n) => ({
      x: n.x,
      y: n.y,
      r: n.r,
      name: n.data.name,
      fill: BUBBLE_FILLS[n.data.i]
    }));
  });

  // ── the sales list ──
  /** @type {'waiting' | 'voting' | 'split' | 'all'} */
  let saleFilter = $state('waiting');
  let showAll = $state(false);
  const FIRST = 6;
  let filtered = $derived(newestFirst(filterByStage(salee, saleFilter)));
  let shownSales = $derived(showAll ? filtered : filtered.slice(0, FIRST));
  /** @type {Array<{ id: 'waiting' | 'voting' | 'split' | 'all', label: string, count: number }>} */
  let filters = $derived([
    { id: 'waiting', label: $t('project.hamatanot.awaiting'), count: summary.waiting.count },
    { id: 'voting', label: $t('project.hamatanot.pending'), count: summary.voting.count },
    { id: 'split', label: $t('project.hamatanot.split'), count: summary.split.count },
    { id: 'all', label: $t('shop.sp.filterAll'), count: summary.total.count }
  ]);

  function kindLabel(k) {
    if (k == 'total') return $t('project.hamatanot.perUnit');
    if (k == 'monthly') return $t('project.hamatanot.monthly');
    if (k == 'yearly') return $t('project.hamatanot.yearly');
    if (k == 'unlimited') return $t('project.hamatanot.unlimited');
    return '';
  }
  function stockLabel(p) {
    const q = p.attributes.quant;
    if (p.attributes.kindOf == 'unlimited') return $t('project.hamatanot.unlimited');
    if (q === -1) return $t('project.hamatanot.perUnitUnlimited');
    if (q > 0) return `${$t('project.hamatanot.quantity')} ${q}`;
    return $t('shop.products.soldOut');
  }
  const salesN = (n) => (n === 1 ? $t('shop.sp.salesCountOne') : $t('shop.sp.salesCount', { count: n }));
  let picked = $derived(bmiData.find((p) => p.id === maid) ?? null);
  let myName = $derived(
    uid ? (projectUsers.find((u) => String(u.id) === String(uid))?.attributes?.username ?? '') : ''
  );
</script>

<ShopSheet bind:open={isOpen} label={a == 1 ? $t('project.hamatanot.createProduct') : $t('project.hamatanot.reportSale')}>
  <div class="sp-sheet" dir={$isRtl ? 'rtl' : 'ltr'}>
    {#if a == 1}
      <New {projectId} onDone={done} />
    {:else if a == 3}
      <div class="sh-empty">
        <strong>{$t('project.hamatanot.error')}</strong>
        <button type="button" class="sh-btn sh-btn-primary" onclick={() => (a = 0)}>{$t('project.hamatanot.tryAgain')}</button>
      </div>
    {:else}
      <h2 class="sh-title sp-sheet-title">{$t('project.hamatanot.reportSale')}</h2>
      {#if bmiData.length === 0}
        <div class="sh-empty">
          <strong>{$t('shop.sp.noProducts')}</strong>
          <p>{$t('shop.sp.noProductsBody')}</p>
          <button type="button" class="sh-btn sh-btn-primary" onclick={addnew}>{$t('project.hamatanot.createProduct')}</button>
        </div>
      {:else}
        <fieldset class="sp-pick">
          <legend class="sh-section-label">{$t('shop.sp.whatSold')}</legend>
          {#each bmiData as p (p.id)}
            <button
              type="button"
              role="radio"
              aria-checked={p.id === maid}
              class="sp-radio"
              onclick={() => sell(p.id, p.attributes.price, p.attributes.quant, p.attributes.kindOf)}
            >
              <span class="sp-radio-name">{p.attributes.name}</span>
              <span class="sp-radio-meta"><bdi><Money amount={p.attributes.price} /></bdi> · {kindLabel(p.attributes.kindOf)}</span>
            </button>
          {/each}
        </fieldset>
        {#if picked}
          {#key maid}
            <SaleComponent
              skin="shop"
              productId={maid}
              productName={picked.attributes.name}
              availableQuantity={quant}
              price={each}
              {kindOf}
              projectId={$idPr}
              {projectUsers}
              {kindUlimit}
              meId={uid}
              defaultHolder={myName}
              onDoners={saleUnlimited}
              onDone={sale}
              onError={() => (a = 3)}
            />
          {/key}
        {/if}
      {/if}
    {/if}
  </div>
</ShopSheet>

<div class="shop-ui sp" dir={$isRtl ? 'rtl' : 'ltr'}>
  {#if splitOpen}
    <header class="sp-head">
      <button type="button" class="sh-btn sh-btn-quiet sh-btn-icon" aria-label={$t('shop.manage.back')} onclick={closeSplit}>
        <svg class="sp-flip" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
      </button>
      <div class="sp-head-text">
        <nav class="sp-crumbs" aria-label={$t('shop.manage.crumbSales')}>
          <button type="button" class="sp-crumb-link" onclick={closeSplit}>{$t('shop.page.title')}</button> › <span>{$t('shop.sp.splitTitle')}</span>
        </nav>
        <span class="sp-sub">
          {$t('shop.sp.splitSub', { count: summary.waiting.count + summary.voting.count, partners: projectUsers.length })}
        </span>
        <h1 class="sh-title sp-h1">{$t('shop.sp.splitTitle')}</h1>
      </div>
    </header>
    <Halu
      {trili}
      {salee}
      allin={summary.waiting.amount + summary.voting.amount}
      {fmiData}
      users={projectUsers}
      {rikmashes}
      {stipendPayments}
      {restime}
    />
  {:else}
    <header class="sp-head">
      <div class="sp-head-text">
        {#if projectName}<span class="sp-sub">{projectName}</span>{/if}
        <h1 class="sh-title sp-h1">{$t('shop.page.title')}</h1>
      </div>
      <button type="button" class="sh-btn sh-btn-primary" onclick={reportSale}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        {$t('project.hamatanot.reportSale')}
      </button>
    </header>

    {@render top?.()}

    <section class="sp-kpis" aria-label={$t('shop.sp.kpiLabel')}>
      <div class="sh-card sp-kpi">
        <span class="sh-section-label">{$t('shop.sp.kpiTotal')}</span>
        <span class="sp-kpi-value"><bdi>{fmtMoney(summary.total.amount)}</bdi></span>
        <span class="sp-kpi-sub">{salesN(summary.total.count)}</span>
      </div>
      <div class="sh-card sp-kpi sp-kpi-gold">
        <span class="sh-section-label">{$t('project.hamatanot.awaiting')}</span>
        <span class="sp-kpi-value sp-gold"><bdi>{fmtMoney(summary.waiting.amount)}</bdi></span>
        <span class="sp-kpi-sub">{salesN(summary.waiting.count)}</span>
      </div>
      <div class="sh-card sp-kpi">
        <span class="sh-section-label">{$t('project.hamatanot.pending')}</span>
        <span class="sp-kpi-value sp-info"><bdi>{fmtMoney(summary.voting.amount)}</bdi></span>
        <span class="sp-kpi-sub">
          {proposal ? $t('shop.sp.votesOf', { yes: proposalYes, total: projectUsers.length }) : $t('shop.sp.noVote')}
        </span>
      </div>
      <div class="sh-card sp-kpi">
        <span class="sh-section-label">{$t('project.hamatanot.split')}</span>
        <span class="sp-kpi-value sp-ok"><bdi>{fmtMoney(summary.split.amount)}</bdi></span>
        <span class="sp-kpi-sub">{salesN(summary.split.count)}</span>
      </div>
    </section>

    <div class="sp-row">
      <section class="sh-card-2 sp-headline" aria-label={$t('project.hamatanot.awaitingEarnings')}>
        <h2 class="sh-section-label">{$t('project.hamatanot.awaitingEarnings')}</h2>
        <div class="sp-big">
          <span class="sp-big-value"><bdi>{fmtMoney(summary.waiting.amount)}</bdi></span>
          <span class="sp-muted">{salesN(summary.waiting.count)}</span>
        </div>
        {#if summary.total.count > 0}
          <div
            class="sp-stack"
            role="img"
            aria-label={$t('shop.sp.stackLabel', {
              total: fmtMoney(summary.total.amount),
              split: fmtMoney(summary.split.amount),
              voting: fmtMoney(summary.voting.amount),
              waiting: fmtMoney(summary.waiting.amount)
            })}
          >
            <span class="sp-seg-split" style:width="{shares.split}%"></span>
            <span class="sp-seg-voting" style:width="{shares.voting}%"></span>
            <span class="sp-seg-waiting" style:width="{shares.waiting}%"></span>
          </div>
          <div class="sp-legend">
            <div><span class="sp-key"><i class="sp-dot sp-seg-waiting"></i>{$t('project.hamatanot.awaiting')}</span><strong><bdi>{fmtMoney(summary.waiting.amount)}</bdi></strong></div>
            <div><span class="sp-key"><i class="sp-dot sp-seg-voting"></i>{$t('project.hamatanot.pending')}</span><strong><bdi>{fmtMoney(summary.voting.amount)}</bdi></strong></div>
            <div><span class="sp-key"><i class="sp-dot sp-seg-split"></i>{$t('project.hamatanot.split')}</span><strong><bdi>{fmtMoney(summary.split.amount)}</bdi></strong></div>
          </div>

          {#if flows.length > 0}
            <div class="sp-flows">
              <span class="sh-section-label">{$t('shop.sp.flowsTitle')}</span>
              {#each flows as f (f.uid)}
                <div class="sp-flow">
                  <span class="sp-av" aria-hidden="true">{initialOf(f.username)}</span>
                  <span class="sp-flow-name">{f.username} <span class="sp-muted">· {f.p.toFixed(0)}%</span></span>
                  {#if f.noten > 0.01}
                    <span class="sh-chip sh-chip-accent">{$t('shop.sp.give', { amount: fmtMoney(f.noten) })}</span>
                  {:else if f.meca > 0.01}
                    <span class="sh-chip sh-chip-ok">{$t('shop.sp.receive', { amount: fmtMoney(f.meca) })}</span>
                  {:else}
                    <span class="sh-chip sh-chip-muted">{$t('mission.whowhat.balanced')}</span>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}

          <div class="sp-actions">
            <button type="button" class="sh-btn sh-btn-primary sh-btn-lg sp-grow" onclick={openSplit}>
              {proposal ? $t('project.hamatanot.viewSplitOffer') : $t('project.hamatanot.requestSplit')}
            </button>
            <button type="button" class="sh-btn sh-btn-outline sp-tall" onclick={openSplit}>{$t('shop.sp.whoToWhom')}</button>
          </div>
          {#if proposal}
            <p class="sp-vote-line">
              {$t('shop.sp.voteLine', {
                amount: fmtMoney(summary.voting.amount),
                yes: proposalYes,
                total: projectUsers.length
              })}
            </p>
          {/if}
        {:else}
          <p>{$t('shop.sp.emptyBody')}</p>
          <div class="sp-actions">
            <button type="button" class="sh-btn sh-btn-primary sh-btn-lg sp-grow" onclick={reportSale}>{$t('project.hamatanot.reportSale')}</button>
          </div>
        {/if}
      </section>

      {#if summary.total.count > 0}
        <section class="sh-card sp-chart" aria-label={chartTitle}>
          <div class="sp-chart-head">
            <h2 class="sp-h2">{chartTitle}</h2>
            <div class="sp-chart-tools">
              {#if chartPeriod === 'monthly' && availableYears.length > 1}
                <label class="sp-year">
                  <span class="sp-sr">{$t('project.hamatanot.selectYear')}</span>
                  <select
                    class="sh-input"
                    value={selectedChartYear}
                    onchange={(e) => (selectedChartYear = Number(e.currentTarget.value))}
                  >
                    {#each availableYears as year (year)}
                      <option value={year}>{year}</option>
                    {/each}
                  </select>
                </label>
              {/if}
              <div class="sh-seg sp-period" role="group" aria-label={$t('shop.sp.periodLabel')}>
                <button type="button" aria-pressed={chartPeriod === 'daily'} onclick={() => (chartPeriod = 'daily')}>{$t('project.hamatanot.chartPeriodDaily')}</button>
                <button type="button" aria-pressed={chartPeriod === 'monthly'} onclick={() => (chartPeriod = 'monthly')}>{$t('project.hamatanot.chartPeriodMonthly')}</button>
                <button type="button" aria-pressed={chartPeriod === 'yearly'} onclick={() => (chartPeriod = 'yearly')}>{$t('project.hamatanot.chartPeriodYearly')}</button>
              </div>
            </div>
          </div>
          {#if seriesMax > 0}
            <ol class="sp-bars" class:sp-bars-many={bars.length > 7}>
              {#each bars as b (b.key)}
                <li class="sp-bar-col" class:sp-older={b.older}>
                  <span class="sp-sr">{b.label}: {fmtMoney(b.total)}</span>
                  <span class="sp-bar-val" aria-hidden="true">{b.total > 0 ? fmtMoney(b.total, null, { notation: 'compact' }) : ''}</span>
                  <span class="sp-bar-track" aria-hidden="true">
                    <span class="sp-bar" class:sp-bar-last={b.last} style:height="{b.height}%"></span>
                  </span>
                  <span class="sp-bar-label" aria-hidden="true">{b.label}</span>
                </li>
              {/each}
            </ol>
          {:else}
            <p class="sp-chart-empty">{$t('project.hamatanot.noSalesInPeriod')}</p>
          {/if}
        </section>
      {/if}
    </div>

    {#if summary.total.count > 0}
      <section class="sp-sales" aria-label={$t('shop.sp.salesTitle')}>
        <div class="sp-sec-head">
          <h2 class="sp-h2">{$t('shop.sp.salesTitle')}</h2>
          <a class="sp-link" href="/moach/{projectId}/sales/manage/sales">{$t('shop.sp.tableLink')}</a>
        </div>
        <div class="sh-pills" role="group" aria-label={$t('shop.sp.filterLabel')}>
          {#each filters as f (f.id)}
            <button
              type="button"
              class="sh-pill"
              aria-pressed={saleFilter === f.id}
              onclick={() => {
                saleFilter = f.id;
                showAll = false;
              }}
            >
              {f.label}{#if f.count > 0}<span class="sh-pill-count"> · {f.count}</span>{/if}
            </button>
          {/each}
        </div>
        {#if shownSales.length === 0}
          <p class="sp-none">{$t('shop.sp.noneInFilter')}</p>
        {:else}
          <div class="sp-cards">
            {#each shownSales as s (s.id)}
              {@const st = saleStage(s)}
              {@const chip = holderChip(s)}
              {@const holder = holderOf(s)}
              {@const mine = uid != null && String(holder?.id) === String(uid)}
              <article class="sh-card-2 sp-sale sp-stage-{st}">
                <div class="sp-sale-top">
                  <span class="sp-sale-name">{getMatanaName(s)}</span>
                  <strong class="sp-sale-amount"><Money amount={s.attributes.in} entry={s.attributes} /></strong>
                </div>
                <div class="sp-sale-meta">
                  <span class="sp-av sp-av-sm" aria-hidden="true">{initialOf(holder?.attributes?.username)}</span>
                  <span class="sp-muted sp-sale-holder">
                    {mine
                      ? $t('shop.sp.moneyWithYou')
                      : $t('shop.sp.moneyWith', { name: holder?.attributes?.username ?? '' })} · {formatSaleDate(s.attributes.date)}
                  </span>
                </div>
                <div class="sp-sale-chips">
                  {#if st !== 'waiting'}
                    <span class="sh-chip {st === 'split' ? 'sh-chip-ok' : 'sh-chip-info'}">{$t(`project.hamatanot.${STAGE_KEY[st]}`)}</span>
                  {/if}
                  <span class="sh-chip {chip.cls}">{chip.text}</span>
                </div>
                {#if isSiteShareNote(s.attributes.note)}
                  <p class="sp-note">{siteShareSummary(s.attributes.note)}</p>
                {:else if s.attributes.note}
                  <p class="sp-note">{s.attributes.note}</p>
                {/if}
              </article>
            {/each}
          </div>
          {#if filtered.length > FIRST}
            <button type="button" class="sh-btn sh-btn-quiet sp-more" onclick={() => (showAll = !showAll)}>
              {showAll ? $t('shop.sp.showLess') : $t('shop.sp.showAll', { count: filtered.length })}
            </button>
          {/if}
        {/if}
      </section>

      {#if byProduct.length > 0}
        <section class="sh-card sp-byprod" aria-label={$t('project.hamatanot.salesByProduct')}>
          <h2 class="sp-h2">{$t('project.hamatanot.salesByProduct')}</h2>
          <div class="sp-byprod-body">
            {#if bubbles.length > 1}
              <svg class="sp-bubbles" viewBox="0 0 {BUBBLE} {BUBBLE}" aria-hidden="true">
                {#each bubbles as c (c.name)}
                  <circle cx={c.x} cy={c.y} r={c.r} fill={c.fill} />
                  {#if c.r > 34}
                    <text x={c.x} y={c.y} text-anchor="middle" dominant-baseline="central" class="sp-bubble-text">{c.name.split(' · ')[0].slice(0, Math.floor(c.r / 5))}</text>
                  {/if}
                {/each}
              </svg>
            {/if}
            <ol class="sp-prodlist">
              {#each byProduct as p, i (p.name)}
                <li>
                  <span class="sp-swatch" style:background={BUBBLE_FILLS[i] ?? 'var(--sh-line)'} aria-hidden="true"></span>
                  <span class="sp-prod-name">{p.name}</span>
                  <bdi class="sp-prod-amount">{fmtMoney(p.amount)}</bdi>
                  <span class="sp-muted sp-prod-pct">{Math.round(p.share * 100)}%</span>
                </li>
              {/each}
            </ol>
          </div>
        </section>
      {/if}
    {/if}

    <section class="sp-products" aria-label={$t('project.hamatanot.ourProducts')}>
      <div class="sp-sec-head">
        <h2 class="sp-h2">{$t('project.hamatanot.ourProducts')}</h2>
        <div class="sp-sec-actions">
          <button type="button" class="sh-btn sh-btn-outline" onclick={addnew}>{$t('project.hamatanot.createProduct')}</button>
          <a class="sh-btn sh-btn-quiet" href="/moach/{$idPr}/sales/new">{$t('project.hamatanot.complexProduct')}</a>
        </div>
      </div>
      {#if bmiData.length > 0}
        <div class="sp-prod-grid">
          {#each bmiData as data (data.id)}
            <article class="sh-card sp-prod">
              <div class="sp-prod-top">
                <div class="sp-prod-text">
                  <a class="sp-prod-title" href="/gift/{data.id}">{data.attributes.name}</a>
                  <span class="sp-muted">{kindLabel(data.attributes.kindOf)} · {stockLabel(data)}</span>
                </div>
                <strong class="sp-gold"><Money amount={data.attributes.price} /></strong>
              </div>
              <div class="sp-prod-actions">
                <button
                  type="button"
                  class="sh-btn sp-disc"
                  class:sp-disc-off={data.attributes.hideFromDiscovery}
                  disabled={discoveryBusyId === data.id}
                  aria-pressed={!data.attributes.hideFromDiscovery}
                  title={data.attributes.hideFromDiscovery
                    ? $t('project.hamatanot.discovery.showTitle')
                    : $t('project.hamatanot.discovery.hideTitle')}
                  onclick={() => toggleDiscovery(data)}
                >
                  {#if discoveryBusyId === data.id}
                    <Spinner size="xs" />
                  {:else if data.attributes.hideFromDiscovery}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.9 5.1A10.4 10.4 0 0112 5c5 0 9 4.5 10 7a13 13 0 01-3.1 4.1M6.1 6.1A13.3 13.3 0 002 12c1 2.5 5 7 10 7a9.8 9.8 0 004.1-.9" /></svg>
                  {:else}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
                  {/if}
                  {data.attributes.hideFromDiscovery
                    ? $t('project.hamatanot.discovery.hidden')
                    : $t('project.hamatanot.discovery.shown')}
                </button>
                <a class="sh-btn sh-btn-quiet" href="/moach/{projectId}/sales/manage/products/{data.id}">
                  {$t('project.hamatanot.fullEdit')}
                </a>
                <div class="sp-share">
                  <ShareButtons
                    slug="gift/{data.id}"
                    title={data.attributes.name}
                    desc={`Check out this amazing gift: ${data.attributes.name} for ${data.attributes.price}`}
                  />
                </div>
                <button
                  type="button"
                  class="sh-btn sh-btn-outline sp-push"
                  onclick={() => sell(data.id, data.attributes.price, data.attributes.quant, data.attributes.kindOf)}
                >
                  {$t('project.hamatanot.reportSale')}
                </button>
              </div>
            </article>
          {/each}
        </div>
      {:else}
        <p class="sp-none">{$t('shop.sp.noProducts')}</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .sp {
    max-width: 1400px;
    margin: 0 auto;
    padding: 12px 16px 24px;
    background: var(--sh-page);
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-x: clip;
  }
  /* SalesShortcuts brings its own width and gutter; inside this page it is a row. */
  .sp :global(.sc) {
    max-width: none;
    margin: 0;
    padding: 0;
  }
  .sp-sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .sp-muted {
    color: var(--sh-muted);
  }
  .sp-gold {
    color: var(--sh-gold);
  }
  .sp-info {
    color: var(--sh-info-ink);
  }
  .sp-ok {
    color: var(--sh-ok-ink);
  }
  :global([dir='ltr']) .sp-flip {
    transform: scaleX(-1);
  }

  /* header */
  .sp-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .sp-head-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
  }
  .sp-sub {
    font-size: 12px;
    color: var(--sh-muted);
  }
  .sp-h1 {
    font-size: 26px;
  }
  .sp-crumbs {
    display: none;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .sp-crumb-link {
    border: 0;
    padding: 0;
    background: none;
    color: var(--sh-gold);
    font-size: 13px;
  }
  .sp-h2 {
    font-size: 16px;
    font-weight: 700;
  }

  /* KPIs: desktop only */
  .sp-kpis {
    display: none;
  }
  .sp-kpi {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    min-width: 0;
  }
  .sp-kpi-gold {
    border-color: var(--sh-gold-line);
  }
  .sp-kpi-value {
    font-family: var(--sh-display);
    font-size: 30px;
    line-height: 1;
    color: var(--sh-ink);
  }
  .sp-kpi-sub {
    font-size: 12px;
    color: var(--sh-muted);
  }

  .sp-row {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* the headline */
  .sp-headline {
    border-color: var(--sh-gold-line);
    border-radius: var(--sh-radius-lg);
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .sp-big {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px;
  }
  .sp-big-value {
    font-family: var(--sh-display);
    font-size: 44px;
    line-height: 1;
    color: var(--sh-gold);
  }
  .sp-big .sp-muted {
    font-size: 13px;
  }
  .sp-stack {
    display: flex;
    height: 10px;
    border-radius: 9999px;
    overflow: hidden;
    background: var(--sh-line);
  }
  .sp-seg-split {
    background: var(--sh-ok-ink);
  }
  .sp-seg-voting {
    background: var(--sh-info-ink);
  }
  .sp-seg-waiting {
    background: var(--sh-gold);
  }
  .sp-legend {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    font-size: 12px;
  }
  .sp-legend > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .sp-legend strong {
    font-size: 14px;
  }
  .sp-key {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--sh-muted);
  }
  .sp-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }
  .sp-flows {
    display: none;
    flex-direction: column;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--sh-line);
  }
  .sp-flow {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }
  .sp-flow-name {
    flex: 1 1 auto;
    min-width: 0;
  }
  .sp-av {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 50%;
    border: 1px solid var(--sh-gold);
    color: var(--sh-gold);
    background: var(--sh-card);
    font-size: 13px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .sp-av-sm {
    width: 22px;
    height: 22px;
    font-size: 11px;
  }
  .sp-actions {
    display: flex;
    gap: 8px;
  }
  .sp-grow {
    flex: 1 1 auto;
  }
  .sp-tall {
    min-height: 52px;
  }
  .sp-vote-line {
    font-size: 12px;
    color: var(--sh-info-ink);
  }

  /* the chart */
  .sp-chart {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .sp-chart-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sp-chart-tools {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sp-period button {
    min-height: 36px;
    padding: 0 10px;
    font-size: 13px;
  }
  .sp-year .sh-input {
    min-height: 40px;
    width: auto;
    padding: 0 8px;
  }
  .sp-bars {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    align-items: stretch;
    gap: 8px;
    height: 180px;
  }
  .sp-bar-col {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .sp-bar-val,
  .sp-bar-label {
    font-size: 10px;
    color: var(--sh-muted);
    white-space: nowrap;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    min-height: 13px;
  }
  .sp-bar-track {
    flex: 1 1 auto;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    border-bottom: 1px solid var(--sh-line);
  }
  .sp-bar {
    display: block;
    width: 100%;
    max-width: 32px;
    border-radius: 6px 6px 2px 2px;
    background: var(--sh-accent);
    opacity: 0.7;
  }
  .sp-bar-last {
    opacity: 1;
  }
  /* A phone shows the last week of the two. */
  @media (max-width: 899px) {
    .sp-older {
      display: none;
    }
  }
  /* Twelve months at 375px: every other label. */
  @media (max-width: 899px) {
    .sp-bars-many .sp-bar-col:nth-child(even) .sp-bar-label,
    .sp-bars-many .sp-bar-col:nth-child(even) .sp-bar-val {
      visibility: hidden;
    }
  }
  .sp-chart-empty {
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  /* the sales */
  .sp-sales,
  .sp-products {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
  }
  .sp-sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sp-sec-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sp-link {
    font-size: 13px;
    font-weight: 700;
  }
  .sp-cards {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 8px;
  }
  .sp-sale {
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }
  .sp-stage-voting {
    border-color: color-mix(in srgb, var(--sh-info-ink) 45%, transparent);
  }
  .sp-stage-split {
    border-color: color-mix(in srgb, var(--sh-ok-ink) 35%, transparent);
  }
  .sp-sale-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sp-sale-name {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sp-sale-amount {
    font-size: 16px;
    color: var(--sh-gold);
    white-space: nowrap;
  }
  .sp-sale-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .sp-sale-holder {
    font-size: 12px;
    min-width: 0;
  }
  .sp-sale-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .sp-note {
    padding: 8px 10px;
    border-radius: var(--sh-radius-xs);
    background: var(--sh-card);
    font-size: 12px;
    overflow-wrap: anywhere;
  }
  .sp-none {
    font-size: 14px;
    padding: 8px 2px;
  }
  .sp-more {
    align-self: center;
  }

  /* by product */
  .sp-byprod {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .sp-byprod-body {
    display: flex;
    align-items: center;
    gap: 20px;
  }
  .sp-bubbles {
    display: none;
    width: 260px;
    height: 260px;
    flex-shrink: 0;
  }
  .sp-bubble-text {
    fill: var(--sh-card);
    font-size: 12px;
    font-weight: 700;
  }
  .sp-prodlist {
    list-style: none;
    margin: 0;
    padding: 0;
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sp-prodlist li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    min-height: 28px;
  }
  .sp-swatch {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .sp-prod-name {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .sp-prod-amount {
    font-weight: 700;
  }
  .sp-prod-pct {
    min-width: 3ch;
    text-align: end;
    font-size: 12px;
  }

  /* products */
  .sp-prod-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
  }
  .sp-prod {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .sp-prod-top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  .sp-prod-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1 1 auto;
    min-width: 0;
    font-size: 12px;
  }
  .sp-prod-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--sh-ink) !important;
  }
  .sp-prod-title:hover {
    color: var(--sh-gold) !important;
  }
  .sp-prod-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .sp-disc {
    min-height: 38px;
    padding: 0 12px;
    font-size: 12px;
    border-color: color-mix(in srgb, var(--sh-ok-ink) 40%, transparent);
    background: var(--sh-ok-tint);
    color: var(--sh-ok-ink);
  }
  .sp-disc-off {
    border-color: var(--sh-line);
    background: var(--sh-card-2);
    color: var(--sh-muted);
  }
  .sp-share {
    display: flex;
    align-items: center;
  }
  .sp-push {
    margin-inline-start: auto;
    min-height: 38px;
  }

  /* the sheet */
  .sp-sheet {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 6px;
  }
  .sp-sheet-title {
    font-size: 24px;
    padding-inline-end: 44px;
  }
  .sp-pick {
    margin: 0;
    padding: 0;
    border: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .sp-pick legend {
    padding: 0 0 8px;
  }
  .sp-radio {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 48px;
    padding: 0 12px;
    border-radius: var(--sh-radius-sm);
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
    color: var(--sh-ink);
    font-size: 14px;
    text-align: start;
  }
  .sp-radio[aria-checked='true'] {
    border-color: var(--sh-gold);
    background: color-mix(in srgb, var(--sh-gold) 10%, var(--sh-card));
    font-weight: 700;
  }
  .sp-radio-name {
    flex: 1 1 auto;
    min-width: 0;
  }
  .sp-radio-meta {
    font-size: 12px;
    color: var(--sh-muted);
    font-weight: 400;
    white-space: nowrap;
  }

  @media (min-width: 640px) {
    .sp-cards,
    .sp-prod-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 900px) {
    .sp {
      padding: 20px 28px 48px;
      gap: 18px;
    }
    .sp-h1 {
      font-size: 34px;
    }
    .sp-crumbs {
      display: block;
    }
    .sp-kpis {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .sp-row {
      display: grid;
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      align-items: start;
    }
    .sp-flows {
      display: flex;
    }
    .sp-bars {
      height: 240px;
    }
    .sp-bar {
      max-width: 44px;
    }
    .sp-bar-val,
    .sp-bar-label {
      font-size: 11px;
    }
    .sp-cards,
    .sp-prod-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .sp-bubbles {
      display: block;
    }
  }
</style>
