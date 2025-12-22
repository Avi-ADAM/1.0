import { sendToSer } from '$lib/send/sendToSer.js';
import { json } from '@sveltejs/kit';

export async function GET({ locals, params, fetch }) {
  const meetingId = params.id;
  const uid = locals.uid;

  if (!uid) {
    return json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Fetch meeting details to get messages
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
      
      // Process messages if forum exists
      let messages = [];
      if (meeting.attributes.forum?.data?.attributes?.messages?.data) {
        messages = meeting.attributes.forum.data.attributes.messages.data.map((msg) => ({
          id: msg.id,
          content: msg.attributes.content,
          createdAt: msg.attributes.createdAt,
          userId: msg.attributes.users_permissions_user?.data?.id,
          username: msg.attributes.users_permissions_user?.data?.attributes?.username || 'Unknown',
          profilePic: msg.attributes.users_permissions_user?.data?.attributes?.profilePic?.data?.attributes?.url
        })).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      
      return json({
        success: true,
        messages
      });
    }
    
    return json({ success: false, error: 'Meeting not found' }, { status: 404 });
  } catch (error) {
    console.error('Error refreshing messages:', error);
    return json({ success: false, error: 'Failed to refresh messages' }, { status: 500 });
  }
}