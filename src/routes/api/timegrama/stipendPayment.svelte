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
  import { serverNotifier } from '$lib/server/actions/index.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { env } from '$env/dynamic/private';

  /**
   * Tell both sides that the clock did it.
   *
   * Silence maturation moved two people's percentages and told neither — the
   * explicit `confirmStipendPayment` notifies, this path did not, so the one
   * event that happens *without* anybody pressing anything was also the one
   * nobody heard about (docs/inprogress/FIXES.md §8). It goes through the same
   * orchestrator as every action (`personal`: socket, push, telegram, and email
   * to whoever has neither) — the hand-rolled /api/nutiUser path is gone (N7).
   * `fetch` is SvelteKit's, so the email relay call is stamped as internal.
   */
  async function announce(fetch, uid, projectId, title, body) {
    if (!fetch || !uid) return;
    try {
      await serverNotifier.notify(
        {
          recipients: { type: 'specificUsers', config: { userIdsParam: 'recipientIds' } },
          templates: { title, body },
          intent: 'personal',
          metadata: {
            priority: 'normal',
            type: 'stipendPayment',
            url: projectId ? `/moach/${projectId}/stipend` : '/lev'
          }
        },
        {},
        { recipientIds: [String(uid)] },
        { userId: '', jwt: '', lang: 'he', fetch }
      );
    } catch (e) {
      console.warn('[timegrama/stipendPayment] notification failed (non-fatal):', e);
    }
  }

  export async function StipendPayment(id, taid, fetch) {
    async function markDone() {
      try {
        await SendToAdmin(
          `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
          env.ADMINMONTHER
        );
      } catch (e) {
        console.error('[timegrama/stipendPayment] markDone failed:', e);
      }
    }

    try {
      const res = await SendToAdmin(
        `{ stipendPayment(id: ${id}) { data { id attributes {
          status amount hours stipendRate mode equityCredit equityDebit
          haluka { data { id } }
          funder { data { id } }
          recipient { data { id } }
          project { data { id attributes { projectName } } }
        } } } }`,
        env.ADMINMONTHER
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
        env.ADMINMONTHER
      );

      const halukaId = a.haluka?.data?.id;
      if (halukaId) {
        await SendToAdmin(
          `mutation { updateHaluka(id: ${halukaId}, data: { confirmed: true }) { data { id } } }`,
          env.ADMINMONTHER
        ).catch((e) =>
          console.warn('[timegrama/stipendPayment] haluka confirmation failed (non-fatal):', e)
        );
      }

      const projectId = a.project?.data?.id;
      const projectName = a.project?.data?.attributes?.projectName ?? '';
      const amount = Number(a.amount ?? 0);
      const moved = a.mode === 'equity' && Number(a.equityCredit ?? 0) > 0;
      const tail = {
        he: moved ? ' האחוזים עודכנו בהתאם.' : '',
        en: moved ? ' The shares moved accordingly.' : ''
      };
      await Promise.all([
        announce(
          fetch,
          a.recipient?.data?.id,
          projectId,
          { he: 'המלגה אושרה מעצמה', en: 'Your stipend was confirmed automatically' },
          {
            he: `לא הגיבו בזמן התגובה של ${projectName}, ולכן ₪${amount} נרשמו כהתקבלו.${tail.he} אם לא הגיע כסף — אפשר לומר את זה בקלף המלגה ולפתוח את המחזור מחדש.`,
            en: `Nobody answered within ${projectName}'s response time, so ${amount} is recorded as received.${tail.en} If no money actually arrived, say so on the stipend card and the cycle reopens.`
          }
        ),
        announce(
          fetch,
          a.funder?.data?.id,
          projectId,
          { he: 'המלגה נרשמה כהתקבלה', en: 'Your stipend is recorded as received' },
          {
            he: `לא התקבלה תגובה בזמן, ולכן ₪${amount} ב${projectName} נסגרו כהתקבלו.${tail.he}`,
            en: `No answer came in time, so ${amount} in ${projectName} closed as received.${tail.en}`
          }
        )
      ]);

      console.log('[timegrama/stipendPayment] confirmed on silence', { paymentId: id });
      await markDone();
    } catch (e) {
      console.error('[timegrama/stipendPayment] maturation failed:', e);
    }
  }
</script>
