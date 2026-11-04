import { describe, expect, it } from 'vitest';
import { checkImage, safeFileName, sniffImage } from './imagePolicy';

const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
const HTML = new TextEncoder().encode('<html><script>alert(1)</script></html>');
const SVG = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');

describe('sniffImage', () => {
  it('reads the three formats from their bytes', () => {
    expect(sniffImage(JPG)).toBe('image/jpeg');
    expect(sniffImage(PNG)).toBe('image/png');
    expect(sniffImage(WEBP)).toBe('image/webp');
  });
  it('anything else is not an image', () => {
    expect(sniffImage(HTML)).toBeNull();
    expect(sniffImage(SVG)).toBeNull();
    expect(sniffImage(new Uint8Array())).toBeNull();
  });
});

describe('checkImage', () => {
  it('accepts a real picture under the limit', () => {
    expect(checkImage(JPG, 100, 'image/jpeg')).toBeNull();
    expect(checkImage(JPG, 100, 'image/jpg')).toBeNull();
    expect(checkImage(PNG, 100, null)).toBeNull();
    expect(checkImage(WEBP, 100, 'application/octet-stream')).toBeNull();
  });
  it('refuses a forbidden type even when it is named .jpg', () => {
    expect(checkImage(HTML, 1000, 'image/jpeg')?.code).toBe('type');
    expect(checkImage(SVG, 1000, 'image/svg+xml')?.code).toBe('type');
  });
  it('refuses a declared type the bytes contradict', () => {
    expect(checkImage(PNG, 100, 'image/jpeg')?.code).toBe('mismatch');
    expect(checkImage(PNG, 100, 'application/pdf')?.code).toBe('type');
  });
  it('refuses a file over the limit, and an empty one', () => {
    const big = new Uint8Array(101);
    big.set(JPG);
    expect(checkImage(big, 100)?.code).toBe('size');
    expect(checkImage(new Uint8Array(), 100)?.code).toBe('empty');
  });
});

describe('safeFileName', () => {
  it('drops the path and fixes the extension', () => {
    expect(safeFileName('../../etc/passwd.php', 'image/png')).toBe('passwd.png');
    expect(safeFileName('', 'image/webp')).toBe('picture.webp');
  });
});
