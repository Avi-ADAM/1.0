/**
 * Entity-level ownership for `/api/send` mutations — the "on which row?" layer.
 *
 * `qidsAccess.js` answers *may this kind of principal run this operation*. It
 * says nothing about the row: 114 of the mutations a plain `user` may run take
 * the target id straight from the client, and Strapi enforces nothing on its
 * side (in `1.0b`: 48 empty `lifecycle.js` files and two policies in the whole
 * project). So `updateHaluka(id: $halukaId, data: { ushar: true })` would
 * approve anyone's payout, and `2aSetMoneyReceivers` would decide who gets paid
 * in a rikma the caller has never been part of.
 *
 * ## The rule this layer enforces
 *
 * Not "may you do this", but the far weaker and much safer **"is this row any
 * of your business"**: the caller must either be named on the row itself, or be
 * a member of the rikma the row belongs to. Every legitimate flow already
 * satisfies that; an IDOR does not. Narrower questions — is it your turn, are
 * you the holder, has the vote closed — stay where they already live, in the
 * flows and in the action `authRules`.
 *
 * ## How a rule is written
 *
 * Rules are keyed by **entity**, not by qid, so a new qid against a known
 * entity is covered the moment it is written. The target entity and id variable
 * are derived from the qid's own GraphQL (`qidTargets.js`).
 *
 *   users:    paths to user relations — caller must be one of them
 *   projects: paths to project relations — caller must be a member (`user_1s`)
 *   open:     deliberately unowned, with the reason written down
 *
 * A path may be dotted to reach through a relation:
 * `matanot.projectcreates` walks the recipe row's product, then its rikmas.
 *
 * ## Rollout
 *
 * `enforce: true` blocks. Anything else logs the would-be denial and lets the
 * request through, which is how the money core was promoted ahead of the rest:
 * the entities the audit actually named are enforced now, and the remainder is
 * in shadow until its logs are boring. `SEND_GUARD_MODE` (see `guardMode.js`)
 * is the switch above that.
 */

import { error } from '@sveltejs/kit';
import { getGuardMode } from './guardMode.js';

/** Members of a rikma, as the relation is named on `project`. */
const PROJECT_MEMBERS = 'user_1s';

/**
 * @typedef {Object} OwnershipRule
 * @property {string[]} [users]     dotted paths to user relations on the row
 * @property {string[]} [projects]  dotted paths to project relations on the row
 * @property {string} [open]        reason this entity is deliberately unowned
 * @property {boolean} [enforce]    block (true) or shadow-log (default)
 * @property {string} [note]        why the rule looks the way it does
 */

/** @type {Record<string, OwnershipRule>} */
export const OWNERSHIP = {
  // ── The money core — enforced. These are the rows the audit named. ────────
  haluka: {
    users: ['usersend', 'userrecive'],
    projects: ['project'],
    enforce: true,
    note: 'A payout between two members of one rikma; nobody outside it has business here.'
  },
  tosplit: {
    projects: ['project'],
    enforce: true,
    note: 'The rikma-wide split. Membership is the whole qualification.'
  },
  sale: {
    users: ['users_permissions_user'],
    projects: ['project'],
    enforce: true,
    note: 'Reporter or a member. The holder-claim rules live in the sale flows.'
  },
  sheirut: {
    users: ['users_permissions_users', 'iCanGetMonay', 'iTransferedTo'],
    projects: ['project'],
    enforce: true,
    note: '2aSetMoneyReceivers decides who gets paid — the audit\'s example.'
  },
  sheirutpend: {
    users: ['users_permissions_user'],
    projects: ['project'],
    enforce: true,
    note: 'The customer, or the rikma serving them.'
  },
  siteShareContribution: {
    users: ['users_permissions_user'],
    projects: ['project', 'recive_project'],
    enforce: true
  },
  project: {
    users: [PROJECT_MEMBERS],
    enforce: true,
    note: 'Editing a rikma (details, picture, adding a member) is for its members.'
  },
  usersPermissionsUser: {
    users: ['id'],
    enforce: true,
    note: 'A user row is only ever your own — `id` resolves to the row itself.'
  },

  // ── Rikma objects — shadow until the logs are boring. ─────────────────────
  act: { users: ['my', 'vali'], projects: ['project'] },
  ask: { users: ['users_permissions_user'], projects: ['project'] },
  askm: {
    users: ['users_permissions_user'],
    projects: ['project'],
    note: 'A candidate asking to join is the users_permissions_user and not yet a member.'
  },
  decision: { projects: ['projects'] },
  finiapruval: { users: ['users_permissions_user'], projects: ['project'] },
  finnishedMission: { users: ['users_permissions_user'], projects: ['project'] },
  forum: { projects: ['project'] },
  maap: { projects: ['project'] },
  mashabetahalich: { projects: ['project'] },
  matanot: { projects: ['projectcreates'] },
  matanotRecipeMission: { users: ['assignedMember'], projects: ['matanot.projectcreates'] },
  matanotRecipeResource: { users: ['assignedMember'], projects: ['matanot.projectcreates'] },
  mesimabetahalich: { users: ['users_permissions_user'], projects: ['project'] },
  openMashaabim: { users: ['users'], projects: ['project'] },
  openMission: {
    users: ['users', 'rishon', 'rishonves', 'declined', 'usersNotRelevant'],
    projects: ['project'],
    note: 'Candidates negotiating from outside the rikma appear in one of the user lists.'
  },
  pendm: { users: ['rishon', 'rishonves'], projects: ['project'] },
  pmash: { projects: ['project'] },
  rikmash: { users: ['users_permissions_user'], projects: ['project'] },
  sp: { users: ['users_permissions_user'], projects: ['project'] },
  timer: { users: ['users_permissions_user'], projects: ['project'] },
  welcomTop: { users: ['users_permissions_user'], projects: ['project'] },
  ratsonProposal: { users: ['proposer_users'], projects: ['project'] },
  ratson: { users: ['users_permissions_users'] },
  missionOffer: { users: ['users_permissions_user'] },
  matchSuggestion: {
    users: ['user'],
    enforce: true,
    note: 'A suggestion is addressed to exactly one member; nobody else dismisses it.'
  },
  maagadMember: { users: ['user'] },
  maagadOffer: { users: ['proposer_user'], projects: ['proposer_project'] },

  // ── Meetings ─────────────────────────────────────────────────────────────
  pgisha: {
    users: ['startedBy', 'startRequestedBy'],
    projects: ['project'],
    note: 'Attendance lives on pgishauser rows; the meeting itself is rikma-scoped.'
  },
  pgishauser: { users: ['users_permissions_user'] },
  pgishauserpend: { users: ['users_permissions_user'], projects: ['project'] },

  // ── Deliberately unowned, each with its reason ───────────────────────────
  timegrama: {
    open: 'A countdown carries no owner relation at all. It is reached through the object it times, and that object is guarded.'
  },
  maagad: {
    open: 'A regional pool is public by construction — it has no member or project relation, and joining one is how you get in.'
  },
  position: {
    open: 'Consensus site. Authorship is `authorExternalId`, not a Strapi user; the vote path and the UpdateClause guard already check it.'
  },
  argument: { open: 'Consensus site — see `position`.' },
  clause: { open: 'Consensus site — `UpdateClause` in guards.js checks authorExternalId directly.' }
};

// ── Query building ─────────────────────────────────────────────────────────

/** Wrap a leaf selection in the relation envelope, innermost path segment last. */
function nest(path, leaf) {
  const segments = path.split('.');
  let selection = leaf;
  for (let i = segments.length - 1; i >= 0; i--) {
    selection = `${segments[i]}{data{${i === segments.length - 1 ? selection : `attributes{${selection}}`}}}`;
  }
  return selection;
}

/**
 * One query that fetches everything the rule needs: the row's user relations,
 * and each related rikma's member list. A single round trip per mutation.
 *
 * `id` as a user path is the row itself (a user row), and needs no selection.
 *
 * @param {string} field   GraphQL query field, e.g. 'haluka'
 * @param {OwnershipRule} rule
 * @returns {string | null} the document, or null when the rule needs no lookup
 */
export function buildOwnershipQuery(field, rule) {
  const parts = [];
  for (const path of rule.users ?? []) {
    if (path === 'id') continue;
    parts.push(nest(path, 'id'));
  }
  for (const path of rule.projects ?? []) {
    parts.push(nest(path, `id attributes{${PROJECT_MEMBERS}{data{id}}}`));
  }
  if (parts.length === 0) return null;
  return `query Ownership($id: ID!) { ${field}(id: $id) { data { id attributes { ${parts.join(' ')} } } } }`;
}

// ── Reading the answer back ────────────────────────────────────────────────

/** Follow a dotted path through Strapi's `{data:{attributes:{…}}}` envelopes. */
function walk(node, segments) {
  if (node == null) return [];
  if (segments.length === 0) return [node];
  const [head, ...rest] = segments;
  const data = node[head]?.data;
  if (data == null) return [];
  const rows = Array.isArray(data) ? data : [data];
  if (rest.length === 0) return rows;
  return rows.flatMap((row) => walk(row?.attributes, rest));
}

/**
 * Every user id the row names, plus every member of every rikma it belongs to.
 *
 * @param {any} attributes  the row's `data.attributes`
 * @param {string} rowId    the row's own id (for the `id` self-path)
 * @param {OwnershipRule} rule
 * @returns {Set<string>}
 */
export function collectPrincipals(attributes, rowId, rule) {
  const ids = new Set();
  for (const path of rule.users ?? []) {
    if (path === 'id') {
      if (rowId != null) ids.add(String(rowId));
      continue;
    }
    for (const row of walk(attributes, path.split('.'))) {
      if (row?.id != null) ids.add(String(row.id));
    }
  }
  for (const path of rule.projects ?? []) {
    for (const project of walk(attributes, path.split('.'))) {
      for (const member of project?.attributes?.[PROJECT_MEMBERS]?.data ?? []) {
        if (member?.id != null) ids.add(String(member.id));
      }
    }
  }
  return ids;
}

// ── The guard ──────────────────────────────────────────────────────────────

/**
 * May this caller write to the rows this qid targets?
 *
 * Service principals are not checked: they already proved they are the server.
 * A qid whose entity has no rule is *not* silently allowed — it is reported, and
 * `ownership.test.ts` fails the build for it, which is what keeps this manifest
 * complete as qids are added.
 *
 * @param {Object} ctx
 * @param {string} ctx.queId
 * @param {boolean} ctx.isSer
 * @param {string} [ctx.callerId]          verified caller (locals.uid)
 * @param {Record<string, any>} ctx.variablesObject
 * @param {string} ctx.bearer1
 * @param {string} ctx.ep
 * @param {typeof globalThis.fetch} [ctx.fetch]
 * @param {import('./qidTargets.js').QidTarget[]} ctx.targets
 * @param {import('./guardMode.js').GuardMode} [ctx.mode]
 */
export async function enforceOwnership(ctx) {
  const { queId, isSer, callerId, variablesObject, bearer1, ep, targets } = ctx;
  if (isSer) return;
  if (targets.length === 0) return;

  const mode = ctx.mode ?? getGuardMode();
  if (mode === 'off') return;

  const doFetch = ctx.fetch || fetch;

  for (const target of targets) {
    const rule = OWNERSHIP[target.field];
    if (!rule) {
      // Unclassified: loud, but never a 500 for a user — the CI test is where
      // this is supposed to hurt.
      console.error(
        `[ownership] no rule for ${target.field} (qid ${queId}) — add one to ownership.js`
      );
      continue;
    }
    if (rule.open) continue;

    const id = variablesObject[target.idVar];
    if (id == null || id === '') continue; // nothing addressed; Strapi will complain

    const query = buildOwnershipQuery(target.field, rule);
    if (!query) {
      // Nothing to look up — the rule is satisfied by the addressed id alone
      // (a user row is only ever your own). Decide here rather than falling
      // through, or `updateUsersPermissionsUser($userId)` would go unguarded.
      const selfOnly = collectPrincipals({}, id, rule);
      if (callerId && selfOnly.has(String(callerId))) continue;
      if (rule.enforce && mode === 'enforce') {
        throw error(403, `Forbidden: not a party to this ${target.field}`);
      }
      console.warn(
        `[ownership-shadow] ${queId}: uid=${callerId ?? '-'} addressed ${target.field} ${id}`
      );
      continue;
    }

    let body;
    try {
      const res = await doFetch(ep, {
        method: 'POST',
        body: JSON.stringify({ query, variables: { id: String(id) } }),
        headers: { 'Content-Type': 'application/json', Authorization: bearer1 }
      });
      body = await res.json();
    } catch (e) {
      // Cannot establish ownership ⇒ cannot allow the write.
      throw error(503, `Could not verify ownership of ${target.field}`);
    }

    const row = body?.data?.[target.field]?.data;
    if (!row) {
      // Missing, or invisible to this caller's own token. Either way it is not
      // theirs to write, and 404 says no more than that.
      if (rule.enforce && mode === 'enforce') throw error(404, `${target.field} not found`);
      console.warn(`[ownership-shadow] ${queId}: ${target.field} ${id} not readable by ${callerId ?? '-'}`);
      continue;
    }

    const allowed = collectPrincipals(row.attributes, row.id, rule);
    if (callerId && allowed.has(String(callerId))) continue;

    if (allowed.size === 0) {
      // The row names nobody at all — an unpopulated relation, not an intruder.
      // Blocking here would break a legitimate flow over a data gap, and it
      // would not close anything: the rows this guard exists for all have
      // owners. Loud, so the gap gets fixed.
      console.warn(
        `[ownership] ${queId}: ${target.field} ${id} has no owner relations set — allowing`
      );
      continue;
    }

    if (rule.enforce && mode === 'enforce') {
      throw error(403, `Forbidden: not a party to this ${target.field}`);
    }
    console.warn(
      `[ownership-shadow] ${queId}: uid=${callerId ?? '-'} is not a party to ` +
        `${target.field} ${id} (allowed: ${[...allowed].join(',') || 'none'})`
    );
  }
}
