# Requirements Document

## Introduction

The moach (project brain) page already displays many project objects — pending missions, open missions, missions in progress, finished missions, resources, acts, and more — across various tabs (Kanban, calendar, ProcessBoard, etc.). This feature adds a new **"Process Chains" view** (tab 13) that organizes these existing objects into visual lifecycle chains, showing the full journey of a mission or resource from initial proposal to completion.

Two chain types are supported:

- **Mission Process Chain**: pendm → open_mission → asks/requests → mesimabetahalich  acts → finiapruvals  → finnished_mission
- **Resource Process Chain**: pmashes (pending) → open_mashaabim (open) → offers (askm)  →  appruval vote (maap) →   approved completed  (rikmash) 

All data is already fetched in the moach page load. Probably No new backend entities are required. Archived items (e.g., finished missions, archived tasks) are loaded lazily only when the user explicitly expands them. The existing `ProcessBoard` component (tab 12) is preserved as-is; this new view complements it.

---

## Glossary

- **Moach_Page**: The project management page at `src/routes/(reg)/moach/+page.svelte` that serves as the central hub for a project (ריקמה/FreeMate).
- **Process_Chain_View**: The new Svelte component (`ProcessChainView.svelte`) that renders mission and resource lifecycle chains.
- **Mission_Chain**: A visual sequence of linked objects representing the full lifecycle of a single mission: pendm → open_mission → asks/requests → mesimabetahalich → acts → finiapruvals → finnished_mission.
- **Resource_Chain**: A visual sequence of linked objects representing the full lifecycle of a single resource: pmashes (pending) → open_mashaabim (open) → offers (askm) → approval vote (maap) → approved completed (rikmash).
- **Chain_Node**: A single step/object within a chain (e.g., one pendm, one open_mission, one mesimabetahalich).
- **Chain_Link**: The visual connector between two adjacent Chain_Nodes.
- **Pendm**: A pending mission proposal (`pendms` collection in Strapi). The first step of a Mission_Chain.
- **Open_Mission**: A published/open mission (`open_missions` collection). The second step of a Mission_Chain.
- **Ask**: A request submitted by a candidate to perform an Open_Mission. Stored as `users` array on the pendm/open_mission. Displayed as a count node that expands to show individual asks.
- **Mesimabetahalich**: A task in progress (`mesimabetahaliches` collection). The chosen candidate's execution of a mission. Has a `status` field (active/archived) and `forums` for chat.
- **Act**: A linked task/todo (`acts` collection) associated with a mission or mesimabetahalich. Displayed as a sub-chain node.
- **Finnished_Mission**: A completed and archived mission record (`finnished_missions` collection). The final step of a Mission_Chain.
- **Finiapruvals**: The approval/finalization step in a Mission_Chain — the request(s) to approve the hours/work done before archiving as a Finnished_Mission. Corresponds to `tosplits` or similar approval objects.
- **Open_Mashaabim**: A resource request (`open_mashaabims` collection). Can be pending or open depending on its state.
- **Pmashes**: The pending resource proposal — the first step of a Resource_Chain. Refers to `open_mashaabims` in a pending state.
- **Askm**: Offers/requests received for a resource — the third step of a Resource_Chain. Analogous to asks on missions but for resources.
- **Maap**: The approval vote step in a Resource_Chain — the vote to accept/approve the resource offer.
- **Rikmash**: An approved or completed resource (`rikmashes` collection). The final step of a Resource_Chain.
- **Lazy_Load**: Fetching data from the server only when the user explicitly requests it (e.g., by expanding a collapsed node), rather than on initial page load.
- **Progressive_Disclosure**: Showing minimal information (name, status badge) by default, with full details available on user interaction (click/expand).
- **Existing_Modal**: One of the already-built modal components: `PendsM`, `OpenM`, `Betaha`, `Finisin`, `TaskModal` — reused to display full details.
- **ProcessBoard**: The existing complex process management component in tab 12. It is not modified by this feature.
- **Chain_Reconstructor**: The client-side logic that uses existing fetched data and inter-object links (e.g., `open_mission.rishon`, `act.pendm`, `act.open_mission`, `mesimabetahalich` references) to group objects into Mission_Chains and Resource_Chains.

---

## Requirements

### Requirement 1: Process Chains Tab

**User Story:** As a project member, I want a dedicated "Process Chains" tab in the moach page, so that I can see all mission and resource lifecycles organized as visual chains in one place.

#### Acceptance Criteria

1. THE Moach_Page SHALL display a "Process Chains" tab button (tab 13) in the existing tab navigation bar, using the same styling as other tab buttons.
2. WHEN the user clicks the "Process Chains" tab button, THE Moach_Page SHALL render the Process_Chain_View component in the tab content area.
3. THE Process_Chain_View SHALL display Mission_Chains and Resource_Chains in separate labeled sections.
4. WHEN no chains can be reconstructed from the available data, THE Process_Chain_View SHALL display a localized empty-state message in both Hebrew and English.
5. THE Process_Chain_View SHALL support right-to-left layout when `$lang == 'he'` and left-to-right layout when `$lang == 'en'`, consistent with the rest of the moach page.

---

### Requirement 2: Mission Chain Reconstruction

**User Story:** As a project member, I want the system to automatically group related mission objects into chains, so that I can see the full lifecycle of each mission without manually connecting the pieces.

#### Acceptance Criteria

1. THE Chain_Reconstructor SHALL group objects into Mission_Chains using the existing link fields already present in the fetched data: `act.pendm.data.id`, `act.open_mission.data.id`, `open_mission.rishon.data.id` (links to pendm), and `mesimabetahalich` references on acts.
2. WHEN a pendm has a corresponding open_mission (linked via `open_mission.rishon`), THE Chain_Reconstructor SHALL place them as consecutive nodes in the same Mission_Chain.
3. THE Chain_Reconstructor SHALL include all acts whose `pendm` or `open_mission` reference matches the chain's pendm or open_mission as Act nodes within that Mission_Chain.
4. THE Chain_Reconstructor SHALL include the mesimabetahalich linked to the chain's open_mission or acts as the execution node of that Mission_Chain.
5. WHEN a finnished_mission references a mesimabetahalich that belongs to a chain, THE Chain_Reconstructor SHALL append it as the final node of that Mission_Chain.
6. WHEN an object cannot be linked to any existing chain, THE Chain_Reconstructor SHALL create a new partial Mission_Chain starting from that object.
7. THE Chain_Reconstructor SHALL operate entirely on client-side data already loaded in the moach page, without making additional network requests during reconstruction.

---

### Requirement 3: Resource Chain Reconstruction

**User Story:** As a project member, I want resource objects grouped into lifecycle chains, so that I can track each resource from proposal to completion.

#### Acceptance Criteria

1. THE Chain_Reconstructor SHALL group open_mashaabim objects and rikmash objects into Resource_Chains using available link fields (`rikmash.sp` references the open_mashaabim it originated from).
2. WHEN a rikmash has an `sp` field referencing an open_mashaabim, THE Chain_Reconstructor SHALL place the open_mashaabim as the first node and the rikmash as a later node in the same Resource_Chain.
3. WHEN an open_mashaabim has no linked rikmash, THE Chain_Reconstructor SHALL display it as a partial Resource_Chain showing only the available nodes.
4. THE Chain_Reconstructor SHALL label each Resource_Chain node with its stage name: "Pending Resource (pmashes)", "Open Resource", "Offers (askm)", "Approval Vote (maap)", or "Approved/Completed (rikmash)", localized in Hebrew and English.

---

### Requirement 4: Chain Node Display — Progressive Disclosure

**User Story:** As a project member, I want each chain node to show minimal information by default and reveal full details on demand, so that the chain view stays readable without overwhelming me.

#### Acceptance Criteria

1. THE Process_Chain_View SHALL display each Chain_Node in its collapsed state by default, showing only: the object's name, its stage label, and a status badge (e.g., active, archived, pending).
2. WHEN the user clicks a Chain_Node, THE Process_Chain_View SHALL open the corresponding Existing_Modal for that object type: `PendsM` for pendm nodes, `OpenM` for open_mission nodes, `Betaha` for mesimabetahalich nodes, `Finisin` for finnished_mission nodes, and `TaskModal` for act nodes.
3. THE Process_Chain_View SHALL display the Ask count node showing the total number of asks/requests for a mission as a number badge, collapsed by default.
4. WHEN the user clicks the Ask count node, THE Process_Chain_View SHALL expand it inline to show each ask's submitter name and associated forum ID for chat access.
5. THE Process_Chain_View SHALL display a Chain_Link visual connector (arrow or line) between each pair of adjacent Chain_Nodes to indicate the flow direction.

---

### Requirement 5: Lazy Loading of Archived Items

**User Story:** As a project member, I want archived items (finished missions, archived tasks) to load only when I explicitly request them, so that the initial page load stays fast.

#### Acceptance Criteria

1. THE Process_Chain_View SHALL display a placeholder node for finnished_mission items that are not yet loaded, showing a "Load completed mission" button instead of the full node.
2. WHEN the user clicks the "Load completed mission" button on a placeholder node, THE Process_Chain_View SHALL fetch the finnished_mission data via a GraphQL query using the existing `sendToSer` utility and the project's auth token.
3. WHEN the lazy-loaded finnished_mission data is received, THE Process_Chain_View SHALL replace the placeholder node with the full Chain_Node displaying the mission's name and completion details.
4. IF the lazy-load request fails, THEN THE Process_Chain_View SHALL display a localized error message using `toast.error()` from `svelte-sonner` and restore the "Load completed mission" button.
5. WHILE a lazy-load request is in progress, THE Process_Chain_View SHALL display a loading indicator on the placeholder node and disable the load button to prevent duplicate requests.
6. THE Process_Chain_View SHALL apply the same lazy-load pattern to archived mesimabetahalich items (those with `status: 'archived'` not included in the default `finnished: false` filter).

---

### Requirement 6: Mesimabetahalich Node Display

**User Story:** As a project member, I want to see the execution status of a task-in-progress node at a glance, so that I can quickly assess whether work is active or stalled.

#### Acceptance Criteria

1. THE Process_Chain_View SHALL display the mesimabetahalich Chain_Node with a status badge showing "active" (green) when `status` is active, and "archived" (grey) when `status` is archived.
2. WHEN the user clicks the mesimabetahalich Chain_Node, THE Process_Chain_View SHALL open the `Betaha` modal passing the mesimabetahalich's `id` as the `who` prop and the full `bmiData` array.
3. THE Process_Chain_View SHALL display the assigned user's profile picture and username on the mesimabetahalich Chain_Node when `users_permissions_user` data is available.
4. WHEN a mesimabetahalich has an associated forum (non-empty `forums.data` array), THE Process_Chain_View SHALL display a chat icon on the node that opens the forum chat when clicked, using the existing `openChat` pattern from the moach page.

---

### Requirement 7: Acts (מטלות) as Chain Nodes

**User Story:** As a project member, I want acts linked to a mission to appear as nodes within the chain, so that I can see all related tasks as part of the same lifecycle.

#### Acceptance Criteria

1. THE Process_Chain_View SHALL display acts linked to a Mission_Chain as Act nodes positioned after the mesimabetahalich node and before the finiapruvals node.
2. THE Process_Chain_View SHALL show each Act node with its `shem` (name), `status`, and completion indicators (`naasa`, `myIshur`, `valiIshur`).
3. WHEN the user clicks an Act node, THE Process_Chain_View SHALL open the `TaskModal` component with the full act data, reusing the `openActModal` function pattern from the moach page.
4. WHEN a Mission_Chain has more than 3 acts, THE Process_Chain_View SHALL collapse the act list to show only the first 3 with a "show N more" button, expanding to show all acts when clicked.

---

### Requirement 8: Coexistence with Existing ProcessBoard

**User Story:** As a project member, I want the new Process Chains view to coexist with the existing ProcessBoard (tab 12) without replacing or breaking it, so that I can use both views depending on my needs.

#### Acceptance Criteria

1. THE Moach_Page SHALL preserve the existing tab 12 (ProcessBoard) unchanged, with its existing label and behavior.
2. THE Process_Chain_View SHALL be rendered exclusively in tab 13 and SHALL NOT modify any state used by the ProcessBoard component.
3. THE Process_Chain_View SHALL read data from the same reactive state variables already present in the moach page (`pmiData`, `omiData`, `bmiData`, `fmiData`, `opmash`, `rikmashes`, `meData.acts.data`) without duplicating or re-fetching them on tab switch.
4. WHEN the user switches away from tab 13 and back, THE Process_Chain_View SHALL re-render with the same data without triggering additional network requests.

---

### Requirement 9: Localization

**User Story:** As a project member using the app in Hebrew or English, I want all Process Chain UI text to appear in my selected language, so that the feature feels native to my language preference.

#### Acceptance Criteria

1. THE Process_Chain_View SHALL display all stage labels, button text, status badges, and empty-state messages in Hebrew when `$lang == 'he'` and in English when `$lang == 'en'`.
2. THE Process_Chain_View SHALL use the `$lang` store from `$lib/stores/lang.js` for all language-conditional rendering, consistent with the rest of the moach page.
3. THE Process_Chain_View SHALL apply `dir="rtl"` to its root element when `$lang == 'he'` and `dir="ltr"` when `$lang == 'en'`.
