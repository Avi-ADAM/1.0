# Guest meeting invitations & post‑registration import

This documents the **email‑bound guest invitation** flow that spans the two
repos (`magik-meetings` = the meetings front‑end, `1.0` = the main site / API),
and — importantly — **exactly what, if anything, needs to change in Strapi**.

## TL;DR on Strapi

**The implemented flow requires _no new Strapi content‑types._** It reuses the
existing `pgishauserpend` (pending meeting participant) collection. Invitations
are stateless, HMAC‑signed tokens — nothing is persisted upstream to create or
verify them.

The only hard requirement is an **env var** (`GUEST_INVITE_SECRET`), see below.

An **optional** hardened design (persistent, revocable, auditable guest tokens)
is described at the end — those content‑types are already referenced by
`magik-meetings/src/routes/api/send/qids.js` but are **not** required for the
current implementation.

---

## How the implemented flow works

1. **Create meeting → invite by email** (`magik-meetings`)
   The meeting creator enters an invitee's email in the invitation UI.
   `POST /api/guest/invite` mints a signed token
   `base64url({ v, m: meetingId, e: email, n: name, exp }) . HMAC‑SHA256` and
   returns a link `…/meeting/invite/<token>`.

2. **Guest opens the link** (`magik-meetings`)
   `/meeting/invite/[token]` verifies the signature + expiry, then stores
   `displayName, meetingId, email, inviteToken, expiresAt` in the local
   `guest_info` cookie. The guest gets local meeting memory + online/offline
   (already existing guest behaviour).

3. **Guest chooses to register** (`magik-meetings` → `1.0`)
   The register CTA links to `https://1lev1.com/hascama?invite=<token>`
   (carrying the original signed token).

4. **Token captured at /hascama** (`1.0`)
   `src/routes/hascama/+page.server.js` stashes `?invite` into a short‑lived
   `invite_token` cookie (the onboarding UI is client‑driven and hops to
   `/signup`, so a cookie survives the hops).

5. **Import after signup** (`1.0`)
   `src/routes/signup/+page.server.js`, after creating the account, calls
   `importInvitedMeeting()` which:
   - verifies the token (`src/lib/server/guestInvite.ts`),
   - checks the **registered email === the invited email**,
   - creates a `pgishauserpend` for the new user via qid `19CreatePendMeeting`.
   The meeting then appears in the user's pending‑invitations list
   (`53GetPendingMeetings`) to approve. Best‑effort: signup never fails if the
   import fails.

Security: because the token is signed and email‑bound, a user cannot import a
meeting they weren't invited to — they'd need a valid signature for their own
email. Plain `invite_meeting`/`email` params (legacy fallback) are **not**
auto‑imported.

---

## Required configuration (both apps)

| Env var              | Where            | Notes |
| -------------------- | ---------------- | ----- |
| `GUEST_INVITE_SECRET`| `1.0` **and** `magik-meetings` | Must be the **same** value in both. Used to sign (meetings app) and verify (main site) invitation tokens. If unset, both fall back to the same dev‑only literal — fine for local dev, **must be set in production**. |

`ADMINMONTHER` (already configured) is reused by `importInvitedMeeting` as the
admin token for the `createPgishauserpend` write.

---

## Strapi — required content‑types

**None new.** The flow only needs the existing collections, unchanged:

### `pgishauserpend` (already exists)
Fields already used by the app (`qids.js` 19/53/54):

| Field                    | Type                              | Used for |
| ------------------------ | --------------------------------- | -------- |
| `users_permissions_user` | relation → `users-permissions.user` | who is invited |
| `pgisha`                 | relation → `pgisha`               | which meeting |
| `approved`               | boolean                           | invitee accepted |
| `archived`               | boolean                           | hidden from pending list |

No changes needed here — the import creates a row with
`{ users_permissions_user, pgisha }`.

---

## OPTIONAL — persistent guest tokens (future hardening)

The current tokens are stateless (can't be revoked before expiry, and there's
no server‑side audit of who joined as a guest). If you later want revocable,
auditable guest sessions, add the content‑types below. They match the queries
already present (but presently unused) in
`magik-meetings/src/routes/api/send/qids.js` (`createGuestToken`,
`findGuestTokenByToken`, `createGuestSession`, `getGuestPgishausers`, …).

### New collection: `guest-token`

| Field         | Strapi type | Required | Notes |
| ------------- | ----------- | -------- | ----- |
| `token`       | UID / Text  | yes      | the random token string; index/unique |
| `email`       | Email       | yes      | **the invited email (email‑binding)** |
| `meeting`     | Relation (many‑to‑one → `pgisha`) | yes | invited to this meeting |
| `invited_by`  | Relation (many‑to‑one → `users-permissions.user`) | no | the inviter |
| `display_name`| Text        | no       | optional prefilled guest name |
| `permissions` | JSON        | no       | `{ canSendMessages, canJoinVideo, … }` |
| `expires_at`  | DateTime    | yes      | expiry |
| `revoked_at`  | DateTime    | no       | set to revoke before expiry |
| `last_used_at`| DateTime    | no       | audit |
| `ip_address`  | Text        | no       | audit |
| `user_agent`  | Text (long) | no       | audit |

### New collection: `guest-session`

| Field             | Strapi type | Required | Notes |
| ----------------- | ----------- | -------- | ----- |
| `session_id`      | UID / Text  | yes      | unique per session; index |
| `guest_token`     | Relation (many‑to‑one → `guest-token`) | yes | parent token |
| `is_active`       | Boolean     | yes      | default true |
| `expires_at`      | DateTime    | yes      | |
| `last_activity_at`| DateTime    | no       | |
| `socket_id`       | Text        | no       | live socket correlation |
| `display_name`    | Text        | no       | |
| `permissions`     | JSON        | no       | snapshot |

### Change to existing `pgishauser`

| Field         | Strapi type | Notes |
| ------------- | ----------- | ----- |
| `guest_token` | Relation (many‑to‑one → `guest-token`) | lets `getGuestPgishausers` list the meetings a guest joined, for import/migration |

With these in place, the migration queries already written in the meetings app
(`getGuestPgishausers`, `getGuestMeetingHistory`, `associateGuestWithMeeting`)
can import **all** of a guest's meetings on registration (not just the single
invited one), and tokens become revocable. Until then, the stateless flow above
covers the primary use case with zero Strapi changes.
