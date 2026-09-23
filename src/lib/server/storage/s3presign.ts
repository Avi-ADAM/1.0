/**
 * AWS Signature V4 **query-string presigning** — the one piece of S3 this app
 * needs, for Cloudflare R2 (docs/PLAN_RIKMA_SHARED_INFO.md §6 stage 2).
 *
 * Why hand-rolled: the whole feature is "hand a browser a URL that works for a
 * few minutes". The AWS SDK is ~a megabyte of dependency for one HMAC chain,
 * and this is small enough to hold in a head and is pinned to AWS's own
 * published example in the test (`s3presign.test.ts`) — a wrong byte anywhere
 * in the canonical request changes that signature.
 *
 * Pure: no env, no fetch. `r2.ts` supplies the credentials and the clock.
 *
 * Spec: https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-query-string-auth.html
 */

import { createHash, createHmac } from 'node:crypto';

export interface PresignInput {
  method: 'GET' | 'PUT' | 'HEAD';
  /** e.g. `examplebucket.s3.amazonaws.com`, `<acct>.r2.cloudflarestorage.com`, `minio:9000` */
  host: string;
  /** `http` for a self-hosted store on the same private network. Default https. */
  protocol?: 'http' | 'https';
  /** Already-decoded path, leading slash included: `/bucket/rikma/3/a b.pdf`. */
  path: string;
  region: string;
  service?: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Seconds the URL stays valid. S3 caps this at 7 days. */
  expires: number;
  /** Signing time. Injected so the test can pin AWS's example. */
  date: Date;
  /** Extra query params that become part of the signature (response-*, …). */
  query?: Record<string, string>;
  /**
   * Headers the *client* must send verbatim, lower-case names. `host` is
   * always signed and need not be listed. Signing `content-type` on a PUT is
   * what stops a leaked upload URL from being used to store a different type.
   */
  headers?: Record<string, string>;
}

/** RFC 3986 encoding as SigV4 wants it: only `A-Za-z0-9-_.~` survive. */
export function uriEncode(value: string, keepSlash = false): string {
  let out = '';
  for (const byte of Buffer.from(value, 'utf8')) {
    const c = String.fromCharCode(byte);
    if (/[A-Za-z0-9\-_.~]/.test(c) || (keepSlash && c === '/')) out += c;
    else out += '%' + byte.toString(16).toUpperCase().padStart(2, '0');
  }
  return out;
}

const sha256Hex = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const hmac = (key: Buffer | string, s: string) => createHmac('sha256', key).update(s, 'utf8').digest();

/** `20130524T000000Z` */
function amzDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Build a presigned URL. Returns the full `https://…` string.
 */
export function presignUrl(input: PresignInput): string {
  const service = input.service ?? 's3';
  const stamp = amzDate(input.date);
  const day = stamp.slice(0, 8);
  const scope = `${day}/${input.region}/${service}/aws4_request`;

  const headers: Record<string, string> = { host: input.host };
  for (const [k, v] of Object.entries(input.headers ?? {})) headers[k.toLowerCase()] = String(v).trim();
  const headerNames = Object.keys(headers).sort();
  const signedHeaders = headerNames.join(';');

  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${input.accessKeyId}/${scope}`,
    'X-Amz-Date': stamp,
    'X-Amz-Expires': String(Math.floor(input.expires)),
    'X-Amz-SignedHeaders': signedHeaders,
    ...(input.query ?? {})
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${uriEncode(k)}=${uriEncode(query[k])}`)
    .join('&');

  const canonicalUri = uriEncode(input.path, true);
  const canonicalHeaders = headerNames.map((k) => `${k}:${headers[k]}\n`).join('');

  const canonicalRequest = [
    input.method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    'UNSIGNED-PAYLOAD'
  ].join('\n');

  const stringToSign = ['AWS4-HMAC-SHA256', stamp, scope, sha256Hex(canonicalRequest)].join('\n');

  const kDate = hmac(`AWS4${input.secretAccessKey}`, day);
  const kRegion = hmac(kDate, input.region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  return `${input.protocol ?? 'https'}://${input.host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
