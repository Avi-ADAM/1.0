import { describe, expect, it } from 'vitest';
import { SIGNUP_COUNTRIES, countryIdsOf } from './signupCountries.js';

describe('countryIdsOf', () => {
  it('reads English (any case), Hebrew and ids; drops what it does not know', () => {
    expect(countryIdsOf(['israel', 'ארצות הברית של אמריקה', 'Mars', 104, ' 230 '])).toEqual([104, 230]);
  });

  it('the list the agreement offers is intact', () => {
    expect(SIGNUP_COUNTRIES.length).toBeGreaterThan(200);
    expect(SIGNUP_COUNTRIES[0]).toEqual({ value: 104, label: 'Israel', heb: 'ישראל' });
  });
});
