# תכנית: סרטון קונסיירז׳ (Promo3) — 1💗1

סרטון צרכני (~43 שניות). המסר: **במקום לחפש — תגידו מה אתם רוצים.**
הקבצים ב-`remotion/src/scenes3/` ומורכבים ב-`remotion/src/Promo3.tsx`.

> **להפעלה:** `cd remotion && npm run dev` → בחרו `Promo3-Landscape`.

---

## נתיבים רלוונטיים בקוד האתר

| נתיב | תפקיד |
|---|---|
| `src/routes/(reg)/concierge/new/+page.svelte` | יצירת משאלה חדשה — שדה טקסט + AI-extract |
| `src/routes/(reg)/concierge/[id]/+page.svelte` | תצוגת משאלה מלאה — צרכן רואה הצעות לפי צורך |
| `src/routes/(reg)/concierge/+page.server.ts` | טעינת רשימת המשאלות |
| `src/lib/server/ai/conciergeAgent.ts` | ה-AI שמנתח ומתאם ספקים |
| `src/lib/server/ai/extractWish.ts` | חילוץ משימות + משאבים מהטקסט החופשי |
| `src/lib/components/deals/IncomingWishCard.svelte` | כרטיס ספק — הזמנה נכנסת |
| `src/lib/components/concierge/AcceptWishOffer.svelte` | ספק מאשר / מנהל מו"מ |
| `src/lib/server/actions/configs/offerWishHelp.ts` | פעולת "אני בפנים" |
| `src/lib/server/actions/configs/materializeWish.ts` | הפיכת משאלה לריקמה בפועל |

---

## סטוריבורד מלא

| # | קובץ | משך | תוכן | Placeholder |
|---|---|---|---|---|
| 1 | `S1_ConsTitle` | 3.5ש | לוגו + "קונסיירז׳ — במקום לחפש תגידו מה אתם רוצים" | — |
| 2 | `S2_CreateWish` | 6ש | אנימציית טייפינג של משאלה + כפתורי השראה + פרסום | 📱 צילום מסך `/concierge/new` |
| 3 | `S3_LevAnalysis` | 5ש | Lev מפרק: 3 משימות + 2 משאבים צצים | — |
| 4 | `S4_Matching` | 5.5ש | 4 ספקים מהקהילה מתאימים עם ציון התאמה | 🎬 קליפ AI: רשת קהילה |
| 5 | `S5_ProviderSide` | 5ש | הספק מקבל הזמנה → רואה → "אני בפנים" / מו"מ | 📱 צילום מסך `IncomingWishCard` |
| 6 | `S6_NegoCons` | 6ש | שיחת מו"מ: ספק↔צרכן↔Lev → הסכמה → נעילה | — |
| 7 | `S7_WishView` | 5.5ש | הצרכן רואה progress לפי צורך + "הצעה מוכנה" | 📱 צילום מסך `/concierge/[id]` |
| 8 | `S8_Fairness` | 5ש | זרימת כסף + 4 עקרונות הוגנות | — |
| 9 | `S9_Fulfilled` | 4.5ש | ציטוט צרכן + צ'קמארקים + רגע ההגשמה | 🎬 קליפ AI: ספא/הגשמה |
| 10 | `S10_ConsCTA` | 4ש | "✨ פרסמו משאלה" + 1lev1.com/concierge | — |

---

## פרומפטים לכל Placeholder

### 📱 צילומי מסך

| נכס | מסך | יעד |
|---|---|---|
| `public/cons-new.png` | `/concierge/new` — שדה הטקסט עם כפתורי השראה | 640×720px |
| `public/cons-provider.png` | `IncomingWishCard` ב-`/lev` — כרטיס הזמנת ספק | 620×700px |
| `public/cons-wishview.png` | `/concierge/[id]` — רשימת צרכים + ספקים + progress | 620×700px |

**איך להחליף:**
```tsx
// ב-S2_CreateWish.tsx (למשל):
import {Img} from 'remotion';
// החליפו <Placeholder .../> ב:
<Img src={staticFile('cons-new.png')}
  style={{width: 600, height: 680, objectFit: 'cover', borderRadius: 24}} />
```

---

### 🎬 קליפ AI — סצנה 4 (רשת קהילה)

**כלי:** Runway Gen-4 / Kling

```
Glowing network of 15 human silhouettes on a dark navy background (#1e2145).
Teal connector lines (#5be2a9) light up one by one forming clusters.
Camera slowly zooms out to reveal the full mesh.
5-second seamless loop. Cinematic. No text. No voiceover.
Style: sci-fi community visualization, product film.
```

**שמירה:** `remotion/public/cons-network.mp4`

```tsx
// ב-S4_Matching.tsx — החליפו <Placeholder> ב:
import {Video} from 'remotion';
<Video src={staticFile('cons-network.mp4')} startFrom={0}
  style={{width: 560, height: 600, borderRadius: 24, objectFit: 'cover'}} />
```

---

### 🎬 קליפ AI — סצנה 9 (ההגשמה)

**כלי:** Runway / Sora

```
A woman in her 60s relaxes peacefully in a warm, serene spa room.
Soft golden afternoon light, green plants, gentle steam.
She closes her eyes and smiles softly.
Slow cinematic motion. 4-second clip.
No text, no logos.
Color palette: warm neutrals (#f5e6d3) + soft teal accents.
Style: warm aspirational lifestyle, human-centered.
```

**שמירה:** `remotion/public/cons-fulfilled.mp4`

---

## תסריט קריינות

| # | טקסט |
|---|---|
| 1 | "ב-1💗1 יש דרך חדשה לקבל מה שאתם רוצים." |
| 2 | "לא תחפשו ספק. לא תשוו מחירים. פשוט תגידו מה אתם רוצים — במילים שלכם." |
| 3 | "Lev, הסוכן החכם שלנו, מפרק את הבקשה שלכם למשימות ומשאבים בשניות." |
| 4 | "ספקים מהקהילה שמתאימים לערכים ולמיקום שלכם — מוזמנים אוטומטית." |
| 5 | "הספק רואה את הבקשה שלכם, ומחליט: לאשר, לנהל מו"מ, או לסרב." |
| 6 | "אם המחיר לא מתאים — Lev מגשרת. הסכמה נרשמת ונעולה לפני שמשהו קורה." |
| 7 | "אתם רואים כל צורך, כל ספק, כל מחיר — שקוף לחלוטין." |
| 8 | "הכסף עובר ישירות לספקים רק לאחר אישור ביצוע — אף הפתעה." |
| 9 | "המשאלה הוגשמה. כולם מרוצים." |
| 10 | "פרסמו משאלה — בחינם. 1lev1.com/concierge." |

---

## שינוי תזמונים

```ts
// remotion/src/Promo3.tsx
export const SCENES3 = [105, 180, 150, 165, 150, 180, 165, 150, 135, 120] as const;
//                       S1   S2   S3   S4   S5   S6   S7   S8   S9   S10
// 30 frames = 1 שניה
```

## רינדור

```bash
cd remotion
npm run render3            # 1920x1080 → out/promo3-landscape.mp4
npm run render3:vertical   # 1080x1920 → Reels
npm run render3:square     # 1080x1080 → Feed
```

## צ'קליסט לפני פרסום

- [ ] 3 צילומי מסך מהאתר שמורים ב-`remotion/public/`
- [ ] קליפ AI "רשת קהילה" שמור + `<Video>` מוחלף ב-S4
- [ ] קליפ AI "הגשמה" שמור + `<Video>` מוחלף ב-S9
- [ ] מוזיקה: `public/music3.mp3` + `WITH_MUSIC = true` ב-Promo3.tsx
- [ ] `tsc --noEmit` נקי
- [ ] בדיקה ב-Remotion Studio על כל 3 פורמטים
