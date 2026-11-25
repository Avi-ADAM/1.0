import { describe, expect, it } from 'vitest';
import { cleanMeta, exhibitSourceText, parseExhibitSourceText, planSummary } from './meta';

const item = (group: string, label: string, spec: Record<string, unknown> = {}, status = 'proposed') =>
  ({ key: label, group, label, status, origin: 'agent', spec }) as any;

describe('exhibit meta', () => {
  it('keeps only well-formed sources and trims the visitor’s words', () => {
    expect(cleanMeta({ source: 'template:mural', words: '  a  garden\non the roof ' })).toEqual({
      source: 'template:mural',
      words: 'a garden on the roof'
    });
    expect(cleanMeta({ source: 'ai' }).source).toBe('ai');
    expect(cleanMeta({ source: 'nearest:ceramics' }).source).toBe('nearest:ceramics');
    expect(cleanMeta({ source: 'template:<script>' }).source).toBeNull();
    expect(cleanMeta({ words: 'x'.repeat(500) }).words).toHaveLength(300);
    expect(cleanMeta(null)).toEqual({ source: null, words: null });
  });

  it('round-trips through sourceText', () => {
    const meta = { source: 'nearest:book', words: 'ספר על חתול שמצייר' };
    const text = exhibitSourceText('ספר ילדים', meta);
    expect(text.startsWith('Built at the 1lev1 exhibition stand: ספר ילדים')).toBe(true);
    expect(parseExhibitSourceText(text)).toEqual(meta);
    expect(parseExhibitSourceText(exhibitSourceText('x', { source: null, words: null }))).toEqual({ source: null, words: null });
    expect(parseExhibitSourceText(null)).toEqual({ source: null, words: null });
  });

  it('summarises the plan a line per part, skipping dropped rows', () => {
    const plan = planSummary([
      item('rikmaMissions', 'Paint the wall', { hours: 60, ratePerHour: 100, holder: 'open' }),
      item('rikmaMissions', 'Sketch', { hours: 30, ratePerHour: 120, holder: 'me' }),
      item('rikmaResources', 'Paint', { price: 1800, holder: 'open' }),
      item('products', 'Art tours'),
      item('rikmaMissions', 'Gone', {}, 'dropped')
    ]);
    expect(plan.split('\n')).toEqual([
      'mission: Paint the wall · 60h × 100 = 6000 · open',
      'mission: Sketch · 30h × 120 = 3600 · me',
      'resource: Paint · 1800 · open',
      'product: Art tours'
    ]);
  });

  it('stays within the limit and says how much was left out', () => {
    const many = Array.from({ length: 60 }, (_, i) => item('rikmaMissions', `Mission number ${i}`, { hours: 10, ratePerHour: 100 }));
    const plan = planSummary(many, 400);
    expect(plan.length).toBeLessThanOrEqual(400);
    expect(plan).toMatch(/… \+\d+ more$/);
  });
});
