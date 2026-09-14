import { describe, expect, it } from 'vitest';
import { decodeMissionDraft, encodeMissionDraft, sanitizeMissionDraft } from './missionDraft.js';

const draft = {
  name: 'בניית מפת נקודות חלוקה',
  descrip: '<h3>מה צריך</h3><p>מפה עם נקודות קבועות, ימים &amp; שעות</p><ul><li>דיווח #1</li></ul>'.repeat(20),
  skills: ['Svelte', 'מפות, GIS'],
  roles: ['מפתח/ת צד לקוח'],
  workways: ['מרחוק'],
  nhours: 40,
  valph: 120
};

describe('missionDraft', () => {
  it('round-trips every field, including a term with a comma', async () => {
    expect(await decodeMissionDraft(await encodeMissionDraft(draft))).toEqual(draft);
  });

  it('survives the URL being decoded once', async () => {
    const url = `/moach/12/create?${new URLSearchParams({ action: 'createmission', draft: await encodeMissionDraft(draft) })}`;
    const read = new URL(decodeURIComponent(url), 'https://1lev1.com').searchParams;
    expect(await decodeMissionDraft(read.get('draft'))).toEqual(draft);
  });

  it('unescapes a description sent as entities', () => {
    expect(sanitizeMissionDraft({ name: 'x', descrip: '&lt;p&gt;שלום &amp; ברכה&lt;/p&gt;' })?.descrip).toBe(
      '<p>שלום & ברכה</p>'
    );
  });

  it('drops ill-typed fields and caps the chips at what vocab/resolve accepts', () => {
    expect(
      sanitizeMissionDraft({
        name: 'x',
        nhours: '40',
        valph: -5,
        skills: Array.from({ length: 12 }, (_, i) => `s${i}`),
        roles: 'dev'
      })
    ).toEqual({ name: 'x', skills: ['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7'] });
    expect(sanitizeMissionDraft({ descrip: 'no name' })).toBeNull();
  });

  it('returns null for a cut parameter', async () => {
    const param = await encodeMissionDraft(draft);
    expect(await decodeMissionDraft(param.slice(0, param.length >> 1))).toBeNull();
  });
});
