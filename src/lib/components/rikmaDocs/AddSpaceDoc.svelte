<script>
  /**
   * Add one entry to the rikma's shared library
   * (docs/PLAN_RIKMA_SHARED_INFO.md §5, §6).
   *
   * Two upload paths, chosen by the server (`upload.mode`), and the form is
   * the same for both:
   *
   * - `direct` (stage 2): ask `/api/v1/space-docs/upload-url` for a ticket,
   *   PUT the bytes straight to the private bucket, then hand the key to
   *   `createSpaceDoc`, which checks the key belongs to this rikma and that the
   *   object really arrived. The bytes never touch our server — hence the
   *   larger cap and the progress bar.
   * - `proxy` (stage 1, wherever the bucket is not configured): the existing
   *   `/api/upload` → Strapi, then `createSpaceDoc` with the media id.
   *
   * Either way a failed upload never leaves a record pointing at nothing.
   *
   * There is no "password" kind, and there will not be one in this form: a
   * secret belongs in the sealed-event vault (§3.2), never in a Strapi column.
   */
  import { t } from '$lib/translations';
  import { executeAction } from '$lib/client/actionClient';
  import { isSafeHref, formatSize } from '$lib/spaceDocs/spaceDocs.js';
  import { checkUpload } from '$lib/uploads/policy.js';
  import { sha256Hex } from '$lib/p2p/hash.js';

  let {
    projectId,
    upload = { mode: 'proxy', maxBytes: 15 * 1024 * 1024 },
    onAdded,
    /** Called with the verified hash and the bytes — the P2P pilot seeds them. */
    onUploaded
  } = $props();

  const KINDS = [
    { id: 'file', icon: '📄' },
    { id: 'image', icon: '🖼️' },
    { id: 'link', icon: '🔗' }
  ];

  let kind = $state('file');
  let name = $state('');
  let note = $state('');
  let folder = $state('');
  let url = $state('');
  let files = $state(null);
  let busy = $state(false);
  let progress = $state(0);
  let errorMsg = $state('');

  let picked = $derived(files?.[0] ?? null);
  let accept = $derived(kind === 'image' ? 'image/*' : undefined);
  let maxLabel = $derived(formatSize(upload.maxBytes));

  // Refuse a wrong file before spending the upload on it — the server checks
  // the same list again, this is only so the member hears it immediately.
  let pickedProblem = $derived(picked ? checkUpload(picked, upload.maxBytes) : null);

  // The name is optional and defaults to the file's own — typing it twice is
  // the sort of chore that stops people filing things.
  let effectiveName = $derived(name.trim() || picked?.name?.trim() || '');

  let ready = $derived(
    !busy &&
      effectiveName !== '' &&
      (kind === 'link' ? isSafeHref(url.trim()) : Boolean(picked) && !pickedProblem)
  );

  function reset() {
    name = '';
    note = '';
    url = '';
    files = null;
    progress = 0;
  }

  async function errorFrom(res, fallbackKey) {
    const detail = await res.json().catch(() => null);
    return new Error(detail?.message || $t(fallbackKey));
  }

  /** Stage 1: through our proxy to Strapi. Returns `{ fileId }`. */
  async function uploadViaProxy(file) {
    const body = new FormData();
    body.append('files', file);
    const res = await fetch('/api/upload', { method: 'POST', body });
    if (!res.ok) throw await errorFrom(res, 'rikmaDocs.errors.upload');
    const uploaded = await res.json();
    const id = Array.isArray(uploaded) ? uploaded[0]?.id : uploaded?.id;
    if (!id) throw new Error($t('rikmaDocs.errors.upload'));
    return { fileId: String(id) };
  }

  /** PUT with progress — fetch has no upload progress, XHR does. */
  function putWithProgress(target, file, headers) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', target);
      for (const [k, v] of Object.entries(headers ?? {})) xhr.setRequestHeader(k, v);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) progress = Math.round((e.loaded / e.total) * 100);
      };
      xhr.onload = () =>
        xhr.status >= 200 && xhr.status < 300
          ? resolve(undefined)
          : reject(new Error($t('rikmaDocs.errors.upload')));
      xhr.onerror = () => reject(new Error($t('rikmaDocs.errors.upload')));
      xhr.send(file);
    });
  }

  /** Stage 2: ticket, then straight to the private bucket. Returns the key fields. */
  async function uploadDirect(file) {
    const res = await fetch('/api/v1/space-docs/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: String(projectId), fileName: file.name, mime: file.type, size: file.size })
    });
    if (!res.ok) throw await errorFrom(res, 'rikmaDocs.errors.upload');
    const ticket = await res.json();
    await putWithProgress(ticket.url, file, ticket.headers);
    return { storageKey: ticket.key, fileName: file.name, mime: file.type };
  }

  async function submit(event) {
    event.preventDefault();
    if (!ready) return;
    busy = true;
    progress = 0;
    errorMsg = '';

    try {
      // The file's content address, recorded on the row: every later copy of
      // it — from a partner's browser, from this device's cache — is checked
      // against it (docs/PLAN_P2P_PILOT.md). Computed before the upload so a
      // hashing failure costs nothing.
      const sha256 = kind === 'link' ? null : await sha256Hex(picked);
      const stored =
        kind === 'link'
          ? { url: url.trim() }
          : upload.mode === 'direct'
            ? await uploadDirect(picked)
            : await uploadViaProxy(picked);

      const res = await executeAction('createSpaceDoc', {
        projectId: String(projectId),
        name: effectiveName,
        kind,
        note: note.trim(),
        folder: folder.trim(),
        ...(sha256 ? { sha256 } : {}),
        ...stored
      });
      if (!res.success) throw new Error(res.error?.message || $t('rikmaDocs.errors.save'));
      if (sha256) await onUploaded?.(sha256, picked);

      reset();
      await onAdded?.();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : $t('rikmaDocs.errors.save');
    } finally {
      busy = false;
    }
  }
</script>

<form class="add" onsubmit={submit}>
  <fieldset class="kinds">
    <legend class="step">{$t('rikmaDocs.add.kindLegend')}</legend>
    <div class="kind-row">
      {#each KINDS as option (option.id)}
        <label class="kind" class:on={kind === option.id}>
          <input type="radio" name="kind" value={option.id} bind:group={kind} />
          <span class="kind-icon" aria-hidden="true">{option.icon}</span>
          <span>{$t(`rikmaDocs.kinds.${option.id}`)}</span>
        </label>
      {/each}
    </div>
  </fieldset>

  {#if kind === 'link'}
    <label class="field">
      <span class="label">{$t('rikmaDocs.add.url')} <em>*</em></span>
      <input type="url" bind:value={url} placeholder="https://…" inputmode="url" dir="ltr" required />
      <small class="hint">{$t('rikmaDocs.add.urlHint')}</small>
    </label>
  {:else}
    <label class="field">
      <span class="label">{$t('rikmaDocs.add.file')} <em>*</em></span>
      <span class="drop" class:has={picked}>
        <input type="file" bind:files {accept} required />
        <span class="drop-text">
          {#if picked}
            <strong>{picked.name}</strong> · {formatSize(picked.size)}
          {:else}
            {$t('rikmaDocs.add.choose')}
          {/if}
        </span>
      </span>
      <small class="hint">
        {$t('rikmaDocs.add.fileHintMax', { max: maxLabel })}
        {#if upload.mode === 'direct'}· 🔒 {$t('rikmaDocs.add.privateHint')}{/if}
      </small>
      {#if pickedProblem}
        <small class="error">{pickedProblem.message}</small>
      {/if}
    </label>
  {/if}

  <div class="grid">
    <label class="field">
      <span class="label">{$t('rikmaDocs.add.name')}</span>
      <input type="text" bind:value={name} placeholder={picked?.name ?? ''} />
    </label>
    <label class="field">
      <span class="label">{$t('rikmaDocs.add.folder')}</span>
      <input
        type="text"
        bind:value={folder}
        list="rikma-docs-folders"
        placeholder={$t('rikmaDocs.add.folderPlaceholder')}
      />
    </label>
  </div>

  <label class="field">
    <span class="label">{$t('rikmaDocs.add.note')}</span>
    <textarea bind:value={note} rows="2"></textarea>
  </label>

  {#if busy && kind !== 'link' && upload.mode === 'direct'}
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
      <span style:width="{progress}%"></span>
    </div>
  {/if}

  {#if errorMsg}
    <p class="error" role="alert">{errorMsg}</p>
  {/if}

  <div class="submit-row">
    <button class="save" type="submit" disabled={!ready}>
      {busy ? $t('rikmaDocs.add.saving') : $t('rikmaDocs.add.save')}
    </button>
  </div>
</form>

<style>
  .add {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding: 1.1rem;
    border-radius: 0.85rem;
    background: var(--surface-2);
    border: 1px solid var(--surface-line);
    border-top: 3px solid var(--gold);
    color: var(--surface-ink);
  }
  .kinds {
    border: 0;
    padding: 0;
    margin: 0;
  }
  .step {
    margin-bottom: 0.4rem;
    font-size: 0.85rem;
    font-weight: 700;
  }
  .kind-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }
  .kind {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.6rem 0.4rem;
    border-radius: 0.65rem;
    background: var(--surface);
    border: 1.5px solid var(--surface-line);
    color: var(--surface-muted);
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    text-align: center;
  }
  .kind.on {
    border-color: var(--gold);
    color: var(--surface-ink);
    box-shadow: 0 0 0 3px rgb(212 175 55 / 0.2);
  }
  .kind:focus-within {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .kind-icon {
    font-size: 1.3rem;
  }
  .kind input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 0.9rem;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .label {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--surface-ink);
  }
  .label em {
    color: var(--gold);
    font-style: normal;
  }
  .field input[type='text'],
  .field input[type='url'],
  .field textarea {
    padding: 0.55rem 0.75rem;
    border-radius: 0.55rem;
    border: 1px solid var(--surface-line);
    background: var(--surface);
    color: var(--surface-ink);
    font: inherit;
  }
  .field input::placeholder,
  .field textarea::placeholder {
    color: var(--surface-muted);
    opacity: 0.8;
  }
  .field input:focus,
  .field textarea:focus {
    outline: 2px solid var(--gold);
    outline-offset: 0;
    border-color: transparent;
  }
  /* The whole dashed box is the file input's hit area. */
  .drop {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 4.2rem;
    padding: 0.75rem;
    border-radius: 0.65rem;
    border: 1.5px dashed var(--surface-line);
    background: var(--surface);
    color: var(--surface-muted);
    font-size: 0.88rem;
    text-align: center;
    cursor: pointer;
  }
  .drop.has {
    border-style: solid;
    border-color: var(--gold);
    color: var(--surface-ink);
  }
  .drop:focus-within {
    outline: 2px solid var(--gold);
    outline-offset: 2px;
  }
  .drop input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
  .drop-text strong {
    overflow-wrap: anywhere;
  }
  .hint {
    font-size: 0.76rem;
    color: var(--surface-muted);
  }
  .progress {
    height: 0.4rem;
    border-radius: 9999px;
    background: var(--surface-line);
    overflow: hidden;
  }
  .progress span {
    display: block;
    height: 100%;
    background: var(--gold);
    transition: width 0.2s;
  }
  .error {
    font-size: 0.84rem;
    font-weight: 600;
    color: rgb(220 38 38);
  }
  .submit-row {
    display: flex;
    justify-content: flex-end;
  }
  .save {
    padding: 0.55rem 1.6rem;
    border-radius: 9999px;
    background: var(--gold);
    color: #1a1408;
    font-weight: 800;
  }
  .save:focus-visible {
    outline: 2px solid var(--surface-ink);
    outline-offset: 2px;
  }
  .save:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
