/**
 * The rikma's shared library — create, edit and archive
 * (docs/PLAN_RIKMA_SHARED_INFO.md §3.1, §5, §6 stage 1).
 *
 * Three actions over one collection, `space-doc`: a row is either an uploaded
 * **file**, an uploaded **image**, or a **link** to something that lives
 * elsewhere (a Drive folder, a Doc, a supplier's site). The file itself is
 * already in Strapi by the time we get here — `/api/upload` does the upload and
 * hands back an id — so these actions only ever write the *record*.
 *
 * Two rules the plan is emphatic about, and both are enforced here rather than
 * trusted to the UI:
 *
 * 1. **Secrets are not documents.** There is no `kind: 'secret'`, and no field
 *    a password could be typed into and survive as plaintext in the DB. The
 *    vault is a separate, later thing built on sealed space events (§3.2), and
 *    the plan says explicitly not to ship an interim Strapi version of it.
 *
 * 2. **`projectMember` alone is not enough for an edit.** That rule proves the
 *    caller belongs to the project *named in the params* — it says nothing
 *    about which project owns `docId`. Without the ownership re-read below, a
 *    member of their own one-person rikma could pass any other rikma's doc id
 *    and rename or archive it. Same shape as the holder check in
 *    `blockResourceDates`.
 *
 * Removal is a soft delete (`archived: true`), consistent with `Machshir`. It
 * deliberately does *not* ride the `archiveObject` Decision flow: that flow
 * exists because archiving a mission or a resource cancels a commitment
 * somebody is accruing hours or equity against. A document carries no such
 * accrual — and PLAN_OBJECT_ARCHIVAL names the objects it covers (open/in-
 * progress missions, resources, products), which does not include these rows.
 */

import type { ActionConfig, ActionExecutionHandler } from '../types.js';
import { execFromContext } from '$lib/server/archive/exec.js';
import { enumField, fields, numField, run, strField, gqlStr } from '$lib/server/archive/gql.js';
import { confirmStored, isProjectKey, storageKind } from '$lib/server/storage/index.js';
import { ALLOWED_MIME } from '$lib/uploads/policy.js';
import { isSha256Hex } from '$lib/p2p/hash.js';

const KINDS = ['file', 'image', 'link'] as const;
type DocKind = (typeof KINDS)[number];

/** Trim, and collapse an all-whitespace string to null. */
function clean(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/**
 * Only `http(s)` links, and only absolute ones.
 *
 * A stored link is rendered as an anchor the whole rikma clicks, so
 * `javascript:` / `data:` here is a stored-XSS vector aimed at co-members —
 * the one place in this feature where a member can hand other members a URL.
 * Rejecting at the write is what keeps every reader of the collection safe,
 * including future ones that forget to sanitize.
 */
export function safeUrl(value: unknown): string {
  const raw = clean(value);
  if (!raw) throw new Error('A link needs a url');
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('The link must be a full address, e.g. https://…');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http(s) links can be stored');
  }
  return parsed.toString();
}

/** `file`/`image` need an uploaded file; `link` needs a url. Neither substitutes. */
export function normaliseKind(kind: unknown): DocKind {
  const k = String(kind ?? 'file');
  if (!(KINDS as readonly string[]).includes(k)) {
    throw new Error(`Unknown document kind "${k}"`);
  }
  return k as DocKind;
}

/**
 * Read a doc's owning project id. Returns null when the row does not exist —
 * the caller turns that into the same "not yours" error as a mismatch, so a
 * probe cannot tell a deleted doc from another rikma's doc.
 */
async function ownerProjectOf(exec: ReturnType<typeof execFromContext>, docId: string) {
  const data = await run(
    exec,
    `query SpaceDocOwner { spaceDoc(id: ${gqlStr(docId)}) {
       data { id attributes { project { data { id } } } }
     } }`,
    'spaceDocOwner'
  );
  const node = data?.spaceDoc?.data;
  if (!node) return null;
  return node.attributes?.project?.data?.id ?? null;
}

/** Throw unless `docId` belongs to `projectId` (see rule 2 in the header). */
async function assertDocInProject(
  exec: ReturnType<typeof execFromContext>,
  docId: string,
  projectId: string
) {
  const owner = await ownerProjectOf(exec, docId);
  if (owner == null || String(owner) !== String(projectId)) {
    throw new Error('Forbidden: that document does not belong to this rikma');
  }
}

// ─── create ────────────────────────────────────────────────────────────────

const createSpaceDocHandler: ActionExecutionHandler = async (params, context) => {
  const { projectId, name, note, folder } = params;
  const kind = normaliseKind(params.kind);

  const title = clean(name);
  if (!title) throw new Error('A document needs a name');

  const fileId = clean(params.fileId);
  const storageKey = clean(params.storageKey);
  // The content address the P2P pilot verifies against. Optional (older
  // clients, hashing refused on a huge file); when present it must be a real
  // sha256 — a malformed one would make every peer transfer fail its check.
  const sha256 = params.sha256 == null || params.sha256 === '' ? null : String(params.sha256).toLowerCase();
  if (sha256 && !isSha256Hex(sha256)) throw new Error('sha256 must be 64 hex characters');
  const url = kind === 'link' ? safeUrl(params.url) : null;
  if (kind !== 'link' && !fileId && !storageKey) {
    throw new Error('Upload the file before saving the record');
  }
  if (fileId && storageKey) throw new Error('A document is either uploaded to Strapi or to the bucket, not both');

  // Stage 2 (private bucket). The upload never passed through us, so the key
  // and the bucket are the only evidence — both are checked before the row
  // exists: the key must sit under this rikma's prefix (otherwise a member of
  // rikma A could attach an object minted for rikma B), and the object must
  // really be there. Size comes from the bucket, not from the client.
  let stored: { fileName: string; mime: string; size: number } | null = null;
  if (storageKey && kind !== 'link') {
    if (!isProjectKey(storageKey, projectId)) {
      throw new Error('Forbidden: that upload does not belong to this rikma');
    }
    if (!storageKind()) throw new Error('File storage is not configured here');
    const mime = String(params.mime ?? '');
    if (!ALLOWED_MIME.has(mime)) throw new Error(`Unsupported file type: ${mime || 'unknown'}`);
    const fileName = clean(params.fileName) ?? storageKey.split('/').pop() ?? 'file';
    const head = await confirmStored(storageKey, { fileName, mime }, (context.fetch ?? fetch) as typeof fetch);
    if (!head) throw new Error('The upload did not arrive — try again');
    stored = { fileName, mime, size: head.size };
  }

  const exec = execFromContext(context);
  const data = await run(
    exec,
    `mutation CreateSpaceDoc { createSpaceDoc(data: { ${fields(
      `project: ${gqlStr(projectId)}`,
      `uploadedBy: ${gqlStr(context.userId)}`,
      strField('name', title),
      strField('note', clean(note)),
      strField('folder', clean(folder)),
      enumField('kind', kind, KINDS),
      fileId && kind !== 'link' ? `file: ${gqlStr(fileId)}` : null,
      stored ? strField('storageKey', storageKey) : null,
      stored ? strField('fileName', stored.fileName) : null,
      stored ? strField('mime', stored.mime) : null,
      stored ? numField('size', stored.size) : null,
      kind !== 'link' && sha256 ? strField('sha256', sha256) : null,
      strField('url', url),
      'archived: false'
    )} }) { data { id } } }`,
    'createSpaceDoc'
  );

  const id = data?.createSpaceDoc?.data?.id;
  if (!id) throw new Error('Failed to create the document record');

  return { data: { spaceDocId: String(id), kind }, updateStrategy: { type: 'fullRefresh' } };
};

export const createSpaceDocConfig: ActionConfig = {
  key: 'createSpaceDoc',
  description:
    "Add a document, image or link to a rikma's shared library. The file is uploaded first — to the private bucket via /api/v1/space-docs/upload-url (storageKey), or to Strapi via /api/upload (fileId) where the bucket is not configured; this writes the record.",
  graphqlOperation: createSpaceDocHandler,

  paramSchema: {
    projectId: { type: 'string', required: true, description: 'The rikma the document belongs to' },
    name: { type: 'string', required: true, description: 'Display name' },
    kind: { type: 'string', required: false, description: "'file' | 'image' | 'link' (default 'file')" },
    fileId: { type: 'string', required: false, description: 'Strapi upload id (stage-1 path)' },
    storageKey: { type: 'string', required: false, description: 'Private-bucket object key from upload-url (stage 2)' },
    fileName: { type: 'string', required: false, description: 'Original file name, for the download' },
    mime: { type: 'string', required: false, description: 'Content type the object was uploaded with' },
    sha256: { type: 'string', required: false, description: 'Hex sha256 of the file, computed in the browser (P2P pilot)' },
    url: { type: 'string', required: false, description: 'http(s) address — required for link' },
    note: { type: 'string', required: false, description: 'Free description' },
    folder: { type: 'string', required: false, description: 'Logical path, e.g. "contracts/2026"' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to add to the shared library' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only members of this rikma can add to its shared library'
    }
  ],

  access: ['user', 'serviceAdmin'],
  updateStrategy: { type: 'fullRefresh' }
};

// ─── update ────────────────────────────────────────────────────────────────

const updateSpaceDocHandler: ActionExecutionHandler = async (params, context) => {
  const { docId, projectId } = params;

  const exec = execFromContext(context);
  await assertDocInProject(exec, String(docId), String(projectId));

  // Only the fields actually sent are written — an omitted `note` means "leave
  // it alone", not "clear it". Clearing is an explicit empty string, which
  // `clean` turns into null and `strField` then drops... so it is spelled out.
  const parts: Array<string | null> = [];
  if ('name' in params) {
    const title = clean(params.name);
    if (!title) throw new Error('A document needs a name');
    parts.push(strField('name', title));
  }
  if ('note' in params) parts.push(`note: ${gqlStr(clean(params.note) ?? '')}`);
  if ('folder' in params) parts.push(`folder: ${gqlStr(clean(params.folder) ?? '')}`);
  if ('url' in params) parts.push(`url: ${gqlStr(safeUrl(params.url))}`);

  if (parts.filter(Boolean).length === 0) {
    return { data: { spaceDocId: String(docId), unchanged: true }, updateStrategy: { type: 'none' } };
  }

  await run(
    exec,
    `mutation UpdateSpaceDoc { updateSpaceDoc(id: ${gqlStr(docId)}, data: { ${fields(
      ...parts
    )} }) { data { id } } }`,
    'updateSpaceDoc'
  );

  return { data: { spaceDocId: String(docId) }, updateStrategy: { type: 'fullRefresh' } };
};

export const updateSpaceDocConfig: ActionConfig = {
  key: 'updateSpaceDoc',
  description:
    "Rename, re-file or re-describe an entry in a rikma's shared library. The uploaded file itself is never replaced — a new version is a new entry.",
  graphqlOperation: updateSpaceDocHandler,

  paramSchema: {
    docId: { type: 'string', required: true, description: 'The space-doc to edit' },
    projectId: { type: 'string', required: true, description: 'The rikma that owns it — re-checked server-side' },
    name: { type: 'string', required: false, description: 'New display name' },
    note: { type: 'string', required: false, description: 'New description ("" clears it)' },
    folder: { type: 'string', required: false, description: 'New logical path ("" clears it)' },
    url: { type: 'string', required: false, description: 'New http(s) address, for links' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to edit the shared library' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only members of this rikma can edit its shared library'
    }
  ],

  access: ['user', 'serviceAdmin'],
  updateStrategy: { type: 'fullRefresh' }
};

// ─── archive ───────────────────────────────────────────────────────────────

const archiveSpaceDocHandler: ActionExecutionHandler = async (params, context) => {
  const { docId, projectId } = params;
  const restore = params.restore === true;

  const exec = execFromContext(context);
  await assertDocInProject(exec, String(docId), String(projectId));

  await run(
    exec,
    `mutation ArchiveSpaceDoc { updateSpaceDoc(id: ${gqlStr(docId)}, data: { archived: ${
      restore ? 'false' : 'true'
    } }) { data { id } } }`,
    'archiveSpaceDoc'
  );

  return {
    data: { spaceDocId: String(docId), archived: !restore },
    updateStrategy: { type: 'fullRefresh' }
  };
};

export const archiveSpaceDocConfig: ActionConfig = {
  key: 'archiveSpaceDoc',
  description:
    "Soft-delete (or restore) an entry in a rikma's shared library. The row stays, so a removal is never silent history loss.",
  graphqlOperation: archiveSpaceDocHandler,

  paramSchema: {
    docId: { type: 'string', required: true, description: 'The space-doc to archive' },
    projectId: { type: 'string', required: true, description: 'The rikma that owns it — re-checked server-side' },
    restore: { type: 'boolean', required: false, description: 'true puts it back on the shelf' }
  },

  authRules: [
    { type: 'jwt', errorMessage: 'Must be authenticated to remove from the shared library' },
    {
      type: 'projectMember',
      config: { projectIdParam: 'projectId' },
      errorMessage: 'Only members of this rikma can remove from its shared library'
    }
  ],

  access: ['user', 'serviceAdmin'],
  updateStrategy: { type: 'fullRefresh' }
};
