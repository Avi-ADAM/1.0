/**
 * Data loader for lev page
 * Handles initialization, snapshot management, and data population
 * 
 * This module provides functions to:
 * - Initialize lev data from snapshot or GraphQL
 * - Restore stores from snapshot
 * - Populate stores from GraphQL response
 * - Save current state to snapshot
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 */

import { get } from 'svelte/store';
import {
  userStore,
  projectsStore,
  pendsStore,
  mtahaStore,
  fiappStore,
  askedStore,
  askedResourcesStore,
  resourceSuggestionsStore,
  suggestionsStore,
  pmashesStore,
  wegetsStore,
  halukasStore,
  welcomeStore,
  transfersStore,
  decisionsStore,
  sheirutpStore,
  salesStore,
  purchasesStore,
  wishOffersStore,
  saveSnapshot,
  loadSnapshot,
  clearSnapshot,
  getSnapshotVersion,
  dataMode,
  loadedScopes,
  type SnapshotData,
  type UserData
} from '$lib/stores/levStores';
import { projects } from '$lib/stores/projectStore.js';
import {
  extractPends,
  extractMtaha,
  extractFiapp,
  extractAsked,
  extractAskedResources,
  extractResourceSuggestions,
  extractSuggestions,
  extractProjects,
  extractPmashes,
  extractWegets,
  extractHalukas,
  extractWelcome,
  extractTransfers,
  extractDecisions,
  extractProductRequests,
  extractSales,
  extractPurchases,
  extractWishOffers
} from './levDataExtractors';
import { fetchMainUserData, fetchOpenMissions } from './levGraphQLQueries';
import { resolvePlatformIdentity } from '$lib/stores/platformStore';


/**
 * Initialize lev data from snapshot or fetch fresh data from server
 * 
 * This function implements the following flow:
 * 1. Try to load from localStorage snapshot first (fast initial render)
 * 2. If snapshot exists and is valid, restore stores from it
 * 3. Fetch fresh data from GraphQL server in background
 * 4. Update stores with fresh data
 * 5. Save new snapshot for next load
 * 
 * @param userId - The user ID to fetch data for
 * @param token - JWT authentication token
 * @param lang - Language code ('he', 'en', 'ar')
 * @returns Promise that resolves when initialization is complete
 * @throws Error if GraphQL fetch fails or authentication is invalid
 * 
 * @example
 * ```typescript
 * try {
 *   await initializeLevData('123', 'jwt-token', 'he');
 *   console.log('Lev data initialized');
 * } catch (error) {
 *   console.error('Failed to initialize:', error);
 *   toast.error('Failed to load data');
 * }
 * ```
 */
export async function initializeLevData(
  userId: string,
  token: string,
  lang: string
): Promise<void> {
  console.log('🚀 [levDataLoader] Initializing lev data', { userId, lang });

  // Resolve the platform (1💗1) identity once for the proposal card's site-share
  // row — logo/name/public link. Fire-and-forget: never blocks the feed and the
  // card degrades to no platform row if it fails.
  resolvePlatformIdentity();

  // Step 1: Try to load from snapshot first
  const snapshot = loadSnapshot();

  if (snapshot && snapshot.version === getSnapshotVersion()) {
    console.log('📦 [levDataLoader] Valid snapshot found, restoring stores');
    try {
      restoreFromSnapshot(snapshot);
      console.log('✅ [levDataLoader] Stores restored from snapshot');
    } catch (error) {
      console.error('❌ [levDataLoader] Failed to restore from snapshot:', error);
      clearSnapshot();
    }
  } else {
    console.log('ℹ️ [levDataLoader] No valid snapshot, will fetch fresh data');
  }

  // Step 2: Fetch fresh data from server
  console.log('🌐 [levDataLoader] Fetching fresh data from GraphQL');
  try {
    const freshData = await fetchMainUserData(
      import.meta.env.VITE_URL,
      token,
      userId,
      lang
    );

    // Check for GraphQL errors
    if (freshData.errors) {
      console.error('❌ [levDataLoader] GraphQL errors:', freshData.errors);
      throw new Error(`GraphQL error: ${freshData.errors[0]?.message || 'Unknown error'}`);
    }

    if (!freshData.data?.usersPermissionsUser?.data) {
      console.error('❌ [levDataLoader] No user data in response');
      throw new Error('No user data received from server');
    }

    console.log('✅ [levDataLoader] Fresh data received, populating stores');

    // Step 3: Update all stores with fresh data
    populateStores(freshData, userId);

    // Step 3.5: Fetch detailed data for top suggestions (optimization)
    const suggestions = get(suggestionsStore);
    if (suggestions.length > 0) {
      console.log(`🌐 [levDataLoader] Fetching details for ${suggestions.length} suggestions`);
      const topIds = suggestions.slice(0, 50).map(s => s.id); // Optimized to fetch top 50

      try {
        const detailsData = await fetchOpenMissions(
          topIds,
          lang
        );

        if (detailsData?.data?.openMissions?.data) {
          updateSuggestionsWithDetails(detailsData.data.openMissions.data);
          console.log('✅ [levDataLoader] Suggestions enriched with details');
        }
      } catch (err) {
        console.warn('⚠️ [levDataLoader] Failed to fetch suggestion details', err);
      }
    }


    // Mark stores as fully loaded — must be set BEFORE saveCurrentSnapshot,
    // whose guard refuses to persist anything other than a full dataset.
    dataMode.set('full');

    // Step 4: Save new snapshot
    console.log('💾 [levDataLoader] Saving new snapshot');
    saveCurrentSnapshot();

    console.log('✅ [levDataLoader] Initialization complete');
  } catch (error) {
    console.error('❌ [levDataLoader] Failed to fetch fresh data:', error);

    // Check if it's an authentication error
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
        clearSnapshot(); // Remove stale cached data so it's not shown on next visit
        throw new Error('Authentication failed. Please log in again.');
      }
    }

    // If we have snapshot data, we can continue with cached data
    if (snapshot) {
      console.warn('⚠️ [levDataLoader] Using cached data due to fetch failure');
      return;
    }

    // No snapshot and fetch failed - this is a critical error
    throw error;
  }
}

/**
 * Restore all stores from a snapshot
 * 
 * This function takes a snapshot object and restores all raw stores
 * to their saved state. Derived stores will automatically recompute.
 * 
 * @param snapshot - The snapshot data to restore from
 * 
 * @example
 * ```typescript
 * const snapshot = loadSnapshot();
 * if (snapshot) {
 *   restoreFromSnapshot(snapshot);
 * }
 * ```
 * 
 * **Validates: Requirements 4.1, 4.2**
 */
export function restoreFromSnapshot(snapshot: SnapshotData): void {
  console.log('📦 [levDataLoader] Restoring stores from snapshot');

  try {
    // Restore all raw stores
    userStore.set(snapshot.data.user);
    projectsStore.set(snapshot.data.projects);
    // Sync legacy project store
    projects.set(snapshot.data.projects);

    pendsStore.set(snapshot.data.pends);
    mtahaStore.set(snapshot.data.mtaha);
    fiappStore.set(snapshot.data.fiapp);
    askedStore.set(snapshot.data.asked);
    askedResourcesStore.set(snapshot.data.askedResources);
    resourceSuggestionsStore.set(snapshot.data.resourceSuggestions);
    suggestionsStore.set(snapshot.data.suggestions);
    pmashesStore.set(snapshot.data.pmashes);
    wegetsStore.set(snapshot.data.wegets);
    halukasStore.set(snapshot.data.halukas);
    welcomeStore.set(snapshot.data.welcome);
    transfersStore.set(snapshot.data.transfers);
    decisionsStore.set(snapshot.data.decisions);
    sheirutpStore.set(snapshot.data.sheirutp || []);
    salesStore.set(snapshot.data.sales || []);
    purchasesStore.set(snapshot.data.purchases || []);
    wishOffersStore.set(snapshot.data.wishOffers || []);

    // A restored snapshot represents a full dataset — safe to snapshot again later
    dataMode.set('full');
    loadedScopes.set({});

    console.log('✅ [levDataLoader] All stores restored from snapshot');
  } catch (error) {
    console.error('❌ [levDataLoader] Error restoring from snapshot:', error);
    throw error;
  }
}

/**
 * Populate stores from GraphQL response
 * 
 * This function extracts data from the raw GraphQL response and
 * populates all raw stores. It uses the extraction functions from
 * levDataExtractors.ts to transform the data.
 * 
 * @param data - Raw GraphQL response data
 * @param userId - The user ID (for user store)
 * 
 * @example
 * ```typescript
 * const graphqlData = await fetchMainUserData(url, token, userId, lang);
 * populateStores(graphqlData, userId);
 * ```
 * 
 * **Validates: Requirements 1.1, 1.4, 4.3**
 */
export function populateStores(data: any, userId: string): void {
  console.log('📥 [levDataLoader] Populating stores from GraphQL data');

  try {
    const userData = data.data.usersPermissionsUser.data;

    if (!userData) {
      throw new Error('No user data in GraphQL response');
    }

    // Extract and set user data
    const user: UserData = {
      id: userData.id,
      username: userData.attributes.username || '',
      email: userData.attributes.email || '',
      profilePic: userData.attributes.profilePic?.data?.attributes?.url,
      lang: userData.attributes.lang || 'he',
      total: userData.attributes.hervachti || 0
    };
    userStore.set(user);
    console.log('✅ [levDataLoader] User data set');

    // Extract and set projects
    const projectsData = extractProjects(userData);
    projectsStore.set(projectsData);
    // Sync legacy project store for projectHelpers.js
    projects.set(projectsData);
    console.log(`✅ [levDataLoader] Projects set (${projectsData.length} projects)`);

    // Extract and set pends
    const pends = extractPends(userData);
    pendsStore.set(pends);
    console.log(`✅ [levDataLoader] Pends set (${pends.length} items)`);

    // Extract and set mtaha
    const mtaha = extractMtaha(userData);
    mtahaStore.set(mtaha);
    console.log(`✅ [levDataLoader] Mtaha set (${mtaha.length} items)`);

    // Extract and set fiapp
    const fiapp = extractFiapp(userData);
    fiappStore.set(fiapp);
    console.log(`✅ [levDataLoader] Fiapp set (${fiapp.length} items)`);

    // Extract and set asked
    const asked = extractAsked(userData);
    askedStore.set(asked);
    console.log(`✅ [levDataLoader] Asked set (${asked.length} items)`);

    // Extract and set asked resources (askms)
    const askedResources = extractAskedResources(userData);
    askedResourcesStore.set(askedResources);
    console.log(`✅ [levDataLoader] Asked resources set (${askedResources.length} items)`);

    // Extract and set resource suggestions (huca)
    const resourceSuggestions = extractResourceSuggestions(userData);
    resourceSuggestionsStore.set(resourceSuggestions);
    console.log(`✅ [levDataLoader] Resource suggestions set (${resourceSuggestions.length} items)`);

    // Extract and set suggestions
    const suggestions = extractSuggestions(userData);
    suggestionsStore.set(suggestions);
    console.log(`✅ [levDataLoader] Suggestions set (${suggestions.length} items)`);

    // Extract and set pmashes
    const pmashes = extractPmashes(userData);
    pmashesStore.set(pmashes);
    console.log(`✅ [levDataLoader] Pmashes set (${pmashes.length} items)`);

    // Extract and set wegets
    const wegets = extractWegets(userData);
    wegetsStore.set(wegets);
    console.log(`✅ [levDataLoader] Wegets set (${wegets.length} items)`);

    // Extract and set halukas
    const halukas = extractHalukas(userData);
    halukasStore.set(halukas);
    console.log(`✅ [levDataLoader] Halukas set (${halukas.length} items)`);

    // Extract and set welcome
    const welcome = extractWelcome(userData);
    welcomeStore.set(welcome);
    console.log(`✅ [levDataLoader] Welcome set (${welcome.length} items)`);

    // Extract and set transfers
    const transfers = extractTransfers(userData);
    transfersStore.set(transfers);
    console.log(`✅ [levDataLoader] Transfers set (${transfers.length} items)`);

    // Extract and set decisions
    const decisions = extractDecisions(userData);
    decisionsStore.set(decisions);
    console.log(`✅ [levDataLoader] Decisions set (${decisions.length} items)`);

    // Extract and set sheirutp (product requests)
    const sheirutp = extractProductRequests(userData);
    sheirutpStore.set(sheirutp);
    console.log(`✅ [levDataLoader] Sheirutpends set (${sheirutp.length} items)`);

    // Extract and set sales (approved sales for seller side)
    const salesData = extractSales(userData);
    salesStore.set(salesData);
    console.log(`✅ [levDataLoader] Sales set (${salesData.length} items)`);

    // Extract and set purchases (approved sales for buyer side)
    const purchaseData = extractPurchases(userData);
    purchasesStore.set(purchaseData);
    console.log(`✅ [levDataLoader] Purchases set (${purchaseData.length} items)`);

    // Extract and set wish offers (community volunteer offers on my wishes)
    const wishOffers = extractWishOffers(userData);
    wishOffersStore.set(wishOffers);
    console.log(`✅ [levDataLoader] Wish offers set (${wishOffers.length} items)`);

    console.log('✅ [levDataLoader] All stores populated successfully');
  } catch (error) {
    console.error('❌ [levDataLoader] Error populating stores:', error);
    throw error;
  }
}

/**
 * Save current state to snapshot
 * 
 * This function reads the current state of all stores and saves
 * them to localStorage as a snapshot for fast loading on next visit.
 * 
 * @example
 * ```typescript
 * // After updating stores with fresh data
 * saveCurrentSnapshot();
 * ```
 * 
 * **Validates: Requirements 4.3, 4.4**
 */
export function saveCurrentSnapshot(): void {
  // Guard: never snapshot a partial session — a snapshot saved from a slice-only
  // load would make returning /lev visitors see incomplete data as "everything".
  if (get(dataMode) !== 'full') {
    console.log('⏭️ [levDataLoader] Skipping snapshot — dataMode is not full');
    return;
  }

  console.log('💾 [levDataLoader] Saving current snapshot');

  try {
    const snapshot: SnapshotData = {
      version: getSnapshotVersion(),
      timestamp: Date.now(),
      data: {
        user: get(userStore),
        projects: get(projectsStore),
        pends: get(pendsStore),
        mtaha: get(mtahaStore),
        fiapp: get(fiappStore),
        asked: get(askedStore),
        askedResources: get(askedResourcesStore),
        suggestions: get(suggestionsStore),
        pmashes: get(pmashesStore),
        wegets: get(wegetsStore),
        halukas: get(halukasStore),
        welcome: get(welcomeStore),
        transfers: get(transfersStore),
        decisions: get(decisionsStore),
        resourceSuggestions: get(resourceSuggestionsStore),
        sheirutp: get(sheirutpStore),
        sales: get(salesStore),
        purchases: get(purchasesStore),
        wishOffers: get(wishOffersStore)
      }
    };

    saveSnapshot(snapshot);
    console.log('✅ [levDataLoader] Snapshot saved successfully');
  } catch (error) {
    console.error('❌ [levDataLoader] Error saving snapshot:', error);
    // Don't throw - saving snapshot is not critical
  }
}

/**
 * Clear all stores and snapshot
 * Useful for logout or data reset scenarios
 * 
 * @example
 * ```typescript
 * // On logout
 * clearAllData();
 * ```
 */
export function clearAllData(): void {
  console.log('🗑️ [levDataLoader] Clearing all data');

  // Clear all stores
  userStore.set(null);
  projectsStore.set([]);
  pendsStore.set([]);
  mtahaStore.set([]);
  fiappStore.set([]);
  askedStore.set([]);
  askedResourcesStore.set([]);
  resourceSuggestionsStore.set([]);
  suggestionsStore.set([]);
  pmashesStore.set([]);
  wegetsStore.set([]);
  halukasStore.set([]);
  welcomeStore.set([]);
  transfersStore.set([]);
  decisionsStore.set([]);
  sheirutpStore.set([]);
  salesStore.set([]);
  purchasesStore.set([]);
  wishOffersStore.set([]);

  // Clear snapshot and reset loading state
  clearSnapshot();
  dataMode.set('none');
  loadedScopes.set({});

  console.log('✅ [levDataLoader] All data cleared');
}

/**
 * Update suggestions store with detailed mission data
 */
function updateSuggestionsWithDetails(missionsData: any[]) {
  suggestionsStore.update(currentSuggestions => {
    const missionsMap = new Map(missionsData.map(m => [m.id, m]));

    return currentSuggestions.map(suggestion => {
      const detail = missionsMap.get(suggestion.id);
      if (!detail || !detail.attributes) return suggestion;

      return {
        ...suggestion,
        name: detail.attributes.name || suggestion.name,
        descrip: detail.attributes.descrip || suggestion.descrip,
        hearotMeyuchadot: detail.attributes.hearotMeyuchadot || suggestion.hearotMeyuchadot,
        noofhours: detail.attributes.noofhours || suggestion.noofhours,
        perhour: detail.attributes.perhour || suggestion.perhour,
        sqadualed: detail.attributes.sqadualed || suggestion.sqadualed,
        acts: detail.attributes.acts?.data || suggestion.acts,
        dates: detail.attributes.dates || suggestion.dates,
        projectId: detail.attributes.project?.data?.id || suggestion.projectId,

        // Concierge branding (PLAN_CONCIERGE §5.2): a project-less open-mission
        // carries a `ratson` link → processSuggestions renders it as "קונסירג'".
        source: detail.attributes.source ?? suggestion.source,
        ratsonId: detail.attributes.ratson?.data?.id ?? suggestion.ratsonId,
        ratsonName: detail.attributes.ratson?.data?.attributes?.name ?? suggestion.ratsonName,

        // Project details from the secondary fetch
        projectDetails: detail.attributes.project?.data?.attributes ? {
          name: detail.attributes.project.data.attributes.projectName,
          src: detail.attributes.project.data.attributes.profilePic?.data?.attributes?.url,
          membersCount: detail.attributes.project.data.attributes.user_1s?.data?.length || 0,
          memberIds: detail.attributes.project.data.attributes.user_1s?.data?.map((u: any) => u.id) || [],
          restime: detail.attributes.project.data.attributes.restime,
          ...suggestion.projectDetails // keep existing if any
        } : suggestion.projectDetails,

        // Ensure we have correct IDs for skills/roles/workways even if previously just lists
        skills: detail.attributes.skills?.data || suggestion.skills,
        tafkidims: detail.attributes.tafkidims?.data || suggestion.tafkidims,
        work_ways: detail.attributes.work_ways?.data || suggestion.work_ways
      };
    });
  });
}
