/**
 * The coverage test is the point of this file: a mutation qid that reaches an
 * existing row by a client-supplied id, with no ownership rule behind it, is an
 * IDOR waiting to be written. Failing the build is what keeps `ownership.js`
 * complete as qids are added — the same deny-by-default discipline `qidsAccess`
 * already has.
 */

import { describe, it, expect, vi } from 'vitest';

const { dynamicEnv } = vi.hoisted(() => ({ dynamicEnv: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env: dynamicEnv }));

import { qids } from './qids.js';
import { qidsAccess } from './qidsAccess.js';
import { targetsOf, componentListsOf, queryFieldFor } from './qidTargets.js';
import {
  OWNERSHIP,
  buildOwnershipQuery,
  collectPrincipals,
  enforceOwnership
} from './ownership.js';

const isMutation = (q: unknown) => /^\s*mutation\b/.test(String(q));

/** Every (qid, target) a plain `user` principal can reach. */
function userReachableTargets() {
  const out: { qid: string; field: string; idVar: string }[] = [];
  for (const [qid, query] of Object.entries(qids as Record<string, string>)) {
    if (!isMutation(query)) continue;
    if (!(qidsAccess as any)[qid]?.allow?.includes('user')) continue;
    for (const t of targetsOf(query)) out.push({ qid, field: t.field, idVar: t.idVar });
  }
  return out;
}

describe('ownership manifest', () => {
  it('covers every entity a user-reachable mutation writes to by id', () => {
    const missing = [
      ...new Set(userReachableTargets().filter((t) => !OWNERSHIP[t.field]).map((t) => t.field))
    ].sort();
    expect(
      missing,
      `Entities with no ownership rule — add them to ownership.js: ${missing.join(', ')}`
    ).toEqual([]);
  });

  it('gives every rule either a check or a written reason for having none', () => {
    const empty = Object.entries(OWNERSHIP)
      .filter(([, rule]) => !rule.open && !rule.users?.length && !rule.projects?.length)
      .map(([entity]) => entity);
    expect(empty, 'a rule must name relations or say why it is open').toEqual([]);
  });

  it('does not carry rules for entities nothing targets any more', () => {
    const targeted = new Set(userReachableTargets().map((t) => t.field));
    const stale = Object.keys(OWNERSHIP).filter((e) => !targeted.has(e));
    expect(stale, 'dead ownership rules drift out of sync with the schema').toEqual([]);
  });

  it('enforces the money core the audit named', () => {
    for (const entity of ['haluka', 'tosplit', 'sale', 'sheirut', 'project']) {
      expect(OWNERSHIP[entity]?.enforce, `${entity} must block, not shadow`).toBe(true);
    }
  });
});

describe('targetsOf', () => {
  it('reads the entity and id variable out of the mutation', () => {
    expect(
      targetsOf('mutation X($halukaId: ID!) { updateHaluka(id: $halukaId, data: { ushar: true }) { data { id } } }')
    ).toEqual([{ op: 'update', entity: 'Haluka', field: 'haluka', idVar: 'halukaId' }]);
  });

  it('ignores creates — they cannot reach an existing row', () => {
    expect(targetsOf('mutation X { createHaluka(data: { amount: 1 }) { data { id } } }')).toEqual([]);
  });

  it('maps the mutation suffix to the query field', () => {
    expect(queryFieldFor('OpenMission')).toBe('openMission');
    expect(queryFieldFor('UsersPermissionsUser')).toBe('usersPermissionsUser');
  });
});

describe('componentListsOf', () => {
  it('finds a component array handed over wholesale', () => {
    expect(
      componentListsOf(
        'mutation A($id: ID!, $vots: [ComponentProjectsVotsInput]) { updateTosplit(id: $id, data: { vots: $vots }) { data { id } } }'
      )
    ).toEqual([{ field: 'vots', varName: 'vots', inputType: 'ComponentProjectsVotsInput' }]);
  });

  it('ignores scalar variables', () => {
    expect(
      componentListsOf('mutation A($id: ID!, $name: String) { updateAsk(id: $id, data: { name: $name }) { data { id } } }')
    ).toEqual([]);
  });
});

describe('buildOwnershipQuery', () => {
  it('asks for the row\'s users and each rikma\'s members in one document', () => {
    const q = buildOwnershipQuery('haluka', OWNERSHIP.haluka)!;
    expect(q).toContain('haluka(id: $id)');
    expect(q).toContain('usersend{data{id}}');
    expect(q).toContain('userrecive{data{id}}');
    expect(q).toContain('project{data{id attributes{user_1s{data{id}}}}}');
  });

  it('walks a dotted path through the intermediate relation', () => {
    const q = buildOwnershipQuery('matanotRecipeMission', OWNERSHIP.matanotRecipeMission)!;
    expect(q).toContain('matanot{data{attributes{projectcreates{data{id attributes{user_1s{data{id}}}}}}}}');
  });

  it('needs no lookup when the only path is the row itself', () => {
    expect(buildOwnershipQuery('usersPermissionsUser', { users: ['id'] })).toBeNull();
  });
});

describe('collectPrincipals', () => {
  const attributes = {
    usersend: { data: { id: '7' } },
    userrecive: { data: { id: '9' } },
    project: { data: { id: '3', attributes: { user_1s: { data: [{ id: '7' }, { id: '11' }] } } } }
  };

  it('collects the named users and the rikma members', () => {
    expect(collectPrincipals(attributes, '1', OWNERSHIP.haluka)).toEqual(new Set(['7', '9', '11']));
  });

  it('resolves the `id` self-path to the row', () => {
    expect(collectPrincipals({}, '42', { users: ['id'] })).toEqual(new Set(['42']));
  });

  it('survives a null relation', () => {
    expect(collectPrincipals({ usersend: { data: null } }, '1', { users: ['usersend'] })).toEqual(
      new Set()
    );
  });
});

describe('enforceOwnership', () => {
  const target = { op: 'update' as const, entity: 'Haluka', field: 'haluka', idVar: 'id' };

  function strapiReturning(attributes: any) {
    return vi.fn(async () =>
      new Response(JSON.stringify({ data: { haluka: { data: attributes && { id: '5', attributes } } } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
  }

  const base = {
    queId: '81updateHaluka',
    isSer: false,
    variablesObject: { id: '5' },
    bearer1: 'Bearer x',
    ep: 'http://strapi/graphql',
    targets: [target],
    mode: 'enforce' as const
  };

  const owned = {
    usersend: { data: { id: '7' } },
    userrecive: { data: { id: '9' } },
    project: { data: { id: '3', attributes: { user_1s: { data: [{ id: '7' }] } } } }
  };

  it('lets a party through', async () => {
    await expect(
      enforceOwnership({ ...base, callerId: '9', fetch: strapiReturning(owned) as any })
    ).resolves.toBeUndefined();
  });

  it('lets a member of the owning rikma through', async () => {
    await expect(
      enforceOwnership({ ...base, callerId: '7', fetch: strapiReturning(owned) as any })
    ).resolves.toBeUndefined();
  });

  it('blocks a stranger — the reported vulnerability', async () => {
    await expect(
      enforceOwnership({ ...base, callerId: '999', fetch: strapiReturning(owned) as any })
    ).rejects.toMatchObject({ status: 403 });
  });

  it('answers 404 for a row the caller cannot even read', async () => {
    await expect(
      enforceOwnership({ ...base, callerId: '999', fetch: strapiReturning(null) as any })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('never blocks the service path', async () => {
    const doFetch = strapiReturning(owned);
    await expect(
      enforceOwnership({ ...base, isSer: true, callerId: undefined, fetch: doFetch as any })
    ).resolves.toBeUndefined();
    expect(doFetch).not.toHaveBeenCalled();
  });

  it('refuses the write when ownership cannot be established at all', async () => {
    const doFetch = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    await expect(
      enforceOwnership({ ...base, callerId: '7', fetch: doFetch as any })
    ).rejects.toMatchObject({ status: 503 });
  });

  it('shadow-logs instead of blocking for an entity that is not enforced yet', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const doFetch = vi.fn(async () =>
      new Response(JSON.stringify({ data: { forum: { data: { id: '5', attributes: {} } } } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );
    await expect(
      enforceOwnership({
        ...base,
        queId: '92updateForumSubject',
        callerId: '999',
        targets: [{ op: 'update', entity: 'Forum', field: 'forum', idVar: 'id' }],
        fetch: doFetch as any
      })
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('allows, loudly, when the row names nobody at all', async () => {
    // An unpopulated relation is a data gap, not an intruder — and every row
    // this guard exists for does have an owner.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(
      enforceOwnership({ ...base, callerId: '999', fetch: strapiReturning({}) as any })
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('pins a user row to its own owner without a lookup', async () => {
    const doFetch = strapiReturning(owned);
    const userTarget = {
      op: 'update' as const,
      entity: 'UsersPermissionsUser',
      field: 'usersPermissionsUser',
      idVar: 'userId'
    };
    await expect(
      enforceOwnership({
        ...base,
        queId: '81updateAskeds',
        callerId: '7',
        variablesObject: { userId: '7' },
        targets: [userTarget],
        fetch: doFetch as any
      })
    ).resolves.toBeUndefined();
    await expect(
      enforceOwnership({
        ...base,
        queId: '81updateAskeds',
        callerId: '7',
        variablesObject: { userId: '999' },
        targets: [userTarget],
        fetch: doFetch as any
      })
    ).rejects.toMatchObject({ status: 403 });
    expect(doFetch).not.toHaveBeenCalled();
  });

  it('skips entities that are open on purpose', async () => {
    const doFetch = strapiReturning(owned);
    await expect(
      enforceOwnership({
        ...base,
        callerId: '999',
        targets: [{ op: 'update', entity: 'Timegrama', field: 'timegrama', idVar: 'id' }],
        fetch: doFetch as any
      })
    ).resolves.toBeUndefined();
    expect(doFetch).not.toHaveBeenCalled();
  });
});
