/**
 * Address resolution (§5.0): the API must agree with the public page about
 * which rikma a slug names — and move a stale address without losing the rest
 * of the path or the query.
 */

import { describe, it, expect } from 'vitest';
import {
  apiRikmaPath,
  resolveRikmaFromPath,
  type RikmaRun
} from './rikmaPath.js';

/** A fake Strapi: only the two identity queries the resolver may ask. */
function runner(map: {
  bySlug?: Record<string, { id: string; slug: string | null }>;
  byFormer?: Record<string, { id: string; slug: string | null }>;
  calls?: string[];
}): RikmaRun {
  return async (qid, vars) => {
    map.calls?.push(qid);
    if (qid === 'rikmaProjectBySlug') {
      const hit = map.bySlug?.[String(vars.slug)];
      return {
        data: {
          projects: {
            data: hit ? [{ id: hit.id, attributes: { slug: hit.slug } }] : []
          }
        }
      };
    }
    if (qid === 'rikmaProjectByFormerSlug') {
      const token = String(vars.token).trim();
      const hit = map.byFormer?.[token];
      return {
        data: {
          projects: {
            data: hit ? [{ id: hit.id, attributes: { slug: hit.slug } }] : []
          }
        }
      };
    }
    throw new Error(`unexpected qid ${qid}`);
  };
}

describe('resolveRikmaFromPath', () => {
  it('reads a slug', async () => {
    const run = runner({ bySlug: { haohel: { id: '57', slug: 'haohel' } } });
    expect(await resolveRikmaFromPath('haohel', run)).toEqual({
      kind: 'ok',
      projectId: '57',
      slug: 'haohel',
      canonicalPath: '/api/v1/r/haohel'
    });
  });

  it('moves a different spelling, keeping the sub-path and the query', async () => {
    const run = runner({ bySlug: { bees: { id: '61', slug: 'bees' } } });
    expect(
      await resolveRikmaFromPath('Bees', run, {
        search: '?limit=50',
        suffix: '/products'
      })
    ).toEqual({
      kind: 'redirect',
      location: '/api/v1/r/bees/products?limit=50',
      canonicalPath: '/api/v1/r/bees',
      reason: 'spelling'
    });
    expect(run).toBeDefined();
  });

  it('moves an address the rikma used to have — and says where it moved', async () => {
    const run = runner({
      bySlug: {},
      byFormer: { 'old-bees': { id: '61', slug: 'bees' } }
    });
    expect(
      await resolveRikmaFromPath('old-bees', run, {
        search: '?page=2',
        suffix: '/products'
      })
    ).toEqual({
      kind: 'redirect',
      location: '/api/v1/r/bees/products?page=2',
      canonicalPath: '/api/v1/r/bees',
      reason: 'former'
    });
  });

  it('moves a former address of a rikma that has no address yet to its id', async () => {
    const run = runner({
      bySlug: {},
      byFormer: { 'old-bees': { id: '61', slug: null } }
    });
    const resolved = await resolveRikmaFromPath('old-bees', run);
    expect(resolved).toMatchObject({
      kind: 'redirect',
      location: '/api/v1/r/61'
    });
  });

  it('404s a slug nobody has', async () => {
    const run = runner({ bySlug: {} });
    expect(await resolveRikmaFromPath('nobody', run)).toEqual({
      kind: 'notFound'
    });
  });

  it('404s something that cannot be a slug at all', async () => {
    const run = runner({});
    expect(await resolveRikmaFromPath('not a slug', run)).toEqual({
      kind: 'notFound'
    });
    expect(await resolveRikmaFromPath('', run)).toEqual({ kind: 'notFound' });
    expect(await resolveRikmaFromPath('a--b', run)).toEqual({
      kind: 'notFound'
    });
  });

  it('takes a numeric id without asking Strapi anything', async () => {
    const calls: string[] = [];
    const run = runner({ calls });
    expect(await resolveRikmaFromPath('57', run)).toEqual({
      kind: 'ok',
      projectId: '57',
      slug: null,
      canonicalPath: '/api/v1/r/57'
    });
    // Existence is the handler's query to prove; resolving an id is pure.
    expect(calls).toEqual([]);
  });

  it('never reflects an unvalidated suffix into a redirect', async () => {
    const run = runner({ bySlug: { bees: { id: '61', slug: 'bees' } } });
    const resolved = await resolveRikmaFromPath('Bees', run, {
      suffix: '/../../etc/passwd'
    });
    expect(resolved).toMatchObject({
      kind: 'redirect',
      location: '/api/v1/r/bees'
    });
  });

  it('spells the API prefix in one place', () => {
    expect(apiRikmaPath('haohel')).toBe('/api/v1/r/haohel');
    expect(apiRikmaPath(57)).toBe('/api/v1/r/57');
  });
});

describe('the page and the API share the decision', () => {
  /** Exactly what `(regandnon)/r/[slug]/+page.server.js` passes. */
  const pageAddress = (target: { slug: string | null; projectId: string }) =>
    target.slug ? `/r/${target.slug}` : `/project/${target.projectId}`;

  it('moves a different spelling to the page’s own address', async () => {
    const run = runner({ bySlug: { bees: { id: '61', slug: 'bees' } } });
    const resolved = await resolveRikmaFromPath('Bees', run, {
      search: '?tab=x',
      address: pageAddress
    });
    expect(resolved).toEqual({
      kind: 'redirect',
      location: '/r/bees?tab=x',
      canonicalPath: '/api/v1/r/bees',
      reason: 'spelling'
    });
  });

  it('moves an old address to /project/<id> when the rikma has no slug', async () => {
    const run = runner({
      bySlug: {},
      byFormer: { 'old-bees': { id: '61', slug: null } }
    });
    const resolved = await resolveRikmaFromPath('old-bees', run, {
      address: pageAddress
    });
    expect(resolved).toMatchObject({
      kind: 'redirect',
      location: '/project/61'
    });
  });

  it('resolves the same rikma the API resolves', async () => {
    const run = runner({ bySlug: { bees: { id: '61', slug: 'bees' } } });
    const page = await resolveRikmaFromPath('bees', run, {
      address: pageAddress
    });
    const api = await resolveRikmaFromPath('bees', run);
    expect(page).toMatchObject({ kind: 'ok', projectId: '61' });
    expect(api).toMatchObject({ kind: 'ok', projectId: '61' });
  });
});
