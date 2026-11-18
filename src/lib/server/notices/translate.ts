/**
 * `$t()` for the server: resolve a notice in a given language where there is no
 * page and no store — the MCP tool, the site's chat, a push.
 *
 * Reads the very JSON files the pages read (`src/lib/translations/<locale>/`),
 * only the namespaces a notice can touch, and fills them with the very parser
 * the pages use (`@sveltekit-i18n/parser-default`) — so `{{name}}` and the
 * modifier form `{{count; 1:one mission; default:{{count}} missions;}}` render
 * the same here as in the browser. A string that a page shows with a plural
 * would otherwise reach the MCP tool or a push with its braces showing. A key missing in the reader's language falls back to
 * Hebrew, the source language, and then to nothing — never to the key itself,
 * which would put "notices.lev.pends" in front of a person.
 */

import parserDefault from '@sveltekit-i18n/parser-default';
import type { Translate } from '$lib/notices';

import { customModifiers } from '$lib/translations/modifiers.js';

const parser = parserDefault({ customModifiers });

// `server` holds the words an action says back to the person who ran it —
// errors, toasts and names it writes into a record another member reads
// (PLAN_EN_READINESS stage 4.1); `shop` holds the order notes the server
// writes and the shop screens render. Both are platform words, in five
// locales, so they belong here rather than in a `{ he, en }` object.
const files = import.meta.glob('../../translations/*/{notices,lev,common,server,shop}.json', {
  eager: true,
  import: 'default'
}) as Record<string, Record<string, unknown>>;

export const NOTICE_LOCALES = ['he', 'en', 'ar', 'ru', 'es'] as const;
export type NoticeLocale = (typeof NOTICE_LOCALES)[number];

export function noticeLocale(lang: unknown): NoticeLocale {
  const l = String(lang ?? '').slice(0, 2).toLowerCase();
  return (NOTICE_LOCALES as readonly string[]).includes(l) ? (l as NoticeLocale) : 'he';
}

function lookup(locale: string, key: string): string | null {
  const [ns, ...path] = key.split('.');
  let node: unknown = files[`../../translations/${locale}/${ns}.json`];
  for (const part of path) node = node && typeof node === 'object' ? (node as any)[part] : undefined;
  return typeof node === 'string' ? node : null;
}

/**
 * Fill one template the way `$t()` does on a page. Exported for the tests.
 * The parser prints a `null` payload value as "null"; this translator has
 * always printed nothing for it, so those are dropped before it sees them.
 */
export function fillTemplate(
  template: string,
  params: Record<string, unknown> | undefined,
  locale: string,
  key = ''
): string {
  if (!template.includes('{{')) return template;
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params ?? {})) if (v != null) payload[k] = v;
  return String(parser.parse(template, [payload, undefined], locale, key) ?? '');
}

export function serverTranslator(lang: unknown): Translate {
  const locale = noticeLocale(lang);
  return (key, params) =>
    fillTemplate(lookup(locale, key) ?? lookup('he', key) ?? '', params, locale, key);
}
