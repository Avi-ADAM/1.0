/**
 * MCP Apps (SEP-1865): the timer view is offered, linked from its tools, and
 * reaches the client the way a host reads it — over the real protocol, through
 * an SDK client on an in-memory transport.
 */
import { describe, expect, it } from 'vitest';
import { MCPServer } from '@mastra/mcp';
import { createTool } from '@mastra/core/tools';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { z } from 'zod';

import { MCP_APP_URIS, TIMER_APP_URI, mcpAppResources, mcpUiMeta } from './index';
import { TIMER_APP_STRINGS, timerAppHtml } from './timerApp';
import { MCP_TOOL_MANIFEST } from '../toolManifest';
import { wrapMcpTool } from '../guard';
import { openSegmentStart } from '../../../../mastra/tools/missionTimers';

const MCP_APP_MIME = 'text/html;profile=mcp-app';

describe('timer view HTML', () => {
  it('has the same keys in every locale, none empty', () => {
    const keys = Object.keys(TIMER_APP_STRINGS.en).sort();
    for (const [lang, s] of Object.entries(TIMER_APP_STRINGS)) {
      expect(Object.keys(s).sort(), lang).toEqual(keys);
      for (const [k, v] of Object.entries(s)) expect(v.trim(), `${lang}.${k}`).not.toBe('');
      expect(s.stopped, `${lang}.stopped`).toContain('{{minutes}}');
    }
  });

  it('is right-to-left for Hebrew and Arabic only', () => {
    expect(timerAppHtml('he')).toContain('<html lang="he" dir="rtl">');
    expect(timerAppHtml('ar')).toContain('<html lang="ar" dir="rtl">');
    expect(timerAppHtml('ru')).toContain('<html lang="ru" dir="ltr">');
    expect(timerAppHtml('xx')).toContain('<html lang="en" dir="ltr">');
    expect(timerAppHtml(undefined)).toContain('<html lang="en" dir="ltr">');
  });

  it('carries only the requested locale', () => {
    const he = timerAppHtml('he');
    expect(he).toContain(TIMER_APP_STRINGS.he.stop);
    expect(he).not.toContain(TIMER_APP_STRINGS.en.none);
  });

  it('loads nothing from outside the iframe', () => {
    const html = timerAppHtml('en');
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+href=/i);
    expect(html).not.toMatch(/@import/i);
    expect(html).not.toMatch(/\bfetch\(|XMLHttpRequest|WebSocket/);
  });

  it('never parses member text as HTML', () => {
    expect(timerAppHtml('en')).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  });

  it('calls only the tools that are linked to it', () => {
    const called = [...timerAppHtml('en').matchAll(/callTool\("([A-Za-z]+)"/g)].map((m) => m[1]);
    expect(called.length).toBeGreaterThan(0);
    for (const name of called) expect(MCP_TOOL_MANIFEST[name]?.ui, name).toBe(TIMER_APP_URI);
  });
});

describe('manifest ↔ views', () => {
  it('every ui link names a registered view', () => {
    for (const [name, entry] of Object.entries(MCP_TOOL_MANIFEST)) {
      if (entry.ui) expect(MCP_APP_URIS, name).toContain(entry.ui);
    }
  });

  it('the timer tools show the timer view', () => {
    expect(MCP_TOOL_MANIFEST.getActiveTimersTool.ui).toBe(TIMER_APP_URI);
    expect(MCP_TOOL_MANIFEST.timerActionTool.ui).toBe(TIMER_APP_URI);
  });

  it('every registered view is linked from some tool', () => {
    const linked = new Set(Object.values(MCP_TOOL_MANIFEST).map((e) => e.ui).filter(Boolean));
    for (const uri of MCP_APP_URIS) expect(linked.has(uri), uri).toBe(true);
    expect(Object.keys(mcpAppResources('en')).sort()).toEqual([...MCP_APP_URIS].sort());
  });
});

describe('over the MCP protocol', () => {
  async function connect() {
    const inner = createTool({
      id: 'getActiveTimers',
      description: 'running timers',
      inputSchema: z.object({}),
      execute: async () => ({ timers: [], totalActive: 0, success: true })
    });
    const wrapped = wrapMcpTool(inner, { tier: 'read' }, {
      annotations: { title: 'Get running timers', readOnlyHint: true },
      meta: mcpUiMeta(TIMER_APP_URI)
    });
    const server = new MCPServer({
      id: 'apps-test',
      name: 'apps-test',
      version: '0.0.0',
      tools: { getActiveTimersTool: wrapped },
      appResources: mcpAppResources('he')
    });
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.getServer().connect(serverSide);
    const client = new Client({ name: 'host', version: '0.0.0' });
    await client.connect(clientSide);
    return client;
  }

  it('advertises the MCP Apps extension', async () => {
    const client = await connect();
    const caps: any = client.getServerCapabilities();
    expect(caps?.extensions?.['io.modelcontextprotocol/ui']).toBeDefined();
  });

  it('links the tool to its view and keeps its annotations', async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    const t: any = tools.find((x) => x.name === 'getActiveTimersTool');
    expect(t._meta?.ui?.resourceUri).toBe(TIMER_APP_URI);
    expect(t.annotations?.title).toBe('Get running timers');
  });

  it('serves the view as an MCP App in the caller language', async () => {
    const client = await connect();
    const { resources } = await client.listResources();
    expect(resources.map((r) => r.uri)).toContain(TIMER_APP_URI);
    const read: any = await client.readResource({ uri: TIMER_APP_URI });
    expect(read.contents[0].mimeType).toBe(MCP_APP_MIME);
    expect(read.contents[0].text).toContain('dir="rtl"');
  });

  it('still answers the model in plain text', async () => {
    const client = await connect();
    const res: any = await client.callTool({ name: 'getActiveTimersTool', arguments: {} });
    expect(JSON.parse(res.content[0].text)).toMatchObject({ success: true, timers: [] });
  });
});

describe('openSegmentStart', () => {
  it('is the start of the last segment without a stop', () => {
    expect(
      openSegmentStart([
        { start: '2026-11-19T08:00:00Z', stop: '2026-11-19T09:00:00Z' },
        { start: '2026-11-19T10:00:00Z', stop: null }
      ])
    ).toBe('2026-11-19T10:00:00Z');
  });
  it('is undefined when nothing is running or there is no list', () => {
    expect(openSegmentStart([{ start: 'a', stop: 'b' }])).toBeUndefined();
    expect(openSegmentStart(null)).toBeUndefined();
  });
});
