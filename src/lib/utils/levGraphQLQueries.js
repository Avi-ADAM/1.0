/**
 * @typedef {import('$lib/types/strapiTypes').StrapiResponse} StrapiResponse
 * @typedef {import('$lib/types/strapiTypes').StrapiEntity} StrapiEntity
 * @typedef {import('$lib/types/strapiTypes').StrapiCollection} StrapiCollection
 */

import { goto } from '$app/navigation';

// GraphQL query builders for lev page
// Native builders are now static in qids.js (83 and 84) to improve security.

/**
 * Fetch main user data from the Strapi GraphQL API via the secure /api/send endpoint.
 * This endpoint uses HTTP-only cookies for authentication, protecting the JWT from the client.
 * 
 * @param {string} baseUrl - Ignored (uses server-side endpoint)
 * @param {string} token - Ignored (uses HTTP-only cookie)
 * @param {string | number} idL - The user ID to fetch data for (validated against cookie ID on server)
 * @param {string} lang - Language code for localized content
 * @returns {Promise<StrapiResponse<{ usersPermissionsUser: StrapiEntity<any> }>>} The GraphQL response
 */
export async function fetchMainUserData(baseUrl, token, idL, lang) {
  console.log('fetchMainUserData (secure) called with:', { idL, lang });
  
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          queId: '83levMainUserQuery',
          arg: { idL, lang }
        }
      })
    });
    
    console.log('API response status:', response.status, response.statusText);
    if (!response.ok) {
      if (response.status === 401) {
        goto('/login?from=lev');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error in fetchMainUserData:', error);
    throw error;
  }
}

/**
 * Fetch open missions data via the secure /api/send endpoint.
 * 
 * @param {string} baseUrl - Ignored
 * @param {string} token - Ignored
 * @param {Array<string | number>} keysSorted - Array of mission IDs to fetch
 * @param {string} lang - Language code
 * @returns {Promise<StrapiResponse<{ openMissions: StrapiCollection<any> }>>}
 */
export async function fetchOpenMissions(baseUrl, token, keysSorted, lang) {
  const response = await fetch('/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      data: {
        queId: '84levOpenMissionsQuery',
        arg: { ids: keysSorted, lang }
      }
    })
  });
  
  return response.json();
}
