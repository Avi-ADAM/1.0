<script module>
  import { SendTo } from '$lib/send/sendTo.svelte';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';

  // Silence-as-consent maturation for a saleClaim Decision
  // (PLAN_sale_holder_consent — phase 3). When a saleClaim timegrama fires and
  // the claim is still open, the version currently on the table (the last
  // negom precision round, or the original sale values for round 1) is
  // auto-approved: applied to the Sale, stamped confirmedBy:timeout, inventory
  // reconciled if the quantity changed, and the Decision archived.
  //
  // A counter-proposal resets the clock by closing the old timegrama and
  // opening a new one, so a fired-but-not-done timegrama always refers to the
  // still-standing version.
  export async function Decision(id, taid) {
    async function markDone() {
      try {
        await SendTo(
          `mutation { updateTimegrama(id: ${taid}, data: { done: true }) { data { id } } }`,
          ADMINMONTHER
        );
      } catch (e) {
        console.error('[timegrama/decision] markDone failed:', e);
      }
    }

    try {
      const q = `{
        decision(id: ${id}) { data { id attributes {
          kind archived
          negom { hm price kindOf sqadualed sqadualedf }
          sale { data { id attributes {
            in unit date startDate finishDate
            matanot { data { id attributes { quant } } }
          } } }
        } } }
      }`;
      const res = await SendTo(q, ADMINMONTHER);
      const d = res?.data?.decision?.data;
      if (!d) {
        console.warn(`[timegrama/decision] decision ${id} not found`);
        return markDone();
      }
      const a = d.attributes || {};

      // Only saleClaim decisions mature on silence; other kinds close the tg.
      if (a.kind !== 'saleClaim') return markDone();
      if (a.archived) return markDone();

      const sale = a.sale?.data;
      if (!sale) return markDone();
      const sa = sale.attributes || {};
      const negom = a.negom || [];
      const last = negom.length > 0 ? negom[negom.length - 1] : null;

      // Resolve the standing version.
      const num = (x) => (x == null ? null : Number(x));
      let unit, total, startDate, finishDate;
      if (last) {
        unit = num(last.hm);
        const price = num(last.price);
        total = unit != null && price != null ? unit * price : num(sa.in);
        startDate = last.sqadualed ?? sa.startDate ?? null;
        finishDate = last.sqadualedf ?? sa.finishDate ?? null;
      } else {
        unit = num(sa.unit);
        total = num(sa.in);
        startDate = sa.startDate ?? null;
        finishDate = sa.finishDate ?? null;
      }

      const now = new Date().toISOString();
      const parts = [];
      if (total != null) parts.push(`in: ${total}`);
      if (unit != null) parts.push(`unit: ${unit}`);
      if (startDate) parts.push(`startDate: "${startDate}"`);
      if (finishDate) parts.push(`finishDate: "${finishDate}"`);
      parts.push('holderStatus: confirmed');
      parts.push('confirmedBy: timeout');
      parts.push(`holderDecidedAt: "${now}"`);

      await SendTo(
        `mutation { updateSale(id: ${sale.id}, data: { ${parts.join(', ')} }) { data { id } } }`,
        ADMINMONTHER
      );

      // Reconcile inventory if the matured quantity differs from what was reserved.
      const matanot = sa.matanot?.data;
      const oldUnit = num(sa.unit);
      const curQuant = num(matanot?.attributes?.quant);
      if (matanot?.id && unit != null && oldUnit != null && curQuant != null && curQuant !== -1 && unit !== oldUnit) {
        const adjusted = curQuant + (oldUnit - unit);
        try {
          await SendTo(
            `mutation { updateMatanot(id: ${matanot.id}, data: { quant: ${adjusted} }) { data { id } } }`,
            ADMINMONTHER
          );
        } catch (e) {
          console.error('[timegrama/decision] inventory delta failed:', e);
        }
      }

      // Archive the Decision.
      await SendTo(
        `mutation { updateDecision(id: ${id}, data: { archived: true }) { data { id } } }`,
        ADMINMONTHER
      );

      await markDone();
    } catch (e) {
      console.error('[timegrama/decision] maturation failed:', e);
    }
  }
</script>
