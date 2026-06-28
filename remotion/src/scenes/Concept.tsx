import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

/** A single person node orbiting the central "Rikma" core. */
const Node: React.FC<{angle: number; r: number; delay: number; emoji: string}> = ({angle, r, delay, emoji}) => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame - delay, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const a = angle + frame / 120;
  const x = Math.cos(a) * r;
  const y = Math.sin(a) * r;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%,-50%) translate(${x}px, ${y}px) scale(${appear})`,
        opacity: appear,
        width: 110,
        height: 110,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        border: `2px solid ${theme.colors.green}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 54,
        boxShadow: '0 0 24px rgba(91,226,169,0.4)',
      }}
    >
      {emoji}
    </div>
  );
};

/** Scene 3 — the "Rikma" concept: many people, one consensual fabric. */
export const Concept: React.FC = () => {
  const title = useRise(6);
  const sub = useRise(26);
  const nodes = ['🧑‍🎨', '👩‍🔧', '🧑‍💻', '👨‍🌾', '👩‍🚀', '🧑‍🍳'];

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div style={{position: 'absolute', width: 640, height: 640}}>
        {/* central core */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: theme.gradients.green,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 92,
            boxShadow: '0 0 60px rgba(46,255,168,0.5)',
          }}
        >
          💗
        </div>
        {nodes.map((e, i) => (
          <Node key={i} angle={(i / nodes.length) * Math.PI * 2} r={300} delay={10 + i * 7} emoji={e} />
        ))}
      </div>

      <div style={{position: 'absolute', bottom: 120, textAlign: 'center', direction: 'rtl'}}>
        <div style={{...title}}>
          <GoldText size={68}>הצטרפו ל״רקמה״</GoldText>
        </div>
        <div
          style={{
            ...sub,
            marginTop: 14,
            fontFamily: theme.font,
            fontSize: 38,
            fontWeight: 500,
            color: theme.colors.muted,
          }}
        >
          שותפות מבוזרת של אנשים, ערכים וכישורים
        </div>
      </div>
    </AbsoluteFill>
  );
};
