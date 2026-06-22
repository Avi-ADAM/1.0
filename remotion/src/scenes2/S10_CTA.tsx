/**
 * סצנה 10 — CTA סיום
 * ~4ש | frame 0–120
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {Wordmark, useRise} from '../components';

export const S10_CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const mark = spring({frame, fps, config: {damping: 16}});
  const line1 = useRise(22);
  const btn = useRise(40);
  const url = useRise(56);
  const pulse = 1 + Math.sin(frame / 12) * 0.04;

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 0}}>
      <div style={{opacity: mark, transform: `scale(${interpolate(mark, [0, 1], [0.7, 1])})`, marginBottom: 32}}>
        <Wordmark size={150} />
      </div>

      <div style={{
        ...line1,
        fontFamily: theme.font, fontWeight: 700, fontSize: 40,
        color: theme.colors.muted, direction: 'rtl', marginBottom: 32,
      }}>
        שיתוף פעולה אמיתי — מהרעיון ועד לחלוקת הרווחים
      </div>

      <div style={{
        ...btn,
        transform: `${btn.transform} scale(${pulse})`,
        background: theme.gradients.green,
        color: theme.colors.navy,
        fontFamily: theme.font, fontWeight: 900, fontSize: 48,
        padding: '22px 60px', borderRadius: 999,
        boxShadow: '0 0 55px rgba(46,255,168,0.5)',
        direction: 'rtl',
        marginBottom: 28,
      }}>
        הקימו ריקמה עכשיו — בחינם
      </div>

      <div style={{
        ...url,
        fontFamily: 'monospace', fontSize: 52, fontWeight: 800,
        color: theme.colors.white, letterSpacing: 2,
      }}>
        1lev1.com
      </div>
    </AbsoluteFill>
  );
};
