// Assistant sessions (docs/PLAN_AI_SIGNUP_CONCIERGE.md §8–9). Spread into
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
  shareExpiresAt appliedAt createdAt updatedAt
  user { data { id } }
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

  // Discovery keywords a rikma import writes on the product it just created
  // (createComplexMatanot). Kept apart from 136createMatanot so the field is
  // touched only when there is something to write.
  '371setMatanotDiscoveryKeywords': `mutation SetMatanotDiscoveryKeywords($id: ID!, $discoveryKeywords: String) {
    updateMatanot(id: $id, data: { discoveryKeywords: $discoveryKeywords }) {
      data { id }
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
