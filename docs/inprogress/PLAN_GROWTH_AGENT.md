# PLAN — Lev Growth Agent: finding, researching and inviting businesses

> **Status (2026-11-24): Phase 1 is built (not deployed), plus MCP (§8.5).** The `/growth`
> screens and their eight actions are in the code, and the same pipeline can be operated from
> Claude through ten MCP tools. The claim callback (§10.2) and customer-demand signals (§9.2) are built too. Phase 2 (automated discovery, demand signals, a claim
> callback) and Phase 3 (follow-up automation, analytics) are not. §10 lists the backend
> pieces that are missing.

The platform team needs to recruit independent businesses and service providers into 1💗1:
find them, understand what they offer, prepare a profile they can claim, and invite them.
It has to stay manageable for **one operator handling hundreds or thousands of businesses**.

It is **not** a CRM and **not** a directory. The agent does the reading and the drafting.
A person decides on every outward step, and the owner decides about their own business.

---

## 1. What was already there, and what this reuses

I read the code before building this. It reuses these existing pieces instead of adding
parallel ones:

| Need | Existing piece | How it is used |
|---|---|---|
| Who may operate | No "site admin" role exists. The platform team is the **central rikma** (`DEFAULT_CENTRAL_PROJECT_ID = '1'`, `DEMO_CENTRAL_PROJECT_ID`) | Operator = member of that rikma, checked with the same `65checkProjectMembership` query the action system's `projectMember` rule uses (§8.1) |
| Writes | Unified Action System | 8 action configs in `configs/growth.ts`, with the usual validation → authz → execution path and realtime scope |
| Reading a business's site | `fetchSiteSummary` (`planning/siteContext.ts`). It refuses loopback, private and link-local hosts, re-checks every redirect, and caps time and bytes | Research reads the site through it, just like `/api/analyze-business` does |
| AI | `createModelChain()` (Gemini → Groq → NVIDIA) via a Mastra `Agent` | Wrapped as a swappable `Generate` function (`server/growth/agent.ts`) |
| Preparing a business for its owner | **`prepareSignup` + `checkSignupRecipient` + `takePrepareFor`**, the code behind the MCP tool **`prepareForSomeoneElse`** | `growthPrepareOnboarding` calls the same three functions with a `track: business` blueprint. The owner gets the existing studio (`manageUrl`) / receive link and claims or ignores the draft |
| Profile shape | `BlueprintInputSchema` (`$lib/assistant/blueprint.ts`) | The approved profile becomes a blueprint (`profileToBlueprint`), tested against the real schema |
| Design system | `shop.css` (`sh-card`, `sh-btn`, `sh-chip`, `sh-input`, …) on the app's surface tokens | All screens use it. `growth.css` only adds layout (`gr-` prefix) |
| i18n | `$t()` + JSON namespaces, route gates in `routes.js` | New `growth` namespace in 5 locales, gated to `/growth` |

**Considered and not used: rikma `lead` (PLAN_LEADS).** A lead is an **inbound, consented**
contact of a rikma. `createLead` requires consent unless the source is manual, opens a
follow-up task, and notifies the members. `details` is limited to 30 flat keys and 4 KB.
A growth prospect is the opposite: an outbound, unconsented, researched business with a
dossier much larger than 4 KB. Storing prospects as leads of rikma 1 would bend every one
of those rules, so prospects get their own store (§3.4). Once a business says yes, it is
a real lead/member and goes through the platform's normal flows.

## 2. The pipeline

```
discover ─► research ─► profile ─► invitation ─► (operator sends) ─► response ─► owner claims ─► active
  manual      site +      draft,     drafts,        contacted is        interested /     prepareSignup
  CSV         model,      edit,      approve one    the operator's      declined /       studio link
  (Phase 2:   evidence    approve                   word, never         do-not-contact
   search)    checked                               "app was opened"
```

The AI researches and prepares. The human controls every external communication and
every activation.

## 3. Data

### 3.1 Prospect (`src/lib/growth/types.ts`)
- The business's **public** fields: name, website, email, phone, place, category, services, keywords, size, notes, language.
- `sources[]`: how it entered the pipeline. `fieldSources`: the source of each entered field (kind, label, url, when, who).
- `stage`, `furthest`, `stageChangedAt`, `followUpAt`, `nextAction`.
- `research`, `profile`, `outreach`, `onboarding`, and `activity[]` (newest first, capped at 300).
- `dedupeKeys`: hashed identity keys (§3.3).

### 3.2 Entering the pipeline
- **By hand.** The form asks where the operator found the business, and that source is stored next to each field.
- **CSV.** Up to 1000 rows / 1 MB. Headers are matched in he/en/ar (`csv.ts`). The browser parses the file for the preview; the **server parses it again and decides**. Rows without a name, invalid rows, repeats inside the file and repeats of businesses already stored are each reported by line number. None are dropped silently.
- The agent never adds a business it found by itself (that is Phase 2), and never invents a contact (§4.2).

### 3.3 Duplicates
A business is the same business as another if they share any one of: website host (with `www.`, scheme and case ignored; on shared hosts like facebook.com the path counts), phone (Israeli `0` = `+972`), email, or name + city. The keys are **sha-256 hashed** before they are stored. A `doNotContact` business keeps its keys and loses its email and phone (`forgetContact`), so a later import recognises it without the store keeping its contact details in clear.

### 3.4 Storage, Phase 1
`ProspectRepository` (`server/growth/repo.ts`). Phase 1 uses one JSON file in `GROWTH_STATE_DIR`:
- writes go through one promise chain;
- each write goes to a temp file that is then renamed, so a crash leaves the old file intact;
- the store is cached in memory.

This works because `/api` runs as one long-lived container (the same assumption `/api/vision-preview` and the translation governor make). If the variable is unset, the module is **off** and says so. It never pretends to persist into a container that may vanish. The Strapi content type it should become is specified in §10.1. Moving to it means replacing that one module.

## 4. Research (`lib/growth/research.ts`, `server/growth/agent.ts`)

1. Read the business's own website with `fetchSiteSummary`. **Social networks are never fetched** (their terms forbid automated reading). That is recorded as a problem, not worked around.
2. **Contacts are taken from the page by pattern** (`extractContacts`), each with its URL. The model is never asked for them, and anything it returns as a contact is ignored. The operator adopts a found contact with one click, which records the page as that field's source.
3. The model gets the operator's record and the page text. Every factual claim must include `evidence`, a sentence copied from the page.
4. **`verifyClaim` decides "verified", not the model.** A claim is verified only if its evidence (at least 8 characters) appears word for word, after whitespace and case normalisation, in the text that was actually fetched. An unverified claim stays visible, marked unverified, with confidence `low`.
5. The interpretive answers are shown as **the agent's suggestions, not facts**: why join, which customer requests it could fulfil, collaboration, complementary categories, likely customers.
6. Overall confidence comes from the verified ratio and whether a site was read. `missing` is computed (no website, no email, …) and merged with the model's list.
7. No model, or a failed model call ⇒ `status: partial|failed` with stable problem codes (`site:timeout`, `model:unavailable`). Nothing is filled in.

## 5. Profile (`lib/growth/profile.ts`)

- Fields: title, description, services, products, categories, keywords, coverage, website, social, capabilities. Each field is `{ value, origin: verified | suggested | edited }`. A list field counts as verified only if every item in it is verified.
- Every field is editable. A changed field becomes `edited`, and **any change withdraws an earlier approval**.
- The preview shows each field's origin badge. The operator's "approve" means *this is the draft to show the owner*. **Nothing is published.** Only the owner can publish.
- `profileToBlueprint` turns the profile into a `track: business` blueprint. Each service or product becomes a `pricingMode: quote` product, because the concierge finds businesses by their products. The owner sets the prices.

## 6. Outreach (`lib/growth/outreach.ts`)

- Four variants: friendly, professional, short WhatsApp, email (with subject). Languages: **he, en, ar**.
- The model writes them from the research facts, under rules: say why this business was chosen, no invented numbers, no false urgency, the email offers an opt-out, and the `{{link}}` placeholder is required. **Templates** in the recipient's language are the fallback. They live in code, not in `$t()`, for the same reason the action notification templates do.
- The operator edits a variant and approves it. An approved message is stored with `origin: edited` if its text was changed. Approval requires an approved profile.

### 6.3 Sending is the operator's act
Copy, **Open WhatsApp** (`wa.me/<digits>?text=`) and **Open email draft** (`mailto:`) only hand text to another app. After one of them is opened, the screen **asks** "Did you send it?". `contacted` is recorded only when the operator says yes, or marks another channel by hand. Nothing assumes delivery or reading.

## 7. Onboarding link

`growthPrepareOnboarding` requires an approved profile, the business's public email, and an open stage. It then:
- runs `checkSignupRecipient`, which refuses the operator's own address and detects an existing account;
- applies `takePrepareFor`, the per-operator hourly limit plus the platform's daily limit;
- calls `prepareSignup(intent: business, blueprint)` with the 14-day hand-off TTL.

The owner opens `manageUrl`, or `receiveUrl` for an existing account. They review and correct the draft, then sign up and create it, or don't. **The agent cannot sign, accept or create anything for them.** The link replaces `{{link}}` in the approved message.

## 8. Pipeline, permissions, config

### 8.1 Operators
`checkGrowthOperator(userId, jwt, fetch, strapi)` returns ok when:
- `GROWTH_STATE_DIR` is set;
- the user is signed in;
- the user is a member of `GROWTH_PROJECT_ID` (default `DEMO_CENTRAL_PROJECT_ID`, else `'1'`), checked under **their own JWT**;
- and, if `GROWTH_OPERATOR_IDS` is set, the user is on that list. The list can narrow access, never widen it.

The `/growth` layout and every action's `custom` auth rule call this same function. No privileged token reaches the browser. The admin token is used only server-side inside `prepareSignup`, as it already was.

### 8.2 Stages (`lib/growth/stages.ts`)
`discovered → researching → researched → profilePrepared → awaitingApproval → invitationReady → invitationSent → interested → onboardingStarted → joined → activeProvider`, plus the closed stages `declined` and `doNotContact`.

- The agent only moves a business forward (`advance`):
  - research → `researched`;
  - profile drafted → `profilePrepared`;
  - invitation drafted → `awaitingApproval`;
  - message approved → `invitationReady`;
  - contacted → `invitationSent`;
  - "interested" → `interested`.
- It never moves a business out of a closed stage.
- `furthest` only ever grows, so a decline still counts in the funnel.
- Manual stage changes are allowed. **Leaving `doNotContact` requires a stated reason**, which goes into the log.
- `declined` / `doNotContact` refuse drafting, approving, contacting, follow-ups and onboarding links (`CLOSED_DOOR`). `doNotContact` also erases the email and phone and clears drafts and links.
- `onboardingStarted` and `joined` follow the owner by themselves (§10.2); `activeProvider` is still set by hand (§10.4).

### 8.3 Environment
| Var | Meaning |
|---|---|
| `GROWTH_STATE_DIR` | Store directory. Unset ⇒ module off. `docker-compose.api.yml` mounts the named volume `growth-state` at `/data/growth-state`. **Back it up**: it is not derivable from Strapi. |
| `GROWTH_PROJECT_ID` | The operators' rikma (default: the central rikma) |
| `GROWTH_OPERATOR_IDS` | Optional comma list that narrows access further |
| model keys | The existing `GEMINI_API_KEY` / `GROQ_API_KEY` / `NVIDIA_API_KEY`. With none set, templates are used and research reports `model:unavailable` |

### 8.4 Actions (`src/lib/server/actions/configs/growth.ts`)
| Key | Does |
|---|---|
| `growthSaveProspect` | Add (a duplicate returns the existing record) or edit. An edit that would merge two businesses is refused with `DUPLICATE` |
| `growthImportProspects` | CSV import with a per-line report |
| `growthSetStage` | Manual stage change (a reason is required to leave `doNotContact`) |
| `growthLogActivity` | `note`, `contacted` (channel), `response` (interested / notNow / declined / doNotContact / noAnswer / question), `followUp` (date within a year + next step) |
| `growthResearch` | §4 |
| `growthProfile` | `generate` / `edit` / `approve` |
| `growthOutreach` | `generate` (lang) / `approve` (kind, lang, subject, body) |
| `growthPrepareOnboarding` | §7 |

All of them: `access: ['user']`, `jwt` + `custom` operator rule, realtime scope `project:<growth rikma>`.

### 8.5 MCP — operating the pipeline from Claude (built 2026-11-24)
`src/mastra/tools/growthTools.ts`, registered in `toolManifest.ts` with `audience: 'growthOperators'`:

| Tool | Tier | Runs |
|---|---|---|
| `growthOverviewTool` | read | counts, funnel, next actions, gaps, businesses by priority (view / text filter) |
| `growthGetBusinessTool` | read | one full record: contacts + sources, research, profile, outreach, onboarding, activity |
| `growthSaveBusinessTool` | selfWrite | `growthSaveProspect` |
| `growthImportCsvTool` | selfWrite | `growthImportProspects` |
| `growthResearchTool` | prepare · ai | `growthResearch` |
| `growthProfileTool` | prepare | `growthProfile` (generate / edit / approve) |
| `growthOutreachTool` | prepare · ai | `growthOutreach` (generate / approve) |
| `growthPrepareOnboardingTool` | prepare | `growthPrepareOnboarding` |
| `growthLogTool` | selfWrite · destructive | `growthLogActivity` |
| `growthSetStageTool` | selfWrite · destructive | `growthSetStage` |

- **Who sees them.** `/api/mcp` lists them only when the key's owner passes `checkGrowthOperator`
  (and the module is on, `growthMcpEnabled`). They are absent from the public `/mcp` reference
  and from the anonymous listing (`entryPublic`). The listing is not the gate: every tool
  re-runs the operator check, and a key limited to other rikmas is refused on the growth rikma.
- **Writes are the actions.** The tools call `actionService.executeAction('growth*', …)`, so the
  closed doors, dedupe and activity log are exactly the screens' ones. The membership lookup
  runs under the server token, keyed to the caller's own id.
- **Still no sending.** Descriptions tell the agent: approve a profile or message only on the
  operator's yes; `contacted` only on their word that they sent it.
- Setup: the operator creates an API key at `/me/settings/mcp` (or uses the OAuth connector) and connects `https://1lev1.com/api/mcp`
  in Claude; nothing else is needed.

## 9. Dashboard and network intelligence (`lib/growth/insights.ts`)

- **Tiles:** discovered, researched, profiles awaiting approval, invitations ready, sent, interested, registered (`furthest ≥ joined`), active, follow-ups due.
- **Funnel:** each business counts at every step it reached. The conversion shown is the share of the previous step.
- **Next actions** come from the data, with counts. Examples: "N businesses are waiting for profile approval", "N expressed interest but haven't completed onboarding", "N new catering businesses were discovered in Sharon this week" (at least 2 per category + region in 7 days).
- **Gaps:**
  - a category/region with at least 2 prospects and at most 1 active provider;
  - a category that joined or active providers' research keeps naming as complementary while no active provider covers it. This is the "recruit complementary providers, not registrations" rule as data.
- **Priority** is a transparent sum, shown with its reasons:
  - gap: +30;
  - complements the active network: up to +30;
  - information quality: up to +25, from confidence and verified ratio;
  - public contact: +15.
- The headline metric is **active coverage**, not registrations. The page says so.

### 9.2 Demand signals (built 2026-11-24)
The concierge's open wishes are a recruiting signal: "customers ask for event services, and no venue is active".

- **Read** (`server/growth/demand.ts`, qid `growthDemandWishes`, serviceAdmin): wishes `open | matching | negotiating`, not fulfilled (null-safe filter), created in the last 180 days, paged by 200 up to 5000, cached 5 minutes. A failed read is `null` and the page says "could not be read" — never an empty summary that reads as "nobody is asking".
- **Privacy:** only counts leave the server. `wishFromNode` keeps category names (plus `sub_category`), the coarse `location_hint` (none for an online wish), and whether any proposal exists. Never the name, text, author or coordinates. A wish with `aggregation_opt_out` is not counted.
- **Model** (`lib/growth/demand.ts`, pure, `demand.test.ts`): `summarizeDemand` → cells of category × place with `open` / `unanswered`; category and place match loosely (`sameCategory`, `placeReaches`; no place = everywhere).
- **Where it shows:**
  - `demandGaps`: a cell with ≥2 open wishes or ≥1 unanswered, and ≤1 active provider of that category reaching that place. Listed first on the network page.
  - `priority(p, rows, demand)`: +5 per open wish and +5 more per unanswered one, capped at +25, with the reason "customers are asking (N open wishes)". Used by the pipeline sort, the network page and `growthOverviewTool`.
  - The network page has a "what customers are asking for" table. The MCP overview returns `demand` (totals + top cells) and `demandGaps`.

## 10. Missing backend functionality (documented, not invented)

1. **The Strapi `growth-prospect` content type — built (2026-11-24).** `1.0b`: `src/api/growth-prospect/`. Scalars a list needs are columns (`uid` = the app's prospect id, unique; `name`, contact, place, `category`, `lang`, `stage` / `furthest` as enums of §8.2, `stageChangedAt`, `followUpAt`, `nextAction`, `createdByUid`, `openedAt`); research, profile, outreach, onboarding, sources, `fieldSources`, the hashed `dedupeKeys` and the activity log are JSON. The activity log stays a JSON array on the row (bounded by `withActivity`), not a separate collection: the repository contract is read-modify-write of one prospect, and nothing reads activity across prospects. Qids in `src/routes/api/send/qidsGrowth.js` (`growthProspectsSchema`, `growthProspects`, `growthProspectByUid`, `growthProspectKeys`, `growthProspectCreate`, `growthProspectUpdate`), all `serviceAdmin` in `qidsAccess.js`. `src/lib/server/growth/strapiRepo.ts` implements `ProspectRepository` over them; `GROWTH_STORE=strapi` selects it (compose default), `file` / unset keeps the file store as the fallback.
   **After deploying 1.0b — by hand in the admin:** API Tokens → the server's token: `growth-prospect` find / findOne / create / update (no delete). The Authenticated role needs **nothing** — no session ever reads it. Then in 1.0main `npm run types:update` and `npm run validate:qids`. Deploy 1.0b **before** the API image, or every /growth screen fails loudly (a GraphQL error is thrown, never shown as an empty pipeline).
2. **The claim callback — built (2026-11-24).** `prepareSignup` now returns the pending session's id (kept server-side: the public callers strip it), and `growthPrepareOnboarding` stores it as `onboarding.sessionId`. `src/lib/server/growth/ownerEvents.ts` (`noteOwnerEvent`) is called from the three places the owner acts on that draft (`assistantSessions.ts`):
   - `claimAssistantSession` (signup through the agent link) and `receivePreparedRikma` (an existing account) → `claimed`: `onboarding.claimedAt/claimedBy`, stage → `onboardingStarted`;
   - `materializeRikmaBlueprint` creating a **new** rikma → `rikmaCreated`: `onboarding.rikmaCreatedAt/rikmaId`, stage → `joined`.
   The rule is `applyOwnerEvent` (`lib/growth/prospect.ts`): repeats are no-ops, it is logged with `by: null` (the system), and a closed stage (`declined`) is recorded but **never left by itself** — the owner joined anyway, so the operator decides. It is best-effort: an error is logged, never thrown into the owner's signup. The business page shows "the owner took the draft" / "created their rikma" with a link to it. A link prepared before this change has no `sessionId` and still needs the manual stage.
3. **A demand read model — built (2026-11-24),** see §9.2. Needs the server API token to have `ratson` find (other serviceAdmin wish reads already use it); `npm run validate:qids` passes for `growthDemandWishes`.
4. **"Active provider" signal.** Phase 1 sets it by hand. Phase 2 could derive it from the claimed rikma having at least one product and at least one proposal or sale in the last N days.
5. **Discovery integrations** (Phase 2). These need keys and terms review: Google Places (`places/israel.ts` holds only static data today), public directories, and the 1💗1 network itself (`searchRikmasTool` / `findPartnersTool` data). Each one must plug in as a source that emits `ProspectInput` with `sourceKind` + `sourceUrl` and goes through the same dedupe. No new endpoint has been added for it yet.

## 11. Phases

- **Phase 1 (built):**
  - dashboard;
  - manual add and CSV import;
  - research with evidence checks;
  - editable profile with origin badges and a preview;
  - outreach drafts (he/en/ar, four kinds) with approval;
  - copy / WhatsApp / mail hand-off with an explicit "did you send it?";
  - responses, follow-up reminders and notes;
  - manual stages with the do-not-contact rules;
  - onboarding link through `prepareSignup`;
  - a basic network intelligence page from pipeline data.
- **Phase 2:** automated discovery sources (§10.5), the active-provider signal (§10.4). Built: the Strapi store (§10.1), the claim callback (§10.2), demand signals (§9.2), MCP (§8.5).
- **Phase 3:**
  - a scheduled job that lists due follow-ups (a digest for the operator; **still never sending to businesses**);
  - gap analysis against demand;
  - batch research over the research queue, rate-limited by the governor;
  - acquisition analytics: time per stage, conversion per source and category.

## 12. Files

```
src/lib/growth/                 pure: types, stages, dedupe, csv, prospect, research, profile, outreach, insights, demand, client
src/lib/server/growth/          config, operator, repo, strapiRepo, agent, ownerEvents, demand
src/lib/server/actions/configs/growth.ts
src/lib/components/growth/      StageChip, OriginBadge, SourceBadge, ProspectForm, CsvImport, ResearchPanel, ProfilePanel, OutreachPanel, ActivityPanel
src/routes/(reg)/growth/        overview, discover, pipeline (?view=research|profiles|outreach|…), b/[id], intelligence, settings
src/lib/styles/growth.css
src/lib/translations/*/growth.json
src/mastra/tools/growthTools.ts  MCP tools (§8.5)
```

Tests:
- `src/lib/growth/demand.test.ts`: demand counts, privacy of the reduced row, gaps and priority.
- `src/lib/growth/growth.test.ts`: pure rules, including the blueprint against the real `BlueprintInputSchema`.
- `src/lib/server/growth/growth.server.test.ts`: file store, operator check, research and outreach agent, and the actions end to end on a memory store, including the do-not-contact doors.
- `src/lib/components/growth/panels.svelte.test.ts`: the panels render.
- `src/mastra/tools/growthTools.test.ts`: the MCP tools — operator-only, key scope, dedupe, do-not-contact.
