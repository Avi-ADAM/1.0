/**
 * סצנה 2 — החסמים של לפתוח עסק גידול לבד
 * ~5.5ש | 165f
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const BARRIERS = [
  {icon: '🌍', text: 'אין קרקע'},
  {icon: '💰', text: 'אין הון לשתילים וציוד'},
  {icon: '🛒', text: 'אין לקוחות — והתוצרת לפח'},
  {icon: '😮‍💨', text: 'לבד מהבוקר עד הלילה'},
];

const BarrierCard: React.FC<{icon: string; text: string; delay: number}> = ({icon, text, delay}) => {
  const frame = useCurrentFrame();
  const rise = useRise(delay);
  // קו מחיקה אדום שנמתח אחרי שהכרטיס נכנס
  const strike = interpolate(frame, [delay + 22, delay + 40], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{
      ...rise,
      position: 'relative',
      direction: 'rtl',
      width: 540,
      padding: '24px 32px',
      borderRadius: 22,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,77,158,0.3)',
      display: 'flex', alignItems: 'center', gap: 18,
    }}>
      <span style={{fontSize: 48}}>{icon}</span>
      <span style={{fontFamily: theme.font, fontWeight: 700, fontSize: 38, color: theme.colors.white}}>{text}</span>
      <div style={{
        position: 'absolute', insetInlineStart: 24, insetInlineEnd: 24, top: '52%',
        height: 4, background: theme.colors.pink, borderRadius: 2,
        transform: `scaleX(${strike})`, transformOrigin: 'right',
        boxShadow: '0 0 14px rgba(255,77,158,0.7)',
      }} />
    </div>
  );
};

export const S2_Barriers: React.FC = () => {
  const title = useRise(2);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 22, padding: 60}}>
      <div style={{...title, marginBottom: 8}}>
        <GoldText size={54} weight={900}>לפתוח עסק גידול לבד?</GoldText>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
        {BARRIERS.map((b, i) => (
          <BarrierCard key={b.text} icon={b.icon} text={b.text} delay={20 + i * 16} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
