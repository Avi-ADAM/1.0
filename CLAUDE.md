# 1lev1 — Project Memory

See `AGENTS.md` for architecture (Unified Action System, QIDS, lev pipeline)
and `docs/PLAN_*.md` for feature plans.

## Product design principles (apply to EVERY new flow)

### 1. Encourage consent — no absolute "reject" button
Unilateral rejection kills the conversation; the platform is built to drive
parties toward agreement. Any approval flow offers exactly three moves:
- **Approve** the standing proposal.
- **Chat** — clarify via the linked forum (deep deliberation happens on the
  separate Consensus site).
- **Negotiate** — raise a refined parallel claim (counter-proposal) instead of
  saying "no". A flat "I disagree" is expressed as a counter with different
  values (e.g., quantity/amount 0), never as a veto.

Negotiation mechanics: counter-proposals ping-pong between the parties in
rounds tracked by the `vote.order` integer. Each proposer's submission counts
as their own YES vote at the new order N+1. Consensus = all required parties
have a YES vote at the highest order N; the round-N version is what gets
applied. UI precedent: `src/lib/components/prPr/negoPend.svelte` with the
field editors in `src/lib/components/conf/`.

### 2. restime + timegrama everywhere (silence is consent)
Every pending-consent flow must create a `timegrama` record (`whatami` +
relation to the target, `date = now + calcX(project.restime)`). The hourly
cron at `src/routes/api/timegrama/+server.js` dispatches per `whatami` to a
handler that auto-approves the latest standing proposal when the project's
decision window (`restime`, e.g. 72h) passes with no response. Every
counter-proposal round resets the clock (mark old timegrama `done`, create a
new one). No consent flow should be able to stall forever.

### 3. Don't invent new voting models — ride the `Decision` collection
`Decision` already manages many project vote types via its `kind` enum and is
wired to everything a consent flow needs: `votes` relation (with `order` for
rounds), `negodes`/`negom` components for counter values, `timegrama`
(oneToOne), `forums` (chat), lev-page flow (`decisionMaking.svelte`,
extractors), `voteOnDecision` action, and `addVote type:'decision'` (already
mapped to the `decision.vote` consent event). To add a new decision-like flow:
add a `kind` value + a relation to the subject entity, and branch the
consensus rule per kind if needed (e.g., two-party instead of all-members).

## Sale reporting (sales-center & everywhere)
All UI sale reports funnel through `SaleComponent.svelte` →
`executeAction('createSale')` — one choke point for the whole site
(sales-center, prPr sale/hamatanot, gift page, AI chat ProductList).
"Money is with me" = sovereign self-report, final immediately. "Money is with
someone else" = a claim requiring the holder's consent via a
`Decision kind:'saleClaim'` (see `docs/PLAN_sale_holder_consent.md`).
NOTE: `Sale.pending` is taken (means "attached to a tosplit awaiting votes") —
never reuse it for holder consent.
