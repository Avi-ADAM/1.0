import { describe, expect, it, vi } from 'vitest';
import { firePendingInvites, readPendingInvites, storePendingInvite } from './pendingInvites';

const at = '2026-10-26T10:00:00.000Z';

function depsReturning(attrs: unknown) {
  return {
    strapi: { execute: vi.fn().mockResolvedValue({ data: attrs }) },
    fetch: vi.fn() as unknown as typeof fetch,
    lang: 'he'
  };
}

const pendm = (pendingInvites: unknown) => ({
  pendm: {
    data: {
      id: '30',
      attributes: {
        name: 'עיצוב לוגו',
        pendingInvites,
        project: { data: { id: '20', attributes: { projectName: 'רקמה' } } }
      }
    }
  }
});

const sent = { result: 'invited' as const, link: 'x' };

describe('storePendingInvite', () => {
  it('writes the invite on the pendm with the service token', async () => {
    const strapi = { execute: vi.fn().mockResolvedValue({ data: {} }) };
    const ok = await storePendingInvite('pendm', '30', { email: 'a@b.co', invitedBy: '5', at }, strapi);
    expect(ok).toBe(true);
    expect(strapi.execute).toHaveBeenCalledWith('462setPendmPendingInvites', {
      id: '30',
      invites: [{ email: 'a@b.co', invitedBy: '5', at }]
    });
    // No jwt: the field is server-only.
    expect(strapi.execute.mock.calls[0]).toHaveLength(2);
  });

  it('uses the pmash qid for a resource', async () => {
    const strapi = { execute: vi.fn().mockResolvedValue({ data: {} }) };
    await storePendingInvite('pmash', '8', { email: 'a@b.co', invitedBy: '5', at }, strapi);
    expect(strapi.execute.mock.calls[0][0]).toBe('464setPmashPendingInvites');
  });

  it('never throws — a missing field reports false', async () => {
    const strapi = { execute: vi.fn().mockRejectedValue(new Error('Unknown field pendingInvites')) };
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(storePendingInvite('pendm', '30', { email: 'a@b.co', invitedBy: '5', at }, strapi)).resolves.toBe(false);
    err.mockRestore();
  });
});

describe('readPendingInvites', () => {
  it('keeps one entry per address and drops malformed rows', () => {
    const out = readPendingInvites([
      { email: 'Dana@Example.com', invitedBy: 5, at },
      { email: 'dana@example.com', invitedBy: '6', at },
      { email: '', invitedBy: '5' },
      { email: 'x@y.co' },
      'nonsense',
      { email: 'noa@example.com', invitedBy: '5', at, lang: 'en' }
    ]);
    expect(out).toEqual([
      { email: 'dana@example.com', invitedBy: '5', at },
      { email: 'noa@example.com', invitedBy: '5', at, lang: 'en' }
    ]);
  });

  it('treats anything but an array as nothing', () => {
    expect(readPendingInvites(null)).toEqual([]);
    expect(readPendingInvites({ email: 'a@b.co' })).toEqual([]);
  });
});

describe('firePendingInvites', () => {
  it('sends a matured pendm invite to the new open mission, in the inviter\'s language', async () => {
    const deps = depsReturning(pendm([{ email: 'dana@example.com', invitedBy: '5', at, lang: 'en' }]));
    const mission = vi.fn().mockResolvedValue(sent);
    const resource = vi.fn();
    const out = await firePendingInvites({ kind: 'pendm', proposalId: '30', openEntityId: '77' }, deps, { mission, resource });

    expect(deps.strapi.execute).toHaveBeenCalledWith('461pendmPendingInvites', { id: '30' });
    expect(mission).toHaveBeenCalledWith(
      {
        projectId: '20',
        projectName: 'רקמה',
        inviterId: '5',
        email: 'dana@example.com',
        openMissionId: '77',
        missionName: 'עיצוב לוגו'
      },
      expect.objectContaining({ lang: 'en' })
    );
    expect(resource).not.toHaveBeenCalled();
    expect(out).toEqual([sent]);
  });

  it('sends a matured pmash invite to the new open resource', async () => {
    const deps = depsReturning({
      pmash: {
        data: {
          id: '8',
          attributes: {
            name: 'מקרר תצוגה',
            pendingInvites: [{ email: 'dana@example.com', invitedBy: '5', at }],
            project: { data: { id: '20', attributes: { projectName: 'רקמה' } } }
          }
        }
      }
    });
    const mission = vi.fn();
    const resource = vi.fn().mockResolvedValue(sent);
    await firePendingInvites({ kind: 'pmash', proposalId: '8', openEntityId: '61' }, deps, { mission, resource });

    expect(deps.strapi.execute).toHaveBeenCalledWith('463pmashPendingInvites', { id: '8' });
    expect(resource).toHaveBeenCalledWith(
      expect.objectContaining({ openMashaabimId: '61', resourceName: 'מקרר תצוגה', inviterId: '5' }),
      expect.objectContaining({ lang: 'he' })
    );
    expect(mission).not.toHaveBeenCalled();
  });

  it('does nothing for a proposal without invites', async () => {
    const mission = vi.fn();
    const out = await firePendingInvites(
      { kind: 'pendm', proposalId: '30', openEntityId: '77' },
      depsReturning(pendm(null)),
      { mission, resource: vi.fn() }
    );
    expect(out).toEqual([]);
    expect(mission).not.toHaveBeenCalled();
  });

  it('never throws — an unreadable proposal or a failing sender leaves the vote standing', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const broken = {
      strapi: { execute: vi.fn().mockRejectedValue(new Error('Cannot query field pendingInvites')) },
      fetch: vi.fn() as unknown as typeof fetch
    };
    await expect(
      firePendingInvites({ kind: 'pendm', proposalId: '30', openEntityId: '77' }, broken)
    ).resolves.toEqual([]);

    const deps = depsReturning(
      pendm([
        { email: 'a@example.com', invitedBy: '5', at },
        { email: 'b@example.com', invitedBy: '5', at }
      ])
    );
    const mission = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(sent);
    const out = await firePendingInvites({ kind: 'pendm', proposalId: '30', openEntityId: '77' }, deps, {
      mission,
      resource: vi.fn()
    });
    expect(mission).toHaveBeenCalledTimes(2);
    expect(out).toEqual([sent]);
    err.mockRestore();
  });
});
