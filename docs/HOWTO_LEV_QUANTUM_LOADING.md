# Agent guide: quantum (incremental) loading for the Lev stores

> **Goal:** in *addition* to the existing full load of `/lev` (query
> `83levMainUserQuery`), allow loading **small quanta** of data into the same
> lev stores — "only items of type X, only from project Y" — and render the
> same cards from them. Two consumers:
>
> 1. **Hub drill-in** — a KPI chip on `/hub` opens real, interactive cards for
>    just that slice instead of dumping the user on the full `/lev`.
> 2. **Socket refresh on `/lev`** — replace the heavy `fullRefresh` (and the
>    fragile hand-merged `partialUpdate` payloads) with an atomic, cheap
>    **refetch-scope**: re-fetch one slice and upsert it.
>
> This guide is written for an AI agent implementing the feature. Read
> [HOWTO_ADD_LEV_OBJECT.md](./HOWTO_ADD_LEV_OBJECT.md) first — it documents the
> existing pipeline this guide extends. **Nothing in the full-load path may
> break**: query 83 stays the default for a cold `/lev` visit.

---

## 1. The existing pipeline (what we plug into)

```
fetchMainUserData (qid 83)        levGraphQLQueries.js   ← one giant request
   ▼
extractX(userData)                levDataExtractors.ts   ← walks usersPermissionsUser
   ▼                                                       → attributes → projects_1s
xStore.set(...)                   levDataLoader.ts        (populateStores, wholesale .set)
   ▼
processX → processedX             levProcessors.ts / levDerived.ts
   ▼
finalSwiperArray → cards by `ani` levDerived.ts → cards.svelte
```

Key facts the design leans on:

- **Stores are already per-type** (`sheirutpStore`, `pendsStore`, … in
  `src/lib/stores/levStores.ts`). Rendering reads only stores; it does not
  care how they were filled.
- **Extractors are pure** and walk a fixed payload shape:
  `data.usersPermissionsUser.data.attributes.projects_1s.data[].attributes.<collection>.data`
  (project-scoped types) or `…attributes.<collection>` directly on the user
  (user-scoped types).
- **Queries are static strings** registered by id in
  `src/routes/api/send/qids.js` and executed through the secure `/api/send`
  endpoint (HTTP-only cookie auth). No client-built query strings — this is a
  deliberate security decision; quantum queries must also be static qids with
  GraphQL variables only.
- The backend (Strapi GraphQL) already accepts collection filters everywhere
  (e.g. `sheirutpends(filters: …)` at `qids.js:1404`), so per-project slicing
  is purely a query-authoring task.

## 2. Core design

### 2.1 A *slice* (quantum) and its scope

```ts
interface LevScope {
  type: LevSliceType;        // one entry of the type registry, e.g. 'sheirutp'
  projectIds: string[];      // projects covered by this slice
}
```

A slice query fetches exactly the fields query 83 fetches for that one type
(copy them verbatim from query 83 — do not invent a leaner field set, the
processors need every field), restricted by project.

### 2.2 Mini-userData payload shape ⇒ extractors are reused verbatim

**The single most important decision:** every slice query returns the *same
envelope shape* as query 83, just pruned to one collection:

```graphql
query LevSliceSheirutp($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) { data { id attributes {
    projects_1s(filters: { id: { in: $pids } }) { data { id attributes {
      projectName
      profilePic { data { attributes { url } } }
      user_1s { data { id } }            # ← keep: vote math needs member ids
      sheirutpends(filters: { archived: { eq: false } }) { data { id attributes {
        # …copy the exact sheirutpends field block from query 83…
      }}}
    }}}
  }}}
}
```

Because the shape matches, the existing `extractProductRequests(userData)`
(and every other extractor) runs **unchanged** on the slice response and simply
returns only the sliced items. No new extractors, no adapters.

Notes:

- **`id: { in: $pids }`, not `eq`** — one static query serves both "one
  project" (`pids = [y]`) and "all my projects" (`pids = all ids from
  projectsStore` / a tiny projects query). Avoids needing per-arity query
  variants and avoids Strapi's poor handling of `eq: null`.
- **Always include the project header fields** (`projectName`, `profilePic`,
  `user_1s`) in every slice. They feed two things: `createProjectInfo()` in
  the processors, and vote-completion math (member counts). The slice loader
  upserts them into `projectsStore` (see §4.3) so a slice works even when the
  full load never ran (hub drill-in on a cold session).

### 2.3 The type registry — one table drives everything

Create `src/lib/utils/levSliceRegistry.ts`: a declarative map so the socket
handler, the hub, and future callers never hand-wire stores again.

```ts
import type { Writable } from 'svelte/store';

export interface LevSliceDef {
  /** qid registered in src/routes/api/send/qids.js */
  qid: string;
  /** extractor from levDataExtractors.ts — receives the slice's userData node */
  extract: (userData: any) => any[];
  /** target raw store from levStores.ts */
  store: Writable<any[]>;
  /** `ani` values this type renders as (for hub deep-links / counts) */
  anis: string[];
  /** where the collection hangs in the payload (documentation + tests) */
  source: 'project' | 'user';
}

export const LEV_SLICES: Record<string, LevSliceDef> = { /* see table */ };
```

Initial registry (source paths verified against query 83 and the extractors):

| key (= socket `dataKey`) | collection in query 83 | source | extractor | store | ani |
|---|---|---|---|---|---|
| `pends` | `projects_1s[].pendms` | project | `extractPends` | `pendsStore` | `pends` |
| `mtaha` | `mesimabetahaliches` (user) | user | `extractMtaha` | `mtahaStore` | `mtaha` |
| `fiapp` | `projects_1s[].finiapruvals` | project | `extractFiapp` | `fiappStore` | `fiapp` |
| `asked` | `asks` (user) | user | `extractAsked` | `askedStore` | `askedcoin` |
| `askedResources` | `askms` (user) | user | `extractAskedResources` | `askedResourcesStore` | `askedm` |
| `pmashes` | `projects_1s[].pmashes` | project | `extractPmashes` | `pmashesStore` | `pmashes` |
| `wegets` | `projects_1s[].maaps` | project | `extractWegets` | `wegetsStore` | `wegets` |
| `halukas` | `projects_1s[].halukas` | project | `extractHalukas` | `halukasStore` | `haluk` |
| `welcome` | `projects_1s[].welcometops` | project | `extractWelcome` | `welcomeStore` | `walcomen` |
| `transfers` | `projects_1s[].tosplits` | project | `extractTransfers` | `transfersStore` | `vidu` |
| `decisions` | `projects_1s[].decisions` | project | `extractDecisions` | `decisionsStore` | `hachla` |
| `sheirutpends` | `projects_1s[].sheirutpends` | project | `extractProductRequests` | `sheirutpStore` | `sheirutp` |
| `sales` | `projects_1s[].sheiruts` | project | `extractSales` | `salesStore` | `sale` |
| `purchases` | user-side `sheiruts` | user | `extractPurchases` | `purchasesStore` | `buy` |

**Deliberately out of phase 1:** `suggestions` (`meData`) and
`resourceSuggestions` (`huca`). Suggestions need the query-84 enrichment pass
(`updateSuggestionsWithDetails`) and scoring; slicing them adds little (they
are not vote-urgent) and doubles the work. Keep them full-load-only for now
and document that in the registry with a comment.

For **user-scoped** types, `$pids` filters the *relation*, e.g.
`asks(filters: { project: { id: { in: $pids } } })` — check the actual relation
name per type inside query 83 before writing the filter.

---

## 3. Step-by-step checklist

### Step 1 — Slice queries in `src/routes/api/send/qids.js`

- One static qid per registry entry, named `87levSlice<Type>` (87 is the next
  free query number; mutations already use 86 — re-check before claiming).
- **Copy the field block for the collection verbatim from query 83**
  (`qids.js:2748–4747`), including nested relations (votes, forums, users,
  matanots, …). A missing field surfaces as a silently-broken card, not an
  error.
- Variables: `($idL: ID!, $pids: [ID])` and the mini-userData envelope of §2.2.
- If `/api/send` validates `arg` shapes per qid, register the new arg shape
  there too (inspect how qid 83/84 args are handled in
  `src/routes/api/send/+server.*`).

### Step 2 — Fetcher in `src/lib/utils/levGraphQLQueries.js`

```js
export async function fetchLevSlice(qid, idL, pids, lang) { /* POST /api/send,
  body { data: { queId: qid, arg: { idL, pids, lang } } } — mirror
  fetchMainUserData’s error handling incl. the 401 → /login redirect */ }
```

### Step 3 — Scoped upsert (new file `src/lib/utils/levSliceLoader.ts`)

The heart of the feature. `populateStores` (`levDataLoader.ts:259`) does
wholesale `.set()` — that is correct for the full load and **wrong for
slices**: a slice must replace *only the items inside its scope* and leave
everything else in the store untouched.

```ts
export async function loadLevSlice(typeKey: string, idL: string,
                                   pids: string[], lang: string): Promise<void> {
  const def = LEV_SLICES[typeKey];
  const res = await fetchLevSlice(def.qid, idL, pids, lang);
  const userData = res?.data?.usersPermissionsUser?.data;
  if (!userData) return;                       // defensive, like the extractors

  upsertProjects(userData);                    // §4.3
  const fresh = def.extract(userData);         // existing extractor, unchanged
  def.store.update((curr) => [
    ...curr.filter((it) => !pids.includes(String(it.projectId))),
    ...fresh
  ]);
  markScopeLoaded(typeKey, pids);              // §4.2
}
```

Scope-removal key is `projectId` — every store item already carries it (it is
a required field per HOWTO_ADD_LEV_OBJECT step 5). `String(...)`-normalize
both sides; Strapi ids arrive as strings or numbers depending on path.

### Step 4 — State bookkeeping in `src/lib/stores/levStores.ts`

Three small additions (see §4 for rationale):

1. `export const dataMode: Writable<'none' | 'partial' | 'full'> = writable('none');`
   — `initializeLevData` sets `'full'` after `populateStores` succeeds;
   `loadLevSlice` upgrades `'none' → 'partial'` only.
2. `export const loadedScopes: Writable<Record<string, string[]>> = writable({});`
   — `typeKey → projectIds` covered so far (merge, don't replace).
3. **Snapshot guard** (critical): in `levDataLoader.ts`,
   `saveCurrentSnapshot` must early-return unless `get(dataMode) === 'full'`.

### Step 5 — Socket strategy `refetchScope` in `src/lib/utils/levSocketHandler.ts`

Add a case to the strategy `switch` (`levSocketHandler.ts:90`):

```ts
case 'refetchScope':
  await handleRefetchScope(updateStrategy.config, userId, lang);
  break;
```

`config = { dataKeys: string[], projectId?: string }`. For each key found in
`LEV_SLICES`, call `loadLevSlice(key, userId, [projectId] /* or all loaded
project ids when absent */, lang)`. Unknown key → fall back to
`handleFullRefresh` (never drop an update on the floor).

Then convert the worst offender: the `sheirutpends` branch of
`handlePartialUpdate` (`levSocketHandler.ts:290–297`) currently does a **full
refresh** whenever the payload lacks data — replace that fallback with a
scope refetch. Do **not** delete the existing `partialUpdate` merge handlers;
they are still the cheapest path when the server pushes a complete item, and
`mergeVote` idempotency must keep working. Server-side (socket-server /
`/api/action` emitters) can start attaching
`updateStrategy: { type: 'refetchScope', config: { dataKeys: ['sheirutpends'], projectId } }`
incrementally — old clients ignore unknown strategies via the `default` case.

### Step 6 — Hub drill-in

Today every chip in `src/lib/components/hub/KpiBar.svelte:24–30` and
`UrgentVotePill.svelte` is a hardcoded `href="/lev"`.

Phase-1 approach (cheapest, ships value immediately): **deep-link into lev**
with a focus param — `href="/lev?focus=sheirutp&project=Y"`. In
`src/routes/(reg)/lev/+page.svelte`:

> **Focus groups:** `?focus=` also accepts a *virtual group* name that expands
> to several slice types (see `LEV_FOCUS_GROUPS` in `levSliceRegistry.ts`).
> The hub "votes waiting" hero and the urgent pill use `?focus=votes`, which
> expands to the seven vote-bearing types the hub KPI counts
> (pends, fiapp, askedResources, wegets, decisions, halukas, sheirutpends).
> Comma-separated ani values (`?focus=sale,buy`) work too.

- On mount, read `focus` / `project` from `page.url.searchParams`.
- If `focus` is present and `dataMode !== 'full'`: skip `initializeLevData`,
  call `loadLevSlice` for the registry entries whose `anis` include the focus
  value (plus `projectFilter.set(project)` if given), render as usual, and
  kick off the full `initializeLevData` **in the background** so the page
  quietly becomes complete. The slice gives first-cards-on-screen in one small
  request; the giant query stops blocking first paint.
- `finalSwiperArray` already supports project filtering; focus filtering can
  reuse the milon mechanism or a simple `displayItems.filter(i => i.ani === focus)`
  at the page level — prefer the page-level filter, do not fork `levDerived`.

Phase-2 (optional, separate task): render `Cardsui` inside `/hub` itself.
The components are reusable as-is (`arr1={displayItems}` + the callback props
`+page.svelte` wires: `onChat`, `onUser`, `onProj`, `onStart`), but hub is
currently a server-streamed page with no stores — weigh the bundle cost first.

### Step 7 — Verify

- `npm run check` — TypeScript/svelte-check clean.
- **Full load unchanged:** cold `/lev` still renders everything; snapshot
  round-trip still works (`dataMode` reaches `'full'`, snapshot saved).
- **Slice in isolation:** with cleared localStorage, open
  `/lev?focus=sheirutp&project=<id>` — cards render from one small request;
  `levSnapshot` is **absent** from localStorage afterwards (guard works).
- **Upsert correctness:** full load, then trigger a slice for project Y —
  items of other projects in that store survive; items of Y are replaced;
  no duplicate `coinlapach` keys (the swiper keys off it).
- **Socket:** emit a `refetchScope` notification (or vote on a sheirutpend
  from a second device) — only the one store updates, no full reload, votes
  not double-counted.

---

## 4. Gotchas (read before coding)

1. **Snapshot poisoning is the #1 risk.** A snapshot saved from a
   partial session would make a returning `/lev` user see the slice as "all
   their data". The `dataMode` guard in Step 4 is not optional. Equally:
   `restoreFromSnapshot` must keep setting `dataMode` appropriately
   (a restored full snapshot is `'full'`).
2. **Processors need `projectsStore`.** `createProjectInfo(projectId)` and
   vote math (member counts via `user_1s`) read from it. That's why every
   slice query carries the project header fields and `loadLevSlice` upserts
   them (`projectsStore.update` merge by id — also sync the legacy `projects`
   store like `populateStores` does at `levDataLoader.ts:285`).
3. **Don't slim the field blocks.** The 2,271-line `levProcessors.ts` touches
   far more fields than you'd guess (timers, forums, matanots, timegrama…).
   Copy from query 83 verbatim; diff against the extractor's reads if unsure.
4. **Static qids only.** Never interpolate user input into a query string in
   `levGraphQLQueries.js` — variables only, same security posture as 83/84.
5. **`projectId` string/number mismatch** silently empties the scope filter.
   Normalize with `String()` on both sides of every comparison.
6. **Extractors are user-rooted.** They read `userData.id` for `myid` — the
   mini-userData envelope (not a bare collection response) is what keeps that
   working. Resist the temptation to use direct collection queries
   (`sheirutpends(filters:…)` at top level) even though the backend allows
   them: you'd need per-type adapters and lose `myid`/project context.
7. **Suggestions stay full-load.** If a later phase slices `meData`, it must
   also run the query-84 enrichment (`updateSuggestionsWithDetails`,
   `levDataLoader.ts:467`) — do not ship sliced suggestions without it.
8. **Do not regress `partialUpdate`/`mergeVote`.** `refetchScope` is an
   *additional* strategy; optimistic updates and idempotent vote merging are
   load-bearing for multi-device echo handling.

## 5. Suggested implementation order

1. Registry + `fetchLevSlice` + `loadLevSlice` + `dataMode`/`loadedScopes`/
   snapshot guard, with **one pilot type: `sheirutpends`** (closest analogue,
   precedent for direct filtering already in the codebase, and it's the type
   whose socket path currently full-refreshes).
2. `refetchScope` socket strategy wired for the pilot type.
3. `/lev?focus=…` deep-link + hub chips pointing at it.
4. Roll the remaining registry rows (mechanical: copy field block → qid →
   registry entry).
5. (Separate decision) progressive `/lev` first paint: load vote-urgent slices
   first, full query 83 in background.

## 6. File map

| File | Role in this feature |
|---|---|
| `src/routes/api/send/qids.js` | add `87levSlice*` static queries (copy blocks from query 83 at lines 2748–4747) |
| `src/lib/utils/levGraphQLQueries.js` | add `fetchLevSlice` |
| `src/lib/utils/levSliceRegistry.ts` | **new** — type registry (§2.3) |
| `src/lib/utils/levSliceLoader.ts` | **new** — `loadLevSlice`, `upsertProjects`, scope bookkeeping |
| `src/lib/stores/levStores.ts` | `dataMode`, `loadedScopes` |
| `src/lib/utils/levDataLoader.ts` | set `dataMode`, snapshot guard in `saveCurrentSnapshot` |
| `src/lib/utils/levSocketHandler.ts` | `refetchScope` strategy; fix `sheirutpends` full-refresh fallback |
| `src/routes/(reg)/lev/+page.svelte` | `?focus=`/`?project=` handling, background full load |
| `src/lib/components/hub/KpiBar.svelte`, `UrgentVotePill.svelte` | deep-link hrefs |
| `src/lib/utils/levDataExtractors.ts`, `levProcessors.ts`, `levDerived.ts` | **untouched** — that's the point |
