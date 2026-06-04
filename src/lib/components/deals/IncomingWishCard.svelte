<script lang="ts">
  import tr from '$lib/translations/tr.json';
  import { lang } from '$lib/stores/lang.js';
  import { invalidateAll } from '$app/navigation';
  import AcceptWishOffer from '$lib/components/concierge/AcceptWishOffer.svelte';
  import type { IncomingWishInvitation } from '$lib/server/deals/dealsQueries';

  let { wish }: { wish: IncomingWishInvitation } = $props();

  let showOffer = $state(false);

  // Map the invitation to the modal's ready offer. Person-invites are stored as
  // kind 'existing_project', resource-invites as 'partial'.
  const offerItem = $derived({
    kind: (wish.kind === 'partial' ? 'resource' : 'mission') as 'mission' | 'resource',
    name: wish.ratsonName || '',
    hours: wish.slotHours ?? null,
    price: wish.slotPrice ?? null
  });

  function openOffer() {
    showOffer = true;
  }
  function onDone() {
    showOffer = false;
    // Refresh the deals load so the responded invitation drops off the list.
    invalidateAll();
  }

  // kind → a human label. 'partial' = a resource/slice was requested,
  // 'existing_project' = the wisher invited the member's weave/skill.
  const KIND_LABEL = $derived<Record<string, string>>({
    existing_project: tr.deals.inviteKindPerson[$lang],
    partial: tr.deals.inviteKindResource[$lang]
  });
  const kindLabel = $derived(KIND_LABEL[wish.kind] ?? tr.deals.inviteKindPerson[$lang]);

  const isNew = $derived(wish.status === 'suggested');

  function initials(name: string): string {
    const parts = String(name || '').trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).slice(0, 2) || '🤍';
  }

  function formatDate(iso?: string) {
    if (!iso) return tr.deals.flexible[$lang];
    const d = new Date(iso);
    if (isNaN(d.getTime())) return tr.deals.flexible[$lang];
    return `${d.getDate()}.${d.getMonth() + 1}.${String(d.getFullYear()).slice(2)}`;
  }

</script>

<div
  class="card"
  dir={$lang === 'en' ? 'ltr' : 'rtl'}
  role="button"
  tabindex="0"
  onclick={openOffer}
  onkeydown={(e) => e.key === 'Enter' && openOffer()}
>
  <div class="toper">
    <span class="gem-badge">
      <span class="gem"></span>
      {tr.deals.incomingWish[$lang]}
    </span>
    {#if isNew}
      <span class="badge new">● {tr.deals.inviteNew[$lang]}</span>
    {:else}
      <span class="badge">{tr.deals.inviteViewed[$lang]}</span>
    {/if}
  </div>

  <!-- Who is asking -->
  <div class="wisher">
    {#if wish.wisherPic}
      <img class="avatar" src={wish.wisherPic} alt={wish.wisherName} />
    {:else}
      <span class="avatar fallback">{initials(wish.wisherName)}</span>
    {/if}
    <div class="wisher-body">
      <div class="wisher-name">{wish.wisherName || tr.deals.aWisher[$lang]}</div>
      <div class="wisher-sub">{tr.deals.invitedYou[$lang]}</div>
    </div>
  </div>

  <div class="chips">
    <span class="chip kind">{kindLabel}</span>
    {#each wish.values.slice(0, 2) as v (v)}
      <span class="chip">{v}</span>
    {/each}
  </div>

  <div class="wish-name">{wish.ratsonName || '—'}</div>
  {#if wish.ratsonDesc}
    <div class="wish-desc">{wish.ratsonDesc}</div>
  {/if}

  <div class="meta">
    <div class="meta-item">
      <div class="ml">{tr.deals.inviteBudget[$lang]}</div>
      <div class="mv gold">
        {wish.totalBounti != null
          ? `₪ ${Number(wish.totalBounti).toLocaleString()}`
          : tr.deals.byOffer[$lang]}
      </div>
    </div>
    <div class="meta-item">
      <div class="ml">{tr.deals.inviteWhen[$lang]}</div>
      <div class="mv">{formatDate(wish.startDate)}</div>
    </div>
  </div>

  <button class="cta" onclick={(e) => { e.stopPropagation(); openOffer(); }}>
    {tr.deals.inviteRespond[$lang]} →
  </button>
</div>

{#if showOffer}
  <AcceptWishOffer
    proposalId={wish.proposalId}
    ratsonId={wish.ratsonId}
    item={offerItem}
    onClose={() => (showOffer = false)}
    {onDone}
  />
{/if}

<style>
  .card {
    background: var(--s1);
    border: 1px solid var(--border);
    border-radius: var(--rl);
    padding: 24px;
    cursor: pointer;
    transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    outline: none;
  }
  .card::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(135deg, var(--pink), transparent 50%, var(--gold) 100%);
    opacity: 0;
    transition: opacity 0.28s;
    z-index: -1;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    padding: 1px;
  }
  .card:hover,
  .card:focus-visible {
    transform: translateY(-4px);
    border-color: transparent;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
  .card:hover::after,
  .card:focus-visible::after {
    opacity: 1;
  }

  .toper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 8px;
  }
  .gem-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 4px 11px;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(255, 77, 158, 0.12), rgba(238, 232, 170, 0.08));
    border: 1px solid rgba(255, 77, 158, 0.35);
    color: var(--pink-l);
  }
  .gem {
    width: 7px;
    height: 7px;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
    transform: rotate(45deg);
    box-shadow: 0 0 8px rgba(255, 77, 158, 0.6);
  }
  .badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 4px 12px;
    border-radius: 20px;
    background: var(--s3);
    color: var(--tm);
    border: 1px solid var(--border);
  }
  .badge.new {
    background: var(--pink-d);
    color: var(--pink-l);
    border-color: rgba(200, 21, 95, 0.3);
  }

  .wisher {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }
  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--border-g, rgba(238, 232, 170, 0.3));
    flex-shrink: 0;
  }
  .avatar.fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #ff4d9e, #c8155f);
  }
  .wisher-body {
    min-width: 0;
  }
  .wisher-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }
  .wisher-sub {
    font-size: 11px;
    color: var(--tm);
  }

  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .chip {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;
    background: var(--s3);
    color: var(--tm);
    border: 1px solid var(--border);
  }
  .chip.kind {
    background: var(--pink-d);
    color: var(--pink-l);
    border-color: rgba(200, 21, 95, 0.2);
  }

  .wish-name {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 4px;
  }
  .wish-desc {
    font-size: 12px;
    color: var(--tm);
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .meta {
    display: flex;
    gap: 16px;
    border-top: 1px solid var(--border);
    padding-top: 14px;
    margin-bottom: 14px;
  }
  .meta-item {
    flex: 1;
  }
  .ml {
    font-size: 10px;
    color: var(--td);
    margin-bottom: 2px;
    font-weight: 600;
  }
  .mv {
    font-size: 13px;
    font-weight: 700;
    color: var(--text);
  }
  .mv.gold {
    color: var(--gold-l);
  }

  .cta {
    width: 100%;
    padding: 10px;
    border-radius: 10px;
    border: 1px solid rgba(255, 77, 158, 0.35);
    background: var(--pink-d, rgba(255, 100, 150, 0.12));
    color: var(--pink-l, #ff6496);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Heebo', sans-serif;
    transition: background 0.2s, transform 0.15s;
  }
  .cta:hover {
    background: rgba(255, 77, 158, 0.2);
    transform: translateY(-1px);
  }
</style>
