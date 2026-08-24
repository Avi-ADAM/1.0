# PLAN — Lev coins view (תצוגת המטבעות): החזרת עטרה ליושנה

> Status: **draft / not started.** This is the working document for the coin
> view's restoration. Each stage below is one commit, independently shippable,
> with its own acceptance criteria. Tick the boxes as they land.
>
> The four open questions were **decided by the owner on 2026-08-24** — see §6.
> In short: `/newlev` redirects to `/lev`; distance from the heart *is* urgency;
> the view is the member's own choice, remembered; and a coin bursts when it is
> **decided** — approved or rejected — i.e. exactly when it stops being shown.

---

## 0. The promise, and why it was abandoned

The coin view came first. The idea was a heart that is not a feed: an open
field you pan in every direction, where every mission, offer, decision and vote
is a **circle**, and you clear your heart by popping circle after circle. The
distance from the centre was supposed to mean something, the field was supposed
to feel alive, and finishing an item was supposed to feel like something
happened.

What actually happened:

- text broke out of the circles (`טקסטים שבולטים מהמקום`) and never got fixed;
- older members could not read it or hit it;
- the field got heavy and "sticks after a few clicks";
- every new kind of heart item (sales, site-share, stipend, wish offers) was
  added **as a card only** — 8 of the 23 kinds have no coin at all (9 counting the
  site-share-income variant of `sale`);
- so the cards view became the default, and the coin view was left to rot.

The cards view has meanwhile been rebuilt properly (native scroll-snap deck, no
Swiper, shared clock, `LevCard` dispatch, `cardKinds` metadata), and the list
view was built on top of that same spine. **The coin view is the only one of the
three that never got the treatment.** Everything it needs already exists; this
plan is mostly about connecting it to what the other two views already use.

**Non-goal:** turning the coin view into a third card list. The spatial,
pop-them-one-by-one feeling is the point and must survive.

---

## 1. Audit — what is on the ground today (2026-08-24)

### 1.1 Which files are live

| File | Lines | Status |
|---|---:|---|
| `lev/newcoinui.svelte` | 1104 | **live** — the coin view, mounted by `/lev` and `/newlev` |
| `lev/midi.svelte` + `lev/sv.svelte` | 299 + 3325 | **live** — the centre piece (the user's own coin + the kind filter) |
| `lev/ProductRequestCoin.svelte` | 66 | **live** — the only purpose-built coin component |
| `lev/coinui.svelte` | 1478 | **dead** — nothing imports it |
| `lev/mid.svelte` | 3299 | **dead** — nothing imports it (holds a `setInterval`) |
| `routes/(reg)/newlev/+page.svelte` | 341 | **stale fork** of `/lev` (no list view, no filters, older loader) |

That is ~5100 lines of dead or forked code shadowing the 1100 that run.

### 1.2 The layout engine

`checkLine(i)` (`newcoinui.svelte:60-110`) walks outward ring by ring: it loops
"how many fit in ring 1, ring 2, …" until it passes `i`, then places the item at
`angle = position × 2π / countInRing`. `checkLines()` calls it once per item, so
placing *n* items costs O(n·rings) and is recomputed **from scratch** in an
`$effect` on every new `arr1` reference (`:325`, `:355`).

Consequences:

- the processed feeds hand out a **new array reference on every tick** (this is
  documented in `cards/cards.svelte` — it is exactly what forced the Swiper
  rebuild there), so the whole field is re-placed several times a minute;
- a filtered-out coin still consumes its index, so hiding a kind punches
  **holes** in the spiral instead of closing ranks;
- `center` is a plain `let` mutated inside an `$effect` (`:15-17`) and read by
  `checkLine` — not reactive, ordering-dependent, and logged to the console on
  every change (`:20`);
- `size` / `bigsize` are `$derived` (`:27-28`) and then **assigned** in
  `updateSizes` (`:318-319`) with *different* values (115 vs 75, 100 vs 165);
- the `resize` listener added in `onMount` (`:345`) is never removed, is not
  debounced, and each event triggers a smooth `scrollTo` 300 ms later.

### 1.3 The weight — a Swiper per coin

Each coin mounts the **whole** heart component for that kind, in coin mode
(`{#if cards == false}` inside the same file that renders the card). Those coin
branches carry, per instance:

- a **Swiper 8 instance** with `EffectFlip` + `Navigation`
  (`halukaask.svelte:544`, and the same in 11 more files);
- a `transition:fly` of `{ y: 450, duration: 2200 }` on mount;
- a `hover:scale-290 duration-1000` hover transform;
- its own modal/dialog markup for the expanded state.

12 files import Swiper (`decisionMaking`, `didiget`, `fiappru`, `halukaask`,
`mashsuggest`, `missionInProgress`, `pandingMesima`, `pmas`, `projectSuggestor`,
`reqtojoin`, `reqtom`, `weget`) — **and nothing else in `src/` does**. A heart
with 40 items therefore builds 40 Swipers plus 40 copies of components that are
2400–3300 lines each. That is the heaviness, and it is also why the whole
`swiper@8` dependency is still in the bundle.

### 1.4 Coverage — 15 coins for 23 kinds

`cardKinds.js` is the contract: `RENDERABLE_ANIS` is every kind the heart can
render, and both the deck and the list dispatch through `LevCard`. The coin view
does not — it has its own `{#each}` with its own 15 branches.

| `ani` | card | coin today |
|---|---|---|
| `haluk`, `sheirutp`, `vidu`, `mtaha`, `pmashes`, `pends`, `wegets`, `fiapp`, `walcomen`, `askedcoin`, `askedm`, `meData`, `huca`, `hachla` | ✔ | ✔ |
| `archObject` | ✔ | ⚠ renders the **card** component inside a round slot |
| `sale` | ✔ `SaleCard` | ✘ |
| `sale` + `isSiteShareIncome` | ✔ `SiteShareIncomeCard` | ✘ |
| `buy` | ✔ `CustomerSaleCard` | ✘ |
| `wishoffer` | ✔ | ✘ |
| `sitesharepay` | ✔ | ✘ |
| `sitesharedecide` | ✔ | ✘ |
| `stipend` | ✔ `StipendDecisionCard` | ✘ |
| `stipendpay` | ✔ | ✘ |
| `stipendconfirm` | ✔ | ✘ |

So **every money/consent flow added in the last year is invisible in the coin
view** — a member who prefers coins simply never sees a sale claim, a site-share
payment or a stipend confirmation. This is the most serious item in the audit:
it is not cosmetic, it is missed consent.

### 1.5 The filter disagrees with itself

- The gate for `vidu` is `milon.desi` in the coin view (`newcoinui.svelte:404`)
  and `milon.vidu` in `LevCard` — the same filter chip hides different things in
  different views.
- The coin filter is a hand-rolled 14-branch `if/else` inside `midi.svelte`
  (`:23-61`) that predates `hachla` and every money kind, supports only
  "show exactly one" / "show all", and has no project filter — while the deck
  and the list share `cards/filter.svelte` plus a project filter.
- The coin view never de-duplicates by `coinlapach` (the deck does), so a
  double-delivered socket update can paint the same coin twice.

### 1.6 Text: i18n and direction

The coin branches were never migrated to `$t()`. Hard-coded Hebrew strings still
sit in the coin markup of `pmas` (56 lines with Hebrew), `didiget` (44),
`missionInProgress` (40), `halukaask` (32), `pandingMesima` (31) and more — e.g.
`בקשת חלוקה`, `לחיצה למעבר למוח הריקמה`. An English/Arabic/Russian/Spanish user
gets Hebrew coins. This is the regression `CLAUDE.md` §i18n explicitly calls out.

Related: four processors run the item name through `letters()`
(`levDataProcessors.js:7`), which **pre-reverses** Hebrew word-by-word so the
string can be dropped into an SVG `<text>` that has no bidi engine — i.e. the
data is bent for the coin view's benefit, and every HTML surface has to remember
to use `nameRaw` instead. If the coins stop using raw SVG text, `letters()` can
retire and `name` can go back to meaning what it says.

### 1.7 Readability and reach

- A coin's title is shown **on hover only** (`ProductRequestCoin.svelte`) —
  invisible on touch, invisible to anyone who does not hover-and-wait.
- Coins are `<div onclick>` with no `role`, no `tabindex`, no `aria-label`:
  unreachable by keyboard, unreadable by a screen reader, and they cannot be
  tabbed through in any meaningful order.
- Coin diameter drops to 75 px on phones (`:318`) with 8–10 px text inside it —
  below both the WCAG 2.5.8 target-size floor and anything a 70-year-old will
  read.
- Entrance `fly` of 2.2 s and a `scale-290` hover ignore
  `prefers-reduced-motion` entirely.
- There is no zoom, no minimap, and the only way back to the middle is a `⌘`
  button in the corner with a `title` in Hebrew only.

### 1.8 Small correctness bugs (fix in passing)

1. `delo()` (`:143-152`) splices the `$bindable` `arr1` in place and reassigns
   it — mutating the page's array behind the store's back.
2. `export const snapshot` (`:358`) does nothing: SvelteKit only reads
   `snapshot` from a `+page.svelte`, not from a component.
3. `console.log('עדכון מרכז:', center)` in an `$effect` (`:20`), plus
   `console.log(orders, w, 'mount')` and a `[saleClaim][chat]` log on every
   chat forward.
4. `height: 100vh` on the container (`:365`) — the mobile-browser toolbar bug
   `100dvh` exists for; the deck already uses `100dvh`.
5. `transition: transform 500ms` on `.normSml` (`:1057`) never fires, because
   position is set through `left`/`top`, not `transform`.
6. `w`/`h` are both `bind:clientWidth`/`clientHeight` **and** written by
   `updateSizes` — a bind-vs-assign loop waiting to oscillate.

---

## 2. Target architecture

The list view already proved the pattern the coins need, in the same codebase:

> **a cheap, uniform, purpose-built element per item — and exactly one heavy
> `LevCard` mounted on demand when the user opens something.**
> (`list/LevList.svelte:8-13`)

The coin view becomes the third host of that same spine:

```
finalSwiperArray ──► cardKinds.js (isCardVisible / rowKindKey / rowContent /
      │                            rowFacts / rowTimegrama / rowCtaKey / kindAccent)
      │
      ├─► cards/cards.svelte  ──► LevCard   (deck: one heavy card per slide)
      ├─► list/LevList.svelte ──► LevRow    (cheap) + LevCard on demand (sheet)
      └─► coins/CoinField.svelte ─► LevCoin (cheap) + LevCard on demand (sheet)   ← new
```

New files:

| File | Job |
|---|---|
| `lev/coins/coinLayout.ts` | pure placement maths + urgency ordering, unit-tested |
| `lev/coins/CoinField.svelte` | the pannable/zoomable field: viewport, virtualization, keyboard nav, centre-return |
| `lev/coins/LevCoin.svelte` | one coin, driven entirely by `cardKinds` metadata (+ a small per-kind ornament map) |
| `lev/coins/CoinSheet.svelte` | the on-demand expanded `LevCard`, portalled — shared with the list's sheet if it can be lifted out of `LevList` |

`newcoinui.svelte` shrinks to a thin adapter and is eventually deleted; the
`{#if cards == false}` branches inside the 12 giant components are deleted with
it, and `swiper` leaves `package.json`.

**The rule that keeps this from rotting again:** a new heart kind is added to
`cardKinds.js` and to `LevCard` — and that is *all*, because the coin is
generic. `cardKinds.test.ts` already walks `RENDERABLE_ANIS`; it gains a coin
assertion so a kind without a coin fails CI (see stage 4).

---

## 3. The stages

Each stage: one commit, green `npm run check` + `npm test`, and a manual pass on
`/lev` at 375 px and 1440 px, he + en.

### Stage 0 — clear the ground

- [ ] Delete `lev/coinui.svelte` and `lev/mid.svelte` (nothing imports them; git
      keeps them).
- [ ] **`/newlev` → redirect to `/lev`** (decided). Replace the 341-line fork
      with a `+page.server.js` `redirect(308, '/lev')` so old links and any
      bookmarked session still land somewhere alive, and drop its three entries
      from `src/lib/translations/routes.js` (`deals`, `archive`, and the
      namespace list) — the route gate must not keep loading namespaces for a
      page that no longer renders.
- [ ] Remove the three `console.log`s in `newcoinui.svelte`, the dead
      `snapshot` export, and the never-firing `transition: transform`.
- [ ] Snapshot the baseline: with ~40 items, record mount time, node count and a
      10 s performance profile of an idle field (see §5). This is the number
      every later stage is measured against.

*Acceptance:* the coin view behaves exactly as before; the repo is ~4800 lines
lighter.

### Stage 1 — `coinLayout.ts`: a field that stops re-placing itself

- [ ] Replace the ring loop with a **Vogel/phyllotaxis spiral**:
      `r = spacing · √i`, `θ = i · 137.507°`. O(1) per item, uniform density, no
      seams between rings, and — crucially — **no holes**: index `i` is the
      item's rank in the *visible* list, so filtering closes ranks instead of
      leaving gaps.
- [ ] **Distance from the heart is urgency** (decided). Rank = soonest
      `rowTimegrama` first, actionable (`rowIsActionable`) before passive,
      then feed order; ties broken by `coinlapach` so the order is stable and
      does not shuffle between renders. "Pop the closest one" therefore *is*
      "do the most urgent one", and the field teaches that by itself: as an
      item's restime runs down it drifts inward, so the ring around the heart
      is always what needs you now.
      - Items with **no** timegrama (a sale to acknowledge, a welcome) sort
        after every timed one — they are not urgent, they are pending.
      - The inward drift is a layout change like any other, so it goes through
        the same FLIP below; a coin must never jump while the user is reading it.
- [ ] Cache positions by `coinlapach` in a `Map`; recompute only when the
      **id set** changes (the `idsSig` trick from `cards.svelte:212`), not on
      every feed re-emit. A tick that only moves a countdown must not move a
      single coin.
- [ ] Animate the layout change that *does* happen with a transform (FLIP), for
      visible coins only, and skip it entirely under `prefers-reduced-motion`.
- [ ] Unit tests (`coinLayout.test.ts`): no two coins overlap at any n ≤ 500;
      removing an item from the middle moves the ones after it by at most one
      slot; the same input always yields the same output.

*Acceptance:* an idle field with 40 items does **zero** layout work per clock
tick.

### Stage 2 — `LevCoin.svelte`: a coin you can actually read

Built from what `LevRow` already uses, so a coin, a row and a card describe the
same object in the same words.

- [ ] **Always-visible label**, never hover-only: kind (`kindLabelKey`) as a
      small cap, `rowTitle` clamped to two lines, project logo as the coin's
      face. Text goes **inside** the circle in ordinary HTML with
      `overflow: hidden` — no SVG `<text>`, hence no `letters()`, hence RTL is
      handled by the browser.
- [ ] **The ring carries the state**: `kindAccent` for the colour (through the
      `oklch` lightness clamp `LevRow` already applies — the glow tokens fail AA
      as ink), and the arc's fill is the timegrama progress. One glance = which
      kind, whose rikma, how long left.
- [ ] **Actionable coins are visibly different** (`rowIsActionable`): a solid
      ring and the `rowCtaKey` verb; passive/FYI coins are quiet. Today
      everything shouts equally.
- [ ] **Size**: default diameter 112 px desktop / 96 px phone, with a three-step
      size control (`S / M / L`, persisted) in the field's chrome. This is the
      concrete answer to "אנשים מבוגרים שמתקשים".
- [ ] Every string through `$t()` — the `lev.list.kind.*`, `lev.list.fact.*`,
      `lev.list.time.*` and `lev.list.cta.*` namespaces already exist in all
      five locales, so this stage should add **no** new keys.
- [ ] `role="button"`, `tabindex`, `aria-label` = kind + title + time left.

*Acceptance:* `npm run check:i18n` and `npm run check:script` pass; every coin
is legible at 100 % zoom without hovering; contrast ≥ 4.5:1 on the label.

### Stage 3 — tap a coin → the real card, once

- [ ] Tapping a coin opens `LevCard` in a portalled sheet (`CoinSheet`), reusing
      the list's sheet behaviour — back button, backdrop, Escape, drag-down
      (`LevList.svelte:120-139`). One card mounted at a time, for the whole
      field.
- [ ] Delete the coin-mode dialogs from the 12 components as each kind is
      covered — the card *is* the expanded state now, and there is exactly one
      of it to maintain instead of two.
- [ ] **The pop** (decided): a coin bursts when it is **decided — approved *or*
      rejected — and therefore stops being shown.** The trigger is the
      resolution, not the direction: agreeing and countering both close a
      circle, and per the project's own principle there is no "no" to mourn.
      Burst = scale-up + fade + `confettiStore.trigger()`, then the field closes
      ranks (§Stage 1's FLIP) — replacing `delo()`'s in-place `splice` of the
      `$bindable` array.
      - It must **not** fire when a coin merely stops being displayed for
        another reason: a filter change, a project filter, a refetch that drops
        it, or a view switch. Only a resolution the user just caused, so the
        signal keeps meaning something.
      - Under `prefers-reduced-motion` the coin fades out without confetti.
      - One burst at a time: `confettiStore` is a single global flag with an
        11 s reset, so resolving three coins quickly must not stack.

*Acceptance:* no `Swiper` instance is created anywhere in the coin view; opening
and closing 20 coins in a row leaves the node count flat (this is the "נתקע אחרי
כמה לחיצות" test).

### Stage 4 — full coverage, enforced by a test

- [ ] Every kind in `RENDERABLE_ANIS` renders a coin, including the eight that
      have none today (`sale`, site-share income, `buy`, `wishoffer`,
      `sitesharepay`, `sitesharedecide`, `stipend`, `stipendpay`,
      `stipendconfirm`).
- [ ] Money kinds get an amount ornament on the coin (`rowFacts` already returns
      `amount` / `price` / `shares`), consent kinds get the voter strip dots.
- [ ] `cardKinds.test.ts` gains: for every `ani` in `RENDERABLE_ANIS`,
      `kindLabelKey` resolves to a real translation **and** the coin renderer
      produces a non-empty label — so the next new kind cannot land coin-less.
- [ ] `archObject` stops rendering `ArchiveObjectCard` inside a round div.

*Acceptance:* a member on the coin view sees, and can act on, every consent item
a member on the cards view sees. Verified item-by-item against `RENDERABLE_ANIS`.

### Stage 5 — one filter, three views

- [ ] The coin view uses `cards/filter.svelte` and the same `milon` store as the
      deck and the list; `midi.svelte`'s 14-branch `if/else` goes away.
- [ ] Gate every coin through `isCardVisible(item, milon)` — which fixes the
      `vidu → desi` mismatch by construction.
- [ ] De-duplicate by `coinlapach`, like the deck does.
- [ ] Add the project filter the other two views have.
- [ ] Switching view keeps the filter *and* keeps you on the same item: the coin
      you were looking at becomes the card the deck opens on (`deckPosition`
      already stores exactly this).
- [ ] **The view is the member's choice, remembered** (decided) — no forced
      default for anyone. The mechanism already exists: `levView` persists to
      `localStorage['lev:view']` (`levStores.ts:616-642`), and only the *first*
      visit falls back to a device guess (`list` on a phone, `cards` on
      desktop). Two things this stage owes it:
      - once coins are no longer the slow view, that first-visit guess should
        stop being about performance and just be `cards` everywhere, with all
        three equally reachable from `LevViewSwitch`;
      - the preference is per-browser today. Promoting it to the account (so it
        follows a member between phone and desktop) is a small `users_permissions_user`
        field + an action — **out of scope here**, noted so it is a deliberate
        choice and not an oversight.

*Acceptance:* set a filter in any view, switch views twice, and both the filter
and the current item survive; pick coins, reload, and the heart opens on coins.

### Stage 6 — the field, restored as the good idea it was

- [ ] Pan in all directions with pointer drag / touch / trackpad, plus **zoom**
      (pinch, `ctrl`+wheel, and `+`/`−` buttons) via a single `transform` on the
      field — one composited layer, not 40 repositioned elements.
- [ ] Virtualize: render only coins inside the viewport rect + one screen of
      margin, recomputed on a rAF-throttled scroll. With cached positions this
      is one `filter` over an array of numbers.
- [ ] "Back to the heart" button, `Home` key, and a minimap chip showing where
      you are in the field and where the nearest un-popped coin is.
- [ ] Keyboard: arrow keys move to the nearest coin in that direction (the
      positions are known, so this is a nearest-neighbour query), `Enter` opens,
      `Esc` closes.
- [ ] The centre piece (`midi` + `sv`) keeps its place but loses the filter
      logic it should never have owned.

*Acceptance:* 200 items, phone-class device, sustained 60 fps while panning;
tab-and-arrow navigation reaches every coin.

### Stage 7 — cleanup and the convention

- [ ] Delete the `{#if cards == false}` branch from all 12 components; drop
      `swiper` from `package.json`.
- [ ] Retire `letters()` and the `nameRaw` duplication once nothing renders
      Hebrew into raw SVG `<text>` (see `project_lev_letters_reverses` memory —
      update it when this lands).
- [ ] `docs/LEV_CARD_CONVENTIONS.md` gains §10 — *coins*: a new kind needs
      nothing beyond `cardKinds.js` + `LevCard`; here is how to add an ornament
      if it deserves one.

---

## 4. Performance budget

Measured with ~40 items on a mid-range phone profile, and again at 200 items:

| | today (measure in stage 0) | target |
|---|---|---|
| Swiper instances | one per coin | 0 |
| heavy card components mounted | one per coin | 1 (the open sheet) |
| DOM nodes | ~40 × card | ~1 small subtree per *visible* coin |
| layout work per clock tick | full re-place of every coin | none |
| timers | shared clock + `mid.svelte`'s stray interval | shared clock only |
| pan | reflow of n absolutely-positioned elements | one composited transform |

---

## 5. How to verify (the same commands every stage)

```
npm run check        # svelte-check — the gate
npm test             # vitest, includes cardKinds + coinLayout
npm run check:i18n   # no silently-empty $t() on /lev
npm run check:script # no mixed-alphabet glyphs in the new strings
```

Manual: `/lev` at 375 px and 1440 px, `he` and `en`, light and dark, with the
coin view selected; open and close twenty coins; hide and show a kind; rotate
the phone.

---

## 6. Decisions (owner, 2026-08-24)

The four questions this plan opened with are settled. They are recorded here
because they are *design* decisions, not implementation details — a later reader
should not have to re-derive them from the code.

1. **`/newlev` → redirect** to `/lev` (308). It is a stale fork; keeping it alive
   only guarantees it misses every fix in this plan. → Stage 0.

2. **Distance from the heart is urgency.** The nearer a coin sits to the centre,
   the sooner it needs an answer, so the field carries meaning instead of
   decoration and "pop the closest one" is the right instinct to reward. Items
   with no clock sort outside the timed ones. → Stage 1.

3. **The view is the member's own choice, remembered** — no view is imposed as
   *the* default. `levView` already persists per browser; once coins are no
   longer the slow view, the first-visit fallback stops being a performance
   decision. Making the preference follow the account across devices is
   explicitly out of scope here. → Stage 5.

4. **A coin bursts when it is decided — approved *or* rejected — i.e. exactly
   when it stops being displayed.** What is celebrated is the circle closing,
   not the direction it closed in; that is the same principle the consent model
   is built on ("no absolute no"). It must never fire for a coin that merely
   disappears — filtered out, refetched away, or left behind on a view switch.
   → Stage 3.
