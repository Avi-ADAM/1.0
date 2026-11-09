# PLAN — One product form for create and edit

**Status:** phases 1–3 built (`src/lib/components/products/ProductForm.svelte` on `/sales/new` and on `/sales/manage/products/[id]`); phase 3 waits for `negoarch.bom` in the `1.0b` deploy · **Model:** the mission/resource creation forms (`docs/tbd/PLAN_MISSION_FORM_REDESIGN.md`,
`src/lib/components/prPr/missionForm/*`)

## Why

Today a seller meets four different screens for one thing:

| Entry | Component | What it does |
|---|---|---|
| "צור מוצר" on the sales page | `prPr/newmatana.svelte` (sheet) | simple product, fixed price |
| "מוצר מורכב" → `/moach/[pid]/sales/new` | `products/ComposeProduct.svelte` | tabs simple / complex, BOM, margin slider, group curve |
| offerings quick flow | `offerings/CreateProductFlow.svelte` → `?fromQuick=1` | where + short form, then "expand" into ComposeProduct |
| `/moach/[pid]/sales/manage/products/[id]` | `shop/ProductEditor.svelte` | details, gallery, options, variants, stock, archive |

(`/gift/[id]/edit` also mounts ComposeProduct — which *creates a new* product instead of editing.)

The split between "simple" and "complex" is a pricing choice dressed up as two products, and the
editor that holds pictures/stock/variants is reachable only *after* saving, so the seller does not
know those exist while creating.

## Decision

**One component, `products/ProductForm.svelte`, used for both create and edit.** Same layout as
the mission form: numbered `FormSection` cards, an "עוד אפשרויות" block of `OptionRow`s, and a
summary aside (desktop) / summary card + sticky save bar (mobile).

**Pricing has exactly two modes — no margin, no overhead:**

1. **לפי עלות בפועל (מומלץ)** — the price is the sum of the product's missions and resources,
   exactly as the BOM pickers compute it today (`costAt(bom, 1)`). `marginPct` is always `0`.
2. **מחיר קבוע** — one number. Under it, the existing "המחיר נקבע לכל בקשה" (`byQuote`) stays as
   a checkbox, because concierge local providers depend on it.

The margin slider (`withMargin` / `marginPct`) is removed from the UI. The server field stays
(old products and `MaagadOfferForm` still carry a stored margin; we do not rewrite them) — the
form just never sends anything but `0`. An existing product with a non-zero margin opens in edit
showing its stored price and a one-line note that the margin is kept until someone changes the
price.

## Structure

| # | Section | Contents | Comes from |
|---|---|---|---|
| — | Header | rikma chip, "מוצר חדש" / product name, one-line hint, full-screen toggle, close | — |
| 1 | מה מוכרים? | name, `RichText` description, cover picture | ComposeProduct base fields + ProductEditor details |
| 2 | איך נקבע המחיר? | segmented: **לפי עלות בפועל (מומלץ)** / **מחיר קבוע**. Cost mode → `MissionPickerList` + `ResourcePickerList` and a result strip "3 משימות + 2 משאבים = ₪1,240". Fixed mode → price + `CurrencyPicker` + byQuote checkbox | ComposeProduct |
| 3 | איך זה נמכר? | segmented חד-פעמי / חודשי / שנתי / ללא הגבלה; quantity (hidden when unlimited); dates for periodic; "פעם אחת לכל רקמה" | ComposeProduct + ProductEditor `kindOf` |
| — | עוד אפשרויות · *אפשר עכשיו או אחר כך* | `OptionRow`s, each with a one-line status: **גלריית תמונות** (count) · **אפשרויות ווריאציות** (axes · variants) · **מלאי** (number / ללא הגבלה) · **מיקום** (`LocationPicker`) · **מחיר לקבוצה** (`forGroup` / cost shapes — only in cost mode) · edit only: **הסרת המוצר** (`ArchiveObjectButton`) | ProductEditor sections, ComposeProduct location + forGroup |
| — | Summary aside / mobile bar | name, price big, how it is computed, completeness checklist (name ✓ · price ✓ · how sold ✓ · pictures/stock/variants *optional*), open-items warning ("2 פריטים עדיין פתוחים"), consent note ("מחיר או וריאציה חדשה נשלחים לשותפים — {{restime}}") and the save button | `MissionSummary` |

A small step rail at the top on mobile (1 · 2 · 3 · עוד) jumps to each section and shows ✓ when it
is complete — the same checklist as the aside, not a wizard: every section stays on one page and
always editable.

## Create vs edit

- **Create**: sections 1–3 are required; every "עוד אפשרויות" row can be filled now. Save runs
  `createComplexMatanot` (pricingMode `estimated` or `fixed`/`quote`, `marginPct: 0`), then — only
  for rows the seller touched — `saveProductOptions` / `saveProductVariants` with the new id. If a
  follow-up save fails, the product is still created: navigate to the edit URL with that row open
  and a toast saying what was not saved.
- **Edit**: the same form at `/moach/[pid]/sales/manage/products/[id]`, hydrated from
  `toEditorProduct`. Saving keeps the "two speeds" of `shopProductEditor.ts` unchanged:
  pictures/stock/SKU/order at once, price and new variants through `editObject` (unless sovereign).
  The aside shows which of the pending changes go to the partners, as `pe-pending` does today.
- **BOM in edit.** Lines are changed, added or removed on the same form, and ride an `editObject`
  round (`negoarch.bom`), same rules as price (phase 3 below).

## Entry points after the change

- "צור מוצר" and "מוצר מורכב" on `hamatanot.svelte` become one button → `/moach/[pid]/sales/new`.
  `newmatana.svelte` stays only where it is used outside the sales page (check callers before removing).
- `CreateProductFlow` keeps its "where" step (new rikma / existing), then lands in the same form
  (the `fromQuick` draft hydration moves into `ProductForm`).
- `/gift/[id]/edit` redirects to the manage edit URL of that product's rikma.

## Phases

1. ✅ `ProductForm` in create mode on `/sales/new`, pricing two modes, margin removed, "עוד אפשרויות"
   with location + group pricing + a pointer to pictures/variants/stock. Strings in `shopEditor.form.*`.
   ComposeProduct stays for `/gift/[id]/edit` until phase 2 (shopEditor is route-gated to /sales).
2. ✅ Edit mode: ProductEditor's gallery / options / variants / stock / archive are `OptionRow`s
   (`GalleryField`, `VariantsField`, `ProductChangesPanel`; the logic stays in
   `$lib/shop/variantEditor` + `productEditor`), staged rows in create mode, `/gift/[id]/edit`
   redirects. ProductEditor and ComposeProduct are gone. Decided while building:
   - `saveProductVariants` also takes `stock` (the product's own count, only with no variants) and
     `location`. Both are operational, like pictures and categories.
   - In edit the pricing mode is read-only. `byQuote` can change on a sovereign product only
     (`PRICING_MODE_IS_TERM` refuses a rikma's). `oneForeProject` and the currency are read-only.
   - Staged variant prices are written as typed, so a create in a currency other than the rikma's
     is refused while a variant has its own price.
   - A new variant's placeholder SKU (`NEW-M`) is stamped with the product id on save (`stampNewSkus`).
3. ✅ BOM editing on an existing product through `editObject` (`$lib/shop/bomEditor`,
   `$lib/server/archive/bomTerms`). Deploy needs `negoarch.bom` (json) from `1.0b`; until a probe
   sees it, a multi-member rikma's recipe change answers `BOM_TERMS_NOT_READY` and the rest saves.
   Decided while building:
   - The vote on the round is the rikma's consent, so an added line opens at once, in the shape a
     decided `pendm` / `pmash` leaves. No second vote. An owner can be picked: they sign the same round
     explicitly (`requiredSigners`), the members' silence matures but theirs does not, so the one
     vote approves the work and the assignment and the mission starts on their name. A counter can
     take the owner off (`releaseBomAssignment`), and then the line just opens for anyone. A resource's
     owner picks which of theirs it is, or creates one, in the modal their yes opens
     (`signBomAssignment`, on the heart card, the vote page and the product page), so it
     registers with the same vote. Proposing is agreeing: whoever takes a resource on themself picks
     it in the same modal as they save, in a rikma of one too.
   - Nothing is deleted. A removed line is detached from the product (`matanot: null`, a resource
     also `archived`); the Decision keeps what it was. The mission or resource stays in the rikma.
   - A wish product's lines are what its customer is billed by (`loadDealDue`). A version that asks
     for more needs her signature on the deal page (`dealSignersFor`, `DealRecipePanel`), and her
     silence is not her yes. She approves, or keeps only the changes she needs (`counterDealRecipe`).
     On a fixed-price deal nobody but the rikma signs. The bill moves only for held lines; an open
     line joins it when its candidacy matures (`offerDeal`).
   - The price follows the new cost until the seller types one. It goes on the same round.
   - The pricing mode stays read-only, and a group curve (`costShape`) is not edited here.

## i18n

New keys under `shopEditor.form.*` in he/en/ar/ru/es; remove `offerings.compose.marginPct` and the
mode-tab keys when ComposeProduct goes. "rikma" terminology per CLAUDE.md. Run `npm run check:i18n`
and `npm run check:script`.

## Acceptance

- `npm run check`, `npm test`, `check:i18n` clean.
- Create: fixed price, by-quote, cost-based (with an open mission and an assigned resource), with
  and without variants/stock filled at create — payloads equal to today's minus margin.
- Edit: price change on a multi-member rikma opens `editObject`; stock change saves at once; solo
  rikma applies everything.
- 390px: no horizontal scroll, sticky bar, step rail reaches every section. RTL + LTR.
