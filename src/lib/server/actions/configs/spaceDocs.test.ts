import { describe, it, expect, vi, beforeEach } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import {
  archiveSpaceDocConfig,
  createSpaceDocConfig,
  normaliseKind,
  safeUrl,
  updateSpaceDocConfig
} from './spaceDocs.js';

/**
 * The handlers reach Strapi through `execFromContext`, which builds its
 * transport out of `context.fetch` — so a fake fetch is the whole seam. Each
 * call records the GraphQL document it was handed and answers from a queue.
 */
function fakeStrapi(responses: any[], head: { status: number; size?: number } = { status: 404 }) {
  const sent: string[] = [];
  const fetchFn = vi.fn(async (_url: any, init: any) => {
    // The bucket's HEAD rides the same fetch: answer it from `head`.
    if (init?.method === 'HEAD') {
      return new Response(null, {
        status: head.status,
        headers: { 'content-length': String(head.size ?? 0) }
      });
    }
    sent.push(JSON.parse(init.body).query);
    const body = responses.shift() ?? { data: {} };
    return { ok: true, status: 200, statusText: 'OK', json: async () => body } as any;
  });
  return { fetchFn, sent };
}

const context = (fetchFn: any) => ({ userId: '11', jwt: 'jwt', fetch: fetchFn }) as any;

/** `spaceDoc(id:…)` answering with the project that owns it. */
const ownedBy = (projectId: string | null) => ({
  data: { spaceDoc: { data: projectId == null ? null : { id: '5', attributes: { project: { data: { id: projectId } } } } } }
});

const run = (config: any, params: any, fetchFn: any) =>
  (config.graphqlOperation as any)(params, context(fetchFn));

describe('safeUrl', () => {
  it('passes an ordinary https link through', () => {
    expect(safeUrl('https://drive.google.com/folder')).toBe('https://drive.google.com/folder');
  });

  it('refuses the schemes that would turn a stored link into an attack on co-members', () => {
    expect(() => safeUrl('javascript:alert(1)')).toThrow(/http\(s\)/);
    expect(() => safeUrl('data:text/html,<script>')).toThrow(/http\(s\)/);
    expect(() => safeUrl('file:///etc/passwd')).toThrow(/http\(s\)/);
  });

  it('refuses anything that is not an absolute address', () => {
    expect(() => safeUrl('drive.google.com')).toThrow(/full address/);
    expect(() => safeUrl('')).toThrow(/needs a url/);
    expect(() => safeUrl(null)).toThrow(/needs a url/);
  });
});

describe('normaliseKind', () => {
  it('defaults to file and accepts the three kinds', () => {
    expect(normaliseKind(undefined)).toBe('file');
    for (const k of ['file', 'image', 'link']) expect(normaliseKind(k)).toBe(k);
  });

  it('has no secret kind — the vault is not a document', () => {
    expect(() => normaliseKind('secret')).toThrow(/Unknown document kind/);
    expect(() => normaliseKind('password')).toThrow(/Unknown document kind/);
  });
});

describe('createSpaceDoc', () => {
  it('writes the record with the caller as uploader', async () => {
    const { fetchFn, sent } = fakeStrapi([{ data: { createSpaceDoc: { data: { id: '42' } } } }]);

    const res = await run(
      createSpaceDocConfig,
      { projectId: '3', name: ' Lease ', kind: 'file', fileId: '9', folder: 'contracts' },
      fetchFn
    );

    expect(res.data).toEqual({ spaceDocId: '42', kind: 'file' });
    expect(sent[0]).toContain('createSpaceDoc');
    expect(sent[0]).toContain('project: "3"');
    // The uploader is the authenticated caller, never a param the client sends.
    expect(sent[0]).toContain('uploadedBy: "11"');
    expect(sent[0]).toContain('name: "Lease"');
    expect(sent[0]).toContain('kind: file');
  });

  it('refuses a file row with nothing uploaded, before it writes anything', async () => {
    const { fetchFn } = fakeStrapi([]);
    await expect(run(createSpaceDocConfig, { projectId: '3', name: 'x' }, fetchFn)).rejects.toThrow(
      /Upload the file/
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('refuses a hostile link before it writes anything', async () => {
    const { fetchFn } = fakeStrapi([]);
    await expect(
      run(createSpaceDocConfig, { projectId: '3', name: 'x', kind: 'link', url: 'javascript:alert(1)' }, fetchFn)
    ).rejects.toThrow(/http\(s\)/);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('refuses a nameless row', async () => {
    const { fetchFn } = fakeStrapi([]);
    await expect(
      run(createSpaceDocConfig, { projectId: '3', name: '   ', kind: 'link', url: 'https://a.test' }, fetchFn)
    ).rejects.toThrow(/needs a name/);
  });
});

/**
 * The cross-rikma case is the reason these two handlers re-read the row.
 * `projectMember` proves the caller belongs to the project they *named*; only
 * this check ties that project to the document they are editing.
 */
describe('updateSpaceDoc / archiveSpaceDoc ownership', () => {
  it('edits a document that belongs to the named rikma', async () => {
    const { fetchFn, sent } = fakeStrapi([
      ownedBy('3'),
      { data: { updateSpaceDoc: { data: { id: '5' } } } }
    ]);

    const res = await run(updateSpaceDocConfig, { docId: '5', projectId: '3', name: 'Lease v2' }, fetchFn);

    expect(res.data).toEqual({ spaceDocId: '5' });
    expect(sent[1]).toContain('name: "Lease v2"');
  });

  it('refuses another rikma’s document, and writes nothing', async () => {
    const { fetchFn, sent } = fakeStrapi([ownedBy('99')]);

    await expect(
      run(updateSpaceDocConfig, { docId: '5', projectId: '3', name: 'hijacked' }, fetchFn)
    ).rejects.toThrow(/does not belong to this rikma/);

    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('query SpaceDocOwner');
  });

  it('treats a missing row exactly like someone else’s row', async () => {
    const { fetchFn } = fakeStrapi([ownedBy(null)]);
    await expect(
      run(archiveSpaceDocConfig, { docId: '404', projectId: '3' }, fetchFn)
    ).rejects.toThrow(/does not belong to this rikma/);
  });

  it('archives by flag rather than deleting', async () => {
    const { fetchFn, sent } = fakeStrapi([ownedBy('3'), { data: { updateSpaceDoc: { data: { id: '5' } } } }]);

    const res = await run(archiveSpaceDocConfig, { docId: '5', projectId: '3' }, fetchFn);

    expect(res.data).toEqual({ spaceDocId: '5', archived: true });
    expect(sent[1]).toContain('archived: true');
    expect(sent[1]).not.toContain('deleteSpaceDoc');
  });

  it('restores with the same action', async () => {
    const { fetchFn, sent } = fakeStrapi([ownedBy('3'), { data: { updateSpaceDoc: { data: { id: '5' } } } }]);

    const res = await run(archiveSpaceDocConfig, { docId: '5', projectId: '3', restore: true }, fetchFn);

    expect(res.data).toEqual({ spaceDocId: '5', archived: false });
    expect(sent[1]).toContain('archived: false');
  });

  it('writes only the fields that were sent', async () => {
    const { fetchFn, sent } = fakeStrapi([ownedBy('3'), { data: { updateSpaceDoc: { data: { id: '5' } } } }]);

    await run(updateSpaceDocConfig, { docId: '5', projectId: '3', folder: 'contracts/2026' }, fetchFn);

    expect(sent[1]).toContain('folder: "contracts/2026"');
    expect(sent[1]).not.toContain('name:');
    expect(sent[1]).not.toContain('note:');
  });

  it('does not call Strapi a second time when there is nothing to change', async () => {
    const { fetchFn, sent } = fakeStrapi([ownedBy('3')]);

    const res = await run(updateSpaceDocConfig, { docId: '5', projectId: '3' }, fetchFn);

    expect(res.data).toMatchObject({ unchanged: true });
    expect(sent).toHaveLength(1);
  });
});

describe('the three configs', () => {
  const configs = [createSpaceDocConfig, updateSpaceDocConfig, archiveSpaceDocConfig];

  it('are all members-only, never anonymous or api-key', () => {
    for (const config of configs) {
      expect(config.authRules?.some((r) => r.type === 'projectMember')).toBe(true);
      expect(config.access).toEqual(['user', 'serviceAdmin']);
    }
  });

  it('offer no parameter a secret could be stored in', () => {
    for (const config of configs) {
      const params = Object.keys(config.paramSchema ?? {}).join(' ').toLowerCase();
      expect(params).not.toMatch(/secret|password|token|credential/);
    }
  });
});

describe('createSpaceDoc — private bucket (stage 2)', () => {
  beforeEach(() => {
    for (const k of Object.keys(env)) delete env[k];
    Object.assign(env, {
      R2_ACCOUNT_ID: 'acct',
      R2_ACCESS_KEY_ID: 'AKID',
      R2_SECRET_ACCESS_KEY: 'secret',
      R2_BUCKET: 'rikma-docs'
    });
  });

  const params = {
    projectId: '3',
    name: 'Lease',
    kind: 'file',
    storageKey: 'rikma/3/0b8e/lease.pdf',
    fileName: 'lease.pdf',
    mime: 'application/pdf'
  };

  it('records the key with the size the bucket reports, not the client', async () => {
    const { fetchFn, sent } = fakeStrapi([{ data: { createSpaceDoc: { data: { id: '42' } } } }], {
      status: 200,
      size: 5000
    });

    const res = await run(createSpaceDocConfig, { ...params, size: 1 }, fetchFn);

    expect(res.data.spaceDocId).toBe('42');
    expect(sent[0]).toContain('storageKey: "rikma/3/0b8e/lease.pdf"');
    expect(sent[0]).toContain('size: 5000');
    expect(sent[0]).toContain('mime: "application/pdf"');
    expect(sent[0]).not.toContain('file:');
  });

  it('refuses a key minted for another rikma — before it asks the bucket', async () => {
    const { fetchFn } = fakeStrapi([], { status: 200, size: 1 });
    await expect(
      run(createSpaceDocConfig, { ...params, storageKey: 'rikma/4/0b8e/lease.pdf' }, fetchFn)
    ).rejects.toThrow(/does not belong to this rikma/);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('refuses a record for an upload that never arrived', async () => {
    const { fetchFn, sent } = fakeStrapi([], { status: 404 });
    await expect(run(createSpaceDocConfig, params, fetchFn)).rejects.toThrow(/did not arrive/);
    expect(sent).toHaveLength(0);
  });

  it('refuses a type outside the whitelist', async () => {
    const { fetchFn } = fakeStrapi([], { status: 200, size: 1 });
    await expect(
      run(createSpaceDocConfig, { ...params, mime: 'application/x-msdownload' }, fetchFn)
    ).rejects.toThrow(/Unsupported file type/);
  });

  it('will not take both a Strapi media id and a bucket key', async () => {
    const { fetchFn } = fakeStrapi([]);
    await expect(run(createSpaceDocConfig, { ...params, fileId: '9' }, fetchFn)).rejects.toThrow(/not both/);
  });

  it('refuses when the bucket is not configured on this instance', async () => {
    for (const k of Object.keys(env)) delete env[k];
    const { fetchFn } = fakeStrapi([]);
    await expect(run(createSpaceDocConfig, params, fetchFn)).rejects.toThrow(/not configured/);
  });
});
