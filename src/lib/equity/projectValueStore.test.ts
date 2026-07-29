import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the network helper before importing the store. `vi.hoisted` keeps the
// spy accessible to both the (hoisted) mock factory and the test bodies.
const { sendToSer } = vi.hoisted(() => ({ sendToSer: vi.fn() }));
vi.mock('$lib/send/sendToSer.js', () => ({ sendToSer }));

import {
  getProjectValueSummary,
  invalidateProjectValue,
  __clearProjectValueCache
} from './projectValueStore.svelte.js';

function payload(finished: number, rikmash: number) {
  return {
    data: {
      project: {
        data: {
          attributes: {
            finnished_missions: { data: [{ attributes: { total: finished } }] },
            rikmashes: { data: [{ attributes: { total: rikmash } }] },
            mesimabetahaliches: { data: [] },
            open_missions: { data: [] }
          }
        }
      }
    }
  };
}

describe('projectValueStore', () => {
  beforeEach(() => {
    sendToSer.mockReset();
    __clearProjectValueCache();
  });

  it('dedups concurrent callers into a single network call', async () => {
    sendToSer.mockResolvedValue(payload(1000, 500));
    const [a, b, c] = await Promise.all([
      getProjectValueSummary('7'),
      getProjectValueSummary('7'),
      getProjectValueSummary('7')
    ]);
    expect(sendToSer).toHaveBeenCalledTimes(1);
    expect(a.currentValue).toBe(1500);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
  });

  it('serves a cached summary on the next call (no refetch)', async () => {
    sendToSer.mockResolvedValue(payload(200, 0));
    await getProjectValueSummary('9');
    await getProjectValueSummary('9');
    expect(sendToSer).toHaveBeenCalledTimes(1);
  });

  it('refetches after invalidateProjectValue', async () => {
    sendToSer.mockResolvedValue(payload(200, 0));
    await getProjectValueSummary('9');
    invalidateProjectValue('9');
    await getProjectValueSummary('9');
    expect(sendToSer).toHaveBeenCalledTimes(2);
  });

  it('does not cache a failed attempt — retries on the next call', async () => {
    sendToSer.mockRejectedValueOnce(new Error('boom'));
    await expect(getProjectValueSummary('5')).rejects.toThrow('boom');
    sendToSer.mockResolvedValue(payload(300, 0));
    const s = await getProjectValueSummary('5');
    expect(s.currentValue).toBe(300);
    expect(sendToSer).toHaveBeenCalledTimes(2);
  });

  it('passes isSer through to the network helper', async () => {
    sendToSer.mockResolvedValue(payload(0, 0));
    await getProjectValueSummary('3', { isSer: true });
    expect(sendToSer).toHaveBeenCalledWith(
      { pid: '3' },
      'getProjectValueSummary',
      0,
      0,
      true,
      expect.anything()
    );
  });
});
