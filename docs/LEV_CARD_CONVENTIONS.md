# Lev card conventions

Every card on the heart page (`/lev`) is a Swiper slide rendered from
`src/lib/components/lev/cards/cards.svelte`. The slide is a **flex container
that centres its child** (`.swiper-slidec` / `.swipr-slidemobile` in
`stylec.css`) — it does *not* stretch it. So a card that does not claim its own
size collapses to its content width and looks half-screen next to every other
card.

A new card is not "a div with a header and buttons". It is the shell below,
copied verbatim. `SaleCard.svelte` is the reference implementation; `haluka`,
`inpro`, `rektom`, `pending`, `pma`, `dowegeot`, `fini`, `hachlata`,
`ProductRequestCard`, `SiteShare*Card` all follow it.

---

## 1. The shell (copy this)

```svelte
<script>
  import { t, isRtl } from '$lib/translations';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { isScrolable, toggleScrollable } from './isScrolable.svelte.js';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onChat } = $props();

  const glowRgb = '2, 255, 187'; // see §4
</script>

<div
  onclick={toggleScrollable}
  role="button"
  tabindex="0"
  onkeypress={(e) => {
    e.key === 'Enter' && toggleScrollable();
  }}
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isScrolable.value
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb={glowRgb}
>
  <CardHeader … />

  <!-- content -->
  <div
    class="{isScrolable.value
      ? 'bg-white dark:bg-slate-800'
      : 'bg-gray-200 dark:bg-slate-700'} transition-all-300 flex-1 overflow-y-auto d p-4 space-y-4"
  >
    …
  </div>

  <!-- actions -->
  <div
    class="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-3"
  >
    …
  </div>
</div>

<style>
  /* §4 — must be repeated in every card, the classes are scoped */
</style>
```

Three rows, always in this order: `CardHeader` → scrollable content
(`flex-1 overflow-y-auto`) → action bar. Only the middle row scrolls.

---

## 2. Size — why "half a screen" happens

`{isMobileOrTablet() ? 'w-full h-full' : 'w-[90%] h-[90%]'} lg:w-[90%]`

Without it the flex-centred slide shrink-wraps the card. `h-full` alone is not
enough — the width is the half that breaks. Never rely on the slide to size the
card.

## 3. `isScrolable` — click once to scroll, click again to swipe

`isScrolable.svelte.js` holds one global `$state({ value: true })`.
`cards.svelte` watches it and, while it is `false`, calls `swiperRef.disable()`
+ `mousewheel.disable()` — that is the only reason inner content can be scrolled
at all. A card that does not wire `toggleScrollable` onto its root can never be
scrolled with the wheel: Swiper eats it and slides to the next card.

So the root **must** carry `onclick={toggleScrollable}` plus `role="button"`,
`tabindex="0"` and the `Enter` handler (a11y — without them `svelte-check`
warns).

Two visible consequences, both intentional:

- the content background turns `bg-gray-200 / dark:bg-slate-700` while
  `isScrolable.value === false`, i.e. while the card is in scroll mode;
- the glow follows `isScrolable.value`, not `isFirst` — the card you are
  reading is the one that glows.

Buttons inside the card do **not** `stopPropagation` — toggling scroll mode as a
side effect of pressing a button is accepted behaviour across all cards.

## 4. Glow — `shadow-glow` / `border-glow` are per-card scoped styles

They are **not** in `app.postcss` and not Tailwind utilities. Each card repeats
this `<style>` block, and drives it with `style:--glow-rgb="R, G, B"` on the
root. Omit the block and the classes silently do nothing — Svelte scopes them
away, no warning, no error.

```css
.shadow-glow {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 0 20px rgba(var(--glow-rgb), 0.4),
    0 0 40px rgba(var(--glow-rgb), 0.3),
    0 0 60px rgba(var(--glow-rgb), 0.2),
    inset 0 0 20px rgba(var(--glow-rgb), 0.05);
}

.border-glow {
  border: 2px solid rgba(var(--glow-rgb), 0.5);
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 0 20px rgba(var(--glow-rgb), 0.4),
    0 0 40px rgba(var(--glow-rgb), 0.3),
    0 0 60px rgba(var(--glow-rgb), 0.2),
    inset 0 0 20px rgba(var(--glow-rgb), 0.05),
    0 0 0 1px rgba(var(--glow-rgb), 0.3);
}
```

`CardHeader` takes a **named** `glowColor` (`gold | barbi | blue | green |
orange | purple | red | teal`), the root takes the matching **rgb triple**.
Keep the two in sync:

| `glowColor` | `--glow-rgb`     |
| ----------- | ---------------- |
| `gold`      | `238, 232, 170`  |
| `barbi`     | `255, 0, 146`    |
| `blue`      | `116, 191, 255`  |
| `green`     | `2, 255, 187`    |
| `orange`    | `254, 172, 49`   |
| `teal`      | `20, 184, 166`   |

## 5. The `d` class — the styled scrollbar

`.d` is a **global** rule in `app.postcss` that skins the scrollbar (track +
thumb) to the site's palette. Put it on the root *and* on the scrolling content
div. Leave it off and you get the browser's default grey bar, which is how a new
card announces itself as foreign.

## 6. RTL

`dir={$isRtl ? 'rtl' : 'ltr'}` on the root — `$isRtl` (he **and** ar), not
`$lang === 'he'`. The `isFirst` drop-shadow flips with it:
`$isRtl ? 'boxleft' : 'boxright'` (both defined in `app.postcss`).

## 7. Header

Always `CardHeader.svelte`, never a hand-rolled header. It renders the project
`AuthorityBadge`, the card type, the title, and takes two optional snippets:
`voteSummary` (compact voter strip — shown in the header on desktop, and
repeated above the action bar on mobile, see `SaleCard`) and `actions`.
`onProjectClick` already `stopPropagation`s, so tapping the logo navigates
without toggling scroll mode.

## 8. Overlays must portal

Swiper puts a `transform` on the slide, which makes `position: fixed` resolve
against the slide instead of the viewport. Any modal/drawer a card opens has to
render through a portal (`bits-ui` `<Portal>`, or `Drawer.Portal` as in
`negoArchive.svelte`) — otherwise it appears clipped inside the card.

## 9. Text

No inline `{ he: …, en: … }` objects. All strings via `$t('ns.key')`, and the
namespace must be reachable on `/lev` — verify with `npm run check:i18n`.
