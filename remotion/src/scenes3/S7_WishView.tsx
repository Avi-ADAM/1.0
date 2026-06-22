/**
 * סצנה 7 — תמונה מלאה מנקודת מבט הצרכן: הצעות מוכנות
 * ~5.5ש | 165f
 *
 * Placeholder לצילום מסך של /concierge/[id] עם רשימת ספקים שאישרו
 * + מד ה"כיסוי" שעולה לאט
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Placeholder} from '../Placeholder';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const CoverageBar: React.FC<{label: string; pct: number; delay: number; color: string}> = ({label, pct, delay, color}) => {
  const frame = useCurrentFrame();
  const filled = interpolate(frame, [delay, delay + 40], [0, pct], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const op = interpolate(frame, [delay - 8, delay + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{opacity: op, direction: 'rtl', marginBottom: 14}}>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 6}}>
        <div style={{fontFamily: theme.font, fontWeight: 600, fontSize: 24, color: theme.colors.white}}>{label}</div>
        <div style={{fontFamily: 'monospace', fontWeight: 800, fontSize: 24, color}}>{Math.round(filled)}%</div>
      </div>
      <div style={{background: 'rgba(255,255,255,0.08)', borderRadius: 8, height: 18}}>
        <div style={{width: `${filled}%`, height: '100%', borderRadius: 8, background: color}} />
      </div>
    </div>
  );
};

export const S7_WishView: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const sub = useRise(20);
  const bars = useRise(36);
  const ready = useRise(120);

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '55px 80px', gap: 55, direction: 'rtl'}}>
      {/* Right: coverage stats */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        <div style={{...title, marginBottom: 8}}><GoldText size={50} weight={900}>הצרכן רואה הכל בשקיפות</GoldText></div>
        <div style={{...sub, fontFamily: theme.font, fontSize: 26, color: theme.colors.muted, lineHeight: 1.5, marginBottom: 28}}>
          כל צורך, כל ספק, כל מחיר — שקוף. המשאלה מתמלאת בהדרגה.
        </div>

        <div style={{...bars}}>
          <CoverageBar label="טיפול ספא" pct={100} delay={38} color={theme.colors.green} />
          <CoverageBar label="בייביסיטר" pct={100} delay={56} color={theme.colors.green} />
          <CoverageBar label="הסעה" pct={70}  delay={74} color={theme.colors.goldC} />
          <CoverageBar label="ארוחה"   pct={45}  delay={92} color="#a855f7" />
        </div>

        {/* Ready banner */}
        <div style={{
          ...ready, marginTop: 24,
          background: theme.gradients.green, borderRadius: 18,
          padding: '14px 32px', color: theme.colors.navy,
          fontFamily: theme.font, fontWeight: 900, fontSize: 30,
          boxShadow: '0 0 35px rgba(46,255,168,0.4)',
          direction: 'rtl',
        }}>
          🎉 3/4 צרכים מכוסים — הצעה מוכנה לאישורך
        </div>
      </div>

      {/* Left: real wish page screenshot */}
      <div style={{flex: 0.9, display: 'flex', justifyContent: 'center'}}>
        <Placeholder
          kind="screenshot"
          label="מסך המשאלה המלאה /concierge/[id]"
          prompt="צילום מסך של /concierge/[id] — רשימת הצרכים (משימות + משאבים) כל אחד עם ספקים שהציעו, מד כיסוי %. שמור כ-public/cons-wishview.png (620×700px)."
          width={580}
          height={660}
        />
      </div>
    </AbsoluteFill>
  );
};
