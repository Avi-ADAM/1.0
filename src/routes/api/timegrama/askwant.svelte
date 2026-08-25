<script module>
  /**
   * Join-a-service maturation (docs/PLAN_TIMEGRAMA.md, D2 + phase 4.4).
   *
   * `sheirutShow` lets someone ask to receive a rikma's service. The request is
   * an `askwant` with a clock on it, and the clock had no finalizer — so the
   * four requests standing in production have been overdue for roughly three
   * years with nothing on the other end.
   *
   * **D2 — the rule for anything involving someone outside the rikma.** Silence
   * from the whole rikma is not consent to take a new customer on: if no member
   * approved, the clock ends and the request does not mature. Once one member
   * has said yes, the rest of the rikma's silence is consent and it does. That
   * is the same asymmetry `ask` / `askm` apply to candidates.
   *
   * Maturing turns the request into a `Want` — the subscription row
   * `Sheirut.wants` holds. Nothing in the app creates one today, so this is the
   * first writer of that path; the shape comes from the content type, and the
   * write is guarded so a retry cannot subscribe anyone twice.
   *
   * Note what this cannot yet do anything about: there is no UI that votes on
   * an askwant. Until one exists every clock here ends in "no member approval",
   * which is the correct answer to a request nobody could answer — but it means
   * the requester hears nothing. That reminder is tracked separately in
   * docs/TIMEGRAMA_REMINDERS.md.
   */
  import { strapiClient as strapi } from '$lib/server/actions';
  import { approveAskwant, sheirutGate } from '$lib/server/sheirut/approveSheirutRequests';
  import { normId } from '$lib/server/nego/negoGate';
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
      console.log(`[timegrama/askwant] closed #${taid} — ${why}`);
    } catch (e) {
      console.error('[timegrama/askwant] markDone failed:', e);
    }
  }

  export async function Askwant(id, taid) {
    try {
      const res = await strapi.execute('298getAskwantForFinalize', { id: String(id) });
      const row = res?.data?.askwant?.data;
      if (!row) return markDone(taid, `askwant ${id} no longer exists`);

      const a = row.attributes || {};

      // Answered already — or matured by an earlier run of this (D5).
      if (a.archived === true) return markDone(taid, `askwant ${id} already archived`);

      const sheirut = a.sheirut?.data;
      if (!sheirut) return markDone(taid, `askwant ${id} has no service to join`);
      if (sheirut.attributes?.archived === true) {
        return markDone(taid, `askwant ${id}: sheirut ${sheirut.id} was archived`);
      }
      if (sheirut.attributes?.isApruved !== true) {
        // The rikma has not published this service yet. Joining something that
        // does not officially exist would put a customer on an unapproved
        // offer; the request keeps standing, the clock ends.
        return markDone(taid, `askwant ${id}: sheirut ${sheirut.id} is not approved`);
      }

      const askerId = normId(a.users_permissions_user);
      if (!askerId) return markDone(taid, `askwant ${id} has no requester`);

      const memberIds = (a.project?.data?.attributes?.user_1s?.data ?? []).map((u) => String(u.id));
      const vots = (a.vots ?? []).map((v) => ({
        what: v?.what === true,
        order: Number(v?.order ?? 0),
        users_permissions_user: normId(v?.users_permissions_user)
      }));
      const gate = sheirutGate({ vots, memberIds, proposerId: askerId });

      if (gate.hasNo) {
        return markDone(taid, `askwant ${id} has an objection`);
      }
      if (!gate.hasPMyes) {
        // D2. The whole point: an outsider joining is the rikma's decision, and
        // nobody made it. The request is not refused — it just cannot mature on
        // silence, so the clock ends here.
        return markDone(taid, `askwant ${id}: no rikma member approved — not matured (D2)`);
      }

      const { wantId, created } = await approveAskwant(
        strapi,
        {},
        { askwantId: String(id), sheirutId: String(sheirut.id), userId: askerId }
      );

      console.log('[timegrama/askwant] service request matured on silence', {
        askwantId: id,
        sheirutId: sheirut.id,
        userId: askerId,
        wantId,
        created
      });
      await markDone(taid, `askwant ${id} matured on silence`);
    } catch (e) {
      // Deliberately left open: this is the write that subscribes a person to a
      // service the rikma agreed to serve. Retried next run — with no attempt
      // ceiling until PLAN_TIMEGRAMA phase 5 adds one.
      console.error(`[timegrama/askwant] maturation failed for ${id}, will retry:`, e);
    }
  }
</script>
