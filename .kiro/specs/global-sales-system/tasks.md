# Implementation Plan - Global Sales System

- [x] 1. Create reusable sales service and utilities
  - Extract sales logic from existing sale.svelte into a reusable service module
  - Create utility functions for sale validation, calculation, and data formatting
  - Implement error handling and authentication utilities for sales operations
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2_

- [x] 2. Refactor existing sale component for global use
  - Move sale.svelte to a global location and make it accept flexible props
  - Update component to work with any project/product combination instead of relying on global stores
  - Preserve all existing functionality including date ranges, user selection, and validation
  - Maintain royal gold styling and Hebrew/English localization
  - _Requirements: 1.1, 1.2, 1.5, 5.1, 5.3, 5.4_

- [x] 3. Create sales center page structure and routing
  - Create new route at /sales-center for registered users
  - Implement page layout with project grouping and product display
  - Add filtering and search functionality for products
  - Apply royal gold theme and responsive design
  - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.5_

- [x] 4. Implement user project and product aggregation
  - Create service functions to fetch all user projects and their sellable products
  - Implement data aggregation logic to combine products from multiple projects
  - Add caching mechanism for improved performance
  - Handle loading states and error scenarios
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 5. Integrate sale component into sales center
  - Connect the global sale component to each product in the sales center
  - Implement proper callback handling for successful sales
  - Add real-time quantity updates after sales
  - Handle multiple concurrent sale operations
  - _Requirements: 2.5, 4.3, 4.4_

- [x] 6. Add project membership checking service
  - Create utility function to check if user is member of a specific project
  - Implement caching for membership data to improve performance
  - Add proper error handling for permission checks

  - _Requirements: 3.1, 3.2_

- [x] 7. Enhance product page with sale reporting capability
  - Modify gift/[id]/+page.svelte to check user project membership

  - Add conditional sale reporting interface for project members
  - Integrate global sale component while preserving existing buy now functionality
  - Update product quantity display after successful sales
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Update existing project management integration

  - Modify existing project management pages to use the new global sale component
  - Ensure backward compatibility with existing callback patterns
  - Test all existing sale workflows to ensure no regression
  - _Requirements: 1.1, 1.2, 1.5_

- [ ]\* 9. Add comprehensive error handling and user feedback
  - Implement toast notifications for sale success/failure scenarios
  - Add proper loading states during sale operations
  - Create user-friendly error messages in Hebrew and English
  - _Requirements: 4.3, 5.4_

- [ ]\* 10. Create unit tests for sales service functions
  - Write tests for sale validation logic
  - Test calculation functions for different sale types
  - Test error handling scenarios
  - _Requirements: 4.1, 4.2, 4.3_

- [ ]\* 11. Add integration tests for sale workflows
  - Test complete sale flow from sales center
  - Test product page sale reporting
  - Test project management sale integration
  - _Requirements: 1.1, 2.5, 3.5_
