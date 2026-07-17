/**
 * Coverage test for the /api/send permission manifest.
 *
 * Fails when qids.js and qidsAccess.js drift apart, so adding a new qid
 * forces a conscious classification (see docs/PLAN_API_PERMISSIONS.md).
 */

import { describe, it, expect } from 'vitest';
import { qids } from './qids.js';
import { qidsAccess } from './qidsAccess.js';

const VALID_KINDS = ['user', 'serviceAdmin', 'serviceConsensus', 'apiKey', 'anonymous'];

describe('qidsAccess manifest', () => {
  it('classifies every qid defined in qids.js', () => {
    const missing = Object.keys(qids).filter((qid) => !(qid in qidsAccess));
    expect(
      missing,
      `Unclassified qids — add them to qidsAccess.js (or regenerate with scripts/build-qids-access.mjs): ${missing.join(', ')}`
    ).toEqual([]);
  });

  it('has no stale entries for qids that no longer exist', () => {
    const stale = Object.keys(qidsAccess).filter((qid) => !(qid in qids));
    expect(
      stale,
      `qidsAccess.js entries with no matching qid in qids.js: ${stale.join(', ')}`
    ).toEqual([]);
  });

  it('every entry has a non-empty allow list of valid principal kinds', () => {
    for (const [qid, entry] of Object.entries(qidsAccess)) {
      expect(Array.isArray((entry as any).allow), `${qid}: allow must be an array`).toBe(true);
      expect((entry as any).allow.length, `${qid}: allow must not be empty`).toBeGreaterThan(0);
      for (const kind of (entry as any).allow) {
        expect(VALID_KINDS, `${qid}: invalid principal kind "${kind}"`).toContain(kind);
      }
    }
  });

  it('consensus qids allow serviceConsensus but not serviceAdmin', () => {
    // Mirror of CONSENSUS_QIDS in +server.js — a service call to these must
    // carry the consensus secret; the plain admin service path is denied.
    const consensusQids = [
      '39GetNegotiation', '40CreateNegotiation', '41CreatePosition', '42UpdatePosition',
      'GetNegotiationByToken', 'ListLocalNegotiations',
      'ListArguments', 'CreateArgument', 'UpdateArgument', 'ListPlaces',
      'ListIssues', 'ListClauses', 'CreateIssue', 'CreateClause', 'UpdateClause'
    ];
    for (const qid of consensusQids) {
      const entry = (qidsAccess as Record<string, { allow: string[] }>)[qid];
      expect(entry, `missing manifest entry for consensus qid ${qid}`).toBeDefined();
      expect(entry.allow, `${qid} must allow serviceConsensus`).toContain('serviceConsensus');
      expect(entry.allow, `${qid} must not allow serviceAdmin`).not.toContain('serviceAdmin');
    }
  });
});
