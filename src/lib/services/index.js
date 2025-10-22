/**
 * Sales Services and Utilities - Main Export File
 * Provides easy access to all sales-related services and utilities
 */

// Main sales service
export { 
  SalesService, 
  salesService,
  validateSaleData,
  calculateTotal,
  findUserIdByUsername,
  getAuthData as getAuthDataFromService,
  formatSaleData,
  createSale,
  getErrorMessage as getErrorMessageFromService
} from './salesService.js';

// Utility functions
export {
  dateUtils,
  numberUtils,
  userUtils,
  productUtils,
  formUtils,
  errorUtils,
  storageUtils
} from '../utils/salesUtils.js';

// Authentication utilities
export {
  AuthUtils,
  authUtils,
  getAuthData,
  isAuthenticated,
  getCurrentUserId,
  getBearerToken,
  hasProjectAccess,
  getUserProjects,
  validatePermission,
  clearAuthCache
} from '../utils/authUtils.js';

// Error handling
export {
  ErrorHandler,
  errorHandler,
  handleError,
  getErrorMessage,
  showErrorToast,
  showSuccessToast,
  logError,
  createRetryFunction
} from '../utils/errorHandling.js';

// Project membership service
export {
  ProjectMembershipService,
  projectMembershipService,
  checkProjectMembership,
  getUserProjectMemberships,
  batchCheckMembership,
  invalidateMembershipCache,
  refreshMembershipData,
  isProjectMember,
  getProjectMembershipType
} from './projectMembershipService.js';