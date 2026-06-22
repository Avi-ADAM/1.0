import React from 'react';
import {Composition} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Rubik';
import {Promo, SCENES, TRANSITION} from './Promo';
import {Promo2, SCENES2, TRANSITION2} from './Promo2';
import {Promo3, SCENES3, TRANSITION3} from './Promo3';

// Load only the weights we use, and include the Hebrew subset so the RTL copy renders.
loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['hebrew', 'latin'],
});

// TransitionSeries total = sum(scenes) - sum(transitions between them).
const DURATION  = SCENES.reduce((a, b)  => a + b, 0) - (SCENES.length  - 1) * TRANSITION;
const DURATION2 = SCENES2.reduce((a, b) => a + b, 0) - (SCENES2.length - 1) * TRANSITION2;
const DURATION3 = SCENES3.reduce((a, b) => a + b, 0) - (SCENES3.length - 1) * TRANSITION3;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ─── PROMO 1: Brand intro ─── */}

      {/* Landscape — for the website hero / YouTube */}
      <Composition
        id="Promo-Landscape"
        component={Promo}
        durationInFrames={DURATION}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Vertical — for Reels / Stories / TikTok */}
      <Composition
        id="Promo-Vertical"
        component={Promo}
        durationInFrames={DURATION}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Square — for feed posts */}
      <Composition
        id="Promo-Square"
        component={Promo}
        durationInFrames={DURATION}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* ─── PROMO 2: Process walkthrough ─── */}

      {/* Landscape — YouTube / website explainer */}
      <Composition
        id="Promo2-Landscape"
        component={Promo2}
        durationInFrames={DURATION2}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Vertical — Reels / Stories */}
      <Composition
        id="Promo2-Vertical"
        component={Promo2}
        durationInFrames={DURATION2}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Square — feed post */}
      <Composition
        id="Promo2-Square"
        component={Promo2}
        durationInFrames={DURATION2}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* ─── PROMO 3: Concierge — consumer video ─── */}

      <Composition
        id="Promo3-Landscape"
        component={Promo3}
        durationInFrames={DURATION3}
        fps={30}
        width={1920}
        height={1080}
      />

      <Composition
        id="Promo3-Vertical"
        component={Promo3}
        durationInFrames={DURATION3}
        fps={30}
        width={1080}
        height={1920}
      />

      <Composition
        id="Promo3-Square"
        component={Promo3}
        durationInFrames={DURATION3}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
