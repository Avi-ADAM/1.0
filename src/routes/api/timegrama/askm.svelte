<script module>
  // Auto-approval of a resource-share candidacy (Askm) once its timegrama
  // deadline passes — the resource-side mirror of ask.svelte. This finalizer was
  // missing entirely: +server.js fetched whatami:"askm" timegramas but x() had
  // no branch for them, so resource auto-approval never ran.
  //
  // The decision is the shared bilateral gate (negoGate): approve only when the
  // latest round is agreed by both a rikma member and the taker, with no
  // objection. Materialization reuses the tested runResourceAskmAcceptance.
  import { StrapiClient } from '$lib/server/actions/StrapiClient';
  import { runResourceAskmAcceptance } from '$lib/server/actions/helpers/runResourceAskmAcceptance';
  import { computeNegoGate, normId } from '$lib/server/nego/negoGate';

  export async function Askm(id, taid) {
    console.log(id, taid, 'askm finalizer started');
    const strapi = new StrapiClient();

    try {
      const res = await strapi.execute('getAskmForFinalize', { id: String(id) });
      const askm = res?.data?.askm?.data;
      if (!askm) {
        console.warn(`askm finalizer: askm ${id} not found`);
        await strapi.execute('mrSetTimegramaDone', { id: String(taid), done: true }).catch(() => null);
        return;
      }
      const attrs = askm.attributes || {};

      // Already resolved → just close the timegrama.
      if (attrs.archived === true) {
        await strapi.execute('mrSetTimegramaDone', { id: String(taid), done: true }).catch(() => null);
        return;
      }

      const vots = (attrs.vots || []).map((v) => ({
        what: v.what,
        order: v.order,
        users_permissions_user: normId(v.users_permissions_user),
      }));
      const rounds = (attrs.nego_mashes?.data || []).map((r) => ({
        ordern: r.attributes?.ordern,
        proposedBy: r.attributes?.proposedBy,
      }));
      const takerId = normId(attrs.users_permissions_user);
      const memberIds = (attrs.project?.data?.attributes?.user_1s?.data || []).map((m) => String(m.id));
      const projectId = attrs.project?.data?.id;
      const openMashaabimId = attrs.open_mashaabim?.data?.id;
      const spId = attrs.sp?.data?.id;
      const name = attrs.open_mashaabim?.data?.attributes?.name ?? '';

      const gate = computeNegoGate({ rounds, vots, takerId, memberIds });
      if (!gate.approvable) {
        // Not agreed by both sides yet (e.g. a project counter awaiting the
        // candidate's consent, or a candidate counter awaiting a member's yes).
        // Don't materialize; close this timegrama — the resuming action
        // (acceptCounter / new member vote) creates a fresh one.
        console.log('askm finalizer: not approvable, closing', id, gate);
        await strapi.execute('mrSetTimegramaDone', { id: String(taid), done: true }).catch(() => null);
        return;
      }

      if (!openMashaabimId) {
        console.warn(`askm finalizer: askm ${id} has no open_mashaabim, skipping`);
        await strapi.execute('mrSetTimegramaDone', { id: String(taid), done: true }).catch(() => null);
        return;
      }

      const acceptCtx = { userId: takerId };

      // Apply latest round → archive OM → createMaap → recurring engine →
      // onboard new member. Archive the Askm ourselves (below) so no synthetic
      // admin vote is appended.
      await runResourceAskmAcceptance(strapi, acceptCtx, {
        askmId: String(id),
        openMashaabimId: String(openMashaabimId),
        projectId: String(projectId),
        spId: String(spId ?? ''),
        missionName: name,
        acceptedUserId: String(takerId),
        existingMemberIds: memberIds,
        existingVotes: vots,
        skipAskmArchive: true,
      });

      await strapi.execute('132archiveAskmWithVotes', {
        id: String(id),
        vots: vots.map((v) => ({ what: v.what ?? true, users_permissions_user: v.users_permissions_user })),
      });

      // Sibling candidates' askms on the same (now archived) resource are
      // archived inside runResourceAskmAcceptance (shared with the direct
      // member-approve path), so no separate sibling loop is needed here.

      await strapi.execute('mrSetTimegramaDone', { id: String(taid), done: true }).catch(() => null);
      console.log('askm finalizer: approved', id);
    } catch (e) {
      console.error('askm finalizer error', e);
    }
  }
</script>
