/**
 * Element tree → PNG, for the share cards.
 *
 * satori lays the tree out and emits SVG with every glyph already converted to
 * a path (so resvg needs no fonts of its own — and no system fonts: the Docker
 * image is alpine with none installed). resvg then rasterises. ~150–250 ms per
 * card on a small VPS; the endpoint caches for an hour and the chat apps cache
 * the result on their side, so this runs a handful of times per shared link.
 *
 * Both libraries are loaded lazily: `@resvg/resvg-js` is a native module, and
 * nothing else in the server should pay for it (or fail on a platform without
 * a prebuilt binary) unless a card is actually requested.
 */
import type { OgNode } from './cards.js';
import { OG_HEIGHT, OG_WIDTH } from './cards.js';
import { ogFonts } from './fonts.js';

export async function renderCardSvg(tree: OgNode): Promise<string> {
  const { default: satori } = await import('satori');
  return satori(tree as any, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: ogFonts() as any
  });
}

export async function renderCardPng(tree: OgNode): Promise<Buffer> {
  const svg = await renderCardSvg(tree);
  const { Resvg } = await import('@resvg/resvg-js');
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
  return Buffer.from(png);
}
