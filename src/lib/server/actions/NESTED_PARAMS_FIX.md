# Nested Parameter Support Fix

## Issue
The `projectMember` authorization rule was failing when `projectIdParam` used nested paths like `'data.project'`. The authorization engine was trying to access `params['data.project']` instead of `params.data.project`.

## Root Cause
The `checkProjectMembership` method in `AuthorizationEngine.ts` was using direct bracket notation to access parameters:
```typescript
const projectId = params[projectIdParam]; // Doesn't work for 'data.project'
```

## Solution
Added a `getNestedValue` helper method that supports dot notation for nested property access:
```typescript
private getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
```

Now the authorization engine correctly handles nested paths:
```typescript
const projectId = this.getNestedValue(params, projectIdParam);
```

## Affected Actions
- `createHaluka` - Uses `projectIdParam: 'data.project'`
- `createTosplit` - Uses `projectIdParam: 'data.project'`

## Testing
Added test case: "should support nested projectId parameter paths" to verify the fix works correctly.

## Date
November 25, 2025
