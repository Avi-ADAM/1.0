/**
 * The sentence a notification says about one rikma vote — the same sentence the
 * heart's notice view shows for that item (`lev.ts`), built from the light read
 * the server does when it sends (qid `460noticeSubject`) instead of from the
 * heart's processed cards, which only a browser page has.
 *
 * Same keys (`notices.lev.*`), same figures (`lev.list.fact.*`), same rules: no
 * gendered verb, a name only where the data has one, and the figures on the
 * table — the standing round when there is a counter, the item as it is when
 * there is none. Pure: the server loads, this words, the tests pin it.
 */

import { k, term, terms, txt, type NoticeTerm, type NoticeText } from './types';
import { ANI_OF, decisionAni, type SubjectKind } from './links';
import { isHoursApproval } from '$lib/finiapruval/kind';

export interface SubjectNotice {
  /** The heart card kind it is — a decision's depends on what it decides. */
  ani: string;
  sentence: NoticeText;
  terms: NoticeTerm[];
  /** When silence completes it (the item's timegrama), if a clock runs. */
  deadline: string | null;
}

/** Decision kinds that change a field of the rikma — each has a label in `lev.list.decision`. */
const FIELD_DECISIONS = new Set([
  'name', 'pubdes', 'prides', 'newFlink', 'newWlink', 'timtoM',
  'vallueadd', 'vallueles', 'pic', 'codeLicense', 'address', 'look'
]);

type Rel = { data?: any } | null | undefined;
const one = (rel: Rel): any => rel?.data?.attributes ?? null;
const latest = (rel: Rel): any => (Array.isArray(rel?.data) ? (rel!.data[0]?.attributes ?? null) : null);
const username = (rel: Rel) => txt(one(rel)?.username);
const deadlineOf = (e: any): string | null => {
  const d = one(e?.timegrama)?.date;
  return d ? String(d) : null;
};

/** `who` with the sentence that has it, the `…Anon` one without. */
const said = (key: string, who: NoticeText | null, params: Record<string, NoticeText | null>) =>
  k(who ? key : `${key}Anon`, { who, ...params });

export interface SubjectNoticeOptions {
  /**
   * Who did what the notification reports — the proposer of a decision round, the
   * one countering it. Used where the item itself does not name its party.
   */
  actorName?: string | null;
}

/**
 * The notice for the subject's read (`data` is the query's `data` root), or null
 * when the item is not there — deleted, or the read failed — so the caller keeps
 * the template it already has.
 */
export function subjectNoticeFrom(
  kind: SubjectKind,
  data: any,
  opts: SubjectNoticeOptions = {}
): SubjectNotice | null {
  const rikma = txt(one(data?.project)?.projectName);
  const someItem = k('notices.lev.someItem');
  const actor = txt(opts.actorName);

  switch (kind) {
    case 'pendm': {
      const e = one(data?.pendm);
      if (!e) return null;
      const n = latest(e.negopendmissions);
      return {
        ani: ANI_OF.pendm,
        sentence: k('notices.lev.pends', { item: txt(n?.name) ?? txt(e.name) ?? someItem, rikma }),
        terms: terms(term('hours', n?.noofhours ?? e.noofhours), term('rate', n?.perhour ?? e.perhour)),
        deadline: deadlineOf(e)
      };
    }

    case 'pmash': {
      const e = one(data?.pmash);
      if (!e) return null;
      const n = latest(e.nego_mashes);
      return {
        ani: ANI_OF.pmash,
        sentence: k('notices.lev.pmashes', { item: txt(n?.name) ?? txt(e.name) ?? someItem, rikma }),
        terms: terms(term('qty', n?.hm ?? e.hm), term('price', n?.price ?? e.price), term('amount', n?.easy ?? e.easy)),
        deadline: deadlineOf(e)
      };
    }

    case 'ask': {
      const e = one(data?.ask);
      if (!e) return null;
      const n = latest(e.negopendmissions);
      const om = one(e.open_mission);
      return {
        ani: ANI_OF.ask,
        sentence: said('notices.lev.askedcoin', username(e.users_permissions_user), {
          item: txt(n?.name) ?? txt(om?.name) ?? someItem,
          rikma
        }),
        terms: terms(term('hours', n?.noofhours ?? om?.noofhours), term('rate', n?.perhour ?? om?.perhour)),
        deadline: deadlineOf(e)
      };
    }

    case 'askm': {
      const e = one(data?.askm);
      if (!e) return null;
      const n = latest(e.nego_mashes);
      const om = one(e.open_mashaabim);
      const pm = one(e.pmash);
      const sp = one(e.sp);
      return {
        ani: ANI_OF.askm,
        sentence: said('notices.lev.askedm', username(e.users_permissions_user), {
          item: txt(n?.name) ?? txt(om?.name) ?? txt(pm?.name) ?? txt(sp?.name) ?? someItem,
          rikma
        }),
        terms: terms(
          term('qty', n?.hm ?? om?.hm ?? pm?.hm ?? sp?.myp),
          term('price', n?.price ?? om?.price ?? pm?.price ?? sp?.price),
          term('amount', n?.easy ?? om?.easy ?? pm?.easy)
        ),
        deadline: deadlineOf(e)
      };
    }

    case 'fini': {
      const e = one(data?.finiapruval);
      if (!e) return null;
      const m = one(e.mesimabetahalich);
      // Logged hours and "this mission is done" share the model; saying "done"
      // about a saved timer would tell every member the mission is closing.
      const key = isHoursApproval(e) ? 'notices.lev.fiappHours' : 'notices.lev.fiapp';
      return {
        ani: ANI_OF.fini,
        sentence: said(key, username(e.users_permissions_user), {
          item: txt(e.missname) ?? txt(m?.name) ?? someItem,
          rikma
        }),
        terms: terms(term('hours', e.noofhours), term('rate', e.perhour ?? m?.perhour)),
        deadline: deadlineOf(e)
      };
    }

    case 'tosplit': {
      const e = one(data?.tosplit);
      if (!e) return null;
      return {
        ani: ANI_OF.tosplit,
        sentence: k('notices.lev.haluk', { item: txt(e.name) ?? someItem, rikma }),
        terms: [],
        deadline: deadlineOf(e)
      };
    }

    case 'maap': {
      const e = one(data?.maap);
      if (!e) return null;
      const mash = one(e.mashabetahalich);
      return {
        ani: ANI_OF.maap,
        sentence: said('notices.lev.wegets', username(mash?.users_permissions_user), {
          item: txt(e.name) ?? txt(one(e.pmash)?.name) ?? txt(mash?.name) ?? someItem,
          rikma
        }),
        terms: terms(term('qty', e.quantityDelivered)),
        deadline: deadlineOf(e)
      };
    }

    case 'decision': {
      const e = one(data?.decision);
      if (!e) return null;
      const dk = e.kind ? String(e.kind) : '';
      const base = { ani: decisionAni(dk), terms: [] as NoticeTerm[], deadline: deadlineOf(e) };

      if (dk === 'archiveObject' || dk === 'editObject') {
        const target =
          txt(one(e.archOpenMission)?.name) ??
          txt(one(e.archMesimabetahalich)?.name) ??
          txt(one(e.archOpenMashaabim)?.name) ??
          txt(one(e.archMashabetahalich)?.name) ??
          txt(one(e.archMatanot)?.name) ??
          someItem;
        const verb = dk === 'editObject' ? 'edit' : e.archScope === 'release' ? 'release' : 'archive';
        return { ...base, sentence: said(`notices.lev.${verb}`, actor, { item: target, rikma }) };
      }

      const what: NoticeText = FIELD_DECISIONS.has(dk)
        ? k(`lev.list.decision.${dk}`)
        : dk === 'saleClaim'
          ? k('lev.list.decision.saleClaim')
          : dk === 'stipendPledge' || dk === 'stipendProgram'
            ? k(dk === 'stipendProgram' ? 'lev.list.kind.stipendProgram' : 'lev.list.kind.stipend')
            : (txt(e.decisionName) ?? txt(e.newname) ?? k('lev.list.decision.generic'));
      return { ...base, sentence: k('notices.lev.decision', { what, rikma }) };
    }
  }
  return null;
}

/** The `$is*` switches of qid 460 — exactly one on. */
export function subjectQueryFlags(kind: SubjectKind): Record<string, boolean> {
  return {
    isPendm: kind === 'pendm',
    isPmash: kind === 'pmash',
    isAsk: kind === 'ask',
    isAskm: kind === 'askm',
    isFini: kind === 'fini',
    isTosplit: kind === 'tosplit',
    isDecision: kind === 'decision',
    isMaap: kind === 'maap'
  };
}
