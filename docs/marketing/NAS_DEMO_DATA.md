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

## 2. Rikma B — "3 weeks later" (made ahead)

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

Each account needs its own agent seat: two Claude accounts (two browser
profiles), each with the 1lev1 connector connected through OAuth as that person.
Reconnecting one Claude account between scenes would replace the key, so don't.

## 5. Production switches, before the dry run

- [ ] VPS API deploy (`deploy-api.ps1`) with the P0 + P1 code
- [x] apply tool on by default (`MCP_APPLY_ENABLED=false` only to turn it off)
- [ ] 1.0b deploy (`User.findableByAgents`), then `npm run types:update`
- [ ] Dan's switch on at `/me/settings/mcp`

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
