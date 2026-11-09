import { describe, expect, it } from 'vitest';
import { TRACKING_MARK, cleanTracking, readTracking, safeUrl, sameTracking, trackingLine, withTracking } from './tracking';

describe('cleanTracking', () => {
  it('needs a number', () => {
    expect(cleanTracking({ carrier: 'DHL', number: '   ' })).toBeNull();
    expect(cleanTracking({})).toBeNull();
  });

  it('trims, and keeps the carrier and number', () => {
    expect(cleanTracking({ carrier: '  DHL ', number: ' 123456 ' })).toEqual({ carrier: 'DHL', number: '123456', url: null });
  });

  it('keeps one line: no newlines, no separator', () => {
    const t = cleanTracking({ carrier: 'Do\nar', number: 'A · B\r\nC' })!;
    expect(t.carrier).toBe('Do ar');
    expect(t.number).toBe('A B C');
  });

  it('a link pasted as the number is a link, not a number', () => {
    expect(cleanTracking({ number: 'https://track.example/p/XY123' })).toBeNull();
    expect(cleanTracking({ carrier: 'X', number: 'https://track.example/p/XY123', url: '' })).toBeNull();
  });

  it('accepts a link beside a number, and rejects other schemes', () => {
    expect(cleanTracking({ number: 'XY1', url: 'https://track.example/p/XY1' })?.url).toBe('https://track.example/p/XY1');
    expect(cleanTracking({ number: 'XY1', url: 'javascript:alert(1)' })?.url).toBeNull();
    expect(cleanTracking({ number: 'XY1', url: 'data:text/html,hi' })?.url).toBeNull();
  });

  it('bounds the lengths', () => {
    const t = cleanTracking({ carrier: 'c'.repeat(200), number: 'n'.repeat(500) })!;
    expect(t.carrier!.length).toBe(40);
    expect(t.number.length).toBe(60);
  });
});

describe('safeUrl', () => {
  it('is http(s) only', () => {
    expect(safeUrl('http://a.example/x')).toBe('http://a.example/x');
    expect(safeUrl('ftp://a.example')).toBeNull();
    expect(safeUrl('not a url')).toBeNull();
    expect(safeUrl(null)).toBeNull();
  });
});

describe('trackingLine / readTracking', () => {
  it.each([
    [{ carrier: 'DHL', number: '123456', url: null }],
    [{ carrier: null, number: '123456', url: null }],
    [{ carrier: null, number: '123456', url: 'https://t.example/1' }],
    [{ carrier: 'דואר ישראל', number: 'RR123IL', url: 'https://t.example/2' }]
  ])('round-trips %j', (t) => {
    const line = trackingLine(t);
    expect(line.startsWith(TRACKING_MARK)).toBe(true);
    expect(readTracking(line)).toEqual(t);
  });

  it('finds it among the order\'s other notes, last one wins', () => {
    const note = ['הערת קונה', trackingLine({ carrier: 'A', number: '1', url: null }), 'בוטל: אחר', trackingLine({ carrier: 'B', number: '2', url: null })].join('\n');
    expect(readTracking(note)).toEqual({ carrier: 'B', number: '2', url: null });
  });

  it('reads nothing from a note without it', () => {
    expect(readTracking(null)).toBeNull();
    expect(readTracking('הערה רגילה')).toBeNull();
    expect(readTracking(`${TRACKING_MARK}   `)).toBeNull();
  });
});

describe('withTracking', () => {
  const t = { carrier: 'DHL', number: '9', url: null };

  it('adds the line after the other notes', () => {
    expect(withTracking('הערה', t)).toBe(`הערה\n${trackingLine(t)}`);
    expect(withTracking(null, t)).toBe(trackingLine(t));
  });

  it('replaces the old line and keeps the rest', () => {
    const old = `הערה\n${trackingLine({ carrier: 'X', number: '1', url: null })}\nשורה אחרונה`;
    const next = withTracking(old, t)!;
    expect(next.split('\n')).toEqual(['הערה', 'שורה אחרונה', trackingLine(t)]);
    expect(readTracking(next)).toEqual(t);
  });

  it('removes it with null, and an empty note becomes null', () => {
    expect(withTracking(trackingLine(t), null)).toBeNull();
    expect(withTracking(`הערה\n${trackingLine(t)}`, null)).toBe('הערה');
  });
});

describe('sameTracking', () => {
  it('compares the three fields', () => {
    const a = { carrier: 'A', number: '1', url: null };
    expect(sameTracking(a, { ...a })).toBe(true);
    expect(sameTracking(a, { ...a, number: '2' })).toBe(false);
    expect(sameTracking(null, null)).toBe(true);
    expect(sameTracking(a, null)).toBe(false);
  });
});
