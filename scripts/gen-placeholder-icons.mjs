#!/usr/bin/env node
/**
 * Generates placeholder app icons for src-tauri/icons using only node:zlib
 * (no image tooling required). Pink background + white dot.
 *
 * Replace with real branding by running (from repo root, once you have a
 * 1024x1024 source logo):  npm run tauri icon path/to/logo.png
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'src-tauri', 'icons');
mkdirSync(outDir, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // raw scanlines: filter byte 0 + RGBA pixels
  const raw = Buffer.alloc(size * (1 + size * 4));
  const cx = size / 2;
  const r2 = (size * 0.3) ** 2;
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 4) + 1;
    for (let x = 0; x < size; x++) {
      const inDot = (x - cx) ** 2 + (y - cx) ** 2 <= r2;
      const o = row + x * 4;
      if (inDot) {
        raw[o] = 255; raw[o + 1] = 255; raw[o + 2] = 255;
      } else {
        raw[o] = 233; raw[o + 1] = 30; raw[o + 2] = 99; // #E91E63
      }
      raw[o + 3] = 255;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

// Modern .ico containers may embed PNG data directly (Vista+)
function icoFromPng(pngBuf) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  header[6] = 0; // 0 = 256px wide
  header[7] = 0; // 0 = 256px tall
  header.writeUInt16LE(1, 12); // planes
  header.writeUInt16LE(32, 14); // bpp
  header.writeUInt32LE(pngBuf.length, 16);
  header.writeUInt32LE(22, 18); // data offset
  return Buffer.concat([header, pngBuf]);
}

const files = {
  '32x32.png': png(32),
  '128x128.png': png(128),
  '128x128@2x.png': png(256),
  'icon.png': png(512),
  'icon.ico': icoFromPng(png(256))
};

for (const [name, buf] of Object.entries(files)) {
  writeFileSync(join(outDir, name), buf);
  console.log('wrote', join(outDir, name), buf.length, 'bytes');
}
