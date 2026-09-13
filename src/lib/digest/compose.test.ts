import { describe, expect, it } from 'vitest';
import { composeDigest, digestCounts, normalizeLang, voteUrl } from './compose';
import { emptyHubSummary, type HubSummary } from './hubSummary';
import { emptySuggestionSummary, processSuggestions } from './suggestions';
import { emptyWhatsNew, processWhatsNew, resolveSince } from './whatsNew';
import { emptyWorkSummary } from './work';

const NOW = Date.parse('2026-09-11T06:00:00.000Z');
const HOUR = 60 * 60 * 1000;

function hubWith(feed: HubSummary['feed']): HubSummary {
  const s = emptyHubSummary();
  s.username = 'dana';
  s.feed = feed;
  s.topFive = feed.slice(0, 5);
  s.kpi.votes = feed.length;
  s.kpi.urgent = feed.filter((f) => f.urgent).length;
  return s;
}
const item = (id: string, urgent = false) => ({
  id,
  type: 'fiapp',
  title: `F${id}`,
  projectId: '3',
  projectName: 'Garden',
  urgent,
  deadline: null,
  createdAt: null
});

describe('resolveSince', () => {
  it('first digest = the last 24h', () => {
    expect(resolveSince(null, NOW)).toBe(new Date(NOW - 24 * HOUR).toISOString());
  });
  it('uses a sane cursor as is', () => {
    const c = new Date(NOW - 30 * HOUR).toISOString();
    expect(resolveSince(c, NOW)).toBe(c);
  });
  it('clamps an old cursor to a week and ignores a future or broken one', () => {
    expect(resolveSince('2020-01-01T00:00:00Z', NOW)).toBe(new Date(NOW - 7 * 24 * HOUR).toISOString());
    expect(resolveSince(new Date(NOW + HOUR).toISOString(), NOW)).toBe(new Date(NOW - 24 * HOUR).toISOString());
    expect(resolveSince('nonsense', NOW)).toBe(new Date(NOW - 24 * HOUR).toISOString());
  });
});

describe('processWhatsNew / processSuggestions', () => {
  it('sums count-only reads', () => {
    const since = resolveSince(null, NOW);
    const w = processWhatsNew(
      {
        data: {
          newMissions: { meta: { pagination: { total: 2 } } },
          newResources: { meta: { pagination: { total: 0 } } },
          newProducts: { meta: { pagination: { total: 1 } } },
          newSales: null
        }
      },
      since
    );
    expect(w).toEqual({ total: 3, byKind: { missions: 2, resources: 0, products: 1, sales: 0 }, since });
    expect(processWhatsNew({ errors: [{}] }, since).total).toBe(0);
  });

  it('merges both kinds of suggestion and keeps the top 3 by score', () => {
    const row = (id: string, score: number, rel: string) => ({
      id,
      attributes: { score, [rel]: { data: { id: 'x', attributes: { name: `N${id}`, project: { data: { id: '3', attributes: { projectName: 'Garden' } } } } } } }
    });
    const s = processSuggestions({
      data: {
        missionSuggestions: { meta: { pagination: { total: 5 } }, data: [row('1', 0.9, 'open_mission'), row('2', 0.4, 'open_mission')] },
        resourceSuggestions: { meta: { pagination: { total: 2 } }, data: [row('3', 0.7, 'open_mashaabim'), row('4', 0.1, 'open_mashaabim')] },
        freshMissionSuggestions: { meta: { pagination: { total: 1 } } },
        freshResourceSuggestions: { meta: { pagination: { total: 1 } } }
      }
    });
    expect(s.count).toBe(7);
    expect(s.fresh).toBe(2);
    expect(s.top.map((t) => `${t.kind}:${t.id}`)).toEqual(['mission:1', 'resource:3', 'mission:2']);
  });
});

describe('composeDigest', () => {
  const base = {
    userId: '7',
    work: emptyWorkSummary(),
    suggestions: emptySuggestionSummary(),
    whatsNew: emptyWhatsNew(resolveSince(null, NOW)),
    now: NOW
  };

  it('is empty when there is nothing at all to say', () => {
    const p = composeDigest({ ...base, hub: emptyHubSummary() });
    expect(p.isEmpty).toBe(true);
    expect(p.lang).toBe('he');
  });

  it('any section makes it non-empty', () => {
    const w = emptyWorkSummary();
    w.tasks.open = 1;
    expect(composeDigest({ ...base, hub: emptyHubSummary(), work: w }).isEmpty).toBe(false);
    expect(composeDigest({ ...base, hub: hubWith([item('1')]) }).isEmpty).toBe(false);
  });

  it('carries vote items with the hub deep link', () => {
    const p = composeDigest({ ...base, hub: hubWith([item('1', true), item('2')]), lang: 'ar' });
    expect(p.lang).toBe('ar');
    expect(p.sections.votes).toMatchObject({ count: 2, urgent: 1 });
    expect(p.sections.votes.items[0].url).toBe('/lev?focus=fiapp&project=3');
  });

  it('counts snapshot urgent keys from the whole feed, sorted', () => {
    const feed = Array.from({ length: 7 }, (_, i) => item(String(i), i === 6 || i === 2));
    const hub = hubWith(feed);
    const p = composeDigest({ ...base, hub });
    expect(digestCounts(p, hub).urgentKeys).toEqual(['fiapp:2', 'fiapp:6']);
  });
});

describe('helpers', () => {
  it('normalizeLang falls back to Hebrew', () => {
    expect(normalizeLang('en')).toBe('en');
    expect(normalizeLang('ru')).toBe('he');
    expect(normalizeLang(null)).toBe('he');
  });
  it('voteUrl omits an empty project', () => {
    expect(voteUrl({ type: 'hachla', projectId: '' })).toBe('/lev?focus=hachla');
  });
});
