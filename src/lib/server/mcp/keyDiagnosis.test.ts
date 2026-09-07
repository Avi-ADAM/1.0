import { describe, it, expect, vi, beforeEach } from 'vitest';

const extractUserIdFromKey = vi.fn();
const verifyApiKeyDetailed = vi.fn();

vi.mock('$lib/server/apiKeys', () => ({
  extractUserIdFromKey: (k: string) => extractUserIdFromKey(k),
  verifyApiKeyDetailed: (k: string) => verifyApiKeyDetailed(k),
  // The real implementation; scope shape is not what these tests are about.
  normalizeApiKeyScopes: (raw: unknown) =>
    raw && typeof raw === 'object' && Array.isArray((raw as any).ops)
      ? { ops: (raw as any).ops.map(String) }
      : null
}));

const { checkApiKey, isRejected, repairPlan, SHADOWING_WARNING } = await import('./keyDiagnosis');

describe('checkApiKey', () => {
  beforeEach(() => {
    extractUserIdFromKey.mockReset();
    verifyApiKeyDetailed.mockReset();
  });

  it('reports an absent header as absent, not as a failure', async () => {
    expect(await checkApiKey(null)).toEqual({ user: null, verdict: 'absent' });
    expect(await checkApiKey('')).toEqual({ user: null, verdict: 'absent' });
    expect(verifyApiKeyDetailed).not.toHaveBeenCalled();
  });

  it('calls a key with no extractable user id malformed, without hitting Strapi', async () => {
    extractUserIdFromKey.mockReturnValue(null);

    expect(await checkApiKey('Bearer YOUR_KEY')).toEqual({ user: null, verdict: 'malformed' });
    expect(verifyApiKeyDetailed).not.toHaveBeenCalled();
  });

  it('distinguishes an unknown key from a revoked one', async () => {
    extractUserIdFromKey.mockReturnValue(1);

    verifyApiKeyDetailed.mockResolvedValue(null);
    expect((await checkApiKey('1lev1_1_dead')).verdict).toBe('unknown');

    verifyApiKeyDetailed.mockResolvedValue({ user: { id: '1' }, revoked: true, scopes: null });
    expect((await checkApiKey('1lev1_1_off')).verdict).toBe('revoked');
  });

  it('returns the owning user with normalized scopes when the key verifies', async () => {
    extractUserIdFromKey.mockReturnValue(7);
    verifyApiKeyDetailed.mockResolvedValue({
      user: { id: '7' },
      revoked: false,
      scopes: { ops: ['mcp:write'] }
    });

    expect(await checkApiKey('1lev1_7_live')).toEqual({
      user: { id: '7', scopes: { ops: ['mcp:write'] } },
      verdict: 'ok'
    });
  });

  it('leaves the user unwrapped when the key carries no scopes', async () => {
    extractUserIdFromKey.mockReturnValue(7);
    verifyApiKeyDetailed.mockResolvedValue({ user: { id: '7' }, revoked: false, scopes: null });

    const { user } = await checkApiKey('1lev1_7_live');
    expect(user).toEqual({ id: '7' });
    expect(user).not.toHaveProperty('scopes');
  });
});

describe('isRejected', () => {
  it('separates a refused key from both absence and success', () => {
    expect(isRejected('malformed')).toBe(true);
    expect(isRejected('unknown')).toBe(true);
    expect(isRejected('revoked')).toBe(true);

    // The whole point: an anonymous probe is not a rejection, so it must keep
    // getting the newcomer's tools rather than a repair lecture.
    expect(isRejected('absent')).toBe(false);
    expect(isRejected('ok')).toBe(false);
  });
});

describe('repairPlan', () => {
  it('leads with deleting the stale entry, not with minting', () => {
    const plan = repairPlan('revoked');

    expect(plan.fix[0]).toMatch(/DELETE/);
    // Minting has to come after; the reversed order is the bug this fixes.
    const mintStep = plan.fix.findIndex((s) => s.includes('npx 1lev1-mcp'));
    expect(mintStep).toBeGreaterThan(0);
    expect(plan.warning).toBe(SHADOWING_WARNING);
  });

  it('says the caller is not connected and carries the reason', () => {
    const plan = repairPlan('unknown');

    expect(plan.connected).toBe(false);
    expect(plan.status).toBe('rejected');
    expect(plan.reason).toBe('unknown');
    expect(plan.message).toContain('unknown');
  });

  it('gives a distinct explanation per reason', () => {
    const reasons = ['malformed', 'unknown', 'revoked'] as const;
    const whys = reasons.map((r) => repairPlan(r).why);

    expect(new Set(whys).size).toBe(3);
    // A revoked key is the leak case, and the config file holding it is often tracked.
    expect(repairPlan('revoked').why).toMatch(/git|leak/i);
  });

  it('lists the project .mcp.json above the user-level file', () => {
    const plan = repairPlan('revoked');
    const project = plan.lookIn.findIndex((l) => l.includes('.mcp.json'));
    const userLevel = plan.lookIn.findIndex((l) => l.includes('mcpServers') && l.includes('~/.claude.json'));

    expect(project).toBeGreaterThanOrEqual(0);
    expect(project).toBeLessThan(userLevel);
  });

  it('tells the agent not to claim the user is merely unregistered', () => {
    const guidance = repairPlan('revoked').agentGuidance.join(' ');
    expect(guidance).toMatch(/rejected/i);
    expect(guidance).toMatch(/not that they are unregistered/i);
  });
});
