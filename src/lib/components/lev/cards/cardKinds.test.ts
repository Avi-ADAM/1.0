import { describe, it, expect } from 'vitest';
import {
  isCardVisible,
  rowTitle,
  rowSubtitle,
  rowFacts,
  rowTimegrama,
  rowIsActionable,
  kindLabelKey,
  kindAccent
} from './cardKinds.js';
import { letters } from '$lib/utils/levDataProcessors.js';

describe('isCardVisible', () => {
  const allOn = { pend: true, hachla: true, sales: true, desi: true };

  it('gates a kind on its milon key', () => {
    expect(isCardVisible({ ani: 'pends' }, allOn)).toBe(true);
    expect(isCardVisible({ ani: 'pends' }, { ...allOn, pend: false })).toBe(false);
  });

  it('always shows the kinds that were never wired into the filter panel', () => {
    for (const ani of ['wishoffer', 'sitesharepay', 'stipendpay', 'stipendconfirm', 'sitesharedecide']) {
      expect(isCardVisible({ ani }, {})).toBe(true);
    }
  });

  it('drops an ani LevCard cannot render, so it never becomes an empty slide', () => {
    expect(isCardVisible({ ani: 'somethingNew' }, allOn)).toBe(false);
    expect(isCardVisible({}, allOn)).toBe(false);
  });

  it('treats a missing milon entry as visible rather than hiding the card', () => {
    expect(isCardVisible({ ani: 'pends' }, {})).toBe(true);
  });
});

describe('rowTitle', () => {
  // The regression this guards: four processors build `name` through
  // `letters()`, which pre-reverses Hebrew/Arabic for SVG <text>. A row is
  // ordinary HTML, so it must use the untouched `nameRaw`.
  it('prefers nameRaw over the SVG-reversed name', () => {
    const original = 'מכונת תפירה';
    const reversed = letters(original)[0];

    // Guard the premise: letters() really does mangle it.
    expect(reversed).not.toBe(original);

    expect(rowTitle({ name: reversed, nameRaw: original })).toBe(original);
  });

  it('does not mangle Hebrew that never went through letters()', () => {
    expect(rowTitle({ nameRaw: 'אוכל הודי בטבריה' })).toBe('אוכל הודי בטבריה');
  });

  it('falls back through the other name fields, then the project', () => {
    expect(rowTitle({ name: 'a' })).toBe('a');
    expect(rowTitle({ openmissionName: 'b' })).toBe('b');
    expect(rowTitle({ username: 'c' })).toBe('c');
    expect(rowTitle({ projectName: 'p' })).toBe('p');
    expect(rowTitle({})).toBe('');
  });
});

describe('rowSubtitle', () => {
  it('takes the first field with text', () => {
    expect(rowSubtitle({ descrip: 'תיאור' })).toBe('תיאור');
    expect(rowSubtitle({ missionDetails: 'פרטים' })).toBe('פרטים');
    expect(rowSubtitle({})).toBe('');
  });

  it('flattens rich text so markup never reaches the row', () => {
    expect(rowSubtitle({ descrip: '<p>שלום <b>עולם</b></p>' })).toBe('שלום עולם');
    expect(
      rowSubtitle({
        descrip: [{ children: [{ text: 'בלוק' }, { text: ' אחד' }] }]
      })
    ).toBe('בלוק אחד');
  });

  it('collapses whitespace', () => {
    expect(rowSubtitle({ descrip: '  a\n\n   b  ' })).toBe('a b');
  });
});

describe('rowFacts', () => {
  it('shows hours, rate and a derived total', () => {
    expect(rowFacts({ noofhours: 8, perhour: 100 })).toEqual([
      { key: 'hours', value: 8 },
      { key: 'rate', value: 100 },
      { key: 'amount', value: 800 }
    ]);
  });

  it('prefers an explicit value over the derived one', () => {
    const facts = rowFacts({ noofhours: 8, perhour: 100, easy: 5000 });
    expect(facts.find((f) => f.key === 'amount')).toEqual({ key: 'amount', value: 5000 });
  });

  it('skips zero, negative and non-numeric figures', () => {
    expect(rowFacts({ noofhours: 0, perhour: -5, hm: 'x' })).toEqual([]);
    expect(rowFacts({})).toEqual([]);
  });

  it('never returns more than three chips', () => {
    expect(rowFacts({ noofhours: 1, perhour: 2, easy: 3, hm: 4 })).toHaveLength(3);
  });
});

describe('rowTimegrama / rowIsActionable', () => {
  it('reads either spelling of the timegrama field', () => {
    expect(rowTimegrama({ timegramaDate: 'x' })).toBe('x');
    expect(rowTimegrama({ timeGramaDate: 'y' })).toBe('y');
    expect(rowTimegrama({})).toBe(null);
  });

  it('greys out a card already voted on, or one sorted into the VOTE_DONE band', () => {
    expect(rowIsActionable({ pl: 100 })).toBe(true);
    expect(rowIsActionable({ pl: 100, already: true })).toBe(false);
    expect(rowIsActionable({ pl: 700 })).toBe(false);
    expect(rowIsActionable({})).toBe(false);
  });
});

describe('kind presentation', () => {
  it('names a translation key per kind, with a fallback', () => {
    expect(kindLabelKey('pends')).toBe('lev.list.kind.pends');
    expect(kindLabelKey('whoKnows')).toBe('lev.list.kind.other');
  });

  it('resolves an accent colour for every kind it knows', () => {
    expect(kindAccent('pends')).toBe('var(--blueg)');
    expect(kindAccent('whoKnows')).toBe('var(--goldink)');
  });
});
