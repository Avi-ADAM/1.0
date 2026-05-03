# Design Document: Process Chain View

## Overview

The Process Chain View is a new tab (tab 13) added to the moach (project brain) page at `src/routes/(reg)/moach/+page.svelte`. It renders the full lifecycle of each mission and resource as a horizontal visual chain, letting project members trace an object from its initial proposal all the way to completion without navigating between separate tabs or modals.

The feature is purely a read-only presentation layer. All data is already fetched by the moach page on load. The new component (`ProcessChainView.svelte`) receives that data as props, reconstructs chains client-side, and delegates all detail views to the existing modal system (`PendsM`, `OpenM`, `Betaha`, `Finisin`, `TaskModal`). The existing `ProcessBoard` (tab 12) is untouched.

Two chain types are supported:

- **Mission Chain**: pendm → open_mission → asks (count badge) → mesimabetahalich → acts → finiapruvals → finnished_mission
- **Resource Chain**: pmashes/open_mashaabim (pending) → open_mashaabim (open) → askm (offers) → maap (approval vote) → rikmash (completed)

Archived items (finnished_mission, archived mesimabetahalich) are not included in the default moach fetch and are loaded lazily on user demand via `sendToSer`.

---

## Architecture

### Component Placement

```
src/routes/(reg)/moach/+page.svelte
  └── tab 13 content area
        └── ProcessChainView.svelte          ← new component
              ├── MissionChainRow.svelte      ← renders one mission chain
              │     ├── ChainNode.svelte      ← single node (pendm, open_mission, etc.)
              │     ├── ChainConnector.svelte ← arrow between nodes
              │     ├── AsksNode.svelte       ← expandable ask count badge
              │     └── ActsGroup.svelte      ← collapsed/expanded acts list
              └── ResourceChainRow.svelte     ← renders one resource chain
                    ├── ChainNode.svelte      (reused)
                    └── ChainConnector.svelte (reused)
```

All sub-components live under `src/lib/components/process/chain/`.

### Data Flow

```
moach page (pmiData, omiData, bmiData, fmiData, opmash, rikmashes, acts)
    │  props
    ▼
ProcessChainView.svelte
    │  reconstructChains() — pure client-side function
    ▼
missionChains[], resourceChains[]
    │  render
    ▼
MissionChainRow / ResourceChainRow
    │  user click → onOpenModal / onOpenActModal / onOpenChat callbacks
    ▼
moach page modal system (PendsM, OpenM, Betaha, Finisin, TaskModal)
```

The reconstruction logic is a pure function with no side effects. It runs inside a `$derived()` rune so it re-runs automatically when any input prop changes.

### Lazy Loading Flow

```
ProcessChainView detects finnished_mission ID with no loaded data
    │
    ▼
Renders LazyNode placeholder with "Load" button
    │  user clicks
    ▼
sendToSer({ id }, 'getFinnishedMission', ...) via fetch
    │  success
    ▼
loadedItems Map updated → placeholder replaced with full ChainNode
    │  failure
    ▼
toast.error(localized message) + button re-enabled
```

---

## Components and Interfaces

### ProcessChainView.svelte

**Location**: `src/lib/components/process/ProcessChainView.svelte`

**Props**:
```typescript
{
  pmiData: StrapiEntity[],        // pendms
  omiData: StrapiEntity[],        // open_missions
  bmiData: StrapiEntity[],        // mesimabetahaliches
  fmiData: StrapiEntity[],        // finnished_missions (already loaded)
  opmash: StrapiEntity[],         // open_mashaabim
  rikmashes: StrapiEntity[],      // rikmashes
  acts: StrapiEntity[],           // meData.acts.data
  onOpenModal: (event: { id: string, kind: string }) => void,
  onOpenActModal: (actOrId: string | object) => void,
  onOpenChat: (e: { id: string, isNew: boolean }) => void,
  lang: 'he' | 'en' | 'ar'
}
```

**Internal state**:
- `missionChains` — `$derived()` from all mission-related props
- `resourceChains` — `$derived()` from `opmash` + `rikmashes`
- `loadedItems` — `$state(new Map())` — lazily fetched finnished_missions and archived mesimabetahaliches keyed by ID
- `loadingIds` — `$state(new Set())` — IDs currently being fetched

### MissionChain type

```typescript
type MissionChain = {
  id: string                          // pendm id, or open_mission id if no pendm
  pendm: StrapiEntity | null          // ApiPendmPendm
  openMission: StrapiEntity | null    // ApiOpenMissionOpenMission
  asks: AskEntry[]                    // open_mission.asks (oneToMany → ApiAskAsk)
  mesimabetahalich: StrapiEntity | null  // ApiMesimabetahalichMesimabetahalich
  acts: StrapiEntity[]                // ApiActAct — linked via act.open_mission or act.pendm
  finiapruvals: StrapiEntity[]        // mesimabetahalich.finiapruvals (oneToMany → ApiFiniapruvalFiniapruval)
  finnishedMissionId: string | null   // ID only — loaded lazily
  finnishedMission: StrapiEntity | null  // ApiFinnishedMissionFinnishedMission — populated after lazy load
}
```

### ResourceChain type

```typescript
type ResourceChain = {
  id: string                          // open_mashaabim id
  pmash: StrapiEntity | null          // ApiPmashPmash — via open_mashaabim.pmash (oneToOne)
  openMashaabim: StrapiEntity | null  // ApiOpenMashaabimOpenMashaabim
  askms: StrapiEntity[]               // open_mashaabim.askms (oneToMany → ApiAskmAskm)
  maap: StrapiEntity | null           // open_mashaabim.maap (oneToOne → ApiMaapMaap)
  rikmashes: StrapiEntity[]           // open_mashaabim.rikmashes (oneToMany → ApiRikmashRikmash)
}
```

### ChainNode.svelte

Renders a single node. Receives:
```typescript
{
  label: string,          // stage label (localized)
  name: string,           // object name
  status: string | null,  // status badge text
  statusColor: 'green' | 'grey' | 'blue' | 'yellow' | null,
  user: { username: string, profilePicUrl: string } | null,
  hasForum: boolean,
  onClick: () => void,
  onChatClick: (() => void) | null,
  lang: 'he' | 'en' | 'ar'
}
```

### AsksNode.svelte

Renders the ask count badge. Expands inline to show submitter names and forum IDs. Receives:
```typescript
{
  asks: AskEntry[],   // { userId, username, forumId }
  lang: 'he' | 'en' | 'ar'
}
```

### ActsGroup.svelte

Renders up to 3 acts collapsed, with a "show N more" button. Receives:
```typescript
{
  acts: StrapiEntity[],
  onActClick: (act: StrapiEntity) => void,
  lang: 'he' | 'en' | 'ar'
}
```

### ChainConnector.svelte

A simple arrow/chevron SVG between nodes. Flips direction based on `lang == 'he'` (RTL).

---

## Data Models

### Chain Reconstruction Algorithm

The reconstruction runs as a pure `$derived()` computation. No network calls are made.

#### Mission Chain Reconstruction

```
1. Build a map: pendmId → pendm entity
2. Build a map: openMissionId → open_mission entity
3. For each open_mission:
   a. If open_mission.pendm.data.id exists → link to that pendm (oneToOne)
   b. Create or find chain keyed by pendmId (or openMissionId if no pendm)
4. For each mesimabetahalich:
   a. PRIMARY: mesimabetahalich.open_missions.data[0].id → find chain by openMissionId
      (manyToMany field — use first entry; set during creation via createMesimabetahalich.js)
   b. FALLBACK: find chain via acts that reference this mesimabetahalich
      (act.mesimabetahaliches.data[0].id → mesimabetahalich → chain)
5. For each act:
   a. act.pendm.data.id → find chain by pendmId
   b. act.open_mission.data.id → find chain by openMissionId
   c. act.mesimabetahaliches.data[0].id → find chain by mesimabetahalichId
   d. Add act to that chain's acts array
   NOTE: mesimabetahalich must also fetch its linked finiapruvals in the main GraphQL query
         (mesimabetahalich.finiapruvals is oneToMany — already a field on the type)
6. For each finnished_mission in fmiData (already loaded):
   a. finnished_mission.mesimabetahalich.data.id → find chain by mesimabetahalichId
   b. Set chain.finnishedMission
7. Any pendm not yet in a chain → create partial chain with just pendm
8. Any open_mission not yet in a chain → create partial chain with just open_mission
```

#### Resource Chain Reconstruction

```
1. Build a map: openMashaabimId → open_mashaabim entity
2. For each open_mashaabim:
   a. open_mashaabim.pmash.data.id → link to the originating pmash (oneToOne)
   b. open_mashaabim.askms.data → list of askm offers (oneToMany)
   c. open_mashaabim.maap.data.id → the approval vote object (oneToOne)
   d. open_mashaabim.rikmashes.data → list of completed rikmashes (oneToMany)
   e. Create chain: { pmash, openMashaabim, askms, maap, rikmashes }
3. Any pmash not yet linked to an open_mashaabim → create partial chain with just pmash
```

### Strapi Field Reference

| Object | Collection | Name field | Status field | Key link fields |
|--------|-----------|-----------|--------------|-----------------|
| pendm | `pendms` | `attributes.name` | `attributes.archived` | `attributes.open_mission.data.id` (oneToOne → open_mission) |
| open_mission | `open_missions` | `attributes.name` | `attributes.archived` | `attributes.pendm.data.id` (oneToOne → pendm), `attributes.asks.data` (oneToMany → ask), `attributes.acts.data` (oneToMany → act), `attributes.mesimabetahaliches.data` (manyToMany → mesimabetahalich) |
| mesimabetahalich | `mesimabetahaliches` | `attributes.name` | `attributes.status` (0–100 integer) | **`attributes.open_missions.data`** (manyToMany → open_mission), `attributes.finiapruvals.data` (oneToMany → finiapruval), `attributes.forums.data`, `attributes.users_permissions_user.data`, `attributes.finnished_missions.data` (oneToMany → finnished_mission) |
| act | `acts` | `attributes.shem` | `attributes.status` | `attributes.pendm.data.id`, `attributes.open_mission.data.id`, `attributes.mesimabetahaliches.data` (manyToMany) |
| finiapruval | `finiapruvals` | `attributes.missname` | `attributes.archived` | `attributes.mesimabetahalich.data.id` (manyToOne) |
| finnished_mission | `finnished_missions` | `attributes.missionName` | — | `attributes.mesimabetahalich.data.id` (manyToOne) |
| pmash | `pmashes` | `attributes.name` | `attributes.archived` | — (linked from open_mashaabim.pmash) |
| open_mashaabim | `open_mashaabims` | `attributes.name` | `attributes.archived` | `attributes.pmash.data.id` (oneToOne → pmash), `attributes.askms.data` (oneToMany → askm), `attributes.maap.data.id` (oneToOne → maap), `attributes.rikmashes.data` (oneToMany → rikmash) |
| askm | `askms` | — | — | linked via open_mashaabim.askms |
| maap | `maaps` | — | — | linked via open_mashaabim.maap (oneToOne) |
| rikmash | `rikmashes` | `attributes.name` | — | linked via open_mashaabim.rikmashes |

> **Backend change required**: `mesimabetahalich.open_missions` (manyToMany) already exists in the schema. The `createMesimabetahalich.js` utility and the `72createMesimabetahalich` QIDS mutation must be updated to set this relation using `openMid` at creation time. The moach page's main GraphQL query must also fetch `open_missions { data { id } }` on each mesimabetahalich.

### Lazy Load GraphQL Query

A new query ID `'getFinnishedMission'` will be added to `src/routes/api/send/qids.js`:

```graphql
query GetFinnishedMission($id: ID!) {
  finnishedMission(id: $id) {
    data {
      id
      attributes {
        missionName
        start
        finish
        why
        total
        noofhours
        perhour
        descrip
        hearotMeyuchadot
        createdAt
        mesimabetahalich { data { id } }
        users_permissions_user {
          data {
            id
            attributes { username profilePic { data { attributes { url } } } }
          }
        }
      }
    }
  }
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Chain Completeness — Every input object appears in exactly one chain

*For any* set of pendms, open_missions, mesimabetahaliches, acts, finnished_missions, open_mashaabim, and rikmashes passed to the chain reconstructor, every input object SHALL appear in exactly one output chain (mission or resource). No object is dropped and no object appears in multiple chains.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3**

---

### Property 2: Linked objects are co-located in the same chain

*For any* pair of objects connected by a known link field (`open_mission.pendm → pendm`, `pendm.open_mission → open_mission`, `act.pendm → pendm`, `act.open_mission → open_mission`, `mesimabetahalich.open_missions → open_mission`, `open_mashaabim.pmash → pmash`, `open_mashaabim.rikmashes → rikmash`), both objects SHALL appear in the same output chain after reconstruction.

**Validates: Requirements 2.2, 2.3, 2.4, 3.2**

---

### Property 3: Node rendering contains required fields

*For any* chain node (of any type), the rendered collapsed node SHALL contain the object's name, its localized stage label, and a status badge. No required field is absent from the rendered output.

**Validates: Requirements 4.1, 7.2**

---

### Property 4: Modal dispatch correctness

*For any* chain node click event, the callback invoked SHALL be the correct one for that node type: `onOpenModal({ id, kind: 'pendm' })` for pendm nodes, `onOpenModal({ id, kind: 'openM' })` for open_mission nodes, `onOpenModal({ id, kind: 'betha' })` for mesimabetahalich nodes, `onOpenModal({ id, kind: 'done' })` for finnished_mission nodes, and `onOpenActModal(actOrId)` for act nodes.

**Validates: Requirements 4.2, 6.2, 7.3**

---

### Property 5: Ask count badge accuracy

*For any* mission with N asks (users array length N), the rendered ask count badge SHALL display exactly N.

**Validates: Requirements 4.3**

---

### Property 6: Chain connector count

*For any* chain with N visible nodes, the rendered output SHALL contain exactly N−1 connector elements between adjacent nodes.

**Validates: Requirements 4.5**

---

### Property 7: Acts collapse threshold

*For any* mission chain with more than 3 acts, the rendered output SHALL show exactly 3 act nodes and a "show N more" button where N equals the total act count minus 3. After clicking the button, all acts SHALL be visible.

**Validates: Requirements 7.4**

---

### Property 8: Lazy placeholder presence

*For any* chain that has a finnished_mission ID but whose data has not yet been loaded into `loadedItems`, the rendered output SHALL contain a placeholder node with a load button and SHALL NOT contain a full finnished_mission node.

**Validates: Requirements 5.1, 5.6**

---

### Property 9: Lazy load replacement

*For any* finnished_mission data received from a successful lazy load, the placeholder node SHALL be replaced by a full chain node displaying the mission's name and completion details, and the load button SHALL no longer be present.

**Validates: Requirements 5.3**

---

### Property 10: Mesimabetahalich status badge color

*For any* mesimabetahalich node, the status badge SHALL use a green color class when `status == 'active'` and a grey color class when `status == 'archived'`. No other status value produces a green badge.

**Validates: Requirements 6.1**

---

### Property 11: Mesimabetahalich user display

*For any* mesimabetahalich with non-null `users_permissions_user.data`, the rendered node SHALL contain the user's username. For any mesimabetahalich with null `users_permissions_user.data`, no username SHALL be rendered.

**Validates: Requirements 6.3**

---

### Property 12: Forum chat icon presence

*For any* mesimabetahalich with a non-empty `forums.data` array, the rendered node SHALL contain a chat icon element. For any mesimabetahalich with an empty `forums.data` array, no chat icon SHALL be rendered.

**Validates: Requirements 6.4**

---

### Property 13: RTL/LTR layout matches language

*For any* chain data, when `lang == 'he'` the root element of ProcessChainView SHALL have `dir="rtl"`, and when `lang == 'en'` it SHALL have `dir="ltr"`.

**Validates: Requirements 1.5, 9.3**

---

### Property 14: Localized stage labels

*For any* resource chain node and any supported language (`he` or `en`), the rendered stage label SHALL be the correct localized string for that stage in that language. No stage label SHALL be undefined or empty.

**Validates: Requirements 3.4, 9.1**

---

### Property 15: Acts ordering within chain

*For any* mission chain containing acts, mesimabetahalich, and finiapruvals nodes, the DOM order SHALL be: mesimabetahalich node(s) → acts group → finiapruvals node(s). Acts SHALL never appear before mesimabetahalich or after finiapruvals.

**Validates: Requirements 7.1**

---

## Error Handling

### Lazy Load Failures

When `sendToSer` throws or returns an error response during a lazy load:

1. The loading indicator is removed from the placeholder node.
2. The load button is re-enabled.
3. `toast.error()` is called with a localized message:
   - Hebrew: `'שגיאה בטעינת המשימה שהסתיימה'`
   - English: `'Failed to load completed mission'`
4. The `loadingIds` set has the ID removed.
5. The `loadedItems` map is not modified (no partial data stored).

### Missing Link Fields

The chain reconstructor is defensive: all link field accesses use optional chaining (`?.`). If a link field is null, undefined, or has an empty `data` array, the object is treated as unlinked and placed in its own partial chain. This prevents reconstruction from throwing on incomplete Strapi data.

### Empty Data Arrays

When all input arrays are empty, `missionChains` and `resourceChains` derive to empty arrays. The component renders a localized empty-state message:
- Hebrew: `'לא נמצאו שרשראות תהליך לפרויקט זה'`
- English: `'No process chains found for this project'`

### Tab Switch Re-render

ProcessChainView uses only `$derived()` for chain data — no `$effect()` that triggers on mount. Switching away from tab 13 and back does not re-run reconstruction or trigger any network requests. The derived values are recomputed only when the underlying prop arrays change (i.e., when the moach page refreshes its data).

---

## Testing Strategy

### Unit Tests (Vitest)

Unit tests focus on the pure chain reconstruction logic and node rendering with concrete examples.

**Chain Reconstructor** (`reconstructChains.test.ts`):
- Correctly links open_mission to pendm via `rishon`
- Correctly links act to chain via `act.pendm.data.id`
- Correctly links act to chain via `act.open_mission.data.id`
- Correctly links rikmash to open_mashaabim via `sp`
- Unlinked objects create partial chains
- Empty input arrays produce empty chain arrays
- Objects with null link fields are handled gracefully

**Node rendering** (component tests):
- Collapsed node shows name, stage label, status badge
- Acts group shows 3 items + "show N more" button when N > 3
- Acts group shows all items when N ≤ 3
- Ask count badge shows correct number
- Mesimabetahalich with active status renders green badge
- Mesimabetahalich with archived status renders grey badge
- Mesimabetahalich with forum renders chat icon
- Mesimabetahalich without forum does not render chat icon
- Lazy placeholder renders load button when data not loaded
- Lazy node renders full content after data loaded

### Property-Based Tests (fast-check)

Property-based tests use [fast-check](https://fast-check.io/) (already available in the JS ecosystem, consistent with the project's Vitest setup). Each test runs a minimum of 100 iterations.

Tests are tagged with: `// Feature: project-process-view, Property N: <property text>`

**Property 1 — Chain Completeness** (`reconstructChains.property.test.ts`):
```
// Feature: project-process-view, Property 1: Every input object appears in exactly one chain
fc.assert(fc.property(
  arbitraryMissionInputs(),
  ({ pmiData, omiData, bmiData, fmiData, acts }) => {
    const { missionChains } = reconstructChains(...)
    const allOutputIds = missionChains.flatMap(c => collectAllIds(c))
    const allInputIds = [...pmiData, ...omiData, ...bmiData, ...acts].map(e => e.id)
    return allInputIds.every(id => allOutputIds.filter(x => x === id).length === 1)
  }
), { numRuns: 100 })
```

**Property 2 — Linked objects co-located** (`reconstructChains.property.test.ts`):
```
// Feature: project-process-view, Property 2: Linked objects are co-located in the same chain
fc.assert(fc.property(
  arbitraryLinkedMissionPair(),
  ({ pendm, openMission }) => {
    const { missionChains } = reconstructChains({ pmiData: [pendm], omiData: [openMission], ... })
    const chain = missionChains.find(c => c.pendm?.id === pendm.id)
    return chain?.openMission?.id === openMission.id
  }
), { numRuns: 100 })
```

**Property 3 — Node rendering contains required fields** (`ChainNode.property.test.ts`):
```
// Feature: project-process-view, Property 3: Node rendering contains required fields
fc.assert(fc.property(
  arbitraryChainNode(),
  (node) => {
    const html = render(ChainNode, { props: node })
    return html.includes(node.name) && html.includes(node.label) && html.includes('status-badge')
  }
), { numRuns: 100 })
```

**Property 4 — Modal dispatch correctness** (`ProcessChainView.property.test.ts`):
```
// Feature: project-process-view, Property 4: Modal dispatch correctness
fc.assert(fc.property(
  arbitraryNodeType(),
  (nodeType) => {
    const calls = []
    const onOpenModal = (e) => calls.push(e)
    // render node, simulate click, verify correct kind dispatched
    return calls[0]?.kind === expectedKind(nodeType)
  }
), { numRuns: 100 })
```

**Properties 5–15** follow the same pattern: generate arbitrary valid inputs, render the component or run the pure function, assert the property holds.

### Integration Tests

- Verify `sendToSer` is called with the correct query ID and variables when the lazy load button is clicked (mock `sendToSer`).
- Verify `toast.error` is called when `sendToSer` rejects (mock both).
- Verify tab 12 (ProcessBoard) still renders correctly after tab 13 is added to the moach page.

### Accessibility

- All interactive nodes (ChainNode, AsksNode, ActsGroup expand button, lazy load button) use `<button>` elements with descriptive `aria-label` attributes.
- Status badges use `role="status"` and include screen-reader text.
- Chain connectors are `aria-hidden="true"` (decorative).
- The component root sets `dir` based on language for correct RTL screen reader behavior.
