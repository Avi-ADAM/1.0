<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import MaagadOfferForm from '$lib/components/maagad/MaagadOfferForm.svelte';
  import { t, isRtl } from '$lib/translations';
  import { Head } from 'svead';

  let { data } = $props();

  const maagad = $derived(data.maagad);
  const my = $derived(data.my);
  const isMember = $derived(
    !!my && ['interested', 'signed', 'active'].includes(my.status)
  );

  let busy = $state(false);
  let errorMsg = $state('');
  let showOfferForm = $state(false);

  async function runAction(actionKey: string, params: Record<string, unknown>) {
    if (busy) return;
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
    } catch (e: any) {
      errorMsg = e?.message || String(e);
    } finally {
      busy = false;
    }
  }

  const join = () => runAction('joinMaagad', { maagadId: maagad.id });
  const leave = () => runAction('leaveMaagad', { maagadId: maagad.id });
  const sign = (offerId: string) =>
    runAction('signMaagadOffer', { maagadId: maagad.id, offerId });
  const unsign = (offerId: string) =>
    runAction('unsignMaagadOffer', { maagadId: maagad.id, offerId });

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
</script>

<Head
  url={page.url.href}
  title={maagad.name || $t('demand.maagad_title')}
  description={maagad.desc || $t('demand.subtitle')}
/>

<div class="maagad-page" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="head">
    <p class="eyebrow">🤝 {$t('demand.maagad_title')}</p>
    <h1>{maagad.name || $t('demand.untitled')}</h1>
    {#if maagad.desc}
      <p class="desc">{maagad.desc}</p>
    {/if}
    <div class="badges">
      <span class="badge">{$t(`demand.status_${maagad.status}`)}</span>
      {#if maagad.scope === 'global'}
        <span class="badge">🌐 {$t('demand.online_section')}</span>
      {/if}
      {#if maagad.frequency && maagad.frequency !== 'one_time'}
        <span class="badge">🔁 {maagad.frequency}</span>
      {/if}
      {#each maagad.categories as cat (cat)}
        <span class="badge soft">{cat}</span>
      {/each}
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
  </section>

  <!-- Offers — each lives independently; the market decides (plan §2.5) -->
  <section class="offers">
    <div class="offers-head">
      <h2>{$t('demand.offers_title')} <span class="count">{maagad.offers.length}</span></h2>
      {#if data.isLoggedIn && !showOfferForm}
        <button class="ghost" onclick={() => (showOfferForm = true)}>
          📣 {$t('demand.make_offer')}
        </button>
      {/if}
    </div>

    {#if showOfferForm}
      <MaagadOfferForm
        maagadId={maagad.id}
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
        <div class="offer-facts">
          {#if offer.unitPrice != null}
            <span>💰 {offer.unitPrice}{offer.currency ? ` ${offer.currency}` : ''} {$t('demand.per_unit')}</span>
          {/if}
          {#if offer.deadline}
            <span>⏳ {$t('demand.offer_deadline')} {fmtDate(offer.deadline)}</span>
          {/if}
          {#if offer.recurrence && offer.recurrence !== 'one_time'}
            <span>🔁 {$t(`demand.rec_${offer.recurrence}`)}</span>
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

        <div class="offer-actions">
          {#if !data.isLoggedIn}
            <a class="primary" href={loginHref}>{$t('demand.login_to_join')}</a>
          {:else if my?.signedOfferId === offer.id}
            <span class="joined">✍️ {$t('demand.my_signed')}</span>
            {#if offer.status !== 'activated'}
              <button class="ghost" onclick={() => unsign(offer.id)} disabled={busy}>
                {$t('demand.unsign')}
              </button>
            {/if}
          {:else if (offer.status === 'open' || offer.status === 'quorum_reached') && !offer.proposerIsMe}
            <button class="primary" onclick={() => sign(offer.id)} disabled={busy || !!my?.signedOfferId}>
              ✍️ {$t('demand.sign')}
            </button>
            {#if my?.signedOfferId}
              <span class="muted small">{$t('demand.already_signed_other')}</span>
            {/if}
          {/if}
        </div>
      </article>
    {/each}
  </section>

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
  .error {
    color: #dc2626;
    font-size: 0.9rem;
  }
</style>
