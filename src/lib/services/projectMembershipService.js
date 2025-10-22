/**
 * Project Membership Service
 * Dedicated service for checking and managing project membership with caching and error handling
 */

import { authUtils } from '../utils/authUtils.js';
import { storageUtils } from '../utils/salesUtils.js';

/**
 * @typedef {Object} MembershipResult
 * @property {boolean} success - Whether the operation succeeded
 * @property {boolean} isMember - Whether user is a member (only if success is true)
 * @property {string} membershipType - Type of membership: 'creator', 'member', 'none'
 * @property {string} [error] - Error message if operation failed
 * @property {boolean} fromCache - Whether result came from cache
 */

/**
 * @typedef {Object} ProjectMembership
 * @property {string} projectId - Project ID
 * @property {string} projectName - Project name
 * @property {string} membershipType - Type of membership: 'creator', 'member'
 * @property {Date} joinedAt - When user joined (if available)
 * @property {Object} projectInfo - Additional project information
 */

export class ProjectMembershipService {
  constructor() {
    this.baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_URL) || 'http://localhost:1337';
    this.graphqlEndpoint = `${this.baseUrl}/graphql`;
    this.cachePrefix = 'project_membership_';
    this.defaultCacheTTL = 15; // 15 minutes default cache
    this.batchCacheTTL = 30; // 30 minutes for batch operations
  }

  /**
   * Checks if a user is a member of a specific project
   * @param {string} userId - User ID to check
   * @param {string} projectId - Project ID to check membership for
   * @param {Object} options - Options for caching and error handling
   * @returns {Promise<MembershipResult>} Membership check result
   */
  async checkProjectMembership(userId, projectId, options = {}) {
    const {
      useCache = true,
      cacheTTL = this.defaultCacheTTL,
      includeProjectInfo = false,
      retryOnError = true
    } = options;

    const cacheKey = `${this.cachePrefix}${userId}_${projectId}`;
    
    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = storageUtils.getWithExpiry(cacheKey);
        if (cached !== null) {
          return {
            success: true,
            isMember: cached.isMember,
            membershipType: cached.membershipType,
            projectInfo: cached.projectInfo,
            fromCache: true
          };
        }
      }

      // Get authentication data
      const authData = authUtils.getAuthData();
      if (!authData) {
        throw new Error('Authentication required');
      }

      // Build GraphQL query
      const query = `
        query {
          usersPermissionsUser(id: ${userId}) {
            data {
              attributes {
                projectcreates(filters: { id: { eq: ${projectId} } }) {
                  data {
                    id
                    ${includeProjectInfo ? `
                    attributes {
                      projectName
                      profilePic {
                        data {
                          attributes {
                            url
                          }
                        }
                      }
                    }
                    ` : ''}
                  }
                }
                projectmembers(filters: { projectcreate: { id: { eq: ${projectId} } } }) {
                  data {
                    id
                    attributes {
                      projectcreate {
                        data {
                          id
                          ${includeProjectInfo ? `
                          attributes {
                            projectName
                            profilePic {
                              data {
                                attributes {
                                  url
                                }
                              }
                            }
                          }
                          ` : ''}
                        }
                      }
                      ${includeProjectInfo ? `
                      createdAt
                      ` : ''}
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': authData.bearer,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL query failed');
      }

      const userData = result.data?.usersPermissionsUser?.data?.attributes;
      if (!userData) {
        throw new Error('User data not found');
      }

      // Check if user is project creator
      const createdProjects = userData.projectcreates?.data || [];
      const isCreator = createdProjects.length > 0;

      // Check if user is project member
      const memberProjects = userData.projectmembers?.data || [];
      const isMember = memberProjects.length > 0;

      // Determine membership type and get project info
      let membershipType = 'none';
      let projectInfo = null;

      if (isCreator) {
        membershipType = 'creator';
        if (includeProjectInfo && createdProjects[0]?.attributes) {
          projectInfo = {
            id: projectId,
            name: createdProjects[0].attributes.projectName,
            profilePic: createdProjects[0].attributes.profilePic
          };
        }
      } else if (isMember) {
        membershipType = 'member';
        if (includeProjectInfo && memberProjects[0]?.attributes?.projectcreate?.data?.attributes) {
          const projectData = memberProjects[0].attributes.projectcreate.data;
          projectInfo = {
            id: projectId,
            name: projectData.attributes.projectName,
            profilePic: projectData.attributes.profilePic,
            joinedAt: memberProjects[0].attributes.createdAt
          };
        }
      }

      const membershipResult = {
        isMember: isCreator || isMember,
        membershipType,
        projectInfo
      };

      // Cache the result
      if (useCache) {
        storageUtils.setWithExpiry(cacheKey, membershipResult, cacheTTL);
      }

      return {
        success: true,
        ...membershipResult,
        fromCache: false
      };

    } catch (error) {
      console.error('Project membership check failed:', error);

      // Handle retries for network errors
      if (retryOnError && this.isRetryableError(error)) {
        // Simple retry with exponential backoff
        await this.delay(1000);
        return this.checkProjectMembership(userId, projectId, {
          ...options,
          retryOnError: false // Prevent infinite retry
        });
      }

      return {
        success: false,
        isMember: false,
        membershipType: 'none',
        error: error.message,
        fromCache: false
      };
    }
  }

  /**
   * Gets all projects a user is a member of (creator or member)
   * @param {string} userId - User ID
   * @param {Object} options - Options for caching and filtering
   * @returns {Promise<Object>} Result with user's projects
   */
  async getUserProjectMemberships(userId, options = {}) {
    const {
      useCache = true,
      cacheTTL = this.batchCacheTTL,
      includeProjectInfo = true,
      membershipTypes = ['creator', 'member'] // Filter by membership types
    } = options;

    const cacheKey = `${this.cachePrefix}user_projects_${userId}`;
    
    try {
      // Check cache first
      if (useCache) {
        const cached = storageUtils.getWithExpiry(cacheKey);
        if (cached) {
          // Filter by membership types if specified
          const filteredProjects = cached.projects.filter(project => 
            membershipTypes.includes(project.membershipType)
          );
          
          return {
            success: true,
            data: {
              ...cached,
              projects: filteredProjects,
              totalProjects: filteredProjects.length
            },
            fromCache: true
          };
        }
      }

      // Get authentication data
      const authData = authUtils.getAuthData();
      if (!authData) {
        throw new Error('Authentication required');
      }

      const query = `
        query {
          usersPermissionsUser(id: ${userId}) {
            data {
              attributes {
                projectcreates {
                  data {
                    id
                    attributes {
                      projectName
                      profilePic {
                        data {
                          attributes {
                            url
                          }
                        }
                      }
                      createdAt
                    }
                  }
                }
                projectmembers {
                  data {
                    id
                    attributes {
                      createdAt
                      projectcreate {
                        data {
                          id
                          attributes {
                            projectName
                            profilePic {
                              data {
                                attributes {
                                  url
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const response = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': authData.bearer,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'Failed to fetch user projects');
      }

      const userData = result.data?.usersPermissionsUser?.data?.attributes;
      if (!userData) {
        throw new Error('User data not found');
      }

      // Process created projects
      const createdProjects = (userData.projectcreates?.data || []).map(project => ({
        projectId: project.id,
        projectName: project.attributes.projectName,
        membershipType: 'creator',
        joinedAt: project.attributes.createdAt,
        projectInfo: includeProjectInfo ? {
          id: project.id,
          name: project.attributes.projectName,
          profilePic: project.attributes.profilePic
        } : null
      }));

      // Process member projects
      const memberProjects = (userData.projectmembers?.data || [])
        .filter(member => member.attributes?.projectcreate?.data)
        .map(member => {
          const projectData = member.attributes.projectcreate.data;
          return {
            projectId: projectData.id,
            projectName: projectData.attributes.projectName,
            membershipType: 'member',
            joinedAt: member.attributes.createdAt,
            projectInfo: includeProjectInfo ? {
              id: projectData.id,
              name: projectData.attributes.projectName,
              profilePic: projectData.attributes.profilePic
            } : null
          };
        });

      // Combine and deduplicate projects
      const allProjects = [...createdProjects];
      memberProjects.forEach(memberProject => {
        // Check if user is already listed as creator for this project
        const existingProject = allProjects.find(p => p.projectId === memberProject.projectId);
        if (!existingProject) {
          allProjects.push(memberProject);
        }
      });

      // Filter by membership types
      const filteredProjects = allProjects.filter(project => 
        membershipTypes.includes(project.membershipType)
      );

      const resultData = {
        projects: filteredProjects,
        totalProjects: filteredProjects.length,
        createdProjects: createdProjects.length,
        memberProjects: memberProjects.length,
        fetchedAt: new Date().toISOString()
      };

      // Cache the complete result (before filtering)
      if (useCache) {
        const cacheData = {
          projects: allProjects,
          totalProjects: allProjects.length,
          createdProjects: createdProjects.length,
          memberProjects: memberProjects.length,
          fetchedAt: new Date().toISOString()
        };
        storageUtils.setWithExpiry(cacheKey, cacheData, cacheTTL);
      }

      return {
        success: true,
        data: resultData,
        fromCache: false
      };

    } catch (error) {
      console.error('Failed to fetch user project memberships:', error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Batch check membership for multiple projects
   * @param {string} userId - User ID
   * @param {Array<string>} projectIds - Array of project IDs to check
   * @param {Object} options - Options for caching and processing
   * @returns {Promise<Object>} Batch membership results
   */
  async batchCheckMembership(userId, projectIds, options = {}) {
    const {
      useCache = true,
      cacheTTL = this.defaultCacheTTL,
      includeProjectInfo = false
    } = options;

    try {
      // First, try to get all user projects to check against
      const userProjectsResult = await this.getUserProjectMemberships(userId, {
        useCache,
        cacheTTL: this.batchCacheTTL,
        includeProjectInfo
      });

      if (!userProjectsResult.success) {
        throw new Error(userProjectsResult.error);
      }

      const userProjects = userProjectsResult.data.projects;
      const userProjectIds = new Set(userProjects.map(p => p.projectId));

      // Create results for each requested project
      const results = projectIds.map(projectId => {
        const userProject = userProjects.find(p => p.projectId === projectId);
        
        if (userProject) {
          return {
            projectId,
            success: true,
            isMember: true,
            membershipType: userProject.membershipType,
            projectInfo: userProject.projectInfo,
            fromCache: userProjectsResult.fromCache
          };
        } else {
          return {
            projectId,
            success: true,
            isMember: false,
            membershipType: 'none',
            projectInfo: null,
            fromCache: userProjectsResult.fromCache
          };
        }
      });

      // Cache individual results for future single checks
      if (useCache) {
        results.forEach(result => {
          const cacheKey = `${this.cachePrefix}${userId}_${result.projectId}`;
          const cacheData = {
            isMember: result.isMember,
            membershipType: result.membershipType,
            projectInfo: result.projectInfo
          };
          storageUtils.setWithExpiry(cacheKey, cacheData, cacheTTL);
        });
      }

      return {
        success: true,
        data: {
          results,
          totalChecked: projectIds.length,
          memberCount: results.filter(r => r.isMember).length,
          checkedAt: new Date().toISOString()
        },
        fromCache: userProjectsResult.fromCache
      };

    } catch (error) {
      console.error('Batch membership check failed:', error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Invalidates membership cache for a user
   * @param {string} userId - User ID
   * @param {string} [projectId] - Specific project ID (optional)
   */
  invalidateMembershipCache(userId, projectId = null) {
    try {
      if (projectId) {
        // Clear specific project membership cache
        const cacheKey = `${this.cachePrefix}${userId}_${projectId}`;
        storageUtils.remove(cacheKey);
      } else {
        // Clear all membership cache for user
        const userProjectsKey = `${this.cachePrefix}user_projects_${userId}`;
        storageUtils.remove(userProjectsKey);
        
        // Clear individual project caches (this is a bit brute force)
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(`sales_cache_${this.cachePrefix}${userId}_`)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.error('Failed to invalidate membership cache:', error);
    }
  }

  /**
   * Refreshes membership data for a user
   * @param {string} userId - User ID
   * @param {Object} options - Refresh options
   * @returns {Promise<Object>} Refreshed membership data
   */
  async refreshMembershipData(userId, options = {}) {
    const { includeProjectInfo = true } = options;
    
    try {
      // Clear cache first
      this.invalidateMembershipCache(userId);
      
      // Fetch fresh data
      return await this.getUserProjectMemberships(userId, {
        useCache: false, // Force fresh fetch
        includeProjectInfo
      });
    } catch (error) {
      console.error('Failed to refresh membership data:', error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Utility methods
   */
  
  /**
   * Checks if an error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    if (!error) return false;
    
    const message = error.message?.toLowerCase() || '';
    
    // Network errors are retryable
    if (message.includes('fetch') || message.includes('network')) return true;
    if (message.includes('timeout')) return true;
    if (message.includes('connection')) return true;
    
    // Server errors (5xx) are retryable
    if (message.includes('500') || message.includes('502') || message.includes('503')) return true;
    
    return false;
  }

  /**
   * Simple delay utility for retries
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets error message for membership errors
   * @param {string} errorCode - Error code
   * @param {string} language - Language code ('he' or 'en')
   * @returns {string} Localized error message
   */
  getErrorMessage(errorCode, language = 'he') {
    const messages = {
      AUTH_REQUIRED: {
        he: 'נדרש אימות',
        en: 'Authentication required'
      },
      USER_NOT_FOUND: {
        he: 'משתמש לא נמצא',
        en: 'User not found'
      },
      PROJECT_NOT_FOUND: {
        he: 'פרויקט לא נמצא',
        en: 'Project not found'
      },
      NETWORK_ERROR: {
        he: 'שגיאת רשת',
        en: 'Network error'
      },
      PERMISSION_DENIED: {
        he: 'אין הרשאה',
        en: 'Permission denied'
      },
      UNKNOWN_ERROR: {
        he: 'שגיאה לא ידועה',
        en: 'Unknown error'
      }
    };

    return messages[errorCode]?.[language] || messages.UNKNOWN_ERROR[language];
  }
}

// Export singleton instance
export const projectMembershipService = new ProjectMembershipService();

// Export utility functions for direct use
export const checkProjectMembership = (userId, projectId, options) => 
  projectMembershipService.checkProjectMembership(userId, projectId, options);

export const getUserProjectMemberships = (userId, options) => 
  projectMembershipService.getUserProjectMemberships(userId, options);

export const batchCheckMembership = (userId, projectIds, options) => 
  projectMembershipService.batchCheckMembership(userId, projectIds, options);

export const invalidateMembershipCache = (userId, projectId) => 
  projectMembershipService.invalidateMembershipCache(userId, projectId);

export const refreshMembershipData = (userId, options) => 
  projectMembershipService.refreshMembershipData(userId, options);

// Export convenience functions that match the existing authUtils API
export const isProjectMember = async (userId, projectId) => {
  const result = await projectMembershipService.checkProjectMembership(userId, projectId);
  return result.success && result.isMember;
};

export const getProjectMembershipType = async (userId, projectId) => {
  const result = await projectMembershipService.checkProjectMembership(userId, projectId);
  return result.success ? result.membershipType : 'none';
};