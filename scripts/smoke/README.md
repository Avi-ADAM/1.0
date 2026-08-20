# Smoke tests against the live site

A browser harness for driving `www.1lev1.com` as a real logged-in member.

It exists because a whole class of bugs in this app is invisible to `vitest`:
a qid that only 403s in production, a GraphQL mutation that only fails when a
description contains a quote, a button that swallows its own error. Those need
a browser, a session and the real backend. Everything found in
`docs/QA_SOLO_RIKMA_2026-08.md` came from this harness.

## Setup

Credentials come from the environment — never put an account in the code:

```bash
export claude_user_1=…        # test-account email
export claude_us_1_ps=…       # its password

export claude_user_2=…        # second member (see below)
export claude_us_2_ps=…
```

(`SMOKE_EMAIL` / `SMOKE_PASSWORD`, and `SMOKE_EMAIL_2` / `SMOKE_PASSWORD_2`,
work too.) Playwright is expected to be installed globally in the agent image;
if `node` cannot find it, run with `NODE_PATH=/opt/node22/lib/node_modules`.

**Two accounts.** Slot 1 is enough for the read-only sweep and for
`solo-money`. Anything that needs two people needs slot 2 — consensus, a
negotiation, a split between members, one member applying to another's mission.
A single account cannot stand in: this app is built around mutual agreement, and
those flows will not let one member sign both sides.

```js
const a = await session();                 // slot 1
const b = await session({ account: 2 });   // slot 2, its own browser and cache
```

Each slot caches its session in its own file, so signing in as one does not
evict the other and a two-member flow can drive both at once.

## Testing code that is not deployed yet

`SMOKE_BASE_URL` points the whole harness somewhere else:

```bash
npm run dev &
SMOKE_BASE_URL=http://localhost:5173 node scripts/smoke/flows/stipend.mjs --yes
```

The dev server talks to the **same Strapi** as production, so this is not a
sandbox: the writes are real and land in the same database. What it buys is the
ability to drive a feature that has not shipped yet — which is the only way to
smoke-test a branch, since the flows need the real backend either way.

Two Windows notes, if that is where you are running: Git Bash rewrites an
argument that starts with `/` into a Windows path (`npm run smoke -- /lev`
becomes `C:/Program Files/Git/lev`), so prefix the command with
`MSYS_NO_PATHCONV=1`; and playwright installed globally is not on node's
resolution path, so set `NODE_PATH` to the global `node_modules`.

## Read-only sweep

```bash
npm run smoke                        # every page in the default list
npm run smoke -- /lev /moach/82/sales   # just these
npm run smoke -- --verbose           # + page text and every control
```

Visits each page, waits for the client to settle, and reports console errors,
uncaught exceptions and failed same-origin requests. Screenshots of any page
with findings go to `$TMPDIR/1lev1-smoke-shots`. Exits non-zero when anything
was found, so it can gate a deploy.

`{id}` in the default path list is filled with the first rikma on the account
(override with `SMOKE_PROJECT_ID`).

Findings are grouped: one broken query firing on every page reads as one issue
with the list of pages it hit, not as twenty-two separate failures.

```
✗ /lev → /lev  [3 issue(s)]
    [http 403] /api/send {"data":{"query":"{ usersPermissionsUser (id:256) …
    shot: /tmp/1lev1-smoke-shots/_lev.png
✗ /me → /me  [3 issue(s)]
    (+3 already reported above)
✓ /deals/sales-center → /deals/sales-center  [ok]

1/23 pages clean.

3 distinct issue(s):

  [http 403] /api/send {"data":{"query":"{ usersPermissionsUser (id:256) …
    → 22 pages, e.g. /lev, /me, /moach/82/main
```

That run is real: it is B3 from the QA report. It is also **fixed and deployed**
— the same four pages now come back `4/4 pages clean`, which is what the output
should look like. Anything that appears there is new.

This sweep only reads.

## Write flows

Each of these writes to the live database and requires `--yes`, so it cannot
happen by accident. Nothing is cleaned up afterwards — the app has no delete for
most of these objects yet (see `docs/PLAN_OBJECT_ARCHIVAL.md`).

### `solo-money` — the money loop

```bash
node scripts/smoke/flows/solo-money.mjs --yes
```

Walks a one-member rikma from nothing to a closed profit split — rikma → mission
→ take it → finish it → resource → approve it → product → sale → split —
asserting at each step. It is the regression path for the two blockers in
`docs/QA_SOLO_RIKMA_2026-08.md`: the GraphQL escaping bug in `applyToMission` (a
mission with a rich-text description used to 500) and the empty-`halukas`
rejection that made a solo split impossible.

When that report was written the flow scored 6/9 against production, failing
exactly the three assertions whose fixes had not yet shipped:

```
✗ 3. applied to my own mission (B2 — quoted description) — 500 INTERNAL_ERROR
✗ 8a. split proposal accepted with no transfers (B1) — 400 VALIDATION_FAILED
✗ 8b. split finalized immediately (solo rikma) — no approveHaluka call
```

Those fixes have since deployed, so it should now be 9/9. If it is not, the fix
did not take.

Leaves one throwaway rikma named `בדיקה אוטומטית <timestamp>` per run.

### `two-member` — the fixture every consent flow needs

```bash
node scripts/smoke/flows/two-member.mjs --yes      # build it (once)
node scripts/smoke/flows/two-member.mjs --yes --fresh
```

Slot 2 starts out belonging to no rikma at all, so every two-person feature
needs a rikma to exist in first — and standing one up is not a call, it is a
join: an open mission, an application from slot 2, and slot 1 approving it.
This flow does that once and caches the result in
`$TMPDIR/1lev1-smoke-pair.json`; `archive-object` and `stipend` read it.

A run whose join did not complete is **resumed**, not rebuilt — the rikma and
its missions already exist and nothing can delete the extra ones.

Two things it asserts that are easy to get wrong elsewhere: an application from
a non-member opens an `Ask` rather than assigning the mission, and the
membership is verified from *slot 2's own* `/moach`, never from the approving
side.

### `archive-object` — removal as a proposal

```bash
node scripts/smoke/flows/archive-object.mjs --yes
```

Walks `docs/PLAN_OBJECT_ARCHIVAL.md` end to end with two real members: a new
mission (which in a rikma of two is itself a vote), an archive proposal that
must come back as a Decision rather than a done deed, the card the other member
sees, a counter in `keep` mode, and the maturation that leaves the object
alive under its new terms. It also checks that the card offers approve · chat ·
counter and **no** reject — a reject button here would be the bug.

### `stipend` — who has to sign is derived

```bash
node scripts/smoke/flows/stipend.mjs --yes
```

The rule from `docs/PLAN_STIPEND.md`: while the rikma's total value does not
move the pledge is bilateral, and the moment it grows it needs a rikma-wide
programme with a closed budget. Step 4 is the one worth having — the same form,
one slider moved from "the recipient bears it" to "the rikma bears it", must
stop offering to send it to the other side alone and offer the programme
instead.

This is the flow that found the programme blocker: applying a matured
`stipendProgram` sent the *pledge's* field list to `StipendProgramInput`, so
Strapi rejected the whole mutation and a programme every member had approved
could never become active. Unit tests could not see it — they mock Strapi, and
a mock accepts any field.

### `signup` — the front door

```bash
node scripts/smoke/flows/signup.mjs --yes
node scripts/smoke/flows/signup.mjs --confirm '<link from the email>'
```

Walks `/hascama` → `/signup` → email confirmation → `/login` → onboarding → a
profile that produces match suggestions. This is the path every member walks
exactly once, which is why it rots unnoticed: nobody on the team signs up again.
`docs/QA_NEW_USER_WALKTHROUGH_2026-08.md` found nine defects along it, three of
them severe, and the flow asserts all nine — each step names the finding it
guards.

It runs in two phases, because confirming the address needs a mailbox this
harness cannot read. Phase one registers and stops at "check your mail", saving
the account to `$TMPDIR/1lev1-smoke-signup.json`; phase two takes the link from
that mail and carries the same account through to the lev screen. The address is
a `+tag` on the test account's own mailbox, so the mail arrives somewhere you can
read — `SMOKE_SIGNUP_EMAIL` overrides it for a provider without `+` addressing.

Phase one is worth running on its own even without the mail: its five steps
cover the consent screen, the registration itself, and the cookie and socket
state immediately after it, which is where three of the nine findings lived.

Leaves one account, which cannot be deleted, and one signature on the global
agreement, per run.

## Writing a new check

`lib.mjs` gives you the pieces:

```js
import { session, visit, text, controls, logApi, shot } from './lib.mjs';

const { page, issues, close } = await session();   // logged in, session cached
logApi(page);                                       // every /api/* POST + response
await visit(page, '/moach/82/sales');               // navigate, settle, dismiss guides
console.log(await text(page));                      // visible text, nav chrome stripped
console.log(await controls(page));                  // every clickable, with its label
await close();
```

`logApi` is the one that finds things. The UI is often silent about a failure
the payload states plainly.

## Notes from the field

Things that cost time to work out, so you don't have to:

- **The agent sandbox needs TLS 1.2.** The MITM proxy resets Chromium's TLS 1.3
  ClientHello and every navigation dies with `ERR_CONNECTION_RESET`. `lib.mjs`
  caps the handshake automatically when it sees the proxy; `SMOKE_TLS12=0`
  turns it off elsewhere.
- **The two main "add" controls are SVG, not buttons.** Add a mission is
  `g#button` in `hand.svelte`; request a resource is `#newbutton` in
  `handd.svelte`, and a real click can miss it — dispatch the event instead
  (`el.dispatchEvent(new MouseEvent('click', {bubbles:true}))`).
- **Never press Escape in a `svelte-multiselect`.** It clears the selection.
  That is why the sale form kept answering "שדה אצל מי הכסף נשאר ריק".
- **Descriptions are `contenteditable`, not textareas** — click, then
  `keyboard.type`.
- **Toasts disappear fast.** If you are checking for an error message, read the
  DOM within a second of the click, not ten.
- **`--verbose` first.** Dumping the text and the control list of an unfamiliar
  page is much faster than guessing selectors.
