# PLAN — Match suggestions (precomputed lev recommendations)

## Why

The lev page used to pull, for **every** skill and tafkidim of the user, **all**
non-archived open missions with their skill/role/work-way id sets (query 83),
then score and rank them in the browser (`extractSuggestions` +
`calculateScore`). That made query 83 huge, recomputed the same matching on
every visit, left "who should hear about this mission" unanswerable
server-side (no emails), and didn't scale to location filtering.

## Architecture (event-driven, precomputed)

Matching now happens **once, server-side, when something changes**, and its
result is stored in a new Strapi collection **`match-suggestion`** (repo
`1.0b`):

| field | meaning |
|---|---|
| `user` | who the suggestion is for |
| `open_mission` / `open_mashaabim` | what is suggested (exactly one is set) |
| `kind` | `mission` \| `resource` |
| `score` | server-computed match score (see below) |
| `status` | `new` → `notified` / `seen` / `applied` / `dismissed` |
| `source` | `missionCreated` \| `resourceCreated` \| `profileUpdated` \| `backfill` |
| `matchedOn` | JSON: which skill/role/work-way ids matched (for "why am I seeing this") |
| `notifiedAt` | when the "new suggestion" email went out |

Inverse relations: `user.match_suggestions`, `open_mission.match_suggestions`,
`open_mashaabim.match_suggestions`.

### The engine — `src/lib/server/matching/`

- **`scoring.ts`** — pure, tested. Closed-form equivalent of the legacy
  algorithm: `score = roles + 2·skills + wwAdj − 2·missingSkills −
  missingRoles` (parity proven in `scoring.test.ts` against
  `suggestionMatchers.calculateScore`). Suggestions are only stored when
  `score ≥ MIN_SUGGESTION_SCORE (1)`.
- **`engine.ts`** — the three flows (all run with the admin service token via
  `StrapiClient`, all swallow their own errors, capped at 50
  suggestions/event):
  - `matchOpenMissionToUsers(id, source, deps)` — new open mission → find
    users by skill/role overlap (qid 201), score, exclude
    declined/rishon/already-suggested, create rows, **email** matched users.
  - `matchOpenMashaabimToUsers(id, source, deps)` — new open resource
    request → users whose active `sp` offers the same `mashaabim`, minus
    `declinedsps`, create rows + **email**.
  - `matchUserToOpenEntities(userId, source, deps)` — profile changed /
    backfill → scan open missions (qid 203) and open mashaabims (qid 206)
    for the user, create missing rows (no email — the user is in the app).
  - `dismissSuggestion(userId, target, deps)` — decline sync.
- **`notify.ts`** — "יש לך הצעה חדשה" emails through the existing
  `EmailService` (SimpleNuti template, `noMail` respected, he/en).

### Trigger points (hooks)

| action | hook |
|---|---|
| `createMission` (branch 3, solo open mission) | `matchOpenMissionToUsers` |
| `voteOnPendm` (consensus → open mission) | `matchOpenMissionToUsers` |
| `publishWishNeedToCommunity` (mission / resource) | both matchers |
| `createResource` (solo open mashaabim, not self-assigned) | `matchOpenMashaabimToUsers` |
| `voteOnPmash` (consensus → open mashaabim) | `matchOpenMashaabimToUsers` |
| `updateUserRelation` (skills / tafkidims / work_ways) | `matchUserToOpenEntities` |
| `declineOpenMission` | `dismissSuggestion` (status → `dismissed`) |
| `declineSpForMashaabim` (huca card decline) | `dismissSuggestion` |
| `refreshMySuggestions` (new action) | `matchUserToOpenEntities` for the caller — used as lazy backfill |
| timegrama silence-approval: `pend.svelte` (pendm → open mission), `pendM.svelte` (pmash → open mashaabim) | respective matcher, via the exported shared `strapiClient` |

The timegrama chain: external cron → `GET /api/pingrama` → `GET
${VITE_REND}api/timegrama` → dispatcher (`+server.js`) → `Pend`/`PendM` →
matching engine (the dispatcher passes `event.fetch` through for the emails).

### Location filtering (`src/lib/server/matching/geo.ts`)

Every matcher also checks location compatibility (tested in `geo.test.ts`):
an online/hybrid/unlocated entity matches everyone; a physical entity
(onsite, or coordinates without an explicit mode) matches users with any
located point within `entity.radius (default 50km) + point.radius`; users
with no located points are **kept** (never silently hidden).

### Lev page (clean pull)

- Query 83 **no longer nests `open_missions` under every skill/tafkidim**
  (only the id lists remain) — the main lev payload shrinks drastically.
- `levDataLoader` background step now calls qid **`209levMatchSuggestions`**
  (own rows only — `idL` is forced to the cookie user), builds cards with
  `buildSuggestionsFromMatchRecords` (merges the user's pending
  asks/negotiation state from query 83, filters declined), and sets
  `suggestionsStore`. Query 84 enrichment is gone — 209 carries the full card
  payload.
- **Lazy backfill:** if a user has zero stored rows but has skills/roles, the
  loader fires `refreshMySuggestions` once and re-pulls.

### QIDS added (`src/routes/api/send/qids.js`)

200–206 (engine reads), 207/208 (create/update row), 209 (lev pull),
210/211 (find rows for dismiss).

## Deployment order

1. Deploy `1.0b` (branch off `shabab`) — creates the collection + relations.
2. `npm run types:update` in `1.0` to refresh `src/generated/` (until then
   `validate:qids` warns that `MatchSuggestionInput` is unknown — expected).
3. Deploy `1.0`. No Strapi role permissions needed: every path goes through
   the service token (`/api/send` + `StrapiClient`).

## Lev resource cards (huca)

Resource suggestions are read via qid **`212levResourceMatchSuggestions`**
and mapped by `buildResourceSuggestionsFromMatchRecords` (my `sp` — `myp`/
`oid` — is looked up from the slimmed `sps` block of query 83 by the shared
mashaabim id; pending Askm state merges as before). The heavy
`sps → mashaabim → open_mashaabims` nesting was removed from query 83.

## Known follow-ups

- `extractSuggestions` / `extractResourceSuggestions` stay as fallback shells
  (ask-derived cards only / empty); remove once 209/212 are proven in
  production.
- The external cron that pings `/api/pingrama` (→ `/api/timegrama`) is infra,
  not in this repo — if silence-approval seems dead, check that cron first.
