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

## Match suggestions (lev recommendations)

See `docs/PLAN_MATCH_SUGGESTIONS.md`. Lev mission/resource suggestions are
**precomputed server-side** into the Strapi `match-suggestion` collection by
`src/lib/server/matching/` (triggered from the actions that create open
missions / open mashaabims and from profile updates), including "new
suggestion" emails. The lev page reads them via qid `209levMatchSuggestions` —
do **not** reintroduce client-side matching over per-skill `open_missions`
pulls in query 83.
