<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import MaagadOfferForm from '$lib/components/maagad/MaagadOfferForm.svelte';
  import DepartureTerms from '$lib/components/maagad/DepartureTerms.svelte';
  import ShareLink from '$lib/components/share/ShareLink.svelte';
  import SharePrompt from '$lib/components/share/SharePrompt.svelte';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import { t, isRtl, locale } from '$lib/translations';
  import { Confetti } from 'svelte-confetti';
  import { daysLeft, pickOffer } from '$lib/pooling/bestOffer';
  import { jsonLdBody } from '$lib/seo/jsonLd.js';
  import { askedLang, canonicalFor, maagadJsonLd, ogImageFor, oneLine } from '$lib/seo/shareMeta.js';

  let { data } = $props();

  const maagad = $derived(data.maagad);
  const my = $derived(data.my);
  const isMember = $derived(
    !!my && ['interested', 'signed', 'active'].includes(my.status)
  );

  let busy = $state(false);
  let errorMsg = $state('');
  let showOfferForm = $state(false);

  /**
   * The share moment (PLAN_MARKETING_GLOBAL §4, loop 1). `justDid` remembers
   * what she did on *this* visit so the prompt can celebrate right after the
   * click; `promptHidden` is her way of saying "not now" without leaving.
   */
  let justDid = $state<'' | 'joined' | 'signed'>('');
  let promptHidden = $state(false);
  // "Not now" holds for the tab, per pool; a new signature or join brings the
  // prompt back, because the number it names has changed.
  const promptKey = $derived(`1lev1:share-prompt:maagad:${maagad.id}`);
  $effect(() => {
    try {
      promptHidden = sessionStorage.getItem(promptKey) === '1';
    } catch {
      promptHidden = false;
    }
  });
  function hidePrompt() {
    promptHidden = true;
    try {
      sessionStorage.setItem(promptKey, '1');
    } catch {
      // Private mode or storage disabled: the dismissal lasts for this render.
    }
  }
  function showPrompt() {
    promptHidden = false;
    try {
      sessionStorage.removeItem(promptKey);
    } catch {
      // see above
    }
  }

  async function runAction(actionKey: string, params: Record<string, unknown>): Promise<boolean> {
    if (busy) return false;
    busy = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionKey, params })
      });
      const json = await res.json();
      if (!res.ok || json?.success === false) {
        throw new Error(json?.error || json?.message || 'failed');
      }
      await invalidateAll();
      return true;
    } catch (e: any) {
      errorMsg = e?.message || String(e);
      return false;
    } finally {
      busy = false;
    }
  }

  const join = async () => {
    if (await runAction('joinMaagad', { maagadId: maagad.id })) {
      justDid = 'joined';
      showPrompt();
    }
  };
  const leave = () => runAction('leaveMaagad', { maagadId: maagad.id });
  const sign = async (offerId: string) => {
    if (await runAction('signMaagadOffer', { maagadId: maagad.id, offerId })) {
      justDid = 'signed';
      showPrompt();
    }
  };
  const unsign = (offerId: string) =>
    runAction('unsignMaagadOffer', { maagadId: maagad.id, offerId });
  const confirmPrice = (offerId: string) => runAction('confirmDeparturePrice', { offerId });

  /** A departure's lock: price_lock_at, else its sign deadline (§4.1). */
  function lockedNow(offer: { priceLockAt?: string | null; deadline?: string | null }): boolean {
    const at = offer.priceLockAt ?? offer.deadline;
    return !!at && new Date(at).getTime() <= Date.now();
  }

  function progressPct(count: number, target: number | null): number {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((count / target) * 100));
  }

  function fmtDate(iso: string | null): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return iso;
    }
  }

  const loginHref = $derived(`/login?redirect=${encodeURIComponent(page.url.pathname)}`);

  // ── Share layer: what a link to this pool looks like before anyone clicks ──
  // Canonical and card follow the *asked* language (bare path = Hebrew), never
  // page.url's origin, so a preview is the same wherever the link was pasted.
  const lang = $derived(askedLang(page.url));
  const canonical = $derived(canonicalFor(`/maagad/${maagad.id}`, lang));
  const best = $derived(pickOffer(maagad.offers as any[]) as (typeof maagad.offers)[number] | null);
  const bestLeft = $derived(best ? daysLeft(best.deadline) : null);
  const name = $derived(maagad.name || $t('demand.untitled'));
  const statusLine = $derived(
    best?.min
      ? $t('demand.meta_status_offer', { signed: best.signedCount, min: best.min }) +
          (bestLeft != null ? ` · ${$t('demand.meta_days_left', { count: bestLeft })}` : '')
      : $t('demand.meta_status_members', { members: maagad.membersCount })
  );
  const pageTitle = $derived(`${name} · ${$t('demand.meta_title_suffix')}`);
  const pageDesc = $derived(oneLine(`${statusLine}. ${maagad.desc || $t('demand.subtitle')}`, 200));
  // The version token busts stale previews once the numbers move.
  const ogImage = $derived(
    ogImageFor(
      'maagad',
      maagad.id,
      lang,
      `${maagad.membersCount}-${best?.signedCount ?? 0}-${maagad.offers.length}-${best?.status ?? maagad.status}`
    )
  );
  const ld = $derived(maagadJsonLd(maagad, canonical));

  // ── Share moments: the prompt speaks to a participant, in her UI language ──
  const shareUrl = $derived(canonicalFor(`/maagad/${maagad.id}`, $locale));
  const mine = $derived(
    my?.signedOfferId ? maagad.offers.find((o: any) => o.id === my.signedOfferId) ?? null : null
  );
  const mineMissing = $derived(mine ? Math.max(0, (mine.min ?? 0) - mine.signedCount) : 0);
  const mineReached = $derived(
    !!mine && (mine.status === 'quorum_reached' || mine.status === 'activated' || (mine.min > 0 && mineMissing === 0))
  );
  const prompt = $derived.by(() => {
    if (promptHidden) return null;
    if (mine) {
      if (mineReached) {
        return {
          variant: 'celebrate' as const,
          title: $t('demand.share_reached_title'),
          body: $t('demand.share_reached_body', { signed: mine.signedCount }),
          message: $t('demand.share_msg_reached', { name, signed: mine.signedCount, url: shareUrl })
        };
      }
      return {
        variant: 'nudge' as const,
        title: $t('demand.share_nudge_title', { count: mineMissing }),
        body: $t('demand.share_nudge_body'),
        message: $t('demand.share_msg_nudge', {
          name,
          signed: mine.signedCount,
          min: mine.min,
          count: mineMissing,
          url: shareUrl
        })
      };
    }
    if (isMember) {
      const liveOffers = maagad.offers.some((o: any) => o.status === 'open' || o.status === 'quorum_reached');
      if (!liveOffers) {
        return {
          variant: 'supplier' as const,
          title: $t('demand.share_supplier_title'),
          body: $t('demand.share_supplier_body', { members: maagad.membersCount }),
          message: $t('demand.share_msg_supplier', { name, members: maagad.membersCount, url: shareUrl })
        };
      }
      return {
        variant: 'nudge' as const,
        title: $t('demand.share_joined_title'),
        body: $t('demand.share_joined_body'),
        message: $t('demand.share_msg_joined', { name, members: maagad.membersCount, url: shareUrl })
      };
    }
    return null;
  });
  const celebrate = $derived(justDid === 'signed' && mineReached);
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDesc} />
  <link rel="canonical" href={canonical} />
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDesc} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={`${name} — ${statusLine}`} />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDesc} />
  <meta name="twitter:image" content={ogImage} />
  {@html `<script type="application/ld+json">${jsonLdBody(ld)}<\/script>`}
</svelte:head>

{#if celebrate}
  <div class="confetti-stage" aria-hidden="true">
    <Confetti x={[-2.5, 2.5]} y={[0.25, 1.5]} delay={[0, 600]} amount={160} duration={4000} fallDistance="70vh" />
  </div>
{/if}

<div class="maagad-page" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="head">
    <p class="eyebrow"><EntityIcon kind="maagad" size={14} /> {$t('demand.maagad_title')}</p>
    <h1>{maagad.name || $t('demand.untitled')}</h1>
    {#if maagad.desc}
      <p class="desc">{maagad.desc}</p>
    {/if}
    <div class="badges">
      <span class="badge">{$t(`demand.status_${maagad.status}`)}</span>
      {#if maagad.scope === 'global'}
        <span class="badge"><EntityIcon kind="online" size={13} /> {$t('demand.online_section')}</span>
      {/if}
      {#if maagad.frequency && maagad.frequency !== 'one_time'}
        <span class="badge"><EntityIcon kind="recurring" size={13} /> {maagad.frequency}</span>
      {/if}
      {#each maagad.categories as cat (cat)}
        <span class="badge soft">{cat}</span>
      {/each}
    </div>
    <div class="share-row">
      <ShareLink
        path={`/maagad/${maagad.id}`}
        title={maagad.name || $t('demand.untitled')}
        desc={$t('ui.share.maagad')}
        hashtags={['1lev1', 'maagad']}
        size={24}
      />
    </div>
  </header>

  <!-- Aggregate progress — numbers, never identities (plan §2.6) -->
  <section class="panel">
    <div class="members-row">
      <strong class="big">{maagad.membersCount}</strong>
      <span>{$t('demand.members')}</span>
      {#if maagad.viabilityHint}
        <div class="progress" title={`${maagad.membersCount}/${maagad.viabilityHint}`}>
          <div
            class="fill"
            style:width={`${progressPct(maagad.membersCount, maagad.viabilityHint)}%`}
          ></div>
        </div>
        <span class="muted">{$t('demand.viability')} {maagad.viabilityHint}</span>
      {/if}
    </div>
    {#if maagad.namedMembers.length}
      <p class="named">
        {maagad.namedMembers.map((m: any) => m.name).join(', ')}
        {#if maagad.membersCount > maagad.namedMembers.length}
          + {maagad.membersCount - maagad.namedMembers.length} {$t('demand.anonymous_more')}
        {/if}
      </p>
    {:else if maagad.membersCount > 0}
      <p class="named muted">{$t('demand.anonymous_members_note')}</p>
    {/if}

    <div class="cta-row">
      {#if !data.isLoggedIn}
        <a class="primary" href={loginHref}>{$t('demand.login_to_join')}</a>
      {:else if isMember}
        <span class="joined">✓ {$t('demand.joined')}</span>
        {#if my?.status !== 'signed'}
          <button class="ghost" onclick={leave} disabled={busy}>{$t('demand.leave')}</button>
        {/if}
      {:else}
        <button class="primary" onclick={join} disabled={busy}>
          {$t('demand.join')}
        </button>
      {/if}
      <span class="muted small">{$t('demand.join_note')}</span>
    </div>
    {#if prompt && !mine}
      <div class="moment">
        <SharePrompt
          url={shareUrl}
          message={prompt.message}
          title={prompt.title}
          body={prompt.body}
          variant={prompt.variant}
          onDismiss={hidePrompt}
        />
      </div>
    {/if}
  </section>

  <!-- Offers — each lives independently; the market decides (plan §2.5) -->
  <section class="offers">
    <div class="offers-head">
      <h2>{$t('demand.offers_title')} <span class="count">{maagad.offers.length}</span></h2>
      {#if data.isLoggedIn && !showOfferForm}
        <button class="ghost" onclick={() => (showOfferForm = true)}>
          <EntityIcon kind="offer" size={15} /> {$t('demand.make_offer')}
        </button>
      {/if}
    </div>

    {#if showOfferForm}
      <MaagadOfferForm
        maagadId={maagad.id}
        products={data.myProducts}
        onDone={async () => {
          showOfferForm = false;
          await invalidateAll();
        }}
        onCancel={() => (showOfferForm = false)}
      />
    {/if}

    {#if maagad.offers.length === 0 && !showOfferForm}
      <p class="muted">{$t('demand.no_offers')}</p>
    {/if}

    {#each maagad.offers as offer (offer.id)}
      <article class="offer" class:mine={my?.signedOfferId === offer.id}>
        <div class="offer-head">
          <strong>{offer.title}</strong>
          <span class="badge">{$t(`demand.offer_status_${offer.status}`)}</span>
        </div>
        {#if offer.proposerName}
          <p class="muted small">{$t('demand.offer_by')} {offer.proposerName}</p>
        {/if}
        {#if offer.description}
          <p class="offer-desc">{offer.description}</p>
        {/if}
        {#if offer.matanotId}
          <DepartureTerms
            tiers={offer.priceTiers}
            envelope={offer.priceEnvelope}
            signedCount={offer.signedCount}
            min={offer.min ?? 1}
            currency={offer.currencyCode}
            lines={offer.lines}
            lockAt={offer.priceLockAt}
          />
        {/if}
        <div class="offer-facts">
          {#if offer.unitPrice != null && !offer.matanotId}
            <span><EntityIcon kind="money" size={13} /> {offer.unitPrice}{offer.currency ? ` ${offer.currency}` : ''} {$t('demand.per_unit')}</span>
          {/if}
          {#if offer.deadline}
            <span><EntityIcon kind="waiting" size={13} /> {$t('demand.offer_deadline')} {fmtDate(offer.deadline)}</span>
          {/if}
          {#if offer.recurrence && offer.recurrence !== 'one_time'}
            <span><EntityIcon kind="recurring" size={13} /> {$t(`demand.rec_${offer.recurrence}`)}</span>
          {/if}
        </div>

        <div class="quorum">
          <div class="progress big-bar">
            <div class="fill" style:width={`${progressPct(offer.signedCount, offer.min)}%`}></div>
          </div>
          <span class="quorum-label">
            {offer.signedCount}/{offer.min ?? '?'} {$t('demand.signed')}
            {#if offer.max}· {$t('demand.max_label')} {offer.max}{/if}
          </span>
        </div>

        {#if offer.cancellationTerms}
          <details class="terms">
            <summary>{$t('demand.field_cancellation')}</summary>
            <p>{offer.cancellationTerms}</p>
          </details>
        {/if}

        {#if data.myDeparture?.offerId === offer.id && data.myDeparture.consentUntil}
          <!-- A move passed her own ceiling: only her yes keeps her in (§4.2). -->
          <div class="consent" role="status">
            <strong>{$t('pooling.departure.consentTitle')}</strong>
            <p>{$t('pooling.departure.consentBody', { date: fmtDate(data.myDeparture.consentUntil) })}</p>
            <div class="consent-actions">
              <button class="primary" onclick={() => confirmPrice(offer.id)} disabled={busy}>
                {$t('pooling.departure.stay')}
              </button>
              <button class="ghost" onclick={() => unsign(offer.id)} disabled={busy}>
                {$t('pooling.departure.notForMe')}
              </button>
            </div>
          </div>
        {/if}

        <div class="offer-actions">
          {#if !data.isLoggedIn}
            <a class="primary" href={loginHref}>{$t('demand.login_to_join')}</a>
          {:else if my?.signedOfferId === offer.id}
            <span class="joined"><EntityIcon kind="signed" size={13} /> {$t('demand.my_signed')}</span>
            <!-- A departure stays open to leave until its lock, even once activated (§1ב). -->
            {#if offer.status !== 'activated' || (offer.matanotId && !lockedNow(offer))}
              <button class="ghost" onclick={() => unsign(offer.id)} disabled={busy}>
                {$t('demand.unsign')}
              </button>
            {/if}
          {:else if (offer.status === 'open' || offer.status === 'quorum_reached') && !offer.proposerIsMe}
            <button class="primary" onclick={() => sign(offer.id)} disabled={busy || !!my?.signedOfferId}>
              <EntityIcon kind="signed" size={15} /> {$t('demand.sign')}
            </button>
            {#if my?.signedOfferId}
              <span class="muted small">{$t('demand.already_signed_other')}</span>
            {/if}
          {/if}
        </div>
        {#if prompt && mine && mine.id === offer.id}
          <div class="moment">
            <SharePrompt
              url={shareUrl}
              message={prompt.message}
              title={prompt.title}
              body={prompt.body}
              variant={prompt.variant}
              onDismiss={hidePrompt}
            />
          </div>
        {/if}
      </article>
    {/each}
  </section>

  <!-- Matching existing supply (PLAN_USER_OFFERINGS §4.7 / M8): demand meets
       supply — a discovery bridge; the formal path is the threshold offer. -->
  {#if data.supplySuggestions && (data.supplySuggestions.products.length || data.supplySuggestions.missionOffers.length)}
    <section class="supply-sugg">
      <h2>{$t('demand.supply_sugg_title')}</h2>
      <p class="muted small">{$t('demand.supply_sugg_sub')}</p>

      <div class="sugg-list">
        {#each data.supplySuggestions.products as p (p.id)}
          <a class="sugg" href={`/gift/${p.id}`}>
            <span class="sugg-main">
              <EntityIcon kind="product" size={14} /> <strong>{p.name}</strong>
              {#if p.sellerName}<span class="muted small">· {p.sellerName}</span>{/if}
            </span>
            {#if p.price != null}<span class="muted small"><EntityIcon kind="money" size={12} /> {p.price}</span>{/if}
          </a>
        {/each}
        {#each data.supplySuggestions.missionOffers as o (o.id)}
          <a class="sugg" class:mine-sugg={o.mine} href={o.ownerId ? `/user/${o.ownerId}` : '#'}>
            <span class="sugg-main">
              <EntityIcon kind="mission" size={14} /> <strong>{o.name}</strong>
              {#if o.ownerName}<span class="muted small">· {o.ownerName}</span>{/if}
              {#if o.mine}<span class="badge">{$t('demand.supply_sugg_mine')}</span>{/if}
            </span>
            {#if o.perhour != null}<span class="muted small"><EntityIcon kind="money" size={12} /> {o.perhour}</span>
            {:else if o.price != null}<span class="muted small"><EntityIcon kind="money" size={12} /> {o.price}</span>{/if}
          </a>
        {/each}
      </div>

      {#if data.isLoggedIn && !showOfferForm}
        <button class="ghost" onclick={() => (showOfferForm = true)}>
          <EntityIcon kind="offer" size={15} /> {$t('demand.supply_sugg_cta')}
        </button>
      {/if}
    </section>
  {/if}

  {#if errorMsg}
    <p class="error" role="alert">{errorMsg}</p>
  {/if}
</div>

<style>
  .maagad-page {
    max-width: 46rem;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }
  .eyebrow {
    font-size: 0.8rem;
    opacity: 0.65;
    letter-spacing: 0.03em;
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 800;
  }
  .desc {
    margin-top: 0.35rem;
    opacity: 0.85;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.6rem;
  }
  .moment {
    margin-top: 0.9rem;
  }
  .confetti-stage {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    overflow: hidden;
    pointer-events: none;
    z-index: 50;
  }
  .share-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.4rem;
  }
  .badge {
    font-size: 0.75rem;
    background: rgba(139, 92, 246, 0.14);
    color: #6d28d9;
    border-radius: 9999px;
    padding: 0.2rem 0.65rem;
    font-weight: 600;
  }
  .badge.soft {
    background: rgba(120, 120, 160, 0.12);
    color: inherit;
    font-weight: 500;
  }
  .panel {
    border: 1px solid rgba(120, 120, 160, 0.2);
    border-radius: 1rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .members-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .big {
    font-size: 1.6rem;
    font-weight: 800;
  }
  .progress {
    flex: 1;
    min-width: 8rem;
    height: 0.55rem;
    border-radius: 9999px;
    background: rgba(120, 120, 160, 0.15);
    overflow: hidden;
  }
  .progress .fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, #8b5cf6, #ec4899);
    transition: width 0.3s ease;
  }
  .named {
    font-size: 0.85rem;
  }
  .muted {
    opacity: 0.6;
  }
  .small {
    font-size: 0.8rem;
  }
  .cta-row {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    flex-wrap: wrap;
  }
  .primary {
    background: #7c3aed;
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 0.5rem 1.4rem;
    cursor: pointer;
    font-weight: 700;
    text-decoration: none;
    display: inline-block;
  }
  .primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .ghost {
    background: transparent;
    border: 1px solid rgba(120, 120, 160, 0.35);
    border-radius: 9999px;
    padding: 0.45rem 1rem;
    cursor: pointer;
  }
  .joined {
    color: #059669;
    font-weight: 700;
  }
  .offers-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .offers {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .offers h2 {
    font-size: 1.1rem;
    font-weight: 700;
  }
  .count {
    opacity: 0.55;
    font-size: 0.85em;
  }
  .offer {
    border: 1px solid rgba(120, 120, 160, 0.2);
    border-radius: 1rem;
    padding: 0.9rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .supply-sugg {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .sugg-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .sugg {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    border: 1px solid rgba(120, 120, 160, 0.2);
    border-radius: 0.8rem;
    padding: 0.55rem 0.8rem;
    text-decoration: none;
    color: inherit;
  }
  .sugg:hover {
    border-color: rgba(255, 0, 146, 0.5);
  }
  .sugg.mine-sugg {
    border-color: rgba(234, 179, 8, 0.6);
  }
  .sugg-main {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    min-width: 0;
  }
  .offer.mine {
    border-color: rgba(5, 150, 105, 0.5);
  }
  .offer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .offer-desc {
    font-size: 0.9rem;
  }
  .offer-facts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    font-size: 0.82rem;
    opacity: 0.85;
  }
  .quorum {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .big-bar {
    height: 0.7rem;
  }
  .quorum-label {
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
  }
  .terms summary {
    cursor: pointer;
    font-size: 0.82rem;
    opacity: 0.7;
  }
  .terms p {
    font-size: 0.82rem;
    padding: 0.4rem 0;
  }
  .offer-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .consent {
    border: 1px solid rgba(244, 114, 182, 0.55);
    background: rgba(244, 114, 182, 0.08);
    border-radius: 0.75rem;
    padding: 0.6rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.85rem;
  }
  .consent p {
    margin: 0;
    color: inherit;
  }
  .consent-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .error {
    color: #dc2626;
    font-size: 0.9rem;
  }
</style>
