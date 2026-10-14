# 1lev1 (1💗1) — Consensus-Based Partnerships

**Build together, agree together, share the value you create.**

1lev1 is a collaborative platform for forming and managing **rikmas**: partnerships where people contribute work and resources, agree on commitments, and distribute income according to their contributions and shared agreements.

The platform brings discovery, planning, negotiation, day-to-day work, sales, and income distribution into one connected workflow. AI helps people describe needs and prepare proposals; the people affected by those proposals remain part of the agreement process.

[Visit 1lev1](https://www.1lev1.com) · [Documentation index](docs/README.md) · [Contributor instructions](AGENTS.md)

## What the platform does

- **Find people and opportunities.** Discover rikmas, missions, resources, and products through profiles, matching suggestions, and map-based discovery.
- **Manage shared work.** Use the Moach (rikma workspace) to work with missions, smaller action items, resources, planning boards, Kanban, Gantt charts, process chains, and work timers.
- **Reach agreements.** Propose, discuss, and negotiate commitments through shared decision flows, including changes to existing work and the release or archival of commitments.
- **Track contributions and distribute income.** Record work and resources, preview their effect on partnership shares, manage sales and income splits, and support living-cost stipends and the platform's share. Multi-currency accounting distinguishes recorded transaction rates from display conversions.
- **Create and deliver products and services.** Combine missions and resources into products, manage customer deals, and record one-off or recurring sales.
- **Plan with AI assistance.** Turn a wish into a proposed breakdown of work and resources through the concierge, or develop a rikma's next steps through AI-assisted mission creation and planning boards.
- **Keep collaboration connected.** Hub and Lev (the personal action feed) surface decisions, work, and updates. Socket.IO supports real-time updates alongside email and push notification infrastructure.
- **Connect external tools.** Scoped APIs support external task and sales creation; MCP tooling and OAuth support agent integrations.

The interface includes **Hebrew, English, Arabic, Russian, and Spanish**, with right-to-left layouts. Translation of member-written content is a separate, configurable feature whose rollout is still in progress.

### How agreement works

1lev1 favors **approval, discussion, and counter-proposals** over a one-way rejection. Many standing proposals use the rikma's agreed response window (`restime`): an unanswered proposal can mature when that window expires, while a counter-proposal starts a new round.

Consent is specific to each flow. Some decisions affect the whole rikma; others are bilateral. Customer approval in a deal is not replaced by silence. See the [consent and domain rules](CLAUDE.md) for the implementation details and exceptions.

## Current status

This is an actively developed application, not a claim that every planned feature is deployed. The [documentation index](docs/README.md) groups work by **implementation state**, not by date:

| Area | Current scope |
| --- | --- |
| Core rikma workflows | Implemented foundations include the Moach workspace, Hub, matching, planning boards, complex products, recurring sales, income distribution, stipends, multi-currency support, and external APIs. See [completed implementation plans](docs/done/). |
| Concierge and customer deals | The core concierge is implemented. Provider discovery extensions, signup assistance, direct offers, and end-to-end QA have separate ongoing work. |
| Real-time updates and notifications | The shared update bus and action scopes are implemented. Cross-repository migration and live verification remain open; presence, typing, and editing-awareness features await coordinated deployment. Smart notifications have further rollout and channel work. |
| Shared purchasing | Group-purchase foundations exist. Pooled complex products, floating pricing, and related agreement flows remain in progress. |
| Distributed data | Signed consent events, local Space storage/sync, and projection foundations are implemented. Full peer-to-peer operation and removal of Strapi are **not complete**; encryption and recovery have explicit rollout gates. |
| Mobile | The current Tauri app is a shell loading the live website. A bundled SPA/local-first app is a follow-up track, not the current default. |

For precise milestones, deployment prerequisites, and feature flags, consult [in-progress plans](docs/inprogress/) and [future proposals](docs/tbd/). A document in `done/` can still describe future extensions or environment configuration; it is not a blanket deployment guarantee.

## Technology and architecture

- **Application:** Svelte 5, SvelteKit, TypeScript / JavaScript, and Tailwind CSS.
- **Backend data:** a separately maintained Strapi backend, accessed through server-side GraphQL/QIDS proxies.
- **Server operations:** the Unified Action System handles validation, authorization, execution, and notifications. New server-side mutations should use this system rather than ad-hoc Strapi calls.
- **Authorization:** principal/operation permissions plus entity-level rules such as ownership and rikma membership.
- **Real-time service:** a separate Socket.IO server in [`socket-server/`](socket-server/).
- **AI and discovery:** Mastra, model-provider integrations, Pinecone, and MapLibre.
- **Deployment:** Node adapter by default, an optional Vercel adapter, and a Tauri mobile shell.
- **Testing:** Vitest, Testing Library, and fast-check property-based tests.

The web client reaches Strapi through the application's server endpoints rather than accessing it directly. The current system still depends on Strapi; the distributed layer is an incremental migration, not a fully serverless replacement.

### Repository map

| Path | Purpose |
| --- | --- |
| [`src/routes/`](src/routes/) | Pages, layouts, API endpoints, and OAuth routes |
| [`src/lib/server/actions/`](src/lib/server/actions/) | Action registry, validation, authorization, and notification orchestration |
| [`src/lib/server/authz/`](src/lib/server/authz/) | Static access-control policy |
| [`src/lib/components/`](src/lib/components/) | Shared UI and domain components |
| [`src/lib/translations/`](src/lib/translations/) | UI translation namespaces and route-aware loading |
| [`src/generated/`](src/generated/) / [`src/lib/generated/`](src/lib/generated/) | Generated backend types; consult these before changing data access |
| [`src/lib/consent/`](src/lib/consent/) / [`src/lib/space/`](src/lib/space/) | Signed consent and distributed/local data foundations |
| [`socket-server/`](socket-server/) | Real-time server, configured and deployed separately |
| [`src-tauri/`](src-tauri/) | Native shell and mobile setup |
| [`spec/consent-v1/`](spec/consent-v1/) | Consent-format interoperability vectors |
| [`docs/`](docs/) | Guides, specifications, and implementation plans |

## Local development

### Prerequisites

- **Node.js 24.x**, as specified in [`package.json`](package.json), and npm.
- Access to a compatible Strapi instance and a maintainer-provided development configuration.
- Service configuration for the features you intend to run, such as Socket.IO, AI providers, storage, email, or push notifications.

This repository does **not** include the Strapi backend or a complete environment template. A fresh clone alone is not a fully configured local platform.

### Setup

```bash
git clone https://github.com/Avi-ADAM/1.0.git
cd 1.0
npm ci
```

Before starting the app, obtain the required development settings from a maintainer and place them in the ignored `.env` file. In particular, `STRAPI_URL` selects the server-side Strapi endpoint; backend authentication and other integrations require additional configuration. Do not point a development instance at production data without an agreed testing setup.

Keep credentials out of Git and browser-exposed `VITE_*` variables. See the [proxy/security documentation](docs/done/PLAN_PROXY_SECURITY.md) and [deployment guide](docs/DEPLOY_API_DOCKER.md) for configuration context; deployment examples are not a complete local environment template.

```bash
npm run dev
```

Use the address printed by Vite. Real-time features also require the separate [Socket.IO service](socket-server/README.md).

### Common commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run check` | Synchronize SvelteKit and run Svelte/type checks |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run build` | Build with the Node adapter by default |
| `npm run preview` | Preview a configured production build locally |
| `npm run check:proxy` | Check proxy-security conventions |
| `npm run check:i18n` | Check translation usage and route loading |
| `npm run check:script` | Detect suspicious mixed-alphabet text |
| `npm run check:translatable` | Validate the member-content translation manifest |
| `npm run types:update` | Regenerate backend types with the required schema access |
| `npm run validate:qids` | Validate registered GraphQL queries against the schema |
| `npm run vectors:consent` | Regenerate consent-format test vectors |

For a Vercel build, set `ADAPTER=vercel`. For native prerequisites and the distinction between the live-site shell and the experimental SPA build, read the [Tauri guide](src-tauri/README.md) before using the Android or mobile scripts.

## Documentation starting points

Much of the detailed product and implementation documentation is in Hebrew; this README provides an English entry point.

- **[Documentation index](docs/README.md):** the central map of completed, ongoing, and planned work.
- **[Contributor instructions](AGENTS.md) and [architecture/domain guide](CLAUDE.md):** code conventions, generated types, security, translations, and consent rules.
- **[Moach guide](docs/MOACH_AI_AGENT_GUIDE.md):** workspace terminology, entity routes, and agent interaction rules.
- **[Action migration guide](docs/AGENT_ACTION_MIGRATION_GUIDE.md):** using the Unified Action System.
- **[Planning boards](docs/done/PLAN_PROJECT_PLANNING_BOARDS.md) and [concierge](docs/done/PLAN_CONCIERGE.md):** AI-assisted planning and wish-to-work flows.
- **[External tasks API](docs/done/PLAN_EXTERNAL_TASKS_API.md), [external sales API](docs/done/PLAN_EXTERNAL_SALES_API.md), and [MCP OAuth](docs/done/PLAN_MCP_OAUTH.md):** integration architecture and setup.
- **[Real-time migration](docs/inprogress/PLAN_REALTIME_MIGRATION.md) and [smart notifications](docs/inprogress/PLAN_SMART_NOTICES.md):** current synchronization and notification work.
- **[Distributed execution roadmap](docs/inprogress/PLAN_DISTRIBUTED_EXECUTION.md), [Space sync guide](docs/HOWTO_SPACE_SYNC.md), and [consent format](docs/SPEC_CONSENT_FORMAT.md):** the distributed layer's active queue, usage, and normative specification.
- **[API deployment](docs/DEPLOY_API_DOCKER.md) and [Tauri setup](src-tauri/README.md):** deployment-specific instructions.

## Contributing

Contributions to code, testing, documentation, translation, and product design are welcome. Start with [`AGENTS.md`](AGENTS.md), read the relevant plan in [`docs/`](docs/), and distinguish implemented behavior from proposals before making changes.

Use the Unified Action System for new server-side mutations, consult generated backend types, and run the checks and tests relevant to your change. When a plan changes implementation state, move it to the appropriate documentation folder and update its references.

To coordinate work and discuss participation in the rikma, contact [baruch@1lev1.com](mailto:baruch@1lev1.com) with the area you would like to contribute to.
