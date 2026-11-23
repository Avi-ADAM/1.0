// Rikma playbooks — the written "how we work here" (docs/tbd/PLAN_AGENT_WORK.md, AW2).
// Spread into `qids` in qids.js; dependency-free for the same reason qids.js is
// (the scripts import it under plain node).
//
// A playbook is a `space-doc` of kind `playbook` (body + optional tafkidim),
// and it changes only through a `kind: playbook` Decision. Every one of these
// is `serviceAdmin` in qidsAccess.js: they run inside the playbook action and
// the MCP tools after a membership check, and the Decision writes link a
// space-doc of a rikma — a direct call could otherwise rewrite another rikma's
// playbook by id. Needs 1.0b with the playbook fields.

const DOC_FIELDS = `
  name body kind archived createdAt updatedAt
  project { data { id } }
  tafkidim { data { id attributes { roleDescription } } }
  uploadedBy { data { id attributes { username } } }
`;

export const playbookQids = {
  playbooksOfProject: `query PlaybooksOfProject($pid: ID!) {
    spaceDocs(
      filters: { and: [
        { project: { id: { eq: $pid } } },
        { kind: { eq: "playbook" } },
        { or: [{ archived: { null: true } }, { archived: { eq: false } }] }
      ] }
      sort: "updatedAt:desc"
      pagination: { limit: 60 }
    ) { data { id attributes { ${DOC_FIELDS} } } }
  }`,

  playbookOpenDecisions: `query PlaybookOpenDecisions($pid: ID!) {
    decisions(
      filters: { and: [
        { projects: { id: { eq: $pid } } },
        { kind: { eq: "playbook" } },
        { or: [{ archived: { null: true } }, { archived: { eq: false } }] }
      ] }
      sort: "createdAt:desc"
      pagination: { limit: 40 }
    ) { data { id attributes {
      decisionName newPlaybook createdAt
      playbookDoc { data { id } }
      playbookRole { data { id attributes { roleDescription } } }
      timegrama { data { id attributes { date done } } }
      vots { what users_permissions_user { data { id } } }
    } } }
  }`,

  playbookDecision: `query PlaybookDecision($id: ID!) {
    decision(id: $id) { data { id attributes {
      kind archived decisionName newPlaybook createdAt
      projects { data { id } }
      playbookDoc { data { id attributes { ${DOC_FIELDS} } } }
      playbookRole { data { id attributes { roleDescription } } }
      vots { what users_permissions_user { data { id } } }
    } } }
  }`,

  playbookCreate: `mutation PlaybookCreate($data: SpaceDocInput!) {
    createSpaceDoc(data: $data) { data { id } }
  }`,

  playbookUpdate: `mutation PlaybookUpdate($id: ID!, $data: SpaceDocInput!) {
    updateSpaceDoc(id: $id, data: $data) { data { id } }
  }`,

  playbookDecisionCreate: `mutation PlaybookDecisionCreate(
    $projectIds: [ID]
    $publishedAt: DateTime
    $decisionName: String
    $newPlaybook: String
    $playbookDoc: ID
    $playbookRole: ID
    $vots: [ComponentProjectsVotsInput]
  ) {
    createDecision(data: {
      projects: $projectIds
      publishedAt: $publishedAt
      decisionName: $decisionName
      kind: playbook
      newPlaybook: $newPlaybook
      playbookDoc: $playbookDoc
      playbookRole: $playbookRole
      vots: $vots
    }) { data { id } }
  }`,

  playbookDecisionArchive: `mutation PlaybookDecisionArchive($id: ID!) {
    updateDecision(id: $id, data: { archived: true }) { data { id } }
  }`
};
