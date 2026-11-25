import { describe, expect, it, vi } from 'vitest';
import { ExhibitSandbox, STEPS } from './sandbox.svelte';
import { TEMPLATES, ideaFromPreview, ideaFromTemplate } from './fixtures/ideas';
import { closestTemplate, inferSkills } from './fixtures/match';
import { PEOPLE } from './fixtures/people';
import { draftIdea } from './assistant';
import { IDEA_KEYS, SKILLS } from './types';

describe('templates', () => {
  it.each(IDEA_KEYS)('%s reaches the screen through boardsToVisionPreview', (key) => {
    const idea = ideaFromTemplate(key);
    expect(idea.missions).toHaveLength(TEMPLATES[key].missions.length);
    expect(idea.resources).toHaveLength(TEMPLATES[key].resources.length);
    expect(idea.products).toHaveLength(1);
    // The platform's arithmetic: value = hours × rate, shares sum to ~100.
    for (const m of idea.missions) expect(m.value).toBe(m.hours! * m.rate!);
    const total = idea.missions.reduce((s, m) => s + (m.share ?? 0), 0);
    expect(total).toBeGreaterThan(99.5);
    expect(total).toBeLessThan(100.5);
  });

  it.each(IDEA_KEYS)('every part of %s can be taken by at least two people', (key) => {
    const sb = new ExhibitSandbox();
    sb.chooseTemplate(key);
    for (const task of sb.tasks) expect(sb.matchesForTask(task).length).toBeGreaterThanOrEqual(2);
  });

  it('only uses skills the fair knows', () => {
    const known = new Set<string>(SKILLS);
    for (const t of Object.values(TEMPLATES)) {
      for (const row of [...t.missions, ...t.resources]) for (const s of row.skills) expect(known.has(s)).toBe(true);
    }
    for (const p of PEOPLE) for (const s of p.skills) expect(known.has(s)).toBe(true);
  });
});

describe('free text', () => {
  it('finds the nearest template in Hebrew and English', () => {
    expect(closestTemplate('ציור קיר ענק בשכונה שלי')).toBe('mural');
    expect(closestTemplate('a pottery studio for the whole street')).toBe('ceramics');
    expect(closestTemplate('להקה שמנגנת בחצר')).toBe('festival');
    expect(closestTemplate('ספר ילדים על חתול')).toBe('book');
    expect(closestTemplate('qwerty', 'repair')).toBe('repair');
  });

  it('tags assistant-named parts with skills', () => {
    expect(inferSkills('צילום הקולקציה')).toContain('photo');
    expect(inferSkills('Build the online shop website')).toContain('tech');
    expect(inferSkills('בניית קהילה')).not.toContain('carpentry');
    expect(inferSkills('zzz')).toEqual([]);
  });

  it('an assistant draft keeps its own words and is matchable', () => {
    const idea = ideaFromPreview(
      {
        missions: [{ name: 'Teach pottery classes', hours: 20, rate: 100, value: 2000, share: 100 }],
        resources: ['A kiln'],
        products: ['Weekend classes'],
        more: 0
      },
      'my studio'
    );
    expect(idea).toMatchObject({ key: 'custom', title: 'my studio', i18n: false, source: 'ai' });
    expect(idea.missions[0].skills).toContain('ceramics');
    expect(idea.resources[0].value).toBeGreaterThan(0);
  });
});

describe('ExhibitSandbox', () => {
  it('walks forward only as far as it has reached, and needs an idea past step 2', () => {
    const sb = new ExhibitSandbox();
    sb.go('creation');
    expect(sb.step).toBe('welcome');
    sb.next();
    expect(sb.step).toBe('idea');
    sb.next();
    expect(sb.step).toBe('idea'); // no idea yet
    sb.chooseTemplate('mural');
    sb.next();
    expect(sb.step).toBe('connection');
    expect(sb.reached).toBe(2);
    sb.back();
    sb.back();
    expect(sb.step).toBe('welcome');
    sb.go('connection');
    expect(sb.step).toBe('connection');
  });

  it('a new idea forgets what grew from the old one', () => {
    const sb = new ExhibitSandbox();
    sb.next();
    sb.chooseTemplate('mural');
    sb.next();
    sb.invited = ['dana'];
    sb.chooseTemplate('book');
    expect(sb.invited).toEqual([]);
    expect(sb.reached).toBe(STEPS.indexOf('idea'));
  });

  it('reset leaves nothing for the next visitor', () => {
    const sb = new ExhibitSandbox();
    sb.next();
    sb.chooseCustomLocal('ציור קיר');
    sb.next();
    sb.invited = ['dana', 'amir'];
    const round = sb.round;
    sb.reset();
    expect(sb.step).toBe('welcome');
    expect(sb.reached).toBe(0);
    expect(sb.idea).toBeNull();
    expect(sb.invited).toEqual([]);
    expect(sb.round).toBe(round + 1);
  });

  it('explains a match by the skills that matched', () => {
    const sb = new ExhibitSandbox();
    sb.chooseTemplate('mural');
    const dana = sb.matchesForPerson('dana');
    expect(dana.length).toBeGreaterThan(0);
    expect(dana[0].result.matchedSkills.length).toBeGreaterThan(0);
  });
});

describe('draftIdea', () => {
  const preview = { missions: [{ name: 'x', hours: 1, rate: 1, value: 1, share: 100 }], resources: [], products: [], more: 0 };
  const ok = (body: unknown, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

  it('returns the draft', async () => {
    expect(await draftIdea('a repair café', 'en', { fetchImpl: ok({ ok: true, preview }) })).toEqual(preview);
  });

  it('answers null to a refusal, an empty draft, a network error or a slow model', async () => {
    expect(await draftIdea('t', 'en', { fetchImpl: ok({ ok: false, reason: 'no-pass' }, 403) })).toBeNull();
    expect(
      await draftIdea('t', 'en', { fetchImpl: ok({ ok: true, preview: { missions: [], resources: [], products: [], more: 0 } }) })
    ).toBeNull();
    expect(await draftIdea('t', 'en', { fetchImpl: vi.fn(async () => Promise.reject(new Error('offline'))) })).toBeNull();
    const slow = vi.fn(
      (_u: unknown, init?: RequestInit) =>
        new Promise<Response>((_, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('aborted'))))
    );
    expect(await draftIdea('t', 'en', { fetchImpl: slow as never, timeoutMs: 10 })).toBeNull();
  });
});

describe('Connection', () => {
  it('invites and un-invites, up to the circle size', async () => {
    const { MAX_INVITED } = await import('./sandbox.svelte');
    const sb = new ExhibitSandbox();
    sb.chooseTemplate('festival');
    expect(sb.toggleInvite('tom')).toBe(true);
    expect(sb.isInvited('tom')).toBe(true);
    expect(sb.toggleInvite('tom')).toBe(true);
    expect(sb.isInvited('tom')).toBe(false);
    for (const p of PEOPLE.slice(0, MAX_INVITED)) expect(sb.toggleInvite(p.id)).toBe(true);
    expect(sb.toggleInvite(PEOPLE[MAX_INVITED].id)).toBe(false);
    expect(sb.toggleInvite('nobody')).toBe(false);
  });

  it('the visitor is matched by what they bring', async () => {
    const { ME, MAX_MY_SKILLS } = await import('./sandbox.svelte');
    const sb = new ExhibitSandbox();
    sb.chooseTemplate('festival');
    expect(sb.matchesForPerson(ME)).toEqual([]);
    sb.toggleMySkill('cooking');
    expect(sb.matchesForPerson(ME).map((m) => m.task.id)).toContain('m3');
    sb.toggleMySkill('music');
    sb.toggleMySkill('design');
    expect(sb.toggleMySkill('events')).toBe(false);
    expect(sb.mySkills).toHaveLength(MAX_MY_SKILLS);
    sb.reset();
    expect(sb.mySkills).toEqual([]);
  });
});
