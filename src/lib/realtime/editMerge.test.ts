import { describe, it, expect } from 'vitest';
import { mergeRemote, plainText, sameSet, sameText, sameValue } from './editMerge';

const F = [{ key: 'name' }, { key: 'site' }, { key: 'desc', eq: sameText }, { key: 'values', eq: sameSet }];

describe('mergeRemote', () => {
  const base = { name: 'A', site: 'x.com', desc: '<p>hello</p>', values: ['1', '2'] };

  it('nothing changed underneath — nothing to do, whatever I typed', () => {
    expect(mergeRemote(base, { ...base, name: 'Mine' }, base, F)).toEqual({ apply: {}, conflicts: [] });
  });

  it('takes a remote change quietly on a field I did not touch', () => {
    const r = mergeRemote(base, { ...base, name: 'Mine' }, { ...base, site: 'y.com' }, F);
    expect(r).toEqual({ apply: { site: 'y.com' }, conflicts: [] });
  });

  it('a field both of us changed, differently, is a conflict', () => {
    const r = mergeRemote(base, { ...base, name: 'Mine' }, { ...base, name: 'Theirs' }, F);
    expect(r.conflicts).toEqual([{ key: 'name', mine: 'Mine', theirs: 'Theirs' }]);
    expect(r.apply).toEqual({});
  });

  it('both arrived at the same value — no conflict', () => {
    expect(mergeRemote(base, { ...base, name: 'B' }, { ...base, name: 'B' }, F)).toEqual({ apply: {}, conflicts: [] });
  });

  it('a description in blocks on the server and HTML in the editor is not an edit', () => {
    const blocks = [{ type: 'paragraph', children: [{ type: 'text', text: 'hello' }] }];
    const r = mergeRemote({ ...base, desc: blocks }, { ...base, desc: '<p>hello</p>' }, { ...base, desc: [{ type: 'paragraph', children: [{ type: 'text', text: 'new' }] }] }, F);
    expect(Object.keys(r.apply)).toEqual(['desc']);
  });

  it('a reordered list is not a change', () => {
    expect(mergeRemote(base, base, { ...base, values: ['2', '1'] }, F)).toEqual({ apply: {}, conflicts: [] });
  });
});

describe('equality', () => {
  it('empty is empty: null, undefined and blank strings', () => {
    expect(sameValue(null, '')).toBe(true);
    expect(sameValue(undefined, '  ')).toBe(true);
    expect(sameValue(' a ', 'a')).toBe(true);
    expect(sameValue(3, '3')).toBe(true);
  });

  it('plainText reads HTML, blocks and JSON-encoded blocks alike', () => {
    const blocks = [{ type: 'paragraph', children: [{ type: 'text', text: 'Hi' }, { type: 'text', text: 'there' }] }];
    expect(plainText('<p>Hi&nbsp;<b>there</b></p>')).toBe('Hi there');
    expect(plainText(blocks)).toBe('Hi there');
    expect(plainText(JSON.stringify(blocks))).toBe('Hi there');
  });
});
