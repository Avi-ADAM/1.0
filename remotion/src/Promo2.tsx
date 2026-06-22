/**
 * 1💗1 — Process Walkthrough Video
 *
 * סרטון סיור מלא בתהליך: הרשמה → ריקמה → משימות → מו"מ → אשרור → מוצרים → חלוקה
 * ~42 שניות @ 30fps
 *
 * להחלפת Placeholder בנכסים אמיתיים — ראו docs/REMOTION_PROMO2_PLAN.md
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {Background} from './components';

import {S1_Intro}       from './scenes2/S1_Intro';
import {S2_Signup}      from './scenes2/S2_Signup';
import {S3_Import}      from './scenes2/S3_Import';
import {S4_Rikma}       from './scenes2/S4_Rikma';
import {S5_Tasks}       from './scenes2/S5_Tasks';
import {S6_Negotiation} from './scenes2/S6_Negotiation';
import {S7_Approval}    from './scenes2/S7_Approval';
import {S8_Products}    from './scenes2/S8_Products';
import {S9_Revenue}     from './scenes2/S9_Revenue';
import {S10_CTA}        from './scenes2/S10_CTA';

// Duration in frames (@ 30fps) for each of the 10 scenes
export const SCENES2 = [105, 150, 135, 150, 180, 165, 150, 210, 150, 120] as const;
export const TRANSITION2 = 18;

/** Soundtrack: drop public/music2.mp3 (royalty-free) and set to true */
const WITH_MUSIC = false;

export const Promo2: React.FC = () => {
  const ft = linearTiming({durationInFrames: TRANSITION2});
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES2[0]}><S1_Intro /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES2[1]}><S2_Signup /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES2[2]}><S3_Import /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({direction: 'from-right'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES2[3]}><S4_Rikma /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-left'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES2[4]}><S5_Tasks /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES2[5]}><S6_Negotiation /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({direction: 'from-left'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES2[6]}><S7_Approval /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES2[7]}><S8_Products /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES2[8]}><S9_Revenue /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES2[9]}><S10_CTA /></TransitionSeries.Sequence>
      </TransitionSeries>

      {WITH_MUSIC ? <Audio src={staticFile('music2.mp3')} volume={0.45} /> : null}
    </AbsoluteFill>
  );
};
