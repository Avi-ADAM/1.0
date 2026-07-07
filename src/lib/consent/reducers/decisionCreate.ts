import type { ConsentEvent } from '../event';
import type { ProjectState, DecisionView } from '../projection';

/**
 * decision.create — a Decision entity of any kind (S2b, T4).
 *
 * Rides the "Decision model, don't invent new voting" super-principle: every
 * consent flow is a Decision `kind`; the votes arrive as decision.vote (or a
 * stage-specific vote name) and are tallied in `stageVotes` / `saleClaims`.
 *
 * predicate shape: { kind?, ref? }
 *   `ref` optionally points at the entity the decision is about (sale id,
 *   mission id, …).
 *
 * kind:'saleClaim' decisions are ALSO tracked bilaterally in `saleClaims`,
 * planted by the sale.record reducer — this view is just the generic record.
 */
export function decisionCreate(state: ProjectState, ev: ConsentEvent): ProjectState {
  const p = ev.predicate as { kind?: unknown; ref?: unknown } | undefined;

  const view: DecisionView = {
    id: ev.subject.id,
    createdBy: ev.actor,
    createdAt: ev.ts,
    kind: typeof p?.kind === 'string' ? p.kind : undefined,
    ref: typeof p?.ref === 'string' ? p.ref : undefined
  };

  const decisions = new Map(state.decisions);
  decisions.set(view.id, view);
  return { ...state, decisions };
}
