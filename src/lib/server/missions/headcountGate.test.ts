/**
 * The silence path (timegrama/ask.svelte) makes the same headcount decision as
 * the action finalizers — through the admin transport, with no user.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const env: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env }));

import { acceptanceEffectAsAdmin } from './headcountGate';

const seat = { id: '1', attributes: { lifecycle: 'active', finnished: false } };

beforeEach(() => {
  delete env.MISSION_HEADCOUNT;
});

describe('acceptanceEffectAsAdmin', () => {
  it('keeps a mission with free seats open, and its other candidacies standing', async () => {
    const send = vi.fn(async () => ({ data: { openMission: { data: { id: '9', attributes: { howMeny: '3', mesimabetahaliches: { data: [seat] }, asks: { data: [] } } } } } }));
    const e = await acceptanceEffectAsAdmin(send, '9');
    expect(e).toMatchObject({ archiveOpenMission: false, archiveSiblingAsks: false, remainingAfter: 1, degraded: false });
    expect(String(send.mock.calls[0][0])).toContain('openMission(id: "9")');
  });

  it('closes on the last seat', async () => {
    const send = vi.fn(async () => ({ data: { openMission: { data: { id: '9', attributes: { howMeny: 2, mesimabetahaliches: { data: [seat] } } } } } }));
    expect((await acceptanceEffectAsAdmin(send, '9')).archiveOpenMission).toBe(true);
  });

  it('falls back to the old behaviour when the read fails, and says so', async () => {
    const send = vi.fn(async () => {
      throw new Error('down');
    });
    const e = await acceptanceEffectAsAdmin(send, '9');
    expect(e).toMatchObject({ archiveOpenMission: true, degraded: true });
  });

  it('is off with MISSION_HEADCOUNT=off, without even reading', async () => {
    env.MISSION_HEADCOUNT = 'off';
    const send = vi.fn();
    expect((await acceptanceEffectAsAdmin(send, '9')).archiveOpenMission).toBe(true);
    expect(send).not.toHaveBeenCalled();
  });
});
