// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearGuestDraft,
  DRAFT_KEY,
  DRAFT_TTL_MS,
  isLiveDraft,
  readGuestDraft,
  saveGuestDraft
} from './wishDraft.js';

/** src/test-setup.js stubs localStorage with no-op mocks; these tests need one that stores. */
function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear: () => m.clear(),
    getItem: (k) => (m.has(k) ? (m.get(k) as string) : null),
    key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => void m.delete(k),
    setItem: (k, v) => void m.set(k, String(v))
  };
}

describe('guest wish draft', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage(), configurable: true });
    Object.defineProperty(globalThis, 'sessionStorage', { value: memoryStorage(), configurable: true });
  });

  it('survives in localStorage — the confirmation link opens a new tab', () => {
    expect(saveGuestDraft({ title: 'עוגה ליום הולדת', body: 'שלוש קומות' })).toBe(true);
    expect(localStorage.getItem(DRAFT_KEY)).toBeTruthy();
    const d = readGuestDraft();
    expect(d?.title).toBe('עוגה ליום הולדת');
    expect(d?.sendOnReturn).toBe(false);
  });

  it('remembers that the guest pressed send', () => {
    saveGuestDraft({ title: 'x', body: 'y' }, { sendOnReturn: true });
    expect(readGuestDraft()?.sendOnReturn).toBe(true);
  });

  it('drops an expired draft', () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ title: 'old', savedAt: Date.now() - DRAFT_TTL_MS - 1000 })
    );
    expect(readGuestDraft()).toBeNull();
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it('ignores an empty draft', () => {
    expect(isLiveDraft({ title: '  ', body: '' })).toBe(false);
  });

  it('picks up a draft stashed by the old sessionStorage composer as a send', () => {
    sessionStorage.setItem('wishDraft', JSON.stringify({ title: 'legacy', body: 'b' }));
    const d = readGuestDraft();
    expect(d?.title).toBe('legacy');
    expect(d?.sendOnReturn).toBe(true);
  });

  it('clears both stores', () => {
    saveGuestDraft({ title: 'a' });
    sessionStorage.setItem('wishDraft', JSON.stringify({ title: 'b' }));
    clearGuestDraft();
    expect(readGuestDraft()).toBeNull();
  });
});
