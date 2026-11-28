import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { NODES, EDGES, STORIES, DOORS, VIEW_H, HALF_H } from './structureGraph.js';

const LOCALES = ['he', 'en', 'ar', 'ru', 'es'];
const load = (l: string) =>
  JSON.parse(
    fs.readFileSync(path.resolve(__dirname, `../../translations/${l}/structure.json`), 'utf8')
  );

const nodeKeys = new Set(NODES.map((n) => n.key));
const edgeKeys = new Set(EDGES.map((e) => e.key));

describe('structure map', () => {
  it('joins only boxes that exist', () => {
    for (const e of EDGES) {
      expect(nodeKeys.has(e.from), e.key).toBe(true);
      expect(nodeKeys.has(e.to), e.key).toBe(true);
    }
  });

  it('keeps every box inside the drawing', () => {
    for (const n of NODES) {
      expect(n.x - n.w / 2, n.key).toBeGreaterThanOrEqual(0);
      expect(n.x + n.w / 2, n.key).toBeLessThanOrEqual(100);
      expect(n.y - HALF_H, n.key).toBeGreaterThanOrEqual(0);
      expect(n.y + HALF_H, n.key).toBeLessThanOrEqual(VIEW_H);
    }
  });

  it('lights only boxes and arrows that exist, and each lit arrow touches a lit box', () => {
    for (const [name, steps] of Object.entries(STORIES)) {
      for (const s of steps) {
        for (const n of s.nodes) expect(nodeKeys.has(n), `${name}/${s.text}/${n}`).toBe(true);
        for (const k of s.edges) {
          expect(edgeKeys.has(k), `${name}/${s.text}/${k}`).toBe(true);
          const e = EDGES.find((x) => x.key === k)!;
          expect(s.nodes.includes(e.from) && s.nodes.includes(e.to), `${name}/${s.text}/${k}`).toBe(true);
        }
      }
    }
  });

  it('starts each story from its own way in', () => {
    expect(STORIES.request[0].nodes).toContain('customer');
    expect(STORIES.dream[0].nodes).toContain('founder');
  });

  it.each(LOCALES)('has every string in %s', (l) => {
    const d = load(l);
    for (const k of [...nodeKeys, 'partners', 'consent']) {
      expect(d.nodes[k]?.label, `${l} nodes.${k}.label`).toBeTruthy();
      expect(d.nodes[k]?.desc, `${l} nodes.${k}.desc`).toBeTruthy();
    }
    for (const steps of Object.values(STORIES))
      for (const s of steps) expect(d.steps[s.text], `${l} steps.${s.text}`).toBeTruthy();
    for (const door of DOORS)
      for (const f of ['title', 'desc', 'cta'])
        expect(d.doors[door.key]?.[f], `${l} doors.${door.key}.${f}`).toBeTruthy();
    for (const n of NODES)
      for (const who of n.people ?? [])
        expect(d.partners[n.people!.length === 1 ? who : `${who}Short`], `${l} partners.${who}`).toBeTruthy();
    expect(d.controls.step).toContain('{{current}}');
    expect(d.controls.step).toContain('{{total}}');
  });
});
