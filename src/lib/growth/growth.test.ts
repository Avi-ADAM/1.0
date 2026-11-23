import { describe, expect, it } from 'vitest';
import { BlueprintInputSchema } from '$lib/assistant/blueprint';
import { csvToInputs, mapHeaders, parseCsv } from './csv';
import { dedupeBatch, emailKey, hostKey, identityKeys, phoneKey } from './dedupe';
import { coverage, dashboardCounts, funnel, gaps, inView, nextActions, priority } from './insights';
import { fillLink, LINK_TOKEN, mailtoUrl, templateVariants, whatsappUrl } from './outreach';
import { draftProfile, editProfile, originCounts, profileToBlueprint } from './profile';
import { applyEdit, cleanInput, forgetContact, newProspect, safeUrl, setStage, advance, summarize } from './prospect';
import { computedMissing, extractContacts, overallConfidence, parseResearch, verifyClaim } from './research';
import { advanceTo, furthestOf, manualStageChange, reached } from './stages';
import type { Prospect, ProspectSummary, Research } from './types';

const NOW = '2026-11-20T10:00:00.000Z';

function prospect(over: Partial<Parameters<typeof cleanInput>[0]> = {}): Prospect {
  const c = cleanInput({ name: 'Shir Catering', city: 'Netanya', region: 'Sharon', category: 'catering', ...over }, 'u1', NOW);
  if (!c.ok) throw new Error('bad fixture');
  return newProspect(c.value, identityKeys(c.value), 'u1', NOW);
}

describe('dedupe keys', () => {
  it('one website, however it is written', () => {
    expect(hostKey('https://www.Shir-Catering.co.il/about?x=1')).toBe('shir-catering.co.il');
    expect(hostKey('shir-catering.co.il')).toBe('shir-catering.co.il');
    expect(hostKey('javascript:alert(1)')).toBeNull();
  });
  it('a page on a shared host is identified by its path', () => {
    expect(hostKey('https://www.facebook.com/ShirCatering/')).toBe('facebook.com/shircatering');
    expect(hostKey('https://facebook.com')).toBeNull();
  });
  it('one Israeli phone, local or international', () => {
    expect(phoneKey('054-123-4567')).toBe('972541234567');
    expect(phoneKey('+972 54 123 4567')).toBe('972541234567');
    expect(phoneKey('00972541234567')).toBe('972541234567');
    expect(phoneKey('123')).toBeNull();
  });
  it('emails are case-blind and must look like one', () => {
    expect(emailKey(' Info@Shir.co.il ')).toBe('info@shir.co.il');
    expect(emailKey('nope')).toBeNull();
  });
  it('a batch keeps the first of each business and names the repeats', () => {
    const rows = [
      { name: 'A', website: 'a.com' },
      { name: 'B', phone: '0541234567' },
      { name: 'A again', website: 'https://www.a.com' },
      { name: 'Known', email: 'k@k.com' }
    ];
    const r = dedupeBatch(rows, (x) => identityKeys(x), new Set(['email:k@k.com']));
    expect(r.fresh.map((f) => f.row.name)).toEqual(['A', 'B']);
    expect(r.repeats.map((x) => [x.row.name, x.inBatch])).toEqual([
      ['A again', true],
      ['Known', false]
    ]);
  });
});

describe('CSV', () => {
  it('reads quotes, commas and newlines inside a field, and CRLF', () => {
    expect(parseCsv('a,b\r\n"x, y","line1\nline2"\r\n"say ""hi""",z')).toEqual([
      ['a', 'b'],
      ['x, y', 'line1\nline2'],
      ['say "hi"', 'z']
    ]);
  });
  it('picks ; or tab when the file uses it', () => {
    expect(parseCsv('a;b\n1;2')).toEqual([
      ['a', 'b'],
      ['1', '2']
    ]);
  });
  it('matches Hebrew, English and Arabic headers, unknown ones ignored', () => {
    expect(mapHeaders(['שם העסק', 'Website', 'الهاتف', 'whatever'])).toEqual(['name', 'website', 'phone', null]);
  });
  it('reports rows without a name instead of guessing one', () => {
    const p = csvToInputs('name,city\nA,Haifa\n,Eilat\nB,\n', 'list.csv');
    expect(p.rows.map((r) => r.name)).toEqual(['A', 'B']);
    expect(p.missingName).toEqual([3]);
    expect(p.rows[0]).toMatchObject({ sourceKind: 'csv', sourceLabel: 'list.csv', city: 'Haifa' });
  });
  it('says so when there is no name column', () => {
    expect(csvToInputs('city\nHaifa').noNameColumn).toBe(true);
  });
});

describe('stages', () => {
  it('the agent only moves forward, and never out of a closed door', () => {
    expect(advanceTo('researched', 'discovered')).toBe('researched');
    expect(advanceTo('discovered', 'researched')).toBe('researched');
    expect(advanceTo('declined', 'invitationSent')).toBe('declined');
  });
  it('furthest never shrinks, and a decline does not move it', () => {
    expect(furthestOf('invitationSent', 'declined')).toBe('invitationSent');
    expect(reached('interested', 'invitationSent')).toBe(true);
  });
  it('leaving do-not-contact needs a stated reason', () => {
    expect(manualStageChange('doNotContact', 'discovered', '')).toEqual({ ok: false, code: 'REASON_REQUIRED' });
    expect(manualStageChange('doNotContact', 'discovered', 'they wrote to us')).toEqual({ ok: true });
    expect(manualStageChange('joined', 'joined', null)).toEqual({ ok: false, code: 'SAME_STAGE' });
  });
});

describe('prospect', () => {
  it('refuses a malformed contact rather than dropping it', () => {
    expect(cleanInput({ name: 'x', email: 'not-an-email' }, null, NOW)).toMatchObject({ ok: false, code: 'BAD_EMAIL' });
    expect(cleanInput({ name: 'x', website: 'javascript:alert(1)' }, null, NOW)).toMatchObject({ ok: false, code: 'BAD_WEBSITE' });
    expect(cleanInput({ name: ' ' }, null, NOW)).toMatchObject({ ok: false, code: 'NAME_REQUIRED' });
  });
  it('every entered field records its source', () => {
    const p = prospect({ website: 'shir.co.il', sourceKind: 'directory', sourceLabel: 'B144', sourceUrl: 'https://b144.co.il/x' });
    expect(p.fieldSources.website).toMatchObject({ kind: 'directory', label: 'B144', url: 'https://b144.co.il/x', by: 'u1' });
    expect(p.activity[0].kind).toBe('created');
    expect(p.stage).toBe('discovered');
  });
  it('an edit re-sources only the fields that changed', () => {
    const p = prospect({ website: 'shir.co.il' });
    const c = cleanInput({ name: p.name, website: 'shir.co.il', email: 'info@shir.co.il', city: 'Netanya', region: 'Sharon', category: 'catering', sourceKind: 'website', sourceUrl: 'https://shir.co.il/contact' }, 'u2', NOW);
    if (!c.ok) throw new Error();
    const e = applyEdit(p, c.value, [], 'u2', NOW);
    expect(e.fieldSources.website.kind).toBe('manual');
    expect(e.fieldSources.email).toMatchObject({ kind: 'website', url: 'https://shir.co.il/contact', by: 'u2' });
  });
  it('a closed stage clears the follow-up; furthest is kept', () => {
    let p = prospect();
    p = { ...p, followUpAt: NOW, nextAction: 'call' };
    p = setStage(p, 'invitationSent', 'u1', NOW);
    p = setStage(p, 'declined', 'u1', NOW);
    expect(p).toMatchObject({ stage: 'declined', furthest: 'invitationSent', followUpAt: null, nextAction: null });
    expect(advance(p, 'interested', 'u1', NOW).stage).toBe('declined');
  });
  it('do-not-contact forgets how to reach them but keeps who they are', () => {
    const p = forgetContact(prospect({ email: 'a@b.co', phone: '0541234567' }));
    expect(p.email).toBeNull();
    expect(p.phone).toBeNull();
    expect(p.fieldSources.email).toBeUndefined();
    expect(p.dedupeKeys.some((k) => k.startsWith('email:'))).toBe(true);
  });
  it('safeUrl only lets http(s) through', () => {
    expect(safeUrl('example.com')).toBe('https://example.com/');
    expect(safeUrl('data:text/html,x')).toBeNull();
  });
});

const PAGE = 'Shir Catering — kosher catering for weddings and bar mitzvahs across the Sharon. Call 054-123-4567 or write to info@shir.co.il. We also bake challah.';

describe('research', () => {
  it('finds contacts by pattern, with the page as source', () => {
    const c = extractContacts(PAGE, 'https://shir.co.il/');
    expect(c).toEqual([
      { kind: 'email', value: 'info@shir.co.il', sourceUrl: 'https://shir.co.il/' },
      { kind: 'phone', value: '054-123-4567', sourceUrl: 'https://shir.co.il/' }
    ]);
    expect(extractContacts('Open 2024-2025, logo@2x.png', 'u')).toEqual([]);
  });
  it('a claim is verified only when its evidence is in the page', () => {
    const yes = verifyClaim({ text: 'Wedding catering', evidence: 'kosher catering for weddings', confidence: 'high' }, PAGE, 'https://shir.co.il/');
    const no = verifyClaim({ text: 'Vegan menus', evidence: 'fully vegan kitchen', confidence: 'high' }, PAGE, 'https://shir.co.il/');
    expect(yes).toMatchObject({ verified: true, confidence: 'high', sourceUrl: 'https://shir.co.il/' });
    expect(no).toMatchObject({ verified: false, confidence: 'low', sourceUrl: null });
    expect(verifyClaim({ text: 'x', evidence: 'Shir' }, PAGE, 'u')!.verified).toBe(false); // too short to count
  });
  it('parses fenced model output and re-checks every claim', () => {
    const raw = '```json\n' + JSON.stringify({
      summary: { text: 'Kosher caterer', evidence: 'kosher catering for weddings and bar mitzvahs', confidence: 'high' },
      services: [{ text: 'Weddings', evidence: 'catering for weddings', confidence: 'high' }, { text: 'Corporate', evidence: 'corporate events', confidence: 'high' }],
      coverage: { text: 'Sharon', evidence: 'across the Sharon', confidence: 'medium' },
      complementary: ['photography', 'venues'],
      evil: 'ignored'
    }) + '\n```';
    const b = parseResearch(raw, PAGE, 'https://shir.co.il/')!;
    expect(b.services.map((s) => s.verified)).toEqual([true, false]);
    expect(b.complementary).toEqual(['photography', 'venues']);
    expect(overallConfidence(b, true)).toBe('high'); // 3 of 4 verified
    expect(overallConfidence(b, false)).toBe('low');
    expect(parseResearch('not json', PAGE, null)).toBeNull();
  });
  it('lists what is missing even when the model does not', () => {
    expect(computedMissing({ website: null, email: null, phone: null }, null, [])).toEqual([
      'missing:website',
      'missing:email',
      'missing:phone',
      'missing:services',
      'missing:coverage'
    ]);
  });
});

function researched(p: Prospect): Prospect {
  const r: Research = {
    at: NOW,
    by: 'u1',
    status: 'done',
    problems: [],
    sourceUrl: 'https://shir.co.il/',
    sourceTitle: null,
    contacts: [],
    summary: { text: 'Kosher caterer', evidence: 'x', sourceUrl: 'https://shir.co.il/', verified: true, confidence: 'high' },
    services: [{ text: 'Weddings', verified: true, confidence: 'high' }, { text: 'Corporate', verified: false, confidence: 'low' }],
    products: [],
    coverage: null,
    categories: ['events'],
    customers: [],
    keywords: ['kosher'],
    whyJoin: 'Customers ask for event food',
    requestsFulfilled: ['Food for 80 guests'],
    collaboration: '',
    complementary: ['photography'],
    missing: [],
    confidence: 'high'
  };
  return { ...p, research: r };
}

describe('profile', () => {
  it('says field by field what is verified and what is suggested', () => {
    const d = draftProfile(researched(prospect({ website: 'shir.co.il' })), NOW);
    expect(d.title).toEqual({ value: 'Shir Catering', origin: 'verified' });
    expect(d.description.origin).toBe('verified');
    expect(d.services).toEqual({ value: ['Weddings', 'Corporate'], origin: 'suggested' }); // one unverified item
    expect(d.capabilities.origin).toBe('suggested');
    expect(d.website.value).toBe('https://shir.co.il/');
    expect(originCounts(d).verified).toBeGreaterThan(0);
  });
  it('an edit marks the field edited and withdraws the approval', () => {
    const d = { ...draftProfile(researched(prospect()), NOW), approvedAt: NOW, approvedBy: 'u1' };
    const r = editProfile(d, { description: 'Kosher catering in the Sharon', services: 'Weddings\nBar mitzvahs' }, NOW);
    if (!r.ok) throw new Error();
    expect(r.value.description).toEqual({ value: 'Kosher catering in the Sharon', origin: 'edited' });
    expect(r.value.services.value).toEqual(['Weddings', 'Bar mitzvahs']);
    expect(r.value.approvedAt).toBeNull();
    // An unchanged patch keeps the approval.
    const same = editProfile(d, { title: d.title.value }, NOW);
    expect(same.ok && same.value.approvedAt).toBe(NOW);
  });
  it('refuses an empty title and a non-http website', () => {
    const d = draftProfile(prospect(), NOW);
    expect(editProfile(d, { title: '' }, NOW)).toEqual({ ok: false, field: 'title' });
    expect(editProfile(d, { website: 'javascript:x' }, NOW)).toEqual({ ok: false, field: 'website' });
  });
  it('becomes a blueprint the existing prepareSignup accepts', () => {
    const d = draftProfile(researched(prospect({ website: 'shir.co.il' })), NOW);
    const bp = profileToBlueprint(d);
    const parsed = BlueprintInputSchema.safeParse(bp);
    expect(parsed.success).toBe(true);
    expect(bp.fields.track).toBe('business');
    expect(bp.products.map((p) => p.name)).toEqual(['Weddings', 'Corporate']);
    expect(bp.products[0].pricingMode).toBe('quote');
  });
});

describe('outreach', () => {
  it('has all four variants in each supported language, each with the link placeholder', () => {
    for (const lang of ['he', 'en', 'ar'] as const) {
      const v = templateVariants(researched(prospect()), lang);
      expect(v.map((x) => x.kind)).toEqual(['friendly', 'professional', 'whatsapp', 'email']);
      expect(v.every((x) => x.body.includes(LINK_TOKEN) && x.origin === 'template')).toBe(true);
      expect(v.find((x) => x.kind === 'email')!.subject).toBeTruthy();
    }
  });
  it('fills the link, or drops it cleanly when there is none', () => {
    expect(fillLink('Look:\n{{link}}\n\nThanks', 'https://x/y')).toBe('Look:\nhttps://x/y\n\nThanks');
    expect(fillLink('decide whether to join:\n{{link}}\n\nThanks', null)).toBe('decide whether to join.\n\nThanks');
    expect(fillLink('to join: {{link}}', null)).toBe('to join.');
  });
  it('builds WhatsApp and mail links, and none without a contact', () => {
    expect(whatsappUrl('972541234567', 'hi there')).toBe('https://wa.me/972541234567?text=hi%20there');
    expect(whatsappUrl(null, 'x')).toBeNull();
    expect(mailtoUrl('a@b.co', 'Hi', 'x y')).toBe('mailto:a@b.co?subject=Hi&body=x%20y');
    expect(mailtoUrl(null, null, 'x')).toBeNull();
  });
});

function row(over: Partial<ProspectSummary>): ProspectSummary {
  return { ...summarize(prospect()), ...over };
}

describe('insights', () => {
  const now = Date.parse(NOW);
  it('counts each business at every step it reached', () => {
    const rows = [
      row({ stage: 'discovered', furthest: 'discovered' }),
      row({ stage: 'declined', furthest: 'invitationSent' }),
      row({ stage: 'activeProvider', furthest: 'activeProvider' })
    ];
    const f = funnel(rows);
    expect(f.find((s) => s.stage === 'invitationSent')).toMatchObject({ count: 2 });
    expect(f.find((s) => s.stage === 'activeProvider')).toMatchObject({ count: 1, fromPrevious: 1 });
    const c = dashboardCounts(rows, now);
    expect(c).toMatchObject({ discovered: 3, invitationsSent: 2, active: 1, closed: 1 });
  });
  it('a follow-up on a closed business is never due', () => {
    const rows = [row({ followUpAt: '2026-11-01T00:00:00Z' }), row({ stage: 'doNotContact', followUpAt: '2026-11-01T00:00:00Z' })];
    expect(dashboardCounts(rows, now).followUpsDue).toBe(1);
    expect(nextActions(rows, now)[0]).toMatchObject({ key: 'followUps', count: 1 });
    expect(rows.filter((r) => inView(r, 'followups', now))).toHaveLength(1);
  });
  it('names a new cluster of discoveries by category and region', () => {
    const rows = [row({}), row({}), row({ category: 'photography' })];
    const a = nextActions(rows, now).find((x) => x.key === 'newInCategory');
    expect(a).toMatchObject({ count: 2, category: 'catering', region: 'Sharon' });
  });
  it('finds a complement the active network keeps asking for', () => {
    const rows = [
      row({ stage: 'activeProvider', furthest: 'activeProvider', complementary: ['photography'] }),
      row({ stage: 'joined', furthest: 'joined', complementary: ['Photography'] }),
      row({ category: 'photography', stage: 'discovered' })
    ];
    expect(gaps(rows)[0]).toMatchObject({ kind: 'wantedComplement', mentions: 2 });
    const p = priority(rows[2], rows);
    expect(p.reasons.map((r) => r.key)).toEqual(expect.arrayContaining(['gap', 'complements', 'noResearch']));
    expect(coverage(rows).length).toBeGreaterThan(0);
  });
});
