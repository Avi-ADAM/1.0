import { describe, expect, it } from 'vitest';
import { checkCron, CRON_HEADER } from './cronAuth.js';

const req = (headers: Record<string, string> = {}) => new Request('http://x/api/digest', { headers });
const url = (q = '') => new URL(`http://x/api/digest${q}`);

describe('checkCron', () => {
  it('required: fails closed with no secret configured', () => {
    expect(checkCron(req(), url(), { required: true, secret: '' })).toMatchObject({ ok: false, status: 503 });
  });

  it('optional: open with no secret configured (legacy routes)', () => {
    expect(checkCron(req(), url(), { required: false, secret: '' })).toMatchObject({ ok: true });
  });

  it('accepts the header or ?key=, rejects anything else', () => {
    const secret = 's3cret';
    expect(checkCron(req({ [CRON_HEADER]: secret }), url(), { secret })).toMatchObject({ ok: true });
    expect(checkCron(req(), url(`?key=${secret}`), { secret })).toMatchObject({ ok: true });
    expect(checkCron(req({ [CRON_HEADER]: 'nope' }), url(), { secret })).toMatchObject({ ok: false, status: 401 });
    expect(checkCron(req(), url(), { secret })).toMatchObject({ ok: false, status: 401 });
    expect(checkCron(req({ [CRON_HEADER]: 's3cre' }), url(), { secret })).toMatchObject({ status: 401 });
  });
});
