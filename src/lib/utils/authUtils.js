/**
 * Authentication Utilities for Sales Operations
 * Handles authentication, authorization, and user context for sales
 */

import { page } from '$app/state';
import { storageUtils } from './salesUtils.js';

/**
 * @typedef {Object} AuthData
 * @property {string} token - JWT token
 * @property {string} userId - User ID
 * @property {string} bearer - Bearer token string
 */

/**
 * @typedef {Object} UserPermissions
 * @property {boolean} canSell - Can create sales
 * @property {boolean} canViewSales - Can view sales data
 * @property {Array<string>} projectIds - Project IDs user has access to
 */

export class AuthUtils {
  constructor() {
    this.tokenKey = 'sales_auth_cache';
    this.permissionsKey = 'sales_permissions_cache';
  }

  /**
   * Gets authentication data from cookies
   * @returns {AuthData|null} Authentication data or null if not found
   */
  getAuthData() {
    try {
      // Try to get from cache first
      const cached = storageUtils.getWithExpiry(this.tokenKey);
      if (cached) {
        return cached;
      }

      // Get from cookies
      
      const idCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('id='));

      if (!idCookie) {
        return null;
      }

      const token = page.data.tok;
      const userId = idCookie.split('=')[1];

      const authData = {
        token,
        userId,
        bearer: `bearer ${token}`
      };

      // Cache for 30 minutes
      storageUtils.setWithExpiry(this.tokenKey, authData, 30);

      return authData;
    } catch (error) {
      console.error('Failed to get authentication data:', error);
      return null;
    }
  }

  /**
   * Validates if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    const authData = this.getAuthData();
    return authData !== null && authData.token && authData.userId;
  }

  /**
   * Gets current user ID
   * @returns {string|null} User ID or null if not authenticated
   */
  getCurrentUserId() {
    const authData = this.getAuthData();
    return authData?.userId || null;
  }

  /**
   * Gets bearer token for API requests
   * @returns {string|null} Bearer token or null if not authenticated
   */
  getBearerToken() {
    const authData = this.getAuthData();
    return authData?.bearer || null;
  }

  /**
   * Clears authentication cache
   */
  clearAuthCache() {
    storageUtils.remove(this.tokenKey);
    storageUtils.remove(this.permissionsKey);
  }

  /**
   * Checks if user has permission for a specific project
   * @param {string} projectId - Project ID to check
   * @returns {Promise<boolean>} True if user has access
   */
  async hasProjectAccess(projectId) {
    try {
      const authData = this.getAuthData();
      if (!authData) return false;

      // Check cache first
      const cacheKey = `project_access_${authData.userId}_${projectId}`;
      const cached = storageUtils.getWithExpiry(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Query user's project memberships
      const query = `
        query {
          usersPermissionsUser(id: ${authData.userId}) {
            data {
              attributes {
                projectcreates {
                  data {
                    id
                  }
                }
                projectmembers {
                  data {
                    attributes {
                      projectcreate {
                        data {
                          id
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

      const response = await fetch(`${import.meta.env.VITE_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Authorization': authData.bearer,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      const result = await response.json();
      
      if (result.errors) {
        console.error('Project access check failed:', result.errors);
        return false;
      }

      const userData = result.data?.usersPermissionsUser?.data?.attributes;
      if (!userData) return false;

      // Check if user is project creator
      const createdProjects = userData.projectcreates?.data || [];
      const isCreator = createdProjects.some(project => project.id === projectId);

      // Check if user is project member
      const memberProjects = userData.projectmembers?.data || [];
      const isMember = memberProjects.some(member => 
        member.attributes?.projectcreate?.data?.id === projectId
      );

      const hasAccess = isCreator || isMember;

      // Cache result for 15 minutes
      storageUtils.setWithExpiry(cacheKey, hasAccess, 15);

      return hasAccess;
    } catch (error) {
      console.error('Error checking project access:', error);
      return false;
    }
  }

  /**
   * Gets all projects user has access to
   * @returns {Promise<Array>} Array of project IDs
   */
  async getUserProjects() {
    try {
      const authData = this.getAuthData();
      if (!authData) return [];

      // Check cache first
      const cacheKey = `user_projects_${authData.userId}`;
      const cached = storageUtils.getWithExpiry(cacheKey);
      if (cached) {
        return cached;
      }

      const query = `
        query {
          usersPermissionsUser(id: ${authData.userId}) {
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
                    }
                  }
                }
                projectmembers {
                  data {
                    attributes {
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

      const response = await fetch(`${import.meta.env.VITE_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Authorization': authData.bearer,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      const result = await response.json();
      
      if (result.errors) {
        console.error('Failed to get user projects:', result.errors);
        return [];
      }

      const userData = result.data?.usersPermissionsUser?.data?.attributes;
      if (!userData) return [];

      // Combine created and member projects
      const createdProjects = userData.projectcreates?.data || [];
      const memberProjects = userData.projectmembers?.data?.map(member => 
        member.attributes?.projectcreate?.data
      ).filter(Boolean) || [];

      // Remove duplicates and combine
      const allProjects = [...createdProjects];
      memberProjects.forEach(project => {
        if (!allProjects.find(p => p.id === project.id)) {
          allProjects.push(project);
        }
      });

      // Cache for 30 minutes
      storageUtils.setWithExpiry(cacheKey, allProjects, 30);

      return allProjects;
    } catch (error) {
      console.error('Error getting user projects:', error);
      return [];
    }
  }

  /**
   * Validates user permissions for sales operations
   * @param {string} operation - Operation type ('create_sale', 'view_sales', etc.)
   * @param {string} [projectId] - Project ID for project-specific operations
   * @returns {Promise<boolean>} True if user has permission
   */
  async validatePermission(operation, projectId = null) {
    try {
      if (!this.isAuthenticated()) {
        return false;
      }

      // For project-specific operations, check project access
      if (projectId && !await this.hasProjectAccess(projectId)) {
        return false;
      }

      // Basic permission checks
      switch (operation) {
        case 'create_sale':
        case 'view_sales':
        case 'update_product':
          return true; // All authenticated users can perform these operations
        
        default:
          return false;
      }
    } catch (error) {
      console.error('Permission validation error:', error);
      return false;
    }
  }

  /**
   * Handles authentication errors
   * @param {Error} error - Authentication error
   * @returns {Object} Error response
   */
  handleAuthError(error) {
    console.error('Authentication error:', error);
    
    // Clear cache on auth errors
    this.clearAuthCache();

    return {
      success: false,
      error: 'AUTH_FAILED',
      message: 'Authentication failed. Please log in again.',
      requiresLogin: true
    };
  }

  /**
   * Refreshes authentication data
   * @returns {Promise<AuthData|null>} Refreshed auth data
   */
  async refreshAuth() {
    try {
      // Clear cache to force refresh
      this.clearAuthCache();
      
      // Get fresh auth data
      return this.getAuthData();
    } catch (error) {
      console.error('Auth refresh failed:', error);
      return null;
    }
  }

  /**
   * Sets up authentication event listeners
   */
  setupAuthListeners() {
    // Listen for storage changes (logout in other tabs)
    window.addEventListener('storage', (event) => {
      if (event.key === 'logout') {
        this.clearAuthCache();
        window.location.reload();
      }
    });

    // Listen for cookie changes
    let lastCookies = document.cookie;
    setInterval(() => {
      if (document.cookie !== lastCookies) {
        lastCookies = document.cookie;
        this.clearAuthCache(); // Force refresh on cookie change
      }
    }, 5000);
  }
}

// Export singleton instance
export const authUtils = new AuthUtils();

// Export utility functions for direct use
export const getAuthData = () => authUtils.getAuthData();
export const isAuthenticated = () => authUtils.isAuthenticated();
export const getCurrentUserId = () => authUtils.getCurrentUserId();
export const getBearerToken = () => authUtils.getBearerToken();
export const hasProjectAccess = (projectId) => authUtils.hasProjectAccess(projectId);
export const getUserProjects = () => authUtils.getUserProjects();
export const validatePermission = (operation, projectId) => 
  authUtils.validatePermission(operation, projectId);
export const clearAuthCache = () => authUtils.clearAuthCache();