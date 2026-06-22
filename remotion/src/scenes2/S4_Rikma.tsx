/**
 * סצנה 4 — עריכת הריקמה ופרסום
 * ~5ש | frame 0–150
 *
 * מראה: עריכת פרטי הריקמה → טיוטה → אישור → LIVE
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placeholder} from '../Placeholder';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const Tag: React.FC<{text: string; delay: number}> = ({text, delay}) => {
  const rise = useRise(delay);
  return (
    <span style={{
      ...rise, display: 'inline-block',
      background: 'rgba(191,149,63,0.2)',
      border: `1px solid ${theme.colors.goldA}`,
      color: theme.colors.goldB,
      fontFamily: theme.font, fontWeight: 600, fontSize: 24,
      padding: '6px 16px', borderRadius: 10, margin: '5px 6px',
    }}>{text}</span>
  );
};

export const S4_Rikma: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = useRise(4);

  // Publish pulse after frame 100
  const pubScale = 1 + Math.max(0, Math.sin((frame - 100) / 8)) * 0.05;
  const pubOpacity = interpolate(frame, [90, 108], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '60px 80px', gap: 60, direction: 'rtl'}}>
      {/* Right: content */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 22}}>
        <div style={{...title}}>
          <GoldText size={58} weight={900}>הגדרת הריקמה ופרסום</GoldText>
        </div>

        <div style={{fontFamily: theme.font, fontWeight: 500, fontSize: 30, color: theme.colors.muted, direction: 'rtl', lineHeight: 1.5}}>
          סיימת את הפרופיל? עכשיו מעצבים את הפרויקט המשותף.
        </div>

        <div style={{direction: 'rtl'}}>
          <Tag text="שם הריקמה" delay={18} />
          <Tag text="תחום פעילות" delay={26} />
          <Tag text="ערכי הליבה" delay={34} />
          <Tag text="מבנה חלוקה" delay={42} />
          <Tag text="גיאוגרפיה" delay={50} />
          <Tag text="שפות" delay={58} />
        </div>

        {/* Status flow */}
        <div style={{display: 'flex', alignItems: 'center', gap: 14, marginTop: 16, direction: 'rtl'}}>
          {['טיוטה', '→', 'אישור שותפים', '→'].map((s, i) => (
            <div key={i} style={{fontFamily: theme.font, fontWeight: 700, fontSize: 28, color: theme.colors.muted}}>{s}</div>
          ))}
          {/* LIVE badge */}
          <div style={{
            transform: `scale(${pubScale})`,
            opacity: pubOpacity,
            background: theme.gradients.green,
            color: theme.colors.navy,
            fontFamily: theme.font, fontWeight: 900, fontSize: 28,
            padding: '8px 24px', borderRadius: 999,
            boxShadow: '0 0 30px rgba(46,255,168,0.5)',
          }}>🚀 LIVE</div>
        </div>
      </div>

      {/* Left: screenshot */}
      <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
        <Placeholder
          kind="screenshot"
          label="מסך עריכת הריקמה"
          prompt='צילום מסך של דף "אישור פרויקט" / עריכת טיוטת הריקמה מהאתר 1lev1.com. שמור כ-public/rikma-edit.png (680×740px).'
          width={640}
          height={700}
        />
      </div>
    </AbsoluteFill>
  );
};
