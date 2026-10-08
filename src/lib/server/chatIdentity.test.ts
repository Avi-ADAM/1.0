import { describe, expect, it, vi } from 'vitest';
import { resolveChatIdentity } from './chatIdentity';

describe('resolveChatIdentity', () => {
  it('takes the session uid and ignores the claimed one', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveChatIdentity({ uid: '7' }, '99')).toEqual({
      userId: '7',
      claimedUserId: '99',
      mismatch: true
    });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it('a guest with a claimed id is still a guest', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveChatIdentity({ uid: false }, 99).userId).toBeNull();
    expect(resolveChatIdentity(undefined, '99').userId).toBeNull();
    warn.mockRestore();
  });

  it('agreeing or missing claims are not a mismatch', () => {
    expect(resolveChatIdentity({ uid: 7 }, '7')).toEqual({ userId: '7', claimedUserId: '7', mismatch: false });
    expect(resolveChatIdentity({ uid: '7' }).mismatch).toBe(false);
    expect(resolveChatIdentity({ uid: false }, null)).toEqual({ userId: null, claimedUserId: null, mismatch: false });
  });

  it('never yields the "anonymous" placeholder as a user', () => {
    expect(resolveChatIdentity({ uid: 'anonymous' }).userId).toBeNull();
  });
});
