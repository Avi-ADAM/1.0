import { describe, it, expect } from 'vitest';
import { applyLocalization } from './localizationUtils';

// Base vocabulary is English; localizations.data[0] is the Hebrew row.
const roles = {
  data: [
    {
      id: '1',
      attributes: {
        roleDescription: 'Carpenter',
        localizations: { data: [{ attributes: { roleDescription: 'נגר' } }] }
      }
    },
    { id: '2', attributes: { workWayName: 'onsite', localizations: { data: [] } } }
  ]
};

describe('applyLocalization', () => {
  it('shows the Hebrew name to a Hebrew reader', () => {
    const out = applyLocalization(roles, 'he');
    expect(out.data[0].attributes.roleDescription).toBe('נגר');
    expect(out.data[1].attributes.workWayName).toBe('onsite');
  });

  it('keeps the base (English) name for every other reader', () => {
    for (const lang of ['en', 'ar', 'ru', 'es']) {
      const out = applyLocalization(roles, lang);
      expect(out.data[0].attributes.roleDescription).toBe('Carpenter');
    }
  });

  it('preserves the array shape', () => {
    const out = applyLocalization(roles.data, 'he');
    expect(Array.isArray(out)).toBe(true);
    expect(out[0].attributes.roleDescription).toBe('נגר');
  });
});
