import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

type Reg = { tool: any; signal?: AbortSignal };
let registered: Map<string, Reg>;

function installStub() {
  registered = new Map();
  Object.defineProperty(document, 'modelContext', {
    configurable: true,
    value: {
      registerTool: async (tool: any, opts?: { signal?: AbortSignal }) => {
        registered.set(tool.name, { tool, signal: opts?.signal });
        opts?.signal?.addEventListener('abort', () => registered.delete(tool.name));
      }
    }
  });
}

const surface = (names: string[], defaults?: Record<string, string>) => ({
  mode: 'on',
  tools: names.map((name) => ({
    name,
    description: name,
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    ...(defaults ? { defaults } : {})
  }))
});

describe('syncWebMcp', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    installStub();
    fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init?.method || init.method === 'GET') {
        const path = new URL(url, 'http://x').searchParams.get('path');
        return new Response(JSON.stringify(path === '/moach/89' ? surface(['getProjectDetailsTool'], { projectId: '89' }) : surface(['getPlatformInfo'])));
      }
      return new Response(JSON.stringify({ success: true, echo: JSON.parse(String(init.body)) }));
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (document as any).modelContext;
  });

  it('registers the page surface and swaps it on navigation', async () => {
    const { syncWebMcp } = await import('./sync');
    await syncWebMcp('/', false);
    expect([...registered.keys()]).toEqual(['getPlatformInfo']);

    await syncWebMcp('/moach/89', true);
    expect([...registered.keys()]).toEqual(['getProjectDetailsTool']);
  });

  it('runs execute through /api/webmcp with the page defaults', async () => {
    const { syncWebMcp } = await import('./sync');
    await syncWebMcp('/moach/89', true);
    const out: any = await registered.get('getProjectDetailsTool')!.tool.execute({});
    expect(out.echo).toEqual({ tool: 'getProjectDetailsTool', path: '/moach/89', input: { projectId: '89' } });
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!;
    expect(post[0]).toBe('/api/webmcp');
    expect((post[1] as RequestInit).credentials).toBe('same-origin');
  });

  it('does nothing at all without WebMCP', async () => {
    delete (document as any).modelContext;
    const { syncWebMcp } = await import('./sync');
    await syncWebMcp('/', false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registers nothing when the server has it off (404)', async () => {
    fetchMock.mockImplementationOnce(async () => new Response('Not found', { status: 404 }));
    const { syncWebMcp } = await import('./sync');
    await syncWebMcp('/', false);
    expect(registered.size).toBe(0);
  });
});
