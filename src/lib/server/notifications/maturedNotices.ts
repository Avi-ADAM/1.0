/**
 * What each silence maturation says, and to whom (N5,
 * docs/inprogress/PLAN_REALTIME_MIGRATION.md §6.5). Pure — the timegrama
 * handlers call one of these with the names and ids they already read and pass
 * the result to `tellMatured`; the tests pin recipients and intents.
 *
 * Intents follow the explicit twin of each path, so a silence and a unanimous
 * vote are announced alike: a rikma-wide result is `outcome` to the members
 * (closeFiniapruval, finalizeAskAcceptance, …); a result about one person is
 * `personal`; a maturation that opens a new round waiting on someone is
 * `consent` — their silence is not counted, or the clock runs against them.
 *
 * Hebrew is written so it does not guess anyone's gender. Content in five
 * languages is SMART_NOTICES stage 6; until then he / en / ar, like every
 * action's templates.
 */

import type { LanguageStrings } from '$lib/server/actions/types';
import { levOf, type MaturedNotice } from './matured';

type Id = string | number | null | undefined;
const L = (he: string, en: string, ar: string): LanguageStrings => ({ he, en, ar });

const moach = (pid: Id, tab = '') => (pid != null ? `/moach/${pid}${tab ? `/${tab}` : ''}` : '/lev');
const voteUrl = (pid: Id, kind: string, id: Id) =>
  pid != null && id != null ? `/moach/${pid}/votes/${kind}/${id}` : moach(pid, 'votes');

// The sentence every rikma-wide maturation opens with.
const SILENT = L(
  'אף אחד לא התנגד בזמן התגובה של הרקמה',
  "Nobody objected within the rikma's response time",
  'لم يعترض أحد خلال وقت الاستجابة في الريكما'
);
const after = (s: LanguageStrings, rest: LanguageStrings): LanguageStrings =>
  L(`${s.he}, ${rest.he}`, `${s.en}, ${rest.en}`, `${s.ar}، ${rest.ar}`);

// ── pendm / pmash ──────────────────────────────────────────────────────────

export function pendmOpened(p: { projectId: Id; name: string }): MaturedNotice {
  return {
    kind: 'pendm',
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: L(`המשימה "${p.name}" אושרה בשתיקה`, `The mission "${p.name}" was approved by silence`, `تمت الموافقة على المهمة «${p.name}» بالصمت`),
    body: after(SILENT, L('ולכן ההצעה אושרה. המשימה פתוחה עכשיו לשותפים.', 'so the proposal stands. The mission is now open to partners.', 'لذلك أُقرّ الاقتراح. المهمة مفتوحة الآن للشركاء.')),
    url: moach(p.projectId, 'open')
  };
}

/** A mission proposed for one person: the rikma said yes, now it is theirs to answer. */
export function pendmOfferedToAssignee(p: { projectId: Id; name: string; assigneeId: Id }): MaturedNotice[] {
  return [
    {
      kind: 'pendm',
      intent: 'outcome',
      to: { projectId: p.projectId, except: [p.assigneeId] },
      title: L(`המשימה "${p.name}" אושרה בשתיקה`, `The mission "${p.name}" was approved by silence`, `تمت الموافقة على المهمة «${p.name}» بالصمت`),
      body: after(SILENT, L('ולכן ההצעה אושרה. המשימה מוצעת עכשיו למי שהוצעה לו, ומחכה לתשובה שלו.', 'so the proposal stands. The mission is now offered to the person it named, and waits for their answer.', 'لذلك أُقرّ الاقتراح. المهمة معروضة الآن على من سُمّي لها، وتنتظر ردّه.')),
      url: moach(p.projectId, 'open')
    },
    {
      kind: 'pendm',
      intent: 'consent',
      to: { userIds: [p.assigneeId] },
      title: L(`הרקמה מציעה לך את המשימה "${p.name}"`, `The rikma offers you the mission "${p.name}"`, `الريكما تعرض عليك المهمة «${p.name}»`),
      body: L(
        'ההצעה אושרה ברקמה, ועכשיו התשובה שלך: לאשר, לדון או להציע תנאים אחרים. המשימה לא תירשם על שמך בלי הסכמה שלך — בלי תגובה בזמן התגובה של הרקמה, היא חוזרת לרקמה.',
        "The rikma approved it, and now it is your answer: approve, discuss, or propose other terms. It will not be registered in your name without your yes — with no answer within the rikma's response time, it goes back to the rikma.",
        'وافقت الريكما على الاقتراح، والآن دورك: الموافقة أو النقاش أو اقتراح شروط أخرى. لن تُسجَّل المهمة باسمك دون موافقتك — وإن لم تردّ خلال وقت الاستجابة تعود إلى الريكما.'
      ),
      url: levOf(p.projectId)
    }
  ];
}

export function pmashOpened(p: { projectId: Id; name: string }): MaturedNotice {
  return {
    kind: 'pmash',
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: L(`המשאב "${p.name}" אושר בשתיקה`, `The resource "${p.name}" was approved by silence`, `تمت الموافقة على المورد «${p.name}» بالصمت`),
    body: after(SILENT, L('ולכן ההצעה אושרה. הרקמה מחפשת עכשיו מי שיביא אותו.', 'so the proposal stands. The rikma is now looking for someone to bring it.', 'لذلك أُقرّ الاقتراح. تبحث الريكما الآن عمّن يوفّره.')),
    url: moach(p.projectId, 'open')
  };
}

// ── ask / askm (candidacies) ───────────────────────────────────────────────

export function askAccepted(p: { projectId: Id; name: string; takerId: Id; takerName?: string | null }): MaturedNotice[] {
  const who = p.takerName?.trim();
  return [
    {
      kind: 'ask',
      intent: 'outcome',
      to: { projectId: p.projectId, except: [p.takerId] },
      title: L(`המועמדות ל"${p.name}" אושרה בשתיקה`, `The candidacy for "${p.name}" was approved by silence`, `تمت الموافقة على الترشّح لـ«${p.name}» بالصمت`),
      body: after(
        SILENT,
        who
          ? L(`ולכן המשימה רשומה עכשיו על שם ${who}.`, `so the mission is now registered to ${who}.`, `لذلك أصبحت المهمة مسجّلة باسم ${who}.`)
          : L('ולכן המשימה רשומה עכשיו על שם מי שהגיש את המועמדות.', 'so the mission is now registered to the candidate.', 'لذلك أصبحت المهمة مسجّلة باسم المرشّح.')
      ),
      url: moach(p.projectId, 'progress')
    },
    {
      kind: 'ask',
      intent: 'personal',
      to: { userIds: [p.takerId] },
      title: L(`התקבלת למשימה "${p.name}"`, `You were accepted for "${p.name}"`, `تم قبولك في المهمة «${p.name}»`),
      body: L(
        'הרקמה לא התנגדה בזמן התגובה שלה, ולכן המועמדות שלך אושרה והמשימה רשומה עכשיו על שמך.',
        'The rikma raised no objection within its response time, so your candidacy is approved and the mission is now yours.',
        'لم تعترض الريكما خلال وقت الاستجابة، لذلك قُبل ترشّحك وأصبحت المهمة مسجّلة باسمك.'
      ),
      url: levOf(p.projectId)
    }
  ];
}

/** An assigned offer its assignee never answered: their silence is not a yes. */
export function askOfferLapsed(p: { projectId: Id; name: string; takerId: Id }): MaturedNotice[] {
  return [
    {
      kind: 'ask',
      intent: 'outcome',
      to: { projectId: p.projectId, except: [p.takerId] },
      title: L(`המשימה "${p.name}" פתוחה שוב`, `The mission "${p.name}" is open again`, `المهمة «${p.name}» مفتوحة من جديد`),
      body: L(
        'מי שהמשימה הוצעה לו לא ענה בזמן התגובה, ולכן היא חזרה לרקמה ואפשר לחפש לה מישהו אחר.',
        'The person it was offered to did not answer within the response time, so it went back to the rikma and can be offered to someone else.',
        'لم يردّ من عُرضت عليه المهمة خلال وقت الاستجابة، لذلك عادت إلى الريكما ويمكن البحث عن شخص آخر.'
      ),
      url: moach(p.projectId, 'open')
    },
    {
      kind: 'ask',
      intent: 'personal',
      to: { userIds: [p.takerId] },
      title: L(`ההצעה למשימה "${p.name}" חזרה לרקמה`, `The offer of "${p.name}" went back to the rikma`, `عاد عرض المهمة «${p.name}» إلى الريكما`),
      body: L(
        'לא התקבלה ממך תשובה בזמן התגובה, ולכן המשימה לא נרשמה על שמך. אם היא עדיין מתאימה לך, אפשר להגיש עליה מועמדות.',
        'No answer came from you within the response time, so the mission was not registered in your name. If it still suits you, you can apply for it.',
        'لم يصل ردّك خلال وقت الاستجابة، لذلك لم تُسجَّل المهمة باسمك. إن كانت لا تزال تناسبك يمكنك الترشّح لها.'
      ),
      url: moach(p.projectId, 'open')
    }
  ];
}

export function askmAccepted(p: { projectId: Id; name: string; takerId: Id }): MaturedNotice[] {
  return [
    {
      kind: 'askm',
      intent: 'outcome',
      to: { projectId: p.projectId, except: [p.takerId] },
      title: L(`ההצעה למשאב "${p.name}" אושרה בשתיקה`, `The offer for the resource "${p.name}" was approved by silence`, `تمت الموافقة على عرض المورد «${p.name}» بالصمت`),
      body: after(SILENT, L('ולכן ההצעה התקבלה והמשאב נכנס לרקמה.', 'so the offer is accepted and the resource joins the rikma.', 'لذلك قُبل العرض وانضمّ المورد إلى الريكما.')),
      url: moach(p.projectId, 'resources')
    },
    {
      kind: 'askm',
      intent: 'personal',
      to: { userIds: [p.takerId] },
      title: L(`ההצעה שלך למשאב "${p.name}" התקבלה`, `Your offer for "${p.name}" was accepted`, `قُبل عرضك للمورد «${p.name}»`),
      body: L(
        'הרקמה לא התנגדה בזמן התגובה שלה, ולכן ההצעה שלך אושרה והמשאב רשום עכשיו על שמך.',
        'The rikma raised no objection within its response time, so your offer is approved and the resource is now registered to you.',
        'لم تعترض الريكما خلال وقت الاستجابة، لذلك أُقرّ عرضك وأصبح المورد مسجّلًا باسمك.'
      ),
      url: levOf(p.projectId)
    }
  ];
}

// ── finiapruval ────────────────────────────────────────────────────────────

export function finiapprovalMatured(p: { projectId: Id; name: string; hours: number; isHours: boolean }): MaturedNotice {
  const h = Number(p.hours) || 0;
  return {
    kind: 'finiapruval',
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: p.isHours
      ? L(`${h} שעות על "${p.name}" אושרו בשתיקה`, `${h} hours on "${p.name}" were approved by silence`, `تمت الموافقة على ${h} ساعة في «${p.name}» بالصمت`)
      : L(`המשימה "${p.name}" הושלמה`, `The mission "${p.name}" is complete`, `اكتملت المهمة «${p.name}»`),
    body: after(
      SILENT,
      p.isHours
        ? L('ולכן השעות נכנסו לחשבון.', 'so the hours are counted.', 'لذلك احتُسبت الساعات.')
        : L('ולכן הסיום אושר והשעות נכנסו לחשבון.', 'so the finish is approved and the hours are counted.', 'لذلك أُقرّ الإنهاء واحتُسبت الساعات.')
    ),
    url: moach(p.projectId, 'progress')
  };
}

// ── decision ───────────────────────────────────────────────────────────────

/** An archive / edit proposal took effect. */
export function objectChangeApplied(p: {
  projectId: Id;
  decisionId: Id;
  decisionName: string;
  effectiveFrom?: string | null;
  endedMemberId?: Id;
}): MaturedNotice[] {
  const later = p.effectiveFrom
    ? L(' היא תיכנס לתוקף בסוף המחזור.', ' It takes effect at the end of the cycle.', ' يسري مفعوله في نهاية الدورة.')
    : L('', '', '');
  const out: MaturedNotice[] = [
    {
      kind: 'decision',
      intent: 'outcome',
      to: { projectId: p.projectId, except: p.endedMemberId != null ? [p.endedMemberId] : [] },
      title: L(`"${p.decisionName}" אושרה בשתיקה`, `"${p.decisionName}" was approved by silence`, `تمت الموافقة على «${p.decisionName}» بالصمت`),
      body: after(
        SILENT,
        L(`ולכן הגרסה שעל השולחן אושרה.${later.he}`, `so the version on the table stands.${later.en}`, `لذلك أُقرّت النسخة المطروحة.${later.ar}`)
      ),
      url: voteUrl(p.projectId, 'decision', p.decisionId)
    }
  ];
  if (p.endedMemberId != null) {
    out.push({
      kind: 'decision',
      intent: 'personal',
      to: { userIds: [p.endedMemberId] },
      title: L('החברות שלך ברקמה הסתיימה', 'Your membership in the rikma ended', 'انتهت عضويتك في الريكما'),
      body: L(
        `"${p.decisionName}" אושרה בשתיקה, וזו הייתה ההתחייבות האחרונה שלך ברקמה — ולכן החברות בה הסתיימה, כפי שנאמר בהצעה.`,
        `"${p.decisionName}" was approved by silence, and it was your last commitment in the rikma — so your membership ended, as the proposal said it would.`,
        `تمت الموافقة على «${p.decisionName}» بالصمت، وكان آخر التزام لك في الريكما — لذلك انتهت عضويتك كما ذُكر في الاقتراح.`
      ),
      url: '/lev'
    });
  }
  return out;
}

/** The members' silence is theirs; the customer of the deal still has to sign (C-14). */
export function decisionAwaitsCustomer(p: { projectId: Id; decisionName: string; clientIds: Id[] }): MaturedNotice {
  return {
    kind: 'decision',
    intent: 'consent',
    to: { userIds: p.clientIds },
    title: L('גרסה חדשה מחכה לחתימה שלך', 'A new version waits for your signature', 'نسخة جديدة بانتظار توقيعك'),
    body: L(
      `הרקמה לא התנגדה ל"${p.decisionName}" בזמן התגובה, אבל זה משנה חלק בעסקה שלך — ולכן זה ייכנס לתוקף רק אחרי החתימה שלך. אפשר גם לדון או להציע גרסה אחרת.`,
      `The rikma raised no objection to "${p.decisionName}" in time, but it changes a part of your deal — so it takes effect only once you sign. You can also discuss it or propose another version.`,
      `لم تعترض الريكما على «${p.decisionName}» في الوقت المحدد، لكنه يغيّر جزءًا من صفقتك — لذلك لن يسري إلا بعد توقيعك. يمكنك أيضًا النقاش أو اقتراح نسخة أخرى.`
    ),
    url: '/deals'
  };
}

/** Everyone else's silence counts; the funder's would be paying by saying nothing. */
export function stipendAwaitsFunder(p: { projectId: Id; decisionName: string; funderId: Id }): MaturedNotice {
  return {
    kind: 'decision',
    intent: 'consent',
    to: { userIds: [p.funderId] },
    title: L('המלגה מחכה לחתימה שלך', 'The stipend waits for your signature', 'المنحة بانتظار توقيعك'),
    body: L(
      `הרקמה לא התנגדה ל"${p.decisionName}" בזמן התגובה, אבל המימון יוצא ממך — ולכן הוא ייכנס לתוקף רק אחרי החתימה שלך. אפשר גם להציע תנאים אחרים.`,
      `The rikma raised no objection to "${p.decisionName}" in time, but the funding comes from you — so it takes effect only once you sign. You can also propose other terms.`,
      `لم تعترض الريكما على «${p.decisionName}» في الوقت المحدد، لكن التمويل منك — لذلك لن يسري إلا بعد توقيعك. يمكنك أيضًا اقتراح شروط أخرى.`
    ),
    url: moach(p.projectId, 'stipend')
  };
}

export function stipendApplied(p: { projectId: Id; decisionName: string }): MaturedNotice {
  return {
    kind: 'decision',
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: L(`"${p.decisionName}" אושרה בשתיקה`, `"${p.decisionName}" was approved by silence`, `تمت الموافقة على «${p.decisionName}» بالصمت`),
    body: after(SILENT, L('ולכן המלגה נכנסה לתוקף.', 'so the stipend takes effect.', 'لذلك أصبحت المنحة سارية.')),
    url: moach(p.projectId, 'stipend')
  };
}

/** A change to the rikma itself — name, picture, links, values, response time, look… */
export function rikmaDecisionApplied(p: { projectId: Id; decisionId: Id; decisionName?: string | null }): MaturedNotice {
  const name = p.decisionName?.trim();
  return {
    kind: 'decision',
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: name
      ? L(`"${name}" אושרה בשתיקה`, `"${name}" was approved by silence`, `تمت الموافقة على «${name}» بالصمت`)
      : L('הצעה לשינוי ברקמה אושרה בשתיקה', 'A change to the rikma was approved by silence', 'تمت الموافقة على تغيير في الريكما بالصمت'),
    body: after(SILENT, L('ולכן השינוי נכנס לתוקף.', 'so the change takes effect.', 'لذلك أصبح التغيير ساريًا.')),
    url: voteUrl(p.projectId, 'decision', p.decisionId)
  };
}

/** A sale claim is bilateral: the reporter and the holder, nobody else. */
export function saleClaimMatured(p: { projectId: Id; holderId: Id; reporterId: Id }): MaturedNotice {
  return {
    kind: 'saleClaim',
    intent: 'personal',
    to: { userIds: [p.holderId, p.reporterId] },
    title: L('דיווח המכירה אושר בשתיקה', 'The sale report was approved by silence', 'تمت الموافقة على تقرير البيع بالصمت'),
    body: L(
      'לא התקבלה תשובה בזמן התגובה של הרקמה, ולכן הגרסה האחרונה של הדיווח אושרה והמכירה נספרת עכשיו ביתרות.',
      "No answer came within the rikma's response time, so the latest version of the report stands and the sale now counts in the balances.",
      'لم يصل ردّ خلال وقت الاستجابة في الريكما، لذلك أُقرّت آخر نسخة من التقرير وأصبح البيع محسوبًا في الأرصدة.'
    ),
    url: moach(p.projectId, 'sales')
  };
}

// ── money / services / resources ───────────────────────────────────────────

export function tosplitMatured(p: { projectId: Id }): MaturedNotice {
  return {
    kind: 'tosplit',
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: L('חלוקת הרווחים אושרה בשתיקה', 'The profit split was approved by silence', 'تمت الموافقة على تقسيم الأرباح بالصمت'),
    body: after(SILENT, L('ולכן החלוקה נכנסה לתוקף.', 'so the split takes effect.', 'لذلك أصبح التقسيم ساريًا.')),
    url: moach(p.projectId, 'split')
  };
}

export function maapSettled(p: { projectId: Id; name: string }): MaturedNotice {
  return {
    kind: 'maap',
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: L(`המחזור של "${p.name}" אושר בשתיקה`, `This cycle of "${p.name}" was approved by silence`, `تمت الموافقة على دورة «${p.name}» بالصمت`),
    body: after(SILENT, L('ולכן ההוצאה של המחזור נרשמה.', "so the cycle's expense is recorded.", 'لذلك سُجّلت نفقة هذه الدورة.')),
    url: moach(p.projectId, 'resources')
  };
}

export function sheirutApproved(p: { projectId: Id; name: string }): MaturedNotice {
  return {
    kind: 'sheirutpend',
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: L(`השירות "${p.name}" אושר בשתיקה`, `The service "${p.name}" was approved by silence`, `تمت الموافقة على الخدمة «${p.name}» بالصمت`),
    body: after(SILENT, L('ולכן השירות נכנס לקטלוג של הרקמה.', "so the service joins the rikma's catalogue.", 'لذلك انضمّت الخدمة إلى كتالوج الريكما.')),
    url: moach(p.projectId, 'services')
  };
}

/** A customer's price quote: she and the rikma both hear the deal is open. */
export function quoteMatured(p: { projectId: Id; productName: string; customerId: Id }): MaturedNotice[] {
  return [
    {
      kind: 'sheirutpend',
      intent: 'personal',
      to: { userIds: [p.customerId] },
      title: L(`הצעת המחיר ל"${p.productName}" אושרה`, `The quote for "${p.productName}" was approved`, `تمت الموافقة على عرض السعر لـ«${p.productName}»`),
      body: L(
        'לא התקבלה תשובה בזמן התגובה, ולכן הגרסה האחרונה של הצעת המחיר אושרה והעסקה נפתחה.',
        'No answer came within the response time, so the latest version of the quote stands and the deal is open.',
        'لم يصل ردّ خلال وقت الاستجابة، لذلك أُقرّت آخر نسخة من عرض السعر وفُتحت الصفقة.'
      ),
      url: '/deals'
    },
    {
      kind: 'sheirutpend',
      intent: 'outcome',
      to: { projectId: p.projectId, except: [p.customerId] },
      title: L(`הצעת המחיר ל"${p.productName}" אושרה`, `The quote for "${p.productName}" was approved`, `تمت الموافقة على عرض السعر لـ«${p.productName}»`),
      body: L(
        'לא התקבלה תשובה בזמן התגובה, ולכן הגרסה האחרונה של הצעת המחיר אושרה והעסקה עם הלקוח נפתחה.',
        'No answer came within the response time, so the latest version of the quote stands and the deal with the customer is open.',
        'لم يصل ردّ خلال وقت الاستجابة، لذلك أُقرّت آخر نسخة من عرض السعر وفُتحت الصفقة مع العميل.'
      ),
      url: moach(p.projectId, 'sales')
    }
  ];
}

export function askwantApproved(p: { requesterId: Id; name?: string | null }): MaturedNotice {
  const n = p.name?.trim();
  return {
    kind: 'askwant',
    intent: 'personal',
    to: { userIds: [p.requesterId] },
    title: n
      ? L(`הבקשה שלך לקבל את "${n}" התקבלה`, `Your request to receive "${n}" was accepted`, `قُبل طلبك للحصول على «${n}»`)
      : L('הבקשה שלך לקבל את השירות התקבלה', 'Your request to receive the service was accepted', 'قُبل طلبك للحصول على الخدمة'),
    body: L(
      'הרקמה אישרה, ובלי התנגדות בזמן התגובה הבקשה נכנסה לתוקף — נרשמת לשירות.',
      'The rikma approved, and with no objection in time the request took effect — you are signed up for the service.',
      'وافقت الريكما، ودون اعتراض في الوقت المحدد أصبح الطلب ساريًا — أنت مسجّل في الخدمة.'
    ),
    url: '/deals'
  };
}

export function stipendPaymentConfirmed(p: {
  projectId: Id;
  projectName: string;
  amount: number;
  moved: boolean;
  recipientId: Id;
  funderId: Id;
}): MaturedNotice[] {
  const tail = p.moved
    ? L(' האחוזים עודכנו בהתאם.', ' The shares moved accordingly.', ' وتحدّثت الحصص وفقًا لذلك.')
    : L('', '', '');
  const url = moach(p.projectId, 'stipend');
  return [
    {
      kind: 'stipend_payment',
      intent: 'personal',
      to: { userIds: [p.recipientId] },
      title: L('המלגה אושרה מעצמה', 'Your stipend was confirmed automatically', 'تم تأكيد منحتك تلقائيًا'),
      body: L(
        `לא הגיבו בזמן התגובה של ${p.projectName}, ולכן ₪${p.amount} נרשמו כהתקבלו.${tail.he} אם לא הגיע כסף — אפשר לומר את זה בקלף המלגה ולפתוח את המחזור מחדש.`,
        `Nobody answered within ${p.projectName}'s response time, so ${p.amount} is recorded as received.${tail.en} If no money actually arrived, say so on the stipend card and the cycle reopens.`,
        `لم يردّ أحد خلال وقت الاستجابة في ${p.projectName}، لذلك سُجّل المبلغ ${p.amount} كمستلَم.${tail.ar} إن لم يصل المال فعلًا، قل ذلك في بطاقة المنحة لتُفتح الدورة من جديد.`
      ),
      url
    },
    {
      kind: 'stipend_payment',
      intent: 'personal',
      to: { userIds: [p.funderId] },
      title: L('המלגה נרשמה כהתקבלה', 'Your stipend is recorded as received', 'سُجّلت المنحة كمستلَمة'),
      body: L(
        `לא התקבלה תגובה בזמן, ולכן ₪${p.amount} ב${p.projectName} נסגרו כהתקבלו.${tail.he}`,
        `No answer came in time, so ${p.amount} in ${p.projectName} closed as received.${tail.en}`,
        `لم يصل ردّ في الوقت المحدد، لذلك أُغلق المبلغ ${p.amount} في ${p.projectName} كمستلَم.${tail.ar}`
      ),
      url
    }
  ];
}

// ── lifecycle ──────────────────────────────────────────────────────────────

/**
 * A mission nobody touched for its dormancy period: a release proposal opened.
 * It waits on everyone — the assignee most of all, whose silence releases it.
 */
export function dormancyOpened(p: { projectId: Id; decisionId: Id; name: string; ownerId: Id }): MaturedNotice[] {
  const url = voteUrl(p.projectId, 'decision', p.decisionId);
  return [
    {
      kind: 'mesimabetahalich',
      intent: 'consent',
      to: { userIds: [p.ownerId] },
      title: L(`המשימה "${p.name}" עומדת להשתחרר`, `The mission "${p.name}" is about to be released`, `المهمة «${p.name}» على وشك أن تُحرَّر`),
      body: L(
        'לא נרשמה במשימה פעילות כבר זמן רב, ולכן נפתחה הצעה להחזיר אותה לרקמה. אם היא עדיין אצלך, אפשר להציע להשאיר אותה; בלי תגובה בזמן התגובה של הרקמה, היא תשתחרר.',
        "No activity was logged on the mission for a long time, so a proposal opened to return it to the rikma. If it is still yours, you can propose to keep it; with no answer within the rikma's response time, it is released.",
        'لم يُسجَّل أي نشاط في المهمة منذ مدة طويلة، لذلك فُتح اقتراح بإعادتها إلى الريكما. إن كانت لا تزال لديك يمكنك اقتراح إبقائها؛ وإن لم تردّ خلال وقت الاستجابة ستُحرَّر.'
      ),
      url
    },
    {
      kind: 'mesimabetahalich',
      intent: 'consent',
      to: { projectId: p.projectId, except: [p.ownerId] },
      title: L(`הצעה לשחרר את "${p.name}"`, `A proposal to release "${p.name}"`, `اقتراح بتحرير «${p.name}»`),
      body: L(
        'לא נרשמה במשימה פעילות כבר זמן רב, ולכן נפתחה הצעה להחזיר אותה לרקמה. בלי התנגדות בזמן התגובה, היא תשתחרר.',
        'No activity was logged on the mission for a long time, so a proposal opened to return it to the rikma. With no objection within the response time, it is released.',
        'لم يُسجَّل أي نشاط في المهمة منذ مدة طويلة، لذلك فُتح اقتراح بإعادتها إلى الريكما. دون اعتراض خلال وقت الاستجابة ستُحرَّر.'
      ),
      url
    }
  ];
}

/** An archive the rikma agreed to "at the end of the cycle" — today is that day. */
export function archiveTookEffect(p: { projectId: Id; name: string; kind: 'mashabetahalich' | 'matanot' }): MaturedNotice {
  return {
    kind: p.kind,
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: L(`"${p.name}" הוסר מהרקמה כמתוכנן`, `"${p.name}" was removed from the rikma as planned`, `أُزيل «${p.name}» من الريكما كما هو مخطط`),
    body: L(
      'ההסרה אושרה קודם לכן, ונכנסה לתוקף היום, בסוף המחזור.',
      'The removal was approved earlier and took effect today, at the end of the cycle.',
      'تمت الموافقة على الإزالة سابقًا، وأصبحت سارية اليوم في نهاية الدورة.'
    ),
    url: moach(p.projectId, p.kind === 'matanot' ? 'sales' : 'resources')
  };
}

export function rosterClosed(p: { projectId: Id }): MaturedNotice {
  return {
    kind: 'roster_period',
    intent: 'outcome',
    to: { projectId: p.projectId },
    title: L('סידור המשמרות נקבע', 'The shift roster is set', 'تم تثبيت جدول المناوبات'),
    body: L(
      'זמן התגובה על הטיוטה הסתיים, ולכן הסידור נסגר כפי שהוא.',
      'The response time on the draft is over, so the roster is closed as it stands.',
      'انتهى وقت الاستجابة على المسودة، لذلك أُغلق الجدول كما هو.'
    ),
    url: moach(p.projectId, 'shifts')
  };
}
