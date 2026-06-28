/**
 * סצנה 3 — Lev מפרק אוטומטית ל-משימות + משאבים
 * ~5ש | 150f
 *
 * מדמה את ה-concierge-extract AI: בועת "Lev מנתח..." ← רשימות צצות
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

interface ExtractedItem {
  icon: string; name: string; detail: string; kind: 'mission' | 'resource'; delay: number;
}

const Item: React.FC<ExtractedItem> = ({icon, name, detail, kind, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 18}});
  const isMission = kind === 'mission';
  return (
    <div style={{
      opacity: s,
      transform: `translateX(${interpolate(s, [0, 1], [isMission ? 30 : -30, 0])}px)`,
      display: 'flex', alignItems: 'center', gap: 14, direction: 'rtl',
      padding: '12px 18px', borderRadius: 16,
      background: isMission ? 'rgba(91,226,169,0.08)' : 'rgba(191,149,63,0.08)',
      border: `1px solid ${isMission ? theme.colors.green : theme.colors.goldC}33`,
      marginBottom: 8,
    }}>
      <span style={{fontSize: 32, flexShrink: 0}}>{icon}</span>
      <div>
        <div style={{fontFamily: theme.font, fontWeight: 700, fontSize: 26, color: theme.colors.white}}>{name}</div>
        <div style={{fontFamily: theme.font, fontWeight: 400, fontSize: 20, color: theme.colors.muted}}>{detail}</div>
      </div>
      <div style={{
        marginRight: 'auto', background: isMission ? theme.colors.green : theme.colors.goldC,
        color: theme.colors.navy, fontFamily: theme.font, fontWeight: 800, fontSize: 18,
        padding: '3px 12px', borderRadius: 999,
      }}>{isMission ? 'משימה' : 'משאב'}</div>
    </div>
  );
};

const MISSIONS: ExtractedItem[] = [
  {icon: '💆', name: 'טיפול ספא 2 שעות', detail: 'עיסוי גוף ופנים, אווירה שקטה', kind: 'mission', delay: 46},
  {icon: '🚗', name: 'הסעה הלוך וחזור', detail: 'איסוף מהבית, החזרה ב-13:00', kind: 'mission', delay: 60},
  {icon: '👶', name: 'בייביסיטר 6 שעות', detail: '2 ילדים, גיל 4 ו-7', kind: 'mission', delay: 74},
];
const RESOURCES: ExtractedItem[] = [
  {icon: '🍽️', name: 'ארוחה לשניים', detail: 'מסעדה צמחונית, 12:30', kind: 'resource', delay: 88},
  {icon: '💐', name: 'זר פרחים', detail: 'הפתעה לסיום היום', kind: 'resource', delay: 102},
];

export const S3_LevAnalysis: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const levBubble = useRise(16);
  const mLabel = useRise(38);
  const rLabel = useRise(80);

  const levDone = frame > 40;

  return (
    <AbsoluteFill style={{flexDirection: 'column', padding: '52px 100px', alignItems: 'center'}}>
      <div style={{...title, marginBottom: 8}}>
        <GoldText size={54} weight={900}>Lev מנתח ומפרק את המשאלה</GoldText>
      </div>

      {/* Lev agent bubble */}
      <div style={{
        ...levBubble, direction: 'rtl',
        background: 'rgba(91,226,169,0.12)',
        border: `1.5px solid ${theme.colors.green}`,
        borderRadius: 20, padding: '16px 28px',
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 28, alignSelf: 'flex-start',
      }}>
        <div style={{fontSize: 40}}>🤖</div>
        <div>
          <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 26, color: theme.colors.green}}>LEV</div>
          <div style={{fontFamily: theme.font, fontWeight: 500, fontSize: 22, color: theme.colors.white}}>
            {levDone ? 'זיהיתי 3 משימות ו-2 משאבים — מחפש ספקים...' : 'מנתח...'}
          </div>
        </div>
        {!levDone && (
          <div style={{display: 'flex', gap: 5, alignItems: 'center'}}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%', background: theme.colors.green,
                opacity: frame % 18 === i * 6 ? 1 : 0.3,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Two columns */}
      <div style={{display: 'flex', gap: 40, width: '100%', maxWidth: 1100}}>
        <div style={{flex: 1}}>
          <div style={{...mLabel, fontFamily: theme.font, fontWeight: 700, fontSize: 28, color: theme.colors.green, marginBottom: 10, direction: 'rtl'}}>
            ✦ משימות
          </div>
          {MISSIONS.map((m, i) => <Item key={i} {...m} />)}
        </div>
        <div style={{flex: 1}}>
          <div style={{...rLabel, fontFamily: theme.font, fontWeight: 700, fontSize: 28, color: theme.colors.goldC, marginBottom: 10, direction: 'rtl'}}>
            ✦ משאבים
          </div>
          {RESOURCES.map((r, i) => <Item key={i} {...r} />)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
