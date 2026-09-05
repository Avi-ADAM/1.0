import { describe, it, expect } from 'vitest';
import { fileSizeLabel, readSaveFiles, saveFileIds } from './saveFiles.js';

const media = {
  data: [
    { id: '7', attributes: { url: '/uploads/notes.pdf', name: 'notes.pdf', mime: 'application/pdf', size: 320 } },
    { id: '8', attributes: { url: '/uploads/shot.png', mime: 'image/png', size: 2048 } }
  ]
};

describe('readSaveFiles', () => {
  it('reads the Strapi collection shape', () => {
    expect(readSaveFiles(media)).toEqual([
      { id: '7', url: '/uploads/notes.pdf', name: 'notes.pdf', mime: 'application/pdf', size: 320 },
      { id: '8', url: '/uploads/shot.png', name: 'shot.png', mime: 'image/png', size: 2048 }
    ]);
  });

  it('reads a bare array — what /api/upload answers with', () => {
    const uploaded = [{ id: 12, url: '/uploads/a.png', name: 'a.png', mime: 'image/png', size: 10 }];
    expect(readSaveFiles(uploaded).map((f) => f.id)).toEqual(['12']);
  });

  it('reads the single-object shape the older `what` field returns', () => {
    const single = { data: { id: '3', attributes: { url: '/uploads/one.pdf', name: 'one.pdf' } } };
    expect(readSaveFiles(single)).toHaveLength(1);
  });

  it('drops a row with no url — a card must not render a dead link', () => {
    expect(readSaveFiles({ data: [{ id: '9', attributes: { name: 'gone.pdf' } }] })).toEqual([]);
  });

  it('is empty for nothing', () => {
    expect(readSaveFiles(null)).toEqual([]);
    expect(readSaveFiles({ data: [] })).toEqual([]);
  });
});

describe('saveFileIds', () => {
  it('keeps ids from a query that asked for nothing but the id', () => {
    // The write path reads `saveFiles { data { id } }`; dropping url-less rows
    // here would silently detach every file on the next write.
    expect(saveFileIds({ data: [{ id: '7' }, { id: 8 }] })).toEqual(['7', '8']);
  });

  it('de-dupes', () => {
    expect(saveFileIds({ data: [{ id: '7' }, { id: '7' }] })).toEqual(['7']);
  });

  it('is empty for nothing', () => {
    expect(saveFileIds(undefined)).toEqual([]);
  });
});

describe('fileSizeLabel', () => {
  it('reads kilobytes, as Strapi stores them', () => {
    expect(fileSizeLabel(320)).toBe('320 KB');
    expect(fileSizeLabel(2048)).toBe('2.0 MB');
    expect(fileSizeLabel(0)).toBe('');
  });
});
