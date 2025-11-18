# Design Document

## Overview

This design provides a comprehensive approach to integrating Strapi TypeScript types into the SvelteKit frontend, enabling type-safe GraphQL queries and API responses while maintaining compatibility with the existing JavaScript codebase.

## Architecture

### Type System Layers

```
┌─────────────────────────────────────────┐
│   Svelte Components (.svelte)           │
│   - Use flattened types                 │
│   - Type-safe data access               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Type Helpers (strapiTypes.ts)         │
│   - Extract attributes                  │
│   - Flatten structures                  │
│   - Handle relations                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   GraphQL Response Types                │
│   - Typed query responses               │
│   - Nested data structures              │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Generated Strapi Types                │
│   - contentTypes.d.ts                   │
│   - components.d.ts                     │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Type Helper Utilities (`src/lib/types/strapiTypes.ts`)

**Purpose:** Provide utility types to work with Strapi's nested structure

**Key Types:**

```typescript
// Extract attributes from a Strapi content type
type StrapiAttributes<T> = T extends { attributes: infer A } ? A : never;

// Flatten a Strapi entity (remove data.attributes nesting)
type FlattenEntity<T> = {
  id: string;
} & StrapiAttributes<T>;

// Handle single relations
type FlattenRelation<T> = T extends { data: infer D }
  ? D extends { attributes: infer A }
    ? FlattenEntity<D>
    : never
  : never;

// Handle collection relations
type FlattenRelationArray<T> = T extends { data: Array<infer D> }
  ? Array<FlattenEntity<D>>
  : never;
```

### 2. GraphQL Response Wrapper

**Purpose:** Type the standard Strapi GraphQL response structure

```typescript
interface StrapiResponse<T> {
  data: T;
}

interface StrapiEntity<T> {
  data: {
    id: string;
    attributes: T;
  };
}

interface StrapiCollection<T> {
  data: Array<{
    id: string;
    attributes: T;
  }>;
}
```

### 3. Enhanced sendToSer Function

**Purpose:** Add TypeScript generic support to the existing sendToSer utility

**Approach:** Create a TypeScript wrapper that maintains backward compatibility

```typescript
// New typed version
export async function sendToSerTyped<T>(
  variables: Record<string, any>,
  queryId: string,
  me: number,
  project: number,
  isSer: boolean,
  fetch: typeof globalThis.fetch
): Promise<T> {
  // Delegates to existing sendToSer
  return sendToSer(variables, queryId, me, project, isSer, fetch) as Promise<T>;
}
```

### 4. Query Type Definitions

**Purpose:** Define types for common GraphQL queries

**Example:**

```typescript
// For getUserProjectList query
type UserProjectListResponse = StrapiResponse<{
  usersPermissionsUser: StrapiEntity<{
    projects_1s: StrapiCollection<{
      projectName: string;
      profilePic: {
        data: {
          attributes: {
            url: string;
          };
        } | null;
      };
      createdAt: string;
    }>;
  }>;
}>;
```

## Data Models

### Strapi Content Type Structure

```typescript
// Raw Strapi structure (from generated types)
interface PluginUsersPermissionsUser {
  attributes: {
    username: string;
    email: string;
    projects_1s: Relation<'manyToMany', 'api::project.project'>;
    // ... other fields
  };
}

// Flattened for component use
interface User {
  id: string;
  username: string;
  email: string;
  projects: Array<Project>;
}
```

## Error Handling

### Type Validation Strategy

1. **Compile-time checks:** TypeScript catches type mismatches during development
2. **Runtime validation:** Optional runtime checks for API responses
3. **Graceful degradation:** Fallback to `any` type for dynamic queries

### Error Scenarios

- **Missing fields:** TypeScript error if accessing non-existent field
- **Wrong type:** TypeScript error if assigning incompatible type
- **Null handling:** Explicit null checks required for optional fields

## Testing Strategy

### Type Testing Approach

1. **Type-only tests:** Use TypeScript's type system to validate types
2. **Integration tests:** Test typed queries against mock responses
3. **Component tests:** Verify components work with typed data

### Example Type Test

```typescript
// This should compile without errors
const validUser: FlattenEntity<PluginUsersPermissionsUser> = {
  id: '1',
  username: 'test',
  email: 'test@example.com'
};

// This should cause a TypeScript error
const invalidUser: FlattenEntity<PluginUsersPermissionsUser> = {
  id: '1',
  username: 123 // Error: Type 'number' is not assignable to type 'string'
};
```

## Migration Path

### Phase 1: Foundation (Immediate)
- Create type helper utilities
- Add TypeScript wrapper for sendToSer
- Document usage patterns

### Phase 2: Gradual Adoption (Ongoing)
- Add types to new components
- Use JSDoc for type hints in existing JavaScript
- Convert critical files to TypeScript

### Phase 3: Full Integration (Future)
- Convert all components to TypeScript
- Add runtime validation
- Generate query types automatically

## Design Decisions

### Decision 1: Keep Existing sendToSer
**Rationale:** Maintain backward compatibility; no breaking changes to existing code

### Decision 2: Provide Flattened Types
**Rationale:** Strapi's nested structure is verbose; flattened types are easier to use in components

### Decision 3: Support Both JS and TS
**Rationale:** Allow gradual migration; developers can adopt types at their own pace

### Decision 4: Use JSDoc for JavaScript Files
**Rationale:** Provide type checking in .js files without requiring conversion to .ts

## Performance Considerations

- **No runtime overhead:** Types are erased at compile time
- **Bundle size:** Type definitions don't affect bundle size
- **Development speed:** Autocomplete and type checking improve developer productivity

## Security Considerations

- **Type safety:** Prevents common bugs from type mismatches
- **API contract:** Types document expected API structure
- **Validation:** Types don't replace runtime validation for user input
