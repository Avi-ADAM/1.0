/**
 * Unit tests for consensus author stamping.
 */

import { describe, it, expect } from 'vitest';
import { qids } from './qids.js';
import { stampAuthor } from './authorIdentity.js';

function stamp(queId: string, opts: Record<string, any>) {
  const variablesObject = { ...(opts.vars ?? {}) };
  stampAuthor({
    queId,
    query: (qids as Record<string, string>)[queId],
    variablesObject,
    isSer: opts.isSer ?? false,
    identity: opts.identity ?? null,
    callerId: opts.callerId,
    username: opts.username
  });
  return variablesObject;
}

describe('stampAuthor — JWT path', () => {
  it('stamps the verified caller on a position, ignoring client author fields', () => {
    const v = stamp('41CreatePosition', {
      callerId: '12',
      username: 'dana',
      vars: {
        heading: 'h',
        author: '99',
        authorExternalId: '99',
        authorType: 'charter',
        authorEmail: 'mallory@example.com'
      }
    });
    expect(v).toEqual({
      heading: 'h',
      author: '12',
      authorExternalId: '12',
      authorType: 'registered'
    });
  });

  it('stamps authorName only where the qid declares it', () => {
    expect(stamp('CreateArgument', { callerId: '12', username: 'dana' })).toEqual({
      authorExternalId: '12',
      authorType: 'registered',
      authorName: 'dana'
    });
    expect(stamp('CreateClause', { callerId: 12, username: 'dana' })).toEqual({
      authorExternalId: '12',
      authorType: 'registered'
    });
  });

  it('leaves no author at all without a verified caller', () => {
    expect(stamp('CreateClause', { vars: { body: 'b', authorExternalId: '99' } })).toEqual({
      body: 'b'
    });
  });

  it('does not touch other qids', () => {
    expect(stamp('UpdateClause', { callerId: '12', vars: { id: '1', authorExternalId: 'x' } })).toEqual({
      id: '1',
      authorExternalId: 'x'
    });
  });
});

describe('stampAuthor — service path', () => {
  it('takes the author from __identity, not the client', () => {
    const v = stamp('CreateArgument', {
      isSer: true,
      callerId: '12',
      identity: { externalId: 'fp-1', type: 'charter', name: 'Guest A', email: 'a@example.com' },
      vars: { body: 'b', authorExternalId: '99', authorType: 'registered' }
    });
    expect(v).toEqual({
      body: 'b',
      authorExternalId: 'fp-1',
      authorType: 'charter',
      authorName: 'Guest A',
      authorEmail: 'a@example.com'
    });
  });

  it('drops a client-sent author the identity does not cover', () => {
    const v = stamp('41CreatePosition', {
      isSer: true,
      identity: { externalId: 'fp-1', type: 'charter' },
      vars: { author: '12', authorEmail: 'mallory@example.com' }
    });
    expect(v).toEqual({ authorExternalId: 'fp-1', authorType: 'charter' });
  });
});
