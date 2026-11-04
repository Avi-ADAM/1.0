import { describe, expect, it } from 'vitest';
import { mergedKeepPatch, mergeNoteOf, mergeRefusal, type MergeSide } from './merge';
import { csvCell, pipelineCsv, type CsvLabels } from './csv';
import { buildPipeline, groupByStage } from './pipeline';
import { normalizeOrigin, publicLeadKeyRefusal } from '$lib/server/leadsApi';

const side = (over: Partial<MergeSide> = {}): MergeSide => ({
  id: '1',
  status: 'talking',
  email: null,
  phone: null,
  organization: null,
  city: null,
  address: null,
  message: null,
  nextAction: null,
  followUpAt: null,
  lastActivityAt: null,
  dedupeKey: null,
  orderIds: [],
  productIds: [],
  ...over
});

describe('merge', () => {
  it('fills only the gaps, never overwrites, and keeps both contact keys', () => {
    const keep = side({ id: '1', phone: '0501', organization: 'A', dedupeKey: 'p:aaa', productIds: ['5'] });
    const dup = side({
      id: '2',
      phone: '0502',
      email: 'd@x.co',
      organization: 'B',
      city: 'Haifa',
      dedupeKey: 'p:bbb|e:ccc',
      orderIds: ['40'],
      productIds: ['5', '6']
    });
    expect(mergedKeepPatch(keep, dup)).toEqual({
      email: 'd@x.co',
      city: 'Haifa',
      dedupeKey: 'p:aaa|p:bbb|e:ccc',
      orders: ['40'],
      products: ['5', '6']
    });
  });

  it('the earlier day to get back stands; the latest activity wins; messages are kept side by side', () => {
    const keep = side({ followUpAt: '2026-12-10T09:00:00Z', lastActivityAt: '2026-11-01T09:00:00Z', message: 'first' });
    const dup = side({ id: '2', followUpAt: '2026-12-01T09:00:00Z', lastActivityAt: '2026-11-03T09:00:00Z', message: 'second' });
    const p = mergedKeepPatch(keep, dup);
    expect(p.followUpAt).toBe('2026-12-01T09:00:00Z');
    expect(p.lastActivityAt).toBe('2026-11-03T09:00:00Z');
    expect(p.message).toContain('first');
    expect(p.message).toContain('second');
  });

  it('refuses itself, an anonymized lead, and a lead already put away', () => {
    expect(mergeRefusal(side(), side())).toBe('SAME_LEAD');
    expect(mergeRefusal(side(), side({ id: '2', anonymizedAt: '2026-01-01' }))).toBe('ANONYMIZED');
    expect(mergeRefusal(side({ status: 'spam' }), side({ id: '2' }))).toBe('ALREADY_MERGED');
    expect(mergeRefusal(side(), side({ id: '2' }))).toBeNull();
  });

  it('reads its own log line back', () => {
    expect(mergeNoteOf('mergedInto:77')).toEqual({ dir: 'into', id: '77' });
    expect(mergeNoteOf('mergedFrom:9')).toEqual({ dir: 'from', id: '9' });
    expect(mergeNoteOf('anything else')).toBeNull();
  });
});

describe('csv', () => {
  const labels: CsvLabels = {
    headers: {
      kind: 'kind',
      name: 'name',
      organization: 'org',
      source: 'source',
      products: 'products',
      stage: 'stage',
      owner: 'owner',
      last: 'last',
      followUp: 'followUp',
      next: 'next',
      phone: 'phone',
      email: 'email'
    },
    kind: (k) => k,
    source: (s) => s,
    stage: (s) => s
  };
  const rows = buildPipeline(
    {
      leads: [
        {
          id: '1',
          name: '=HYPERLINK("http://evil")',
          organization: 'Herzl 12, Haifa',
          status: 'new',
          source: 'form',
          sourceLabel: null,
          ownerId: null,
          ownerName: null,
          actId: null,
          followUpAt: null,
          nextAction: null,
          lastActivityAt: null,
          createdAt: '2026-11-04T10:00:00Z',
          pausedReason: null,
          products: [],
          orderIds: [],
          orderStatuses: [],
          estimatedValue: null,
          currency: null
        }
      ],
      orders: [],
      proposals: []
    },
    Date.parse('2026-11-04T11:00:00Z'),
    { leadResponseHours: 24, leadStaleDays: 7 }
  );

  it('defuses formulas a stranger typed, and quotes commas', () => {
    expect(csvCell('=1+1')).toBe("'=1+1");
    expect(csvCell('-5')).toBe("'-5");
    expect(csvCell('a, b')).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
  });

  it('no contact columns unless asked; with them, only for leads', () => {
    const plain = pipelineCsv(rows, labels);
    expect(plain.startsWith('﻿')).toBe(true);
    expect(plain).not.toContain('phone');
    expect(plain).toContain(`"'=HYPERLINK(""http://evil"")"`);
    const withContacts = pipelineCsv(rows, labels, new Map([['1', { phone: '050', email: 'a@b.co' }]]));
    expect(withContacts.split('\r\n')[1].endsWith(',050,a@b.co')).toBe(true);
  });

  it('groups the board by stage, in path order', () => {
    const cols = groupByStage(rows, ['new', 'contacted']);
    expect(cols.map((c) => [c.stage, c.rows.length])).toEqual([
      ['new', 1],
      ['contacted', 0]
    ]);
  });
});

describe('public lead keys', () => {
  it('a public form key is alone on its key, and names its site', () => {
    expect(publicLeadKeyRefusal(['leads:create'], [])).toBeNull();
    expect(publicLeadKeyRefusal(['leads:create:public', 'leads:read'], ['https://a.example'])).toMatch(/own/);
    expect(publicLeadKeyRefusal(['leads:create:public'], [])).toMatch(/allowedOrigins/);
    expect(publicLeadKeyRefusal(['leads:create:public'], ['https://a.example'])).toBeNull();
  });

  it('origins are just scheme and host', () => {
    expect(normalizeOrigin('https://Vaad.example/contact?x=1')).toBe('https://vaad.example');
    expect(normalizeOrigin('ftp://x.example')).toBeNull();
    expect(normalizeOrigin('not a url')).toBeNull();
  });
});
