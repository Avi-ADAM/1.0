/**
 * The README badge of a code rikma (PLAN_CODE_RIKMA S6, §6.2) —
 * `/api/badge/<pid>.svg`. Pure: the endpoint reads the rikma, this draws it.
 *
 * Shields-style, two halves: `1lev1` on the left, what the rikma is on the
 * right (`rikma · 14 partners · create with us`). Every README that shows it
 * is an invitation, so the message says what a visitor can do, never what
 * they may not. English only: a README has one audience for every language,
 * and `rikma` is the word in all of them.
 */

import { effectiveLicense, type CodeLicense } from '$lib/codeLicense/codeLicense.js';

const LICENSE_MESSAGE: Record<CodeLicense, string | null> = {
  none: null,
  mit: 'MIT',
  apache: 'Apache-2.0',
  rikma: 'contributors are partners',
  rikmaDelayed: 'contributors are partners',
  rikmaShared: 'create with us',
  rikmaSharedDelayed: 'create with us'
};

export function badgeMessage(args: { partners: number; license: unknown }): string {
  const n = Math.max(0, Math.floor(args.partners || 0));
  const parts = [`rikma`, `${n} ${n === 1 ? 'partner' : 'partners'}`];
  const license = LICENSE_MESSAGE[effectiveLicense(args.license)];
  if (license) parts.push(license);
  return parts.join(' · ');
}

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Verdana 11px, the way shields.io sizes it — an approximation per character
 * class is enough; the text is centred, so a few pixels either way is slack.
 */
export function textWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    if (/[ilj.,:;|!'·]/.test(ch)) w += 3.5;
    else if (/[mwMW]/.test(ch)) w += 10;
    else if (/[A-Z0-9]/.test(ch)) w += 7.5;
    else if (ch === ' ') w += 3.6;
    else w += 6.6;
  }
  return Math.ceil(w);
}

export function renderBadge(label: string, message: string, color = '#b8860b'): string {
  const pad = 10;
  const lw = textWidth(label) + pad * 2;
  const mw = textWidth(message) + pad * 2;
  const w = lw + mw;
  const l = escapeXml(label);
  const m = escapeXml(message);
  const title = `${l}: ${m}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${title}">
<title>${title}</title>
<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
<clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#0f172a"/><rect x="${lw}" width="${mw}" height="20" fill="${escapeXml(color)}"/><rect width="${w}" height="20" fill="url(#s)"/></g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="${lw / 2}" y="15" fill="#010101" fill-opacity=".3">${l}</text><text x="${lw / 2}" y="14">${l}</text>
<text x="${lw + mw / 2}" y="15" fill="#010101" fill-opacity=".3">${m}</text><text x="${lw + mw / 2}" y="14">${m}</text>
</g>
</svg>`;
}

/** The Markdown a rikma pastes into its README. */
export function badgeMarkdown(origin: string, projectId: string): string {
  const base = origin.replace(/\/+$/, '');
  return `[![1lev1 rikma](${base}/api/badge/${projectId}.svg)](${base}/project/${projectId})`;
}
