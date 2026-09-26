<script>
  /**
   * "This is how your partnership would look on 1lev1" — a rikma draft, before
   * anything exists (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.4).
   *
   * Fed by `blueprintToRikmaView` (read-only, nothing private in it). Drawn in
   * the public rikma page's language — the same seal, the same gold / pink
   * panels, the same tiles — so a partner sees what they would really get, with
   * one banner that says none of it exists yet.
   */
  import { t } from '$lib/translations';
  import AuthorityBadge from '$lib/components/ui/AuthorityBadge.svelte';
  import Tile from '$lib/celim/tile.svelte';

  /**
   * @typedef {{ kind: 'me' | 'open' } | { kind: 'partner', name: string }} Holder
   * @typedef {{ label: string, text?: string, holder?: Holder, hours?: number, ratePerHour?: number, price?: number, quantity?: number }} Row
   * @typedef {Object} Props
   * @property {{ track?: string, name: string, publicDescription?: string, linkToWebsite?: string, vals: string[],
   *   place?: string, currency?: string,
   *   products: { label: string, text?: string, price?: number, onRequest: boolean, madeOf: string[] }[],
   *   missions: Row[], resources: Row[], partners: { name: string, brings: string[] }[],
   *   split: { who: Holder, value: number, pct: number }[] }} view
   * @property {string|null} [expiresAt]
   * @property {string|null} [projectId] - Set once the draft was created: the real rikma.
   * @property {boolean} [loggedIn]
   */

  /** @type {Props} */
  let { view, expiresAt = null, projectId = null, loggedIn = false } = $props();

  let members = $derived(1 + view.partners.length);

  function who(/** @type {Holder | undefined} */ h) {
    if (!h || h.kind === 'open') return $t('rikmaImport.preview.lookingFor');
    if (h.kind === 'partner') return h.name;
    return $t('rikmaImport.preview.founder');
  }

  function money(/** @type {number} */ n) {
    const cur = view.currency ? ` ${view.currency}` : '';
    return `${n.toLocaleString()}${cur}`;
  }

  let until = $derived(expiresAt ? new Date(expiresAt).toLocaleDateString() : '');
</script>

<div class="min-h-screen bg-gradient-to-br from-[#1a0515] via-[#2c0b1e] to-[#120f26] text-white overflow-x-hidden font-sans">
  <div dir="auto" class="max-w-4xl mx-auto px-4 py-8 pb-24">
    <p class="mb-6 rounded-2xl border border-gold/50 bg-black/40 p-3 text-center text-sm" role="note">
      <strong class="text-gold">{$t('rikmaImport.preview.banner')}</strong>
      {#if until}<span class="block text-xs text-gray-300 mt-1">{$t('rikmaImport.preview.until', { date: until })}</span>{/if}
    </p>

    <div class="flex flex-col items-center mb-8">
      <div class="mb-4 drop-shadow-[0_0_25px_rgba(255,215,0,0.3)] business:drop-shadow-none">
        <AuthorityBadge projectName={view.name} memberCount={members} size={220} goldColor="#FFD700" darkGoldColor="#9F6808" pinkGlow={true} />
      </div>
      {#if view.track}
        <span class="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20">{$t(`rikmaImport.track.${view.track}`)}</span>
      {/if}
      {#if view.place}<p class="mt-2 text-sm text-gray-300">📍 {view.place}</p>{/if}
      {#if view.linkToWebsite}
        <a class="mt-2 text-sm underline text-gold break-all" href={view.linkToWebsite} target="_blank" rel="noopener noreferrer nofollow">{view.linkToWebsite}</a>
      {/if}
    </div>

    {#if view.publicDescription}
      <section class="glass-panel mb-8 text-center">
        <h2 class="text-lg font-bold text-gold mb-2">{$t('rikmaImport.preview.about')}</h2>
        <p dir="auto" class="whitespace-pre-line">{view.publicDescription}</p>
      </section>
    {/if}

    {#if view.products.length}
      <section class="glass-panel mb-8">
        <h2 class="text-xl font-bold text-gold mb-4 text-center">{$t('rikmaImport.groups.products')}</h2>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each view.products as p, i (i)}
            <li class="bg-black/40 rounded-xl p-4 border border-white/10">
              <p class="text-lg font-semibold mb-1" dir="auto">{p.label}</p>
              {#if p.text}<p class="text-sm text-gray-300 mb-2" dir="auto">{p.text}</p>{/if}
              <p class="text-barbi font-bold">
                {p.onRequest || p.price === undefined ? $t('rikmaImport.row.priceOnRequest') : money(p.price)}
              </p>
              {#if p.madeOf.length}
                <p class="text-xs text-gray-300 mt-2">{$t('rikmaImport.row.madeOf', { names: p.madeOf.join(', ') })}</p>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {#if view.vals.length}
        <section class="glass-panel flex flex-col items-center border-t-4 border-t-gold">
          <h2 class="text-xl font-bold text-gold mb-4">{$t('rikmaImport.preview.values')}</h2>
          <div class="flex flex-wrap justify-center gap-2">
            {#each view.vals as v (v)}<Tile bg="gold" sm={true} big={true} word={v} />{/each}
          </div>
        </section>
      {/if}

      {#if view.missions.length}
        <section class="glass-panel flex flex-col items-center border-t-4 border-t-barbi">
          <h2 class="text-xl font-bold text-barbi mb-4">{$t('rikmaImport.groups.rikmaMissions')}</h2>
          <ul class="flex flex-col gap-2 w-full">
            {#each view.missions as m, i (i)}
              <li class="flex flex-wrap items-center justify-between gap-2 bg-black/30 rounded-xl p-2">
                <Tile bg="wow" sm={true} big={true} word={m.label} />
                <span class="text-xs px-2 py-0.5 rounded-full {m.holder?.kind === 'open' ? 'bg-barbi/30 border border-barbi' : 'bg-white/10'}">{who(m.holder)}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>

    {#if view.resources.length}
      <section class="glass-panel mb-8">
        <h2 class="text-xl font-bold text-gold mb-4 text-center">{$t('rikmaImport.groups.rikmaResources')}</h2>
        <ul class="flex flex-wrap justify-center gap-2">
          {#each view.resources as r, i (i)}
            <li class="flex items-center gap-2 bg-black/30 rounded-xl p-2">
              <Tile bg="gold" sm={true} word={r.label} />
              <span class="text-xs">{who(r.holder)}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if view.partners.length}
      <section class="glass-panel mb-8">
        <h2 class="text-xl font-bold text-gold mb-4 text-center">{$t('rikmaImport.groups.partners')}</h2>
        <ul class="flex flex-col gap-2">
          {#each view.partners as p, i (i)}
            <li class="text-sm"><strong>{p.name}</strong>{#if p.brings.length}: {p.brings.join(', ')}{/if}</li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if view.split.length}
      <section class="glass-panel mb-8">
        <h2 class="text-xl font-bold text-gold mb-1 text-center">{$t('rikmaImport.preview.split')}</h2>
        <p class="text-xs text-gray-300 text-center mb-4">{$t('rikmaImport.preview.splitNote')}</p>
        <ul class="flex flex-col gap-3">
          {#each view.split as s, i (i)}
            <li>
              <div class="flex justify-between text-sm mb-1"><span>{who(s.who)}</span><span>{s.pct}%</span></div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden" role="presentation">
                <div class="h-full bg-gradient-to-l from-gold to-barbi" style="width: {s.pct}%"></div>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <div class="flex flex-col items-center gap-3 text-center">
      {#if projectId}
        <a class="cta" href="/project/{projectId}">{$t('rikmaImport.preview.openReal')}</a>
      {:else}
        <p class="text-sm text-gray-300 max-w-md">{$t('rikmaImport.preview.ownerHint')}</p>
      {/if}
      {#if !loggedIn}
        <a class="cta-secondary" href="/hascama">{$t('rikmaImport.preview.joinCta')}</a>
      {/if}
    </div>
  </div>
</div>

<style>
  .glass-panel {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 1rem;
    padding: 1.5rem;
  }
  .text-gold { color: #ffd700; }
  .text-barbi { color: #ff00ae; }
  .border-t-gold { border-top-color: #ffd700; }
  .border-t-barbi { border-top-color: #ff00ae; }
  .border-gold\/50 { border-color: rgba(255, 215, 0, 0.5); }
  .cta {
    display: inline-block;
    padding: 0.75rem 2rem;
    border-radius: 9999px;
    background: linear-gradient(to right, #ffd700, #d4af37, #b8860b);
    color: #000;
    font-weight: 700;
  }
  .cta-secondary {
    display: inline-block;
    padding: 0.6rem 1.5rem;
    border-radius: 9999px;
    border: 1px solid #ff00ae;
    color: #fff;
  }
</style>
