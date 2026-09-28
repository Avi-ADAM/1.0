// Assistant sessions (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §8–9). Spread into
// `qids` in qids.js; dependency-free for the same reason qids.js is.
//
// Every one of these is serviceAdmin-only in qidsAccess.js. The collection is
// reached solely through the assistant actions (src/lib/server/assistant/),
// which check ownership themselves: a `pending` row belongs to nobody yet and
// `sourceText` is personal, so neither the user role nor an api key may read
// or write it directly. The Authenticated role in Strapi is deliberately left
// without permissions on it (1.0b CLAUDE.md, "a new collection is invisible").

const SESSION_FIELDS = `
  kind status startedVia sourceText lang state revisions version
  shareExpiresAt claimExpiresAt appliedAt createdAt updatedAt
  user { data { id } }
  chezin { data { id } }
  project { data { id attributes { projectName } } }
  ratson { data { id } }
`;

export const assistantQids = {
  '363createAssistantSession': `mutation CreateAssistantSession($data: AssistantSessionInput!) {
    createAssistantSession(data: $data) {
      data { id attributes { ${SESSION_FIELDS} } }
    }
  }`,

  '364getAssistantSession': `query GetAssistantSession($id: ID!) {
    assistantSession(id: $id) {
      data { id attributes { ${SESSION_FIELDS} } }
    }
  }`,

  '365updateAssistantSession': `mutation UpdateAssistantSession($id: ID!, $data: AssistantSessionInput!) {
    updateAssistantSession(id: $id, data: $data) {
      data { id attributes { ${SESSION_FIELDS} } }
    }
  }`,

  // The caller's live sessions of one kind, newest first — "continue where we
  // stopped" for both the site and an agent. `$uid` is taken as given, which
  // is exactly why this is serviceAdmin-only: the action binds it to the
  // authenticated user, never to a param.
  '366findMyAssistantSessions': `query FindMyAssistantSessions($uid: ID!, $kind: String!, $limit: Int = 5) {
    assistantSessions(
      filters: {
        user: { id: { eq: $uid } }
        kind: { eq: $kind }
        status: { in: ["active", "applied"] }
      }
      sort: "updatedAt:desc"
      pagination: { limit: $limit }
    ) {
      data { id attributes { ${SESSION_FIELDS} } }
    }
  }`,

  // The claim (§5.4): pending sessions tied to one signatory row.
  '367findPendingAssistantByChezin': `query FindPendingAssistantByChezin($cid: ID!) {
    assistantSessions(
      filters: { chezin: { id: { eq: $cid } }, status: { eq: "pending" } }
      sort: "createdAt:desc"
      pagination: { limit: 5 }
    ) {
      data { id attributes { ${SESSION_FIELDS} } }
    }
  }`,

  // Cron (§5.4): pending sessions nobody claimed in time.
  '369listExpiredPendingAssistant': `query ListExpiredPendingAssistant($before: DateTime!) {
    assistantSessions(
      filters: { status: { eq: "pending" }, claimExpiresAt: { lt: $before } }
      pagination: { limit: 100 }
    ) {
      data { id }
    }
  }`,

  '380deleteAssistantSession': `mutation DeleteAssistantSession($id: ID!) {
    deleteAssistantSession(id: $id) { data { id } }
  }`,

  // The signatory row the agent-prepared signup just created (§5.4).
  '378getChezinForClaim': `query GetChezinForClaim($id: ID!) {
    chezin(id: $id) { data { id attributes { email createdAt } } }
  }`,

  // The signatory row a signed-in user was created with (register sets it).
  '379getUserChezin': `query GetUserChezin($uid: ID!) {
    usersPermissionsUser(id: $uid) { data { id attributes { chezin { data { id } } } } }
  }`,

  // The profile as it is now — the seed of a profile session (§6.1), and
  // what an apply compares against. By `$uid`, bound by the action to the
  // authenticated user (serviceAdmin-only, never a param a client sets).
  '381getUserProfileForAssistant': `query GetUserProfileForAssistant($uid: ID!) {
    usersPermissionsUser(id: $uid) {
      data { id attributes {
        skills(pagination: { limit: 100 }) { data { id attributes { skillName } } }
        tafkidims(pagination: { limit: 100 }) { data { id attributes { roleDescription } } }
        work_ways(pagination: { limit: 100 }) { data { id attributes { workWayName } } }
        vallues(pagination: { limit: 100 }) { data { id attributes { valueName } } }
        sps(pagination: { limit: 100 }) { data { id attributes { name } } }
        projects_1s(pagination: { limit: 100 }) { data { id } }
      } }
    }
  }`,

  // The rikmas "near" a person (§6.2): values and the skills their members
  // already have. Public facts of each rikma; the scoring is nearbyRikmas.ts.
  '382projectsForNearby': `query ProjectsForNearby($limit: Int = 150) {
    projects(pagination: { limit: $limit }, sort: "updatedAt:desc") {
      data { id attributes {
        projectName
        vallues { data { id attributes { valueName } } }
        user_1s(pagination: { limit: 30 }) { data { id attributes { skills(pagination: { limit: 30 }) { data { id attributes { skillName } } } } } }
      } }
    }
  }`,

  // The profile write of a profile session's apply: the whole list per
  // relation that changed (a relation write replaces it).
  '383setUserProfileRelations': `mutation SetUserProfileRelations($uid: ID!, $data: UsersPermissionsUserInput!) {
    updateUsersPermissionsUser(id: $uid, data: $data) { data { id } }
  }`,

  // 368 (a preview link by shareKey) is gone: Strapi's content API does not
  // filter on a private field, so it never found a row. A preview key is now
  // signed and verified against the row loaded by id (assistant/shareKey.ts).

  // Discovery keywords a rikma import writes on the product it just created
  // (createComplexMatanot). Kept apart from 136createMatanot so the field is
  // touched only when there is something to write.
  '371setMatanotDiscoveryKeywords': `mutation SetMatanotDiscoveryKeywords($id: ID!, $discoveryKeywords: String) {
    updateMatanot(id: $id, data: { discoveryKeywords: $discoveryKeywords }) {
      data { id }
    }
  }`,

  // The platform's product domains, with their names in every locale, so an
  // import links "Events" to the row called "אירועים" (src/lib/assistant/categories.ts).
  // Default locale only at the top: a relation points at the master id.
  '373listCategories': `query ListCategories {
    categories(pagination: { limit: 500 }) {
      data { id attributes { name localizations { data { attributes { name } } } } }
    }
  }`,

  // A domain no row has yet. No `locale:` — created in the default locale,
  // the only one relations see; published, or the relation is invisible.
  '374createCategory': `mutation CreateCategory($name: String!, $publishedAt: DateTime) {
    createCategory(data: { name: $name, publishedAt: $publishedAt }) {
      data { id }
    }
  }`,

  // The domains a rikma import sets on the product it just created
  // (createComplexMatanot), apart from 136createMatanot like 371.
  '375setMatanotCategories': `mutation SetMatanotCategories($id: ID!, $categories: [ID]) {
    updateMatanot(id: $id, data: { categories: $categories }) {
      data { id }
    }
  }`,

  // Open wishes a new supplier's products are scored against
  // (offerNewProductsToWishes). The wish itself never reaches the supplier:
  // only the resulting proposal does, and it lands on the wisher's page.
  '376listOpenWishesForMatching': `query ListOpenWishesForMatching($limit: Int = 150) {
    ratsons(
      filters: { fulfilled: { eq: false }, status_ratson: { in: ["open", "matching"] } }
      sort: ["updatedAt:desc"]
      pagination: { limit: $limit }
    ) {
      data { id attributes {
        lat lng radius isOnline ai_meta
        extracted_missions { name }
        extracted_resources { name }
        categories { data { id attributes { name } } }
        vallues { data { id } }
        users_permissions_users { data { id } }
      } }
    }
  }`,

  // The just-created products of ONE rikma, as matching candidates — the
  // project filter is the ownership check: ids of someone else's products
  // come back empty. Active only: a product still in its vote is not offered.
  '377matanotsForWishOffer': `query MatanotsForWishOffer($ids: [ID], $pid: ID!) {
    matanots(
      filters: {
        id: { in: $ids }
        projectcreates: { id: { eq: $pid } }
        status_of_voting: { eq: "active" }
        archived: { eq: false }
      }
      pagination: { limit: 50 }
    ) {
      data { id attributes {
        name discoveryKeywords price estimatedPrice pricingMode
        lat lng radius
        location { lat lng radius location_mode }
        categories { data { id attributes { name } } }
        projectcreates { data { id attributes {
          projectName
          location { lat lng radius location_mode }
          vallues { data { id } }
        } } }
      } }
    }
  }`,

  // A rikma an import targets: its name (for the partner email) and its members
  // (membership check + whether new rows go to a vote).
  '372assistantProjectContext': `query AssistantProjectContext($pid: ID!) {
    project(id: $pid) {
      data { id attributes { projectName user_1s { data { id } } } }
    }
  }`,

  // A partner named in a rikma import: exact address only (no enumeration),
  // and only the fields the "new suggestion" email needs.
  '370findUserForInvite': `query FindUserForInvite($email: String!) {
    usersPermissionsUsers(filters: { email: { eq: $email } }, pagination: { limit: 1 }) {
      data { id attributes { username email lang noMail } }
    }
  }`
};
