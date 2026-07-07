import type { ConsentEvent } from '../event';
import type { ProjectState, HalukaView } from '../projection';
import { parseMoney, type MoneySerialized } from '$lib/crypto/money';

/**
 * haluka.create — a distribution-transfer line inside a tosplit (S2b, T4).
 * Mirrors the createHaluka action's `data` payload.
 *
 * predicate shape: { from, to, tosplitId?, amount?, code? }
 * (`from`/`to` are the usersend/userrecive user ids; amount is the legacy
 * float — the authoritative bigint deltas ride haluka.approve, see below.)
 */
export function halukaCreate(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as
    | { from?: unknown; to?: unknown; tosplitId?: unknown; amount?: unknown; code?: unknown }
    | undefined;

  const from = typeof p?.from === 'string' ? p.from : undefined;
  const to = typeof p?.to === 'string' ? p.to : undefined;
  if (!from || !to || from === to) return state; // malformed — ignore silently

  const view: HalukaView = {
    id: ev.subject.id,
    from,
    to,
    tosplitId: typeof p?.tosplitId === 'string' ? p.tosplitId : undefined,
    amount: typeof p?.amount === 'number' ? p.amount : undefined,
    code: typeof p?.code === 'string' ? p.code : undefined,
    status: 'pending'
  };

  const halukas = new Map(state.halukas);
  halukas.set(view.id, view);
  return { ...state, halukas };
}

/**
 * haluka.approve — the group-consensus event that marks a haluka ushar and
 * applies the resulting hervachti deltas (approveHaluka step 4, chain-native:
 * the deltas are DECLARED in the signed event, never derived from a client's
 * idea of the current balance).
 *
 * predicate shape:
 *   { hervachDeltas?: Array<{ member: string, amount: MoneySerialized }> }
 *
 * Quorum validation is the verifier's job (same split as missionApprove).
 * A haluka never seen by the chain gets no stub — approving a transfer whose
 * from/to we don't know would fabricate state.
 */
export function halukaApprove(state: ProjectState, ev: ConsentEvent): ProjectState {
  const view = state.halukas.get(ev.subject.id);

  let halukas = state.halukas;
  if (view && view.status === 'pending') {
    halukas = new Map(halukas);
    halukas.set(view.id, { ...view, status: 'approved' });
  }

  const p = ev.predicate as { hervachDeltas?: unknown } | undefined;
  let balances = state.balances;
  if (Array.isArray(p?.hervachDeltas)) {
    for (const d of p!.hervachDeltas as Array<{ member?: unknown; amount?: unknown }>) {
      if (typeof d?.member !== 'string') continue;
      const delta = tryParseMoney(d.amount);
      if (delta === null) continue;
      if (balances === state.balances) balances = new Map(balances);
      balances.set(d.member, (balances.get(d.member) ?? 0n) + delta);
    }
  }

  if (halukas === state.halukas && balances === state.balances) return state;
  return { ...state, halukas, balances };
}

/**
 * haluka.confirm — the receiver's sovereign confirmation of receipt
 * (confirmHaluka action). Only the recorded receiver can confirm; anyone
 * else's confirm is ignored (enforced again, harder, at ingest later — T5
 * style).
 */
export function halukaConfirm(state: ProjectState, ev: ConsentEvent): ProjectState {
  const view = state.halukas.get(ev.subject.id);
  if (!view) return state;
  if (view.status === 'confirmed') return state;
  if (ev.actor !== view.to) return state;

  const halukas = new Map(state.halukas);
  halukas.set(view.id, { ...view, status: 'confirmed' });
  return { ...state, halukas };
}

function tryParseMoney(x: unknown): bigint | null {
  try {
    return parseMoney(x as MoneySerialized).amount;
  } catch {
    return null;
  }
}
