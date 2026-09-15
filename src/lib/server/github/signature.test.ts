import { describe, it, expect } from 'vitest';
import { signGithubBody, verifyGithubSignature } from './signature';

describe('verifyGithubSignature', () => {
  // Straight apostrophe — the exact string in GitHub's webhook docs.
  const secret = "It's a Secret to Everybody";
  const body = 'Hello, World!';

  it('matches the example from GitHub’s documentation', () => {
    expect(signGithubBody(body, secret)).toBe(
      'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17'
    );
    expect(
      verifyGithubSignature(
        body,
        'sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17',
        secret
      )
    ).toBe(true);
  });

  it('rejects a tampered body, a wrong secret and a missing header', () => {
    const sig = signGithubBody(body, secret);
    expect(verifyGithubSignature(body + ' ', sig, secret)).toBe(false);
    expect(verifyGithubSignature(body, sig, 'other')).toBe(false);
    expect(verifyGithubSignature(body, null, secret)).toBe(false);
    expect(verifyGithubSignature(body, 'sha256=short', secret)).toBe(false);
  });

  it('never verifies when the deployment has no secret', () => {
    expect(verifyGithubSignature(body, signGithubBody(body, ''), '')).toBe(false);
    expect(verifyGithubSignature(body, 'sha256=x', undefined)).toBe(false);
  });
});
