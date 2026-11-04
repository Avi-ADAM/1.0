import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

const { demoLeadParams, DEMO_CONSENT_TEXT } = await import('./demoLead');
const { validateLeadPayload } = await import('$lib/leads/validate');

describe('a demo request as a lead (PLAN_LEADS L6)', () => {
  const input = {
    name: 'דנה',
    email: 'dana@example.com',
    phone: null,
    track: 'idea',
    timeMode: 'callback',
    preferredTime: 'בערב',
    goal: 'רוצה להקים רקמה',
    lang: 'he',
    page: '/',
    source: 'fpage',
    demoRequestId: 42
  };

  it('is a demo lead with no task of its own, idempotent on the request id, with the consent that happened', () => {
    const p = demoLeadParams('7', input, new Date('2026-11-04T10:00:00Z'));
    expect(p).toMatchObject({
      projectId: '7',
      source: 'demo',
      externalId: 'demo:42',
      openTask: false,
      message: 'רוצה להקים רקמה',
      details: { track: 'idea', timeMode: 'callback', preferredTime: 'בערב', page: '/', from: 'fpage', demoRequestId: 42 },
      consent: { text: DEMO_CONSENT_TEXT, at: '2026-11-04T10:00:00.000Z' }
    });
    expect(p).not.toHaveProperty('phone');
  });

  it('passes the lead validation createLead runs', () => {
    const v = validateLeadPayload(demoLeadParams('7', input) as any, { requireConsent: true });
    expect(v.ok).toBe(true);
  });
});
