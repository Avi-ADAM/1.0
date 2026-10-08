/**
 * More hours on a part of a wish deal — the server half of `$lib/sheirut/dealEdit`
 * (QA_CONCIERGE_E2E C-14).
 *
 * A provider asks for more hours (or another rate) the way any member does: an
 * `editObject` proposal on their mission. When the mission is a part of a customer's deal,
 * this module tells the archive machinery who else has to sign (`ExtraSigners`): the
 * deal's customer, whenever the version on the table costs her more than she agreed. Once a
 * version is applied, the deal follows it — the part's ceiling becomes the new terms and
 * the deal's total moves by the difference.
 */

import type { ArchRound, ObjectChangeDecision } from '$lib/server/archive/read.js';
import type { ExtraSigners, ExtraSignersFor } from '$lib/server/archive/vote.js';
import { editedValue, raiseBy, raisesPart } from '$lib/sheirut/dealEdit.js';
import { loadDealDue, type QidRunner } from './dealDue.js';

export interface MissionDeal {
  missionId: string;
  missionName: string;
  sheirutId: string;
  projectId: string | null;
  dealTotal: number;
  quant: number;
  clientIds: string[];
  /** The BOM line (`MatanotRecipeMission`) the mission carries. */
  lineKey: string;
  /** The price she agreed for the part — the ceiling. */
  cap: number;
  missionHours: number;
  missionRate: number;
  providerId: string | null;
  providerName: string | null;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Strapi errors must not pass for "no customer": that would let the rikma raise a part
 * she pays for without her. An empty answer is just "not a deal mission".
 */
function unwrap(res: any, what: string) {
  if (res?.errors?.length) throw new Error(`Could not read the deal of ${what}: ${JSON.stringify(res.errors).slice(0, 300)}`);
  return res?.data ?? res ?? null;
}

/** The wish deal a mission is a part of — or null for every ordinary mission. */
export async function loadMissionDeal(run: QidRunner, missionId: string): Promise<MissionDeal | null> {
  const data = unwrap(await run('398missionDeals', { id: String(missionId) }), `mission ${missionId}`);
  const node = data?.mesimabetahalich?.data;
  if (!node) return null;

  // Only a deal sold of a wish's product has parts with a ceiling; an ordinary rikma's
  // sales are skipped without the heavier read.
  const wishDeals = (node.attributes?.project?.data?.attributes?.sheiruts?.data ?? []).filter(
    (s: any) => s?.attributes?.matanot?.data?.attributes?.ratson?.data?.id
  );
  for (const s of wishDeals) {
    const due = await loadDealDue(run, String(s.id));
    if (!due) continue;
    const line = due.lines.find((l) => l.kind === 'mission' && l.missionId === String(node.id));
    if (!line) continue;
    return {
      missionId: String(node.id),
      missionName: line.name,
      sheirutId: due.sheirutId,
      projectId: due.projectId,
      dealTotal: due.dealTotal,
      quant: due.quant,
      clientIds: due.customerIds,
      lineKey: line.key,
      cap: line.cap,
      missionHours: line.missionHours ?? 0,
      missionRate: line.missionRate ?? 0,
      providerId: line.providerId,
      providerName: line.providerName ?? null
    };
  }
  return null;
}

/**
 * The deal follows an applied version: the line carries the new terms (so its ceiling is
 * the new value) and the deal's total moves by the difference. A deal that grows is not
 * fully paid any more (`moneyTransfered: false`, as when a gap is filled — C-19).
 */
export async function syncDealLine(
  run: QidRunner,
  deal: MissionDeal,
  round: { hm?: number | null; price?: number | null }
): Promise<{ changed: boolean; delta: number }> {
  const value = editedValue(round, deal);
  const delta = round2(value - deal.cap);
  if (Math.abs(delta) < 0.005) return { changed: false, delta: 0 };

  const hours = round.hm != null ? Number(round.hm) : deal.missionHours;
  const rate = round.price != null ? Number(round.price) : deal.missionRate;
  unwrap(await run('399updateDealLineTerms', { id: deal.lineKey, hoursPerUnit: hours, ratePerHour: rate }), 'the deal line');

  const total = round2(Math.max(0, deal.dealTotal + delta * deal.quant));
  unwrap(
    await run('213updateSheirut', {
      id: deal.sheirutId,
      data: { total, price: round2(total / (deal.quant || 1)), ...(delta > 0 ? { moneyTransfered: false } : {}) }
    }),
    'the deal total'
  );
  return { changed: true, delta };
}

/** Extra signers that remember which deal they came from. */
export type DealSigners = ExtraSigners & { deal: MissionDeal };

/** The extra signers of a version on a deal mission: its customers, when it raises her part. */
export function signersFromDeal(run: QidRunner, deal: MissionDeal): DealSigners {
  return {
    deal,
    ids: deal.clientIds,
    needed: (round: ArchRound) => round.mode === 'keep' && raisesPart(round, deal),
    onApplied: async (round: ArchRound) => {
      if (round.mode === 'keep') await syncDealLine(run, deal, round);
    }
  };
}

/** For the archive machinery: who besides the rikma signs this decision (null = nobody). */
export function dealSignersFor(run: QidRunner): ExtraSignersFor {
  return async (decision: ObjectChangeDecision) => {
    if (decision.kind !== 'editObject' && decision.kind !== 'archiveObject') return null;
    if (decision.targetKind !== 'missionInProgress' || !decision.targetId) return null;
    const deal = await loadMissionDeal(run, decision.targetId);
    return deal ? signersFromDeal(run, deal) : null;
  };
}

/**
 * Tell the deal's customers a version on the table raises their part and waits for their
 * signature. Best-effort: the proposal stands either way, and the deal page lists it.
 */
export async function notifyDealClientsOfEdit(
  notifier: any,
  context: any,
  deal: MissionDeal,
  round: { hm?: number | null; price?: number | null }
): Promise<void> {
  const recipients = deal.clientIds.filter((c) => c !== String(context?.userId ?? ''));
  if (!notifier || recipients.length === 0) return;
  const more = raiseBy(round, deal);
  const name = deal.missionName;
  try {
    await notifier.notify(
      {
        recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
        templates: {
          title: {
            he: 'בקשה לשעות נוספות בעסקה שלך',
            en: 'A request for more hours on your deal',
            ar: 'طلب ساعات إضافية في صفقتك',
            ru: 'Запрос на дополнительные часы в вашей сделке',
            es: 'Una solicitud de más horas en tu trato'
          },
          body: {
            he: `ב"${name}" מבקשים עד ${more} יותר ממה שסוכם. בלי החתימה שלך זה לא נכנס לחשבון. אפשר לאשר, להציע שעות או תעריף אחרים, או לדבר על זה בעמוד העסקה.`,
            en: `"${name}" asks for up to ${more} more than agreed. Without your signature it is not added to your bill. Approve, propose other hours or another rate, or talk it over on the deal page.`,
            ar: `في "${name}" يُطلب حتى ${more} أكثر مما اتُّفق عليه. بدون توقيعك لا يُضاف إلى حسابك. وافق، أو اقترح ساعات أو سعرًا آخر، أو ناقش ذلك في صفحة الصفقة.`,
            ru: `В «${name}» просят до ${more} сверх согласованного. Без вашей подписи это не добавится к счёту. Одобрите, предложите другие часы или ставку или обсудите на странице сделки.`,
            es: `En «${name}» se piden hasta ${more} más de lo acordado. Sin tu firma no se suma a tu cuenta. Apruébalo, propón otras horas u otra tarifa, o conversa en la página del trato.`
          }
        },
        channels: ['socket', 'email', 'push'],
        metadata: { type: 'dealEditToSign', url: `/deals/${deal.sheirutId}`, priority: 'high' }
      },
      { recipients, projectId: deal.projectId },
      { data: { missionId: deal.missionId, sheirutId: deal.sheirutId } },
      context
    );
  } catch (err) {
    console.warn('[dealEdit] the customer was not notified:', err);
  }
}
