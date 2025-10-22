/**
 * Product Aggregation Service
 * Advanced service for aggregating and managing products across multiple projects
 * Provides caching, loading states, and error handling for complex product operations
 */

import { salesService } from './salesService.js';
import { authUtils } from '../utils/authUtils.js';
import { errorHandler } from '../utils/errorHandling.js';

/**
 * @typedef {Object} AggregationOptions
 * @property {boolean} useCache - Whether to use caching
 * @property {number} cacheTTL - Cache time to live in minutes
 * @property {boolean} includeOutOfStock - Include out of stock products
 * @property {Object} filters - Filter criteria
 * @property {string} sortBy - Sort field
 * @property {string} sortOrder - Sort order
 * @property {boolean} includeLoadingState - Track loading states
 */

/**
 * @typedef {Object} LoadingState
 * @property {boolean} loading - Overall loading state
 * @property {Object} projectsLoading - Per-project loading states
 * @property {number} progress - Loading progress (0-100)
 * @property {string} currentOperation - Current operation description
 */

export class ProductAggregationService {
  constructor() {
    this.loadingStates = new Map();
    this.errorStates = new Map();
    this.retryAttempts = new Map();
    this.maxRetries = 3;
  }

  /**
   * Gets comprehensive user product data with loading states
   * @param {string} userId - User ID
   * @param {AggregationOptions} options - Aggregation options
   * @returns {Promise<Object>} Comprehensive product data
   */
  async getUserProductsWithState(userId, options = {}) {
    const {
      useCache = true,
      cacheTTL = 15,
      includeOutOfStock = false,
      includeLoadingState = true,
      filters = null,
      sortBy = 'name',
      sortOrder = 'asc'
    } = options;

    const operationId = `user_products_${userId}_${Date.now()}`;
    
    try {
      // Initialize loading state
      if (includeLoadingState) {
        this.setLoadingState(operationId, {
          loading: true,
          progress: 0,
          currentOperation: 'Fetching authentication data...'
        });
      }

      // Get authentication data
      const authData = authUtils.getAuthData();
      if (!authData) {
        throw new Error('Authentication required');
      }

      // Update loading state
      if (includeLoadingState) {
        this.updateLoadingState(operationId, {
          progress: 20,
          currentOperation: 'Fetching user projects...'
        });
      }

      // Get user projects first
      const projectsResult = await salesService.getUserProjects(
        userId, 
        authData.token, 
        { useCache, cacheTTL: cacheTTL * 2 }
      );

      if (!projectsResult.success) {
        throw new Error(projectsResult.error);
      }

      const userProjects = projectsResult.data.projects;
      const projectIds = userProjects.map(p => p.id);

      // Update loading state
      if (includeLoadingState) {
        this.updateLoadingState(operationId, {
          progress: 40,
          currentOperation: 'Fetching products from all projects...',
          projectsLoading: Object.fromEntries(projectIds.map(id => [id, true]))
        });
      }

      // Aggregate products from all projects
      const aggregationResult = await salesService.aggregateProductsFromProjects(
        projectIds,
        authData.token,
        {
          useCache,
          cacheTTL,
          includeOutOfStock,
          sortBy,
          sortOrder,
          filterBy: filters
        }
      );

      if (!aggregationResult.success) {
        throw new Error(aggregationResult.error);
      }

      // Update loading state
      if (includeLoadingState) {
        this.updateLoadingState(operationId, {
          progress: 80,
          currentOperation: 'Processing and organizing data...'
        });
      }

      // Process and enhance the data
      const enhancedData = this.enhanceProductData(
        aggregationResult.data,
        userProjects
      );

      // Final loading state update
      if (includeLoadingState) {
        this.updateLoadingState(operationId, {
          progress: 100,
          currentOperation: 'Complete',
          loading: false
        });
      }

      return {
        success: true,
        data: enhancedData,
        loadingState: includeLoadingState ? this.getLoadingState(operationId) : null,
        fromCache: aggregationResult.fromCache,
        warnings: aggregationResult.warnings
      };

    } catch (error) {
      // Handle error and update loading state
      if (includeLoadingState) {
        this.setErrorState(operationId, error.message);
        this.updateLoadingState(operationId, {
          loading: false,
          error: error.message
        });
      }

      return errorHandler.handleError(error, {
        operation: 'getUserProductsWithState',
        userId,
        operationId
      });
    }
  }

  /**
   * Gets products for multiple projects with concurrent loading
   * @param {Array} projectIds - Array of project IDs
   * @param {AggregationOptions} options - Options
   * @returns {Promise<Object>} Products from multiple projects
   */
  async getMultiProjectProducts(projectIds, options = {}) {
    const {
      useCache = true,
      cacheTTL = 10,
      includeLoadingState = true,
      maxConcurrent = 5 // Limit concurrent requests
    } = options;

    const operationId = `multi_project_${projectIds.join('_')}_${Date.now()}`;
    
    try {
      // Initialize loading state
      if (includeLoadingState) {
        this.setLoadingState(operationId, {
          loading: true,
          progress: 0,
          currentOperation: 'Starting multi-project fetch...',
          projectsLoading: Object.fromEntries(projectIds.map(id => [id, true]))
        });
      }

      const authData = authUtils.getAuthData();
      if (!authData) {
        throw new Error('Authentication required');
      }

      // Process projects in batches to avoid overwhelming the server
      const batches = this.createBatches(projectIds, maxConcurrent);
      const allResults = [];
      let completedProjects = 0;

      for (const batch of batches) {
        const batchPromises = batch.map(async (projectId) => {
          try {
            const result = await salesService.getProjectProducts(
              projectId, 
              authData.token, 
              { useCache, cacheTTL }
            );

            // Update individual project loading state
            if (includeLoadingState) {
              this.updateProjectLoadingState(operationId, projectId, false);
            }

            return { projectId, result };
          } catch (error) {
            // Update individual project error state
            if (includeLoadingState) {
              this.updateProjectLoadingState(operationId, projectId, false, error.message);
            }
            return { projectId, result: { success: false, error: error.message } };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);
        
        completedProjects += batch.length;
        const progress = Math.round((completedProjects / projectIds.length) * 100);

        // Update overall progress
        if (includeLoadingState) {
          this.updateLoadingState(operationId, {
            progress,
            currentOperation: `Completed ${completedProjects}/${projectIds.length} projects`
          });
        }
      }

      // Process results
      const successfulResults = allResults.filter(r => r.result.success);
      const failedResults = allResults.filter(r => !r.result.success);

      const aggregatedData = this.aggregateMultiProjectResults(successfulResults);

      // Final loading state update
      if (includeLoadingState) {
        this.updateLoadingState(operationId, {
          progress: 100,
          loading: false,
          currentOperation: 'Complete'
        });
      }

      return {
        success: true,
        data: aggregatedData,
        loadingState: includeLoadingState ? this.getLoadingState(operationId) : null,
        failedProjects: failedResults.map(r => ({
          projectId: r.projectId,
          error: r.result.error
        })),
        successCount: successfulResults.length,
        totalCount: projectIds.length
      };

    } catch (error) {
      if (includeLoadingState) {
        this.setErrorState(operationId, error.message);
        this.updateLoadingState(operationId, {
          loading: false,
          error: error.message
        });
      }

      return errorHandler.handleError(error, {
        operation: 'getMultiProjectProducts',
        projectIds,
        operationId
      });
    }
  }

  /**
   * Refreshes product data with smart caching
   * @param {string} userId - User ID
   * @param {Object} options - Refresh options
   * @returns {Promise<Object>} Refreshed data
   */
  async refreshUserProducts(userId, options = {}) {
    const {
      forceRefresh = false,
      refreshProjects = true,
      refreshProducts = true,
      includeLoadingState = true
    } = options;

    const operationId = `refresh_${userId}_${Date.now()}`;

    try {
      if (includeLoadingState) {
        this.setLoadingState(operationId, {
          loading: true,
          progress: 0,
          currentOperation: 'Starting refresh...'
        });
      }

      // Clear relevant caches if force refresh
      if (forceRefresh) {
        salesService.clearCachedData(`user_projects_${userId}`);
        salesService.clearCachedData(`user_sellable_products_${userId}`);
      }

      // Refresh with no cache
      const result = await this.getUserProductsWithState(userId, {
        useCache: !forceRefresh,
        cacheTTL: 15,
        includeLoadingState: false // We're managing loading state here
      });

      if (includeLoadingState) {
        this.updateLoadingState(operationId, {
          progress: 100,
          loading: false,
          currentOperation: 'Refresh complete'
        });
      }

      return {
        ...result,
        refreshed: true,
        loadingState: includeLoadingState ? this.getLoadingState(operationId) : null
      };

    } catch (error) {
      if (includeLoadingState) {
        this.setErrorState(operationId, error.message);
        this.updateLoadingState(operationId, {
          loading: false,
          error: error.message
        });
      }

      return errorHandler.handleError(error, {
        operation: 'refreshUserProducts',
        userId,
        operationId
      });
    }
  }

  /**
   * Enhanced product data processing
   * @param {Object} aggregationData - Raw aggregation data
   * @param {Array} userProjects - User projects data
   * @returns {Object} Enhanced product data
   */
  enhanceProductData(aggregationData, userProjects) {
    const { products, projects } = aggregationData;

    // Create project lookup map
    const projectMap = new Map(userProjects.map(p => [p.id, p]));

    // Enhance products with additional metadata
    const enhancedProducts = products.map(product => ({
      ...product,
      enhanced: {
        displayName: this.createProductDisplayName(product),
        availability: this.calculateAvailability(product),
        projectInfo: projectMap.get(product.metadata?.projectId),
        saleTypes: this.getAvailableSaleTypes(product),
        priceFormatted: this.formatPrice(product.attributes.price),
        lastUpdated: product.metadata?.fetchedAt
      }
    }));

    // Create enhanced project summaries
    const enhancedProjects = projects.map(project => {
      const projectProducts = enhancedProducts.filter(
        p => p.metadata?.projectId === project.id
      );
      
      return {
        ...project,
        summary: {
          totalProducts: projectProducts.length,
          availableProducts: projectProducts.filter(p => p.enhanced.availability.isAvailable).length,
          totalValue: projectProducts.reduce((sum, p) => sum + (p.attributes.price * p.attributes.quant), 0),
          averagePrice: projectProducts.length > 0 
            ? projectProducts.reduce((sum, p) => sum + p.attributes.price, 0) / projectProducts.length 
            : 0
        }
      };
    });

    return {
      ...aggregationData,
      products: enhancedProducts,
      projects: enhancedProjects,
      summary: {
        totalProducts: enhancedProducts.length,
        totalProjects: enhancedProjects.length,
        availableProducts: enhancedProducts.filter(p => p.enhanced.availability.isAvailable).length,
        totalValue: enhancedProducts.reduce((sum, p) => sum + (p.attributes.price * p.attributes.quant), 0),
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Loading state management methods
   */
  setLoadingState(operationId, state) {
    this.loadingStates.set(operationId, {
      ...state,
      startTime: Date.now(),
      lastUpdate: Date.now()
    });
  }

  updateLoadingState(operationId, updates) {
    const current = this.loadingStates.get(operationId) || {};
    this.loadingStates.set(operationId, {
      ...current,
      ...updates,
      lastUpdate: Date.now()
    });
  }

  updateProjectLoadingState(operationId, projectId, loading, error = null) {
    const current = this.loadingStates.get(operationId) || {};
    const projectsLoading = { ...current.projectsLoading };
    
    if (error) {
      projectsLoading[projectId] = { loading: false, error };
    } else {
      projectsLoading[projectId] = loading;
    }

    this.updateLoadingState(operationId, { projectsLoading });
  }

  getLoadingState(operationId) {
    return this.loadingStates.get(operationId) || null;
  }

  setErrorState(operationId, error) {
    this.errorStates.set(operationId, {
      error,
      timestamp: Date.now()
    });
  }

  /**
   * Utility methods
   */
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  aggregateMultiProjectResults(results) {
    const allProducts = [];
    const allProjects = [];

    results.forEach(({ result }) => {
      if (result.success && result.data) {
        allProducts.push(...result.data.products);
        allProjects.push(result.data.project);
      }
    });

    return {
      products: allProducts,
      projects: allProjects,
      totalProducts: allProducts.length,
      totalProjects: allProjects.length,
      aggregatedAt: new Date().toISOString()
    };
  }

  createProductDisplayName(product) {
    const { name, price, quant } = product.attributes;
    const projectName = product.metadata?.projectName || 'Unknown Project';
    return `${name} - ${projectName} (${price}₪, ${quant} available)`;
  }

  calculateAvailability(product) {
    const { quant, kindOf } = product.attributes;
    
    if (kindOf === 'unlimited') {
      return { isAvailable: true, type: 'unlimited' };
    }
    
    return {
      isAvailable: quant > 0,
      type: 'limited',
      quantity: quant,
      status: quant > 10 ? 'in_stock' : quant > 0 ? 'low_stock' : 'out_of_stock'
    };
  }

  getAvailableSaleTypes(product) {
    const { kindOf } = product.attributes;
    const types = ['total'];
    
    if (['monthly', 'yearly', 'unlimited'].includes(kindOf)) {
      types.push(kindOf);
    }
    
    return types;
  }

  formatPrice(price) {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(price);
  }

  /**
   * Cleanup methods
   */
  clearLoadingState(operationId) {
    this.loadingStates.delete(operationId);
    this.errorStates.delete(operationId);
  }

  clearAllLoadingStates() {
    this.loadingStates.clear();
    this.errorStates.clear();
    this.retryAttempts.clear();
  }
}

// Export singleton instance
export const productAggregationService = new ProductAggregationService();

// Export utility functions
export const getUserProductsWithState = (userId, options) => 
  productAggregationService.getUserProductsWithState(userId, options);
export const getMultiProjectProducts = (projectIds, options) => 
  productAggregationService.getMultiProjectProducts(projectIds, options);
export const refreshUserProducts = (userId, options) => 
  productAggregationService.refreshUserProducts(userId, options);