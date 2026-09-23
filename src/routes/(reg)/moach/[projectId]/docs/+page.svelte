<script>
  /**
   * The rikma's shared library — documents, images and links
   * (docs/PLAN_RIKMA_SHARED_INFO.md §5).
   *
   * Three kinds on one shelf, because that is how a partnership actually holds
   * its material: a signed lease, a photo of the delivery, and a link to the
   * Drive folder where the rest already lives. The existing `drivelink` is
   * pinned above the list rather than replaced — nothing that worked yesterday
   * stops working today.
   *
   * The whole tab sits on one opaque `--surface` panel. The moach backdrop is a
   * gradient that runs from light to dark behind the content, so any text
   * painted straight onto it is readable over half the page at best; the card
   * surface tokens resolve per theme and per mode and carry their own ink.
   *
   * The vault (§3.2) is deliberately absent: passwords wait for the sealed
   * space events, and the note at the bottom says so rather than leaving a
   * member to guess and paste one into a note field.
   */
  import { t, isRtl } from '$lib/translations';
  import { invalidateAll } from '$app/navigation';
  import { untrack } from 'svelte';
  import P2pPilotCard from '$lib/components/rikmaDocs/P2pPilotCard.svelte';
  import { RikmaP2p } from '$lib/p2p/pilot.svelte.js';
  import AddSpaceDoc from '$lib/components/rikmaDocs/AddSpaceDoc.svelte';
  import SpaceDocRow from '$lib/components/rikmaDocs/SpaceDocRow.svelte';
  import { folderNames, groupByFolder } from '$lib/spaceDocs/spaceDocs.js';

  let { data } = $props();

  const FILTERS = ['all', 'file', 'image', 'link'];
  let filter = $state('all');
  let adding = $state(false);

  let docs = $derived(data.docs ?? []);
  let shown = $derived(filter === 'all' ? docs : docs.filter((d) => d.kind === filter));
  let groups = $derived(groupByFolder(shown));
  let folders = $derived(folderNames(docs));

  let counts = $derived({
    all: docs.length,
    file: docs.filter((d) => d.kind === 'file').length,
    image: docs.filter((d) => d.kind === 'image').length,
    link: docs.filter((d) => d.kind === 'link').length
  });

  // The Drive link belongs to the links view: it is one, and the filter
  // promises that picking "links" shows every link the rikma has.
  let showDrive = $derived(Boolean(data.drivelink) && (filter === 'all' || filter === 'link'));

  // The P2P pilot (docs/PLAN_P2P_PILOT.md) — one session per rikma, torn down
  // on leave. Only the project id is tracked: `start()` reads the opt-in, and
  // flipping it must not tear the session down and rebuild it.
  let pilot = $derived(new RikmaP2p(String(data.projectId)));
  $effect(() => {
    const session = pilot;
    return untrack(() => session.start());
  });

  async function refresh() {
    adding = false;
    await invalidateAll();
  }
</script>

<section class="docs-tab" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="panel">
    <header class="head">
      <div class="head-text">
        <h2>{$t('rikmaDocs.title')}</h2>
        <p class="intro">{$t('rikmaDocs.intro')}</p>
      </div>
      <button
        type="button"
        class="add-toggle"
        class:open={adding}
        aria-expanded={adding}
        onclick={() => (adding = !adding)}
      >
        <span aria-hidden="true">{adding ? '✕' : '+'}</span>
        {adding ? $t('rikmaDocs.add.close') : $t('rikmaDocs.add.open')}
      </button>
    </header>

    {#if data.loadFailed}
      <p class="notice" role="alert">{$t('rikmaDocs.loadFailed')}</p>
    {/if}

    {#if adding}
      <AddSpaceDoc
        projectId={data.projectId}
        upload={data.upload}
        onAdded={refresh}
        onUploaded={(hash, file) => pilot?.seedUploaded(hash, file)}
      />
    {/if}

    <!-- One datalist for the whole tab: the add form and any row's inline edit
         both point `list=` at it, and a row can be edited with the add form
         closed — a datalist that only exists inside the form would be empty
         exactly then. -->
    <datalist id="rikma-docs-folders">
      {#each folders as existing (existing)}
        <option value={existing}></option>
      {/each}
    </datalist>

    <div class="filters" role="group" aria-label={$t('rikmaDocs.filterLegend')}>
      {#each FILTERS as option (option)}
        <button
          type="button"
          class="seg"
          class:on={filter === option}
          aria-pressed={filter === option}
          onclick={() => (filter = option)}
        >
          {$t(`rikmaDocs.filters.${option}`)}
          <span class="count">{counts[option]}</span>
        </button>
      {/each}
    </div>

    {#if showDrive}
      <a class="drive" href={data.drivelink} target="_blank" rel="external noopener noreferrer">
        <span class="drive-icon" aria-hidden="true">📁</span>
        <span class="drive-text">
          <strong>{$t('rikmaDocs.drive.title')}</strong>
          <small>{$t('rikmaDocs.drive.note')}</small>
        </span>
        <span class="drive-go" aria-hidden="true">{$isRtl ? '←' : '→'}</span>
      </a>
    {/if}

    {#if groups.length === 0}
      <p class="empty">{docs.length === 0 ? $t('rikmaDocs.empty') : $t('rikmaDocs.emptyFilter')}</p>
    {:else}
      {#each groups as group (group.folder)}
        <section class="folder" aria-label={group.folder || $t('rikmaDocs.unfiled')}>
          <h3 class="folder-head">
            <span aria-hidden="true">{group.folder ? '🗂️' : '📥'}</span>
            <span class="folder-name">{group.folder || $t('rikmaDocs.unfiled')}</span>
            <span class="folder-count">{group.docs.length}</span>
          </h3>
          <ul class="rows">
            {#each group.docs as doc (doc.id)}
              <SpaceDocRow {doc} projectId={data.projectId} {pilot} onChanged={refresh} />
            {/each}
          </ul>
        </section>
      {/each}
    {/if}

    {#if pilot}
      <P2pPilotCard {pilot} />
    {/if}

    <p class="vault-note"><span aria-hidden="true">🔒</span> {$t('rikmaDocs.vaultNote')}</p>
  </div>
</section>

<style>
  .docs-tab {
    padding: 1rem 0;
  }
  /* The one opaque ground for the whole tab (see the header comment). */
  .panel {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    padding: 1.25rem;
    border-radius: 1rem;
    background: var(--surface);
    color: var(--surface-ink);
    border: 1px solid var(--surface-line);
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.18);
  }
  .head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--surface-line);
  }
  .head-text {
    flex: 1 1 18rem;
    min-width: 0;
  }
  .head h2 {
    font-size: 1.4rem;
    font-weight: 800;
    line-height: 1.25;
    color: var(--surface-ink);
  }
  .intro {
    margin-top: 0.3rem;
    font-size: 0.9rem;
    color: var(--surface-muted);
  }
  .add-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 1.15rem;
    border-radius: 9999px;
    background: var(--gold);
    color: #1a1408;
    font-weight: 800;
    white-space: nowrap;
  }
  .add-toggle.open {
    background: var(--surface-2);
    color: var(--surface-ink);
    box-shadow: inset 0 0 0 1px var(--surface-line);
  }
  .add-toggle:focus-visible,
  .seg:focus-visible,
  .drive:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .notice {
    padding: 0.65rem 0.9rem;
    border-radius: 0.6rem;
    background: rgb(220 38 38 / 0.1);
    border: 1px solid rgb(220 38 38 / 0.45);
    color: var(--surface-ink);
    font-size: 0.85rem;
  }
  /* A segmented control, not four loose chips: one choice, visibly one group. */
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: 0.75rem;
    background: var(--surface-2);
    align-self: flex-start;
    max-width: 100%;
  }
  .seg {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.9rem;
    border-radius: 0.55rem;
    color: var(--surface-muted);
    font-size: 0.88rem;
    font-weight: 600;
  }
  .seg.on {
    background: var(--surface);
    color: var(--surface-ink);
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
  }
  .count {
    min-width: 1.4rem;
    padding: 0 0.35rem;
    border-radius: 9999px;
    background: var(--surface-line);
    font-size: 0.72rem;
    text-align: center;
  }
  .seg.on .count {
    background: var(--gold);
    color: #1a1408;
  }
  .drive {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1rem;
    border-radius: 0.75rem;
    background: var(--surface-2);
    border: 1px solid var(--surface-line);
    border-inline-start: 4px solid var(--gold);
    color: var(--surface-ink);
    text-decoration: none;
  }
  .drive:hover {
    border-color: var(--gold);
  }
  .drive-icon {
    font-size: 1.4rem;
  }
  .drive-text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .drive-text strong {
    font-weight: 700;
  }
  .drive-text small {
    color: var(--surface-muted);
    font-size: 0.78rem;
  }
  .drive-go {
    color: var(--surface-muted);
    font-size: 1.1rem;
  }
  .folder {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .folder-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid var(--surface-line);
    font-size: 0.8rem;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: var(--surface-muted);
  }
  .folder-name {
    color: var(--surface-ink);
    font-size: 0.95rem;
    overflow-wrap: anywhere;
  }
  .folder-count {
    margin-inline-start: auto;
    font-weight: 600;
  }
  .rows {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .empty {
    padding: 2rem 1.25rem;
    border: 1.5px dashed var(--surface-line);
    border-radius: 0.75rem;
    background: var(--surface-2);
    color: var(--surface-muted);
    text-align: center;
  }
  .vault-note {
    padding-top: 0.9rem;
    border-top: 1px solid var(--surface-line);
    font-size: 0.8rem;
    color: var(--surface-muted);
  }
  @media (max-width: 480px) {
    .panel {
      padding: 1rem;
      border-radius: 0.75rem;
    }
    .add-toggle {
      width: 100%;
      justify-content: center;
    }
  }
</style>
