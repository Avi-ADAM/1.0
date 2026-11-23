import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import { cleanInput, newProspect } from '$lib/growth/prospect';
import { identityKeys } from '$lib/growth/dedupe';
import { fileRepository, hashKeys, memoryRepository, setGrowthRepositoryForTests } from './repo';
import { checkGrowthOperator } from './operator';
import { strapiRepository, toStrapi } from './strapiRepo';
import { draftOutreach, researchProspect } from './agent';
import { growthConfigs } from '../actions/configs/growth';

const NOW = '2026-11-20T10:00:00.000Z';

function make(name: string, over: Record<string, string> = {}) {
  const c = cleanInput({ name, ...over }, 'u1', NOW);
  if (!c.ok) throw new Error('fixture');
  return newProspect(c.value, hashKeys(identityKeys(c.value)), 'u1', NOW);
}

describe('file repository', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'growth-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('survives a new process and serialises concurrent updates', async () => {
    const repo = fileRepository(dir);
    const p = make('A', { email: 'a@a.co' });
    await repo.insert([p]);
    await Promise.all(
      Array.from({ length: 20 }, (_, i) => repo.update(p.id, (x) => ({ ...x, notes: `${x.notes ?? ''}${i},` })))
    );
    const again = fileRepository(dir);
    const back = await again.get(p.id);
    expect(back?.notes?.split(',').filter(Boolean)).toHaveLength(20);
    expect(JSON.parse(readFileSync(join(dir, 'prospects.json'), 'utf8')).version).toBe(1);
  });

  it('keeps identity keys hashed, never the email in clear', async () => {
    const repo = fileRepository(dir);
    await repo.insert([make('A', { email: 'secret@a.co' })]);
    const keys = [...(await repo.knownKeys())];
    expect(keys.join()).not.toContain('secret');
    expect(keys).toContain(hashKeys(['email:secret@a.co'])[0]);
  });
});

/** A tiny in-memory stand-in for Strapi's growthProspects GraphQL, qid by qid. */
function fakeStrapi() {
  const rows: { id: number; attributes: Record<string, any> }[] = [];
  let seq = 0;
  const page = (list: typeof rows, start: number, limit: number) => ({ data: { growthProspects: { data: list.slice(start, start + limit) } } });
  const execute = vi.fn(async (qid: string, v: any) => {
    switch (qid) {
      case 'growthProspects':
      case 'growthProspectKeys':
        return page(rows, v.start, v.limit);
      case 'growthProspectByUid':
        return page(rows.filter((r) => r.attributes.uid === v.uid), 0, 1);
      case 'growthProspectCreate':
        rows.push({ id: ++seq, attributes: structuredClone(v.data) });
        return { data: { createGrowthProspect: { data: { id: String(seq) } } } };
      case 'growthProspectUpdate': {
        const r = rows.find((x) => String(x.id) === v.id)!;
        r.attributes = { ...r.attributes, ...structuredClone(v.data) };
        return { data: { updateGrowthProspect: { data: { id: v.id } } } };
      }
    }
    throw new Error(qid);
  });
  return { rows, client: { execute } };
}

describe('strapi repository', () => {
  it('round-trips a prospect by its app id and serialises updates', async () => {
    const f = fakeStrapi();
    const repo = strapiRepository(async () => f.client);
    const p = make('A', { email: 'a@a.co', city: 'Haifa' });
    await repo.insert([p, make('B')]);
    expect(f.rows).toHaveLength(2);
    const back = await repo.get(p.id);
    expect(back).toMatchObject({ id: p.id, name: 'A', email: 'a@a.co', city: 'Haifa', stage: p.stage, dedupeKeys: p.dedupeKeys });
    await Promise.all(
      Array.from({ length: 10 }, (_, i) => repo.update(p.id, (x) => ({ ...x, notes: `${x.notes ?? ''}${i},` })))
    );
    expect((await repo.get(p.id))?.notes?.split(',').filter(Boolean)).toHaveLength(10);
    expect(await repo.update('nope', (x) => x)).toBeNull();
    expect((await repo.list()).map((x) => x.name).sort()).toEqual(['A', 'B']);
    expect([...(await repo.knownKeys())]).toEqual(expect.arrayContaining(p.dedupeKeys));
  });

  it('walks every page and never lets an update change the id', async () => {
    const f = fakeStrapi();
    const repo = strapiRepository(async () => f.client);
    const many = Array.from({ length: 450 }, (_, i) => make(`N${i}`));
    for (const m of many) f.rows.push({ id: f.rows.length + 1, attributes: toStrapi(m) });
    expect(await repo.list()).toHaveLength(450);
    const first = many[0];
    const moved = await repo.update(first.id, (x) => ({ ...x, id: 'other' }));
    expect(moved?.id).toBe(first.id);
    expect(f.rows[0].attributes.uid).toBe(first.id);
  });

  it('a GraphQL error is an error, not an empty pipeline', async () => {
    const repo = strapiRepository(async () => ({ execute: async () => ({ errors: [{ message: 'Forbidden access' }] }) }));
    await expect(repo.list()).rejects.toThrow(/Forbidden access/);
  });
});

describe('operator check', () => {
  afterEach(() => {
    for (const k of Object.keys(env)) delete env[k];
  });
  const member = { execute: vi.fn(async () => ({ data: { usersPermissionsUser: { data: { attributes: { projects_1s: { data: [{ id: '1' }] } } } } } })) };
  const stranger = { execute: vi.fn(async () => ({ data: { usersPermissionsUser: { data: { attributes: { projects_1s: { data: [] } } } } } })) };

  it('is off until a state dir is configured', async () => {
    expect(await checkGrowthOperator('7', 'jwt', fetch, member)).toEqual({ ok: false, reason: 'not_configured' });
  });
  it('asks membership of the growth rikma under the caller\'s own JWT', async () => {
    env.GROWTH_STATE_DIR = '/tmp/x';
    env.GROWTH_PROJECT_ID = '42';
    expect(await checkGrowthOperator('7', 'jwt-7', fetch, member)).toEqual({ ok: true, projectId: '42' });
    expect(member.execute).toHaveBeenCalledWith('65checkProjectMembership', { uid: '7', projectId: '42' }, 'jwt-7', fetch);
    expect(await checkGrowthOperator('7', 'jwt-7', fetch, stranger)).toEqual({ ok: false, reason: 'not_operator' });
    expect(await checkGrowthOperator('7', null, fetch, member)).toEqual({ ok: false, reason: 'not_signed_in' });
  });
  it('the allowlist narrows, never widens', async () => {
    env.GROWTH_STATE_DIR = '/tmp/x';
    env.GROWTH_OPERATOR_IDS = '8, 9';
    expect(await checkGrowthOperator('7', 'jwt', fetch, member)).toEqual({ ok: false, reason: 'not_operator' });
    expect(await checkGrowthOperator('8', 'jwt', fetch, stranger)).toEqual({ ok: false, reason: 'not_operator' });
  });
});

const SITE = 'Shir Catering — kosher catering for weddings across the Sharon. Write to info@shir.co.il';

describe('research agent', () => {
  const readSite = vi.fn(async (url: any) => ({ url: String(url), ok: true, title: 'Shir', text: SITE }));

  it('verifies against the page it read, and takes contacts from the page only', async () => {
    const generate = vi.fn(async (_prompt: string) =>
      JSON.stringify({
        summary: { text: 'Kosher caterer', evidence: 'kosher catering for weddings', confidence: 'high' },
        services: [{ text: 'Weddings', evidence: 'catering for weddings', confidence: 'high' }],
        // A model that "found" a phone has no say: contacts come from the page.
        contacts: [{ kind: 'phone', value: '03-0000000' }]
      })
    );
    const r = await researchProspect(make('Shir', { website: 'shir.co.il' }), 'u1', 'en', { generate, readSite: readSite as any });
    expect(r.status).toBe('done');
    expect(r.summary?.verified).toBe(true);
    expect(r.contacts).toEqual([{ kind: 'email', value: 'info@shir.co.il', sourceUrl: 'https://shir.co.il/' }]);
    expect(generate.mock.calls[0][0]).toContain(SITE);
  });

  it('does not fetch social networks, and still reports without a model', async () => {
    readSite.mockClear();
    const r = await researchProspect(make('Shir', { website: 'https://facebook.com/shir' }), 'u1', 'he', { generate: null, readSite: readSite as any });
    expect(readSite).not.toHaveBeenCalled();
    expect(r.problems).toEqual(['site:not-fetched-social', 'model:unavailable']);
    expect(r.status).toBe('failed');
    expect(r.confidence).toBe('low');
  });

  it('outreach falls back to the templates when the model fails', async () => {
    const r = await draftOutreach(make('Shir'), 'he', async () => 'garbage');
    expect(r.usedModel).toBe(false);
    expect(r.variants).toHaveLength(4);
    const ok = await draftOutreach(make('Shir'), 'en', async () => JSON.stringify({ variants: [{ kind: 'friendly', body: 'Hi Shir' }] }));
    expect(ok.variants[0]).toMatchObject({ origin: 'ai', body: 'Hi Shir\n\n{{link}}' });
    expect(ok.variants[1].origin).toBe('template');
  });
});

describe('growth actions', () => {
  const action = (key: string) => growthConfigs.find((c) => c.key === key)!.graphqlOperation as any;
  const ctx = { userId: 'u1', jwt: 'j', lang: 'he', fetch } as any;
  let repo: ReturnType<typeof memoryRepository>;
  beforeEach(() => {
    repo = memoryRepository();
    setGrowthRepositoryForTests(repo);
  });
  afterEach(() => setGrowthRepositoryForTests(null));

  it('every action is operator-only and publishes a realtime scope', () => {
    expect(growthConfigs.length).toBe(8);
    for (const c of growthConfigs) {
      expect(c.authRules.map((r) => r.type)).toEqual(['jwt', 'custom']);
      expect(c.access).toEqual(['user']);
      expect(c.realtime).toBeTruthy();
    }
  });

  it('adds once, and the same business again is the existing one', async () => {
    const a = await action('growthSaveProspect')({ prospect: { name: 'Shir', website: 'shir.co.il' } }, ctx, {});
    const b = await action('growthSaveProspect')({ prospect: { name: 'Other name', website: 'https://www.shir.co.il/' } }, ctx, {});
    expect(b).toEqual({ id: a.id, duplicated: true, stage: 'discovered' });
    expect(await repo.list()).toHaveLength(1);
  });

  it('imports a CSV, skipping repeats in the file and in the store', async () => {
    await action('growthSaveProspect')({ prospect: { name: 'Known', phone: '054-1234567' } }, ctx, {});
    const r = await action('growthImportProspects')(
      { csv: 'name,phone,email\nA,,a@a.co\nB,+972541234567,\nA2,,A@A.CO\nC,,bad-email\n,,x@x.co', fileName: 'f.csv' },
      ctx,
      {}
    );
    expect(r.imported).toBe(1);
    expect(r.duplicates).toEqual([
      { line: 3, name: 'B', inFile: false },
      { line: 4, name: 'A2', inFile: true }
    ]);
    expect(r.invalid.map((x: any) => x.code).sort()).toEqual(['BAD_EMAIL', 'NAME_REQUIRED']);
  });

  it('do-not-contact closes every outreach door and forgets the contact', async () => {
    const { id } = await action('growthSaveProspect')({ prospect: { name: 'Shir', email: 'a@shir.co.il', phone: '0541234567' } }, ctx, {});
    await action('growthLogActivity')({ id, kind: 'response', response: 'doNotContact' }, ctx, {});
    const p = (await repo.get(id))!;
    expect(p).toMatchObject({ stage: 'doNotContact', email: null, phone: null });
    await expect(action('growthLogActivity')({ id, kind: 'contacted', channel: 'email' }, ctx, {})).rejects.toMatchObject({ code: 'CLOSED_DOOR' });
    await expect(action('growthOutreach')({ id, mode: 'generate' }, ctx, {})).rejects.toMatchObject({ code: 'CLOSED_DOOR' });
    await expect(action('growthPrepareOnboarding')({ id }, ctx, {})).rejects.toMatchObject({ code: 'CLOSED_DOOR' });
    // …and it is still recognised: the same email cannot come back in.
    const r = await action('growthImportProspects')({ csv: 'name,email\nShir again,a@shir.co.il' }, ctx, {});
    expect(r.imported).toBe(0);
    // Reopening needs a reason.
    await expect(action('growthSetStage')({ id, stage: 'discovered' }, ctx, {})).rejects.toMatchObject({ message: 'REASON_REQUIRED' });
  });

  it('profile → approved message → contacted, only on the operator\'s word', async () => {
    const { id } = await action('growthSaveProspect')({ prospect: { name: 'Shir', category: 'catering', services: 'weddings' } }, ctx, {});
    await action('growthProfile')({ id, mode: 'generate' }, ctx, {});
    await expect(action('growthOutreach')({ id, mode: 'approve', kind: 'friendly', body: 'hi' }, ctx, {})).rejects.toMatchObject({
      message: 'PROFILE_NOT_APPROVED'
    });
    await action('growthProfile')({ id, mode: 'approve' }, ctx, {});
    await action('growthOutreach')({ id, mode: 'approve', kind: 'whatsapp', lang: 'he', body: 'היי {{link}}' }, ctx, {});
    let p = (await repo.get(id))!;
    expect(p.stage).toBe('invitationReady');
    expect(p.outreach?.approved).toMatchObject({ kind: 'whatsapp', origin: 'edited', approvedBy: 'u1' });
    await action('growthLogActivity')({ id, kind: 'contacted', channel: 'whatsapp' }, ctx, {});
    await action('growthLogActivity')({ id, kind: 'response', response: 'interested', text: 'call next week' }, ctx, {});
    p = (await repo.get(id))!;
    expect(p.stage).toBe('interested');
    expect(p.furthest).toBe('interested');
    expect(p.activity.map((a) => a.kind).slice(0, 2)).toEqual(['stage', 'response']);
  });

  it('the onboarding link needs an approved profile and the business email', async () => {
    const { id } = await action('growthSaveProspect')({ prospect: { name: 'Shir' } }, ctx, {});
    await action('growthProfile')({ id, mode: 'generate' }, ctx, {});
    await expect(action('growthPrepareOnboarding')({ id }, ctx, {})).rejects.toMatchObject({ message: 'PROFILE_NOT_APPROVED' });
    await action('growthProfile')({ id, mode: 'approve' }, ctx, {});
    await expect(action('growthPrepareOnboarding')({ id }, ctx, {})).rejects.toMatchObject({ message: 'EMAIL_REQUIRED' });
  });

  it('a follow-up date must be a real date within a year', async () => {
    const { id } = await action('growthSaveProspect')({ prospect: { name: 'Shir' } }, ctx, {});
    await expect(action('growthLogActivity')({ id, kind: 'followUp', followUpAt: 'soon' }, ctx, {})).rejects.toMatchObject({ message: 'BAD_DATE' });
    await action('growthLogActivity')({ id, kind: 'followUp', followUpAt: '2026-12-01', nextAction: 'send menu' }, ctx, {});
    expect((await repo.get(id))!).toMatchObject({ followUpAt: '2026-12-01T00:00:00.000Z', nextAction: 'send menu' });
  });
});
