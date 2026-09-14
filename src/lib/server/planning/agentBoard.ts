/**
 * Rows an agent already structured (PLAN_PROJECT_PLANNING_BOARDS §7 step 9).
 *
 * `planProjectWorkTool` hands a free-text brief to a model that has never seen
 * the conversation, and gets back rows. An external agent usually already HAS
 * the breakdown — the user's decisions, the scope, a task list — and squeezing
 * that into prose for a second model lost the descriptions on the way. This is
 * the other door: the rows arrive structured and are validated, not
 * regenerated.
 *
 * Pure. What it insists on is what makes a row worth a partner's attention: a
 * name AND a description. A bare title is dropped and reported, never saved.
 */

import { normalizePlannedRow, type PlannedRow } from './expandAgent.js';
import { normalizeDraftHtml } from '../../prefill/draftCodec.js';
import { stripHtml } from '../../utils/stripHtml.js';

/** More than this is a backlog, not a board. */
export const MAX_AGENT_ITEMS = 40;

/** Room for an intro paragraph and a deliverables list, not for a document. */
export const MAX_ROW_DESCRIP = 8000;

export type RejectReason =
  | 'notAnObject'
  | 'noName'
  | 'noDescrip'
  | 'descripTooLong'
  | 'duplicate'
  | 'overLimit';

export interface RejectedRow {
  index: number;
  name: string;
  reason: RejectReason;
}

export interface AgentItemsResult {
  rows: PlannedRow[];
  rejected: RejectedRow[];
}

export function normalizeAgentItems(raw: unknown): AgentItemsResult {
  const list = Array.isArray(raw) ? raw : [];
  const rows: PlannedRow[] = [];
  const rejected: RejectedRow[] = [];
  const seen = new Set<string>();

  list.forEach((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      rejected.push({ index, name: '', reason: 'notAnObject' });
      return;
    }
    const o = entry as Record<string, unknown>;
    const name = typeof o.name === 'string' ? o.name.trim() : '';

    // `type` is what the MCP schema calls it; `kind` is the board's own name.
    // The description is handled below — the shared normaliser clamps it to a
    // model-sized 600 characters.
    const row = normalizePlannedRow({ ...o, kind: o.kind ?? o.type, descrip: '' });
    if (!row) {
      rejected.push({ index, name, reason: 'noName' });
      return;
    }

    const html = normalizeDraftHtml(typeof o.descrip === 'string' ? o.descrip.trim() : '');
    const text = stripHtml(html);
    if (!text) {
      rejected.push({ index, name: row.name, reason: 'noDescrip' });
      return;
    }

    // Rich text belongs to missions, whose form has an editor. The act,
    // resource and product forms take plain text and would show the tags.
    const descrip = row.kind === 'mission' ? html : text;
    if (descrip.length > MAX_ROW_DESCRIP) {
      rejected.push({ index, name: row.name, reason: 'descripTooLong' });
      return;
    }

    const key = `${row.kind}:${row.name.toLowerCase()}`;
    if (seen.has(key)) {
      rejected.push({ index, name: row.name, reason: 'duplicate' });
      return;
    }
    if (rows.length >= MAX_AGENT_ITEMS) {
      rejected.push({ index, name: row.name, reason: 'overLimit' });
      return;
    }

    seen.add(key);
    rows.push({ ...row, descrip });
  });

  return { rows, rejected };
}
