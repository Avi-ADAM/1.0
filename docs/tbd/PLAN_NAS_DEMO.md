# PLAN_NAS_DEMO — the two-minute demo for Nas.com, and what must exist to film it

**Status:** planning. Written 2026-11-16, after the Nas Daily team answered the
outreach with "send the 2-minute demo and details on how the integration would
work; we will pass it to the relevant team".

Companion to [PLAN_MCP_PARTNER_INTEGRATION](../inprogress/PLAN_MCP_PARTNER_INTEGRATION.md),
which holds the audit and the P0 / P1 / P2 phases this file refers to. This file
is the **script** and the **checklist**; the engineering detail of each tool
lives there.

## 1. Who watches it

The reply came from the team, not from the founder, and it will be forwarded.
The video and the attachments must stand on their own for two readers who never
saw the first email:

- a **product person**, who decides whether the idea is interesting;
- an **engineer**, who checks whether it is real and will try to reproduce every
  call shown on screen.

## 2. The idea the demo has to land

A one-person business is always a little fragile. Big companies win because they
combine people. Independents can have the same strength without giving up their
independence, through mutual help and dynamic partnerships. Nas helps one person
start; an MCP connection to 1lev1 lets that person build like a company.

So the demo shows **two sides**: two solo creators, each with an agent, becoming
partners. Not a feature tour.

## 3. The script (about 2:20)

Written as if nothing is missing. Section 5 lists what must be true for each
scene, and section 6 says what to do when a scene's tool is not ready.

| Time | On screen | Voice-over | Tools |
|---|---|---|---|
| 0:00–0:12 | The founder, on camera | "A one-person business is fragile. Big companies win because they combine people. Watch two solo creators become partners through their agents." | |
| 0:12–0:35 | Maya, a course creator, tells her agent: "I need a video editor who'll work for a share." The agent returns three people with matching skills. | "Her agent finds real people by skill." | `findPartnersTool` |
| 0:35–0:55 | The agent proposes the partnership: roles, missions, what each side brings. Maya opens the link and confirms on an English screen. | "It drafts the partnership. She confirms with one click. The agent never signs for her." | `proposeRikmaBlueprintTool`, `createProjectTool` |
| 0:55–1:20 | Cut to Dan, the editor. He asks his agent "Anything that fits me?", sees Maya's mission and applies. | "On the other side, Dan's agent already matched him to it. He applies." | `listMyMatchesTool`, `applyToMissionTool` |
| 1:20–1:40 | Back to Maya: "What's waiting for me?" The agent says Dan applied to "Edit the course videos", 20 hours at 100, and gives the link. She opens it and signs. | "No bosses, no vetoes. She approves, asks, or counters, and nothing binds her until she does." | `getMyUpdatesTool` (Dan's candidacy is an Ask, not a Decision; Dan's side: `listMyApplicationsTool`) |
| 1:40–2:05 | Title card "3 weeks later". Dan asks "What's my stake?" and gets percentages from hours and resources. Then the first sale and its split. Maya asks "What's waiting for me?": Dan proposed a new mission, "Cut the course trailer", and silence approves it in 48 hours. | "Every hour becomes ownership. The first sale splits by it, automatically and transparently. And between partners, silence is consent, on a clock they set." | `getMyStakeTool`, `getRikmaLedgerTool`, `getMyUpdatesTool` (Rikma B) |
| 2:05–2:20 | Closing slide: Nas agent ↔ MCP ↔ 1lev1, and `1lev1.com/mcp` | "Nas helps one person start. Together we let them build like a company. The server is live, your team can try it today." | |

Two optional additions that raise the picture, if they are ready:

- **Dan writes in Hebrew or Arabic and Maya reads English.** For a global
  audience this shows a partnership crossing languages. One second on screen,
  one sentence of voice-over. Needs T3 translation on the surfaces shown.
- **A consent screen that lists permissions** ("this agent can read your
  partnerships and propose on your behalf; it can never sign"). It answers the
  trust question before anyone asks it.

## 4. Filming rules

- Screen recording with the founder's own voice. No music-and-captions-only cut.
- Cut the agent's waiting time. Never fake a result.
- Never show a call that did not really run: the engineer will try to repeat it.
- The agent client is Claude with the 1lev1 connector (the OAuth redirect list
  allows it today). The voice-over says that the Nas agent sits in this seat.
- Clean browser profile, English interface language, English demo content.

## 5. TODO

It is not known here exactly what the P0 build contains, so P0 items are
"verify in production", not "build".

### 5.1 Blocks the demo — P0, verify it is live

- [ ] OAuth consent screen renders in English (`/mcp-connect` through `$t()`) — built (P0.2), verify after deploy
- [ ] `getMyUpdatesTool` returns pending votes, with no `unavailable: ["rikmaVotes"]`
- [ ] Action messages come back in English for an English account (`lang` set on the MCP context) — built (P0.4), verify after deploy
- [ ] `listMyMatchesTool`, `searchRikmasTool`, `getMyStakeTool` answer against production — built (P0.5–P0.7), verify after deploy
- [ ] `MCP_OAUTH_ENABLED` is on in production

### 5.2 Blocks the demo — P1, build before filming

- [x] `findPartnersTool` — built: counts everyone who matches, names only those who switched it on. For Maya's scene to show names, the demo accounts switch it on at `/me/settings/mcp` (**needs the 1.0b deploy**, `User.findableByAgents`). Without it she hears "3 people match, publish a mission", which also fits the script
- [x] `applyToMissionTool` and `listMyApplicationsTool` (candidacy is the person's own statement; the agent never approves it) — built; on by default (`MCP_APPLY_ENABLED=false` turns it off)
- [x] `getDecisionTool`, with the restime clock and the "silence approves in…" sentence — built (deadline + `silenceApproves`; the agent says the sentence)
- [x] `getRikmaLedgerTool`, effective sales and splits only (never a sale whose holder claim is still open) — built

P1 status (2026-11-16): built and unit-tested, uncommitted, not yet run on live
Strapi. Details under "Built" in P1 of the companion plan.

### 5.3 Raises the demo — P2, build if time allows

- [ ] OAuth scopes shown on the consent screen
- [ ] Partner client registry that **extends** the redirect allowlist instead of replacing it, so a Nas redirect URI is not refused at registration
- [ ] Sandbox key scoped to the demo rikma, to hand to their engineer
- [ ] "Build on 1lev1" section on `/mcp`, using the calls from this script as the worked example
- [ ] Member text shown in the reader's language on the surfaces in the video (only if the language scene is filmed)

### 5.4 Not for the demo — one roadmap line in the technical note

- Expiring access tokens with refresh
- Delegated onboarding by signed partner assertion (a Nas user without a separate signup)
- Member-visible audit of agent actions, shared rate limits

### 5.5 Demo data

Values, order and dry-run table: [NAS_DEMO_DATA](../marketing/NAS_DEMO_DATA.md).
In short: the rikma Dan matches into stays **visible** (`listMyMatchesTool` skips
hidden rikmas); the mission uses a new skill only Dan holds, so publishing it mails
no real members.

- [ ] Two English accounts, Maya and Dan, each with a connected agent (accounts and profiles done 2026-11-16; agents not yet connected)
- [x] Dan's skills match Maya's mission, so the match appears on his side (seen in his heart on rikma 103)
- [x] A second rikma for "3 weeks later": approved hours, one effective sale, one split (rikma 103)
- [x] A short, round restime on the demo rikma, so the clock sentence reads well (48 h)
- [x] Demo rikmas hidden from public discovery, or clearly marked as a demo (103 in `hiddenProjects.ts`, takes effect on deploy)
- [ ] One dry run of every call in the script, in order, the day of filming

## 6. Fallback per scene

A scene whose tool is not ready is filmed **on the site instead of in the chat**,
with the same voice-over. The site already shows applying to a mission, the
decision with its clock, and ownership percentages. This is honest, and it also
shows the principle: the agent prepares, a person confirms.

## 7. What to send with the video

1. **A link to the video** (unlisted), not a file attachment.
2. **One page, PDF, for the product person:** the problem and the vision in three
   sentences; one diagram (Nas user → Nas agent → MCP → 1lev1); three use cases
   (find a partner, form a partnership, track contributions and ownership); what
   each side gains; a proposed first step, a small pilot with a group of creators.
3. **A technical paragraph in the email body, for the engineer:** the server
   address and `1lev1.com/mcp`; how to authenticate; what works today and what is
   next, in one honest sentence.
4. **An offer of a 20-minute call**, and the sandbox key if 5.3 delivered it.

Not to send: an investor deck, a long document, or the internal plans.

## 8. Timing

Answer within three to five days of their reply (received 2026-11-16). A complete
demo a few days later beats a partial one today, but not by weeks.
