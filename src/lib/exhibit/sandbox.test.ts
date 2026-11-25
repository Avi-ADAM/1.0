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

describe('Partnership', () => {
  async function planned() {
    const mod = await import('./sandbox.svelte');
    const sb = new mod.ExhibitSandbox();
    sb.chooseTemplate('mural');
    sb.toggleInvite('dana');
    sb.toggleInvite('lior');
    sb.toggleInvite('amir');
    return { sb, ...mod };
  }

  it('the assistant gives each part to a partner whose skills fit it', async () => {
    const { sb, taskKey } = await planned();
    sb.suggestAssignment();
    for (const task of sb.tasks) {
      const who = sb.assignments[taskKey(task)];
      if (!who) continue;
      expect(sb.matchesForPerson(who).some((m) => taskKey(m.task) === taskKey(task))).toBe(true);
    }
    expect(sb.partsOf('dana').length).toBeGreaterThan(0);
  });

  it('leaves a part nobody in the circle fits open, and counts it as open value', async () => {
    const { sb, taskKey } = await planned();
    sb.toggleInvite('lior'); // the only carpenter in this circle
    sb.suggestAssignment();
    const scaffold = sb.tasks.find((t) => t.id === 'r1')!; // carpentry: nobody left holds it
    expect(sb.assignments[taskKey(scaffold)]).toBeUndefined();
    expect(sb.openValue).toBeGreaterThanOrEqual(sb.valueOf(scaffold));
  });

  it('shares follow contribution, through memberShares, and sum to 100', async () => {
    const { sb, ME } = await planned();
    const [m1, m2] = sb.idea!.missions;
    sb.assign(m1, 'dana'); // 30h × 120 = 3600
    sb.assign(m2, ME); // 60h × 100 = 6000
    const rows = Object.fromEntries(sb.shares.rows.map((r) => [r.uid, r.p]));
    expect(rows.dana).toBeCloseTo(37.5, 5);
    expect(rows[ME]).toBeCloseTo(62.5, 5);
    expect(rows.lior).toBe(0);
    sb.assign(m2, ME); // the same partner again leaves it open
    expect(sb.ownerOf(m2)).toBeNull();
  });

  it('un-inviting a partner opens what they held', async () => {
    const { sb } = await planned();
    const [m1] = sb.idea!.missions;
    sb.assign(m1, 'dana');
    sb.toggleInvite('dana');
    expect(sb.ownerOf(m1)).toBeNull();
  });

  it('a proposed part is signed only by the partner’s own yes — never by their silence', async () => {
    const { sb } = await planned();
    sb.suggestAssignment();
    sb.proposePlan();
    expect(sb.gateFor('dana')?.approvable).toBe(false);
    sb.partnerSigns('dana');
    expect(sb.gateFor('dana')?.approvable).toBe(true);
    expect(sb.allSigned).toBe(false);
  });

  it('a counter changes the hours and opens a new round the visitor must accept', async () => {
    const { sb, taskKey } = await planned();
    const m2 = sb.idea!.missions[1];
    sb.assign(m2, 'dana');
    sb.proposePlan();
    const before = sb.valueOf(m2);
    sb.partnerCounters('dana', m2, 90);
    expect(sb.hoursOverride[taskKey(m2)]).toBe(90);
    expect(sb.valueOf(m2)).toBeGreaterThan(before);
    // The counter is the partner's yes; the rikma has not said yes to it yet.
    expect(sb.gateFor('dana')).toMatchObject({ takerYes: true, hasPMyes: false, approvable: false });
    sb.iAccept('dana');
    expect(sb.gateFor('dana')?.approvable).toBe(true);
  });

  it('meeting halfway is the visitor’s round: the partner signs it again', async () => {
    const { sb } = await planned();
    const m2 = sb.idea!.missions[1];
    sb.assign(m2, 'dana');
    sb.proposePlan();
    sb.partnerCounters('dana', m2, 90);
    sb.iCounter('dana', m2, 75);
    expect(sb.hoursOf(m2)).toBe(75);
    expect(sb.gateFor('dana')).toMatchObject({ hasPMyes: true, takerYes: false });
    sb.partnerSigns('dana');
    expect(sb.gateFor('dana')?.approvable).toBe(true);
    sb.partnerSigns('lior');
    sb.partnerSigns('amir');
    expect(sb.allSigned).toBe(true);
  });

  it('reset clears the plan', async () => {
    const { sb } = await planned();
    sb.suggestAssignment();
    sb.proposePlan();
    sb.reset();
    expect(sb.assignments).toEqual({});
    expect(sb.consent).toEqual({});
    expect(sb.hoursOverride).toEqual({});
  });
});

describe('the assistant leaves nobody empty-handed', () => {
  it('hands the visitor a fitting part from a partner holding two', async () => {
    const { ExhibitSandbox, ME } = await import('./sandbox.svelte');
    const sb = new ExhibitSandbox();
    sb.chooseTemplate('mural');
    for (const id of ['dana', 'lior', 'amir']) sb.toggleInvite(id);
    sb.toggleMySkill('community');
    sb.toggleMySkill('marketing');
    sb.suggestAssignment();
    expect(sb.partsOf(ME).length).toBeGreaterThan(0);
    for (const id of sb.circle) expect(sb.partsOf(id).length).toBeGreaterThan(0);
  });
});

describe('Creation', () => {
  async function signed() {
    const { ExhibitSandbox, ME } = await import('./sandbox.svelte');
    const sb = new ExhibitSandbox();
    sb.chooseTemplate('mural');
    for (const id of ['dana', 'lior', 'amir']) sb.toggleInvite(id);
    sb.toggleMySkill('community');
    sb.suggestAssignment();
    return { sb, ME };
  }

  it('the first sale is split by the sales page’s own preview, and adds up', async () => {
    const { sb, ME } = await signed();
    const { revach, rows } = sb.split;
    expect(revach).toBe(sb.firstSale);
    const total = rows.reduce((s, r) => s + r.x, 0);
    expect(total).toBeCloseTo(sb.firstSale, 5);
    // Each partner's cut follows their share of the rikma.
    for (const r of rows) {
      const share = sb.shares.rows.find((x) => x.uid === r.uid)!.p;
      expect(r.x).toBeCloseTo((share / 100) * sb.firstSale, 5);
    }
    // The visitor holds the money, so every transfer leaves from them.
    const me = rows.find((r) => r.uid === ME)!;
    const handed = me.le.reduce((s, l) => s + l.amount, 0);
    expect(handed).toBeCloseTo(sb.firstSale - me.x, 5);
    for (const r of rows.filter((r) => r.uid !== ME)) expect(r.le).toEqual([]);
  });

  it('the blueprint keeps the invented people out: their parts are open', async () => {
    const { sb, ME } = await signed();
    const { sandboxToBlueprint } = await import('./blueprint');
    const { parseBlueprint } = await import('$lib/assistant/blueprint');
    const bp = sandboxToBlueprint(sb, { me: ME, title: 'Mural', label: (t) => t.label })!;
    const parsed = parseBlueprint(bp);
    expect(parsed.ok).toBe(true);
    expect(bp.partners).toEqual([]);
    const mine = sb.partsOf(ME).map((t) => t.id);
    for (const m of bp.missions) expect(m.holder).toBe(mine.includes(m.ref) ? 'me' : 'open');
    expect(bp.missions.some((m) => m.holder === 'me')).toBe(true);
    expect(JSON.stringify(bp)).not.toMatch(/dana|lior|amir/);
  });
});

describe('handoff', () => {
  it('puts the token in the fragment, and falls back to /vision without a draft', async () => {
    const { handoffUrl, tokenFromHash } = await import('./handoff');
    const url = handoffUrl('https://www.1lev1.com', { shareKey: 'k.1', token: 'a.b-c_d' }, 'en');
    expect(url).toBe('https://www.1lev1.com/preview/rikma/k.1?ref=exhibit&lang=en#t=a.b-c_d');
    expect(tokenFromHash(new URL(url).hash)).toBe('a.b-c_d');
    expect(handoffUrl('https://x', null, 'he')).toBe('https://x/vision?ref=exhibit&lang=he');
    expect(tokenFromHash('')).toBeNull();
  });

  it('requestDraft and sendLead never throw — a failure is null / false', async () => {
    const { requestDraft, sendLead } = await import('./handoff');
    const fail = vi.fn(async () => Promise.reject(new Error('offline')));
    expect(await requestDraft({}, 'he', { fetchImpl: fail as never })).toBeNull();
    expect(await sendLead({ shareKey: 'k', token: 't' }, { email: 'a@b.co' }, 'kiosk', { fetchImpl: fail as never })).toBe(false);
    const ok = vi.fn(async () => new Response(JSON.stringify({ ok: true, shareKey: 'k', token: 't' })));
    expect(await requestDraft({}, 'he', { fetchImpl: ok as never })).toEqual({ shareKey: 'k', token: 't' });
  });

  it('a changed plan forgets the draft', async () => {
    const { ExhibitSandbox } = await import('./sandbox.svelte');
    const sb = new ExhibitSandbox();
    sb.chooseTemplate('mural');
    sb.toggleInvite('dana');
    sb.draft = { shareKey: 'k', token: 't' };
    sb.assign(sb.idea!.missions[0], 'dana');
    expect(sb.draft).toBeNull();
    sb.draft = { shareKey: 'k', token: 't' };
    sb.reset();
    expect(sb.draft).toBeNull();
  });
});
