<script module>
  /**
   * Monthly cycle maturation on silence (docs/PLAN_TIMEGRAMA.md, D1).
   *
   * `/api/monthi` opens a cycle `Maap` for every recurring expense each month
   * and attaches a clock to it. Nothing was ever wired to that clock: the only
   * thing that ever matured a cycle was `weget.svelte` calling `autoApprove()`
   * in the browser when a member happened to open the lev page with an expired
   * timer. A month's expense settling depended on who opened which page — so
   * this is the finalizer that clock always implied.
   *
   * **The rule is not the ordinary one.** For most kinds a single approval plus
   * silence is enough. Here the money leaves someone's pocket and only one
   * person knows how much: the member responsible for the resource. Their
   * silence cannot be read as "yes, that is what I spent", because nobody
   * consents to a figure by saying nothing about it. So:
   *
   *   - the responsible member must have signed the round explicitly;
   *   - given that, everyone else's silence is consent and the cycle settles;
   *   - without it the clock simply ends and the cycle stays open, waiting for
   *     the only signature that can start it.
   *
   * That is the same exception `funderHasSigned` carves out for stipends, for
   * the same reason (PLAN_STIPEND §5).
   *
   * Rounds: a counter-offer (`submitNegoMaap`) votes at order+1 and resets the
   * clock, so the highest order is the version standing on the table and the
   * only one consensus is judged on.
   *
   * Settling a month means writing the spend as a delivery line on the engine's
   * `Rikmash` — a permission the cron's role was missing, which kept this
   * unwired until it was granted on 2026-08-25 (PLAN_TIMEGRAMA B13). Order
   * matters and is deliberate: `settleCycleMaap` writes that ledger row BEFORE
   * archiving the cycle, and `strapi.execute` throws on FORBIDDEN, so if the
   * permission ever goes away this aborts before mutating anything and the
   * clock stays open rather than losing the month.
   */
  import { strapiClient as strapi } from '$lib/server/actions';
  import { settleCycleMaap } from '$lib/server/recurring/settleCycleMaap';
  import { SendToAdmin } from '$lib/server/sendToAdmin.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';

  /** Close the clock. Every path that decides not to settle ends here. */
  async function markDone(taid, why) {
    try {
      await SendToAdmin(
        `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
        ADMINMONTHER
      );
      console.log(`[timegrama/maap] closed #${taid} — ${why}`);
    } catch (e) {
      console.error('[timegrama/maap] markDone failed:', e);
    }
  }

  const normId = (rel) => {
    const v = rel?.data?.id ?? rel?.id ?? rel;
    return v == null ? null : String(v);
  };

  export async function Maap(id, taid) {
    try {
      const res = await strapi.execute('151getMaapForVote', { id: String(id) });
      const maap = res?.data?.maap?.data;
      if (!maap) return markDone(taid, `maap ${id} no longer exists`);

      const attrs = maap.attributes || {};

      // Already settled — by full consensus, or by an earlier run of this.
      if (attrs.archived === true) return markDone(taid, `maap ${id} already archived`);

      // Only recurring cycle Maaps get a clock. Anything else here is a data
      // shape this finalizer does not model, and never will settle on its own.
      const mash = attrs.mashabetahalich?.data;
      if (!mash) return markDone(taid, `maap ${id} is not a recurring cycle`);

      const mashAttrs = mash.attributes || {};
      const projectId = normId(mashAttrs.project);
      const responsibleId = normId(mashAttrs.users_permissions_user);

      if (!projectId) return markDone(taid, `maap ${id} has no project`);
      if (!responsibleId) {
        // Nobody is on the hook for this resource, so the signature D1 requires
        // can never arrive. End the clock; the cycle stays open for the rikma.
        return markDone(taid, `maap ${id} has no responsible member to sign`);
      }

      // Current round — a counter-offer moved everyone to a new one.
      const allVots = attrs.vots ?? [];
      const round = allVots.reduce((mx, v) => Math.max(mx, Number(v?.order ?? 0)), 0);
      const thisRound = allVots.filter((v) => Number(v?.order ?? 0) === round);

      const responsibleSigned = thisRound.some(
        (v) => v?.what === true && normId(v?.users_permissions_user) === responsibleId
      );
      if (!responsibleSigned) {
        // D1. Not a rejection — the proposal keeps standing, it just cannot
        // mature on silence alone.
        return markDone(
          taid,
          `maap ${id}: the responsible member has not signed — cycle left open`
        );
      }

      if (thisRound.some((v) => v?.what === false)) {
        // An objection is an answer, and the window it had is over. "I don't
        // agree to this amount" is a counter through submitNegoMaap, which
        // opens its own clock.
        return markDone(taid, `maap ${id} has an objection this round`);
      }

      // What the responsible member reported. The engine's pricePerUnit is only
      // a planned preview, used when nothing was typed.
      const spend = Number(attrs.quantityDelivered ?? mashAttrs.pricePerUnit ?? 0);

      // Normalize the vote rows for the write-back: Strapi wants plain ids.
      const vots = allVots
        .map((v) => {
          const uid = normId(v?.users_permissions_user);
          if (!uid) return null;
          const row = { what: Boolean(v?.what), users_permissions_user: uid, order: Number(v?.order ?? 0) };
          if (v?.why) row.why = v.why;
          return row;
        })
        .filter(Boolean);

      const { rikmashId } = await settleCycleMaap(
        strapi,
        {},
        {
          maapId: String(id),
          projectId,
          mashId: String(mash.id),
          mashAttrs,
          maapName: attrs.name,
          cycleIndex: attrs.cycleIndex ?? 1,
          spend,
          vots,
          // The figure is the responsible member's assertion, so the delivery
          // line is recorded under them — not under a user who never acted.
          confirmedBy: responsibleId,
          timegramaId: taid
        }
      );

      console.log('[timegrama/maap] cycle settled on silence', {
        maapId: id,
        spend,
        rikmashId,
        round
      });
      // settleCycleMaap closed the clock; this is the belt-and-braces for the
      // case where that one write failed.
      await markDone(taid, `maap ${id} settled on silence`);
    } catch (e) {
      // Deliberately left open: this is the write that records a real expense.
      // Closing the clock on a failure would lose the month. Retried next run —
      // with no attempt ceiling until PLAN_TIMEGRAMA phase 5 adds one.
      console.error(`[timegrama/maap] settlement failed for ${id}, will retry:`, e);
    }
  }
</script>
