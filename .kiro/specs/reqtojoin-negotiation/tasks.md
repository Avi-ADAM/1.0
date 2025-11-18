# Implementation Plan

- [x] 1. Set up negotiation state management and mode toggling







  - Add negotiation mode state variables using Svelte 5 $state runes
  - Implement negotiation mode toggle function triggered by negotiate button
  - Create negotiated parameters state object to track all changes
  - Add loading state management for server operations
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Implement basic parameter editing interface
  - [ ] 2.1 Import required form components from prPr module
    - Import Text, Number, DateNego, Elements, ActsNego, Rich, Barb components
    - Import necessary utility functions and stores from existing negotiation code
    - _Requirements: 8.2_

  - [ ] 2.2 Create negotiation mode UI structure
    - Add conditional rendering for negotiation mode vs normal mode
    - Implement parameter editing form layout within existing component structure
    - Add visual indicators to distinguish negotiation mode from normal mode
    - _Requirements: 1.2, 7.3_

  - [ ] 2.3 Implement basic text and numeric parameter editing
    - Add editable fields for mission name, description, and special notes
    - Implement hours and hourly rate editing with validation
    - Add real-time total calculation display with monthly indicators
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 3. Add date and boolean parameter editing
  - [ ] 3.1 Implement date editing functionality
    - Add DateNego components for start and end date editing
    - Implement date validation (end date after start date)
    - Add locale-aware date formatting and display
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 3.2 Add isKavua (monthly) toggle functionality
    - Implement checkbox for monthly mission toggle
    - Update hour display labels based on isKavua state
    - Adjust total calculation display for monthly vs one-time missions
    - _Requirements: 2.4_

- [ ] 4. Implement skills, roles, and work methods editing
  - [ ] 4.1 Add multi-select interfaces for requirements
    - Integrate Elements components for skills, roles, and work methods selection
    - Implement add new functionality for each requirement type
    - Add visual comparison between original and negotiated requirements
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 4.2 Update skill matching analysis
    - Modify existing skill comparison logic to use negotiated requirements
    - Update matched/missing/extra skill displays based on negotiated values
    - Apply same logic to roles and work methods comparison
    - _Requirements: 4.5_

- [ ] 5. Add task management interface
  - [ ] 5.1 Implement task editing functionality
    - Integrate ActsNego component for task management
    - Add ability to edit existing task names, descriptions, links, and dates
    - Implement new task creation with temporary ID assignment
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 5.2 Add task change tracking
    - Implement change detection for modified tasks
    - Track new tasks separately for server creation
    - Add visual indicators for changed and new tasks
    - _Requirements: 5.2, 5.4_

- [ ] 6. Create parameter comparison and visualization
  - [ ] 6.1 Add visual comparison displays
    - Implement side-by-side comparison for changed parameters
    - Add Barb component for total value comparison chart
    - Use color coding to distinguish original vs negotiated values
    - _Requirements: 1.4, 1.5, 7.2, 7.3_

  - [ ] 6.2 Add change detection and highlighting
    - Implement change detection for all parameter types
    - Add visual indicators for modified fields
    - Display summary of all changes before submission
    - _Requirements: 7.2_

- [ ] 7. Implement server integration and GraphQL operations
  - [ ] 7.1 Add task creation handling
    - Implement crTask function integration for new tasks
    - Add datetime conversion for task dates (datetime-local to ISO)
    - Handle task creation errors and provide user feedback
    - _Requirements: 5.5, 6.3_

  - [ ] 7.2 Implement negotiation record creation
    - Add GraphQL mutation for createNegopendmission
    - Include all original parameters in negotiation record
    - Handle server response and error cases
    - _Requirements: 6.1, 6.5_

  - [ ] 7.3 Add mission update functionality
    - Implement updatePendm mutation with negotiated parameters
    - Update user voting records to reflect negotiation
    - Handle timegrama updates for response timing
    - _Requirements: 6.2, 6.4_

- [ ] 8. Add loading states and user feedback
  - [ ] 8.1 Implement loading indicators
    - Add loading state during server operations
    - Display progress indicators for multi-step operations (task creation + negotiation)
    - Disable form interactions during loading
    - _Requirements: 7.1_

  - [ ] 8.2 Add success and error handling
    - Implement toast notifications for success/error feedback
    - Add error recovery mechanisms for failed operations
    - Provide clear error messages for different failure scenarios
    - _Requirements: 6.5, 7.4_

- [ ] 9. Add form validation and data integrity
  - [ ] 9.1 Implement client-side validation
    - Add positive number validation for hours and rates
    - Implement date range validation
    - Add required field validation for critical parameters
    - _Requirements: 2.5, 3.2_

  - [ ] 9.2 Add data consistency checks
    - Validate skill/role/workway selections
    - Check for duplicate entries in multi-select fields
    - Ensure data integrity before server submission
    - _Requirements: 4.1_

- [ ] 10. Integrate with existing component functionality
  - [ ] 10.1 Preserve existing functionality
    - Ensure normal mode functionality remains unchanged
    - Maintain existing prop interfaces and callback functions
    - Preserve responsive design and accessibility features
    - _Requirements: 8.5_

  - [ ] 10.2 Add negotiation mode callbacks
    - Implement onNegotiationComplete callback for parent component
    - Add onNegotiationCancel callback for cleanup
    - Ensure proper state reset when exiting negotiation mode
    - _Requirements: 8.1_

- [ ]* 11. Add comprehensive testing
  - [ ]* 11.1 Write unit tests for negotiation functionality
    - Test negotiation mode toggling and state management
    - Test parameter change detection and validation
    - Test data transformation and comparison logic
    - _Requirements: All_

  - [ ]* 11.2 Write integration tests for server operations
    - Test GraphQL mutation execution and error handling
    - Test task creation and mission update workflows
    - Test user voting and timegrama update integration
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]* 12. Performance optimization and polish
  - [ ]* 12.1 Optimize component performance
    - Implement lazy loading for negotiation components
    - Optimize reactive updates and state management
    - Add memory cleanup for negotiation mode exit
    - _Requirements: 7.1_

  - [ ]* 12.2 Enhance user experience
    - Add smooth transitions between normal and negotiation modes
    - Implement keyboard shortcuts for common actions
    - Add tooltips and help text for complex features
    - _Requirements: 7.1, 7.4_