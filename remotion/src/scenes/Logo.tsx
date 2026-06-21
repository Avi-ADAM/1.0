import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {Wordmark} from '../components';

/** Scene 1 — logo reveal + tagline. */
export const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({frame, fps, config: {damping: 14, mass: 0.9}});
  const scale = interpolate(enter, [0, 1], [0.6, 1]);
  const tagline = spring({frame: frame - 28, fps, config: {damping: 20}});

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{transform: `scale(${scale})`, opacity: enter}}>
        <Wordmark size={220} />
      </div>
      <div
        style={{
          marginTop: 36,
          opacity: tagline,
          transform: `translateY(${interpolate(tagline, [0, 1], [24, 0])}px)`,
          fontFamily: theme.font,
          fontWeight: 600,
          fontSize: 46,
          color: theme.colors.green,
          direction: 'rtl',
          letterSpacing: 1,
        }}
      >
        שותפות. בהסכמה מלאה.
      </div>
    </AbsoluteFill>
  );
};
