# Currency Sweep — Implementation Plan (C8–C11)

> ## Status — updated 2026-11-19 (handover between agents)
>
> **This file is the working checklist. The rules and the toolkit are in
> [CURRENCY_SWEEP_BRIEF.md](./CURRENCY_SWEEP_BRIEF.md) — read it first. When
> the two disagree, the brief wins.**
>
> | Batch | State |
> |---|---|
> | 1 — moach | ✅ done (commit `67ef3d3c`, report: [batch1-report.md](./batch1-report.md)). Items 1, 2b, 7, 8 moved out (not moach-only), 9 deferred. |
> | 2 — heart / hub | 🔶 almost done (working tree, not committed — 27 files). Left: items **44** (`WishOfferCard`), **46** (`pending.svelte`), **47b** (`MissionStipendOffer`), **47c** (`BlueprintReview`). |
> | 3 — public pages, deals, concierge | ⏳ not started — includes items 7 and 8 (`OpenMissionCard`, `OpenResourceCard`). |
> | 4 — translations, server, mails, Telegram | ⏳ not started — also the `project.finisin.currency` key, unused since batch 1. |
>
> Measured after batch 2 (2026-11-19): audit = **69 files / 82 lines** (after batch 1: 88 / 132; baseline 96 / 142).
> `npm run check` = 1218 errors after batch 2 — same as the baseline (re-run 2026-11-19; every error in the batch-2 files is old type noise, none from the money changes). Money tests green.
>
> **Don't rewrite shorthand props to silence the audit.** The audit flags a
> shorthand prop on its own line (`{perhour}` inside `<Card … />`) as if it
> were rendered text. Batch 2 changed ~20 of these to `perhour={perhour}`, and
> added `<!-- fmt(price) -->` in `negoArchive`, purely to make the count drop.
> Both are harmless, but they're noise: just list such lines as false positives
> in the report. Also don't reformat files you touch (batch 2 reformatted most
> of `SaleCard` and `negoArchive`). A diff should show the money change and
> nothing else.
>
> **Don't commit.** The previous agent committed batch 1 against the brief, and
> that commit also swept in an unrelated file another session had staged
> (`PLAN_LTR_LAYOUT.md` moving to inprogress). Parallel sessions share the git
> index — leave changes in the working tree and let the human commit.

> Baseline: 142 bare-number lines across 96 files. `npm run check` = 1218 errors
> (pre-existing). `npm run check:i18n` = OK. Vitest money suite = 33 tests green.
>
> Run `node scripts/audit-money-display.mjs` and `npm run check` before every
> batch and after, and confirm the error count does not rise.

---

## Toolkit quick reference (don't import from anywhere else)

| Need | Use | Import |
|---|---|---|
| Amount in markup (moach context) | `<Money amount={x} />` | `$lib/components/money/Money.svelte` |
| Amount on lev/hub cards | `<Money amount={x} projectId={buble.projectId} />` | same |
| Amount in `$t()` / attribute / toast | `const fmt = useFormatMoney(); fmt(x, code)` | `$lib/money/context.svelte` |
| Currency symbol next to an input | `<CurrencySymbol currency={code} />` | `$lib/components/money/CurrencySymbol.svelte` |
| Currency code from project row | `rikmaCurrency(project)` | `$lib/money/resolve.js` |
| Server text in a rikma's currency | `const m = await rikmaMoneyText(projectId, jwt, fetch); m(amount, lang)` | `$lib/server/money/notifyMoney` |
| Server text with known code | `moneyTextFor(code)(amount, lang)` | same |

**Rule**: `hours × rate` → compute first, then wrap: `<Money amount={noofhours * perhour} />`.
A per-hour rate = `<Money amount={perhour} />` + `$t('common.perhour')`.

---

## Batch 1 — C8: moach components (context already provided)

> All files here render **only** under `src/routes/(reg)/moach/[projectId]/**`
> or inside a component that itself only renders in that route tree. The layout
> provides the currency context, so `<Money amount={x} />` with no extra props
> is correct. Use `fmtNum` only for non-money numbers (quantities, cycle counts).

### Pre-flight grep checks (one per component; if a component appears outside moach → move it to Batch 2)

Confirmed moach-only: `negoM.svelte`, `pendsM.svelte`, `openM.svelte`,
`newOpn.svelte` (renders `OpenMissionCard` internally), `mashmam.svelte`,
`finisin.svelte`, `SaleLifecycle.svelte`, `ProcessLifecycle.svelte`,
`MissionSummary.svelte`.

Confirmed **not** moach-only (move to Batch 2 treatment):
- `NegotiationHistory.svelte` — rendered by `lev/cards/pending.svelte` and
  `lev/cards/reqtojoin.svelte` (lev cards, needs `projectId` prop)
- `OpenMissionCard.svelte` — rendered by `newOpn.svelte` (moach, OK) but also
  by `prPr/open/OpenBoard.svelte` which is used outside moach; treat as C8+C9
- `OpenResourceCard.svelte` — same situation via `OpenBoard.svelte`
- `ProductChangesPanel.svelte` — receives a `money` function prop from
  `ProductForm.svelte` (outside moach); the prop already carries the amount
  string, so **no change needed here** — fix the caller instead
- `RikmaPreview.svelte` — rendered by `BlueprintReview.svelte` (assistant, inside
  moach's assistant panel) and by `routes/(regandnon)/preview/rikma/[shareKey]/+page.svelte`
  (public, no context). The local `money()` helper already appends
  `view.currency` when set, so it is partially correct; the fix is to ensure
  the preview route passes `projectId` or `currency` from `data.projectId`.

---

- [x] 1. **`src/lib/components/prPr/negoM.svelte`** — lines 821–928
  - **STATUS 2026-11-19 (batch 2):** Done in batch 2 — `<Money … {projectId} />`, and `$t` placeholders via `useFormatMoney`.
  - **STATUS 2026-11-19:** NOT done — moved to Batch 2. `negoM` also renders in `availableMission/[id]`, `lev/cards/reqtojoin`, `lev/projectSuggestor`, `lev/pandingMesima`, so it needs an optional `projectId` / `currency` prop that those callers pass. Inside moach the context covers it.
  - Wrap `noofhours * perhour` → `<Money amount={noofhours * perhour} />`.
  - Wrap `perhour` → `<Money amount={perhour} />` (keep existing `$t('common.perhour')` text after it).
  - The `.toLocaleString('en-US', …)` calls for the same quantities → replace with `<Money>`.
  - Add `import Money from '$lib/components/money/Money.svelte';` if not present.
  - **Do NOT wrap** `seatsNow` (a count), `noofhours` when it appears alone (hours).
  - Verify: `npm run check` — no new errors.

- [x] 2. **`src/lib/components/prPr/pendsM.svelte`** — lines 185–194
  - `{data.attributes.perhour}` → `<Money amount={data.attributes.perhour} />`.
  - `{data.attributes.perhour * data.attributes.noofhours}` → `<Money amount={data.attributes.perhour * data.attributes.noofhours} />`.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [x] 2b. **`src/lib/components/prPr/negoPend.svelte`** — MOVE TO BATCH 2
  - **STATUS 2026-11-19 (batch 2):** Done in batch 2.
  - **STATUS 2026-11-19:** NOT done — in Batch 2. Callers outside moach: `availiableResorce/[id]`, `jenia`, `lev/mashsuggest`, `reqtom`, `pmas`, `pandingMesima`, `pending`, `reqtojoin`.
  - `negoPend.svelte` renders in `routes/jenia/+page.svelte` and
    `routes/(regandnon)/availiableResorce/[id]/+page.svelte` — not moach-only.
  - **Do NOT use the moach context.** Add an optional `projectId` prop
    (and/or `currency` prop).
  - Find bare money amounts (line ~821 and around, by analogy with `negoM`):
    `perhour`, `perhour * noofhours` expressions → wrap with
    `<Money amount={x} projectId={projectId} />`.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Update callers: `lev/mashsuggest.svelte` and `lev/pmas.svelte` already
    import it; pass `projectId={buble.projectId}` where available.
    `availiableResorce/[id]` page: pass `currency={currency}` (derived in
    item 58 from `rikmaCurrency`).
  - Verify: `npm run check` — no new errors.

- [x] 3. **`src/lib/components/prPr/openM.svelte`** — lines 130–158
  - `{data.attributes.perhour}` → `<Money amount={data.attributes.perhour} />`.
  - `{(data.attributes.perhour * data.attributes.noofhours).toLocaleString(...)}` → `<Money amount={data.attributes.perhour * data.attributes.noofhours} />`.
  - `{data.attributes.price}` on the mashmam price row → `<Money amount={data.attributes.price} />`.
  - `{data.total}` on the mashmam total row → `<Money amount={data.total} />`.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - **Do NOT wrap** `data.attributes.noofhours` (hours count).
  - Verify: `npm run check` — no new errors.

- [x] 4. **`src/lib/components/prPr/mashmam.svelte`** — lines 196, 224
  - `{data.attributes.price}` → `<Money amount={data.attributes.price} />`.
  - `{data.total}` → `<Money amount={data.total} />` (the `data.attributes.easy` total).
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - **Do NOT wrap** `meData[i].m`, `meData[i].y`, `meData[i].r`, `meData[i].kc`
    (booleans / flags).
  - Verify: `npm run check` — no new errors.

- [x] 5. **`src/lib/components/prPr/newOpn.svelte`** — line 85 (the value badge)
  - `{fmtNum(hours * perhour)}` → `<Money amount={hours * perhour} />`.
  - In the `{fmtNum(hours)} × {fmtNum(perhour)}` sub-line, `fmtNum(perhour)` →
    `<Money amount={perhour} />` (hours stays `fmtNum` — it is a count).
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [x] 6. **`src/lib/components/prPr/finisin.svelte`** — lines ~102, 113
  - Confirmed moach-only (renders via `ActionModal.svelte` → moach layout and
    `MissionModal.svelte` → moach layout only).
  - `{$t('project.finisin.currency')}{a.perhour.toLocaleString(...)}` →
    `<Money amount={a.perhour} />` (drop the `$t('project.finisin.currency')`
    prefix entirely — the currency symbol is now inside `<Money>`).
  - `{$t('project.finisin.currency')}{a.total}` →
    `<Money amount={a.total} />`.
  - **Also**: `project.finisin.currency` = `₪` is the same as `project.currency`.
    After this change both keys become unused inside finisin; note in report.
    Do NOT delete the keys here — handle in Batch 4 (item 88).
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - **Do NOT wrap** `a.noofhours` (hours count).
  - Verify: `npm run check` — no new errors.

- [ ] 7. **`src/lib/components/prPr/open/OpenMissionCard.svelte`** — lines 99, 112
  - **STATUS 2026-11-19:** NOT done — do it together with Batch 3 (`availableMission`). Add the optional `currency` prop described here.
  - `{fmtNum(value)}` → `<Money amount={value} />`.
  - In the sub-line `{fmtNum(hours)} × {fmtNum(perhour)}`, wrap `fmtNum(perhour)` →
    `<Money amount={perhour} />` (hours stays).
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - **Context note**: `OpenMissionCard` is also rendered on the public
    `/availableMission` page via `OpenBoard.svelte`. Because moach provides the
    context but the public page does not, add a `currency` prop (optional,
    default `undefined`) and pass `currency={currency}` to `<Money>` so that
    the public page can supply it. Update `OpenBoard.svelte` to accept and
    forward a `currency` prop from its caller.
  - Verify: `npm run check` — no new errors.

- [ ] 8. **`src/lib/components/prPr/open/OpenResourceCard.svelte`** — lines 96, 99, 103, 118
  - **STATUS 2026-11-19:** NOT done — do it together with Batch 3 (`availiableResorce`). Same prop.
  - `{fmtNum(totals.total)}` → `<Money amount={totals.total} />`.
  - `{fmtNum(totals.price)}` → `<Money amount={totals.price} />`.
  - **Do NOT wrap** `fmtNum(totals.cycles)` and `fmtNum(totals.quantity)` —
    these are item counts.
  - Same prop-threading approach as `OpenMissionCard` above: add optional
    `currency` prop, pass through `<Money currency={currency} … />`.
  - Verify: `npm run check` — no new errors.

- [ ] 9. **`src/lib/components/prPr/missionForm/MissionSummary.svelte`** — line 34 (the `{total}` display)
  - **STATUS 2026-11-19:** DEFERRED — `total` arrives as an already formatted string from 3 callers (`mission.svelte`, `ResourceCreator`, `ProductForm`), and two of them already format it with the right currency (`fmtMoney(…, currency)`). Changing it means changing the prop API; it is not a display-only fix. Leave it unless the human asks.
  - `{total}` is already a formatted string (the caller builds it). But the
    spec says to wrap it: **check the callers first**.
    - `prPr/mission.svelte` (moach only): caller builds `total` from `noofhours * perhour`
      and passes it as a string → switch the caller to pass `amount` (number)
      instead, rename the prop, and render `<Money amount={amount} />` inside
      `MissionSummary`.
    - `resource/ResourceCreator.svelte` and `products/ProductForm.svelte`
      (outside moach): these callers must pass `currency` or `projectId` through.
      See Batch 2/3 for `ResourceCreator`. For `ProductForm` (moach context):
      same `<Money amount={amount} />` with no currency needed.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [x] 10. **`src/lib/components/process/lifecycle/SaleLifecycle.svelte`** — line 188
  - `{attrs.in}` (the sale income amount) → `<Money amount={attrs.in} />`.
  - `SaleLifecycle` is rendered only by `routes/(reg)/moach/[projectId]/processes/[processId]/+page.svelte`,
    confirmed moach-only → no currency prop needed.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [x] 11. **`src/lib/components/process/lifecycle/ProcessLifecycle.svelte`**
  - Same route — moach-only. Inspect the file for bare money amounts (prices,
    totals, per-hour rates) and wrap in `<Money amount={x} />`. Add import if
    not present. Leave non-money numbers (hours, quantities) alone.
  - Verify: `npm run check` — no new errors.

- [x] 12. **`src/routes/(reg)/moach/[projectId]/sales/[saleId]/+page.svelte`** — line 89
  - `{sale.attributes.in}` → `<Money amount={sale.attributes.in} entry={sale.attributes} />`.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [x] 13. **`src/routes/(reg)/moach/[projectId]/splits/[splitId]/+page.svelte`** — line 85
  - `{haluka.attributes.amount}` → `<Money amount={haluka.attributes.amount} />`.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [x] 14. **`src/routes/(reg)/moach/[projectId]/sales/manage/promotions/+page.svelte`** — line ~372
  - Find the bare money amount and wrap in `<Money amount={x} />`.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [x] 15. **`src/lib/components/assistant/RikmaPreview.svelte`** — lines 240, 313, 318, 364, 369, 387, 396
  - **STATUS 2026-11-19:** Done for the component. The public route `preview/rikma/[shareKey]` takes the currency from `view.currency` (the draft); when it has none it shows ILS — that is the null=ILS rule, OK. Also seen in passing, not done: `assistant/BlueprintReview.svelte:561` prints `fmt(s.value)` followed by the bare code (`USD`) — switch it to `useFormatMoney` in Batch 2.
  - The local `money()` helper already appends `view.currency` when set, so it
    partially works. Replace it with `useFormatMoney()` from
    `$lib/money/context.svelte`.
  - For the moach/assistant context: `const fmt = useFormatMoney();` and
    replace every `money(x)` call with `fmt(x, view.currency ?? 'ILS')`.
  - For `routes/(regandnon)/preview/rikma/[shareKey]/+page.svelte` (public
    page that renders `RikmaPreview`): confirm that `data.projectId` is
    available and that `provideRikmaCurrency` is called at the page level, or
    pass `currency={data.view.currency}` as a prop to the component and thread
    it into `fmt`.
  - Add `import { useFormatMoney } from '$lib/money/context.svelte';`.
  - Verify: `npm run check` — no new errors.

- [x] 16. **Batch 1 gate** — after completing items 1–15:
  - Run `node scripts/audit-money-display.mjs` → audit count should be visibly
    lower for the prPr/ and process/ paths.
  - Run `npm run check` → error count must not exceed baseline of 1218.
  - Run `npx vitest run src/lib/money src/lib/components/money` → all 33 tests
    still green.

---

## Batch 2 — C8+C9: lev and hub cards

> These cards render on the heart (`/lev`) and hub pages where multiple rikmas
> appear on one page. The currency comes from `buble.projectId`.

### Cards with bare numbers (C8) — wrap `{buble.X}` in `<Money amount={buble.X} projectId={buble.projectId} />`

- [x] 17. **`src/lib/components/lev/cards/reqtojoin.svelte`** — lines 265, 266, 270, 323, 324, 576
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Wrap each bare money amount.
  - `NegotiationHistory` is rendered here: add `projectId={buble.projectId}` to
    its invocation (see item 29 for the component-level fix).
  - Verify: `npm run check` — no new errors.

- [x] 18. **`src/lib/components/lev/mashsuggest.svelte`** — lines 373, 375, 417, 425, 426
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Wrap each bare money amount with `<Money amount={x} projectId={buble.projectId} />`.
  - Verify: `npm run check` — no new errors.

- [x] 19. **`src/lib/components/lev/cards/SaleCard.svelte`** — lines 415, 439
  - `{buble.price}` → `<Money amount={buble.price} projectId={buble.projectId} />`.
  - `{buble.total}` → `<Money amount={buble.total} projectId={buble.projectId} />`.
  - **But**: `SaleCard` does not currently receive `projectId` from `LevCard.svelte`
    (confirmed from grep). Fix `LevCard.svelte` to pass
    `projectId={buble.projectId}` to the `<SaleCard>` invocation (around line 144–150).
  - Add `import Money from '$lib/components/money/Money.svelte';` to `SaleCard`.
  - Verify: `npm run check` — no new errors.

- [x] 20. **`src/lib/components/lev/cards/CustomerSaleCard.svelte`** — lines 358, 382
  - `{buble.price}` → `<Money amount={buble.price} projectId={buble.projectId} />`.
  - `{buble.total}` → `<Money amount={buble.total} projectId={buble.projectId} />`.
  - The existing `<Money amount={due.due} />` on line ~399 is missing
    `projectId` — add `projectId={buble.projectId}` to that existing `<Money>`
    tag too (C9 fix).
  - Fix `LevCard.svelte` to pass `projectId={buble.projectId}` to
    `<CustomerSaleCard>` (around line 151–155).
  - Verify: `npm run check` — no new errors.

- [x] 21. **`src/lib/components/lev/cards/SheirutHalukaCard.svelte`** — line 296
  - Wrap the bare money amount with `<Money amount={x} projectId={buble.projectId} />`.
  - Add import if not present.
  - Verify: `npm run check` — no new errors.

- [x] 22. **`src/lib/components/lev/cards/SiteShareIncomeCard.svelte`** — line 149
  - Wrap the bare money amount with `<Money amount={x} projectId={buble.projectId} />`.
  - Add import if not present.
  - Verify: `npm run check` — no new errors.

- [x] 23. **`src/lib/components/lev/cards/haluka.svelte`** — line 474
  - `{row.value.toFixed(2)}` → `<Money amount={row.value} projectId={projectId} />`.
  - `haluka` already receives `projectId` as a prop (confirmed from JSDoc).
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [x] 24. **`src/lib/components/lev/cards/ProductRequestCoin.svelte`** — line 65
  - Wrap the bare money amount.
  - Add import if not present.
  - Verify: `npm run check` — no new errors.

- [x] 25. **`src/lib/components/lev/pandingMesima.svelte`** — lines 550, 552, 663
  - Wrap each bare money amount with `<Money amount={x} projectId={buble.projectId} />`.
  - Add import if not present.
  - Verify: `npm run check` — no new errors.

- [x] 26. **`src/lib/components/lev/pmas.svelte`** — lines 486, 488, 582
  - Same as above.
  - Verify: `npm run check` — no new errors.

- [x] 27. **`src/lib/components/lev/projectSuggestor.svelte`** — lines 475, 529
  - Same as above.
  - Verify: `npm run check` — no new errors.

- [x] 28. **`src/lib/components/lev/reqtom.svelte`** — lines 640, 641
  - Same as above.
  - Verify: `npm run check` — no new errors.

- [x] 29. **`src/lib/components/lev/mesima.svelte`** — lines 186, 194
  - Same as above.
  - Verify: `npm run check` — no new errors.

- [x] 30. **`src/lib/components/lev/missionInProgress.svelte`** — line 954
  - Same as above.
  - Verify: `npm run check` — no new errors.

- [x] 31. **`src/lib/components/lev/didiget.svelte`** — line 484
  - Same as above.
  - Verify: `npm run check` — no new errors.

- [x] 32. **`src/lib/components/lev/newcoinui.svelte`** — line 678
  - Same as above.
  - Verify: `npm run check` — no new errors.

- [x] 33. **`src/lib/components/lev/negoArchive.svelte`** — line 193
  - Same as above.
  - Verify: `npm run check` — no new errors.

- [x] 34. **`src/lib/components/lev/weget.svelte`** — line 531
  - Bare amount: wrap with `<Money amount={x} projectId={buble.projectId} />`.
  - **Also** C9: existing `<Money>` tags here are missing `projectId` — add
    `projectId={buble.projectId}` to each.
  - Verify: `npm run check` — no new errors.

- [x] 35. **`src/lib/components/lev/cards/sugestmi.svelte`** — line 212
  - Same as above.
  - Verify: `npm run check` — no new errors.

### Cards with `<Money>` missing `projectId` (C9) — add `projectId={buble.projectId}`

- [x] 36. **`src/lib/components/lev/cards/CustomerPayment.svelte`** (all existing `<Money>` without `projectId`)
  - Add `projectId={buble.projectId}` to every `<Money>` that is missing it.
  - Verify: `npm run check` — no new errors.

- [x] 37. **`src/lib/components/lev/cards/dowegeot.svelte`** (all existing `<Money>` without `projectId`)
  - **STATUS 2026-11-19 (batch 2):** Nothing to do — already passed `{projectId}`.
  - Add `projectId={buble.projectId}` to every `<Money>` that is missing it.
  - Verify: `npm run check` — no new errors.

- [x] 38. **`src/lib/components/lev/cards/sugestma.svelte`** — lines 297, 428, 439, 451
  - Bare amounts: wrap with `<Money amount={x} projectId={buble.projectId} />`.
  - Existing `<Money>` without `projectId`: add `projectId={buble.projectId}`.
  - Verify: `npm run check` — no new errors.

- [x] 39. **`src/lib/components/lev/cards/rektom.svelte`** — lines 611, 624
  - Bare amounts: wrap with `<Money amount={x} projectId={buble.projectId} />`.
  - Existing `<Money>` without `projectId`: add `projectId={buble.projectId}`.
  - Verify: `npm run check` — no new errors.

- [x] 40. **`src/lib/components/lev/cards/hachlata.svelte`** (existing `<Money>` without `projectId`)
  - **STATUS 2026-11-19 (batch 2):** Nothing to do — already passed `{projectId}`.
  - Add `projectId={buble.projectId}` to every `<Money>` that is missing it.
  - Verify: `npm run check` — no new errors.

- [x] 41. **`src/lib/components/lev/cards/pma.svelte`** — lines 457, 604
  - Bare amounts: wrap.
  - Existing `<Money>` without `projectId`: add `projectId={buble.projectId}`.
  - Verify: `npm run check` — no new errors.

- [x] 42. **`src/lib/components/lev/cards/StipendDecisionCard.svelte`** (existing `<Money>` without `projectId`)
  - **STATUS 2026-11-19 (batch 2):** Nothing to do — the ₪ is only in a code comment.
  - Add `projectId={buble.projectId}` to every `<Money>` that is missing it.
  - **Note**: `StipendDecisionCard` already has `{projectId}` prop (confirmed from
    `stipend.terms.rate` call site grep: `<Money amount={standing.stipendRate ?? 0} {projectId} />`).
    Confirm `LevCard.svelte` passes `projectId={buble.projectId}` to it —
    if not, add it.
  - Verify: `npm run check` — no new errors.

- [x] 43. **`src/lib/components/lev/cards/decisionMaking.svelte`** (existing `<Money>` without `projectId`)
  - **STATUS 2026-11-19 (batch 2):** Nothing to do — already passed `{projectId}`.
  - Add `projectId={buble.projectId}`.
  - Verify: `npm run check` — no new errors.

- [ ] 44. **`src/lib/components/lev/cards/WishOfferCard.svelte`** (existing `<Money>` without `projectId`)
  - **STATUS 2026-11-19 (batch 2):** NOT done. `<Money amount={buble.price} />` with no currency — a wish proposal belongs to no rikma, so on the heart it falls to ILS. By the brief's table: the proposal's `entryCurrency`, else the proposing rikma's `currencyCode`. Check what `buble` carries (levProcessors) before adding to a qid.
  - Per the spec table: "a wish proposal, by the table" — currency source is
    `entryCurrency` on the ratson/ratson-proposal row. If `buble.entryCurrency`
    is available use `currency={buble.entryCurrency}`, else fall back to
    `projectId={buble.projectId}`.
  - Verify: `npm run check` — no new errors.

- [x] 45. **`src/lib/components/ui/NegotiationHistory.svelte`** — line 193 (already has a `projectId` prop but audit shows it may still print bare amounts)
  - Confirm the component receives `projectId` from its callers (pending.svelte
    and reqtojoin.svelte). If a bare amount remains, wrap it with
    `<Money amount={x} projectId={projectId} />`.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [ ] 46. **`src/lib/components/lev/cards/pending.svelte`** — lines 239, 432
  - **STATUS 2026-11-19 (batch 2):** NOT done. Line ~239 still prints `{perhour}` bare — wrap it in `<Money amount={perhour} projectId={buble.projectId} />` (or the card's `projectId` prop). And the `<NegotiationHistory>` call (~line 428) does not pass `{projectId}`, so its formatted amounts fall back to ILS on the heart — add it (reqtojoin.svelte:580 does it already).
  - Wrap bare money amounts with `<Money amount={x} projectId={buble.projectId} />`.
  - `NegotiationHistory` invoked here: confirm `projectId={buble.projectId}` is
    passed to it.
  - Add import if not present.
  - Verify: `npm run check` — no new errors.

- [x] 47. **`src/lib/components/stipend/StipendPayCard.svelte`**, **`StipendAccruedCard.svelte`**, **`StipendConfirmCard.svelte`** (audit shows `₪` symbol only — C9)
  - **STATUS 2026-11-19 (batch 2):** Nothing to do — the ₪ in these cards is only in the doc comment.
  - Add `projectId={buble.projectId}` to each `<Money>` missing it.
  - Confirm `LevCard.svelte` passes `projectId` to these cards; add if missing.
  - Verify: `npm run check` — no new errors.

- [ ] 47b. **`src/lib/components/stipend/MissionStipendOffer.svelte`** (2 `<Money>` with no currency source)
  - It has no `projectId` / `currency` prop. Rendered by `lev/cards/sugestmi` (heart — no rikma context) and by `prPr/open/OpenMissionCard` + `availableMission/[id]` (batch 3), plus `moach/…/progress/[missionId]` (fine).
  - Add an optional `projectId` prop, pass it to both `<Money>`, and pass `{projectId}` from `sugestmi`.

- [ ] 47c. **`src/lib/components/assistant/BlueprintReview.svelte`** line ~561
  - `{fmt(s.value)}{#if currency}{' '}{currency}{/if}` prints the number and then the bare code ("1,200 USD"). Switch to `useFormatMoney`: `fmtMoney(s.value, currency || 'ILS')` — same as `RikmaPreview` after batch 1.

- [ ] 48. **Batch 2 gate**
  - Run `node scripts/audit-money-display.mjs` → all lev/ paths should be clear
    or dramatically reduced.
  - Run `npm run check` → no new errors.
  - Run `npx vitest run src/lib/money src/lib/components/money` → green.

---

## Batch 3 — C8+C9: public pages, deals, concierge

> Currency comes from the page loader's data or is threaded down. Some qids need
> `currencyCode` added to their project selection. Run
> `npm run validate:qids` after every qid touch.

### Discovery pages (availableMission, availiableResorce, maagad, gift, user/[id])

- [ ] 49. **`src/routes/api/send/qids.js` — qid `283discoverMissions`**
  - In the `project { data { id attributes { … } } }` block, add `currencyCode`
    after `projectName`.
  - Run `npm run validate:qids` → must pass.
  - **Report**: `283discoverMissions` now selects `currencyCode`.

- [ ] 50. **`src/lib/server/discovery/normalizeCards.ts` — `normalizeMissionCard`**
  - Add `currencyCode: string | null` to the `MissionCard` interface.
  - Read `rikmaCurrency(project?.attributes)` and store it as `currency` on the
    normalised card (import `rikmaCurrency` from `$lib/money/resolve.js`).

- [ ] 51. **`src/routes/(regandnon)/availableMission/+page.svelte`** — line 207
  - In the value badge: `<strong>{m.value}</strong>` → `<Money amount={m.value} currency={m.currency} />`.
  - `{m.perhour}` → `<Money amount={m.perhour} currency={m.currency} />`.
  - Add `import Money from '$lib/components/money/Money.svelte';`.
  - Verify: `npm run check` — no new errors.

- [ ] 52. **`src/routes/api/send/qids.js` — qid `284discoverResources`**
  - Add `currencyCode` to the project attributes block.
  - Run `npm run validate:qids` → must pass.
  - **Report**: `284discoverResources` now selects `currencyCode`.

- [ ] 53. **`src/lib/server/discovery/normalizeCards.ts` — `normalizeResourceCard`**
  - Same as item 50 for the resource card: add `currency` from `rikmaCurrency`.

- [ ] 54. **`src/routes/(regandnon)/availiableResorce/+page.svelte`** — line 181
  - Wrap the bare price/amount with `<Money amount={x} currency={m.currency} />`.
  - Add import if not present.
  - Verify: `npm run check` — no new errors.

- [ ] 55. **`src/routes/api/send/qids.js` — qid `51GetOpenMissionById`**
  - In `project { data { id attributes { … } } }`, add `currencyCode`.
  - Run `npm run validate:qids` → must pass.
  - **Report**: `51GetOpenMissionById` now selects `currencyCode`.

- [ ] 56. **`src/routes/(regandnon)/availableMission/[id]/+page.svelte`** — money amounts
  - In the page script: `const currency = rikmaCurrency(data.alld?.openMission?.data?.attributes?.project?.data?.attributes)`.
  - Wrap bare `{perhour}` and total amounts with `<Money amount={x} currency={currency} />`.
  - Existing `<Money>` tags (e.g. in `NegoM`): `NegoM` only renders in this page
    if the user is logged in and in the rikma — the moach context is **not** active
    here. `NegoM` is also used outside moach (see `lev/reqtojoin.svelte`,
    `lev/projectSuggestor.svelte`). Add an optional `currency` prop to `NegoM`
    and thread it through, or use `provideRikmaCurrency(currency)` once at the
    top of this page.  
    **Decision**: call `provideRikmaCurrency(() => currency)` once in `<script>`
    (same pattern the spec recommends for deals pages) — this covers `NegoM`
    and any other `<Money>` without projectId.
  - Add imports: `Money`, `rikmaCurrency`, `provideRikmaCurrency`.
  - Verify: `npm run check` — no new errors.

- [ ] 57. **`src/routes/api/send/qids.js` — qid `50GetOpenMashaabimById`**
  - Add `currencyCode` to the project attributes block.
  - Run `npm run validate:qids` → must pass.
  - **Report**: `50GetOpenMashaabimById` now selects `currencyCode`.

- [ ] 58. **`src/routes/(regandnon)/availiableResorce/[id]/+page.svelte`** — lines 438, 459
  - Derive `currency` from `data.alld?.openMashaabim?.data?.attributes?.project?.data?.attributes`.
  - Call `provideRikmaCurrency(() => currency)`.
  - Wrap bare amounts with `<Money amount={x} currency={currency} />`.
  - Verify: `npm run check` — no new errors.

- [ ] 59. **`src/routes/(regandnon)/maagad/[id]/+page.svelte`** — lines 459, 469, 470
  - The maagad page shows suggestions from multiple projects. The demand
    (`ratson`) itself may not have a project. The spec says: "a wish without a
    rikma — ILS". Use `rikmaCurrency(p.project?.attributes)` per item (the data
    has `p.price`, `p.perhour` per suggestion item with their project).
  - For each suggestion: wrap `{p.price}` with
    `<Money amount={p.price} currency={rikmaCurrency(p.project?.attributes)} />`.
    Same for `{o.perhour}` and `{o.price}`.
  - Add imports: `Money`, `rikmaCurrency`.
  - Verify: `npm run check` — no new errors.

- [ ] 60. **`src/routes/(regandnon)/gift/+page.svelte`** — line 182 and **`src/routes/(regandnon)/gift/[id]/+page.svelte`** — line 544
  - Find the qid(s) used by these loaders. Grep: `sendToSer … gift`.
  - Add `currencyCode` to the product's project attributes in those qids.
  - Run `npm run validate:qids` after each.
  - In the page component: derive `currency = rikmaCurrency(data.product?.project?.data?.attributes)` and wrap bare amounts.
  - **Report** which qids were touched.
  - Verify: `npm run check` — no new errors.

- [ ] 61. **`src/routes/(regandnon)/user/[id]/+page.svelte`** — line 209
  - Per spec: "the item's project if it has one; a personal item — the person's `User.currency`, else ILS".
  - Find the user page loader's qid. Add `currencyCode` to the project selection
    if not present. Run `npm run validate:qids`.
  - In the component: for each displayed item, use
    `rikmaCurrency(item.project?.data?.attributes ?? person?.currency)` and
    wrap in `<Money amount={x} currency={currency} />`.
  - **Report** the qid touched.
  - Verify: `npm run check` — no new errors.

### RikmaPage, Storefront, Offerings

- [ ] 62. **`src/lib/components/rikmaPublic/RikmaPage.svelte`** — lines 321, 344
  - Determine the currency source: the rikma's own project row is in the page
    data. Use `rikmaCurrency(data.project?.data?.attributes)` or the equivalent.
  - Wrap bare amounts with `<Money amount={x} currency={currency} />`.
  - Add imports.
  - Verify: `npm run check` — no new errors.

- [ ] 63. **`src/lib/components/offerings/UserStorefront.svelte`** — lines 67, 93
  - Per spec: use item's project currency if it exists, else `User.currency`, else ILS.
  - Wrap bare amounts accordingly.
  - Verify: `npm run check` — no new errors.

- [ ] 64. **`src/lib/components/offerings/MyProductsSection.svelte`** — line 127
  - Same currency logic as above.
  - Verify: `npm run check` — no new errors.

- [ ] 65. **`src/lib/components/offerings/MyResourcesEditor.svelte`** — line 495
  - Same currency logic as above.
  - Verify: `npm run check` — no new errors.

- [ ] 66. **`src/lib/components/main/ProductPeek.svelte`** — lines 301, 346
  - Find the project's currency from the product row's project attributes.
  - Wrap bare amounts with `<Money amount={x} currency={currency} />`.
  - Verify: `npm run check` — no new errors.

### Project pages

- [ ] 67. **`src/routes/(regandnon)/project/[id]/join/+page.svelte`** — the form inputs for `mPerhour` and `rPrice`
  - These are **input fields** (the user types a number); do not wrap the bound
    variable. The spec rule: `pages.mPerhour` and `pages.rPrice` labels have
    `(₪)` baked in — that is a Batch 4 (C10) translation fix. For this batch,
    add a `<CurrencySymbol>` next to each input after removing the symbol from
    the translation (coordinate with Batch 4).

- [ ] 68. **`src/routes/(regandnon)/project/[id]/support/+page.svelte`** — the `<Money>` tags (audit shows `₪3` = 3 `<Money>` already wrapped but no `currency`/`projectId`)
  - These are on a known project page. Use
    `currency={rikmaCurrency(data.project?.data?.attributes)}` on each `<Money>`.
  - Verify: `npm run check` — no new errors.

### Deals

- [ ] 69. **`src/routes/deals/[id]/+page.svelte`** — the two `<Money amount={totalCost} />` and `<Money amount={paid} />` on lines 373–379
  - `fetchSingleDeal` does not currently return `currencyCode`. Add it:
    find the qid used by `fetchSingleDeal` in
    `src/lib/server/deals/dealsQueries.ts`, add `currencyCode` to the
    `project { data { attributes { … } } }` selection, run `npm run validate:qids`.
  - Thread the currency code through `SaleData` → page → call
    `provideRikmaCurrency(() => rikmaCurrency(deal.project?.attributes))` once
    at the top of the page. This covers `ResourcePanel` and all other child
    `<Money>` tags on the same page.
  - **Report** which qid was touched.
  - Verify: `npm run check` — no new errors.

- [ ] 70. **`src/lib/components/deals/ResourcePanel.svelte`** — the `<Money amount={r.cost} />` on line 22
  - `ResourcePanel` renders inside the deals `[id]` page. Once `provideRikmaCurrency`
    is called there (item 69), `<Money>` with no `currency`/`projectId` picks it
    up from context — no change needed in `ResourcePanel` itself. Confirm this
    is the case.

- [ ] 71. **`src/routes/deals/[id]/+page.svelte` other `<Money>` tags** (request/[id], offers/[id], offers/new)
  - `routes/deals/request/[id]/+page.svelte` — `<Money>` tags on lines 230–241.
    After `provideRikmaCurrency` is set at the deals layout level (or per-page):
    confirm they pick it up. If not, add `projectId` from the page's data.
  - `routes/deals/offers/[id]/+page.svelte` — `<Money>` tags on lines 190, 194.
    Same check.
  - `routes/deals/offers/new/+page.svelte` — `<Money>` tags (personal offers,
    no rikma). Per spec: "a personal item — the person's `User.currency`, else ILS".
    Pass `currency={data.userCurrency ?? 'ILS'}` from page data.
  - Verify: `npm run check` — no new errors.

- [ ] 72. **`src/routes/deals/sales-center/+page.svelte`** — line 354
  - `{product.attributes.price} {$t('pages.salesCenter.shekel')}` →
    `<Money amount={product.attributes.price} projectId={projectId} />`.
  - Remove the `{$t('pages.salesCenter.shekel')}` interpolation from markup
    (the currency symbol is now inside `<Money>`).
  - Remove the `pages.salesCenter.shekel` key from **all five locale files**
    (`he en ar ru es`) in `src/lib/translations/*/pages.json`. Before deleting,
    confirm no other call site uses it (grep: `pages.salesCenter.shekel`).
  - Add import: `Money`.
  - Verify: `npm run check` — no new errors; `npm run check:i18n` — OK.

### Concierge

- [ ] 73. **`src/routes/(reg)/concierge/+page.svelte`** — lines 550, 673
  - `{w.budget}` is already formatted by `fmtBudget()` which calls
    `fmtMoney(+n)`. `fmtMoney` = `useFormatMoney()`. At this point
    `fmtMoney` has no currency code — it uses whatever the context provides,
    which on the concierge list page is the user's own currency or ILS.
  - The `fmtBudget` path: `c.totalBounti` comes from the ratson row. The spec
    says `entryCurrency` on the ratson row. Find the qid used by the concierge
    page loader (`grep -rn concierge src/routes/(reg)/concierge/+page.server` →
    identify the qid). Add `entryCurrency` to the ratson selection; run
    `npm run validate:qids`.
  - In `fmtBudget(n)`, change to accept `(n, currency)` and pass
    `fmtMoney(+n, currency ?? 'ILS')`.
  - **Report** the qid touched.
  - Verify: `npm run check` — no new errors.

- [ ] 74. **`src/routes/(reg)/concierge/[id]/+page.svelte`** — line 2510
  - Find the bare amount and the currency source (the ratson row or the rikma
    proposal's project). Wrap with `<Money amount={x} currency={code} />` or
    use `fmt(x, code)` if inside a string.
  - Add imports as needed.
  - Verify: `npm run check` — no new errors.

- [ ] 75. **Batch 3 gate**
  - Run `node scripts/audit-money-display.mjs` → public-page and deals paths
    should be clear.
  - Run `npm run check` → no new errors.
  - Run `npm run validate:qids` → pass.
  - Run `npx vitest run src/lib/money src/lib/components/money` → green.

---

## Batch 4 — C10+C11: translations, server, mails, Telegram

### C10 — Translation keys

> For each key below: (a) remove the `₪` / currency symbol from the string in
> **all five locale files** (`he en ar ru es`), and (b) at the call site, place
> `<CurrencySymbol currency={code} />` right after the input, following the
> pattern in `prPr/mission.svelte:1607`. Where the symbol is in the **middle of
> a sentence** (server.stipend*, consensus.perHourUnit), switch to a
> `{{amount}}` placeholder and format with `fmt(x, code)` at the call site.
> Keys with **no call site**: leave the key in place, note in the report.

- [ ] 76. **`stipend.terms.rate`** — path: `src/lib/translations/*/stipend.json`
  - Current he: `"rate": "תעריף המלגה (₪ לשעה)"`.
  - Remove `₪` from all 5 locales (the parenthetical, keep the Hebrew label).
  - Call sites: `StipendTermsFields.svelte`, `MissionStipendSection.svelte`,
    `StipendDecisionCard.svelte`, `StipendFundingRequestDialog.svelte`.
  - In `StipendTermsFields.svelte` and `MissionStipendSection.svelte` (input
    labels): add `<CurrencySymbol currency={code} />` next to the input.
  - In `StipendDecisionCard.svelte` and `StipendFundingRequestDialog.svelte`
    (display labels): the value is already in `<Money>`, so just remove the
    `₪` from the label text.
  - Verify: `npm run check` and `npm run check:i18n`.

- [ ] 77. **`stipend.terms.monthlyCap`** — `src/lib/translations/*/stipend.json`
  - Same approach as `rate`: remove `₪` from label, add `<CurrencySymbol>`.
  - Call sites: `StipendTermsFields.svelte`.
  - Verify: `npm run check` and `npm run check:i18n`.

- [ ] 78. **`stipend.terms.totalCap`** — same file
  - Same approach.
  - Call sites: `StipendTermsFields.svelte`, `StipendDecisionCard.svelte`,
    `StipendFundingRequestDialog.svelte`.
  - Verify.

- [ ] 79. **`stipend.terms.revenueTrigger`** — same file
  - Same approach.
  - Call sites: `StipendTermsFields.svelte`.
  - Verify.

- [ ] 80. **`stipend.confirmation.howMuchArrived`** — same file
  - Current he: `"howMuchArrived": "כמה באמת הגיע (₪)"`.
  - Remove `₪`. Find call sites (`grep -rn "howMuchArrived" src`). Add
    `<CurrencySymbol>` next to the input.
  - Verify.

- [ ] 81. **`pages.mPerhour`** and **`pages.rPrice`** — `src/lib/translations/*/pages.json`
  - Call sites: `routes/(regandnon)/project/[id]/join/+page.svelte` (confirmed).
  - Remove `(₪)` from the label string in all 5 locales.
  - In the join page: add `<CurrencySymbol currency={projectCurrency} />` next
    to each input (coordinate with item 67).
  - Verify.

- [ ] 82. **`pages.shekel`** — `src/lib/translations/*/pages.json`
  - This key is used in `routes/deals/sales-center/+page.svelte` (item 72).
  - After item 72 removes it from markup, delete the key from all 5 locales.
  - Verify: `npm run check:i18n`.

- [ ] 83. **`consensus.demo.perHourUnit`** — `src/lib/translations/*/consensus.json`
  - Current he: `"perHourUnit": "₪ לשעה"`.
  - This appears inline as `{demo.current.valuePerHour} {$t('consensus.demo.perHourUnit')}`.
  - Switch to a placeholder: change all 5 locale strings to e.g. `"{{amount}} לשעה"` / `"{{amount}} per hour"`.
  - At the call site in `routes/(regandnon)/consensus/+page.svelte`: replace
    `{demo.current.valuePerHour} {$t('consensus.demo.perHourUnit')}` with
    `{$t('consensus.demo.perHourUnit', { amount: fmt(demo.current.valuePerHour, 'ILS') })}`.
    (The consensus demo is a public demo with no specific rikma; ILS is correct
    for the demo.)
  - Verify.

- [ ] 84. **`consensus.demo.counterForm.perHourLabel`** — same file
  - Current he: `"perHourLabel": "תעריף לשעה (₪)"`.
  - Remove `₪` from all 5 locales.
  - Call site: `routes/(regandnon)/consensus/+page.svelte`. Add
    `<CurrencySymbol currency="ILS" />` next to the input.
  - Verify.

- [ ] 85. **`concierge.new.budgetLabel`** — `src/lib/translations/*/concierge.json`
  - Current he: `"budgetLabel": "תקציב (₪)"`.
  - Remove `₪` from all 5 locales.
  - Call site: `src/lib/components/concierge/WishForm.svelte` (line ~2536).
  - Add `<CurrencySymbol currency={entryCurrency ?? 'ILS'} />` next to the
    budget input.
  - Verify.

- [ ] 86. **`concierge.new.money.fixedAmount`** and **`concierge.new.money.atCostAmount`** — same file
  - Same pattern as `budgetLabel`.
  - Verify.

- [ ] 87. **`revenue.amount`** and **`revenue.amountOpt`** — `src/lib/translations/*/revenue.json`
  - Both have `(₪)` baked in.
  - Call sites: `grep -rn "revenue\.amount" src` → **no call sites found in
    initial search**. Leave the keys in place and note in the report:
    "revenue.amount and revenue.amountOpt have no call sites."

- [ ] 88. **`project.currency`** — `src/lib/translations/*/project.json`
  - Current he: `"currency": "₪"`. This is used as a column header label.
  - Call sites: `grep -rn "project\.currency" src` — found in
    `src/lib/server/actions/configs/proposeStipendPledge.ts` (not a translation
    call) and in `src/lib/money/resolve.ts` (not a translation call). The
    translation key itself: check with
    `grep -rn "t('project.currency')" src --include="*.svelte"`.
  - If no call site: note in report, do not delete.
  - If a call site exists: remove `₪` from all 5 locales and add
    `<CurrencySymbol>` at the call site.

- [ ] 89. **`server.stipend`** and **`server.stipendWithBudget`** — `src/lib/translations/*/server.json`
  - Current he: `"stipend": "למימון מלגת הקיום שלה (₪{{rate}} לשעה)"`.
  - The symbol is inside a sentence (the `₪` before `{{rate}}`). Switch to
    passing an already-formatted amount: change the template to
    `"stipend": "למימון מלגת הקיום שלה ({{rate}} לשעה)"` in all 5 locales.
  - Call site: `src/lib/server/actions/configs/requestDonation.ts` lines ~87–89.
    Change: `t('server.donation.stipend', { rate: missionStipendRate })` →
    first resolve the currency (`rikmaCurrency` on the mission's project — need
    to load the project's `currencyCode` from the qid `missionDonationTarget`,
    see item 92 below), then:
    `t('server.donation.stipend', { rate: moneyTextFor(currency)(missionStipendRate, context.lang) })`.
  - Same for `stipendWithBudget`.
  - Verify: `npm run check` and `npm run check:i18n`.

### C11 — Server files

- [ ] 90. **`src/lib/server/actions/configs/proposeStipendProgram.ts`** — lines 215–362
  - Pattern: `₪${terms.X}` → `m(terms.X, lang)` where
    `m = moneyTextFor(rikmaCode)`.
  - At the top of the action's run function (before the first notification
    block), resolve the rikma's currency code:
    ```ts
    import { moneyTextFor } from '$lib/server/money/notifyMoney';
    import { rikmaCurrency } from '$lib/money/resolve.js';
    const rikmaCode = rikmaCurrency(project);           // project is already loaded
    const m = moneyTextFor(rikmaCode);
    const mHe = (n: number) => m(n, 'he');
    const mEn = (n: number) => m(n, 'en');
    ```
  - Replace all `₪${terms.stipendRate}`, `₪${terms.monthlyCap}`,
    `₪${terms.totalCap}` throughout the notification bodies with
    `${mHe(terms.X)}` / `${mEn(terms.X)}` per language branch.
  - The `name` string built at line 222: change to use `mHe(terms.stipendRate)`
    (name is Hebrew-first).
  - The `budgetLabel` at line 215: change to `mHe(terms.X)`.
  - **AI param descriptions** at lines ~459, 461: change
    `'Maximum ₪ per approved hour'` → `'Maximum amount per approved hour (in the rikma\'s currency)'`,
    `'₪ ceiling per cycle'` → `'Ceiling per cycle (in the rikma\'s currency)'`.
  - Verify: `npm run check` — no new errors.

- [ ] 91. **`src/lib/server/actions/configs/publishStipendFundingRequest.ts`** — lines 72–82
  - Remove the local `nis()` helper.
  - Add at the top of the run function:
    ```ts
    import { moneyTextFor } from '$lib/server/money/notifyMoney';
    import { rikmaCurrency } from '$lib/money/resolve.js';
    const m = moneyTextFor(rikmaCurrency(project));
    ```
    (The action already loads the project; use the same `project` object.)
  - Replace each `nis(x)` call with `m(x, 'he')` (the name string is Hebrew).
  - For the AI param description `'₪ per month'` → `'per month (in the rikma\'s currency)'`.
  - Verify: `npm run check` — no new errors.

- [ ] 92. **`src/lib/server/actions/configs/requestDonation.ts`** — line ~76
  - `${amount}₪` → `moneyTextFor(rikmaCurrency(projectAttrs))(amount, context.lang)`.
  - For the `server.stipend*` translation fix (item 89): the action already
    calls `sendToSer … missionDonationTarget`. Find that qid, add `currencyCode`
    to the project attributes selection, and run `npm run validate:qids`.
  - Import `moneyTextFor`, `rikmaCurrency` as needed.
  - Derive `const projectCurrency = rikmaCurrency(oma?.project?.data?.attributes)`.
  - Verify: `npm run check` — no new errors.

- [ ] 93. **`src/lib/server/notifications/maturedNotices.ts`** — lines 550, 562
  - `stipendPaymentConfirmed` signature currently: `{ projectId, projectName, amount, … }`.
  - Add `currency?: CurrencyCode` to the parameter type (optional, default
    `'ILS'` for backward compat).
  - Replace `₪${p.amount}` with `moneyTextFor(p.currency ?? 'ILS')(p.amount, 'he')` on
    line 550 (he branch), and use the value as-is on the en/ar branches (they
    already show `${p.amount}` without `₪` — they just need formatting:
    `moneyTextFor(p.currency ?? 'ILS')(p.amount, 'en')` etc.).
  - **Check callers** of `stipendPaymentConfirmed`
    (`grep -rn "stipendPaymentConfirmed" src`) — pass the project's
    `currencyCode` if the caller has it; if not, note in report.
  - Verify: `npm run check` — no new errors.

### Mails

- [ ] 94. **`src/lib/components/mail/HalukaApproved.svelte`** — line 195
  - Add `currency` prop (default `'ILS'`) to the component's `$props()`.
  - Import `formatMoney` from `$lib/money/format.js`.
  - Replace `{amount} ₪` with `{formatMoney(amount, currency, lang ?? 'he')}`.
  - Find sender (`src/lib/server/actions/configs/approveHaluka.ts`): the
    `emailTemplate: 'HalukaApproved'` call in the notification config. Check
    how `EmailService.ts` passes props. Add `currency: rikmaCurrency(project)`
    to the template props when available.
  - Verify: `npm run check` — no new errors.

- [ ] 95. **`src/lib/components/mail/monthlyRecurringSale.svelte`** (audit shows `₪1`, meaning 1 `<Money>` or 1 `₪` symbol)
  - Add `currency` prop (default `'ILS'`).
  - Import `formatMoney` from `$lib/money/format.js`.
  - Replace every `{amount} ₪` or `{amount}₪` with
    `{formatMoney(amount, currency, lang)}`.
  - Find sender: `grep -rn "monthlyRecurringSale" src --include="*.ts" --include="*.js"`.
    Pass the rikma's currency code when sending.
  - Verify: `npm run check` — no new errors.

- [ ] 96. **`src/lib/components/mail/monthlyResourceActive.svelte`** (same, `₪1`)
  - Same pattern as `monthlyRecurringSale`.
  - Find sender. Pass currency.
  - Verify: `npm run check` — no new errors.

### Telegram

- [ ] 97. **`src/lib/server/telegram/botTexts.js`** — `salePricePrompt` in all 5 languages (lines 103, 246, 389, 532, 675)
  - Remove `(₪)` from each `salePricePrompt` string.
  - Add `{{currency}}` placeholder: e.g. `'שלח/י מחיר ליחידה ({{currency}}):'`.
  - Verify the file exports a function that accepts variables and check how
    other placeholders are substituted (e.g. `getText(key, lang, vars)`).
    If the existing substitution mechanism supports it, pass `currency` there.
    If not (simple string returns, no interpolation), note in the report:
    "botTexts.js does not support runtime substitution; ₪ removed from prompts
    but dynamic symbol not yet injected."

- [ ] 98. **`src/routes/api/newTelegram/+server.js`** — lines 321, 326
  - Lines: `` `${sale.each} ₪` `` and `` `${total} ₪` ``.
  - Check whether `sale.projectId` is available at this point (it is — confirmed
    from the `pendingSale` state map which carries `projectId`).
  - Find the qid `saleCenterUserProducts` and add `currencyCode` to the project
    attributes selection. Run `npm run validate:qids`.
  - Import `moneyTextFor` from `$lib/server/money/notifyMoney` (or inline
    `formatMoney` from `$lib/money/format.js` since this is a `.js` file).
  - Replace `` `${sale.each} ₪` `` → `` `${formatMoney(sale.each, sale.currency ?? 'ILS', lang)}` ``.
  - Replace `` `${total} ₪` `` → `` `${formatMoney(total, sale.currency ?? 'ILS', lang)}` ``.
  - Ensure `sale.currency` is populated from `currencyCode` when the product is
    loaded into `pendingSale` state (in the `getUserProducts` mapping step).
  - **Report**: `saleCenterUserProducts` now selects `currencyCode`.
  - Verify: `npm run check` — no new errors.

- [ ] 99. **Batch 4 gate**
  - `node scripts/audit-money-display.mjs` — remaining lines should all be
    confirmed non-money numbers or out-of-scope items (list each with reason).
  - `grep -rn "₪" src --include="*.svelte" --include="*.ts" --include="*.js" | grep -v translations` — only comments, out-of-scope files (`$lib/money/**`, `externalOffers.ts`, `/api/chat`), and `$lib/crypto/money.ts`.
  - `grep -rn "<Money " src --include="*.svelte" | grep -v "currency=\|projectId=" | grep -v "moach\|components/money"` — every remaining line is a component that renders only under moach/support or a page that calls `provideRikmaCurrency`.
  - `npm run check` — no new errors vs. baseline.
  - `npm run check:i18n` — OK.
  - `npm run check:script` — OK.
  - `npx vitest run src/lib/money src/lib/components/money src/lib/server/money` — green.

---

## Files explicitly NOT touched

| File | Reason |
|---|---|
| `src/lib/components/money/**` | Toolkit implementation — do not edit |
| `src/lib/money/**` | Toolkit implementation — do not edit |
| `quorum/copy.js` | Rule 4 exclusion |
| `src/routes/api/chat/**` | Rule 4 exclusion |
| `src/lib/server/concierge/externalOffers.ts` | Rule 4 exclusion |
| `src/lib/celim/switch.svelte` line 45 | `value` is a form toggle value, not money |
| `src/lib/chat/components/PartnershipGrid.svelte` line 16 | Confirm context; likely non-money |
| `src/lib/components/conf/VersionHistory.svelte` line 85 | `value` is a version/non-money |
| `src/lib/components/deals/DonutChart.svelte` line 79 | `total` is an item count |
| `src/lib/components/hub/DailyBrief.svelte` line 165 | `total` is a count |
| `src/lib/components/hub/DemandMapTeaser.svelte` line 50 | `total` is a count |
| `src/lib/components/grid/nameField.svelte` lines 11, 13 | Form input values |
| `src/routes/its-yours/+page.svelte` line 233 | `value` is a non-money figure |
| `src/routes/(reg)/me/settings/+page.svelte` line 254 | `value` is a settings field |
| `src/routes/(reg)/me/income/+page.svelte` line 115 | Confirm; likely a percentage |
| `src/lib/components/main/tikunolam.svelte` lines 81–134 | Confirm; likely counts |
| Help text keys: `shop.zonesEmptyBody`, `consensus.initialNote`, `shopPage.p3`, `home.*` | Rule 4 |

---

## QID change log (fill in as work proceeds)

> **As of 2026-11-19 none of these has been changed** — this is the list of PLANNED qid changes for Batch 3, not a record of what was done. Move a row to "done" only after `npm run validate:qids` passes.

| QID key | File | Field added |
|---|---|---|
| `283discoverMissions` | `src/routes/api/send/qids.js` | `project.currencyCode` |
| `284discoverResources` | same | `project.currencyCode` |
| `51GetOpenMissionById` | same | `project.currencyCode` |
| `50GetOpenMashaabimById` | same | `project.currencyCode` |
| `saleCenterUserProducts` | same | `project.currencyCode` |
| _(deals qid)_ | same | `project.currencyCode` |
| _(concierge qid)_ | same | `ratson.entryCurrency` |
| _(gift page qid)_ | same | `project.currencyCode` |
| _(user page qid)_ | same | `project.currencyCode` |
| `missionDonationTarget` | same | `project.currencyCode` |

---

## Translation keys with no call site (leave in place, note here)

After running the grep in items 87–88, fill in this table:

| Key | File | Call site found? |
|---|---|---|
| `revenue.amount` | `he/revenue.json` | No (do not delete) |
| `revenue.amountOpt` | `he/revenue.json` | No (do not delete) |
| `project.currency` | `he/project.json` | TBD — check in item 88 |
