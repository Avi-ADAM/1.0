/**
 * The synchronous SHA-256 exists so the loader and the browser compute the same
 * cache key (see the module's own header). Its only real requirement is that it
 * *is* SHA-256 — so it is checked against node's, over the kind of text this
 * site actually stores: five scripts, emoji, astral-plane characters, and the
 * block boundaries where a hand-rolled implementation goes wrong.
 */

import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { sha256Hex } from './sha256.js';

const node = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

describe('sha256Hex', () => {
    it('matches the published test vectors', () => {
        expect(sha256Hex('')).toBe(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
        );
        expect(sha256Hex('abc')).toBe(
            'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
        );
    });

    it('matches node:crypto on real site text', () => {
        const corpus = [
            'פיתוח אתר הזמנות למרפאה קהילתית',
            'Development of a booking site for a community clinic',
            'تطوير موقع حجز لعيادة مجتمعية',
            'Разработка сайта бронирования для общественной клиники',
            'Desarrollo de un sitio de reservas para una clínica comunitaria',
            'רקמה 💗 1lev1',
            '𝐀𝐁𝐂 astral plane',
            'mixed עברית and English in one line'
        ];
        for (const s of corpus) expect(sha256Hex(s)).toBe(node(s));
    });

    it('matches node:crypto across every padding boundary', () => {
        // 55/56 and 119/120 bytes are where the length field spills into an
        // extra block — the classic off-by-one in a hand-written SHA-256.
        for (let n = 0; n <= 130; n++) {
            const s = 'a'.repeat(n);
            expect(sha256Hex(s), `length ${n}`).toBe(node(s));
        }
    });

    it('hashes bytes, not code units — a multi-byte character is not a char', () => {
        // Two strings of equal *character* length but different UTF-8 length.
        expect(sha256Hex('אאאא')).toBe(node('אאאא'));
        expect(sha256Hex('aaaa')).toBe(node('aaaa'));
        expect(sha256Hex('אאאא')).not.toBe(sha256Hex('aaaa'));
    });
});
