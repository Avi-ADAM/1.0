# PLAN — Invite a new partner from the mission form

**State:** inprogress — P1 built (solo rikma, link + optional email) · **Owner:** Baruch · **Date:** 2026-10-25

## Why

Growth. Every rikma needs people it does not have yet, and the person creating a
mission usually already knows who should do it. Today the assignee picker in
`mission.svelte` offers only existing members (`pu`), so that knowledge is lost:
the member opens the mission and hopes the matching engine finds someone. One
invite per new mission is the cheapest acquisition channel the platform has —
each invitee arrives with a concrete, paid-in-equity reason to sign up.

## What already exists (reuse, don't rebuild)

| Piece | Where | What it gives us |
|---|---|---|
| `invitePartnerToOpenEntities(email, targets, projectName, deps)` | `src/lib/server/matching/engine.ts:620` | Registered → `match-suggestion` (`source:'invited'`, score 100, sorts first on lev) + email. Unregistered → email to `/project/[id]/join`. Rate limit 20/h per inviter. Returns `joinUrl`. Respects a prior `dismissed`. |
| `sendPartnerInvitationEmail` | `src/lib/server/matching/notify.ts:94` | The email itself, localized. |
| `370findUserForInvite` | `src/routes/api/send/qidsAssistant.js:232` | Email → user lookup. |
| Public join page | `src/routes/(regandnon)/project/[id]/join` | Lists open missions; visitor self-nominates after signup. |
| `/hascama?invite=` cookie | `src/routes/hascama/+page.server.js:61` | Precedent for carrying an invite token through signup. |
| Tests | `src/lib/server/matching/partnerInvite.test.ts` | Existing coverage of the engine function. |

Today the only caller is the assistant's rikma import (`assistantSessions.ts:380`).
This plan adds a second caller: the mission form.

## Principle: an invite is an open mission with a name on the card — not an assignment

A non-member cannot be *assigned* (branch 2 of `createMission` creates an
`OpenMission` + `Ask` for a **member**, `rishon`). The invited person is not in
the rikma, has agreed to nothing, and may not have an account. So:

- The mission is created **open** (branch 1 or 3 — unchanged).
- The invitee gets an `invited` match-suggestion + email + a link the inviter can
  send on WhatsApp.
- The invitee self-nominates; the rikma approves through the ordinary consent
  flow (`applyToMission` / `nominateSelfMission`). Nothing is decided for anyone —
  consistent with "no absolute no" and "silence is consent".

## The one real problem: multi-member rikmas vote first

| Rikma size | `createMission` branch | Open mission exists… | Invite fires… |
|---|---|---|---|
| 1 member | 3 → `OpenMission` directly | immediately | immediately |
| >1 members | 1 → `Pendm` (vote) | only after the vote matures | **after maturation** |

Inviting someone to a mission the rikma has not approved yet would be acting for
the rikma. So for branch 1 the invite is **stored on the Pendm** and fired when
it becomes an `OpenMission`. Voters see "this proposal will invite X" before
they vote (transparency; they can counter).

Pendm matures in **two** places — both must fire it:
1. `src/lib/server/actions/configs/voteOnPendm.ts` (~line 241, explicit vote)
2. `src/routes/api/timegrama/pend.svelte` (~line 116, restime silence)

Same pattern the shift plan already uses (`activatePlanForPendm` is called from
both). Put the logic in one helper, call it from both.

## Changes

### Strapi (1.0b) — storage only
- `pendm.pendingInvites`: `json`, nullable. Shape:
  `[{ email?: string, userId?: string, invitedBy: string, at: ISO }]`.
- No new content-type, no controller/service logic.
- `npm run types:update` in the frontend afterwards.

### SvelteKit — server
1. **`src/lib/server/invites/missionInvite.ts`** (new)
   - `inviteToOpenMission({ openMissionId, missionName, projectId, projectName, invitee, invitedBy, lang }, deps)`
     → thin wrapper over `invitePartnerToOpenEntities` with
     `targets = { openMissions: [{ id, name }], openMashaabims: [] }`.
   - `firePendingInvites(pendm, openMissionId, deps)` → reads
     `pendm.pendingInvites`, calls the above per entry, never throws (an invite
     failure must not fail the vote — log and continue).
2. **`createMission.ts`** — new optional param `invite: { email?: string; userId?: string }`.
   - Reject if combined with `assignedUserId` (it's open-by-definition).
   - Branch 3 (solo): after the `OpenMission` exists → `inviteToOpenMission`;
     return `{ invite: { result, joinUrl } }` in `data`.
   - Branch 1 (vote): write `pendingInvites` on the Pendm; return
     `{ invite: { result: 'pendingVote' } }`.
   - Add to the vote notification copy: "this proposal will invite a new partner".
3. **`voteOnPendm.ts`** + **`timegrama/pend.svelte`** — after `createOpenMission`
   succeeds, `await firePendingInvites(...)` (caught).
4. **Join link carries the mission**: `joinUrl` becomes
   `/project/{id}/join?m={openMissionId}&inv={inviterId}`. Engine change is one
   line; keep the old URL valid.
5. **Attribution (growth metric)**: on `/project/[id]/join`, set an `invited_by`
   cookie (30 days, same options as `invite_token`) from `inv`; on signup
   completion store it on the user (`ai_meta.invitedBy` — no schema change if the
   user already has `ai_meta`; check `STRAPI_SCHEMA_REFERENCE.md`). Lets us count
   "new users from invites" per inviter.

### SvelteKit — UI
1. **`mission.svelte`, assignee section (~line 1754)**
   - Add a third choice next to "me / a member": **"Invite someone new"**
     (shown also when `userslength === 1` — that's the most common case today).
   - Fields: email (optional) — the invite still produces a link without one.
   - On success show a small result card:
     - registered → "Invite sent to {name}; it's first on their lev page"
     - unregistered → "Email sent" + **[Copy link] [Send on WhatsApp]**
       (`https://wa.me/?text=` + localized message + `joinUrl`)
     - `pendingVote` → "Will be sent when the rikma approves the mission"
     - `rateLimited` / `emailFailed` → show the link anyway; inviting never dead-ends.
   - Svelte 5 runes, `onclick`, mobile-first, RTL.
2. **Join page** — when `?m=` is present, pin that mission at the top with
   "{inviter} invited you to this" and a single primary CTA (sign up → back to
   this mission). This is the conversion screen; it deserves the most care.
3. **i18n** — new keys in `mission.json` (he/en/ar/ru/es) and
   `pages.json` (`projectJoin.invitedTo…`). Run `npm run check:i18n` and
   `npm run check:script`. Hebrew spelling `רקמה`.

### Authorization
- `createMission` already requires `projectMember`; the invite rides on it.
- Validate `invite.email` server-side (format, lowercase, max length). Never
  echo whether an email is registered to the inviter beyond what the engine
  already returns (name only if registered — acceptable, they're inviting to
  their own rikma; revisit if abused).
- Rate limit is the engine's (20/h/inviter). Fine for launch.

## Tests
- `missionInvite.test.ts`: solo → fires now; vote → stored, not fired;
  `firePendingInvites` swallows engine errors; dedupe same email twice.
- Extend `createMission` tests: `invite` + `assignedUserId` rejected.
- Both maturation paths call `firePendingInvites` (one test each).
- Existing `partnerInvite.test.ts` covers the engine.

## Phasing
- **P1 (ship first):** link-only invite for solo rikmas — UI choice +
  `createMission` branch 3 + WhatsApp/copy. No schema change. Fastest path to
  the daily-growth goal.
- **P2:** email + `pendingInvites` for multi-member rikmas (schema field, both
  maturation hooks, vote copy).
- **P3:** join page `?m=` pinning + `invited_by` attribution + a small counter
  on the inviter's lev page ("3 people joined through you").

## Open decisions
1. Open-with-invite (this plan) vs. a *reserved* mission that others can't take
   for N hours. Reserved is stronger for the invitee but needs a new consent
   rule; recommend starting open.
2. Phone number instead of email for unregistered invitees — only useful with
   an SMS/WhatsApp sender; the copy-link button covers it for now.
3. Same affordance on the resource form (`open_mashaabim`)? The engine already
   supports resources, so it's cheap — likely P2.
