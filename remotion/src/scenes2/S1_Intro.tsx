/**
 * סצנה 1 — כותרת: "איך עובד הפרויקט ב-1💗1"
 * ~3.5ש | frame 0–105
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {GoldText, Wordmark, useRise} from '../components';

export const S1_Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 14}});
  const sub = useRise(22);
  const steps = useRise(42);

  const flowSteps = ['הרשמה', 'ריקמה', 'משימות', 'אשרור', 'חלוקה'];

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 0}}>
      <div style={{opacity: enter, transform: `scale(${interpolate(enter, [0, 1], [0.7, 1])})`}}>
        <Wordmark size={130} />
      </div>

      <div style={{marginTop: 28, ...sub}}>
        <GoldText size={72} weight={900}>מהרשמה ועד חלוקת רווחים</GoldText>
      </div>

      <div style={{...steps, marginTop: 36, display: 'flex', gap: 18, alignItems: 'center'}}>
        {flowSteps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{
              background: 'rgba(91,226,169,0.12)',
              border: `1.5px solid ${theme.colors.green}`,
              borderRadius: 14,
              padding: '10px 24px',
              fontFamily: theme.font,
              fontWeight: 700,
              fontSize: 30,
              color: theme.colors.green,
            }}>{s}</div>
            {i < flowSteps.length - 1 && (
              <div style={{color: theme.colors.muted, fontSize: 30}}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </AbsoluteFill>
  );
};
