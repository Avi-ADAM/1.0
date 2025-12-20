import { sendToSer } from "$lib/send/sendToSer.js";
import { writable, get } from "svelte/store";
import { socketClient } from './socketClient';
import { browser } from '$app/environment';

// Stores
export const whoToFollow = writable({});
export const meetingsData = writable({});
export const isOnline = writable(false);
export const myUserMeeting = writable(0);
export const liveMeetings = writable({}); // Track live meetings

// Current user ID for filtering
let currentUserId = null;

// Meeting event handlers - these update the stores based on socket notifications
const meetingEventHandlers = {
  // When a meeting is started
  meetingStarted: (data) => {
    const { meetingId, videoLink, forumId, startedBy } = data;
    
    meetingsData.update(meetings => {
      if (meetings[meetingId]) {
        meetings[meetingId].attributes = {
          ...meetings[meetingId].attributes,
          isLive: true,
          videoLink: videoLink,
          forumId: forumId,
          startedBy: startedBy
        };
      }
      return meetings;
    });
    
    liveMeetings.update(live => {
      live[meetingId] = { videoLink, forumId, startedBy, startedAt: new Date().toISOString() };
      return live;
    });
    
    console.log('[Pgishot] Meeting started:', meetingId);
  },
  
  // When a meeting ends
  meetingEnded: (data) => {
    const { meetingId } = data;
    
    meetingsData.update(meetings => {
      if (meetings[meetingId]) {
        meetings[meetingId].attributes = {
          ...meetings[meetingId].attributes,
          isLive: false
        };
      }
      return meetings;
    });
    
    liveMeetings.update(live => {
      delete live[meetingId];
      return live;
    });
    
    console.log('[Pgishot] Meeting ended:', meetingId);
  },
  
  // When participant availability changes
  participantAvailability: (data) => {
    const { meetingId, userId, available, allOnline } = data;
    
    // Update my own online status if it's me
    if (userId === currentUserId) {
      isOnline.set(available);
    }
    
    // Update whoToFollow - other participants' status
    whoToFollow.update(users => {
      if (users[userId]) {
        users[userId].status = available;
      }
      return users;
    });
    
    // Update meeting availability status
    if (allOnline !== undefined && meetingId) {
      meetingsData.update(meetings => {
        if (meetings[meetingId]) {
          meetings[meetingId].attributes = {
            ...meetings[meetingId].attributes,
            available: allOnline
          };
        }
        return meetings;
      });
    }
    
    console.log('[Pgishot] Participant availability changed:', { meetingId, userId, available, allOnline });
  },
  
  // When a new message is sent in a meeting forum
  meetingMessage: (data) => {
    const { meetingId, message, forumId } = data;
    
    meetingsData.update(meetings => {
      if (meetings[meetingId]) {
        if (!meetings[meetingId].messages) {
          meetings[meetingId].messages = [];
        }
        meetings[meetingId].messages.push(message);
      }
      return meetings;
    });
    
    console.log('[Pgishot] New meeting message:', { meetingId, forumId });
  },
  
  // When meeting is confirmed (all participants approved)
  meetingConfirmed: (data) => {
    const { meetingId } = data;
    
    meetingsData.update(meetings => {
      if (meetings[meetingId]) {
        meetings[meetingId].attributes = {
          ...meetings[meetingId].attributes,
          set: true
        };
      }
      return meetings;
    });
    
    console.log('[Pgishot] Meeting confirmed:', meetingId);
  },

  // New participant joined a meeting
  participantJoined: (data) => {
    const { meetingId } = data;
    // Refresh the meeting data to get updated participant list
    refreshMeetingData(meetingId);
    console.log('[Pgishot] Participant joined meeting:', meetingId);
  }
};

// Handle notification from socketClient - the NEW targeted system
function handleMeetingNotification(notification) {
  const metadata = notification.metadata || notification.data?.metadata || {};
  const type = metadata.type;
  
  console.log('[Pgishot] Processing notification (NEW system):', type, metadata);
  
  switch (type) {
    case 'meetingStarted':
      meetingEventHandlers.meetingStarted({
        meetingId: metadata.meetingId,
        videoLink: metadata.videoLink,
        forumId: metadata.forumId,
        startedBy: metadata.startedBy
      });
      break;
      
    case 'meetingReady':
      meetingEventHandlers.participantAvailability({
        meetingId: metadata.meetingId,
        allOnline: metadata.allOnline
      });
      break;
      
    case 'userAvailability':
      meetingEventHandlers.participantAvailability({
        meetingId: metadata.meetingId,
        userId: metadata.userId,
        available: metadata.status === 'online',
        allOnline: metadata.allOnline
      });
      break;
      
    case 'meetingUpdate':
      meetingEventHandlers.participantJoined({
        meetingId: metadata.meetingId
      });
      break;
      
    case 'meetingConfirmed':
      meetingEventHandlers.meetingConfirmed({
        meetingId: metadata.meetingId
      });
      break;
      
    case 'newMessage':
    case 'meetingMessage':
      meetingEventHandlers.meetingMessage({
        meetingId: metadata.meetingId,
        forumId: metadata.forumId,
        message: notification.data?.message
      });
      break;
    
    // New ready-check flow events
    case 'meetingJoinRequest':
      // Someone requested to start the meeting - show join button
      meetingsData.update(meetings => {
        if (meetings[metadata.meetingId]) {
          meetings[metadata.meetingId].attributes = {
            ...meetings[metadata.meetingId].attributes,
            pendingStart: true,
            videoLink: metadata.videoLink,
            forumId: metadata.forumId,
            startRequestedBy: metadata.startRequestedBy
          };
        }
        return meetings;
      });
      console.log('[Pgishot] Meeting join request received:', metadata.meetingId);
      break;
      
    case 'participantReady':
      // Update the ready count for the meeting
      meetingsData.update(meetings => {
        if (meetings[metadata.meetingId]) {
          meetings[metadata.meetingId].readyCount = metadata.readyCount;
          meetings[metadata.meetingId].totalCount = metadata.totalCount;
        }
        return meetings;
      });
      console.log('[Pgishot] Participant ready:', metadata);
      break;
      
    default:
      // Unknown type, but might still be meeting-related
      if (metadata.meetingId) {
        console.log('[Pgishot] Unknown meeting event type:', type);
      }
  }
}

/**
 * @deprecated Use initializeMeetingSocketListeners instead.
 * This function uses the old Strapi socket which broadcasts to everyone.
 * Kept for backwards compatibility only.
 */
export async function initialWebSP(token, myId) {
  console.warn('[Pgishot] initialWebSP is DEPRECATED. Use the new socketClient system instead.');
  // The old Strapi socket is no longer used for meeting updates.
  // All updates now come through socketClient which uses targeted notifications.
}

// Initialize with socketClient for unified notification system (THE NEW WAY)
let socketUnsubscribe = null;

export function initializeMeetingSocketListeners(myId) {
  if (!browser) return () => {};
  
  // Store current user ID for filtering
  currentUserId = myId;
  
  // Unsubscribe previous listener if exists
  if (socketUnsubscribe) {
    socketUnsubscribe();
  }
  
  // Register notification listener with socketClient (NEW targeted system)
  socketUnsubscribe = socketClient.onNotification((notification) => {
    handleMeetingNotification(notification);
  });
  
  console.log('[Pgishot] Registered meeting notification listener (NEW targeted system) for user:', myId);
  
  return socketUnsubscribe;
}

// Cleanup function
export function cleanupMeetingSocketListeners() {
  if (socketUnsubscribe) {
    socketUnsubscribe();
    socketUnsubscribe = null;
  }
  currentUserId = null;
}

// Initialize meeting data from server
export async function initiatePgishot(idL) {
  await sendToSer({ id: idL }, "23myUserMeeting", null, null, false, fetch).then(d => {
    const pgishausers = d.data?.pgishausers?.data || [];
    console.log('[Pgishot] Initial data loaded:', pgishausers.length, 'profiles');
    
    // Store current user ID
    currentUserId = idL;
    
    if (pgishausers.length > 0) {
      myUserMeeting.set(pgishausers[0].id);
      isOnline.set(pgishausers.some(p => p.attributes.available === true));
      
      let users = {};
      let meetings = {};
      
      pgishausers.forEach(pu => {
        const ms = pu.attributes.pgishas?.data || [];
        ms.forEach(meeting => {
          meetings[meeting.id] = meeting;
          meetings[meeting.id].messages = [];
          meetings[meeting.id].kind = "meeting";
          // Add this for UI binding (used in +page.svelte)
          meetings[meeting.id].isMyStatusOnline = pu.attributes.available;
          
          meetings[meeting.id].messages.push({
            timestamp: meeting.attributes.publishedAt,
            message: "הפגישה נוצרה"
          });
          
          // Track participants
          const participants = meeting.attributes?.pgishausers?.data || [];
          participants.forEach(participant => {
            const pUserId = participant.attributes.users_permissions_user?.data?.id;
            // Identify 'not me' using the real user ID
            if (pUserId && String(pUserId) !== String(idL)) {
              if (!users[participant.id]) {
                users[participant.id] = {
                  meetings: [meeting.id],
                  status: participant.attributes.available,
                  userId: pUserId
                };
              } else {
                if (!users[participant.id].meetings.includes(meeting.id)) {
                  users[participant.id].meetings.push(meeting.id);
                }
              }
            }
          });
        });
      });
      
      whoToFollow.set(users);
      meetingsData.set(meetings);
      console.log('[Pgishot] Users to follow:', Object.keys(users).length);
      console.log('[Pgishot] Meetings:', Object.keys(meetings).length);
    }
    
    // Initialize socket listeners with the unified NEW system
    initializeMeetingSocketListeners(idL);
  });
}

// Helper to refresh meeting data from server
export async function refreshMeetingData(meetingId) {
  try {
    const result = await sendToSer({ id: meetingId }, "59GetMeetingDetails", null, null, false, fetch);
    
    if (result?.data?.pgisha?.data) {
      const meeting = result.data.pgisha.data;
      
      meetingsData.update(meetings => {
        meetings[meetingId] = {
          ...meetings[meetingId],
          id: meeting.id,
          attributes: meeting.attributes
        };
        return meetings;
      });
      
      console.log('[Pgishot] Meeting refreshed:', meetingId);
    }
  } catch (error) {
    console.error('[Pgishot] Error refreshing meeting:', error);
  }
}

// Toggle online status - uses the action system which sends targeted notifications
export async function toggleAvailability(newStatus) {
  try {
    const response = await fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionKey: 'toggleOnline',
        params: { status: newStatus }
      })
    });
    
    const result = await response.json();
    
    if (result.success || result.data) {
      isOnline.set(newStatus);
      console.log('[Pgishot] Availability toggled to:', newStatus);
    }
    
    return result;
  } catch (error) {
    console.error('[Pgishot] Error toggling availability:', error);
    throw error;
  }
}
