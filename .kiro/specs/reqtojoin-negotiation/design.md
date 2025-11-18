# Design Document

## Overview

The negotiation feature will be integrated directly into the existing `reqtojoin.svelte` component by adding a negotiation mode that activates when `isRishon=true` and the user clicks the negotiate button. The design leverages existing negotiation components from the `prPr` module while maintaining the current component structure and user experience.

## Architecture

### Component Structure

```
reqtojoin.svelte (existing)
├── Normal Mode (existing functionality)
│   ├── Mission Display
│   ├── Skill/Role/Workway Comparison
│   └── Action Buttons (Approve/Negotiate/Chat)
└── Negotiation Mode (new)
    ├── Editable Mission Parameters
    ├── Parameter Comparison Views
    ├── Task Management Interface
    └── Submit/Cancel Actions
```

### State Management

The component will use Svelte 5's `$state` runes to manage:
- `negotiationMode`: Boolean flag to toggle between normal and negotiation views
- `negotiatedParams`: Object containing all modified parameters
- `originalParams`: Reference to original values for comparison
- `loading`: Loading state during server operations
- `hasChanges`: Flag to track if any parameters were modified

### Integration Points

1. **Reuse from negoM.svelte**: Form components (Text, Number, DateNego, Elements, ActsNego)
2. **Reuse from pandingMesima.svelte**: State management patterns and GraphQL mutation logic
3. **Existing reqtojoin.svelte**: Maintain current layout and styling approach

## Components and Interfaces

### Negotiation Form Components

The design will import and reuse existing form components:

```javascript
import Text from '$lib/components/conf/text.svelte';
import Number from '$lib/components/conf/number.svelte';
import DateNego from '$lib/components/conf/dateNego.svelte';
import Elements from '$lib/components/conf/elements.svelte';
import ActsNego from '$lib/components/conf/actsNego.svelte';
import Rich from '$lib/components/conf/rich.svelte';
import Barb from '$lib/components/conf/barb.svelte';
```

### Interface Definitions

```typescript
interface NegotiatedParameters {
  name?: string;
  descrip?: string;
  noofhours?: number;
  perhour?: number;
  mdate?: string;
  mdates?: string;
  skills?: Array<{id: string, attributes: {skillName: string}}>;
  tafkidims?: Array<{id: string, attributes: {roleDescription: string}}>;
  workways?: Array<{id: string, attributes: {workWayName: string}}>;
  acts?: Array<TaskObject>;
  hearotMeyuchadot?: string;
  privatlinks?: string;
  isKavua?: boolean;
}

interface TaskObject {
  id: string;
  attributes: {
    shem: string;
    des?: string;
    link?: string;
    dateS?: string;
    dateF?: string;
  };
}
```

### Component Props Extension

The existing props interface will be extended to support negotiation:

```typescript
interface Props extends ExistingProps {
  // Existing props remain unchanged
  // New negotiation-specific props
  negopendmissions?: Array<any>; // Previous negotiation attempts
  timegramaId?: string; // For updating timegrama
  pendId?: string; // For creating negotiation records
  users?: Array<any>; // For user voting updates
  ordern?: number; // For vote ordering
}
```

## Data Models

### Negotiation Record Structure

When submitting negotiations, the system will create records following this structure:

```graphql
type NegopendmissionInput {
  publishedAt: DateTime
  pendm: ID
  users_permissions_user: ID
  isOriginal: Boolean
  name: String
  descrip: String
  noofhours: Float
  perhour: Float
  skills: [ID]
  tafkidims: [ID]
  work_ways: [ID]
  sqadualed: DateTime
  dates: DateTime
  acts: [ID]
  hearotMeyuchadot: String
  isMonth: Boolean
}
```

### Mission Update Structure

The original mission request will be updated with negotiated parameters:

```graphql
type PendmUpdateInput {
  name: String
  descrip: String
  noofhours: Float
  perhour: Float
  skills: [ID]
  tafkidims: [ID]
  work_ways: [ID]
  sqadualed: DateTime
  dates: DateTime
  acts: [ID]
  hearotMeyuchadot: String
  iskvua: Boolean
  users: [UserVoteInput]
  nego: [NegoVoteInput]
}
```

## Error Handling

### Validation Strategy

1. **Client-side Validation**:
   - Positive numbers for hours and rates
   - Valid date ranges (end date after start date)
   - Required field validation
   - Skill/role/workway selection validation

2. **Server-side Error Handling**:
   - GraphQL mutation error responses
   - Network connectivity issues
   - Authentication/authorization failures
   - Data consistency validation

### Error Recovery

- Display user-friendly error messages via toast notifications
- Maintain form state during errors to prevent data loss
- Provide retry mechanisms for failed operations
- Graceful degradation when optional features fail

## Testing Strategy

### Unit Testing Focus

1. **State Management**: Test negotiation mode toggling and parameter tracking
2. **Validation Logic**: Test client-side validation rules
3. **Data Transformation**: Test parameter comparison and change detection
4. **Component Integration**: Test form component integration and data flow

### Integration Testing Focus

1. **GraphQL Operations**: Test negotiation record creation and mission updates
2. **Task Management**: Test new task creation and existing task updates
3. **User Voting**: Test vote recording and state updates
4. **Error Scenarios**: Test error handling and recovery flows

### User Experience Testing

1. **Responsive Design**: Test negotiation interface across device sizes
2. **Accessibility**: Test keyboard navigation and screen reader compatibility
3. **Performance**: Test loading states and large dataset handling
4. **Cross-browser**: Test compatibility across major browsers

## Implementation Approach

### Phase 1: Basic Negotiation Mode

1. Add negotiation mode state management
2. Implement mode toggle functionality
3. Create basic parameter editing interface
4. Add parameter comparison display

### Phase 2: Advanced Parameter Editing

1. Integrate skill/role/workway selection
2. Add date editing with validation
3. Implement task management interface
4. Add visual comparison charts

### Phase 3: Server Integration

1. Implement GraphQL mutation logic
2. Add task creation handling
3. Integrate user voting updates
4. Add error handling and recovery

### Phase 4: Polish and Testing

1. Refine user interface and styling
2. Add loading states and feedback
3. Implement comprehensive testing
4. Performance optimization

## Security Considerations

### Authorization

- Verify `isRishon=true` on both client and server
- Validate user permissions for mission modification
- Ensure proper authentication for GraphQL operations

### Data Validation

- Sanitize all user inputs before server submission
- Validate parameter ranges and constraints
- Prevent injection attacks in text fields
- Verify data integrity during updates

### Audit Trail

- Log all negotiation attempts and outcomes
- Track parameter changes for accountability
- Maintain version history of negotiations
- Record user actions for debugging

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Load negotiation components only when needed
2. **State Efficiency**: Minimize reactive updates during parameter editing
3. **Network Optimization**: Batch GraphQL operations where possible
4. **Memory Management**: Clean up component state on mode exit

### Scalability

- Handle large numbers of skills/roles/workways efficiently
- Optimize task list rendering for missions with many tasks
- Implement pagination for large datasets if needed
- Cache frequently accessed data locally