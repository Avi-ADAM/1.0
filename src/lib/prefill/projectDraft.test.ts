import { describe, expect, it } from 'vitest';
import {
  MAX_DRAFT_PARAM,
  decodeProjectDraft,
  encodeProjectDraft,
  normalizeDetailsHtml,
  sanitizeProjectDraft
} from './projectDraft.js';

const details =
  '<h2>מה זה</h2><p>אתר קהילתי שבו כל אחד מפרסם איפה יש מזון &amp; חפצים בחינם</p>' +
  '<ul><li><strong>דיווח</strong> — עוד נשאר? כבר נאסף?</li><li>נקודות #קבועות</li></ul>';

const draft = {
  name: 'מפת השפע',
  desc: 'אתר קהילתי שבו כל אחד מפרסם איפה יש כרגע מזון וחפצים בחינם',
  details: details.repeat(30),
  vals: ['מניעת בזבוז מזון', 'ערבות הדדית, וקהילה', 'קיימות וכלכלה מעגלית'],
  res: 'feh' as const,
  profit: 'never' as const,
  ont: true
};

describe('projectDraft', () => {
  it('round-trips every field, including a value with a comma', async () => {
    const param = await encodeProjectDraft(draft);
    expect(await decodeProjectDraft(param)).toEqual(draft);
  });

  // The reported bug: the old per-field URL, decoded once on its way to the
  // member, lost `details`, `vals`, `res`, `profit` and `ont` without a trace.
  it('survives the URL being decoded once, or twice', async () => {
    const url = `/me?${new URLSearchParams({ action: 'createproject', draft: await encodeProjectDraft(draft) })}`;
    for (const mangled of [url, decodeURIComponent(url), decodeURIComponent(decodeURIComponent(url))]) {
      const read = new URL(mangled, 'https://1lev1.com').searchParams;
      expect(await decodeProjectDraft(read.get('draft'))).toEqual(draft);
    }
  });

  it('keeps a long Hebrew description well inside proxy limits', async () => {
    const param = await encodeProjectDraft(draft);
    expect(draft.details.length).toBeGreaterThan(4500);
    expect(param.length).toBeLessThan(MAX_DRAFT_PARAM);
  });

  it('returns null — never throws — for a cut or foreign parameter', async () => {
    const param = await encodeProjectDraft(draft);
    expect(await decodeProjectDraft(param.slice(0, param.length >> 1))).toBeNull();
    expect(await decodeProjectDraft('garbage')).toBeNull();
    expect(await decodeProjectDraft('d1.!!!')).toBeNull();
    expect(await decodeProjectDraft(null)).toBeNull();
  });

  it('unescapes HTML that was sent as entities, and only then', () => {
    expect(normalizeDetailsHtml('&lt;h2&gt;כותרת&lt;/h2&gt;&lt;p&gt;מזון &amp; חפצים, ל&#39;כולם&#x21;&lt;/p&gt;')).toBe(
      "<h2>כותרת</h2><p>מזון & חפצים, ל'כולם!</p>"
    );
    // Real markup that merely mentions an entity is left alone.
    expect(normalizeDetailsHtml('<p>write &lt;p&gt; for a paragraph</p>')).toBe(
      '<p>write &lt;p&gt; for a paragraph</p>'
    );
    expect(normalizeDetailsHtml('plain text & more')).toBe('plain text & more');
  });

  it('drops ill-typed fields instead of passing them to the form', () => {
    expect(sanitizeProjectDraft({ name: '  ' })).toBeNull();
    expect(
      sanitizeProjectDraft({ name: 'x', res: '1y', profit: 3, ont: 'true', vals: ['a', '', 'a', 7] })
    ).toEqual({ name: 'x', vals: ['a'] });
  });
});
