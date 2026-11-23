import { describe, it, expect, vi } from 'vitest';
import { admitDocs, classifyDoc, readDocuments, DOC_LIMITS, type UploadedDoc, type ReadDeps } from './readDocuments';

const enc = (s: string) => new TextEncoder().encode(s);
const doc = (name: string, mimeType: string, bytes: Uint8Array = enc('x')): UploadedDoc => ({ name, mimeType, bytes });

function deps(over: Partial<ReadDeps> = {}): ReadDeps {
  return {
    pdfText: vi.fn(async () => 'מחירון: צילום חתונה 6,000 ₪. '.repeat(20)),
    docxText: vi.fn(async () => 'חבילת בר מצווה 3,500 ₪'),
    transcribe: vi.fn(async () => 'קטלוג: מגנטים 15 ₪ ליחידה'),
    ...over
  };
}

describe('classifyDoc', () => {
  it('knows the formats by type or by extension', () => {
    expect(classifyDoc(doc('a.pdf', ''))).toBe('pdf');
    expect(classifyDoc(doc('a', 'application/pdf'))).toBe('pdf');
    expect(classifyDoc(doc('a.docx', 'application/octet-stream'))).toBe('docx');
    expect(classifyDoc(doc('prices.csv', 'text/csv'))).toBe('text');
    expect(classifyDoc(doc('IMG_1.HEIC', ''))).toBe('image');
    expect(classifyDoc(doc('a.jpg', 'image/jpeg'))).toBe('image');
    expect(classifyDoc(doc('a.exe', 'application/x-msdownload'))).toBeNull();
    expect(classifyDoc(doc('a.svg', 'image/svg+xml'))).toBeNull();
  });
});

describe('admitDocs', () => {
  it('refuses unknown formats, too many files and too many bytes, and says which', () => {
    const big = new Uint8Array(DOC_LIMITS.maxFileBytes + 1);
    const files = [doc('a.exe', ''), doc('big.pdf', 'application/pdf', big)];
    for (let i = 0; i < DOC_LIMITS.maxFiles + 1; i++) files.push(doc(`p${i}.jpg`, 'image/jpeg'));
    const { ok, problems } = admitDocs(files);
    expect(ok).toHaveLength(DOC_LIMITS.maxFiles);
    expect(problems).toEqual([
      { name: 'a.exe', reason: 'unsupported' },
      { name: 'big.pdf', reason: 'too-large' },
      { name: `p${DOC_LIMITS.maxFiles}.jpg`, reason: 'too-many' }
    ]);
  });
});

describe('readDocuments', () => {
  it('reads text-layer documents locally, with no model call', async () => {
    const d = deps();
    const r = await readDocuments([doc('price.pdf', 'application/pdf'), doc('a.docx', ''), doc('n.txt', 'text/plain', enc('שעות: א-ה'))], 'he', d);
    expect(r.read).toBe(3);
    expect(r.modelCalls).toBe(0);
    expect(d.transcribe).not.toHaveBeenCalled();
    expect(r.text).toContain('### price.pdf');
    expect(r.text).toContain('חבילת בר מצווה');
    expect(r.text).toContain('שעות: א-ה');
  });

  it('sends every image and scanned PDF to the model in one call', async () => {
    const d = deps({ pdfText: vi.fn(async () => '  ') });
    const r = await readDocuments([doc('scan.pdf', 'application/pdf'), doc('a.png', 'image/png'), doc('b.jpg', '')], 'he', d);
    expect(d.transcribe).toHaveBeenCalledTimes(1);
    const [visual] = (d.transcribe as any).mock.calls[0];
    expect(visual.map((v: any) => v.mimeType)).toEqual(['application/pdf', 'image/png', 'image/jpeg']);
    expect(r).toMatchObject({ read: 3, modelCalls: 1, problems: [] });
    expect(r.text).toContain('מגנטים 15 ₪');
  });

  it('a failed transcription marks those files unreadable and keeps the rest', async () => {
    const d = deps({ transcribe: vi.fn(async () => Promise.reject(new Error('503'))) });
    const r = await readDocuments([doc('price.pdf', 'application/pdf'), doc('a.png', 'image/png')], 'he', d);
    expect(r.read).toBe(1);
    expect(r.problems).toEqual([{ name: 'a.png', reason: 'unreadable' }]);
    expect(r.text).toContain('צילום חתונה');
  });

  it('caps the combined text', async () => {
    const d = deps({ docxText: vi.fn(async () => 'א'.repeat(DOC_LIMITS.maxChars * 2)) });
    const r = await readDocuments([doc('a.docx', '')], 'he', d);
    expect(r.text.length).toBe(DOC_LIMITS.maxChars);
  });
});
