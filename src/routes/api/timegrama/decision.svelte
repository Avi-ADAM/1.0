<script module>
  import { SendToAdmin } from '$lib/server/sendToAdmin.js';
  // Server-only secret — this module is imported only by timegrama/+server.js.
  import { ADMINMONTHER } from '$env/static/private';

  // GraphQL string-literal escaping for values interpolated into an inline
  // (non-parameterized) query — SendToAdmin takes a raw query string, no
  // separate variables map, so every free-text field must be hand-escaped.
  function gqlStr(s) {
    return JSON.stringify(String(s ?? ''));
  }

  // Silence-as-consent maturation for the rest of the Decision kinds (pic,
  // name, pubdes, prides, newFlink, newWlink, timtoM, vallueadd/les — the
  // same kinds voteOnDecision.ts applies on full-member consensus). Here the
  // bar is lower: if at least one member approved and nobody explicitly
  // voted no, restime silence from the rest counts as consent. Mirrors the
  // consensus branch of src/lib/server/actions/configs/voteOnDecision.ts so
  // a timed-out approval has the same effect as an explicit unanimous vote.
  async function applyDecisionKind(decisionId, a) {
    const projectId = a.projects?.data?.[0]?.id;
    if (!projectId) {
      console.warn(`[timegrama/decision] decision ${decisionId} has no linked project`);
    } else if (a.kind === 'pic') {
      const picId = a.newpic?.data?.id;
      if (picId) {
        await SendToAdmin(
          `mutation { updateProject(id: ${projectId}, data: { profilePic: ${picId} }) { data { id } } }`,
          ADMINMONTHER
        );
      }
    } else if (a.kind === 'name' && a.newname) {
      await SendToAdmin(
        `mutation { updateProject(id: ${projectId}, data: { projectName: ${gqlStr(a.newname)} }) { data { id } } }`,
        ADMINMONTHER
      );
    } else if (a.kind === 'pubdes') {
      await SendToAdmin(
        `mutation { updateProject(id: ${projectId}, data: { publicDescription: ${gqlStr(a.newpubdes)} }) { data { id } } }`,
        ADMINMONTHER
      );
    } else if (a.kind === 'prides') {
      await SendToAdmin(
        `mutation { updateProject(id: ${projectId}, data: { descripFor: ${gqlStr(a.newprides)} }) { data { id } } }`,
        ADMINMONTHER
      );
    } else if (a.kind === 'newFlink') {
      await SendToAdmin(
        `mutation { updateProject(id: ${projectId}, data: { fblink: ${gqlStr(a.newFlink)} }) { data { id } } }`,
        ADMINMONTHER
      );
    } else if (a.kind === 'newWlink') {
      await SendToAdmin(
        `mutation { updateProject(id: ${projectId}, data: { linkToWebsite: ${gqlStr(a.newWlink)} }) { data { id } } }`,
        ADMINMONTHER
      );
    } else if (a.kind === 'timtoM' && a.timtoM) {
      // restime is an ENUM_PROJECT_RESTIME — must stay an unquoted literal.
      await SendToAdmin(
        `mutation { updateProject(id: ${projectId}, data: { restime: ${a.timtoM} }) { data { id } } }`,
        ADMINMONTHER
      );
    } else if (a.kind === 'vallueadd' || a.kind === 'vallueles') {
      const projRes = await SendToAdmin(
        `{ project(id: ${projectId}) { data { attributes { vallues { data { id } } } } } }`,
        ADMINMONTHER
      );
      const currentIds = (projRes?.data?.project?.data?.attributes?.vallues?.data ?? []).map((v) =>
        String(v.id)
      );
      let newIds;
      if (a.kind === 'vallueadd') {
        const toAdd = (a.valluesadd?.data ?? []).map((v) => String(v.id));
        newIds = Array.from(new Set([...currentIds, ...toAdd]));
      } else {
        const toRemove = new Set((a.valluesles?.data ?? []).map((v) => String(v.id)));
        newIds = currentIds.filter((vid) => !toRemove.has(vid));
      }
      await SendToAdmin(
        `mutation { updateProject(id: ${projectId}, data: { vallues: [${newIds
          .map((vid) => `"${vid}"`)
          .join(', ')}] }) { data { id } } }`,
        ADMINMONTHER
      );
    }

    await SendToAdmin(
      `mutation { updateDecision(id: ${decisionId}, data: { archived: true }) { data { id } } }`,
      ADMINMONTHER
    );
  }

  export async function Decision(id, taid) {
    async function markDone() {
      try {
        await SendToAdmin(
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
          projects { data { id } }
          vots { what ide order }
          newpic { data { id } }
          newname
          newpubdes
          newprides
          newFlink
          newWlink
          timtoM
          valluesadd { data { id } }
          valluesles { data { id } }
        } } }
      }`;
      const res = await SendToAdmin(q, ADMINMONTHER);
      const d = res?.data?.decision?.data;
      if (!d) {
        console.warn(`[timegrama/decision] decision ${id} not found`);
        return markDone();
      }
      const a = d.attributes || {};
      if (a.archived) return markDone();

      // Non-saleClaim kinds mature the same way sheirutpends/pmash decisions
      // do elsewhere: an explicit "ok" with no explicit "no" is enough — the
      // rest of the rikma is treated as silently consenting once restime runs
      // out. A "no" vote (or nobody voting at all) closes the timegrama
      // without applying anything, same as before.
      if (a.kind !== 'saleClaim') {
        const vots = a.vots || [];
        const hasOk = vots.some((v) => v.what === true);
        const hasNo = vots.some((v) => v.what === false);
        if (hasOk && !hasNo) {
          await applyDecisionKind(id, a);
        }
        return markDone();
      }

      // saleClaim maturation (PLAN_sale_holder_consent — phase 3). When the
      // claim is still open at restime expiry, the version currently on the
      // table (the last negom precision round, or the original sale values
      // for round 1) is auto-approved: applied to the Sale, stamped
      // confirmedBy:timeout, inventory reconciled if the quantity changed,
      // and the Decision archived.
      //
      // A counter-proposal resets the clock by closing the old timegrama and
      // opening a new one, so a fired-but-not-done timegrama always refers to
      // the still-standing version.
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

      await SendToAdmin(
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
          await SendToAdmin(
            `mutation { updateMatanot(id: ${matanot.id}, data: { quant: ${adjusted} }) { data { id } } }`,
            ADMINMONTHER
          );
        } catch (e) {
          console.error('[timegrama/decision] inventory delta failed:', e);
        }
      }

      // Archive the Decision.
      await SendToAdmin(
        `mutation { updateDecision(id: ${id}, data: { archived: true }) { data { id } } }`,
        ADMINMONTHER
      );

      await markDone();
    } catch (e) {
      console.error('[timegrama/decision] maturation failed:', e);
    }
  }
</script>
