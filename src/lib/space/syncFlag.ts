// Who runs on the Space (A1, PLAN_DISTRIBUTED_EXECUTION). The pilot is a
// RIKMA, not a browser: the server's SPACE_SYNC_PROJECTS names the rikmas
// whose members sign into and sync their project Space. The old
// localStorage.SPACE_SYNC_ENABLED='1' stays as the developer override — on
// for every space in that browser, exactly as before.
//
// Pure, so the decision is testable without IndexedDB, a browser or SvelteKit.

/** The developer override value in localStorage.SPACE_SYNC_ENABLED. */
export const SPACE_SYNC_OVERRIDE_ON = '1';

const PROJECT_ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

/**
 * SPACE_SYNC_PROJECTS → project ids. Comma- or whitespace-separated; empty
 * or unset is an empty list (= off). Anything that is not a plain id is
 * dropped rather than trusted — the list travels to every client.
 */
export function parseSpaceSyncProjects(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const out = new Set<string>();
  for (const token of raw.split(/[\s,]+/)) {
    if (PROJECT_ID_RE.test(token)) out.add(token);
  }
  return [...out];
}

/**
 * The decision. The override turns everything on; otherwise only a project
 * on the server's list, and nothing without a project context.
 */
export function decideSpaceSync(opts: {
  override: string | null | undefined;
  projectId?: string | number | null;
  allowlist: readonly string[] | null | undefined;
}): boolean {
  if (opts.override === SPACE_SYNC_OVERRIDE_ON) return true;
  if (opts.projectId === null || opts.projectId === undefined || opts.projectId === '') return false;
  return (opts.allowlist ?? []).includes(String(opts.projectId));
}
