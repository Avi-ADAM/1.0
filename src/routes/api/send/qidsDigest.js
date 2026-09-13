// Daily digest queries (docs/PLAN_DAILY_DIGEST.md §3.5). Spread into `qids` in
// qids.js; kept dependency-free for the same reason qids.js is (the scripts
// import it under plain node).
//
// **Every read comes in two doors, and the variable name is the door.**
// /api/send rebinds `$idL` to the signed-in user on every call — service calls
// included — so a `$idL` query can only ever answer "me": it is safe to open to
// `user`, and useless to a cron job, which has no session and gets the
// variable dropped. The digest run needs "this user", so each read also has a
// `$uid` twin that takes the id as given — and those are `serviceAdmin` only in
// qidsAccess.js, because a `$uid` query open to `user` is an IDOR.
//
//   hub (signed-in user) → 340 / 341 / 342        + 85levHubSummary
//   /api/digest (cron)   → 343 / 344 / 345 / 346  + 347digestHubSummaryFor
//
// 347 is 85 with `$idL` → `$uid`, built in qids.js so the vote logic reads one
// query text, never two copies that drift.

const NOT_ARCHIVED = `{ or: [{ lifecycle: { null: true } }, { lifecycle: { ne: "archived" } }] }`;

/** Count-only read: the total rides on meta.pagination, no rows come back. */
const COUNT_ONLY = `pagination: { page: 1, pageSize: 1 }) { meta { pagination { total } } }`;

/**
 * Missions the user carries (the `85levHubSummary` filter) with what §4.2–4.3
 * need to say something about them: acts not yet done, the running timer, and
 * the dormancy clock (`timegramas` whatami=mesimabetahalich, see
 * src/lib/server/archive/dormancyClock.ts).
 *
 * @param {string} v GraphQL variable carrying the user id
 * @param {boolean} contact also select the delivery fields (service twin only)
 */
const WORK = (v, contact) => `
  usersPermissionsUser(id: ${v}) {
    data {
      id
      attributes {
        username
        ${contact ? 'email lang telegramId noMail blocked machshirs { data { id } }' : ''}
        mesimabetahaliches(
          filters: { and: [ { forappruval: { eq: false }, finnished: { eq: false } }, ${NOT_ARCHIVED} ] }
          pagination: { limit: 100 }
        ) {
          data {
            id
            attributes {
              name
              howmanyhoursalready
              dormancyDays
              project { data { id attributes { projectName dormancyDays } } }
              activeTimer { data { id attributes { isActive } } }
              timegramas(filters: { whatami: { eq: "mesimabetahalich" }, done: { ne: true } }) {
                data { id attributes { date } }
              }
              acts(
                filters: { or: [{ naasa: { null: true } }, { naasa: { eq: false } }] }
                pagination: { limit: 100 }
              ) {
                data { id attributes { shem naasa dateF } }
              }
            }
          }
        }
      }
    }
  }`;

/**
 * Live match suggestions — 209/212's filter minus the ones already applied to
 * (an application is no longer a suggestion). Top 3 of each kind by score, and
 * a count of the ones the user has not opened (`new` / `notified`).
 *
 * @param {string} v
 */
const SUGGESTIONS = (v) => {
  /** @param {'mission'|'resource'} kind @param {string} status */
  const filters = (kind, status) => {
    const rel = kind === 'mission' ? 'open_mission' : 'open_mashaabim';
    return `filters: { and: [
      { user: { id: { eq: ${v} } } },
      ${status},
      { kind: { eq: "${kind}" } },
      { ${rel}: { archived: { eq: false } } },
      { or: [{ ${rel}: { lifecycle: { null: true } } }, { ${rel}: { lifecycle: { ne: "archived" } } }] }
    ] }`;
  };
  const live = `{ status: { notIn: ["dismissed", "dateBlocked", "applied"] } }`;
  const fresh = `{ status: { in: ["new", "notified"] } }`;
  /** @param {'open_mission'|'open_mashaabim'} rel */
  const top = (rel) => `pagination: { page: 1, pageSize: 3 }
    sort: "score:desc"
  ) {
    meta { pagination { total } }
    data { id attributes { score ${rel} { data { id attributes {
      name project { data { id attributes { projectName } } }
    } } } } }
  }`;
  return `
  missionSuggestions: matchSuggestions(${filters('mission', live)} ${top('open_mission')}
  resourceSuggestions: matchSuggestions(${filters('resource', live)} ${top('open_mashaabim')}
  freshMissionSuggestions: matchSuggestions(${filters('mission', fresh)} ${COUNT_ONLY}
  freshResourceSuggestions: matchSuggestions(${filters('resource', fresh)} ${COUNT_ONLY}`;
};

/**
 * What appeared in the user's rikmot since `$since` — counts only (§4.4).
 *
 * Self-nominations are left out of new missions: a candidacy surfaces as a
 * vote, and counting it twice would inflate both lines. Sales count only when
 * effective — self-reported (or null-legacy) when created, or confirmed by the
 * holder inside the window. An `open` claim is someone else's money before
 * they agreed (PLAN_sale_holder_consent), and never reaches a digest.
 *
 * @param {string} v
 */
const WHATS_NEW = (v) => `
  newMissions: openMissions(filters: { and: [
    { project: { user_1s: { id: { eq: ${v} } } } },
    { createdAt: { gt: $since } },
    { archived: { eq: false } },
    { or: [{ source: { null: true } }, { source: { ne: "selfNomination" } }] },
    ${NOT_ARCHIVED}
  ] } ${COUNT_ONLY}
  newResources: openMashaabims(filters: { and: [
    { project: { user_1s: { id: { eq: ${v} } } } },
    { createdAt: { gt: $since } },
    { archived: { eq: false } },
    ${NOT_ARCHIVED}
  ] } ${COUNT_ONLY}
  newProducts: matanots(filters: { and: [
    { projectcreates: { user_1s: { id: { eq: ${v} } } } },
    { createdAt: { gt: $since } },
    { or: [{ archived: { eq: false } }, { archived: { null: true } }] },
    ${NOT_ARCHIVED}
  ] } ${COUNT_ONLY}
  newSales: sales(filters: { and: [
    { project: { user_1s: { id: { eq: ${v} } } } },
    { or: [
      { and: [
        { createdAt: { gt: $since } },
        { or: [{ holderStatus: { null: true } }, { holderStatus: { eq: "self" } }] }
      ] },
      { and: [
        { holderStatus: { eq: "confirmed" } },
        { holderDecidedAt: { gt: $since } }
      ] }
    ] }
  ] } ${COUNT_ONLY}`;

/**
 * Turn a session-bound (`$idL`) query into its service twin (`$uid`).
 * @param {string} query
 * @param {string} name new operation name
 */
export function serviceTwin(query, name) {
  return query.replace(/^(\s*query\s+)\w+/, `$1${name}`).replace(/\$idL\b/g, '$uid');
}

export const digestQids = {
  // ── The hub's brief (signed-in user; `$idL` is rebound to the session) ──
  '340digestWork': `query DigestWork($idL: ID!) {${WORK('$idL', false)}
  }`,

  '341digestSuggestions': `query DigestSuggestions($idL: ID!) {${SUGGESTIONS('$idL')}
  }`,

  '342digestWhatsNew': `query DigestWhatsNew($idL: ID!, $since: DateTime!) {${WHATS_NEW('$idL')}
  }`,

  // ── The digest run (/api/digest, service token; serviceAdmin only) ──
  '343digestWorkFor': `query DigestWorkFor($uid: ID!) {${WORK('$uid', true)}
  }`,

  '344digestSuggestionsFor': `query DigestSuggestionsFor($uid: ID!) {${SUGGESTIONS('$uid')}
  }`,

  '345digestWhatsNewFor': `query DigestWhatsNewFor($uid: ID!, $since: DateTime!) {${WHATS_NEW('$uid')}
  }`,

  // Who gets a digest: members of at least one rikma (§11 Q2 — a user with no
  // rikma always gets an empty one), not blocked. Ids only, one page at a time:
  // this is by definition an enumeration of the site's users, so it carries
  // nothing but the id, and contact fields are read per user by 343.
  '346digestAudience': `query DigestAudience($page: Int = 1, $pageSize: Int = 50) {
    usersPermissionsUsers(
      filters: { and: [
        { projects_1s: { id: { notNull: true } } },
        { or: [{ blocked: { null: true } }, { blocked: { eq: false } }] }
      ] }
      pagination: { page: $page, pageSize: $pageSize }
      sort: "id:asc"
    ) {
      data { id }
      meta { pagination { page pageSize pageCount total } }
    }
  }`
};
