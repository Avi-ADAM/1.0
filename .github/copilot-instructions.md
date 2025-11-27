## Quick orientation — what this repo is

- Tech: SvelteKit (Svelte 5) app with Vite, a separate Node Socket.IO server in `socket-server/`, and a light Mastra agent runtime in `src/mastra/`.
- Node engine: 20.x (see `package.json`). Use the npm scripts below for the common workflows.

## How to run & test (concrete commands)
- Development (frontend + Vite): `npm run dev` (starts Vite with --host).
- Build: `npm run build` (runs `vite build`). If you need the Mastra parts in dev or build use `npm run dev:mastra` / `npm run build:mastra`.
- Tests: `npm run test` (Vitest). Watch mode: `npm run test:watch`.
- Socket server: `cd socket-server && npm install` then `npm run dev` for development or `npm run build && npm start` for production. See `socket-server/README.md` for env vars (`PORT`, `CLIENT_URL`, `JWT_SECRET`).

## Project layout and important entrypoints
- `src/` — main SvelteKit app. Look under `src/routes/` for pages and server actions (example: `src/routes/login/+page.server.js` uses a server action that POSTs to an auth endpoint and writes several cookies — follow its cookie/domain logic for auth flows).
- `src/mastra/` — Mastra agent setup and workflows. `src/mastra/index.ts` registers agents and workflows; change agents under `src/mastra/agents/` when adding or modifying behavior.
- `socket-server/` — standalone Socket.IO server used for realtime notifications and broadcast; it verifies JWTs (Strapi-style) and exposes `/broadcast`, `/health`, `/stats` endpoints.
- `src/lib/` — reusable helpers (e.g. `src/lib/utils.js: cn()` which wraps `clsx` + `twMerge`).

## Key integration patterns and conventions
- Auth & cookies: server actions set cookies like `jwt`, `id`, `un`, and `email`. In production the code sets `domain: '.1lev1.com'` and `httpOnly: true` for `jwt`. Mirror that logic when you add authentication flows.
- Socket integration: clients use `socket.io-client` to connect to the external socket server (port default `3001`). When triggering broadcasts from the app, use the socket server's `/broadcast` HTTP endpoint (see `socket-server/README.md`), not direct socket emits.
- Mastra agents: configured in `src/mastra/index.ts`. The repository uses `LibSQLStore` with `url: ':memory:'` by default — update to a file DB or other store if you need persistence for telemetry/evals.

## Tests & fast feedback
- Unit tests use Vitest; there are testing helpers under `test-setup.js`. Run `npm run test` for CI-style runs and `npm run test:watch` for TDD.

## Developer conventions and small rules to follow
- Prefer modifying agent factories under `src/mastra/agents/*` instead of editing the central `index.ts` unless you need to add a new agent registration.
- Runtime feature flags: code often branches on `process.env.NODE_ENV === 'production'` (e.g. cookie `secure` and `domain` usage). Mirror that behavior for dev/production parity.
- Keep socket-related secrets out of the repo: `socket-server/.env` must contain `JWT_SECRET` and should not be committed.

## Where to look for examples
- Login flow and cookie usage: `src/routes/login/+page.server.js`.
- Mastra agent registration: `src/mastra/index.ts` and `src/mastra/agents/`.
- Socket server usage and deployment: `socket-server/README.md` and `socket-server/index.ts` (server source files).

## Design specs & steering notes (project-specific docs)
- This repo includes a `.kiro/` folder with concrete specs and steering documents used by product and engineering teams.
	- Look under `.kiro/specs/` for feature designs, requirements, and task breakdowns (e.g. `unified-action-system/`, `strapi-types-integration/`).
	- Look under `.kiro/steering/` for short guidance and conventions (e.g. `svelte5-syntax.md`, `lev-page-architecture.md`, `language-sync-checklist.md`).
- Before making cross-cutting changes (auth, socket, or Mastra workflows), consult the relevant `.kiro` design doc — they contain acceptance criteria and task lists used by reviewers.

## Actions system (MUST read before editing action code)
- The unified Action System centralizes all client -> server operations. See `.kiro/specs/unified-action-system/requirements.md` and `design.md` for full details.
- Key contract (short):
	- Inputs: `POST /api/action` with `{ actionKey, params }` and a valid JWT.
	- Output: consistent response { success, data, requestId, updateStrategy } or a descriptive error.
	- Side-effects: executes a Strapi GraphQL op and triggers multi-channel notifications asynchronously.
- Must-follow acceptance criteria (examples pulled from `.kiro`):
	1. The action service MUST validate required params per Action Key and return a descriptive validation error if missing.
	2. The system MUST validate JWT and authorization rules (project membership, role, custom predicates) before executing the GraphQL operation.
	3. Notifications MUST be evaluated with recipient rules and sent via configured channels (socket, email, telegram, push) without blocking the action response.
	4. New Action Keys MUST be defined in the central registry (single source of truth) with graphqlOperation, validation schema, authRules, notification config, and updateStrategy.
- Developer checklist when working on actions:
	- Edit or add action definitions under the central registry (see `src/lib/server/actions/registry.ts` in design doc).
	- Add param schema and authRules; run validator locally and add unit tests for validation and authorization paths.
	- Ensure GraphQL operation maps to an existing QIDS mutation/query (or add migration entry in `.kiro` migration guide).
	- Verify notifications executed in test mode (no real sends) and include tests for recipient resolution.
	- Update `.kiro/specs/unified-action-system/tasks.md` with migration steps if adding or changing an Action Key affecting producers.

## Steering: Svelte 5 (critical)
- This repo uses Svelte 5. Follow `.kiro/steering/svelte5-syntax.md` strictly for new components.
- Quick rules to follow right away:
	- Props: use `let { ... } = $props()` (do not use `export let` in new files)
	- State: use `$state()` and `$derived()` for reactive values
	- Effects: use `$effect()` instead of `$:` blocks
	- Events: prefer `onclick={...}` (Svelte 5 event shorthand) over `on:click`
- If you find legacy Svelte 3/4 syntax in files you edit, prefer migrating the edited file to Svelte 5 syntax (it's required for all new code).

## Example: TypeScript ActionConfig (copy-paste)
Below is a minimal, copy-ready TypeScript example you can use when scaffolding a new Action Key. Register it via `registerAction(...)` in the central registry.

```ts
// Example: src/lib/server/actions/example-new-action.ts
import { registerAction } from './registry';

registerAction({
	key: 'project.createTask',
	description: 'Create a task inside a project',
	graphqlOperation: `mutation createTask($input: TaskInput!) { createTask(input: $input) { task { id title project { id } } } }`,
	paramSchema: {
		projectId: { type: 'string', required: true },
		title: { type: 'string', required: true },
		dueDate: { type: 'string', required: false }
	},
	authRules: [
		{ type: 'jwt' },
		{ type: 'projectMember', config: { projectIdParam: 'projectId' } }
	],
	notification: {
		recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: false } },
		templates: {
			title: { he: 'משימה חדשה', en: 'New task' },
			body: { he: 'נוספה משימה חדשה לפרויקט', en: 'A new task was added to the project' }
		},
		channels: ['socket', 'email']
	},
	updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['tasks'] } }
});

// Notes for use:
// - Place this file under src/lib/server/actions/ and import it from your server startup so it's registered.
// - Tests: add unit tests for param validation and authRules, and an integration test that runs in test mode (no real notifications).
```

Include this snippet when creating new actions; it follows the registry shape described in `.kiro/specs/unified-action-system/design.md` and the repo's conventions.

## Minimal contract for automated changes
- Inputs: small, focused edits (file path + change intent), environment (NODE_ENV selection), and a short test command (e.g., `npm run test`).
- Outputs: code edits that preserve existing public APIs, update `src/mastra/` only via agent factories unless adding a new agent, and no leaking of secrets.
- Error modes: running `npm run build` will surface Vite errors; tests run with `npm run test`.

## Quick notes for Copilot-style agents
- When changing runtime behaviors that affect cookies or auth, update `src/routes/*` server actions and test both dev (no cookie domain) and production (with `.1lev1.com`).
- For new realtime features, prefer adding new HTTP broadcast handlers that call the socket server `/broadcast` endpoint rather than adding ad-hoc socket server logic.
- When adding Mastra tools/workflows, register them in `src/mastra/index.ts` and keep storage config in `LibSQLStore` to allow swapping to a file DB for persistence in staging.

If any of these references are out of date or you'd like me to include additional examples (e.g., a small code snippet showing how to call the socket `/broadcast` from a SvelteKit action), tell me which area and I'll iterate.
