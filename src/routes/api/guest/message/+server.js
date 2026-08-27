/**
 * Post a chat message to a meeting forum on behalf of a guest.
 *
 * Why this is not an action on /api/action: every Unified Action is defined
 * around an acting *user* — ActionContext requires a userId, the JWT is that
 * user's, and the entity authRules resolve ownership through them. A meeting
 * guest has no account at all. Rather than smuggle a fake user through that
 * machinery, guest writes get this one narrow endpoint, and the write is
 * attributed by name (`message.guestName`) instead of by relation.
 *
 * Two independent proofs are required, and neither alone is enough:
 *
 *   1. `x-meetings-secret` — the call came from the meetings server
 *      (meetings.1lev1.com), not from a browser. See meetingsProxy.ts.
 *   2. The guest's own signed invitation token, which names exactly one
 *      meeting. It is re-verified here rather than trusted from the caller:
 *      the meetings server telling us "this is meeting 42" would make a bug
 *      there into a way to post into any forum on the platform.
 *
 * And the forum is then checked to actually belong to that meeting — the token
 * pins a meeting, so the forum id in the body must not be able to wander.
 */

import { json, error } from '@sveltejs/kit';
import { StrapiClient } from '$lib/server/actions/StrapiClient.js';
import { NotificationOrchestrator } from '$lib/server/notifications/NotificationOrchestrator.js';
import { isMeetingsRequest } from '$lib/server/meetingsProxy.js';
import { verifyInviteToken } from '$lib/server/guestInvite.js';
import { ADMINMONTHER } from '$env/static/private';
import { STRAPI_URL } from '$lib/server/strapiUrl.js';

const STRAPI_ENDPOINT = STRAPI_URL + '/graphql';
const ADMIN_TOKEN = String(ADMINMONTHER ?? '')
	.replace(/\s+/g, '')
	.replace(/^ADMINMONTHER=/, '');

/** Matches the `maxLength` on message.guestName. */
const MAX_NAME = 50;
const MAX_CONTENT = 4000;

/** @type {StrapiClient | null} */
let strapiClient = null;
/** @type {NotificationOrchestrator | null} */
let orchestrator = null;

function services() {
	if (!strapiClient) {
		strapiClient = new StrapiClient(STRAPI_ENDPOINT, ADMIN_TOKEN);
		orchestrator = new NotificationOrchestrator(strapiClient);
	}
	return {
		strapi: /** @type {StrapiClient} */ (strapiClient),
		notifier: /** @type {NotificationOrchestrator} */ (orchestrator)
	};
}

export async function POST({ request, fetch }) {
	if (!isMeetingsRequest(request)) {
		throw error(401, 'Unauthorized');
	}

	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const verified = verifyInviteToken(body?.inviteToken);
	if (!verified.valid || !verified.payload) {
		throw error(403, 'Invalid or expired guest invitation');
	}
	const meetingId = String(verified.payload.meetingId);

	const forumId = body?.forumId == null ? '' : String(body.forumId);
	const content = typeof body?.content === 'string' ? body.content.trim() : '';
	const displayName =
		typeof body?.displayName === 'string' && body.displayName.trim() !== ''
			? body.displayName.trim().slice(0, MAX_NAME)
			: 'Guest';

	if (!forumId) throw error(400, 'forumId is required');
	if (!content) throw error(400, 'content is required');
	if (content.length > MAX_CONTENT) throw error(400, 'Message is too long');

	const { strapi, notifier } = services();

	// The invitation pins a meeting; read that meeting and make the forum prove
	// it is the same conversation. Without this, the forum id is an unchecked
	// pointer into every forum on the platform.
	let meetingRes;
	try {
		meetingRes = await strapi.execute('59GetMeetingDetails', { id: meetingId }, ADMIN_TOKEN, fetch);
	} catch (e) {
		console.error('[guest/message] meeting lookup failed:', e);
		throw error(502, 'Could not verify the meeting');
	}

	const meeting = meetingRes?.data?.pgisha?.data;
	if (!meeting) throw error(404, 'Meeting not found');

	const meetingForumId = meeting.attributes?.forum?.data?.id;
	if (!meetingForumId || String(meetingForumId) !== forumId) {
		console.warn(
			`[guest/message] forum ${forumId} does not belong to meeting ${meetingId}; refusing`
		);
		throw error(403, 'That forum does not belong to your meeting');
	}

	const publishedAt = new Date().toISOString();
	let createRes;
	try {
		createRes = await strapi.execute(
			'1chatsendGuest',
			{
				fid: forumId,
				fidn: parseInt(forumId, 10),
				da: publishedAt,
				mes: content,
				guestName: displayName
			},
			ADMIN_TOKEN,
			fetch
		);
	} catch (e) {
		console.error('[guest/message] create failed:', e);
		throw error(502, 'Failed to send message');
	}

	if (createRes?.errors) {
		console.error('[guest/message] create returned errors:', createRes.errors);
		throw error(502, 'Failed to send message');
	}

	const messageId = createRes?.data?.createMessage?.data?.id ?? null;

	// Tell the meeting. Registered participants are reached by user id; the
	// meetingId in the metadata is what also carries this into the guest room,
	// so the other guests watching the same meeting see it too.
	const participantIds = (meeting.attributes?.pgishausers?.data ?? [])
		.map((/** @type {any} */ p) => p.attributes?.users_permissions_user?.data?.id)
		.filter((/** @type {any} */ id) => id != null)
		.map(String);

	try {
		await notifier.notify(
			{
				recipients: { type: 'specificUsers', config: { userIdsParam: 'participants' } },
				templates: {
					title: {
						he: 'הודעה חדשה בפגישה',
						en: 'New message in meeting',
						ar: 'رسالة جديدة في الاجتماع'
					},
					body: {
						he: `${displayName} שלח הודעה: ${content}`,
						en: `${displayName} sent a message: ${content}`,
						ar: `${displayName} أرسل رسالة: ${content}`
					}
				},
				channels: ['socket'],
				metadata: {
					priority: 'normal',
					type: 'meetingMessage',
					url: '/meeting/' + meetingId,
					meetingId,
					forumId,
					messageId
				}
			},
			{ participants: participantIds, meetingId, forumId },
			{
				success: true,
				data: {
					message: {
						id: messageId,
						content,
						createdAt: publishedAt,
						userId: null,
						username: displayName,
						profilePic: null
					}
				}
			},
			// No acting user: the orchestrator only reads userId to exclude the
			// sender, and a guest is not among the recipients to begin with.
			{ userId: '', jwt: ADMIN_TOKEN, lang: 'he', fetch }
		);
	} catch (e) {
		// The message is already written; a failed notification must not turn a
		// delivered message into an error the guest retries.
		console.error('[guest/message] notification failed:', e);
	}

	return json({
		success: true,
		messageId,
		content,
		createdAt: publishedAt
	});
}
