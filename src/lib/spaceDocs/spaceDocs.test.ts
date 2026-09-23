import { describe, it, expect } from 'vitest';
import {
  folderNames,
  formatSize,
  groupByFolder,
  isSafeHref,
  normalizeSpaceDocs
} from './spaceDocs.js';

/** Stand-in for `mediaUrl` — relative Strapi paths get a base. */
const resolve = (url: string | null | undefined) =>
  !url ? '' : url.startsWith('http') ? url : `https://cdn.test${url}`;

const row = (id: string, attributes: Record<string, unknown>) => ({ id, attributes });

describe('isSafeHref', () => {
  it('accepts http and https', () => {
    expect(isSafeHref('https://drive.google.com/x')).toBe(true);
    expect(isSafeHref('http://example.org')).toBe(true);
  });

  it('refuses the schemes that make a stored link an attack on co-members', () => {
    expect(isSafeHref('javascript:alert(1)')).toBe(false);
    expect(isSafeHref('data:text/html,<script>')).toBe(false);
    expect(isSafeHref('vbscript:msgbox')).toBe(false);
    expect(isSafeHref('file:///etc/passwd')).toBe(false);
  });

  it('refuses anything that is not an absolute url at all', () => {
    expect(isSafeHref('')).toBe(false);
    expect(isSafeHref('   ')).toBe(false);
    expect(isSafeHref('/uploads/a.pdf')).toBe(false);
    expect(isSafeHref(null)).toBe(false);
    expect(isSafeHref(42)).toBe(false);
  });
});

describe('normalizeSpaceDocs', () => {
  it('resolves a file row through the media resolver', () => {
    const [doc] = normalizeSpaceDocs(
      [
        row('7', {
          name: 'Lease',
          note: ' signed ',
          kind: 'file',
          folder: 'contracts/2026',
          createdAt: '2026-01-02T00:00:00.000Z',
          file: {
            data: {
              attributes: { url: '/uploads/lease.pdf', name: 'lease.pdf', mime: 'application/pdf', size: 2048 }
            }
          },
          uploadedBy: { data: { id: '3', attributes: { username: 'dana', profilePic: null } } }
        })
      ],
      resolve
    );

    expect(doc).toMatchObject({
      id: '7',
      name: 'Lease',
      note: 'signed',
      kind: 'file',
      href: 'https://cdn.test/uploads/lease.pdf',
      folder: 'contracts/2026',
      fileName: 'lease.pdf',
      mime: 'application/pdf'
    });
    // Strapi reports KB, so 2048 is 2 MB — not 2 KB.
    expect(doc.size).toBe(2048 * 1024);
    expect(doc.uploadedBy).toEqual({ id: '3', username: 'dana', pic: '' });
  });

  it('keeps a link row at its stored url', () => {
    const [doc] = normalizeSpaceDocs(
      [row('9', { name: 'Drive', kind: 'link', url: 'https://drive.google.com/folder' })],
      resolve
    );
    expect(doc.kind).toBe('link');
    expect(doc.href).toBe('https://drive.google.com/folder');
    expect(doc.size).toBe(0);
  });

  it('drops rows with nothing to open, including a hostile link', () => {
    const docs = normalizeSpaceDocs(
      [
        row('1', { name: 'orphan', kind: 'file', file: { data: null } }),
        row('2', { name: 'empty link', kind: 'link', url: '' }),
        row('3', { name: 'xss', kind: 'link', url: 'javascript:alert(1)' })
      ],
      resolve
    );
    expect(docs).toEqual([]);
  });

  it('falls back to the uploaded file name when the row has no name', () => {
    const [doc] = normalizeSpaceDocs(
      [row('4', { name: '  ', kind: 'image', file: { data: { attributes: { url: '/uploads/a.png', name: 'a.png' } } } })],
      resolve
    );
    expect(doc.name).toBe('a.png');
  });

  it('treats an unknown kind as a file rather than trusting it', () => {
    const [doc] = normalizeSpaceDocs(
      [row('5', { name: 'x', kind: 'secret', file: { data: { attributes: { url: '/uploads/x.pdf' } } } })],
      resolve
    );
    expect(doc.kind).toBe('file');
  });

  it('survives a missing collection', () => {
    expect(normalizeSpaceDocs(null, resolve)).toEqual([]);
    expect(normalizeSpaceDocs(undefined, resolve)).toEqual([]);
  });
});

describe('groupByFolder', () => {
  const docs = [
    { folder: 'b', id: '1' },
    { folder: '', id: '2' },
    { folder: 'a', id: '3' },
    { folder: 'b', id: '4' }
  ] as any[];

  it('sorts folders by name and puts the unfiled group last', () => {
    expect(groupByFolder(docs).map((g) => g.folder)).toEqual(['a', 'b', '']);
  });

  it('keeps every document, in the order it arrived', () => {
    const groups = groupByFolder(docs);
    expect(groups.find((g) => g.folder === 'b')?.docs.map((d) => d.id)).toEqual(['1', '4']);
    expect(groups.flatMap((g) => g.docs)).toHaveLength(4);
  });

  it('returns nothing for nothing', () => {
    expect(groupByFolder([])).toEqual([]);
  });
});

describe('folderNames', () => {
  it('is the deduped, sorted list of non-empty folders', () => {
    expect(folderNames([{ folder: 'b' }, { folder: '' }, { folder: 'a' }, { folder: 'b' }] as any[])).toEqual([
      'a',
      'b'
    ]);
  });
});

describe('formatSize', () => {
  it('scales into the unit a human would read', () => {
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(1536)).toBe('1.5 KB');
    expect(formatSize(5 * 1024 * 1024)).toBe('5.0 MB');
    expect(formatSize(80 * 1024 * 1024)).toBe('80 MB');
  });

  it('says nothing at all when there is no size — a link has none', () => {
    expect(formatSize(0)).toBe('');
    expect(formatSize(NaN)).toBe('');
  });
});

describe('normalizeSpaceDocs — private bucket rows', () => {
  it('points at our own serve endpoint and keeps the bucket metadata', () => {
    const [doc] = normalizeSpaceDocs(
      [
        row('12', {
          name: '',
          kind: 'file',
          storageKey: 'rikma/3/u/lease.pdf',
          fileName: 'lease.pdf',
          mime: 'application/pdf',
          size: 5000
        })
      ],
      resolve
    );
    expect(doc).toMatchObject({
      href: '/api/v1/space-docs/12/file',
      privateFile: true,
      name: 'lease.pdf',
      fileName: 'lease.pdf',
      // Bytes already — not multiplied like Strapi's kilobytes.
      size: 5000
    });
  });

  it('never treats a link as a private file, whatever it carries', () => {
    const [doc] = normalizeSpaceDocs(
      [row('13', { name: 'x', kind: 'link', url: 'https://a.test', storageKey: 'rikma/3/u/x' })],
      resolve
    );
    expect(doc.privateFile).toBe(false);
    expect(doc.href).toBe('https://a.test');
  });
});
