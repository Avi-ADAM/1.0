import { describe, expect, it } from 'vitest';
import {
  applyIdentityDecision,
  applyRikmaIdentity,
  findBySlug,
  slugAvailability,
  type Run
} from './identity.js';
import { defaultLook } from '$lib/rikmaLook/look.js';

interface FakeProject {
  id: string;
  slug: string | null;
  formerSlugs: string | null;
  look: unknown;
}

/** A tiny in-memory Strapi that answers the rikma* qids. */
function fakeStrapi(projects: FakeProject[], opts: { pending?: Array<{ slug: string; pid: string }>; uploads?: Record<string, { url: string; mime: string }>; decisions?: Record<string, any> } = {}) {
  const writes: Array<Record<string, unknown>> = [];
  const run: Run = async (qid, vars) => {
    switch (qid) {
      case 'rikmaIdentityByProject': {
        const p = projects.find((x) => x.id === vars.id);
        return { data: { project: { data: p ? { id: p.id, attributes: { slug: p.slug, formerSlugs: p.formerSlugs, look: p.look } } : null } } };
      }
      case 'rikmaProjectBySlug':
        return { data: { projects: { data: projects.filter((p) => p.slug === vars.slug).map((p) => ({ id: p.id, attributes: { slug: p.slug } })) } } };
      case 'rikmaProjectByFormerSlug':
        return { data: { projects: { data: projects.filter((p) => (p.formerSlugs ?? '').includes(String(vars.token))).map((p) => ({ id: p.id, attributes: { slug: p.slug } })) } } };
      case 'rikmaOpenAddressProposals':
        return { data: { decisions: { data: (opts.pending ?? []).filter((d) => d.slug === vars.slug).map((d, i) => ({ id: String(i), attributes: { projects: { data: [{ id: d.pid }] } } })) } } };
      case 'rikmaUploadFile': {
        const u = opts.uploads?.[String(vars.id)];
        return { data: { uploadFile: { data: u ? { id: vars.id, attributes: u } : null } } };
      }
      case 'rikmaIdentityDecision':
        return { data: { decision: { data: opts.decisions?.[String(vars.id)] ? { id: vars.id, attributes: opts.decisions[String(vars.id)] } : null } } };
      case 'rikmaUpdateIdentity': {
        writes.push(vars);
        const p = projects.find((x) => x.id === vars.id)!;
        if ('slug' in vars) p.slug = vars.slug as string;
        if ('formerSlugs' in vars) p.formerSlugs = vars.formerSlugs as string;
        if ('look' in vars) p.look = vars.look;
        return { data: { updateProject: { data: { id: p.id } } } };
      }
      default:
        throw new Error(`unexpected qid ${qid}`);
    }
  };
  return { run, writes, runners: { read: run, write: run } };
}

describe('slugAvailability', () => {
  const projects = (): FakeProject[] => [
    { id: '1', slug: 'bees', formerSlugs: ' old-bees ', look: null },
    { id: '2', slug: null, formerSlugs: null, look: null }
  ];

  it('knows who holds an address, now or before', async () => {
    const { run } = fakeStrapi(projects());
    expect(await findBySlug(run, 'bees')).toEqual({ projectId: '1', currentSlug: 'bees', former: false });
    expect(await findBySlug(run, 'old-bees')).toEqual({ projectId: '1', currentSlug: 'bees', former: true });
    expect(await findBySlug(run, 'nobody')).toBeNull();
  });

  it('refuses another rikma’s current and former address, allows its own', async () => {
    const { run } = fakeStrapi(projects());
    expect(await slugAvailability(run, 'bees', '2')).toMatchObject({ ok: false, reason: 'taken' });
    expect(await slugAvailability(run, 'old-bees', '2')).toMatchObject({ ok: false, reason: 'taken' });
    expect(await slugAvailability(run, 'old-bees', '1')).toMatchObject({ ok: true, mine: true });
    expect(await slugAvailability(run, 'Fresh Name', '2')).toEqual({ ok: true, slug: 'fresh-name', mine: false });
    expect(await slugAvailability(run, 'www', '2')).toMatchObject({ ok: false, reason: 'reserved' });
  });

  it('holds an address for the rikma that proposed it first', async () => {
    const { run } = fakeStrapi(projects(), { pending: [{ slug: 'honey', pid: '1' }] });
    expect(await slugAvailability(run, 'honey', '2')).toMatchObject({ ok: false, reason: 'pending' });
    expect(await slugAvailability(run, 'honey', '1')).toMatchObject({ ok: true });
  });
});

describe('applyRikmaIdentity', () => {
  it('moves the address and keeps the old one redirecting', async () => {
    const ps: FakeProject[] = [{ id: '1', slug: 'bees', formerSlugs: null, look: null }];
    const { runners } = fakeStrapi(ps);
    const r = await applyRikmaIdentity(runners, '1', { slug: 'bees-of-galilee' });
    expect(r).toMatchObject({ slug: 'bees-of-galilee', changed: true });
    expect(ps[0]).toMatchObject({ slug: 'bees-of-galilee', formerSlugs: ' bees ' });
  });

  it('re-checks at apply time: an address taken meanwhile is refused', async () => {
    const ps: FakeProject[] = [
      { id: '1', slug: null, formerSlugs: null, look: null },
      { id: '2', slug: 'honey', formerSlugs: null, look: null }
    ];
    const { runners, writes } = fakeStrapi(ps);
    await expect(applyRikmaIdentity(runners, '1', { slug: 'honey' })).rejects.toMatchObject({ code: 'slug:taken' });
    expect(writes).toHaveLength(0);
  });

  it('stores a look with images re-resolved by id and SVGs dropped', async () => {
    const ps: FakeProject[] = [{ id: '1', slug: null, formerSlugs: null, look: null }];
    const { runners } = fakeStrapi(ps, {
      uploads: { '5': { url: 'https://cdn.example/real.png', mime: 'image/png' }, '6': { url: 'https://cdn.example/x.svg', mime: 'image/svg+xml' } }
    });
    const look = defaultLook('publicService');
    look.media.cover = { id: '5', url: 'https://evil.example/swapped.png' };
    await applyRikmaIdentity(runners, '1', { look });
    expect((ps[0].look as any).media.cover).toEqual({ id: '5', url: 'https://cdn.example/real.png' });

    look.media.cover = { id: '6', url: 'https://cdn.example/x.svg' };
    look.profile.tagline = 'changed';
    await applyRikmaIdentity(runners, '1', { look });
    expect((ps[0].look as any).media.cover).toBeNull();
  });

  it('refuses an incomplete look and clears one on null', async () => {
    const ps: FakeProject[] = [{ id: '1', slug: null, formerSlugs: null, look: defaultLook() }];
    const { runners } = fakeStrapi(ps);
    const broken = defaultLook();
    broken.cta.primary = { kind: 'link', label: 'website', url: null };
    await expect(applyRikmaIdentity(runners, '1', { look: broken })).rejects.toMatchObject({ code: 'look:primaryLinkMissing' });
    await applyRikmaIdentity(runners, '1', { look: null });
    expect(ps[0].look).toBeNull();
  });

  it('writes nothing when nothing changes', async () => {
    const ps: FakeProject[] = [{ id: '1', slug: 'bees', formerSlugs: null, look: null }];
    const { runners, writes } = fakeStrapi(ps);
    expect(await applyRikmaIdentity(runners, '1', { slug: 'bees' })).toMatchObject({ changed: false });
    expect(writes).toHaveLength(0);
  });
});

describe('applyIdentityDecision', () => {
  it('applies the decision of this rikma only', async () => {
    const ps: FakeProject[] = [{ id: '1', slug: null, formerSlugs: null, look: null }];
    const { runners } = fakeStrapi(ps, {
      decisions: {
        '10': { kind: 'address', newSlug: 'bees', projects: { data: [{ id: '1' }] } },
        '11': { kind: 'address', newSlug: 'wasps', projects: { data: [{ id: '9' }] } }
      }
    });
    expect(await applyIdentityDecision(runners, '10', '1')).toEqual({ applied: true, kind: 'address' });
    expect(ps[0].slug).toBe('bees');
    await expect(applyIdentityDecision(runners, '11', '1')).rejects.toMatchObject({ code: 'wrongProject' });
  });
});
