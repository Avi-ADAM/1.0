/**
 * "In progress" — every open deal before money, in one table
 * (docs/inprogress/PLAN_LEADS.md §4.1). Pure: the loader reads the rows, this
 * puts them on the one path and decides what comes first.
 *
 * Three kinds of row, none copied into another:
 *  - a lead (its stage from `stageOf`);
 *  - an order waiting for payment that no lead points to (a buyer who went
 *    straight to the offer);
 *  - a concierge wish proposal (`stageOfProposal`) — its own consent clock
 *    decides everything, the row only links to it.
 *
 * Won deals are not here: once money came in they live in the orders and
 * the sales. Paused ones are, behind the "not now" filter.
 */

import { attentionReason, type AttentionReason } from './attention';
import type { LeadSettings } from './settings';
import { stageOf, stageOfOrder, stageOfProposal, type Stage } from './stage';

export type PipelineKind = 'lead' | 'order' | 'proposal';

export interface PipelineLeadInput {
  id: string;
  name: string | null;
  organization: string | null;
  status: string | null;
  source: string | null;
  sourceLabel: string | null;
  ownerId: string | null;
  ownerName: string | null;
  actId: string | null;
  followUpAt: string | null;
  nextAction: string | null;
  lastActivityAt: string | null;
  createdAt: string | null;
  pausedReason: string | null;
  products: string[];
  orderIds: string[];
  orderStatuses: string[];
  estimatedValue: number | null;
  currency: string | null;
}

export interface PipelineOrderInput {
  id: string;
  number: string;
  status: string;
  buyerName: string | null;
  createdAt: string | null;
  total: number | null;
  currency: string | null;
  products: string[];
}

/** A manage-screen order (`$lib/shop/manage` ShopOrder) as a pipeline input. */
export function orderInput(o: {
  id: string;
  number: string;
  status: string;
  buyer?: { name: string | null } | null;
  createdAt: string | null;
  total: number | null;
  currency: string | null;
  lines: Array<{ name: string }>;
}): PipelineOrderInput {
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    buyerName: o.buyer?.name ?? null,
    createdAt: o.createdAt,
    total: o.total,
    currency: o.currency,
    products: [...new Set(o.lines.map((l) => l.name).filter(Boolean))]
  };
}

export interface PipelineProposalInput {
  id: string;
  ratsonId: string | null;
  name: string | null;
  status: string | null;
  hiddenByWisher: boolean;
  hasConversation: boolean;
  hasPrice: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  total: number | null;
}

export interface PipelineRow {
  kind: PipelineKind;
  /** `lead:12` · `order:40` · `proposal:7` — unique across kinds. */
  key: string;
  id: string;
  name: string;
  organization: string | null;
  /** The lead's source; `shop` for an order; `concierge` for a wish proposal. */
  source: string;
  sourceLabel: string | null;
  products: string[];
  stage: Stage;
  pausedReason: string | null;
  ownerId: string | null;
  ownerName: string | null;
  actId: string | null;
  /** The last thing that happened (or when it arrived). */
  lastAt: string | null;
  createdAt: string | null;
  followUpAt: string | null;
  nextAction: string | null;
  attention: AttentionReason | null;
  amount: number | null;
  currency: string | null;
  /** Order rows: the number people say out loud. */
  number: string | null;
  /** Proposal rows: the wish. */
  ratsonId: string | null;
}

/** What the manage layout streams: a rikma's leads and proposals, with its settings. */
export interface PipelineData {
  /** False until the lead schema is deployed — the tab says so instead of an empty table. */
  ready: boolean;
  leads: PipelineLeadInput[];
  proposals: PipelineProposalInput[];
  settings: LeadSettings;
  failed?: boolean;
}

type Clock = Date | number;
type AttentionSettings = Pick<LeadSettings, 'leadResponseHours' | 'leadStaleDays'>;

const before = (stage: Stage) => stage !== 'won' && stage !== 'spam';

export function leadRow(l: PipelineLeadInput, now: Clock, settings: AttentionSettings): PipelineRow {
  const stage = stageOf({ status: l.status }, { orderStatuses: l.orderStatuses });
  return {
    kind: 'lead',
    key: `lead:${l.id}`,
    id: l.id,
    name: l.name?.trim() || '—',
    organization: l.organization,
    source: l.source ?? 'api',
    sourceLabel: l.sourceLabel,
    products: l.products,
    stage,
    pausedReason: stage === 'paused' ? l.pausedReason : null,
    ownerId: l.ownerId,
    ownerName: l.ownerName,
    actId: l.actId,
    lastAt: l.lastActivityAt ?? l.createdAt,
    createdAt: l.createdAt,
    followUpAt: l.followUpAt,
    nextAction: l.nextAction,
    attention: attentionReason(
      { status: stage, createdAt: l.createdAt, lastActivityAt: l.lastActivityAt, followUpAt: l.followUpAt },
      now,
      settings
    ),
    amount: l.estimatedValue,
    currency: l.currency,
    number: null,
    ratsonId: null
  };
}

export function orderRow(o: PipelineOrderInput): PipelineRow | null {
  if (stageOfOrder(o.status) !== 'offered') return null;
  return {
    kind: 'order',
    key: `order:${o.id}`,
    id: o.id,
    name: o.buyerName?.trim() || '—',
    organization: null,
    source: 'shop',
    sourceLabel: null,
    products: o.products,
    stage: 'offered',
    pausedReason: null,
    ownerId: null,
    ownerName: null,
    actId: null,
    lastAt: o.createdAt,
    createdAt: o.createdAt,
    followUpAt: null,
    nextAction: null,
    // An order waiting for payment has its own lapse clock (expiresAt); it is
    // not a lead somebody forgot to answer.
    attention: null,
    amount: o.total,
    currency: o.currency,
    number: o.number,
    ratsonId: null
  };
}

export function proposalRow(p: PipelineProposalInput, now: Clock, settings: AttentionSettings): PipelineRow | null {
  const { stage, pausedReason } = stageOfProposal(p);
  if (!before(stage)) return null;
  return {
    kind: 'proposal',
    key: `proposal:${p.id}`,
    id: p.id,
    name: p.name?.trim() || '—',
    organization: null,
    source: 'concierge',
    sourceLabel: null,
    products: [],
    stage,
    pausedReason: pausedReason ?? null,
    ownerId: null,
    ownerName: null,
    actId: null,
    lastAt: p.updatedAt ?? p.createdAt,
    createdAt: p.createdAt,
    followUpAt: null,
    nextAction: null,
    // Only "nobody answered yet" — a proposal's own silence clock handles the rest.
    attention:
      stage === 'new'
        ? attentionReason({ status: 'new', createdAt: p.createdAt }, now, { ...settings, leadStaleDays: Infinity })
        : null,
    amount: p.total,
    currency: null,
    number: null,
    ratsonId: p.ratsonId
  };
}

/**
 * Every open deal before money. An order that a lead already points to is
 * that lead's offer, not a row of its own.
 */
export function buildPipeline(
  input: { leads: PipelineLeadInput[]; orders: PipelineOrderInput[]; proposals: PipelineProposalInput[] },
  now: Clock,
  settings: AttentionSettings
): PipelineRow[] {
  const linked = new Set(input.leads.flatMap((l) => l.orderIds));
  const rows: PipelineRow[] = [];
  for (const l of input.leads) {
    const r = leadRow(l, now, settings);
    if (before(r.stage)) rows.push(r);
  }
  for (const o of input.orders) {
    if (linked.has(o.id)) continue;
    const r = orderRow(o);
    if (r) rows.push(r);
  }
  for (const p of input.proposals) {
    const r = proposalRow(p, now, settings);
    if (r) rows.push(r);
  }
  return sortPipeline(rows);
}

const at = (iso: string | null) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
};

/** Needs attention first; then whatever has waited longest since anything happened. */
export function sortPipeline(rows: PipelineRow[]): PipelineRow[] {
  return [...rows].sort((a, b) => {
    const att = Number(!!b.attention) - Number(!!a.attention);
    if (att) return att;
    return at(a.lastAt) - at(b.lastAt) || a.key.localeCompare(b.key);
  });
}

export type StageFilter = 'open' | 'paused' | Stage;
export type OwnerFilter = 'all' | 'me' | 'none';

export interface PipelineFilter {
  stage: StageFilter;
  owner: OwnerFilter;
  source: string; // 'all' or a source
  attention: boolean;
}

export const DEFAULT_PIPELINE_FILTER: Readonly<PipelineFilter> = Object.freeze({
  stage: 'open',
  owner: 'all',
  source: 'all',
  attention: false
});

export function filterPipeline(rows: PipelineRow[], f: PipelineFilter, meId: string | null): PipelineRow[] {
  return rows.filter((r) => {
    if (f.stage === 'open' ? r.stage === 'paused' : r.stage !== f.stage) return false;
    if (f.owner === 'me' && (!meId || r.ownerId !== meId)) return false;
    // "Nobody's" means a lead nobody took — orders and proposals have no owner to take.
    if (f.owner === 'none' && (r.kind !== 'lead' || r.ownerId)) return false;
    if (f.source !== 'all' && r.source !== f.source) return false;
    if (f.attention && !r.attention) return false;
    return true;
  });
}

export interface PipelineCounts {
  open: number;
  attention: number;
  paused: number;
}

export function pipelineCounts(rows: PipelineRow[]): PipelineCounts {
  let open = 0,
    attention = 0,
    paused = 0;
  for (const r of rows) {
    if (r.stage === 'paused') paused++;
    else open++;
    if (r.attention) attention++;
  }
  return { open, attention, paused };
}
