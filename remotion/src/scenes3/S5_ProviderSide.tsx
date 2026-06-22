/**
 * סצנה 5 — צד הספק: מקבל הזמנה, רואה את המשאלה, מחליט
 * ~5ש | 150f
 *
 * ממחיש את IncomingWishCard + AcceptWishOffer מנקודת מבט הספק
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placeholder} from '../Placeholder';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

const NotifBadge: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 12, mass: 0.6}});
  return (
    <div style={{
      opacity: s, transform: `scale(${s})`,
      display: 'flex', alignItems: 'center', gap: 14, direction: 'rtl',
      padding: '16px 24px', borderRadius: 20,
      background: 'rgba(191,149,63,0.12)', border: `1.5px solid ${theme.colors.goldC}`,
      boxShadow: `0 0 30px rgba(191,149,63,0.25)`,
      marginBottom: 14,
    }}>
      <div style={{fontSize: 40}}>💌</div>
      <div>
        <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 26, color: theme.colors.goldB}}>
          הגיעה הזמנה חדשה!
        </div>
        <div style={{fontFamily: theme.font, fontSize: 21, color: theme.colors.muted}}>
          נועה מ. מחפשת טיפול ספא ליום הולדת אמא
        </div>
      </div>
    </div>
  );
};

const OfferCard: React.FC<{delay: number}> = ({delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 18}});
  const showBtn = frame > delay + 24;
  return (
    <div style={{
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px)`,
      padding: '22px 26px', borderRadius: 22,
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid rgba(255,255,255,0.12)`,
      direction: 'rtl',
    }}>
      <div style={{fontFamily: theme.font, fontWeight: 700, fontSize: 26, color: theme.colors.white, marginBottom: 12}}>
        הצעת משימה עבורך
      </div>
      <div style={{display: 'flex', gap: 20, marginBottom: 16}}>
        {[['⏱', 'שעות', '2'], ['💰', 'תקציב', '420₪']].map(([ic, lb, val]) => (
          <div key={lb} style={{
            flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.04)',
            borderRadius: 14, padding: '12px 0',
          }}>
            <div style={{fontSize: 28}}>{ic}</div>
            <div style={{fontFamily: theme.font, fontSize: 19, color: theme.colors.muted}}>{lb}</div>
            <div style={{fontFamily: theme.font, fontWeight: 800, fontSize: 28, color: theme.colors.white}}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{display: 'flex', gap: 12}}>
        <div style={{
          opacity: showBtn ? 1 : 0, flex: 2,
          background: theme.gradients.green, color: theme.colors.navy,
          fontFamily: theme.font, fontWeight: 900, fontSize: 26,
          padding: '14px 0', borderRadius: 14, textAlign: 'center',
          boxShadow: '0 0 25px rgba(46,255,168,0.35)',
        }}>
          🤍 אני בפנים
        </div>
        <div style={{
          opacity: showBtn ? 1 : 0, flex: 1,
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
          color: theme.colors.muted, fontFamily: theme.font, fontWeight: 600, fontSize: 22,
          padding: '14px 0', borderRadius: 14, textAlign: 'center',
        }}>
          מו"מ
        </div>
      </div>
    </div>
  );
};

export const S5_ProviderSide: React.FC = () => {
  const title = useRise(4);
  const sub = useRise(20);

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '55px 80px', gap: 55, direction: 'rtl'}}>
      {/* Right: provider experience */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 0}}>
        <div style={{...title, marginBottom: 8}}><GoldText size={50} weight={900}>הספק מקבל הזמנה ישירה</GoldText></div>
        <div style={{...sub, fontFamily: theme.font, fontSize: 26, color: theme.colors.muted, lineHeight: 1.5, marginBottom: 22}}>
          הספק הרלוונטי מקבל הזמנה, רואה את המשאלה המלאה — ומחליט: לאשר, לנהל מו"מ, או לסרב.
        </div>
        <NotifBadge delay={28} />
        <OfferCard delay={52} />
      </div>

      {/* Left: screenshot */}
      <div style={{flex: 0.9, display: 'flex', justifyContent: 'center'}}>
        <Placeholder
          kind="screenshot"
          label="מסך הזמנת ספק"
          prompt="צילום מסך של IncomingWishCard ב-/lev או /deals: שם המשאלה, פרטי המשימה (שעות + מחיר), כפתורים 'אני בפנים' ו-'מו״מ'. שמור כ-public/cons-provider.png (620×700px)."
          width={580}
          height={660}
        />
      </div>
    </AbsoluteFill>
  );
};
