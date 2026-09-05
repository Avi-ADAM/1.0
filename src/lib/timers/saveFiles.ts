/**
 * The files a member attaches when they save a timer (`Timer.saveFiles`), and
 * the copy of them that rides onto the approval / finished-mission row
 * (`Finiapruval.what`, `FinnishedMission.what`).
 *
 * Every one of those is the same Strapi media relation, and every reader hits
 * the same three shapes depending on which query loaded it: `{ data: [...] }`,
 * a bare array, or a single `{ data: {...} }` from an older single-file field.
 * Flattening that in each component is how `whatt` ended up meaning "the url of
 * the first file, if the query happened to return an object" — so it is done
 * here, once.
 *
 * Pure: no `import.meta.env`, no fetch. Resolving a relative Strapi url to an
 * absolute one is the host's job (`mediaUrl` in `$lib/utils/processLifecycle`).
 */

export type SaveFile = {
  id: string;
  /** Raw Strapi url — still relative unless the provider is remote. */
  url: string;
  /** Original filename; falls back to the last path segment. */
  name: string;
  mime: string;
  /** Kilobytes, as Strapi stores it. `0` when the query did not ask. */
  size: number;
};

function nameOf(attrs: any, url: string): string {
  const given = typeof attrs?.name === 'string' ? attrs.name.trim() : '';
  if (given) return given;
  const last = String(url).split('?')[0].split('/').filter(Boolean).pop();
  return last ? decodeURIComponent(last) : '';
}

/**
 * Any of the shapes above → a flat list of files.
 *
 * Entries with no url are dropped: a media row the query could not resolve is
 * a broken link, and a card that renders it gives the member a dead button.
 */
export function readSaveFiles(media: unknown): SaveFile[] {
  if (!media) return [];

  const raw: any = media;
  const rows: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : raw?.data
        ? [raw.data]
        : [];

  const files: SaveFile[] = [];
  for (const row of rows) {
    if (!row) continue;
    const attrs = row.attributes ?? row;
    const url = typeof attrs?.url === 'string' ? attrs.url : '';
    if (!url) continue;
    files.push({
      id: String(row.id ?? attrs?.id ?? url),
      url,
      name: nameOf(attrs, url),
      mime: typeof attrs?.mime === 'string' ? attrs.mime : '',
      size: Number(attrs?.size ?? 0) || 0
    });
  }
  return files;
}

/**
 * Just the ids, for writing the relation back to Strapi.
 *
 * Deliberately not `readSaveFiles(...).map(f => f.id)`: a write path asks for
 * `saveFiles { data { id } }` and nothing else, and dropping url-less rows —
 * which is right when rendering a link — would silently detach every file.
 */
export function saveFileIds(media: unknown): string[] {
  if (!media) return [];
  const raw: any = media;
  const rows: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
      ? raw.data
      : raw?.data
        ? [raw.data]
        : [];
  const ids: string[] = [];
  for (const row of rows) {
    const id = row?.id ?? row?.attributes?.id ?? (typeof row === 'string' || typeof row === 'number' ? row : null);
    if (id === null || id === undefined || id === '') continue;
    const asString = String(id);
    if (!ids.includes(asString)) ids.push(asString);
  }
  return ids;
}

/** `1.4 MB` / `320 KB` — Strapi stores `size` in kilobytes. */
export function fileSizeLabel(sizeKb: number): string {
  const kb = Number(sizeKb) || 0;
  if (kb <= 0) return '';
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
