/**
 * סצנה 7 — CTA: בואו נגדל ביחד
 * ~4.3ש | 130f
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {Wordmark, useRise} from '../components';

export const S7_GrowCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const mark = spring({frame, fps, config: {damping: 16}});
  const line1 = useRise(18);
  const btn = useRise(36);
  const url = useRise(54);
  const pulse = 1 + Math.sin(frame / 12) * 0.04;

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 0}}>
      <div style={{opacity: mark, transform: `scale(${interpolate(mark, [0, 1], [0.7, 1])})`, marginBottom: 26}}>
        <Wordmark size={140} />
      </div>

      <div style={{
        ...line1,
        fontFamily: theme.font, fontWeight: 600, fontSize: 40,
        color: theme.colors.muted, direction: 'rtl', marginBottom: 30, textAlign: 'center',
      }}>
        יש לכם קרקע, ידיים, שתילים — או רעב לאוכל אמיתי?
      </div>

      <div style={{
        ...btn,
        transform: `${btn.transform} scale(${pulse})`,
        background: theme.gradients.green, color: theme.colors.navy,
        fontFamily: theme.font, fontWeight: 900, fontSize: 48,
        padding: '20px 60px', borderRadius: 999,
        boxShadow: '0 0 55px rgba(46,255,168,0.5)',
        direction: 'rtl', marginBottom: 26,
      }}>
        ✿ בואו נגדל ביחד
      </div>

      <div style={{
        ...url,
        fontFamily: 'monospace', fontSize: 50, fontWeight: 800,
        color: theme.colors.white, letterSpacing: 2,
      }}>
        1lev1.com/grow
      </div>
    </AbsoluteFill>
  );
};
