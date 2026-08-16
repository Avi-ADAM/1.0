<script>
  import { ShareButtons } from '@1lev1/svelte-share';
  import website from '$lib/config/website';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';

  /**
   * The one share button for every public page (rikma, member, open mission,
   * open resource, product, wish, maagad, the directories and the map).
   *
   * Wraps `@1lev1/svelte-share` so that every call site shares the *canonical*
   * link — `https://1lev1.com/<path>` — and not `page.url`, which would leak
   * `localhost`, a preview host or the Tauri origin into somebody's WhatsApp.
   * The reader's language rides along as `?lang=xx` (he is the bare canonical,
   * see the SEO head order in `app.html`).
   *
   * @typedef {Object} Props
   * @property {string} path - app-relative path, with or without the leading slash ('/project/12').
   * @property {string} [title] - what the link is about; falls back to a generic invite.
   * @property {string} [desc] - one line describing the shared thing.
   * @property {string[]} [hashtags] - without '#'.
   * @property {string} [quote]
   * @property {string[]} [related]
   * @property {string} [via]
   * @property {number} [size] - icon size in px.
   * @property {string} [align] - which side the dropdown hangs from: 'end' (default) or 'start'.
   */

  /** @type {Props} */
  let {
    path = '',
    title = '',
    desc = '',
    hashtags = ['1lev1'],
    quote = undefined,
    related = [],
    via = '',
    size = 28,
    align = 'end'
  } = $props();

  const siteUrl = website.siteUrl.replace(/\/+$/, '');

  // ShareButtons joins `${siteUrl}/${slug}`, so the slug carries both the path
  // and the language marker.
  const slug = $derived.by(() => {
    const clean = String(path ?? '').replace(/^\/+/, '');
    if (!$lang || $lang === 'he') return clean;
    return `${clean}${clean.includes('?') ? '&' : '?'}lang=${$lang}`;
  });

  const shareTitle = $derived(title || $t('ui.share.defaultTitle'));
  const shareDesc = $derived(desc || $t('ui.share.defaultDesc'));
</script>

<!-- The library reads the url once, at init; re-key it so a language switch or
     a navigation between two rikmas (same component instance, reused by
     SvelteKit) does not keep sharing the previous link. -->
{#key slug}
  <div class="share-link" class:start={align === 'start'} title={$t('ui.share.label')}>
    <ShareButtons
      {slug}
      {siteUrl}
      siteTitle={website.siteTitle}
      title={shareTitle}
      desc={shareDesc}
      {hashtags}
      {quote}
      {related}
      {via}
      {size}
      lang={$lang === 'he' ? 'he' : 'en'}
    />
  </div>
{/key}

<style>
  /* Own a stacking context high enough to clear the glassy cards below the
     button: `backdrop-filter` makes each of them a stacking context of its
     own, so an open dropdown would otherwise be painted *behind* them — and
     blurred by them. */
  .share-link {
    position: relative;
    z-index: 60;
  }

  /* The library's trigger icon rests on `color: grey` and only turns pink on
     hover; grey all but disappears on the dark public pages, so it rests on
     the brand pink here — overridable per call site. */
  .share-link :global(aside.container svg.text) {
    color: var(--share-icon-color, #ff0092);
  }

  /* The library's own container adds a top margin and pushes itself right;
     neutralise both so a call site can place it wherever it likes. */
  .share-link :global(aside.container) {
    margin-top: 0;
  }
  .share-link :global(aside.container > div) {
    margin-left: 0;
  }
  /* A row, not the library's column: seven icons stacked vertically run off
     the bottom of the viewport (and under the mobile nav bar) wherever the
     button sits low on the page. Sideways they always fit. */
  .share-link :global(.share-dropdown) {
    z-index: 60;
    flex-direction: row;
    align-items: center;
    background: #fff;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
  }
  /* The library anchors the dropdown at `right: 0`, which is only correct for
     an LTR page: on the RTL pages a button sitting at the edge of its row
     opens the menu off-screen. Anchor logically instead — `end` grows toward
     the inline start (the default, for a button at the row's end), `start`
     grows toward the inline end. */
  .share-link :global(.share-dropdown) {
    right: auto;
    left: auto;
    inset-inline-end: 0;
  }
  .share-link.start :global(.share-dropdown) {
    inset-inline-end: auto;
    inset-inline-start: 0;
  }
</style>
