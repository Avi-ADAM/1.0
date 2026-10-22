<script>
  /**
   * "This is how your partnership would look on 1lev1" — a rikma draft, before
   * anything exists (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §4.4).
   *
   * Fed by `blueprintToRikmaView` (read-only, nothing private in it). Drawn in
   * the public rikma page's language — the seal, the classic gold & pink doors,
   * the partner rings, full product/mission/resource detail cards (hours × rate
   * = value, skills, roles, periods), and the share split illustration.
   */
  import * as translations from '$lib/translations';
  import { readable } from 'svelte/store';
  import AuthorityBadge from '$lib/components/ui/AuthorityBadge.svelte';
  import Tile from '$lib/celim/tile.svelte';

  const t = translations.t;
  const activeLocale = 'locale' in translations && translations.locale ? translations.locale : readable('he');

  /**
   * @typedef {{ kind: 'me' | 'open' } | { kind: 'partner', name: string }} Holder
   * @typedef {{ label: string, text?: string, holder?: Holder, hours?: number, ratePerHour?: number,
   *   price?: number, quantity?: number, kindOf?: string, recurring?: boolean,
   *   roles?: string[], skills?: string[], workways?: string[] }} Row
   * @typedef {Object} Props
   * @property {{ track?: string, name: string, publicDescription?: string, descripFor?: string,
   *   linkToWebsite?: string, vals: string[], place?: string, isOnline?: boolean,
   *   currency?: string, restime?: string,
   *   products: { label: string, text?: string, price?: number, kindOf?: string, quant?: number,
   *     unlimited?: boolean, isOnline?: boolean, categories?: string[], onRequest: boolean, madeOf: string[] }[],
   *   missions: Row[], resources: Row[], partners: { name: string, brings: string[] }[],
   *   split: { who: Holder, value: number, pct: number }[] }} view
   * @property {string|null} [expiresAt]
   * @property {string|null} [projectId] - Set once the draft was created: the real rikma.
   * @property {boolean} [loggedIn]
   * @property {boolean} [embedded] - Rendered inside the behind-the-scenes live preview tab.
   * @property {string} [actionHref]
   * @property {string} [actionLabel]
   */

  /** @type {Props} */
  let {
    view,
    expiresAt = null,
    projectId = null,
    loggedIn = false,
    embedded = false,
    actionHref = '',
    actionLabel = ''
  } = $props();

  let members = $derived(1 + view.partners.length);
  let totalSplitValue = $derived(view.split.reduce((acc, s) => acc + s.value, 0));

  function who(/** @type {Holder | undefined} */ h) {
    if (!h || h.kind === 'open') return $t('rikmaImport.preview.lookingFor');
    if (h.kind === 'partner') return h.name;
    return $t('rikmaImport.preview.founder');
  }

  function fmt(/** @type {number} */ n) {
    return n.toLocaleString($activeLocale || 'he', { maximumFractionDigits: 2 });
  }

  function money(/** @type {number} */ n) {
    const cur = view.currency ? ` ${view.currency}` : '';
    return `${fmt(n)}${cur}`;
  }

  function periodOf(/** @type {string | undefined} */ kindOf) {
    switch (kindOf) {
      case 'monthly':
        return $t('rikmaImport.row.period.monthly');
      case 'yearly':
        return $t('rikmaImport.row.period.yearly');
      case 'daily':
        return $t('rikmaImport.row.period.daily');
      case 'perUnit':
        return $t('rikmaImport.row.period.perUnit');
      case 'rent':
        return $t('rikmaImport.row.period.rent');
      default:
        return '';
    }
  }

  function initialOf(/** @type {string} */ name) {
    const trimmed = name.trim();
    return trimmed ? [...trimmed][0].toUpperCase() : '1';
  }

  let until = $derived(expiresAt ? new Date(expiresAt).toLocaleDateString($activeLocale || 'he') : '');
</script>

<div
  class="{embedded
    ? 'rounded-2xl overflow-hidden border border-white/15 shadow-2xl'
    : 'min-h-screen'} bg-gradient-to-br from-[#1a0515] via-[#2c0b1e] to-[#120f26] text-white overflow-x-hidden font-sans"
  data-testid="rikma-public-preview"
>
  <div dir="auto" class="max-w-4xl mx-auto px-4 {embedded ? 'py-6 pb-10' : 'py-8 pb-24'}">
    <p class="mb-6 rounded-2xl border border-gold/50 bg-black/40 p-3 text-center text-sm text-white" role="note">
      <strong class="text-gold">{$t('rikmaImport.preview.banner')}</strong>
      {#if until}
        <span class="block text-xs text-gray-300 mt-1">{$t('rikmaImport.preview.until', { date: until })}</span>
      {/if}
    </p>

    <!-- 1. Identity Seal & Metadata -->
    <div class="flex flex-col items-center mb-8 text-center">
      <div class="mb-4 drop-shadow-[0_0_25px_rgba(255,215,0,0.3)] business:drop-shadow-none">
        <AuthorityBadge
          projectName={view.name || $t('rikmaImport.preview.title')}
          memberCount={members}
          size={embedded ? 190 : 220}
          goldColor="#FFD700"
          darkGoldColor="#9F6808"
          pinkGlow={true}
        />
      </div>
      <div class="flex flex-wrap items-center justify-center gap-2 mt-1">
        {#if view.track}
          <span class="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white">
            {$t(`rikmaImport.track.${view.track}`)}
          </span>
        {/if}
        {#if view.place}
          <span class="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/15 text-gray-200">
            📍 {view.place}
          </span>
        {/if}
        {#if view.isOnline}
          <span class="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/15 text-gray-200">
            🌐 {$t('rikmaImport.row.isOnline')}
          </span>
        {/if}
        {#if view.restime}
          <span class="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/15 text-gray-200">
            ⏱ {$t('rikmaImport.preview.consentClock', { label: $t(`rikmaImport.restime.${view.restime}`) })}
          </span>
        {/if}
      </div>
      {#if view.linkToWebsite}
        <a
          class="mt-3 text-sm underline text-gold break-all"
          href={view.linkToWebsite}
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          {view.linkToWebsite}
        </a>
      {/if}
    </div>

    <!-- 2. The Two Signature Rikma Doors (matching RikmaPage) -->
    {#if view.products.length || view.missions.length || view.resources.length}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {#if view.products.length || view.resources.length}
          <a href="#preview-products" class="door-card door-gold">
            <span class="text-lg font-black text-gold mb-1">{$t('rikmaImport.preview.supportDoorTitle')}</span>
            <span class="text-sm text-gray-300 leading-snug">{$t('rikmaImport.preview.supportDoorDesc')}</span>
          </a>
        {/if}
        {#if view.missions.length || view.descripFor}
          <a href="#preview-missions" class="door-card door-barbi">
            <span class="text-lg font-black text-barbi mb-1">{$t('rikmaImport.preview.joinDoorTitle')}</span>
            <span class="text-sm text-gray-300 leading-snug">{$t('rikmaImport.preview.joinDoorDesc')}</span>
          </a>
        {/if}
      </div>
    {/if}

    <!-- 3. About & Who We're Looking For -->
    {#if view.publicDescription || view.descripFor}
      <section class="glass-panel mb-8 text-center">
        {#if view.publicDescription}
          <h2 class="text-lg font-bold text-gold mb-2">{$t('rikmaImport.preview.about')}</h2>
          <p dir="auto" class="whitespace-pre-line text-gray-100 leading-relaxed">{view.publicDescription}</p>
        {/if}
        {#if view.descripFor}
          <div class="{view.publicDescription ? 'mt-5 pt-5 border-t border-white/10' : ''}">
            <h3 class="text-base font-bold text-barbi mb-1.5">{$t('rikmaImport.preview.lookingForHeading')}</h3>
            <p dir="auto" class="text-sm text-gray-200 whitespace-pre-line">{view.descripFor}</p>
          </div>
        {/if}
      </section>
    {/if}

    <!-- 4. Team / Partners Avatars (Gold Rings) -->
    <section class="mb-8 text-center">
      <h2 class="text-lg font-bold text-gold mb-4">{$t('rikmaImport.preview.team')}</h2>
      <div class="flex flex-wrap justify-center gap-4">
        <div class="flex flex-col items-center gap-1 max-w-36">
          <div
            class="w-12 h-12 rounded-full border-2 border-gold bg-black/50 flex items-center justify-center font-bold text-gold shadow-md"
          >
            1
          </div>
          <span class="text-xs font-semibold text-white">{$t('rikmaImport.preview.founder')}</span>
        </div>
        {#each view.partners as p, i (i)}
          <div class="flex flex-col items-center gap-1 max-w-44">
            <div
              class="w-12 h-12 rounded-full border-2 border-gold bg-black/50 flex items-center justify-center font-bold text-gold shadow-md"
            >
              {initialOf(p.name)}
            </div>
            <span class="text-xs font-semibold text-white">{p.name}</span>
            {#if p.brings.length}
              <span class="text-[11px] text-gray-300 leading-tight">{p.brings.join(', ')}</span>
            {/if}
          </div>
        {/each}
      </div>
    </section>

    <!-- 5. Values -->
    {#if view.vals.length}
      <section class="glass-panel mb-8 flex flex-col items-center border-t-4 border-t-gold">
        <h2 class="text-xl font-bold text-gold mb-4">{$t('rikmaImport.preview.values')}</h2>
        <div class="flex flex-wrap justify-center gap-2">
          {#each view.vals as v (v)}<Tile bg="gold" sm={true} big={true} word={v} />{/each}
        </div>
      </section>
    {/if}

    <!-- 6. Products Showcase -->
    {#if view.products.length}
      <section id="preview-products" class="glass-panel mb-8">
        <h2 class="text-xl font-bold text-gold mb-4 text-center">{$t('rikmaImport.groups.products')}</h2>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {#each view.products as p, i (i)}
            {@const period = periodOf(p.kindOf)}
            <li class="bg-black/45 rounded-xl p-4 border border-white/12 flex flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <p class="text-lg font-semibold text-white" dir="auto">{p.label}</p>
                <span class="shrink-0 rounded-full bg-barbi/20 border border-barbi/50 px-3 py-0.5 text-sm font-bold text-barbi">
                  {#if p.onRequest || p.price === undefined}
                    {$t('rikmaImport.row.priceOnRequest')}
                  {:else}
                    {money(p.price)}{#if period}{' '}{period}{/if}
                  {/if}
                </span>
              </div>
              {#if p.text}
                <p class="text-sm text-gray-200 whitespace-pre-line leading-relaxed" dir="auto">{p.text}</p>
              {/if}
              {#if p.categories?.length || p.isOnline || p.unlimited || p.quant !== undefined}
                <div class="flex flex-wrap gap-1.5 text-xs pt-1">
                  {#if p.isOnline}
                    <span class="px-2 py-0.5 rounded-full bg-white/10 text-gray-200">🌐 {$t('rikmaImport.row.isOnline')}</span>
                  {/if}
                  {#if p.unlimited}
                    <span class="px-2 py-0.5 rounded-full bg-white/10 text-gray-200">{$t('rikmaImport.row.unlimited')}</span>
                  {:else if p.quant !== undefined}
                    <span class="px-2 py-0.5 rounded-full bg-white/10 text-gray-200">{$t('rikmaImport.row.quant')}: {fmt(p.quant)}</span>
                  {/if}
                  {#each p.categories ?? [] as cat (cat)}
                    <span class="px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold">{cat}</span>
                  {/each}
                </div>
              {/if}
              {#if p.madeOf.length}
                <p class="text-xs text-gray-300 pt-1 border-t border-white/10">
                  {$t('rikmaImport.row.madeOf', { names: p.madeOf.join(', ') })}
                </p>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <!-- 7. Detailed Missions Cards -->
    {#if view.missions.length}
      <section id="preview-missions" class="glass-panel mb-8 border-t-4 border-t-barbi">
        <h2 class="text-xl font-bold text-barbi mb-4 text-center">{$t('rikmaImport.groups.rikmaMissions')}</h2>
        <ul class="flex flex-col gap-3 w-full">
          {#each view.missions as m, i (i)}
            {@const total = m.hours !== undefined && m.ratePerHour !== undefined ? m.hours * m.ratePerHour : null}
            <li class="bg-black/40 rounded-xl p-4 border border-white/12 flex flex-col gap-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <Tile bg="wow" sm={true} big={true} word={m.label} />
                  {#if m.recurring}
                    <span class="text-xs px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-gray-200">
                      {$t('rikmaImport.row.recurring')}
                    </span>
                  {/if}
                </div>
                <span
                  class="text-xs px-2.5 py-1 rounded-full font-medium {m.holder?.kind === 'open'
                    ? 'bg-barbi/30 border border-barbi text-white'
                    : 'bg-white/10 text-gray-200'}"
                >
                  {who(m.holder)}
                </span>
              </div>

              {#if m.text}
                <p class="text-sm text-gray-200 whitespace-pre-line leading-relaxed" dir="auto">{m.text}</p>
              {/if}

              {#if m.hours !== undefined || m.ratePerHour !== undefined || total !== null}
                <div class="flex flex-wrap items-center gap-2 text-xs pt-1">
                  {#if m.hours !== undefined}
                    <span class="px-2.5 py-0.5 rounded-full bg-white/10 text-gray-100">
                      ⏱ {$t('rikmaImport.preview.hoursBadge', { hours: fmt(m.hours) })}
                      {#if m.recurring} · {$t('rikmaImport.row.period.monthly')}{/if}
                    </span>
                  {/if}
                  {#if m.ratePerHour !== undefined}
                    <span class="px-2.5 py-0.5 rounded-full bg-white/10 text-gray-100">
                      {money(m.ratePerHour)} {$t('rikmaImport.preview.perHour')}
                    </span>
                  {/if}
                  {#if total !== null}
                    <span class="px-2.5 py-0.5 rounded-full bg-gold/20 border border-gold/50 text-gold font-bold">
                      {$t('rikmaImport.row.value')}: {money(total)}
                      {#if m.recurring} {$t('rikmaImport.row.period.monthly')}{/if}
                    </span>
                  {/if}
                </div>
              {/if}

              {#if m.roles?.length || m.skills?.length || m.workways?.length}
                <div class="flex flex-wrap gap-1.5 text-xs pt-1">
                  {#each m.roles ?? [] as role (role)}
                    <span class="px-2 py-0.5 rounded-full bg-barbi/15 border border-barbi/35 text-gray-100">{role}</span>
                  {/each}
                  {#each m.skills ?? [] as skill (skill)}
                    <span class="px-2 py-0.5 rounded-full bg-white/10 border border-white/15 text-gray-200">{skill}</span>
                  {/each}
                  {#each m.workways ?? [] as way (way)}
                    <span class="px-2 py-0.5 rounded-full bg-white/5 border border-white/15 text-gray-300">{way}</span>
                  {/each}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <!-- 8. Resources Cards -->
    {#if view.resources.length}
      <section id="preview-resources" class="glass-panel mb-8 border-t-4 border-t-gold">
        <h2 class="text-xl font-bold text-gold mb-4 text-center">{$t('rikmaImport.groups.rikmaResources')}</h2>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {#each view.resources as r, i (i)}
            {@const period = periodOf(r.kindOf)}
            {@const rTotal = r.price !== undefined ? r.price * (r.quantity ?? 1) : null}
            <li class="bg-black/40 rounded-xl p-4 border border-white/12 flex flex-col gap-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <Tile bg="gold" sm={true} word={r.label} />
                <span class="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-200">{who(r.holder)}</span>
              </div>
              {#if r.text}
                <p class="text-sm text-gray-200 whitespace-pre-line" dir="auto">{r.text}</p>
              {/if}
              {#if r.price !== undefined || r.quantity !== undefined}
                <div class="flex flex-wrap items-center gap-2 text-xs">
                  {#if r.price !== undefined}
                    <span class="px-2.5 py-0.5 rounded-full bg-gold/20 border border-gold/40 text-gold font-semibold">
                      {money(r.price)}{#if period}{' '}{period}{/if}
                    </span>
                  {/if}
                  {#if r.quantity !== undefined && r.quantity !== 1}
                    <span class="px-2 py-0.5 rounded-full bg-white/10 text-gray-200">
                      × {fmt(r.quantity)}{#if rTotal !== null} = {money(rTotal)}{/if}
                    </span>
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <!-- 9. Partnership Share Split Illustration -->
    {#if view.split.length}
      <section class="glass-panel mb-8">
        <h2 class="text-xl font-bold text-gold mb-1 text-center">{$t('rikmaImport.preview.split')}</h2>
        <p class="text-xs text-gray-300 text-center mb-2">{$t('rikmaImport.preview.splitNote')}</p>
        {#if totalSplitValue > 0}
          <p class="text-xs text-gold font-semibold text-center mb-4">
            {$t('rikmaImport.preview.totalValue', { amount: money(totalSplitValue) })}
          </p>
        {/if}
        <ul class="flex flex-col gap-3">
          {#each view.split as s, i (i)}
            <li>
              <div class="flex justify-between text-sm mb-1 text-white">
                <span class="font-medium">{who(s.who)}</span>
                <span class="text-gray-200">
                  <span class="text-xs text-gray-300 me-2">{money(s.value)}</span>
                  <strong class="text-gold">{s.pct}%</strong>
                </span>
              </div>
              <div class="h-2.5 rounded-full bg-white/10 overflow-hidden" role="presentation">
                <div class="h-full bg-gradient-to-l from-gold to-barbi transition-all duration-300" style="width: {s.pct}%"></div>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if !embedded}
      <div class="flex flex-col items-center gap-3 text-center">
        {#if projectId}
          <a class="cta" href="/project/{projectId}">{$t('rikmaImport.preview.openReal')}</a>
        {:else if actionHref && actionLabel}
          <a class="cta" href={actionHref}>{actionLabel}</a>
        {:else}
          <p class="text-sm text-gray-300 max-w-md">{$t('rikmaImport.preview.ownerHint')}</p>
        {/if}
        {#if !loggedIn && !actionHref}
          <a class="cta-secondary" href="/hascama">{$t('rikmaImport.preview.joinCta')}</a>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .glass-panel {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 1rem;
    padding: 1.5rem;
  }
  .door-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 1.25rem 1.5rem;
    border-radius: 1rem;
    background: rgba(0, 0, 0, 0.4);
    transition: transform 0.18s ease, background 0.18s ease;
    text-decoration: none;
  }
  .door-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.07);
  }
  .door-gold {
    border: 1px solid rgba(255, 215, 0, 0.45);
  }
  .door-barbi {
    border: 1px solid rgba(255, 0, 174, 0.45);
  }
  .text-gold {
    color: #ffd700;
  }
  .text-barbi {
    color: #ff00ae;
  }
  .border-t-gold {
    border-top-color: #ffd700;
  }
  .border-t-barbi {
    border-top-color: #ff00ae;
  }
  .border-gold\/50 {
    border-color: rgba(255, 215, 0, 0.5);
  }
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
