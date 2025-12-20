/**
 * Tests for levSocketHandler
 * 
 * These tests verify that the socket handler correctly processes
 * notifications and updates the appropriate stores.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import {
  setupSocketListeners,
  updatePendsStore,
  updateMtahaStore,
  updateFiappStore,
  updateAskedStore,
  updateSuggestionsStore,
  updatePmashesStore,
  updateWegetsStore,
  updateHalukasStore,
  updateWelcomeStore,
  updateTransfersStore,
  updateDecisionsStore
} from './levSocketHandler';
import {
  pendsStore,
  mtahaStore,
  fiappStore,
  askedStore,
  suggestionsStore,
  pmashesStore,
  wegetsStore,
  halukasStore,
  welcomeStore,
  transfersStore,
  decisionsStore
} from '$lib/stores/levStores';

// Mock the socketClient
vi.mock('$lib/stores/socketClient', () => ({
  socketClient: {
    onNotification: vi.fn((callback) => {
      // Store the callback for testing
      (global as any).__socketCallback = callback;
      // Return unsubscribe function
      return () => {
        delete (global as any).__socketCallback;
      };
    })
  }
}));

// Mock the data loader
vi.mock('./levDataLoader', () => ({
  initializeLevData: vi.fn().mockResolvedValue(undefined)
}));

describe('levSocketHandler', () => {
  beforeEach(() => {
    // Clear all stores before each test
    pendsStore.set([]);
    mtahaStore.set([]);
    fiappStore.set([]);
    askedStore.set([]);
    suggestionsStore.set([]);
    pmashesStore.set([]);
    wegetsStore.set([]);
    halukasStore.set([]);
    welcomeStore.set([]);
    transfersStore.set([]);
    decisionsStore.set([]);
  });

  afterEach(() => {
    // Clean up
    delete (global as any).__socketCallback;
  });

  describe('setupSocketListeners', () => {
    it('should register a notification listener', () => {
      const unsubscribe = setupSocketListeners('user123', 'token123', 'he');
      
      expect((global as any).__socketCallback).toBeDefined();
      
      // Clean up
      unsubscribe();
      expect((global as any).__socketCallback).toBeUndefined();
    });
  });

  describe('updatePendsStore', () => {
    it('should add new item to empty store', () => {
      const newPend = {
        id: '1',
        projectId: 'proj1',
        name: 'Test Pend',
        users: [],
        messages: [],
        priority: 100
      };

      updatePendsStore(newPend);

      const pends = get(pendsStore);
      expect(pends).toHaveLength(1);
      expect(pends[0]).toEqual(newPend);
    });

    it('should update existing item', () => {
      const initialPend = {
        id: '1',
        projectId: 'proj1',
        name: 'Initial Name',
        users: [],
        messages: [],
        priority: 100
      };

      pendsStore.set([initialPend]);

      const updatedPend = {
        id: '1',
        name: 'Updated Name',
        priority: 200
      };

      updatePendsStore(updatedPend);

      const pends = get(pendsStore);
      expect(pends).toHaveLength(1);
      expect(pends[0].name).toBe('Updated Name');
      expect(pends[0].priority).toBe(200);
      expect(pends[0].projectId).toBe('proj1'); // Should preserve other fields
    });

    it('should remove item when _deleted flag is set', () => {
      const pend1 = {
        id: '1',
        projectId: 'proj1',
        name: 'Pend 1',
        users: [],
        messages: []
      };
      const pend2 = {
        id: '2',
        projectId: 'proj1',
        name: 'Pend 2',
        users: [],
        messages: []
      };

      pendsStore.set([pend1, pend2]);

      updatePendsStore({ id: '1', _deleted: true } as any);

      const pends = get(pendsStore);
      expect(pends).toHaveLength(1);
      expect(pends[0].id).toBe('2');
    });

    it('should not update if data is invalid', () => {
      pendsStore.set([]);

      // Missing id
      updatePendsStore(null as any);
      expect(get(pendsStore)).toHaveLength(0);

      updatePendsStore({} as any);
      expect(get(pendsStore)).toHaveLength(0);
    });
  });

  describe('updateMtahaStore', () => {
    it('should add new item', () => {
      const newMtaha = {
        id: '1',
        projectId: 'proj1',
        name: 'Test Mission',
        assignedTo: 'user1',
        progress: 50
      };

      updateMtahaStore(newMtaha);

      const mtaha = get(mtahaStore);
      expect(mtaha).toHaveLength(1);
      expect(mtaha[0]).toEqual(newMtaha);
    });

    it('should update existing item', () => {
      const initial = {
        id: '1',
        projectId: 'proj1',
        name: 'Mission',
        assignedTo: 'user1',
        progress: 30
      };

      mtahaStore.set([initial]);

      updateMtahaStore({ id: '1', progress: 80 });

      const mtaha = get(mtahaStore);
      expect(mtaha[0].progress).toBe(80);
    });

    it('should remove item when _deleted flag is set', () => {
      mtahaStore.set([
        { id: '1', projectId: 'proj1', name: 'M1', assignedTo: 'u1', progress: 50 },
        { id: '2', projectId: 'proj1', name: 'M2', assignedTo: 'u2', progress: 30 }
      ]);

      updateMtahaStore({ id: '1', _deleted: true } as any);

      const mtaha = get(mtahaStore);
      expect(mtaha).toHaveLength(1);
      expect(mtaha[0].id).toBe('2');
    });
  });

  describe('updateAskedStore', () => {
    it('should add new ask request', () => {
      const newAsk = {
        id: '1',
        projectId: 'proj1',
        userId: 'user1',
        priority: 100
      };

      updateAskedStore(newAsk);

      const asked = get(askedStore);
      expect(asked).toHaveLength(1);
      expect(asked[0]).toEqual(newAsk);
    });

    it('should update existing ask request', () => {
      askedStore.set([
        { id: '1', projectId: 'proj1', userId: 'user1', priority: 100 }
      ]);

      updateAskedStore({ id: '1', priority: 200 });

      const asked = get(askedStore);
      expect(asked[0].priority).toBe(200);
    });
  });

  describe('updatePmashesStore', () => {
    it('should add new pending resource', () => {
      const newPmash = {
        id: '1',
        projectId: 'proj1',
        resourceType: 'material',
        priority: 100
      };

      updatePmashesStore(newPmash);

      const pmashes = get(pmashesStore);
      expect(pmashes).toHaveLength(1);
      expect(pmashes[0]).toEqual(newPmash);
    });

    it('should update existing pending resource', () => {
      pmashesStore.set([
        { id: '1', projectId: 'proj1', resourceType: 'material', priority: 100 }
      ]);

      updatePmashesStore({ id: '1', priority: 150 });

      const pmashes = get(pmashesStore);
      expect(pmashes[0].priority).toBe(150);
    });
  });

  describe('updateHalukasStore', () => {
    it('should add new haluka', () => {
      const newHaluka = {
        id: '1',
        projectId: 'proj1',
        amount: 1000,
        priority: 100
      };

      updateHalukasStore(newHaluka);

      const halukas = get(halukasStore);
      expect(halukas).toHaveLength(1);
      expect(halukas[0]).toEqual(newHaluka);
    });

    it('should update existing haluka', () => {
      halukasStore.set([
        { id: '1', projectId: 'proj1', amount: 1000, priority: 100 }
      ]);

      updateHalukasStore({ id: '1', amount: 2000 });

      const halukas = get(halukasStore);
      expect(halukas[0].amount).toBe(2000);
    });

    it('should remove haluka when _deleted flag is set', () => {
      halukasStore.set([
        { id: '1', projectId: 'proj1', amount: 1000 },
        { id: '2', projectId: 'proj1', amount: 2000 }
      ]);

      updateHalukasStore({ id: '1', _deleted: true } as any);

      const halukas = get(halukasStore);
      expect(halukas).toHaveLength(1);
      expect(halukas[0].id).toBe('2');
    });
  });

  describe('Store update consistency', () => {
    it('should preserve other fields when updating', () => {
      const initial = {
        id: '1',
        projectId: 'proj1',
        name: 'Test',
        users: [{ users_permissions_user: { data: { id: 'u1' } }, what: true }],
        messages: ['msg1'],
        priority: 100,
        customField: 'custom value'
      };

      pendsStore.set([initial]);

      updatePendsStore({ id: '1', priority: 200 });

      const pends = get(pendsStore);
      expect(pends[0].priority).toBe(200);
      expect(pends[0].name).toBe('Test');
      expect(pends[0].customField).toBe('custom value');
      expect(pends[0].users).toEqual(initial.users);
    });

    it('should handle multiple items correctly', () => {
      pendsStore.set([
        { id: '1', projectId: 'proj1', name: 'P1', users: [], messages: [] },
        { id: '2', projectId: 'proj1', name: 'P2', users: [], messages: [] },
        { id: '3', projectId: 'proj1', name: 'P3', users: [], messages: [] }
      ]);

      updatePendsStore({ id: '2', name: 'P2 Updated' });

      const pends = get(pendsStore);
      expect(pends).toHaveLength(3);
      expect(pends[0].name).toBe('P1');
      expect(pends[1].name).toBe('P2 Updated');
      expect(pends[2].name).toBe('P3');
    });
  });

  describe('All store update functions', () => {
    it('should have update functions for all store types', () => {
      // Verify all update functions exist
      expect(updatePendsStore).toBeDefined();
      expect(updateMtahaStore).toBeDefined();
      expect(updateFiappStore).toBeDefined();
      expect(updateAskedStore).toBeDefined();
      expect(updateSuggestionsStore).toBeDefined();
      expect(updatePmashesStore).toBeDefined();
      expect(updateWegetsStore).toBeDefined();
      expect(updateHalukasStore).toBeDefined();
      expect(updateWelcomeStore).toBeDefined();
      expect(updateTransfersStore).toBeDefined();
      expect(updateDecisionsStore).toBeDefined();
    });
  });
});
