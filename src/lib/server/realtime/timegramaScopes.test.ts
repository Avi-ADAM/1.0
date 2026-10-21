import { describe, it, expect } from 'vitest';
import { maturedScopes, relationSelection, PROJECT_FIELD } from './timegramaScopes';

const one = (id: number) => ({ data: { id } });

describe('timegrama maturation scopes (B9)', () => {
  it('a matured vote names its rikma and itself', () => {
    expect(maturedScopes('pendm', { id: 7, attributes: { project: one(12) } })).toEqual(['project:12', 'decision:pendm:7']);
    expect(maturedScopes('finiapruval', { id: 3, attributes: { project: one(12) } })).toEqual([
      'project:12',
      'decision:finiapruval:3'
    ]);
  });

  it('a rikma-wide decision may belong to several rikmas', () => {
    expect(maturedScopes('decision', { id: 5, attributes: { projects: { data: [{ id: 1 }, { id: 2 }] } } })).toEqual([
      'project:1',
      'project:2',
      'decision:decision:5'
    ]);
  });

  it('a dormant commitment, an archived object and a deal', () => {
    expect(maturedScopes('mesimabetahalich', { id: 9, attributes: { project: one(4) } })).toEqual(['project:4', 'mission:9']);
    expect(maturedScopes('mashabetahalich', { id: 9, attributes: { project: one(4) } })).toEqual(['project:4', 'resource:9']);
    expect(maturedScopes('matanot', { id: 2, attributes: { projectcreates: { data: [{ id: 4 }] } } })).toEqual([
      'project:4',
      'product:2'
    ]);
    expect(maturedScopes('sheirutpend', { id: 8, attributes: { project: one(4) } })).toEqual(['project:4', 'deal:8']);
  });

  it('a wish proposal reaches the wish, not a rikma it may not have', () => {
    expect(maturedScopes('ratson_proposal', { id: 6, attributes: { project: { data: null }, ratson: one(16) } })).toEqual([
      'wish:16'
    ]);
  });

  it('nothing to say without a target', () => {
    expect(maturedScopes('pendm', null)).toEqual([]);
    expect(maturedScopes('pendm', { id: 7 })).toEqual(['decision:pendm:7']);
  });

  it('the query asks for the rikma only where the target has one', () => {
    expect(relationSelection('actt')).toBe('actt{data{id}}');
    // An automatic act's reminder (PLAN_SHOP_OPERATIONS A2) knows its rikma.
    expect(relationSelection('act')).toBe('act{data{id attributes{ project{data{id}} }}}');
    expect(maturedScopes('act', { id: 5, attributes: { project: { data: { id: 3 } } } })).toEqual(['project:3', 'act:5']);
    expect(relationSelection('decision')).toBe('decision{data{id attributes{ projects{data{id}} }}}');
    expect(relationSelection('ratson_proposal')).toBe('ratson_proposal{data{id attributes{ project{data{id}} ratson{data{id}} }}}');
    for (const k of Object.keys(PROJECT_FIELD)) expect(relationSelection(k)).toContain(PROJECT_FIELD[k]);
  });
});
