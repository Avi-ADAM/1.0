import { describe, expect, it } from 'vitest';
import {
  buildPipeline,
  DEFAULT_PIPELINE_FILTER,
  filterPipeline,
  pipelineCounts,
  type PipelineLeadInput,
  type PipelineOrderInput,
  type PipelineProposalInput
} from './pipeline';

const NOW = Date.parse('2026-11-04T12:00:00Z');
const H = 3600_000;
const iso = (msAgo: number) => new Date(NOW - msAgo).toISOString();
const SETTINGS = { leadResponseHours: 24, leadStaleDays: 7 };

function lead(over: Partial<PipelineLeadInput> = {}): PipelineLeadInput {
  return {
    id: '1',
    name: 'Dana',
    organization: null,
    status: 'new',
    source: 'api',
    sourceLabel: null,
    ownerId: null,
    ownerName: null,
    actId: null,
    followUpAt: null,
    nextAction: null,
    lastActivityAt: null,
    createdAt: iso(H),
    pausedReason: null,
    products: [],
    orderIds: [],
    orderStatuses: [],
    estimatedValue: null,
    currency: null,
    ...over
  };
}

function order(over: Partial<PipelineOrderInput> = {}): PipelineOrderInput {
  return {
    id: '40',
    number: '1040',
    status: 'pendingPayment',
    buyerName: 'Avi',
    createdAt: iso(2 * H),
    total: 120,
    currency: 'ILS',
    products: ['Mug'],
    ...over
  };
}

function proposal(over: Partial<PipelineProposalInput> = {}): PipelineProposalInput {
  return {
    id: '7',
    ratsonId: '70',
    name: 'Kitchen',
    status: 'suggested',
    hiddenByWisher: false,
    hasConversation: false,
    hasPrice: false,
    createdAt: iso(3 * H),
    updatedAt: null,
    total: null,
    ...over
  };
}

describe('buildPipeline', () => {
  it('puts leads, unlinked pending orders and proposals on one path', () => {
    const rows = buildPipeline({ leads: [lead()], orders: [order()], proposals: [proposal()] }, NOW, SETTINGS);
    expect(rows.map((r) => [r.key, r.stage])).toEqual([
      ['proposal:7', 'new'],
      ['order:40', 'offered'],
      ['lead:1', 'new']
    ]);
  });

  it("an order a lead points to is the lead's offer, not a row of its own", () => {
    const rows = buildPipeline(
      { leads: [lead({ orderIds: ['40'], orderStatuses: ['pendingPayment'], status: 'talking' })], orders: [order()], proposals: [] },
      NOW,
      SETTINGS
    );
    expect(rows.map((r) => [r.key, r.stage])).toEqual([['lead:1', 'offered']]);
  });

  it('leaves out what money already closed, spam, and paid orders', () => {
    const rows = buildPipeline(
      {
        leads: [lead({ id: '2', orderStatuses: ['paid'], orderIds: ['9'] }), lead({ id: '3', status: 'spam' })],
        orders: [order({ status: 'paid' }), order({ id: '41', status: 'cancelled' })],
        proposals: [proposal({ status: 'accepted' }), proposal({ id: '8', hiddenByWisher: true })]
      },
      NOW,
      SETTINGS
    );
    expect(rows.map((r) => [r.key, r.stage, r.pausedReason])).toEqual([
      ['proposal:7', 'offered', null],
      ['proposal:8', 'paused', 'choseOther']
    ]);
  });

  it('needs-attention first, then whatever waited longest', () => {
    const rows = buildPipeline(
      {
        leads: [
          lead({ id: 'fresh', createdAt: iso(H) }),
          lead({ id: 'old-quiet', status: 'talking', createdAt: iso(5 * 24 * H), lastActivityAt: iso(3 * 24 * H) }),
          lead({ id: 'unanswered', createdAt: iso(30 * H) })
        ],
        orders: [],
        proposals: []
      },
      NOW,
      SETTINGS
    );
    expect(rows.map((r) => [r.id, r.attention])).toEqual([
      ['unanswered', 'unanswered'],
      ['old-quiet', null],
      ['fresh', null]
    ]);
  });

  it('a paused lead whose day came back needs attention', () => {
    const [row] = buildPipeline(
      { leads: [lead({ status: 'paused', pausedReason: 'timing', followUpAt: iso(H) })], orders: [], proposals: [] },
      NOW,
      SETTINGS
    );
    expect([row.stage, row.attention, row.pausedReason]).toEqual(['paused', 'followUpDue', 'timing']);
  });

  it('a proposal nobody answered for a day needs attention; one in conversation never goes stale here', () => {
    const rows = buildPipeline(
      {
        leads: [],
        orders: [],
        proposals: [
          proposal({ id: 'a', createdAt: iso(25 * H) }),
          proposal({ id: 'b', hasConversation: true, createdAt: iso(40 * 24 * H) })
        ]
      },
      NOW,
      SETTINGS
    );
    expect(rows.map((r) => [r.id, r.stage, r.attention])).toEqual([
      ['a', 'new', 'unanswered'],
      ['b', 'talking', null]
    ]);
  });
});

describe('filterPipeline', () => {
  const rows = buildPipeline(
    {
      leads: [
        lead({ id: 'mine', ownerId: '5', status: 'talking' }),
        lead({ id: 'nobody', source: 'manual' }),
        lead({ id: 'later', status: 'paused', pausedReason: 'budget' })
      ],
      orders: [order()],
      proposals: []
    },
    NOW,
    SETTINGS
  );

  it('opens on everything not put aside', () => {
    expect(filterPipeline(rows, DEFAULT_PIPELINE_FILTER, '5').map((r) => r.id).sort()).toEqual(['40', 'mine', 'nobody']);
  });

  it('"not now" shows only the paused', () => {
    expect(filterPipeline(rows, { ...DEFAULT_PIPELINE_FILTER, stage: 'paused' }, null).map((r) => r.id)).toEqual(['later']);
  });

  it('"nobody\'s" is leads nobody took — an order has no one to take it', () => {
    expect(filterPipeline(rows, { ...DEFAULT_PIPELINE_FILTER, owner: 'none' }, null).map((r) => r.id)).toEqual(['nobody']);
    expect(filterPipeline(rows, { ...DEFAULT_PIPELINE_FILTER, owner: 'me' }, '5').map((r) => r.id)).toEqual(['mine']);
  });

  it('by source and by stage', () => {
    expect(filterPipeline(rows, { ...DEFAULT_PIPELINE_FILTER, source: 'shop' }, null).map((r) => r.id)).toEqual(['40']);
    expect(filterPipeline(rows, { ...DEFAULT_PIPELINE_FILTER, stage: 'talking' }, null).map((r) => r.id)).toEqual(['mine']);
  });

  it('counts', () => {
    expect(pipelineCounts(rows)).toEqual({ open: 3, attention: 0, paused: 1 });
  });
});
