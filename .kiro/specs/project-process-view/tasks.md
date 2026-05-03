# Implementation Plan: Project Process View

## Overview

Add a "Process Chains" tab (tab 13) to the moach page that renders mission and resource lifecycle chains. The implementation is split into four phases: (1) pure chain reconstruction logic + tests, (2) presentational sub-components, (3) the top-level `ProcessChainView` component wired into the moach page, and (4) backend plumbing (QIDS mutation update, lazy-load query, moach GraphQL query extension).

All new Svelte components use Svelte 5 syntax (`$props()`, `$state()`, `$derived()`, `$effect()`). All new JS utilities are pure functions testable with Vitest + fast-check.

---

## Tasks

- [x] 1. Create the pure chain reconstruction utility
  - Create `src/lib/utils/reconstructChains.js`
  - Implement `reconstructMissionChains(pmiData, omiData, bmiData, fmiData, acts)` as a pure function following the algorithm in the design document (steps 1–8)
    - Build `pendmById` and `openMissionById` maps
    - Link open_mission → pendm via `open_mission.attributes.pendm.data.id`
    - Link mesimabetahalich → chain via `mesimabetahalich.attributes.open_missions.data[0].id` (primary) and act fallback
    - Link acts to chains via `act.attributes.pendm.data.id`, `act.attributes.open_mission.data.id`, `act.attributes.mesimabetahaliches.data[0].id`
    - Append already-loaded finnished_missions via `finnished_mission.attributes.mesimabetahalich.data.id`
    - Orphan pendms and open_missions each become their own partial chain
    - Use optional chaining (`?.`) throughout for defensive access
  - Implement `reconstructResourceChains(opmash, rikmashes)` as a pure function following the design algorithm (steps 1–3)
    - Link open_mashaabim → pmash, askms, maap, rikmashes from nested attributes
    - Orphan pmashes become partial chains
  - Export both functions as named exports
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 3.1, 3.2, 3.3_

- [x] 2. Write tests for chain reconstruction
  - Create `src/lib/utils/reconstructChains.test.js`
  - Write unit tests (Vitest):
    - Links open_mission to pendm via `pendm.data.id`
    - Links act to chain via `act.pendm.data.id`
    - Links act to chain via `act.open_mission.data.id`
    - Links mesimabetahalich to chain via `open_missions.data[0].id`
    - Links rikmash to open_mashaabim
    - Unlinked objects create partial chains
    - Empty input arrays produce empty chain arrays
    - Objects with null link fields are handled gracefully (no throw)
  - [ ]* 2.1 Write property test — Property 1: Chain Completeness
    - **Property 1: Every input object appears in exactly one chain**
    - Generate arbitrary sets of pendms, open_missions, mesimabetahaliches, acts with `fc.array()`
    - Assert every input ID appears in exactly one output chain
    - `// Feature: project-process-view, Property 1`
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3**
  - [ ]* 2.2 Write property test — Property 2: Linked objects co-located
    - **Property 2: Linked objects are co-located in the same chain**
    - Generate arbitrary linked pendm+open_mission pairs (with matching IDs)
    - Assert both appear in the same output chain
    - `// Feature: project-process-view, Property 2`
    - **Validates: Requirements 2.2, 2.3, 2.4, 3.2**
  - _Requirements: 2.1–2.7, 3.1–3.3_

- [x] 3. Add `getFinnishedMission` query to QIDS and update `72createMesimabetahalich` mutation
  - In `src/routes/api/send/qids.js`:
    - Add `'getFinnishedMission'` query as specified in the design document (fetches `missionName`, `start`, `finish`, `why`, `total`, `noofhours`, `perhour`, `descrip`, `hearotMeyuchadot`, `createdAt`, `mesimabetahalich { data { id } }`, and `users_permissions_user` with `username` and `profilePic`)
    - Update `'72createMesimabetahalich'` mutation: add `$openMid: ID` parameter and `open_missions: ["${openMid}"]` (or `open_missions: [$openMid]`) to the `createMesimabetahalich` data block so the manyToMany relation is set at creation time
  - _Requirements: 2.4, 5.2_

- [x] 4. Update moach page GraphQL query to fetch chain-linking fields
  - In `src/routes/(reg)/moach/+page.svelte`, locate the main GraphQL query that fetches `mesimabetahaliches`
  - Add `open_missions { data { id } }` to the mesimabetahalich fragment
  - Add `finiapruvals { data { id attributes { missname archived } } }` to the mesimabetahalich fragment
  - Verify `acts` already includes `pendm { data { id } }`, `open_mission { data { id } }`, and `mesimabetahaliches { data { id } }` — add any missing sub-fields
  - _Requirements: 2.1, 2.4, 8.3_

- [x] 5. Build `ChainConnector.svelte`
  - Create `src/lib/components/process/chain/ChainConnector.svelte`
  - Render a right-pointing chevron SVG (`›` / `❯`) by default; flip to left-pointing when `lang === 'he'`
  - Mark the element `aria-hidden="true"` (decorative)
  - Props: `{ lang }`
  - _Requirements: 4.5, 9.3_

- [x] 6. Build `ChainNode.svelte`
  - Create `src/lib/components/process/chain/ChainNode.svelte`
  - Props: `{ label, name, status, statusColor, user, hasForum, onClick, onChatClick, lang }`
  - Render collapsed node showing: stage label, object name, status badge (`role="status"`)
  - Status badge color classes: `green` → `bg-green-100 text-green-800`, `grey` → `bg-gray-100 text-gray-600`, `blue` → `bg-blue-100 text-blue-800`, `yellow` → `bg-yellow-100 text-yellow-800`
  - When `user` is non-null, render profile picture (`<img>`) and username
  - When `hasForum` is true, render a ch at icon `<button>` that calls `onChatClick`; omit when false
  - Root element is a `<button>` with descriptive `aria-label` calling `onClick`
  - _Requirements: 4.1, 4.2, 6.1, 6.3, 6.4_

- [x] 7. Build `AsksNode.svelte`
  - Create `src/lib/components/process/chain/AsksNode.svelte`
  - Props: `{ asks, lang }` where `asks: Array<{ userId, username, forumId }>`
  - Collapsed state: show count badge (number of asks)
  - Expanded state (toggle on click): list each ask's `username` and a forum link/button
  - Use `$state(false)` for `expanded`
  - Root `<button>` with `aria-label` for the count badge
  - _Requirements: 4.3, 4.4_

- [x] 8. Build `ActsGroup.svelte`
  - Create `src/lib/components/process/chain/ActsGroup.svelte`
  - Props: `{ acts, onActClick, lang }`
  - When `acts.length <= 3`: render all act nodes directly
  - When `acts.length > 3`: render first 3 acts + a "show N more" `<button>` (N = total − 3); clicking expands to show all
  - Each act node shows `attributes.shem`, `attributes.status`, and completion indicators (`naasa`, `myIshur`, `valiIshur`)
  - Each act node is a `<button>` calling `onActClick(act)`
  - Use `$state(false)` for `showAll`
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Build `MissionChainRow.svelte`
  - Create `src/lib/components/process/chain/MissionChainRow.svelte`
  - Props: `{ chain, loadedItems, loadingIds, onOpenModal, onOpenActModal, onOpenChat, onLazyLoad, lang }`
  - Render nodes in order: pendm → ChainConnector → open_mission → ChainConnector → AsksNode → ChainConnector → mesimabetahalich → ChainConnector → ActsGroup → ChainConnector → finiapruvals → ChainConnector → finnished_mission/lazy placeholder
  - Skip nodes that are null in the chain (partial chains)
  - For mesimabetahalich: pass `statusColor` as `'green'` when `status === 'active'`, `'grey'` when `status === 'archived'`; pass `user` from `users_permissions_user.data.attributes`; pass `hasForum` from `forums.data.length > 0`
  - For finnished_mission: if `chain.finnishedMissionId` exists and not in `loadedItems`, render a placeholder `<button>` "Load completed mission" / `'טען משימה שהסתיימה'` that calls `onLazyLoad(chain.finnishedMissionId)`; show spinner when ID is in `loadingIds`; render full `ChainNode` once loaded
  - Dispatch correct modal kind on node click: `pendm` → `onOpenModal({ id, kind: 'pendm' })`, `open_mission` → `onOpenModal({ id, kind: 'openM' })`, `mesimabetahalich` → `onOpenModal({ id, kind: 'betha' })`, `finnished_mission` → `onOpenModal({ id, kind: 'done' })`
  - Localized stage labels: pendm = `'Pending Mission'`/`'משימה ממתינה'`, open_mission = `'Open Mission'`/`'משימה פתוחה'`, mesimabetahalich = `'In Progress'`/`'בביצוע'`, finnished_mission = `'Completed'`/`'הושלמה'`
  - _Requirements: 4.1, 4.2, 4.5, 5.1, 5.2, 5.5, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3_

- [x] 10. Build `ResourceChainRow.svelte`
  - Create `src/lib/components/process/chain/ResourceChainRow.svelte`
  - Props: `{ chain, onOpenModal, lang }`
  - Render nodes in order: pmash → ChainConnector → open_mashaabim → ChainConnector → askms (count badge) → ChainConnector → maap → ChainConnector → rikmashes
  - Skip null nodes (partial chains)
  - Localized stage labels per design: `'Pending Resource'`/`'משאב ממתין'`, `'Open Resource'`/`'משאב פתוח'`, `'Offers'`/`'הצעות'`, `'Approval Vote'`/`'הצבעת אישור'`, `'Approved/Completed'`/`'אושר/הושלם'`
  - _Requirements: 3.4, 4.1, 4.5, 9.1_

- [x] 11. Build `ProcessChainView.svelte`
  - Create `src/lib/components/process/ProcessChainView.svelte`
  - Props: `{ pmiData, omiData, bmiData, fmiData, opmash, rikmashes, acts, onOpenModal, onOpenActModal, onOpenChat, lang }`
  - Derive `missionChains` with `$derived(() => reconstructMissionChains(pmiData, omiData, bmiData, fmiData, acts))`
  - Derive `resourceChains` with `$derived(() => reconstructResourceChains(opmash, rikmashes))`
  - Internal state: `loadedItems = $state(new Map())`, `loadingIds = $state(new Set())`
  - Implement `handleLazyLoad(id)`:
    - Guard: if `loadingIds.has(id)` return early
    - Add `id` to `loadingIds`; trigger reactivity with `loadingIds = new Set(loadingIds)`
    - Call `sendToSer({ id }, 'getFinnishedMission', null, null, false, fetch)`
    - On success: update `loadedItems` map with the returned entity; remove from `loadingIds`
    - On failure: call `toast.error(lang === 'he' ? 'שגיאה בטעינת המשימה שהסתיימה' : 'Failed to load completed mission')`; remove from `loadingIds`
  - Root element: `<div dir={lang === 'he' ? 'rtl' : 'ltr'}>`
  - Render "Mission Chains" section heading + one `MissionChainRow` per chain
  - Render "Resource Chains" section heading + one `ResourceChainRow` per chain
  - When both arrays are empty, render localized empty-state: `'לא נמצאו שרשראות תהליך לפרויקט זה'` / `'No process chains found for this project'`
  - Import `toast` from `svelte-sonner` and `sendToSer` from `$lib/send/sendToSer.js`
  - _Requirements: 1.3, 1.4, 1.5, 5.2, 5.3, 5.4, 5.5, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3_

- [x] 12. Wire ProcessChainView into the moach page as tab 13
  - In `src/routes/(reg)/moach/+page.svelte`:
    - Import `ProcessChainView` from `$lib/components/process/ProcessChainView.svelte`
    - Add tab 13 button to the tab navigation bar using the same styling as existing tab buttons; label: `'שרשראות תהליך'` / `'Process Chains'`
    - Add tab 13 content block rendering `<ProcessChainView>` with props: `pmiData`, `omiData`, `bmiData`, `fmiData`, `opmash`, `rikmashes`, `acts={meData.acts.data}`, `onOpenModal`, `onOpenActModal`, `onOpenChat`, `lang={$lang}`
    - Do not modify tab 12 (ProcessBoard) in any way
  - _Requirements: 1.1, 1.2, 8.1, 8.2, 8.3_

- [ ] 13. Checkpoint — Ensure all tests pass
  - Run `npx vitest --run src/lib/utils/reconstructChains.test.js` and confirm all unit and property tests pass
  - Verify the moach page compiles without TypeScript/Svelte errors
  - Ask the user if any questions arise before proceeding

- [ ] 14. Write component-level tests
  - [ ]* 14.1 Write property test — Property 3: Node rendering contains required fields
    - **Property 3: Collapsed node always contains name, stage label, and status badge**
    - Generate arbitrary `ChainNode` props with `fc.record()`; render with `@testing-library/svelte`; assert all three are present in the DOM
    - `// Feature: project-process-view, Property 3`
    - **Validates: Requirements 4.1, 7.2**
  - [ ]* 14.2 Write property test — Property 4: Modal dispatch correctness
    - **Property 4: Clicking a node dispatches the correct modal kind**
    - Generate arbitrary node types; simulate click; assert `onOpenModal` called with correct `kind`
    - `// Feature: project-process-view, Property 4`
    - **Validates: Requirements 4.2, 6.2, 7.3**
  - [ ]* 14.3 Write property test — Property 5: Ask count badge accuracy
    - **Property 5: Ask count badge displays exactly N asks**
    - Generate `fc.array(fc.record(...))` of asks; render `AsksNode`; assert badge text equals array length
    - `// Feature: project-process-view, Property 5`
    - **Validates: Requirements 4.3**
  - [ ]* 14.4 Write property test — Property 6: Chain connector count
    - **Property 6: N visible nodes produce exactly N−1 connectors**
    - Generate chains with varying node counts; render `MissionChainRow`; count connector elements
    - `// Feature: project-process-view, Property 6`
    - **Validates: Requirements 4.5**
  - [ ]* 14.5 Write property test — Property 7: Acts collapse threshold
    - **Property 7: >3 acts shows 3 nodes + "show N more" button**
    - Generate `fc.array(..., { minLength: 4 })` of acts; render `ActsGroup`; assert 3 visible + button with correct N
    - `// Feature: project-process-view, Property 7`
    - **Validates: Requirements 7.4**
  - [ ]* 14.6 Write property test — Property 8: Lazy placeholder presence
    - **Property 8: finnishedMissionId without loaded data renders placeholder, not full node**
    - Generate chains with `finnishedMissionId` set but absent from `loadedItems`; assert placeholder button present and full node absent
    - `// Feature: project-process-view, Property 8`
    - **Validates: Requirements 5.1, 5.6**
  - [ ]* 14.7 Write property test — Property 9: Lazy load replacement
    - **Property 9: After lazy load, placeholder is replaced by full node**
    - Simulate successful `handleLazyLoad`; assert placeholder gone and full node present
    - `// Feature: project-process-view, Property 9`
    - **Validates: Requirements 5.3**
  - [ ]* 14.8 Write property test — Property 10: Mesimabetahalich status badge color
    - **Property 10: active → green badge, archived → grey badge, no other value produces green**
    - Generate arbitrary status strings; render `ChainNode` with `statusColor` derived from status; assert color class
    - `// Feature: project-process-view, Property 10`
    - **Validates: Requirements 6.1**
  - [ ]* 14.9 Write property test — Property 11: Mesimabetahalich user display
    - **Property 11: Non-null user data renders username; null user data renders no username**
    - `// Feature: project-process-view, Property 11`
    - **Validates: Requirements 6.3**
  - [ ]* 14.10 Write property test — Property 12: Forum chat icon presence
    - **Property 12: Non-empty forums.data renders chat icon; empty array renders no chat icon**
    - `// Feature: project-process-view, Property 12`
    - **Validates: Requirements 6.4**
  - [ ]* 14.11 Write property test — Property 13: RTL/LTR layout matches language
    - **Property 13: lang=he → dir=rtl; lang=en → dir=ltr**
    - Generate `fc.constantFrom('he', 'en')`; render `ProcessChainView`; assert root `dir` attribute
    - `// Feature: project-process-view, Property 13`
    - **Validates: Requirements 1.5, 9.3**
  - [ ]* 14.12 Write property test — Property 14: Localized stage labels
    - **Property 14: Every resource chain node stage label is non-empty in both he and en**
    - Generate arbitrary resource chains; render for each language; assert no label is undefined or empty
    - `// Feature: project-process-view, Property 14`
    - **Validates: Requirements 3.4, 9.1**
  - [ ]* 14.13 Write property test — Property 15: Acts ordering within chain
    - **Property 15: DOM order is mesimabetahalich → acts → finiapruvals**
    - Generate chains with all three node types; render `MissionChainRow`; assert DOM position order
    - `// Feature: project-process-view, Property 15`
    - **Validates: Requirements 7.1**
  - _Requirements: 4.1–4.5, 5.1, 5.3, 6.1, 6.3, 6.4, 7.1, 7.4, 9.3_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Run `npx vitest --run` and confirm all tests pass (unit, property, component)
  - Verify no regressions in tab 12 (ProcessBoard)
  - Ask the user if any questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (already in the project's Vitest setup) with a minimum of 100 runs each
- All Svelte components must use Svelte 5 syntax: `$props()`, `$state()`, `$derived()`, `$effect()`, `onclick=` (not `on:click`)
- Toast notifications use `svelte-sonner` — never `alert()`
- The `loadingIds` set must be reassigned (not mutated) to trigger Svelte 5 reactivity: `loadingIds = new Set(loadingIds)`
- The `72createMesimabetahalich` QIDS mutation update (task 3) is a prerequisite for the `open_missions` manyToMany link to be populated on new records; existing records may need backfilling separately
