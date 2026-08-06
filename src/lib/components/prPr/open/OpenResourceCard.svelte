<script>
  /**
   * One needed resource (`open_mashaabim`, or a `pmash` still awaiting a vote)
   * as a card on the "open for partners" board.
   *
   * Replaces the transposed table in `mashmam.svelte`, which showed one column
   * per resource, had no link to the resource's own page, and hard-coded its
   * Hebrew labels.
   */
  import { t, locale } from '$lib/translations';
  import Share from '$lib/components/share/shareButtons/index.svelte';
  import ArchiveObjectButton from '$lib/components/archive/ArchiveObjectButton.svelte';
  import { htmlExcerpt } from '$lib/text/htmlExcerpt';
  import { openResourceTotals } from '$lib/resources/openResourceTotals';

  /**
   * @typedef {Object} Props
   * @property {any} node - Strapi node: `{ id, attributes }`
   * @property {string} projectId
   * @property {string} [projectName]
   * @property {boolean} [pending] - a `pmash` (proposal), not a published open resource
   */

  /** @type {Props} */
  let { node, projectId, projectName = '', pending = false } = $props();

  let a = $derived(node?.attributes ?? {});
  let excerpt = $derived(htmlExcerpt(a.descrip, 200));
  let notes = $derived(htmlExcerpt(a.spnot, 140));
  let totals = $derived(openResourceTotals(a));

  const KNOWN_KINDS = ['monthly', 'yearly', 'rent', 'perUnit', 'total'];
  let kindLabel = $derived(
    totals.kind && KNOWN_KINDS.includes(totals.kind) ? $t(`mash.${totals.kind}`) : (totals.kind ?? '')
  );

  const fmtNum = (n) =>
    n === null || n === undefined ? '' : Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

  function fmtDate(d) {
    if (!d) return null;
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString($locale || 'he');
  }

  /** "לכל חודש" / "ליחידה" — what the per-unit price is per. */
  let priceUnitLabel = $derived(
    totals.kind === 'monthly'
      ? $t('moach.open.perMonth')
      : totals.kind === 'yearly'
        ? $t('moach.open.perYear')
        : totals.kind === 'perUnit'
          ? $t('moach.open.perUnit')
          : $t('moach.open.perPeriod')
  );

  /** A pmash has no public page of its own — it is still a proposal being voted on. */
  let href = $derived(
    pending ? `/moach/${projectId}/votes/pmash/${node.id}` : `/availiableResorce/${node.id}`
  );
  let shareTitle = $derived(
    $t('moach.open.shareResource', { name: a.name ?? '', projectName })
  );
</script>

<article
  class="open-card group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-mturk/40 bg-slate-900/70 p-4 text-start shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-mturk"
  class:pending
>
  <span class="absolute inset-x-0 top-0 h-1 {pending ? 'bg-barbi/60' : 'bg-mturk/80'}"></span>

  <header class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <a
        {href}
        class="block truncate text-lg font-bold text-mturk hover:text-barbi hover:underline lg:text-xl"
        title={a.name}
      >
        {a.name}
      </a>
      <p class="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
        <span class="font-semibold {pending ? 'text-barbi' : 'text-mturk'}">
          {pending ? $t('moach.open.pendingBadge') : $t('moach.open.openBadge')}
        </span>
        {#if kindLabel}
          <span class="rounded-full bg-slate-700/70 px-2 py-0.5 text-slate-200">{kindLabel}</span>
        {/if}
      </p>
    </div>

    {#if totals.total !== null}
      <div
        class="flex flex-none flex-col items-center rounded-xl border border-mturk/50 bg-slate-800/80 px-2.5 py-1.5 text-mturk"
        title={$t('mash.tota')}
      >
        <strong class="text-base leading-tight">{fmtNum(totals.total)}</strong>
        {#if totals.cycles !== null}
          <span class="whitespace-nowrap text-[0.65rem] opacity-80">
            {fmtNum(totals.cycles)} × {fmtNum(totals.price)}
          </span>
        {:else if totals.quantity !== null}
          <span class="whitespace-nowrap text-[0.65rem] opacity-80">
            {fmtNum(totals.quantity)} × {fmtNum(totals.price)}
          </span>
        {/if}
      </div>
    {/if}
  </header>

  {#if excerpt}
    <p class="line-clamp-3 text-sm text-slate-300">{excerpt}</p>
  {/if}

  <dl class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:grid-cols-3">
    {#if totals.price !== null}
      <div>
        <dt class="text-gold-l">{$t('mash.shovi')} · {priceUnitLabel}</dt>
        <dd class="font-bold text-slate-100">{fmtNum(totals.price)}</dd>
      </div>
    {/if}
    {#if totals.maxPrice !== null}
      <div>
        <dt class="text-gold-l">{$t('mash.shovile')}</dt>
        <dd class="font-bold text-slate-100">{fmtNum(totals.maxPrice)}</dd>
      </div>
    {/if}
    {#if totals.quantity !== null}
      <div>
        <dt class="text-gold-l">{$t('mash.noof')}</dt>
        <dd class="font-bold text-slate-100">{fmtNum(totals.quantity)}</dd>
      </div>
    {/if}
    {#if totals.maxTotal !== null && totals.maxTotal !== totals.maxPrice}
      <div>
        <dt class="text-gold-l">{$t('mash.shovilem')}</dt>
        <dd class="font-bold text-slate-100">{fmtNum(totals.maxTotal)}</dd>
      </div>
    {/if}
  </dl>

  {#if notes}
    <p class="line-clamp-2 text-xs italic text-slate-400">{notes}</p>
  {/if}

  <div class="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-300">
    {#if totals.hasPeriod && fmtDate(a.sqadualed)}
      <span class="rounded-full bg-slate-700/70 px-2 py-0.5">
        🗓️ {fmtDate(a.sqadualed)}{fmtDate(a.sqadualedf) ? ` → ${fmtDate(a.sqadualedf)}` : ''}
      </span>
    {/if}
    {#if a.linkto}
      <a
        href={a.linkto}
        target="_blank"
        rel="noopener noreferrer"
        class="rounded-full bg-slate-700/70 px-2 py-0.5 underline hover:bg-slate-600/70 hover:text-mturk"
      >
        🔗 {$t('mash.linkto')}
      </a>
    {/if}
  </div>

  <footer class="flex items-center justify-between gap-2 border-t border-mturk/20 pt-2.5">
    <a
      {href}
      class="rounded-lg bg-mturk px-3 py-1.5 text-sm font-bold text-slate-900 shadow transition-colors hover:bg-barbi hover:text-gold"
    >
      {pending ? $t('moach.open.toVote') : $t('moach.open.viewResource')}
    </a>
    {#if !pending}
      <Share
        slug={`availiableResorce/${node.id}`}
        title={shareTitle}
        desc={excerpt || shareTitle}
        hashtags={['1💗1', 'consensus']}
        quote={shareTitle}
      />
    {/if}
    {#if !pending && a.lifecycle !== 'archived'}
      <!-- Opening the question of whether the rikma still needs this — a
           proposal, never a delete, so it sits quietly beside share. -->
      <ArchiveObjectButton
        targetKind="openResource"
        targetId={node.id}
        targetName={a.name ?? ''}
        className="text-xs px-2 py-1 rounded-lg border border-gold/30 text-gold-l hover:bg-gold/10"
      />
    {/if}
  </footer>
</article>

<style>
  .open-card:hover {
    box-shadow: 0 8px 26px rgba(34, 211, 238, 0.18);
  }
  .open-card.pending {
    border-color: rgba(255, 0, 146, 0.4);
  }
  .open-card.pending:hover {
    border-color: var(--barbi-pink);
    box-shadow: 0 8px 26px rgba(255, 0, 146, 0.18);
  }
  .text-gold-l {
    color: var(--gold-l, #f0c040);
  }
</style>
