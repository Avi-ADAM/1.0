/**
 * סצנה 9 — חלוקת רווחים דינמית
 * ~5ש | frame 0–150
 *
 * ויזואליזציה: עמוד + אחוז לכל חבר, חישוב מתוך שקלול תרומות
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

interface MemberBarProps {
  emoji: string; name: string; pct: number; delay: number;
}

const MemberBar: React.FC<MemberBarProps> = ({emoji, name, pct, delay}) => {
  const frame = useCurrentFrame();
  const filled = interpolate(frame, [delay, delay + 30], [0, pct], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = interpolate(frame, [delay - 6, delay + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <div style={{opacity, display: 'flex', alignItems: 'center', gap: 18, direction: 'rtl', width: '100%'}}>
      <div style={{fontSize: 38, width: 44, textAlign: 'center'}}>{emoji}</div>
      <div style={{fontFamily: theme.font, fontWeight: 600, fontSize: 26, color: theme.colors.white, width: 100}}>{name}</div>
      <div style={{flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 28, overflow: 'hidden'}}>
        <div style={{
          width: `${filled}%`, height: '100%', borderRadius: 8,
          background: theme.gradients.gold,
          transition: 'width 0.05s',
        }} />
      </div>
      <div style={{fontFamily: 'monospace', fontWeight: 800, fontSize: 28, color: theme.colors.goldB, width: 70, textAlign: 'left'}}>
        {Math.round(filled)}%
      </div>
    </div>
  );
};

export const S9_Revenue: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const formula = useRise(28);
  const note = useRise(110);

  const members = [
    {emoji: '👩‍💼', name: 'דנה', pct: 38, delay: 40},
    {emoji: '👨‍🔧', name: 'יוסי', pct: 27, delay: 55},
    {emoji: '🧑‍🎨', name: 'ריטה', pct: 20, delay: 70},
    {emoji: '👨‍💻', name: 'עמוס', pct: 15, delay: 85},
  ];

  const totalPot = interpolate(frame, [40, 100], [0, 14800], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: '60px 120px', gap: 20}}>
      <div style={{...title}}>
        <GoldText size={60} weight={900}>חלוקת רווחים — הוגנת ושקופה</GoldText>
      </div>

      <div style={{...formula, direction: 'rtl', textAlign: 'center',
        fontFamily: theme.font, fontSize: 28, color: theme.colors.muted, lineHeight: 1.5, marginBottom: 16,
      }}>
        חלק כל חבר = <span style={{color: theme.colors.green, fontWeight: 700}}>תרומה יחסית</span> × סך ההכנסות
        <br />
        (מחושב אוטומטית מסך המשימות + המשאבים שאישרר)
      </div>

      {/* Total pot */}
      <div style={{
        fontFamily: 'monospace', fontSize: 52, fontWeight: 900,
        color: theme.colors.goldB, marginBottom: 8,
        textShadow: `0 0 30px ${theme.colors.goldA}`,
      }}>
        ₪{Math.round(totalPot).toLocaleString()}
      </div>
      <div style={{fontFamily: theme.font, fontSize: 24, color: theme.colors.muted, marginBottom: 24}}>סה"כ לחלוקה החודש</div>

      {/* Bars */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 900}}>
        {members.map((m, i) => <MemberBar key={i} {...m} />)}
      </div>

      <div style={{...note, marginTop: 16,
        fontFamily: theme.font, fontSize: 24, color: theme.colors.muted,
        direction: 'rtl', textAlign: 'center',
      }}>
        🔒 כל חלוקה עוברת אשרור לפני שנרשמת — לא נזוז ללא הסכמה
      </div>
    </AbsoluteFill>
  );
};
