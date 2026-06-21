import React from 'react';
import {AbsoluteFill} from 'remotion';
import {theme} from '../theme';
import {useRise} from '../components';

/** Scene 2 — the hook / pain point. */
export const Hook: React.FC = () => {
  const l1 = useRise(4);
  const l2 = useRise(24);
  const l3 = useRise(48);

  const line: React.CSSProperties = {
    fontFamily: theme.font,
    direction: 'rtl',
    textAlign: 'center',
    color: theme.colors.white,
    fontWeight: 700,
    fontSize: 64,
    lineHeight: 1.25,
  };

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 120}}>
      <div style={{...line, ...l1}}>רוצים לשתף פעולה,</div>
      <div style={{...line, ...l2}}>
        בלי לוותר על <span style={{color: theme.colors.green}}>העצמאות</span> שלכם?
      </div>
      <div
        style={{
          ...line,
          ...l3,
          marginTop: 40,
          fontWeight: 500,
          fontSize: 40,
          color: theme.colors.muted,
        }}
      >
        כל החלטה — רק בהסכמה פה-אחד.
      </div>
    </AbsoluteFill>
  );
};
