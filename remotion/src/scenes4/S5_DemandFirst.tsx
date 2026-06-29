/**
 * סצנה 5 — מתחילים מהלקוח: סל ירקות שבועי, והעסק נבנה סביב הצורך
 * ~6ש | 180f
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const STEPS = [
  {n: '1', text: 'אנשים מאזור מבקשים סל ירקות שבועי'},
  {n: '2', text: 'סביבם — החקלאי/ת מתארגן/ת עם בעלי השטח'},
  {n: '3', text: 'מגדלים בדיוק מה שהוזמן — בלי לזרוק'},
];

const Step: React.FC<{n: string; text: string; delay: number}> = ({n, text, delay}) => {
  const rise = useRise(delay);
  return (
    <div style={{...rise, direction: 'rtl', display: 'flex', alignItems: 'center', gap: 18, width: 820}}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
        background: theme.gradients.green, color: theme.colors.navy,
        fontFamily: theme.font, fontWeight: 900, fontSize: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{n}</div>
      <span style={{fontFamily: theme.font, fontWeight: 600, fontSize: 34, color: theme.colors.white}}>{text}</span>
    </div>
  );
};

export const S5_DemandFirst: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = useRise(2);
  const basket = spring({frame: frame - 110, fps, config: {damping: 12}});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 24, padding: 60}}>
      <div style={{...title}}>
        <GoldText size={54} weight={900}>מתחילים מהלקוח — לא מהסיכון</GoldText>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
        {STEPS.map((s, i) => (
          <Step key={s.n} n={s.n} text={s.text} delay={18 + i * 20} />
        ))}
      </div>
      <div style={{
        opacity: basket,
        transform: `scale(${interpolate(basket, [0, 1], [0.8, 1])})`,
        background: 'rgba(91,226,169,0.12)',
        border: `1.5px solid ${theme.colors.green}`,
        borderRadius: 999, padding: '16px 40px',
        fontFamily: theme.font, fontWeight: 800, fontSize: 36,
        color: theme.colors.white, direction: 'rtl',
        boxShadow: '0 0 40px rgba(91,226,169,0.25)',
      }}>
        🥬 סל שבועי, מקומי וטרי — סביב מי שבאמת רוצה אותו
      </div>
    </AbsoluteFill>
  );
};
