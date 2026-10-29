import { describe, it, expect } from 'vitest';
import { extractDecisions } from './levDataExtractors';

/** TIMEGRAMA_REMINDERS R2 — an open askwant becomes a vote card in the heart. */
function user(askwants: any[]) {
  return {
    id: '1',
    attributes: { projects_1s: { data: [{ id: '7', attributes: { decisions: { data: [] }, askwants: { data: askwants } } }] } }
  };
}

const sheirut = (attrs: Record<string, unknown> = {}) => ({
  data: { id: '40', attributes: { name: 'ייעוץ', descrip: 'שעה בחודש', isApruved: true, archived: false, ...attrs } }
});

const askwant = (attrs: Record<string, unknown> = {}) => ({
  id: '90',
  attributes: {
    createdAt: '2026-10-01T00:00:00.000Z',
    vots: [],
    users_permissions_user: { data: { id: '5', attributes: { username: 'dana' } } },
    sheirut: sheirut(),
    timegrama: { data: { id: '300', attributes: { date: '2026-10-03T00:00:00.000Z', done: false } } },
    ...attrs
  }
});

describe('extractDecisions — askwants', () => {
  it('an open request is a decision of kind askwants, with who asks for what', () => {
    const [d] = extractDecisions(user([askwant()])) as any[];
    expect(d).toMatchObject({
      id: '90',
      projectId: '7',
      kind: 'askwants',
      askwant: { requesterId: '5', requesterName: 'dana', sheirutName: 'ייעוץ', sheirutDescrip: 'שעה בחודש' },
      timegramaId: '300',
      timegramaDate: '2026-10-03T00:00:00.000Z'
    });
  });

  it('a clock that already ran out shows no deadline', () => {
    const [d] = extractDecisions(
      user([askwant({ timegrama: { data: { id: '300', attributes: { date: '2023-01-01T00:00:00.000Z', done: true } } } })])
    ) as any[];
    expect(d.timegramaDate).toBeUndefined();
  });

  it('nothing to vote on when the service is not published or was archived', () => {
    expect(extractDecisions(user([askwant({ sheirut: sheirut({ isApruved: false }) })]))).toHaveLength(0);
    expect(extractDecisions(user([askwant({ sheirut: sheirut({ archived: true }) })]))).toHaveLength(0);
    expect(extractDecisions(user([askwant({ sheirut: { data: null } })]))).toHaveLength(0);
  });
});
