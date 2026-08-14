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
  import { ADMINMONTHER } from '$env/static/private';
  import { execFromAdmin } from '$lib/server/archive/exec.js';
  import { openDormancyProposal } from '$lib/server/archive/dormancyClock.js';

  export async function Dormancy(id, taid) {
    const exec = execFromAdmin(SendToAdmin, ADMINMONTHER);

    try {
      const outcome = await openDormancyProposal(exec, String(id));
      console.log('[timegrama/dormancy] mission', id, outcome);
      // "active-after-all" re-armed its own clock inside openDormancyProposal,
      // so closing this firing is right in every branch.
    } catch (e) {
      console.error('[timegrama/dormancy] failed:', e);
    }

    try {
      await SendToAdmin(
        `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
        ADMINMONTHER
      );
    } catch (e) {
      console.error('[timegrama/dormancy] markDone failed:', e);
    }
  }
</script>
