// Central rikma — inner/outer ring assignment (PLAN_central_rikma_definition §2).
//
// Decision D-08 (contributor co-op): membership in the central rikma's inner
// ring is earned by having at least one approved mission (or rikmash) on the
// platform project — exactly the work that gives a user positive weight in
// PLAN_central_rikma D-13.
//
// This module is the projection helper that produces each user's ring
// assignment from consent events. The "actual" tagging in production will
// happen via a User.platformRing field set by a Strapi-side projection job
// during the transition; once central-rikma missions migrate to consent
// events (target C4), this projection becomes the source of truth.

import type { ConsentEvent } from './event';

export type PlatformRing = 'inner' | 'outer' | null;

export type PlatformRingInput = {
  /** All consent events scoped to the platform rikma. */
  events: ConsentEvent[];
  /** The platform rikma's Project id (set in PLAN_central_rikma §2.1). */
  platformProjectId: string;
};

export type PlatformRingsResult = {
  /** userId → ring */
  rings: Map<string, PlatformRing>;
  /** Members who reached inner ring this projection (audit). */
  innerMembers: string[];
  /** Members who are outer (joined but no approved work). */
  outerMembers: string[];
};

/**
 * Projects the platform rikma's consent events to per-user rings.
 *
 * Inner: actor was the contributor of a verified `mission.approve` event
 *        OR a `rikmash.approve` event on the platform project.
 * Outer: actor signed `project.join` on the platform project but has no
 *        approved work.
 * null:  not yet joined (visible to callers as Map.get → undefined).
 *
 * Multi-membership: a user can be in inner ring across multiple rikmas; this
 * function answers only for the platform rikma it was given events for.
 */
export function computePlatformRings(input: PlatformRingInput): PlatformRingsResult {
  const { events, platformProjectId } = input;

  const joiners = new Set<string>();
  const innerSet = new Set<string>();

  for (const ev of events) {
    // Only events about THIS platform project count.
    if (ev.subject.type === 'project' && ev.subject.id !== platformProjectId) continue;

    switch (ev.action) {
      case 'project.join':
        if (ev.subject.id === platformProjectId) joiners.add(ev.actor);
        break;
      case 'project.leave':
        if (ev.subject.id === platformProjectId) {
          joiners.delete(ev.actor);
          innerSet.delete(ev.actor);
        }
        break;
      case 'mission.approve': {
        // The payee/contributor is recorded in predicate.payee or actor.
        // For the platform rikma's BOM, we credit the predicate.payee when
        // present (auditor signs but credit goes to contributor); fallback
        // to actor for self-credit.
        const payee = (ev.predicate as { payee?: string } | undefined)?.payee ?? ev.actor;
        innerSet.add(payee);
        joiners.add(payee);  // approval implies membership
        break;
      }
      default:
        // Other actions don't change ring assignment.
        break;
    }
  }

  const rings = new Map<string, PlatformRing>();
  for (const user of joiners) {
    rings.set(user, innerSet.has(user) ? 'inner' : 'outer');
  }

  return {
    rings,
    innerMembers: [...innerSet].sort(),
    outerMembers: [...joiners].filter((u) => !innerSet.has(u)).sort()
  };
}

/**
 * Convenience accessor — null for not-yet-joined.
 */
export function getRing(rings: Map<string, PlatformRing>, userId: string): PlatformRing {
  return rings.get(userId) ?? null;
}
