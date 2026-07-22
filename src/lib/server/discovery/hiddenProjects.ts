/**
 * Project ids to exclude from the public discovery surfaces (rikma directory,
 * demand map, mission/resource/product listings). Used for test rikmas that
 * need to stay around for QA but shouldn't be visible to everyone.
 *
 * Add the numeric Strapi project id as a string, one per line.
 */
export const HIDDEN_PROJECT_IDS: string[] = [
  '45',
  '46',
  '51',
  '56',
  '55',
  '54',
  '63',
  '72',
  '80',
    // '123',
];

const hidden = new Set(HIDDEN_PROJECT_IDS.map(String));

export function isHiddenProject(id: string | number | null | undefined): boolean {
  return id !== null && id !== undefined && hidden.has(String(id));
}
