# `advance` — the removed fourth stipend mode

A subsistence stipend has **three** shapes, and they are the three a member can
actually be asked to agree to:

| # | terms | what accrues | who signs |
|---|---|---|---|
| 1 | `equity`, `costShare = 0` | recipient accrues the mission's full `M×H`; funder accrues the stipend `P` as a contributed resource. The rikma's total grows, so **everyone is diluted together** | rikma-wide (a `stipendProgram`) |
| 2 | `equity`, `costShare = 1` | funder accrues `+P`; recipient accrues only the difference `M×H − P`. **Nobody else moves** | bilateral |
| 3 | `gift` | nothing. The funder is not buying a partnership — they are a supporter, and the pledge only records what they committed to | bilateral |

A fourth mode, **`advance`** — a repayable loan — was built and then removed as
a product decision: a person who needs money to live should not end up owing it
back, and "repay even if no revenue ever arrives" is a complication the model
does not need. This file records exactly what it was, so the decision can be
revisited without archaeology.

## What `advance` actually did

**In the maths: nothing.** `computeStipendEquity` returned
`{equityCredit: 0, equityDebit: 0, netChange: 0}` for `advance` — byte-identical
to `gift`. The two modes were never distinguishable in any percentage, balance
or split. That is why legacy rows are now read *as* `gift`: it preserves their
real behaviour exactly.

**In the product: a promise nothing kept.** The repayment side was specified in
`docs/PLAN_STIPEND.md` §6 ("the outstanding balance is shown to the recipient,
and a *repay* button opens when they receive distribution money") and **never
implemented** — there was no debt ledger, no balance, no repay action, no
collection, and `distribute()` was deliberately never touched. So the mode
offered members a loan the system could not track and could not collect.

**What existed in code** (all inert):

- `StipendMode` included `'advance'`; `normalizeTerms` accepted it.
- `StipendRecourse = 'nonRecourse' | 'personal'` and the `recourse` term,
  defaulting to `nonRecourse`.
- A third mode chip in `StipendTermsFields.svelte`, plus a "can also be
  collected from the recipient personally" checkbox shown only for `advance`.
- `recourse` written into the `negostipend` round component and the
  `stipend-pledge` row, read back in `read.ts` / `decisionView.ts`, and passed
  along by `counterStipendTerms`, `getStipendWork` and the counter drawer.
- i18n: `stipend.mode.advance`, `mode.advanceExplain`, `pay.modeNote.advance`,
  `terms.recoursePersonal`, `terms.recourseExplain`.

## What is still there, deliberately

- **The Strapi enum keeps `advance`**, and `stipend-pledge.recourse` still
  exists. Dropping a value from a deployed enum is a migration, and rows may
  already carry it; leaving it costs nothing.
- **Reads normalise it to `gift`** — `normalizeTerms`, `createMission` and
  `fromMission` all do this — so an old row keeps behaving the way it always
  behaved.
- **Writes cannot produce it**: every server `MODES` allow-list is
  `['equity', 'gift']`.
- The `mode.advance*` and `pay.modeNote.advance` translation keys stay, so a
  legacy row that reaches a display path still renders a real sentence rather
  than an empty string. `terms.recourse*` were removed — nothing can select it.

## Re-enabling it

Do **not** just put the chip back: the mode's whole point is the repayment, and
that is the part that was never built.

1. Build the debt side first — an outstanding-balance figure per pledge, a
   repayment record, and the rule that it is repaid **only** from `Haluka`
   distributions, never from the recipient's pocket (`nonRecourse` is the
   default for a reason: a personal debt on someone who needed subsistence
   money inverts the goal).
2. Add `'advance'` back to `StipendMode` and to the `MODES` allow-lists listed
   above.
3. Restore the mode chip and the `recourse` checkbox in `StipendTermsFields`,
   and the `terms.recourse*` keys in all five locales (`git log` has them).
4. Decide what `advance` means in `computeStipendEquity` — if it stays zeros,
   it is a `gift` with a repayment obligation attached, and the difference must
   live entirely in the debt ledger.

## Related, not the same

`revenueTrigger` is **not** part of this. It is the monthly-revenue threshold at
which a stipend of *any* mode ends by itself and the rikma goes back to ordinary
distribution — it belongs to stopping, not to repayment, and it stays.
