<script>
  /**
   * One open mission (or a mission proposal still awaiting a vote) as a card on
   * the "open for partners" board.
   *
   * Renders a raw `getProjectMissions` node — `open_missions` and `pendms` have
   * the same shape for everything shown here, so one card serves both; only the
   * status badge and the primary link differ.
   */
  import { t, locale } from '$lib/translations';
  import MissionStipendOffer from '$lib/components/stipend/MissionStipendOffer.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import Share from '$lib/components/share/shareButtons/index.svelte';
  import ArchiveObjectButton from '$lib/components/archive/ArchiveObjectButton.svelte';
  import { htmlExcerpt } from '$lib/text/htmlExcerpt';

  /**
   * @typedef {Object} Props
   * @property {any} node - Strapi node: `{ id, attributes }`
   * @property {string} projectId
   * @property {string} [projectName]
   * @property {boolean} [pending] - a `pendm` (proposal), not a published open mission
   */

  /** @type {Props} */
  let { node, projectId, projectName = '', pending = false } = $props();

  let a = $derived(node?.attributes ?? {});
  let excerpt = $derived(htmlExcerpt(a.descrip, 200));
  let notes = $derived(htmlExcerpt(a.hearotMeyuchadot, 140));

  let hours = $derived(Number(a.noofhours) || 0);
  let perhour = $derived(Number(a.perhour) || 0);
  let value = $derived(hours * perhour);

  let skills = $derived((a.skills?.data ?? []).map((s) => s.attributes?.skillName).filter(Boolean));
  let roles = $derived(
    (a.tafkidims?.data ?? []).map((r) => r.attributes?.roleDescription).filter(Boolean)
  );
  let workWays = $derived(
    (a.work_ways?.data ?? []).map((w) => w.attributes?.workWayName).filter(Boolean)
  );
  let acts = $derived(a.acts?.data ?? []);

  /** Candidates who asked to join and were not withdrawn — the vote-worthy ones. */
  let candidates = $derived((a.asks?.data ?? []).filter((k) => k?.attributes?.archived !== true));

  let startDate = $derived(a.sqadualed ?? a.dates ?? null);

  const fmtNum = (n) => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

  function fmtDate(d) {
    if (!d) return null;
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString($locale || 'he');
  }

  let href = $derived(
    pending ? `/moach/${projectId}/votes/pendm/${node.id}` : `/availableMission/${node.id}`
  );
  let shareTitle = $derived($t('project.newOpn.title', { name: a.name ?? '', projectName }));
</script>

<article
  class="open-card group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-gold/40 bg-slate-900/70 p-4 text-start shadow-lg backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gold"
  class:pending
>
  <!-- status strip -->
  <span class="absolute inset-x-0 top-0 h-1 {pending ? 'bg-mturk/70' : 'bg-goldShain bg-[length:250%_auto] animate-gradientx'}"></span>

  <header class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <a
        {href}
        class="block truncate text-lg font-bold text-gold hover:text-barbi hover:underline lg:text-xl"
        title={a.name}
      >
        {a.name}
      </a>
      <p class="mt-0.5 text-xs font-semibold {pending ? 'text-mturk' : 'text-barbi'}">
        {pending ? $t('moach.open.pendingBadge') : $t('moach.open.openBadge')}
      </p>
    </div>

    {#if value > 0}
      <div
        class="flex flex-none flex-col items-center rounded-xl border border-gold/50 bg-slate-800/80 px-2.5 py-1.5 text-gold"
        title={$t('moach.open.totalValue')}
      >
        <strong class="text-base leading-tight">{fmtNum(value)}</strong>
        <span class="whitespace-nowrap text-[0.65rem] opacity-80">
          {fmtNum(hours)} {$t('moach.open.hours')} × {fmtNum(perhour)}
        </span>
      </div>
    {/if}
  </header>

  <!-- A mission the rikma published with a stipend attached (PLAN_STIPEND §13):
       what it is worth and what someone is paying so it can be done, side by
       side — never merged into one number. -->
  <MissionStipendOffer
    {hours}
    {perhour}
    stipendRate={Number(a.stipendRate) || 0}
    costShare={a.stipendCostShare ?? 1}
    mode={a.stipendMode || 'equity'}
    funderName={a.stipendFunder?.data?.attributes?.username || ''}
    compact={true}
  />

  {#if excerpt}
    <p class="line-clamp-3 text-sm text-slate-300">{excerpt}</p>
  {/if}
  {#if notes}
    <p class="line-clamp-2 text-xs italic text-slate-400">{notes}</p>
  {/if}

  {#if skills.length || roles.length || workWays.length}
    <div class="flex flex-col gap-1.5">
      {#if skills.length}
        <div class="flex flex-wrap items-center gap-1">
          <small class="me-1 text-[0.7rem] text-gold-l">{$t('project.newOpn.requireSkills')}</small>
          {#each skills.slice(0, 5) as skill (skill)}
            <Tile sm={true} pink={true} word={skill} />
          {/each}
          {#if skills.length > 5}
            <span class="text-xs text-slate-400">{$t('moach.open.more', { count: skills.length - 5 })}</span>
          {/if}
        </div>
      {/if}
      {#if roles.length}
        <div class="flex flex-wrap items-center gap-1">
          <small class="me-1 text-[0.7rem] text-gold-l">{$t('project.newOpn.requiredRoles')}</small>
          {#each roles.slice(0, 4) as role (role)}
            <Tile sm={true} wow={true} word={role} />
          {/each}
          {#if roles.length > 4}
            <span class="text-xs text-slate-400">{$t('moach.open.more', { count: roles.length - 4 })}</span>
          {/if}
        </div>
      {/if}
      {#if workWays.length}
        <div class="flex flex-wrap items-center gap-1">
          <small class="me-1 text-[0.7rem] text-gold-l">{$t('project.newOpn.requiredWW')}</small>
          {#each workWays.slice(0, 4) as ww (ww)}
            <Tile sm={true} bg="gold" word={ww} />
          {/each}
          {#if workWays.length > 4}
            <span class="text-xs text-slate-400">{$t('moach.open.more', { count: workWays.length - 4 })}</span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <div class="mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-300">
    {#if fmtDate(startDate)}
      <span class="rounded-full bg-slate-700/70 px-2 py-0.5">🗓️ {fmtDate(startDate)}</span>
    {/if}
    {#if acts.length}
      <span class="rounded-full bg-slate-700/70 px-2 py-0.5">✅ {acts.length} {$t('moach.open.acts')}</span>
    {/if}
    {#if candidates.length}
      <a
        href="/moach/{projectId}/votes"
        class="rounded-full bg-barbi/25 px-2 py-0.5 font-semibold text-gold hover:bg-barbi/50"
      >
        🙋 {candidates.length} {$t('moach.open.candidates')}
      </a>
    {:else if !pending}
      <span class="rounded-full bg-slate-700/70 px-2 py-0.5 opacity-70">{$t('moach.open.noCandidates')}</span>
    {/if}
  </div>

  <footer class="flex items-center justify-between gap-2 border-t border-gold/20 pt-2.5">
    <a
      {href}
      class="rounded-lg bg-gold px-3 py-1.5 text-sm font-bold text-slate-900 shadow transition-colors hover:bg-barbi hover:text-gold"
    >
      {pending ? $t('moach.open.toVote') : $t('project.newOpn.seePr')}
    </a>
    {#if !pending}
      <Share
        slug={`availableMission/${node.id}`}
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
        targetKind="openMission"
        targetId={node.id}
        targetName={a.name ?? ''}
        className="text-xs px-2 py-1 rounded-lg border border-gold/30 text-gold-l hover:bg-gold/10"
      />
    {/if}
  </footer>
</article>

<style>
  .open-card:hover {
    box-shadow: 0 8px 26px rgba(238, 232, 170, 0.18);
  }
  .open-card.pending {
    border-color: rgba(34, 211, 238, 0.45);
  }
  .open-card.pending:hover {
    border-color: var(--mturk);
    box-shadow: 0 8px 26px rgba(34, 211, 238, 0.18);
  }
  .text-gold-l {
    color: var(--gold-l, #f0c040);
  }
</style>
