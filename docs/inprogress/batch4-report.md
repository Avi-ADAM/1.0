# Batch 4 report — translations, server, mails, Telegram

Display only: no stored value, calculation or mutation changed. The one read
that grew is the inline timegrama query in `api/timegrama/stipendPayment.svelte`,
which now also selects `project.currencyCode`. `donationProjectInfo` and
`saleCenterUserProducts` already selected it, so **no qid in `qids.js` changed**.

## C10 — translation keys

| Key | Change | Call site |
|---|---|---|
| `stipend.terms.rate`, `monthlyCap`, `totalCap`, `revenueTrigger`, `stipend.confirm.howMuchArrived` | `₪` removed from **he** (the other four locales never had it) | `StipendTermsFields`, `MissionStipendSection`: `<CurrencySymbol />` in the label (the rikma context). `StipendConfirmCard`: `<CurrencySymbol currency={projectCurrency(buble.projectId)} />`. `StipendDecisionCard` / `StipendFundingRequestDialog` already render the value with `<Money>`. |
| `concierge.new.budgetLabel`, `concierge.new.money.fixedAmount`, `atCostAmount` | `(₪)` removed in all 5 | `WishForm`: `<CurrencySymbol />` in the label. A wish stores no `entryCurrency` on create, so it is the default currency, the same one the preset pills format with. |
| `consensus.demo.perHourUnit` | now `{{amount}} …` in all 5 (en/es said `$`, he/ar/ru said `₪`) | `consensus/+page.svelte`: `fmtMoney(x, DEFAULT_CURRENCY)`. The demo belongs to no rikma. The demo total is formatted the same way. |
| `consensus.demo.counterForm.perHourLabel` | symbol removed in all 5 | `<CurrencySymbol currency={DEFAULT_CURRENCY} />` beside the label |
| `server.donation.stipend`, `stipendWithBudget` | `₪` removed from **he** | `requestDonation` passes amounts already formatted in the rikma's currency |
| `equity.estimateNote`, `estimateNoteCommitments` (en) | "The ₪ figure" → "The money figure", like the other four | not in the plan, found by the acceptance grep |

**No call site, left in place:** `revenue.amount`, `revenue.amountOpt`,
`project.currency`, `project.finisin.currency`.

## C11 — server

- `proposeStipendProgram`: every `₪${terms.X}` (Decision name, budget label, all
  three notification bodies) goes through `moneyTextFor(project.currency)`. The
  English branches were bare numbers and are now formatted too.
- `publishStipendFundingRequest`: `nis()` formats in the rikma's currency.
- `requestDonation`: the donor's amount and the stipend rate/budget are in the
  rikma's currency (from `donationProjectInfo.currencyCode`).
- `maturedNotices.stipendPaymentConfirmed` takes `currency` (absent ⇒ ILS); its
  only caller, `timegrama/stipendPayment.svelte`, passes it.
- AI param descriptions in `proposeStipendProgram`, `proposeStipendPledge`,
  `publishStipendFundingRequest`, `createMission` and `mastra/createMissionTool`
  now say "in the rikma's currency".

## Mails

`HalukaApproved`, `monthlyRecurringSale` and `monthlyResourceActive` take a
`currency` prop (default `ILS`) and format with `formatMoney`. **No sender passes
an amount to any of them today**: `approveHaluka` uses a static `emailTemplate`
with no `emailTemplateData`, `monthlyRecurringSale` isn't registered in
`EmailService`, and nothing sends `MonthlyResourceActive`. So there is no sender
to give a currency to. Whoever wires the amount in should pass the currency in
the same place.

## Telegram

`salePricePrompt` × 5 now reads `({{currency}})`, filled with the product's
rikma symbol. The sale card formats the unit price and the total with
`formatMoney` in that rikma's currency (`getUserProducts` → `pendingSale.currency`).

## Also fixed (not in the plan)

`revenue/SiteShareDecision` defaulted to `currency = '₪'` and no caller passed
one, so every site-share decision said shekels. It now resolves an explicit
code, else `projectId` (passed by `haluka`, `SiteShareAutoApprovedCard`,
`OpenSiteShareReminder`), else the moach context (`whowhat`).

## Left as is

- `services/productAggregationService.js:496`: a `${price}₪` display name. Its
  product rows carry no currency.
- `concierge/[id]/+page.server.ts:230`: the `?? '₪'` fallback for a proposal
  matbea with no symbol.
- `api/mission/suggest`: the AI prompt asks for an Israeli-market rate in shekels.
  That is the meaning of the number, not a display.
- Comments, tests, and the rule-4 exclusions.

## Gate

- `node scripts/audit-money-display.mjs`: **56 files / 59 lines** (after batch 3:
  59 / 59). What is left is the batch 3 false-positive list: shorthand props,
  counts, percentages, form values.
- `npm run check`: **1217 errors**, the same as before this batch, none in a
  changed file.
- `check:i18n`, `check:script`, `check:ui-hebrew`: OK.
- `npx vitest run src/lib/money src/lib/components/money src/lib/server/money src/lib/server/notifications src/lib/components/concierge src/lib/components/stipend src/lib/components/revenue`:
  **14 files / 209 tests passed**.
