import { describe, it, expect, vi } from 'vitest';
import { cleanDraft, cleanHeadings, draftPrompt, DRAFT_CONTEXT_MAX, DRAFT_QUESTION } from './draftPrompt';
import { draftPlaybook, type DraftDeps } from '$lib/server/playbooks/draft';

describe('cleanHeadings', () => {
  it('takes lines or arrays, drops the ## and empties, caps the count', () => {
    expect(cleanHeadings('## מה הרקמה עושה\n\n  איך מחליטים  ')).toEqual(['מה הרקמה עושה', 'איך מחליטים']);
    expect(cleanHeadings(Array.from({ length: 20 }, (_, i) => `h${i}`))).toHaveLength(12);
    expect(cleanHeadings(null)).toEqual([]);
  });
});

describe('draftPrompt', () => {
  const base = { lang: 'he', roleName: null, headings: ['א', 'ב'], notes: '', context: { general: { values: ['קהילה'] } } };

  it('asks in the member language, with their sections, and forbids inventing rules', () => {
    const p = draftPrompt(base);
    expect(p).toContain('Write in Hebrew');
    expect(p).toContain('## א');
    expect(p).toContain('## ב');
    expect(p).toContain('Never invent a rule');
    expect(p).toContain(`"${DRAFT_QUESTION} "`);
    expect(p).toContain('"קהילה"');
  });

  it('names the role, keeps the notes, and caps the data', () => {
    const p = draftPrompt({ ...base, roleName: 'מכירות', notes: 'לקוחות עסקיים: שוטף+30', context: { big: 'x'.repeat(DRAFT_CONTEXT_MAX * 2) } });
    expect(p).toContain('"מכירות" role');
    expect(p).toContain('שוטף+30');
    expect(p.length).toBeLessThan(DRAFT_CONTEXT_MAX + 4000);
  });
});

describe('cleanDraft', () => {
  it('strips fences and any preamble before the first heading', () => {
    expect(cleanDraft('```markdown\nHere is your draft:\n## א\n- שורה\n```')).toBe('## א\n- שורה');
    expect(cleanDraft('')).toBe('');
  });
});

describe('draftPlaybook', () => {
  const input = {
    userId: '7',
    projectId: '101',
    roleId: '9',
    lang: 'he',
    headings: ['א'],
    notes: '',
    fetch: (() => {}) as any
  };
  const deps = (over: Partial<DraftDeps> = {}): DraftDeps => ({
    limit: () => ({ ok: true }),
    view: vi.fn(async () => ({ context: { success: true, general: { roles: [{ id: '9', name: 'מכירות' }] } }, playbook: null })) as any,
    generate: vi.fn(async () => '## א\n❓ כמה הנחה מותר לתת?'),
    ...over
  });

  it('drafts from the context, with the role named', async () => {
    const d = deps();
    const res = await draftPlaybook(input, d);
    expect(res).toEqual({ ok: true, draft: '## א\n❓ כמה הנחה מותר לתת?' });
    expect((d.generate as any).mock.calls[0][0]).toContain('"מכירות" role');
  });

  it('a refused context never reaches the model', async () => {
    const d = deps({ view: vi.fn(async () => ({ context: { success: false, denied: true }, playbook: null })) as any });
    expect(await draftPlaybook(input, d)).toEqual({ ok: false, reason: 'denied' });
    expect(d.generate).not.toHaveBeenCalled();
  });

  it('the hourly limit is checked before anything is read', async () => {
    const d = deps({ limit: () => ({ ok: false, retryAfterSeconds: 300 }) });
    expect(await draftPlaybook(input, d)).toEqual({ ok: false, reason: 'rateLimited', retryAfterSeconds: 300 });
    expect(d.view).not.toHaveBeenCalled();
  });

  it('a model failure or an empty answer is said, not filled', async () => {
    expect(await draftPlaybook(input, deps({ generate: async () => { throw new Error('503'); } }))).toEqual({ ok: false, reason: 'failed' });
    expect(await draftPlaybook(input, deps({ generate: async () => '   ' }))).toEqual({ ok: false, reason: 'empty' });
  });
});
