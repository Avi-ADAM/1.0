# CLAUDE.md — guidance for Claude / AI agents working in this repo

This file is read automatically by Claude Code (and other agents that honour
`CLAUDE.md`). Read [`AGENTS.md`](./AGENTS.md) too — it holds the project config,
the Unified Action System, and the Svelte MCP workflow.

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
