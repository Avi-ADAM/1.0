/**
 * סצנה 6 — מו"מ: לאורך כל הדרך עד הסכמה
 * ~6ש | 180f
 *
 * מדגים: הצעה ראשונה → מו"מ → הסכמה → נעילה
 * בצד אחד: צרכן. בצד שני: ספק. Lev מגשר.
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

type Side = 'consumer' | 'provider' | 'lev';
interface Msg {side: Side; text: string; delay: number}

const Bubble: React.FC<Msg> = ({side, text, delay}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const isRight = side === 'consumer';
  const isLev = side === 'lev';
  const bg = isLev
    ? 'rgba(91,226,169,0.12)'
    : isRight
    ? 'rgba(255,255,255,0.08)'
    : 'rgba(191,149,63,0.12)';
  const border = isLev ? theme.colors.green : isRight ? 'rgba(255,255,255,0.18)' : theme.colors.goldC;
  const label = isLev ? '🤖 Lev' : isRight ? '🙋 צרכן' : '🧑‍🔧 ספק';
  const labelCol = isLev ? theme.colors.green : isRight ? theme.colors.white : theme.colors.goldB;

  return (
    <div style={{
      opacity: op,
      alignSelf: isRight ? 'flex-end' : isLev ? 'center' : 'flex-start',
      maxWidth: isLev ? '80%' : '68%',
      padding: '14px 20px', borderRadius: 20,
      background: bg, border: `1px solid ${border}`,
      marginBottom: 10, direction: 'rtl',
    }}>
      <div style={{fontFamily: theme.font, fontWeight: 700, fontSize: 19, color: labelCol, marginBottom: 4}}>{label}</div>
      <div style={{fontFamily: theme.font, fontWeight: 500, fontSize: 25, color: theme.colors.white, lineHeight: 1.4}}>{text}</div>
    </div>
  );
};

const MSGS: Msg[] = [
  {side: 'provider', text: 'אני יכולה לספק טיפול ספא ב-480₪ ל-2 שעות.', delay: 20},
  {side: 'consumer', text: 'התקציב שלי הוא 420₪ — האם יש גמישות?', delay: 44},
  {side: 'provider', text: 'אסכים ל-450₪ עם ממתק קטן כבונוס ברוח טובה 🤍', delay: 68},
  {side: 'lev', text: 'Lev: שני הצדדים קרובים. הצעה: 450₪ + 5% בונוס הגשמה — שניהם מסכימים?', delay: 92},
  {side: 'consumer', text: '✅ מסכימה!', delay: 116},
  {side: 'provider', text: '✅ מסכימה!', delay: 128},
];

export const S6_NegoCons: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const sub = useRise(18);

  const locked = frame >= 148;
  const lockOp = interpolate(frame, [148, 162], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{flexDirection: 'column', padding: '50px 90px', alignItems: 'center'}}>
      <div style={{...title, marginBottom: 6, textAlign: 'center'}}>
        <GoldText size={52} weight={900}>מו"מ — לאורך כל הדרך עד הסכמה</GoldText>
      </div>
      <div style={{...sub, fontFamily: theme.font, fontSize: 26, color: theme.colors.muted, marginBottom: 22, direction: 'rtl', textAlign: 'center'}}>
        אם התנאים לא מתאימים — Lev מגשרת ומייצרת הצעה שמרוצה ממנה כולם.
      </div>

      {/* Chat */}
      <div style={{
        width: '100%', maxWidth: 860,
        background: 'rgba(255,255,255,0.03)', borderRadius: 28, padding: '24px 30px',
        border: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
      }}>
        {MSGS.map((m, i) => <Bubble key={i} {...m} />)}
      </div>

      {/* Lock confirmation */}
      <div style={{
        opacity: lockOp, marginTop: 20,
        background: theme.gradients.green, borderRadius: 20,
        padding: '16px 44px', color: theme.colors.navy,
        fontFamily: theme.font, fontWeight: 900, fontSize: 30,
        boxShadow: '0 0 40px rgba(46,255,168,0.4)',
        direction: 'rtl',
      }}>
        🔒 הסכמה נרשמת — המחיר נעול, אין הפתעות
      </div>
    </AbsoluteFill>
  );
};
