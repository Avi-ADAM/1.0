/**
 * The Growth Agent's detail panels mount on a real record and say what they
 * must say (docs/inprogress/PLAN_GROWTH_AGENT.md §5–§7): verified vs suggested
 * on the profile, "opening WhatsApp is not sending", and no outreach at all on
 * a closed door.
 */

import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { readable } from 'svelte/store';

vi.mock('$lib/translations', () => ({
  t: readable((key: string, payload?: Record<string, unknown>) => (payload ? `${key}:${Object.values(payload).join(',')}` : key)),
  locale: readable('en')
}));
vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn(), goto: vi.fn() }));
vi.mock('$lib/client/actionClient', () => ({ executeAction: vi.fn(async () => ({ success: true, data: {} })) }));

import ResearchPanel from './ResearchPanel.svelte';
import ProfilePanel from './ProfilePanel.svelte';
import OutreachPanel from './OutreachPanel.svelte';
import ActivityPanel from './ActivityPanel.svelte';
import { cleanInput, newProspect, setStage } from '$lib/growth/prospect';
import { draftProfile } from '$lib/growth/profile';
import { templateVariants } from '$lib/growth/outreach';
import type { Prospect } from '$lib/growth/types';

const NOW = '2026-11-20T10:00:00.000Z';

function fixture(): Prospect {
  const c = cleanInput({ name: 'Shir Catering', website: 'shir.co.il', email: 'info@shir.co.il', phone: '0541234567', category: 'catering' }, 'u1', NOW);
  if (!c.ok) throw new Error();
  const p = newProspect(c.value, [], 'u1', NOW);
  p.research = {
    at: NOW,
    by: 'u1',
    status: 'done',
    problems: [],
    sourceUrl: 'https://shir.co.il/',
    sourceTitle: 'Shir',
    contacts: [{ kind: 'email', value: 'events@shir.co.il', sourceUrl: 'https://shir.co.il/' }],
    summary: { text: 'Kosher caterer', evidence: 'kosher catering', sourceUrl: 'https://shir.co.il/', verified: true, confidence: 'high' },
    services: [{ text: 'Vegan menus', evidence: 'nope', verified: false, confidence: 'low' }],
    products: [],
    coverage: null,
    categories: ['events'],
    customers: ['couples'],
    keywords: ['kosher'],
    whyJoin: 'Customers ask for event food',
    requestsFulfilled: ['Food for 80 guests'],
    collaboration: 'With photographers',
    complementary: ['photography'],
    missing: ['missing:coverage'],
    confidence: 'medium'
  };
  p.profile = { ...draftProfile(p, NOW), approvedAt: NOW, approvedBy: 'u1' };
  const variants = templateVariants(p, 'en');
  p.lang = 'en';
  p.outreach = { generatedAt: NOW, variants, approved: { ...variants[2], approvedAt: NOW, approvedBy: 'u1' } };
  return p;
}

describe('growth panels', () => {
  it('research marks verified and unverified claims, and frames interpretation as the agent\'s', () => {
    const { container } = render(ResearchPanel, { prospect: fixture() });
    const text = container.textContent ?? '';
    expect(text).toContain('growth.research.verified');
    expect(text).toContain('growth.research.unverified');
    expect(text).toContain('growth.research.aiAnswers');
    expect(text).toContain('events@shir.co.il');
    expect(text).toContain('growth.missing.coverage');
  });

  it('the profile preview carries an origin on its fields', () => {
    const { container } = render(ProfilePanel, { prospect: fixture() });
    const text = container.textContent ?? '';
    expect(text).toContain('growth.profile.preview');
    expect(text).toContain('growth.origin.verified');
    expect(text).toContain('growth.origin.suggested');
    expect(text).toContain('growth.profile.approved');
  });

  it('outreach offers WhatsApp and mail with the approved text, and says that opening them is not sending', () => {
    const { container } = render(OutreachPanel, { prospect: fixture(), phoneDigits: '972541234567' });
    const wa = container.querySelector('a[href^="https://wa.me/972541234567"]');
    expect(wa).toBeTruthy();
    expect(container.querySelector('a[href^="mailto:info@shir.co.il"]')).toBeTruthy();
    expect(container.textContent).toContain('growth.send.rule');
    // No link prepared yet: the placeholder never reaches the business.
    expect(decodeURIComponent(wa!.getAttribute('href')!)).not.toContain('{{link}}');
  });

  it('a closed door shows no outreach controls at all', () => {
    const p = setStage(fixture(), 'doNotContact', 'u1', NOW);
    const { container } = render(OutreachPanel, { prospect: p, phoneDigits: '972541234567' });
    expect(container.textContent).toContain('growth.outreach.closed.doNotContact');
    expect(container.querySelector('a[href^="https://wa.me"]')).toBeNull();
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('the log names who did what', () => {
    const { container } = render(ActivityPanel, { prospect: fixture(), uid: 'u1' });
    expect(container.textContent).toContain('growth.activity.created');
    expect(container.textContent).toContain('growth.log.you');
  });
});
