/**
 * סצנה 6 — הרמוניה ומעגליות: מהזרע לצלחת ובחזרה לאדמה
 * ~4.6ש | 140f
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const NODES = ['🌱', '🧑‍🌾', '🥬', '🍽️', '🌍'];

export const S6_Circle: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(2);
  const R = 175;
  const rot = (frame / 90) * Math.PI * 2; // סיבוב איטי של המעגל
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 30}}>
      <div style={{...title}}>
        <GoldText size={54} weight={900}>מעגל אחד שלם והרמוני</GoldText>
      </div>

      <div style={{position: 'relative', width: 460, height: 460}}>
        {/* טבעת */}
        <div style={{
          position: 'absolute', inset: 60, borderRadius: '50%',
          border: `2px dashed ${theme.colors.green}`, opacity: 0.5,
        }} />
        {NODES.map((icon, i) => {
          const a = rot + (i / NODES.length) * Math.PI * 2;
          const x = 230 + Math.cos(a) * R;
          const y = 230 + Math.sin(a) * R;
          const pop = interpolate(frame, [10 + i * 8, 26 + i * 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div key={i} style={{
              position: 'absolute', left: x - 40, top: y - 40,
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(91,226,169,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 42, opacity: pop, transform: `scale(${pop})`,
            }}>{icon}</div>
          );
        })}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 64,
        }}>🔄</div>
      </div>

      <div style={{fontFamily: theme.font, fontSize: 28, fontWeight: 600, color: theme.colors.muted, direction: 'rtl', textAlign: 'center'}}>
        בלי בזבוז, בלי מתווכים מיותרים — קשר ישיר בין נותן לצרכן
      </div>
    </AbsoluteFill>
  );
};
