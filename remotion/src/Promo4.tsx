/**
 * 1💗1 — Grow / Ecological Video  (~38 שניות)
 *
 * סרטון אקולוגי: פרנסה מהאדמה בלי לעשות את זה לבד.
 * כל חסם הופך לתפקיד של מישהו; המערכת רושמת שעות ומשאבים ומחלקת בהוגנות;
 * מתחילים מהלקוח (סל ירקות שבועי) — והעסק נבנה סביב הצורך, במעגליות והרמוניה.
 *
 * תוכן: דף הנחיתה /grow
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {wipe} from '@remotion/transitions/wipe';
import {Background} from './components';

import {S1_GrowTitle} from './scenes4/S1_GrowTitle';
import {S2_Barriers} from './scenes4/S2_Barriers';
import {S3_Weave} from './scenes4/S3_Weave';
import {S4_System} from './scenes4/S4_System';
import {S5_DemandFirst} from './scenes4/S5_DemandFirst';
import {S6_Circle} from './scenes4/S6_Circle';
import {S7_GrowCTA} from './scenes4/S7_GrowCTA';

// Frame durations @ 30fps
export const SCENES4 = [100, 165, 195, 150, 180, 140, 130] as const;
export const TRANSITION4 = 18;

const WITH_MUSIC = false;

export const Promo4: React.FC = () => {
  const ft = linearTiming({durationInFrames: TRANSITION4});
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES4[0]}><S1_GrowTitle /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES4[1]}><S2_Barriers /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES4[2]}><S3_Weave /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={wipe({direction: 'from-right'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES4[3]}><S4_System /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES4[4]}><S5_DemandFirst /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES4[5]}><S6_Circle /></TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={ft} />

        <TransitionSeries.Sequence durationInFrames={SCENES4[6]}><S7_GrowCTA /></TransitionSeries.Sequence>
      </TransitionSeries>

      {WITH_MUSIC ? <Audio src={staticFile('music4.mp3')} volume={0.45} /> : null}
    </AbsoluteFill>
  );
};
