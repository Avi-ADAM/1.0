import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { STRAPI_GRAPHQL } from '$lib/server/strapiUrl.js';

/**
 * Update the current user's basic profile fields and settings.
 *
 * Replaces the old client-side axios PUT to `/api/users/:id` (which exposed the
 * JWT). The target user is taken from the JWT context, never from a client id.
 * Uses GraphQL variables so free-text fields are escaped safely.
 *
 * Client sends any subset of:
 *   { username, bio, frd, lang, fblink, twiterlink, discordlink, githublink,
 *     preferCards, noMail, location }
 *
 * `location` mirrors LocationPicker's value shape ({ location_mode, lat, lng,
 * radius, location_hint }) and is stored as the user's single-point entry in
 * the repeatable `location` component (ComponentNewLocation[]).
 *
 * Emits a socket notification to the user's own devices so every open profile
 * tab refreshes.
 */
const LOCATION_MODES = ['online', 'onsite', 'hybrid', 'unspecified'];

function normalizeLocationInput(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== 'object') return null;
  const src = input as Record<string, unknown>;

  const hasPoint =
    typeof src.lat === 'number' && Number.isFinite(src.lat) &&
    typeof src.lng === 'number' && Number.isFinite(src.lng);
  const hasMode = LOCATION_MODES.includes(src.location_mode as string) && src.location_mode !== 'unspecified';
  const hasHint = typeof src.location_hint === 'string' && src.location_hint.trim().length > 0;

  // A bare default radius with nothing else set (the widget's initial state)
  // is not a real location — don't manufacture an entry for it.
  if (!hasPoint && !hasMode && !hasHint) return null;

  const loc: Record<string, unknown> = {};
  if (LOCATION_MODES.includes(src.location_mode as string)) loc.location_mode = src.location_mode;
  if (hasPoint) {
    loc.lat = src.lat;
    loc.lng = src.lng;
    if (typeof src.radius === 'number' && Number.isFinite(src.radius)) loc.radius = Math.round(src.radius);
  }
  if (hasHint) loc.location_hint = (src.location_hint as string).trim();
  return loc;
}

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
  // Matches Enum_Userspermissionsuser_Lang minus 'fr', which has no site translations yet.
  const LANG_VALUES = ['ar', 'en', 'es', 'he', 'ru'];
  if (params.frd !== undefined && FRD_VALUES.includes(params.frd)) {
    lines.push(`frd: ${params.frd}`);
  }
  if (params.lang !== undefined && LANG_VALUES.includes(params.lang)) {
    lines.push(`lang: ${params.lang}`);
  }

  if (params.preferCards !== undefined) lines.push(`preferCards: ${!!params.preferCards}`);
  if (params.noMail !== undefined) lines.push(`noMail: ${!!params.noMail}`);

  // location is a nested component — passed as a GraphQL variable rather than
  // interpolated, since it carries free-text (location_hint) and numbers.
  const variables: Record<string, unknown> = {};
  const varDefs: string[] = [];
  if (params.location !== undefined) {
    const normalized = normalizeLocationInput(params.location);
    varDefs.push('$location: [ComponentNewLocationInput]');
    variables.location = normalized ? [normalized] : [];
    lines.push('location: $location');
  }

  if (lines.length === 0) {
    // Nothing to update — skip the round-trip
    return {
      data: { attributes: {} },
      notifyUserIds: [userId],
      updateStrategy: { type: 'none' }
    };
  }

  const res = await f(STRAPI_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: `mutation${varDefs.length ? `(${varDefs.join(', ')})` : ''} {
        updateUsersPermissionsUser(id: ${userId}, data: { ${lines.join(', ')} }) {
          data {
            attributes {
              username bio frd lang preferCards noMail
              fblink twiterlink discordlink githublink
              location { location_mode lat lng radius location_hint }
            }
          }
        }
      }`,
      variables
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
    noMail: { type: 'boolean', required: false },
    location: {
      type: 'object',
      required: false,
      description: "User's primary location point (location_mode, lat, lng, radius, location_hint)"
    }
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
