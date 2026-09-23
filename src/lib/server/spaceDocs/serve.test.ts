import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: {} }));

import { decideServe } from './serve.js';

const row = (attributes: Record<string, unknown>, members = ['7'], projectId = '3') => ({
  id: '5',
  attributes: {
    kind: 'file',
    archived: false,
    project: { data: { id: projectId, attributes: { user_1s: { data: members.map((id) => ({ id })) } } } },
    ...attributes
  }
});

const privateRow = (extra: Record<string, unknown> = {}) =>
  row({ storageKey: 'rikma/3/uuid/lease.pdf', fileName: 'lease.pdf', mime: 'application/pdf', ...extra });

describe('decideServe', () => {
  it('signs a private object for a member', () => {
    expect(decideServe(privateRow(), '7', true)).toEqual({
      kind: 'signed',
      key: 'rikma/3/uuid/lease.pdf',
      fileName: 'lease.pdf',
      mime: 'application/pdf'
    });
  });

  it('asks a signed-out caller to sign in', () => {
    expect(decideServe(privateRow(), null, true)).toMatchObject({ kind: 'deny', status: 401 });
  });

  it('answers a non-member exactly as it answers a missing row', () => {
    const outsider = decideServe(privateRow(), '99', true);
    const missing = decideServe(null, '99', true);
    expect(outsider).toEqual(missing);
    expect(outsider).toMatchObject({ kind: 'deny', status: 404 });
  });

  it('hides an archived entry', () => {
    expect(decideServe(privateRow({ archived: true }), '7', true)).toMatchObject({ status: 404 });
  });

  it('refuses a key minted for another rikma, even to a member', () => {
    const moved = privateRow({ storageKey: 'rikma/4/uuid/lease.pdf' });
    expect(decideServe(moved, '7', true)).toMatchObject({ kind: 'deny', status: 403 });
  });

  it('refuses a traversal key', () => {
    const sneaky = privateRow({ storageKey: 'rikma/3/../4/uuid/lease.pdf' });
    expect(decideServe(sneaky, '7', true)).toMatchObject({ kind: 'deny', status: 403 });
  });

  it('says so when the bucket is not configured on this instance', () => {
    expect(decideServe(privateRow(), '7', false)).toMatchObject({ kind: 'deny', status: 503 });
  });

  it('redirects a stage-1 media row to its existing url', () => {
    const legacy = row({ file: { data: { attributes: { url: 'https://res.cloudinary.com/x/a.pdf' } } } });
    expect(decideServe(legacy, '7', false)).toEqual({
      kind: 'redirect',
      url: 'https://res.cloudinary.com/x/a.pdf'
    });
  });

  it('never redirects to a non-http url', () => {
    const hostile = row({ kind: 'link', url: 'javascript:alert(1)' });
    expect(decideServe(hostile, '7', true)).toMatchObject({ kind: 'deny', status: 404 });
  });
});
