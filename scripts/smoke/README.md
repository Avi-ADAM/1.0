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
```

(`SMOKE_EMAIL` / `SMOKE_PASSWORD` work too.) Playwright is expected to be
installed globally in the agent image; if `node` cannot find it, run with
`NODE_PATH=/opt/node22/lib/node_modules`.

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
