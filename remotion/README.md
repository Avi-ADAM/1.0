# 1💗1 Promo Video (Remotion)

A code-driven promotional video for **[1lev1.com](https://1lev1.com)** — the
consensus-based partnership platform. Built with [Remotion](https://remotion.dev)
so the video is fully versioned, editable and re-renderable.

## Quick start

```bash
cd remotion
npm install          # or: pnpm install / yarn
npm run dev          # opens Remotion Studio at http://localhost:3000
```

In the Studio you can scrub the timeline, tweak text/colors live, and preview
all three formats.

## Render

```bash
npm run render            # 1920x1080 landscape  -> out/promo-landscape.mp4
npm run render:vertical   # 1080x1920 reels      -> out/promo-vertical.mp4
npm run render:square     # 1080x1080 feed       -> out/promo-square.mp4
```

Requires Node 18+ and (for rendering) Chrome/Chromium, which Remotion installs
automatically on first render.

## Structure

| File | Role |
| --- | --- |
| `src/Root.tsx` | Registers the three compositions (landscape / vertical / square) |
| `src/Promo.tsx` | Assembles the 5 scenes with transitions + optional music |
| `src/theme.ts` | Brand tokens (colors, gold gradient, Rubik font) from the live site |
| `src/components.tsx` | Reusable bits: `Background`, `Wordmark`, `GoldText`, `FeatureCard` |
| `src/scenes/Logo.tsx` | Scene 1 — logo reveal |
| `src/scenes/Hook.tsx` | Scene 2 — the pain-point hook |
| `src/scenes/Concept.tsx` | Scene 3 — the "Rikma" / consensus animation |
| `src/scenes/Features.tsx` | Scene 4 — four headline features |
| `src/scenes/CTA.tsx` | Scene 5 — call to action + URL |

## Customizing

- **Text / wording** → edit the relevant `src/scenes/*.tsx`. All copy is Hebrew (RTL).
- **Colors** → `src/theme.ts`.
- **Timing** → `SCENES` array in `src/Promo.tsx` (durations in frames @ 30fps).
- **Music** → drop a track at `remotion/public/music.mp3` and set `WITH_MUSIC = true`
  in `src/Promo.tsx`.
- **Real screenshots** → drop images in `remotion/public/` and use Remotion's
  `<Img src={staticFile('shot.png')} />` inside a scene to show the actual product.

## Where this came from

This project lives alongside the main 1💗1 SvelteKit app but is **independent**
(its own `package.json`). The plan and storyboard are in
[`../docs/REMOTION_PROMO_PLAN.md`](../docs/REMOTION_PROMO_PLAN.md).
