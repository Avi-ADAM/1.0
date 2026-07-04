# Project super-principles

These are cross-cutting rules that apply beyond the feature that introduced
them. Change them only deliberately.

## Consent & decisions

- **No absolute "no".** A unilateral rejection ends a conversation; the system
  encourages agreement and discussion instead. For anything that needs another
  member's consent, the choices are **approve · chat (clarify/deep discussion on
  the separate consensus site) · negotiate (a more precise counter-claim that
  ping-pongs until both sides sign the same version)** — never a hard reject.
  "I received nothing" is expressed as a counter to quantity/amount 0, not a veto.

- **Silence is consent, at the rikma's pace.** Any standing claim stays open for
  the project's `restime` (via `timegrama`). No response in time ⇒ the last
  version on the table is auto-approved. A counter-proposal resets the clock.
  This applies to every new consent flow, not just sales.

- **Ride the `Decision` model; don't invent new voting.** New consent flows add
  a `kind` to `Decision` and reuse its `votes`/`vots` (with `order` = round),
  `timegrama`, `forums` (chat) and the lev-page decision pipeline. A `kind`'s
  consensus scope can differ: most are rikma-wide, but `saleClaim` is **bilateral**
  (reporter + claimed holder only).

## Sale holder consent (`kind: 'saleClaim'`)

See `docs/PLAN_sale_holder_consent.md`. Reporting a sale where the money is held
by someone else is a claim about that person's financial state and needs their
consent: it opens a bilateral `saleClaim` Decision (`holderStatus:'open'`) that
matures by mutual agreement, a matured counter round, or restime silence. "Money
is with me" is a sovereign self-report (`holderStatus:'self'`), final immediately.
A sale is counted in balances/tosplits only when **effective**
(`holderStatus` is `self`, `confirmed`, or null-legacy) — never while `open`.
