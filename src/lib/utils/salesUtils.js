/**
 * Sales Utilities - Helper functions for sales operations
 * Provides common utilities for data formatting, validation, and calculations
 */

import dayjs from 'dayjs';

/**
 * Date and time utilities for sales
 */
export const dateUtils = {
  /**
   * Formats date for display based on language
   * @param {Date|string} date - Date to format
   * @param {string} language - Language code ('he' or 'en')
   * @returns {string} Formatted date string
   */
  formatDate(date, language = 'he') {
    if (!date) return '';
    
    dayjs.locale(language);
    const format = language === 'en' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
    return dayjs(date).format(format);
  },

  /**
   * Formats datetime for input fields
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted datetime-local string
   */
  formatDateTimeLocal(date) {
    if (!date) return '';
    return dayjs(date).format('YYYY-MM-DDTHH:mm');
  },

  /**
   * Validates date range for recurring sales
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {Object} Validation result
   */
  validateDateRange(startDate, endDate) {
    if (!startDate) {
      return { isValid: false, error: 'NO_START_DATE' };
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      return { isValid: false, error: 'INVALID_DATE_RANGE' };
    }

    return { isValid: true };
  },

  /**
   * Calculates period difference for recurring sales
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @param {string} periodType - 'monthly' or 'yearly'
   * @returns {number} Number of periods
   */
  calculatePeriods(startDate, endDate, periodType) {
    if (!startDate || !endDate) return 1;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (periodType === 'monthly') {
      return ((end.getFullYear() - start.getFullYear()) * 12 + 
              (end.getMonth() - start.getMonth()));
    } else if (periodType === 'yearly') {
      return end.getFullYear() - start.getFullYear();
    }

    return 1;
  }
};

/**
 * Number and currency formatting utilities
 */
export const numberUtils = {
  /**
   * Formats currency amount
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code (default: 'ILS')
   * @param {string} language - Language code
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount, currency = 'ILS', language = 'he') {
    if (typeof amount !== 'number') return '0';
    
    const locale = language === 'he' ? 'he-IL' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  },

  /**
   * Formats number with thousands separator
   * @param {number} number - Number to format
   * @param {string} language - Language code
   * @returns {string} Formatted number string
   */
  formatNumber(number, language = 'he') {
    if (typeof number !== 'number') return '0';
    
    const locale = language === 'he' ? 'he-IL' : 'en-US';
    return new Intl.NumberFormat(locale).format(number);
  },

  /**
   * Validates numeric input
   * @param {any} value - Value to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateNumber(value, options = {}) {
    const { min = 0, max = Infinity, allowDecimals = true } = options;
    
    const num = Number(value);
    
    if (isNaN(num)) {
      return { isValid: false, error: 'INVALID_NUMBER' };
    }

    if (num < min) {
      return { isValid: false, error: 'NUMBER_TOO_SMALL', min };
    }

    if (num > max) {
      return { isValid: false, error: 'NUMBER_TOO_LARGE', max };
    }

    if (!allowDecimals && num % 1 !== 0) {
      return { isValid: false, error: 'DECIMALS_NOT_ALLOWED' };
    }

    return { isValid: true, value: num };
  }
};

/**
 * User and project utilities
 */
export const userUtils = {
  /**
   * Formats user display name
   * @param {Object} user - User object
   * @returns {string} Display name
   */
  formatUserDisplayName(user) {
    if (!user || !user.attributes) return '';
    
    const { username, firstName, lastName } = user.attributes;
    
    if (firstName && lastName) {
      return `${firstName} ${lastName} (${username})`;
    }
    
    return username || '';
  },

  /**
   * Filters users by search term
   * @param {Array} users - Array of users
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered users
   */
  filterUsers(users, searchTerm) {
    if (!searchTerm || !users) return users;
    
    const term = searchTerm.toLowerCase();
    return users.filter(user => {
      const username = user.attributes?.username?.toLowerCase() || '';
      const firstName = user.attributes?.firstName?.toLowerCase() || '';
      const lastName = user.attributes?.lastName?.toLowerCase() || '';
      
      return username.includes(term) || 
             firstName.includes(term) || 
             lastName.includes(term);
    });
  },

  /**
   * Sorts users alphabetically
   * @param {Array} users - Array of users
   * @param {string} language - Language for sorting
   * @returns {Array} Sorted users
   */
  sortUsers(users, language = 'he') {
    if (!users) return [];
    
    return [...users].sort((a, b) => {
      const nameA = a.attributes?.username || '';
      const nameB = b.attributes?.username || '';
      
      return nameA.localeCompare(nameB, language);
    });
  }
};

/**
 * Product utilities
 */
export const productUtils = {
  /**
   * Formats product display name
   * @param {Object} product - Product object
   * @returns {string} Display name
   */
  formatProductDisplayName(product) {
    if (!product || !product.attributes) return '';
    
    const { name, price, quant } = product.attributes;
    return `${name} - ${numberUtils.formatCurrency(price)} (${quant} available)`;
  },

  /**
   * Checks if product is available for sale
   * @param {Object} product - Product object
   * @param {number} requestedQuantity - Requested quantity
   * @returns {Object} Availability check result
   */
  checkAvailability(product, requestedQuantity = 1) {
    if (!product || !product.attributes) {
      return { isAvailable: false, error: 'INVALID_PRODUCT' };
    }

    const { quant, kindOf } = product.attributes;
    
    if (kindOf === 'unlimited') {
      return { isAvailable: true };
    }

    if (quant < requestedQuantity) {
      return { 
        isAvailable: false, 
        error: 'INSUFFICIENT_QUANTITY',
        available: quant,
        requested: requestedQuantity
      };
    }

    return { isAvailable: true, available: quant };
  },

  /**
   * Gets product sale types
   * @param {Object} product - Product object
   * @returns {Array} Available sale types
   */
  getAvailableSaleTypes(product) {
    if (!product || !product.attributes) return [];
    
    const { kindOf } = product.attributes;
    const types = ['total'];
    
    if (kindOf === 'monthly' || kindOf === 'yearly' || kindOf === 'unlimited') {
      types.push(kindOf);
    }
    
    return types;
  }
};

/**
 * Form validation utilities
 */
export const formUtils = {
  /**
   * Validates required fields
   * @param {Object} data - Form data
   * @param {Array} requiredFields - Required field names
   * @returns {Object} Validation result
   */
  validateRequiredFields(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
        errors.push(`REQUIRED_FIELD_${field.toUpperCase()}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Sanitizes form input
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  },

  /**
   * Debounces function calls
   * @param {Function} func - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
};

/**
 * Error handling utilities
 */
export const errorUtils = {
  /**
   * Maps error codes to user-friendly messages
   * @param {string} errorCode - Error code
   * @param {string} language - Language code
   * @param {Object} context - Additional context for error message
   * @returns {string} User-friendly error message
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
        en: 'No start date'
      },
      INVALID_DATE_RANGE: {
        he: 'טווח תאריכים לא תקין',
        en: 'Invalid date range'
      },
      
      // Authentication errors
      AUTH_FAILED: {
        he: 'שגיאת אימות',
        en: 'Authentication failed'
      },
      
      // Network errors
      NETWORK_ERROR: {
        he: 'שגיאת רשת',
        en: 'Network error'
      },
      
      // General errors
      UNKNOWN_ERROR: {
        he: 'שגיאה לא ידועה',
        en: 'Unknown error'
      }
    };

    return messages[errorCode]?.[language] || messages.UNKNOWN_ERROR[language];
  },

  /**
   * Logs error with context
   * @param {Error|string} error - Error to log
   * @param {Object} context - Additional context
   */
  logError(error, context = {}) {
    console.error('Sales Error:', {
      error: error.message || error,
      context,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Storage utilities for caching
 */
export const storageUtils = {
  /**
   * Sets item in localStorage with expiration
   * @param {string} key - Storage key
   * @param {any} value - Value to store
   * @param {number} ttlMinutes - Time to live in minutes
   */
  setWithExpiry(key, value, ttlMinutes = 60) {
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + (ttlMinutes * 60 * 1000)
    };
    localStorage.setItem(key, JSON.stringify(item));
  },

  /**
   * Gets item from localStorage with expiration check
   * @param {string} key - Storage key
   * @returns {any|null} Stored value or null if expired/not found
   */
  getWithExpiry(key) {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      const now = new Date();

      if (now.getTime() > item.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  },

  /**
   * Removes item from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    localStorage.removeItem(key);
  }
};