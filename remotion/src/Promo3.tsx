/**
 * 1💗1 — Concierge Video  (~43 שניות)
 *
 * סרטון צרכני: במקום לחפש — תגידו מה אתם רוצים.
 * Lev מנתחת, ספקים מהקהילה מציעים, הכל בהסכמה ומו"מ לאורך הדרך.
 *
 * תוכן: /concierge + /concierge/new + /concierge/[id] + AcceptWishOffer + IncomingWishCard
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade}  from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe}  from '@remotion/transitions/wipe';
import {Background} from './components';

import {S1_ConsTitle}  from './scenes3/S1_ConsTitle';
import {S2_CreateWish} from './scenes3/S2_CreateWish';
import {S3_LevAnalysis} from './scenes3/S3_LevAnalysis';
import {S4_Matching}   from './scenes3/S4_Matching';
import {S5_ProviderSide} from './scenes3/S5_ProviderSide';
import {S6_NegoCons}   from './scenes3/S6_NegoCons';
import {S7_WishView}   from './scenes3/S7_WishView';
import {S8_Fairness}   from './scenes3/S8_Fairness';
import {S9_Fulfilled}  from './scenes3/S9_Fulfilled';
import {S10_ConsCTA}   from './scenes3/S10_ConsCTA';

// Frame durations @ 30fps
export const SCENES3 = [105, 180, 150, 165, 150, 180, 165, 150, 135, 120] as const;
export const TRANSITION3 = 18;

const WITH_MUSIC = false;

export const Promo3: React.FC = () => {
  const ft = linearTiming({durationInFrames: TRANSITION3});
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES3[0]}><S1_ConsTitle /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES3[1]}><S2_CreateWish /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES3[2]}><S3_LevAnalysis /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({direction: 'from-right'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES3[3]}><S4_Matching /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES3[4]}><S5_ProviderSide /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-left'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES3[5]}><S6_NegoCons /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({direction: 'from-left'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES3[6]}><S7_WishView /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES3[7]}><S8_Fairness /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES3[8]}><S9_Fulfilled /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES3[9]}><S10_ConsCTA /></TransitionSeries.Sequence>
      </TransitionSeries>

      {WITH_MUSIC ? <Audio src={staticFile('music3.mp3')} volume={0.45} /> : null}
    </AbsoluteFill>
  );
};
