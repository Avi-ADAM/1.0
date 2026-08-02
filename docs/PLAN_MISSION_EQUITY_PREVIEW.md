# PLAN — Mission Equity Preview (שווי צפוי בריקמה)

> **Round 2 (2026-07-30) — resources + the donut.** Owner request: do for
> **משאבים** what was done for missions, and add an interactive pie chart beside
> the textual rows. Both are implemented; see §9 for what changed and §4.1 for the
> chart. In short: the rikma summary now counts resources too
> (`mashabetahaliches` in the approved/monthly buckets, `open_mashaabims` in the
> pipeline), the preview takes a `subject` prop that switches the wording to
> resources, `EquityPie.svelte` draws any scenario/horizon row as a donut, and the
> resource surfaces (`availiableResorce/[id]`, `ResourceCreator`, `negoPend`,
> `dowegeot`) carry the widget the way the mission ones do.

> Status: **implemented (steps 1–8, all phases)** — pure math module + tests,
> `getProjectValueSummary` qid + dedup cache, the reusable `EquityPreview`
> component (he/en/ar/ru), and all wired integration points: lev cards
> (sugestmi/sugestma + parents), the public availableMission page, the mission
> creation form + nego dialog, and the moach in-progress reward column. Phase 4
> (₪/month estimate) is included: `computeMonthlyIncome` averages effective
> sales over a trailing 6-month window and falls back to monthly commitments,
> surfaced per baseline row with the matching disclaimer.
> Owner request (2026-07-07): show candidates a *realistic* picture of the share
> (%) they will hold in a rikma if they complete a suggested mission — both
> against the rikma's **current** value and against **all already-approved
> missions** (optionally also the whole open pipeline). Must be built as a
> reusable mechanism: the lev cards are the first consumer, the
> `availableMission/[id]` page and the moach (member-facing) surfaces come next.
> Members should also see, at **creation time**, what share a new mission will
> represent, and on a mission **they are executing** what the reward share will
> be. Optional extension: translate the % into estimated ₪/month from past
> sales data or standing commitments.

---

## 1. Domain background (verified in code)

### 1.1 How rikma value is computed today

The split page ([split/+page.svelte](../src/routes/(reg)/moach/[projectId]/split/+page.svelte))
loads `getProjectFinancials` (qid in [qids.js:8759](../src/routes/api/send/qids.js))
and feeds [hachcal.svelte](../src/lib/components/prPr/hachcal.svelte) /
[fini.svelte](../src/lib/components/prPr/fini.svelte):

```
rikma current value ("net") =
    Σ finnished_missions[].attributes.total      (completed missions)
  + Σ rikmashes[].attributes.total               (accepted shared resources)

member share % = member's Σ total / net × 100
```

This is the authoritative existing formula — the new module must reproduce it
exactly for the "current value" scenario so numbers on the lev card and the
split page never disagree.

### 1.2 Entities involved (see `src/generated/STRAPI_SCHEMA_REFERENCE.md`)

| Entity | Meaning | Value contribution |
|---|---|---|
| `FinnishedMission` | completed mission | `total` (already trusted, has `users_permissions_user`) |
| `Rikmash` | accepted shared resource | `total` |
| `Mesimabetahalich` | **approved** mission in progress | `hoursassinged × perhour` (no `total` field) |
| `OpenMission` | published, not yet taken | `noofhours × perhour` |

"כל המשימות שכבר אושרו" = `Mesimabetahalich` with `finnished ≠ true` (and
`forappruval ≠ true`, matching the filter used elsewhere in qids, e.g.
qids.js:276). "אלו שיאושרו" (optional scenario) = open missions still on offer.

### 1.3 Where the candidate-side numbers live

- [sugestmi.svelte](../src/lib/components/lev/cards/sugestmi.svelte) (suggested
  mission card) shows `perhour × noOfHours`; when a nego round exists the
  effective terms are `myRound.noofhours ?? noOfHours` and
  `myRound.perhour ?? perhour` (see its "חישוב שכר" block).
- [sugestma.svelte](../src/lib/components/lev/cards/sugestma.svelte) (suggested
  resource card) — the value on the table is `myRound?.easy ?? easy` (asked
  value); for `recurring` resources the card already derives `recurTotal =
  perCycle × cycleCount` (may be `null` when open-ended).
- Parents that render these cards:
  [projectSuggestor.svelte](../src/lib/components/lev/projectSuggestor.svelte)
  (has `projectId`) and
  [mashsuggest.svelte](../src/lib/components/lev/mashsuggest.svelte).
  **Neither card currently receives `projectId` — it must be passed down.**
- Public mission page: `src/routes/(regandnon)/availableMission/[id]/` (loads
  qid `51GetOpenMissionById`; note this route can be visited **logged-out**).
- Mission creation form: [addNewMission.svelte](../src/lib/components/addnew/addNewMission.svelte)
  (+ nego dialog [negoM.svelte](../src/lib/components/prPr/negoM.svelte) where
  terms change during negotiation).
- Member's in-progress missions: [mission.svelte](../src/lib/components/prPr/mission.svelte)
  (moach missions tab).

---

## 2. The math (single source of truth)

New pure module, mirroring the `src/lib/revenue/` pattern (pure + vitest):

**`src/lib/equity/computeMissionEquity.ts`** (+ `computeMissionEquity.test.ts`)

```ts
export interface ProjectValueSummary {
  /** Σ finnished_missions.total + Σ rikmashes.total — matches split page */
  currentValue: number;
  /** Σ mesimabetahalich(finnished≠true, forappruval≠true) hoursassinged×perhour */
  approvedInProgressValue: number;
  /** Σ open_missions (noofhours×perhour) — the still-open pipeline */
  openPipelineValue: number;
  /** Σ the recurring (iskvua) slice of the in-progress bucket — ₪/month (§2.1) */
  recurringMonthlyValue: number;
  /** trailing monthly income estimate, null when no data (phase 4) */
  monthlyIncomeEstimate: number | null;
}

export type EquityBaseline = 'current' | 'approved' | 'pipeline';

export interface EquityScenario {
  baseline: EquityBaseline;
  /** denominator used (before adding the mission itself) */
  base: number;
  /** 0..100 */
  sharePct: number;
  /** ₪/month = sharePct × monthlyIncomeEstimate, null when no estimate */
  monthlyEstimate: number | null;
}

export function computeEquityScenarios(
  summary: ProjectValueSummary,
  missionValue: number,
  opts?: {
    /**
     * 'none'      — mission is new (candidate / creation form): add its value
     *               to every denominator.
     * 'approved'  — mission is already inside approvedInProgressValue (member
     *               viewing a mission they're executing): do NOT add it again
     *               to the 'approved'/'pipeline' baselines.
     * 'pipeline'  — mission is one of the open_missions (availableMission
     *               page, lev card): do NOT add it again to 'pipeline'.
     */
    alreadyCountedIn?: 'none' | 'approved' | 'pipeline';
  }
): EquityScenario[];
```

Formulas (dilution model — "אם המשימה הייתה מושלמת היום"):

```
current  : share = V / (currentValue + V)
approved : share = V / (currentValue + approvedInProgressValue + V*)
pipeline : share = V / (currentValue + approvedInProgressValue + openPipelineValue†)
```

`V*`/`†` — omit the extra `+ V` when the mission is already counted inside that
baseline (see `alreadyCountedIn`). Edge cases that MUST be unit-tested:

1. Empty rikma (`currentValue = 0`, no pipeline) → share = 100%.
2. `missionValue = 0` or negative/NaN inputs → share 0, no crash.
3. `alreadyCountedIn: 'pipeline'` — lev card mission is one of the open
   missions, so the pipeline scenario must not double-count it.
4. Nego round overrides (`myRound`) change V, not the summary.
5. Monotonicity: `current ≥ approved ≥ pipeline` share (each baseline only
   grows the denominator).

Percent formatting helper: `formatSharePct(pct)` → `<0.1%` floor, 1 decimal
otherwise (avoid "0.0%").

### 2.1 Recurring missions — `computeEquityHorizons`

A **monthly** mission (`iskvua: true`) has `noofhours × perhour` as *one month's*
value, so the single-shot scenarios above price only the first month. With no end
date the member keeps accruing, and the honest question is where it lands after
1 / 2 / 5 years (`HORIZON_MONTHS = [12, 24, 60]`).

Both sides of the fraction must grow:

```
share(N months) =        monthlyValue × N
                  ───────────────────────────────────────────
                  currentValue + oneOffApproved + rikmaMonthly × N

oneOffApproved = approvedInProgressValue − recurringMonthlyValue   (lands once)
rikmaMonthly   = recurringMonthlyValue (+ monthlyValue unless already counted)
```

Growing only the numerator — the "rikma stays frozen for five years" model —
marches every projection to ~100% and is worthless. Growing both makes the
series converge on `monthlyValue / rikmaMonthly`: the mission's share of the
rikma's **flow** rather than of its stock, approached from below and never
reached. That ceiling is the property worth asserting in tests.

`recurringMonthlyValue` is the `iskvua` slice of `mesimabetahaliches` (so the
qid selects `iskvua`) **plus** every active recurring-resource engine's ₪/month
(§9.1), i.e. the rikma's standing monthly value flow.

UI-wise the component takes `monthlyValue` separately from `missionValue`, so a
non-monthly cycle (a yearly recurring resource in `sugestma`) can pass a cycle
as V and a twelfth of it as the monthly figure. The horizon block states its
assumptions in visible text: the mission keeps running, and the rikma keeps
accruing at today's recurring rate.

---

## 3. Data layer

### 3.1 New qid — `getProjectValueSummary` (in `src/routes/api/send/qids.js`)

Lightweight, fetches only what the math needs:

```graphql
query GetProjectValueSummary($pid: ID!) {
  project(id: $pid) {
    data { id attributes {
      finnished_missions(pagination: { limit: -1 }) { data { id attributes { total } } }
      rikmashes(pagination: { limit: -1 })          { data { id attributes { total } } }
      mesimabetahaliches(
        filters: { finnished: { ne: true }, forappruval: { ne: true } }
        pagination: { limit: -1 }
      ) { data { id attributes { hoursassinged perhour } } }
      open_missions(pagination: { limit: -1 })      { data { id attributes { noofhours perhour } } }
      sales(pagination: { limit: -1 })              { data { id attributes { in date splited pending } } }
    } }
  }
}
```

⚠️ Gotchas (verify while implementing):

- **Strapi default page size is 10** — every collection above must carry
  `pagination: { limit: -1 }` (pattern already used at qids.js:5739). Without
  it the totals will silently be wrong on any real rikma.
- Check whether `open_missions` needs a "still open" filter (e.g. exclude
  taken/closed ones — inspect how the lev query filters open missions and
  mirror it). If open missions are deleted/closed on acceptance, no filter is
  needed.
- `getProjectFinancials` fetches `finnished_missions` **unfiltered** while two
  other qids filter `isNotFinished: { eq: true }` (qids.js:6342). Match
  `getProjectFinancials` (unfiltered) — that is what the split page shows.
- The `availableMission` route is **public** (`(regandnon)`). The qid must be
  callable with the server token (`sendToSer(..., isSer=true)`) exactly like
  `51GetOpenMissionById`; confirm the public role can read these collections,
  and degrade gracefully (hide the widget) if not.
- `sales` is only needed for phase 4 — omit the field until then to keep the
  payload minimal.

### 3.2 Client cache — `src/lib/equity/projectValueStore.svelte.ts`

Small module-level cache so N cards on the lev page don't fire N identical
queries:

```ts
getProjectValueSummary(projectId: string, fetchFn = fetch): Promise<ProjectValueSummary>
```

- Map keyed by `projectId`, stores the resolved summary **and** the in-flight
  promise (dedup concurrent callers — several cards from the same rikma render
  together).
- TTL ~5 minutes; expose `invalidateProjectValue(projectId)` for future use
  after mission approval.
- Maps the GraphQL payload → `ProjectValueSummary` (a pure `summarize()`
  function that also lives in `computeMissionEquity.ts` so it's unit-testable
  with fixture payloads; treat `null`/missing numbers as 0).

---

## 4. UI — reusable component

**`src/lib/components/equity/EquityPreview.svelte`** (Svelte 5 runes)

Props:

```
projectId            — required for self-fetching mode
missionValue         — number (the V of §2)
alreadyCountedIn     — 'none' | 'approved' | 'pipeline' (default 'none')
summary              — optional preloaded ProjectValueSummary (skips fetch;
                       used by the creation form which may already have data)
compact              — boolean; compact=true renders a single-line chip,
                       expanding on click to the full breakdown
onHover              — optional (id)=>void passthrough so the lev cards can
                       feed their hover-hint mechanism
```

Behavior:

- On mount (or when `projectId`/`missionValue` change) fetch via the cache
  store; render nothing while loading fails silently (the card must not break
  if the query errors or the viewer lacks read access).
- Displays 2 rows (+1 optional):
  1. **לפי השווי הנוכחי** — `sharePct` against `currentValue` (with the raw
     numbers: `V / (base+V)`).
  2. **כולל משימות שאושרו ובביצוע** — against `currentValue +
     approvedInProgressValue`.
  3. **(מוצג רק כשקיים pipeline)** collapsed "אם יאושר הכל" row for the open
     pipeline scenario.
- Each row shows: label, bold %, and muted `(שווי משימה X מתוך Y)` detail.
- Phase 4 adds a `≈ ₪N בחודש` suffix per row when `monthlyIncomeEstimate` is
  available. The `≈` is part of the string in every locale — the money figure
  must never render as a bare number.
- **The estimate note is visible text, not only a tooltip.** A `title=` is
  invisible on touch, and the ₪ figure is the one number a reader can mistake
  for a promise. A footer line inside the card states, explicitly: that the
  amount is approximate (`≈`), *what* it was computed from (the rikma's income
  over the last `INCOME_WINDOW_MONTHS` months, or its standing monthly
  commitments), and that **it can change**. Shown only when there is an
  estimate at all. Keep the wording neutral — "may change", not "for better or
  worse": the note describes the number's basis, it does not editorialise
  about the rikma's prospects.
- Styling: follow the existing card idiom (rounded-xl, `bg-gray-100
  dark:bg-slate-800`, gold/barbi accents). Keep it visually smaller than the
  שכר block — it's supporting info, not the headline.
- **i18n: JSON + `$t()` only** (no inline `_ui` objects). Register a new
  `equity` namespace in `src/lib/translations/index.js` for **all four
  locales** (he/en/ar/ru → `src/lib/translations/<loc>/equity.json`), loaded
  globally (no `routes:` restriction — it's used on lev, moach and
  availableMission routes). Keys: `title`, `baselineCurrent`,
  `baselineApproved`, `baselinePipeline`, `ofTotal`, `perMonthEstimate`,
  `estimateNote`, `estimateNoteCommitments`, `yourShareIfDone`,
  `missionShareAtCreation`.

---

## 5. Integration points

### 5.1 Lev cards (first delivery)

- **sugestmi.svelte** — add `projectId` prop; render `<EquityPreview>` directly
  under the "חישוב שכר" block with
  `missionValue = (myRound?.noofhours ?? noOfHours) * (myRound?.perhour ?? perhour)`
  and `alreadyCountedIn="pipeline"`, `compact` on mobile. Pass the card's
  `hover` fn through `onHover`.
- **sugestma.svelte** — same placement under the שווי block.
  `missionValue = Number(myRound?.easy ?? easy) || 0`; for `recurring`
  resources use `recurTotal ?? perCycle` (open-ended recurring gets the
  per-cycle value + the existing ♾️ caveat). `alreadyCountedIn` = `'none'`
  (open resources are *not* in `open_missions`).
  - ⚠️ Verify which field lands in `Rikmash.total` on acceptance (check the
    accept action, e.g. `askm.svelte` finalizer / `createRikmash`-style config
    in `src/lib/server/actions/configs/`) and use the same field as V so the
    preview matches post-acceptance reality. If it turns out to be `price`
    (accepted value) rather than `easy`, use that.
- **Parents:** pass `projectId` from
  [projectSuggestor.svelte](../src/lib/components/lev/projectSuggestor.svelte)
  and [mashsuggest.svelte](../src/lib/components/lev/mashsuggest.svelte) into
  the cards (both already hold it). Concierge-sourced open missions have **no
  project** (see applyToMission handling of missing `projectId`) — the card
  must simply not render the preview when `projectId` is falsy.

### 5.2 availableMission/[id] (same mechanism, if cheap — do in same run)

In `src/routes/(regandnon)/availableMission/[id]/+page.svelte`, render
`<EquityPreview projectId={alld.attributes.project?.data?.id} missionValue={noofhours*perhour} alreadyCountedIn="pipeline" />`
near the mission value display. Works logged-out only if §3.1 public-role check
passes; otherwise it hides itself.

### 5.3 Creation-time preview (member creating a mission)

In [addNewMission.svelte](../src/lib/components/addnew/addNewMission.svelte):
live `<EquityPreview>` bound to the form's current `hours × perhour`
(`missionValue` is `$derived`), `alreadyCountedIn="none"`, label
`missionShareAtCreation` ("כמה מהריקמה תהיה שווה המשימה הזו"). Debounce is not
needed — the summary is fetched once, only the pure math re-runs on keystroke.
If the same form is reused for editing an existing open mission, keep
`alreadyCountedIn="pipeline"`.

### 5.4 Member's in-progress mission ("מה יהיה התגמול בשווי בריקמה")

In [mission.svelte](../src/lib/components/prPr/mission.svelte) (moach missions
tab, mesimabetahalich view): `missionValue = hoursassinged × perhour`,
`alreadyCountedIn="approved"` — the mission is already inside
`approvedInProgressValue`, so the 'approved' baseline must not add V twice.
Label: `yourShareIfDone` ("החלק שלך בריקמה בסיום המשימה").

### 5.5 Nego dialog (nice-to-have, same run if trivial)

[negoM.svelte](../src/lib/components/prPr/negoM.svelte) — live preview while
counter-proposing hours/perhour, same wiring as 5.3.

---

## 6. Phase 4 (optional extension) — ₪/month estimate

Goal: "לכמת כמה האחוזים שווים בכסף בחודש על סמך נתוני עבר או התחייבויות".

- Add `sales { in date }` to the summary qid. Compute in
  `computeMissionEquity.ts`:
  `monthlyIncomeEstimate = trailing average of Σ sales.in over the last 6
  calendar months` (skip months before the first sale; `null` when there are
  no sales at all).
- Commitments fallback: when there are no sales, sum monthly-recurring product
  commitments (`matanotofs` with `kindOf: 'monthly'` → `price`, yearly ÷ 12)
  as a weaker estimate — mark it distinctly in the UI ("לפי התחייבויות").
- Display: `sharePct × monthlyIncomeEstimate` per scenario row, always with
  the disclaimer key. **Counting rule:** include *all* sales regardless of
  `holderStatus`?— No: per the sale-holder-consent super-principle, count only
  **effective** sales (`holderStatus` in `self`/`confirmed`/null-legacy),
  matching balances/tosplits.

---

## 7. Execution order & acceptance criteria

| # | Step | Done when |
|---|---|---|
| 1 | `src/lib/equity/computeMissionEquity.ts` + tests | `npx vitest run src/lib/equity` green; edge cases of §2 covered |
| 2 | qid `getProjectValueSummary` + `projectValueStore.svelte.ts` | one network call per rikma per page view (verify in devtools with 2 cards of same rikma) |
| 3 | `EquityPreview.svelte` + `equity` i18n namespace (he/en/ar/ru) | renders both baselines with correct numbers on a seeded rikma |
| 4 | sugestmi + sugestma + parents pass `projectId` | lev card shows %; nego round (`myRound`) changes the % live; concierge cards (no project) show nothing and don't error |
| 5 | availableMission/[id] | works logged-in; logged-out either works or hides silently |
| 6 | addNewMission creation preview | % updates as hours/perhour typed |
| 7 | mission.svelte (in-progress reward) | 'approved' baseline does not double-count the mission itself |
| 8 | (opt) ₪/month estimate | only effective sales counted; disclaimer shown |

Cross-checks before finishing:

- Numbers agree with the split page for an existing rikma (pick one with
  finished missions + rikmashes and compare `currentValue` to hachcal's "net").
- `npm run check` (svelte-check) passes on touched files; run the svelte
  autofixer MCP on every new/edited `.svelte` file.
- No new voting/consent flow is introduced — this is display-only, so the
  Decision-model super-principle is untouched.

## 9. Round 2 — resources & the interactive donut

### 9.1 The rikma summary now counts resources

Until now `summarize()` looked only at missions, so a resource card was diluted
against a rikma whose resource half was invisible. Added to the
`getProjectValueSummary` qid and to `summarize()`:

| Source | Filter | Where it lands |
|---|---|---|
| `mashabetahaliches` (recurring-resource engines) | `finnished ≠ true`, `forappruval ≠ true`, `recurring = true` | `approvedInProgressValue` **and** `recurringMonthlyValue`, as ₪/month |
| `open_mashaabims` (open resource requests) | `archived ≠ true` | `openPipelineValue`, as planned value |

- **Engines are pure flow.** A `mashabetahalich` has no `total` — it bills a cycle
  at a time and each approved cycle is archived onto a `Rikmash` (which is already
  inside `currentValue`). So it enters as `pricePerUnit / (cycleSize × 12 if
  yearly)`: one month's worth in the stock *and* the same figure in the flow.
  That keeps `recurringMonthlyValue ⊆ approvedInProgressValue`, which the horizon
  math depends on (`oneOffApproved = approved − recurring`), and matches how an
  `iskvua` mission is counted. `pricePerUnit` is the whole cycle's planned spend —
  the default the cycle-approval flow reports — so it is **not** multiplied by a
  quantity.
- **Open resources are priced like the cards price them:**
  `computeResourceValue` = asked value (`easy`, else `price`) × quantity (`hm`) ×
  cycles, where cycles comes from the dated window (`resourceCycles`, the
  dependency-free twin of the `montsi()` UI helper). An **open-ended recurring**
  resource has no total at all, so it is priced at a single cycle and the horizon
  rows carry the long-run picture.
- Consequence for missions: the `pipeline` baseline ("if everything open is
  approved") now includes open resources, so its denominator grew. That is the
  honest number — the row's own label promises exactly that — and the
  `baselineApproved` copy was updated in all five locales to say *missions and
  resources*.

### 9.2 `subject` — the same widget, resource wording

`EquityPreview` takes `subject: 'mission' | 'resource'` (default `'mission'`),
which only picks between literal `$t()` keys: `ofTotal` / `ofTotalResource`,
`sliceMine` / `sliceMineResource`, and the callers choose their own `titleKey`
(`resourceShareAtCreation`, `yourShareIfGiven`). No branching on language, no
inline dictionaries — `npm run check:i18n` sees every key.

### 9.3 The donut — `src/lib/components/equity/EquityPie.svelte`

Two pure functions decompose the *same* numbers the rows show into slices:
`buildEquityBreakdown(summary, V, { baseline, alreadyCountedIn })` and
`buildHorizonBreakdown(summary, monthlyValue, months, opts)`. Both derive their
denominator from the shared `scenarioBase()` helper that `computeEquityScenarios`
uses, and the tests assert `Σ slices = scenario.base` and
`mine.pct = scenario.sharePct` — the chart cannot drift from the text. Slices are
`mine` · `existing` · `approvedOthers` · `pipelineOthers` (or `recurringOthers`
on a horizon), and the reader's own value is carved out of whichever bucket
already holds it so it is drawn exactly once. Slices are filled in order with the
last one absorbing the remainder, so even contradictory inputs (a mission
"already in the pipeline" worth more than the whole pipeline) shrink a
neighbouring slice instead of breaking the invariant.

UI rules the component keeps:

- **Text stays primary.** The rows above are the reading; the donut is an extra
  view of a row the reader picks (rows are buttons; the picked one is tinted, and
  a caption names the drawn scenario). Collapsible, open by default.
- **Colour** — one accent for `mine` (orange: light `#eb6834` / dark `#d95926`)
  and an ordinal blue ramp for the rest of the rikma, darkest = already earned →
  lightest = merely open, which is also the certainty order. Both modes are
  stepped and validated separately (CVD separation of accent-vs-every-step ≥ 23
  ΔE; the ramp passes the ordinal monotonicity/step/contrast checks against each
  surface). Dark values are declared under both `prefers-color-scheme` and
  `:root[data-theme='dark']` so the site's theme toggle wins either way.
- **Identity is never colour-alone.** The legend is also the table view — swatch,
  name, ₪ and % per slice — and it is the keyboard-accessible control (hover /
  focus highlights, click pins). The ring itself is `aria-hidden`, with a 2px gap
  between fills.

### 9.4 Resource surfaces wired

| Surface | V | `alreadyCountedIn` | Label |
|---|---|---|---|
| `lev/cards/sugestma.svelte` | accepted/asked value, or the recurring window | `pipeline` (open resources are in `open_mashaabims` now) | `equity.title` |
| `(regandnon)/availiableResorce/[id]` | `easy‖price × hm × montsi(…)`, one cycle when open-ended | `pipeline` | `equity.title` (public page ⇒ `isSer`) |
| `resource/ResourceCreator.svelte` | `totalMax` (the asked `easy`), live as the form is typed | `none` | `resourceShareAtCreation` |
| `prPr/negoPend.svelte` | `totalEasyNew` of the current counter-offer | `pipeline` | `resourceShareAtCreation` |
| `lev/cards/dowegeot.svelte` | reported/planned cycle spend, or the delivery total | `approved` for a recurring cycle, else `none` | `yourShareIfGiven` |

## 8. Explicit non-goals

- No persistence of computed shares anywhere (always derived live).
- No change to split/haluka math — read-only reuse of the same formula.
- No guarantee language in UI copy: everything is phrased as a projection
  ("אם המשימה תושלם היום"), since the share dilutes as the rikma grows.
