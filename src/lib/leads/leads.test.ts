import { describe, expect, it } from 'vitest';
import {
  absorbsRepeatContact,
  checkManualTransition,
  isOpenLead,
  statusAfterActivity
} from './status';
import { contactParts, dedupeKeyOf, dedupeLookupKeys, normalizePhone, sharesContact } from './dedupe';
import { DEFAULT_LEAD_SETTINGS, resolveLeadSettings } from './settings';
import { attentionReason, needsAttention } from './attention';
import { validateLeadPayload } from './validate';
import { isEmptyEffect, leadEffectOfTask, leadIdOfTaskExternalId, leadTaskExternalId } from './taskSync';

const fakeHash = (s: string) => `h(${s})`;

describe('status', () => {
  it('lets a member move between the manual statuses in any direction', () => {
    expect(checkManualTransition('talking', 'new')).toBeNull();
    expect(checkManualTransition('spam', 'talking')).toBeNull();
    expect(checkManualTransition(null, 'contacted')).toBeNull();
  });

  it('never lets a form choose offered/won, or move a lead off them', () => {
    expect(checkManualTransition('talking', 'won')).toBe('NOT_MANUAL');
    expect(checkManualTransition('talking', 'offered')).toBe('NOT_MANUAL');
    expect(checkManualTransition('won', 'talking')).toBe('DERIVED_LOCKED');
    expect(checkManualTransition('offered', 'paused', { pausedReason: 'timing' })).toBe('DERIVED_LOCKED');
  });

  it('has no lost/rejected', () => {
    expect(checkManualTransition('new', 'lost')).toBe('NOT_MANUAL');
    expect(checkManualTransition('new', 'rejected')).toBe('NOT_MANUAL');
  });

  it('asks a reason for "not now", and allows re-pausing with a new one', () => {
    expect(checkManualTransition('talking', 'paused')).toBe('PAUSED_REASON_REQUIRED');
    expect(checkManualTransition('talking', 'paused', { pausedReason: 'nope' })).toBe('PAUSED_REASON_REQUIRED');
    expect(checkManualTransition('talking', 'paused', { pausedReason: 'budget' })).toBeNull();
    expect(checkManualTransition('paused', 'paused', { pausedReason: 'timing' })).toBeNull();
    expect(checkManualTransition('talking', 'talking')).toBe('UNCHANGED');
  });

  it('first outgoing contact moves new ⇒ contacted, nothing else does', () => {
    expect(statusAfterActivity('new', 'call', 'out')).toBe('contacted');
    expect(statusAfterActivity(null, 'whatsapp', 'out')).toBe('contacted');
    expect(statusAfterActivity('new', 'meeting', null)).toBe('contacted');
    expect(statusAfterActivity('new', 'call', 'in')).toBeNull();
    expect(statusAfterActivity('new', 'note', 'out')).toBeNull();
    expect(statusAfterActivity('talking', 'call', 'out')).toBeNull();
  });

  it('knows open leads and which leads absorb a repeat contact', () => {
    expect(isOpenLead('offered')).toBe(true);
    expect(isOpenLead('paused')).toBe(false);
    expect(absorbsRepeatContact('paused')).toBe(true);
    expect(absorbsRepeatContact('won')).toBe(false);
    expect(absorbsRepeatContact('spam')).toBe(false);
  });
});

describe('dedupe', () => {
  it('folds phone formats to one number', () => {
    expect(normalizePhone('050-000-0000')).toBe('0500000000');
    expect(normalizePhone('+972 50 000 0000')).toBe('0500000000');
    expect(normalizePhone('00972500000000')).toBe('0500000000');
    expect(normalizePhone('123')).toBeNull();
  });

  it('builds one part per channel, phone first', () => {
    expect(contactParts(' Dana@Example.com ', '050-0000000')).toEqual(['p:0500000000', 'e:dana@example.com']);
    expect(dedupeKeyOf(null, null, fakeHash)).toBeNull();
    expect(dedupeKeyOf('a@b.co', null, fakeHash)).toBe('e:h(e:a@b.co)');
  });

  it('matches the same person by either channel', () => {
    const stored = dedupeKeyOf('dana@example.com', '0500000000', fakeHash);
    expect(sharesContact(stored, dedupeLookupKeys('other@x.io', '+972500000000', fakeHash))).toBe(true);
    expect(sharesContact(stored, dedupeLookupKeys('DANA@example.com', null, fakeHash))).toBe(true);
    expect(sharesContact(stored, dedupeLookupKeys('other@x.io', '0521111111', fakeHash))).toBe(false);
    expect(sharesContact(null, dedupeLookupKeys('a@b.co', null, fakeHash))).toBe(false);
  });
});

describe('settings', () => {
  it('fills defaults and clamps nonsense', () => {
    expect(resolveLeadSettings(null)).toEqual(DEFAULT_LEAD_SETTINGS);
    const s = resolveLeadSettings({ leadRoleIds: [3, '', null, '4'], leadResponseHours: -1, leadStaleDays: '10' });
    expect(s.leadRoleIds).toEqual(['3', '4']);
    expect(s.leadResponseHours).toBe(24);
    expect(s.leadStaleDays).toBe(10);
    expect(s.leadMissionId).toBeNull();
  });
});

describe('needsAttention', () => {
  const settings = DEFAULT_LEAD_SETTINGS;
  const now = Date.parse('2026-11-10T12:00:00Z');
  const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();

  it('flags a new lead nobody answered within the response window', () => {
    expect(attentionReason({ status: 'new', createdAt: hoursAgo(25) }, now, settings)).toBe('unanswered');
    expect(needsAttention({ status: 'new', createdAt: hoursAgo(3) }, now, settings)).toBe(false);
  });

  it('brings back a paused lead when its follow-up date comes', () => {
    expect(attentionReason({ status: 'paused', createdAt: hoursAgo(900), followUpAt: hoursAgo(1) }, now, settings)).toBe(
      'followUpDue'
    );
    expect(needsAttention({ status: 'paused', createdAt: hoursAgo(900) }, now, settings)).toBe(false);
  });

  it('flags an open lead with no activity for leadStaleDays', () => {
    const lead = { status: 'talking', createdAt: hoursAgo(500), lastActivityAt: hoursAgo(24 * 8) };
    expect(attentionReason(lead, now, settings)).toBe('stale');
    expect(needsAttention({ ...lead, lastActivityAt: hoursAgo(24) }, now, settings)).toBe(false);
  });

  it('never flags spam or a customer without a follow-up', () => {
    expect(needsAttention({ status: 'spam', createdAt: hoursAgo(900), followUpAt: hoursAgo(1) }, now, settings)).toBe(false);
    expect(needsAttention({ status: 'won', createdAt: hoursAgo(900) }, now, settings)).toBe(false);
  });
});

describe('validateLeadPayload', () => {
  const base = {
    name: 'דנה כהן',
    phone: '050-0000000',
    consent: { text: 'אני מסכים/ה', at: '2026-11-03T10:00:00Z' }
  };
  const now = new Date('2026-11-03T12:00:00Z');

  it('accepts the plan example', () => {
    const r = validateLeadPayload(
      {
        ...base,
        email: 'Dana@Example.com',
        organization: 'בניין הרצל 12',
        details: { apartments: 16, interest: 'shared' },
        utm: { source: 'facebook', campaign: 'haifa-nov', junk: 'x' },
        productId: '123',
        externalId: 'lead_6f1c'
      },
      { requireConsent: true, now }
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.email).toBe('dana@example.com');
    expect(r.value.source).toBe('api');
    expect(r.value.utm).toEqual({ source: 'facebook', campaign: 'haifa-nov' });
    expect(r.value.consentAt).toBe('2026-11-03T10:00:00.000Z');
  });

  it('needs a name and a way to reach the person', () => {
    expect(validateLeadPayload({ ...base, name: ' ' }, { requireConsent: true, now })).toMatchObject({ ok: false, field: 'name' });
    expect(validateLeadPayload({ name: 'x', consent: base.consent }, { requireConsent: true, now })).toMatchObject({
      ok: false,
      field: 'email'
    });
    expect(validateLeadPayload({ ...base, phone: 'abc' }, { requireConsent: true, now })).toMatchObject({ ok: false, field: 'phone' });
  });

  it('a customer off the site may leave no way to reach them — only when the deal path says so', () => {
    const bare = { name: 'לקוח', source: 'manual' };
    expect(validateLeadPayload(bare, { requireConsent: false, now })).toMatchObject({ ok: false, field: 'email' });
    expect(validateLeadPayload(bare, { requireConsent: false, allowNoContact: true, now }).ok).toBe(true);
    // A bad phone is still a bad phone.
    expect(validateLeadPayload({ ...bare, phone: 'abc' }, { requireConsent: false, allowNoContact: true, now })).toMatchObject({
      ok: false,
      field: 'phone'
    });
  });

  it('refuses a lead without consent from a form, not from a member', () => {
    const { consent: _c, ...noConsent } = base;
    expect(validateLeadPayload(noConsent, { requireConsent: true, now })).toMatchObject({ ok: false, code: 'CONSENT_REQUIRED' });
    expect(validateLeadPayload(noConsent, { requireConsent: false, defaultSource: 'manual', now })).toMatchObject({
      ok: true,
      value: { source: 'manual', consentAt: null }
    });
  });

  it('bounds details', () => {
    const many = Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`k${i}`, i]));
    expect(validateLeadPayload({ ...base, details: many }, { requireConsent: true, now })).toMatchObject({ ok: false, field: 'details' });
    expect(validateLeadPayload({ ...base, details: { a: { nested: 1 } } }, { requireConsent: true, now })).toMatchObject({
      ok: false,
      field: 'details'
    });
    expect(validateLeadPayload({ ...base, details: { a: 'x'.repeat(5000) } }, { requireConsent: true, now })).toMatchObject({
      ok: false,
      field: 'details'
    });
  });

  it('refuses a bad source, product id or url', () => {
    expect(validateLeadPayload({ ...base, source: 'cold-list' }, { requireConsent: true, now }).ok).toBe(false);
    expect(validateLeadPayload({ ...base, productId: '12a' }, { requireConsent: true, now }).ok).toBe(false);
    expect(validateLeadPayload({ ...base, sourceUrl: 'javascript:alert(1)' }, { requireConsent: true, now }).ok).toBe(false);
    expect(validateLeadPayload({ ...base, message: 'x'.repeat(4001) }, { requireConsent: true, now }).ok).toBe(false);
  });
});

describe('task ↔ lead', () => {
  it('round-trips the external id', () => {
    expect(leadIdOfTaskExternalId(leadTaskExternalId(77))).toBe('77');
    expect(leadIdOfTaskExternalId('gh:1')).toBeNull();
    expect(leadIdOfTaskExternalId('lead:abc')).toBeNull();
  });

  it('an accepted assignee owns the lead; an unaccepted one does not', () => {
    const e = leadEffectOfTask({ assigneeId: '5', myIshur: true, naasa: false }, { status: 'new', ownerId: null }, '5');
    expect(e.ownerId).toBe('5');
    expect(e.activities).toEqual([{ kind: 'assign', actorId: '5' }]);
    expect(isEmptyEffect(leadEffectOfTask({ assigneeId: '5', myIshur: false, naasa: false }, { status: 'new', ownerId: null }, '9'))).toBe(true);
  });

  it('handing the task back releases the lead', () => {
    const e = leadEffectOfTask({ assigneeId: null, myIshur: false, naasa: false }, { status: 'talking', ownerId: '5' }, '5');
    expect(e.ownerId).toBeNull();
    expect(e.activities).toEqual([{ kind: 'release', actorId: '5', previousOwnerId: '5' }]);
  });

  it('done does not close the lead; it only marks a new lead contacted', () => {
    const e = leadEffectOfTask({ assigneeId: '5', myIshur: true, naasa: true }, { status: 'new', ownerId: '5' }, '5');
    expect(e.ownerId).toBeUndefined();
    expect(e.status).toBe('contacted');
    expect(isEmptyEffect(leadEffectOfTask({ assigneeId: '5', myIshur: true, naasa: true }, { status: 'talking', ownerId: '5' }, '5'))).toBe(true);
  });
});
