# PLAN — Invite a new partner from the mission form

**State:** inprogress — P1 built (solo rikma, link + optional email); P2 built 2026-10-26, awaiting the 1.0b deploy + `types:update` (see "P2 — as built") · **Owner:** Baruch · **Date:** 2026-10-25 · **Checked against the code:** 2026-10-26

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
| `invitePartnerToOpenEntities(email, targets, projectName, deps)` | `src/lib/server/matching/engine.ts:620` | Registered → `match-suggestion` (`source:'invited'`, score 100, sorts first on lev) + email. Unregistered → email to `/project/[id]/join`. Rate limit 20/h per inviter (`PARTNER_INVITE_PER_HOUR`). Returns `joinUrl` (the bare join page). Respects a prior `dismissed`. |
| `sendPartnerInvitationEmail` | `src/lib/server/matching/notify.ts:99` | The email itself, localized. |
| `370findUserForInvite` | `src/routes/api/send/qidsAssistant.js:232` | Email → user lookup. |
| Public join page | `src/routes/(regandnon)/project/[id]/join` | Lists open missions; visitor self-nominates after signup. |
| `/hascama?invite=` cookie | `src/routes/hascama/+page.server.js:61` | Precedent for carrying an invite token through signup. |
| Tests | `src/lib/server/matching/partnerInvite.test.ts` | Existing coverage of the engine function. |

Before this plan the only caller was the assistant's rikma import
(`assistantSessions.ts`). This plan adds a second caller: the mission form.

## Principle: an invite is an open mission with a name on the card — not an assignment

A non-member cannot be *assigned* (branch 2 of `createMission` creates an
`OpenMission` + `Ask` for a **member**, `rishon`). The invited person is not in
the rikma, has agreed to nothing, and may not have an account. So:

- The mission is created **open** (branch 1 or 3 — unchanged).
- The invitee gets a link the inviter can send on WhatsApp and, when an email
  was given, an `invited` match-suggestion + email (registered) or an email to
  the join page (unregistered).
- The invitee self-nominates; the rikma approves through the ordinary consent
  flow (`applyToMission` / `nominateSelfMission`). Nothing is decided for anyone —
  consistent with "no absolute no" and "silence is consent".

## The one real problem: multi-member rikmas vote first

| Rikma size | `createMission` branch | Open mission exists… | Invite fires… |
|---|---|---|---|
| 1 member | 3 → `OpenMission` directly | immediately | immediately (**P1, built**) |
| >1 members | 1 → `Pendm` (vote) | only after the vote matures | **after maturation** (P2) |

Inviting someone to a mission the rikma has not approved yet would be acting for
the rikma. So for branch 1 the invite is **stored on the Pendm** and fired when
it becomes an `OpenMission`. Voters see "this proposal will invite X" before
they vote (transparency; they can counter).

P1 blocked this on both sides; P2 (built) replaced the block with the stored
invite described in "P2 — as built" below.

Pendm matures in **two** places — both must fire it:
1. `src/lib/server/actions/configs/voteOnPendm.ts` (~line 241, explicit vote)
2. `src/routes/api/timegrama/pend.svelte` (~line 116, restime silence)

Same pattern the shift plan already uses (`activatePlanForPendm` is called from
both, right after the new open-mission id is read). Put the logic in one helper,
call it from both.

## Changes

### Strapi (1.0b) — storage only (P2)
- `pendm.pendingInvites`: `json`, nullable. Shape:
  `[{ email?: string, invitedBy: string, at: ISO }]`.
- No new content-type, no controller/service logic.
- `npm run types:update` in the frontend afterwards.

### SvelteKit — server
1. **`src/lib/server/invites/missionInvite.ts`** — *built in P1*
   - `missionInviteLink(projectId, openMissionId, inviterId)` →
     `https://www.1lev1.com/project/{id}/join?m={openMissionId}&inv={inviterId}`.
     The join page ignores unknown params, so the link is valid today and gains
     meaning in P3.
   - `normalizeInviteEmail(raw)` → `undefined` for none/empty (a link-only
     invite), trimmed + lowercased otherwise; throws on a non-string, more than
     254 chars, or anything not shaped like an address.
   - `inviteToOpenMission({ projectId, projectName, openMissionId, missionName, inviterId, email? }, deps)`
     → without an email returns `{ result: 'linkOnly', link }` and calls
     nothing; with one, a thin wrapper over `invitePartnerToOpenEntities` with
     `targets = { openMissions: [{ id, name }], openMashaabims: [] }`. Returns
     `{ result, link, registered?, retryAfterSeconds? }`, where `result` is the
     engine's `PartnerInviteResult` or `'linkOnly'`. **Never throws** — an engine
     error becomes `{ result: 'failed', link }`.
   - *P2:* `firePendingInvites(pendm, openMissionId, deps)` → reads
     `pendm.pendingInvites`, calls `inviteToOpenMission` per entry, never throws
     (an invite failure must not fail the vote — log and continue).
2. **`createMission.ts`** — optional param `invite: { email?: string }` — *built in P1*
   - The email is normalized **before anything is written**, so a bad address
     cannot leave a mission behind with a lost invite.
   - Rejected if combined with `assignedUserId` (an invited mission is open).
   - When `userCount > 1`: requires the email (P2 — see "P2 — as built").
   - Branch 3 (solo): after the `OpenMission` exists and the matching engine has
     run → `inviteToOpenMission`; the outcome is returned as `data.invite`.
   - *P2* — Branch 1 (vote): write `pendingInvites` on the Pendm; return
     `{ invite: { result: 'pendingVote', link? } }`. Add to the vote notification
     copy: "this proposal will invite a new partner".
3. *P2* — **`voteOnPendm.ts`** + **`timegrama/pend.svelte`** — after
   `createOpenMission` succeeds, `await firePendingInvites(...)` (caught).
4. *P3* — **The emailed link carries the mission too.** Today the link the
   inviter copies has `?m=&inv=`, but the email the engine sends still points at
   the bare `/project/{id}/join` (its `joinUrl`). Let the engine accept an
   optional join URL (one line) and pass `missionInviteLink(...)` from
   `inviteToOpenMission`; keep the old URL valid.
5. *P3* — **Attribution (growth metric)**: on `/project/[id]/join`, set an
   `invited_by` cookie (30 days, same options as `invite_token`) from `inv`; on
   signup completion store it on the user (`ai_meta.invitedBy` — no schema change
   if the user already has `ai_meta`; check `STRAPI_SCHEMA_REFERENCE.md`). Lets
   us count "new users from invites" per inviter.

### SvelteKit — UI
1. **`mission.svelte`, assignee section (~line 1813)** — *built in P1*
   - A checkbox **"Invite someone new to the mission"** under the "me / a
     member" choices, shown only when `canInvite` (`projectId` set, not
     `specMode` / `publishMode`, and `userslength <= 1` — the most common case
     today). Checking it clears "assign to me"; choosing "me" unchecks it.
   - Email field (optional) — the invite still produces a link without one.
     Validated client-side with the same loose shape as the server.
   - On success the form **stays open** and `InviteResultCard.svelte` shows the
     link; closing it (`onDone`) closes the form. Messages by `result`:
     - `invited` + registered → "Email sent; it's first on their lev page"
     - `invited` (unregistered, lookup outage) / `notRegistered` → "Email sent;
       send the link directly too"
     - `linkOnly` → "Send the link to whoever you want to invite"
     - `self` → "That's your own address"
     - `emailFailed` / `emailSkipped` / `rateLimited` / `failed` → "The email
       wasn't sent, but the link works" — inviting never dead-ends.
     - Every case: **[Send on WhatsApp]** (`https://wa.me/?text=` + localized
       message + link) and **[Copy link]**.
     - *P2:* `pendingVote` → "Will be sent when the rikma approves the mission".
   - Svelte 5 runes, `onclick`, mobile-first, RTL.
2. *P3* — **Join page** — when `?m=` is present, pin that mission at the top with
   "{inviter} invited you to this" and a single primary CTA (sign up → back to
   this mission). This is the conversion screen; it deserves the most care.
3. **i18n** — `mission.invite.*` keys in `mission.json` (he/en/ar/ru/es) —
   *built in P1*. *P3:* `pages.json` (`projectJoin.invitedTo…`). Run
   `npm run check:i18n` and `npm run check:script`. Hebrew spelling `רקמה`.

### Authorization
- `createMission` already requires `projectMember`; the invite rides on it.
- `invite.email` is validated server-side (format, lowercase, max 254). Never
  echo whether an email is registered to the inviter beyond what the engine
  already returns (`registered` only — acceptable, they're inviting to their own
  rikma; revisit if abused).
- Rate limit is the engine's (20/h/inviter). Fine for launch.

## Tests
- `missionInvite.test.ts` — *built*: the link carries `m` + `inv`; email
  normalization (empty → link-only, trim/lowercase, reject non-addresses);
  no email → no engine call; exactly this open mission is handed to the engine;
  an engine error still returns the link; a rate limit passes its retry time
  through.
- *To add:* `createMission` — `invite` + `assignedUserId` rejected; `invite` in a
  multi-member rikma rejected (P1) / stored on the Pendm (P2).
- *P2:* vote → stored, not fired; `firePendingInvites` swallows engine errors;
  dedupe the same email twice; both maturation paths call `firePendingInvites`
  (one test each).
- Existing `partnerInvite.test.ts` covers the engine.

## Phasing
- **P1 (built):** invite for solo rikmas — UI checkbox + `createMission` branch 3
  + result card with WhatsApp/copy, with an optional email through the existing
  engine. No schema change. Fastest path to the daily-growth goal.
- **P2:** `pendingInvites` for multi-member rikmas (schema field, both
  maturation hooks, vote copy, `pendingVote` in the UI).
- **P3:** the emailed link carries `?m=&inv=`, join page `?m=` pinning,
  `invited_by` attribution, and a small counter on the inviter's lev page
  ("3 people joined through you").

## P2 — as built (2026-10-26)

Where this differs from the sketch above, this section is the truth.

- **Strapi (1.0b):** `pendingInvites: json` on **both** `pendm` and `pmash`
  (`src/api/{pendm,pmash}/content-types/*/schema.json`). Entry shape
  `{ email, invitedBy, at, lang? }` — `lang` so the email reads in the
  inviter's language even when silence matures it.
- **Server-only field.** Four new qids, all `serviceAdmin`-only in
  `qidsAccess.js`: `461pendmPendingInvites` / `463pmashPendingInvites` (read:
  name, invites, rikma name) and `462setPendmPendingInvites` /
  `464setPmashPendingInvites` (write). Deliberately **not** added to the vote
  qids (`142getPendmForVote` / `144getPmashForVote`): the invitee's address
  never reaches a member's browser, and a missing field cannot break a vote.
- **`src/lib/server/invites/pendingInvites.ts`:** `storePendingInvite(kind, id,
  invite, strapi)` → boolean, and `firePendingInvites({ kind, proposalId,
  openEntityId }, deps)` → reads with the service token, dedupes by address,
  sends through `inviteToOpenMission` / `inviteToOpenResource`. Neither throws —
  which also covers the window where the app is deployed before 1.0b.
- **Email required when the rikma votes.** Nobody is there to receive a link at
  maturation, so `createMission` / `createResource` throw on a link-only invite
  when `userCount > 1`, and both forms mark the email required there. The
  outcome is `{ result: 'pendingVote' }` (stored) or `{ result: 'notStored' }`
  (the proposal stands, the invite did not land) — no `link` in either.
- **Voters are told.** The pendm / pmash vote notification gains one sentence:
  the proposal includes inviting a new partner, sent only if it is approved.
  (The vote card itself does not show it yet.)
- **All four maturation paths fire it**, right after the open entity exists:
  `voteOnPendm.ts`, `timegrama/pend.svelte`, `voteOnPmash.ts`,
  `timegrama/pendM.svelte`. An *assigned* pendm (`rishon`) never carries an
  invite — `invite` + `assignedUserId` is rejected at creation.
- **UI:** `mission.svelte` and `ResourceCreator.svelte` offer the invite in
  every rikma; `InviteResultCard` shows `pendingVote` / `notStored` without the
  link and buttons. New keys `mission.invite.voteHelp / resourceVoteHelp /
  emailPlaceholderRequired / emailRequired / pendingVote / pendingVoteResource
  / notStored` (5 locales).
- **Tests:** `pendingInvites.test.ts` (9) and
  `configs/voteMaturesPendingInvites.test.ts` (3: both explicit-vote paths
  fire; a vote that does not complete consensus fires nothing). The two
  timegrama paths have no test (`.svelte` modules, no harness yet), and
  `createMission`'s own guards are still untested.
- **Deploy order:** 1.0b first, then `npm run types:update` here — until then
  `validate:qids` reports the two `set…PendingInvites` mutations, and every
  invite in a rikma that votes ends as `notStored`.
- **Known limit / next:** a link-only invite is impossible in a rikma that
  votes. If wanted, notify the inviter with the link when the proposal matures.

## Decisions (Baruch, 2026-10-26)
1. **Open.** Open-with-invite (this plan), not a *reserved* mission that others
   can't take for N hours — reserved would need a new consent rule.
2. **No phone for now.** A phone number instead of email is only useful with an
   SMS/WhatsApp sender; the copy-link / WhatsApp buttons cover it.
3. **Yes — the resource form too.** The engine already supports resources.
   - *Server — built:* `inviteToOpenResource({ projectId, projectName, openMashaabimId, resourceName, inviterId, email? }, deps)`
     and `resourceInviteLink(...)` (`/project/{id}/join?r={openMashaabimId}&inv=…`)
     in `missionInvite.ts`, sharing one private `inviteTo` with the mission
     path. `createResource` takes `invite: { email? }` with the same rules as
     `createMission`: normalized before anything is written, rejected with
     `isAssigned` (the resource is open), rejected when `userCount > 1` (until
     P2); in a solo rikma it runs right after `matchOpenMashaabimToUsers` and
     returns `invite: { result, link, … }` beside the created record. Typed in
     `actionClient.ts`. Tests: 4 more in `missionInvite.test.ts`.
   - *UI — built:* `ResourceCreator.svelte` shows the same checkbox + optional
     email under the self-assign box (the two exclude each other), sends
     `invite`, and keeps the form up behind `InviteResultCard kind="resource"`
     until the inviter taps Done, then calls `onCreated`. Gated on a new
     `memberCount` prop (`=== 1`), not on `userslength` — the moach create page
     never passed `userslength`, so its default of 1 would show the invite in
     every rikma; the page now passes `memberCount` and `projectName`. Keys:
     `mission.invite.resourceOptionLabel / resourceHelp / sentRegisteredResource
     / shareMessageResource` (5 locales).
   - *To do:* `?r=` pinning on the join page (P3), and the `pendingInvites`
     field on `pmash` alongside `pendm` (P2 — matures in `voteOnPmash.ts` and
     the timegrama pmash path).

---

# תרגום לעברית — הזמנת שותף חדש מטופס המשימה

**מצב:** בתהליך — שלב P1 בנוי (רקמה של חבר יחיד, קישור + מייל אופציונלי); שלב P2 נבנה ב־2026-10-26, ממתין לפריסת 1.0b ול־`types:update` (ראו "P2 — כפי שנבנה") · **אחראי:** ברוך · **תאריך:** 2026-10-25 · **נבדק מול הקוד:** 2026-10-26

## למה

צמיחה. כל רקמה צריכה אנשים שעוד אין לה, ומי שיוצר משימה בדרך כלל כבר יודע
מי צריך לבצע אותה. היום בוחר המבצע ב־`mission.svelte` מציע רק חברים קיימים
(`pu`), כך שהידע הזה הולך לאיבוד: החבר פותח את המשימה ומקווה שמנוע ההתאמות
ימצא מישהו. הזמנה אחת לכל משימה חדשה היא ערוץ הגיוס הזול ביותר שיש לפלטפורמה —
כל מוזמן מגיע עם סיבה קונקרטית להירשם, שמשולמת בחלק ברקמה.

## מה כבר קיים (להשתמש, לא לבנות מחדש)

| רכיב | איפה | מה הוא נותן |
|---|---|---|
| `invitePartnerToOpenEntities(email, targets, projectName, deps)` | `src/lib/server/matching/engine.ts:620` | רשום ← `match-suggestion` (`source:'invited'`, ציון 100, ממוין ראשון בעמוד הלב) + מייל. לא רשום ← מייל לעמוד `/project/[id]/join`. הגבלת קצב: 20 לשעה לכל מזמין (`PARTNER_INVITE_PER_HOUR`). מחזיר `joinUrl` (עמוד ההצטרפות בלי פרמטרים). מכבד `dismissed` קודם. |
| `sendPartnerInvitationEmail` | `src/lib/server/matching/notify.ts:99` | המייל עצמו, מתורגם. |
| `370findUserForInvite` | `src/routes/api/send/qidsAssistant.js:232` | חיפוש משתמש לפי מייל. |
| עמוד ההצטרפות הציבורי | `src/routes/(regandnon)/project/[id]/join` | מציג משימות פתוחות; המבקר מציע את עצמו אחרי ההרשמה. |
| עוגיית `/hascama?invite=` | `src/routes/hascama/+page.server.js:61` | תקדים להעברת טוקן הזמנה דרך ההרשמה. |
| בדיקות | `src/lib/server/matching/partnerInvite.test.ts` | כיסוי קיים של פונקציית המנוע. |

לפני התכנית הזו הקורא היחיד היה ייבוא הרקמה של העוזר (`assistantSessions.ts`).
התכנית מוסיפה קורא שני: טופס המשימה.

## עיקרון: הזמנה היא משימה פתוחה עם שם על הכרטיס — לא שיבוץ

אי אפשר *לשבץ* מי שאינו חבר (ענף 2 של `createMission` יוצר `OpenMission` + `Ask`
עבור **חבר**, `rishon`). המוזמן אינו ברקמה, לא הסכים לשום דבר, ואולי אין לו
חשבון. לכן:

- המשימה נוצרת **פתוחה** (ענף 1 או 3 — ללא שינוי).
- המוזמן מקבל קישור שהמזמין יכול לשלוח בוואטסאפ, וכשניתן מייל — גם
  `match-suggestion` מסוג `invited` + מייל (רשום) או מייל לעמוד ההצטרפות (לא רשום).
- המוזמן מציע את עצמו; הרקמה מאשרת בתהליך ההסכמה הרגיל
  (`applyToMission` / `nominateSelfMission`). שום דבר לא מוחלט בשם אף אחד —
  בהתאם ל"אין לא מוחלט" ול"שתיקה היא הסכמה".

## הבעיה האמיתית היחידה: רקמה מרובת חברים מצביעה קודם

| גודל הרקמה | ענף ב־`createMission` | המשימה הפתוחה קיימת… | ההזמנה נשלחת… |
|---|---|---|---|
| חבר אחד | 3 ← `OpenMission` ישירות | מיד | מיד (**P1, בנוי**) |
| יותר מחבר אחד | 1 ← `Pendm` (הצבעה) | רק אחרי שההצבעה מבשילה | **אחרי ההבשלה** (P2) |

להזמין מישהו למשימה שהרקמה עוד לא אישרה פירושו לפעול בשם הרקמה. לכן בענף 1
ההזמנה **נשמרת על ה־Pendm** ונשלחת כשהוא הופך ל־`OpenMission`. המצביעים רואים
"ההצעה הזו תזמין את X" לפני שהם מצביעים (שקיפות; אפשר להציע נגדית).

שלב P1 חסם את זה משני הצדדים; שלב P2 (בנוי) החליף את החסימה בהזמנה השמורה
שמתוארת ב"P2 — כפי שנבנה" למטה.

Pendm מבשיל **בשני** מקומות — שניהם חייבים לשלוח:
1. `src/lib/server/actions/configs/voteOnPendm.ts` (בערך שורה 241, הצבעה מפורשת)
2. `src/routes/api/timegrama/pend.svelte` (בערך שורה 116, שתיקה עד תום ה־restime)

אותו דפוס שתכנית המשמרות כבר משתמשת בו (`activatePlanForPendm` נקרא משניהם, מיד
אחרי קריאת מזהה המשימה הפתוחה החדשה). הלוגיקה בפונקציית עזר אחת, שנקראת משניהם.

## שינויים

### Strapi (1.0b) — אחסון בלבד (P2)
- `pendm.pendingInvites`: `json`, יכול להיות ריק. מבנה:
  `[{ email?: string, invitedBy: string, at: ISO }]`.
- בלי content-type חדש, בלי לוגיקת controller/service.
- אחר כך `npm run types:update` בפרונטאנד.

### SvelteKit — שרת
1. **`src/lib/server/invites/missionInvite.ts`** — *נבנה ב־P1*
   - `missionInviteLink(projectId, openMissionId, inviterId)` ←
     `https://www.1lev1.com/project/{id}/join?m={openMissionId}&inv={inviterId}`.
     עמוד ההצטרפות מתעלם מפרמטרים לא מוכרים, כך שהקישור תקף כבר היום ויקבל
     משמעות ב־P3.
   - `normalizeInviteEmail(raw)` ← `undefined` כשאין/ריק (הזמנת קישור בלבד),
     אחרת מקוצץ ובאותיות קטנות; זורק על ערך שאינו מחרוזת, על יותר מ־254 תווים,
     או על כל דבר שלא נראה כמו כתובת.
   - `inviteToOpenMission({ projectId, projectName, openMissionId, missionName, inviterId, email? }, deps)`
     ← בלי מייל מחזיר `{ result: 'linkOnly', link }` ולא קורא לשום דבר; עם מייל —
     עטיפה דקה מעל `invitePartnerToOpenEntities` עם
     `targets = { openMissions: [{ id, name }], openMashaabims: [] }`. מחזיר
     `{ result, link, registered?, retryAfterSeconds? }`, כש־`result` הוא
     `PartnerInviteResult` של המנוע או `'linkOnly'`. **אף פעם לא זורק** — שגיאת
     מנוע הופכת ל־`{ result: 'failed', link }`.
   - *P2:* `firePendingInvites(pendm, openMissionId, deps)` ← קורא את
     `pendm.pendingInvites`, קורא ל־`inviteToOpenMission` לכל רשומה, אף פעם לא
     זורק (כישלון הזמנה אסור שיכשיל את ההצבעה — לרשום ללוג ולהמשיך).
2. **`createMission.ts`** — פרמטר אופציונלי `invite: { email?: string }` — *נבנה ב־P1*
   - המייל מנורמל **לפני שמשהו נכתב**, כך שכתובת שגויה לא יכולה להשאיר מאחור
     משימה שההזמנה שלה אבדה.
   - נדחה בשילוב עם `assignedUserId` (משימה עם הזמנה היא פתוחה).
   - כש־`userCount > 1`: המייל חובה (P2 — ראו "P2 — כפי שנבנה").
   - ענף 3 (חבר יחיד): אחרי שה־`OpenMission` קיים ומנוע ההתאמות רץ ←
     `inviteToOpenMission`; התוצאה מוחזרת כ־`data.invite`.
   - *P2* — ענף 1 (הצבעה): לכתוב `pendingInvites` על ה־Pendm; להחזיר
     `{ invite: { result: 'pendingVote', link? } }`. להוסיף לנוסח התראת ההצבעה:
     "ההצעה הזו תזמין שותף חדש".
3. *P2* — **`voteOnPendm.ts`** + **`timegrama/pend.svelte`** — אחרי ש־
   `createOpenMission` מצליח, `await firePendingInvites(...)` (עטוף ב־catch).
4. *P3* — **גם הקישור שבמייל נושא את המשימה.** היום לקישור שהמזמין מעתיק יש
   `?m=&inv=`, אבל המייל שהמנוע שולח עדיין מפנה ל־`/project/{id}/join` החשוף
   (ה־`joinUrl` שלו). לאפשר למנוע לקבל כתובת הצטרפות אופציונלית (שורה אחת)
   ולהעביר את `missionInviteLink(...)` מתוך `inviteToOpenMission`; הכתובת הישנה
   נשארת תקפה.
5. *P3* — **ייחוס (מדד צמיחה)**: בעמוד `/project/[id]/join`, לקבוע עוגיית
   `invited_by` (30 יום, אותן אפשרויות כמו `invite_token`) מתוך `inv`; בסיום
   ההרשמה לשמור אותה על המשתמש (`ai_meta.invitedBy` — בלי שינוי סכמה אם למשתמש
   כבר יש `ai_meta`; לבדוק ב־`STRAPI_SCHEMA_REFERENCE.md`). מאפשר לספור "משתמשים
   חדשים מהזמנות" לכל מזמין.

### SvelteKit — ממשק
1. **`mission.svelte`, אזור בחירת המבצע (בערך שורה 1813)** — *נבנה ב־P1*
   - תיבת סימון **"להזמין מישהו חדש למשימה"** מתחת לאפשרויות "אני / חבר",
     מוצגת רק כש־`canInvite` (`projectId` קיים, לא `specMode` / `publishMode`,
     ו־`userslength <= 1` — המקרה הנפוץ ביותר היום). סימון התיבה מבטל את
     "לשבץ אותי"; בחירה ב"אני" מבטלת את הסימון.
   - שדה מייל (לא חובה) — ההזמנה מפיקה קישור גם בלעדיו. נבדק בצד הלקוח באותה
     תבנית מקלה כמו בשרת.
   - בהצלחה הטופס **נשאר פתוח** ו־`InviteResultCard.svelte` מציג את הקישור;
     סגירת הכרטיס (`onDone`) סוגרת את הטופס. ההודעות לפי `result`:
     - `invited` + רשום ← "שלחנו מייל, והמשימה תופיע ראשונה בעמוד הלב של המוזמן"
     - `invited` (לא רשום, תקלה בחיפוש) / `notRegistered` ← "שלחנו מייל; כדאי
       לשלוח גם את הקישור ישירות"
     - `linkOnly` ← "שלחו את הקישור למי שתרצו להזמין"
     - `self` ← "זו הכתובת שלכם"
     - `emailFailed` / `emailSkipped` / `rateLimited` / `failed` ← "המייל לא נשלח,
       אבל הקישור עובד" — הזמנה אף פעם לא מגיעה למבוי סתום.
     - בכל מקרה: **[שליחה בוואטסאפ]** (`https://wa.me/?text=` + הודעה מתורגמת +
       הקישור) ו־**[העתקת קישור]**.
     - *P2:* `pendingVote` ← "תישלח כשהרקמה תאשר את המשימה".
   - Svelte 5 runes, `onclick`, מובייל תחילה, RTL.
2. *P3* — **עמוד ההצטרפות** — כשיש `?m=`, להצמיד את המשימה הזו לראש העמוד עם
   "{המזמין} הזמין/ה אותך לזה" וקריאה לפעולה ראשית אחת (הרשמה ← חזרה למשימה
   הזו). זה מסך ההמרה; הוא ראוי לתשומת הלב הרבה ביותר.
3. **i18n** — מפתחות `mission.invite.*` ב־`mission.json` (he/en/ar/ru/es) —
   *נבנו ב־P1*. *P3:* `pages.json` (`projectJoin.invitedTo…`). להריץ
   `npm run check:i18n` ו־`npm run check:script`. כתיב עברי: `רקמה`.

### הרשאות
- `createMission` כבר דורש `projectMember`; ההזמנה נשענת על זה.
- `invite.email` נבדק בצד השרת (תבנית, אותיות קטנות, עד 254 תווים). לא לחשוף
  למזמין אם מייל רשום מעבר למה שהמנוע כבר מחזיר (`registered` בלבד — מקובל, הוא
  מזמין לרקמה שלו; לבחון מחדש אם ינוצל לרעה).
- הגבלת הקצב היא של המנוע (20 לשעה למזמין). מספיק להשקה.

## בדיקות
- `missionInvite.test.ts` — *נבנו*: הקישור נושא `m` + `inv`; נרמול מייל
  (ריק ← קישור בלבד, קיצוץ/אותיות קטנות, דחיית מה שאינו כתובת); בלי מייל ← אין
  קריאה למנוע; בדיוק המשימה הפתוחה הזו נמסרת למנוע; שגיאת מנוע עדיין מחזירה את
  הקישור; הגבלת קצב מעבירה את זמן הניסיון החוזר.
- *להוסיף:* `createMission` — `invite` + `assignedUserId` נדחה; `invite` ברקמה
  מרובת חברים נדחה (P1) / נשמר על ה־Pendm (P2).
- *P2:* הצבעה ← נשמר, לא נשלח; `firePendingInvites` בולע שגיאות מנוע; מניעת
  כפילות של אותו מייל פעמיים; שני מסלולי ההבשלה קוראים ל־`firePendingInvites`
  (בדיקה לכל אחד).
- `partnerInvite.test.ts` הקיים מכסה את המנוע.

## שלבים
- **P1 (בנוי):** הזמנה ברקמות של חבר יחיד — תיבת סימון בממשק + ענף 3 של
  `createMission` + כרטיס תוצאה עם וואטסאפ/העתקה, עם מייל אופציונלי דרך המנוע
  הקיים. בלי שינוי סכמה. הדרך המהירה ביותר ליעד הצמיחה היומי.
- **P2:** `pendingInvites` לרקמות מרובות חברים (שדה סכמה, שני ווי ההבשלה, נוסח
  ההצבעה, `pendingVote` בממשק).
- **P3:** הקישור שבמייל נושא `?m=&inv=`, הצמדת `?m=` בעמוד ההצטרפות, ייחוס
  `invited_by`, ומונה קטן בעמוד הלב של המזמין ("3 אנשים הצטרפו דרכך").

## P2 — כפי שנבנה (2026-10-26)

איפה שזה שונה מהשרטוט שלמעלה, הסעיף הזה הוא הקובע.

- **Strapi (1.0b):** `pendingInvites: json` על **שניהם**, `pendm` ו־`pmash`
  (`src/api/{pendm,pmash}/content-types/*/schema.json`). מבנה רשומה
  `{ email, invitedBy, at, lang? }` — `lang` כדי שהמייל ייכתב בשפת המזמין גם
  כשהשתיקה היא שמבשילה את ההצעה.
- **שדה של השרת בלבד.** ארבעה qids חדשים, כולם `serviceAdmin` בלבד
  ב־`qidsAccess.js`: `461pendmPendingInvites` / `463pmashPendingInvites` (קריאה:
  שם, הזמנות, שם הרקמה) ו־`462setPendmPendingInvites` /
  `464setPmashPendingInvites` (כתיבה). בכוונה **לא** נוסף ל־qids של ההצבעה
  (`142getPendmForVote` / `144getPmashForVote`): כתובת המוזמן לא מגיעה לדפדפן
  של אף חבר, ושדה חסר לא יכול לשבור הצבעה.
- **`src/lib/server/invites/pendingInvites.ts`:** `storePendingInvite(kind, id,
  invite, strapi)` ← boolean, ו־`firePendingInvites({ kind, proposalId,
  openEntityId }, deps)` ← קורא בטוקן השירות, מסנן כפילויות לפי כתובת, ושולח
  דרך `inviteToOpenMission` / `inviteToOpenResource`. אף אחת מהן לא זורקת — מה
  שמכסה גם את חלון הזמן שבו האפליקציה נפרסת לפני 1.0b.
- **ברקמה שמצביעה המייל חובה.** ברגע ההבשלה אין מי שיקבל קישור, לכן
  `createMission` / `createResource` זורקים על הזמנת קישור בלבד כש־
  `userCount > 1`, ושני הטפסים מסמנים שם את המייל כחובה. התוצאה היא
  `{ result: 'pendingVote' }` (נשמרה) או `{ result: 'notStored' }` (ההצעה קיימת,
  ההזמנה לא נשמרה) — בלי `link` באף אחת מהן.
- **המצביעים יודעים.** להתראת ההצבעה על pendm / pmash נוסף משפט אחד: ההצעה
  כוללת הזמנה של שותף חדש, שתישלח רק אם תאושר. (כרטיס ההצבעה עצמו עוד לא מציג
  את זה.)
- **כל ארבעת מסלולי ההבשלה שולחים**, מיד אחרי שהישות הפתוחה קיימת:
  `voteOnPendm.ts`, `timegrama/pend.svelte`, `voteOnPmash.ts`,
  `timegrama/pendM.svelte`. pendm *משובץ* (`rishon`) אף פעם לא נושא הזמנה —
  `invite` + `assignedUserId` נדחה כבר ביצירה.
- **ממשק:** `mission.svelte` ו־`ResourceCreator.svelte` מציעים את ההזמנה בכל
  רקמה; `InviteResultCard` מציג `pendingVote` / `notStored` בלי הקישור והכפתורים.
  מפתחות חדשים `mission.invite.voteHelp / resourceVoteHelp /
  emailPlaceholderRequired / emailRequired / pendingVote / pendingVoteResource
  / notStored` (5 שפות).
- **בדיקות:** `pendingInvites.test.ts` (9) ו־
  `configs/voteMaturesPendingInvites.test.ts` (3: שני מסלולי ההצבעה המפורשת
  שולחים; הצבעה שלא משלימה הסכמה לא שולחת כלום). לשני מסלולי ה־timegrama אין
  בדיקה (מודולי `.svelte`, עוד אין להם תשתית בדיקה), וגם השמירות של
  `createMission` עצמו עדיין לא בדוקות.
- **סדר פריסה:** קודם 1.0b, ואז `npm run types:update` כאן — עד אז
  `validate:qids` מדווח על שתי המוטציות `set…PendingInvites`, וכל הזמנה ברקמה
  שמצביעה מסתיימת כ־`notStored`.
- **מגבלה ידועה / הצעד הבא:** ברקמה שמצביעה אי אפשר להזמין בקישור בלבד. אם
  רוצים, אפשר לשלוח למזמין את הקישור כשההצעה מבשילה.

## החלטות (ברוך, 2026-10-26)
1. **פתוחה.** משימה פתוחה־עם־הזמנה (התכנית הזו), ולא משימה *שמורה* שאחרים לא
   יכולים לקחת במשך N שעות — שמורה הייתה דורשת כלל הסכמה חדש.
2. **בינתיים בלי טלפון.** מספר טלפון במקום מייל שימושי רק עם שולח SMS/וואטסאפ;
   כפתורי העתקת הקישור והוואטסאפ מכסים את זה.
3. **כן — גם בטופס המשאב.** המנוע כבר תומך במשאבים.
   - *שרת — נבנה:* `inviteToOpenResource({ projectId, projectName, openMashaabimId, resourceName, inviterId, email? }, deps)`
     ו־`resourceInviteLink(...)` (`/project/{id}/join?r={openMashaabimId}&inv=…`)
     ב־`missionInvite.ts`, עם פונקציה פרטית אחת `inviteTo` המשותפת למסלול
     המשימה. `createResource` מקבל `invite: { email? }` באותם כללים כמו
     `createMission`: מנורמל לפני שמשהו נכתב, נדחה יחד עם `isAssigned` (המשאב
     פתוח), וכש־`userCount > 1` המייל חובה (P2); ברקמה של חבר יחיד הוא רץ מיד אחרי
     `matchOpenMashaabimToUsers` ומחזיר `invite: { result, link, … }` לצד הרשומה
     שנוצרה. מוגדר בטיפוסים של `actionClient.ts`. בדיקות: 4 נוספות
     ב־`missionInvite.test.ts`.
   - *ממשק — נבנה:* `ResourceCreator.svelte` מציג את אותה תיבת סימון + מייל
     אופציונלי מתחת לתיבת "השמה לעצמי" (השתיים מבטלות זו את זו), שולח `invite`,
     ומשאיר את הטופס פתוח מאחורי `InviteResultCard kind="resource"` עד שהמזמין
     לוחץ "סיום", ואז קורא ל־`onCreated`. מותנה ב־prop חדש `memberCount`
     (`=== 1`) ולא ב־`userslength` — דף היצירה ב־moach אף פעם לא העביר
     `userslength`, וברירת המחדל 1 הייתה מציגה את ההזמנה בכל רקמה; הדף מעביר
     עכשיו `memberCount` ו־`projectName`. מפתחות:
     `mission.invite.resourceOptionLabel / resourceHelp / sentRegisteredResource
     / shareMessageResource` (5 שפות).
   - *נותר:* הצמדת `?r=` בעמוד ההצטרפות (P3), ושדה `pendingInvites` על `pmash`
     לצד `pendm` (P2 — מבשיל ב־`voteOnPmash.ts` ובמסלול ה־pmash של timegrama).
