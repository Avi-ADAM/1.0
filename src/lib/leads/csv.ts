/**
 * The "in progress" table as a CSV (docs/inprogress/PLAN_LEADS.md §4.1, L5).
 *
 * Without contact details by default. A member who ticks "with contact
 * details" gets them through `exportLeadContacts`, which writes a line in
 * each lead's log — the file leaves the platform, and the rikma should know
 * who took it.
 *
 * A cell that starts with = + - @ (or a tab / CR) is prefixed with `'` so a
 * spreadsheet shows it as text: the names and messages were typed by strangers
 * on a public form, and a formula is how such a file attacks whoever opens it.
 */

import type { PipelineRow } from './pipeline';

export interface CsvContact {
  phone: string | null;
  email: string | null;
}

export interface CsvLabels {
  headers: {
    kind: string;
    name: string;
    organization: string;
    source: string;
    products: string;
    stage: string;
    owner: string;
    last: string;
    followUp: string;
    next: string;
    phone: string;
    email: string;
  };
  kind: (k: PipelineRow['kind']) => string;
  source: (s: string) => string;
  stage: (s: string) => string;
}

export function csvCell(value: unknown): string {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function pipelineCsv(
  rows: PipelineRow[],
  labels: CsvLabels,
  contacts?: Map<string, CsvContact> | null
): string {
  const h = labels.headers;
  const head = [h.kind, h.name, h.organization, h.source, h.products, h.stage, h.owner, h.last, h.followUp, h.next];
  if (contacts) head.push(h.phone, h.email);
  const lines = [head.map(csvCell).join(',')];
  for (const r of rows) {
    const cells: unknown[] = [
      labels.kind(r.kind),
      r.name,
      r.organization ?? '',
      r.sourceLabel ?? labels.source(r.source),
      r.products.join('; '),
      labels.stage(r.stage),
      r.ownerName ?? '',
      r.lastAt ?? '',
      r.followUpAt ?? '',
      r.nextAction ?? ''
    ];
    if (contacts) {
      const c = r.kind === 'lead' ? contacts.get(r.id) : undefined;
      cells.push(c?.phone ?? '', c?.email ?? '');
    }
    lines.push(cells.map(csvCell).join(','));
  }
  // The BOM tells Excel the file is UTF-8 — Hebrew and Arabic are unreadable without it.
  return '﻿' + lines.join('\r\n') + '\r\n';
}
