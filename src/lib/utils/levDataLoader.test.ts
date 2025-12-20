/**
 * Unit tests for levDataLoader
 * These tests verify data loading, snapshot management, and store population
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
  restoreFromSnapshot,
  populateStores,
  saveCurrentSnapshot,
  clearAllData
} from './levDataLoader';
import {
  userStore,
  projectsStore,
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
  decisionsStore,
  type SnapshotData
} from '$lib/stores/levStores';

describe('levDataLoader', () => {
  beforeEach(() => {
    // Clear all stores before each test
    clearAllData();
  });

  describe('restoreFromSnapshot', () => {
    it('should restore all stores from snapshot', () => {
      const snapshot: SnapshotData = {
        version: 2,
        timestamp: Date.now(),
        data: {
          user: {
            id: 'user1',
            username: 'testuser',
            email: 'test@example.com',
            lang: 'he',
            total: 1000
          },
          projects: [
            {
              id: 'project1',
              attributes: {
                projectName: 'Test Project',
                profilePic: undefined,
                user_1s: { data: [] }
              }
            }
          ],
          pends: [
            {
              id: 'pend1',
              projectId: 'project1',
              name: 'Test Pend',
              users: [],
              messages: [],
              priority: 1
            }
          ],
          mtaha: [],
          fiapp: [],
          asked: [],
          suggestions: [],
          pmashes: [],
          wegets: [],
          halukas: [],
          welcome: [],
          transfers: [],
          decisions: []
        }
      };

      restoreFromSnapshot(snapshot);

      // Verify stores are populated
      expect(get(userStore)).toEqual(snapshot.data.user);
      expect(get(projectsStore)).toEqual(snapshot.data.projects);
      expect(get(pendsStore)).toEqual(snapshot.data.pends);
      expect(get(mtahaStore)).toEqual([]);
    });

    it('should handle null user in snapshot', () => {
      const snapshot: SnapshotData = {
        version: 2,
        timestamp: Date.now(),
        data: {
          user: null,
          projects: [],
          pends: [],
          mtaha: [],
          fiapp: [],
          asked: [],
          suggestions: [],
          pmashes: [],
          wegets: [],
          halukas: [],
          welcome: [],
          transfers: [],
          decisions: []
        }
      };

      restoreFromSnapshot(snapshot);

      expect(get(userStore)).toBeNull();
      expect(get(projectsStore)).toEqual([]);
    });
  });

  describe('populateStores', () => {
    it('should populate stores from GraphQL data', () => {
      const graphqlData = {
        data: {
          usersPermissionsUser: {
            data: {
              id: 'user1',
              attributes: {
                username: 'testuser',
                email: 'test@example.com',
                lang: 'he',
                hervachti: 1000,
                profilePic: {
                  data: {
                    attributes: {
                      url: '/test.jpg'
                    }
                  }
                },
                projects_1s: {
                  data: [
                    {
                      id: 'project1',
                      attributes: {
                        projectName: 'Test Project',
                        user_1s: { data: [] },
                        pendms: {
                          data: [
                            {
                              id: 'pend1',
                              attributes: {
                                name: 'Test Pend',
                                users: [],
                                diun: []
                              }
                            }
                          ]
                        }
                      }
                    }
                  ]
                },
                mesimabetahaliches: { data: [] },
                welcom_tops: { data: [] }
              }
            }
          }
        }
      };

      populateStores(graphqlData, 'user1');

      // Verify user store
      const user = get(userStore);
      expect(user).not.toBeNull();
      expect(user?.id).toBe('user1');
      expect(user?.username).toBe('testuser');
      expect(user?.total).toBe(1000);

      // Verify projects store
      const projects = get(projectsStore);
      expect(projects).toHaveLength(1);
      expect(projects[0].id).toBe('project1');

      // Verify pends store
      const pends = get(pendsStore);
      expect(pends).toHaveLength(1);
      expect(pends[0].id).toBe('pend1');
    });

    it('should handle missing optional fields', () => {
      const graphqlData = {
        data: {
          usersPermissionsUser: {
            data: {
              id: 'user1',
              attributes: {
                username: 'testuser',
                projects_1s: { data: [] },
                mesimabetahaliches: { data: [] },
                welcom_tops: { data: [] }
              }
            }
          }
        }
      };

      populateStores(graphqlData, 'user1');

      const user = get(userStore);
      expect(user).not.toBeNull();
      expect(user?.email).toBe('');
      expect(user?.total).toBe(0);
      expect(user?.lang).toBe('he');
    });

    it('should throw error when userData is missing', () => {
      const graphqlData = {
        data: {
          usersPermissionsUser: {
            data: null
          }
        }
      };

      expect(() => populateStores(graphqlData, 'user1')).toThrow('No user data in GraphQL response');
    });
  });

  describe('saveCurrentSnapshot', () => {
    it('should save current store state to snapshot', () => {
      // Set up some data in stores
      userStore.set({
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        lang: 'he',
        total: 1000
      });

      projectsStore.set([
        {
          id: 'project1',
          attributes: {
            projectName: 'Test Project',
            profilePic: undefined,
            user_1s: { data: [] }
          }
        }
      ]);

      // Save snapshot (this will use localStorage in real environment)
      // In test environment, we just verify it doesn't throw
      expect(() => saveCurrentSnapshot()).not.toThrow();
    });
  });

  describe('clearAllData', () => {
    it('should clear all stores', () => {
      // Set up some data
      userStore.set({
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        lang: 'he',
        total: 1000
      });

      projectsStore.set([
        {
          id: 'project1',
          attributes: {
            projectName: 'Test Project',
            profilePic: undefined,
            user_1s: { data: [] }
          }
        }
      ]);

      pendsStore.set([
        {
          id: 'pend1',
          projectId: 'project1',
          name: 'Test Pend',
          users: [],
          messages: [],
          priority: 1
        }
      ]);

      // Clear all data
      clearAllData();

      // Verify all stores are cleared
      expect(get(userStore)).toBeNull();
      expect(get(projectsStore)).toEqual([]);
      expect(get(pendsStore)).toEqual([]);
      expect(get(mtahaStore)).toEqual([]);
      expect(get(fiappStore)).toEqual([]);
      expect(get(askedStore)).toEqual([]);
      expect(get(suggestionsStore)).toEqual([]);
      expect(get(pmashesStore)).toEqual([]);
      expect(get(wegetsStore)).toEqual([]);
      expect(get(halukasStore)).toEqual([]);
      expect(get(welcomeStore)).toEqual([]);
      expect(get(transfersStore)).toEqual([]);
      expect(get(decisionsStore)).toEqual([]);
    });
  });
});
