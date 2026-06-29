/**
 * סצנה 1 — כותרת: "לגדל ביחד"
 * ~3.3ש | 100f
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {GoldText, Wordmark, useRise} from '../components';

export const S1_GrowTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 14}});
  const tag = useRise(20);
  const sub = useRise(40);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 0}}>
      <div style={{opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])})`, marginBottom: 18}}>
        <Wordmark size={120} />
      </div>

      <div style={{...tag, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 18}}>
        <span style={{fontSize: 70}}>🌱</span>
        <GoldText size={86} weight={900}>לגדל ביחד</GoldText>
        <span style={{fontSize: 70}}>🌍</span>
      </div>

      <div style={{...sub, fontFamily: theme.font, fontSize: 38, fontWeight: 500, color: theme.colors.green, direction: 'rtl', letterSpacing: 0.5, textAlign: 'center'}}>
        מקצוע אקולוגי מתחיל מהקהילה — לא מהסיכון
      </div>
    </AbsoluteFill>
  );
};
