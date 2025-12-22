
import { sendToSer } from '$lib/send/sendToSer.js';

export async function load({ locals, params, fetch }) {
  const meetingId = params.id;
  const uid = locals.uid;

  // If not logged in, return minimal data
  if (!uid) {
    return {
      uid: null,
      meetingId,
      meeting: null,
      messages: [],
      participants: [],
      error: 'Not authenticated'
    };
  }

  try {
    // Fetch meeting details
    const result = await sendToSer(
      { id: meetingId },
      '59GetMeetingDetails',
      0,
      0,
      false,
      fetch
    );

    if (result?.data?.pgisha?.data) {
      const meeting = result.data.pgisha.data;

      console.log('[MeetingLoad] Meeting data:', JSON.stringify(meeting, null, 2));

      // Process messages if forum exists
      let messages = [];
      if (meeting.attributes.forum?.data?.attributes?.messages?.data) {
        console.log('[MeetingLoad] Found messages:', meeting.attributes.forum.data.attributes.messages.data.length);
        messages = meeting.attributes.forum.data.attributes.messages.data.map((msg) => ({
          id: msg.id,
          content: msg.attributes.content,
          createdAt: msg.attributes.createdAt,
          userId: msg.attributes.users_permissions_user?.data?.id,
          username: msg.attributes.users_permissions_user?.data?.attributes?.username || 'Unknown',
          profilePic: msg.attributes.users_permissions_user?.data?.attributes?.profilePic?.data?.attributes?.url
        })).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Sort by creation time, oldest first
      } else {
        console.log('[MeetingLoad] No messages found. Forum structure:', {
          hasForumData: !!meeting.attributes.forum?.data,
          hasForumAttributes: !!meeting.attributes.forum?.data?.attributes,
          hasMessages: !!meeting.attributes.forum?.data?.attributes?.messages,
          hasMessagesData: !!meeting.attributes.forum?.data?.attributes?.messages?.data
        });
      }

      console.log('[MeetingLoad] Processed messages:', messages.length);

      // Process participants
      const participants = meeting.attributes.pgishausers?.data?.map((p) => ({
        id: p.id,
        available: p.attributes.available,
        userId: p.attributes.users_permissions_user?.data?.id,
        username: p.attributes.users_permissions_user?.data?.attributes?.username,
        profilePic: p.attributes.users_permissions_user?.data?.attributes?.profilePic?.data?.attributes?.url
      })) || [];

      return {
        uid,
        meetingId,
        meeting: {
          id: meeting.id,
          name: meeting.attributes.name,
          desc: meeting.attributes.desc,
          available: meeting.attributes.available,
          set: meeting.attributes.set,
          isLive: meeting.attributes.isLive,
          videoLink: meeting.attributes.videoLink,
          meetingStartedAt: meeting.attributes.meetingStartedAt,
          forumId: meeting.attributes.forum?.data?.id,
          startedBy: meeting.attributes.startedBy?.data?.attributes?.username
        },
        messages,
        participants,
        error: null
      };
    }

    return {
      uid,
      meetingId,
      meeting: null,
      messages: [],
      participants: [],
      error: 'Meeting not found'
    };
  } catch (error) {
    console.error('Error loading meeting:', error);
    return {
      uid,
      meetingId,
      meeting: null,
      messages: [],
      participants: [],
      error: 'Failed to load meeting'
    };
  }
}
