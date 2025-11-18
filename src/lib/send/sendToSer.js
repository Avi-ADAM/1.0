/**
 * @typedef {import('$lib/types/strapiTypes').StrapiResponse} StrapiResponse
 * @typedef {import('$lib/types/strapiTypes').StrapiEntity} StrapiEntity
 * @typedef {import('$lib/types/strapiTypes').StrapiCollection} StrapiCollection
 */

const NODE_URL = import.meta.env.VITE_NURL

/**
 * Send a GraphQL query to the Strapi server via the API endpoint.
 * 
 * This is the primary utility for making GraphQL requests to the Strapi backend.
 * It wraps the fetch API and handles the request/response flow for GraphQL queries.
 * 
 * @template T - The expected response type (should be a StrapiResponse type)
 * 
 * @param {Record<string, any>} [arg={}] - GraphQL query variables (e.g., { uid: "123", projectId: "456" })
 * @param {string} [queId=""] - Query ID from qids.js (e.g., "64getUserProjectList")
 * @param {number} [me=0] - User ID parameter (currently unused, reserved for future use)
 * @param {number} [project=0] - Project ID parameter (currently unused, reserved for future use)
 * @param {boolean} [isSer=false] - Flag indicating if this is a server-side request
 * @param {typeof globalThis.fetch} fetch - The fetch function (from SvelteKit load functions or global)
 * 
 * @returns {Promise<T>} The GraphQL response data
 * 
 * @example
 * // Basic usage with type annotation
 * const result = await sendToSer(
 *   { uid: userId },
 *   "64getUserProjectList",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * 
 * @example
 * // With JSDoc type hint for autocomplete
 * /** @type {import('$lib/types/queryTypes').UserProjectListResponse} *\/
 * const result = await sendToSer(
 *   { uid: userId },
 *   "64getUserProjectList",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * // Now result.data.usersPermissionsUser.data.attributes.projects_1s has full type info
 * 
 * @throws {Error} If the fetch request fails or the server returns an error
 */
export async function sendToSer(arg = {}, queId = "", me = 0, project = 0, isSer = false, fetch) {
  /** @type {{ isSer: boolean; data: { arg: Record<string, any>; queId: string } }} */
  let datau = { isSer: isSer, data: { arg, queId } }
  console.log("Sending to server:", isSer);
  
  /** @type {any} */
  let da = []
  
  await fetch("/api/send", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datau),
  })
    .then((res) => (res = res.json()))
    .then((data) => {
      console.log('Success:', data);
      da = data
    })
    .catch((error) => {
      console.error('Error:', error);
      throw error
    })
  
  return da
}
