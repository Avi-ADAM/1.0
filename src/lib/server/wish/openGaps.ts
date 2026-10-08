/**
 * Closing a wish with parts nobody took — the parts go on in the rikma (QA C-19).
 *
 * `materializeWish` opens the rikma and the deal with the parts that have a provider.
 * When the customer chooses to, each part still open (`$lib/wish/gaps`) continues there:
 *
 *   1. a spec (project-less pendm / pmash, like any wish slot) and an **unassigned line**
 *      of the deal's product on it — so the part belongs to *this* deal, and whoever
 *      takes it is co-signed by its customer (`$lib/server/deal/offerDeal`);
 *   2. an open mission / open resource in the rikma on that spec. A need the customer
 *      had already published to the community is **moved** into the rikma (its
 *      candidates and its place in the feed come with it) instead of a second one
 *      being opened; otherwise a new one is opened and matched to the community.
 *
 * Terms: what the published need said, else the plan's estimate (hours / quantity) at
 * no price yet — the price is what the candidacy settles, and the customer signs it.
 *
 * Best-effort per part: the rikma and the deal already exist, so a part that fails is
 * counted and logged, and the rest still open.
 */

import { wishGaps, type WishGap } from '$lib/wish/gaps.js';
import { matchOpenMissionToUsers, matchOpenMashaabimToUsers } from '$lib/server/matching/engine';

type Strapi = { execute: (qid: string, vars: any, jwt?: string, fetch?: any) => Promise<any> };
type Ctx = { jwt: string; fetch: any; lang?: string };

export interface OpenGapsArgs {
  ratsonId: string;
  ratAttrs: any;
  proposals: any[];
  recipeMissions: any[];
  recipeResources: any[];
  matanotId: string;
  weaveId: string;
}

export interface OpenGapsResult {
  /** New open missions / resources opened in the rikma. */
  opened: number;
  /** Needs already published to the community, moved into the rikma. */
  moved: number;
  failed: number;
  gaps: WishGap[];
}

const norm = (s: unknown) => String(s ?? '').trim().toLowerCase();
const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function idOf(res: any, path: string[]): string | null {
  let cur = res?.data;
  for (const p of path) cur = cur?.[p];
  return cur?.data?.id != null ? String(cur.data.id) : null;
}

function assertOk(res: any, what: string) {
  if (!res || res.errors?.length) throw new Error(`${what}: ${JSON.stringify(res?.errors ?? 'no answer').slice(0, 300)}`);
}

export async function openWishGaps(strapi: Strapi, context: Ctx, args: OpenGapsArgs): Promise<OpenGapsResult> {
  const gaps = wishGaps({
    extractedMissions: args.ratAttrs?.extracted_missions,
    extractedResources: args.ratAttrs?.extracted_resources,
    proposals: args.proposals,
    recipeMissions: args.recipeMissions,
    recipeResources: args.recipeResources
  });
  const out: OpenGapsResult = { opened: 0, moved: 0, failed: 0, gaps };
  if (gaps.length === 0) return out;

  const x = (qid: string, vars: Record<string, unknown>) => strapi.execute(qid, vars, context.jwt, context.fetch);
  const now = new Date().toISOString();

  let publishedMissions: any[] = [];
  let publishedResources: any[] = [];
  try {
    const pub = await x('416wishPublishedNeeds', { ratson: String(args.ratsonId) });
    publishedMissions = pub?.data?.openMissions?.data ?? [];
    publishedResources = pub?.data?.openMashaabims?.data ?? [];
  } catch (err) {
    console.warn('[openWishGaps] could not read the published needs; opening new ones:', err);
  }
  const used = new Set<string>();
  const findPublished = (list: any[], gap: WishGap) =>
    list.find((n) => !used.has(String(n.id)) && gap.key && String(n.attributes?.extractedKey ?? '') === gap.key) ??
    list.find((n) => !used.has(String(n.id)) && norm(n.attributes?.name) === norm(gap.name));

  for (const gap of gaps) {
    try {
      if (gap.kind === 'mission') {
        const pub = findPublished(publishedMissions, gap);
        if (pub) used.add(String(pub.id));
        const hours = num(pub?.attributes?.noofhours) || gap.amount;
        const rate = num(pub?.attributes?.perhour);

        const pendmRes = await x('137createPendmForRecipe', { name: gap.name, perhour: rate, noofhours: hours, descrip: gap.notes, publishedAt: now });
        const pendmId = idOf(pendmRes, ['createPendm']);
        if (!pendmId) throw new Error('mission spec not created');
        const lineRes = await x('125createMatanotRecipeMission', {
          matanot: args.matanotId,
          pendm: pendmId,
          hoursPerUnit: hours,
          unitsPerProduct: 1,
          ratePerHour: rate,
          mode: 'createNew',
          notes: gap.name,
          publishedAt: now
        });
        if (!idOf(lineRes, ['createMatanotRecipeMission'])) throw new Error('BOM line not created');

        if (pub) {
          assertOk(await x('negoUpdateOpenMission', { id: String(pub.id), data: { project: args.weaveId, pendm: pendmId } }), 'moving the published mission');
          out.moved++;
        } else {
          const omRes = await x('169crWishOpenMission', {
            name: gap.name,
            descrip: gap.notes,
            hearotMeyuchadot: '',
            noofhours: hours,
            perhour: rate,
            isMust: gap.isMust,
            ratson: String(args.ratsonId),
            pendm: pendmId,
            skills: [],
            tafkidims: [],
            work_ways: [],
            source: 'concierge',
            sqadualed: args.ratAttrs?.startDate ?? null,
            publishedAt: now
          });
          const omId = idOf(omRes, ['createOpenMission']);
          if (!omId) throw new Error('open mission not created');
          assertOk(
            await x('negoUpdateOpenMission', { id: omId, data: { project: args.weaveId, ...(gap.key ? { extractedKey: gap.key } : {}) } }),
            'placing the open mission in the rikma'
          );
          await matchOpenMissionToUsers(omId, 'missionCreated', { strapi, fetch: context.fetch, lang: context.lang }).catch(() => null);
          out.opened++;
        }
      } else {
        const pub = findPublished(publishedResources, gap);
        if (pub) used.add(String(pub.id));
        const qty = num(pub?.attributes?.hm) || gap.amount || 1;
        const unit = num(pub?.attributes?.price);

        const pmashRes = await x('138createPmashForRecipe', { name: gap.name, price: unit, easy: unit, hm: qty, descrip: gap.notes, publishedAt: now });
        const pmashId = idOf(pmashRes, ['createPmash']);
        if (!pmashId) throw new Error('resource spec not created');
        const lineRes = await x('128createMatanotRecipeResource', {
          matanot: args.matanotId,
          pmash: pmashId,
          quantityPerUnit: qty,
          pricePerUnit: unit,
          mode: 'createNew',
          notes: gap.name,
          publishedAt: now
        });
        if (!idOf(lineRes, ['createMatanotRecipeResource'])) throw new Error('BOM line not created');

        if (pub) {
          assertOk(await x('applyRoundToOpenMashaabim', { id: String(pub.id), data: { project: args.weaveId, pmash: pmashId } }), 'moving the published resource');
          out.moved++;
        } else {
          const omRes = await x('170crWishOpenMashaabim', {
            name: gap.name,
            descrip: gap.notes,
            spnot: '',
            price: unit,
            easy: unit,
            hm: qty,
            kindOf: 'total',
            isMust: gap.isMust,
            ratson: String(args.ratsonId),
            pmash: pmashId,
            source: 'concierge',
            linkto: '',
            recurring: false,
            sqadualed: args.ratAttrs?.startDate ?? null,
            sqadualedf: args.ratAttrs?.finnishDate ?? null,
            publishedAt: now
          });
          const omId = idOf(omRes, ['createOpenMashaabim']);
          if (!omId) throw new Error('open resource not created');
          assertOk(
            await x('applyRoundToOpenMashaabim', { id: omId, data: { project: args.weaveId, ...(gap.key ? { extractedKey: gap.key } : {}) } }),
            'placing the open resource in the rikma'
          );
          await matchOpenMashaabimToUsers(omId, 'resourceCreated', { strapi, fetch: context.fetch, lang: context.lang }).catch(() => null);
          out.opened++;
        }
      }
    } catch (err) {
      out.failed++;
      console.error(`[openWishGaps] the part "${gap.name}" was not opened in the rikma:`, err);
    }
  }
  return out;
}
