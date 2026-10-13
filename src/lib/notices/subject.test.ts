import { describe, it, expect } from 'vitest';
import { subjectNoticeFrom, subjectQueryFlags } from './subject';
import { subjectLinks, noticeSubject, levFocusHref, decisionAni, ANI_OF, VOTE_KINDS } from './links';

const rel = (attributes: any) => ({ data: { id: '1', attributes } });
const many = (...list: any[]) => ({ data: list.map((attributes, i) => ({ id: String(i), attributes })) });
const project = rel({ projectName: 'Studio Gefen' });
const clock = rel({ date: '2026-10-20T17:47:00.000Z' });

describe('subjectLinks — both places to answer a vote', () => {
  it('the rikma vote page and the heart filtered to its kind and rikma', () => {
    expect(subjectLinks(noticeSubject('ask', 12, 5))).toEqual({
      rikma: '/moach/5/votes/ask/12',
      lev: '/lev?focus=askedcoin&project=5'
    });
  });

  it('a delivery report has no vote page — the heart only', () => {
    expect(subjectLinks(noticeSubject('maap', 3, 5))).toEqual({ rikma: null, lev: '/lev?focus=wegets&project=5' });
  });

  it('a decision of unknown kind shows all three decision cards; a known one, its own', () => {
    expect(subjectLinks(noticeSubject('decision', 9, 5))!.lev).toBe(levFocusHref('hachla,archObject,stipend', 5));
    expect(subjectLinks(noticeSubject('decision', 9, 5, 'archObject'))!.lev).toBe('/lev?focus=archObject&project=5');
    expect(decisionAni('editObject')).toBe('archObject');
    expect(decisionAni('stipendProgram')).toBe('stipend');
    expect(decisionAni('name')).toBe('hachla');
  });

  it('no id or no rikma — no subject, no links', () => {
    expect(noticeSubject('ask', undefined, 5)).toBeNull();
    expect(noticeSubject('ask', 3, '')).toBeNull();
    expect(subjectLinks(null)).toBeNull();
  });

  it('every vote kind has a heart card to focus on', () => {
    for (const kind of VOTE_KINDS) expect(ANI_OF[kind]).toBeTruthy();
  });
});

describe('subjectNoticeFrom — the heart notice sentence, from the server read', () => {
  it('a candidacy: who, which mission, the standing round over the original terms', () => {
    const n = subjectNoticeFrom('ask', {
      project,
      ask: rel({
        users_permissions_user: rel({ username: 'Dana' }),
        timegrama: clock,
        open_mission: rel({ name: 'Logo', noofhours: 5, perhour: 50 }),
        negopendmissions: many({ name: 'Logo', noofhours: 8, perhour: 60 })
      })
    })!;
    expect(n.sentence).toEqual({
      key: 'notices.lev.askedcoin',
      params: { who: { text: 'Dana' }, item: { text: 'Logo' }, rikma: { text: 'Studio Gefen' } }
    });
    expect(n.terms).toEqual([{ kind: 'hours', value: 8 }, { kind: 'rate', value: 60 }]);
    expect(n.deadline).toBe('2026-10-20T17:47:00.000Z');
    expect(n.ani).toBe('askedcoin');
  });

  it('no name on the item — the Anon sentence, never an empty "from"', () => {
    const n = subjectNoticeFrom('askm', { project, askm: rel({ open_mashaabim: rel({ name: 'Van', hm: 2 }) }) })!;
    expect((n.sentence as any).key).toBe('notices.lev.askedmAnon');
    expect(n.terms).toEqual([{ kind: 'qty', value: 2 }]);
  });

  it('a saved timer is an hours report, not "the mission is done"', () => {
    const hours = subjectNoticeFrom('fini', {
      project,
      finiapruval: rel({ missname: 'Logo', noofhours: 3, isTimerSave: true, users_permissions_user: rel({ username: 'Dana' }) })
    })!;
    expect((hours.sentence as any).key).toBe('notices.lev.fiappHours');
    const finish = subjectNoticeFrom('fini', { project, finiapruval: rel({ missname: 'Logo', noofhours: 3 }) })!;
    expect((finish.sentence as any).key).toBe('notices.lev.fiappAnon');
  });

  it('an archive proposal names its proposer (the actor) and its target', () => {
    const n = subjectNoticeFrom(
      'decision',
      { project, decision: rel({ kind: 'archiveObject', archScope: 'release', archOpenMission: rel({ name: 'Logo' }) }) },
      { actorName: 'Avi' }
    )!;
    expect(n.sentence).toEqual({
      key: 'notices.lev.release',
      params: { who: { text: 'Avi' }, item: { text: 'Logo' }, rikma: { text: 'Studio Gefen' } }
    });
    expect(n.ani).toBe('archObject');
  });

  it("a rikma field decision says which field, in the reader's words", () => {
    const n = subjectNoticeFrom('decision', { project, decision: rel({ kind: 'name' }) })!;
    expect(n.sentence).toEqual({
      key: 'notices.lev.decision',
      params: { what: { key: 'lev.list.decision.name' }, rikma: { text: 'Studio Gefen' } }
    });
  });

  it('a missing item is null — the template stays', () => {
    expect(subjectNoticeFrom('pendm', { project, pendm: { data: null } })).toBeNull();
    expect(subjectNoticeFrom('pendm', undefined)).toBeNull();
  });

  it('exactly one switch of the query is on', () => {
    for (const kind of [...VOTE_KINDS, 'maap'] as const) {
      expect(Object.values(subjectQueryFlags(kind)).filter(Boolean)).toHaveLength(1);
    }
  });
});
