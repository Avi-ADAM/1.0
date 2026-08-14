<script module>
  /**
   * Scheduled end-of-cycle archive (PLAN_OBJECT_ARCHIVAL — phase 3ב׳).
   *
   * A recurring resource or a product with live subscriptions is never cut
   * mid-cycle: the matured decision writes `archiveEffectiveFrom` and leaves
   * the object running. This is what actually closes it on that date — without
   * it the date would be a promise nothing keeps.
   */
  import { SendToAdmin } from '$lib/server/sendToAdmin.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';

  const MUTATION = {
    mashabetahalich: 'updateMashabetahalich',
    matanot: 'updateMatanot'
  };

  export async function ArchiveEffective(id, taid, whatami) {
    const mutation = MUTATION[whatami];

    try {
      if (!mutation) {
        console.warn(`[timegrama/archiveEffective] no mutation for "${whatami}"`);
      } else {
        // Re-read rather than trusting the schedule: during the cycle the rikma
        // may have countered with `keep`, which returns the object to active.
        const q = `{ ${whatami}(id: ${id}) { data { id attributes {
          lifecycle archiveEffectiveFrom
        } } } }`;
        const res = await SendToAdmin(q, ADMINMONTHER);
        const a = res?.data?.[whatami]?.data?.attributes;

        if (!a) {
          console.warn(`[timegrama/archiveEffective] ${whatami} ${id} not found`);
        } else if (a.lifecycle === 'active' || a.lifecycle == null) {
          // The removal was called off while the cycle ran out.
          console.log(`[timegrama/archiveEffective] ${whatami} ${id} is active again — skipping`);
        } else if (a.lifecycle === 'archived') {
          console.log(`[timegrama/archiveEffective] ${whatami} ${id} already archived`);
        } else {
          await SendToAdmin(
            `mutation { ${mutation}(id: ${id}, data: { lifecycle: archived }) { data { id } } }`,
            ADMINMONTHER
          );
          console.log(`[timegrama/archiveEffective] ${whatami} ${id} archived at end of cycle`);
        }
      }
    } catch (e) {
      console.error('[timegrama/archiveEffective] failed:', e);
    }

    try {
      await SendToAdmin(
        `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
        ADMINMONTHER
      );
    } catch (e) {
      console.error('[timegrama/archiveEffective] markDone failed:', e);
    }
  }
</script>
