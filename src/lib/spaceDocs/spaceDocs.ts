/**
 * The rikma's shared library — pure shaping for the `space-doc` rows
 * (docs/PLAN_RIKMA_SHARED_INFO.md §3.1, §5).
 *
 * Kept free of Svelte and of `fetch` so the grouping and the "is this link
 * safe to render" question are testable on their own — the second one in
 * particular, because it is the last gate before a member-supplied URL becomes
 * an anchor every other member clicks.
 */

import { isSha256Hex } from '$lib/p2p/hash.js';

export type SpaceDocKind = 'file' | 'image' | 'link';

export interface SpaceDoc {
  id: string;
  name: string;
  note: string;
  kind: SpaceDocKind;
  /**
   * Resolved href: our own serve endpoint for a private-bucket file, the media
   * url for a stage-1 file/image, the stored url for a link.
   */
  href: string;
  /** Stored in the private bucket — opened only through the members check. */
  privateFile: boolean;
  /** Content address recorded at upload ('' for older rows) — the P2P pilot's key. */
  sha256: string;
  folder: string;
  /** Original file name, for the download. Empty for links. */
  fileName: string;
  mime: string;
  /** Bytes. Strapi reports KB as a float, so this is normalised to bytes. */
  size: number;
  uploadedBy: { id: string; username: string; pic: string } | null;
  createdAt: string;
}

export interface SpaceDocFolder {
  /** '' is the unfiled group — rendered under a generic heading, not hidden. */
  folder: string;
  docs: SpaceDoc[];
}

/** Where a private-bucket file is opened. Relative: same origin as the page. */
export function serveHref(id: string | number): string {
  return `/api/v1/space-docs/${encodeURIComponent(String(id))}/file`;
}

/** A link we are willing to render as an anchor. Everything else is dropped. */
export function isSafeHref(url: unknown): boolean {
  if (typeof url !== 'string' || url.trim() === '') return false;
  try {
    const { protocol } = new URL(url.trim());
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    // Relative urls never come from a member — they are our own media paths,
    // which `mediaUrl` has already made absolute by the time we get here.
    return false;
  }
}

/**
 * Strapi's `file.size` is **kilobytes as a float** (`12.34`), not bytes — the
 * one field in this shape that is not what its name suggests. Reading it as
 * bytes makes every document in the library render as "12 B".
 */
function toBytes(size: unknown): number {
  const n = Number(size);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 1024) : 0;
}

/**
 * Flatten one `space_docs` GraphQL collection into render-ready rows.
 *
 * @param rows      `project.space_docs.data` from qid 325
 * @param resolve   turns a relative Strapi media path into an absolute url
 */
export function normalizeSpaceDocs(
  rows: any[] | null | undefined,
  resolve: (url: string | null | undefined) => string
): SpaceDoc[] {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row): SpaceDoc[] => {
    const a = row?.attributes ?? {};
    const kind: SpaceDocKind =
      a.kind === 'image' || a.kind === 'link' ? a.kind : 'file';

    const media = a.file?.data?.attributes ?? null;
    // Stage 2: an object in the private bucket has no media and no public url.
    // Its href is our own endpoint, built here from the row id — never from
    // anything a member typed — so it is the one relative href allowed through.
    const privateFile = kind !== 'link' && typeof a.storageKey === 'string' && a.storageKey !== '';
    const href = privateFile
      ? serveHref(row.id)
      : kind === 'link'
        ? String(a.url ?? '').trim()
        : resolve(media?.url);

    // A row whose payload went missing — a link with no url, a file whose media
    // was deleted in Strapi — has nothing to open. It is dropped rather than
    // rendered as a dead entry the members cannot fix from here.
    if (!privateFile && !isSafeHref(href)) return [];

    const user = a.uploadedBy?.data ?? null;

    return [
      {
        id: String(row.id),
        name:
          String(a.name ?? '').trim() ||
          String(a.fileName ?? media?.name ?? '').trim() ||
          '—',
        note: String(a.note ?? '').trim(),
        kind,
        href,
        privateFile,
        sha256: isSha256Hex(a.sha256) ? a.sha256 : '',
        folder: String(a.folder ?? '').trim(),
        fileName: String((privateFile ? a.fileName : media?.name) ?? '').trim(),
        mime: String((privateFile ? a.mime : media?.mime) ?? '').trim(),
        // The bucket row stores bytes; Strapi media reports kilobytes.
        size: privateFile ? Math.max(0, Number(a.size) || 0) : toBytes(media?.size),
        uploadedBy: user
          ? {
              id: String(user.id),
              username: String(user.attributes?.username ?? ''),
              pic: resolve(user.attributes?.profilePic?.data?.attributes?.url)
            }
          : null,
        createdAt: String(a.createdAt ?? '')
      }
    ];
  });
}

/**
 * Group by `folder`, unfiled last.
 *
 * "Folders" here are a plain string path, not a tree (§3.1) — two rows are in
 * the same folder when they spell it the same way, and that is the whole model
 * for stage 1. Folders sort by name so the order does not shuffle as documents
 * are added.
 */
export function groupByFolder(docs: SpaceDoc[]): SpaceDocFolder[] {
  const byFolder = new Map<string, SpaceDoc[]>();
  for (const doc of docs) {
    const list = byFolder.get(doc.folder);
    if (list) list.push(doc);
    else byFolder.set(doc.folder, [doc]);
  }

  return [...byFolder.entries()]
    .map(([folder, list]) => ({ folder, docs: list }))
    .sort((a, b) => {
      if (a.folder === '') return 1;
      if (b.folder === '') return -1;
      return a.folder.localeCompare(b.folder);
    });
}

/** Every folder name already in use, for the datalist on the add form. */
export function folderNames(docs: SpaceDoc[]): string[] {
  return [...new Set(docs.map((d) => d.folder).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
}

/**
 * "1.4 MB". Locale-free on purpose: the unit is the same in every language the
 * platform speaks, and the number goes through the page's own formatting.
 */
export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}
