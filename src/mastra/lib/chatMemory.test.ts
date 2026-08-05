import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * `chatMemoryEnabled` is decided from env at module load, so every case here
 * re-imports the module with the env it wants.
 */
async function loadWith(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import('./chatMemory');
}

const ORIGINAL = { ...process.env };

describe('buildChatMemoryScope', () => {
  beforeEach(() => {
    delete process.env.MASTRA_DB_URL;
    delete process.env.MASTRA_MEMORY;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it('is disabled on the default in-memory store, so nothing pretends to persist', async () => {
    const { buildChatMemoryScope, chatMemoryEnabled, getChatMemory } = await loadWith({
      MASTRA_DB_URL: undefined
    });
    expect(chatMemoryEnabled).toBe(false);
    expect(getChatMemory()).toBeUndefined();
    expect(buildChatMemoryScope('42', 'abcdefgh')).toBeUndefined();
  });

  it('is disabled by the MASTRA_MEMORY=off kill switch even with a real store', async () => {
    const { buildChatMemoryScope, chatMemoryEnabled } = await loadWith({
      MASTRA_DB_URL: 'file:./.mastra/test.db',
      MASTRA_MEMORY: 'off'
    });
    expect(chatMemoryEnabled).toBe(false);
    expect(buildChatMemoryScope('42', 'abcdefgh')).toBeUndefined();
  });

  it('scopes the thread to the user and the resource to the user id', async () => {
    const { buildChatMemoryScope } = await loadWith({
      MASTRA_DB_URL: 'file:./.mastra/test.db'
    });
    const scope = buildChatMemoryScope('42', 'a1b2c3d4e5');
    expect(scope).toEqual({
      thread: { id: 'u42-a1b2c3d4e5', metadata: undefined },
      resource: 'user-42'
    });
  });

  it('never lets a forged client id address another user thread', async () => {
    const { buildChatMemoryScope } = await loadWith({
      MASTRA_DB_URL: 'file:./.mastra/test.db'
    });
    // Shapes that try to escape the namespace are rejected by the pattern and
    // fall back to the user's own default thread.
    for (const forged of ['u99-abcdefgh', '../u99-abcdefgh', 'a'.repeat(65), 'short']) {
      const scope = buildChatMemoryScope('42', forged);
      expect(scope?.thread.id.startsWith('u42-')).toBe(true);
      expect(scope?.resource).toBe('user-42');
    }
    expect(buildChatMemoryScope('42', '../u99-abcdefgh')?.thread.id).toBe('u42-default');
  });

  it('gives anonymous visitors no memory at all', async () => {
    const { buildChatMemoryScope } = await loadWith({
      MASTRA_DB_URL: 'file:./.mastra/test.db'
    });
    expect(buildChatMemoryScope(undefined, 'a1b2c3d4e5')).toBeUndefined();
    expect(buildChatMemoryScope('anonymous', 'a1b2c3d4e5')).toBeUndefined();
  });

  it('falls back to a default thread when the client sends nothing', async () => {
    const { buildChatMemoryScope } = await loadWith({
      MASTRA_DB_URL: 'file:./.mastra/test.db'
    });
    expect(buildChatMemoryScope('42')?.thread.id).toBe('u42-default');
  });

  it('carries request metadata onto the thread', async () => {
    const { buildChatMemoryScope } = await loadWith({
      MASTRA_DB_URL: 'file:./.mastra/test.db'
    });
    const scope = buildChatMemoryScope('42', 'a1b2c3d4e5', { projectId: '7', language: 'he' });
    expect(scope?.thread.metadata).toEqual({ projectId: '7', language: 'he' });
  });

  it('reuses one Memory instance so every agent shares the thread', async () => {
    const { getChatMemory } = await loadWith({ MASTRA_DB_URL: 'file:./.mastra/test.db' });
    expect(getChatMemory()).toBe(getChatMemory());
  });
});

describe('workingMemoryInstructions', () => {
  it('tells the agent not to take orders from project content', async () => {
    const { workingMemoryInstructions } = await loadWith({});
    expect(workingMemoryInstructions('he')).toContain('updateWorkingMemory');
    expect(workingMemoryInstructions('en')).toContain('untrusted input');
  });
});
