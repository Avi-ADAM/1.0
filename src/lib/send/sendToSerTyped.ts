import { sendToSer } from './sendToSer.js';

/**
 * Type-safe wrapper for sendToSer that provides generic type support for GraphQL responses.
 * 
 * This function delegates to the existing sendToSer implementation while adding TypeScript
 * generic type parameters for compile-time type safety.
 * 
 * @template T - The expected response type from the GraphQL query
 * @param {Record<string, any>} arg - Variables to pass to the GraphQL query
 * @param {string} queId - Query ID from qids.js (e.g., "64getUserProjectList")
 * @param {number} me - User ID parameter (default: 0)
 * @param {number} project - Project ID parameter (default: 0)
 * @param {boolean} isSer - Server flag (default: false)
 * @param {typeof globalThis.fetch} fetch - Fetch function (usually from SvelteKit load function)
 * @returns {Promise<T>} - Typed promise resolving to the GraphQL response
 * 
 * @example
 * ```typescript
 * import { sendToSerTyped } from '$lib/send/sendToSerTyped';
 * import type { UserProjectListResponse } from '$lib/types/queryTypes';
 * 
 * const result = await sendToSerTyped<UserProjectListResponse>(
 *   { uid: userId },
 *   "64getUserProjectList",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * 
 * // Now result is fully typed and you get autocomplete
 * const projects = result.data.usersPermissionsUser.data.attributes.projects_1s.data;
 * ```
 */
export async function sendToSerTyped<T>(
  arg: Record<string, any> = {},
  queId: string = "",
  me: number = 0,
  project: number = 0,
  isSer: boolean = false,
  fetch: typeof globalThis.fetch
): Promise<T> {
  // Delegate to the existing sendToSer implementation
  // The type assertion is safe because we're trusting the caller to provide the correct type
  return sendToSer(arg, queId, me, project, isSer, fetch) as Promise<T>;
}

/**
 * Re-export the original sendToSer for backward compatibility
 * This allows imports from this module to access both typed and untyped versions
 */
export { sendToSer };
