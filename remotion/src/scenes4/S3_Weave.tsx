/**
 * סצנה 3 — ריקמה: כל אחד מביא חוט. כל חסם הופך לתפקיד של מישהו.
 * ~6.5ש | 195f
 */
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const ROLES = [
  {icon: '🌍', t: 'בעל/ת הקרקע', d: 'נותן/ת שטח, מרוויח/ה, ומעורב/ת בכל החלטה'},
  {icon: '🌱', t: 'מגדל/ת השתילים', d: 'נותן/ת שתילים בהשקעה, ומעורב/ת באיך מגדלים'},
  {icon: '🧑‍🌾', t: 'המטפל/ת', d: 'מהבוקר עד הערב — להנאתו/ה'},
  {icon: '🤝', t: 'המחליף/ה', d: 'משלים/ה ליום מנוחה — אף אחד לא לבד'},
];

const RoleCard: React.FC<{icon: string; t: string; d: string; delay: number}> = ({icon, t, d, delay}) => {
  const rise = useRise(delay);
  return (
    <div style={{
      ...rise,
      direction: 'rtl',
      width: 420,
      padding: '26px 30px',
      borderRadius: 24,
      background: 'rgba(91,226,169,0.07)',
      border: '1px solid rgba(91,226,169,0.3)',
      boxShadow: '0 14px 40px rgba(0,0,0,0.3)',
    }}>
      <div style={{fontSize: 50, marginBottom: 10}}>{icon}</div>
      <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 34, color: theme.colors.white, marginBottom: 6}}>{t}</div>
      <div style={{fontFamily: theme.font, fontWeight: 400, fontSize: 25, color: theme.colors.muted, lineHeight: 1.35}}>{d}</div>
    </div>
  );
};

export const S3_Weave: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(2);
  const note = interpolate(frame, [150, 172], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 20, padding: 50}}>
      <div style={{...title}}>
        <GoldText size={56} weight={900}>ריקמה — כל חוט בונה את הבד</GoldText>
      </div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
        {ROLES.map((r, i) => (
          <RoleCard key={r.t} icon={r.icon} t={r.t} d={r.d} delay={18 + i * 18} />
        ))}
      </div>
      <div style={{opacity: note, fontFamily: theme.font, fontSize: 28, fontWeight: 600, color: theme.colors.green, direction: 'rtl', textAlign: 'center'}}>
        כל אחד מכניס מה שיש לו ואוהב — והמערכת רושמת כל שעה וכל משאב
      </div>
    </AbsoluteFill>
  );
};
