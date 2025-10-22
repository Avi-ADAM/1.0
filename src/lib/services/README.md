# Sales Services and Utilities

This directory contains reusable sales logic extracted from the original `sale.svelte` component. The services provide modular, testable functions for sales operations across the application.

## Overview

- **`salesService.js`** - Main sales business logic and GraphQL operations
- **`salesUtils.js`** - Utility functions for data formatting, validation, and calculations
- **`authUtils.js`** - Authentication and authorization utilities
- **`errorHandling.js`** - Centralized error handling and user feedback
- **`index.js`** - Main export file for easy imports

## Quick Start

```javascript
import { 
  salesService, 
  validateSaleData, 
  calculateTotal,
  handleError,
  isAuthenticated 
} from '$lib/services';

// Check authentication
if (!isAuthenticated()) {
  // Handle unauthenticated user
  return;
}

// Validate sale data
const validation = validateSaleData({
  selectedUsers: ['username'],
  quantity: 5,
  availableQuantity: 10,
  kindOf: 'monthly',
  startDate: new Date()
});

if (!validation.isValid) {
  // Handle validation errors
  validation.errors.forEach(error => {
    console.log(getErrorMessage(error, 'he'));
  });
  return;
}

// Calculate total
const total = calculateTotal({
  quantity: 5,
  pricePerUnit: 100,
  kindOf: 'monthly',
  startDate: new Date('2024-01-01'),
  finishDate: new Date('2024-12-31')
});

// Create sale
try {
  const result = await salesService.createSale({
    saleData: {
      project: 'project-id',
      matanot: 'product-id',
      users_permissions_user: 'user-id',
      in: total,
      unit: 5,
      date: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    },
    productId: 'product-id',
    currentQuantity: 10,
    soldQuantity: 5,
    kindOf: 'monthly'
  });

  if (result.success) {
    console.log('Sale created successfully:', result.data);
  } else {
    handleError(result.error, { operation: 'create_sale' });
  }
} catch (error) {
  handleError(error, { operation: 'create_sale' });
}
```

## Sales Service API

### Main Methods

#### `validateSaleData(params)`
Validates sale parameters before submission.

```javascript
const validation = validateSaleData({
  selectedUsers: ['username'],
  quantity: 5,
  availableQuantity: 10,
  kindOf: 'monthly',
  startDate: new Date()
});
// Returns: { isValid: boolean, errors: string[] }
```

#### `calculateTotal(params)`
Calculates total amount for different sale types.

```javascript
const total = calculateTotal({
  quantity: 5,
  pricePerUnit: 100,
  kindOf: 'monthly',
  startDate: new Date('2024-01-01'),
  finishDate: new Date('2024-12-31')
});
// Returns: number (total amount)
```

#### `createSale(params)`
Creates a sale with optional quantity update.

```javascript
const result = await salesService.createSale({
  saleData: formatSaleData({...}),
  productId: 'product-id',
  currentQuantity: 10,
  soldQuantity: 5,
  kindOf: 'monthly',
  updateQuantity: true
});
// Returns: Promise<{ success: boolean, data?: any, error?: string }>
```

## Utility Functions

### Date Utils
```javascript
import { dateUtils } from '$lib/services';

// Format date for display
const formatted = dateUtils.formatDate(new Date(), 'he');

// Calculate periods for recurring sales
const periods = dateUtils.calculatePeriods(startDate, endDate, 'monthly');
```

### Number Utils
```javascript
import { numberUtils } from '$lib/services';

// Format currency
const price = numberUtils.formatCurrency(1500, 'ILS', 'he');

// Validate numbers
const validation = numberUtils.validateNumber(value, { min: 0, max: 100 });
```

### User Utils
```javascript
import { userUtils } from '$lib/services';

// Format user display name
const displayName = userUtils.formatUserDisplayName(user);

// Filter and sort users
const filtered = userUtils.filterUsers(users, 'search term');
const sorted = userUtils.sortUsers(users, 'he');
```

## Authentication

### Check Authentication
```javascript
import { isAuthenticated, getCurrentUserId } from '$lib/services';

if (isAuthenticated()) {
  const userId = getCurrentUserId();
  // User is authenticated
}
```

### Check Project Access
```javascript
import { hasProjectAccess } from '$lib/services';

const canAccess = await hasProjectAccess('project-id');
if (canAccess) {
  // User has access to project
}
```

### Get User Projects
```javascript
import { getUserProjects } from '$lib/services';

const projects = await getUserProjects();
// Returns array of projects user has access to
```

## Error Handling

### Handle Errors
```javascript
import { handleError } from '$lib/services';

try {
  // Some operation
} catch (error) {
  const result = handleError(error, {
    operation: 'create_sale',
    userId: 'user-id',
    projectId: 'project-id'
  }, 'he');
  
  if (result.requiresLogin) {
    // Redirect to login
  }
}
```

### Show Toast Messages
```javascript
import { showSuccessToast, showErrorToast } from '$lib/services';

// Success message
showSuccessToast('המכירה נוצרה בהצלחה', 'he');

// Error message
showErrorToast('שגיאה ביצירת המכירה', 'error');
```

## Integration with Existing Components

The services are designed to be drop-in replacements for the logic in the original `sale.svelte` component:

### Before (in sale.svelte)
```javascript
// Complex validation logic mixed with UI
let validation = /* complex validation */;
let total = /* complex calculation */;
// Direct GraphQL mutation
const result = await fetch(/* ... */);
```

### After (using services)
```javascript
import { validateSaleData, calculateTotal, createSale } from '$lib/services';

// Clean, testable logic
const validation = validateSaleData(params);
const total = calculateTotal(params);
const result = await createSale(params);
```

## Error Codes

Common error codes returned by the services:

- `NO_USER_SELECTED` - No user selected for sale
- `INVALID_QUANTITY` - Invalid quantity value
- `INSUFFICIENT_QUANTITY` - Not enough quantity available
- `NO_START_DATE` - Missing start date for recurring sales
- `AUTH_FAILED` - Authentication failed
- `PERMISSION_DENIED` - User lacks permission
- `NETWORK_ERROR` - Network connectivity issue
- `SERVER_ERROR` - Server-side error

## Localization

All error messages and user-facing text support Hebrew and English:

```javascript
import { getErrorMessage } from '$lib/services';

const hebrewMessage = getErrorMessage('NO_USER_SELECTED', 'he');
const englishMessage = getErrorMessage('NO_USER_SELECTED', 'en');
```

## Project Membership Service

### Check Project Membership
```javascript
import { checkProjectMembership, isProjectMember } from '$lib/services';

// Detailed membership check
const result = await checkProjectMembership('user-id', 'project-id', {
  useCache: true,
  includeProjectInfo: true
});

if (result.success && result.isMember) {
  console.log('Membership type:', result.membershipType); // 'creator' or 'member'
  console.log('Project info:', result.projectInfo);
}

// Simple boolean check
const isMember = await isProjectMember('user-id', 'project-id');
```

### Get User Project Memberships
```javascript
import { getUserProjectMemberships } from '$lib/services';

const result = await getUserProjectMemberships('user-id', {
  includeProjectInfo: true,
  membershipTypes: ['creator', 'member'] // Filter by types
});

if (result.success) {
  result.data.projects.forEach(project => {
    console.log(`${project.projectName}: ${project.membershipType}`);
  });
}
```

### Batch Membership Check
```javascript
import { batchCheckMembership } from '$lib/services';

const projectIds = ['project-1', 'project-2', 'project-3'];
const result = await batchCheckMembership('user-id', projectIds);

if (result.success) {
  result.data.results.forEach(({ projectId, isMember, membershipType }) => {
    console.log(`Project ${projectId}: ${isMember ? membershipType : 'not a member'}`);
  });
}
```

### Cache Management
```javascript
import { invalidateMembershipCache, refreshMembershipData } from '$lib/services';

// Clear cache for specific project
invalidateMembershipCache('user-id', 'project-id');

// Clear all membership cache for user
invalidateMembershipCache('user-id');

// Refresh membership data
const refreshed = await refreshMembershipData('user-id');
```

## Caching

The services include intelligent caching for:
- Authentication data (30 minutes)
- Project access permissions (15 minutes)
- User project lists (30 minutes)
- Project membership data (15 minutes for individual checks, 30 minutes for batch operations)

Cache is automatically cleared on authentication changes or errors.