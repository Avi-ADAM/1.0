/**
 * Which deal an open offer belongs to, and who pays for it (QA_CONCIERGE_E2E C-19).
 *
 * A rikma made for a customer's wish sells one product to one customer. When the wish
 * was closed with parts nobody had taken yet, those parts were opened in the rikma as
 * ordinary open missions / open resources — and each one is an **unassigned BOM line**
 * of the product (`materializeWish`). Whoever takes it, at whatever terms the candidacy
 * ends on, makes the deal cost more. The customer pays that, so she signs it: the
 * candidacy (Ask / Askm) is approvable only once the rikma, the candidate **and** every
 * customer of the deal have said yes to the standing round (`computeNegoGate.clientIds`).
 *
 * The link is product-scoped, never rikma-scoped:
 *
 *     offer → its spec (pendm / pmash) → the BOM line built on that spec → the product
 *           → the deals (sheiruts) sold of that product in this rikma → their customers
 *
 * so a rikma that one day sells several products to several customers needs no change
 * here: an offer is co-signed by the customers of *its* product's deals, and a deal
 * grows only by the lines of its own product. An offer that is not an unassigned line
 * of a sold product (every ordinary open mission) resolves to null — nothing changes.
 *
 * Pure readers + two small effects. The reads go through a qid runner, so the same code
 * serves an action (`strapi.execute` with the member's JWT) and the cron (admin client).
 */

export type OfferKind = 'mission' | 'resource';

/** Runs one qid and returns Strapi's `{ data, errors }` answer. */
export type QidRunner = (qid: string, vars: Record<string, unknown>) => Promise<any>;

export interface OfferDealSale {
  sheirutId: string;
  quant: number;
  total: number;
  clientIds: string[];
}

export interface OfferDeal {
  kind: OfferKind;
  offerId: string;
  offerName: string;
  projectId: string;
  /** The unassigned BOM line this offer fills. */
  lineId: string;
  matanotId: string;
  productName: string;
  /** The line's price as planned (hours × rate × units, or quantity × unit price). */
  plannedPrice: number;
  /** The offer's standing terms: hours / quantity, and rate / unit price. */
  offerAmount: number;
  offerUnitPrice: number;
  sales: OfferDealSale[];
  /** Every customer of every deal the line belongs to — each of them signs. */
  clientIds: string[];
}

const id = (n: any): string | null => (n?.data?.id != null ? String(n.data.id) : n?.id != null ? String(n.id) : null);
const num = (v: unknown, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/** Price of one product unit's worth of this line, as planned on the BOM. */
export function linePrice(kind: OfferKind, a: any): number {
  if (kind === 'mission') {
    return num(a?.hoursPerUnit) * num(a?.ratePerHour) * (num(a?.unitsPerProduct, 1) || 1);
  }
  return num(a?.quantityPerUnit, 1) * num(a?.pricePerUnit);
}

/**
 * Read an open mission / open mashaabim node (`{ id, attributes }`, selected with the
 * OFFER_DEAL_* fragment of qids.js) into the deal it fills — or null when it fills none.
 */
export function readOfferDeal(kind: OfferKind, node: any): OfferDeal | null {
  const a = node?.attributes;
  const offerId = node?.id != null ? String(node.id) : null;
  if (!a || !offerId) return null;

  // Before the wish is closed its published needs belong to no rikma: no deal yet.
  const projectId = id(a.project);
  if (!projectId) return null;

  const spec = kind === 'mission' ? a.pendm?.data : a.pmash?.data;
  const lines: any[] =
    (kind === 'mission'
      ? spec?.attributes?.matanot_recipe_missions?.data
      : spec?.attributes?.matanot_recipe_resources?.data) ?? [];

  for (const line of lines) {
    const la = line?.attributes ?? {};
    // A line someone already holds is not a gap any more.
    if (id(la.assignedMember)) continue;
    const product = la.matanot?.data;
    if (!product?.id) continue;

    const sales: OfferDealSale[] = (product.attributes?.sheiruts?.data ?? [])
      .filter((s: any) => s?.attributes?.archived !== true && id(s?.attributes?.project) === projectId)
      .map((s: any) => ({
        sheirutId: String(s.id),
        quant: num(s.attributes?.quant, 1) || 1,
        total: num(s.attributes?.total),
        clientIds: (s.attributes?.users_permissions_users?.data ?? []).map((u: any) => String(u.id))
      }));
    if (sales.length === 0) continue;

    return {
      kind,
      offerId,
      offerName: a.name ?? '',
      projectId,
      lineId: String(line.id),
      matanotId: String(product.id),
      productName: product.attributes?.name ?? '',
      plannedPrice: linePrice(kind, la),
      offerAmount: kind === 'mission' ? num(a.noofhours) : num(a.hm, 1) || 1,
      offerUnitPrice: kind === 'mission' ? num(a.perhour) : num(a.price),
      sales,
      clientIds: [...new Set(sales.flatMap((s) => s.clientIds))]
    };
  }
  return null;
}

/**
 * Strapi errors on these reads must not pass for "no customer": that would let a member's
 * approval register a part the customer pays for without her. An empty answer (a test
 * double, a deleted row) is just "nothing to sign".
 */
function unwrap(res: any, what: string) {
  if (res?.errors?.length) throw new Error(`Could not read the deal of ${what}: ${JSON.stringify(res.errors).slice(0, 300)}`);
  return res?.data ?? null;
}

export async function loadOfferDeal(run: QidRunner, kind: OfferKind, offerId: string): Promise<OfferDeal | null> {
  const qid = kind === 'mission' ? '410openMissionDeal' : '411openMashaabimDeal';
  const data = unwrap(await run(qid, { id: String(offerId) }), `${kind} ${offerId}`);
  const node = kind === 'mission' ? data?.openMission?.data : data?.openMashaabim?.data;
  return readOfferDeal(kind, node);
}

/** The deal behind a candidacy: Ask → its open mission, Askm → its open mashaabim. */
export async function loadCandidacyDeal(run: QidRunner, side: 'ask' | 'askm', candidacyId: string): Promise<OfferDeal | null> {
  const qid = side === 'ask' ? '412askOfferDeal' : '413askmOfferDeal';
  const data = unwrap(await run(qid, { id: String(candidacyId) }), `${side} ${candidacyId}`);
  const node = side === 'ask' ? data?.ask?.data?.attributes?.open_mission?.data : data?.askm?.data?.attributes?.open_mashaabim?.data;
  return readOfferDeal(side === 'ask' ? 'mission' : 'resource', node);
}

/** The terms a candidacy materialized with. */
export interface FilledTerms {
  takerId: string;
  /** Missions: hours. Resources: quantity. */
  amount: number;
  /** Missions: rate per hour. Resources: unit price. */
  unitPrice: number;
  mesimabetahalichId?: string | null;
}

/** What the line costs once filled at `terms` (per product unit). */
export function filledPrice(kind: OfferKind, terms: FilledTerms): number {
  return num(terms.amount) * num(terms.unitPrice);
}

/**
 * The offer was taken: put the taker on the BOM line at the terms that materialized and
 * let each deal of the product grow by what the line now costs. Every signer agreed to
 * those terms — the customer included (the gate does not let it materialize otherwise).
 *
 * A deal that grows is no longer fully paid, and it has a provider who has not confirmed
 * receiving their part: `moneyTransfered` falls back to false (C-19 — "paid" means every
 * provider confirmed). Idempotent through the line: an assigned line is not filled twice.
 * Best-effort by contract — the mission/resource already exists; a failure is logged and
 * reported, never thrown, so it cannot undo an approval.
 */
export async function fillOfferIntoDeal(
  run: QidRunner,
  deal: OfferDeal,
  terms: FilledTerms
): Promise<{ filled: boolean; added: number; error?: string }> {
  try {
    const price = filledPrice(deal.kind, terms);
    const lineData: Record<string, unknown> =
      deal.kind === 'mission'
        ? {
            assignedMember: String(terms.takerId),
            hoursPerUnit: num(terms.amount),
            ratePerHour: num(terms.unitPrice),
            unitsPerProduct: 1,
            ...(terms.mesimabetahalichId ? { mesimabetahalich: String(terms.mesimabetahalichId) } : {})
          }
        : { assignedMember: String(terms.takerId), quantityPerUnit: num(terms.amount), pricePerUnit: num(terms.unitPrice) };

    const lineRes = await run(deal.kind === 'mission' ? '414fillRecipeMission' : '415fillRecipeResource', {
      id: deal.lineId,
      data: lineData
    });
    if (lineRes?.errors?.length) throw new Error(JSON.stringify(lineRes.errors).slice(0, 300));

    for (const sale of deal.sales) {
      const total = Math.round((sale.total + price * sale.quant) * 100) / 100;
      const res = await run('213updateSheirut', {
        id: sale.sheirutId,
        data: { total, price: Math.round((total / (sale.quant || 1)) * 100) / 100, moneyTransfered: false }
      });
      if (res?.errors?.length) throw new Error(JSON.stringify(res.errors).slice(0, 300));
    }
    return { filled: true, added: price };
  } catch (err) {
    console.error('[offerDeal] the offer materialized but the deal was not updated:', err);
    return { filled: false, added: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * A counter on a candidacy for a part of a customer's deal opens a new round — and the
 * customer must sign that round too (her earlier yes was for other terms). Tell her, so
 * she does not learn it only by opening the deal page (QA C-19). Best-effort: reading
 * the deal or sending must never undo the counter that was just recorded.
 */
export async function notifyDealClientsOfCounter(
  run: QidRunner,
  notifier: any,
  context: any,
  side: 'ask' | 'askm',
  candidacyId: string
): Promise<void> {
  try {
    const deal = await loadCandidacyDeal(run, side, String(candidacyId));
    if (!deal) return;
    const recipients = deal.clientIds.filter((c) => c !== String(context?.userId ?? ''));
    if (!notifier || recipients.length === 0) return;
    await notifier.notify(
      {
        recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
        templates: {
          title: {
            he: 'הוצעו תנאים חדשים לחלק בעסקה שלך',
            en: 'New terms were proposed for a part of your deal',
            ar: 'اقتُرحت شروط جديدة لجزء من صفقتك',
            ru: 'Предложены новые условия для части вашей сделки',
            es: 'Se propusieron nuevas condiciones para una parte de tu trato'
          },
          body: {
            he: `על "${deal.offerName}" הוצעה גרסה חדשה. מה שיסוכם יתווסף לסכום העסקה, ולכן גם החתימה שלך על הגרסה הזו נדרשת — אפשר לאשר או לדבר על זה בעמוד העסקה.`,
            en: `A new version was proposed for "${deal.offerName}". Whatever is agreed is added to your deal, so this version needs your signature too — approve it or talk it over on the deal page.`,
            ar: `اقتُرحت نسخة جديدة لـ"${deal.offerName}". ما يُتفق عليه يُضاف إلى صفقتك، لذا هذه النسخة تحتاج توقيعك أيضًا — وافق أو ناقش ذلك في صفحة الصفقة.`,
            ru: `Для «${deal.offerName}» предложена новая версия. Согласованное добавится к сумме сделки, поэтому нужна и ваша подпись под этой версией — одобрите или обсудите на странице сделки.`,
            es: `Se propuso una nueva versión para «${deal.offerName}». Lo que se acuerde se suma a tu trato, así que esta versión también necesita tu firma: apruébala o conversa en la página del trato.`
          }
        },
        channels: ['socket', 'push'],
        metadata: { type: 'dealOfferToSign', url: `/deals/${deal.sales[0]?.sheirutId ?? ''}`, priority: 'high' }
      },
      { recipients, projectId: deal.projectId },
      { data: { offerId: deal.offerId } },
      context
    );
  } catch (err) {
    console.warn('[offerDeal] the customer was not told about the counter:', err);
  }
}

/**
 * Tell the deal's customers that a candidacy on a gap of their deal waits for their
 * signature. Best-effort: the candidacy stands whether or not the message got through,
 * and the deal page lists it either way.
 */
export async function notifyDealClients(
  notifier: any,
  context: any,
  deal: OfferDeal,
  candidateName: string | null
): Promise<void> {
  const recipients = deal.clientIds.filter((c) => c !== String(context?.userId ?? ''));
  if (!notifier || recipients.length === 0) return;
  const who = candidateName ? candidateName : '';
  try {
    await notifier.notify(
      {
        recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
        templates: {
          title: {
            he: 'מישהו רוצה לקחת חלק בעסקה שלך',
            en: 'Someone wants to take a part of your deal',
            ar: 'شخص ما يريد أن يتولى جزءًا من صفقتك',
            ru: 'Кто-то хочет взять часть вашей сделки',
            es: 'Alguien quiere tomar una parte de tu trato'
          },
          body: {
            he: `${who ? who + ' הציע/ה' : 'הוצעה הצעה'} לבצע את "${deal.offerName}". מה שיסוכם יתווסף לסכום העסקה, ולכן גם החתימה שלך נדרשת — אפשר לאשר או לדבר על זה בעמוד העסקה.`,
            en: `${who ? who + ' offered' : 'An offer was made'} to take "${deal.offerName}". Whatever is agreed is added to your deal, so your signature is needed too — approve it or talk it over on the deal page.`,
            ar: `${who ? who + ' عرض' : 'قُدّم عرض'} لتولي "${deal.offerName}". ما يُتفق عليه يُضاف إلى صفقتك، لذا توقيعك مطلوب أيضًا — وافق أو ناقش ذلك في صفحة الصفقة.`,
            ru: `${who ? who + ' предлагает' : 'Поступило предложение'} взять «${deal.offerName}». Согласованное добавится к сумме вашей сделки, поэтому нужна и ваша подпись — одобрите или обсудите на странице сделки.`,
            es: `${who ? who + ' se ofreció' : 'Hay una oferta'} para tomar «${deal.offerName}». Lo que se acuerde se suma a tu trato, así que también hace falta tu firma: apruébalo o conversa en la página del trato.`
          }
        },
        channels: ['socket', 'push'],
        metadata: { type: 'dealOfferToSign', url: `/deals/${deal.sales[0]?.sheirutId ?? ''}`, priority: 'high' }
      },
      { recipients, projectId: deal.projectId },
      { data: { offerId: deal.offerId } },
      context
    );
  } catch (err) {
    console.warn('[offerDeal] the customer was not notified:', err);
  }
}
