<script lang="ts">
  /**
   * The product's pictures: add, reorder, choose the cover. A picture is uploaded
   * the moment it is chosen, so the same field works before the product exists.
   */
  import { toast } from 'svelte-sonner';
  import { t } from '$lib/translations';
  import { GALLERY_LIMIT, movePicture } from '$lib/shop/variantEditor';
  import type { EditorPicture } from '$lib/shop/productEditor';

  let {
    gallery = $bindable([]),
    uploading = $bindable(false),
    onRemoved
  }: {
    gallery?: EditorPicture[];
    uploading?: boolean;
    onRemoved?: (id: string) => void;
  } = $props();

  let fileInput: HTMLInputElement | undefined = $state();

  async function addPictures(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const files = [...(input.files ?? [])];
    input.value = '';
    if (!files.length) return;
    uploading = true;
    for (const file of files) {
      if (gallery.length >= GALLERY_LIMIT) {
        toast.error($t('shopEditor.gallery.full'));
        break;
      }
      // Raster only — an SVG can carry script, and the server refuses it anyway.
      if (!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)) {
        toast.error($t('shopEditor.gallery.badType'));
        continue;
      }
      try {
        const fd = new FormData();
        fd.append('files', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) throw new Error(String(res.status));
        const f = (await res.json())?.[0];
        if (!f?.id || !f?.url) throw new Error('no file');
        const thumb = f.formats?.small?.url ?? f.formats?.thumbnail?.url ?? f.url;
        gallery.push({ id: String(f.id), url: f.url, thumb, width: f.width ?? null, height: f.height ?? null, alt: null });
      } catch {
        toast.error($t('shopEditor.gallery.failed'));
      }
    }
    uploading = false;
  }

  function removePicture(i: number) {
    const [gone] = gallery.splice(i, 1);
    if (gone) onRemoved?.(gone.id);
  }
</script>

<p class="gf-muted">{$t('shopEditor.gallery.hint')}</p>
{#if !gallery.length}
  <p class="gf-muted">{$t('shopEditor.gallery.empty')}</p>
{/if}
<ul class="gf-grid">
  {#each gallery as pic, i (pic.id)}
    <li class="gf-pic" class:gf-cover={i === 0}>
      <img src={pic.thumb} alt={pic.alt ?? ''} loading="lazy" />
      {#if i === 0}<span class="gf-cover-tag">{$t('shopEditor.gallery.cover')}</span>{/if}
      <div class="gf-tools">
        {#if i > 0}
          <button type="button" class="gf-tool" onclick={() => (gallery = movePicture(gallery, i, 0))} aria-label={$t('shopEditor.gallery.makeCover')} title={$t('shopEditor.gallery.makeCover')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6z" /></svg>
          </button>
          <button type="button" class="gf-tool" onclick={() => (gallery = movePicture(gallery, i, i - 1))} aria-label={$t('shopEditor.gallery.earlier')} title={$t('shopEditor.gallery.earlier')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="sh-flip"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        {/if}
        {#if i < gallery.length - 1}
          <button type="button" class="gf-tool" onclick={() => (gallery = movePicture(gallery, i, i + 1))} aria-label={$t('shopEditor.gallery.later')} title={$t('shopEditor.gallery.later')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="sh-flip"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        {/if}
        <button type="button" class="gf-tool" onclick={() => removePicture(i)} aria-label={$t('shopEditor.gallery.remove')} title={$t('shopEditor.gallery.remove')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    </li>
  {/each}
  {#if gallery.length < GALLERY_LIMIT}
    <li>
      <button type="button" class="gf-add" onclick={() => fileInput?.click()} disabled={uploading}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        {uploading ? $t('shopEditor.gallery.uploading') : $t('shopEditor.gallery.add')}
      </button>
    </li>
  {/if}
</ul>
<input bind:this={fileInput} class="gf-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple onchange={addPictures} tabindex="-1" aria-hidden="true" />

<style>
  .gf-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  .gf-muted {
    margin: 0 0 10px;
    font-size: 13px;
    color: var(--sh-muted);
  }
  .gf-grid {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
    gap: 10px;
  }
  .gf-pic {
    position: relative;
    aspect-ratio: 1;
    border-radius: var(--sh-radius-sm);
    overflow: hidden;
    border: 1px solid var(--sh-line);
    background: var(--sh-card-2);
  }
  .gf-cover {
    grid-column: span 2;
    grid-row: span 2;
    border: 2px solid var(--sh-gold);
  }
  .gf-pic img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .gf-cover-tag {
    position: absolute;
    top: 6px;
    inset-inline-start: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--sh-gold);
    color: var(--sh-on-accent);
    font-size: 11px;
    font-weight: 700;
  }
  .gf-tools {
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    display: flex;
    justify-content: center;
    gap: 4px;
    padding: 4px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  }
  .gf-tool {
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    color: #1d1a16;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .gf-add {
    width: 100%;
    aspect-ratio: 1;
    border: 1px dashed var(--sh-gold-line);
    border-radius: var(--sh-radius-sm);
    background: transparent;
    color: var(--sh-gold);
    font-size: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
  }
</style>
