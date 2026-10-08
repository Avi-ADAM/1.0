/**
 * `$t()` for the server: resolve a notice in a given language where there is no
 * page and no store — the MCP tool, the site's chat, a push.
 *
 * Reads the very JSON files the pages read (`src/lib/translations/<locale>/`),
 * only the namespaces a notice can touch, and fills `{{name}}` the way the
 * page's parser does. A key missing in the reader's language falls back to
 * Hebrew, the source language, and then to nothing — never to the key itself,
 * which would put "notices.lev.pends" in front of a person.
 */

import type { Translate } from '$lib/notices';

const files = import.meta.glob('../../translations/*/{notices,lev,common}.json', {
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

export function serverTranslator(lang: unknown): Translate {
  const locale = noticeLocale(lang);
  return (key, params) => {
    const template = lookup(locale, key) ?? lookup('he', key) ?? '';
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) =>
      params && params[name] != null ? String(params[name]) : ''
    );
  };
}
