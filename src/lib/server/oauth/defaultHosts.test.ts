import { describe, it, expect, vi } from 'vitest';

// No MCP_OAUTH_REDIRECT_HOSTS here on purpose: this file covers the built-in
// list a deployment gets when it configures nothing, which is what decides
// whether ChatGPT can register at all. oauth.test.ts overrides the list, so it
// cannot see this.
vi.mock('$env/dynamic/private', () => ({ env: {} }));

const { isAllowedRedirectUri } = await import('./redirects.js');

describe('default redirect allowlist', () => {
  it('accepts the Claude surfaces', () => {
    expect(isAllowedRedirectUri('https://claude.ai/api/mcp/auth_callback')).toBe(true);
    expect(isAllowedRedirectUri('https://claude.com/api/mcp/auth_callback')).toBe(true);
  });

  it("accepts ChatGPT's connector callback", () => {
    expect(isAllowedRedirectUri('https://chatgpt.com/connector_platform_oauth_redirect')).toBe(true);
    expect(isAllowedRedirectUri('https://platform.openai.com/cb')).toBe(true);
  });

  it('still refuses lookalikes and deeper subdomains', () => {
    expect(isAllowedRedirectUri('https://chatgpt.com.evil.com/cb')).toBe(false);
    expect(isAllowedRedirectUri('https://a.b.chatgpt.com/cb')).toBe(false);
    expect(isAllowedRedirectUri('http://chatgpt.com/cb')).toBe(false);
  });

  it('does not silently allow a host nobody configured', () => {
    // Gemini Enterprise and friends must be added through the env var; the
    // default list is not a blanket "any big AI vendor" rule.
    expect(isAllowedRedirectUri('https://vertexaisearch.cloud.google.com/cb')).toBe(false);
  });
});
