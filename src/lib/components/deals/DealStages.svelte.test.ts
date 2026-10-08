import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import { readable } from 'svelte/store';
import he from '$lib/translations/he/deals.json';
import { dealStages, type DealChain } from '$lib/sheirut/dealChain';

// The real `he` strings, so a missing key shows up as a missing label.
vi.mock('$lib/translations', () => {
  const dict = he as Record<string, any>;
  const t = readable((key: string, vars: Record<string, unknown> = {}) => {
    const raw = key
      .replace(/^deals\./, '')
      .split('.')
      .reduce((o: any, k) => o?.[k], dict);
    return typeof raw === 'string' ? raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? '')) : '';
  });
  return { t };
});

const DealStages = (await import('./DealStages.svelte')).default;

const wishDeal: DealChain = { wishId: '16', requests: [{ id: '5', dealId: '8' }], deals: [{ id: '8', closed: false }] };

function strip(chain: DealChain, at: Parameters<typeof dealStages>[1], variant?: 'deals' | 'concierge') {
  const view = render(DealStages as any, { props: { stages: dealStages(chain, at), variant } });
  const items = [...view.container.querySelectorAll('li')].map((li) => ({
    text: (li.textContent ?? '').replace(/\s+/g, ' ').trim(),
    href: li.querySelector('a')?.getAttribute('href') ?? null,
    here: li.querySelector('[aria-current="step"]') != null
  }));
  return { view, items };
}

describe('DealStages', () => {
  it('on the deal page: back to the wish and the request, the deal itself is not a link', () => {
    const { view, items } = strip(wishDeal, { kind: 'deal', id: '8' });
    expect(view.container.querySelector('nav')?.getAttribute('aria-label')).toBe(he.stages.label);
    expect(items).toEqual([
      { text: `✓ ${he.stages.wish}`, href: '/concierge/16', here: false },
      { text: `✓ ${he.stages.request}`, href: '/deals/request/5', here: false },
      { text: `3 ${he.stages.deal}`, href: null, here: true },
      { text: `4 ${he.stages.closed}`, href: null, here: false }
    ]);
  });

  it('several deals from one wish show their count', () => {
    const chain: DealChain = {
      wishId: '16',
      requests: [
        { id: '5', dealId: '8' },
        { id: '6', dealId: '9' }
      ],
      deals: [
        { id: '8', closed: false },
        { id: '9', closed: false }
      ]
    };
    const { view } = strip(chain, { kind: 'wish', id: '16' });
    const cnt = [...view.container.querySelectorAll('.cnt')];
    expect(cnt.map((c) => c.textContent)).toEqual(['2', '2']);
    expect(cnt[0].getAttribute('title')).toBe(he.stages.count.replace('{{count}}', '2'));
  });

  it('takes the concierge skin on the wish page', () => {
    const { view } = strip(wishDeal, { kind: 'wish', id: '16' }, 'concierge');
    expect(view.container.querySelector('nav.ds-concierge')).not.toBeNull();
  });

  it('renders nothing without stages', () => {
    const view = render(DealStages as any, { props: { stages: [] } });
    expect(view.container.querySelector('nav')).toBeNull();
  });
});
