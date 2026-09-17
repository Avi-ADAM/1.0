import { describe, it, expect } from 'vitest';
import {
  DEFAULT_OPEN_YEARS,
  MAX_OPEN_YEARS,
  effectiveLicense,
  isCodeLicense,
  isDelayedLicense,
  isSharedLicense,
  isRikmaLicense,
  licenseChanged,
  normalizeLicenseChange
} from './codeLicense';

describe('codeLicense', () => {
  it('reads legacy and unknown values as none', () => {
    expect(effectiveLicense(null)).toBe('none');
    expect(effectiveLicense(undefined)).toBe('none');
    expect(effectiveLicense('gpl')).toBe('none');
    expect(effectiveLicense('mit')).toBe('mit');
  });

  it('refuses anything that could be interpolated as a GraphQL literal', () => {
    expect(isCodeLicense('mit }) { data { id } } mutation {')).toBe(false);
    expect(normalizeLicenseChange('rikma, profilePic: 1')).toBeNull();
    expect(normalizeLicenseChange(42)).toBeNull();
  });

  it('only rikmaDelayed carries years, clamped into range', () => {
    expect(normalizeLicenseChange('mit', 7)).toEqual({ license: 'mit', openYears: null });
    expect(normalizeLicenseChange('rikmaDelayed')).toEqual({
      license: 'rikmaDelayed',
      openYears: DEFAULT_OPEN_YEARS
    });
    expect(normalizeLicenseChange('rikmaDelayed', '99')).toEqual({
      license: 'rikmaDelayed',
      openYears: MAX_OPEN_YEARS
    });
    expect(normalizeLicenseChange('rikmaDelayed', 0)?.openYears).toBe(DEFAULT_OPEN_YEARS);
  });

  it('rikmaSharedDelayed carries years like rikmaDelayed; rikmaShared does not', () => {
    expect(normalizeLicenseChange('rikmaShared', 3)).toEqual({
      license: 'rikmaShared',
      openYears: null
    });
    expect(normalizeLicenseChange('rikmaSharedDelayed', 3)).toEqual({
      license: 'rikmaSharedDelayed',
      openYears: 3
    });
    expect(isDelayedLicense('rikmaSharedDelayed')).toBe(true);
    expect(isDelayedLicense('rikmaShared')).toBe(false);
  });

  it('keeps the shared licenses apart from the restrictive ones', () => {
    expect(isSharedLicense('rikmaShared')).toBe(true);
    expect(isSharedLicense('rikmaSharedDelayed')).toBe(true);
    expect(isSharedLicense('rikma')).toBe(false);
    expect(isSharedLicense(null)).toBe(false);
    expect(isRikmaLicense('rikmaShared')).toBe(false);
    expect(isRikmaLicense('rikmaSharedDelayed')).toBe(false);
  });

  it('marks only the restrictive licenses as rikma licenses', () => {
    expect(isRikmaLicense('rikma')).toBe(true);
    expect(isRikmaLicense('rikmaDelayed')).toBe(true);
    expect(isRikmaLicense('apache')).toBe(false);
    expect(isRikmaLicense(null)).toBe(false);
  });

  it('treats legacy null as unchanged against none', () => {
    const none = normalizeLicenseChange('none')!;
    expect(licenseChanged({ license: null }, none)).toBe(false);
    expect(licenseChanged({ license: 'none' }, normalizeLicenseChange('mit')!)).toBe(true);
    expect(
      licenseChanged(
        { license: 'rikmaDelayed', openYears: 4 },
        normalizeLicenseChange('rikmaDelayed', 5)!
      )
    ).toBe(true);
  });
});
