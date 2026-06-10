import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/**
 * Set the profile picture of the current user.
 *
 * The image is uploaded separately via the `/api/upload` proxy (which keeps the
 * JWT server-side); this action just links the resulting media id to the user.
 * The target user is taken from the JWT context, never from a client id.
 *
 * Client sends: { imageId: string | number }
 *
 * Emits a socket notification to the user's own devices so every open profile
 * tab refreshes (partialUpdate on the `app:meProfile` dependency). The
 * originating tab also refreshes via the returned updateStrategy.
 */
const handler: ActionExecutionHandler = async (params, context) => {
  const imageId = params.imageId;
  const userId = context.userId as string;
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;

  const res = await f(import.meta.env.VITE_URL + '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: `mutation {
        updateUsersPermissionsUser(id: ${userId}, data: { profilePic: ${imageId} }) {
          data { attributes { profilePic { data { attributes { url formats } } } } }
        }
      }`
    })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);

  return {
    data: json.data.updateUsersPermissionsUser.data,
    notifyUserIds: [userId],
    updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['app:meProfile'] } }
  };
};

export const updateUserProfilePicConfig: ActionConfig = {
  key: 'updateUserProfilePic',
  description: 'Set the current user profile picture from an uploaded media id',
  graphqlOperation: handler,
  paramSchema: {
    imageId: { type: 'string', required: true, description: 'Uploaded media id to link as profilePic' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to change your picture' }],
  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'notifyUserIds', excludeSender: false } },
    templates: {
      title: { he: 'תמונת הפרופיל עודכנה', en: 'Profile picture updated', ar: 'تم تحديث صورة الملف الشخصي' },
      body: { he: 'תמונת הפרופיל שלך עודכנה', en: 'Your profile picture was updated', ar: 'تم تحديث صورة ملفك الشخصي' }
    },
    channels: ['socket'],
    metadata: { type: 'profile', url: 'me' }
  },
  updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['app:meProfile'] } }
};
