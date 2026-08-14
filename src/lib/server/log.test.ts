import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createLogger, requestId } from './log.js';

/** Capture one JSON line written by the logger. */
function captured(spy: ReturnType<typeof vi.spyOn>) {
  expect(spy).toHaveBeenCalledTimes(1);
  return JSON.parse(String(spy.mock.calls[0][0]));
}

describe('log', () => {
  let out: ReturnType<typeof vi.spyOn>;
  let err: ReturnType<typeof vi.spyOn>;
  const envBackup = { ...process.env };

  beforeEach(() => {
    process.env.LOG_FORMAT = 'json';
    process.env.LOG_LEVEL = 'debug';
    out = vi.spyOn(console, 'log').mockImplementation(() => {});
    err = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...envBackup };
  });

  it('writes one JSON line with level, time and msg', () => {
    createLogger().info('hello', { a: 1 });
    const line = captured(out);
    expect(line.level).toBe('info');
    expect(line.msg).toBe('hello');
    expect(line.a).toBe(1);
    expect(() => new Date(line.time).toISOString()).not.toThrow();
  });

  it('sends error and fatal to stderr, everything else to stdout', () => {
    const log = createLogger();
    log.info('a');
    log.error('b');
    log.fatal('c');
    expect(out).toHaveBeenCalledTimes(1);
    expect(err).toHaveBeenCalledTimes(2);
  });

  it('drops lines below LOG_LEVEL', () => {
    process.env.LOG_LEVEL = 'warn';
    const log = createLogger();
    log.info('quiet');
    log.debug('quiet');
    expect(out).not.toHaveBeenCalled();
    log.warn('loud');
    expect(err).not.toHaveBeenCalled(); // warn is stdout
    expect(out).toHaveBeenCalledTimes(1);
  });

  it('child() merges bindings into every line', () => {
    createLogger({ svc: 'api' }).child({ reqId: 'r-1' }).info('x');
    const line = captured(out);
    expect(line.svc).toBe('api');
    expect(line.reqId).toBe('r-1');
  });

  it('redacts secret-looking fields at any depth', () => {
    createLogger().info('auth', {
      jwt: 'eyJhbGciOi',
      nested: { Authorization: 'Bearer x', apiKey: 'k', keep: 'yes' }
    });
    const line = captured(out);
    expect(line.jwt).toBe('[redacted]');
    expect(line.nested.Authorization).toBe('[redacted]');
    expect(line.nested.apiKey).toBe('[redacted]');
    expect(line.nested.keep).toBe('yes');
  });

  it('serialises Errors instead of emitting {}', () => {
    createLogger().error('boom', { err: new Error('kaput') });
    const line = captured(err);
    expect(line.err.message).toBe('kaput');
    expect(line.err.stack).toContain('kaput');
  });

  it('accepts a bare Error as the second argument', () => {
    createLogger().error('boom', new Error('direct'));
    expect(captured(err).err.message).toBe('direct');
  });

  it('survives circular structures', () => {
    const a: any = { name: 'a' };
    a.self = a;
    expect(() => createLogger().info('cycle', a)).not.toThrow();
    expect(captured(out).self).toBe('[circular]');
  });

  it('never lets a field overwrite level/time/msg', () => {
    createLogger().info('real', { msg: 'fake', level: 'fatal' });
    const line = captured(out);
    expect(line.msg).toBe('real');
    expect(line.level).toBe('info');
  });

  it('prints human-readable text when LOG_FORMAT is pretty', () => {
    process.env.LOG_FORMAT = 'pretty';
    createLogger().info('readable', { a: 1 });
    expect(String(out.mock.calls[0][0])).toBe('[info] readable {"a":1}');
  });
});

describe('requestId', () => {
  it('reuses a sane incoming x-request-id', () => {
    const req = new Request('https://x.test/', { headers: { 'x-request-id': 'abc-123-def' } });
    expect(requestId(req)).toBe('abc-123-def');
  });

  it('ignores a junk header and generates its own', () => {
    const req = new Request('https://x.test/', { headers: { 'x-request-id': 'no' } });
    expect(requestId(req)).not.toBe('no');
    expect(requestId(req).length).toBeGreaterThan(8);
  });

  it('generates an id when there is no request at all', () => {
    expect(requestId()).toMatch(/[\w-]{8,}/);
  });
});
