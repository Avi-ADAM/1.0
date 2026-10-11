import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { updatePendsStore, updatePmashesStore, mergeVote } from './levVotePatch';
import { pendsStore, pmashesStore } from '$lib/stores/levStores';

const vote = (uid: string, what: boolean, order = 1) => ({
  what,
  order,
  users_permissions_user: { data: { id: uid } }
});

describe('levVotePatch', () => {
  beforeEach(() => {
    pendsStore.set([]);
    pmashesStore.set([]);
  });

  it('adds an item the store does not hold', () => {
    const pend = { id: '1', projectId: 'p1', name: 'A', users: [], messages: [], priority: 100 };
    updatePendsStore(pend as any);
    expect(get(pendsStore)).toEqual([pend]);
  });

  it('merges plain fields into an existing item', () => {
    pendsStore.set([{ id: '1', projectId: 'p1', name: 'A', users: [], messages: [] } as any]);
    updatePendsStore({ id: '1', name: 'B' } as any);
    const [p] = get(pendsStore);
    expect(p.name).toBe('B');
    expect(p.projectId).toBe('p1');
  });

  it('removes an item flagged _deleted', () => {
    pendsStore.set([{ id: '1' } as any, { id: '2' } as any]);
    updatePendsStore({ id: '1', _deleted: true } as any);
    expect(get(pendsStore).map((p) => p.id)).toEqual(['2']);
  });

  it('ignores data with no id', () => {
    updatePendsStore(null as any);
    updatePendsStore({} as any);
    expect(get(pendsStore)).toHaveLength(0);
  });

  it('a vote applied twice counts once, and a changed vote replaces the old one', () => {
    pmashesStore.set([{ id: '7', users: [vote('3', true)] } as any]);
    updatePmashesStore({ id: '7', newVote: vote('5', true) });
    updatePmashesStore({ id: '7', newVote: vote('5', true) });
    updatePmashesStore({ id: '7', newVote: vote('3', false) });
    const users = (get(pmashesStore)[0] as any).users;
    expect(users).toHaveLength(2);
    expect(users.find((v: any) => v.users_permissions_user.data.id === '3').what).toBe(false);
  });

  it("keeps a voter's vote from an earlier round", () => {
    const merged = mergeVote([vote('3', true, 1)], vote('3', false, 2));
    expect(merged).toHaveLength(2);
  });

  it('applies a counter patch without merging response fields', () => {
    pendsStore.set([{ id: '1', name: 'A', users: [] } as any]);
    updatePendsStore({ id: '1', patch: { hearotMeyuchadot: 'new terms' }, consensus: true } as any);
    const p = get(pendsStore)[0] as any;
    expect(p.hearotMeyuchadot).toBe('new terms');
    expect(p.consensus).toBeUndefined();
  });

  it('leaves the item alone when the voter cannot be identified', () => {
    pendsStore.set([{ id: '1', users: [vote('3', true)] } as any]);
    updatePendsStore({ id: '1', newVote: { what: true } });
    expect((get(pendsStore)[0] as any).users).toHaveLength(1);
  });
});
