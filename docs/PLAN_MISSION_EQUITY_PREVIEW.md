# PLAN — Mission Equity Preview (שווי צפוי בריקמה)

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
  available, with an "אומדן לפי הכנסות העבר" disclaimer tooltip.
- Styling: follow the existing card idiom (rounded-xl, `bg-gray-100
  dark:bg-slate-800`, gold/barbi accents). Keep it visually smaller than the
  שכר block — it's supporting info, not the headline.
- **i18n: JSON + `$t()` only** (no inline `_ui` objects). Register a new
  `equity` namespace in `src/lib/translations/index.js` for **all four
  locales** (he/en/ar/ru → `src/lib/translations/<loc>/equity.json`), loaded
  globally (no `routes:` restriction — it's used on lev, moach and
  availableMission routes). Keys: `title`, `baselineCurrent`,
  `baselineApproved`, `baselinePipeline`, `ofTotal`, `perMonthEstimate`,
  `estimateDisclaimer`, `yourShareIfDone`, `missionShareAtCreation`.

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

## 8. Explicit non-goals

- No persistence of computed shares anywhere (always derived live).
- No change to split/haluka math — read-only reuse of the same formula.
- No guarantee language in UI copy: everything is phrased as a projection
  ("אם המשימה תושלם היום"), since the share dilutes as the rikma grows.
