/**
 * סצנה 9 — ההגשמה: האמא ביום המנוחה שלה
 * ~4.5ש | 135f
 *
 * סצנה רגשית + Placeholder לקליפ AI / תמונת AI
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placeholder} from '../Placeholder';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

export const S9_Fulfilled: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = useRise(4);
  const quote = useRise(22);
  const tag = useRise(60);

  const heartScale = 1 + Math.sin(frame / 14) * 0.07;

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '55px 80px', gap: 60, direction: 'rtl'}}>
      {/* Right: emotional text */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 20}}>
        <div style={{...title}}><GoldText size={54} weight={900}>המשאלה הוגשמה 🤍</GoldText></div>

        <div style={{
          ...quote,
          fontFamily: theme.font, fontSize: 32, fontWeight: 500,
          color: theme.colors.white, lineHeight: 1.65, direction: 'rtl',
          borderRight: `4px solid ${theme.colors.green}`,
          paddingRight: 22, marginRight: 0,
        }}>
          "לא חיפשתי ספק, לא השוויתי מחירים, לא תיאמתי — פשוט אמרתי מה אני רוצה. ו-1💗1 עשתה את הכל."
        </div>

        <div style={{...tag, display: 'flex', flexDirection: 'column', gap: 12}}>
          {[
            ['💆', 'ספא עם נועה גולן — ✅'],
            ['👶', 'בייביסיטר עם תמר — ✅'],
            ['🚗', 'הסעה עם יואב — ✅'],
            ['🍽️', 'ארוחה הוזמנה — ✅'],
          ].map(([ic, txt]) => (
            <div key={txt} style={{display: 'flex', alignItems: 'center', gap: 14, direction: 'rtl'}}>
              <span style={{fontSize: 30}}>{ic}</span>
              <span style={{fontFamily: theme.font, fontWeight: 600, fontSize: 26, color: theme.colors.white}}>{txt}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 8,
          transform: `scale(${heartScale})`,
          fontFamily: theme.font, fontWeight: 900, fontSize: 36,
          color: theme.colors.green, direction: 'rtl',
          alignSelf: 'flex-start',
        }}>
          💗 המשאלה הוגשמה — כולם מרוצים
        </div>
      </div>

      {/* Left: AI video of joyful moment */}
      <div style={{flex: 0.9, display: 'flex', justifyContent: 'center'}}>
        <Placeholder
          kind="ai-video"
          label="קליפ: רגע ההגשמה"
          prompt="Runway/Kling: a woman relaxing in a serene spa, warm golden light, soft green plants around her. She smiles peacefully. Slow cinematic motion, no text, 4-second clip. Style: warm, aspirational, human-centered product film. Color palette: warm neutrals + soft teal accents."
          width={570}
          height={630}
        />
      </div>
    </AbsoluteFill>
  );
};
