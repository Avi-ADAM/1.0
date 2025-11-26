/**
 * Tests for projectHelpers.js
 * 
 * טסטים אלו מוודאים שהפונקציות מחזירות בדיוק את המבנה שהקוד הקיים מצפה לו.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createProjectInfo,
  createUserInfo,
  createMessage,
  createProjectUserInfo,
  createFullItemData,
  isUserInProject,
  getProjectMembers
} from './projectHelpers.js';
import * as projectStore from '$lib/stores/projectStore.js';

// Mock getProjectData
vi.mock('$lib/stores/projectStore.js', () => ({
  getProjectData: vi.fn()
}));

describe('projectHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProjectInfo', () => {
    it('should return correct structure with all required fields', () => {
      // Setup mocks
      projectStore.getProjectData.mockImplementation((id, thing) => {
        if (thing === 'pn') return 'Test Project';
        if (thing === 'noof') return 5;
        if (thing === 'pp') return 'https://example.com/pic.jpg';
        if (thing === 'uids') return ['1', '2', '3'];
        return null;
      });

      const result = createProjectInfo('123');

      // Verify structure matches exactly what components expect
      expect(result).toEqual({
        projectId: '123',
        projectName: 'Test Project',
        noof: 5,
        src2: 'https://example.com/pic.jpg',
        pid: ['1', '2', '3']
      });

      // Verify all getProjectData calls were made correctly
      expect(projectStore.getProjectData).toHaveBeenCalledWith('123', 'pn');
      expect(projectStore.getProjectData).toHaveBeenCalledWith('123', 'noof');
      expect(projectStore.getProjectData).toHaveBeenCalledWith('123', 'pp');
      expect(projectStore.getProjectData).toHaveBeenCalledWith('123', 'uids');
    });

    it('should handle numeric projectId', () => {
      projectStore.getProjectData.mockReturnValue('value');
      
      const result = createProjectInfo(123);
      
      expect(result.projectId).toBe(123);
    });
  });

  describe('createUserInfo', () => {
    it('should return correct structure with all required fields', () => {
      projectStore.getProjectData.mockImplementation((projectId, thing, userId) => {
        if (thing === 'un') return 'Test User';
        if (thing === 'upic') return 'https://example.com/user.jpg';
        return null;
      });

      const result = createUserInfo('123', '456');

      expect(result).toEqual({
        uid: '456',
        username: 'Test User',
        src: 'https://example.com/user.jpg'
      });

      expect(projectStore.getProjectData).toHaveBeenCalledWith('123', 'un', '456');
      expect(projectStore.getProjectData).toHaveBeenCalledWith('123', 'upic', '456');
    });

    it('should handle null profile picture', () => {
      projectStore.getProjectData.mockImplementation((projectId, thing, userId) => {
        if (thing === 'un') return 'Test User';
        if (thing === 'upic') return null;
        return null;
      });

      const result = createUserInfo('123', '456');

      expect(result.src).toBeNull();
    });
  });

  describe('createMessage', () => {
    it('should return correct message structure with defaults', () => {
      projectStore.getProjectData.mockReturnValue('https://example.com/pic.jpg');

      const result = createMessage('123', '456', 'Hello World');

      expect(result).toMatchObject({
        message: 'Hello World',
        pic: 'https://example.com/pic.jpg',
        sentByMe: false,
        what: true,
        changed: false
      });
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should accept custom options', () => {
      projectStore.getProjectData.mockReturnValue('pic.jpg');
      const customDate = new Date('2024-01-01');

      const result = createMessage('123', '456', 'Test', {
        timestamp: customDate,
        sentByMe: true,
        what: false,
        changed: true
      });

      expect(result).toEqual({
        message: 'Test',
        pic: 'pic.jpg',
        timestamp: customDate,
        sentByMe: true,
        what: false,
        changed: true
      });
    });
  });

  describe('createProjectUserInfo', () => {
    it('should combine project and user info correctly', () => {
      projectStore.getProjectData.mockImplementation((id, thing, uid) => {
        if (thing === 'pn') return 'Project';
        if (thing === 'noof') return 3;
        if (thing === 'pp') return 'proj.jpg';
        if (thing === 'uids') return ['1', '2'];
        if (thing === 'un') return 'User';
        if (thing === 'upic') return 'user.jpg';
        return null;
      });

      const result = createProjectUserInfo('123', '456', '789');

      expect(result).toEqual({
        projectId: '123',
        projectName: 'Project',
        noof: 3,
        src2: 'proj.jpg',
        pid: ['1', '2'],
        uid: '456',
        username: 'User',
        src: 'user.jpg',
        myid: '789'
      });
    });
  });

  describe('createFullItemData', () => {
    it('should create complete item data structure', () => {
      projectStore.getProjectData.mockImplementation((id, thing, uid) => {
        if (thing === 'pn') return 'Project';
        if (thing === 'noof') return 3;
        if (thing === 'pp') return 'proj.jpg';
        if (thing === 'uids') return ['1', '2'];
        if (thing === 'un') return 'User';
        if (thing === 'upic') return 'user.jpg';
        return null;
      });

      const result = createFullItemData({
        projectId: '123',
        userId: '456',
        myId: '789',
        ani: 'askedcoin',
        azmi: 'ziruf',
        pl: 1,
        additional: {
          askId: 999,
          omid: 888
        }
      });

      expect(result).toEqual({
        projectId: '123',
        projectName: 'Project',
        noof: 3,
        src2: 'proj.jpg',
        pid: ['1', '2'],
        uid: '456',
        username: 'User',
        src: 'user.jpg',
        myid: '789',
        ani: 'askedcoin',
        azmi: 'ziruf',
        pl: 1,
        askId: 999,
        omid: 888
      });
    });

    it('should work without additional fields', () => {
      projectStore.getProjectData.mockReturnValue('value');

      const result = createFullItemData({
        projectId: '123',
        userId: '456',
        myId: '789',
        ani: 'test',
        azmi: 'category',
        pl: 5
      });

      expect(result.ani).toBe('test');
      expect(result.azmi).toBe('category');
      expect(result.pl).toBe(5);
    });
  });

  describe('isUserInProject', () => {
    it('should return true if user is in project (string ID)', () => {
      projectStore.getProjectData.mockReturnValue(['1', '2', '3']);

      const result = isUserInProject('123', '2');

      expect(result).toBe(true);
    });

    it('should return true if user is in project (numeric ID)', () => {
      projectStore.getProjectData.mockReturnValue([1, 2, 3]);

      const result = isUserInProject('123', 2);

      expect(result).toBe(true);
    });

    it('should handle mixed string/number IDs', () => {
      projectStore.getProjectData.mockReturnValue(['1', '2', '3']);

      expect(isUserInProject('123', 2)).toBe(true);
      expect(isUserInProject('123', '2')).toBe(true);
    });

    it('should return false if user is not in project', () => {
      projectStore.getProjectData.mockReturnValue(['1', '2', '3']);

      const result = isUserInProject('123', '999');

      expect(result).toBe(false);
    });

    it('should return false if userIds is null', () => {
      projectStore.getProjectData.mockReturnValue(null);

      const result = isUserInProject('123', '456');

      expect(result).toBe(false);
    });
  });

  describe('getProjectMembers', () => {
    it('should return array of user objects', () => {
      const mockUsers = [
        { id: '1', attributes: { username: 'User1' } },
        { id: '2', attributes: { username: 'User2' } }
      ];

      projectStore.getProjectData.mockImplementation((id, thing, uid) => {
        if (thing === 'us') return mockUsers;
        if (thing === 'upic' && uid === '1') return 'pic1.jpg';
        if (thing === 'upic' && uid === '2') return 'pic2.jpg';
        return null;
      });

      const result = getProjectMembers('123');

      expect(result).toEqual([
        { uid: '1', username: 'User1', src: 'pic1.jpg' },
        { uid: '2', username: 'User2', src: 'pic2.jpg' }
      ]);
    });

    it('should return empty array if no users', () => {
      projectStore.getProjectData.mockReturnValue(null);

      const result = getProjectMembers('123');

      expect(result).toEqual([]);
    });

    it('should handle users without attributes', () => {
      const mockUsers = [
        { id: '1' },
        { id: '2', attributes: {} }
      ];

      projectStore.getProjectData.mockImplementation((id, thing) => {
        if (thing === 'us') return mockUsers;
        return null;
      });

      const result = getProjectMembers('123');

      expect(result).toEqual([
        { uid: '1', username: '', src: null },
        { uid: '2', username: '', src: null }
      ]);
    });
  });

  describe('Integration: Matching existing code patterns', () => {
    it('should match the exact structure used in dictasked.push', () => {
      // This test verifies that our helper produces the same structure
      // as the existing code in createasked function
      
      projectStore.getProjectData.mockImplementation((id, thing, uid) => {
        if (thing === 'pn') return 'Test Project';
        if (thing === 'noof') return 5;
        if (thing === 'pp') return 'project.jpg';
        if (thing === 'uids') return ['1', '2', '3'];
        if (thing === 'un') return 'Test User';
        if (thing === 'upic') return 'user.jpg';
        return null;
      });

      // Old way (from existing code):
      const oldWay = {
        projectId: '123',
        projectName: projectStore.getProjectData('123', 'pn'),
        noof: projectStore.getProjectData('123', 'noof'),
        src2: projectStore.getProjectData('123', 'pp'),
        myid: '789',
        pid: projectStore.getProjectData('123', 'uids'),
        uid: '456',
        username: projectStore.getProjectData('123', 'un', '456'),
        src: projectStore.getProjectData('123', 'upic', '456'),
        ani: 'askedcoin',
        azmi: 'ziruf',
        pl: 1
      };

      // New way (using helper):
      const newWay = createFullItemData({
        projectId: '123',
        userId: '456',
        myId: '789',
        ani: 'askedcoin',
        azmi: 'ziruf',
        pl: 1
      });

      // They should be identical
      expect(newWay).toEqual(oldWay);
    });
  });
});
