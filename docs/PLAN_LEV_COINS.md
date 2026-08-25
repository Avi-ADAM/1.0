# PLAN — Lev coins view (תצוגת המטבעות): החזרת עטרה ליושנה

> Status: **stages 0–5 landed (2026-08-25);** 4 was absorbed by 2 and 3.
> This is the working document for the coin view's restoration. Each stage below
> is one commit with its own acceptance criteria — except 2 and 3, which cannot
> ship apart and landed together. Tick the boxes as they land.
>
> **What is left:** one decision inside Stage 5 (which view a member sees on
> their *first* visit, now that the coins are no longer the slow one), Stage 6
> (pan, zoom, keyboard, minimap) and Stage 7 (delete the now unreachable
> coin-mode branches from the 12 giant components and drop `swiper` from
> `package.json`).
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

## 1. Audit — what was on the ground (2026-08-24)

> Kept as written, because it is the *why*. Everything §1.2–§1.7 describes is
> fixed as of Stage 3 except the dead coin-mode branches inside the 12 card
> components (§1.3), which are now unreachable but not yet deleted — Stage 7.

### 1.1 Which files are live

| File | Lines | Status |
|---|---:|---|
| `lev/newcoinui.svelte` | 1104 → **722** | **live** — the coin view. `/newlev` now redirects here (Stage 0); the 15 per-kind branches are gone (Stage 3) |
| `lev/midi.svelte` + `lev/sv.svelte` | 299 + 3325 | **live** — the centre piece (the user's own coin + the kind filter) |
| `lev/ProductRequestCoin.svelte` | 66 | **dead as of Stage 3** — `LevCoin` renders every kind |
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
      ├─► cards/cards.svelte  ──► LevCard  (deck: one heavy card per slide)
      ├─► list/LevList.svelte ──► LevRow   (cheap) + LevCard on demand (sheet)
      └─► newcoinui.svelte    ──► LevCoin  (cheap) + LevCard on demand (sheet)
```

New files:

| File | Job |
|---|---|
| `lev/coins/coinLayout.ts` | pure placement maths + urgency ordering, unit-tested (23 tests) |
| `lev/coins/coinArc.ts` | pure: how much of the rikma's response window a coin has left, unit-tested (9 tests) |
| ~~`lev/coins/CoinField.svelte`~~ | not extracted. `newcoinui.svelte` **is** the field now, at 722 lines rather than 1104, and splitting it further before Stage 6 would only move code. Revisit when pan/zoom lands |
| `lev/coins/LevCoin.svelte` | one coin, driven entirely by `cardKinds` metadata (+ a small per-kind ornament map) |
| ~~`lev/coins/CoinSheet.svelte`~~ → `lev/LevSheet.svelte` | the on-demand expanded `LevCard`. It *was* liftable out of `LevList`, so it lives at the `lev/` root and both cheap views mount the same one |

`newcoinui.svelte` shrinks to a thin adapter and is eventually deleted; the
`{#if cards == false}` branches inside the 12 giant components are deleted with
it, and `swiper` leaves `package.json`.

**The rule that keeps this from rotting again:** a new heart kind is added to
`cardKinds.js` and to `LevCard` — and that is *all*, because the coin is
generic. `cardKinds.test.ts` already walks `RENDERABLE_ANIS`; it gains a coin
assertion so a kind without a coin fails CI (see stage 4).

---

## 3. The stages

Each stage: one commit, **no new** `npm run check` errors or `npm test`
failures (see §5 — neither is clean on this branch, so the gate is the delta,
not zero), and a manual pass on `/lev` at 375 px and 1440 px, he + en.

### Stage 0 — clear the ground ✅ *(done 2026-08-25)*

- [x] Delete `lev/coinui.svelte` (1478) and `lev/mid.svelte` (3299) — nothing
      imported them; git keeps them. `coinui.svelte` carried an uncommitted
      one-line edit, which went with it.
- [x] **`/newlev` → redirect to `/lev`** (decided). The 341-line fork is
      replaced by a `+page.server.js` with `redirect(308, '/lev')`, and its
      three entries are gone from `src/lib/translations/routes.js` (`deals`,
      `archive`, `stipend`) — the route gate must not keep loading namespaces
      for a page that no longer renders. `svelte-kit sync` accepts the route
      with no `+page.svelte` (it generates `PageServerLoad` for it), which
      `moach/process/[processid]` already relied on.
- [x] Remove the three `console.log`s in `newcoinui.svelte`, the dead
      `snapshot` export (SvelteKit only reads `snapshot` from a `+page.svelte`,
      never from a component), and the never-firing `transition: transform`.
- [x] Fixed in passing (§1.8): the `resize` listener now has the teardown it
      never had — every mount used to leave a live one behind.
- [x] **The perf baseline**, measured 2026-08-25 on the owner's own heart at
      `localhost:5173/lev`, coin view, 1270×536 viewport:

      | | measured |
      |---|---|
      | coins in the field | **137** |
      | Swiper instances | **129** |
      | DOM nodes on the page | **31,540** (~230 per coin) |
      | time to first usable paint | ~13 s |
      | DOM mutations in 6 s of an idle field | **0** (after Stage 1) |

      137 coins is not an edge case — it is one real member's heart, and it is
      three times the 40 this plan had been sizing for. Every per-coin cost in
      §1.3 should be read against 137, not 40.

*Acceptance:* the coin view behaves exactly as before; ~5100 lines of dead or
forked code gone. Verified: `npm run check` 1476 errors — **unchanged**, and
none on a line this stage touched; `npm test` 47 failures in 10 files — all
pre-existing (none of those files import anything this stage touched);
`npm run check:i18n` passes with 19 route-gated namespaces.

### Stage 1 — `coinLayout.ts`: a field that stops re-placing itself ✅ *(done 2026-08-25)*

- [x] Replaced the ring loop with a **Vogel/phyllotaxis spiral**, in the new
      pure module `lev/coins/coinLayout.ts`: `r = √(hole² + c²·i)`,
      `θ = i · 137.507°`. O(1) per item, uniform density, no seams between
      rings, and — crucially — **no holes**: `i` is the item's rank among the
      *visible* items, so filtering closes ranks instead of leaving gaps.
      The hole under the root (rather than the textbook `c·√i`) keeps the
      density uniform *and* clears the middle for the heart.
      `c = size · spacing / 1.6`, where 1.6 is under the measured nearest-pair
      ratio of 1.657·c — so coins always keep a real gap.
- [x] **Distance from the heart is urgency** (decided). Implemented in
      `rankCoins`, in this order: **actionable first** (`rowIsActionable`),
      then timed before undated, then soonest `rowTimegrama`, then the feed's
      own `pl` band, then feed order, then `coinlapach` — a total order, so two
      renders of the same set can never disagree about who sits where.
      - *Deviation from the draft, deliberate:* actionable is the **primary**
        key, not the secondary one. A vote the member has already cast is not
        urgent however soon it matures, and it must not sit in the inner ring
        holding a seat that an open item needs.
      - Items with **no** timegrama (a sale to acknowledge, a welcome) sort
        after every timed one — they are not urgent, they are pending.
      - The deadline is compared as an **absolute** timestamp, never as "time
        left": both shrink together, so the order is identical a minute later.
        The field cannot churn once a second. A coin therefore drifts inward
        only when something nearer the heart is resolved and leaves — which is
        the movement that actually means something.
- [x] ~~Cache positions by `coinlapach`~~ — **dropped, and the reason matters.**
      Memoising on the id set would pin each coin to the item object it was
      first placed with, and the feeds hand out *rebuilt* objects on every tick:
      a member who had just voted would keep seeing the old count. The layout is
      recomputed on every change instead, which is affordable precisely because
      it is now deterministic — same set, same order, same numbers, so the style
      string is identical and the DOM is never written to. Determinism buys what
      the cache was for, without the staleness.
- [x] FLIP: the whole `{#if}` chain now sits in **one** positioned slot `<div>`
      per item, which is the immediate child of a **keyed** `{#each}` — both
      required for `animate:flip`, and the `{#each}` was not keyed before. The
      duration collapses to 0 under `prefers-reduced-motion`, read from a live
      `matchMedia` listener seeded synchronously.
- [x] Unit tests — `coinLayout.test.ts`, 23 of them: no two coins closer than a
      coin's diameter at n ∈ {1…500}; a removal from the middle moves the coins
      behind it in by exactly one slot and leaves none ahead of it touched;
      every rotation of the same input ranks identically; the field extent
      contains every coin.
- [x] Fixed in passing: the field size came from four hard-coded buckets
      (1200/1500/2000/2500 px) while the ring loop kept placing coins outward,
      so a heart with enough items placed some of them **outside the scrollable
      area**. `fieldExtent()` now derives the size from the outermost coin, and
      a test asserts containment.
- [x] Removed the "פיזור מחדש" (⟳) button: placement is deterministic, so
      recomputing produces the identical field and the button had nothing left
      to do. Stage 6 puts the zoom controls in its place.

- [x] **The seating must not depend on anything a coin can write back.**
      Found the hard way, in the browser — see the box below. `rankCoins` reads
      `already` and `pl`; the coin components write to exactly those through
      `bind:already` / `bind:noofusersOk` as they initialise. So the layout is
      computed in two steps: `seating` (id → seat) is recomputed only when the
      **set of ids** changes and runs the ranking inside `untrack`, and `placed`
      then maps the **current** items onto those stable seats on every change.
      Fresh data, stable seats, no feedback edge.
- [x] The field now opens **on the heart**. The old centring was a
      `setTimeout(…, 300)` from `onMount` racing a field whose size is derived
      from data that had not arrived: measured on the real heart, it left the
      scroll at (143, 216) where the centre was (598, 965) — the member landed
      in an empty corner of a 2465×2465 field and saw two coins. It now waits
      for the size to settle, once, and re-centres on resize.

> ### The loop this stage walked into, and what it costs
>
> The first browser run of the new layout **pegged the main thread and the page
> never finished loading**. Cause: deriving the seats straight from `arr1` made
> the layout depend on `already`/`pl`, which the coins write back through
> `bind:` while they mount — child writes → ranking invalidates → the keyed
> `{#each}` re-renders → child mounts again → writes again. At 137 coins that
> never settles. (Symptom, for the next person: CDP `Runtime.evaluate` timing
> out at 45 s, three times running; instant again once the dependency was cut.)
>
> The old ring loop was immune **by accident** — it only ever read
> `arr1.length`. Any future work here inherits the same hazard, so the rule is:
> **nothing that decides layout may read a field a card binds to.** Stage 3
> removes the `bind:`s along with the coin-mode branches, which retires the
> hazard rather than dodging it.

*Acceptance:* an idle field does **zero DOM writes** per clock tick — the layout
still recomputes but returns identical numbers. Verified in the browser on a
137-coin heart: `MutationObserver` over the whole field subtree recorded **0**
attribute and childList mutations in 6 s, and the field measured 2465×2465,
exactly what `fieldExtent` predicts for 137 coins at `size` 125. Static gates:
`npm run check` **1474** errors, down 2 from the 1476 baseline (the two dead
`orders = checkLines(…)` type errors are gone) and no new one; `newcoinui`'s own
error count 18 → 16; `npm test` 47 failures, the same pre-existing ones, +23
passing; `check:i18n` and `check:script` clean.

### Stage 2 — `LevCoin.svelte`: a coin you can actually read ✅ *(done 2026-08-25)*

Built from what `LevRow` already uses, so a coin, a row and a card describe the
same object in the same words. Landed together with Stage 3 — see the box at the
end of Stage 3 for why the two could not be separate commits.

- [x] **Always-visible label**, never hover-only: the kind cap (`rowKindKey`),
      `rowContent`'s title clamped to two lines, and one meta line. Text is
      ordinary HTML inside the circle with `overflow: hidden` and
      `overflow-wrap: anywhere` — **no SVG `<text>`, hence no `letters()`**, so
      RTL is the browser's job and a single unbreakable word can no longer push
      the circle open (`טקסטים שבולטים מהמקום`, the original sin).
- [x] **The ring carries the state**: `kindAccent` for the hue, through the
      `oklch` lightness clamp `LevRow` already applies, and a conic gradient for
      the timegrama.
      - The arc's denominator is the rikma's own `restime` — the clock every
        consent flow already runs on — in the new pure module
        `coins/coinArc.ts` (9 tests). An item with **no** restime falls back to
        the *longest* one (a week), never the shortest: guessing long is the
        direction that cannot mislead.
      - An item with no timegrama at all draws a plain unfilled band rather than
        an empty arc. **Absent and expired must not look the same.**
- [x] **Actionable coins are visibly different** (`rowIsActionable`): full
      accent, a 5px ring and the coloured bloom. A settled one drops to a 3px
      grey ring, grey ink and 0.62 opacity. Measured live: 97 actionable, 40
      settled, and the difference reads at a glance.
- [x] **Size**: a three-step `S / M / L` control in the field's chrome,
      persisted per browser as `lev:coinSize` (`levStores.ts`). 96 / 124 / 160px
      on desktop, ×0.84 on a phone. Type scales with the diameter
      (`clamp(11px, size/8.6, 16px)`), so **L is a bigger word, not just a
      bigger circle** — 16px titles, against the 8–10px this view was shelved
      over. The kind cap and the meta line are floored at 10px, which is exactly
      what `LevRow` gives the same two labels.
      - *Deviation, deliberate:* the control sits at `bottom: 7.5rem`, not in the
        corner. Measured on the real page, the bottom-right corner is already
        occupied by the demand map's chip and the accessibility button — and the
        old ⌘ button had been sitting on top of both.
- [x] Every string through `$t()`. The coin's own text added **no** new keys —
      `lev.list.kind.*`, `.fact.*`, `.time.*` and `.cta.*` already existed in all
      five locales. The *chrome* needed four: `lev.coins.center` and
      `lev.coins.size.{label,s,m,l}`, added to he/en/ar/ru/es, which also retires
      the hard-coded Hebrew `title="חזרה למרכז"` from §1.7.
      `rowContent.test.ts` now asserts those four, and the nine
      `lev.list.time.*` keys the coin shares with the row, in every locale.
- [x] `<button>` rather than `<div onclick>`, so role and tabindex come for free,
      plus an `aria-label` that says the whole sentence: kind · title · rikma ·
      time left · what it wants.

*Acceptance — verified in the browser on the owner's own 137-coin heart:*

| | measured |
|---|---|
| coins with an empty title | **0** (he **and** en) |
| coins with no `aria-label` / unfocusable | **0 / 0** |
| DOM order | inside-out, nearest the heart first — so tab order is urgency order |
| kind-cap contrast on the coin surface | **5.65 – 7.36:1** across the ten kinds present |
| all eight accent tokens, clamped | **5.65 – 7.95:1** (raw: 1.27 – 6.29, five of eight failing AA) |
| title / meta / settled-grey / urgent-red | 17.24 · 7.34 · 4.70 · 6.29:1 |
| nearest pair of coin centres | 144px at a 124px diameter (ratio 1.16) — **no overlap** |

`npm run check:i18n` and `npm run check:script` both pass.

> ### Two things about a circle, learned by filling one
>
> A disc is a hostile text box: at the default 124px the usable band is about
> 89px wide and three lines tall. That is the budget, and the plan's "kind +
> title + the `rowCtaKey` verb + the clock" is four things. So the fourth
> resolves by information value: **the clock if there is one, else the kind's
> headline figure, else the verb.** The verb is never lost — it is in the
> accessible name, and the card is one tap away — and actionable-ness is carried
> by the ring and the bloom rather than by a word.
>
> The project logo is a **watermark at 0.14 opacity**, not the coin's face. At
> full strength it is the one thing on a coin that can put arbitrary contrast
> behind the title; at watermark strength a fully black logo still leaves the
> title above 10:1, and it is still enough to find "the ones from that rikma" by
> eye.

### Stage 3 — tap a coin → the real card, once ✅ *(done 2026-08-25)*

- [x] Tapping a coin opens `LevCard` in a sheet over the field. The sheet was
      **lifted out of `LevList` into `lev/LevSheet.svelte`**, and both cheap
      views now mount the same one — back button, backdrop, Escape, drag-down.
      - *Deviation from the draft, deliberate:* it is `lev/LevSheet.svelte`, not
        `coins/CoinSheet.svelte`. It is not a coin thing — the list had it first
        — and a second copy of a history-entry dance is a second chance for the
        Android back gesture to behave differently in one of the two views.
      - The history entry now belongs to the **sheet's own lifetime**: pushed on
        mount, popped on unmount. A host only mounts and unmounts, so the entry
        and the overlay cannot drift apart, which is what an `open()`/`close()`
        pair on the caller invites.
- [x] **`delo()` is gone.** It spliced the `$bindable` `arr1` in place and
      reassigned it — mutating the page's own array behind the store's back
      (§1.8.1). A finished card now closes the sheet, pops the coin, and calls
      `onStart`, which is the page's existing optimistic removal.
- [x] **The pop** (decided): a coin bursts when it is **decided — approved *or*
      rejected**. It fires from exactly one place, a card reporting itself
      finished, so it cannot go off for a coin that merely disappeared: a filter
      change, a project filter, a refetch that dropped it, or a view switch.
      Burst = a ghost at the coin's last position, scaling and fading over 700ms,
      plus `confettiStore.trigger()`; then the field closes ranks behind it via
      the Stage 1 FLIP.
      - Under `prefers-reduced-motion` the ghost fades over 240ms and no confetti
        fires.
      - One at a time: the trigger is guarded on `$confettiStore` already being
        up. That store is a single global flag with an 11s reset, so a second
        `trigger()` would cut the running animation short rather than add to it.
      - *Verified by wiring, not by a live vote:* the burst's scoped keyframes
        and the `.burst` rule that references them were confirmed in the page's
        CSSOM. Actually watching one pop needs a real vote on the owner's real
        heart, which is not a thing to do from a test pass.
- [ ] The `{#if cards == false}` branches inside the 12 giant components are now
      **unreachable** — nothing renders a card in coin mode any more — but they
      are still in the files. Deleting them, and `swiper` with them, is Stage 7.

*Acceptance — measured in the browser on the same 137-coin heart:*

| | before | after |
|---|---|---|
| Swiper instances in the coin view | 129 | **0** |
| DOM nodes on the page | 31,540 | **4,297** (≈31 per coin, was ≈230) |
| heavy card components mounted | one per coin | **1**, and only while a coin is open |
| open→close 20 coins in a row | "נתקע אחרי כמה לחיצות" | node count **4,298 → 4,298**, never more than one sheet, `history.length` unchanged |
| DOM mutations in 7s of an idle field | — | **2** — two countdowns crossing a boundary. The coins render text clocks now, so this is the floor, not a regression on Stage 1's zero |

> ### Why Stages 2 and 3 are one commit
>
> They cannot ship apart. The old coins *were* the card components, so the tap
> handler lived inside them; replacing the coin face without replacing the
> expanded state leaves a field of pretty circles that do nothing when touched.
> Either both land or neither does.

### Stage 4 — full coverage, enforced by a test — *mostly absorbed by Stage 2*

Coverage stopped being a stage's worth of work the moment the coin became
generic. `LevCoin` never branches on `ani`; it reads `rowContent`, `rowKindKey`,
`kindAccent`, `rowTimegrama`, `rowIsActionable` and `rowCtaKey`. There is no
per-kind table left to go stale.

- [x] Every kind in `RENDERABLE_ANIS` renders a coin, including the nine that had
      none (`sale`, site-share income, `buy`, `wishoffer`, `sitesharepay`,
      `sitesharedecide`, `stipend`, `stipendpay`, `stipendconfirm`) — by
      construction, not by nine new branches. Confirmed live: 15 distinct kind
      labels on the owner's heart, in both he and en, none blank.
- [x] `archObject` stops rendering `ArchiveObjectCard` inside a round div — it is
      an ordinary coin like everything else, and the card is what the sheet
      mounts.
- [x] Money kinds carry a figure: `rowFacts`' first chip is the coin's meta line
      when there is no clock (`Price 5,790`, `value 221.03`, `qty 1`).
- [x] The enforcement test the plan asked for **already exists** and did not need
      writing: `rowContent.test.ts` walks `RENDERABLE_ANIS` and asserts, per
      kind, a non-empty title, a resolvable `kindKey`, a resolvable CTA, a real
      accent, and that every fact key exists with a `{{value}}` placeholder — in
      all five locales. Since those are precisely the fields the coin renders,
      **a kind that would land coin-less already fails CI.** It gained the
      `lev.list.time.*` and `lev.coins.*` keys this stage introduced.
- [ ] Still open, and genuinely cosmetic: a voter-strip of dots on consent kinds.
      A tally (`3/7`) is what `LevRow` shows; whether a 124px disc has room for
      either is an open question, and the answer may be "no, that is what the
      card is for".

### Stage 5 — one filter, three views ✅ *(done 2026-08-25, bar one decision)*

Two of these were not optional once the coins became a keyed `{#each}`:

- [x] **Gate every coin through `isCardVisible(item, milon)`.** The old markup
      carried a per-branch `milon.x == true`, and with the branches gone there
      was no gate left. This also fixes the `vidu → desi` mismatch of §1.5 by
      construction: one predicate, three views.
- [x] **De-duplicate by `coinlapach`**, like the deck does. This stopped being
      cosmetic when the `{#each}` became keyed — a double-delivered socket update
      used to paint the same coin twice; now it would throw.
- [x] The coin view uses `cards/filter.svelte` and the same `milon` store as the
      deck and the list, reached from two icon buttons in the field's chrome.
      The inline all-true `milon` **literal** the lev page was passing is gone
      with it — that was the other half of the same bug: the coin field had a
      filter map of its own that no other view could see, that no deep link
      could pre-set, and that reset itself on every view switch.
- [x] `midi.svelte`'s 14-branch `if/else` is gone. The diamonds still filter,
      but each one now derives the string it sends back from the shared `milon`
      (`soleKey === key ? 'true' : key`), so picking a kind in the strip arms
      the matching diamond to clear it and the other way round. `disp()` is four
      lines; the fourteen `$state` strings and a stray `console.log` went with
      the branches.
- [x] Added the project filter the other two views have.
- [x] **Fixed in passing, and it was the reason the shared panel was unusable:**
      both the kind counts and the project chips were computed off
      `finalSwiperArray`, which is *already* filtered. So picking a kind dropped
      every other kind's count to zero and its tile off the strip — you could
      clear the filter but never move from one kind to another — and picking a
      project left exactly one chip, with no way back to "all". `levDerived.ts`
      now exports `mergedFeed` (merged and sorted, before either filter) and the
      panel counts off that; the kind tiles still honour the project filter,
      because the two filters are orthogonal. Verified live: with a kind filter
      active all ten tiles are still offered with their true counts, and with a
      project filter active the project button is still there.
      - Two debug `console.log`s went with it, one of which dumped the **whole
        feed** — and sorted it a second time to do so — on every recompute.
- [x] Switching view keeps the filter *and* keeps you on the same item.
      `deckPosition` stops being the deck's private memory and becomes the
      heart's: the list and the coin field both `rememberCard` on open, the list
      scrolls that row into view on arrival, and the field opens centred on that
      **coin** rather than on the heart.
- [x] **Fixed in passing: the field was not opening on the heart**, which Stage 1
      believed it had fixed. Two causes, and the second explains the first.
      *One:* it centred once, on the first frame that had a coin — but the page
      streams the urgent kinds in first, so the field keeps growing and that aim
      is stale. It now re-aims on every size change and stops the moment the
      member touches the field. *Two, and this is the one worth remembering:*
      `scrollTo({ behavior: 'auto' })` does **not** mean "jump" — it means
      "defer to CSS", and `.coin-container` sets `scroll-behavior: smooth`. So
      every automatic centring started a ~700px animation that the next one
      restarted from wherever it had crawled to. Stage 1's measured "(271, 576)
      where the centre was (324, 719)" was not a stale aim at all; it was an
      animation caught in flight. Automatic centring is `'instant'` now; the ⌘
      button still asks for `'smooth'`, because there the movement is the point.
- [ ] **The view is the member's choice, remembered** (decided). `levView`
      already persists per browser, and opening a coin or a row now leaves you
      where you were when you switch. What is still open is the **first-visit
      fallback**, which today is a performance decision — `list` on a phone,
      `cards` on desktop (`initialLevView()`, `levStores.ts`) — and, as of
      Stage 3, no longer a true one. Owner's call. Promoting the preference to
      the account is explicitly out of scope.

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

The "today" column was measured in Stage 0 on the owner's own heart (137 coins,
1270×536); the "now" column on the same heart after Stage 3.

| | today (stage 0) | target | now |
|---|---|---|---|
| Swiper instances | 129 (one per coin) | 0 | **0** |
| heavy card components mounted | one per coin | 1 (the open sheet) | **1**, only while open |
| DOM nodes | 31,540 (~230/coin) | ~1 small subtree per *visible* coin | **4,297** (~31/coin) |
| layout work per clock tick | full re-place of every coin | none | **none** — deterministic, identical numbers |
| timers | shared clock + `mid.svelte`'s stray interval | shared clock only | **shared clock only** |
| pan | reflow of n absolutely-positioned elements | one composited transform | still n — **Stage 6** |

Virtualization was in the plan for Stage 6 and is worth re-costing before it is
built: 31 nodes per coin means 200 items is ~6,200 nodes, which a phone renders
without help. The remaining Stage 6 win is the *pan*, not the node count.

## 5. How to verify (the same commands every stage)

```
npm run check        # svelte-check
npm test             # vitest, includes cardKinds + coinLayout
npm run check:i18n   # no silently-empty $t() on /lev
npm run check:script # no mixed-alphabet glyphs in the new strings
```

**Two of these are not clean on this branch, so read them as a delta, not as a
pass/fail.** Baseline recorded at the end of Stage 0 (2026-08-25):

| command | baseline | what "green" means here |
|---|---|---|
| `npm run check` | **1476 errors**, 1365 warnings, 9043 files → **1457** after Stage 3 → **1445** after Stage 5 | no *new* error, and none on a line the stage touched. 18 of those errors were in `newcoinui.svelte` — its prop wiring was never typed. Stage 3 retired 17 of them the intended way, by deleting the wiring rather than by adding `@ts-ignore`; the one left is `sml` on `<Mid>`, which Stage 6 touches. |
| `npm test` | **47 failures in 10 files** (incl. `levDerived`, `levDataLoader`, `levDataExtractors`, `TaskApprovalButton`, and the action-registry suites) | no *new* failure. Still exactly 47 after Stage 5. These are unrelated to the coins and predate this plan; whoever fixes them should do it in its own commit. |
| `npm run check:i18n` | **clean** — 52 namespaces × 5 locales, 19 route-gated | must stay clean. This is the one that catches a coin rendering an empty string. |
| `npm run check:script` | clean | must stay clean. |

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
