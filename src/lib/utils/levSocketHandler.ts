/**
 * Socket Handler for Lev Page
 * 
 * This module handles Socket.IO events for the Lev page, processing
 * real-time updates and applying them to the appropriate stores.
 * 
 * It integrates with:
 * - socketClient from $lib/stores/socketClient
 * - Raw stores from $lib/stores/levStores
 * - Unified action system update strategies
 * 
 * Usage:
 * ```typescript
 * import { setupSocketListeners } from '$lib/utils/levSocketHandler';
 * 
 * // In +page.svelte onMount
 * const unsubscribe = setupSocketListeners(userId, token, lang);
 * 
 * // In onDestroy
 * unsubscribe();
 * ```
 */

import { get } from 'svelte/store';
import { socketClient, type NotificationPayload } from '$lib/stores/socketClient';
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
  decisionsStore,
  type PendMissionData,
  type InProgressMissionData,
  type ApprovalData,
  type AskData,
  type SuggestionData,
  type PendResourceData,
  type ResourceRequestData,
  type HalukaData,
  type WelcomeData,
  type TransferData,
  type DecisionData
} from '$lib/stores/levStores';
import { initializeLevData } from './levDataLoader';

/**
 * Setup socket listeners for the Lev page
 * 
 * This function registers a notification listener with the socketClient
 * and handles incoming notifications according to their update strategy.
 * 
 * @param userId - Current user ID
 * @param token - JWT authentication token
 * @param lang - Current language
 * @returns Unsubscribe function to clean up the listener
 */
export function setupSocketListeners(
  userId: string,
  token: string,
  lang: string
): () => void {
  console.log('🔌 [levSocketHandler] Setting up socket listeners for Lev page');

  // Register notification listener
  const unsubscribe = socketClient.onNotification(async (notification) => {
    console.log('🔔 [levSocketHandler] Received notification:', {
      actionKey: notification.actionKey,
      hasUpdateStrategy: !!(notification as any).updateStrategy,
      hasData: !!(notification as any).data
    });

    const { actionKey, updateStrategy, data } = notification as any;

    // Handle different update strategies
    if (!updateStrategy) {
      console.log('📢 [levSocketHandler] Notification only (no update strategy)');
      return;
    }

    switch (updateStrategy.type) {
      case 'fullRefresh':
        console.log('📥 [levSocketHandler] Full refresh triggered');
        await handleFullRefresh(userId, token, lang);
        break;

      case 'partialUpdate':
        console.log('🔄 [levSocketHandler] Partial update triggered', {
          dataKeys: updateStrategy.config?.dataKeys
        });
        handlePartialUpdate(updateStrategy.config?.dataKeys, data);
        break;

      case 'optimistic':
        console.log('⚡ [levSocketHandler] Optimistic update - already applied');
        // UI already updated optimistically, no action needed
        break;

      case 'none':
        console.log('ℹ️ [levSocketHandler] No update strategy specified');
        // No update needed
        break;

      default:
        console.warn('⚠️ [levSocketHandler] Unknown update strategy:', updateStrategy.type);
        break;
    }
  });

  console.log('✅ [levSocketHandler] Socket listeners registered');

  return unsubscribe;
}

/**
 * Handle full refresh of all data
 * 
 * This triggers a complete re-fetch of all Lev page data from the server.
 * 
 * @param userId - Current user ID
 * @param token - JWT authentication token
 * @param lang - Current language
 */
async function handleFullRefresh(
  userId: string,
  token: string,
  lang: string
): Promise<void> {
  try {
    console.log('🔄 [levSocketHandler] Performing full data refresh');
    await initializeLevData(userId, token, lang);
    console.log('✅ [levSocketHandler] Full refresh completed');
  } catch (error) {
    console.error('❌ [levSocketHandler] Full refresh failed:', error);
    throw error;
  }
}

/**
 * Handle partial update of specific stores
 * 
 * This updates only the stores specified in dataKeys with the provided data.
 * 
 * @param dataKeys - Array of store keys to update
 * @param data - Update data
 */
function handlePartialUpdate(dataKeys: string[] | undefined, data: any): void {
  if (!dataKeys || dataKeys.length === 0) {
    console.warn('⚠️ [levSocketHandler] No dataKeys specified for partial update');
    return;
  }

  console.log('🔄 [levSocketHandler] Processing partial update for keys:', dataKeys);

  for (const key of dataKeys) {
    try {
      switch (key) {
        case 'pends':
          updatePendsStore(data);
          break;

        case 'mtaha':
          updateMtahaStore(data);
          break;

        case 'fiapp':
          updateFiappStore(data);
          break;

        case 'asked':
          updateAskedStore(data);
          break;

        case 'suggestions':
          updateSuggestionsStore(data);
          break;

        case 'pmashes':
          updatePmashesStore(data);
          break;

        case 'wegets':
          updateWegetsStore(data);
          break;

        case 'halukas':
          updateHalukasStore(data);
          break;

        case 'welcome':
          updateWelcomeStore(data);
          break;

        case 'transfers':
          updateTransfersStore(data);
          break;

        case 'decisions':
          updateDecisionsStore(data);
          break;

        default:
          console.warn(`⚠️ [levSocketHandler] Unknown dataKey: ${key}`);
          break;
      }
    } catch (error) {
      console.error(`❌ [levSocketHandler] Error updating ${key}:`, error);
    }
  }

  console.log('✅ [levSocketHandler] Partial update completed');
}

// ============================================================================
// Store Update Functions
// ============================================================================

/**
 * Update pends store with new/modified item
 * 
 * If the item exists (by ID), it will be updated.
 * If the item doesn't exist, it will be added.
 * If the data has a _deleted flag, the item will be removed.
 * 
 * @param data - Pend mission data
 */
export function updatePendsStore(data: Partial<PendMissionData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid pends data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating pends store', { id: data.id });

  pendsStore.update(current => {
    // Check if item should be deleted
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing pend', { id: data.id });
      return current.filter(p => p.id !== data.id);
    }

    // Find existing item
    const index = current.findIndex(p => p.id === data.id);

    if (index !== -1) {
      // Update existing item
      console.log('✏️ [levSocketHandler] Updating existing pend', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      // Add new item
      console.log('➕ [levSocketHandler] Adding new pend', { id: data.id });
      current.push(data as PendMissionData);
    }

    return [...current];
  });
}

/**
 * Update mtaha (missions in progress) store
 * 
 * @param data - Mission in progress data
 */
export function updateMtahaStore(data: Partial<InProgressMissionData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid mtaha data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating mtaha store', { id: data.id });

  mtahaStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing mtaha', { id: data.id });
      return current.filter(m => m.id !== data.id);
    }

    const index = current.findIndex(m => m.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing mtaha', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new mtaha', { id: data.id });
      current.push(data as InProgressMissionData);
    }

    return [...current];
  });
}

/**
 * Update fiapp (approval requests) store
 * 
 * @param data - Approval data
 */
export function updateFiappStore(data: Partial<ApprovalData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid fiapp data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating fiapp store', { id: data.id });

  fiappStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing fiapp', { id: data.id });
      return current.filter(f => f.id !== data.id);
    }

    const index = current.findIndex(f => f.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing fiapp', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new fiapp', { id: data.id });
      current.push(data as ApprovalData);
    }

    return [...current];
  });
}

/**
 * Update asked (join requests) store
 * 
 * @param data - Ask data
 */
export function updateAskedStore(data: Partial<AskData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid asked data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating asked store', { id: data.id });

  askedStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing asked', { id: data.id });
      return current.filter(a => a.id !== data.id);
    }

    const index = current.findIndex(a => a.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing asked', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new asked', { id: data.id });
      current.push(data as AskData);
    }

    return [...current];
  });
}

/**
 * Update suggestions store
 * 
 * @param data - Suggestion data
 */
export function updateSuggestionsStore(data: Partial<SuggestionData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid suggestions data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating suggestions store', { id: data.id });

  suggestionsStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing suggestion', { id: data.id });
      return current.filter(s => s.id !== data.id);
    }

    const index = current.findIndex(s => s.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing suggestion', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new suggestion', { id: data.id });
      current.push(data as SuggestionData);
    }

    return [...current];
  });
}

/**
 * Update pmashes (pending resources) store
 * 
 * @param data - Pending resource data
 */
export function updatePmashesStore(data: Partial<PendResourceData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid pmashes data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating pmashes store', { id: data.id });

  pmashesStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing pmash', { id: data.id });
      return current.filter(p => p.id !== data.id);
    }

    const index = current.findIndex(p => p.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing pmash', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new pmash', { id: data.id });
      current.push(data as PendResourceData);
    }

    return [...current];
  });
}

/**
 * Update wegets (resource requests) store
 * 
 * @param data - Resource request data
 */
export function updateWegetsStore(data: Partial<ResourceRequestData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid wegets data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating wegets store', { id: data.id });

  wegetsStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing weget', { id: data.id });
      return current.filter(w => w.id !== data.id);
    }

    const index = current.findIndex(w => w.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing weget', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new weget', { id: data.id });
      current.push(data as ResourceRequestData);
    }

    return [...current];
  });
}

/**
 * Update halukas (profit distribution) store
 * 
 * @param data - Haluka data
 */
export function updateHalukasStore(data: Partial<HalukaData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid halukas data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating halukas store', { id: data.id });

  halukasStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing haluka', { id: data.id });
      return current.filter(h => h.id !== data.id);
    }

    const index = current.findIndex(h => h.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing haluka', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new haluka', { id: data.id });
      current.push(data as HalukaData);
    }

    return [...current];
  });
}

/**
 * Update welcome messages store
 * 
 * @param data - Welcome data
 */
export function updateWelcomeStore(data: Partial<WelcomeData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid welcome data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating welcome store', { id: data.id });

  welcomeStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing welcome', { id: data.id });
      return current.filter(w => w.id !== data.id);
    }

    const index = current.findIndex(w => w.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing welcome', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new welcome', { id: data.id });
      current.push(data as WelcomeData);
    }

    return [...current];
  });
}

/**
 * Update transfers store
 * 
 * @param data - Transfer data
 */
export function updateTransfersStore(data: Partial<TransferData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid transfers data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating transfers store', { id: data.id });

  transfersStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing transfer', { id: data.id });
      return current.filter(t => t.id !== data.id);
    }

    const index = current.findIndex(t => t.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing transfer', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new transfer', { id: data.id });
      current.push(data as TransferData);
    }

    return [...current];
  });
}

/**
 * Update decisions store
 * 
 * @param data - Decision data
 */
export function updateDecisionsStore(data: Partial<DecisionData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid decisions data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating decisions store', { id: data.id });

  decisionsStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing decision', { id: data.id });
      return current.filter(d => d.id !== data.id);
    }

    const index = current.findIndex(d => d.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing decision', { id: data.id });
      current[index] = { ...current[index], ...data };
    } else {
      console.log('➕ [levSocketHandler] Adding new decision', { id: data.id });
      current.push(data as DecisionData);
    }

    return [...current];
  });
}
