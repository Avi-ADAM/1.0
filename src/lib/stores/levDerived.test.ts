// src/lib/stores/levDerived.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
  pendsStore,
  mtahaStore,
  projectsStore,
  milon,
  projectFilter
} from './levStores';
import { finalSwiperArray } from './levDerived';

describe('finalSwiperArray', () => {
  beforeEach(() => {
    // Reset stores before each test
    pendsStore.set([]);
    mtahaStore.set([]);
    projectsStore.set([]);
    milon.set({
      hachla: true,
      fiap: true,
      welc: true,
      sugg: true,
      pend: true,
      asks: true,
      betaha: true,
      desi: true,
      ppmash: true,
      pmashs: true,
      pmaap: true,
      askmap: true
    });
    projectFilter.set(null);
  });

  it('should return empty array when no data', () => {
    const result = get(finalSwiperArray);
    expect(result).toEqual([]);
  });

  it('should merge and sort items from multiple stores', () => {
    // Setup test data
    projectsStore.set([
      {
        id: 'proj1',
        attributes: {
          projectName: 'Test Project',
          profilePic: { data: { attributes: { url: 'test.jpg' } } },
          user_1s: { data: [{ id: 'user1' }] }
        }
      }
    ]);

    pendsStore.set([
      {
        id: 'pend1',
        projectId: 'proj1',
        name: 'Pend 1',
        users: [],
        messages: [],
        priority: 100
      }
    ]);

    mtahaStore.set([
      {
        id: 'mtaha1',
        projectId: 'proj1',
        name: 'Mtaha 1',
        assignedTo: 'user1',
        progress: 50,
        priority: 50
      }
    ]);

    const result = get(finalSwiperArray);
    
    // Should have 2 items
    expect(result).toHaveLength(2);
    
    // Should be sorted by priority (mtaha first with priority 50)
    expect(result[0].ani).toBe('mtaha');
    expect(result[1].ani).toBe('pends');
  });

  it('should filter items based on milon settings', () => {
    projectsStore.set([
      {
        id: 'proj1',
        attributes: {
          projectName: 'Test Project',
          profilePic: { data: { attributes: { url: 'test.jpg' } } },
          user_1s: { data: [] }
        }
      }
    ]);

    pendsStore.set([
      {
        id: 'pend1',
        projectId: 'proj1',
        name: 'Pend 1',
        users: [],
        messages: [],
        priority: 100
      }
    ]);

    mtahaStore.set([
      {
        id: 'mtaha1',
        projectId: 'proj1',
        name: 'Mtaha 1',
        assignedTo: 'user1',
        progress: 50,
        priority: 50
      }
    ]);

    // Disable pends in milon
    milon.update(m => ({ ...m, pend: false }));

    const result = get(finalSwiperArray);
    
    // Should only have mtaha item
    expect(result).toHaveLength(1);
    expect(result[0].ani).toBe('mtaha');
  });

  it('should filter items by project', () => {
    projectsStore.set([
      {
        id: 'proj1',
        attributes: {
          projectName: 'Project 1',
          profilePic: { data: { attributes: { url: 'test1.jpg' } } },
          user_1s: { data: [] }
        }
      },
      {
        id: 'proj2',
        attributes: {
          projectName: 'Project 2',
          profilePic: { data: { attributes: { url: 'test2.jpg' } } },
          user_1s: { data: [] }
        }
      }
    ]);

    pendsStore.set([
      {
        id: 'pend1',
        projectId: 'proj1',
        name: 'Pend 1',
        users: [],
        messages: [],
        priority: 100
      },
      {
        id: 'pend2',
        projectId: 'proj2',
        name: 'Pend 2',
        users: [],
        messages: [],
        priority: 100
      }
    ]);

    // Filter by project 1
    projectFilter.set('proj1');

    const result = get(finalSwiperArray);
    
    // Should only have items from project 1
    expect(result).toHaveLength(1);
    expect(result[0].projectId).toBe('proj1');
  });

  it('should reactively update when stores change', () => {
    projectsStore.set([
      {
        id: 'proj1',
        attributes: {
          projectName: 'Test Project',
          profilePic: { data: { attributes: { url: 'test.jpg' } } },
          user_1s: { data: [] }
        }
      }
    ]);

    // Initially empty
    let result = get(finalSwiperArray);
    expect(result).toHaveLength(0);

    // Add a pend
    pendsStore.set([
      {
        id: 'pend1',
        projectId: 'proj1',
        name: 'Pend 1',
        users: [],
        messages: [],
        priority: 100
      }
    ]);

    // Should now have 1 item
    result = get(finalSwiperArray);
    expect(result).toHaveLength(1);
  });
});
