<script>
  /**
   * MeOrb — one large circle on the profile page, holding one whole list.
   *
   * The profile used to be a collage of glass cards pinned at fixed
   * percentages, plus a row of pills (products, missions, concierge) stacked
   * on top of the badge — which on most screens sat over the crown. Now every
   * one of those is a circle of the same kind, orbiting the badge the way the
   * heart's coins orbit the heart (`$lib/me/orbitLayout.ts` places them).
   *
   * LAYOUT CONTRACT — a circle is a hostile text box, so the content stays in
   * three bands that fit inside it: the title near the top, the body across the
   * wide middle (scrolls, fades at its edges), and the actions near the
   * bottom. Type scales with the circle's own width (container query units),
   * floored at 12px, so the same component reads in the orbit and in the
   * phone's scrolling honeycomb.
   *
   * The body is the caller's. It can use the classes this component styles:
   * `orb-chip` (one item; add `muted` for an unavailable one, `link` on an
   * anchor), `orb-stat` + `orb-stat-label` (a headline number), and in the
   * actions `orb-btn` (round icon button) and `orb-link` (a short text link).
   *
   * @type {{
   *   title: string,
   *   accent: string,
   *   featured?: boolean,
   *   icon?: string,
   *   href?: string,
   *   count?: number | null,
   *   children?: import('svelte').Snippet,
   *   actions?: import('svelte').Snippet
   * }}
   */
  let { title, accent, featured = false, icon = '', href, count = null, children, actions } =
    $props();

  const uid = $props.id();
</script>

<!-- The wrapper is the size container: an element's own cqi resolve against
     its *ancestor*, so the circle cannot measure itself. -->
<div class="orb-wrap">
  <section class="orb" class:featured style:--accent={accent} aria-labelledby="{uid}-t">
    <div class="orb-head">
      {#if href}
        <a {href} id="{uid}-t" class="orb-title" data-sveltekit-preload-data>
          {#if icon}<span aria-hidden="true">{icon}</span>{/if}
          <span>{title}</span>
        </a>
      {:else}
        <h2 id="{uid}-t" class="orb-title">
          {#if icon}<span aria-hidden="true">{icon}</span>{/if}
          <span>{title}</span>
        </h2>
      {/if}
      {#if count != null}
        <span class="orb-count">{count}</span>
      {/if}
    </div>

    <div class="orb-body">
      {@render children?.()}
    </div>

    {#if actions}
      <div class="orb-actions">
        {@render actions()}
      </div>
    {/if}
  </section>
</div>

<style>
  .orb-wrap {
    container-type: inline-size;
    width: 100%;
  }
  .orb {
    /* `--ink` is the accent pulled into a readable band — the only shade of it
       allowed to colour a word. The raw accent is for the ring and the wash. */
    --ink: var(--accent);
    --orb-bg: #fffdf7;
    --orb-text: #2b2620;
    --orb-muted: #6b6156;

    position: relative;
    width: 100%;
    aspect-ratio: 1;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    /* The three bands sit inside the circle's chord at each height; these
       paddings are what keep text off the curve. */
    padding: 12% 12% 9%;
    background:
      radial-gradient(
        circle at 50% 30%,
        color-mix(in srgb, var(--accent) 10%, transparent),
        transparent 70%
      ),
      var(--orb-bg);
    color: var(--orb-text);
    border: max(3px, 1.6cqi) solid color-mix(in srgb, var(--accent) 75%, white);
    box-shadow:
      0 6px 18px rgba(0, 0, 0, 0.12),
      0 0 28px -6px color-mix(in srgb, var(--accent) 65%, transparent);
    font-size: clamp(12px, 6.2cqi, 16px);
    overflow: hidden;
    isolation: isolate;
  }
  @supports (color: oklch(from red l c h)) {
    .orb {
      --ink: oklch(from var(--accent) min(l, 0.45) c h);
    }
  }
  :global(.dark) .orb {
    --orb-bg: #141c2e;
    --orb-text: #f1ede4;
    --orb-muted: #b7ae9f;
    --ink: color-mix(in srgb, var(--accent) 55%, white);
    box-shadow:
      0 6px 18px rgba(0, 0, 0, 0.45),
      0 0 30px -6px color-mix(in srgb, var(--accent) 70%, transparent);
  }

  /* The one circle the page is about: a full-strength ring and a wider halo,
     so it reads first among ten of the same size. */
  .orb.featured {
    border: max(4px, 2.2cqi) solid var(--accent);
    box-shadow:
      0 6px 18px rgba(0, 0, 0, 0.14),
      0 0 0 max(2px, 0.8cqi) color-mix(in srgb, var(--accent) 30%, transparent),
      0 0 40px -4px color-mix(in srgb, var(--accent) 80%, transparent);
  }
  :global(.dark) .orb.featured {
    box-shadow:
      0 6px 18px rgba(0, 0, 0, 0.45),
      0 0 0 max(2px, 0.8cqi) color-mix(in srgb, var(--accent) 35%, transparent),
      0 0 44px -4px color-mix(in srgb, var(--accent) 85%, transparent);
  }

  .orb-head {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35em;
    max-width: 78%;
  }
  .orb-title {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
    margin: 0;
    font-size: 1.08em;
    font-weight: 800;
    line-height: 1.15;
    color: var(--ink);
    text-align: center;
    min-width: 0;
  }
  /* Two lines rather than an ellipsis: "הכיש…" told nobody what the circle
     was. A title longer than that is the caller's bug, not the layout's. */
  .orb-title span:last-child {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
  a.orb-title:hover span:last-child {
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
  .orb-count {
    flex: none;
    min-width: 1.6em;
    padding: 0 0.4em;
    border-radius: 999px;
    background: var(--accent);
    color: #fff;
    font-size: 0.78em;
    font-weight: 800;
    line-height: 1.6em;
    text-align: center;
  }

  /* ── the body: the circle's wide middle ─────────────────────────────────
     Scrolls when the list is long; the mask fades the cut edges so a scrolled
     list reads as "more inside" rather than as text sliced by the rim. */
  .orb-body {
    flex: 1 1 auto;
    min-height: 0;
    width: 100%;
    margin-block: 0.4em;
    padding-block: 0.3em;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-wrap: wrap;
    align-content: safe center;
    justify-content: center;
    gap: 0.3em;
    scrollbar-width: thin;
    scrollbar-color: color-mix(in srgb, var(--accent) 50%, transparent) transparent;
    -webkit-mask: linear-gradient(transparent, #000 0.5em, #000 calc(100% - 0.5em), transparent);
    mask: linear-gradient(transparent, #000 0.5em, #000 calc(100% - 0.5em), transparent);
  }

  .orb-actions {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45em;
  }

  /* ── what the caller puts inside ──────────────────────────────────────── */
  .orb :global(.orb-chip) {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    max-width: 100%;
    padding: 0.18em 0.65em;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent) 45%, transparent);
    background: color-mix(in srgb, var(--accent) 11%, var(--orb-bg));
    color: var(--orb-text);
    font-size: max(11px, 0.84em);
    font-weight: 600;
    line-height: 1.3;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .orb :global(.orb-chip.muted) {
    border-style: dashed;
    background: transparent;
    color: var(--orb-muted);
  }
  /* Something that waits for the member — the same pink the bell uses. */
  .orb :global(.orb-chip.hot) {
    border-color: #c8155f;
    box-shadow: 0 0 8px rgba(200, 21, 95, 0.35);
  }
  .orb :global(a.orb-chip.link) {
    color: var(--ink);
    font-weight: 700;
    transition: background-color 0.15s;
  }
  .orb :global(a.orb-chip.link:hover) {
    background: color-mix(in srgb, var(--accent) 24%, var(--orb-bg));
  }
  .orb :global(.orb-empty) {
    margin: 0;
    color: var(--orb-muted);
    font-size: max(11px, 0.86em);
    text-align: center;
    line-height: 1.35;
  }
  .orb :global(.orb-stat) {
    width: 100%;
    margin: 0;
    color: var(--ink);
    font-size: 2.1em;
    font-weight: 800;
    line-height: 1;
    text-align: center;
  }
  .orb :global(.orb-stat-label) {
    width: 100%;
    margin: 0;
    color: var(--orb-muted);
    font-size: max(11px, 0.84em);
    text-align: center;
  }

  .orb :global(.orb-btn) {
    display: inline-grid;
    place-items: center;
    width: 2.1em;
    height: 2.1em;
    min-width: 32px;
    min-height: 32px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    font-size: 1em;
    font-weight: 800;
    line-height: 1;
    box-shadow: 0 2px 6px color-mix(in srgb, var(--accent) 45%, transparent);
    transition: transform 0.15s;
  }
  .orb :global(.orb-btn:hover) {
    transform: scale(1.1);
  }
  .orb :global(.orb-btn svg) {
    width: 1.15em;
    height: 1.15em;
  }
  .orb :global(.orb-link) {
    color: var(--ink);
    font-size: max(11px, 0.84em);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 0.15em;
    white-space: nowrap;
  }
  .orb :global(:focus-visible) {
    outline: 3px solid var(--ink);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    .orb :global(.orb-btn),
    .orb :global(a.orb-chip.link) {
      transition: none;
    }
  }
</style>
