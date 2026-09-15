/**
 * The GitHub App's own JWT — what the server presents to GitHub to mint a
 * short-lived installation token. RS256 over the App's private key, `iat`
 * backdated a minute for clock drift, `exp` under GitHub's ten-minute ceiling.
 */

import { createSign } from 'node:crypto';

const b64url = (v: string | Buffer) => Buffer.from(v).toString('base64url');

/**
 * A PEM pasted into a single-line env var arrives with literal `\n`s — and a
 * docker `env_file` keeps surrounding quotes as part of the value.
 */
export function normalizePrivateKey(pem: string): string {
  let key = pem.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  // Trim after unescaping too: a flattened PEM ends in a literal `\n`.
  return (key.includes('\\n') ? key.replace(/\\n/g, '\n') : key).trim();
}

export function createAppJwt(
  appId: string,
  privateKeyPem: string,
  nowSec = Math.floor(Date.now() / 1000)
): string {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ iat: nowSec - 60, exp: nowSec + 540, iss: String(appId) }));
  const input = `${header}.${payload}`;
  const signature = createSign('RSA-SHA256')
    .update(input)
    .sign(normalizePrivateKey(privateKeyPem))
    .toString('base64url');
  return `${input}.${signature}`;
}
