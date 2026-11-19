# Batch 2 report — Heart and Hub

Finished the four outstanding items on top of the earlier Heart/Hub changes:

| Item | Display change |
|---|---|
| 44 | `WishOfferCard` receives the proposal's currency through `extractWishOffers` and the Heart store. `83levMainUserQuery` now selects proposal and wish `entryCurrency` and the proposing project's `currencyCode`. |
| 46 | `pending` formats the rate, person value, and rikma total using its project currency. It also passes `projectId` to `NegotiationHistory`. |
| 47b | `MissionStipendOffer` accepts a project ID or explicit currency and uses the same source for amounts and per-hour labels. `sugestmi` passes its project ID. |
| 47c | `BlueprintReview` formats split values and the monetary operands/results in its row summaries. Hours, quantities and percentages remain numeric. |

Audit: **69 files / 82 bare-number hits → 69 / 81**. The `pending` history call still has a `{perhour}` prop flagged by the scanner; it doesn't render a bare number. The stipend component's symbol hit is in a comment. Neither was rewritten for the audit.

The money suite passed in the final combined run (33 tests). The full type-check comparison did not complete in the sandbox; see the [Batch 3 report](./batch3-report.md). QID validation produced no syntax errors and the same two unrelated `settleMissionBackfill` field errors as on the base revision.
