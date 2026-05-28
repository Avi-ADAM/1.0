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
  sheirutpStore,
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
  type DecisionData,
  type ProductRequestData
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

    const { actionKey } = notification as any;
    const updateStrategy = (notification as any).updateStrategy || (notification as any).actionResult?.updateStrategy;
    const data = (notification as any).data || (notification as any).actionResult?.data;

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
        await handlePartialUpdate(updateStrategy.config?.dataKeys, data, userId, token, lang);
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
 * Extract actual item data from potentially nested responses
 * 
 * Strapi/GraphQL responses often nest data under the mutation name.
 * This helper attempts to find the actual item data with an id.
 */
function extractData(data: any): any {
  if (!data) return data;

  // If it has an id at top level, it's already flat
  if (data.id) return data;

  // Look for Strapi-style nesting: { mutationName: { data: { id, attributes } } }
  const keys = Object.keys(data);
  if (keys.length === 1 && typeof data[keys[0]] === 'object') {
    const nestedData = data[keys[0]]?.data;
    if (nestedData && nestedData.id) {
      // Flatten: merge id and attributes
      return {
        id: nestedData.id,
        ...nestedData.attributes
      };
    }
  }

  return data;
}

/**
 * Extract a voter id from a vote object regardless of shape
 * (nested Strapi relation, flat id, or `ide` fallback).
 */
function voterIdOf(vote: any): string | undefined {
  const id =
    vote?.users_permissions_user?.data?.id ??
    vote?.users_permissions_user?.id ??
    vote?.users_permissions_user ??
    vote?.ide;
  return id != null ? String(id) : undefined;
}

/**
 * Append a vote to an item's vote array idempotently.
 *
 * Removes any prior vote by the same voter (optionally only at the same `order`,
 * to preserve historical votes from earlier negotiation rounds) and appends the
 * new one. This makes the update safe to apply repeatedly — including the echo
 * the voting device receives for its own action — without double counting, and
 * it correctly reflects a member changing their vote.
 *
 * Returns the new array, or null when the vote can't be identified (caller should
 * then leave the store untouched).
 */
function mergeVote(existing: any[] | undefined, newVote: any, matchOrder: boolean): any[] | null {
  const voterId = voterIdOf(newVote);
  if (!voterId) return null;

  const arr = Array.isArray(existing) ? existing : [];
  const order = newVote.order ?? 0;

  const filtered = arr.filter((v: any) => {
    if (voterIdOf(v) !== voterId) return true;
    // Same voter: drop the conflicting vote so the new one replaces it.
    if (matchOrder) return (v.order ?? 0) !== order; // keep votes from other rounds
    return false;
  });

  return [...filtered, newVote];
}

/**
 * Handle partial update of specific stores
 * 
 * This updates only the stores specified in dataKeys with the provided data.
 * 
 * @param dataKeys - Array of store keys to update
 * @param rawData - Update data (potentially nested)
 */
async function handlePartialUpdate(
  dataKeys: string[] | undefined,
  rawData: any,
  userId: string,
  token: string,
  lang: string
): Promise<void> {
  if (!dataKeys || dataKeys.length === 0) {
    console.warn('⚠️ [levSocketHandler] No dataKeys specified for partial update');
    return;
  }

  // Normalize data
  const data = extractData(rawData);

  console.log('🔄 [levSocketHandler] Processing partial update for keys:', dataKeys, { hasId: !!data?.id });

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

        case 'sheirutpends':
          if (data && data.id) {
            updateSheirutpStore(data);
          } else {
            console.log('🔄 [levSocketHandler] No data for sheirutpends update, performing full refresh');
            await handleFullRefresh(userId, token, lang);
          }
          break;

        case 'tasks':
          console.log('📋 [levSocketHandler] Task updated — applying targeted store update');
          updateTaskInMtahaStore(data);
          break;

        case 'chat':
          console.log('💬 [levSocketHandler] Chat update triggered - handled by pendMisMes listener');
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

      const newVote = (data as any).newVote;
      if (newVote) {
        // Append the vote (order-aware) so processPends re-derives the counts.
        const merged = mergeVote((current[index] as any).users, newVote, true);
        if (merged) {
          current[index] = { ...current[index], users: merged } as PendMissionData;
        }
      } else {
        current[index] = { ...current[index], ...data };
      }
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
 * @param data - Ask data (may include newVote to append to users/vots)
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

      const newVote = (data as any).newVote;
      if (newVote) {
        const existing = current[index];
        const existingUsers = Array.isArray((existing as any).users) ? (existing as any).users : [];
        const voterId = newVote.users_permissions_user?.data?.id;
        const alreadyVoted = voterId
          ? existingUsers.some((v: any) => v?.users_permissions_user?.data?.id === voterId)
          : false;

        if (!alreadyVoted) {
          const updatedUsers = [...existingUsers, newVote];
          current[index] = { ...existing, users: updatedUsers, vots: updatedUsers };
        }
      } else {
        current[index] = { ...current[index], ...data };
      }
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

      const newVote = (data as any).newVote;
      if (newVote) {
        const merged = mergeVote((current[index] as any).users, newVote, true);
        if (merged) {
          current[index] = { ...current[index], users: merged } as PendResourceData;
        }
      } else {
        current[index] = { ...current[index], ...data };
      }
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

      const newVote = (data as any).newVote;
      if (newVote) {
        // Maap/weget votes live on `vots` and have no order (one vote per member).
        const merged = mergeVote((current[index] as any).vots, newVote, false);
        if (merged) {
          current[index] = { ...current[index], vots: merged } as ResourceRequestData;
        }
      } else {
        current[index] = { ...current[index], ...data };
      }
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
 * @param data - Decision data (may include newVote to append to users/vots)
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

      const newVote = (data as any).newVote;
      if (newVote) {
        // Append new vote to users/vots — derived store re-derives noofusersOk etc.
        const existing = current[index];
        const existingUsers = Array.isArray(existing.users) ? existing.users : [];
        const voterId = newVote.users_permissions_user?.data?.id;
        const alreadyVoted = voterId
          ? existingUsers.some((v: any) => v?.users_permissions_user?.data?.id === voterId)
          : false;

        if (!alreadyVoted) {
          const updatedUsers = [...existingUsers, newVote];
          current[index] = { ...existing, users: updatedUsers, vots: updatedUsers };
        }
      } else {
        current[index] = { ...current[index], ...data };
      }
    } else {
      console.log('➕ [levSocketHandler] Adding new decision', { id: data.id });
      current.push(data as DecisionData);
    }

    return [...current];
  });
}

/**
 * Update a single task (Act) inside the mtaha (in-progress missions) store.
 *
 * Tasks are stored as mission.acts[]. We find the mission that owns the task
 * by scanning all acts arrays, then update or remove the task in-place.
 *
 * @param data - Flat task data extracted from the Strapi notification payload
 */
export function updateTaskInMtahaStore(data: any): void {
  if (!data?.id) {
    console.warn('⚠️ [levSocketHandler] updateTaskInMtahaStore: missing id');
    return;
  }

  const taskId = String(data.id);
  console.log('🔄 [levSocketHandler] Updating task in mtahaStore', { taskId });

  mtahaStore.update(missions => {
    let changed = false;

    const updated = missions.map(mission => {
      const acts: any[] = mission.acts || [];
      const idx = acts.findIndex((t: any) => String(t.id) === taskId);
      if (idx === -1) return mission;

      changed = true;
      let newActs: any[];

      if (data.naasa === true) {
        // Task marked as done → remove from list
        console.log('🗑️ [levSocketHandler] Removing completed task', { taskId });
        newActs = acts.filter((_: any, i: number) => i !== idx);
      } else {
        // Merge updated attributes into the existing task
        console.log('✏️ [levSocketHandler] Updating task attributes', { taskId });
        newActs = [...acts];
        newActs[idx] = {
          ...newActs[idx],
          attributes: { ...newActs[idx].attributes, ...data }
        };
      }

      return { ...mission, acts: newActs };
    });

    if (!changed) {
      console.warn('⚠️ [levSocketHandler] Task not found in any mission', { taskId });
    }

    return changed ? updated : missions;
  });
}

/**
 * Update sheirutpends (product requests) store
 * 
 * @param data - Product request data
 */
export function updateSheirutpStore(data: Partial<ProductRequestData> & { id: string }): void {
  if (!data || !data.id) {
    console.warn('⚠️ [levSocketHandler] Invalid sheirutpends data (missing id)');
    return;
  }

  console.log('🔄 [levSocketHandler] Updating sheirutpends store', { id: data.id });

  sheirutpStore.update(current => {
    if ((data as any)._deleted) {
      console.log('🗑️ [levSocketHandler] Removing sheirutpend', { id: data.id });
      return current.filter(s => s.id !== data.id);
    }

    const index = current.findIndex(s => s.id === data.id);

    if (index !== -1) {
      console.log('✏️ [levSocketHandler] Updating existing sheirutpend', { id: data.id });

      const updatedItem = { ...current[index], ...data };

      // Smart merging for 'vots' array to prevent data loss
      if (data.vots && Array.isArray(data.vots) && current[index].vots) {
        const existingVots = [...current[index].vots];
        const newVots = data.vots;

        for (const newVote of newVots) {
          const voterId = newVote.attributes.users_permissions_user?.data?.id || newVote.attributes.users_permissions_user;
          if (!voterId) continue;

          // Find if this user already has a vote in existing record
          // We want to keep all historical votes or just update the one at the same order
          const existingVoteIndex = existingVots.findIndex(v => {
            const vId = v.attributes.users_permissions_user?.data?.id || v.attributes.users_permissions_user;
            return vId === voterId && v.attributes.order === newVote.attributes.order;
          });

          if (existingVoteIndex !== -1) {
            existingVots[existingVoteIndex] = { ...existingVots[existingVoteIndex], ...newVote };
          } else {
            existingVots.push(newVote);
          }
        }
        updatedItem.vots = existingVots;
      }

      current[index] = updatedItem;
    } else {
      console.log('➕ [levSocketHandler] Adding new sheirutpend', { id: data.id });
      current.push(data as ProductRequestData);
    }

    return [...current];
  });
}
