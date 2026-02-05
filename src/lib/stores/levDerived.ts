// src/lib/stores/levDerived.ts
import { derived, type Readable } from 'svelte/store';
import {
  pendsStore,
  mtahaStore,
  fiappStore,
  askedStore,
  suggestionsStore,
  pmashesStore,
  wegetsStore,
  halukasStore,
  welcomeStore,
  transfersStore,
  resourceSuggestionsStore,
  sheirutpStore,
  salesStore,
  askedResourcesStore,
  decisionsStore,
  projectsStore,
  milon,
  projectFilter
} from './levStores';
import { timers } from './timers';
import {
  processPends,
  processMtaha,
  processFiapp,
  processAsked,
  processAskedResources,
  processResourceSuggestions,
  processSuggestions,
  processPmashes,
  processWegets,
  processHalukas,
  processWelcome,
  processTransfers,
  processDecisions,
  processProductRequests,
  processSales,
  mergeAndSort,
  type DisplayItem
} from '$lib/utils/levProcessors';

// ========== Individual Processed Stores ==========

/**
 * Derived store for processed pending missions
 * 
 * Automatically recomputes when pendsStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 * 
 * @example
 * ```typescript
 * import { processedPends } from '$lib/stores/levDerived';
 * 
 * $effect(() => {
 *   console.log('Pending missions:', $processedPends);
 * });
 * ```
 */
export const processedPends: Readable<DisplayItem[]> = derived(
  [pendsStore, projectsStore],
  ([$pends, $projects]) => processPends($pends, $projects)
);

/**
 * Derived store for processed missions in progress
 * 
 * Automatically recomputes when mtahaStore, projectsStore, or timers changes.
 * Timer data is pulled from the timers store for real-time updates.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedMtaha: Readable<DisplayItem[]> = derived(
  [mtahaStore, projectsStore, timers],
  ([$mtaha, $projects, $timers]) => processMtaha($mtaha, $projects, $timers)
);

/**
 * Derived store for processed approval requests
 * 
 * Automatically recomputes when fiappStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedFiapp: Readable<DisplayItem[]> = derived(
  [fiappStore, projectsStore],
  ([$fiapp, $projects]) => processFiapp($fiapp, $projects)
);

/**
 * Derived store for processed join/ask requests
 * 
 * Automatically recomputes when askedStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedAsked: Readable<DisplayItem[]> = derived(
  [askedStore, projectsStore],
  ([$asked, $projects]) => processAsked($asked, $projects)
);

/**
 * Derived store for processed asked resources (askms)
 * 
 * Automatically recomputes when askedResourcesStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedAskedResources: Readable<DisplayItem[]> = derived(
  [askedResourcesStore, projectsStore],
  ([$askedResources, $projects]) => processAskedResources($askedResources, $projects)
);

/**
 * Derived store for processed resource suggestions (huca)
 * 
 * Automatically recomputes when resourceSuggestionsStore or projectsStore changes.
 */
export const processedResourceSuggestions: Readable<DisplayItem[]> = derived(
  [resourceSuggestionsStore, projectsStore],
  ([$resourceSuggestions, $projects]) => processResourceSuggestions($resourceSuggestions, $projects)
);

/**
 * Derived store for processed suggestions
 * 
 * Automatically recomputes when suggestionsStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedSuggestions: Readable<DisplayItem[]> = derived(
  [suggestionsStore, projectsStore],
  ([$suggestions, $projects]) => processSuggestions($suggestions, $projects)
);

/**
 * Derived store for processed pending resources (pmashes)
 * 
 * Automatically recomputes when pmashesStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedPmashes: Readable<DisplayItem[]> = derived(
  [pmashesStore, projectsStore],
  ([$pmashes, $projects]) => processPmashes($pmashes, $projects)
);

/**
 * Derived store for processed resource requests (wegets)
 * 
 * Automatically recomputes when wegetsStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedWegets: Readable<DisplayItem[]> = derived(
  [wegetsStore, projectsStore],
  ([$wegets, $projects]) => processWegets($wegets, $projects)
);

/**
 * Derived store for processed profit distribution requests (halukas)
 * 
 * Automatically recomputes when halukasStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedHalukas: Readable<DisplayItem[]> = derived(
  [halukasStore, projectsStore],
  ([$halukas, $projects]) => processHalukas($halukas, $projects)
);

/**
 * Derived store for processed welcome messages
 * 
 * Automatically recomputes when welcomeStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedWelcome: Readable<DisplayItem[]> = derived(
  [welcomeStore, projectsStore],
  ([$welcome, $projects]) => processWelcome($welcome, $projects)
);

/**
 * Derived store for processed money transfers
 * 
 * Automatically recomputes when transfersStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedTransfers: Readable<DisplayItem[]> = derived(
  [transfersStore, projectsStore],
  ([$transfers, $projects]) => processTransfers($transfers, $projects)
);

/**
 * Derived store for processed decisions (hachlatot)
 * 
 * Automatically recomputes when decisionsStore or projectsStore changes.
 * Returns an array of DisplayItem objects ready for rendering.
 */
export const processedDecisions: Readable<DisplayItem[]> = derived(
  [decisionsStore, projectsStore],
  ([$decisions, $projects]) => processDecisions($decisions, $projects)
);

/**
 * Derived store for processed product requests (sheirutpends)
 * 
 * Automatically recomputes when sheirutpStore or projectsStore changes.
 */
export const processedSheirutp: Readable<DisplayItem[]> = derived(
  [sheirutpStore, projectsStore],
  ([$sheirutp, $projects]) => processProductRequests($sheirutp, $projects)
);

/**
 * Derived store for processed sales (sheiruts)
 * 
 * Automatically recomputes when salesStore or projectsStore changes.
 */
export const processedSales: Readable<DisplayItem[]> = derived(
  [salesStore, projectsStore],
  ([$sales, $projects]) => processSales($sales, $projects)
);

// ========== Final Merged Array ==========

/**
 * The main array that combines all processed items, sorted by priority.
 * This replaces the old arr1 array.
 * 
 * Automatically recomputes when:
 * - Any of the processed stores change
 * - The milon filter configuration changes
 * - The project filter changes
 * 
 * Applies two levels of filtering:
 * 1. Milon filtering - based on item type visibility settings
 * 2. Project filtering - based on selected project (if any)
 * 
 * Items are sorted by priority (pl field), with lower numbers appearing first.
 * 
 * @example
 * ```typescript
 * import { finalSwiperArray } from '$lib/stores/levDerived';
 * 
 * $effect(() => {
 *   console.log('Display items:', $finalSwiperArray);
 * });
 * ```
 */
export const finalSwiperArray: Readable<DisplayItem[]> = derived(
  [
    processedPends,
    processedMtaha,
    processedFiapp,
    processedAsked,
    processedAskedResources,
    processedSuggestions,
    processedResourceSuggestions,
    processedPmashes,
    processedWegets,
    processedHalukas,
    processedWelcome,
    processedTransfers,
    processedDecisions,
    processedSheirutp,
    processedSales,
    milon,
    projectFilter
  ],
  ([
    $pends,
    $mtaha,
    $fiapp,
    $asked,
    $askedResources,
    $suggestions,
    $resourceSuggestions,
    $pmashes,
    $wegets,
    $halukas,
    $welcome,
    $transfers,
    $decisions,
    $sheirutp,
    $sales,
    $milon,
    $projectFilter
  ]) => {
    // Step 1: Merge all processed arrays and sort by priority
    const merged = mergeAndSort(
      $pends,
      $mtaha,
      $fiapp,
      $asked,
      $askedResources,
      $suggestions,
      $resourceSuggestions,
      $pmashes,
      $wegets,
      $halukas,
      $welcome,
      $transfers,
      $decisions,
      $sheirutp,
      $sales
    );

    // Step 2: Apply milon filtering (visibility settings)
    let filtered = merged.filter(item => {
      switch (item.ani) {
        case 'pends':
          return $milon.pend;
        case 'mtaha':
          return $milon.betaha;
        case 'fiapp':
          return $milon.fiap;
        case 'askedcoin':
          return $milon.asks;
        case 'askedm':
          // Logic for askedm similar to askedcoin or new filter?
          // Assuming it falls under 'asks' or 'askmap' if that's what user meant by 'askma'
          // User had 'askmap: true' in MilonConfig in levStores.ts
          return $milon.askmap || true;
        case 'huca':
          return $milon.pmashs;
        case 'meData':
          return $milon.sugg;
        case 'pmashes':
          return $milon.ppmash;
        case 'wegets':
          return $milon.pmaap;
        case 'haluk':
          return $milon.desi;
        case 'walcomen':
          return $milon.welc;
        case 'vidu':
          return true; // Always show transfers
        case 'sheirutp':
          return $milon.sheirutp;
        case 'sales':
          return $milon.sales;
        case 'hachla':
          return $milon.hachla;
        default:
          return true; // Show unknown types by default
      }
    });

    // Step 3: Apply project filtering (if a project is selected)
    if ($projectFilter !== null) {
      filtered = filtered.filter(item => item.projectId === $projectFilter);
    }
    console.log(filtered.sort((a, b) => {
      const priorityA = a.pl ?? 999;
      const priorityB = b.pl ?? 999;
      return priorityA - priorityB;
    }))
    // Step 4: Ensure final sort by priority (pl)
    return filtered.sort((a, b) => {
      const priorityA = a.pl ?? 999;
      const priorityB = b.pl ?? 999;
      return priorityA - priorityB;
    });
  }
);

