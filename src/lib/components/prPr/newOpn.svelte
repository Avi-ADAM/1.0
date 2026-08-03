<script>
  /**
   * Open missions of a rikma.
   *
   * Two modes:
   *   - `who` set → one mission, in full (this is what `MissionModal` opens);
   *   - `who = 0`  → the whole list, rendered with the same cards the
   *     "open for partners" board uses (`OpenMissionCard`).
   *
   * The previous version filtered and localized inside `onMount`, mutating the
   * `omiData` prop: data that arrived after mount was never filtered, and
   * `langAdjast` threw on nodes whose skills carry no `localizations` (which is
   * every node `getProjectMissions` returns). Both are derivations now.
   */
  import { t, locale } from '$lib/translations';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Share from '$lib/components/share/shareButtons/index.svelte';
  import Tile from '$lib/celim/tile.svelte';
  import OpenMissionCard from '$lib/components/prPr/open/OpenMissionCard.svelte';

  /**
   * @typedef {Object} Props
   * @property {any} [omiData]
   * @property {number|string} [who] - a mission id to show alone, or 0 for the list
   * @property {any} projectName
   * @property {string} [projectId]
   */

  /** @type {Props} */
  let { omiData = [], who = 0, projectName, projectId = '' } = $props();

  let isonly = $derived(who !== 0 && who !== null && who !== undefined);
  let items = $derived(
    isonly ? (omiData ?? []).filter((m) => String(m?.id) === String(who)) : (omiData ?? [])
  );

  let wid = $state(0);

  const fmtNum = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

  /** `descrip`/`hearotMeyuchadot` legitimately hold the strings 'null'/'undefined' in old rows. */
  const hasText = (v) => !!v && v !== 'null' && v !== 'undefined';

  function fmtDate(d) {
    if (!d) return null;
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString($locale || 'he');
  }
</script>

{#if !isonly}
  <!-- List mode — one card per open mission. -->
  <div bind:clientWidth={wid} class="rounded-2xl border-2 border-gold bg-slate-800/60 p-4">
    <h1 class="mb-4 text-center text-2xl font-bold text-gold">{$t('moach.open.missionsHeading')}</h1>
    {#if items.length === 0}
      <p class="py-6 text-center text-sm text-slate-300">{$t('moach.open.empty')}</p>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {#each items as node (node.id)}
          <OpenMissionCard {node} {projectId} {projectName} />
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <div bind:clientWidth={wid} class="rounded-2xl border-2 border-gold bg-slate-800/60 p-4 text-start">
    <h1 class="mb-4 text-center text-2xl font-bold text-gold">{$t('moach.open.singleHeading')}</h1>

    {#each items as datai (datai.id)}
      {@const data = datai.attributes ?? {}}
      {@const hours = Number(data.noofhours) || 0}
      {@const perhour = Number(data.perhour) || 0}
      {@const skills = data.skills?.data ?? []}
      {@const roles = data.tafkidims?.data ?? []}
      {@const workWays = data.work_ways?.data ?? []}
      {@const acts = data.acts?.data ?? []}
      {@const candidates = (data.asks?.data ?? []).filter((k) => k?.attributes?.archived !== true)}
      {@const shareTitle = $t('project.newOpn.title', { name: data.name ?? '', projectName })}

      <article class="flex flex-col gap-4">
        <header class="flex flex-wrap items-start justify-between gap-3">
          <h2 class="text-2xl font-bold text-barbi underline lg:text-4xl">{data.name}</h2>
          {#if hours > 0 && perhour > 0}
            <div class="flex flex-col items-center rounded-xl border border-gold/60 bg-slate-900/70 px-3 py-2 text-gold">
              <strong class="text-xl">{fmtNum(hours * perhour)}</strong>
              <span class="text-xs opacity-80">
                {fmtNum(hours)} {$t('moach.open.hours')} × {fmtNum(perhour)}
              </span>
            </div>
          {/if}
        </header>

        {#if hasText(data.descrip)}
          <RichText outpot={data.descrip} editable={false} sml={true} />
        {/if}
        {#if hasText(data.hearotMeyuchadot)}
          <RichText outpot={data.hearotMeyuchadot} editable={false} sml={true} />
        {/if}

        {#if acts.length > 0}
          <ul class="flex flex-col">
            {#each acts as act (act.id)}
              <li class="flex flex-row items-start gap-2 border-y border-mturk/60 py-1">
                <span>✅</span>
                <h3 class="text-gold hover:text-barbi md:text-xl">{act.attributes?.shem}</h3>
              </li>
            {/each}
          </ul>
        {/if}

        {#if skills.length > 0}
          <div>
            <small class="text-sm text-barbi lg:text-xl">{$t('project.newOpn.requireSkills')}</small>
            <div class="flex flex-wrap items-center justify-center gap-1 rounded border border-gold p-2 lg:p-4">
              {#each skills as skill (skill.id)}
                <Tile sm={wid > 555} big={wid > 555} pink={true} word={skill.attributes?.skillName} />
              {/each}
            </div>
          </div>
        {/if}

        {#if roles.length > 0}
          <div>
            <small class="text-sm text-barbi lg:text-xl">{$t('project.newOpn.requiredRoles')}</small>
            <div class="flex flex-wrap items-center justify-center gap-1 rounded border border-gold p-2 lg:p-4">
              {#each roles as rol (rol.id)}
                <Tile sm={wid > 555} big={wid > 555} wow={true} word={rol.attributes?.roleDescription} />
              {/each}
            </div>
          </div>
        {/if}

        {#if workWays.length > 0}
          <div>
            <small class="text-sm text-barbi lg:text-xl">{$t('project.newOpn.requiredWW')}</small>
            <div class="flex flex-wrap items-center justify-center gap-1 rounded border border-gold p-2 lg:p-4">
              {#each workWays as ww (ww.id)}
                <Tile bg="gold" sm={wid > 555} big={wid > 555} word={ww.attributes?.workWayName} />
              {/each}
            </div>
          </div>
        {/if}

        <div class="flex flex-wrap items-center gap-1.5 text-xs text-slate-200">
          {#if fmtDate(data.sqadualed)}
            <span class="rounded-full bg-slate-700/70 px-2 py-0.5">🗓️ {fmtDate(data.sqadualed)}</span>
          {/if}
          {#if candidates.length}
            <span class="rounded-full bg-barbi/30 px-2 py-0.5 font-semibold text-gold">
              🙋 {candidates.length} {$t('moach.open.candidates')}
            </span>
          {:else}
            <span class="rounded-full bg-slate-700/70 px-2 py-0.5 opacity-70">{$t('moach.open.noCandidates')}</span>
          {/if}
        </div>

        <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-gold/30 pt-3">
          <a
            href="/availableMission/{datai.id}"
            target="_blank"
            rel="noopener noreferrer"
            class="rounded-lg bg-gold px-4 py-2 text-center font-bold text-slate-900 shadow-md transition-colors duration-200 hover:bg-barbi hover:text-gold hover:shadow-lg"
          >
            {$t('project.newOpn.seePr')}
          </a>

          <Share
            slug={`availableMission/${datai.id}`}
            title={shareTitle}
            desc={shareTitle}
            hashtags={['1💗1', 'consensus']}
            quote={shareTitle}
          />
        </footer>
      </article>
    {/each}
  </div>
{/if}
