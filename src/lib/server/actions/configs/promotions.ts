/**
 * Shop promotions — the consent half (docs/inprogress/PLAN_SHOP_PROMOTIONS.md §3, P3).
 *
 *   proposePromotion   — a promotion on the rikma's products. Goes out at once
 *                        when it touches nobody else's income (only the
 *                        proposer's own personal products, a rikma of one) or
 *                        when it sits inside the envelope the rikma agreed to
 *                        (`Project.promoPolicy`) — then the rikma is told, not
 *                        asked. Otherwise a `Decision kind:'promotion'`, and the
 *                        card says what goes beyond the envelope.
 *   counterPromotion   — the move that exists instead of a "no": another
 *                        version (a smaller cut, other dates, without one
 *                        product, "0%"), on an open proposal or on a running
 *                        promotion. Restarts the clock.
 *   pausePromotion     — the emergency brake (§3.4, D3): any member, at once,
 *                        for 24 hours; then it runs again unless a counter was
 *                        opened meanwhile. Not a veto.
 *   endPromotion       — "enough, we sold": back to the approved price harms no
 *                        partner, so it is immediate, with a notice.
 *   proposePromoPolicy — the envelope itself, or a counter to a proposed one.
 *
 * Signing goes through `voteOnDecision` (kind promotion / promoPolicy), and
 * silence through the timegrama `decision` finalizer — both into
 * `applyStandingPromoDecision`.
 */
import type { ActionConfig, ActionContext, ActionExecutionHandler } from '../types.js';
import { ActionError } from '../errors.js';
import { restimeLabel, calcDeadlineMs } from './actionUtils.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import type { Exec } from '$lib/server/archive/gql.js';
import { scope, decisionScope, scopeList } from '$lib/realtime/scopes.js';
import { noticeSubject } from '$lib/notices/links';
import {
  approvedStatus,
  earliestStart,
  effectiveWindow,
  envelopeBreaches,
  listPricesOf,
  normalizePromoPolicy,
  normalizePromoTerms,
  promoIneligible,
  promoNeedsRikma,
  promoPolicyJson,
  shelfInScope,
  type Breach,
  type PromoTerms
} from '$lib/shop/promoTerms';
import {
  createPromotion,
  fetchActorRoles,
  fetchPromoProject,
  fetchPromotion,
  fetchShelf,
  updatePromotion,
  writePromoPolicy,
  type PromoProject,
  type PromotionRow
} from '$lib/server/promotions/store';
import {
  addPromoRound,
  closePromoDecision,
  fetchPromoDecision,
  openPolicyDecision,
  openPromotionDecision,
  recordEndRound,
  standingRound
} from '$lib/server/promotions/decision';

type Lang = 'he' | 'en';
type Text = Record<Lang, string>;

const KIND_TEXT: Record<PromoTerms['kind'], Text> = {
  item: { he: 'הנחה על פריט', en: 'item discount' },
  bundle: { he: 'מבצע כמות', en: 'quantity deal' },
  bxgy: { he: 'קנה וקבל', en: 'buy-and-get' },
  store: { he: 'מבצע חנות', en: 'store-wide sale' },
  threshold: { he: 'הנחה מעל סכום', en: 'spend-and-save' }
};

const fmtDate = (iso: string | null, lang: Lang) => {
  if (!iso) return lang === 'he' ? 'מיד עם האישור' : 'as soon as it is approved';
  try {
    return new Intl.DateTimeFormat(lang === 'he' ? 'he-IL' : 'en-GB', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric' }).format(
      new Date(iso)
    );
  } catch {
    return iso.slice(0, 10);
  }
};

/** One sentence a partner can agree to: "15% on Mugs, 1.11–7.11". */
function termsLine(t: PromoTerms, lang: Lang): string {
  const r = t.rule as Record<string, number | boolean>;
  const what =
    t.kind === 'item' && r.pct != null
      ? `${r.pct}%`
      : t.kind === 'item' && r.price != null
        ? lang === 'he' ? `מחיר ${r.price}` : `price ${r.price}`
        : t.kind === 'item'
          ? lang === 'he' ? `${r.off} הנחה ליחידה` : `${r.off} off each`
          : t.kind === 'store'
            ? `${r.pct}%`
            : t.kind === 'bundle'
              ? lang === 'he' ? `${r.qty} ב-${r.price}` : `${r.qty} for ${r.price}`
              : t.kind === 'bxgy'
                ? lang === 'he' ? `קנו ${r.buy}, ${r.get} ב-${r.getPct}% הנחה` : `buy ${r.buy}, ${r.get} at ${r.getPct}% off`
                : r.pct != null
                  ? lang === 'he' ? `${r.pct}% מעל ${r.minSubtotal}` : `${r.pct}% over ${r.minSubtotal}`
                  : lang === 'he' ? `${r.off} הנחה מעל ${r.minSubtotal}` : `${r.off} off over ${r.minSubtotal}`;
  const name = t.name ? `"${t.name}" · ` : '';
  return `${name}${KIND_TEXT[t.kind][lang]}: ${what} · ${fmtDate(t.startsAt, lang)}–${fmtDate(t.endsAt, lang)}`;
}

/** What goes beyond the envelope, in words — the card and the notice say it before anyone signs. */
export function breachText(breaches: Breach[], lang: Lang): string {
  return breaches
    .map((b) => {
      switch (b.field) {
        case 'noPolicy':
          return lang === 'he' ? 'לרקמה אין עדיין מסגרת מבצעים' : 'the rikma has no promotion envelope yet';
        case 'kind':
          return lang === 'he' ? `סוג המבצע לא במסגרת` : `this kind of promotion is outside the envelope`;
        case 'pct':
          return b.value == null
            ? lang === 'he' ? `עומק ההנחה לא ידוע (המסגרת: עד ${b.limit}%)` : `the depth of the discount is unknown (envelope: up to ${b.limit}%)`
            : lang === 'he' ? `${b.value}% מעל המסגרת (${b.limit}%)` : `${b.value}% is above the envelope (${b.limit}%)`;
        case 'days':
          return lang === 'he' ? `${b.value} ימים מעל המסגרת (${b.limit})` : `${b.value} days is longer than the envelope (${b.limit})`;
        case 'who':
          return lang === 'he' ? 'המסגרת מתירה להפעיל רק לתפקידים מסוימים' : 'the envelope lets only certain roles launch promotions';
      }
    })
    .join(' · ');
}

const TERM_KEYS = ['kind', 'name', 'scope', 'rule', 'startsAt', 'endsAt', 'capUnits', 'capOrders', 'perOrderMax'] as const;
const termsParam = (p: Record<string, any>): Record<string, any> => (p.terms && typeof p.terms === 'object' ? p.terms : p);

async function notify(notifier: any, context: ActionContext, payload: Record<string, unknown>, data: Record<string, unknown>, extra: Record<string, unknown> | null) {
  if (!notifier) return;
  try {
    await notifier.notify(payload, data, extra, context);
  } catch (e) {
    console.warn('[promotions] notification failed:', e);
  }
}

const voteUrl = (pid: string, did: string) => `/moach/${pid}/votes/decision/${did}`;

/** Load and check a scope: every named product is of this rikma, and none is out of a promotion's reach. */
async function resolveScope(exec: Exec, project: PromoProject, terms: PromoTerms) {
  const shelf = await fetchShelf(exec, project.id);
  const named = new Set((terms.scope.products ?? []).map(String));
  const known = new Set(shelf.map((p) => p.id));
  for (const id of named) if (!known.has(id)) throw new ActionError('NOT_FOUND', `Product ${id} is not of this rikma`);
  const inScope = shelfInScope(terms.scope, shelf);
  const blocked = inScope.filter((p) => named.has(p.id) && promoIneligible(p));
  if (blocked.length) {
    const p = blocked[0];
    throw new ActionError(
      'NOT_ELIGIBLE',
      `"${p.name}" cannot be on promotion (${promoIneligible(p)}): a composed product passes its savings to the participants, a quote has no price to cut, and a wish deal's price is the customer's signature`
    );
  }
  // A category / store-wide scope simply does not reach what a promotion cannot touch.
  const eligible = inScope.filter((p) => !promoIneligible(p));
  if (!eligible.length) throw new ActionError('VALIDATION_FAILED', 'Nothing in this scope can be on promotion');
  return { inScope: eligible, listPrices: listPricesOf(eligible) };
}

// ── proposePromotion ──────────────────────────────────────────────────────────

const proposeHandler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const now = new Date();
  const exec = execFromContext(context);

  const parsed = normalizePromoTerms(termsParam(params), now);
  if (!parsed.ok) throw new ActionError('VALIDATION_FAILED', parsed.error);
  const terms = parsed.terms;
  const why = typeof params.why === 'string' && params.why.trim() ? params.why.trim() : null;

  const project = await fetchPromoProject(exec, projectId);
  if (!project) throw new ActionError('NOT_FOUND', `No rikma ${projectId}`);
  if (!project.memberIds.includes(actor)) throw new ActionError('NOT_MEMBER', 'Only members of the rikma propose its promotions');

  const { inScope, listPrices } = await resolveScope(exec, project, terms);
  const needsRikma = promoNeedsRikma(terms.scope, inScope, actor, project.memberIds);
  const actorRoleIds = needsRikma && project.policy && 'roles' in project.policy.who ? await fetchActorRoles(exec, projectId, actor) : [];
  const breaches = needsRikma ? envelopeBreaches(terms, project.policy, { now, listPrices, actorRoleIds }) : [];

  if (breaches.length === 0) {
    // Nobody else's income, or inside what the rikma already agreed to: it goes out now.
    const window = effectiveWindow(terms, now);
    const status = approvedStatus(window, now);
    const promotionId = await createPromotion(exec, {
      projectId,
      proposedById: actor,
      terms: { ...terms, startsAt: window.startsAt },
      status,
      currencyCode: project.currencyCode
    });
    if (needsRikma) {
      await notify(
        notifier,
        context,
        {
          recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
          templates: {
            title: { he: '🏷️ מבצע במסגרת שאישרתם', en: '🏷️ A promotion within the envelope you agreed to' },
            body: {
              he: `${termsLine(terms, 'he')}. אפשר להשהות אותו מיד (24 שעות), להציע גרסה אחרת או לסיים אותו.`,
              en: `${termsLine(terms, 'en')}. You can pause it at once (24 hours), propose another version or end it.`
            }
          },
          intent: 'outcome',
          metadata: { type: 'promotion', url: `/moach/${projectId}/sales/manage`, priority: 'normal' }
        },
        { projectId },
        { projectId },
      );
    }
    return {
      data: { projectId, promotionId, status, startsAt: window.startsAt, decisionId: null, immediate: true, envelope: needsRikma },
      updateStrategy: { type: 'fullRefresh' as const }
    };
  }

  const promotionId = await createPromotion(exec, { projectId, proposedById: actor, terms, status: 'proposed', currencyCode: project.currencyCode });
  const decisionName = terms.name ? `מבצע: ${terms.name}` : `מבצע: ${KIND_TEXT[terms.kind].he}`;
  const opened = await openPromotionDecision(exec, {
    projectId,
    restime: project.restime,
    promotionId,
    terms,
    why,
    initiatorId: actor,
    decisionName
  });
  await updatePromotion(exec, promotionId, { decisionId: opened.decisionId });

  const others = project.memberIds.filter((m) => m !== actor);
  const late = terms.startsAt != null && Date.parse(terms.startsAt) < Date.parse(opened.deadline);
  await notify(
    notifier,
    context,
    {
      recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
      templates: {
        title: { he: `🏷️ הצעה למבצע`, en: `🏷️ A promotion is proposed` },
        body: {
          he: `${termsLine(terms, 'he')}. ${breachText(breaches, 'he')}.${late ? ' אם יאושר אחרי תאריך ההתחלה — יתחיל באישור, והסיום לא זז.' : ''} אפשר לאשר, להציע גרסה אחרת או לדבר על זה. בלי תגובה תוך ${restimeLabel(project.restime, 'he')} — זו הסכמה.`,
          en: `${termsLine(terms, 'en')}. ${breachText(breaches, 'en')}.${late ? ' If it is approved after its start date, it starts at approval and its end does not move.' : ''} Approve, propose another version or talk it over. No response within ${restimeLabel(project.restime, 'en')} approves it.`
        }
      },
      // Silence approves it — every member has to hear that the clock is running.
      intent: 'consent',
      subject: () => noticeSubject('decision', opened.decisionId, projectId, 'promotion'),
      subjectText: 'before',
      metadata: { type: 'voteUpdate', url: voteUrl(projectId, opened.decisionId), priority: 'high' }
    },
    { recipients: others, projectId },
    { projectId, decisionId: opened.decisionId }
  );

  return {
    data: {
      projectId,
      promotionId,
      status: 'proposed',
      decisionId: opened.decisionId,
      deadline: opened.deadline,
      earliestStart: earliestStart(now, calcDeadlineMs(project.restime ?? 'feh')),
      breaches,
      immediate: false
    },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

// ── counterPromotion ──────────────────────────────────────────────────────────

const counterHandler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const actor = String(context.userId);
  const now = new Date();
  const exec = execFromContext(context);
  const why = typeof params.why === 'string' && params.why.trim() ? params.why.trim() : null;

  // A counter names the open proposal, or the running promotion it would change.
  let promotion: PromotionRow | null = null;
  let decisionId = params.decisionId ? String(params.decisionId) : null;
  if (!decisionId && params.promotionId) {
    promotion = await fetchPromotion(exec, String(params.promotionId));
    if (!promotion) throw new ActionError('NOT_FOUND', 'No such promotion');
    decisionId = promotion.decisionId;
  }

  let d = decisionId ? await fetchPromoDecision(exec, decisionId) : null;
  const projectId = d?.projectId ?? promotion?.projectId ?? null;
  if (!projectId) throw new ActionError('NOT_FOUND', 'No promotion proposal to counter');
  const project = await fetchPromoProject(exec, projectId);
  if (!project?.memberIds.includes(actor)) throw new ActionError('NOT_MEMBER', 'Only members of the rikma counter its promotions');

  // The envelope.
  if (d?.kind === 'promoPolicy') {
    if (d.archived) throw new ActionError('CLOSED', 'This proposal is already closed — propose a new envelope');
    const policy = normalizePromoPolicy(params.policy);
    if (!policy) throw new ActionError('VALIDATION_FAILED', 'policy is required');
    const out = await addPromoRound(exec, d, { proposedById: actor, why, policy });
    await notifyCounter(notifier, context, projectId, d.id, project, actor, { he: 'הוצעה מסגרת מבצעים אחרת', en: 'A different promotion envelope is proposed' });
    return { data: { projectId, decisionId: d.id, order: out.order, deadline: out.deadline }, updateStrategy: { type: 'fullRefresh' as const } };
  }

  promotion ??= d?.promotionId ? await fetchPromotion(exec, d.promotionId) : null;
  if (!promotion) throw new ActionError('NOT_FOUND', 'No such promotion');
  if (promotion.status === 'ended') throw new ActionError('ENDED', 'This promotion has ended — propose a new one');

  // The counter carries the whole version: what the counterer did not touch stays as it stands.
  const standing = d ? standingRound(d) : null;
  const base: Record<string, unknown> = { ...(standing ?? {}) };
  if (!standing) Object.assign(base, {
    kind: promotion.kind,
    name: promotion.name,
    scope: promotion.scope,
    rule: promotion.rule,
    startsAt: promotion.startsAt,
    endsAt: promotion.endsAt,
    capUnits: promotion.capUnits,
    capOrders: promotion.capOrders,
    perOrderMax: promotion.perOrderMax
  });
  const given = termsParam(params);
  const merged: Record<string, unknown> = {};
  for (const k of TERM_KEYS) merged[k] = given[k] !== undefined ? given[k] : base[k];
  const parsed = normalizePromoTerms(merged, now);
  if (!parsed.ok) throw new ActionError('VALIDATION_FAILED', parsed.error);
  await resolveScope(exec, project, parsed.terms);

  let order: number;
  let deadline: string;
  if (d) {
    const out = await addPromoRound(exec, d, { proposedById: actor, why, terms: parsed.terms });
    order = out.order;
    deadline = out.deadline;
  } else {
    // Launched inside the envelope, so it never had a Decision: changing it opens one.
    const opened = await openPromotionDecision(exec, {
      projectId,
      restime: project.restime,
      promotionId: promotion.id,
      terms: parsed.terms,
      why,
      initiatorId: actor,
      decisionName: parsed.terms.name ? `מבצע: ${parsed.terms.name}` : `מבצע: ${KIND_TEXT[parsed.terms.kind].he}`
    });
    await updatePromotion(exec, promotion.id, { decisionId: opened.decisionId });
    d = await fetchPromoDecision(exec, opened.decisionId);
    order = 1;
    deadline = opened.deadline;
  }
  const did = d?.id ?? '';
  await notifyCounter(notifier, context, projectId, did, project, actor, {
    he: `גרסה אחרת למבצע: ${termsLine(parsed.terms, 'he')}`,
    en: `Another version of the promotion: ${termsLine(parsed.terms, 'en')}`
  });
  return {
    data: { projectId, decisionId: did, promotionId: promotion.id, order, deadline, status: promotion.status },
    updateStrategy: { type: 'fullRefresh' as const }
  };
};

async function notifyCounter(notifier: any, context: ActionContext, projectId: string, decisionId: string, project: PromoProject, actor: string, title: Text) {
  await notify(
    notifier,
    context,
    {
      recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
      templates: {
        title,
        body: {
          he: `השעון התאפס — אפשר לאשר, לדייק שוב או לדבר על זה. בלי תגובה תוך ${restimeLabel(project.restime, 'he')} — הגרסה הזו מאושרת.`,
          en: `The clock restarted — approve, refine again or talk it over. No response within ${restimeLabel(project.restime, 'en')} approves this version.`
        }
      },
      intent: 'consent',
      subject: () => noticeSubject('decision', decisionId, projectId, 'promotion'),
      subjectText: 'links',
      metadata: { type: 'voteUpdate', url: voteUrl(projectId, decisionId), priority: 'high' }
    },
    { recipients: project.memberIds.filter((m) => m !== actor), projectId },
    { projectId, decisionId }
  );
}

// ── pausePromotion ────────────────────────────────────────────────────────────

async function loadForMember(exec: Exec, promotionId: string, actor: string) {
  const promotion = await fetchPromotion(exec, promotionId);
  if (!promotion?.projectId) throw new ActionError('NOT_FOUND', 'No such promotion');
  const project = await fetchPromoProject(exec, promotion.projectId);
  if (!project?.memberIds.includes(actor)) throw new ActionError('NOT_MEMBER', 'Only members of the rikma can do this');
  return { promotion, project };
}

const pauseHandler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const actor = String(context.userId);
  const exec = execFromContext(context);
  const { promotion, project } = await loadForMember(exec, String(params.promotionId), actor);
  const now = new Date();

  if (params.paused === false) {
    if (promotion.status !== 'paused') return { data: { promotionId: promotion.id, status: promotion.status }, updateStrategy: { type: 'none' as const } };
    const status = promotion.startsAt && Date.parse(promotion.startsAt) > now.getTime() ? 'scheduled' : 'active';
    await updatePromotion(exec, promotion.id, { status, pausedAt: null, pausedById: null });
    return { data: { projectId: project.id, promotionId: promotion.id, status }, updateStrategy: { type: 'fullRefresh' as const } };
  }

  if (promotion.status !== 'active' && promotion.status !== 'scheduled') {
    throw new ActionError('NOT_RUNNING', 'Only a scheduled or running promotion can be paused');
  }
  await updatePromotion(exec, promotion.id, { status: 'paused', pausedAt: now.toISOString(), pausedById: actor });
  const reason = typeof params.why === 'string' && params.why.trim() ? params.why.trim() : null;
  await notify(
    notifier,
    context,
    {
      recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
      templates: {
        title: { he: '⏸️ מבצע הושהה', en: '⏸️ A promotion was paused' },
        body: {
          he: `${promotion.name ? `"${promotion.name}" ` : ''}הושהה ל-24 שעות${reason ? `: ${reason}` : ''}. אם לא תוצע בינתיים גרסה אחרת — הוא חוזר לפעול.`,
          en: `${promotion.name ? `"${promotion.name}" ` : 'It '}is paused for 24 hours${reason ? `: ${reason}` : ''}. Unless another version is proposed meanwhile, it runs again.`
        }
      },
      intent: 'outcome',
      metadata: { type: 'promotion', url: `/moach/${project.id}/sales/manage`, priority: 'high' }
    },
    { projectId: project.id },
    { projectId: project.id }
  );
  return { data: { projectId: project.id, promotionId: promotion.id, status: 'paused', pausedAt: now.toISOString() }, updateStrategy: { type: 'fullRefresh' as const } };
};

// ── endPromotion ──────────────────────────────────────────────────────────────

const endHandler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const actor = String(context.userId);
  const exec = execFromContext(context);
  const { promotion, project } = await loadForMember(exec, String(params.promotionId), actor);
  if (promotion.status === 'ended') return { data: { promotionId: promotion.id, status: 'ended' }, updateStrategy: { type: 'none' as const } };
  const why = typeof params.why === 'string' && params.why.trim() ? params.why.trim() : null;

  // An open proposal is withdrawn by its proposer; a running promotion is ended by any member.
  if (promotion.status === 'proposed' && promotion.proposedById !== actor) {
    throw new ActionError('NOT_PROPOSER', 'A proposal still on the table is withdrawn by whoever proposed it — counter it with 0% instead');
  }
  await updatePromotion(exec, promotion.id, { status: 'ended', endedReason: 'early', pausedAt: null, pausedById: null });
  if (promotion.decisionId) {
    const d = await fetchPromoDecision(exec, promotion.decisionId);
    if (d && promotion.status === 'proposed') await closePromoDecision(exec, d);
    else if (d) await recordEndRound(exec, d, { userId: actor, why });
  }
  if (promotion.status !== 'proposed') {
    await notify(
      notifier,
      context,
      {
        recipients: { type: 'projectMembers', config: { projectIdParam: 'projectId', excludeSender: true } },
        templates: {
          title: { he: '🏁 מבצע הסתיים', en: '🏁 A promotion ended' },
          body: {
            he: `${promotion.name ? `"${promotion.name}" ` : 'המבצע '}הסתיים מוקדם${why ? `: ${why}` : ''}. המחירים חזרו למחיר המאושר.`,
            en: `${promotion.name ? `"${promotion.name}" ` : 'The promotion '}ended early${why ? `: ${why}` : ''}. Prices are back to the approved ones.`
          }
        },
        intent: 'outcome',
        metadata: { type: 'promotion', url: `/moach/${project.id}/sales/manage`, priority: 'normal' }
      },
      { projectId: project.id },
      { projectId: project.id }
    );
  }
  return { data: { projectId: project.id, promotionId: promotion.id, status: 'ended' }, updateStrategy: { type: 'fullRefresh' as const } };
};

// ── proposePromoPolicy ────────────────────────────────────────────────────────

const policyHandler: ActionExecutionHandler = async (params, context, { notifier }) => {
  const projectId = String(params.projectId);
  const actor = String(context.userId);
  const exec = execFromContext(context);
  const policy = normalizePromoPolicy(params.policy);
  if (!policy) throw new ActionError('VALIDATION_FAILED', 'policy is required');
  const why = typeof params.why === 'string' && params.why.trim() ? params.why.trim() : null;

  const project = await fetchPromoProject(exec, projectId);
  if (!project) throw new ActionError('NOT_FOUND', `No rikma ${projectId}`);
  if (!project.memberIds.includes(actor)) throw new ActionError('NOT_MEMBER', 'Only members of the rikma propose its envelope');

  if (project.memberIds.filter((m) => m !== actor).length === 0) {
    await writePromoPolicy(exec, projectId, promoPolicyJson(policy));
    return { data: { projectId, decisionId: null, immediate: true, policy: promoPolicyJson(policy) }, updateStrategy: { type: 'fullRefresh' as const } };
  }

  const opened = await openPolicyDecision(exec, {
    projectId,
    restime: project.restime,
    policy,
    why,
    initiatorId: actor,
    decisionName: 'מסגרת מבצעים'
  });
  const kinds = policy.kinds.map((k) => KIND_TEXT[k]);
  await notify(
    notifier,
    context,
    {
      recipients: { type: 'specificUsers', config: { userIdsParam: 'recipients' } },
      templates: {
        title: { he: '🏷️ הצעה: מסגרת למבצעים', en: '🏷️ Proposed: an envelope for promotions' },
        body: {
          he: `מבצע של עד ${policy.maxPct}% ועד ${policy.maxDays} ימים (${kinds.map((k) => k.he).join(', ')}) ייצא בלי הצבעה, וכל הרקמה תקבל הודעה. ${policy.floor === 'cost' ? 'אף פעם לא מתחת לעלות.' : ''} בלי תגובה תוך ${restimeLabel(project.restime, 'he')} — זו הסכמה.`,
          en: `A promotion of up to ${policy.maxPct}% and up to ${policy.maxDays} days (${kinds.map((k) => k.en).join(', ')}) would go out without a vote, and the whole rikma is told. ${policy.floor === 'cost' ? 'Never below cost.' : ''} No response within ${restimeLabel(project.restime, 'en')} approves it.`
        }
      },
      intent: 'consent',
      subject: () => noticeSubject('decision', opened.decisionId, projectId, 'promotion'),
      subjectText: 'before',
      metadata: { type: 'voteUpdate', url: voteUrl(projectId, opened.decisionId), priority: 'high' }
    },
    { recipients: project.memberIds.filter((m) => m !== actor), projectId },
    { projectId, decisionId: opened.decisionId }
  );
  return { data: { projectId, decisionId: opened.decisionId, deadline: opened.deadline, immediate: false }, updateStrategy: { type: 'fullRefresh' as const } };
};

// ── configs ───────────────────────────────────────────────────────────────────

const memberOf = (what: string) => [
  { type: 'jwt' as const, errorMessage: `Must be logged in to ${what}` },
  { type: 'projectMember' as const, config: { projectIdParam: 'projectId' }, errorMessage: `Only rikma members can ${what}` }
];

const TERMS_PARAMS = {
  terms: { type: 'object' as const, required: false, description: '{ kind, name, scope, rule, startsAt, endsAt, capUnits, capOrders, perOrderMax } — or the same keys at the top level' },
  kind: { type: 'string' as const, required: false, description: 'item | bundle | bxgy | store | threshold' },
  name: { type: 'string' as const, required: false },
  scope: { type: 'object' as const, required: false, description: '{ products, variants, categories, all, exclude }' },
  rule: { type: 'object' as const, required: false, description: 'item {pct|price|off} · bundle {qty, price, repeat} · bxgy {buy, get, getPct} · store {pct} · threshold {minSubtotal, off|pct}' },
  startsAt: { type: 'string' as const, required: false, description: 'ISO date; absent = as soon as approved' },
  endsAt: { type: 'string' as const, required: false, description: 'ISO date — required on a new promotion' },
  capUnits: { type: 'number' as const, required: false },
  capOrders: { type: 'number' as const, required: false },
  perOrderMax: { type: 'number' as const, required: false },
  why: { type: 'string' as const, required: false }
};

const promoScopes = (p: Record<string, any>, r: any) =>
  scopeList([scope('project', r?.data?.projectId ?? p.projectId), decisionScope('decision', r?.data?.decisionId ?? p.decisionId)]);

export const proposePromotionConfig: ActionConfig = {
  key: 'proposePromotion',
  description:
    "Propose a shop promotion on the rikma's products. Immediate when it touches nobody else's income or sits inside the rikma's promotion envelope (the rikma is notified); otherwise a promotion Decision that matures on unanimous consent or on restime silence.",
  graphqlOperation: proposeHandler,
  paramSchema: { projectId: { type: 'string', required: true }, ...TERMS_PARAMS },
  authRules: memberOf('propose a promotion'),
  updateStrategy: { type: 'fullRefresh' },
  realtime: { scopes: promoScopes }
};

export const counterPromotionConfig: ActionConfig = {
  key: 'counterPromotion',
  description:
    'Put another version of a promotion on the table (a smaller cut, other dates, a narrower scope, 0%) — on an open proposal or on a running promotion — or another envelope on a proposed promoPolicy. Restarts the silence clock; there is no reject.',
  graphqlOperation: counterHandler,
  paramSchema: {
    projectId: { type: 'string', required: true, description: 'Auth + notifications' },
    decisionId: { type: 'string', required: false, description: 'The open promotion / promoPolicy Decision' },
    promotionId: { type: 'string', required: false, description: 'A running promotion to change' },
    policy: { type: 'object', required: false, description: 'promoPolicy counter: the whole envelope' },
    ...TERMS_PARAMS
  },
  authRules: memberOf('counter a promotion'),
  updateStrategy: { type: 'fullRefresh' },
  realtime: { scopes: promoScopes }
};

export const pausePromotionConfig: ActionConfig = {
  key: 'pausePromotion',
  description:
    'The emergency brake: pause a running promotion at once for 24 hours (it runs again unless another version is proposed meanwhile), or resume it with paused:false.',
  graphqlOperation: pauseHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    promotionId: { type: 'string', required: true },
    paused: { type: 'boolean', required: false, description: 'false = resume; default true' },
    why: { type: 'string', required: false }
  },
  authRules: memberOf('pause a promotion'),
  updateStrategy: { type: 'fullRefresh' },
  realtime: { scopes: (p) => scopeList([scope('project', p.projectId)]) }
};

export const endPromotionConfig: ActionConfig = {
  key: 'endPromotion',
  description: "End a promotion early — back to the approved prices, immediate, with a notice. A proposal still on the table is withdrawn by its proposer.",
  graphqlOperation: endHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    promotionId: { type: 'string', required: true },
    why: { type: 'string', required: false }
  },
  authRules: memberOf('end a promotion'),
  updateStrategy: { type: 'fullRefresh' },
  realtime: { scopes: (p) => scopeList([scope('project', p.projectId)]) }
};

export const proposePromoPolicyConfig: ActionConfig = {
  key: 'proposePromoPolicy',
  description:
    "Propose the rikma's promotion envelope (max %, max days, kinds, who, floor, arranged-discount threshold): promotions inside it go out without a vote. Rikma-wide Decision; immediate in a rikma of one.",
  graphqlOperation: policyHandler,
  paramSchema: {
    projectId: { type: 'string', required: true },
    policy: { type: 'object', required: true, description: '{ maxPct, maxDays, maxDaysPerHalfYear, floor: cost|none, kinds, who: members|roles:<ids>, arrangedDiscountPct }' },
    why: { type: 'string', required: false }
  },
  authRules: memberOf('propose a promotion envelope'),
  updateStrategy: { type: 'fullRefresh' },
  realtime: { scopes: promoScopes }
};

export const promotionActionConfigs: ActionConfig[] = [
  proposePromotionConfig,
  counterPromotionConfig,
  pausePromotionConfig,
  endPromotionConfig,
  proposePromoPolicyConfig
];
