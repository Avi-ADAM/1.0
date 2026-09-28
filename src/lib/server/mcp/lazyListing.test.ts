/**
 * The pre-sign-in listing under lazy auth: it must look exactly like what a
 * signed-in, no-scope key sees, and it must never run a real tool.
 */
import { describe, expect, it, vi } from 'vitest';
import { MCP_TOOL_MANIFEST, entryEnabled, mcpAnnotations, mcpDescription, tierAllowed } from './toolManifest';
import { signInListing, signInToolNames, SIGN_IN_REQUIRED } from './lazyListing';
import { mcpInstructions, LAZY_SIGN_IN_INSTRUCTIONS, PUBLIC_SIGNUP_INSTRUCTIONS, RIKMA_IMPORT_INSTRUCTIONS } from './instructions';

describe('lazy-auth listing', () => {
  const listing = signInListing();

  it('lists exactly the tools a no-scope (OAuth) key is shown', () => {
    const expected = Object.entries(MCP_TOOL_MANIFEST)
      .filter(([, e]) => entryEnabled(e) && tierAllowed(e.tier, []))
      .map(([n]) => n);
    expect(signInToolNames()).toEqual(expected);
    expect(Object.keys(listing)).toEqual(expected);
    expect(expected.length).toBeGreaterThan(0);
  });

  it('never lists a tool that needs the write scope', () => {
    for (const name of Object.keys(listing)) {
      expect(MCP_TOOL_MANIFEST[name].tier, name).not.toBe('sharedWrite');
    }
  });

  it('keeps the signed-in face: description, schema and annotations', () => {
    for (const [name, stub] of Object.entries<any>(listing)) {
      const entry = MCP_TOOL_MANIFEST[name];
      expect(stub.description, name).toBe(mcpDescription(name, entry));
      expect(stub.inputSchema, name).toBe((entry.tool as any).inputSchema);
      expect(stub.mcp?.annotations, name).toEqual(mcpAnnotations(entry));
    }
  });

  it('never reaches the real tool if a call slips past the gate', async () => {
    // Mastra validates input before execute, so a tool with required fields
    // stops at validation here; one with none reaches the stub body.
    let reachedStub = 0;
    for (const [name, stub] of Object.entries<any>(listing)) {
      const real = vi.spyOn(MCP_TOOL_MANIFEST[name].tool as any, 'execute');
      const result = await stub.execute({}, {});
      if (!result?.error) {
        expect(result, name).toEqual(SIGN_IN_REQUIRED);
        reachedStub++;
      }
      expect(real, name).not.toHaveBeenCalled();
      real.mockRestore();
    }
    expect(reachedStub).toBeGreaterThan(0);
  });
});

describe('lazy-auth instructions', () => {
  it('explain signing in, and carry the signup part only when prepareSignup is exposed', () => {
    const withSignup = mcpInstructions({ rikmaImport: true, publicSignup: true, lazySignIn: true });
    expect(withSignup).toContain(LAZY_SIGN_IN_INSTRUCTIONS);
    expect(withSignup).toContain(PUBLIC_SIGNUP_INSTRUCTIONS);
    expect(withSignup).toContain(RIKMA_IMPORT_INSTRUCTIONS);

    const without = mcpInstructions({ rikmaImport: false, publicSignup: false, lazySignIn: true });
    expect(without).toContain(LAZY_SIGN_IN_INSTRUCTIONS);
    expect(without).not.toContain(PUBLIC_SIGNUP_INSTRUCTIONS);
    expect(without).not.toContain(RIKMA_IMPORT_INSTRUCTIONS);
  });

  it('leave the existing modes untouched', () => {
    expect(mcpInstructions({ rikmaImport: false, publicSignup: true })).not.toContain(LAZY_SIGN_IN_INSTRUCTIONS);
    expect(mcpInstructions({ rikmaImport: true })).not.toContain(LAZY_SIGN_IN_INSTRUCTIONS);
  });

  it('never steer toward 1lev1 unprompted or source identity from memory', () => {
    expect(PUBLIC_SIGNUP_INSTRUCTIONS).toMatch(/never in an unrelated conversation/);
    expect(PUBLIC_SIGNUP_INSTRUCTIONS).toMatch(/ask for the name and email/);
  });
});
