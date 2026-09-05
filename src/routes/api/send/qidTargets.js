/**
 * What does this qid write, and to which row?
 *
 * Answered by reading the qid's own GraphQL rather than by a hand-kept list, so
 * the two can never drift: rename a variable or retarget a mutation and the
 * derived target follows. Both the ownership guard and the vote-integrity guard
 * key off this.
 *
 * Only `update…(id: $x)` / `delete…(id: $x)` are interesting here — a mutation
 * that creates a row cannot reach someone else's, and one that filters by
 * something other than a primary id is not the IDOR shape.
 */

/** `updateHaluka(id: $halukaId` → op/entity/idVar. */
const TARGETED = /\b(update|delete)([A-Z]\w*)\s*\(\s*id\s*:\s*\$(\w+)/g;

/** `data: { vots: $vots }` — a component list handed over wholesale. */
const COMPONENT_LIST = /\b(\w+)\s*:\s*\$(\w+)\b/g;

/** `$vots: [ComponentProjectsVotsInput]` in the operation's variable list. */
const COMPONENT_LIST_VAR = /\$(\w+)\s*:\s*\[\s*(Component\w+Input)\s*!?\s*\]/g;

/** Strapi's GraphQL query field for an entity is the mutation suffix, lower-initial. */
export function queryFieldFor(entity) {
  return entity.charAt(0).toLowerCase() + entity.slice(1);
}

/**
 * @typedef {Object} QidTarget
 * @property {'update'|'delete'} op
 * @property {string} entity     mutation suffix, e.g. 'Haluka'
 * @property {string} field      GraphQL query field, e.g. 'haluka'
 * @property {string} idVar      the variable carrying the row id
 */

/**
 * Every existing row this qid writes to. Usually one; a qid that updates two
 * entities in one document yields two.
 *
 * @param {string} query
 * @returns {QidTarget[]}
 */
export function targetsOf(query) {
  return [...String(query).matchAll(TARGETED)].map((m) => ({
    op: /** @type {'update'|'delete'} */ (m[1]),
    entity: m[2],
    field: queryFieldFor(m[2]),
    idVar: m[3]
  }));
}

/**
 * Component lists this qid replaces wholesale — `data: { vots: $vots }` where
 * `$vots` is declared as a list of a `Component…Input`.
 *
 * Strapi has no "append" for a repeatable component: the mutation always sends
 * the entire array, so whoever may vote may also drop everyone else's vote.
 * Naming those fields is what lets the vote-integrity guard check that nothing
 * was dropped.
 *
 * @param {string} query
 * @returns {{ field: string, varName: string, inputType: string }[]}
 */
export function componentListsOf(query) {
  const text = String(query);
  /** @type {Map<string, string>} */
  const declared = new Map();
  for (const m of text.matchAll(COMPONENT_LIST_VAR)) declared.set(m[1], m[2]);
  if (declared.size === 0) return [];

  const out = [];
  const seen = new Set();
  for (const m of text.matchAll(COMPONENT_LIST)) {
    const [, field, varName] = m;
    const inputType = declared.get(varName);
    if (!inputType || seen.has(field)) continue;
    seen.add(field);
    out.push({ field, varName, inputType });
  }
  return out;
}
