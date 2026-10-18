export type QuickCreateKind = 'task' | 'mission' | 'resource';

export type QuickCreateProject = {
  id: string;
  projectName: string;
  profilePic: string | null;
};

export const QUICK_CREATE_ACTIONS = [
  {
    id: 'task',
    titleKey: 'common.quickCreate.kind.task',
    descriptionKey: 'common.quickCreate.kind.taskHint'
  },
  {
    id: 'mission',
    titleKey: 'common.quickCreate.kind.mission',
    descriptionKey: 'common.quickCreate.kind.missionHint'
  },
  {
    id: 'resource',
    titleKey: 'common.quickCreate.kind.resource',
    descriptionKey: 'common.quickCreate.kind.resourceHint'
  }
] as const;

/**
 * Construct only the known in-app destinations for Quick Create. Keep the
 * target page responsible for rendering and saving its own existing form.
 */
export function buildQuickCreateHref(
  kind: QuickCreateKind,
  projectId: string | number
): string {
  const id = encodeURIComponent(String(projectId));
  switch (kind) {
    case 'task':
      return `/moach/${id}/acts?action=createtask`;
    case 'mission':
      return `/moach/${id}/create?action=createmission`;
    case 'resource':
      return `/moach/${id}/create?action=createresource`;
  }
}

/**
 * Prefer the rikma already in context, then a still-valid recent choice.
 * With exactly one rikma there is no reason to ask the member to pick it again;
 * with several, leave the selection empty rather than guessing.
 */
export function resolveQuickCreateProjectId(
  projects: readonly Pick<QuickCreateProject, 'id'>[],
  currentProjectId?: string | null,
  lastProjectId?: string | null
): string | null {
  if (!projects.length) return null;

  const ids = new Set(projects.map((project) => String(project.id)));
  if (currentProjectId && ids.has(String(currentProjectId)))
    return String(currentProjectId);
  if (lastProjectId && ids.has(String(lastProjectId)))
    return String(lastProjectId);
  if (projects.length === 1) return String(projects[0].id);
  return null;
}
