/**
 * Central re-export hub for generated Strapi GraphQL types.
 * 
 * This module bridges the auto-generated types from `graphql-codegen`
 * with the existing project type system in `src/lib/types/`.
 * 
 * Usage:
 * ```typescript
 * // Import specific types
 * import type { UsersPermissionsUser, Project, Act } from '$generated/graphql';
 * 
 * // Or import from this index
 * import type { UsersPermissionsUser, Project } from '$generated';
 * ```
 * 
 * @see src/lib/types/strapiTypes.ts - Helper utilities for Strapi data structures
 * @see src/lib/types/queryTypes.ts  - Pre-defined query response types
 * @see src/lib/types/validation.ts  - Runtime validation schemas
 * @see codegen.ts                   - GraphQL codegen configuration
 */

// Re-export everything from the generated GraphQL types
export type * from './graphql';
