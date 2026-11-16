import { describe, expect, it } from 'vitest';
import { applyHiddenProducts, hiddenIdsOf, isRikmaMember } from './hiddenProducts';

const project = () => ({
  id: '7',
  attributes: {
    projectName: 'r',
    user_1s: { data: [{ id: '1' }, { id: 2 }] },
    matanotofs: { data: [{ id: '10', attributes: { name: 'a' } }, { id: 11, attributes: { name: 'b' } }] }
  }
});

describe('isRikmaMember', () => {
  it('matches string and number ids', () => {
    expect(isRikmaMember(project(), '2')).toBe(true);
    expect(isRikmaMember(project(), 1)).toBe(true);
  });
  it('is false for a guest or a stranger', () => {
    for (const uid of [null, undefined, '', false, '3']) expect(isRikmaMember(project(), uid)).toBe(false);
    expect(isRikmaMember(null, '1')).toBe(false);
  });
});

describe('hiddenIdsOf', () => {
  it('reads the ids', () => {
    expect([...hiddenIdsOf({ data: { matanots: { data: [{ id: 11 }, { id: '12' }] } } })!]).toEqual(['11', '12']);
  });
  it('is null when the read failed, so the page falls back to what it showed before', () => {
    expect(hiddenIdsOf(null)).toBeNull();
    expect(hiddenIdsOf({ errors: [{}] })).toBeNull();
  });
});

describe('applyHiddenProducts', () => {
  it('drops a hidden product for a non-member', () => {
    const out = applyHiddenProducts(project(), new Set(['11']), false);
    expect(out!.attributes.matanotofs.data.map((p) => String(p.id))).toEqual(['10']);
  });

  it('keeps it for a member, flagged', () => {
    const out = applyHiddenProducts(project(), new Set(['11']), true);
    const rows = out!.attributes.matanotofs.data as any[];
    expect(rows).toHaveLength(2);
    expect(rows[1].attributes).toEqual({ name: 'b', hiddenFromDiscovery: true });
    expect(rows[0].attributes.hiddenFromDiscovery).toBeUndefined();
  });

  it('does not mutate its input', () => {
    const p = project();
    applyHiddenProducts(p, new Set(['10']), false);
    applyHiddenProducts(p, new Set(['10']), true);
    expect(p.attributes.matanotofs.data).toHaveLength(2);
    expect((p.attributes.matanotofs.data[0].attributes as any).hiddenFromDiscovery).toBeUndefined();
  });

  it('passes through when nothing is hidden, the read failed, or there is no project', () => {
    const p = project();
    expect(applyHiddenProducts(p, new Set(), false)).toBe(p);
    expect(applyHiddenProducts(p, null, false)).toBe(p);
    expect(applyHiddenProducts(null, new Set(['1']), false)).toBeNull();
  });
});
