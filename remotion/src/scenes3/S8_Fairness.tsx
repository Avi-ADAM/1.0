/**
 * סצנה 8 — הוגנות: הכסף מתחלק, כולם מרוצים
 * ~5ש | 150f
 *
 * מדגים שהמחיר שהוסכם עליו עובר אשרור ואז מועבר ישירות לספק
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const MoneyFlow: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 16}});
  const progress = interpolate(frame, [delay + 20, delay + 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const nodes = [
    {label: 'צרכן', icon: '🙋', x: 0},
    {label: '1💗1', icon: '💗', x: 1},
    {label: 'ספא', icon: '💆', x: 2},
    {label: 'בייביסיטר', icon: '👶', x: 3},
    {label: 'נהג', icon: '🚗', x: 4},
  ];
  const NODE_W = 170;

  return (
    <div style={{opacity: s, position: 'relative', width: '100%', height: 160, marginTop: 12}}>
      {/* Flow line */}
      <div style={{
        position: 'absolute', top: 42, left: 0, right: 0, height: 4,
        background: 'rgba(255,255,255,0.08)', borderRadius: 4,
      }} />
      <div style={{
        position: 'absolute', top: 42, left: 0,
        width: `${progress * 100}%`, height: 4,
        background: theme.gradients.green, borderRadius: 4,
        transition: 'width 0.05s',
        boxShadow: '0 0 16px rgba(46,255,168,0.5)',
      }} />

      {/* Nodes */}
      {nodes.map((n, i) => {
        const pct = i / (nodes.length - 1);
        const reached = progress >= pct - 0.05;
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `calc(${pct * 100}% - 42px)`,
            top: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%', fontSize: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: reached ? 'rgba(91,226,169,0.2)' : 'rgba(255,255,255,0.06)',
              border: `2px solid ${reached ? theme.colors.green : 'rgba(255,255,255,0.12)'}`,
              boxShadow: reached ? '0 0 22px rgba(91,226,169,0.4)' : 'none',
              transition: 'all 0.15s',
            }}>{n.icon}</div>
            <div style={{fontFamily: theme.font, fontSize: 18, color: reached ? theme.colors.white : theme.colors.muted, fontWeight: 600}}>{n.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const Principle: React.FC<{icon: string; text: string; delay: number}> = ({icon, text, delay}) => {
  const rise = useRise(delay);
  return (
    <div style={{...rise, display: 'flex', alignItems: 'center', gap: 16, direction: 'rtl', marginBottom: 14}}>
      <div style={{fontSize: 38, flexShrink: 0}}>{icon}</div>
      <div style={{fontFamily: theme.font, fontWeight: 600, fontSize: 28, color: theme.colors.white}}>{text}</div>
    </div>
  );
};

export const S8_Fairness: React.FC = () => {
  const title = useRise(4);
  const sub = useRise(20);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: '55px 100px'}}>
      <div style={{...title, marginBottom: 10, textAlign: 'center'}}>
        <GoldText size={56} weight={900}>הגנה, הוגנות, שקיפות — לשני הצדדים</GoldText>
      </div>
      <div style={{...sub, fontFamily: theme.font, fontSize: 28, color: theme.colors.muted, textAlign: 'center', direction: 'rtl', marginBottom: 28, lineHeight: 1.5}}>
        הכסף עובר ישירות לספקים לאחר אישור ביצוע — לפי המחיר שהוסכם עליו, ולא שקל אחר.
      </div>

      <MoneyFlow delay={34} />

      <div style={{marginTop: 32, width: '100%', maxWidth: 900}}>
        <Principle icon="🤝" text="המחיר שסוכם — הוא המחיר שמשולם" delay={80} />
        <Principle icon="🔒" text="ביצוע חייב אישור לפני העברת כסף" delay={96} />
        <Principle icon="⚡" text="ספק שמבטל ללא סיבה — מקבל משוב ציבורי" delay={112} />
        <Principle icon="💗" text="הכל על בסיס הסכמה — צרכן, ספק ו-1💗1" delay={128} />
      </div>
    </AbsoluteFill>
  );
};
