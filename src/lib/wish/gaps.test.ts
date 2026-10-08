import { describe, expect, it } from 'vitest';
import { wishGaps } from './gaps';

/** QA_CONCIERGE_E2E C-19 — the parts of a wish nobody took when it is closed. */

const extractedMissions = [
  { id: '11', name: 'Laptop repair', importance: 'must', hoursEst: 3, notes: 'screen' },
  { id: '12', name: 'Oak table', importance: 'nice', hoursEst: 10 },
  { id: '13', name: 'Assembly', importance: 'must', hoursEst: 2 }
];
const extractedResources = [{ id: '21', name: 'Computer parts', importance: 'must', quantityEst: 4 }];

describe('wishGaps', () => {
  it('everything is a gap while nothing is taken', () => {
    const g = wishGaps({ extractedMissions, extractedResources });
    expect(g.map((x) => [x.kind, x.key, x.name, x.isMust, x.amount])).toEqual([
      ['mission', '11', 'Laptop repair', true, 3],
      ['mission', '12', 'Oak table', false, 10],
      ['mission', '13', 'Assembly', true, 2],
      ['resource', '21', 'Computer parts', true, 4]
    ]);
  });

  it('an accepted proposal covers a part by its component id or its index; others do not', () => {
    const proposals = [
      { attributes: { status_proposal: 'accepted', covered_missions: [{ extracted_mission_idx: '11' }] } },
      { attributes: { status_proposal: 'accepted', covered_missions: [{ extracted_mission_idx: '1' }] } },
      { attributes: { status_proposal: 'suggested', covered_resources: [{ extracted_resource_idx: '21' }] } }
    ];
    expect(wishGaps({ extractedMissions, extractedResources, proposals }).map((x) => x.key)).toEqual(['13', '21']);
  });

  it('an invited provider holds a BOM line named after the part — that part is taken', () => {
    const recipeMissions = [
      { id: '70', attributes: { notes: 'assembly', assignedMember: { data: { id: '256' } }, pendm: { data: null } } },
      { id: '71', attributes: { notes: 'Oak table', assignedMember: { data: null } } }
    ];
    expect(wishGaps({ extractedMissions, recipeMissions }).map((x) => x.key)).toEqual(['11', '12']);
  });
});
