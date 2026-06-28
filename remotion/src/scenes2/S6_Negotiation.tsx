/**
 * סצנה 6 — מו"מ: שותפים ↔ מועמדים על תנאי משימה/משאב
 * ~5.5ש | frame 0–165
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';
import {Placeholder} from '../Placeholder';

interface BubbleProps {
  from: 'partner' | 'candidate';
  text: string;
  delay: number;
}

const Bubble: React.FC<BubbleProps> = ({from, text, delay}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const isPartner = from === 'partner';
  return (
    <div style={{
      opacity,
      alignSelf: isPartner ? 'flex-end' : 'flex-start',
      maxWidth: '70%',
      padding: '14px 20px',
      borderRadius: isPartner ? '20px 6px 20px 20px' : '6px 20px 20px 20px',
      background: isPartner ? 'rgba(91,226,169,0.15)' : 'rgba(191,149,63,0.15)',
      border: `1px solid ${isPartner ? theme.colors.green : theme.colors.goldC}`,
      fontFamily: theme.font, fontWeight: 500, fontSize: 26,
      color: theme.colors.white,
      direction: 'rtl',
      marginBottom: 10,
    }}>
      <div style={{fontSize: 18, color: isPartner ? theme.colors.green : theme.colors.goldC, fontWeight: 700, marginBottom: 4}}>
        {isPartner ? '🤝 שותף' : '👤 מועמד'}
      </div>
      {text}
    </div>
  );
};

export const S6_Negotiation: React.FC = () => {
  const title = useRise(4);
  const sub = useRise(20);

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '55px 80px', gap: 55, direction: 'rtl'}}>
      {/* Right: chat animation */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        <div style={{...title, marginBottom: 8}}>
          <GoldText size={54} weight={900}>מו"מ שקוף בתוך הפלטפורמה</GoldText>
        </div>
        <div style={{...sub, fontFamily: theme.font, fontSize: 26, color: theme.colors.muted, marginBottom: 28}}>
          שותפי הריקמה ומועמדים מתדיינים על תנאים — הכול בתוך הפלטפורמה, הכול שקוף.
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: 0, background: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: '24px 28px', border: '1px solid rgba(255,255,255,0.08)'}}>
          <Bubble from="partner" text="מציעים 120₪ לשעה למשימת פיתוח זו." delay={28} />
          <Bubble from="candidate" text="אני מבקש 140₪ — יש לי ניסיון ספציפי בתחום." delay={50} />
          <Bubble from="partner" text="מסכימים על 130₪ + בונוס השלמה." delay={72} />
          <Bubble from="candidate" text="✅ מתאים. אני מאשר." delay={94} />
        </div>

        <div style={{marginTop: 20, fontFamily: theme.font, fontSize: 24, color: theme.colors.muted, direction: 'rtl'}}>
          💡 כל הצעת נגד עוצרת ואין דבר שנרשם ללא הסכמה מלאה
        </div>
      </div>

      {/* Left: AI video placeholder */}
      <div style={{flex: 0.9, display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
        <Placeholder
          kind="ai-video"
          label="וידאו: שיחת מו״מ"
          prompt="Runway / Sora prompt: Two business people on opposite sides of a glowing table, sending light-beam messages back and forth. Dark futuristic room, teal and gold accents, no dialogue, 4-second loop, cinematic slow motion. Style: corporate tech, no text overlays."
          width={600}
          height={620}
        />
      </div>
    </AbsoluteFill>
  );
};
