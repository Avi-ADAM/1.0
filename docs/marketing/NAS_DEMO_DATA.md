# Nas demo — the data, and the order to make it in

Runbook for §5.5 of [PLAN_NAS_DEMO](../tbd/PLAN_NAS_DEMO.md). All of this is real
data on production, made through the real flows. Nothing is seeded behind the API,
so every call in the video reads what a real member would see.

## 0. Before anything is created

Three facts about the code decide most of this:

- **Rikma A, the one Dan matches into, must NOT be hidden.** `listMyMatchesTool`
  drops rikmas in `hiddenProjects.ts`, so if Rikma A were hidden, Dan's scene would
  come back empty. Mark it as a demo in its name and description instead.
- **Matching works by catalogue id, not by text.** Dan's skill and the mission's
  skill have to be the *same* catalogue entry.
- **Publishing a mission emails everyone who holds its skill.** With a common
  skill like "Video editing", real members would get a "new suggestion" mail for
  a demo mission. So the demo uses a **new** skill that only Dan holds:
  **`Course video editing`**. `findPartnersTool` with the query "video editing"
  still finds Dan (substring match), and real holders of "Video editing" only add
  to the anonymous count.

The shortest restime is `feh` = 48 hours, and that is the number the voice-over
says ("silence approves it in 48 hours").

## 1. Accounts (you: signup and passwords)

| | Maya | Dan |
|---|---|---|
| Username | `Maya` (else `Maya R.`) | `Dan` (else `Dan K.`) |
| Email | a plus-address of your own mailbox | another plus-address |
| Language (settings) | English | English |
| Skills | `Online courses` | **`Course video editing`** (new), `Video editing` |
| Roles | `Course creator` | `Video editor` |
| Ways of working | Remote | Remote |
| Bio, one line | "I teach calm coding to beginners." | "I edit course videos." |
| `/me/settings/mcp` → "Show my name to agents" | off | **on** (after the 1.0b deploy) |

Dan's profile is filled in **before** Maya publishes her mission. The match is
computed when the mission is published.

**Done 2026-11-16** (through localhost:5173 → production Strapi). Differences from
the table above:

- The catalogue has no English "Video editing" (only Hebrew `עריכת וידאו`), so Dan
  holds just `Course video editing`. The "video editing" query still finds him.
- `Online courses`, `Course creator` and `Video editor` did not exist either and
  were created. Ways of working: `from home`; location: online.
- Dan's "Show my name to agents" switch waits for the 1.0b deploy.

## 2. Rikma B — "3 weeks later" (made ahead)

**Built 2026-11-16: rikma id `103`**, already in `hiddenProjects.ts` (takes effect
with the next deploy). Maya 60% (₪3,000), Dan 40% (₪2,000). Product
`Calm Coding Course` (id 88, ₪1,000, unlimited), one sale held by Maya, split
signed by both, transfer Maya → Dan ₪400 not confirmed. Amounts are in ₪ because
Maya's account currency is ILS. If the video should read $, the dry-run copy of
Rikma A can be made in USD, but Rikma B stays in ₪.

How it went, for the next time:
- Hours are logged with **Edit Timer → Log hours manually**. One interval is at
  most 24 h, so Maya's 30 h are two intervals of 15 h. **Save Timer** sends the
  hours to the other partner as a "Completion approval", and that signature is
  what counts toward the shares. Completing the mission itself is not needed.
- A sale needs a product, so the product is created first (fixed price).
- The join request stays in Maya's heart after she signs it until the cache
  refreshes. The rikma page already shows 2 members.

The original plan:

Name `Demo · Calm Coding Course`. The description starts with "Demo rikma for a
partner video." Restime `feh`. **Hidden**: its id goes into
`src/lib/server/discovery/hiddenProjects.ts`.

1. Maya creates it and publishes one mission for herself, "Write the course",
   30 h × 100.
2. Maya publishes "Edit the course videos": skill `Course video editing`,
   20 h × 100.
3. Dan applies to it. Maya signs, so Dan is a member.
4. Each one finishes their mission with the hours above, and the other signs the
   finish approval. Expected shares: Maya 60%, Dan 40%.
5. Maya reports one sale: "Course launch", 1,000. She marks the money as with her
   (`holderStatus: self`, so it counts at once).
6. Maya proposes the split, and both sign it. Leave the transfer **unconfirmed**,
   so the ledger shows "Maya → Dan 400" as an open transfer on screen.

Check with the tools as Dan:
- `getMyStakeTool` → 40%;
- `getRikmaLedgerTool` → income 1,000 and the open transfer.

Step 4 needs no 30 hours on a timer. `completeMission` takes `hoursdon`, the hours
stated with the finish, and the other partner's signature is what makes them
approved hours.

## 3. Rikma A — born on camera

Not made ahead: the video shows it being created, in scenes 0:35–0:55. Only the
**dry run** makes one first:

- name `Demo · Maya's Course Studio`, with the same demo line in the description;
- restime `feh`;
- one open mission "Edit the course videos" (`Course video editing`,
  20 h × 100);
- **not hidden** (see §0).

After filming, archive both Rikma A copies (the dry run's and the filmed one)
through the rikma's own flow, never by deleting.

## 4. The agents

One Claude account is enough: the same server is added **twice, under two
names**, and each connection signs in through OAuth as a different person. Each
connection holds its own key, so they do not replace each other.

- **Claude Code** (done 2026-11-16): `1lev1-maya` and `1lev1-dan` in
  `~/.claude.json`, both `https://api.1lev1.com/api/mcp` with no header. Before
  sign-in they work anonymously, and the first account tool asks to sign in
  (`/mcp` → Authenticate).
- **claude.ai** (the client the video films): Settings → Connectors → Add custom
  connector, twice: "1lev1 Maya" and "1lev1 Dan", same URL.

**The OAuth page signs in whoever is logged in to 1lev1.com in that browser.** So
connect Maya in a private window where only Maya is logged in, then Dan in
another, or log out between the two. Otherwise both connections end up as your
own account.

For filming, each scene runs in its own chat with **only that person's
connector switched on**. Then the agent on screen really is Maya's or Dan's.

**Two colour themes.** Maya is filmed on **personal** and Dan on **business**, so
the two sides look different on screen. The theme is a cookie per site, so open
`?theme=personal` once in Maya's browser profile and `?theme=business` in Dan's.
On the localhost tabs this is already set.

## 5. Production switches, before the dry run

- [x] VPS API deploy (`deploy-api.ps1`) with the P0 + P1 code (2026-11-16: `tools/list` on production lists all five P1 tools)
- [x] apply tool on by default (`MCP_APPLY_ENABLED=false` only to turn it off)
- [x] 1.0b deploy (`User.findableByAgents`) (2026-11-16: the switch loads and saves)
- [ ] `npm run types:update` after the 1.0b deploy
- [x] Dan's switch on at `/me/settings/mcp` (2026-11-16, persisted)
- [ ] Rikma 103 hidden on production: needs the Vercel and API deploys of `hiddenProjects.ts`

## 6. Dry run, in the script's order

| Who | Call | Expect |
|---|---|---|
| Maya | `findPartnersTool` "video editing" | Dan named, plus an anonymous count |
| Maya | `proposeRikmaBlueprintTool` → `createProjectTool` | a link; she creates Rikma A |
| Dan | `listMyMatchesTool` | Rikma A's mission, matched on `Course video editing` |
| Dan | `applyToMissionTool` | `status: applied` |
| Maya | `getMyUpdatesTool` | Dan's application, silence in 48 h, and **no** `unavailable` |
| Maya | the ask's vote page (link from `getMyUpdatesTool`) | the clock; she signs on the page |
| Dan | `listMyApplicationsTool` | signed, or approved |
| Dan | `getMyStakeTool` (Rikma B) | 40% |
| Dan | `getRikmaLedgerTool` (Rikma B) | 1,000 sold, Maya → Dan 400 |

**Note:** Dan's application is an Ask, not a Decision, so `getDecisionTool`
cannot read it. Maya hears about it through `getMyUpdatesTool` (sentence,
deadline, `silenceApproves`) and Dan through `listMyApplicationsTool`. Scene
1:20's "Tools" column in the plan should say that. `getDecisionTool` belongs to
rikma-wide votes, e.g. a restime change.

**Note:** P0.3 (missing `rikmaVotes`) is still open. If Maya's
`getMyUpdatesTool` comes back with `unavailable`, film that scene on the site
(§6 of the plan).

## Dry run 2026-11-16

Claude Code, connections `1lev1-maya` (user 271) and `1lev1-dan` (user 270),
both signed in through OAuth. Both `findUserProjectsTool` calls returned rikma
103. Rikma A was created by the user as Maya on
`maya.localhost:5173/moach/import/17` (the local app writes to production
Strapi): **rikma 104**, open mission **301**. Dan's application is **Ask 182**.
Nobody signed or voted anything for anyone.

| # | Who | Call | Expected | Got | |
|---|---|---|---|---|---|
| 1 | Maya | `findPartnersTool` "video editing" | Dan named + anonymous count | **timed out**, twice; also "designer" (Maya) and "Online courses" (Dan) | ❌ |
| 2 | Maya | `proposeRikmaBlueprintTool` | a link | session 17, `reviewUrl` `https://www.1lev1.com/moach/import/17`, 1 open mission row (20 h × 100, `Course video editing`, Video editor), `restime: feh` | ✅ |
| 2b | Maya | `createProjectTool` | a link | `status: prepared` with a `/me?action=createproject&draft=…` link: a **bare** rikma with no mission. Not opened: the blueprint link already creates rikma + mission, so this one would make a second Rikma A | ⚠️ |
| 3 | Dan | `listMyMatchesTool` | Rikma A's mission | mission 301 "Edit the course videos", rikma 104, 20 h × 100, matched on `Course video editing` + Video editor, score 3 | ✅ |
| 4 | Dan | `applyToMissionTool` (after the user's yes) | `status: applied` | `status: applied`, `applicationId: 182`, url `/moach/104/votes/ask/182`; Maya got the email | ✅ |
| 5 | Maya | `getMyUpdatesTool` | Dan's application, silence in 48 h, no `unavailable` | `unavailable: []` but **`waiting: []`**, also with `projectId: 104`. `whatsNew` with `projectId: 104` still counts rikma 103's product and sale | ❌ |
| 6 | Maya | ask vote page | the clock; she signs | not run (signing is Maya's own click) | — |
| 7 | Dan | `listMyApplicationsTool` | Ask 182 waiting | `success: false` "Could not read your applications", twice | ❌ |
| 8 | Dan | `getMyStakeTool` 103 | 40% | 40% (₪2,000 of ₪5,000; Maya 60%, ₪3,000), with each one's finished mission | ✅ |
| 9 | Dan | `getRikmaLedgerTool` 103 | ₪1,000 sold, Maya → Dan ₪400 open | income 1,000 held by Maya, `split: true`, but **`openSplits: []`**: no ₪400 transfer. Sale shows `product: null` | ❌ |

### Fix before filming

1. **`findPartnersTool` times out** (`partnerTools.ts`, qids `mcpFindPartners` /
   `mcpCountPartners`). Both queries scan every user with four OR'd joins
   (skills, skill localizations, roles, role localizations) and `containsi`.
   Look the skill/role ids up first (small tables), then query users by
   `skills.id in […]`; or drop the localization branches.
2. **`getMyUpdatesTool` never shows a mission candidacy.**
   `processHubSummary` (`src/lib/digest/hubSummary.ts`) handles pendms,
   finiapruvals, askms, maaps, decisions, tosplits and sheirutpends, but not
   **`asks`**, so Ask 182 is missing from Maya's `waiting`. Add the asks loop (and
   the `asks` selection in `347digestHubSummaryFor` / `85levHubSummary` if it is
   missing), with a sentence template and the `/moach/<pid>/votes/ask/<id>` link.
   Also scope `whatsNew` to `projectId`.
3. **`listMyApplicationsTool` → Strapi `Forbidden access`** on
   `mcpMyApplications` (VPS log 16:15:16). The API token is missing a `find`
   grant on one of the types the query touches (`ask`, `askm`,
   `negopendmission`, `nego-mash`, `timegrama`, …). Check each in the Strapi
   admin, then rerun.
4. **`getRikmaLedgerTool` loses an unconfirmed transfer.** `getProjectFinancials`
   reads only `tosplits(filters: { finished: { eq: false } })`. Once both sign,
   the split is finished, so the ₪400 haluka (`confirmed: false`) disappears.
   The ledger needs a "transfers not yet confirmed" list: halukas with
   `confirmed: false`, whatever the split's state.
5. Smaller: the Rikma B sale shows `product: null` (the sale isn't linked to
   product 88 through `matanot`); `460noticeSubject` → `Forbidden` when the ask
   notification was built (the email went out with the default template);
   `noticeDismissals` / `noticePrefs` → `Forbidden` on the service path inside
   `getMyUpdatesTool`, swallowed without an `unavailable`.

### Fixed in code (2026-11-16, uncommitted, needs `deploy-api.ps1` + Vercel)

1. **`findPartnersTool`**: two steps. `mcpPartnerTerms` finds the matching
   skills and roles (`locale: "all"`, including their localizations), then
   `mcpFindPartners` / `mcpCountPartners` look up users by `id in […]`. If
   nothing matches, there's no users query at all.
2. **`getMyUpdatesTool`**: new qid `461hubAsks` / its twin `462hubAsksFor` →
   `hubAskNotices` (`src/lib/notices/hub.ts`), worded by
   `subjectNoticeFrom('ask')` (who, mission, hours, rate, silence deadline),
   with a link to `/moach/<pid>/votes/ask/<id>`. It's a separate read: if it
   fails, the rest still loads and `unavailable` contains `missionApplications`.
3. **`getRikmaLedgerTool`**: new `transfersToConfirm` (qid
   `mcpUnconfirmedTransfers`: signed splits with a haluka where
   `confirmed: false`). If the read fails → `unavailable: ['transfersToConfirm']`.
4. **`product: null`**: `Sale.matanot` is a single relation, and `saleSource`
   read it as a list. The test used the same wrong shape.
5. **notice preferences**: `loadNoticePrefsChecked`; a failed read now shows up
   as `unavailable: ['hiddenNotices']` instead of being swallowed.

### Left for you: grants in Strapi admin (not code)

Settings → API Tokens → the sveltekit-api token → tick `find` + `findOne`:

- **Ask** — `listMyApplicationsTool`, `getMyUpdatesTool` (`462hubAsksFor`) and
  the `460noticeSubject` sentence for an ask. In two weeks of logs only the
  ask reads got Forbidden; `pendms.negopendmissions` works on the same token,
  so `Negopendmission` is probably already ticked — check anyway.
- **Notice-dismissal**, **Notice-pref** — `430myNoticePrefsFor`.

After ticking: `listMyApplicationsTool` as Dan, and `getMyUpdatesTool` as Maya,
with no `missionApplications` / `hiddenNotices` in `unavailable`.

**Update 2026-11-16, after the grants:** Ask was already ticked; one of the
other grants that were opened was the missing one. `listMyApplicationsTool` as
Dan now returns Ask 182 (20 h × 100, `waitingFor: ["Maya"]`), but with
**`deadline: null`, `silenceApproves: false`**. That's by design
(`applyToMission.ts:305`): an external candidate's clock starts only when a
member first responds, so nobody gets approved by silence they never saw. For
the script: "silence approves it in 48 hours" is **not** true of Dan's
application to Rikma A. Either drop the line from scene 1:05, or say "once Maya
responds, the clock is 48 hours".
`getMyUpdatesTool` will show the ask only after the deploy (the code above).

### For the script

- §6: list only `proposeRikmaBlueprintTool`; its `reviewUrl` creates the rikma
  and its mission. `createProjectTool` makes a bare rikma.
- The tools return `www.1lev1.com` links. On the localhost tabs, change the
  host by hand (`maya.localhost:5173/moach/import/<id>`,
  `/availableMission/<id>`).
- To archive after filming: rikma **104** (the dry run's copy) and the filmed
  copy.
