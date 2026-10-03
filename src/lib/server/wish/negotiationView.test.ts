import { describe, expect, it } from 'vitest';
import { negotiationView } from './negotiationView';

const parties = { wisherIds: ['10'], proposerIds: ['20'] };

const attrs = (over: Record<string, any> = {}) => ({
  status_proposal: 'suggested',
  total_price: 600,
  covered_missions: [{ extracted_mission_idx: '55', hours: 4, price: 600 }],
  covered_resources: [],
  ratson_willingness_entry: [],
  ...over
});

const counter = (user: string, hours: number, amount: number, note: string) => ({
  user: { data: { id: user } },
  agree: false,
  note,
  willingHours: hours,
  willingAmount: amount
});

describe('negotiationView — what a card is told, from one side', () => {
  it('an invitation nobody countered: the wisher signed it, so it is the provider’s move', () => {
    expect(negotiationView(attrs(), parties, 'provider')).toMatchObject({ round: 0, yourTurn: true, signedBy: 'wisher', canCounter: true });
    expect(negotiationView(attrs(), parties, 'wisher')).toMatchObject({ yourTurn: false });
  });

  it('a volunteer’s offer: the volunteer signed it, so it is the wisher’s move', () => {
    const volunteer = attrs({ open_mission: { data: { id: '9' } } });
    expect(negotiationView(volunteer, parties, 'wisher')).toMatchObject({ yourTurn: true, signedBy: 'provider' });
    expect(negotiationView(volunteer, parties, 'provider')).toMatchObject({ yourTurn: false });
  });

  it('after a counter the turn flips and the card gets the story', () => {
    const v = attrs({
      covered_missions: [{ extracted_mission_idx: '55', hours: 6, price: 680 }],
      ratson_willingness_entry: [counter('20', 6, 680, 'השולחן דורש שעתיים נוספות')]
    });
    const forWisher = negotiationView(v, parties, 'wisher')!;
    expect(forWisher).toMatchObject({ round: 1, yourTurn: true, amount: 6, price: 680, signedBy: 'provider' });
    expect(forWisher.counters).toEqual([{ round: 1, by: 'provider', amount: 6, price: 680, note: 'השולחן דורש שעתיים נוספות' }]);
    expect(negotiationView(v, parties, 'provider')!.yourTurn).toBe(false);
  });

  it('a resource reads its quantity and price', () => {
    const r = attrs({ covered_missions: [], covered_resources: [{ extracted_resource_idx: '3', quantity: 2, price: 90 }] });
    expect(negotiationView(r, parties, 'provider')).toMatchObject({ amount: 2, price: 90 });
  });

  it('is not negotiable once closed, or when a product stands behind it', () => {
    expect(negotiationView(attrs({ status_proposal: 'accepted' }), parties, 'provider')!.canCounter).toBe(false);
    expect(negotiationView(attrs({ matanot: { data: { id: '4' } } }), parties, 'provider')!.canCounter).toBe(false);
  });

  it('says nothing for a proposal that covers no single slot', () => {
    expect(negotiationView(attrs({ covered_missions: [] }), parties, 'wisher')).toBeNull();
    expect(
      negotiationView(attrs({ covered_missions: [{ hours: 1, price: 1 }, { hours: 2, price: 2 }] }), parties, 'wisher')
    ).toBeNull();
  });
});
