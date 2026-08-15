<script module>
  /**
   * "Did the stipend arrive?" — silence-as-consent (PLAN_STIPEND §6).
   *
   * The funder marked a cycle as sent and the recipient said nothing for the
   * rikma's restime. Same rule as a sale claim: the version on the table is
   * approved. Here that means the payment becomes `confirmed`, which is the
   * single event that lets its equityCredit / equityDebit count.
   *
   * "I received nothing" is never expressed by silence — it is an explicit
   * counter of amount 0 through confirmStipendPayment, which closes the clock
   * before this ever runs.
   */
  import { SendToAdmin } from '$lib/server/sendToAdmin.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';

  export async function StipendPayment(id, taid) {
    async function markDone() {
      try {
        await SendToAdmin(
          `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
          ADMINMONTHER
        );
      } catch (e) {
        console.error('[timegrama/stipendPayment] markDone failed:', e);
      }
    }

    try {
      const res = await SendToAdmin(
        `{ stipendPayment(id: ${id}) { data { id attributes {
          status amount
          haluka { data { id } }
        } } } }`,
        ADMINMONTHER
      );
      const payment = res?.data?.stipendPayment?.data;
      if (!payment) {
        console.warn(`[timegrama/stipendPayment] payment ${id} not found`);
        return markDone();
      }
      const a = payment.attributes || {};
      // Already answered — explicitly confirmed, or closed at zero.
      if (a.status !== 'sent') return markDone();

      const now = new Date().toISOString();
      await SendToAdmin(
        `mutation { updateStipendPayment(id: ${id}, data: {
          status: confirmed, confirmedBy: silence, confirmedAt: "${now}"
        }) { data { id } } }`,
        ADMINMONTHER
      );

      const halukaId = a.haluka?.data?.id;
      if (halukaId) {
        await SendToAdmin(
          `mutation { updateHaluka(id: ${halukaId}, data: { confirmed: true }) { data { id } } }`,
          ADMINMONTHER
        ).catch((e) =>
          console.warn('[timegrama/stipendPayment] haluka confirmation failed (non-fatal):', e)
        );
      }

      console.log('[timegrama/stipendPayment] confirmed on silence', { paymentId: id });
      await markDone();
    } catch (e) {
      console.error('[timegrama/stipendPayment] maturation failed:', e);
    }
  }
</script>
