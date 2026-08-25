<script module>
  /**
   * New-service maturation on silence (docs/PLAN_TIMEGRAMA.md, phase 4.3).
   *
   * `addSheirut` writes the `Sheirut` immediately but leaves it unapproved, and
   * opens a `sheirutpend` for the rikma to answer, with a clock on it. Nothing
   * was ever wired to that clock, so a service nobody objected to stayed
   * "not approved" forever — and since a `Sheirut` with `isApruved:false` is
   * rendered as such and cannot be joined, the proposal was simply lost.
   *
   * The rule is the rikma's ordinary one: **one member's yes with no objection
   * is enough**, because after restime everyone else's silence is consent. The
   * proposer's own yes is written at creation, which is what makes this gate
   * "nobody objected" in practice — the same shape `tosplit` has, and the same
   * caveat: requiring a second, non-proposer signature would be a one-line
   * tightening if the rikma ever wants one.
   *
   * Votes are read from both stores (`votes` relation and `vots` component),
   * because both code paths that write this object are still live.
   */
  import { strapiClient as strapi } from '$lib/server/actions';
  import {
    approveSheirutProposal,
    mergeSheirutpendVotes,
    sheirutGate
  } from '$lib/server/sheirut/approveSheirutRequests';
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
      console.log(`[timegrama/sheirutpend] closed #${taid} — ${why}`);
    } catch (e) {
      console.error('[timegrama/sheirutpend] markDone failed:', e);
    }
  }

  export async function Sheirutpend(id, taid) {
    try {
      const res = await strapi.execute('295getSheirutpendForFinalize', { id: String(id) });
      const row = res?.data?.sheirutpend?.data;
      if (!row) return markDone(taid, `sheirutpend ${id} no longer exists`);

      const a = row.attributes || {};

      // Answered already — by a full signature through the addVote action, or
      // by an earlier run of this (D5: "unless it was archived meanwhile").
      if (a.archived === true) return markDone(taid, `sheirutpend ${id} already archived`);

      const sheirut = a.sheirut?.data;
      if (!sheirut) {
        // The proposal outlived the service it proposed. Nothing to approve.
        return markDone(taid, `sheirutpend ${id} has no sheirut to approve`);
      }
      if (sheirut.attributes?.archived === true) {
        return markDone(taid, `sheirutpend ${id}: sheirut ${sheirut.id} was archived`);
      }
      if (sheirut.attributes?.isApruved === true) {
        // Approved along another path. The proposal is moot; close both.
        await strapi.execute('73updateSheirutpend', {
          id: String(id),
          data: { appruved: true, archived: true }
        });
        return markDone(taid, `sheirutpend ${id}: sheirut ${sheirut.id} was already approved`);
      }

      const memberIds = (a.project?.data?.attributes?.user_1s?.data ?? []).map((u) => String(u.id));
      const proposerId = a.users_permissions_user?.data?.id ?? null;
      const vots = mergeSheirutpendVotes(a);
      const gate = sheirutGate({ vots, memberIds, proposerId });

      if (gate.hasNo) {
        // An objection is an answer, and the window it had is over. Reopening
        // the discussion means a new proposal with a new clock.
        return markDone(taid, `sheirutpend ${id} has an objection`);
      }
      if (!gate.hasPMyes) {
        // Not one member of the rikma ever backed it. Silence from everyone is
        // not agreement to anything — there is no standing version to mature.
        return markDone(taid, `sheirutpend ${id} has no member approval to mature`);
      }

      const { sheirutId } = await approveSheirutProposal(
        strapi,
        {},
        { sheirutpendId: String(id), sheirutId: String(sheirut.id) }
      );

      console.log('[timegrama/sheirutpend] service approved on silence', {
        sheirutpendId: id,
        sheirutId,
        name: sheirut.attributes?.name
      });
      await markDone(taid, `sheirutpend ${id} matured on silence`);
    } catch (e) {
      // Deliberately left open: this publishes a service the rikma agreed to.
      // Closing the clock on a failure would drop that agreement. Retried next
      // run — with no attempt ceiling until PLAN_TIMEGRAMA phase 5 adds one.
      console.error(`[timegrama/sheirutpend] maturation failed for ${id}, will retry:`, e);
    }
  }
</script>
