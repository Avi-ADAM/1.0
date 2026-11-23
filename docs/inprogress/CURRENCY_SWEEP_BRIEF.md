# Currency sweep — execution brief

> For an executing agent. The why lives in
> [PLAN_MULTI_CURRENCY.md](./PLAN_MULTI_CURRENCY.md) §1–§2 and §6 — read §1 and
> §6 first (10 minutes). This brief covers **C8–C11 only**. C12 (typing an amount
> in a different currency in negotiations and the remaining forms) is **out of
> scope**; don't start it.

## Progress — where we are (updated 2026-11-19)

**Continuing from a previous agent?** Your working checklist, with line
numbers per file, is [currency-sweep-plan.md](./currency-sweep-plan.md). Its
top table says what's done. Mark `[x]` there as you go, and add a
`batchN-report.md` at the end of each batch like
[batch1-report.md](./batch1-report.md).

| Batch | State |
|---|---|
| 1 — moach | ✅ done (`67ef3d3c`). Audit went from 96/142 to 88/132. |
| 2 — heart / hub | Display fixes complete. See [batch2-report.md](./batch2-report.md). |
| 3 — public pages / deals / concierge | Display fixes complete. See [batch3-report.md](./batch3-report.md) for the remaining verification gates. |
| 4 — translations / server / mails / Telegram | ✅ done. See [batch4-report.md](./batch4-report.md). C8–C11 are complete; C12 is still out of scope. |

Deferred, don't do: `prPr/missionForm/MissionSummary` — its callers already
pass it a string formatted in the right currency, so changing it would be a
prop API change, not a display fix.

## What is wrong, in one paragraph

Every rikma counts in one currency (`Project.currencyCode`, null = ILS) and every
stored amount is already in that currency. Nothing in the math needs to change.
What's broken is the **display**: about 60 components print `{perhour}` /
`{price}` / `{total}` as a bare number with no currency at all, ~50 `<Money>` call
sites outside the rikma's own pages have no currency source and silently show
shekels, a few dozen translation strings have `(₪)` baked in, and some server
messages, mails and the Telegram bot hard-code `₪`. For a rikma that counts in
dollars, all of these are wrong.

## Hard rules — read before touching anything

1. **Display only.** Never change a stored value, a calculation, a qid's
   mutation, or what an action writes. If a fix seems to need that, stop and
   note it in the report.
2. **Never call `formatMoney` / `toLocaleString` with a hard-coded currency, and
   never write `₪`, `$`, `ILS`.** The currency always comes from the data.
3. **Always find the currency source first** (see table below). `<Money amount={x} />`
   with no `currency` / `projectId` is correct **only** under
   `src/routes/(reg)/moach/[projectId]/**` (the layout provides it) and on
   `project/[id]/support`. Anywhere else it's the C9 bug.
4. Don't touch: code comments, `src/lib/components/money/**`, `src/lib/money/**`,
   `quorum/copy.js`, `/api/chat`, `server/concierge/externalOffers.ts`, and
   example sentences inside help text (`shop.zonesEmptyBody`,
   `consensus.initialNote`, `shopPage.p3`, `home.*`).
5. **Change only what shows money.** Don't reformat a file and don't rewrite a
   shorthand prop (`{perhour}` → `perhour={perhour}`) just to make the audit
   number drop. The audit mistakes a shorthand prop on its own line for
   rendered text, so list it in the report as a false positive. Batch 2 did both,
   which left a lot of noise in the diff.
6. **A number that isn't money stays as it is.** `total` is sometimes an item
   count (`DonutChart`, `DailyBrief`, `DemandMapTeaser`), `value` is sometimes a
   percentage or a form value (`its-yours`, `VersionHistory`, `crtask`,
   `nameField`, `switch`, `me/settings`). The audit script lists these too —
   read the line before changing it.
7. i18n per `CLAUDE.md`: no Hebrew typed into markup; placeholders are
   `{{name}}` with two or more characters; edit all five locales
   (`he en ar ru es`) together.
8. Work on `main`, **don't commit, don't push, and don't run `git add`.** The
   human commits once at the end, because every push deploys. Other sessions
   work in this folder at the same time and share the git index, so a `git add`
   or `git commit` here also takes their staged files. That's what happened in
   batch 1, which swept another session's `PLAN_LTR_LAYOUT.md` into its commit.

## The toolkit — that's all you need

| Need | Use | Import from |
|---|---|---|
| Amount in markup | `<Money amount={x} currency={code} entry={row} />` | `$lib/components/money/Money.svelte` |
| Amount on a lev/hub card (several rikmas on one page) | `<Money amount={x} projectId={buble.projectId} />` | same |
| Amount inside `$t()`, an attribute, a toast | `const fmt = useFormatMoney();` then `fmt(x, code)` | `$lib/money/context.svelte` |
| Currency symbol next to an input | `<CurrencySymbol currency={code} />` | `$lib/components/money/CurrencySymbol.svelte` |
| A rikma's code from a project row | `rikmaCurrency(project)` (null ⇒ `ILS`) | `$lib/money/resolve.js` |
| Server text in a rikma's currency | `const m = await rikmaMoneyText(projectId, jwt, fetch); m(amount, lang)` | `$lib/server/money/notifyMoney` |
| Server text when the code is already known | `moneyTextFor(code)(amount, lang)` | same |

`hours × rate` is computed first and the result wrapped: `<Money amount={noofhours * perhour} … />`.
A per-hour rate is `<Money amount={perhour} … />` followed by the existing
`$t('common.perhour')` — don't build a new string.

### Where the currency comes from

| Screen | Source |
|---|---|
| `routes/(reg)/moach/[projectId]/**` and every component it renders | the context — omit `currency` |
| Heart (`/lev`) and hub (`/hub`) cards | `projectId={buble.projectId}` (the page already provides the map; check how the card receives the project id — in `LevCard.svelte` it's `buble.projectId`) |
| Public page of a mission/resource/product/rikma | the project in the loader's data: `currency={rikmaCurrency(x.project?.data?.attributes)}`. **If the qid doesn't select `currencyCode` on the project, add it to the selection only** (the field exists in Strapi; adding a field to the selection is safe) and run `npm run validate:qids` |
| Wish (concierge), wish proposal | `entryCurrency` on the `ratson` / `ratson-proposal` row; a proposal from a rikma — that rikma's `currencyCode`; only if neither exists — `ILS` |
| `/deals/**` | the product/deal's rikma — pass `currency` down from the page as a prop to the panels, or call `provideRikmaCurrency(() => code)` once at the top of the page (preferred: one line instead of 30 props) |
| User page / storefront (`user/[id]`, `UserStorefront`, `MyProductsSection`, `MyResourcesEditor`) | the item's project if it has one; a personal item without a rikma — the person's `User.currency`, else `ILS` |

## Work order — four batches, a verification gate after each

Run before you start and after every batch:

```powershell
node scripts/audit-money-display.mjs
```

```powershell
npm run check
```

```powershell
npm run check:i18n
```

```powershell
npx vitest run src/lib/money src/lib/components/money
```

`check` and `check:i18n` must not add errors relative to the run before the batch
(save the first run's output and compare). The audit number should go down.

### Batch 1 — C8: moach (the easy case: the context is already there)

Files (just add `<Money>` — no currency source needed when the component renders inside moach):
`prPr/negoM.svelte`, `prPr/negoPend.svelte`, `prPr/pendsM.svelte`,
`prPr/openM.svelte`, `prPr/newOpn.svelte`, `prPr/mashmam.svelte`,
`prPr/finisin.svelte`, `prPr/open/OpenMissionCard.svelte`,
`prPr/open/OpenResourceCard.svelte` (replace `fmtNum(...)` on amounts — not on
quantities/cycles), `prPr/missionForm/MissionSummary.svelte`,
`ui/NegotiationHistory.svelte`, `process/lifecycle/SaleLifecycle.svelte`,
`process/lifecycle/ProcessLifecycle.svelte`, `products/ProductChangesPanel.svelte`,
`routes/(reg)/moach/[projectId]/sales/[saleId]/+page.svelte` (`sale.attributes.in`, pass `entry={sale.attributes}`),
`.../splits/[splitId]/+page.svelte` (`haluka.attributes.amount`),
`.../sales/manage/promotions/+page.svelte` (line ~372),
`assistant/RikmaPreview.svelte` (a local `money()` helper — check what it does; if it puts ₪, switch it to `useFormatMoney`).

Before each file: `grep -rn "<ComponentName" src` and confirm it's rendered only
under moach. If it's also rendered elsewhere — it belongs in batch 2.

### Batch 2 — C8+C9: the heart and the hub

Bare numbers: `lev/cards/reqtojoin`, `sugestmi`, `sugestma`, `pending`,
`rektom`, `pma`, `SaleCard`, `CustomerSaleCard`, `SheirutHalukaCard`,
`SiteShareIncomeCard`, `haluka` (`row.value.toFixed(2)`), `ProductRequestCoin`;
`lev/mashsuggest`, `pandingMesima`, `pmas`, `projectSuggestor`, `reqtom`,
`mesima`, `missionInProgress`, `didiget`, `newcoinui`, `weget`, `negoArchive`.

`<Money>` without `projectId` (C9): `CustomerPayment`, `CustomerSaleCard`,
`dowegeot`, `weget`, `sugestma`, `rektom`, `hachlata`, `pma`,
`StipendDecisionCard`, `decisionMaking`, `WishOfferCard` (the last one — a wish
proposal, by the table).

Every card gets `projectId` from its `buble`. If a card doesn't receive it — add
the prop where `LevCard.svelte` renders it (that's the existing pattern there).
Some of these cards also render in moach's vote screen (`moach/VoteDetail.svelte`) —
there the context covers it, and `projectId` doesn't hurt.

### Batch 3 — C8+C9: public pages, deals, concierge

`routes/(regandnon)/availableMission/+page.svelte` + `[id]`,
`availiableResorce/+page.svelte` + `[id]`, `gift/+page.svelte` + `[id]`,
`maagad/[id]/+page.svelte`, `user/[id]/+page.svelte`, `offer/[key]/+page.svelte`,
`project/[id]/join/+page.svelte`, `rikmaPublic/RikmaPage.svelte`,
`offerings/UserStorefront.svelte`, `offerings/MyProductsSection.svelte`,
`offerings/MyResourcesEditor.svelte`, `main/ProductPeek.svelte`,
`routes/deals/**` + `components/deals/*`, `routes/deals/sales-center/+page.svelte`
(remove the `pages.salesCenter.shekel` key from all 5 locales after replacing it),
`routes/(reg)/concierge/+page.svelte` (`fmtBudget`) and `concierge/[id]/+page.svelte`.

This batch is where you may need to add `currencyCode` to qids' selections. Each
qid you touch: `npm run validate:qids`. List them in the report — Strapi already
has the field, so there's no deploy dependency, but the human wants to know.

### Batch 4 — C10 + C11: texts, server, mails, Telegram

**C10 — translations.** For each key below, remove the symbol from the text in
all 5 locales, and at the call site place `<CurrencySymbol currency={code} />`
right after the input (or before it — copy what `prPr/mission.svelte:1607` does).
Where the symbol is part of a sentence and can't move (`server.stipend*`, `consensus.perHourUnit`)
— switch to a placeholder: `"…{{rate}} לשעה…"` and the call site passes an already
formatted amount (`fmt(rate, code)`), so the symbol arrives from the formatter.

Keys: `stipend.rate`, `stipend.monthlyCap`, `stipend.totalCap`,
`stipend.revenueTrigger`, `stipend.howMuchArrived`, `pages.mPerhour`,
`pages.rPrice`, `pages.shekel`, `consensus.perHourUnit`,
`consensus.*.perHourLabel`, `concierge.budgetLabel`, `concierge.*.fixedAmount`,
`concierge.*.atCostAmount`, `revenue.amount`, `revenue.amountOpt`,
`project.currency`, `server.stipend`, `server.stipendWithBudget`. Find the
exact path of each key with `grep -rn` in `src/lib/translations/he/`, and its
call sites with `grep -rn "'<ns>.<key>'"`. **A key with no call site — leave it
and note it in the report**, don't delete it.

**C11 — server.** `proposeStipendProgram.ts` (lines ~215–362: `₪${x}` ⇒ `m(x, lang)`
where `m = await rikmaMoneyText(projectId, jwt, fetch)` once at the top of the run;
the `{ he: …, en: … }` strings stay as they are — they're indexed by the
recipient's language, that's allowed), `publishStipendFundingRequest.ts` (the
`nis()` helper ⇒ `rikmaMoneyText`), `requestDonation.ts` (line ~76),
`notifications/maturedNotices.ts` (550, 562 — check whether `p` has a
`projectId`; if so — `rikmaMoneyText`). AI parameter descriptions
(`"₪ per month"`, `'₪ per approved hour'`, `'₪ ceiling …'` in
`proposeStipendPledge.ts` and `publishStipendFundingRequest.ts`) ⇒ `"in the rikma's currency"`.

**Mails.** `mail/HalukaApproved.svelte`, `mail/monthlyRecurringSale.svelte`,
`mail/monthlyResourceActive.svelte`: add a prop `currency` (default `'ILS'`), format with
`formatMoney(amount, currency, lang)` from `$lib/money/format.js` (not `<Money>` —
a mail has no context and no conversion), and in each sender
(`grep -rn "HalukaApproved\|monthlyRecurringSale\|monthlyResourceActive" src --include=*.ts --include=*.js`)
pass the rikma's currency — `rikmaMoneyText(...).currency` gives it in one line.

**Telegram.** `server/telegram/botTexts.js` — `salePricePrompt` × 5 languages:
remove `(₪)` and add `{{currency}}` (or the bot's equivalent — check how the
file substitutes), and in `api/newTelegram/+server.js` lines ~321, 326 switch
`${x} ₪` to `moneyTextFor(code)(x, lang)`, with `code` from the sale's project
(check whether the bot already loads the project; if it doesn't — note it
in the report and leave it as is).

## Acceptance — how to know it's done

1. `node scripts/audit-money-display.mjs` — every remaining line is a non-money
   number (rule 6) or out of scope; list them in the report with a one-word
   reason each.
2. `grep -rn "₪" src --include=*.svelte --include=*.ts --include=*.js | grep -v translations`
   — only comments, the files in rule 4, and `src/lib/money/**`.
3. `grep -rn "<Money " src --include=*.svelte | grep -v "currency=\|projectId=" | grep -v "moach\|components/money"`
   — every remaining line is in a component that renders only under moach /
   support / a page that calls `provideRikmaCurrency`.
4. `npm run check`, `npm run check:i18n`, `npm run check:script`,
   `npm run check:ui-hebrew` — no new errors.
5. `npx vitest run src/lib/money src/lib/components/money src/lib/server/money` — green.

## The report at the end

A short list: what changed per batch (files), which qids gained `currencyCode`,
translation keys that were changed or found without a call site, what you didn't
fix and why (especially anything that seemed to require a change in what gets
written), and the output of the five checks above.
