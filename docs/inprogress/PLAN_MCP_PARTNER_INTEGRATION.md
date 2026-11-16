# PLAN_MCP_PARTNER_INTEGRATION — the MCP server as a door for another platform's agents

**Status (2026-11-16):** P0 code half built, not yet committed or deployed —
P0.2, P0.4, P0.5, P0.6, P0.7, P0.8 (see "Built" under P0). Open: P0.1, P0.3 and
P0.9, which need production. P1 built except P1.1, uncommitted (see "Built"
under P1); P1.5 needs a 1.0b deploy. Then P2.

Written 2026-11-15 from a code audit, the
existing test suites (23 files, 244 tests, all green) and four read-only calls to
the live connector. Production env values and the public endpoints could **not**
be probed from the audit sandbox (outbound proxy refused `*.1lev1.com`), so every
"verify in production" line below is a real open item, not a formality.

Builds on [PLAN_MCP_OAUTH](../done/PLAN_MCP_OAUTH.md),
[PLAN_MCP_TOOLS_V2](../inprogress/PLAN_MCP_TOOLS_V2.md),
[PLAN_AI_SIGNUP_CONCIERGE](../inprogress/PLAN_AI_SIGNUP_CONCIERGE.md),
[PLAN_MATCH_SUGGESTIONS](../done/PLAN_MATCH_SUGGESTIONS.md) and
[PLAN_API_PERMISSIONS](../done/PLAN_API_PERMISSIONS.md).

## 1. Why

A partnership pitch to a creator platform (first candidate: Nas.com) rests on one
sentence: *their AI agents connect to 1lev1 over MCP, so their user can find
partners, form a rikma and manage agreements, tasks, contributions and ownership,
without merging the two products.* The outreach wants to say the server is "already
live and your team could try it in an afternoon".

The server is live and well guarded. The pitch flow is not complete on it. This
plan lists what is true today, what is missing, and the smallest work that makes
the sentence honest.

**Verdict: partly.** An engineer can connect an agent today and (a) prepare a
signup for a person with no account, (b) search open missions and resources,
(c) draft a rikma that the person confirms, (d) run tasks, timers, conversations
and a storefront for a member. The agent cannot apply to an opening, cannot read
the state of a candidacy or a vote in structured form, and cannot read ownership
percentages, sales or profit splits. Those are the middle and the end of the
pitch flow.

## 2. What exists (verified in code)

| Area | State | Where |
| --- | --- | --- |
| Server | `@mastra/mcp` `MCPServer`, built per request, serverless streamable HTTP (plain JSON answers; SSE passed through) | `src/routes/api/mcp/+server.ts:325-369`, `:393-402` |
| Endpoint | `https://api.1lev1.com/api/mcp`; the key-in-path variant answers 410 | `src/lib/server/mcp/keyDiagnosis.ts:48`, `src/routes/api/mcp/[apiKey]/+server.ts:28` |
| Auth: key | `Authorization: Bearer 1lev1_…`, minted by `npx 1lev1-mcp` or Settings → API keys | `src/routes/api/mcp/+server.ts:198-204`, `src/routes/mcp-connect/+page.server.ts:82-114` |
| Auth: OAuth | RFC 9728 resource metadata, RFC 7591 dynamic registration (stateless signed `client_id`), authorization code + PKCE S256. The access token **is** an api-key | `src/lib/server/oauth/metadata.ts:28-56`, `src/routes/oauth/register/+server.ts:26`, `src/routes/oauth/authorize/+server.ts:26`, `src/routes/oauth/token/+server.ts:114-123` |
| No-account tools | `getPlatformInfo`, `prepareSignup` (a prefilled one-screen signup the person signs) | `src/lib/server/mcp/publicTools.ts:39-50`, `src/mastra/tools/assistantTools.ts:232-289` |
| Lazy sign-in | `MCP_PUBLIC_MODE=lazy`: list tools anonymously, 401 on the first account tool | `src/lib/server/oauth/challenge.ts:32-50`, `src/routes/api/mcp/+server.ts:280-284` |
| Tool manifest | 75 tools, each with a tier (`read`/`prepare`/`selfWrite`/`consentWrite`/`communicate`/`sharedWrite`) and a guard policy | `src/lib/server/mcp/toolManifest.ts:175-329` |
| Guard | per-key rate limit → key rikma scope → membership → tool → scoped output → audit | `src/lib/server/mcp/guard.ts:207-276` |
| Rate limit | read 120/min, write 20/min, ai 10/h, per key, in-process | `src/lib/server/mcp/rateLimit.ts:18-23` |
| Audit | one JSON line per write, AI run and refusal; never the parameters | `src/lib/server/mcp/audit.ts:25-33` |
| Server instructions | vocabulary + house rules (no absolute "no", silence is consent, never approve for the user) | `src/lib/server/mcp/instructions.ts` |
| Public reference | `/mcp`, generated from the manifest, five locales; every tool description links to its anchor | `src/routes/mcp/+page.server.ts:1-111`, `src/lib/server/mcp/toolManifest.ts:136-142` |
| Error shapes | `{ success:false, denied:true, message }`, `{ rateLimited:true, retryAfterSeconds }`, cleaned backend errors | `src/lib/server/mcp/guard.ts:244-263`, `src/lib/server/mcp/actionErrors.ts:34`, `src/lib/server/mcp/strapiErrors.ts` |

## 3. Coverage of the pitch

| # | Capability | State | Evidence |
| --- | --- | --- | --- |
| a | Discover open missions / resources without membership | **exists** | `searchCatalogTool` over qids 282–284, public data, `src/mastra/tools/conciergeTools.ts:99-141` |
| a′ | Discover rikmas to join | **partial** | public face of one rikma **by id** only (`projectDetailsTools.ts:71-103`); the directory qid `281discoverProjects` (`qids.js:15132`) has no tool; `searchContentTool` is limited to the caller's own rikmas |
| a″ | Personal matches ("what fits me") | **partial** | the precomputed `match-suggestion` rows exist (`qids.js:16918`), the agent gets only a count (`src/lib/server/notices/updates.ts:66,164`) |
| b | Find people / partners by skill or role | **missing** | `201findUsersBySkill` exists (`qids.js:14065`) with no tool; `getProjectMembersTool` lists usernames of a rikma the caller is already in (`getProjectMembersTool.ts:48-118`) |
| c | Create a rikma and propose its structure | **exists, by design a prepared link** | `createProjectTool` returns a prefilled URL (`createProjectTool.ts:56-85`); `proposeRikmaBlueprintTool`, `shareRikmaPreviewTool`, `prepareForSomeoneElseTool` (`toolManifest.ts:209-216`). The person creates it; the agent never does |
| d | Apply to a mission, see the candidacy | **missing** | the action exists (`src/lib/server/actions/configs/applyToMission.ts:340`); no tool wraps it. The agent can only hand over `/availableMission/<id>` |
| e | Agreement state: pending decisions, restime clock, votes | **partial** | `getMyUpdatesTool` returns ready sentences with `deadline` and `silenceApproves` (`myUpdatesTool.ts:22-90`); `getProjectStatsTool` returns a count of open decisions. No structured per-decision read (rounds, who signed). `getDecisionDetails` action exists, unwrapped |
| f | Contributions, hours, ownership percentages | **partial → missing** | hours: `getMissionStatsTool`, `getMemberMissionsTool`, `getProjectStatsTool` ("no per-member financial data", `projectDetailsTools.ts:284-287`). Percentages: nothing; the math is `src/lib/revenue/memberShares.ts:44` |
| g | Sales / profit split | **missing** | no tool reads `Sale`, `Tosplit` or `Haluka` for a member (shop orders only). `saleActionTool` is not in the manifest |

## 4. What would embarrass us today

Ordered by how soon a partner's engineer meets it.

1. **The OAuth consent screen is Hebrew, hard-coded, `dir="rtl"`.**
   `src/routes/mcp-connect/+page.svelte:9,17-51` and the server errors in
   `+page.server.ts:35,39,75,78,93`. It is the first 1lev1 page a partner's user
   ever sees. Also a `$t()` regression by the project's own rules.
2. **A partner's redirect URI is refused at registration.** The allowlist is
   claude.* and chatgpt/openai only (`src/lib/server/oauth/redirects.ts:15-16`);
   `MCP_OAUTH_REDIRECT_HOSTS` **replaces** the list, it does not extend it
   (`:18-23`).
3. **Live: `getMyUpdatesTool` answered `unavailable: ["rikmaVotes"]`** on
   2026-11-15 for a member with many rikmas. The votes are capability (e). The
   tool says so honestly, but the demo question "what is waiting for me" then
   has no votes in it. Root cause unknown (`updates.ts:131` only records that the
   hub read failed).
4. **The flow dead-ends after discovery.** No apply, no ownership, no splits (§3).
5. **Search is a case-insensitive substring over the first page of each
   directory, and member text is in the author's language.** Live: `design` → one
   result, name `ux`, Hebrew description. `conciergeTools.ts:46-50`. The UGC
   translation layer (T3) is not wired into MCP output.
6. **`findMissionTool` reads as discovery and is not.** "Find a specific mission
   for the user by its name" searches only missions the caller already holds
   (`findMissionTool.ts:7-10`).
7. **Action messages default to Hebrew.** The MCP context never sets `lang`
   (`src/routes/api/mcp/+server.ts:235-240`), so every tool falls to
   `ctx.lang ?? 'he'` (`assistantTools.ts:37`, `forumTools.ts:60`,
   `processTools.ts:55`, `createTaskTool.ts:61`, …) and `getMyUpdatesTool`
   defaults to Hebrew unless `lang` is passed (`notices/translate.ts:22-25`).
8. **No consent granularity.** The OAuth token is an unscoped account key: all
   75 tools, including `archiveRikmaProductTool` and `setShopStockTool`.
   `scopes_supported` is `['mcp']` only (`oauth/metadata.ts:42`).
   Conversely `mcp:write` cannot be granted from any screen
   (`src/routes/api/api-keys/+server.ts:29-45`), so `createMissionTool` is
   unreachable.
9. **No expiry, no refresh token** (`oauth/token/+server.ts:119-120`). Deliberate,
   and fine for a personal connector; a platform holding thousands of
   non-expiring account keys is a different risk.
10. **No sandbox.** Every write lands in a real rikma with real members, real
    notifications and a real restime clock. Test rikmas are a hard-coded hidden
    list (`src/lib/server/discovery/hiddenProjects.ts:8-29`).
11. **Rate limit and audit are per instance and log-only** (`rateLimit.ts:4-6`,
    `audit.ts:32`). A member cannot see what an agent did in their name.
12. **Production state is unverified.** `PLAN_MCP_OAUTH` says "waiting on
    `MCP_OAUTH_ENABLED`"; `docs/README.md` says OAuth is in production. Neither
    `MCP_OAUTH_ENABLED`, `MCP_PUBLIC_MODE`, `MCP_OAUTH_REDIRECT_HOSTS` nor
    `OAUTH_AUTHORIZATION_SERVER` is documented in any env example.

## 5. Principles this plan keeps

- **Writes go through the Unified Action System.** Every new tool is a thin
  wrapper over an existing action or a pre-vetted qid; no raw Strapi calls.
- **An agent never approves.** No tool votes, signs, accepts a counter or
  confirms money. It prepares and links; the person clicks. This holds for a
  partner's agent exactly as for the user's own.
- **No absolute "no".** No tool rejects on the user's behalf. Withdrawing one's
  *own* candidacy is not a rejection of anyone and may be exposed later; declining
  someone else's proposal is not.
- **Silence is consent, at the rikma's pace.** Every read that shows an open
  item carries its `deadline` and `silenceApproves`, so an agent says the clock
  out loud.
- **A candidacy is the user's own statement** ("I offer to take this, on these
  terms"), so it may be a tool, in the `consentWrite` tier: it binds nobody until
  the rikma, and where relevant the deal's customers, agree. The applicant's
  terms are read back to the person before the call, and the tool description
  says so.
- **Money figures are read-only and effective-only.** A sale counts when
  `holderStatus` is `self`, `confirmed` or null-legacy, never while `open`.
  Site-share notes are parsed (`parseSiteShareNote`), never shown raw. Shares
  come from `memberShares`, never recomputed in a tool.
- **Backend shapes come from `src/generated/` and `src/lib/generated/`.**
- **The group is a rikma** in every title, description and sentence a tool
  returns. `project` stays only as the id field name.
- **UI text through `$t()`**; member text is data, wrapped and labelled as such.

## 6. Phases

### P0 — an honest two-minute demo (about a week)

Goal: one engineer, one afternoon, the flow *new person → sees openings → drafts
or applies to a rikma → sees what is waiting and what they own*, in English, with
nothing that needs an apology.

| # | Work | Files | Tests |
| --- | --- | --- | --- |
| P0.1 | **Verify and write down production.** Probe `/.well-known/oauth-protected-resource`, `/.well-known/oauth-authorization-server`, `POST /oauth/register`, anonymous `POST /api/mcp`; record the four env values and the chosen `MCP_PUBLIC_MODE` (recommend `lazy`) | `docs/DEPLOY_API_DOCKER.md` (env table), the status line of `docs/done/PLAN_MCP_OAUTH.md` | a smoke script under `scripts/` that runs the five probes and exits non-zero on drift |
| P0.2 | **Consent screen through `$t()`**, direction from `isRtl`, five locales; language from the visitor's locale, falling back to English for an OAuth arrival with no preference | `src/routes/mcp-connect/+page.svelte`, `+page.server.ts` (return error *keys*, not sentences), `src/lib/translations/*/mcp.json`, `src/lib/translations/routes.js` if `mcp` is routed | `npm run check:i18n`, `npm run check:script`; a loader test for the three error keys |
| P0.3 | **Fix the missing votes.** Reproduce the failing hub read for a large account through the service door, find whether it is a timeout, a payload limit or an undeployed twin qid, and fix or page it | `src/lib/server/digest/collect.ts`, `src/lib/server/notices/updates.ts`, the hub twin qid in `src/routes/api/send/qids.js` | extend `src/lib/server/notices/updates.test.ts` with a many-rikma fixture; check the `[mcp-audit]` / error lines in the logs for the real cause first |
| P0.4 | **Language on the MCP context.** Resolve once per request: the key owner's stored language, else `Accept-Language`, else `en` for an OAuth-minted key | `src/routes/api/mcp/+server.ts:235`, `src/lib/server/mcpContext.ts`, `src/lib/server/mcp/keyDiagnosis.ts` (return the owner's lang with the verdict) | unit test on the resolver; one tool test asserting `lang` reaches `executeAction` |
| P0.5 | **`listMyMatchesTool`** (read): the caller's precomputed suggestions with score, `matchedOn`, hours, rate, rikma name and public URL. Reuses `209levMatchSuggestions` through a `$uid` service twin; no new matching | new `src/mastra/tools/matchTools.ts`, `qids.js` + `qidsAccess.js` (twin), `toolManifest.ts` | shape test with a generated-type fixture; manifest test already fails if the policy is missing |
| P0.6 | **`searchRikmasTool`** (read): the public rikma directory by text, with member count and counts of open missions / resources / products. Skips `isHiddenProject`; will follow `Project.visibility` when PLAN_RIKMA_VISIBILITY lands | `src/mastra/tools/conciergeTools.ts` (next to `searchCatalogTool`), reuse `$lib/server/discovery/normalizeCards.ts`, `toolManifest.ts` | shape + hidden-rikma test |
| P0.7 | **`getMyStakeTool`** (read, members only): for one rikma, the caller's share and every member's share as `memberShares` computes them, with approved hours and contributed resources behind each. No sales figures yet | new `src/mastra/tools/stakeTools.ts`, a service-door loader beside the split page's (`src/routes/(reg)/moach/[projectId]/split/`), `src/lib/revenue/memberShares.ts` unchanged | parity test: tool output equals `memberShares()` on the same fixture; non-member refusal through the guard |
| P0.8 | **Descriptions.** Rename what `findMissionTool` says it does ("one of *your* missions in progress"), add "to discover openings use searchCatalogTool / listMyMatchesTool"; add a step 0 for discovery to the server instructions | `toolManifest.ts` (`description` override), `src/lib/server/mcp/instructions.ts` | `toolManifest.test.ts` snapshot |
| P0.9 | **A demo account and a demo rikma** on production, hidden from the directories, with two seeded members, one open mission, one finished mission with approved hours and one open decision, plus a one-page script for the call | seed script under `src/lib/jobs/`, id added to `hiddenProjects.ts`, script in `docs/marketing/` | the P0.1 smoke script also asserts the demo rikma answers the five read tools |

Application to a mission is **not** in P0: the demo shows the opening and hands
the person the link, which is honest and is how rikma creation already works.

**Built (2026-11-16, uncommitted):**

- **P0.2** — `mcp-connect` renders only `mcp.connect.*` keys (five locales,
  `dir` from `$isRtl`); the server returns `errorKey` (`authRequest` / `callback`
  / `createKey`), never a sentence; the API's own message on a failed key is no
  longer shown. "Reject" became "Not now". The `mcp` namespace's `/mcp` gate
  already covers `/mcp-connect`. A visitor with no `lang` cookie and a
  non-Hebrew `Accept-Language` already resolves to `en` in `hooks.server.js`,
  so no OAuth-specific fallback was added. Tests: `src/routes/mcp-connect/page.server.test.ts`.
- **P0.4** — `src/lib/server/mcp/lang.ts` (`resolveMcpLang`, `fetchUserLang`,
  cached 10 min, never throws); `checkApiKey` now returns the key's name, and a
  name `MCP · <client>` marks an OAuth key. `/api/mcp` sets `ctx.lang`; every
  tool already read `ctx.lang ?? 'he'`, so nothing else changed. The stored
  language is read with a separate query, **not** added to the key lookup: a
  non-fatal GraphQL error there refuses every key (see `verifyApiKeyDetailed`).
- **P0.5** — `listMyMatchesTool` (`src/mastra/tools/matchTools.ts`). **Deviation:**
  no `$uid` twin qid — it reads `209levMatchSuggestions` through
  `strapiClient.execute`, which goes straight to Strapi with the variables given
  (no `$idL` rebind), as `assistant/kinds.ts` already does. `idL` is always the
  key owner.
- **P0.6** — `searchRikmasTool` beside `searchCatalogTool`, over qid 281 via
  `normalizeProjectCard`; skips `isHiddenProject`. Still to follow
  `Project.visibility` when PLAN_RIKMA_VISIBILITY S1 lands.
- **P0.7** — `getMyStakeTool` (`src/mastra/tools/stakeTools.ts`): qids
  `getProjectPeopleAndRoles` + `getProjectFinancials` → `memberShares`, unchanged;
  `project: 'member'` in the manifest. Parity test against `memberShares` on the
  same fixture.
- **P0.8** — `findMissionTool` description override ("one of YOUR missions"),
  step 0 in the server instructions, and a manifest test that every tool the
  instructions name exists.

Not verified against live Strapi: the three new reads ran only on fixtures.

### P1 — the join loop (about two weeks)

| # | Work | Files | Tests |
| --- | --- | --- | --- |
| P1.1 | **`prepareApplicationTool`** (prepare, pure): a prefilled `/availableMission/<id>` link carrying the person's proposed hours, rate and note, as `prepareMissionTool` does for a new mission | new tool beside `prepareMissionTool.ts`, `$lib/prefill/` codec, the mission page's prefill reader | codec round-trip; the page test that a draft never auto-submits |
| P1.2 | **`applyToMissionTool`** (`consentWrite`): wraps `applyToMission`. On by default; `MCP_APPLY_ENABLED=false` turns it off. Refuses when the opening is a customer-deal gap unless the result states plainly that every customer of that deal must also sign | `src/mastra/tools/matchTools.ts`, `applyToMission.ts` unchanged, `toolManifest.ts` | action-level tests already exist; add tool tests for the solo case, the deal case, and that `userId` is only ever the key's owner |
| P1.3 | **`listMyApplicationsTool`** (read): the caller's open Ask/Askm rows with the round on the table, who has signed, the deadline and `silenceApproves` | qid service twin of `80usersPermissionsUserWithAskeds`, shapes from `src/lib/generated/contentTypes.d.ts` | shape test; a countered round shows the counter, not the original |
| P1.4 | **`getDecisionTool`** (read, members or bilateral parties only): one decision as structure, wrapping `getDecisionDetails` | `src/mastra/tools/`, `getDecisionDetails.ts` unchanged | a `saleClaim` is visible only to its two parties; a rikma-wide kind to members |
| P1.5 | **`findPartnersTool`** (read): people by skill or role, restricted to members who opted in to being found, returning username, skills and public profile URL only | `201findUsersBySkill` + a profile opt-in flag (schema change in Strapi, then `npm run types:update`), profile settings UI text through `$t()` | opt-out is honoured; no email or phone ever leaves; rate bucket `read` |
| P1.6 | **Money reads**: `getRikmaLedgerTool` (members only): effective sales, open splits and halukas, the caller's balance | `src/lib/revenue/`, the moach sales loaders, `parseSiteShareNote` | an `open` holder claim is excluded; a site-share sale shows parsed lines, never the note |

**Built (2026-11-16, uncommitted)** — tests for all five in `src/mastra/tools/joinLoopTools.test.ts`; none run against live Strapi yet.

- **P1.2** — `applyToMissionTool` (`src/mastra/tools/joinTools.ts`), `consentWrite`,
  on by default; `MCP_APPLY_ENABLED=false` is the kill switch.
  `confirmedWithUser: true` is required by the schema; the rikma is read from the
  opening (no `projectId` input) and the key scope is checked in the tool, so it
  is on the manifest test's own-record list. A deal gap (`loadOfferDeal` →
  `clientIds`) returns `needsCustomerSignature` and applies nothing until the call
  repeats with `customerSignatureUnderstood: true`. On the mission's stated terms
  only — proposing other terms is P1.1, still the mission page.
- **P1.3** — `listMyApplicationsTool`, new serviceAdmin qid `mcpMyApplications`
  (Ask + Askm by `$uid`, with `negopendmissions` / `nego_mashes` and the
  timegrama). The standing round is the last non-withdrawn one, so a counter
  shows instead of the original. Narrowed to the key scope.
- **P1.4** — `getDecisionTool` (`decisionTools.ts`) over qid 159 +
  `getProjectPeopleAndRoles`, not over the `getDecisionDetails` action (that one
  returns display labels, no rounds or signers). Standing round = highest vote
  `order`; a decision of another rikma reads as not found; a `saleClaim` only for
  its reporter and holder (`getSaleClaimDecision`). Links through
  `$lib/notices/links` (`voteHref`).
- **P1.5** — `findPartnersTool` (`partnerTools.ts`), two levels (decided
  2026-11-16): everyone who matches by skill or role is **counted**, because
  filling in skills already means "offer me what fits" (the heart's suggestions
  run on it); a **name** leaves only with the person's own switch. The unnamed are
  reached the way they already agreed to — an open mission, which the matching
  engine shows them in the heart; the tool's hint says so. Email, phone and
  location never, at either level. Qid `mcpFindPartners` = `named` (opted-in, a
  page) + `all` (a count only), both without the caller; `mcpCountPartners` is the
  count alone, used while the field is not deployed (then nobody is named).
  Field `User.findableByAgents`
  (default false) added to 1.0b's user schema — **needs a 1.0b deploy**, then
  `npm run types:update`. The switch is on `/me/settings/mcp` (loader reads
  `findableByAgentsFor` with `locals.uid`, hides the switch when the read fails),
  saved through `updateUserBasic` (new `findableByAgents` param), text in
  `mcp.findable.*` × 5 locales. Open question 2 answered: names opt-in, a count for everyone.
- **P1.6** — `getRikmaLedgerTool` (`ledgerTools.ts`) over `getProjectFinancials`:
  effective sales only (an open claim is a count, never an amount),
  site-share / donation notes parsed, open tosplits with their halukas and
  signers, and "if we split now" from `splitPreview` over the effective sales.
  **Note:** the sales page feeds `splitPreview` every unsplit sale, open claims
  included; the tool deliberately does not, so the two can differ while a claim
  is open.
- Server instructions name the five tools; `findMissionTool` stays as P0.8 left it.

**Not built: P1.1** (`prepareApplicationTool`) — it needs the mission page to read
a prefilled counter-offer, a UI change, and the demo script does not use it.

### P2 — a real third-party integration (about three to four weeks)

| # | Work | Files | Tests |
| --- | --- | --- | --- |
| P2.1 | **Partner clients.** A small registry of named partners (name, redirect hosts, default scopes, contact), so a partner's host is added without replacing the default list, and its keys can be listed and revoked as a group | `src/lib/server/oauth/redirects.ts`, `clients.ts`, new `src/lib/server/oauth/partners.ts`, env or a Strapi single type | `defaultHosts.test.ts` extended: defaults survive an added partner |
| P2.2 | **OAuth scopes that mean something**: `mcp:read`, `mcp:prepare`, `mcp:write:self`, `mcp:post`, `mcp:shop`. Requested at `/oauth/authorize`, shown and editable on the consent screen, stored on the key, enforced by `tierAllowed` | `oauth/metadata.ts:42`, `routes/oauth/authorize/+server.ts`, `mcp-connect`, `api/api-keys/+server.ts:29`, `toolManifest.ts:337-342` | matrix test: scope × tier; a key with no shop scope never lists a shop tool |
| P2.3 | **Delegated onboarding.** `prepareSignup` accepts a signed partner assertion (verified email, display name, locale), so signup + consent is one screen and the person lands back in the partner's product with the connection made. The person still reads and signs the agreement; nothing is created for them | `src/lib/server/assistant/prepareSignup.ts`, `routes/api/assistant/prepare-signup`, the signup page | assertion signature, expiry and replay; an unverified email falls back to the normal confirmation |
| P2.4 | **Token lifetime.** Expiring access tokens with refresh for partner clients; personal connectors keep today's behaviour | `routes/oauth/token/+server.ts`, `src/lib/server/apiKeys.ts` (`expiresAt`), `codes.ts` | refresh rotation; a revoked key cannot refresh |
| P2.5 | **Sandbox mode.** A key flag `sandbox:true` that confines every call to the demo rikma family and suppresses email / push | `guard.ts` (`checkPolicy`), the notification orchestrator, `hiddenProjects.ts` | a sandbox key is refused on any real rikma; no notification leaves |
| P2.6 | **Durable audit and limits.** Audit rows in a collection the member can read ("what this connection did", in Settings → API keys); shared rate-limit store | `audit.ts`, `rateLimit.ts`, `routes/(reg)/me/settings/mcp/`, `src/lib/components/me/` | per-key history is visible only to its owner; limits hold across two instances |
| P2.7 | **Partner documentation.** A "Build on 1lev1" section on `/mcp`: the OAuth walk-through with curl, the five-call quickstart, error shapes, rate limits, the consent rules an agent must respect, and how to get a sandbox key | `src/routes/mcp/+page.svelte`, `src/lib/components/me/McpGuide.svelte`, `src/lib/translations/*/mcp.json`, `src/routes/sitemap.xml/+server.js` | `check:i18n`; a test that every tool named in the quickstart exists in the manifest |
| P2.8 | **Member text in the reader's language.** Route catalog and directory output through the T3 cache read (never a purchase from an agent call), marked as a translation with the original kept | `src/lib/server/translation/`, `src/lib/translation/fields.js`, the new surface rows in `backfillSources.ts` | `check:translatable`; an `identity` hit is not labelled a translation |

## 7. Open questions

1. Does the partner want **its own** agent to hold the token (server-to-server,
   P2.1–P2.4), or will its users add 1lev1 as a connector inside an assistant they
   already use? The second works with P0 alone.
2. Is being findable by skill (P1.5) opt-in or opt-out for existing members? This
   plan assumes opt-in.
3. Should `applyToMissionTool` stay behind its flag until a partner's agent has
   run in the sandbox, or ship on with P1?
4. Which scopes does a partner get by default: read + prepare only, with writes
   requested per user?

## 8. What the outreach may say, by phase

- **Today:** "Our MCP server is live (OAuth or a personal key, public tool
  reference at 1lev1.com/mcp): an agent can already search open missions and
  resources, draft a rikma for a person to confirm, and run tasks, conversations
  and a storefront for a member; applying to an opening from the agent and reading
  ownership and profit splits are what we are building next."
- **After P0:** "…and your team can try the whole read path against a demo rikma
  in an afternoon."
- **After P1:** the original sentence, without qualification.
