/**
 * Strapi Type Helper Utilities
 * 
 * This module provides utility types for working with Strapi's nested data structures.
 * It helps extract and flatten the complex `data.attributes` structure that Strapi uses
 * in its GraphQL responses.
 * 
 * @module strapiTypes
 */

/**
 * Extract the attributes from a Strapi content type or component.
 * 
 * @example
 * ```typescript
 * type UserAttrs = StrapiAttributes<PluginUsersPermissionsUser>;
 * // Result: { username: string; email: string; ... }
 * ```
 */
export type StrapiAttributes<T> = T extends { attributes: infer A } ? A : never;

/**
 * Flatten a Strapi entity by extracting id and attributes into a single object.
 * Removes the nested `data.attributes` structure for easier component usage.
 * 
 * @example
 * ```typescript
 * type User = FlattenEntity<PluginUsersPermissionsUser>;
 * // Result: { id: string; username: string; email: string; ... }
 * ```
 */
export type FlattenEntity<T> = {
  id: string;
} & StrapiAttributes<T>;

/**
 * Flatten a single relation (oneToOne, manyToOne).
 * Extracts the entity from the `data` wrapper and flattens its attributes.
 * 
 * @example
 * ```typescript
 * type Project = FlattenRelation<{ data: { id: string; attributes: ProjectAttrs } }>;
 * // Result: { id: string; ...ProjectAttrs }
 * ```
 */
export type FlattenRelation<T> = T extends { data: infer D }
  ? D extends { id: string; attributes: infer A }
    ? { id: string } & A
    : D extends null
    ? null
    : never
  : never;

/**
 * Flatten a collection relation (oneToMany, manyToMany).
 * Extracts an array of entities from the `data` wrapper and flattens each entity's attributes.
 * 
 * @example
 * ```typescript
 * type Projects = FlattenRelationArray<{ data: Array<{ id: string; attributes: ProjectAttrs }> }>;
 * // Result: Array<{ id: string; ...ProjectAttrs }>
 * ```
 */
export type FlattenRelationArray<T> = T extends { data: Array<infer D> }
  ? Array<
      D extends { id: string; attributes: infer A }
        ? { id: string } & A
        : never
    >
  : never;

/**
 * Standard Strapi GraphQL response wrapper.
 * All GraphQL queries return data wrapped in this structure.
 * 
 * @example
 * ```typescript
 * type Response = StrapiResponse<{ usersPermissionsUser: StrapiEntity<User> }>;
 * ```
 */
export interface StrapiResponse<T> {
  data: T;
}

/**
 * Strapi entity wrapper for single entities.
 * Used for queries that return a single content type entry.
 * 
 * @example
 * ```typescript
 * type UserResponse = StrapiEntity<{
 *   username: string;
 *   email: string;
 * }>;
 * // Structure: { data: { id: string; attributes: { username: string; email: string } } }
 * ```
 */
export interface StrapiEntity<T> {
  data: {
    id: string;
    attributes: T;
  } | null;
}

/**
 * Strapi collection wrapper for multiple entities.
 * Used for queries that return an array of content type entries.
 * 
 * @example
 * ```typescript
 * type ProjectsResponse = StrapiCollection<{
 *   projectName: string;
 *   createdAt: string;
 * }>;
 * // Structure: { data: Array<{ id: string; attributes: { projectName: string; createdAt: string } }> }
 * ```
 */
export interface StrapiCollection<T> {
  data: Array<{
    id: string;
    attributes: T;
  }>;
}

/**
 * Helper type for media/file attributes in Strapi.
 * Media fields are wrapped in a data object with attributes containing url and other metadata.
 * 
 * @example
 * ```typescript
 * type ProfilePic = StrapiMedia<{
 *   url: string;
 *   name: string;
 *   width: number;
 *   height: number;
 * }>;
 * ```
 */
export interface StrapiMedia<T = { url: string }> {
  data: {
    id: string;
    attributes: T;
  } | null;
}

/**
 * Helper type for component attributes in Strapi.
 * Components can be single or repeatable (array).
 * 
 * @example
 * ```typescript
 * type Negotiation = StrapiComponent<{
 *   name: string;
 *   price: number;
 * }>;
 * ```
 */
export type StrapiComponent<T> = T;

/**
 * Helper type for repeatable components in Strapi.
 * 
 * @example
 * ```typescript
 * type Votes = StrapiRepeatableComponent<{
 *   why: string;
 *   what: boolean;
 * }>;
 * // Result: Array<{ id: number; why: string; what: boolean }>
 * ```
 */
export type StrapiRepeatableComponent<T> = Array<T & { id: number }>;
