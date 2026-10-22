/**
 * What a silence maturation changed (docs/inprogress/PLAN_REALTIME_MIGRATION.md B9).
 *
 * The timegrama handlers write straight to Strapi, outside the Action System, so
 * nothing told an open screen that a vote matured, a split closed or a dormant
 * commitment was released — the members saw it only on their next reload. The
 * dispatcher now reads each clock's rikma along with its target and publishes
 * these scopes once the handler has run, whatever it decided: a re-read of a
 * screen whose clock did not mature costs one query and is never wrong.
 *
 * Pure, so the mapping is pinned by a test.
 */

import { scope, decisionScope, scopeList } from '$lib/realtime/scopes';

/** The field on each clock target that names its rikma (from STRAPI_SCHEMA_REFERENCE). */
export const PROJECT_FIELD: Readonly<Record<string, string>> = {
  ask: 'project',
  askm: 'project',
  askwant: 'project',
  decision: 'projects',
  finiapruval: 'project',
  maap: 'project',
  mesimabetahalich: 'project',
  mashabetahalich: 'project',
  matanot: 'projectcreates',
  pendm: 'project',
  pmash: 'project',
  tosplit: 'project',
  sheirutpend: 'project',
  stipend_payment: 'project',
  roster_period: 'project',
  ratson_proposal: 'project',
  act: 'project'
};

/** The GraphQL selection for one relation of the timegrama query. */
export function relationSelection(field: string): string {
  const pf = PROJECT_FIELD[field];
  if (!pf) return `${field}{data{id}}`;
  const extra = field === 'ratson_proposal' ? ' ratson{data{id}}' : '';
  return `${field}{data{id attributes{ ${pf}{data{id}}${extra} }}}`;
}

const ids = (v: any): string[] => {
  const d = v?.data;
  if (Array.isArray(d)) return d.map((x) => x?.id).filter((x) => x != null).map(String);
  return d?.id != null ? [String(d.id)] : [];
};

/** The scopes a matured clock of `kind` on `target` ({ id, attributes }) changed. */
export function maturedScopes(kind: string, target: { id: string | number; attributes?: any } | null | undefined): string[] {
  if (!target || target.id == null) return [];
  const id = target.id;
  const a = target.attributes ?? {};
  const pf = PROJECT_FIELD[kind];
  const projects = pf ? ids(a[pf]).map((pid) => scope('project', pid)) : [];

  const entity = (() => {
    switch (kind) {
      case 'ask':
      case 'askm':
      case 'pendm':
      case 'pmash':
      case 'finiapruval':
      case 'decision':
      case 'tosplit':
      case 'maap':
        return [decisionScope(kind, id)];
      case 'mesimabetahalich':
        return [scope('mission', id)];
      case 'mashabetahalich':
        return [scope('resource', id)];
      case 'matanot':
        return [scope('product', id)];
      case 'sheirutpend':
        return [scope('deal', id)];
      case 'stipend_payment':
        return [scope('stipend', id)];
      case 'roster_period':
        return [scope('shift', id)];
      case 'ratson_proposal':
        // A wish has no rikma of its own: its parties are resolved from the wish.
        return ids(a.ratson).map((rid) => scope('wish', rid));
      case 'act':
        // A reminder on an automatic act (PLAN_SHOP_OPERATIONS A2).
        return [scope('act', id)];
      default:
        // askwant — a candidacy on a wish's need; the rikma is all a screen can follow.
        return [];
    }
  })();

  return scopeList([...projects, ...entity]);
}
