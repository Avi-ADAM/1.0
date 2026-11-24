// Lev Growth Agent — the prospect pipeline in Strapi (`api::growth-prospect`,
// docs/inprogress/PLAN_GROWTH_AGENT.md §10.1). Spread into `qids` in qids.js;
// dependency-free for the same reason qids.js is (the scripts import it under
// plain node).
//
// Every one is `serviceAdmin` in qidsAccess.js: a prospect holds a business's
// phone and email, and only the growth actions — after the operator check —
// read or write it (src/lib/server/growth/strapiRepo.ts). `uid` is the app's own
// prospect id, the one /growth/b/[id] carries; Strapi's numeric id stays inside
// the repository.

const PROSPECT_FIELDS = `uid name website email phone country city region category size notes lang
        stage furthest stageChangedAt followUpAt nextAction createdByUid openedAt createdAt updatedAt
        services keywords sources fieldSources dedupeKeys research profile outreach onboarding activity`;

export const growthQids = {
  // Is the collection deployed? A missing type fails validation; an empty table answers [].
  'growthProspectsSchema': `query GrowthProspectsSchema {
    growthProspects(pagination: { limit: 1 }) { data { id } }
  }`,

  // One page of the whole pipeline. The repository walks the pages.
  'growthProspects': `query GrowthProspects($start: Int!, $limit: Int!) {
    growthProspects(sort: ["id:asc"], pagination: { start: $start, limit: $limit }) {
      data { id attributes { ${PROSPECT_FIELDS} } }
    }
  }`,

  'growthProspectByUid': `query GrowthProspectByUid($uid: String!) {
    growthProspects(filters: { uid: { eq: $uid } }, pagination: { limit: 1 }) {
      data { id attributes { ${PROSPECT_FIELDS} } }
    }
  }`,

  // Every stored identity hash, for the duplicate check — nothing else.
  'growthProspectKeys': `query GrowthProspectKeys($start: Int!, $limit: Int!) {
    growthProspects(sort: ["id:asc"], pagination: { start: $start, limit: $limit }) {
      data { id attributes { dedupeKeys } }
    }
  }`,

  'growthProspectCreate': `mutation GrowthProspectCreate($data: GrowthProspectInput!) {
    createGrowthProspect(data: $data) { data { id } }
  }`,

  'growthProspectUpdate': `mutation GrowthProspectUpdate($id: ID!, $data: GrowthProspectInput!) {
    updateGrowthProspect(id: $id, data: $data) { data { id } }
  }`,

  // Customer demand (§9.2, §10.3): open concierge wishes since $since, one page
  // at a time. Only what a count needs — never the name, text, author or
  // coordinates of a wish; server/growth/demand.ts reduces it to counts.
  'growthDemandWishes': `query GrowthDemandWishes($since: DateTime!, $start: Int!, $limit: Int!) {
    ratsons(
      filters: {
        # A bare ne excludes NULL rows in SQL; most wishes never set fulfilled.
        or: [{ fulfilled: { null: true } }, { fulfilled: { eq: false } }]
        status_ratson: { in: ["open", "matching", "negotiating"] }
        createdAt: { gte: $since }
      }
      sort: ["id:asc"]
      pagination: { start: $start, limit: $limit }
    ) {
      data {
        id
        attributes {
          createdAt
          isOnline
          location_hint
          location { location_hint }
          sub_category
          aggregation_opt_out
          categories { data { attributes { name } } }
          ratson_proposals(pagination: { limit: 1 }) { data { id } }
        }
      }
    }
  }`
};
