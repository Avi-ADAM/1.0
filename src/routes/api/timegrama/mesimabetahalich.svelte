<script module>
  /**
   * Dormancy clock handler (PLAN_OBJECT_ARCHIVAL — phase 3ג׳).
   *
   * Fired by the hourly cron when a mission has gone `dormancyDays` without a
   * single piece of activity. It opens the standard release proposal rather
   * than cancelling the assignment outright, so the cancellation still happens
   * on its own (silence matures it) while the assignee keeps a restime to say
   * "I'm on it".
   */
  import { SendToAdmin } from '$lib/server/sendToAdmin.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { env } from '$env/dynamic/private';
  import { execFromAdmin } from '$lib/server/archive/exec.js';
  import { openDormancyProposal } from '$lib/server/archive/dormancyClock.js';
  import { tellMatured } from '$lib/server/notifications/matured';
  import { dormancyOpened } from '$lib/server/notifications/maturedNotices';

  export async function Dormancy(id, taid, fetch) {
    const exec = execFromAdmin(SendToAdmin, env.ADMINMONTHER);

    try {
      const outcome = await openDormancyProposal(exec, String(id));
      console.log('[timegrama/dormancy] mission', id, outcome);
      // A release proposal opened that waits on the assignee and the rikma (N5).
      if (outcome.opened) {
        await tellMatured(
          dormancyOpened({
            projectId: outcome.projectId,
            decisionId: outcome.decisionId,
            name: outcome.missionName ?? '',
            ownerId: outcome.ownerId
          }),
          fetch
        );
      }
      // "active-after-all" re-armed its own clock inside openDormancyProposal,
      // so closing this firing is right in every branch.
    } catch (e) {
      console.error('[timegrama/dormancy] failed:', e);
    }

    try {
      await SendToAdmin(
        `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
        env.ADMINMONTHER
      );
    } catch (e) {
      console.error('[timegrama/dormancy] markDone failed:', e);
    }
  }
</script>
