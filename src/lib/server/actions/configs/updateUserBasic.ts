import type { ActionConfig, ActionExecutionHandler } from '../types.js';

/**
 * Update the current user's basic profile fields and settings.
 *
 * Replaces the old client-side axios PUT to `/api/users/:id` (which exposed the
 * JWT). The target user is taken from the JWT context, never from a client id.
 * Uses GraphQL variables so free-text fields are escaped safely.
 *
 * Client sends any subset of:
 *   { username, bio, frd, lang, fblink, twiterlink, discordlink, githublink,
 *     preferCards, noMail }
 *
 * Emits a socket notification to the user's own devices so every open profile
 * tab refreshes.
 */
const handler: ActionExecutionHandler = async (params, context) => {
  const userId = context.userId as string;
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;

  // Build the `data: { ... }` GraphQL fragment from only the provided fields,
  // following the proven inline-mutation pattern (see migration notes).
  //
  // String fields → JSON.stringify (valid GraphQL string literal, escapes
  // quotes/backslashes/newlines). Enum fields (frd, lang per
  // src/generated/graphql.ts UsersPermissionsUserInput) must be emitted
  // UNQUOTED and are whitelisted to prevent injection.
  const lines: string[] = [];

  const strFields = ['username', 'bio', 'fblink', 'twiterlink', 'discordlink', 'githublink'];
  for (const key of strFields) {
    if (params[key] !== undefined) {
      lines.push(`${key}: ${JSON.stringify(params[key] ?? '')}`);
    }
  }

  // Enum fields — only emit if the value is a known member
  const FRD_VALUES = ['fri', 'mon', 'na', 'shabat', 'sun', 'teh', 'thu', 'wen'];
  const LANG_VALUES = ['ar', 'en', 'he'];
  if (params.frd !== undefined && FRD_VALUES.includes(params.frd)) {
    lines.push(`frd: ${params.frd}`);
  }
  if (params.lang !== undefined && LANG_VALUES.includes(params.lang)) {
    lines.push(`lang: ${params.lang}`);
  }

  if (params.preferCards !== undefined) lines.push(`preferCards: ${!!params.preferCards}`);
  if (params.noMail !== undefined) lines.push(`noMail: ${!!params.noMail}`);

  if (lines.length === 0) {
    // Nothing to update — skip the round-trip
    return {
      data: { attributes: {} },
      notifyUserIds: [userId],
      updateStrategy: { type: 'none' }
    };
  }

  const res = await f(import.meta.env.VITE_URL + '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: `mutation {
        updateUsersPermissionsUser(id: ${userId}, data: { ${lines.join(', ')} }) {
          data {
            attributes {
              username bio frd lang preferCards noMail
              fblink twiterlink discordlink githublink
            }
          }
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

export const updateUserBasicConfig: ActionConfig = {
  key: 'updateUserBasic',
  description: 'Update the current user basic info and settings (username, bio, links, prefs)',
  graphqlOperation: handler,
  paramSchema: {
    username: { type: 'string', required: false },
    bio: { type: 'string', required: false },
    frd: { type: 'string', required: false },
    lang: { type: 'string', required: false },
    fblink: { type: 'string', required: false },
    twiterlink: { type: 'string', required: false },
    discordlink: { type: 'string', required: false },
    githublink: { type: 'string', required: false },
    preferCards: { type: 'boolean', required: false },
    noMail: { type: 'boolean', required: false }
  },
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to update your profile' }],
  notification: {
    recipients: { type: 'specificUsers', config: { userIdsParam: 'notifyUserIds', excludeSender: false } },
    templates: {
      title: { he: 'הפרופיל עודכן', en: 'Profile updated', ar: 'تم تحديث الملف الشخصي' },
      body: { he: 'פרטי הפרופיל שלך עודכנו', en: 'Your profile details were updated', ar: 'تم تحديث تفاصيل ملفك الشخصي' }
    },
    channels: ['socket'],
    metadata: { type: 'profile', url: 'me' }
  },
  updateStrategy: { type: 'partialUpdate', config: { dataKeys: ['app:meProfile'] } }
};
