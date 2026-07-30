/**
 * Carrying the onboarding starter plan across the rikma-creation step
 * (PLAN_ONBOARDING Track B).
 *
 * `/api/analyze-business` drafts the starter boards from the business's site or
 * description — but boards belong to a project, and at that moment the project
 * does not exist: the member still has to review the prefilled creation form
 * and approve it. Nothing may be created before they do.
 *
 * So the draft waits here, in `sessionStorage`, between the onboarding screen
 * and `baci.svelte`, which seeds it the moment the rikma is really created and
 * then hands the member straight to the board to review row by row.
 *
 * The plan is re-validated server-side when it is persisted
 * (`normalizeSeedPlan` in `seedPlan.ts`) — what sits here is client-side data
 * and is treated as such.
 */

const KEY = 'onboard.seedPlan';

/** sessionStorage is unavailable during SSR and in locked-down browsers. */
function storage() {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Park a drafted plan until the rikma exists.
 *
 * @param {{ boards: any[], sourceUrl?: string|null }|null|undefined} plan
 * @param {string} [source] - which onboarding screen drafted it ('url' | 'describe')
 */
export function stashSeedPlan(plan, source = '') {
  const store = storage();
  if (!store) return;
  if (!plan || !Array.isArray(plan.boards) || plan.boards.length === 0) {
    store.removeItem(KEY);
    return;
  }
  try {
    store.setItem(KEY, JSON.stringify({ ...plan, source, stashedAt: Date.now() }));
  } catch {
    // A full or disabled storage costs the member the starter boards, not the
    // rikma — the creation form still has everything it needs.
  }
}

/** Read the parked plan without consuming it (for "N proposals are waiting"). */
export function peekSeedPlan() {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.boards) && parsed.boards.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Read the parked plan and clear it. Consuming on read is what keeps a stale
 * draft from being seeded into the *next* rikma the member creates.
 */
export function takeSeedPlan() {
  const plan = peekSeedPlan();
  clearSeedPlan();
  return plan;
}

export function clearSeedPlan() {
  storage()?.removeItem(KEY);
}

/** How many rows are parked, for the message shown before approval. */
export function countStashedItems(plan) {
  if (!plan || !Array.isArray(plan.boards)) return 0;
  return plan.boards.reduce(
    (sum, b) => sum + (Array.isArray(b?.items) ? b.items.length : 0),
    0
  );
}
