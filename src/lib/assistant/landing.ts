/**
 * Where a person lands after signing up through an agent
 * (docs/inprogress/PLAN_AI_SIGNUP_CONCIERGE.md §5.1): straight into what was prepared in
 * the conversation, never the generic onboarding when there is something
 * better waiting.
 */

import type { AssistantKind } from './types.js';

export function landingFor(session: {
  id: string;
  kind: AssistantKind;
  itemCount: number;
  ratsonId?: string | null;
}): string {
  switch (session.kind) {
    case 'rikma':
      // A drafted rikma → its one-click review; only the intent → the business onboarding.
      return session.itemCount > 0 ? `/moach/import/${session.id}` : '/onboard/business';
    case 'wish':
      return session.ratsonId ? `/concierge/new?draft=${session.ratsonId}&welcome=1` : '/concierge/new?welcome=1';
    case 'profile':
    default:
      return `/onboard/assistant?s=${session.id}`;
  }
}

/** Only our own paths: a landing is used as a redirect target. */
export function isSafeLanding(path: unknown): path is string {
  return typeof path === 'string' && /^\/(?!\/)[\w\-/?=&%.]*$/.test(path);
}
