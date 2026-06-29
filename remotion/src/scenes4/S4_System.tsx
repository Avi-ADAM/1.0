/**
 * סצנה 4 — המערכת רושמת שעות ומשאבים ומחלקת בהוגנות
 * ~5ש | 150f
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const LEDGER = [
  {who: '🌍 קרקע', val: '40%'},
  {who: '🌱 שתילים', val: '20%'},
  {who: '🧑‍🌾 שעות טיפול', val: '30%'},
  {who: '🤝 החלפות', val: '10%'},
];

const Row: React.FC<{who: string; val: string; delay: number}> = ({who, val, delay}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const barW = interpolate(frame, [delay + 8, delay + 32], [0, parseInt(val, 10)], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{opacity: op, direction: 'rtl', display: 'flex', alignItems: 'center', gap: 18, width: 720}}>
      <span style={{fontFamily: theme.font, fontWeight: 700, fontSize: 32, color: theme.colors.white, width: 230}}>{who}</span>
      <div style={{flex: 1, height: 26, borderRadius: 13, background: 'rgba(255,255,255,0.08)', overflow: 'hidden'}}>
        <div style={{width: `${barW}%`, height: '100%', background: theme.gradients.green, borderRadius: 13}} />
      </div>
      <span style={{fontFamily: theme.font, fontWeight: 800, fontSize: 30, color: theme.colors.green, width: 80}}>{val}</span>
    </div>
  );
};

export const S4_System: React.FC = () => {
  const title = useRise(2);
  const foot = useRise(110);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 22, padding: 60}}>
      <div style={{...title, marginBottom: 6}}>
        <GoldText size={52} weight={900}>חלוקה הוגנת — שקופה ומדידה</GoldText>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', gap: 16}}>
        {LEDGER.map((r, i) => (
          <Row key={r.who} who={r.who} val={r.val} delay={20 + i * 18} />
        ))}
      </div>
      <div style={{...foot, fontFamily: theme.font, fontSize: 28, fontWeight: 600, color: theme.colors.muted, direction: 'rtl', textAlign: 'center'}}>
        אין "בעלים" אחד ו"עובדים" — רשת של נותנים, לכל אחד חלק
      </div>
    </AbsoluteFill>
  );
};
