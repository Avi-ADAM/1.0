import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * resolveMissionSpec reports what it could not resolve.
 *
 * Creation is best-effort, and a term whose create failed (or was flagged by
 * moderation) used to vanish without a trace — a caller that must not lose a
 * term silently (publishWishNeedToCommunity) now reads `unresolved`, and shows
 * the wisher which entries were `created` just now.
 */

const matchCategory = vi.fn();
vi.mock('$lib/embed/matcher.js', () => ({ matchCategory: (...a: any[]) => matchCategory(...a) }));

import { resolveMissionSpec } from './resolveMissionSpec';

function vocabFetch(answers: Record<string, any>) {
  return vi.fn(async (_url: string, init: any) => {
    const { label } = JSON.parse(init.body);
    const a = answers[label];
    if (!a) return new Response('nope', { status: 500 });
    return new Response(JSON.stringify(a), { status: 200 });
  }) as any;
}

beforeEach(() => {
  matchCategory.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('resolveMissionSpec — unresolved and created', () => {
  it('marks what it created and lists what it could not create', async () => {
    matchCategory.mockImplementation(async (terms: string[]) =>
      terms.map((input) =>
        input === 'נגרות'
          ? { input, status: 'matched', existingId: '5', existingLabel: 'נגרות' }
          : { input, status: 'new' }
      )
    );
    const fetchFn = vocabFetch({
      'הרכבת רהיטים': { success: true, item: { id: 41, label: 'הרכבת רהיטים' } },
      'מילה פוגענית': { success: true, item: { id: 42, label: 'מילה פוגענית' }, moderation: { flagged: true } }
    });

    const r = await resolveMissionSpec(
      { name: 'שולחן', skills: ['נגרות', 'הרכבת רהיטים', 'מילה פוגענית', 'נכשל'], lang: 'he' },
      fetchFn
    );

    expect(r.skills.resolved).toEqual([
      { id: '5', name: 'נגרות' },
      { id: '41', name: 'הרכבת רהיטים', created: true }
    ]);
    expect(r.skills.newlyCreated).toEqual(['הרכבת רהיטים']);
    expect(r.skills.unresolved).toEqual(['מילה פוגענית', 'נכשל']);
    // Created in the default locale: the create body carries the reader's lang for
    // translation, never a Strapi `locale`.
    const body = JSON.parse(fetchFn.mock.calls[0][1].body);
    expect(body).toEqual({ kind: 'skills', label: 'הרכבת רהיטים', lang: 'he', createdBy: 'ai' });
  });

  it('a suggestion without an existing id is unresolved, not dropped', async () => {
    matchCategory.mockResolvedValue([{ input: 'עיבוד עץ', status: 'suggestion' }]);
    const r = await resolveMissionSpec({ name: 'x', skills: ['עיבוד עץ'], lang: 'he' }, vocabFetch({}));

    expect(r.skills.ids).toEqual([]);
    expect(r.skills.unresolved).toEqual(['עיבוד עץ']);
  });
});
