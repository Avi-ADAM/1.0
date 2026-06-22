/**
 * סצנה 8 — מוצרים, מכירות חיצוניות ומול הלקוח
 * ~7ש | frame 0–210
 *
 * זרימה: לקוח קונה → מוצר מתפצל למשימות+משאבים → חברים מבצעים → ניהול ביצוע → תקשורת עם לקוח
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placeholder} from '../Placeholder';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

interface FlowNodeProps {
  icon: string; text: string; sub: string;
  delay: number; color: string;
}

const FlowNode: React.FC<FlowNodeProps> = ({icon, text, sub, delay, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 18}});
  return (
    <div style={{
      opacity: s,
      transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center', width: 180,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: `${color}22`, border: `2px solid ${color}`,
        fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 20px ${color}44`,
      }}>{icon}</div>
      <div style={{fontFamily: theme.font, fontWeight: 700, fontSize: 24, color: theme.colors.white}}>{text}</div>
      <div style={{fontFamily: theme.font, fontWeight: 400, fontSize: 19, color: theme.colors.muted, lineHeight: 1.35}}>{sub}</div>
    </div>
  );
};

const Arrow: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <div style={{opacity: op, color: theme.colors.muted, fontSize: 36, alignSelf: 'center', marginBottom: 28}}>→</div>;
};

export const S8_Products: React.FC = () => {
  const title = useRise(4);
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{flexDirection: 'column', padding: '50px 80px', gap: 0, alignItems: 'center'}}>
      <div style={{...title, textAlign: 'center', marginBottom: 10}}>
        <GoldText size={56} weight={900}>מוצרים ומכירות — בשילוב מלא</GoldText>
      </div>
      <div style={{
        fontFamily: theme.font, fontSize: 26, color: theme.colors.muted,
        textAlign: 'center', direction: 'rtl', marginBottom: 32,
      }}>
        לקוח קונה מוצר → הפלטפורמה יוצרת אוטומטית את המשימות והמשאבים → חברי הריקמה מבצעים ומתקשרים עם הלקוח מתוך האתר.
      </div>

      {/* Flow row */}
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <FlowNode icon="🛒" text="לקוח קונה" sub="מכירה חיצונית" delay={20} color={theme.colors.goldC} />
        <Arrow delay={30} />
        <FlowNode icon="📦" text="מוצר" sub="תבנית משימות+משאבים" delay={38} color="#a855f7" />
        <Arrow delay={48} />
        <FlowNode icon="⚙️" text="ביצוע" sub="חברים מבצעים בתוך הריקמה" delay={56} color={theme.colors.green} />
        <Arrow delay={66} />
        <FlowNode icon="💬" text="תקשורת" sub="מול הלקוח דרך האתר" delay={74} color="#f59e0b" />
        <Arrow delay={84} />
        <FlowNode icon="✅" text="סגירה" sub="אשרור + פנקס" delay={92} color={theme.colors.green} />
      </div>

      {/* Placeholder for real product screenshot */}
      <div style={{
        marginTop: 28,
        opacity: interpolate(frame, [100, 120], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
      }}>
        <Placeholder
          kind="screenshot"
          label="מסך בניית מוצר / ניהול לקוח"
          prompt="צילום מסך של דף יצירת מוצר ב-1lev1.com: שם מוצר, רשימת משימות ומשאבים כלולים, מחיר מכירה. לחלופין — מסך ניהול הלקוח. שמור כ-public/product.png (1100×380px)."
          width={1060}
          height={320}
        />
      </div>
    </AbsoluteFill>
  );
};
