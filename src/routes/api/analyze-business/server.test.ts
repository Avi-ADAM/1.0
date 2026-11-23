import { describe, expect, it, vi, beforeEach } from 'vitest';

// The model: the first call extracts the fields, the second drafts the plan.
const generate = vi.fn();
vi.mock('@mastra/core/agent', () => ({
  Agent: class {
    generate = (...a: unknown[]) => generate(...a);
  }
}));
vi.mock('../../../mastra/lib/createModel', () => ({ createModelChain: () => [] }));
const generateSeedPlan = vi.fn(async () => ({ boards: [] }));
vi.mock('$lib/server/planning/seedPlan.js', () => ({
  generateSeedPlan: (...a: unknown[]) => generateSeedPlan(...(a as [])),
  countSeedItems: () => 0
}));
const fetchSiteSummary = vi.fn();
vi.mock('$lib/server/planning/siteContext.js', () => ({ fetchSiteSummary: (...a: unknown[]) => fetchSiteSummary(...a) }));
const readDocuments = vi.fn();
vi.mock('$lib/server/planning/readDocuments', () => ({
  readDocuments: (...a: unknown[]) => readDocuments(...a),
  realReadDeps: {}
}));
vi.mock('$env/dynamic/private', () => ({ env: {} }));

const { POST } = await import('./+server');

let ip = 0;
function event(body: FormData | object, { loggedIn = false } = {}) {
  ip += 1;
  const isForm = body instanceof FormData;
  return {
    request: new Request('http://localhost/api/analyze-business', {
      method: 'POST',
      ...(isForm ? { body } : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    }),
    cookies: { get: () => 'he' },
    locals: { tok: loggedIn ? 'jwt' : undefined, uid: loggedIn ? '7' : undefined },
    getClientAddress: () => `10.1.0.${ip}`
  } as any;
}

function catalogForm(extra: Record<string, string> = {}) {
  const form = new FormData();
  form.append('files', new File([new Uint8Array([37, 80, 68, 70])], 'catalog.pdf', { type: 'application/pdf' }));
  form.append('files', new File([new Uint8Array([1, 2])], 'work.jpg', { type: 'image/jpeg' }));
  for (const [k, v] of Object.entries(extra)) form.append(k, v);
  return form;
}

describe('POST /api/analyze-business — uploaded documents', () => {
  beforeEach(() => {
    generate.mockReset();
    generate.mockResolvedValue({ text: JSON.stringify({ name: 'צילום דנה', desc: 'צלמת אירועים', details: '<p>x</p>', vals: [] }) });
    readDocuments.mockReset();
    fetchSiteSummary.mockReset();
  });

  it('a guest drafts from a catalog and photos; the files reach the reader, the text reaches the model', async () => {
    readDocuments.mockResolvedValue({ text: 'צילום חתונה 6,000 ₪\nצילום בר מצווה 3,500 ₪', read: 2, problems: [], modelCalls: 1 });
    const res = await POST(event(catalogForm({ text: 'רק בצפון', lang: 'he' })));
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, name: 'צילום דנה', documents: { read: 2, problems: [] } });
    const [docs, lang] = readDocuments.mock.calls[0];
    expect(docs.map((d: any) => [d.name, d.mimeType])).toEqual([
      ['catalog.pdf', 'application/pdf'],
      ['work.jpg', 'image/jpeg']
    ]);
    expect(lang).toBe('he');
    const prompt = generate.mock.calls[0][0][0].content as string;
    expect(prompt).toContain("business's own material");
    expect(prompt).toContain('צילום חתונה 6,000 ₪');
    expect(prompt).toContain('רק בצפון');
  });

  it('an unreadable site beside the documents does not cost them', async () => {
    readDocuments.mockResolvedValue({ text: 'מחירון: צילום חתונה 6,000 ₪, צילום בר מצווה 3,500 ₪, מגנטים 15 ₪', read: 1, problems: [], modelCalls: 0 });
    fetchSiteSummary.mockResolvedValue({ ok: false, error: 'timeout' });
    const res = await POST(event(catalogForm({ url: 'https://dana.example' })));
    expect(res.status).toBe(200);
  });

  it('documents with nothing readable come back as 422 with the per-file account', async () => {
    readDocuments.mockResolvedValue({ text: '', read: 0, problems: [{ name: 'work.jpg', reason: 'unreadable' }], modelCalls: 1 });
    const res = await POST(event(catalogForm()));
    expect(res.status).toBe(422);
    await expect(res.json()).resolves.toMatchObject({ reason: 'unreadable-documents', documents: { problems: [{ name: 'work.jpg' }] } });
    expect(generate).not.toHaveBeenCalled();
  });

  it('the JSON path is unchanged', async () => {
    const res = await POST(event({ text: 'צלמת אירועים בצפון, חתונות ובר מצוות, חבילה מ-4,500 שקל כולל אלבום' }));
    expect(res.status).toBe(200);
    expect(readDocuments).not.toHaveBeenCalled();
  });
});
