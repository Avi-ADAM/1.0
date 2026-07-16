import { describe, expect, it } from 'vitest';
import {
  buildDonationNote,
  isDonationNote,
  parseDonationNote
} from './parseDonationNote';

describe('parseDonationNote', () => {
  it('returns null for non-donation notes', () => {
    expect(parseDonationNote(null)).toBeNull();
    expect(parseDonationNote(undefined)).toBeNull();
    expect(parseDonationNote('')).toBeNull();
    expect(parseDonationNote('site-share · paid=40')).toBeNull();
    expect(parseDonationNote('regular sale of 3 chairs')).toBeNull();
    // Starts with the word but is not the structured marker.
    expect(parseDonationNote('donations report for May')).toBeNull();
  });

  it('parses a full note', () => {
    const parsed = parseDonationNote(
      'donation · from=רחל כהן · via=page · msg="לזכר סבתא · באהבה" · pledge=17'
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.from).toBe('רחל כהן');
    expect(parsed?.via).toBe('page');
    expect(parsed?.msg).toBe('לזכר סבתא · באהבה');
    expect(parsed?.pledgeId).toBe('17');
  });

  it('parses a bare marker as an anonymous manual-era donation', () => {
    const parsed = parseDonationNote('donation');
    expect(parsed).not.toBeNull();
    expect(parsed?.from).toBeNull();
    expect(parsed?.via).toBeNull();
    expect(parsed?.msg).toBeNull();
  });

  it('treats unknown via values as null and ignores unknown keys', () => {
    const parsed = parseDonationNote('donation · via=carrier-pigeon · future=1');
    expect(parsed?.via).toBeNull();
  });

  it('round-trips through buildDonationNote', () => {
    const note = buildDonationNote({
      from: 'דוד',
      via: 'manual',
      msg: 'כל הכבוד על העשייה'
    });
    const parsed = parseDonationNote(note);
    expect(parsed?.from).toBe('דוד');
    expect(parsed?.via).toBe('manual');
    expect(parsed?.msg).toBe('כל הכבוד על העשייה');
    expect(parsed?.pledgeId).toBeNull();
  });

  it('builds an anonymous note when from is empty', () => {
    const note = buildDonationNote({ from: '  ', via: 'page' });
    expect(note).toBe('donation · via=page');
    expect(parseDonationNote(note)?.from).toBeNull();
  });

  it('strips double quotes from messages so the parser stays unambiguous', () => {
    const note = buildDonationNote({ via: 'page', msg: 'she said "wow"' });
    expect(parseDonationNote(note)?.msg).toBe("she said 'wow'");
  });

  it('isDonationNote guards correctly', () => {
    expect(isDonationNote('donation · via=page')).toBe(true);
    expect(isDonationNote('sale')).toBe(false);
  });
});
