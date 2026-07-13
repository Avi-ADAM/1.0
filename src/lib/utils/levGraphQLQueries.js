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

      try {
        const errorData = await response.json();
        console.error('GraphQL Error Detail:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('Could not parse error response body');
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('my result', result);
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
  try {
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

    console.log('API response status (OpenMissions):', response.status, response.statusText);
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.error('GraphQL Error Detail (OpenMissions):', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('Could not parse error response body for OpenMissions');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error in fetchOpenMissions:', error);
    throw error;
  }
}

/**
 * Fetch the current user's precomputed match-suggestions (mission kind) from
 * the match-suggestion collection — the clean replacement for pulling every
 * open mission per skill/role and scoring client-side. The server replaces
 * idL with the cookie user id, so only the caller's own rows are returned.
 *
 * @param {string | number} idL - The user ID (validated against cookie on server)
 * @returns {Promise<any>} Raw GraphQL response with matchSuggestions
 */
export async function fetchMatchSuggestions(idL) {
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          queId: '209levMatchSuggestions',
          arg: { idL }
        }
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        goto('/login?from=lev');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error in fetchMatchSuggestions:', error);
    throw error;
  }
}

/**
 * Fetch the current user's precomputed resource match-suggestions (huca) from
 * the match-suggestion collection.
 *
 * @param {string | number} idL - The user ID (validated against cookie on server)
 * @returns {Promise<any>} Raw GraphQL response with matchSuggestions (kind resource)
 */
export async function fetchResourceMatchSuggestions(idL) {
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          queId: '212levResourceMatchSuggestions',
          arg: { idL }
        }
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        goto('/login?from=lev');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error in fetchResourceMatchSuggestions:', error);
    throw error;
  }
}

/**
 * Fetch a single quantum slice of lev data.
 *
 * Uses the mini-userData envelope pattern: every slice query returns
 * usersPermissionsUser → projects_1s(filters:{id:{in:$pids}}) → one collection.
 * The existing extractors run unchanged on the response.
 *
 * @param {string} qid - Static query id registered in qids.js (e.g. '87levSliceSheirutp')
 * @param {string|number} idL - The user ID
 * @param {Array<string|number>|null} pids - Project IDs to filter to, or null for all projects
 * @param {string} lang - Language code
 * @returns {Promise<any>} Raw GraphQL response
 */
export async function fetchLevSlice(qid, idL, pids, lang) {
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          queId: qid,
          arg: { idL, pids: pids ?? null, lang }
        }
      })
    });

    if (!response.ok) {
      if (response.status === 401) {
        goto('/login?from=lev');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error in fetchLevSlice (${qid}):`, error);
    throw error;
  }
}

/**
 * Fetch specific mission data for the /myacts page
 * 
 * @param {string | number} idL - The user ID
 * @returns {Promise<any>}
 */
export async function fetchMyActs(idL) {
  try {
    const response = await fetch('/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          queId: '90myActsQuery',
          arg: { idL }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error in fetchMyActs:', error);
    throw error;
  }
}
