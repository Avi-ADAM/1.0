# Batch 3 report — Public pages, deals and concierge

## Display changes

- Discovery list and detail pages use the project currency, or the source wish's entry currency for a projectless request. Products and storefront amounts use the item's project, or the owner for a personal item without a project. Maagad suggestion currencies are resolved per row.
- Open mission and resource cards accept an optional currency from `OpenBoard`; quantities, hours and cycles stay numeric. The public mission detail provides currency context for negotiation and stipend components.
- The public rikma page formats product prices. Join-page numeric inputs retain their bindings and show the project's symbol. The support page was already covered by `provideRikmaCurrency` and its loader already selects `currencyCode`.
- Deal detail and request pages provide context for nested panels. Deal list cards, pending requests, sales-center products, and recurring cycles resolve currency per item. The public and managed direct offer use the offer's source currency; the composer reads the provider's account currency. The hard-coded sales-center currency label was removed from all five locales.
- Concierge budgets and proposals use their respective source currencies. Mixed-currency dashboard and wish totals are not presented as a single amount, and a wish total in another currency isn't compared against its budget in the UI. The existing calculations and persisted values are unchanged.

## Read selections changed

| Area | QIDs |
|---|---|
| Discovery and public detail | `283discoverMissions`, `284discoverResources`, `282discoverProducts`, `51GetOpenMissionById`, `50GetOpenMashaabimById`, `48GetServiceById`, `49GetProjectById`, `266getMatanotSellerMeta` |
| User and storefront | `52GetUserById`, `268getUserStorefront`, `265listMyPersonalMatanots`, `308myResourcesViaUser` |
| Maagad and concierge suggestions | `202findAvailableSp`, `203findMatanotByText`, `271findMissionOffersByText` |
| Wishes and offers | `105queryRatsonWithProposals`, `106listMyRatsons`, `109listOpenRatsons`, `111listMyWishInvitations`, `433directOfferById` |
| Deals | `123dealsForUser`, `124sheirutForDeal`, `72getSheirutpendById`, `saleCenterUserProducts`, `saleCenterPendingCycles`, `dealsCustomerPendingCycles` |

Added read fields only: `Project.currencyCode`, `User.currency`, and `entryCurrency` on wishes/proposals. The offer composer reuses `meProfile` unchanged.

## Verification and exceptions

- Audit: **69 files / 81 bare-number hits → 59 / 59**. Remaining in-scope false positives include `{perhour}` on an open mission stipend component and the pending negotiation prop, `c.amount` (hours/quantity) on wish counters, formatted `w.budget` strings, `ResourcePanel` progress percentage, `DonutChart` counts and generic `StatsCard` values.
- `ProductPeek` uses hard-coded demo figures with translated currency-labelled example terms, not loaded product prices. Left the demo untouched per the `home.*` examples exclusion. `RikmaPage` impact `s.value` is arbitrary editor-authored text, not a monetary field.
- `npm run check:i18n` passed. The focused Vitest run passed **63 tests** (including 33 money tests and discovery currency-source coverage). Changed Svelte files compiled, and `git diff --check` passed.
- `npm run validate:qids` reported **838 queries parsed, 0 syntax errors**, and the same two field errors as on the base revision: `settleMissionBackfill` uses `monter` and `totalHoursSaved`, absent from `FinnishedMissionInput` in the checked-in reference. No mutations were changed.
- Full `npm run check` was blocked by memory: the base run exhausted the Node heap and the larger-heap run on the working tree was killed. A focused `svelte-check` comparison for the changed files and their dependency graph reported **148 errors and 242 warnings on both revisions**, with no new diagnostics (ignoring shifted line numbers, sandbox paths and union-member ordering). The full gate remains open.
