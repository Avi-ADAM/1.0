<script lang="ts">
  import { deserialize } from '$app/forms';
  import { t } from '$lib/translations';
  import Spinner from '$lib/celim/Spinner.svelte';
  import { IMAGE_MIME, UPLOAD_MAX_EDGE } from '$lib/media/imagePolicy';

  let { data } = $props();

  type Item = { key: string; name: string; preview: string; status: 'queued' | 'sending' | 'done' | 'error'; error?: string };

  let items = $state<Item[]>([]);
  let dragging = $state(false);
  let input = $state<HTMLInputElement | null>(null);

  const stored = $derived(data.files.length + items.filter((i) => i.status === 'done').length);
  const remaining = $derived(Math.max(0, data.maxFiles - stored - items.filter((i) => i.status === 'queued' || i.status === 'sending').length));
  const busy = $derived(items.some((i) => i.status === 'sending' || i.status === 'queued'));

  /** A phone photo is often 4–8 MB; scale it to the long edge the shop needs before it is sent. */
  async function shrink(file: File): Promise<Blob> {
    // Small enough and a format the server takes: send it as it is.
    if (file.size < 1_500_000 && (IMAGE_MIME as readonly string[]).includes(file.type)) return file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, UPLOAD_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.88));
      return blob && blob.size < file.size ? blob : file;
    } catch {
      return file;
    }
  }

  const reasonText = (code: string | undefined) =>
    $t(`upload.error.${['type', 'size', 'empty', 'mismatch', 'limit', 'expired', 'notMember', 'invalid'].includes(code ?? '') ? code : 'store'}`);

  async function send(item: Item, file: File) {
    item.status = 'sending';
    try {
      const blob = await shrink(file);
      const name = blob === file ? file.name : file.name.replace(/\.[a-z0-9]+$/i, '') + (blob.type === 'image/png' ? '.png' : '.jpg');
      const body = new FormData();
      body.append('file', new File([blob], name, { type: blob.type || file.type }));
      const res = await fetch('?/upload', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
      const result = deserialize(await res.text());
      if (result.type === 'success') item.status = 'done';
      else {
        item.status = 'error';
        item.error = reasonText(result.type === 'failure' ? (result.data?.code as string) : undefined);
      }
    } catch {
      item.status = 'error';
      item.error = reasonText('store');
    }
  }

  async function add(list: FileList | null) {
    if (!list?.length) return;
    const queue: Array<[Item, File]> = [];
    for (const file of Array.from(list)) {
      const item: Item = { key: `${file.name}-${file.size}-${Math.random()}`, name: file.name, preview: URL.createObjectURL(file), status: 'queued' };
      if (!(IMAGE_MIME as readonly string[]).includes(file.type) && !/heic|heif/i.test(file.type)) {
        item.status = 'error';
        item.error = reasonText('type');
      } else if (remaining - queue.length <= 0) {
        item.status = 'error';
        item.error = reasonText('limit');
      }
      items.push(item);
      if (item.status === 'queued') queue.push([items[items.length - 1], file]);
    }
    // One at a time: the server counts the session's files before each one.
    for (const [item, file] of queue) await send(item, file);
    if (input) input.value = '';
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    add(e.dataTransfer?.files ?? null);
  }
</script>

<svelte:head>
  <title>{$t('upload.title')}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main class="up-page bg-surface text-surfaceInk">
  <h1 class="up-title">{$t('upload.title')}</h1>

  {#if data.state !== 'open'}
    <p class="up-note" role="alert">{$t(data.state === 'expired' ? 'upload.expired' : 'upload.invalid')}</p>
  {:else}
    <p class="up-note">{$t('upload.intro', { count: data.maxFiles })}</p>

    <label
      class="up-drop border-surfaceLine"
      class:up-drop-on={dragging}
      ondragover={(e) => {
        e.preventDefault();
        dragging = true;
      }}
      ondragleave={() => (dragging = false)}
      ondrop={onDrop}
    >
      <input
        bind:this={input}
        type="file"
        accept={IMAGE_MIME.join(',')}
        multiple
        class="up-input"
        disabled={remaining === 0}
        onchange={(e) => add(e.currentTarget.files)}
      />
      <span class="up-drop-main">{$t(remaining === 0 ? 'upload.full' : 'upload.pick')}</span>
      <span class="up-drop-sub text-surfaceMuted">{$t('upload.formats')}</span>
    </label>

    <p class="up-count text-surfaceMuted" aria-live="polite">{$t('upload.count', { count: stored, max: data.maxFiles })}</p>

    <ul class="up-grid">
      {#each data.files as f (f.uploadId)}
        <li class="up-cell"><img src={f.url} alt={f.fileName} loading="lazy" /><span class="up-badge">✓</span></li>
      {/each}
      {#each items as item (item.key)}
        <li class="up-cell" class:up-cell-error={item.status === 'error'}>
          <img src={item.preview} alt={item.name} />
          {#if item.status === 'sending' || item.status === 'queued'}
            <span class="up-badge"><Spinner size="xs" /></span>
          {:else if item.status === 'done'}
            <span class="up-badge">✓</span>
          {:else}
            <span class="up-err">{item.error}</span>
          {/if}
        </li>
      {/each}
    </ul>

    {#if stored > 0 && !busy}
      <p class="up-done" role="status">{$t('upload.done')}</p>
    {/if}
    <p class="up-foot text-surfaceMuted">{$t('upload.until', { time: new Date(data.expiresAt ?? '').toLocaleTimeString() })}</p>
  {/if}
</main>

<style>
  .up-page {
    min-height: 100dvh;
    max-width: 40rem;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
  }
  .up-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  .up-note {
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  .up-drop {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 2rem 1rem;
    border: 2px dashed;
    border-radius: 1rem;
    cursor: pointer;
    text-align: center;
  }
  .up-drop-on {
    border-style: solid;
    background: color-mix(in srgb, currentColor 6%, transparent);
  }
  .up-input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
  }
  .up-drop-main {
    font-weight: 600;
    font-size: 1.1rem;
  }
  .up-count {
    margin: 0.75rem 0;
    font-size: 0.9rem;
  }
  .up-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr));
    gap: 0.5rem;
  }
  .up-cell {
    position: relative;
    aspect-ratio: 1;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .up-cell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .up-cell-error img {
    opacity: 0.35;
  }
  .up-badge {
    position: absolute;
    inset-inline-end: 0.3rem;
    top: 0.3rem;
    background: rgb(0 0 0 / 0.6);
    color: #fff;
    border-radius: 999px;
    min-width: 1.5rem;
    height: 1.5rem;
    display: grid;
    place-items: center;
    font-size: 0.8rem;
  }
  .up-err {
    position: absolute;
    inset: auto 0 0 0;
    background: rgb(160 20 20 / 0.85);
    color: #fff;
    font-size: 0.75rem;
    padding: 0.25rem;
  }
  .up-done {
    margin-top: 1rem;
    font-weight: 600;
  }
  .up-foot {
    margin-top: 1.5rem;
    font-size: 0.8rem;
  }
</style>
