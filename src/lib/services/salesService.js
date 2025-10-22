/**
 * Sales Service - Reusable sales logic extracted from sale.svelte
 * Handles sale validation, calculation, and data formatting
 */

import dayjs from 'dayjs';
import 'dayjs/locale/he.js';
import { SendTo } from '$lib/send/sendTo.svelte';

/**
 * @typedef {Object} SaleData
 * @property {string} project - Project ID
 * @property {string} matanot - Product/Gift ID
 * @property {string} users_permissions_user - User ID
 * @property {number} in - Total amount
 * @property {number} unit - Quantity
 * @property {string} date - Sale date
 * @property {string} publishedAt - Publication date
 * @property {string} [startDate] - Start date for recurring sales
 * @property {string} [finishDate] - Finish date for recurring sales
 */

/**
 * @typedef {Object} SaleValidationResult
 * @property {boolean} isValid
 * @property {string[]} errors
 */

/**
 * @typedef {Object} SaleCalculationParams
 * @property {number} quantity - Number of units
 * @property {number} pricePerUnit - Price per unit
 * @property {string} kindOf - Sale type: 'monthly', 'yearly', 'total', 'unlimited'
 * @property {Date|null} startDate - Start date for recurring sales
 * @property {Date|null} finishDate - Finish date for recurring sales
 */

/**
 * @typedef {Object} SaleResult
 * @property {boolean} success
 * @property {any} [data] - Sale data on success
 * @property {string} [error] - Error message on failure
 */

export class SalesService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_URL;
    this.graphqlEndpoint = `${this.baseUrl}/graphql`;
  }

  /**
   * Validates sale data before submission
   * @param {Object} params - Sale parameters
   * @param {string[]} selectedUsers - Selected users array
   * @param {number} quantity - Quantity to sell
   * @param {number} availableQuantity - Available quantity
   * @param {string} kindOf - Sale type
   * @param {Date|null} startDate - Start date for recurring sales
   * @returns {SaleValidationResult}
   */
  validateSaleData(params) {
    const { selectedUsers, quantity, availableQuantity, kindOf, startDate } =
      params;
    const errors = [];

    // Check if user is selected
    if (!selectedUsers || selectedUsers.length === 0 || !selectedUsers[0]) {
      errors.push('NO_USER_SELECTED');
    }

    // Check quantity
    if (quantity <= 0) {
      errors.push('INVALID_QUANTITY');
    }

    if (quantity > availableQuantity) {
      errors.push('INSUFFICIENT_QUANTITY');
    }

    // Check start date for recurring sales
    if ((kindOf === 'monthly' || kindOf === 'yearly') && !startDate) {
      errors.push('NO_START_DATE');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculates total amount for a sale
   * @param {SaleCalculationParams} params
   * @returns {number} Total amount
   */
  calculateTotal(params) {
    const { quantity, pricePerUnit, kindOf, startDate, finishDate } = params;

    if (kindOf === 'total' || kindOf === 'unlimited') {
      return quantity * pricePerUnit;
    }

    if (kindOf === 'monthly' || kindOf === 'yearly') {
      if (!startDate || !finishDate) {
        // If no end date, return per-period amount
        return quantity * pricePerUnit;
      }

      const start = new Date(startDate);
      const end = new Date(finishDate);

      if (kindOf === 'monthly') {
        const months =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());
        return months * pricePerUnit * quantity;
      } else if (kindOf === 'yearly') {
        const years = end.getFullYear() - start.getFullYear();
        return years * pricePerUnit * quantity;
      }
    }

    return quantity * pricePerUnit;
  }

  /**
   * Finds user ID by username from project users
   * @param {string} username - Username to find
   * @param {Array} projectUsers - Array of project users
   * @returns {string|null} User ID or null if not found
   */
  findUserIdByUsername(username, projectUsers) {
    if (!username || !projectUsers) return null;

    const user = projectUsers.find(
      (user) => user.attributes && user.attributes.username === username
    );

    return user ? user.id : null;
  }

  /**
   * Gets authentication token from cookies
   * @returns {Object} Authentication data
   */
  getAuthData() {
    try {
      const jwtCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('jwt='));

      const idCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('id='));

      if (!jwtCookie || !idCookie) {
        throw new Error('Authentication cookies not found');
      }

      const token = jwtCookie.split('=')[1];
      const userId = idCookie.split('=')[1];

      return {
        token,
        userId,
        bearer: `bearer ${token}`
      };
    } catch (error) {
      throw new Error('Failed to get authentication data');
    }
  }

  /**
   * Formats sale data for GraphQL mutation
   * @param {Object} params - Sale parameters
   * @returns {SaleData} Formatted sale data
   */
  formatSaleData(params) {
    const {
      projectId,
      productId,
      userId,
      quantity,
      total,
      saleDate,
      kindOf,
      startDate,
      finishDate
    } = params;

    const now = new Date();
    const saleData = {
      project: projectId,
      matanot: productId,
      users_permissions_user: userId,
      in: total,
      unit: quantity,
      date: dayjs(saleDate).toISOString(),
      publishedAt: now.toISOString()
    };

    // Add date range for recurring sales
    if (kindOf === 'monthly' || kindOf === 'yearly') {
      if (startDate) {
        saleData.startDate = new Date(startDate).toISOString();
      }
      if (finishDate) {
        saleData.finishDate = new Date(finishDate).toISOString();
      }
    }

    return saleData;
  }

  /**
   * Creates a sale with optional quantity update
   * @param {Object} params - Sale creation parameters
   * @returns {Promise<SaleResult>}
   */
  async createSale(params) {
    try {
      const {
        saleData,
        productId,
        currentQuantity,
        soldQuantity,
        kindOf,
        startDate,
        finishDate,
        updateQuantity = true
      } = params;

      const auth = this.getAuthData();

      // Build quantity update mutation if needed
      let quantityUpdateMutation = '';
      if (updateQuantity && soldQuantity > 0) {
        const newQuantity = currentQuantity - soldQuantity;
        quantityUpdateMutation = `
          updateMatanot(id: ${productId}, data: {quant: ${newQuantity}}) {
            data {
              id 
              attributes { quant }
            }
          }
        `;
      }

      // Create the main sale mutation
      const mutation = `
        mutation {
          createSale(data: ${JSON.stringify(saleData).replace(/"([^(")"]+)":/g, '$1:')}) {
            data {
              id
              attributes {
                in
                date
                matanot {
                  data {
                    id
                    attributes { name }
                  }
                }
                users_permissions_user {
                  data {
                    id
                    attributes { username }
                  }
                }
              }
            }
          }
          ${quantityUpdateMutation}
        }
      `;

      const response = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: {
          Authorization: auth.bearer,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: mutation })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL mutation failed');
      }

      // Create recurring sale record if needed
      if ((kindOf === 'monthly' || kindOf === 'yearly') && startDate) {
        await this.createRecurringSaleRecord(
          result.data.createSale.data.id,
          startDate,
          finishDate
        );
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Sale creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Creates a recurring sale record (Monter)
   * @param {string} saleId - Sale ID
   * @param {Date} startDate - Start date
   * @param {Date|null} finishDate - Finish date (optional)
   * @returns {Promise<void>}
   */
  async createRecurringSaleRecord(saleId, startDate, finishDate) {
    try {
      const mutation = `
        mutation {
          createMonter(data: {
            sale: "${saleId}",
            ani: "sale",
            start: "${new Date(startDate).toISOString()}"
            ${finishDate ? `finish: "${new Date(finishDate).toISOString()}"` : ''}
          }) {
            data { id }
          }
        }
      `;

      await SendTo(mutation);
    } catch (error) {
      console.error('Failed to create recurring sale record:', error);
      // Don't throw here as the main sale was successful
    }
  }

  /**
   * Gets all sellable products for a user across all their projects
   * @param {string} userId - User ID
   * @param {string} token - Authentication token
   * @param {Object} options - Options for caching and loading
   * @returns {Promise<Object>} Result with products, loading state, and error handling
   */
  async getUserSellableProducts(userId, token, options = {}) {
    const {
      useCache = true,
      cacheTTL = 15, // 15 minutes default cache
      includeLoadingState = false
    } = options;

    const cacheKey = `user_sellable_products_${userId}`;

    try {
      // Check cache first if enabled
      if (useCache) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            fromCache: true,
            loading: false
          };
        }
      }

      // Set loading state if requested
      if (includeLoadingState) {
        this.setCachedData(`${cacheKey}_loading`, true, 1); // 1 minute loading cache
      }

      const bearer = `bearer ${token}`;

      const query = `
        query {
          usersPermissionsUser(id: ${userId}) {
            data {
              id
              attributes {
                projects_1s {
                  data {
                    id
                    attributes {
                      projectName
                      profilePic {
                        data {
                          attributes {
                            url
                            formats
                          }
                        }
                      }
                      matanotofs(filters: { or: [{ quant: { gt: 0 } }, { quant: { eq: -1 } }] }) {
                        data {
                          id
                          attributes {
                            name
                            price
                            quant
                            kindOf
                            startDate
                            finnishDate
                            projectcreates {
                              data {
                                id
                                attributes {
                                  projectName
                                  profilePic {
                                    data {
                                      attributes {
                                        url
                                        formats
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
            }
          }
        }
      `;

      const response = await fetch(this.graphqlEndpoint, {
        method: 'POST',
        headers: {
          Authorization: bearer,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          result.errors[0]?.message || 'Failed to fetch user products'
        );
      }

      // Extract and flatten products from all projects
      const userData = result.data?.usersPermissionsUser?.data;
      if (!userData) {
        throw new Error('User data not found');
      }

      const projects = userData.attributes?.projects_1s?.data || [];
      const allProducts = [];
      const projectsMap = new Map();

      projects.forEach((project) => {
        // Store project info for later use
        projectsMap.set(project.id, {
          id: project.id,
          name: project.attributes.projectName,
          profilePic: project.attributes.profilePic
        });

        const products = project.attributes?.matanotofs?.data || [];
        products.forEach((product) => {
          // Ensure each product has project context
          if (!product.attributes.projectcreates) {
            product.attributes.projectcreates = {
              data: [
                {
                  id: project.id,
                  attributes: {
                    projectName: project.attributes.projectName,
                    profilePic: project.attributes.profilePic
                  }
                }
              ]
            };
          }

          // Add additional metadata
          product.metadata = {
            projectId: project.id,
            projectName: project.attributes.projectName,
            fetchedAt: new Date().toISOString(),
            isAvailable:
              product.attributes.quant > 0 || product.attributes.quant === -1
          };

          allProducts.push(product);
        });
      });

      // Prepare result data
      const resultData = {
        products: allProducts,
        projects: Array.from(projectsMap.values()),
        totalProducts: allProducts.length,
        totalProjects: projects.length,
        fetchedAt: new Date().toISOString()
      };

      // Cache the result if caching is enabled
      if (useCache) {
        this.setCachedData(cacheKey, resultData, cacheTTL);
      }

      // Clear loading state
      if (includeLoadingState) {
        this.clearCachedData(`${cacheKey}_loading`);
      }

      return {
        success: true,
        data: resultData,
        fromCache: false,
        loading: false
      };
    } catch (error) {
      // Clear loading state on error
      if (includeLoadingState) {
        this.clearCachedData(`${cacheKey}_loading`);
      }

      console.error('Failed to fetch user sellable products:', error);

      return {
        success: false,
        error: error.message,
        data: null,
        loading: false,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Gets all projects for a user with their sellable products count
   * @param {string} userId - User ID
   * @param {string} token - Authentication token
   * @param {Object} options - Options for caching
   * @returns {Promise<Object>} Result with projects and product counts
   */
  async getUserProjects(userId, token, options = {}) {
    const { useCache = true, cacheTTL = 30 } = options;
    const cacheKey = `user_projects_${userId}`;

    try {
      // Check cache first
      if (useCache) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            fromCache: true
          };
        }
      }

      const bearer = `bearer ${token}`;

      const query = `
        query {
          usersPermissionsUser(id: ${userId}) {
            data {
              attributes {
                projects_1s {
                  data {
                    id
                    attributes {
                      projectName
                      profilePic {
                        data {
                          attributes {
                            url
                            formats
                          }
                        }
                      }
                      matanotofs(filters: { or: [{ quant: { gt: 0 } }, { quant: { eq: -1 } }] }) {
                        data {
                          id
                        }
                      }
                      user_1s {
                        data {
                          id
                          attributes {
                            username
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
          Authorization: bearer,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          result.errors[0]?.message || 'Failed to fetch user projects'
        );
      }

      const projects =
        result.data?.usersPermissionsUser?.data?.attributes?.projects_1s
          ?.data || [];

      const projectsWithCounts = projects.map((project) => ({
        id: project.id,
        name: project.attributes.projectName,
        profilePic: project.attributes.profilePic,
        sellableProductsCount: project.attributes.matanotofs?.data?.length || 0,
        usersCount: project.attributes.user_1s?.data?.length || 0,
        users: project.attributes.user_1s?.data || []
      }));

      const resultData = {
        projects: projectsWithCounts,
        totalProjects: projectsWithCounts.length,
        totalSellableProducts: projectsWithCounts.reduce(
          (sum, p) => sum + p.sellableProductsCount,
          0
        ),
        fetchedAt: new Date().toISOString()
      };

      // Cache the result
      if (useCache) {
        this.setCachedData(cacheKey, resultData, cacheTTL);
      }

      return {
        success: true,
        data: resultData,
        fromCache: false
      };
    } catch (error) {
      console.error('Failed to fetch user projects:', error);

      return {
        success: false,
        error: error.message,
        data: null,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Gets products for a specific project
   * @param {string} projectId - Project ID
   * @param {string} token - Authentication token
   * @param {Object} options - Options for filtering and caching
   * @returns {Promise<Object>} Result with project products
   */
  async getProjectProducts(projectId, token, options = {}) {
    const {
      useCache = true,
      cacheTTL = 10, // Shorter cache for project-specific data
      includeOutOfStock = false
    } = options;

    const cacheKey = `project_products_${projectId}_${includeOutOfStock}`;

    try {
      // Check cache first
      if (useCache) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            fromCache: true
          };
        }
      }

      const bearer = `bearer ${token}`;
      const quantityFilter = includeOutOfStock
        ? ''
        : 'filters: { or: [{ quant: { gt: 0 } }, { quant: { eq: -1 } }] }';

      const query = `
        query {
          project(id: ${projectId}) {
            data {
              id
              attributes {
                projectName
                profilePic {
                  data {
                    attributes {
                      url
                      formats
                    }
                  }
                }
                matanotofs(${quantityFilter}) {
                  data {
                    id
                    attributes {
                      name
                      price
                      quant
                      kindOf
                      startDate
                      finnishDate
                    }
                  }
                }
                user_1s {
                  data {
                    id
                    attributes {
                      username
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
          Authorization: bearer,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(
          result.errors[0]?.message || 'Failed to fetch project products'
        );
      }

      const projectData = result.data?.project?.data;
      if (!projectData) {
        throw new Error('Project not found');
      }

      const products = projectData.attributes.matanotofs?.data || [];

      // Add project context to each product
      const productsWithContext = products.map((product) => ({
        ...product,
        attributes: {
          ...product.attributes,
          projectcreates: {
            data: [
              {
                id: projectData.id,
                attributes: {
                  projectName: projectData.attributes.projectName,
                  profilePic: projectData.attributes.profilePic
                }
              }
            ]
          }
        },
        metadata: {
          projectId: projectData.id,
          projectName: projectData.attributes.projectName,
          fetchedAt: new Date().toISOString(),
          isAvailable:
            product.attributes.quant > 0 || product.attributes.quant === -1
        }
      }));

      const resultData = {
        project: {
          id: projectData.id,
          name: projectData.attributes.projectName,
          profilePic: projectData.attributes.profilePic,
          users: projectData.attributes.user_1s?.data || []
        },
        products: productsWithContext,
        totalProducts: productsWithContext.length,
        availableProducts: productsWithContext.filter(
          (p) => p.attributes.quant > 0 || p.attributes.quant === -1
        ).length,
        fetchedAt: new Date().toISOString()
      };

      // Cache the result
      if (useCache) {
        this.setCachedData(cacheKey, resultData, cacheTTL);
      }

      return {
        success: true,
        data: resultData,
        fromCache: false
      };
    } catch (error) {
      console.error('Failed to fetch project products:', error);

      return {
        success: false,
        error: error.message,
        data: null,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Aggregates products from multiple projects with advanced filtering
   * @param {Array} projectIds - Array of project IDs
   * @param {string} token - Authentication token
   * @param {Object} options - Aggregation options
   * @returns {Promise<Object>} Aggregated products result
   */
  async aggregateProductsFromProjects(projectIds, token, options = {}) {
    const {
      useCache = true,
      cacheTTL = 10,
      includeOutOfStock = false,
      sortBy = 'name', // 'name', 'price', 'quantity', 'project'
      sortOrder = 'asc', // 'asc', 'desc'
      filterBy = null // { minPrice, maxPrice, minQuantity, kindOf, projectIds }
    } = options;

    const cacheKey = `aggregated_products_${projectIds.join('_')}_${JSON.stringify(options)}`;

    try {
      // Check cache first
      if (useCache) {
        const cached = this.getCachedData(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            fromCache: true
          };
        }
      }

      // Fetch products from all projects concurrently
      const projectPromises = projectIds.map((projectId) =>
        this.getProjectProducts(projectId, token, {
          useCache,
          cacheTTL: cacheTTL / 2, // Shorter cache for individual projects
          includeOutOfStock
        })
      );

      const projectResults = await Promise.allSettled(projectPromises);

      // Process results and handle failures
      const allProducts = [];
      const projectsData = [];
      const failedProjects = [];

      projectResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          const projectData = result.value.data;
          projectsData.push(projectData.project);
          allProducts.push(...projectData.products);
        } else {
          failedProjects.push({
            projectId: projectIds[index],
            error: result.reason?.message || 'Unknown error'
          });
        }
      });

      // Apply filtering
      let filteredProducts = allProducts;
      if (filterBy) {
        filteredProducts = this.applyProductFilters(allProducts, filterBy);
      }

      // Apply sorting
      filteredProducts = this.sortProducts(filteredProducts, sortBy, sortOrder);

      const resultData = {
        products: filteredProducts,
        projects: projectsData,
        totalProducts: filteredProducts.length,
        totalProjects: projectsData.length,
        failedProjects,
        aggregatedAt: new Date().toISOString(),
        options: { sortBy, sortOrder, filterBy }
      };

      // Cache the result
      if (useCache && failedProjects.length === 0) {
        this.setCachedData(cacheKey, resultData, cacheTTL);
      }

      return {
        success: true,
        data: resultData,
        fromCache: false,
        warnings:
          failedProjects.length > 0
            ? `Failed to fetch ${failedProjects.length} projects`
            : null
      };
    } catch (error) {
      console.error('Failed to aggregate products from projects:', error);

      return {
        success: false,
        error: error.message,
        data: null,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Applies filters to product array
   * @param {Array} products - Products to filter
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered products
   */
  applyProductFilters(products, filters) {
    return products.filter((product) => {
      const attrs = product.attributes;

      // Price filters
      if (filters.minPrice && attrs.price < filters.minPrice) return false;
      if (filters.maxPrice && attrs.price > filters.maxPrice) return false;

      // Quantity filters
      if (filters.minQuantity && attrs.quant < filters.minQuantity)
        return false;

      // Kind filter
      if (filters.kindOf && attrs.kindOf !== filters.kindOf) return false;

      // Project filter
      if (filters.projectIds && filters.projectIds.length > 0) {
        const productProjectId = product.metadata?.projectId;
        if (!filters.projectIds.includes(productProjectId)) return false;
      }

      return true;
    });
  }

  /**
   * Sorts products array
   * @param {Array} products - Products to sort
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order
   * @returns {Array} Sorted products
   */
  sortProducts(products, sortBy, sortOrder) {
    return [...products].sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'name':
          valueA = a.attributes.name.toLowerCase();
          valueB = b.attributes.name.toLowerCase();
          break;
        case 'price':
          valueA = a.attributes.price;
          valueB = b.attributes.price;
          break;
        case 'quantity':
          valueA = a.attributes.quant;
          valueB = b.attributes.quant;
          break;
        case 'project':
          valueA = a.metadata?.projectName?.toLowerCase() || '';
          valueB = b.metadata?.projectName?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Caching utility methods
   */
  getCachedData(key) {
    try {
      const item = localStorage.getItem(`sales_cache_${key}`);
      if (!item) return null;

      const parsed = JSON.parse(item);
      const now = Date.now();

      if (now > parsed.expiry) {
        localStorage.removeItem(`sales_cache_${key}`);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  setCachedData(key, data, ttlMinutes) {
    try {
      const item = {
        data,
        expiry: Date.now() + ttlMinutes * 60 * 1000
      };
      localStorage.setItem(`sales_cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }

  clearCachedData(key) {
    try {
      localStorage.removeItem(`sales_cache_${key}`);
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Clears all sales-related cache
   */
  clearAllCache() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('sales_cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Cache clear all error:', error);
    }
  }

  /**
   * Checks if error is retryable
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    if (!error) return false;

    const message = error.message?.toLowerCase() || '';
    const status = error.status;

    // Network errors are retryable
    if (message.includes('fetch') || message.includes('network')) return true;

    // Server errors (5xx) are retryable
    if (status >= 500) return true;

    // Timeout errors are retryable
    if (message.includes('timeout')) return true;

    // Rate limiting is retryable
    if (status === 429) return true;

    return false;
  }

  /**
   * Gets project users for a specific project (legacy method for backward compatibility)
   * @param {string} projectId - Project ID
   * @param {string} token - Authentication token
   * @returns {Promise<Array>} Array of project users
   */
  async getProjectUsers(projectId, token) {
    try {
      const result = await this.getProjectProducts(projectId, token, {
        useCache: true
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data.project.users;
    } catch (error) {
      console.error('Failed to fetch project users:', error);
      throw error;
    }
  }

  /**
   * Gets error message for validation errors
   * @param {string} errorCode - Error code
   * @param {string} language - Language code ('he' or 'en')
   * @returns {string} Localized error message
   */
  getErrorMessage(errorCode, language = 'he') {
    const messages = {
      NO_USER_SELECTED: {
        he: 'שדה אצל מי הכסף נשאר ריק',
        en: 'No user selected'
      },
      INVALID_QUANTITY: {
        he: 'כמות לא תקינה',
        en: 'Invalid quantity'
      },
      INSUFFICIENT_QUANTITY: {
        he: 'אין מספיק יחידות במלאי',
        en: 'Insufficient quantity available'
      },
      NO_START_DATE: {
        he: 'אין תאריך התחלה',
        en: 'No start date'
      },
      AUTH_FAILED: {
        he: 'שגיאת אימות',
        en: 'Authentication failed'
      },
      NETWORK_ERROR: {
        he: 'שגיאת רשת',
        en: 'Network error'
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
export const salesService = new SalesService();

// Export utility functions for direct use
export const validateSaleData = (params) =>
  salesService.validateSaleData(params);
export const calculateTotal = (params) => salesService.calculateTotal(params);
export const findUserIdByUsername = (username, projectUsers) =>
  salesService.findUserIdByUsername(username, projectUsers);
export const getAuthData = () => salesService.getAuthData();
export const formatSaleData = (params) => salesService.formatSaleData(params);
export const createSale = (params) => salesService.createSale(params);
export const getErrorMessage = (errorCode, language) =>
  salesService.getErrorMessage(errorCode, language);

// Export new aggregation functions
export const getUserSellableProducts = (userId, token, options) =>
  salesService.getUserSellableProducts(userId, token, options);
export const getUserProjects = (userId, token, options) =>
  salesService.getUserProjects(userId, token, options);
export const getProjectProducts = (projectId, token, options) =>
  salesService.getProjectProducts(projectId, token, options);
export const aggregateProductsFromProjects = (projectIds, token, options) =>
  salesService.aggregateProductsFromProjects(projectIds, token, options);

// Export cache management functions
export const clearSalesCache = () => salesService.clearAllCache();
export const getCachedData = (key) => salesService.getCachedData(key);
export const setCachedData = (key, data, ttl) =>
  salesService.setCachedData(key, data, ttl);
