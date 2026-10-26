import { describe, expect, it, vi } from 'vitest';
import { inviteToOpenMission, missionInviteLink, normalizeInviteEmail } from './missionInvite';

const deps = {
  strapi: { execute: vi.fn() },
  fetch: vi.fn() as unknown as typeof fetch,
  lang: 'he'
};
const base = {
  projectId: '20',
  projectName: 'רקמה',
  openMissionId: '77',
  missionName: 'עיצוב לוגו',
  inviterId: '5'
};

describe('missionInviteLink', () => {
  it('points at the join page with the mission and the inviter', () => {
    const url = new URL(missionInviteLink('20', '77', '5'));
    expect(url.pathname).toBe('/project/20/join');
    expect(url.searchParams.get('m')).toBe('77');
    expect(url.searchParams.get('inv')).toBe('5');
  });
});

describe('normalizeInviteEmail', () => {
  it('treats empty as a link-only invite', () => {
    expect(normalizeInviteEmail(undefined)).toBeUndefined();
    expect(normalizeInviteEmail('   ')).toBeUndefined();
  });
  it('trims and lowercases', () => {
    expect(normalizeInviteEmail('  Dana@Example.COM ')).toBe('dana@example.com');
  });
  it('rejects what cannot be an address', () => {
    expect(() => normalizeInviteEmail('dana')).toThrow();
    expect(() => normalizeInviteEmail('a b@c.d')).toThrow();
    expect(() => normalizeInviteEmail(42)).toThrow();
    expect(() => normalizeInviteEmail(`${'a'.repeat(250)}@x.io`)).toThrow();
  });
});

describe('inviteToOpenMission', () => {
  it('without an email returns the link and calls nothing', async () => {
    const engine = vi.fn();
    const out = await inviteToOpenMission(base, deps, engine);
    expect(out.result).toBe('linkOnly');
    expect(out.link).toContain('m=77');
    expect(engine).not.toHaveBeenCalled();
  });

  it('hands exactly this open mission to the engine', async () => {
    const engine = vi.fn().mockResolvedValue({ result: 'invited', userId: '9', created: 1, joinUrl: 'x' });
    const out = await inviteToOpenMission({ ...base, email: 'dana@example.com' }, deps, engine);
    expect(engine).toHaveBeenCalledWith(
      'dana@example.com',
      { openMissions: [{ id: '77', name: 'עיצוב לוגו' }], openMashaabims: [] },
      'רקמה',
      expect.objectContaining({ invitedBy: '5', projectId: '20' })
    );
    expect(out).toMatchObject({ result: 'invited', registered: true });
  });

  it('never throws — a failed invite still returns the link', async () => {
    const engine = vi.fn().mockRejectedValue(new Error('mail down'));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const out = await inviteToOpenMission({ ...base, email: 'dana@example.com' }, deps, engine);
    expect(out.result).toBe('failed');
    expect(out.link).toContain('/project/20/join');
    err.mockRestore();
  });

  it('passes a rate limit through with its retry time', async () => {
    const engine = vi.fn().mockResolvedValue({ result: 'rateLimited', created: 0, joinUrl: 'x', retryAfterSeconds: 60 });
    const out = await inviteToOpenMission({ ...base, email: 'dana@example.com' }, deps, engine);
    expect(out).toMatchObject({ result: 'rateLimited', retryAfterSeconds: 60 });
  });
});
