/**
 * סצנה 4 — התאמת ספקים מהקהילה
 * ~5.5ש | 165f
 *
 * ספקים צצים על המסך עם ציון התאמה ושם הפרויקט
 */
import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Placeholder} from '../Placeholder';
import {theme} from '../theme';
import {GoldText, useRise} from '../components';

interface Provider {
  avatar: string; name: string; project: string;
  score: number; badge: string; forNeed: string; delay: number;
}

const ProviderCard: React.FC<Provider> = ({avatar, name, project, score, badge, forNeed, delay}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 16}});
  const pct = Math.round(score * 100);
  return (
    <div style={{
      opacity: s, transform: `translateY(${interpolate(s, [0, 1], [28, 0])}px)`,
      padding: '18px 22px', borderRadius: 20,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.12)',
      direction: 'rtl', width: 320,
    }}>
      {/* Header */}
      <div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10}}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', background: theme.gradients.green,
          color: theme.colors.navy, fontFamily: theme.font, fontWeight: 800, fontSize: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{avatar}</div>
        <div>
          <div style={{fontFamily: theme.font, fontWeight: 700, fontSize: 24, color: theme.colors.white}}>{name}</div>
          <div style={{fontFamily: theme.font, fontWeight: 400, fontSize: 19, color: theme.colors.muted}}>{project}</div>
        </div>
      </div>
      {/* Match score */}
      <div style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8}}>
        <div style={{flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 10}}>
          <div style={{width: `${pct}%`, height: '100%', borderRadius: 6, background: theme.gradients.green}} />
        </div>
        <div style={{fontFamily: 'monospace', fontWeight: 800, fontSize: 22, color: theme.colors.green}}>{pct}%</div>
      </div>
      <div style={{fontFamily: theme.font, fontSize: 19, color: theme.colors.muted}}>{forNeed}</div>
      <div style={{
        marginTop: 8, display: 'inline-block',
        background: 'rgba(191,149,63,0.15)', border: `1px solid ${theme.colors.goldC}`,
        color: theme.colors.goldB, fontFamily: theme.font, fontWeight: 600, fontSize: 17,
        padding: '3px 12px', borderRadius: 999,
      }}>{badge}</div>
    </div>
  );
};

const PROVIDERS: Provider[] = [
  {avatar: 'נג', name: 'נועה גולן', project: 'ספא טבע · חיפה', score: 0.91, badge: 'פה אחד 5/5', forNeed: 'לטיפול ספא', delay: 30},
  {avatar: 'תל', name: 'תמר ל.', project: 'אמהות עוזרות זו לזו', score: 0.78, badge: 'ערבות הדדית', forNeed: 'לבייביסיטר', delay: 50},
  {avatar: 'יכ', name: 'יואב כ.', project: 'Lift · הסעות', score: 0.72, badge: 'דירוג 4.9', forNeed: 'להסעה', delay: 70},
  {avatar: 'רש', name: 'ספא הנמל', project: 'רני שני', score: 0.74, badge: 'חדשה ב-1💗1', forNeed: 'לטיפול ספא', delay: 90},
];

export const S4_Matching: React.FC = () => {
  const frame = useCurrentFrame();
  const title = useRise(4);
  const sub = useRise(18);

  const countShown = PROVIDERS.filter(p => frame >= p.delay).length;

  return (
    <AbsoluteFill style={{flexDirection: 'row', alignItems: 'center', padding: '55px 80px', gap: 55, direction: 'rtl'}}>
      {/* Right */}
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 16}}>
        <div style={{...title}}><GoldText size={52} weight={900}>Lev מוצאת ספקים מהקהילה</GoldText></div>
        <div style={{...sub, fontFamily: theme.font, fontSize: 28, color: theme.colors.muted, lineHeight: 1.5}}>
          ספקים מהקהילה שמתאימים לערכים, לכישורים ולמיקום — מוזמנים אוטומטית להציע.
        </div>

        <div style={{display: 'flex', flexWrap: 'wrap', gap: 18}}>
          {PROVIDERS.map((p, i) => <ProviderCard key={i} {...p} />)}
        </div>

        <div style={{
          opacity: interpolate(frame, [115, 135], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          fontFamily: theme.font, fontSize: 24, color: theme.colors.green, direction: 'rtl',
        }}>
          ✅ {countShown} ספקים מוצאים — הצרכן רואה הצעות בזמן אמת
        </div>
      </div>

      {/* Left: AI video of community nodes connecting */}
      <div style={{flex: 0.85, display: 'flex', justifyContent: 'center'}}>
        <Placeholder
          kind="ai-video"
          label="קליפ: רשת קהילה מתחברת"
          prompt="Runway/Kling: glowing network of 15 human silhouettes on a dark navy background. Teal connector lines light up one by one, forming clusters. Camera slowly zooms out to reveal the full mesh. 5-second loop, cinematic, no text, teal #5be2a9 + gold #bf953f accent colors."
          width={560}
          height={600}
        />
      </div>
    </AbsoluteFill>
  );
};
