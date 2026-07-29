/**
 * setMatanotDiscovery — the /gift directory visibility gate.
 *
 * The interesting part is the authorization: the flag may only be flipped by a
 * member of one of the product's rikmas, or by the owner of a personal product.
 * Both are derived from the product's own relations, never from a param, so
 * these tests pin the "someone else's product" case shut.
 */

import { describe, it, expect, vi } from 'vitest';
import { setMatanotDiscoveryConfig } from './setMatanotDiscovery.js';

const handler = setMatanotDiscoveryConfig.graphqlOperation as (
  params: Record<string, any>,
  context: any,
  util: any
) => Promise<any>;

const context = { userId: '7', jwt: 'jwt', fetch: (() => {}) as any };

/** Matanot meta node as 266getMatanotSellerMeta returns it. */
function meta({
  origin = 'project',
  ownerId = null,
  projectIds = [] as string[]
} = {}) {
  return {
    data: {
      matanot: {
        data: {
          id: '11',
          attributes: {
            origin,
            hideFromDiscovery: false,
            projectcreates: { data: projectIds.map((id) => ({ id })) },
            owner_user: { data: ownerId ? { id: ownerId } : null }
          }
        }
      }
    }
  };
}

/** 65checkProjectMembership answers "member" for the ids in `memberOf`. */
function membership(memberOf: string[]) {
  return (vars: Record<string, any>) => ({
    data: {
      usersPermissionsUser: {
        data: {
          attributes: {
            projects_1s: {
              data: memberOf.includes(String(vars.projectId)) ? [{ id: vars.projectId }] : []
            }
          }
        }
      }
    }
  });
}

function fakeStrapi(responses: Record<string, any>) {
  const execute = vi.fn(async (qid: string, vars: Record<string, any>) => {
    const r = responses[qid];
    if (r === undefined) throw new Error(`unexpected qid ${qid}`);
    return typeof r === 'function' ? r(vars) : r;
  });
  return { execute };
}

const mutationOk = (hidden: boolean) => ({
  data: { updateMatanot: { data: { id: '11', attributes: { hideFromDiscovery: hidden } } } }
});

describe('setMatanotDiscovery config', () => {
  it('is registered under a stable key with a boolean flag param', () => {
    expect(setMatanotDiscoveryConfig.key).toBe('setMatanotDiscovery');
    expect(setMatanotDiscoveryConfig.paramSchema.matanotId.required).toBe(true);
    expect(setMatanotDiscoveryConfig.paramSchema.hideFromDiscovery.type).toBe('boolean');
    expect(setMatanotDiscoveryConfig.authRules.some((r) => r.type === 'jwt')).toBe(true);
  });
});

describe('setMatanotDiscovery authorization', () => {
  it('lets the owner hide a personal product', async () => {
    const strapi = fakeStrapi({
      '266getMatanotSellerMeta': meta({ origin: 'personal', ownerId: '7' }),
      '285setMatanotDiscovery': mutationOk(true)
    });

    const res = await handler(
      { matanotId: '11', hideFromDiscovery: true },
      context,
      { strapi }
    );

    expect(res.data).toEqual({ matanotId: '11', hideFromDiscovery: true });
    expect(strapi.execute).toHaveBeenCalledWith(
      '285setMatanotDiscovery',
      { id: '11', hideFromDiscovery: true },
      'jwt',
      context.fetch
    );
  });

  it('lets a member of any of the product rikmas flip the flag', async () => {
    const strapi = fakeStrapi({
      '266getMatanotSellerMeta': meta({ projectIds: ['3', '4'] }),
      '65checkProjectMembership': membership(['4']),
      '285setMatanotDiscovery': mutationOk(false)
    });

    const res = await handler(
      { matanotId: '11', hideFromDiscovery: false },
      context,
      { strapi }
    );

    expect(res.data.hideFromDiscovery).toBe(false);
    expect(strapi.execute).toHaveBeenCalledWith(
      '65checkProjectMembership',
      { uid: '7', projectId: '3' },
      'jwt',
      context.fetch
    );
  });

  it('refuses a caller who is neither owner nor member, without writing', async () => {
    const strapi = fakeStrapi({
      '266getMatanotSellerMeta': meta({ ownerId: '99', projectIds: ['3'] }),
      '65checkProjectMembership': membership([])
    });

    await expect(
      handler({ matanotId: '11', hideFromDiscovery: true }, context, { strapi })
    ).rejects.toThrow(/Only the seller/);

    expect(strapi.execute).not.toHaveBeenCalledWith(
      '285setMatanotDiscovery',
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });

  it('rejects a missing product and a non-boolean flag', async () => {
    const strapi = fakeStrapi({
      '266getMatanotSellerMeta': { data: { matanot: { data: null } } }
    });

    await expect(
      handler({ matanotId: '11', hideFromDiscovery: true }, context, { strapi })
    ).rejects.toThrow(/not found/);

    await expect(
      handler({ matanotId: '11', hideFromDiscovery: 'yes' }, context, { strapi })
    ).rejects.toThrow(/must be a boolean/);
  });
});
