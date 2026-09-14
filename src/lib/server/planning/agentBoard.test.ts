import { describe, expect, it } from 'vitest';
import { MAX_AGENT_ITEMS, MAX_ROW_DESCRIP, normalizeAgentItems } from './agentBoard';
import { markExisting } from './expandDirection';
import type { ProjectContext } from '../ai/projectContext';

const mission = (over: Record<string, unknown> = {}) => ({
  type: 'mission',
  name: 'בניית המפה',
  descrip: '<p>מפה אינטראקטיבית.</p><ul><li>שכבת נקודות</li></ul>',
  ...over
});

describe('normalizeAgentItems', () => {
  it('keeps a mission description as the rich HTML the agent sent', () => {
    const { rows, rejected } = normalizeAgentItems([mission({ nhours: 20, skills: ['GIS'] })]);
    expect(rejected).toEqual([]);
    expect(rows[0]).toMatchObject({ kind: 'mission', nhours: 20, skills: ['GIS'] });
    expect(rows[0].descrip).toContain('<ul><li>');
  });

  it('accepts the board\'s own `kind` as well as `type`', () => {
    const { rows } = normalizeAgentItems([{ kind: 'resource', name: 'שרת', descrip: 'VPS קטן' }]);
    expect(rows[0].kind).toBe('resource');
  });

  it('unescapes a description an agent HTML-escaped', () => {
    const { rows } = normalizeAgentItems([mission({ descrip: '&lt;p&gt;גוף&lt;/p&gt;' })]);
    expect(rows[0].descrip).toBe('<p>גוף</p>');
  });

  it('stores plain text on kinds whose form has no rich editor', () => {
    const { rows } = normalizeAgentItems([
      { type: 'act', name: 'לאסוף תמונות', descrip: '<p>שלוש <strong>תמונות</strong></p>', assigneeName: 'דנה' }
    ]);
    expect(rows[0].descrip).toBe('שלוש תמונות');
    expect(rows[0].assigneeName).toBe('דנה');
  });

  it('rejects a bare title instead of saving an empty row', () => {
    const { rows, rejected } = normalizeAgentItems([
      mission(),
      { type: 'mission', name: 'בלי תיאור' },
      { type: 'mission', name: 'רק תגיות', descrip: '<p> </p>' }
    ]);
    expect(rows).toHaveLength(1);
    expect(rejected).toEqual([
      { index: 1, name: 'בלי תיאור', reason: 'noDescrip' },
      { index: 2, name: 'רק תגיות', reason: 'noDescrip' }
    ]);
  });

  it('names every other reason a row was left out', () => {
    const { rejected } = normalizeAgentItems([
      'junk',
      { type: 'mission', name: '  ', descrip: 'x' },
      mission(),
      mission(),
      mission({ name: 'ארוך', descrip: 'D'.repeat(MAX_ROW_DESCRIP + 1) })
    ]);
    expect(rejected.map((r) => r.reason)).toEqual(['notAnObject', 'noName', 'duplicate', 'descripTooLong']);
  });

  it(`caps a board at ${MAX_AGENT_ITEMS} rows and reports the rest`, () => {
    const many = Array.from({ length: MAX_AGENT_ITEMS + 2 }, (_, i) => mission({ name: `M${i}` }));
    const { rows, rejected } = normalizeAgentItems(many);
    expect(rows).toHaveLength(MAX_AGENT_ITEMS);
    expect(rejected.map((r) => r.reason)).toEqual(['overLimit', 'overLimit']);
  });

  it('never throws on a non-array', () => {
    expect(normalizeAgentItems(undefined)).toEqual({ rows: [], rejected: [] });
  });
});

describe('markExisting', () => {
  const ctx = {
    openMissions: [{ id: '5', name: 'Design logo' }],
    myMissions: [],
    products: []
  } as unknown as ProjectContext;

  const row = (name: string, imp: 'must' | 'nice') => ({
    kind: 'mission' as const,
    name,
    descrip: 'd',
    imp,
    spec: {},
    existingRef: null,
    order: 9
  });

  it('flags duplicates but keeps the order and every row the caller chose', () => {
    const out = markExisting([row('Write copy', 'nice'), row('Design logo', 'nice'), row('Launch', 'must')], ctx);
    expect(out.map((r) => r.name)).toEqual(['Write copy', 'Design logo', 'Launch']);
    expect(out.map((r) => r.order)).toEqual([0, 1, 2]);
    expect(out[1].existingRef).toMatchObject({ type: 'openMission', id: '5' });
    expect(out[0].existingRef).toBeNull();
  });
});
