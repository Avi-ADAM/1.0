# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This file is read automatically by Claude Code (and other agents that honour
`CLAUDE.md`). Read [`AGENTS.md`](./AGENTS.md) too — it holds the project config,
the Unified Action System, and the Svelte MCP workflow.

---

## Commands

SvelteKit + Svelte 5 app, npm, Node 22.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (`vite dev --host`). |
| `npm run build` | Production build (adapter chosen by env). |
| `npm run check` | `svelte-kit sync` + `svelte-check` against `jsconfig.json` — the typecheck. |
| `npm test` | Vitest, single run. |
| `npm run test:watch` | Vitest watch mode. |
| `npx vitest run path/to/file.test.ts` | Run **one** test file. |
| `npx vitest run -t "name"` | Run tests matching a name. |
| `npm run types:update` | Regenerate GraphQL types after schema changes (`codegen` + `types:extract`). |
| `npm run validate:qids` | Validate every qid in `qids.js` against the Strapi schema. |
| `npm run check:proxy` | Proxy-security lint (see `docs/PLAN_PROXY_SECURITY.md`). |
| `npm run check:i18n` | Verifies every `$t('ns.…')` is reachable on the routes that use it (see i18n section). |
| `npm run check:script` | Flags words that mix alphabets (a Cyrillic `г` inside a Hebrew word, …). |

Tests are colocated (`*.test.ts` / `*.integration.test.ts` / `*.pbt.test.ts`
property-based via fast-check) and run on the `happy-dom`/`jsdom` environment.
There is no separate lint script — `npm run check` is the gate.

## Architecture — request & data flow

The browser never talks to Strapi directly. Two server proxies front the
**Strapi** backend (GraphQL), and both now pass through a shared static
authorization layer.

**1. `/api/send` — the QIDS proxy** (`src/routes/api/send/+server.js`)
- The client calls it with a `queId` naming a **pre-vetted** query from
  `src/routes/api/send/qids.js` (the whitelist — raw GraphQL is dev-only).
- Client helpers live in `src/lib/send/`: `sendTo.svelte` (cookie/JWT path),
  `sendToSer.js` / `sendToSerTyped.ts` (service path), `canI.js` (permission
  introspection against `/api/permissions`).
- `isSer:true` requests get the admin/service token, but **only** when the
  request also carries the internal secret (`isInternalRequest`) injected by
  `handleFetch`. A client cannot forge it.

**2. `/api/action` + `/api/v1/actions` — the Unified Action System**
(`src/lib/server/actions/`) — the required path for all **writes** / server-side
operations. Flow: Validation → Authorization → Execution → Notifications →
structured result. Actions are defined in `src/lib/server/actions/configs/`
(~140 configs, one per action) and registered via `registry.ts`. Execute with:
```typescript
import { actionService } from '$lib/server/actions/index.js';
const result = await actionService.executeAction('actionKey', params, context);
```

**Authorization is two-layered** (`src/lib/server/authz/`, see
`docs/PLAN_API_PERMISSIONS.md`):
- **Static** — principal-kind × operation, answered synchronously from manifests
  (`qidsAccess.js` for qids, `ActionConfig.access` for actions). Gated by
  `AUTHZ_MODE` env: `off` / `log` (shadow-only) / `enforce` (**default** — an
  unset env blocks unauthorized kind×op pairs). API-key traffic is **always**
  enforced. This layer also powers `/api/permissions`.
- **Entity-level** — ownership/membership rules in the action's `authRules`
  (`jwt`, `self`, `projectMember`, `sheirutCustomer`, `sheirutpendRequester`,
  `forumParticipant`, `or`, `custom`) and inline guards in `/api/send`,
  evaluated at execution. When these exist the static answer is `conditional`,
  not `allowed`. The `self` rule verifies a target-user param equals the
  authenticated `context.userId` (from the cookie), so a client cannot act on
  another user's behalf.

**Server→Strapi fetch** is globally patched in `hooks.server.js` to stamp the
`x-strapi-gate` secret (nginx blocks ungated requests) and CORS for the
`api.1lev1.com` instance. Use `STRAPI_URL` from `src/lib/server/strapiUrl.js` in
server code — never `import.meta.env.VITE_URL`.

**Route groups** under `src/routes/`: `(reg)` = registered-user-only pages
(`lev`, `moach`, `hub`, `me`, `onboard`, …); `(regandnon)` = public/mixed
(`project`, `user`, `consensus`, `meeting`, …). `src/routes/api/` holds all
server endpoints.

---

## 🔑 Backend types live in `generated` folders — always look there first

The backend is **Strapi**, consumed over **GraphQL / QIDS**. Do **not** guess the
shape of a Strapi entity, a GraphQL response, or a component. The generated,
authoritative type sources are:

| Folder / file | What it contains | Use it when |
|---|---|---|
| **`src/generated/STRAPI_SCHEMA_REFERENCE.md`** | Human-readable dump of every Strapi content-type, component and field. | You need to know which fields an entity has (Sale, Tosplit, Haluka, Sheirut, User…). |
| **`src/generated/graphql.ts`** | Generated GraphQL operation & result types (graphql-codegen). | Typing a query/mutation result or variables. |
| **`src/generated/index.ts`** | Barrel re-exporting the generated types. | Importing generated types from app code. |
| **`src/lib/generated/contentTypes.d.ts`** | Strapi content-type TS declarations. | Strongly typing an entity attribute object. |
| **`src/lib/generated/components.d.ts`** | Strapi component (repeatable/embedded) declarations. | Typing components like `projects.hervachti`. |

Regenerate with `npm run types:update` (`codegen` + `types:extract`). GraphQL
query ids ("QIDS") live in `src/routes/api/send/qids.js`.

> **Parent/orchestrator agents:** when you spawn a sub-agent that will touch
> backend data, point it at `src/generated/` and `src/lib/generated/` so it reads
> real types instead of inventing them.

---

## i18n — `$t()` + JSON namespaces

All UI text lives in `src/lib/translations/<locale>/<namespace>.json` (he, en,
ar, ru, es) and is read with `$t('namespace.key')`. A `{ he: …, en: … }` object
inside a component is a regression — the only correct multi-locale objects are
the ones indexed by the *recipient's* language (server notification payloads,
action configs, `src/lib/components/mail/*`), which `$t()` cannot express.

The loader table in `src/lib/translations/index.js` is **generated** from
`routes.js`: every locale gets the same namespace list and the same route gate.
Most namespaces load globally; the ones in `ROUTED` are fetched only on the
routes listed there.

> Four ways `$t()` silently renders **nothing** — no warning, no crash, and both
> `svelte-check` and key-parity checks pass:
> 1. the namespace isn't loaded on the current route (the key does exist in the
>    JSON — it was just never fetched);
> 2. the store is used as a dictionary, `t[key]` / `t.foo`, which is what a
>    deleted `const t = { he: …, en: … }` leaves behind when its lookups stay;
> 3. a placeholder written `{name}` — the default parser only substitutes
>    `{{name}}`, so the user reads the placeholder itself;
> 4. a placeholder name shorter than two characters. `{{n}}` cannot be matched
>    by the parser's key regex, so it resolves to the empty default. Use
>    `{{count}}`.
>
> `npm run check:i18n` catches all four. Run it after moving a component between
> routes, after removing an inline dictionary, or after adding an interpolation.

Interpolation is `$t('ns.key', { count })` against `"… {{count}} …"`. A few
older call sites substitute by hand instead — `$t(k).replace('{restime}', v)` —
and the checker allows a single-brace placeholder when a matching `.replace()`
exists.

Hebrew, Arabic and Cyrillic have look-alike letters, and a bad bulk edit leaves
one alphabet's glyph inside another's word (`מפгש`, `ליוوي`, `pתוח`). It renders
as garbage and reorders the RTL run, and no other check sees it —
`npm run check:script` does.

## Money / revenue domain (site-share)

Site-share = the platform (1lev1) taking part in a rikma's profit split as a
service-providing partner. Key locations:

- **Plans:** `docs/PLAN_SITE_SHARE.md`, `docs/PLAN_SITE_SHARE_PER_MEMBER.md`,
  `docs/PLAN_MOACH_SITE_SHARE_DISPLAY.md`.
- **Math (pure, tested):** `src/lib/revenue/` — `computeSiteShare.ts`,
  `buildSiteShareLines.ts`, `parseSiteShareNote.ts`.
- **Server actions:** `src/lib/server/actions/configs/` (`createPlatformSale.ts`,
  `decideSiteShare.ts`, `createSiteShareTransfer.ts`, …).
- **Lev (heart) UI:** `src/lib/components/lev/cards/SiteShare*.svelte`.
- **Moach (project) sales UI:** `src/lib/components/prPr/hamatanot.svelte` +
  `SiteShareSaleNote.svelte`.

Site-share income is recorded as a `Sale` with **no linked product** and a
structured `note` (`site-share · … · from_project=… · halukas=…`). Parse it with
`parseSiteShareNote` — never display the raw note string to users.
# Project super-principles

These are cross-cutting rules that apply beyond the feature that introduced
them. Change them only deliberately.

## Consent & decisions

- **No absolute "no".** A unilateral rejection ends a conversation; the system
  encourages agreement and discussion instead. For anything that needs another
  member's consent, the choices are **approve · chat (clarify/deep discussion on
  the separate consensus site) · negotiate (a more precise counter-claim that
  ping-pongs until both sides sign the same version)** — never a hard reject.
  "I received nothing" is expressed as a counter to quantity/amount 0, not a veto.

- **Silence is consent, at the rikma's pace.** Any standing claim stays open for
  the project's `restime` (via `timegrama`). No response in time ⇒ the last
  version on the table is auto-approved. A counter-proposal resets the clock.
  This applies to every new consent flow, not just sales.

- **Ride the `Decision` model; don't invent new voting.** New consent flows add
  a `kind` to `Decision` and reuse its `votes`/`vots` (with `order` = round),
  `timegrama`, `forums` (chat) and the lev-page decision pipeline. A `kind`'s
  consensus scope can differ: most are rikma-wide, but `saleClaim` is **bilateral**
  (reporter + claimed holder only).

## Sale holder consent (`kind: 'saleClaim'`)

See `docs/PLAN_sale_holder_consent.md`. Reporting a sale where the money is held
by someone else is a claim about that person's financial state and needs their
consent: it opens a bilateral `saleClaim` Decision (`holderStatus:'open'`) that
matures by mutual agreement, a matured counter round, or restime silence. "Money
is with me" is a sovereign self-report (`holderStatus:'self'`), final immediately.
A sale is counted in balances/tosplits only when **effective**
(`holderStatus` is `self`, `confirmed`, or null-legacy) — never while `open`.

## Object archival & edit (`kind: 'archiveObject' | 'editObject'`)

See `docs/PLAN_OBJECT_ARCHIVAL.md`. Removing or changing a rikma object
(open/in-progress mission, open/in-progress resource, product) goes through the
same consent flow its creation did. **Never reuse `archived` for this** — it
already means "taken/assigned" on an open mission and "vote closed" on
pendm/pmash/decision. The archival state is the separate `lifecycle` enum
(`active | archiveProposed | archived | released`; **null = legacy = active**,
so every filter must be
`or: [{lifecycle:{null:true}}, {lifecycle:{ne:"archived"}}]` — a bare `ne`
excludes NULL rows in SQL and would hide every pre-existing object).

A negotiation round carries `mode: 'archive' | 'keep'`, so countering a removal
proposal *is* proposing an edit — the object survives with different terms
instead of being removed. Accrued hours settle as `credit | waive | transfer`,
or `endOfCycle` for a recurring commitment, which schedules
`archiveEffectiveFrom` rather than cutting mid-cycle.

**Membership follows the last commitment.** If the archived/released object was
a member's only tie to the rikma **and nothing accrued** (no hours, no
finnished-mission, no sale, no haluka, no open offer), their membership ends
with it — otherwise they keep counting toward every future quorum in a rikma
they have no stake in. The consequence is stated on the Decision
(`archEndsMembership` + `archMember`) *before* anyone signs, re-checked at
maturation, and never removes the rikma's last member.

**Dormancy is a rikma parameter**, `Project.dormancyDays` with a per-mission
override (urgent missions want a tighter clock). When it runs out the system
does not cancel the assignment directly — it opens the standard release
proposal, so silence still completes it while the assignee keeps a restime to
respond.

## Subsistence stipend (`kind: 'stipendPledge' | 'stipendProgram'`)

See `docs/PLAN_STIPEND.md`. One partner funds another's living costs at a rate
**below** the mission's market rate; the market rate still buys the equity. The
whole model is `(k − α)·P`, and `src/lib/stipend/computeStipendEquity.ts` is its
single source of truth — never recompute it at a call site.

**Who signs is derived, not chosen.** While the rikma's total value does not
move (`(k−α)=0`: α=1 & k=1, or `advance`/`gift`) nobody outside the two parties
is affected, so `stipendPledge` is **bilateral**. The moment it grows, every
member is diluted, so it needs an approved `stipendProgram` — rikma-wide, with a
closed `totalCap` that bounds the dilution, shown to each voter as their own
before/after percentage.

**Only a confirmed payment moves a share.** `stipend-payment.equityCredit /
equityDebit` are the only place a stipend touches percentages, and they count
only at `status:'confirmed'` — the same rule a `Sale` follows while its holder
claim is open. The amount is derived from **approved** hours (`computeStipendCycle`),
never typed: paying for hours a `finiapruval` later refuses has no way back.
"I received nothing" is a counter of amount 0, not a veto.

`Project.stipendPolicy` is `off | bilateral | collective`, and **null = legacy =
`bilateral`** — the mode that cannot dilute a third party — so every filter needs
`or: [{stipendPolicy:{null:true}}, …]`.

Stopping a stipend is `proposeObjectArchive` on the pledge's recurring
`mashabetahalich` with `endOfCycle`; no bespoke stop flow. A rikma with no funder
among its members publishes the need through `publishStipendFundingRequest` as an
ordinary `open-mashaabim` (`source: 'stipend'`), and whoever takes it joins as a
partner.

## Match suggestions (lev recommendations)

See `docs/PLAN_MATCH_SUGGESTIONS.md`. Lev mission/resource suggestions are
**precomputed server-side** into the Strapi `match-suggestion` collection by
`src/lib/server/matching/` (triggered from the actions that create open
missions / open mashaabims and from profile updates), including "new
suggestion" emails. The lev page reads them via qid `209levMatchSuggestions` —
do **not** reintroduce client-side matching over per-skill `open_missions`
pulls in query 83.
