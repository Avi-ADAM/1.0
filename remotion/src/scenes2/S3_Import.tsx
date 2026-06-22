/**
 * סצנה 3 — ייבוא נתונים מהיר (URL / CV / תיאור חופשי)
 * ~4.5ש | frame 0–135
 *
 * מסמן על קטעי הקוד M3 / M3.5 מה-Onboarding HTML: "אוטומטי או ידני, העלאת CV, הצעות AI"
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Placeholder} from '../Placeholder';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const Option: React.FC<{icon: string; text: string; sub: string; delay: number; highlight?: boolean}> = ({
  icon, text, sub, delay, highlight,
}) => {
  const rise = useRise(delay);
  return (
    <div style={{
      ...rise, direction: 'rtl',
      padding: '20px 28px',
      borderRadius: 20,
      background: highlight ? 'rgba(91,226,169,0.12)' : 'rgba(255,255,255,0.05)',
      border: `1.5px solid ${highlight ? theme.colors.green : 'rgba(255,255,255,0.12)'}`,
      display: 'flex', alignItems: 'flex-start', gap: 18,
      width: 420,
    }}>
      <div style={{fontSize: 46, flexShrink: 0}}>{icon}</div>
      <div>
        <div style={{fontFamily: theme.font, fontWeight: 700, fontSize: 30, color: theme.colors.white}}>{text}</div>
        <div style={{fontFamily: theme.font, fontWeight: 400, fontSize: 22, color: theme.colors.muted, marginTop: 4}}>{sub}</div>
      </div>
    </div>
  );
};

export const S3_Import: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const badge = useRise(18);

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '60px 80px', gap: 50, direction: 'rtl'}}>
      {/* Right text */}
      <div style={{flex: 1.1, display: 'flex', flexDirection: 'column', gap: 20}}>
        <div style={{...title}}>
          <GoldText size={56} weight={900}>ייבוא נתונים ב-60 שניות</GoldText>
        </div>

        <div style={{...badge, marginBottom: 10}}>
          <span style={{
            background: theme.colors.green, color: theme.colors.navy,
            fontFamily: theme.font, fontWeight: 800, fontSize: 22,
            padding: '5px 18px', borderRadius: 999,
          }}>
            ✨ AI מוצא הכול עבורך
          </span>
        </div>

        <Option icon="🔗" text="הדבק URL" sub="לינקדאין, אתר, דרופבוקס — AI מחלץ את הנתונים" delay={20} highlight />
        <Option icon="📄" text="העלה CV" sub="PDF / Word — ייבוא אוטומטי של ניסיון וכישורים" delay={34} />
        <Option icon="✍️" text="תיאור חופשי" sub="כתוב במילים שלך, AI ממיר לפרופיל מובנה" delay={48} />
        <Option icon="🤖" text="הצעות AI" sub="המערכת מציעה משימות ומשאבים מיד לאחר הייבוא" delay={62} />
      </div>

      {/* Left: AI image placeholder */}
      <div style={{flex: 0.9, display: 'flex', justifyContent: 'center'}}>
        <Placeholder
          kind="ai-image"
          label="אנימציית ייבוא"
          prompt="Minimalist flat illustration: a lightning bolt pulling data streams (CV, LinkedIn, URL icons) into a glowing digital profile card. Dark navy background (#1e2145), accent colors: teal #5be2a9 and gold #bf953f. Clean, modern, RTL layout, no text."
          width={580}
          height={620}
        />
      </div>
    </AbsoluteFill>
  );
};
