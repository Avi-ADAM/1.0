import { describe, expect, it } from 'vitest';
import { negotiationView } from './negotiationView';

const parties = { wisherIds: ['10'], proposerIds: ['20'] };

const attrs = (over: Record<string, any> = {}) => ({
  kind: 'existing_project',
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
    const volunteer = attrs({ kind: 'custom_offer', open_mission: { data: { id: '9' } } });
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

  it('is not open for a counter once closed', () => {
    expect(negotiationView(attrs({ status_proposal: 'accepted' }), parties, 'provider')!.canCounter).toBe(false);
  });

  it('says nothing for the shapes that are not negotiated here: a product, a project, a plain self-offer', () => {
    expect(negotiationView(attrs({ matanot: { data: { id: '4' } } }), parties, 'provider')).toBeNull();
    expect(negotiationView(attrs({ project: { data: { id: '5' } } }), parties, 'provider')).toBeNull();
    // a provider's own offer names a need by position, which nothing can close yet
    expect(negotiationView(attrs({ kind: 'custom_offer' }), parties, 'provider')).toBeNull();
  });

  it('first contact has no deadline: nobody has countered, so silence binds nobody', () => {
    const opened = attrs({ createdAt: '2026-10-01T10:00:00.000Z' });
    expect(negotiationView(opened, parties, 'provider')!.deadlineAt).toBeNull();
    const volunteer = attrs({ kind: 'custom_offer', open_mission: { data: { id: '9' } }, createdAt: '2026-10-01T10:00:00.000Z' });
    expect(negotiationView(volunteer, parties, 'wisher')!.deadlineAt).toBeNull();
  });

  it('once the two sides are talking, tells when silence answers: the last signature plus the wish’s pace — 48 h unless it chose otherwise', () => {
    const countered = attrs({
      createdAt: '2026-10-01T10:00:00.000Z',
      ratson_willingness_entry: [{ ...counter('20', 6, 680, 'x x x x x x x x'), submittedAt: '2026-10-02T09:00:00.000Z' }]
    });
    expect(negotiationView(countered, parties, 'wisher')!.deadlineAt).toBe('2026-10-04T09:00:00.000Z');
    expect(negotiationView(countered, parties, 'wisher', 'sevend')!.deadlineAt).toBe('2026-10-09T09:00:00.000Z');

    // another counter restarts it
    const again = attrs({
      createdAt: '2026-10-01T10:00:00.000Z',
      ratson_willingness_entry: [
        { ...counter('20', 6, 680, 'x x x x x x x x'), submittedAt: '2026-10-02T09:00:00.000Z' },
        { ...counter('10', 5, 640, 'y y y y y y y y'), submittedAt: '2026-10-03T20:00:00.000Z' }
      ]
    });
    expect(negotiationView(again, parties, 'provider')!.deadlineAt).toBe('2026-10-05T20:00:00.000Z');
  });

  it('has no deadline once the proposal is closed', () => {
    const closed = attrs({
      status_proposal: 'accepted',
      createdAt: '2026-10-01T10:00:00.000Z',
      ratson_willingness_entry: [{ ...counter('20', 6, 680, 'x x x x x x x x'), submittedAt: '2026-10-02T09:00:00.000Z' }]
    });
    expect(negotiationView(closed, parties, 'provider')!.deadlineAt).toBeNull();
  });

  it('says nothing for a proposal that covers no single slot', () => {
    expect(negotiationView(attrs({ covered_missions: [] }), parties, 'wisher')).toBeNull();
    expect(
      negotiationView(attrs({ covered_missions: [{ hours: 1, price: 1 }, { hours: 2, price: 2 }] }), parties, 'wisher')
    ).toBeNull();
  });
});
