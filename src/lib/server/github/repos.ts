/**
 * Repositories ↔ `project-repo` rows (PLAN_CODE_RIKMA §3.1). Pure.
 *
 * One repository belongs to at most one rikma at a time — contributions to it
 * will later turn into claims on exactly one rikma's value, so two rikmas
 * silently sharing a repository would mean two claims on the same work. A
 * repository still connected elsewhere is therefore reported as a conflict,
 * never moved; one whose earlier connection was removed can be taken up again.
 */

export type RepoStatus = 'active' | 'suspended' | 'removed';

export interface RepoRowInput {
  repoId: string;
  owner: string;
  name: string;
  defaultBranch: string | null;
  license: string | null;
  isPrivate: boolean;
}

export interface ExistingRepoRow {
  id: string;
  repoId: string;
  projectId: string | null;
  status: RepoStatus | null;
}

export interface RepoSyncPlan {
  create: RepoRowInput[];
  /** Existing rows (re)attached to this rikma and set active, fields refreshed. */
  update: { rowId: string; row: RepoRowInput }[];
  /** Still connected to a different rikma — left untouched. */
  conflicts: RepoRowInput[];
}

/**
 * GitHub repository JSON → row fields. Works on the full object from
 * `/installation/repositories` and on the partial one in
 * `installation_repositories` webhooks (id, name, full_name, private).
 */
export function toRepoRow(repo: any): RepoRowInput | null {
  const id = repo?.id;
  if (id == null || !Number.isFinite(Number(id))) return null;
  const [fullOwner, fullName] = String(repo.full_name ?? '').split('/');
  const owner = repo.owner?.login ?? fullOwner;
  const name = repo.name ?? fullName;
  if (!owner || !name) return null;
  const spdx = repo.license?.spdx_id;
  return {
    repoId: String(id),
    owner: String(owner),
    name: String(name),
    defaultBranch: repo.default_branch ? String(repo.default_branch) : null,
    license: spdx && spdx !== 'NOASSERTION' ? String(spdx) : null,
    isPrivate: Boolean(repo.private)
  };
}

export function planRepoSync(
  projectId: string,
  incoming: RepoRowInput[],
  existing: ExistingRepoRow[]
): RepoSyncPlan {
  const plan: RepoSyncPlan = { create: [], update: [], conflicts: [] };
  const byRepo = new Map(existing.map((e) => [String(e.repoId), e]));
  const seen = new Set<string>();

  for (const row of incoming) {
    if (seen.has(row.repoId)) continue;
    seen.add(row.repoId);

    const ex = byRepo.get(row.repoId);
    if (!ex) {
      plan.create.push(row);
    } else if (String(ex.projectId ?? '') === String(projectId) || !ex.projectId || ex.status === 'removed') {
      plan.update.push({ rowId: String(ex.id), row });
    } else {
      plan.conflicts.push(row);
    }
  }
  return plan;
}

/** `projectRepos.data` from Strapi → the rows `planRepoSync` compares against. */
export function toExistingRows(rows: any[]): ExistingRepoRow[] {
  return rows.map((r) => ({
    id: String(r.id),
    repoId: String(r.attributes?.repoId),
    projectId: r.attributes?.project?.data?.id != null ? String(r.attributes.project.data.id) : null,
    status: (r.attributes?.status ?? null) as RepoStatus | null
  }));
}

/**
 * `available` — can be connected now; `here` — already connected to this
 * rikma; `elsewhere` — still connected to another rikma, so it cannot be.
 */
export type PickState = 'available' | 'here' | 'elsewhere';

export type PickableRepo = RepoRowInput & { pick: PickState };

/**
 * An installation's repositories, as the picker offers them. GitHub's install
 * screen lets a member grant "All repositories", so nothing is attached until
 * they choose one here. Uses the same rule as `planRepoSync`; connectable
 * repositories first, then by name.
 */
export function markPickable<T extends RepoRowInput>(
  projectId: string,
  incoming: T[],
  existing: ExistingRepoRow[]
): (T & { pick: PickState })[] {
  const byRepo = new Map(existing.map((e) => [String(e.repoId), e]));
  const order: Record<PickState, number> = { available: 0, here: 1, elsewhere: 2 };
  const seen = new Set<string>();
  const out: (T & { pick: PickState })[] = [];

  for (const row of incoming) {
    if (seen.has(row.repoId)) continue;
    seen.add(row.repoId);
    const ex = byRepo.get(row.repoId);
    let pick: PickState = 'available';
    if (ex && ex.projectId && ex.status !== 'removed') {
      pick = String(ex.projectId) === String(projectId) ? 'here' : 'elsewhere';
    }
    out.push({ ...row, pick });
  }

  const label = (r: RepoRowInput) => `${r.owner}/${r.name}`.toLowerCase();
  return out.sort((a, b) => order[a.pick] - order[b.pick] || label(a).localeCompare(label(b)));
}

/** `owner/name` → the repository's web URL. */
export function repoUrl(row: { owner: string; name: string }): string {
  return `https://github.com/${encodeURIComponent(row.owner)}/${encodeURIComponent(row.name)}`;
}
