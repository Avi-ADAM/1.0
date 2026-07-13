<script lang="ts">
  /**
   * SpaceProjectionShadow — T2 of HANDOFF_DISTRIBUTED_DB (S2b showcase).
   *
   * Shadow-mode panel: opens the project's Space replica, hydrates the local
   * projection INSTANTLY from IndexedDB (before any network), auto-syncs in
   * the background, and compares what the chain projects against the data the
   * page already loaded from Strapi/GraphQL. It never replaces the existing
   * data source — it sits beside it, ConsentBadge-style:
   *
   *   gray  (unsigned)   — projection empty; no signed events for this rikma yet
   *   green (signed)     — projection and GraphQL agree on the compared slice
   *   red   (unverified) — mismatch; details go to console as telemetry
   *                        (exit criterion: a defined period with 0 unexplained
   *                        mismatches before projection becomes the display source)
   *
   * Renders nothing unless localStorage.SPACE_SYNC_ENABLED === '1'.
   */

  import { browser } from '$app/environment';
  import { openSpace, startAutoSync, spaceSyncEnabled } from '$lib/space/spaceStore.svelte';
  import { spaceIdForProject } from '$lib/space/protocol';
  import { proposeGenesis, voteGenesis, genesisStatus } from '$lib/space/genesis';
  import ConsentBadge from './ConsentBadge.svelte';

  type GqlUserRow = { id: string | number; attributes?: { hervachti?: number | null } };

  type Props = {
    projectId: string;
    /** base.user_1s.data — the GraphQL truth we compare balances against. */
    users?: GqlUserRow[];
  };

  let { projectId, users = [] }: Props = $props();

  // Deliberately captures the INITIAL projectId: a replica is bound to one
  // space for the component's lifetime. The call site wraps this component
  // in {#key projectId}, so a project switch remounts with a fresh replica.
  const enabled = browser && spaceSyncEnabled();
  const replica = enabled ? openSpace(spaceIdForProject(projectId)) : null;

  if (replica) void replica.hydrate();

  $effect(() => {
    if (!replica) return;
    return startAutoSync(replica);
  });

  const projection = $derived(replica ? replica.projectFor(projectId) : null);
  const eventCount = $derived(replica ? replica.state.eventsById.size : 0);

  /**
   * Balance comparison: projection balances are bigint agorot (D-12);
   * Strapi hervachti is a float in shekels. Compare at agorot resolution.
   * Only members present on BOTH sides are compared — the chain legitimately
   * starts empty and fills as signed events flow.
   */
  const comparison = $derived.by(() => {
    if (!projection || eventCount === 0) return { status: 'unsigned' as const, mismatches: [] as string[] };

    const gqlBalances = new Map<string, number>();
    for (const u of users) {
      const h = u?.attributes?.hervachti;
      if (typeof h === 'number') gqlBalances.set(String(u.id), Math.round(h * 100));
    }

    const mismatches: string[] = [];
    for (const [member, agorot] of projection.balances) {
      const gql = gqlBalances.get(member);
      if (gql === undefined) continue; // member unknown to this page's slice
      if (BigInt(gql) !== agorot) {
        mismatches.push(`${member}: chain=${agorot} gql=${gql}`);
      }
    }

    return {
      status: (mismatches.length === 0 ? 'signed' : 'unverified') as 'signed' | 'unverified',
      mismatches
    };
  });

  // Telemetry (T2 exit criterion): every mismatch is logged with a stable
  // tag so it can be counted over the observation window.
  $effect(() => {
    if (comparison.status === 'unverified') {
      console.warn('[space-shadow-telemetry] projection/gql mismatch', {
        projectId,
        mismatches: comparison.mismatches
      });
    }
  });

  const statusLabel = $derived(
    comparison.status === 'unsigned'
      ? 'projection ריק — אין עדיין אירועים חתומים'
      : comparison.status === 'signed'
        ? 'ה-projection המקומי תואם את נתוני השרת'
        : 'אי-התאמה בין ה-projection לנתוני השרת'
  );

  // ---- T6: genesis migration controls ----------------------------------
  // The current user, same convention as shadowSignFromCookie.
  const myId = browser
    ? document.cookie.split('; ').find((r) => r.startsWith('id='))?.split('=')[1] ?? null
    : null;

  const genesis = $derived(projection ? genesisStatus(projection) : null);
  const canPropose = $derived(
    Boolean(replica && projection && !genesis && myId && users.length > 0)
  );
  const canVote = $derived(
    Boolean(
      genesis && myId && !genesis.matured &&
      projection?.members.has(myId) && !genesis.approvals.includes(myId)
    )
  );

  let genesisBusy = $state(false);
  let genesisMsg = $state('');

  async function onPropose() {
    if (!replica || !myId || genesisBusy) return;
    genesisBusy = true;
    genesisMsg = '';
    const res = await proposeGenesis(replica, myId, projectId);
    if (!res.ok) genesisMsg = 'ההצעה נכשלה: ' + (res.reason ?? '');
    genesisBusy = false;
  }

  async function onVote() {
    if (!replica || !myId || !genesis || genesisBusy) return;
    genesisBusy = true;
    genesisMsg = '';
    const res = await voteGenesis(replica, myId, genesis.eventId, true);
    if (!res.ok) genesisMsg = 'החתימה נכשלה: ' + (res.reason ?? '');
    else if (res.diffs && res.diffs.length > 0) {
      // Advisory: the balances moved since the proposal was signed.
      genesisMsg = 'נחתם; שים לב — סטייה מהייצוא הנוכחי: ' + res.diffs.join(' · ');
    }
    genesisBusy = false;
  }
</script>

{#if replica && projection}
  <section
    class="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm dark:border-zinc-600 dark:bg-zinc-800"
    data-space-shadow={replica.spaceId}
  >
    <div class="flex flex-wrap items-center gap-3">
      <ConsentBadge status={comparison.status} title={statusLabel} />
      <span class="font-semibold text-zinc-700 dark:text-zinc-200">Space projection (shadow)</span>
      <span class="text-zinc-500 dark:text-zinc-400">
        {eventCount} אירועים · {projection.members.size} חברים ·
        {projection.missions.size} משימות · {projection.halukas.size} חלוקות ·
        סנכרון: {replica.state.status}
      </span>
    </div>
    {#if comparison.mismatches.length > 0}
      <ul class="mt-2 list-inside list-disc text-xs text-rose-600 dark:text-rose-400">
        {#each comparison.mismatches as m (m)}
          <li>{m}</li>
        {/each}
      </ul>
    {/if}

    <!-- T6: genesis migration — import the project's present (members +
         balances) from Strapi as a quorum-signed opening snapshot. -->
    <div class="mt-3 flex flex-wrap items-center gap-3 border-t border-dashed border-zinc-300 pt-3 text-xs dark:border-zinc-600">
      {#if canPropose}
        <button
          class="rounded-lg bg-zinc-700 px-3 py-1.5 font-semibold text-white hover:bg-zinc-600 disabled:opacity-50 dark:bg-zinc-200 dark:text-zinc-900"
          disabled={genesisBusy}
          onclick={onPropose}
        >
          ייסוד (Genesis): חתום על מצב הפתיחה מ-Strapi
        </button>
        <span class="text-zinc-500 dark:text-zinc-400">
          מייבא חברים ויתרות כ-snapshot חתום — ההורה הראשון של השרשרת
        </span>
      {:else if genesis}
        <span class="font-semibold text-zinc-700 dark:text-zinc-200">
          {genesis.matured ? 'ייסוד אושר ✓' : 'ייסוד ממתין לחתימות'}
        </span>
        <span class="text-zinc-500 dark:text-zinc-400">
          {genesis.approvals.length}/{genesis.membersTotal} חתמו
        </span>
        {#if canVote}
          <button
            class="rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white hover:bg-emerald-600 disabled:opacity-50"
            disabled={genesisBusy}
            onclick={onVote}
          >
            אמת וחתום על מצב הפתיחה
          </button>
        {/if}
      {/if}
      {#if genesisMsg}
        <span class="text-amber-600 dark:text-amber-400">{genesisMsg}</span>
      {/if}
    </div>
  </section>
{/if}
