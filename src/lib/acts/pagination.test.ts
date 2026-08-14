import { describe, it, expect } from 'vitest';
import { pageCount, clampPage, pageSlice, pageRange, pageWindow } from './pagination.js';

describe('pageCount', () => {
  it('is the regression the old grid failed: 51 rows at 20 per page is 3 pages', () => {
    expect(pageCount(51, 20)).toBe(3);
  });

  it('reports 1 page for an empty list, so "page 1 of 1" holds', () => {
    expect(pageCount(0, 20)).toBe(1);
  });

  it('does not add an empty trailing page on an exact multiple', () => {
    expect(pageCount(40, 20)).toBe(2);
    expect(pageCount(100, 100)).toBe(1);
  });

  it('survives a nonsense page size instead of dividing by zero', () => {
    expect(pageCount(51, 0)).toBe(51);
    expect(pageCount(51, -5)).toBe(51);
    expect(pageCount(51, NaN)).toBe(51);
  });
});

describe('clampPage', () => {
  it('keeps a page inside the range', () => {
    expect(clampPage(1, 3)).toBe(1);
    expect(clampPage(3, 3)).toBe(3);
  });

  it('pulls an out-of-range page back to the nearest end', () => {
    // A filter that shrinks the list must not strand the view past the end.
    expect(clampPage(9, 3)).toBe(3);
    expect(clampPage(0, 3)).toBe(1);
    expect(clampPage(-4, 3)).toBe(1);
  });

  it('falls back to page 1 on a non-finite page', () => {
    expect(clampPage(NaN, 5)).toBe(1);
    expect(clampPage(Infinity, 5)).toBe(5);
  });
});

describe('pageSlice', () => {
  const items = Array.from({ length: 51 }, (_, i) => i + 1);

  it('returns each page in order and loses nothing', () => {
    expect(pageSlice(items, 1, 20)).toHaveLength(20);
    expect(pageSlice(items, 2, 20)).toHaveLength(20);
    expect(pageSlice(items, 3, 20)).toHaveLength(11);

    const all = [...pageSlice(items, 1, 20), ...pageSlice(items, 2, 20), ...pageSlice(items, 3, 20)];
    expect(all).toEqual(items);
  });

  it('starts each page where the previous one ended', () => {
    expect(pageSlice(items, 2, 20)[0]).toBe(21);
    expect(pageSlice(items, 3, 20)[0]).toBe(41);
  });

  it('clamps rather than returning an empty page past the end', () => {
    expect(pageSlice(items, 99, 20)).toEqual(pageSlice(items, 3, 20));
  });

  it('handles an empty list', () => {
    expect(pageSlice([], 1, 20)).toEqual([]);
  });
});

describe('pageRange', () => {
  it('reports the 1-based span of the visible rows', () => {
    expect(pageRange(1, 20, 51)).toEqual({ from: 1, to: 20, total: 51 });
    expect(pageRange(2, 20, 51)).toEqual({ from: 21, to: 40, total: 51 });
    expect(pageRange(3, 20, 51)).toEqual({ from: 41, to: 51, total: 51 });
  });

  it('reports zeroes for an empty list instead of "1–0"', () => {
    expect(pageRange(1, 20, 0)).toEqual({ from: 0, to: 0, total: 0 });
  });

  it('never runs past the total on the last page', () => {
    expect(pageRange(3, 20, 41).to).toBe(41);
  });
});

describe('pageWindow', () => {
  it('lists every page when they all fit', () => {
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(2, 5, 2)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps first, last and the neighbours of the current page', () => {
    expect(pageWindow(6, 12)).toEqual([1, 'gap', 5, 6, 7, 'gap', 12]);
  });

  it('shows a lone skipped number instead of an ellipsis', () => {
    // 1 … 3 4 5 would hide only page 2 — the ellipsis is wider than the number.
    expect(pageWindow(4, 12)).toEqual([1, 2, 3, 4, 5, 'gap', 12]);
  });

  it('never repeats a page number', () => {
    for (let total = 1; total <= 15; total++) {
      for (let current = 1; current <= total; current++) {
        const win = pageWindow(current, total).filter((p): p is number => p !== 'gap');
        expect(new Set(win).size).toBe(win.length);
      }
    }
  });

  it('always includes the current, first and last page', () => {
    for (let total = 1; total <= 15; total++) {
      for (let current = 1; current <= total; current++) {
        const win = pageWindow(current, total);
        expect(win).toContain(current);
        expect(win).toContain(1);
        expect(win).toContain(total);
      }
    }
  });

  it('stays ascending with no gap at either edge', () => {
    for (let total = 1; total <= 20; total++) {
      for (let current = 1; current <= total; current++) {
        const win = pageWindow(current, total);
        expect(win[0]).toBe(1);
        expect(win[win.length - 1]).toBe(total);
        const nums = win.filter((p): p is number => p !== 'gap');
        expect([...nums].sort((a, b) => a - b)).toEqual(nums);
      }
    }
  });

  it('handles a single page', () => {
    expect(pageWindow(1, 1)).toEqual([1]);
  });

  it('clamps a current page outside the range', () => {
    expect(pageWindow(99, 4)).toEqual([1, 2, 3, 4]);
  });
});
