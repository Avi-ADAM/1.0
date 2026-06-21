import React from 'react';
import {AbsoluteFill} from 'remotion';
import {theme} from '../theme';
import {FeatureCard, useRise} from '../components';

/** Scene 4 — the four headline features (2x2 grid). */
export const Features: React.FC = () => {
  const heading = useRise(2);

  const features = [
    {icon: '🤝', title: 'החלטות פה-אחד', body: 'הצבעות ומשא ומתן שקופים — אף אחד לא נדרס.'},
    {icon: '📒', title: 'פנקס מבוזר', body: 'ניהול חשבונות הרקמה לפי ההסכמות שהושגו.'},
    {icon: '📊', title: 'כלי ניהול', body: 'גרפים, גאנט ולוח משימות לפרויקט משותף.'},
    {icon: '💰', title: 'חלוקת רווחים', body: 'חלוקה דינמית לפי ההשקעה היחסית של כל אחד.'},
  ];

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          ...heading,
          direction: 'rtl',
          fontFamily: theme.font,
          fontWeight: 800,
          fontSize: 64,
          color: theme.colors.white,
          marginBottom: 48,
        }}
      >
        כל מה שצריך לנהל שותפות
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, auto)',
          gap: 32,
        }}
      >
        {features.map((f, i) => (
          <FeatureCard key={i} {...f} delay={14 + i * 12} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
