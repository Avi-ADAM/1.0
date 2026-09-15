<script>
  /**
   * The rikma's code repository, as a pill directly under its seal — on the
   * public page and in the moach header. A rikma that builds software is its
   * code, so this is not one more dot in the social row.
   *
   * `githublink` is typed freely in the edit form, so only an http(s) URL is
   * rendered (never a `javascript:` href), and the visible text is the short
   * `owner/repo` when the host is a known forge.
   *
   * @typedef {Object} Props
   * @property {string | null | undefined} href
   */
  import { t } from '$lib/translations';
  import GithubIcon from '$lib/celim/icons/github.svelte';

  /** @type {Props} */
  let { href } = $props();

  let url = $derived.by(() => {
    try {
      const u = new URL(String(href ?? '').trim());
      return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
    } catch {
      return null;
    }
  });

  let isGithub = $derived(url?.hostname.replace(/^www\./, '') === 'github.com');

  // github.com/owner/repo/tree/main → owner/repo; a bare org → owner.
  let slug = $derived.by(() => {
    if (!url) return '';
    const parts = url.pathname.split('/').filter(Boolean).slice(0, 2);
    if (parts[1]) parts[1] = parts[1].replace(/\.git$/, '');
    return parts.length ? parts.join('/') : url.hostname;
  });
</script>

{#if url}
  <a
    class="repo-pill"
    href={url.href}
    target="_blank"
    rel="noopener noreferrer"
    title={$t('ui.repo.title')}
  >
    <span class="repo-icon">
      {#if isGithub}
        <GithubIcon width={20} />
      {:else}
        <svg viewBox="0 0 24 24" width="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      {/if}
    </span>
    <span class="repo-label">{$t('ui.repo.label')}</span>
    <bdi dir="ltr" class="repo-slug">{slug}</bdi>
  </a>
{/if}

<style>
  /* Self-contained colours: the pill carries its own dark ground, so the gold
     label keeps its contrast whichever page or theme it sits on. */
  .repo-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 100%;
    padding: 0.4rem 0.9rem 0.4rem 0.5rem;
    border-radius: 9999px;
    background: rgba(13, 17, 23, 0.85);
    border: 1px solid rgba(240, 192, 64, 0.55);
    color: #f0c040;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1.2;
    text-decoration: none;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .repo-pill:hover,
  .repo-pill:focus-visible {
    border-color: #f0c040;
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(240, 192, 64, 0.25);
  }
  .repo-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.9rem;
    height: 1.9rem;
    flex: none;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.08);
    color: #e6e6e6;
  }
  .repo-slug {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: 500;
    color: #d6dde6;
  }
</style>
