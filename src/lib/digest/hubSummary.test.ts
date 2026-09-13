import { describe, expect, it } from 'vitest';
import { isUrgent, needsOrderedVote, needsSimpleVote, processHubSummary } from './hubSummary';

const NOW = Date.parse('2026-09-11T06:00:00.000Z');
const HOUR = 60 * 60 * 1000;
const at = (ms: number) => new Date(ms).toISOString();
const vote = (uid: string, order?: number) => ({
  what: true,
  order,
  users_permissions_user: { data: { id: uid } }
});
const tg = (date: string | null) => ({ data: date ? { attributes: { date } } : null });

function raw(project: Record<string, unknown>, extra: Record<string, unknown> = {}) {
  return {
    data: {
      usersPermissionsUser: {
        data: {
          id: '7',
          attributes: {
            username: 'dana',
            projects_1s: { data: [{ id: '3', attributes: { projectName: 'Garden', ...project } }] },
            ...extra
          }
        }
      }
    }
  };
}

describe('vote predicates', () => {
  it('simple vote: owed until the user has any vote entry', () => {
    expect(needsSimpleVote([], '7')).toBe(true);
    expect(needsSimpleVote([vote('8')], '7')).toBe(true);
    expect(needsSimpleVote([vote('7')], '7')).toBe(false);
  });

  it('ordered vote: owed again when a new round opens', () => {
    expect(needsOrderedVote([vote('7', 1)], 1, '7')).toBe(false);
    // someone countered → round 2; the user's round-1 vote no longer covers it
    expect(needsOrderedVote([vote('7', 1), vote('8', 2)], 1, '7')).toBe(true);
    // the nego count alone can open the round
    expect(needsOrderedVote([vote('7', 1)], 2, '7')).toBe(true);
  });

  it('matches a numeric uid against string GraphQL ids', () => {
    expect(needsSimpleVote([vote('7')], 7 as unknown as string)).toBe(false);
  });

  it('urgent = deadline inside the next 24h, not in the past', () => {
    expect(isUrgent(at(NOW + 2 * HOUR), NOW)).toBe(true);
    expect(isUrgent(at(NOW + 30 * HOUR), NOW)).toBe(false);
    expect(isUrgent(at(NOW - HOUR), NOW)).toBe(false);
    expect(isUrgent(null, NOW)).toBe(false);
  });
});

describe('processHubSummary', () => {
  it('returns the empty summary for a missing user', () => {
    const s = processHubSummary({ data: { usersPermissionsUser: { data: null } } }, '7', NOW);
    expect(s.kpi.votes).toBe(0);
    expect(s.feed).toEqual([]);
    expect(s.projectIds).toEqual([]);
  });

  it('counts owed votes across kinds and sorts urgent first', () => {
    const s = processHubSummary(
      raw({
        decisions: {
          data: [
            { id: '1', attributes: { vots: [], createdAt: at(NOW - 50 * HOUR), timegrama: tg(at(NOW + 40 * HOUR)) } }
          ]
        },
        finiapruvals: {
          data: [
            { id: '2', attributes: { missname: 'Fence', vots: [], timegrama: tg(at(NOW + 3 * HOUR)) } },
            { id: '9', attributes: { missname: 'Done', vots: [vote('7')], timegrama: tg(null) } }
          ]
        },
        tosplits: { data: [{ id: '4', attributes: { name: 'Q3 split', vots: [vote('8', 1)] } }] }
      }),
      '7',
      NOW
    );
    expect(s.kpi.votes).toBe(3);
    expect(s.kpi.urgent).toBe(1);
    expect(s.feed.map((f) => `${f.type}:${f.id}`)).toEqual(['fiapp:2', 'hachla:1', 'haluk:4']);
    expect(s.topFive).toHaveLength(3);
    expect(s.projectIds).toEqual(['3']);
    expect(s.feed[0]).toMatchObject({ projectId: '3', projectName: 'Garden', urgent: true, title: 'Fence' });
  });

  it('topFive is the head of the full feed', () => {
    const decisions = Array.from({ length: 7 }, (_, i) => ({ id: String(i), attributes: { vots: [] } }));
    const s = processHubSummary(raw({ decisions: { data: decisions } }), '7', NOW);
    expect(s.feed).toHaveLength(7);
    expect(s.topFive).toEqual(s.feed.slice(0, 5));
  });

  it('keeps the hub KPIs it always had', () => {
    const s = processHubSummary(
      raw(
        { sheiruts: { data: [{ attributes: { moneyTransfered: true, productExepted: false } }] } },
        {
          sheiruts: { data: [{ attributes: { moneyTransfered: true, productExepted: true } }] },
          mesimabetahaliches: { data: [{ id: '1' }, { id: '2' }] }
        }
      ),
      '7',
      NOW
    );
    expect(s.kpi).toMatchObject({ activePurchases: 0, activeSales: 1, suggestions: 2 });
    expect(s.username).toBe('dana');
  });
});
