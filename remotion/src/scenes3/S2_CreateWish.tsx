/**
 * סצנה 2 — יצירת משאלה: הצרכן מתאר במילים שלו
 * ~6ש | 180f
 *
 * ממחיש: אנימציית "טייפינג" של המשאלה + סיד-כפתורים להשראה
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Placeholder} from '../Placeholder';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const WISH_TEXT = 'אני רוצה לארגן יום חופש לאמא שלי ליום הולדתה — ספא, ארוחה טובה, מישהי שתשגיח על הילדים. שהכל יהיה מסודר ומפתיע.';

/** Animated typewriter effect */
const Typewriter: React.FC<{text: string; startFrame: number}> = ({text, startFrame}) => {
  const frame = useCurrentFrame();
  const charsPerFrame = 0.9;
  const shown = Math.min(text.length, Math.floor(Math.max(0, frame - startFrame) * charsPerFrame));
  const cursor = frame % 28 < 14;
  return (
    <span style={{fontFamily: theme.font, fontWeight: 500, fontSize: 34, color: theme.colors.white, lineHeight: 1.55}}>
      {text.slice(0, shown)}
      {shown < text.length || cursor
        ? <span style={{opacity: cursor ? 1 : 0, color: theme.colors.green}}>|</span>
        : null}
    </span>
  );
};

const SeedChip: React.FC<{icon: string; label: string; delay: number}> = ({icon, label, delay}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{
      opacity: op,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.18)',
      borderRadius: 999, padding: '10px 22px',
      fontFamily: theme.font, fontWeight: 600, fontSize: 24,
      color: theme.colors.white, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span>{icon}</span>{label}
    </div>
  );
};

export const S2_CreateWish: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const seeds = useRise(18);
  const box = useRise(34);
  const privacy = useRise(130);

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '55px 80px', gap: 60, direction: 'rtl'}}>
      {/* Right: interaction demo */}
      <div style={{flex: 1.1, display: 'flex', flexDirection: 'column', gap: 20}}>
        <div style={{...title}}><GoldText size={56} weight={900}>מה ברצונך שיקרה?</GoldText></div>

        {/* Seed buttons */}
        <div style={{...seeds, display: 'flex', gap: 12, flexWrap: 'wrap'}}>
          {[['🎁','מתנה לאהוב/ה',22],['🛠','משימה שלא מצליחים לבד',34],['🌿','אירוע קטן',46],['✍','משאלה חופשית',58]].map(([ic,lb,dl]) => (
            <SeedChip key={String(lb)} icon={String(ic)} label={String(lb)} delay={Number(dl)} />
          ))}
        </div>

        {/* Text box with typewriter */}
        <div style={{
          ...box,
          background: 'rgba(255,255,255,0.05)',
          border: `1.5px solid ${theme.colors.green}`,
          borderRadius: 22, padding: '26px 30px',
          minHeight: 140,
          boxShadow: '0 0 40px rgba(91,226,169,0.12)',
        }}>
          <Typewriter text={WISH_TEXT} startFrame={42} />
        </div>

        {/* Publish button appears after typing */}
        <div style={{
          opacity: interpolate(frame, [150, 168], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          transform: `scale(${interpolate(frame, [150, 165], [0.9, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})})`,
          background: theme.gradients.green, color: theme.colors.navy,
          fontFamily: theme.font, fontWeight: 900, fontSize: 34,
          padding: '16px 40px', borderRadius: 999,
          boxShadow: '0 0 35px rgba(46,255,168,0.45)',
          alignSelf: 'flex-start',
        }}>
          ✨ פרסום המשאלה
        </div>

        <div style={{...privacy, fontFamily: theme.font, fontSize: 22, color: 'rgba(255,255,255,0.4)', direction: 'rtl'}}>
          🔒 פרטית עד לפרסום — שום דבר לא יוצא החוצה לפני כן
        </div>
      </div>

      {/* Left: screenshot */}
      <div style={{flex: 0.9, display: 'flex', justifyContent: 'center'}}>
        <Placeholder
          kind="screenshot"
          label="מסך יצירת משאלה"
          prompt="צילום מסך של /concierge/new — שדה הטקסט עם כפתורי השראה (מתנה / משימה / אירוע). שמור כ-public/cons-new.png (640×720px)."
          width={600}
          height={680}
        />
      </div>
    </AbsoluteFill>
  );
};
