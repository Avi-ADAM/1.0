import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {Wordmark, useRise} from '../components';

/** Scene 5 — call to action + URL. */
export const CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const mark = spring({frame, fps, config: {damping: 16}});
  const cta = useRise(22);
  const url = useRise(40);
  const pulse = 1 + Math.sin(frame / 14) * 0.04;

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{transform: `scale(${interpolate(mark, [0, 1], [0.7, 1])})`, opacity: mark}}>
        <Wordmark size={170} />
      </div>

      <div
        style={{
          ...cta,
          marginTop: 50,
          transform: `${cta.transform} scale(${pulse})`,
          padding: '26px 70px',
          borderRadius: 999,
          background: theme.gradients.green,
          color: theme.colors.navy,
          fontFamily: theme.font,
          fontWeight: 900,
          fontSize: 52,
          direction: 'rtl',
          boxShadow: '0 0 50px rgba(46,255,168,0.5)',
        }}
      >
        בואו לשנות את העולם, ביחד
      </div>

      <div
        style={{
          ...url,
          marginTop: 40,
          fontFamily: theme.font,
          fontWeight: 700,
          fontSize: 56,
          letterSpacing: 2,
          color: theme.colors.white,
        }}
      >
        1lev1.com
      </div>
    </AbsoluteFill>
  );
};
