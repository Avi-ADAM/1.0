<script>
  /**
   * LevCoin — one heart item as a circle you can actually read.
   *
   * The coin view used to mount, per coin, the *whole* card component for that
   * kind in its `{#if cards == false}` branch: a Swiper 8 instance with
   * EffectFlip, a 2.2s fly-in, a `scale-290` hover and its own modal markup, in
   * a file 2400–3300 lines long. On the owner's own heart that was 137 coins,
   * 129 Swipers and 31,540 DOM nodes — about 230 per coin — and ~13s to a
   * usable paint. This is the same spine the list view proved instead: a cheap,
   * uniform element per item driven entirely by `cardKinds` metadata, with
   * exactly one heavy `<LevCard>` mounted on demand when something is opened.
   *
   * Consequences worth stating, because they were the plan's whole point:
   *
   * - **A new heart kind gets a coin for free.** Nothing here branches on
   *   `ani`; it reads `rowContent`/`rowKindKey`/`kindAccent`/`rowTimegrama`.
   *   The eight money and consent kinds added over the last year — sales,
   *   site-share, stipends, wish offers — had *no coin at all*, so a member who
   *   preferred coins never saw a consent item that a member on cards did. That
   *   is fixed by construction rather than by writing eight more branches.
   * - **No SVG `<text>`, so no `letters()`.** This reads `nameRaw` (through
   *   `rowContent`) and lets the browser shape it. `name` would do as well now
   *   that `letters()` has stopped pre-reversing Hebrew, but `nameRaw` is the
   *   field that says out loud "this surface is HTML".
   * - **Every string goes through `$t()`.** The old coin branches were never
   *   migrated and still carry hard-coded Hebrew, so an English or Russian
   *   member got Hebrew coins.
   *
   * LAYOUT CONTRACT — a circle is a hostile text box, so it is three centred
   * lines and nothing may escape them: a kind cap, the title clamped to two
   * lines, and one meta line. Type scales with the diameter (see the S/M/L
   * control in the field's chrome) so a bigger coin is a bigger *word*.
   */
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import { msLeft } from '$lib/stores/clock.svelte';
  import {
    kindAccent,
    rowContent,
    rowCtaKey,
    rowTimegrama,
    rowIsActionable
  } from '../cards/cardKinds.js';
  import { coinArc } from './coinArc.js';
  import {
    coinFace,
    RIM_GILT,
    RIM_STROKE,
    RIM_WELL,
    RIM_WELL_ALPHA,
    RIM_WELL_LIFT,
    RIM_WELL_WIDTH
  } from './coinSkin.js';
  import { coinSkin } from '$lib/stores/levStores';

  /**
   * @typedef {Object} Props
   * @property {any} item - a DisplayItem off finalSwiperArray
   * @property {number} size - coin diameter in px, from the field's size control
   * @property {() => void} onOpen - expand this item into its full card
   */

  /** @type {Props} */
  let { item, size, onOpen } = $props();

  let classic = $derived($coinSkin === 'classic');
  /**
   * The rim path needs an id, and there are up to 137 of these in one document.
   * `coinlapach` is the item identity the whole heart already keys on, so no
   * counter is needed and the id survives a re-render.
   */
  let rimId = $derived(`lev-rim-${item.coinlapach}`);

  /**
   * The rim label's size, in viewBox units — i.e. as a percentage of the coin's
   * diameter — floored so that it never renders below **11px**, whatever the
   * member's size step. It is not a style choice: 8–10px inside a small circle
   * is the complaint this whole view was shelved over. The floor is one pixel
   * above the 10px the plate gives its kind cap and meta line, and the extra
   * pixel is the curve's — a line bent around a circle is measurably harder to
   * read than the same line set straight, so it does not get to sit at the
   * straight text's floor. At the S step (96px, or 81px on a phone) 9 units
   * would be 8.6px, so this lifts it; at M and L the natural size clears it.
   */
  const RIM_UNITS = 9;
  let rimFont = $derived(Math.max(RIM_UNITS, (11 / Math.max(size, 1)) * 100));

  /**
   * The rim well's arc, in the same viewBox units.
   *
   * The label hangs *below* the text path, so a band centred on that path would
   * spend half its width outside the coin. This is the same semicircle pulled
   * inward by `RIM_WELL_LIFT` em and stroked `RIM_WELL_WIDTH` em wide, which
   * puts the band over the glyphs rather than over the edge. Both are in em of
   * the rim font, so the well tracks the label through every size step instead
   * of being tuned for one.
   */
  let wellR = $derived(44 - rimFont * RIM_WELL_LIFT);
  let wellPath = $derived(
    `M ${(50 - wellR).toFixed(2)},50 A ${wellR.toFixed(2)},${wellR.toFixed(2)} 0 0 1 ${(50 + wellR).toFixed(2)},50`
  );
  let wellWidth = $derived(rimFont * RIM_WELL_WIDTH);
  /** The artwork this kind's original coin was painted with. */
  let face = $derived(coinFace(item.ani));

  let accent = $derived(kindAccent(item.ani));
  let content = $derived(rowContent(item));
  let deadline = $derived(rowTimegrama(item));
  let actionable = $derived(rowIsActionable(item));

  // `{ text }` is data the processor already produced; `{ key, params }` is a
  // lookup `cardKinds` could not do (it is pure and has no store).
  let title = $derived(
    content.title?.text ??
      (content.title?.key ? $t(content.title.key, content.title.params) : '')
  );
  let kindLabel = $derived($t(content.kindKey));

  // The shared clock — never a per-coin interval. A day-scale countdown
  // produces the same string for a whole day, so re-deriving it each second
  // costs a comparison and no DOM write, which is what lets 137 of these sit in
  // an idle field without touching the DOM at all.
  let leftMs = $derived(deadline ? msLeft(deadline) : null);

  /** Rounded *up*: with 47h to go you have two days left, not one. */
  let countdown = $derived.by(() => {
    if (leftMs === null) return null;
    if (leftMs <= 0) return $t('lev.list.time.over');
    const secs = Math.ceil(leftMs / 1000);
    const days = Math.ceil(secs / 86400);
    const hours = Math.ceil(secs / 3600);
    const mins = Math.ceil(secs / 60);
    const [key, count] =
      hours >= 24
        ? ['d', days]
        : mins >= 60
          ? ['h', hours]
          : secs >= 60
            ? ['m', mins]
            : ['s', secs];
    return count === 1
      ? $t(`lev.list.time.${key}One`)
      : $t(`lev.list.time.${key}`, { count });
  });

  let urgent = $derived(leftMs !== null && leftMs <= 24 * 3600 * 1000);

  /**
   * How far round the ring the clock still has to run, as a percentage.
   *
   * `null` — the item has no timegrama — draws a quiet unfilled ring rather
   * than an empty one: "no deadline" and "out of time" must not look alike.
   */
  let arc = $derived(coinArc(item, leftMs));
  let arcPct = $derived(arc === null ? 0 : Math.round(arc * 100));

  /** The first figure the kind offers, already localised. */
  let fact = $derived.by(() => {
    const first = content.facts?.[0];
    if (!first) return null;
    return $t(`lev.list.fact.${first.key}`, {
      value:
        typeof first.value === 'number'
          ? first.value.toLocaleString($lang)
          : first.value
    });
  });

  /** The verb for what this coin wants — "להצבעה", "לתשלום", … */
  let cta = $derived($t(rowCtaKey(item)));

  /**
   * One meta line, and the order is by information value: the clock if there is
   * one, otherwise the kind's headline figure, otherwise the verb. A fourth
   * line does not fit inside a 99px circle at a size anyone can read, and the
   * verb is never *lost* — it is in the accessible name, and the full card is
   * one tap away.
   */
  let meta = $derived(countdown ?? fact ?? (actionable ? cta : null));

  /**
   * The accessible name. A coin is a `<button>` with no visible label a screen
   * reader can rely on — the old ones were `<div onclick>` with no role, no
   * tabindex and no label at all — so it says the whole sentence: what kind of
   * thing this is, which one, how long is left, and what it wants.
   */
  let label = $derived(
    [kindLabel, title, item.projectName, countdown, actionable ? cta : null]
      .filter(Boolean)
      .join(' · ')
  );
</script>

<button
  type="button"
  class="coin"
  class:done={!actionable}
  class:has-clock={arc !== null}
  class:urgent
  class:classic
  style:--accent={accent}
  style:--size={`${size}px`}
  style:--arc={arcPct}
  style:--face={classic ? `url(${face})` : 'none'}
  aria-label={label}
  onclick={onOpen}
>
  <!-- The project logo. On the plate it is the coin's face at watermark
       strength; on the classic skin the *kind's* artwork is the face, so the
       logo becomes a small badge at the foot of the coin. Either way it is the
       only image on a coin, it repeats across the field, and it is what lets a
       member find "the ones from that rikma" before reading a word. -->
  {#if item.src}
    <img class="face" src={item.src} alt="" loading="lazy" decoding="async" />
  {/if}

  <!-- The kind/clock ring belongs to the plate. On the classic skin the coin's
       edge is the artwork's own edge — that is what a coin looks like — and a
       coloured band drawn around a painted sphere reads as a frame bolted onto
       it, not as part of it. Nothing is lost: the clock the arc encodes is
       already spelled out in words on the meta line (`countdown` is set
       whenever `arc` is), and the kind is lettered around the rim. -->
  {#if !classic}
    <span class="ring" aria-hidden="true"></span>
  {/if}

  {#if classic}
    <!-- The kind, lettered in gilt around the rim — the one thing the original
         coins did that a flat disc cannot. It is `aria-hidden` because the
         accessible name above already says it, and it carries the *kind*, not
         the title: a curved line is harder to read than a straight one, so what
         goes on it is the shortest and least load-bearing of the three labels.
         The title and the clock stay flat and horizontal in the middle.

         `fill` names the shared gradient with a solid gilt fallback, so a coin
         still letters correctly if the field's <defs> is not in the document
         (a lone coin in a test, a screenshot of one). -->
    <svg class="rim" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <!-- The ground first: gilt on a photograph is not a contrast the stroke
           can guarantee (see RIM_WELL). The shared gradient fades the band out
           at both arc ends so the artwork still owns the coin's shoulders; the
           solid fallback keeps a lone coin readable with no <defs> in the
           document, exactly as the gilt's does. -->
      <path
        d={wellPath}
        fill="none"
        stroke="url(#lev-coin-rim-well) {RIM_WELL}"
        stroke-opacity={RIM_WELL_ALPHA}
        stroke-width={wellWidth}
      />
      <path id={rimId} d="M 6,50 A 44,44 0 0 1 94,50" fill="none" />
      <text
        text-anchor="middle"
        dominant-baseline="hanging"
        font-size={rimFont}
        fill="url(#lev-coin-gilt) {RIM_GILT[2]}"
        stroke={RIM_STROKE}
      >
        <textPath href="#{rimId}" startOffset="50%">{kindLabel}</textPath>
      </text>
    </svg>
  {/if}

  <span class="inner">
    <span class="kind">{kindLabel}</span>
    <span class="title" dir="auto">{title}</span>
    {#if meta}
      <span class="meta" dir="auto">{meta}</span>
    {/if}
  </span>
</button>

<style>
  .coin {
    /* Two roles for one hue, exactly as LevRow splits them: `--accent` is the
       colour — the ring, the wash, the chip — and `--ink` is that same hue
       pulled into a readable band, the only one allowed to colour a word. The
       glow tokens are unreadable as text (`--wow` is 1.31:1 on a light
       surface); they were chosen as glows behind a card header. Clamping
       lightness in oklch keeps the hue so a kind is still recognisably "the
       green one" while making it legible. */
    --ink: var(--accent);

    /* Type scales with the diameter, floored at 11px — the whole complaint
       about the old coins was 8–10px text inside a 75px circle. At the default
       124px this is ~14px, and the L step takes it to 16px. */
    --coin-font: clamp(11px, calc(var(--size) / 8.6), 16px);

    /* The coin's own surface. The field behind it is a hard-coded dark gradient
       in every theme, so this stays a light, opaque disc in both: it is the
       only thing guaranteeing the text contrast, and a dark-on-dark coin would
       be exactly the unreadable circle this view is being rescued from. */
    --coin-bg: #fdfcf4;

    position: relative;
    width: var(--size);
    height: var(--size);
    border-radius: 50%;
    padding: 0;
    border: 0;
    overflow: hidden;
    isolation: isolate;
    cursor: pointer;
    background: var(--coin-bg);
    font-size: var(--coin-font);
    /* A contact shadow plus a wide bloom in the kind's own colour — the same
       "find the kind by glancing" trick the rows use, which on a dark field
       reads as the coin having its own light. */
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.45),
      0 0 16px -4px color-mix(in srgb, var(--accent) 70%, transparent);
    /* No transition and no transform here. The field holds 137 of these; the
       old coins carried a 2.2s fly-in and a `scale-290` hover apiece, which is
       where "נתקע אחרי כמה לחיצות" came from. The hover below changes colour
       only, which composites. */
  }

  @supports (color: oklch(from red l c h)) {
    .coin {
      --ink: oklch(from var(--accent) min(l, 0.46) c h);
    }
  }

  .coin:hover {
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.45),
      0 0 22px -2px color-mix(in srgb, var(--accent) 90%, transparent);
  }
  .coin:focus-visible {
    outline: 3px solid #fff;
    outline-offset: 2px;
  }

  /* ── the face ────────────────────────────────────────────────────────────
     A watermark, not a picture: at this opacity a fully black logo shifts the
     surface by about 14%, which still leaves the title above 10:1. That is the
     rule the strength is set by — the logo may add texture, never contrast. */
  .face {
    position: absolute;
    inset: 8%;
    z-index: -1;
    width: 84%;
    height: 84%;
    border-radius: 50%;
    object-fit: cover;
    opacity: 0.14;
  }

  /* ── the ring: kind on the outside, clock on the inside ──────────────────
     One element carries both. The conic gradient is the timegrama — how much of
     the rikma's own response window is still to run (see coinArc.ts) — and the
     mask turns the disc into a band so the middle stays available for words. */
  .ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(
      from 180deg,
      var(--accent) calc(var(--arc) * 1%),
      color-mix(in srgb, var(--accent) 20%, transparent) 0
    );
    -webkit-mask: radial-gradient(
      farthest-side,
      transparent calc(100% - var(--ring-w, 5px)),
      #000 calc(100% - var(--ring-w, 5px))
    );
    mask: radial-gradient(
      farthest-side,
      transparent calc(100% - var(--ring-w, 5px)),
      #000 calc(100% - var(--ring-w, 5px))
    );
  }

  /* An item with no timegrama has no arc to draw, so the ring is a plain band
     in the kind's colour: absent and expired must not look the same. */
  .coin:not(.has-clock) .ring {
    background: var(--accent);
  }

  /* ── the words ───────────────────────────────────────────────────────────
     `inset: 15%` keeps the text box inside the circle's widest band, which is
     the only part of a disc wide enough to hold a line. Everything clips;
     nothing is allowed to displace anything — text breaking out of the circle
     is the original sin this view was abandoned for. */
  .inner {
    position: absolute;
    inset: 15%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.12em;
    text-align: center;
    overflow: hidden;
    pointer-events: none;
  }

  .kind {
    max-width: 100%;
    /* The cap and the meta line ride the coin's own scale, but never below the
       10px the list rows use for the same two labels — that is the floor the
       whole size control exists to defend. */
    font-size: max(10px, 0.72em);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: 0.01em;
    color: var(--ink);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: none;
  }

  .title {
    max-width: 100%;
    font-size: 1em;
    font-weight: 700;
    line-height: 1.2;
    color: #111827;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    /* A single long word — a URL, a German compound, a rikma name with no
       spaces — must break rather than push the circle open. */
    overflow-wrap: anywhere;
    flex: 0 1 auto;
    min-height: 0;
  }

  .meta {
    max-width: 100%;
    font-size: max(10px, 0.72em);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    color: #4b5563;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: none;
  }

  .coin.urgent .meta {
    color: #b91c1c;
  }

  /* A coin the member has already answered keeps its place until the feed drops
     it, but stops competing for attention: no bloom, a thinner grey ring, and
     the whole disc quietened. Actionable coins are the loud ones — today every
     coin shouts equally. */
  .coin.done {
    --ring-w: 3px;
    --ink: #6b7280;
    opacity: 0.62;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  }
  .coin.done .ring {
    background: rgba(107, 114, 128, 0.5);
  }
  .coin.done:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  }
  .coin.done .meta {
    color: #6b7280;
  }

  /* ══ the classic skin ═════════════════════════════════════════════════════
     Each kind on the artwork its original coin was painted with, and the kind
     lettered in gilt around the rim. Everything that carries *information* —
     the ring's clock arc, the accent, the accessible name, the two flat lines
     in the middle — is untouched; only the surface changes.

     The one thing it does drop is the ring: see the `{#if !classic}` above.

     Cost, for the record: no extra elements on the plate skin, and four net on
     the classic one (an <svg>, the well <path>, the rim <path>, a <text>, a
     <textPath>, less the ring span). At 137 coins that is ~550 nodes on top of
     4,297 — about +13%, against the 31,540 the original coins cost. No Swiper,
     no per-coin timer, and two gradient definitions for the whole field. */
  .coin.classic {
    /* The face is a photograph or a painted sphere, so nothing may rely on the
       surface being light: the ink is set here, not inherited. */
    background-image: var(--face);
    background-position: center;
    background-repeat: no-repeat;
    background-size: cover;
    background-color: #1b1408;
  }

  /* The logo stops being the face and becomes a badge at the foot of the coin —
     the rim lettering has taken the top, which is where the originals put it. */
  .coin.classic .face {
    inset: auto 50% 6% auto;
    width: 22%;
    height: 22%;
    transform: translateX(50%);
    z-index: 1;
    opacity: 1;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
  }

  .rim {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 2;
  }
  .rim text {
    font-weight: 800;
    letter-spacing: 0.02em;
    /* The originals stroked their lettering and painted the stroke *under* the
       fill, which is what lets gilt sit on any face without a halo. It is
       thinner than the original 1.6px now that the well carries the separation:
       at a 10px glyph a 1.6px stroke eats most of the letter's own width from
       the outside in, so the label read as blurred gold rather than as gold. */
    paint-order: stroke;
    stroke-width: 1px;
    stroke-linejoin: round;
  }

  /* The middle of a textured coin is not a legible background, so the words get
     their own ground: a soft well that fades out before it reaches the rim, so
     the artwork still reads as the coin's face. Without it the title lands on
     whatever the photograph happens to be doing there. */
  .coin.classic .inner {
    inset: 12% 10% 22%;
    background: radial-gradient(
      closest-side,
      rgba(10, 8, 3, 0.78) 0%,
      rgba(10, 8, 3, 0.62) 62%,
      rgba(10, 8, 3, 0) 100%
    );
  }

  /* The kind is on the rim now; a second copy in the middle would spend one of
     the three lines a circle has. The title gets it instead. */
  .coin.classic .kind {
    display: none;
  }

  .coin.classic .title {
    color: #fff;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.95);
  }

  .coin.classic .meta {
    color: #f3e2b2;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.95);
  }

  .coin.classic.urgent .meta {
    color: #ffb4b4;
  }

  /* A settled coin quietens the same way it does on the plate — the face is
     dimmed rather than swapped, so the field still reads as one set. */
  .coin.classic.done {
    filter: grayscale(0.7);
  }
  .coin.classic.done .meta {
    color: #d1d5db;
  }
</style>
