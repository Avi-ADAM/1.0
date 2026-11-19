# 1lev1 MCP tools

Names below are the tool names the server exposes. Always confirm against
`tools/list` - the set depends on the key's scopes, and a few groups exist only
when the server switches them on. Every tool's description ends with a link to
its entry in the public reference, https://1lev1.com/mcp.

Each tool has a **tier** by blast radius, and the MCP annotations follow it
(`readOnlyHint` is true only for read and pure-prepare tools):

| Tier | Means |
|---|---|
| read | Queries. |
| prepare | Returns a prefilled URL, a draft or a proposal. Binds nobody. |
| selfWrite | Changes only the caller's own records (timers, own drafts) or the rikma's shop. |
| consentWrite | Lands something on another member that still waits for them. |
| communicate | Visible to others under the caller's name; binds nobody. |
| sharedWrite | Creates obligations for other people. Needs the `mcp:write` scope. |

## Public (no account needed)

| Tool | Notes |
|---|---|
| `getPlatformInfo` | What 1lev1 is. |
| `howToConnect` | Connect steps, plus a one-click claude.ai connector link. |
| `prepareSignup` | Lets someone with no account have their rikma drafted before they sign up. |
| `createNewApiKey` | The exact command and URL to mint a key. |
| `fixRejectedApiKey` | Only when a key was sent and refused. Names the reason and the repair. |

## Read

| Tool | Input | Notes |
|---|---|---|
| `getMyUpdatesTool` | `projectId?`, `lang?`, `limit?` | **Start here for "what's new".** Ready sentences in the user's language, including which items silence will approve and when. Relay, don't rewrite. |
| `findUserProjectsTool` | `query?` | `{ id, idPr, name }[]`. `id` is the internal id; `idPr` is what site URLs use. Omit `userId` - it defaults to the key's owner, and naming anyone else is refused. |
| `getProjectDetailsTool` | `projectId` | What the rikma is, its links, members, what is open and running. Non-members get its public face. Read before planning or writing. |
| `listProjectResourcesTool` | `projectId` | Website, repo, drive, resources - check before suggesting one. |
| `getProjectStatsTool` | `projectId`, `days?` (default 30) | Numbers on the rikma. |
| `getProjectMembersTool` | `projectId`, `query?` | `people[{id,username}]` **and** `roles[{id,roleDescription}]`. The only way to turn a name into an id. |
| `getMemberMissionsTool` | `projectId`, `userId` | Another member's in-progress missions in that rikma. |
| `findMissionTool` | `missionName` | Substring match across the user's missions; returns `projectId`/`projectName` to disambiguate. |
| `listUserMissionsTool` | `projectId?` | The caller's missions. |
| `getMissionDetailsTool` | mission id | Full record incl. skills, roles, hours. |
| `getActiveTimersTool` | - | Running timers. Check before starting a new one. |
| `getMissionStatsTool` | mission id | Totals and trends. A key scoped to some rikmas must name the rikma. |
| `searchContentTool` | `query`, `limit?` | Across every rikma the user belongs to. |
| `searchCatalogTool` | `query`, `kinds?`, `limit?` | Who already offers a product or service. |
| `listMyWishesTool`, `getWishDetailsTool` | - / `wishId` | The user's concierge wishes and their proposals. |
| `listMyWishOffersTool` | - | What others asked of the user. |
| `listMyConversationsTool`, `readConversationTool` | `projectId?` / `forumId` | Conversations belong to a mission, act, decision, haluka or wish proposal. |
| `listRikmaProcessesTool` | `projectId` | What the rikma is pursuing before it is a mission. |
| `getSitePagesTool` | - | The site's URL map. |

## Prepare (binds nobody)

| Tool | Notes |
|---|---|
| `createProjectTool` | `name`, `desc?`, `details?` (HTML), `url?`, `vals?`, `res?` (`feh` 48h / `sth` 72h / `nsh` 96h / `sevend` 1 week), `profit?`, `ont?` -> a prefilled rikma-creation URL. |
| `prepareMissionTool` | `projectId`, `name`, `descrip?`, `skills?`, `roles?`, `workways?`, `nhours?`, `valph?` -> a prefilled mission URL. Prefer over `createMissionTool`. |
| `navigateToPageTool` | A link to give the user; opens nothing by itself. |
| `planProjectWorkTool`, `scanProjectDirectionsTool` | Drafts from an idea / the rikma's state. Proposals, never commitments. |
| `createPlanBoardTool` | Saves proposals as a planning board. |
| `proposeRikmaBlueprintTool` | A whole rikma - missions, resources, products - as a draft the person creates on the review page. You do the decomposition; no model runs on the server. |
| `getAssistantTool`, `setAssistantItemsTool`, `undoAssistantTool` | Read and refine that draft list. |
| `shareRikmaPreviewTool` | A preview link to show future partners before the rikma exists. |
| `prepareForSomeoneElseTool` | A draft for another person: a signup link, or a receive link if they have an account. Refuses the caller's own email. |

## Self-write (the caller's own records)

| Tool | Notes |
|---|---|
| `timerActionTool` | `action`: `start` / `stop` / `pause` / `resume`, `missionId?`. **Always pass `missionId` on `start`** - an omitted id on an ambiguous account is how hours land on the wrong mission. It cannot back-date a session. |
| `startAssistantTool`, `reviseAssistantTool` | Build the user's own profile or wish list from free text. |
| `applyAssistantTool` | Saves that list - may overwrite what was there. Confirm first. |
| `dismissOfferTool` | Stop suggesting a mission to the user. |
| `previewWishTool`, `draftWishTool` | When enabled: preview a wish breakdown / save a draft wish. |

## Shop (members of the rikma)

| Tool | Notes |
|---|---|
| `listRikmaProductsTool`, `getRikmaProductTool` | Products with each variant's SKU, price and stock (`-1` = unlimited). |
| `listRikmaProductOptionsTool`, `listRikmaProductVariantsTool` | Option axes (size, colour) and their variants. |
| `getShopInventoryTool` | The shelf. |
| `listRikmaOrdersTool`, `getRikmaOrderTool` | Orders. Buyer contact stays inside the result - never copy it elsewhere. |
| `getShippingConfigTool`, `quoteShippingTool` | Zones, rates, pickup; a priced quote for a cart and address. |
| `createRikmaProductTool`, `updateRikmaProductTool` | Write. |
| `archiveRikmaProductTool` | Takes a product off sale (destructive). Confirm first. |
| `setShopStockTool` | Stock counts. Echo the numbers before writing. |
| `updateRikmaOrderStatusTool` | e.g. mark an order shipped. |

## Communicate (visible under the user's name)

| Tool | Notes |
|---|---|
| `postConversationMessageTool` | `forumId`, `message`. Show the text first. |
| `openRikmaConversationTool` | `projectId`. Opens the rikma-wide thread (created on first use) and returns its `forumId`. |
| `startProcessTool` | `projectId`, `name`, `description?` - in the user's plain words. |
| `attachToProcessTool` | `projectId`, `processId`, `entityType`, `entityId`, `name?` - attach an open mission or resource. |

A key that lists its allowed operations sees these only if it includes `mcp:post`.

## Consent-write (waits for another member)

| Tool | Notes |
|---|---|
| `createTaskTool` | `projectId`, `name`, `description?`, `link?`, `missionId?`, `hashivut` (`white`/`green`/`yellow`/`red`), `dateS?`, `dateF?`, and **either** `assignedUserId` **or** `tafkidims` (role ids) - never both. Nobody is bound until they accept. Resolve names with `getProjectMembersTool` first. |
| `proposeProjectLinkTool` | `projectId`, `kind`, `url` (empty clears). Sets a rikma link; with other members it becomes a vote by itself. |

## Shared write (needs the `mcp:write` scope)

| Tool | Notes |
|---|---|
| `createMissionTool` | `projectId`, `missionName`, plus `descrip?`, `skills?`, `roles?`, `workways?`, `nhours?`, `valph?`, `iskvua?` (recurring monthly), `dateStart?`, `dateEnd?`, `assignedUserId?`, `checklist?`. Omit `assignedUserId` to leave it open. |

If the user asks for it and you do not have the tool, say the key needs that
scope rather than improvising a workaround. Prefer `prepareMissionTool` even when
you hold `mcp:write`: a prefilled form the human approves costs one click.

## Retired

`getTimerHistoryTool`, `getPageContextTool` and the old `ask_*` / `run_*` proxies
to the in-app assistant are no longer served. If you see one on an old
deployment, do not use it.

## Sharp edges

- **`id` vs `idPr`.** Site URLs use `idPr`. Tool inputs want `id`. Mixing them
  produces a 404 or an empty result rather than an error.
- **`signInRequired: true`** in a result means the connector is listed but not
  signed in. Ask the person to connect, then retry - do not report it as a bug.
- **A timer left running accrues hours.** If `getActiveTimersTool` shows one from
  a previous day, surface it before doing anything else.
- **You cannot read another user's data.** Tools that take a `userId` refuse one
  that is not the key's owner. For a teammate's status use
  `getProjectMembersTool` + `getMemberMissionsTool` within a shared rikma.
- **A scoped key sees less.** A rikma missing from the results may simply be
  outside the key's scope.
- **Rate limits and audit.** Every call is rate-limited per key and logged. Do
  not loop a tool to "poll" - ask the user to come back later.
