/**
 * סצנה 5 — יצירת משימות ומשאבים (עם טיימר וסוג תשלום)
 * ~6ש | frame 0–180
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';
import {Placeholder} from '../Placeholder';

const Card: React.FC<{
  icon: string; title: string; sub: string;
  badge: string; badgeColor: string; delay: number;
}> = ({icon, title, sub, badge, badgeColor, delay}) => {
  const rise = useRise(delay);
  return (
    <div style={{
      ...rise, direction: 'rtl',
      padding: '22px 28px',
      borderRadius: 22,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.12)',
      width: 420,
    }}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div style={{fontSize: 48}}>{icon}</div>
        <div style={{
          background: badgeColor, color: theme.colors.navy,
          fontFamily: theme.font, fontWeight: 800, fontSize: 20,
          padding: '4px 14px', borderRadius: 999,
        }}>{badge}</div>
      </div>
      <div style={{fontFamily: theme.font, fontWeight: 700, fontSize: 30, color: theme.colors.white, marginTop: 12}}>{title}</div>
      <div style={{fontFamily: theme.font, fontWeight: 400, fontSize: 22, color: theme.colors.muted, marginTop: 6, lineHeight: 1.4}}>{sub}</div>
    </div>
  );
};

/** Animated countdown timer */
const Timer: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - delay);
  const seconds = Math.max(0, 45 - Math.floor(elapsed / 2));
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{opacity, display: 'flex', alignItems: 'center', gap: 12, direction: 'rtl', marginTop: 20}}>
      <div style={{fontSize: 34}}>⏱</div>
      <div style={{fontFamily: 'monospace', fontSize: 46, fontWeight: 900, color: theme.colors.green}}>
        {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
      </div>
      <div style={{fontFamily: theme.font, fontSize: 24, color: theme.colors.muted}}>טיימר למשימה</div>
    </div>
  );
};

export const S5_Tasks: React.FC = () => {
  const title = useRise(4);
  const sub = useRise(20);

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '55px 80px', gap: 55, direction: 'rtl'}}>
      {/* Right: text + cards */}
      <div style={{flex: 1.1, display: 'flex', flexDirection: 'column', gap: 18}}>
        <div style={{...title}}><GoldText size={56} weight={900}>משימות ומשאבים</GoldText></div>
        <div style={{...sub, fontFamily: theme.font, fontSize: 28, color: theme.colors.muted}}>
          כל פעולה בריקמה מוגדרת כמשימה (עם טיימר) או משאב (עם מחיר).
        </div>

        <Card
          icon="📋" title="משימה"
          sub="הגדרה, תיאור, עלות שעתית/גלובלית, טיימר, שיוך לחבר"
          badge="⏱ עם טיימר" badgeColor={theme.colors.green}
          delay={28}
        />
        <Card
          icon="🧰" title="משאב חד-פעמי"
          sub="ציוד, תוכנה, שירות — מחיר קבוע, מאושר פעם אחת"
          badge="one-time" badgeColor={theme.colors.goldC}
          delay={46}
        />
        <Card
          icon="🔄" title="משאב חודשי"
          sub="שכירות, רישיון, שרת — חיוב חוזר שעובר אשרור בכל מחזור"
          badge="חודשי" badgeColor="#a855f7"
          delay={64}
        />

        <Timer delay={90} />
      </div>

      {/* Left: screenshot placeholder */}
      <div style={{flex: 0.9, display: 'flex', justifyContent: 'center'}}>
        <Placeholder
          kind="screenshot"
          label="מסך יצירת משימה / משאב"
          prompt="צילום מסך של דף יצירת משימה ב-1lev1.com: שם, תיאור, סוג תשלום, שדה טיימר. שמור כ-public/task-create.png (640×720px)."
          width={600}
          height={680}
        />
      </div>
    </AbsoluteFill>
  );
};
