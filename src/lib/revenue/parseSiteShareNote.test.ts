import { describe, expect, it } from 'vitest';
import { parseSiteShareNote, isSiteShareNote } from './parseSiteShareNote';

describe('parseSiteShareNote', () => {
  it('returns null for non-site-share notes', () => {
    expect(parseSiteShareNote('just a normal note')).toBeNull();
    expect(parseSiteShareNote('')).toBeNull();
    expect(parseSiteShareNote(null)).toBeNull();
    expect(parseSiteShareNote(undefined)).toBeNull();
  });

  it('parses a plain as-is note (paid + from_project + single haluka)', () => {
    const r = parseSiteShareNote('site-share · paid=1.1 · from_project=45 · halukas=56');
    expect(r).not.toBeNull();
    expect(r!.paid).toBe(1.1);
    expect(r!.adjustDirection).toBeNull();
    expect(r!.proposed).toBeNull();
    expect(r!.reason).toBeNull();
    expect(r!.fromProjectId).toBe('45');
    expect(r!.halukaIds).toEqual(['56']);
  });

  it('parses multiple haluka ids', () => {
    const r = parseSiteShareNote(
      'site-share · paid=116.24000000000001 · from_project=54 · halukas=50,51'
    );
    expect(r!.paid).toBeCloseTo(116.24);
    expect(r!.fromProjectId).toBe('54');
    expect(r!.halukaIds).toEqual(['50', '51']);
  });

  it('parses a "less" adjustment with proposed amount and reason', () => {
    const r = parseSiteShareNote(
      'site-share · less · proposed=0.96 · reason="כי אין לנו מספיק כסף וזה טסט" · paid=0.84 · from_project=54 · halukas=46'
    );
    expect(r!.adjustDirection).toBe('less');
    expect(r!.proposed).toBe(0.96);
    expect(r!.reason).toBe('כי אין לנו מספיק כסף וזה טסט');
    expect(r!.paid).toBe(0.84);
    expect(r!.fromProjectId).toBe('54');
    expect(r!.halukaIds).toEqual(['46']);
  });

  it('keeps a reason that itself contains the " · " separator', () => {
    const r = parseSiteShareNote(
      'site-share · more · proposed=10 · reason="split · then paid extra" · paid=15'
    );
    expect(r!.adjustDirection).toBe('more');
    expect(r!.reason).toBe('split · then paid extra');
    expect(r!.proposed).toBe(10);
    expect(r!.paid).toBe(15);
  });

  it('preserves the raw note', () => {
    const note = 'site-share · paid=1.1 · from_project=45 · halukas=56';
    expect(parseSiteShareNote(note)!.raw).toBe(note);
  });

  it('isSiteShareNote guards correctly', () => {
    expect(isSiteShareNote('site-share · paid=1')).toBe(true);
    expect(isSiteShareNote('  site-share · paid=1')).toBe(true);
    expect(isSiteShareNote('other')).toBe(false);
    expect(isSiteShareNote(null)).toBe(false);
  });
});
