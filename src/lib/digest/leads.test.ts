import { describe, expect, it } from 'vitest';
import { emptyLeadsDigest, processLeads } from './leads';

const NOW = Date.parse('2026-11-04T12:00:00Z');
const H = 3600_000;
const iso = (agoMs: number) => new Date(NOW - agoMs).toISOString();

const lead = (id: string, a: Record<string, unknown>, project = { id: '57', name: 'הוועד', settings: null as any }) => ({
  id,
  attributes: {
    status: 'new',
    createdAt: iso(H),
    lastActivityAt: null,
    followUpAt: null,
    owner: { data: null },
    project: { data: { id: project.id, attributes: { projectName: project.name, leadSettings: project.settings } } },
    ...a
  }
});

describe('processLeads', () => {
  it("counts what is the reader's to answer: theirs and nobody's — not a teammate's", () => {
    const raw = {
      data: {
        leads: {
          data: [
            lead('1', { createdAt: iso(30 * H) }),
            lead('2', { createdAt: iso(30 * H), owner: { data: { id: '5' } } }),
            lead('3', { createdAt: iso(30 * H), owner: { data: { id: '6' } } }),
            lead('4', { status: 'paused', followUpAt: iso(H), owner: { data: { id: '5' } } }),
            lead('5', { createdAt: iso(H) })
          ]
        }
      }
    };
    expect(processLeads(raw, '5', NOW)).toEqual({
      attention: 3,
      projects: [
        {
          projectId: '57',
          projectName: 'הוועד',
          attention: 3,
          unanswered: 2,
          followUpDue: 1,
          url: '/moach/57/sales/manage/pipeline?attention=1'
        }
      ]
    });
  });

  it("uses each rikma's own response time, and orders rikmot by how much waits", () => {
    const slow = { id: '60', name: 'מתנדבים', settings: { leadResponseHours: 72 } };
    const other = { id: '61', name: 'חנות', settings: null };
    const raw = {
      data: {
        leads: {
          data: [
            lead('1', { createdAt: iso(30 * H) }, slow),
            lead('2', { createdAt: iso(30 * H) }, other),
            lead('3', { createdAt: iso(40 * H) }, other)
          ]
        }
      }
    };
    const d = processLeads(raw, '5', NOW);
    expect(d.attention).toBe(2);
    expect(d.projects.map((p) => [p.projectId, p.attention])).toEqual([['61', 2]]);
  });

  it('an empty or failed-shaped answer is no leads', () => {
    expect(processLeads({}, '5', NOW)).toEqual(emptyLeadsDigest());
  });
});

describe('the brief with leads', () => {
  it('a brief with only waiting enquiries is still worth sending', async () => {
    const { composeDigest, digestCounts } = await import('./compose');
    const { emptyHubSummary } = await import('./hubSummary');
    const { emptyWorkSummary } = await import('./work');
    const { emptySuggestionSummary } = await import('./suggestions');
    const { emptyWhatsNew } = await import('./whatsNew');
    const leads = processLeads({ data: { leads: { data: [lead('1', { createdAt: iso(30 * H) })] } } }, '5', NOW);
    const base = {
      userId: '5',
      hub: emptyHubSummary(),
      work: emptyWorkSummary(),
      suggestions: emptySuggestionSummary(),
      whatsNew: emptyWhatsNew(new Date(NOW - 24 * H).toISOString()),
      now: NOW
    };
    expect(composeDigest(base).isEmpty).toBe(true);
    const payload = composeDigest({ ...base, leads });
    expect(payload.isEmpty).toBe(false);
    expect(digestCounts(payload).leadsAttention).toBe(1);
  });
});
