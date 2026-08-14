/**
 * Every query that feeds decisions into the lev pipeline must select the
 * archive half of a Decision (PLAN_OBJECT_ARCHIVAL).
 *
 * This exists because of a bug that is invisible in a schema check: the heart
 * loads a small slice first and then a full user query that *overwrites* the
 * same store. The slice selected `targetKind` and the target relation, the
 * full query did not — so `buildArchiveDecisionView` returned null for the
 * second payload, the extractor dropped the item, and an archive proposal
 * appeared for a moment and then disappeared. The focused vote page had the
 * same hole and rendered "vote not found" instead of the proposal.
 */

import { describe, it, expect } from 'vitest';
import { qids } from '../../routes/api/send/qids.js';

/** qids whose result is handed to `extractDecisions`. */
const DECISION_QIDS = ['83levMainUserQuery', '87levSliceDecisions', '159getDecisionForVote'];

/** Without these the view is null and the card is silently dropped. */
const REQUIRED = [
  'targetKind',
  'negoarch',
  'archScope',
  'archWhy',
  'archEndsMembership',
  'archOpenMission',
  'archMesimabetahalich',
  'archOpenMashaabim',
  'archMashabetahalich',
  'archMatanot',
];

describe('decision queries carry the archive fields', () => {
  for (const qid of DECISION_QIDS) {
    it(qid, () => {
      const q = (qids as Record<string, string>)[qid];
      expect(q, `${qid} is not registered`).toBeTruthy();
      for (const field of REQUIRED) {
        expect(q, `${qid} does not select ${field}`).toContain(field);
      }
    });
  }
});
