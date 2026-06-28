import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {linearTiming, TransitionSeries} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {slide} from '@remotion/transitions/slide';
import {Background} from './components';
import {Logo} from './scenes/Logo';
import {Hook} from './scenes/Hook';
import {Concept} from './scenes/Concept';
import {Features} from './scenes/Features';
import {CTA} from './scenes/CTA';

/**
 * Scene durations in frames (at 30fps). Total = 96 + 132 + 168 + 252 + 192 = 840 frames = 28s.
 * Transitions overlap by 18f, so set the composition durationInFrames a touch lower (see Root).
 */
export const SCENES = [96, 132, 168, 252, 192] as const;
export const TRANSITION = 18;

/** Set to true and drop a track at remotion/public/music.mp3 to add a soundtrack. */
const WITH_MUSIC = false;

export const Promo: React.FC = () => {
  const t = linearTiming({durationInFrames: TRANSITION});
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENES[0]}>
          <Logo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence durationInFrames={SCENES[1]}>
          <Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-right'})} timing={t} />

        <TransitionSeries.Sequence durationInFrames={SCENES[2]}>
          <Concept />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={t} />

        <TransitionSeries.Sequence durationInFrames={SCENES[3]}>
          <Features />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={slide({direction: 'from-bottom'})} timing={t} />

        <TransitionSeries.Sequence durationInFrames={SCENES[4]}>
          <CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {WITH_MUSIC ? <Audio src={staticFile('music.mp3')} volume={0.5} /> : null}
    </AbsoluteFill>
  );
};
