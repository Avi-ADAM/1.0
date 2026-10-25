/**
 * What the profile reads from qid 276 (`myOfferingsViaUser`): products the
 * member's rikmas sell, missions they offer or are doing, missions finished,
 * and acts still open in the missions they are doing — the counts, and the
 * items themselves for the circles that list them.
 *
 * Everything is read nested under the user so it rides the user find
 * permission. An act is open the way `/myacts` reads it: not marked done
 * (`naasa`) and not at 100% progress.
 */

/** @param {any} act */
const isOpenAct = (act) => !act?.attributes?.naasa && (act?.attributes?.status ?? 0) < 100;

/**
 * @typedef {{ id: string, name: string, projectId: string | null }} OfferingItem
 * @typedef {{
 *   products: number, missions: number, done: number, acts: number,
 *   doing: OfferingItem[], offers: OfferingItem[],
 *   openActs: OfferingItem[], productList: OfferingItem[]
 * }} Offerings
 */

/**
 * @param {any} attributes `usersPermissionsUser.data.attributes` from qid 276
 * @returns {Offerings}
 */
export function readOfferings(attributes) {
  const a = attributes ?? {};
  const doingNodes = a.mesimabetahaliches?.data ?? [];

  /** @type {OfferingItem[]} */
  const doing = doingNodes.map((m) => ({
    id: String(m.id),
    name: m?.attributes?.name ?? '',
    projectId: m?.attributes?.project?.data?.id ? String(m.attributes.project.data.id) : null
  }));
  /** @type {OfferingItem[]} */
  const offers = (a.mission_offers?.data ?? []).map((o) => ({
    id: String(o.id),
    name: o?.attributes?.name ?? '',
    projectId: null
  }));
  /** @type {OfferingItem[]} */
  const openActs = doingNodes.flatMap((m, i) =>
    (m?.attributes?.acts?.data ?? []).filter(isOpenAct).map((act) => ({
      id: String(act.id),
      name: act?.attributes?.shem ?? '',
      projectId: doing[i].projectId
    }))
  );
  /** @type {OfferingItem[]} */
  const productList = (a.projects_1s?.data ?? []).flatMap((p) =>
    (p?.attributes?.matanotofs?.data ?? []).map((prod) => ({
      id: String(prod.id),
      name: prod?.attributes?.name ?? '',
      projectId: p?.id ? String(p.id) : null
    }))
  );

  return {
    products: productList.length,
    missions: offers.length + doing.length,
    done: a.finnished_missions?.data?.length ?? 0,
    acts: openActs.length,
    doing,
    offers,
    openActs,
    productList
  };
}
