/**
 * The storefront catalogue tools as an MCP client meets them: wrapped by the
 * guard with their manifest policy. Non-members are refused before the tool
 * runs; an upload link is readable only by whoever made it; a batch answers
 * each item.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

const sendToSer = vi.fn();
const getMcpContext = vi.fn();
const executeAction = vi.fn();

vi.mock('../../lib/send/sendToSer.js', () => ({ sendToSer: (...a: any[]) => sendToSer(...a) }));
vi.mock('../../lib/server/mcpContext.js', () => ({ getMcpContext: () => getMcpContext() }));
vi.mock('../../lib/server/mcp/audit.js', () => ({ audit: vi.fn() }));
vi.mock('../../lib/server/actions/index.js', () => ({ actionService: { executeAction: (...a: any[]) => executeAction(...a) } }));
vi.mock('../../lib/server/adminToken.js', () => ({ adminToken: () => 'svc' }));
vi.mock('$lib/server/oauth/secret.js', async () => {
  const crypto = await import('crypto');
  return {
    uploadSessionKey: () => Buffer.alloc(32, 3),
    b64url: (b: Buffer | string) => Buffer.from(b).toString('base64url'),
    fromB64url: (s: string) => Buffer.from(s, 'base64url'),
    safeEqual: (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  };
});
vi.mock('../../lib/server/oauth/secret.js', async () => (await import('$lib/server/oauth/secret.js')) as any);

const { MCP_TOOL_MANIFEST } = await import('../../lib/server/mcp/toolManifest');
const { wrapMcpTool, clearMemberCache } = await import('../../lib/server/mcp/guard');
const { resetRateLimits } = await import('../../lib/server/mcp/rateLimit');
const { mintUploadSession } = await import('../../lib/server/media/uploadSession');

const NEW_TOOLS = [
  'proposeProductEditTool',
  'proposeProductEditsBatchTool',
  'createUploadSessionTool',
  'uploadMediaFromUrlTool',
  'setProductImagesTool',
  'upsertProductOptionsTool',
  'upsertProductVariantsTool',
  'listRikmaCategoriesTool',
  'setProductCategoriesTool',
  'createRikmaProductsBatchTool'
];

const wrapped = (name: string) => {
  const entry = MCP_TOOL_MANIFEST[name];
  return wrapMcpTool(entry.tool as any, entry);
};
const run = (tool: any, input: any) => tool.execute(input, {});

let members: string[];
function strapi(extra: (qid: string, vars: any) => any = () => undefined) {
  sendToSer.mockImplementation(async (vars: any, qid: string) => {
    if (qid === 'getProjectPeopleAndRoles') {
      return { data: { project: { data: { id: vars.pid, attributes: { user_1s: { data: members.map((id) => ({ id })) } } } } } };
    }
    const out = extra(qid, vars);
    if (out !== undefined) return out;
    throw new Error(`unexpected qid ${qid}`);
  });
}

beforeEach(() => {
  clearMemberCache();
  resetRateLimits();
  sendToSer.mockReset();
  executeAction.mockReset();
  members = ['42'];
  getMcpContext.mockReturnValue({ userId: '42', keyId: 'k1', fetchInstance: vi.fn() });
});

describe('manifest', () => {
  it('every new rikma tool is members-only, and documented at /mcp#name', async () => {
    const { mcpDescription } = await import('../../lib/server/mcp/toolManifest');
    for (const name of NEW_TOOLS) {
      expect(MCP_TOOL_MANIFEST[name]?.project, name).toBe('member');
      expect(mcpDescription(name, MCP_TOOL_MANIFEST[name])).toContain(`https://1lev1.com/mcp#${name}`);
    }
    expect(MCP_TOOL_MANIFEST.getUploadSessionTool.tier).toBe('read');
  });
});

describe('a non-member is refused before the tool runs', () => {
  const inputs: Record<string, any> = {
    proposeProductEditTool: { projectId: '89', productId: '5', name: 'x' },
    proposeProductEditsBatchTool: { projectId: '89', items: [{ productId: '5', name: 'x' }] },
    createUploadSessionTool: { projectId: '89' },
    uploadMediaFromUrlTool: { projectId: '89', url: 'https://cdn.example.com/a.jpg' },
    setProductImagesTool: { projectId: '89', productId: '5', coverId: '1' },
    upsertProductOptionsTool: { projectId: '89', options: [{ name: 'Size', values: ['M'] }] },
    upsertProductVariantsTool: { projectId: '89', productId: '5', variants: [{ variantId: '1', quant: 2 }] },
    listRikmaCategoriesTool: { projectId: '89' },
    setProductCategoriesTool: { projectId: '89', productId: '5', categoryIds: [] },
    createRikmaProductsBatchTool: { projectId: '89', items: [{ name: 'x', price: 1 }] }
  };
  for (const name of NEW_TOOLS) {
    it(name, async () => {
      members = ['7'];
      strapi();
      const res = await run(wrapped(name), inputs[name]);
      expect(res).toMatchObject({ success: false, denied: true });
      expect(executeAction).not.toHaveBeenCalled();
    });
  }
});

describe('upload sessions', () => {
  it('a member gets a link on 1lev1.com', async () => {
    strapi();
    const res = await run(wrapped('createUploadSessionTool'), { projectId: '89', maxFiles: 3 });
    expect(res).toMatchObject({ success: true, maxFiles: 3 });
    expect(res.url).toMatch(/^https:\/\/www\.1lev1\.com\/upload\//);
  });

  it('only the user who made the link can read it', async () => {
    const { token } = mintUploadSession({ userId: '99', projectId: '89' });
    strapi();
    const res = await run(wrapped('getUploadSessionTool'), { token });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/another user/);
  });

  it('an expired link still lists what arrived, and says it expired', async () => {
    const { token } = mintUploadSession({ userId: '42', projectId: '89', now: Date.now() - 2 * 3600_000 });
    strapi((qid) =>
      qid === 'mediaUploadsByCaption'
        ? { data: { uploadFiles: { data: [{ id: '5', attributes: { url: 'https://cdn/a.jpg', name: 'a.jpg', width: 800, height: 600 } }] } } }
        : undefined
    );
    const res = await run(wrapped('getUploadSessionTool'), { token });
    expect(res).toMatchObject({ success: true, expired: true });
    expect(res.files).toEqual([expect.objectContaining({ uploadId: '5', width: 800, height: 600 })]);
  });

  it('a tampered token is refused', async () => {
    strapi();
    const res = await run(wrapped('getUploadSessionTool'), { token: 'abcdefghij.abcdefghijklmnopqrstuv' });
    expect(res.success).toBe(false);
  });
});

describe('uploadMediaFromUrl', () => {
  it('refuses an internal address without fetching it', async () => {
    strapi();
    const res = await run(wrapped('uploadMediaFromUrlTool'), { projectId: '89', url: 'http://169.254.169.254/latest/meta-data' });
    expect(res).toMatchObject({ success: false, code: 'url' });
  });
  it('refuses base64 that is not a picture', async () => {
    strapi();
    const res = await run(wrapped('uploadMediaFromUrlTool'), { projectId: '89', base64: Buffer.from('<html></html>').toString('base64') });
    expect(res).toMatchObject({ success: false, code: 'type' });
  });
});

describe('createRikmaProductsBatch', () => {
  it('a failing item does not stop the others', async () => {
    strapi();
    let n = 0;
    executeAction.mockImplementation(async (key: string, params: any) => {
      if (key !== 'createPersonalMatanot') throw new Error('unexpected');
      n++;
      return params.name === 'bad'
        ? { success: false, error: { code: 'VALIDATION_FAILED', message: 'The name did not pass' } }
        : { success: true, data: { matanotId: String(100 + n), projectId: '89', origin: 'project' } };
    });
    const res = await run(wrapped('createRikmaProductsBatchTool'), {
      projectId: '89',
      items: [
        { name: 'Mug', price: 40 },
        { name: 'bad', price: 1 },
        { name: 'Tee', price: 80 }
      ]
    });
    expect(res).toMatchObject({ success: false, succeeded: 2, failed: 1 });
    expect(res.results.map((r: any) => [r.index, r.success, r.productId ?? null])).toEqual([
      [0, true, '101'],
      [1, false, null],
      [2, true, '103']
    ]);
    expect(res.results[1].message).toMatch(/did not pass/);
  });
});
