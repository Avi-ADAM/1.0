/**
 * Approve Haluka API Endpoint
 * 
 * This endpoint handles the complex flow of approving a haluka (division):
 * 1. Updates tosplit with user's vote and marks as finished
 * 2. Updates all related sales as splited
 * 3. Updates all halukot as ushar (approved)
 * 4. Sends customized notifications to all participants
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendToSer } from '$lib/send/sendToSer.js';
import { HalukaNotificationService } from '$lib/server/notifications/HalukaNotificationService.js';

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
  try {
    const body = await request.json();
    const { tosplitId, userId, users, halukot } = body;

    // Get auth from cookies
    const jwt = cookies.get('jwt');
    const cookieUserId = cookies.get('id');
    const lang = cookies.get('lang') || 'he';

    if (!jwt || !cookieUserId) {
      return json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build vots array with all existing votes plus current user
    const vots = users.map((u: any) => ({
      what: true,
      users_permissions_user: String(u.users_permissions_user?.data?.id || u.id || u)
    }));
    
    // Add current user's vote
    vots.push({
      what: true,
      users_permissions_user: String(userId)
    });

    // Step 1: Update tosplit with votes and mark as finished
    const tosplitResult: any = await sendToSer(
      {
        tosplitId,
        vots
      },
      '79approveTosplit',
      0,
      0,
      false,
      fetch
    );

    if (!tosplitResult?.data?.updateTosplit?.data) {
      throw new Error('Failed to update tosplit');
    }

    const salesData = tosplitResult.data.updateTosplit.data.attributes?.sales?.data || [];

    // Step 2: Update all sales as splited (and clear pending flag)
    // This marks the sales as fully processed after all votes are in
    for (const sale of salesData) {
      try {
        await sendToSer(
          { saleId: sale.id },
          '80updateSale',
          0,
          0,
          false,
          fetch
        );
      } catch (e) {
        console.error(`Error updating sale ${sale.id}:`, e);
      }
    }

    // Step 3: Update all halukot as ushar (approved)
    for (const haluka of halukot) {
      try {
        await sendToSer(
          { halukaId: haluka.id },
          '81updateHaluka',
          0,
          0,
          false,
          fetch
        );
      } catch (e) {
        console.error(`Error updating haluka ${haluka.id}:`, e);
      }
    }

    // Step 4: Send notifications (async, don't wait)
    HalukaNotificationService.sendHalukaNotifications(
      halukot,
      { userId: cookieUserId, jwt, lang, fetch }
    ).catch(err => {
      console.error('Notification error:', err);
    });

    return json({
      success: true,
      data: tosplitResult.data
    });

  } catch (error: any) {
    console.error('Error approving haluka:', error);
    return json(
      {
        success: false,
        error: error.message || 'Failed to approve haluka'
      },
      { status: 500 }
    );
  }
};
