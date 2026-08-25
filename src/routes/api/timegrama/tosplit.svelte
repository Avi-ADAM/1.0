<script module>
  /**
   * Profit-split maturation on silence (docs/PLAN_TIMEGRAMA.md, D5).
   *
   * A `tosplit` proposes how a rikma's earnings divide. It has always had a
   * timegrama — the clock was created, shown on the lev card, and counted
   * down — but nothing was ever wired to fire when it reached zero, so a split
   * nobody objected to simply stayed proposed. 17 of them had been sitting that
   * way, the oldest since 2025.
   *
   * The rule is the rikma's ordinary one, the same `hasOk && !hasNo` gate
   * decision.svelte applies to its own kinds: **one member's approval with no
   * objection is enough**, because everyone else's silence is consent once
   * restime has run out. When it passes, the split is applied through exactly
   * the code an all-members signature would have run
   * (`applyTosplitApproval`) — "everyone agreed" and "nobody objected in time"
   * must not be able to settle differently.
   *
   * Settling a split means marking its Halukas `ushar`, which needs `find` +
   * `update` on Haluka for the cron's `ADMINMONTHER` role. That was missing
   * (PLAN_TIMEGRAMA B12) and this stayed unwired until it was granted on
   * 2026-08-25 — without it a run would close the split and move the balances
   * while leaving the transfers unmarked, a half-settlement on money. If a run
   * ever logs FORBIDDEN on `81updateHaluka`, that permission is what regressed.
   *
   * Two things this deliberately does NOT do:
   *  - it does not invent votes for the silent members. The record keeps the
   *    signatures that were actually given; `finished` plus the elapsed clock
   *    is what says the rest consented.
   *  - it does not mature an objection away. A `what:false` closes the clock
   *    without applying anything — restarting the discussion opens a new one.
   */
  import { strapiClient as strapi } from '$lib/server/actions';
  import { applyTosplitApproval, hervachDeltasFrom } from '$lib/server/haluka/applyTosplitApproval';
  import { SendToAdmin } from '$lib/server/sendToAdmin.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';

  /** Close the clock. Every path that decides not to act ends here. */
  async function markDone(taid, why) {
    try {
      await SendToAdmin(
        `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
        ADMINMONTHER
      );
      console.log(`[timegrama/tosplit] closed #${taid} — ${why}`);
    } catch (e) {
      console.error('[timegrama/tosplit] markDone failed:', e);
    }
  }

  const normId = (rel) => {
    const v = rel?.data?.id ?? rel?.id ?? rel;
    return v == null ? null : String(v);
  };

  export async function Tosplit(id, taid) {
    try {
      const res = await strapi.execute('173getTosplitForFinalize', { id: String(id) });
      const tosplit = res?.data?.tosplit?.data;
      if (!tosplit) return markDone(taid, `tosplit ${id} no longer exists`);

      const a = tosplit.attributes || {};

      // Already settled — by a full signature, or by a previous run of this
      // very finalizer. Nothing left to mature (D5: "unless it was archived").
      if (a.finished === true) return markDone(taid, `tosplit ${id} already finished`);

      const vots = (a.vots || []).map((v) => ({
        what: v?.what,
        users_permissions_user: normId(v?.users_permissions_user)
      }));

      const hasOk = vots.some((v) => v.what === true);
      const hasNo = vots.some((v) => v.what === false);

      if (!hasOk) {
        // Nobody inside the rikma ever backed it. Silence from everyone is not
        // agreement to anything — there is no standing version to mature.
        return markDone(taid, `tosplit ${id} has no approval to mature`);
      }
      if (hasNo) {
        // Someone said no. That is an answer, and the window it had is over.
        return markDone(taid, `tosplit ${id} has an objection`);
      }

      await applyTosplitApproval(
        strapi,
        {},
        {
          tosplitId: String(id),
          // Only real signatures — see the header note.
          vots: vots
            .filter((v) => v.users_permissions_user)
            .map((v) => ({ what: v.what === true, users_permissions_user: v.users_permissions_user })),
          halukot: (a.halukas?.data || []).map((h) => ({ id: h.id })),
          sales: (a.sales?.data || []).map((s) => ({ id: s.id })),
          // Recomputed here from the Tosplit itself. On the card the client
          // sends these; the clock has no client, and taking them from the
          // stored rows is the more trustworthy source anyway.
          hervachUpdates: hervachDeltasFrom(a.hervachti)
        }
      );

      console.log('[timegrama/tosplit] matured on silence', { tosplitId: id });
      await markDone(taid, `tosplit ${id} matured on silence`);
    } catch (e) {
      // Deliberately left open: this is the write that settles money. Closing
      // the clock on a failure would drop an agreed split. Retried next run —
      // with no attempt ceiling until PLAN_TIMEGRAMA phase 5 adds one.
      console.error(`[timegrama/tosplit] maturation failed for ${id}, will retry:`, e);
    }
  }
</script>
