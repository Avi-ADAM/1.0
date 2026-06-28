/**
 * סצנה 7 — אשרור: כל השותפים מאשרים — גם תנאים גם השמה
 * ~5ש | frame 0–150
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

interface PartnerVoteProps {
  name: string; emoji: string;
  approvedAt: number; // frame when checkmark appears
}

const PartnerVote: React.FC<PartnerVoteProps> = ({name, emoji, approvedAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const appear = spring({frame: frame - approvedAt, fps, config: {damping: 12}});
  const isApproved = frame >= approvedAt;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      opacity: interpolate(frame, [approvedAt - 20, approvedAt], [0.3, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
    }}>
      <div style={{
        width: 90, height: 90, borderRadius: '50%', fontSize: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isApproved ? 'rgba(91,226,169,0.2)' : 'rgba(255,255,255,0.06)',
        border: `2px solid ${isApproved ? theme.colors.green : 'rgba(255,255,255,0.15)'}`,
        boxShadow: isApproved ? '0 0 24px rgba(46,255,168,0.35)' : 'none',
        position: 'relative',
      }}>
        {emoji}
        {isApproved && (
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 32, height: 32, borderRadius: '50%',
            background: theme.colors.green, color: theme.colors.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18,
            transform: `scale(${interpolate(appear, [0, 1], [0, 1])})`,
          }}>✓</div>
        )}
      </div>
      <div style={{fontFamily: theme.font, fontWeight: 600, fontSize: 24, color: theme.colors.white}}>{name}</div>
    </div>
  );
};

export const S7_Approval: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const sub = useRise(20);

  const allApproved = frame >= 110;
  const lockOpacity = interpolate(frame, [110, 126], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lockScale = 1 + Math.max(0, Math.sin((frame - 110) / 7)) * 0.08;

  const partners = [
    {name: 'דנה', emoji: '👩‍💼', approvedAt: 45},
    {name: 'יוסי', emoji: '👨‍🔧', approvedAt: 63},
    {name: 'ריטה', emoji: '🧑‍🎨', approvedAt: 80},
    {name: 'עמוס', emoji: '👨‍💻', approvedAt: 97},
  ];

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
      <div style={{...title, marginBottom: 12}}>
        <GoldText size={62} weight={900}>אשרור פה-אחד</GoldText>
      </div>
      <div style={{...sub, fontFamily: theme.font, fontSize: 30, color: theme.colors.muted, direction: 'rtl', textAlign: 'center', maxWidth: 780, lineHeight: 1.45, marginBottom: 48}}>
        תנאי המשימה + ההשמה לחבר — נרשמים סופית רק לאחר שכל שותפי הריקמה אישרו.
      </div>

      {/* Vote cards */}
      <div style={{display: 'flex', gap: 50}}>
        {partners.map((p, i) => <PartnerVote key={i} {...p} />)}
      </div>

      {/* Confirmation lock */}
      <div style={{
        marginTop: 48, opacity: lockOpacity,
        transform: `scale(${lockScale})`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          background: theme.gradients.green, borderRadius: 24,
          padding: '18px 50px', color: theme.colors.navy,
          fontFamily: theme.font, fontWeight: 900, fontSize: 36,
          boxShadow: '0 0 50px rgba(46,255,168,0.45)',
          direction: 'rtl',
        }}>
          🔒 נרשם סופית בפנקס הדיגיטלי
        </div>
        <div style={{fontFamily: theme.font, fontSize: 24, color: theme.colors.muted, direction: 'rtl'}}>
          אף חבר לא יחויב / יזוכה ללא הסכמה מלאה
        </div>
      </div>
    </AbsoluteFill>
  );
};
