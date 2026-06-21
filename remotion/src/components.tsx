import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from './theme';

/** Animated brand background: soft radial navy with a slow drifting gold glow. */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const x = 50 + Math.sin(frame / 90) * 12;
  const y = 25 + Math.cos(frame / 110) * 8;
  return (
    <AbsoluteFill style={{background: theme.gradients.bg}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${x}% ${y}%, rgba(91,226,169,0.16), transparent 45%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${100 - x}% ${80 - y}%, rgba(191,149,63,0.14), transparent 50%)`,
        }}
      />
    </AbsoluteFill>
  );
};

/** Text painted with the brand gold gradient. */
export const GoldText: React.FC<{
  children: React.ReactNode;
  size: number;
  weight?: number;
  style?: React.CSSProperties;
}> = ({children, size, weight = 800, style}) => (
  <span
    style={{
      fontFamily: theme.font,
      fontSize: size,
      fontWeight: weight,
      backgroundImage: theme.gradients.gold,
      backgroundSize: '200% auto',
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      color: 'transparent',
      WebkitTextFillColor: 'transparent',
      ...style,
    }}
  >
    {children}
  </span>
);

/** The 1💗1 wordmark with a beating heart. */
export const Wordmark: React.FC<{size: number; delay?: number}> = ({size, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const beat = 1 + Math.max(0, Math.sin((frame - delay) / fps * Math.PI * 2.2)) * 0.18;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.06,
        fontFamily: theme.font,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 1,
        color: theme.colors.white,
      }}
    >
      <span>1</span>
      <span style={{transform: `scale(${beat})`, display: 'inline-block', filter: 'drop-shadow(0 0 18px rgba(255,77,158,0.6))'}}>💗</span>
      <span>1</span>
    </div>
  );
};

/** Generic spring-in helper: returns opacity + translateY for an element. */
export const useRise = (delay: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - delay, fps, config: {damping: 18, mass: 0.7}});
  return {
    opacity: p,
    transform: `translateY(${interpolate(p, [0, 1], [40, 0])}px)`,
  };
};

/** Feature card used in the features scene. */
export const FeatureCard: React.FC<{
  icon: string;
  title: string;
  body: string;
  delay: number;
}> = ({icon, title, body, delay}) => {
  const rise = useRise(delay);
  return (
    <div
      style={{
        ...rise,
        direction: 'rtl',
        width: 460,
        padding: '34px 38px',
        borderRadius: 28,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(91,226,169,0.25)',
        boxShadow: '0 18px 50px rgba(0,0,0,0.35)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div style={{fontSize: 58, marginBottom: 14}}>{icon}</div>
      <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 40, color: theme.colors.white, marginBottom: 8}}>
        {title}
      </div>
      <div style={{fontFamily: theme.font, fontWeight: 400, fontSize: 28, color: theme.colors.muted, lineHeight: 1.35}}>
        {body}
      </div>
    </div>
  );
};
