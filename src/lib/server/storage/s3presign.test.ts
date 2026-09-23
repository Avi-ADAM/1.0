import { describe, it, expect } from 'vitest';
import { presignUrl, uriEncode } from './s3presign.js';

/**
 * AWS's own worked example for query-string auth ("Example: Presigned URL",
 * sigv4-query-string-auth). If the canonical request drifts by one byte —
 * encoding, ordering, a trailing newline — this signature changes.
 */
const AWS_EXAMPLE = {
  method: 'GET' as const,
  host: 'examplebucket.s3.amazonaws.com',
  path: '/test.txt',
  region: 'us-east-1',
  accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  expires: 86400,
  date: new Date('2013-05-24T00:00:00Z')
};

describe('presignUrl', () => {
  it('reproduces the signature in AWS’s published example', () => {
    const url = new URL(presignUrl(AWS_EXAMPLE));
    expect(url.searchParams.get('X-Amz-Signature')).toBe(
      'aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404'
    );
    expect(url.searchParams.get('X-Amz-Credential')).toBe(
      'AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request'
    );
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe('host');
  });

  it('signs an extra header, so a PUT URL cannot be reused with another content type', () => {
    const plain = new URL(presignUrl({ ...AWS_EXAMPLE, method: 'PUT' }));
    const typed = new URL(
      presignUrl({ ...AWS_EXAMPLE, method: 'PUT', headers: { 'Content-Type': 'application/pdf' } })
    );
    expect(typed.searchParams.get('X-Amz-SignedHeaders')).toBe('content-type;host');
    expect(typed.searchParams.get('X-Amz-Signature')).not.toBe(plain.searchParams.get('X-Amz-Signature'));
  });

  it('folds response overrides into the signature', () => {
    const a = new URL(presignUrl(AWS_EXAMPLE));
    const b = new URL(
      presignUrl({ ...AWS_EXAMPLE, query: { 'response-content-disposition': 'attachment' } })
    );
    expect(b.searchParams.get('response-content-disposition')).toBe('attachment');
    expect(b.searchParams.get('X-Amz-Signature')).not.toBe(a.searchParams.get('X-Amz-Signature'));
  });

  it('encodes the path per segment and keeps the slashes', () => {
    const url = presignUrl({ ...AWS_EXAMPLE, path: '/bucket/rikma/3/חוזה שכירות.pdf' });
    expect(url).toContain('/bucket/rikma/3/%D7%97');
    expect(url).toContain('%20');
    expect(url).not.toContain(' ');
  });
});

describe('uriEncode', () => {
  it('keeps only the unreserved set', () => {
    expect(uriEncode('a-b_c.d~e')).toBe('a-b_c.d~e');
    expect(uriEncode('a b+c/d')).toBe('a%20b%2Bc%2Fd');
    expect(uriEncode('a/b', true)).toBe('a/b');
  });
});
