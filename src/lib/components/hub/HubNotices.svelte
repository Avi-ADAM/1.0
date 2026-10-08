<script lang="ts">
  /**
   * HubNotices — everything that waits for the member, as one list of sentences
   * (docs/inprogress/PLAN_SMART_NOTICES.md §6.3), in place of the hub's five-item feed.
   *
   * Three sources, one list:
   *   - the concierge and the deals, built on the server (`streamed.notices`);
   *   - the heart, built here from the heart's own items (`finalSwiperArray`) —
   *     the hub already warms that data in idle time for /lev, so no extra query.
   * `mergeNotices(wish, deal, lev)` keeps one row per thing (a wish offer is both
   * a concierge proposal and a heart `wishoffer`; the concierge's knows the round).
   *
   * Until the heart's items arrive, the old feed (`fallback`) stands in for them
   * — it is computed from the hub's summary, which is already here.
   *
   * The server promise is read into state, not with {#await}: an approval reloads
   * the page data, which hands a new promise to the same place, and an {#await}
   * whose input changes late renders into a dead subtree.
   */
  import type { Snippet } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/translations';
  // Tokens only (:root + html.* blocks) — the rows paint from them.
  import '$lib/styles/concierge.css';
  import NoticeRow from '$lib/components/notices/NoticeRow.svelte';
  import { finalSwiperArray } from '$lib/stores/levDerived';
  import { isCardVisible } from '$lib/components/lev/cards/cardKinds.js';
  import { applyDismissals, groupNotices, levNotices, mergeNotices, type Notice } from '$lib/notices';
  import type { HubNotices } from '../../../routes/(reg)/hub/+page.server';

  interface Props {
    pending: Promise<HubNotices | null>;
    /** The old feed, shown until the heart's items are here. */
    fallback?: Snippet;
    /** The section's heading — rendered only when there is something under it. */
    header?: Snippet;
    /** How many rows before "N more". */
    limit?: number;
  }

  let { pending, fallback, header, limit = 6 }: Props = $props();

  let server: HubNotices | null | undefined = $state(undefined);
  $effect(() => {
    const p = pending;
    let live = true;
    p.then(
      (v) => live && (server = v),
      () => live && (server = null)
    );
    return () => {
      live = false;
    };
  });

  const levReady = $derived($finalSwiperArray.length > 0);

  const merged = $derived.by(() => {
    const prefs = server?.prefs;
    // The heart's own kind filter, as she saved it — a kind she filtered out of
    // the heart is not news on the hub either.
    const milon = prefs?.milon ?? {};
    const lev = applyDismissals(
      levNotices($finalSwiperArray.filter((item: any) => isCardVisible(item, milon))),
      prefs?.dismissals ?? []
    );
    // Identical rows (three cycles of one recurring expense) fold into one with a count.
    return groupNotices(mergeNotices(server?.wish ?? [], server?.deal ?? [], levReady ? lev : []));
  });

  // What she hid or restored in this visit, by key. Kept apart from `merged`:
  // the heart's store updates often (timers, the socket), and an edit made on a
  // derived copy would be undone by the next recompute.
  let overrides = $state<Record<string, boolean>>({});
  let showAll = $state(false);
  let showHidden = $state(false);

  const list = $derived(merged.map((n) => (n.key in overrides ? { ...n, hidden: overrides[n.key] } : n)));
  const visible = $derived(list.filter((n) => !n.hidden));
  const hiddenOnes = $derived(list.filter((n) => n.hidden));
  const shown = $derived(showAll ? visible : visible.slice(0, limit));

  function mark(n: Notice, hidden: boolean) {
    overrides = { ...overrides, [n.key]: hidden };
  }

  let refresh: ReturnType<typeof setTimeout> | undefined;
  function afterApproved() {
    clearTimeout(refresh);
    refresh = setTimeout(() => invalidateAll(), 2500);
  }
</script>

{#if visible.length > 0 || hiddenOnes.length > 0 || (!levReady && fallback)}
  <div class="hn">
    {@render header?.()}
    {#if visible.length > 0}
      <ul class="hn-list">
        {#each shown as notice (notice.key)}
          <li>
            <NoticeRow
              {notice}
              onapproved={afterApproved}
              onhidden={(n) => mark(n, true)}
            />
          </li>
        {/each}
      </ul>
      {#if visible.length > shown.length}
        <button type="button" class="hn-link" onclick={() => (showAll = true)}>
          {$t('notices.ui.more', { count: visible.length - shown.length })}
        </button>
      {/if}
    {/if}

    {#if !levReady && fallback}
      {@render fallback()}
    {/if}

    {#if hiddenOnes.length > 0}
      <button type="button" class="hn-link" aria-expanded={showHidden} onclick={() => (showHidden = !showHidden)}>
        {$t('notices.ui.showHidden', { count: hiddenOnes.length })}
      </button>
      {#if showHidden}
        <ul class="hn-list">
          {#each hiddenOnes as notice (notice.key)}
            <li><NoticeRow {notice} onrestored={(n) => mark(n, false)} /></li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .hn {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .hn-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .hn-link {
    align-self: flex-start;
    min-height: 36px;
    padding: 4px 6px;
    border: 0;
    background: none;
    font: inherit;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.72);
    text-decoration: underline;
    cursor: pointer;
  }
  .hn-link:focus-visible {
    outline: 2px solid var(--cg-goldhi, #f59e0b);
    outline-offset: 2px;
  }
</style>
