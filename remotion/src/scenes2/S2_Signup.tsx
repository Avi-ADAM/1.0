/**
 * סצנה 2 — הרשמה
 * ~5ש | frame 0–150
 *
 * חצי שמאל: אנימציית שלבי הרשמה (טקסט)
 * חצי ימין: Placeholder לצילום מסך מהקובץ "1lev1 Onboarding Flow.html"
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placeholder} from '../Placeholder';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const Step: React.FC<{n: number; text: string; delay: number; done?: boolean}> = ({n, text, delay, done}) => {
  const rise = useRise(delay);
  return (
    <div style={{...rise, display: 'flex', alignItems: 'center', gap: 20, direction: 'rtl', marginBottom: 18}}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
        background: done ? theme.colors.green : 'rgba(255,255,255,0.08)',
        border: `2px solid ${done ? theme.colors.green : 'rgba(255,255,255,0.25)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: theme.font, fontWeight: 800, fontSize: 24,
        color: done ? theme.colors.navy : theme.colors.white,
      }}>
        {done ? '✓' : n}
      </div>
      <div style={{fontFamily: theme.font, fontWeight: 600, fontSize: 34, color: theme.colors.white}}>{text}</div>
    </div>
  );
};

export const S2_Signup: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const title = useRise(4);
  const progress = interpolate(frame, [60, 120], [0, 100], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '60px 80px', gap: 60, direction: 'rtl'}}>
      {/* Left: steps */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        <div style={{...title, marginBottom: 36}}>
          <GoldText size={60} weight={900}>הרשמה — בדקות</GoldText>
        </div>

        <Step n={1} text="מייל וסיסמה" delay={14} done />
        <Step n={2} text="אימות מייל" delay={28} done />
        <Step n={3} text="בחר מסלול: נותן שירות / עסק" delay={42} done />
        <Step n={4} text="ייבוא נתונים מהיר" delay={56} />
        <Step n={5} text="אישור פרופיל" delay={70} />

        {/* Progress bar */}
        <div style={{marginTop: 40, width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 8, height: 8}}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            borderRadius: 8,
            background: theme.gradients.green,
            transition: 'width 0.1s',
          }} />
        </div>
        <div style={{
          fontFamily: theme.font, fontWeight: 500, fontSize: 22,
          color: theme.colors.muted, marginTop: 10, direction: 'rtl',
        }}>
          {`${Math.round(progress)}% הושלם`}
        </div>
      </div>

      {/* Right: screenshot placeholder */}
      <div style={{flex: 1, display: 'flex', justifyContent: 'center'}}>
        <Placeholder
          kind="screenshot"
          label='מסך הרשמה M1–M3'
          prompt='צילום מסך מהקובץ "1lev1 Onboarding Flow.html" — מסכי M1 (כניסה מהירה), M2 (בחירת מסלול). גזור ל-680×760px ושמור כ-public/signup.png'
          width={640}
          height={700}
        />
      </div>
    </AbsoluteFill>
  );
};
