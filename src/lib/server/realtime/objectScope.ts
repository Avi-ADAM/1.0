/**
 * The scope of a rikma object named the way the object-change flows name it
 * (`targetKind` of proposeObjectArchive / proposeObjectEdit, PLAN_OBJECT_ARCHIVAL).
 */

import { scope } from '$lib/realtime/scopes';

const ENTITY = {
  openMission: 'mission',
  missionInProgress: 'mission',
  openResource: 'resource',
  resourceInProgress: 'resource',
  matanot: 'product'
} as const;

export function objectScope(targetKind: unknown, id: string | number | null | undefined): string | null {
  const entity = ENTITY[String(targetKind) as keyof typeof ENTITY];
  return entity ? scope(entity, id) : null;
}
