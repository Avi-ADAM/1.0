<script module>
  import { executeAction } from '$lib/client/actionClient';

  /**
   * Open the conversation a footer chat starts on: a money transfer's
   * (`ensureHalukaForum` — its sender or receiver only) or a mission's
   * (`ensureMissionForum` — a member of its rikma). Through the actions, not
   * /api/send, so who may open which conversation is checked on the server
   * (docs/inprogress/PLAN_REALTIME_MIGRATION.md B9).
   *
   * @returns {Promise<string | 'error'>} the new forum's id
   */
  export async function createForum(pid = 0, mbId = 0, halukId = null) {
    const res =
      halukId !== null && halukId !== undefined
        ? await executeAction('ensureHalukaForum', { halukaId: String(halukId), projectId: String(pid) })
        : await executeAction('ensureMissionForum', { missionId: String(mbId), projectId: String(pid) });
    const forumId = res?.success ? res.data?.forumId : null;
    if (!forumId) {
      console.error('[createForum]', res?.error ?? res);
      return 'error';
    }
    return String(forumId);
  }
</script>
