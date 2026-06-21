import React from 'react';
import {Composition} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Rubik';
import {Promo, SCENES, TRANSITION} from './Promo';

// Load only the weights we use, and include the Hebrew subset so the RTL copy renders.
loadFont('normal', {
  weights: ['400', '500', '600', '700', '800', '900'],
  subsets: ['hebrew', 'latin'],
});

// TransitionSeries total = sum(scenes) - sum(transitions).
const DURATION = SCENES.reduce((a, b) => a + b, 0) - (SCENES.length - 1) * TRANSITION;

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
    </>
  );
};
