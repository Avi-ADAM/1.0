/**
 * Error Handling Utilities for Sales Operations
 * Provides centralized error handling, logging, and user feedback
 */

import { toast } from 'svelte-sonner';

/**
 * @typedef {Object} ErrorContext
 * @property {string} operation - Operation that failed
 * @property {string} [userId] - User ID
 * @property {string} [projectId] - Project ID
 * @property {string} [productId] - Product ID
 * @property {any} [additionalData] - Additional context data
 */

/**
 * @typedef {Object} ErrorResult
 * @property {boolean} success - Always false for errors
 * @property {string} error - Error code
 * @property {string} message - User-friendly error message
 * @property {boolean} [requiresLogin] - Whether error requires re-authentication
 * @property {boolean} [retryable] - Whether operation can be retried
 */

export class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Handles and processes errors with context
   * @param {Error|string} error - Error to handle
   * @param {ErrorContext} context - Error context
   * @param {string} language - Language for error messages
   * @returns {ErrorResult} Processed error result
   */
  handleError(error, context = {}, language = 'he') {
    const errorInfo = this.processError(error, context);
    
    // Log the error
    this.logError(errorInfo, context);

    // Get user-friendly message
    const message = this.getErrorMessage(errorInfo.code, language, context);

    // Show toast notification if appropriate
    if (errorInfo.showToast) {
      this.showErrorToast(message, errorInfo.type);
    }

    return {
      success: false,
      error: errorInfo.code,
      message,
      requiresLogin: errorInfo.requiresLogin,
      retryable: errorInfo.retryable
    };
  }

  /**
   * Processes raw error into structured error info
   * @param {Error|string} error - Raw error
   * @param {ErrorContext} context - Error context
   * @returns {Object} Processed error info
   */
  processError(error, context) {
    let errorCode = 'UNKNOWN_ERROR';
    let errorType = 'error';
    let showToast = true;
    let requiresLogin = false;
    let retryable = false;

    // Handle different error types
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Network errors
      if (message.includes('fetch') || message.includes('network')) {
        errorCode = 'NETWORK_ERROR';
        retryable = true;
      }
      // Authentication errors
      else if (message.includes('auth') || message.includes('unauthorized') || 
               message.includes('token') || error.status === 401) {
        errorCode = 'AUTH_FAILED';
        requiresLogin = true;
      }
      // Validation errors
      else if (message.includes('validation') || error.status === 400) {
        errorCode = 'VALIDATION_ERROR';
        errorType = 'warning';
      }
      // Permission errors
      else if (message.includes('permission') || message.includes('forbidden') || 
               error.status === 403) {
        errorCode = 'PERMISSION_DENIED';
      }
      // Server errors
      else if (error.status >= 500) {
        errorCode = 'SERVER_ERROR';
        retryable = true;
      }
    } else if (typeof error === 'string') {
      errorCode = error;
      
      // Determine properties based on error code
      switch (error) {
        case 'NO_USER_SELECTED':
        case 'INVALID_QUANTITY':
        case 'NO_START_DATE':
        case 'INVALID_DATE_RANGE':
          errorType = 'warning';
          break;
        
        case 'INSUFFICIENT_QUANTITY':
          errorType = 'warning';
          break;
        
        case 'AUTH_FAILED':
          requiresLogin = true;
          break;
        
        case 'NETWORK_ERROR':
        case 'SERVER_ERROR':
          retryable = true;
          break;
      }
    }

    return {
      code: errorCode,
      type: errorType,
      showToast,
      requiresLogin,
      retryable,
      originalError: error
    };
  }

  /**
   * Gets localized error message
   * @param {string} errorCode - Error code
   * @param {string} language - Language code
   * @param {ErrorContext} context - Error context for dynamic messages
   * @returns {string} Localized error message
   */
  getErrorMessage(errorCode, language = 'he', context = {}) {
    const messages = {
      // Validation errors
      NO_USER_SELECTED: {
        he: 'שדה אצל מי הכסף נשאר ריק',
        en: 'No user selected'
      },
      INVALID_QUANTITY: {
        he: 'כמות לא תקינה',
        en: 'Invalid quantity'
      },
      INSUFFICIENT_QUANTITY: {
        he: `אין מספיק יחידות במלאי${context.available ? ` (זמין: ${context.available})` : ''}`,
        en: `Insufficient quantity available${context.available ? ` (available: ${context.available})` : ''}`
      },
      NO_START_DATE: {
        he: 'אין תאריך התחלה',
        en: 'No start date provided'
      },
      INVALID_DATE_RANGE: {
        he: 'טווח תאריכים לא תקין - תאריך הסיום חייב להיות אחרי תאריך ההתחלה',
        en: 'Invalid date range - end date must be after start date'
      },
      VALIDATION_ERROR: {
        he: 'שגיאת אימות נתונים',
        en: 'Data validation error'
      },

      // Authentication and authorization errors
      AUTH_FAILED: {
        he: 'שגיאת אימות - נא להתחבר מחדש',
        en: 'Authentication failed - please log in again'
      },
      PERMISSION_DENIED: {
        he: 'אין הרשאה לבצע פעולה זו',
        en: 'Permission denied for this operation'
      },
      NOT_PROJECT_MEMBER: {
        he: 'אינך חבר בפרויקט זה',
        en: 'You are not a member of this project'
      },

      // Network and server errors
      NETWORK_ERROR: {
        he: 'שגיאת רשת - בדוק את החיבור לאינטרנט',
        en: 'Network error - please check your internet connection'
      },
      SERVER_ERROR: {
        he: 'שגיאת שרת - נסה שוב מאוחר יותר',
        en: 'Server error - please try again later'
      },
      TIMEOUT_ERROR: {
        he: 'הפעולה נכשלה בגלל זמן המתנה ארוך מדי',
        en: 'Operation timed out - please try again'
      },

      // Business logic errors
      PRODUCT_NOT_FOUND: {
        he: 'המוצר לא נמצא',
        en: 'Product not found'
      },
      PROJECT_NOT_FOUND: {
        he: 'הפרויקט לא נמצא',
        en: 'Project not found'
      },
      SALE_CREATION_FAILED: {
        he: 'יצירת המכירה נכשלה',
        en: 'Sale creation failed'
      },
      QUANTITY_UPDATE_FAILED: {
        he: 'עדכון הכמות נכשל',
        en: 'Quantity update failed'
      },

      // Generic errors
      UNKNOWN_ERROR: {
        he: 'שגיאה לא ידועה - נסה שוב או פנה לתמיכה',
        en: 'Unknown error - please try again or contact support'
      },
      OPERATION_CANCELLED: {
        he: 'הפעולה בוטלה',
        en: 'Operation cancelled'
      }
    };

    return messages[errorCode]?.[language] || messages.UNKNOWN_ERROR[language];
  }

  /**
   * Shows error toast notification
   * @param {string} message - Error message
   * @param {string} type - Toast type ('error', 'warning', 'info')
   */
  showErrorToast(message, type = 'error') {
    switch (type) {
      case 'warning':
        toast.warning(message);
        break;
      case 'info':
        toast.info(message);
        break;
      case 'error':
      default:
        toast.error(message);
        break;
    }
  }

  /**
   * Shows success toast notification
   * @param {string} message - Success message
   * @param {string} language - Language code
   */
  showSuccessToast(message, language = 'he') {
    if (!message) {
      message = language === 'he' ? 'הפעולה הושלמה בהצלחה' : 'Operation completed successfully';
    }
    toast.success(message);
  }

  /**
   * Logs error with context and timestamp
   * @param {Object} errorInfo - Processed error info
   * @param {ErrorContext} context - Error context
   */
  logError(errorInfo, context) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      code: errorInfo.code,
      type: errorInfo.type,
      context,
      originalError: errorInfo.originalError,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Add to in-memory log
    this.errorLog.unshift(logEntry);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // Console log for development
    console.error('Sales Error:', logEntry);

    // Send to external logging service if configured
    this.sendToLoggingService(logEntry);
  }

  /**
   * Sends error to external logging service
   * @param {Object} logEntry - Log entry to send
   */
  async sendToLoggingService(logEntry) {
    try {
      // Only send critical errors to avoid spam
      if (logEntry.type === 'error' && 
          !['VALIDATION_ERROR', 'NO_USER_SELECTED'].includes(logEntry.code)) {
        
        // Example: Send to logging endpoint
        // await fetch('/api/log-error', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(logEntry)
        // });
      }
    } catch (error) {
      // Silently fail - don't create error loops
      console.warn('Failed to send error to logging service:', error);
    }
  }

  /**
   * Gets recent error log entries
   * @param {number} limit - Number of entries to return
   * @returns {Array} Recent error log entries
   */
  getRecentErrors(limit = 10) {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Clears error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Creates retry function for failed operations
   * @param {Function} operation - Operation to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} delay - Delay between retries in ms
   * @returns {Function} Retry function
   */
  createRetryFunction(operation, maxRetries = 3, delay = 1000) {
    return async (...args) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation(...args);
        } catch (error) {
          lastError = error;
          
          // Don't retry non-retryable errors
          const errorInfo = this.processError(error);
          if (!errorInfo.retryable) {
            throw error;
          }
          
          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
          }
        }
      }
      
      throw lastError;
    };
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Export utility functions for direct use
export const handleError = (error, context, language) => 
  errorHandler.handleError(error, context, language);
export const getErrorMessage = (errorCode, language, context) => 
  errorHandler.getErrorMessage(errorCode, language, context);
export const showErrorToast = (message, type) => 
  errorHandler.showErrorToast(message, type);
export const showSuccessToast = (message, language) => 
  errorHandler.showSuccessToast(message, language);
export const logError = (errorInfo, context) => 
  errorHandler.logError(errorInfo, context);
export const createRetryFunction = (operation, maxRetries, delay) => 
  errorHandler.createRetryFunction(operation, maxRetries, delay);