import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({
  env: { OAUTH_SECRET: 'test-secret-that-is-definitely-long-enough-0123456789' }
}));

const { createExhibitDraft, EXHIBIT_DRAFT_DAYS } = await import('./draft');
const { exhibitLeadParams, EXHIBIT_CONSENT_TEXT } = await import('./lead');
const { openSignupToken } = await import('$lib/server/assistant/signupToken.js');
const { loadByShareKey } = await import('$lib/server/assistant/session.js');
const { validateLeadPayload } = await import('$lib/leads/validate');

function fakeStrapi() {
  const rows = new Map<string, any>();
  let n = 0;
  return {
    rows,
    async execute(qid: string, vars: any) {
      if (qid === '363createAssistantSession') {
        const id = String(++n);
        rows.set(id, { ...vars.data });
        return { data: { createAssistantSession: { data: { id, attributes: { ...vars.data, user: { data: null } } } } } };
      }
      if (qid === '364getAssistantSession') {
        const a = rows.get(vars.id);
        return { data: { assistantSession: { data: a ? { id: vars.id, attributes: a } : null } } };
      }
      if (qid === '365updateAssistantSession') {
        rows.set(vars.id, { ...rows.get(vars.id), ...vars.data });
        return { data: { updateAssistantSession: { data: { id: vars.id, attributes: rows.get(vars.id) } } } };
      }
      throw new Error('unexpected ' + qid);
    }
  };
}

const now = new Date('2026-11-25T10:00:00Z');
const blueprint = {
  fields: { track: 'idea', name: 'ציור קיר לשכונה', currency: 'ILS' },
  missions: [
    { ref: 'm1', name: 'סקיצה ועיצוב הקיר', hours: 30, ratePerHour: 120, holder: 'me' },
    { ref: 'm2', name: 'ציור הקיר', hours: 60, ratePerHour: 100, holder: 'open' }
  ],
  resources: [{ ref: 'r1', name: 'צבעים', price: 1800, holder: 'open' }],
  products: [{ name: 'סיורי אמנות', pricingMode: 'quote' }],
  partners: []
};

describe('createExhibitDraft', () => {
  it('keeps the rikma as a pending, ownerless draft with no email, for 30 days', async () => {
    const strapi = fakeStrapi();
    const r = await createExhibitDraft(blueprint, 'he', { strapi, now });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const row = strapi.rows.get(r.sessionId);
    expect(row).toMatchObject({ kind: 'rikma', status: 'pending', startedVia: 'agent', lang: 'he' });
    expect(row.user).toBeUndefined();
    expect(row.claimEmail).toBeUndefined();
    expect(row.claimExpiresAt).toBe(new Date(now.getTime() + EXHIBIT_DRAFT_DAYS * 86_400_000).toISOString());
    expect(row.state.items.map((i: any) => i.label)).toEqual(
      expect.arrayContaining(['סקיצה ועיצוב הקיר', 'ציור הקיר', 'צבעים', 'סיורי אמנות'])
    );
  });

  it('hands back a preview key that opens it, and a signup token naming it with no personal details', async () => {
    const strapi = fakeStrapi();
    const r = await createExhibitDraft(blueprint, 'en', { strapi, now });
    if (!r.ok) throw new Error('draft failed');
    const p = openSignupToken(r.token, now.getTime() + 20 * 86_400_000);
    expect(p).toMatchObject({ sid: r.sessionId, name: '', email: '', intent: 'idea', lang: 'en', countryIds: [] });
    // Still alive three weeks later, gone after the draft's 30 days.
    expect(openSignupToken(r.token, now.getTime() + 31 * 86_400_000)).toBeNull();
    const shared = await loadByShareKey(strapi as any, r.shareKey, now);
    expect(shared?.id).toBe(r.sessionId);
  });

  it('keeps where the idea came from and the visitor’s words for the lead, dropping anything malformed', async () => {
    const strapi = fakeStrapi();
    const r = await createExhibitDraft(blueprint, 'he', { strapi, now }, { source: 'nearest:mural', words: 'קיר  לשכונה' });
    if (!r.ok) throw new Error('draft failed');
    const { parseExhibitSourceText } = await import('./meta');
    expect(parseExhibitSourceText(strapi.rows.get(r.sessionId).sourceText)).toEqual({ source: 'nearest:mural', words: 'קיר לשכונה' });
    const r2 = await createExhibitDraft(blueprint, 'he', { strapi, now }, { source: 'evil:<x>' });
    if (!r2.ok) throw new Error('draft failed');
    expect(parseExhibitSourceText(strapi.rows.get(r2.sessionId).sourceText).source).toBeNull();
  });

  it('refuses anything that is not an idea blueprint without partners', async () => {
    const strapi = fakeStrapi();
    expect(await createExhibitDraft({ nope: true }, 'he', { strapi, now })).toEqual({ ok: false, reason: 'invalid' });
    expect(await createExhibitDraft({ ...blueprint, fields: { ...blueprint.fields, track: 'business' } }, 'he', { strapi, now }))
      .toEqual({ ok: false, reason: 'invalid' });
    expect(await createExhibitDraft({ ...blueprint, partners: [{ name: 'Dana' }] }, 'he', { strapi, now }))
      .toEqual({ ok: false, reason: 'invalid' });
    expect(strapi.rows.size).toBe(0);
  });
});

describe('exhibitLeadParams', () => {
  const input = {
    sessionId: '77',
    name: 'נועם',
    email: 'noam@example.com',
    phone: null,
    lang: 'he',
    via: 'phone' as const,
    idea: 'ציור קיר לשכונה',
    missions: 4,
    open: 3,
    previewUrl: 'https://www.1lev1.com/preview/rikma/abc?ref=exhibit',
    signupUrl: 'https://www.1lev1.com/hascama?agent=tok',
    studioUrl: 'https://www.1lev1.com/preview/rikma/studio/tok',
    plan: 'mission: Paint the wall · 60h × 100 = 6000 · open\nproduct: Art tours',
    ideaSource: 'nearest:mural',
    words: 'קיר לשכונה'
  };

  it('is an event lead with a task, idempotent on the draft, with the consent that happened', () => {
    const p = exhibitLeadParams('7', input, 'יריד האמנות', now);
    expect(p).toMatchObject({
      projectId: '7',
      name: 'נועם',
      email: 'noam@example.com',
      source: 'event',
      sourceLabel: 'יריד האמנות',
      externalId: 'exhibit:77',
      openTask: true,
      details: { idea: 'ציור קיר לשכונה', missions: 4, openParts: 3, via: 'phone' },
      consent: { text: EXHIBIT_CONSENT_TEXT, at: now.toISOString() }
    });
    expect(p).not.toHaveProperty('phone');
  });

  it('gives the team (and Claude, through getLead) the plan, the studio, and how rough the draft is', () => {
    const p = exhibitLeadParams('7', input, 'x', now) as any;
    expect(p.details).toMatchObject({
      studio: 'https://www.1lev1.com/preview/rikma/studio/tok',
      plan: input.plan,
      ideaSource: 'nearest:mural',
      words: 'קיר לשכונה'
    });
  });

  it('keeps details within the lead limit, cutting the plan first', () => {
    const plan = Array.from({ length: 200 }, (_, i) => `mission: Part number ${i} · 10h × 100 = 1000 · open`).join('\n');
    const p = exhibitLeadParams('7', { ...input, plan }, 'x', now) as any;
    expect(new TextEncoder().encode(JSON.stringify(p.details)).length).toBeLessThanOrEqual(3800);
    expect(p.details.plan.endsWith('…')).toBe(true);
    expect(p.details.studio).toBe(input.studioUrl);
    expect(validateLeadPayload(p, { requireConsent: true }).ok).toBe(true);
  });

  it('names a visitor who left only an email by its local part', () => {
    expect(exhibitLeadParams('7', { ...input, name: '' }, 'x', now).name).toBe('noam');
  });

  it('passes the lead validation createLead runs', () => {
    expect(validateLeadPayload(exhibitLeadParams('7', input, 'x', now) as any, { requireConsent: true }).ok).toBe(true);
  });
});
