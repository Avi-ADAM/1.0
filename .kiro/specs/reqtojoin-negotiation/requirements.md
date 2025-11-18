# Requirements Document

## Introduction

This feature integrates negotiation functionality directly into the existing `reqtojoin.svelte` component for cases where `isRishon=true`. Instead of creating new components, the negotiation interface will be embedded within the current component, allowing users to propose changes to mission parameters (hours, hourly rate, dates, skills, roles, work methods, and tasks) before final approval, reusing the existing negotiation logic from `pandingMesima.svelte`.

## Glossary

- **ReqToJoin_System**: The request-to-join component that handles mission assignment approvals
- **Negotiation_Interface**: An integrated interface within reqtojoin that allows users to modify mission parameters
- **Mission_Parameters**: The configurable aspects of a mission including hours, rates, dates, skills, roles, work methods, and tasks
- **Rishon_User**: A user with primary authority (isRishon=true) who can approve and negotiate mission assignments
- **Mission_Assignment**: The process of assigning a specific mission to a user within a project
- **Parameter_Comparison**: Visual comparison between original and negotiated values
- **GraphQL_Mutation**: Server-side operations to persist negotiation changes and create new records

## Requirements

### Requirement 1

**User Story:** As a Rishon user, I want to negotiate mission parameters before approving a request to join, so that I can adjust the mission terms to better fit project needs.

#### Acceptance Criteria

1. WHEN a Rishon user clicks the negotiate button, THE ReqToJoin_System SHALL toggle to negotiation mode within the same component
2. WHILE in negotiation mode, THE ReqToJoin_System SHALL display editable fields for all Mission_Parameters
3. THE ReqToJoin_System SHALL populate the negotiation fields with current mission values as defaults
4. WHEN the user modifies any Mission_Parameters, THE ReqToJoin_System SHALL track changes for comparison
5. THE ReqToJoin_System SHALL display a visual comparison between original and modified values

### Requirement 2

**User Story:** As a Rishon user, I want to modify mission hours and hourly rates during negotiation, so that I can adjust the financial terms of the mission.

#### Acceptance Criteria

1. THE ReqToJoin_System SHALL provide editable number inputs for hours and hourly rate
2. WHEN hours or hourly rate values change, THE ReqToJoin_System SHALL calculate and display the new total value
3. THE ReqToJoin_System SHALL display a comparison chart showing original vs negotiated totals
4. WHILE isKavua is true, THE ReqToJoin_System SHALL indicate that hours are per month
5. THE ReqToJoin_System SHALL validate that hours and rates are positive numbers

### Requirement 3

**User Story:** As a Rishon user, I want to modify mission dates during negotiation, so that I can adjust the timeline to fit project schedules.

#### Acceptance Criteria

1. THE ReqToJoin_System SHALL provide date picker inputs for start and end dates
2. WHEN date values change, THE ReqToJoin_System SHALL validate that end date is after start date
3. THE ReqToJoin_System SHALL display original dates alongside negotiated dates for comparison
4. THE ReqToJoin_System SHALL format dates according to user locale settings
5. THE ReqToJoin_System SHALL handle both scheduled (sqadualed) and completion (dates) date types

### Requirement 4

**User Story:** As a Rishon user, I want to modify required skills, roles, and work methods during negotiation, so that I can better match mission requirements to available resources.

#### Acceptance Criteria

1. THE ReqToJoin_System SHALL provide multi-select interfaces for skills, roles, and work methods
2. WHEN skill selections change, THE ReqToJoin_System SHALL update the requirements list
3. THE ReqToJoin_System SHALL allow adding new skills, roles, or work methods during negotiation
4. THE ReqToJoin_System SHALL display comparison between original and negotiated requirements
5. THE ReqToJoin_System SHALL maintain skill-user matching analysis with updated requirements

### Requirement 5

**User Story:** As a Rishon user, I want to modify mission tasks during negotiation, so that I can adjust the scope and deliverables of the mission.

#### Acceptance Criteria

1. THE ReqToJoin_System SHALL provide an interface to edit existing tasks and add new tasks
2. WHEN tasks are modified, THE ReqToJoin_System SHALL track changes for server synchronization
3. THE ReqToJoin_System SHALL allow editing task names, descriptions, links, and dates
4. WHEN new tasks are added, THE ReqToJoin_System SHALL assign temporary IDs until server creation
5. THE ReqToJoin_System SHALL handle task creation via GraphQL mutations during negotiation submission

### Requirement 6

**User Story:** As a Rishon user, I want to submit negotiation changes and create appropriate server records, so that the negotiated terms are properly stored and tracked.

#### Acceptance Criteria

1. WHEN the user submits negotiation changes, THE ReqToJoin_System SHALL create a negotiation record via GraphQL
2. THE ReqToJoin_System SHALL update the original mission request with negotiated parameters
3. WHEN new tasks were added, THE ReqToJoin_System SHALL create task records before updating the mission
4. THE ReqToJoin_System SHALL update user voting records to reflect the negotiation
5. IF negotiation submission fails, THEN THE ReqToJoin_System SHALL display error messages and allow retry

### Requirement 7

**User Story:** As a Rishon user, I want visual feedback during the negotiation process, so that I can understand the impact of my changes.

#### Acceptance Criteria

1. THE ReqToJoin_System SHALL display loading indicators during server operations
2. WHEN parameters change, THE ReqToJoin_System SHALL immediately update comparison displays
3. THE ReqToJoin_System SHALL use color coding to distinguish original vs negotiated values
4. THE ReqToJoin_System SHALL display success/error toasts for user feedback
5. THE ReqToJoin_System SHALL maintain responsive design across mobile and desktop interfaces

### Requirement 8

**User Story:** As a system administrator, I want the negotiation feature to integrate seamlessly within the existing reqtojoin component, so that code maintenance and consistency are preserved.

#### Acceptance Criteria

1. THE ReqToJoin_System SHALL integrate negotiation functionality directly within the existing component structure
2. THE ReqToJoin_System SHALL reuse existing form components and styling from the prPr module where applicable
3. THE ReqToJoin_System SHALL follow the same state management patterns as pandingMesima for consistency
4. THE ReqToJoin_System SHALL use consistent GraphQL mutation patterns for server operations
5. THE ReqToJoin_System SHALL preserve all existing functionality and only add negotiation features when isRishon is true