import { describe, it, expect } from 'vitest';
// A plain node script, imported for its pure functions.
import { parseLines, summarize } from '../../../scripts/p2p-pilot-report.mjs';

const row = (o: Record<string, unknown>) => ({
  v: 1,
  pid: '1',
  outcome: 'origin',
  peerFailure: 'no-peer',
  peersAnswered: 0,
  candidate: null,
  bytes: 1000,
  ms: 100,
  peerMs: null,
  ...o
});

describe('p2p pilot report', () => {
  it('picks tagged lines out of a server log and ignores the rest', () => {
    const log = [
      'some unrelated line',
      `2026-09-19 [p2p-pilot-telemetry] ${JSON.stringify(row({}))}`,
      JSON.stringify(row({ outcome: 'cache' })),
      '[p2p-pilot-telemetry] {broken'
    ].join('\n');
    expect(parseLines(log)).toHaveLength(2);
  });

  it('computes availability, connectivity and TURN need on the right denominators', () => {
    const s = summarize([
      row({ outcome: 'cache', peerFailure: 'none' }), // excluded from all three
      row({ peerFailure: 'offline' }), // could not ask — not an availability miss
      row({ peerFailure: 'no-peer' }),
      row({ peerFailure: 'no-peer' }),
      row({ outcome: 'peer', peerFailure: 'none', peersAnswered: 1, candidate: 'srflx' }),
      row({ outcome: 'origin', peerFailure: 'ice', peersAnswered: 1 })
    ]);
    expect(s.availabilityPct).toBe(50); // 2 answered of 4 asked
    expect(s.connectivityPct).toBe(50); // 1 direct of 2 answered
    expect(s.turnNeededPct).toBe(50);
    expect(s.integrityPct).toBe(100);
    expect(s.enoughData).toBe(false);
  });

  it('flags a hash failure', () => {
    const s = summarize([
      row({ outcome: 'peer', peerFailure: 'none', peersAnswered: 1, candidate: 'host' }),
      row({ outcome: 'origin', peerFailure: 'hash', peersAnswered: 1, candidate: 'host' })
    ]);
    expect(s.hashFailures).toBe(1);
    expect(s.integrityPct).toBe(50);
  });
});
