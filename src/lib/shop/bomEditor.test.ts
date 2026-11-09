import { describe, expect, it } from 'vitest';
import { bomResourcesToPick, bomAssignees, bomBillDelta, releaseAssignments, bomCostAfter, bomRaise, parseBomTerms, planBomChanges, resourceKindOf, termCost, type BomStoredLine } from './bomEditor';

const stored: BomStoredLine[] = [
  { id: 'm1', kind: 'mission', name: 'עיצוב', amount: 2, units: 3, unit: 100 },
  { id: 'r5', kind: 'resource', name: 'בד', amount: 4, units: 1, unit: 50 }
];

const unchanged = stored.map((l) => ({ id: l.id, amount: l.amount, unit: l.unit, removed: false }));

describe('planBomChanges', () => {
  it('finds nothing when nothing moved', () => {
    expect(planBomChanges(stored, { lines: unchanged, add: [] })).toEqual({ terms: [], errors: [] });
  });

  it('says what a moved line was and becomes', () => {
    const { terms, errors } = planBomChanges(stored, {
      lines: [{ id: 'm1', amount: 2, unit: 120, removed: false }, unchanged[1]],
      add: []
    });
    expect(errors).toEqual([]);
    expect(terms).toEqual([
      { kind: 'change', line: 'mission', id: '1', name: 'עיצוב', units: 3, held: true, fromAmount: 2, toAmount: 2, fromUnit: 100, toUnit: 120 }
    ]);
    expect(termCost(terms[0])).toBe(720);
  });

  it('a removed line keeps its name and cost on the term', () => {
    const { terms } = planBomChanges(stored, { lines: [unchanged[0], { ...unchanged[1], removed: true }], add: [] });
    expect(terms).toEqual([{ kind: 'remove', line: 'resource', id: '5', name: 'בד', cost: 200, held: true }]);
  });

  it('never names a line that is not this product’s', () => {
    expect(planBomChanges(stored, { lines: [{ id: 'm99', amount: 1, unit: 1, removed: true }], add: [] }).terms).toEqual([]);
  });

  it('a new line needs a name and real numbers', () => {
    expect(planBomChanges(stored, { lines: [], add: [{ line: 'mission', name: ' ', amount: 1, units: 1, unit: 1 }] }).errors).toEqual(['bomName']);
    expect(planBomChanges(stored, { lines: [], add: [{ line: 'mission', name: 'א', amount: -1, units: 1, unit: 1 }] }).errors).toEqual(['bomNumber']);
    expect(planBomChanges(stored, { lines: [{ id: 'm1', amount: null, unit: 1, removed: false }], add: [] }).errors).toEqual(['bomNumber']);
  });

  it('keeps only the link that fits the kind of line', () => {
    const { terms } = planBomChanges(stored, {
      lines: [],
      add: [
        { line: 'mission', name: 'קיימת', amount: 1, units: 2, unit: 10, mesimabetahalichId: '7', pmashId: '8' },
        { line: 'resource', name: 'קיים', amount: 1, units: 9, unit: 10, resourceKind: 'good', openMashaabimId: '3', mesimabetahalichId: '7' }
      ]
    });
    expect(terms[0]).toMatchObject({ mesimabetahalichId: '7', pmashId: null, units: 2 });
    expect(terms[1]).toMatchObject({ mesimabetahalichId: null, openMashaabimId: '3', units: 1, resourceKind: 'good' });
  });

  it('a product by cost keeps at least one line', () => {
    const all = unchanged.map((l) => ({ ...l, removed: true }));
    expect(planBomChanges(stored, { lines: all, add: [] }).errors).toEqual(['bomEmpty']);
    expect(
      planBomChanges(stored, { lines: all, add: [{ line: 'mission', name: 'חדשה', amount: 1, units: 1, unit: 1 }] }).errors
    ).toEqual([]);
  });
});

describe('an owner for a new line', () => {
  const add = (over: object) => planBomChanges(stored, { lines: [], add: [{ line: 'mission', name: 'א', amount: 1, units: 1, unit: 1, ...over }] }).terms[0];

  it('is kept on a new line', () => {
    expect(add({ assignedMemberId: '5' })).toMatchObject({ assignedMemberId: '5' });
  });

  it('is not written over whoever already holds what the line links to', () => {
    expect(add({ assignedMemberId: '5', mesimabetahalichId: '7' })).toMatchObject({ assignedMemberId: null });
  });
});

describe('who has to sign', () => {
  const owned = planBomChanges(stored, {
    lines: [],
    add: [
      { line: 'mission', name: 'א', amount: 1, units: 1, unit: 1, assignedMemberId: '5' },
      { line: 'mission', name: 'ב', amount: 1, units: 1, unit: 1 }
    ]
  }).terms;

  it('every owner of a new line', () => {
    expect(bomAssignees(owned)).toEqual(['5']);
  });

  it('taking the owner off leaves the line, and asks them nothing', () => {
    const released = releaseAssignments(owned, [0]);
    expect(released).toHaveLength(2);
    expect(bomAssignees(released)).toEqual([]);
  });

  it('a new mission with an owner is on the bill at once, an open one is not', () => {
    expect(bomBillDelta(owned)).toBe(1);
  });
});

describe('which resource the owner brings', () => {
  const [term] = planBomChanges(stored, { lines: [], add: [{ line: 'resource', name: 'א', amount: 1, units: 1, unit: 1, assignedMemberId: '5' }] }).terms;

  it('is asked of its owner only, until it is answered', () => {
    expect(bomResourcesToPick([term], '5')).toEqual([0]);
    expect(bomResourcesToPick([term], '7')).toEqual([]);
    expect(bomResourcesToPick([{ ...term, spId: '9' } as typeof term], '5')).toEqual([]);
  });
});

describe('what a customer is asked', () => {
  const lines = [
    { id: 'm1', kind: 'mission' as const, name: 'א', amount: 1, units: 1, unit: 100, open: false },
    { id: 'm2', kind: 'mission' as const, name: 'ב', amount: 1, units: 1, unit: 50, open: true }
  ];

  it('more work is a raise, but an open line is not on the bill yet', () => {
    const { terms } = planBomChanges(lines, { lines: [], add: [{ line: 'mission', name: 'ג', amount: 2, units: 1, unit: 40 }] });
    expect(bomRaise(terms)).toBe(80);
    expect(bomBillDelta(terms)).toBe(0);
  });

  it('a held line moves the bill, an open one does not', () => {
    const { terms } = planBomChanges(lines, {
      lines: [
        { id: 'm1', amount: 1, unit: 130, removed: false },
        { id: 'm2', amount: 1, unit: 90, removed: false }
      ],
      add: []
    });
    expect(bomRaise(terms)).toBe(70);
    expect(bomBillDelta(terms)).toBe(30);
  });

  it('a recipe that gets cheaper asks her nothing', () => {
    const { terms } = planBomChanges(lines, { lines: [{ id: 'm2', amount: 1, unit: 50, removed: true }], add: [] });
    expect(bomRaise(terms)).toBe(-50);
  });
});

describe('bomCostAfter', () => {
  it('adds what stays, as it will be', () => {
    const { terms } = planBomChanges(stored, {
      lines: [{ id: 'm1', amount: 1, unit: 100, removed: false }, { ...unchanged[1], removed: true }],
      add: [{ line: 'resource', name: 'חוט', amount: 2, units: 1, unit: 5 }]
    });
    expect(bomCostAfter(stored, terms)).toBe(310);
  });
});

describe('parseBomTerms', () => {
  it('reads back what a plan wrote, from JSON or a string', () => {
    const { terms } = planBomChanges(stored, {
      lines: [{ id: 'm1', amount: 1, unit: 100, removed: false }, { ...unchanged[1], removed: true }],
      add: [{ line: 'mission', name: 'חדשה', amount: 1, units: 1, unit: 1, notes: 'x' }]
    });
    expect(parseBomTerms(terms)).toEqual(terms);
    expect(parseBomTerms(JSON.stringify(terms))).toEqual(terms);
  });

  it('drops what does not read as a term', () => {
    expect(parseBomTerms([{ kind: 'remove', line: 'mission', name: 'x', id: 'a' }, { kind: 'other' }, null])).toEqual([]);
    expect(parseBomTerms('not json')).toEqual([]);
    expect(parseBomTerms(null)).toEqual([]);
  });
});

describe('resourceKindOf', () => {
  it('names the picker’s kinds in the collection’s enum', () => {
    expect(resourceKindOf('subscription')).toBe('monthly');
    expect(resourceKindOf('good')).toBe('perUnit');
    expect(resourceKindOf('service')).toBe('total');
    expect(resourceKindOf('rent')).toBe('rent');
    expect(resourceKindOf(null)).toBeNull();
  });
});
