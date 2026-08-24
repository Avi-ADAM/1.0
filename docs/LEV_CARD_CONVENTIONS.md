# Lev card conventions

Every card on the heart page (`/lev`) is rendered through `LevCard.svelte` into
one of two hosts: a slide of the **deck** in
`src/lib/components/lev/cards/cards.svelte`, or the expanded sheet of the
condensed list in `src/lib/components/lev/list/`. The deck is a native CSS
scroll-snap container — **not Swiper any more**; see §3 and §8 for what that
changed. Its slide (`.deck-slide`) is a **flex container that centres its
child** — it does *not* stretch it. So a card that does not claim its own size
collapses to its content width and looks half-screen next to every other card.

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
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onChat } = $props();

  const glowRgb = '2, 255, 187'; // see §4
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet()
    ? 'w-full h-full'
    : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex d flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isFirst
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb={glowRgb}
>
  <CardHeader … />

  <!-- content -->
  <div
    class="bg-white dark:bg-slate-800 transition-all-300 flex-1 overflow-y-auto d p-4 space-y-4"
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

## 3. Scrolling a card — nothing to wire

Nothing. That is the whole rule, and it is worth stating because it used to be
the opposite.

A card's middle row is `flex-1 overflow-y-auto` and it scrolls. On the deck the
wheel handler (`contentConsumesWheel` in `cards.svelte`) walks up from the
event's target and, if anything on the way still has room to scroll in that
direction, leaves the event alone; on the phone's vertical deck native scroll
chaining does the same. In the list view the card is inside a sheet and scrolls
outright.

**Do not** put `onclick`, `role="button"` or `tabindex="0"` on a card root.
There used to be a global `isScrolable` store that every card toggled from its
root, because Swiper ate the wheel unconditionally and `swiperRef.disable()` was
the only way to give it back. It was one global for all cards, so clicking one
changed the look of every other, and a whole card announced itself to a screen
reader as a button. Swiper is gone and so is the store (`isScrolable.svelte.js`
was deleted); a card root is a plain `<div>` again.

The glow now follows the card's own `isFirst` / `isVisible` prop — true for the
centred slide in the deck and for the single open card in the list, so exactly
one card is lit in either host. That is what this section always claimed the
behaviour was.

Buttons inside a card no longer need to think about `stopPropagation` for this
reason (`CardHeader`'s `onProjectClick` still does it for its own navigation).
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

A transformed ancestor is a containing block, so `position: fixed` inside one
resolves against *it* instead of the viewport, and the modal ends up clipped
inside the card.

The deck no longer does this — it centres itself with `inset: 0; margin: auto`
precisely so there is no transform on the scroll container or its slides. But
the **list view's expanded sheet still does** (`translateY` drives its
drag-to-close), so the rule is unchanged: any modal/drawer a card opens renders
through a portal (`bits-ui` `<Portal>`, or `Drawer.Portal` as in
`negoArchive.svelte`). A card must work in both hosts.

## 9. Text

No inline `{ he: …, en: … }` objects. All strings via `$t('ns.key')`, and the
namespace must be reachable on `/lev` — verify with `npm run check:i18n`.
