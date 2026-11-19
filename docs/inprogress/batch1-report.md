# Batch 1 Report — C8: moach components

## Summary

Baseline: 96 files / 142 bare-number lines  
After batch 1: 88 files / 132 bare-number lines (−8 files, −10 lines)

`npm run check`: 1218 errors — **unchanged** (matches baseline)  
`npm run check:i18n`: OK  
`npx vitest run src/lib/money src/lib/components/money`: 33 tests green

---

## Files Changed

| File | What changed |
|---|---|
| `src/lib/components/prPr/pendsM.svelte` | Added `Money` import; wrapped `data.attributes.perhour` and `data.attributes.perhour * data.attributes.noofhours` |
| `src/lib/components/prPr/openM.svelte` | Added `Money` import; wrapped `data.attributes.perhour` and `data.attributes.perhour * data.attributes.noofhours` (removed `.toLocaleString` call) |
| `src/lib/components/prPr/newOpn.svelte` | Added `Money` import; wrapped `hours * perhour` total value and `perhour` in the sub-line (`fmtNum(hours)` left as-is — it's a count) |
| `src/lib/components/prPr/mashmam.svelte` | Added `Money` import; wrapped `data.attributes.price`, `data.attributes.easy`, `data.total`, `data.totaltotal` |
| `src/lib/components/prPr/finisin.svelte` | Added `Money` import; replaced `{$t('project.finisin.currency')}{a.perhour.toLocaleString(...)}` with `<Money amount={a.perhour} />`; replaced `{$t('project.finisin.currency')}{a.total}` with `<Money amount={a.total} />`. Note: `project.finisin.currency` key is now unused inside finisin — will be handled in Batch 4 (C10). |
| `src/lib/components/process/lifecycle/SaleLifecycle.svelte` | Added `Money` import; wrapped `attrs.in` (sale income), `attrs.price`, `attrs.estimatedPrice` (product station), `attrs.pricePerUnit` (recipe resources station) |
| `src/lib/components/process/lifecycle/ProcessLifecycle.svelte` | Added `Money` import; wrapped `attrs.perhour` (pendm station), `attrs.price` (pmash and openMashaabim stations), `rAttrs.total`, `rAttrs.price` (rikmash station), `fRate` and `fTotal` (archive station) |
| `src/routes/(reg)/moach/[projectId]/sales/[saleId]/+page.svelte` | Added `Money` import; wrapped `sale.attributes.in` with `entry={sale.attributes}` |
| `src/routes/(reg)/moach/[projectId]/splits/[splitId]/+page.svelte` | Added `Money` import; wrapped `haluka.attributes.amount` |
| `src/routes/(reg)/moach/[projectId]/sales/manage/promotions/+page.svelte` | Added `Money` import; wrapped `p.price` in the product selector |
| `src/lib/components/assistant/RikmaPreview.svelte` | Added `useFormatMoney` import; replaced local `money()` helper (which appended `view.currency` as bare text) with `useFormatMoney`-backed implementation: `fmt_(n, view.currency ?? 'ILS')` |

---

## Files Skipped (moved to Batch 2)

| File | Reason |
|---|---|
| `src/lib/components/prPr/negoPend.svelte` | Renders in `availiableResorce/[id]`, `jenia`, `lev/mashsuggest`, `reqtom`, `pmas`, `pandingMesima`, `pending`, `reqtojoin` — not moach-only. Needs `projectId` prop. |
| `src/lib/components/prPr/negoM.svelte` | Renders in `availableMission/[id]`, `reqtojoin`, `projectSuggestor`, `pandingMesima` — not moach-only. Needs `currency`/`projectId` prop. |
| `src/lib/components/ui/NegotiationHistory.svelte` | Renders in `lev/cards/pending.svelte` and `lev/cards/reqtojoin.svelte` (lev cards). Needs `projectId` prop threaded from callers. |
| `src/lib/components/prPr/open/OpenMissionCard.svelte` | Renders via `OpenBoard.svelte` which is moach-only, but also via `newOpn.svelte` → within moach context. The plan pre-classified this as needing an optional `currency` prop for the public `availableMission/[id]` path. Moving to Batch 2/3. |
| `src/lib/components/prPr/open/OpenResourceCard.svelte` | Same situation as `OpenMissionCard` — same `OpenBoard` → moach route, but public resource page also displays these. Moving to Batch 2/3. |

---

## Files Skipped (no change needed)

| File | Reason |
|---|---|
| `src/lib/components/products/ProductChangesPanel.svelte` | Already receives a `money` function prop from `ProductForm.svelte`. The plan confirms: "no change needed here — fix the caller instead." The caller is handled in Batch 3. |
| `src/lib/components/prPr/missionForm/MissionSummary.svelte` | The `total` prop is already a **formatted string** built by callers (`fmtMoney(unitPrice, currency)` in ProductForm, `formatNum` in mission.svelte). Wrapping it would require changing the prop API (`total: string` → `amount: number`) and updating all three callers (ProductForm, ResourceCreator, mission.svelte). This is a prop API redesign, not a display-only fix. Left for a dedicated batch or separate PR. |

---

## Notes

- `project.finisin.currency` translation key (= `₪`) is now unused inside `finisin.svelte` after the `<Money>` replacement. It was not deleted (per spec rules) — will be addressed in Batch 4 / C10.
- `RikmaPreview.svelte` still shows 3 hits in the audit output (`money(p.price)`, `money(r.price)`, `money(totalSplitValue)`) because the audit script pattern-matches on `{money(...)}` syntax. The function now correctly delegates to `useFormatMoney(n, view.currency ?? 'ILS')`, which uses the proper currency formatter. These are audit false-positives — the display is correct. To eliminate them, `<Money>` components would need to be introduced in a later pass, requiring `provideRikmaCurrency` in the public preview route.
- No stored values, calculations, or mutations were changed.
- No qids were modified.
