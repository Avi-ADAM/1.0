# How to add a new object type to the Lev screen (`/lev`)

> The heart screen (`/lev`) renders one merged, priority-sorted feed
> (`finalSwiperArray`) built from ~17 independent "object types" (pending
> missions, approvals, sales, product requests…). Adding a new type means
> threading it through a fixed pipeline. This is the recipe so the next time is
> mechanical, not archaeology.
>
> Running example below: a **wish invitation** card (`requestSuggestion` Track B
> — see [PLAN_CONCIERGE.md §5.2](../PLAN_CONCIERGE.md)). Its `ani` id is
> `wishInvite`. Substitute your own type/fields.

## The data flow, end to end

```
GraphQL (fetchMainUserData)                    ← 2. add fields to the query
   │
   ▼
extractX(userData)            levDataExtractors.ts   ← 3. raw → typed XData[]
   │
   ▼
xStore: Writable<XData[]>     levStores.ts           ← 1. type + store (+ snapshot)
   │   (set by populateStores / restoreFromSnapshot — levDataLoader.ts) ← 4
   ▼
processX(items, projects)     levProcessors.ts       ← 5. XData → DisplayItem
   │   (DisplayItem needs: ani, azmi, pl, coinlapach, projectId, …)
   ▼
processedX (derived)          levDerived.ts          ← 6. derived store
   │
   ▼
finalSwiperArray              levDerived.ts          ← 7. merge + milon filter
   │   (mergeAndSort signature — levProcessors.ts)   ← 8
   ▼
Cardsui / Coinsui             cards.svelte / newcoinui.svelte ← 9. UI card by `ani`
```

Every step keys off the **`ani`** string. Pick a unique one (`wishInvite`) and
use it consistently everywhere.

---

## Step-by-step checklist

### 1. Type + store + snapshot — `src/lib/stores/levStores.ts`
- Add an interface `XData` (must include `id`, `projectId`, `priority?`, and an
  index signature `[key: string]: any`).
- Add the store: `export const xStore: Writable<XData[]> = writable([]);`
- Add `x: XData[]` to the `SnapshotData.data` interface.
- **Bump `SNAPSHOT_VERSION`** (e.g. 4 → 5). Skipping this serves stale snapshots
  that lack your new array and silently drops the type for returning users.
- If the type should be filterable, add a flag to `MilonConfig` + the `milon`
  writable default.

### 2. GraphQL — `src/lib/utils/levGraphQLQueries.ts`
- Add the fields your extractor needs to the main user query
  (`fetchMainUserData`). If the data hangs off a relation the query doesn't
  traverse yet, add it. (For server-only surfaces you can instead do a separate
  query — but the lev feed expects the data inside the one user payload.)

### 3. Extractor — `src/lib/utils/levDataExtractors.ts`
- `export function extractX(userData: any): XData[]` — pure, defensive
  (`?.`/`?? []` everywhere; never throw). Return `[]` on missing data.
- Import the `XData` type from `levStores`.

### 4. Loader wiring — `src/lib/utils/levDataLoader.ts`
Touch **four** places (easy to miss one):
- `populateStores`: `const x = extractX(userData); xStore.set(x);`
- `restoreFromSnapshot`: `xStore.set(snapshot.data.x || []);`
- `saveCurrentSnapshot`: `x: get(xStore),` inside the `data` object.
- `clearAllData`: `xStore.set([]);`
Also add `extractX` to the import from `./levDataExtractors` and `xStore` to the
import from `levStores`.

### 5. Processor — `src/lib/utils/levProcessors.ts`
- `export function processX(items: XData[], projects: ProjectData[]): DisplayItem[]`
- Each returned item **must** set: `ani` (your id), `azmi` (category bucket),
  `pl` (priority — use a `PRIORITY_BAND` constant; vote-style cards use
  `votePriority(already, votesCast)`), `coinlapach` (unique, e.g. `` `wishInvite-${item.id}` ``),
  and `projectId`. Spread `...projectInfo` from `createProjectInfo(projectId)` for
  name/pic, and `...item` last for passthrough.
- Add `processX` to the `mergeAndSort` call (see step 8).

### 6. Derived store — `src/lib/stores/levDerived.ts`
- `export const processedX = derived([xStore, projectsStore], ([$x, $p]) => processX($x, $p));`
- Add `processedX` to the `finalSwiperArray` input array **and** its destructured
  callback args **and** the `mergeAndSort(...)` arguments — keep all three in the
  same order.
- Add a `case 'wishInvite': return $milon.<flag>;` to the milon filter `switch`
  (or `return true;` if always shown).

### 7. mergeAndSort signature — `src/lib/utils/levProcessors.ts`
- Extend `mergeAndSort(...)` to accept the new processed array and include it in
  the concatenation it sorts.

### 8. UI card — `src/lib/components/lev/cards/cards.svelte` (+ `newcoinui.svelte`)
- The swiper iterates `arr1` (= `finalSwiperArray`) and branches on `item.ani`.
  Add a branch that renders your card component for `ani === 'wishInvite'`.
- Both views exist: **Cardsui** (`cards.svelte`, the default card view) and
  **Coinsui** (`newcoinui.svelte`, the coin view). Add the branch to whichever
  view(s) should show it.
- `/lev/+page.svelte` passes per-`ani` **counts** into these components
  (e.g. `sheirutps={displayItems.filter((i) => i.ani === 'sheirutp').length}`).
  If your card needs a count badge, add an analogous prop there.
- Build any side-effect (accept/vote/chat) as a call through `/api/action`
  (unified actions) — lev cards stay logic-light; the page wires `onChat`,
  `onUser`, `onProj`, `onStart` (dismiss) callbacks you can reuse.

### 9. Verify
- `npm run check` (svelte-check) — catches a missed snapshot field or import.
- Load `/lev`: the new card appears, sorts by its `pl`, survives a refresh
  (snapshot round-trip), and the milon filter toggles it.

---

## Gotchas

- **Forgot the `SNAPSHOT_VERSION` bump** → returning users keep an old snapshot
  shape; new array is `undefined`; type never shows until cache clears.
- **`ani` mismatch** between processor, `levDerived` milon switch, and the count
  filters in `+page.svelte` → card renders but is filtered out, or the count
  badge is always 0.
- **Throwing in the extractor** aborts `populateStores` for *every* type. Stay
  defensive and return `[]`.
- **Heavy/async work in the processor** — processors are pure and run inside a
  derived store on every dependency change. Do fetches/AI in a server load or a
  separate enrichment pass (see `updateSuggestionsWithDetails`), not here.

## Reference: a complete existing type to copy

Product requests (`sheirutpend`) are the closest analogue to a concierge object
and touch every step — use it as a template:
- type/store `ProductRequestData` / `sheirutpStore` — `levStores.ts`
- `extractProductRequests` — `levDataExtractors.ts`
- `processProductRequests` (ani `sheirutp`) — `levProcessors.ts`
- `processedSheirutp` + milon `case 'sheirutp'` — `levDerived.ts`
