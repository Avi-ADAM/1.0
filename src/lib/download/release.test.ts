import { describe, expect, it } from 'vitest';
import { detectPlatform, parseAndroidLink, parseReleaseManifest } from './release.js';

const EXE = 'https://dl.1lev1.com/1lev1_0.2.0_x64-setup.exe';
const MSI = 'https://dl.1lev1.com/1lev1_0.2.0_x64_en-US.msi';

describe('parseReleaseManifest', () => {
  it('reads a tauri-action manifest with installer-specific keys', () => {
    const r = parseReleaseManifest({
      version: 'v0.2.0',
      notes: '  Faster start  ',
      pub_date: '2026-10-14T10:00:00Z',
      platforms: {
        'windows-x86_64': { url: EXE, signature: 's' },
        'windows-x86_64-nsis': { url: EXE, signature: 's' },
        'windows-x86_64-msi': { url: MSI, signature: 's' }
      }
    });
    expect(r).toEqual({
      version: '0.2.0',
      pubDate: '2026-10-14T10:00:00.000Z',
      notes: 'Faster start',
      windowsExe: EXE,
      windowsMsi: MSI
    });
  });

  it('accepts the plain windows-x86_64 key alone', () => {
    const r = parseReleaseManifest({ version: '1.0.0', platforms: { 'windows-x86_64': { url: EXE } } });
    expect(r?.windowsExe).toBe(EXE);
    expect(r?.windowsMsi).toBeNull();
    expect(r?.pubDate).toBeNull();
  });

  it('never offers a v1-style .zip updater bundle as a download', () => {
    const r = parseReleaseManifest({
      version: '1.0.0',
      platforms: { 'windows-x86_64': { url: 'https://dl.1lev1.com/1lev1.nsis.zip' } }
    });
    expect(r).toBeNull();
  });

  it('rejects non-https, malformed and missing input', () => {
    expect(parseReleaseManifest(null)).toBeNull();
    expect(parseReleaseManifest({ platforms: { 'windows-x86_64': { url: EXE } } })).toBeNull();
    expect(
      parseReleaseManifest({ version: '1', platforms: { 'windows-x86_64': { url: 'http://x/a.exe' } } })
    ).toBeNull();
    expect(
      parseReleaseManifest({ version: '1', platforms: { 'windows-x86_64': { url: 'not a url.exe' } } })
    ).toBeNull();
    expect(parseReleaseManifest({ version: '1', platforms: { 'darwin-aarch64': { url: EXE } } })).toBeNull();
  });

  it('drops an unparseable date instead of rendering "Invalid Date"', () => {
    const r = parseReleaseManifest({
      version: '1',
      pub_date: 'yesterday',
      platforms: { 'windows-x86_64': { url: EXE } }
    });
    expect(r?.pubDate).toBeNull();
  });
});

describe('parseAndroidLink', () => {
  it('tells a Play listing from a direct APK', () => {
    expect(parseAndroidLink('https://play.google.com/store/apps/details?id=world.onelev1.app')?.store).toBe(true);
    expect(parseAndroidLink('https://dl.1lev1.com/1lev1.apk')?.store).toBe(false);
  });
  it('ignores empty and insecure values', () => {
    expect(parseAndroidLink(undefined)).toBeNull();
    expect(parseAndroidLink('')).toBeNull();
    expect(parseAndroidLink('http://dl.1lev1.com/1lev1.apk')).toBeNull();
  });
});

describe('detectPlatform', () => {
  const WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/129 Safari/537.36';
  const MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
  const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/129 Mobile Safari/537.36';
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
  const LINUX = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/129 Safari/537.36';
  const CROS = 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/129 Safari/537.36';

  it('recognises the common desktops and phones', () => {
    expect(detectPlatform(WIN)).toBe('windows');
    expect(detectPlatform(MAC)).toBe('mac');
    expect(detectPlatform(ANDROID)).toBe('android');
    expect(detectPlatform(IPHONE)).toBe('ios');
    expect(detectPlatform(LINUX)).toBe('linux');
    expect(detectPlatform(CROS)).toBe('other');
    expect(detectPlatform('')).toBe('other');
  });

  it('treats an iPad that reports itself as a Mac as iOS', () => {
    expect(detectPlatform(MAC, { maxTouchPoints: 5 })).toBe('ios');
  });

  it('prefers the client-hints platform when present', () => {
    expect(detectPlatform('', { platform: 'Windows' })).toBe('windows');
    expect(detectPlatform(LINUX, { platform: 'Android' })).toBe('android');
  });
});
