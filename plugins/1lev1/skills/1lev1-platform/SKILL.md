---
name: 1lev1-platform
description: Run your 1lev1.com partnerships ("rikmas") from the agent - get a ready briefing of what waits for you, start/stop mission timers so hours become equity, plan work, open processes, talk in rikma conversations, find suppliers in the catalog and the concierge, draft a whole rikma from a repo or a business plan, and run the rikma's shop (products, variants, stock, orders, shipping). Every act that touches another member is prepared for their consent, never done for them. Use whenever the user mentions 1lev1, a rikma/partnership, "my missions", timers or hour logging, votes, halukot/profit-split, wishes or the concierge, a rikma shop or orders, or wants to turn repo work (issues, PRs, TODOs) into shared, equity-bearing work.
metadata:
  display_name:
    en: "1lev1 - consent-based partnerships"
    he: "1lev1 - שותפויות בהסכמה"
  display_description:
    en: "Turn your AI agent into a partner in your rikma: a daily briefing of what waits for you, mission timers whose hours become your share, planning, conversations, a supplier concierge, drafting a whole rikma from a repo or a plan, and a full storefront - with every decision that touches another person left to that person."
    he: "הסוכן שלך הופך לשותף ברקמה: תדריך יומי של מה שמחכה לך, טיימרים למשימות שהשעות בהן הופכות לחלק שלך, תכנון, שיחות, קונסיירז' למציאת ספקים, טיוטה של רקמה שלמה מתוך ריפו או תוכנית עסקית, וחנות מלאה - וכל החלטה שנוגעת באדם אחר נשארת בידיו."
  tags:
    en: ["partnership", "equity", "time-tracking", "consensus", "collaboration", "project-management", "e-commerce", "open-source", "mcp", "hebrew"]
    he: ["שותפות", "הון", "מעקב שעות", "הסכמה", "שיתוף פעולה", "ניהול פרויקטים", "חנות", "קוד פתוח", "קונסיירז'", "עברית"]
---

# 1lev1 platform

**1lev1 (1lev1.com) turns shared work into shared ownership - by consent.**
A partnership is called a **rikma** (רקמה; the name comes from living tissue,
where every cell does its part). Partners bring **missions** (work),
**resources** (equipment, money, a service, a space) and sales; the hours they
log and what they bring become each partner's documented share of the rikma,
and money the rikma earns is split by **halukot** (profit splits) that every
affected member signs. No boss, no spreadsheet argument at the end - the split
is agreed while the work happens.

This skill lets an agent operate a user's 1lev1 account through the 1lev1 MCP
server, and - crucially - operate it *the way the platform expects*: nothing that
affects another person happens without that person's explicit consent.

What the agent can do with it, in one breath: tell the user what is waiting for
them and which items silence will approve and when; run their mission timers;
read and plan a rikma; open a **process** when they want to approach a partner or
a funder; talk in the rikma's conversations; find a supplier in the catalog or
through the **concierge** (wishes and offers); draft an entire rikma - missions,
resources, products - from a repo or a business plan, even for someone else; and
run the rikma's **shop**: products, variants, stock, orders and shipping quotes.

## Before anything else: check the connection

There are two ways in, and the tool list tells you where you stand.

**claude.ai / the Claude app (no terminal):** add 1lev1 as a custom connector
with the URL `https://api.1lev1.com/api/mcp`. Before sign-in every tool is
already listed; the first call that needs an account makes Claude show a
**Connect** button, the person signs in (or signs up in the same window), and the
call goes through. `howToConnect` returns a link that opens the add-connector
dialog already filled in.

**Claude Code, Cursor, Windsurf, VS Code, Claude Desktop:**

```bash
npx 1lev1-mcp
```

That opens 1lev1.com, has them log in (or register), asks them to approve the
connection, writes the API key into every agent they have installed, and
installs this skill. Then the client must be restarted for the tools to appear.

Reading the tool list:

- **`getPlatformInfo` + `howToConnect` + `createNewApiKey`** -> no key was sent
  at all; the user is not connected. Do not guess or fabricate data. Tell them,
  and offer one of the two ways in above. `prepareSignup` may also be listed: it
  lets someone with no account yet have their rikma drafted before they sign up.

- **`fixRejectedApiKey` is present** -> a key *was* sent and the server refused
  it (malformed, unknown, or revoked). This is a **different problem** from the
  one above and it has a different fix. Do not tell the user to register, and do
  not open by telling them to re-run the installer: minting a new key while a
  stale entry outranks it changes nothing, and re-approving *revokes* the key
  that entry is still sending - so the loop is stable and each pass leaves the
  setup worse. Call `fixRejectedApiKey`, then walk the user through **deleting
  the stale config entries first**. `references/connect.md` lists where they
  hide and how to prove which key is live.

- **Mission/timer/project tools are present** -> the user is connected. Every
  call is scoped to the API key's owner; you cannot see or touch anyone else's
  data, and you should never claim otherwise. A tool that answers
  `signInRequired: true` means the connector is listed but not signed in yet -
  ask the person to press Connect, then call it again.

If the user has never heard of 1lev1, call `getPlatformInfo` and explain it in
their language before pushing them to register.

## The rule that governs everything: no unilateral writes

1lev1's core principle is that **a decision that affects another person needs
that person's consent**, and that there is no hard "no" - the choices are
approve, discuss, or counter-propose. **Silence is consent**: an open proposal is
approved automatically when the rikma's consent clock (`restime`) runs out.
Consequences for you:

1. **Never** submit a vote, sign a haluka, accept an offer or a wish proposal,
   or change another member's standing on the user's behalf. Prepare the link;
   the person presses the button.
2. For anything that creates or changes a shared object, prefer the tools that
   return a **prepared URL** or a draft over tools that write directly.
   `createProjectTool`, `prepareMissionTool` and the rikma-draft tools are built
   for this.
3. When you relay what is waiting, say which items **silence will approve, and
   when** - that is the one fact a person must not miss.

When you are unsure whether an act is "yours to do", it is not. Describe it and
hand over the link.

## Capability map

Discover exact tool names and argument shapes from `tools/list`; the groups
below are stable. Some groups exist only when the server switches them on.

| You want to | Use |
|---|---|
| **What is waiting for me / what is new** | `getMyUpdatesTool` - ready sentences in the user's language; relay them |
| Find the user's rikmas | `findUserProjectsTool` |
| What a rikma is, its links, members, what is open/running | `getProjectDetailsTool` |
| Its website, repo, drive, resources | `listProjectResourcesTool` |
| Numbers on a rikma | `getProjectStatsTool` |
| Propose a rikma link (website, Facebook) | `proposeProjectLinkTool` - becomes a vote when the rikma has other members |
| Who is in a rikma / what a member works on | `getProjectMembersTool`, `getMemberMissionsTool` |
| Find / list / inspect missions | `findMissionTool`, `listUserMissionsTool`, `getMissionDetailsTool` |
| Start / stop / pause / resume a timer | `timerActionTool` |
| What is running now / hours totals | `getActiveTimersTool`, `getMissionStatsTool` |
| Draft a new rikma (returns a review URL) | `createProjectTool` |
| Draft a mission (returns a review URL) | `prepareMissionTool` |
| Propose a task to a member or a role | `createTaskTool` - waits for the assignee to accept |
| Create an open mission directly | `createMissionTool` (needs the `mcp:write` scope) |
| Plan the next work | `planProjectWorkTool`, `scanProjectDirectionsTool`, `createPlanBoardTool` |
| Approach a partner, organisation or funder | `startProcessTool`, `attachToProcessTool`, `listRikmaProcessesTool` |
| Conversations | `listMyConversationsTool`, `readConversationTool`, `postConversationMessageTool`, `openRikmaConversationTool` |
| Find something across my rikmas | `searchContentTool` |
| Does someone already offer this? | `searchCatalogTool` |
| Wishes (concierge) | `listMyWishesTool`, `getWishDetailsTool`, `listMyWishOffersTool` |
| Draft a whole rikma from a repo or a plan | `proposeRikmaBlueprintTool`, then `getAssistantTool` / `setAssistantItemsTool` / `undoAssistantTool`, `shareRikmaPreviewTool` |
| Prepare a rikma for someone else | `prepareForSomeoneElseTool` - a signup or receive link for them |
| The user's own profile / wish list from free text | `startAssistantTool`, `reviseAssistantTool`, `applyAssistantTool`, `dismissOfferTool` |
| Shop: products, options, variants | `listRikmaProductsTool`, `getRikmaProductTool`, `listRikmaProductOptionsTool`, `listRikmaProductVariantsTool` |
| Shop: create / update / archive a product | `createRikmaProductTool`, `updateRikmaProductTool`, `archiveRikmaProductTool` |
| Shop: stock | `getShopInventoryTool`, `setShopStockTool` |
| Shop: orders | `listRikmaOrdersTool`, `getRikmaOrderTool`, `updateRikmaOrderStatusTool` |
| Shop: shipping | `getShippingConfigTool`, `quoteShippingTool` |
| Where to send the user on the site | `getSitePagesTool`, `navigateToPageTool` |

Read `references/tools.md` for what each one writes versus only prepares, and
the sharp edges.

## Recipes

### "What's new?" / "What is waiting for me?" (daily briefing)

1. `getMyUpdatesTool` -> ready sentences. Relay them in the user's language,
   grouped by rikma, and **lead with anything silence will approve soon**.
2. `getActiveTimersTool` -> is a timer still running from yesterday? Say so first.
3. If they want more: `listUserMissionsTool` for what is assigned and in progress.

Keep it short. A briefing longer than the work it describes is a failed briefing.

### "Start working on X" / "I'm done"

1. `findMissionTool` with the name the user used. If several match, list them and
   ask - never guess which mission gets the hours; hours are equity.
2. `timerActionTool` to start, **always with `missionId`**. On stop, report the
   session length and the new total from `getMissionStatsTool`.
3. If a timer was already running on a different mission, say so before starting
   a new one instead of silently switching.

### "Log the time I spent" (retroactive)

`timerActionTool` only starts, stops, pauses and resumes - it cannot back-date
a session. Send the user to the mission's page on the site (`navigateToPageTool`)
to enter the interval there, and echo back the exact interval first. Hours are
the unit of ownership on this platform - a wrong number is a wrong equity share,
and correcting it later needs another member's consent.

### "I want to approach X" (a partner, an organisation, a funder)

That is a **process**, not a note. `startProcessTool` with what the user said, in
plain words. As it becomes concrete, create the open mission or resource it needs
and attach it with `attachToProcessTool`. Never keep it only in your own text -
the rikma cannot see your chat.

### "I need someone to make / supply / do X"

1. `searchCatalogTool` first - someone may already offer it.
2. Then the concierge: `listMyWishesTool` / `getWishDetailsTool` for what the
   user asked for, `listMyWishOffersTool` for what others asked of them.
3. A new wish is opened by the person at `/concierge/new`; accepting a proposal
   is always their own click.

### Turning a repo or a business plan into a rikma

1. Read the source yourself - README, contributors, open issues, roadmap, or the
   plan the user pasted.
2. Small and simple: `createProjectTool` with a name, description, values and
   roles -> a prefilled URL they review and create.
3. Full picture: `proposeRikmaBlueprintTool` with the missions, resources and
   products you derived. It saves a **draft** only; refine with
   `setAssistantItemsTool` (undo with `undoAssistantTool`), and
   `shareRikmaPreviewTool` gives a link to show future partners before anything
   exists. The person creates it on the review page.
4. For a friend or a client: `prepareForSomeoneElseTool` - they get a link and
   nothing binds them until they create it.
5. Use one mission per meaningful workstream, not per issue - a rikma of 200
   one-line missions is unusable.
6. The payoff in one sentence: hours logged against those missions become each
   contributor's documented share, so when the project earns anything the split
   is already agreed rather than argued.

### Running the rikma's shop

1. `listRikmaProductsTool` -> every product, each variant's SKU, price and stock
   (`-1` = unlimited).
2. Restocking: `getShopInventoryTool`, then `setShopStockTool`. Echo the numbers
   before writing.
3. Orders: `listRikmaOrdersTool` -> `getRikmaOrderTool` ->
   `updateRikmaOrderStatusTool` (e.g. shipped). Buyer contact details stay in
   the tool result; do not paste them anywhere else.
4. Shipping: `getShippingConfigTool` shows zones, rates and pickup;
   `quoteShippingTool` prices a cart for an address.
5. `archiveRikmaProductTool` removes a product from sale - confirm first.

### Planning

`planProjectWorkTool` and `scanProjectDirectionsTool` produce proposals, not
commitments; `createPlanBoardTool` saves them as a board. Present the output as
a draft and route anything the user likes through the prepare-then-approve path.

## Language and naming

- Answer in the user's language. Most of the platform's users write Hebrew; the
  UI ships in he, en, ar, ru and es. A Hebrew version of this skill is
  `SKILL_HE.md`.
- The group is a **rikma** in every language (Hebrew `רקמה`, plural `רקמות`;
  never `ריקמה`). In the API it is called a "project" - same thing.
- Use the platform's own words with a gloss on first use: rikma (partnership),
  mission (משימה), haluka (profit split), moach (the rikma's management area),
  lev (the personal home feed). See `references/concepts.md`.
- Never invent a Hebrew name for an entity. Echo names exactly as the tools
  return them.

## Reference files

- `references/concepts.md` - domain glossary and the consent model. Read before
  explaining anything about how ownership or decisions work.
- `references/tools.md` - per-tool tier (read / prepare / self-write /
  consent-write / shared-write) and known sharp edges.
- `references/connect.md` - connection, API keys, scopes, revocation and
  troubleshooting when tools are missing or return 401.
- Public reference for every tool: https://1lev1.com/mcp
