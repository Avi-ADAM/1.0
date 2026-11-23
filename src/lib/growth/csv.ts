/**
 * Business leads from a CSV file (docs/inprogress/PLAN_GROWTH_AGENT.md §3.2).
 *
 * The browser parses the file to show a preview; the server parses the same
 * text again and is the one that decides. Columns are matched by header, in
 * Hebrew, English or Arabic, in any order; unknown columns are ignored, and a
 * row without a name is reported, not guessed.
 */

import type { ProspectInput } from './types';

export const MAX_IMPORT_ROWS = 1000;
export const MAX_IMPORT_BYTES = 1_000_000;

/** RFC 4180: quoted fields, doubled quotes, commas/newlines inside quotes, CRLF. Also `;` and tab files. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const delim = pickDelimiter(firstLine);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
      continue;
    }
    if (ch === '"' && field === '') quoted = true;
    else if (ch === delim) {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  return rows;
}

function pickDelimiter(line: string): string {
  const counts = [',', ';', '\t'].map((d) => [d, line.split(d).length] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 1 ? counts[0][0] : ',';
}

type Column = keyof Pick<
  ProspectInput,
  | 'name'
  | 'website'
  | 'email'
  | 'phone'
  | 'country'
  | 'city'
  | 'region'
  | 'category'
  | 'services'
  | 'keywords'
  | 'size'
  | 'notes'
  | 'lang'
  | 'sourceLabel'
  | 'sourceUrl'
>;

const ALIASES: Record<Column, string[]> = {
  name: ['name', 'business', 'business name', 'company', 'שם', 'שם העסק', 'עסק', 'الاسم', 'اسم النشاط', 'اسم'],
  website: ['website', 'site', 'url', 'web', 'אתר', 'כתובת אתר', 'الموقع', 'موقع'],
  email: ['email', 'e-mail', 'mail', 'אימייל', 'מייל', 'דוא"ל', 'דואל', 'البريد', 'البريد الإلكتروني'],
  phone: ['phone', 'telephone', 'tel', 'mobile', 'whatsapp', 'טלפון', 'נייד', 'וואטסאפ', 'الهاتف', 'هاتف', 'جوال'],
  country: ['country', 'מדינה', 'الدولة', 'البلد'],
  city: ['city', 'town', 'עיר', 'יישוב', 'ישוב', 'المدينة'],
  region: ['region', 'area', 'district', 'אזור', 'מחוז', 'المنطقة'],
  category: ['category', 'type', 'field', 'קטגוריה', 'תחום', 'סוג', 'الفئة', 'المجال'],
  services: ['services', 'service', 'שירותים', 'שירות', 'الخدمات'],
  keywords: ['keywords', 'tags', 'מילות מפתח', 'תגיות', 'الكلمات المفتاحية'],
  size: ['size', 'employees', 'גודל', 'עובדים', 'الحجم'],
  notes: ['notes', 'note', 'comments', 'הערות', 'הערה', 'ملاحظات'],
  lang: ['lang', 'language', 'שפה', 'اللغة'],
  sourceLabel: ['source', 'מקור', 'المصدر'],
  sourceUrl: ['source url', 'source_url', 'sourceurl', 'קישור מקור', 'رابط المصدر']
};

function norm(h: string): string {
  return h.trim().toLowerCase().replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ');
}

/** Which column each header names, or null for one we do not know. */
export function mapHeaders(headers: string[]): (Column | null)[] {
  const used = new Set<Column>();
  return headers.map((h) => {
    const n = norm(h);
    for (const [col, names] of Object.entries(ALIASES) as [Column, string[]][]) {
      if (!used.has(col) && names.some((a) => norm(a) === n)) {
        used.add(col);
        return col;
      }
    }
    return null;
  });
}

export interface CsvImportPreview {
  columns: (Column | null)[];
  rows: ProspectInput[];
  /** 1-based line numbers (the header is line 1) of rows with no name. */
  missingName: number[];
  tooMany: boolean;
  noNameColumn: boolean;
}

export function csvToInputs(text: string, sourceLabel?: string | null): CsvImportPreview {
  const table = parseCsv(text);
  const [header = [], ...body] = table;
  const columns = mapHeaders(header);
  const noNameColumn = !columns.includes('name');
  const rows: ProspectInput[] = [];
  const missingName: number[] = [];
  body.slice(0, MAX_IMPORT_ROWS).forEach((cells, i) => {
    const r: Record<string, string> = {};
    columns.forEach((col, j) => {
      if (col && cells[j] != null && cells[j].trim()) r[col] = cells[j].trim();
    });
    if (!r.name) {
      missingName.push(i + 2);
      return;
    }
    rows.push({
      ...r,
      name: r.name,
      sourceKind: 'csv',
      // A row's own "source" column wins over the file's name.
      sourceLabel: r.sourceLabel || sourceLabel || null
    });
  });
  return { columns, rows, missingName, tooMany: body.length > MAX_IMPORT_ROWS, noNameColumn };
}

/** "a, b; c | d" → ["a","b","c","d"]. */
export function splitList(v: string[] | string | null | undefined, max = 20): string[] {
  const arr = Array.isArray(v) ? v : String(v ?? '').split(/[,;|\n]/);
  const out: string[] = [];
  for (const s of arr) {
    const t = String(s).trim().slice(0, 80);
    if (t && !out.some((o) => o.toLowerCase() === t.toLowerCase())) out.push(t);
    if (out.length >= max) break;
  }
  return out;
}
