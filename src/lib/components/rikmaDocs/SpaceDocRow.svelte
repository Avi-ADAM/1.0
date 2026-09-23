<script>
  /**
   * One entry of the rikma's shared library, with its inline edit
   * (docs/PLAN_RIKMA_SHARED_INFO.md §5).
   *
   * Hierarchy, top to bottom: the kind (a tinted tile, so a list of twenty
   * reads at a glance as "documents here, links there"), the name (the one
   * thing a member scans for — full ink, not gold, which fails contrast on the
   * light surface), then the note, then the meta line. Edit/remove are quiet
   * until hovered or focused; opening the item is the loud action.
   *
   * Removal is a soft delete — the row stays with `archived: true`, so nobody
   * can quietly erase a contract the partnership relied on.
   *
   * Every href here came from a member or from our own serve endpoint.
   * `normalizeSpaceDocs` has already dropped anything else, and the anchors
   * carry `rel="external noopener noreferrer"`.
   */
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { formatSize } from '$lib/spaceDocs/spaceDocs.js';
  import { saveBlob } from '$lib/p2p/pilot.svelte.js';

  /** `pilot` — the rikma's P2P session (docs/PLAN_P2P_PILOT.md), or null. */
  let { doc, projectId, pilot = null, onChanged } = $props();

  // Through the pilot only when this device joined and the row carries the
  // hash every copy is checked against; everything else opens as before.
  let viaPilot = $derived(Boolean(pilot?.optedIn && doc.sha256 && doc.kind !== 'link'));
  let fetching = $state(false);
  /** Where the last open came from — shown so the member sees P2P working. */
  let source = $state('');

  async function openViaPilot(event) {
    if (!viaPilot || fetching) return;
    event.preventDefault();
    fetching = true;
    errorMsg = '';
    try {
      const result = await pilot.open(doc);
      source = result.source;
      saveBlob(result.blob, doc.fileName || doc.name);
    } catch {
      // The pilot is never the only way in: fall back to the plain link.
      window.location.assign(doc.href);
    } finally {
      fetching = false;
    }
  }

  let editing = $state(false);
  let busy = $state(false);
  let errorMsg = $state('');

  let name = $state('');
  let note = $state('');
  let folder = $state('');

  function startEdit() {
    name = doc.name;
    note = doc.note;
    folder = doc.folder;
    errorMsg = '';
    editing = true;
  }

  async function save() {
    if (!name.trim()) {
      errorMsg = $t('rikmaDocs.errors.name');
      return;
    }
    busy = true;
    errorMsg = '';
    const res = await executeAction('updateSpaceDoc', {
      docId: String(doc.id),
      projectId: String(projectId),
      name: name.trim(),
      note: note.trim(),
      folder: folder.trim()
    });
    busy = false;
    if (res.success) {
      editing = false;
      await onChanged?.();
    } else {
      errorMsg = res.error?.message || $t('rikmaDocs.errors.save');
    }
  }

  async function archive() {
    if (!confirm($t('rikmaDocs.row.removeConfirm', { name: doc.name }))) return;
    busy = true;
    errorMsg = '';
    const res = await executeAction('archiveSpaceDoc', {
      docId: String(doc.id),
      projectId: String(projectId)
    });
    busy = false;
    if (res.success) await onChanged?.();
    else errorMsg = res.error?.message || $t('rikmaDocs.errors.remove');
  }

  const ICONS = { file: '📄', image: '🖼️', link: '🔗' };
  let icon = $derived(ICONS[doc.kind] ?? ICONS.file);
  let sizeLabel = $derived(formatSize(doc.size));
  let dateLabel = $derived(doc.createdAt ? doc.createdAt.slice(0, 10) : '');
  let openLabel = $derived(
    doc.kind === 'link' ? $t('rikmaDocs.row.openLink') : $t('rikmaDocs.row.open')
  );
</script>

<li class="row kind-{doc.kind}" class:editing>
  {#if editing}
    <div class="edit">
      <label class="field">
        <span>{$t('rikmaDocs.add.name')}</span>
        <input type="text" bind:value={name} />
      </label>
      <label class="field">
        <span>{$t('rikmaDocs.add.folder')}</span>
        <input type="text" bind:value={folder} list="rikma-docs-folders" />
      </label>
      <label class="field">
        <span>{$t('rikmaDocs.add.note')}</span>
        <textarea bind:value={note} rows="2"></textarea>
      </label>
      {#if errorMsg}
        <p class="error" role="alert">{errorMsg}</p>
      {/if}
      <div class="edit-actions">
        <button class="primary" type="button" onclick={save} disabled={busy}>
          {$t('rikmaDocs.row.saveEdit')}
        </button>
        <button class="quiet" type="button" onclick={() => (editing = false)} disabled={busy}>
          {$t('rikmaDocs.row.cancel')}
        </button>
      </div>
    </div>
  {:else}
    <span class="tile" aria-hidden="true">{icon}</span>

    <div class="main">
      <a class="name" href={doc.href} target="_blank" rel="external noopener noreferrer" onclick={openViaPilot}>
        {doc.name}
      </a>
      {#if doc.note}
        <p class="note">{doc.note}</p>
      {/if}
      <p class="meta">
        <span class="kind-label">{$t(`rikmaDocs.kinds.${doc.kind}`)}</span>
        {#if sizeLabel}<span>{sizeLabel}</span>{/if}
        {#if doc.uploadedBy?.username}<span>{doc.uploadedBy.username}</span>{/if}
        {#if dateLabel}<span>{dateLabel}</span>{/if}
        {#if doc.privateFile}<span class="private">🔒 {$t('rikmaDocs.row.private')}</span>{/if}
        {#if source}<span class="source source-{source}">{$t(`rikmaDocs.p2p.source.${source}`)}</span>{/if}
      </p>
      {#if errorMsg}
        <p class="error" role="alert">{errorMsg}</p>
      {/if}
    </div>

    <div class="actions">
      <a
        class="open"
        class:busy={fetching}
        href={doc.href}
        target="_blank"
        rel="external noopener noreferrer"
        aria-busy={fetching}
        onclick={openViaPilot}
      >
        {fetching ? $t('rikmaDocs.p2p.fetching') : openLabel}
      </a>
      <div class="secondary">
        <button class="quiet" type="button" onclick={startEdit} disabled={busy}>
          {$t('rikmaDocs.row.edit')}
        </button>
        <button class="quiet danger" type="button" onclick={archive} disabled={busy}>
          {$t('rikmaDocs.row.remove')}
        </button>
      </div>
    </div>
  {/if}
</li>

<style>
  .row {
    --tint: 59 130 246; /* file — blue */
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
    padding: 0.75rem 0.9rem;
    border-radius: 0.75rem;
    background: var(--surface);
    border: 1px solid var(--surface-line);
    color: var(--surface-ink);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .row.kind-image {
    --tint: 168 85 247; /* purple */
  }
  .row.kind-link {
    --tint: 16 185 129; /* green */
  }
  .row:hover,
  .row:focus-within {
    border-color: rgb(var(--tint) / 0.55);
    box-shadow: 0 2px 10px rgb(0 0 0 / 0.08);
  }
  .row.editing {
    background: var(--surface-2);
  }
  .tile {
    display: grid;
    place-items: center;
    flex: none;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 0.65rem;
    background: rgb(var(--tint) / 0.14);
    box-shadow: inset 0 0 0 1px rgb(var(--tint) / 0.3);
    font-size: 1.25rem;
  }
  .main {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1 1 14rem;
    min-width: 0;
  }
  .name {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--surface-ink);
    text-decoration: none;
    overflow-wrap: anywhere;
  }
  .name:hover,
  .name:focus-visible {
    text-decoration: underline;
    text-decoration-color: rgb(var(--tint));
  }
  .note {
    font-size: 0.87rem;
    color: var(--surface-ink);
    opacity: 0.85;
    overflow-wrap: anywhere;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0;
    font-size: 0.75rem;
    color: var(--surface-muted);
  }
  /* Dot separators between meta items, whichever of them are present. */
  .meta > span + span::before {
    content: '·';
    margin-inline: 0.4rem;
  }
  /* The tint is a marker, not ink: blue-500 as 12px text is ~3.7:1 on the
     light surface. The label stays in ink; the colour rides on a dot. */
  .kind-label {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 700;
    color: var(--surface-ink);
  }
  .kind-label::after {
    content: '';
    order: -1;
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 9999px;
    background: rgb(var(--tint));
  }
  .private {
    font-weight: 600;
  }
  .source {
    font-weight: 700;
    color: var(--surface-ink);
  }
  .source-peer::before {
    content: '⇄ ';
  }
  .open.busy {
    opacity: 0.7;
    cursor: progress;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-inline-start: auto;
  }
  .open {
    padding: 0.35rem 0.9rem;
    border-radius: 9999px;
    background: rgb(var(--tint) / 0.12);
    box-shadow: inset 0 0 0 1px rgb(var(--tint) / 0.45);
    color: var(--surface-ink);
    font-size: 0.82rem;
    font-weight: 700;
    text-decoration: none;
    white-space: nowrap;
  }
  .open:hover,
  .open:focus-visible {
    background: rgb(var(--tint) / 0.22);
  }
  .secondary {
    display: flex;
    gap: 0.15rem;
    opacity: 0.55;
    transition: opacity 0.15s;
  }
  .row:hover .secondary,
  .row:focus-within .secondary {
    opacity: 1;
  }
  /* Touch screens have no hover — keep the secondary actions fully visible. */
  @media (hover: none) {
    .secondary {
      opacity: 1;
    }
  }
  .quiet {
    padding: 0.3rem 0.6rem;
    border-radius: 0.45rem;
    color: var(--surface-muted);
    font-size: 0.8rem;
    font-weight: 600;
  }
  .quiet:hover:not(:disabled),
  .quiet:focus-visible {
    background: var(--surface-2);
    color: var(--surface-ink);
  }
  .quiet.danger:hover:not(:disabled),
  .quiet.danger:focus-visible {
    color: rgb(220 38 38);
  }
  .quiet:disabled {
    opacity: 0.5;
  }
  .name:focus-visible,
  .open:focus-visible,
  .quiet:focus-visible,
  .primary:focus-visible {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .primary {
    padding: 0.4rem 1.1rem;
    border-radius: 9999px;
    background: var(--gold);
    color: #1a1408;
    font-weight: 800;
    font-size: 0.85rem;
  }
  .primary:disabled {
    opacity: 0.5;
  }
  .edit {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: 100%;
  }
  .edit-actions {
    display: flex;
    gap: 0.5rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--surface-ink);
  }
  .field input,
  .field textarea {
    padding: 0.5rem 0.7rem;
    border-radius: 0.5rem;
    border: 1px solid var(--surface-line);
    background: var(--surface);
    color: var(--surface-ink);
    font: inherit;
    font-weight: 400;
  }
  .field input:focus,
  .field textarea:focus {
    outline: 2px solid var(--gold);
    outline-offset: 0;
    border-color: transparent;
  }
  .error {
    font-size: 0.82rem;
    color: rgb(220 38 38);
    font-weight: 600;
  }
  @media (max-width: 520px) {
    .actions {
      width: 100%;
      justify-content: space-between;
      padding-inline-start: 3.45rem;
    }
  }
</style>
