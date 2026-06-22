# תכנית: סרטון הסיור בתהליך — 1💗1

סרטון הסבר (~42 שניות) שמלווה משתמש חדש מהרשמה ועד חלוקת רווחים.
הקבצים נמצאים ב-`remotion/src/scenes2/` ומורכבים ב-`remotion/src/Promo2.tsx`.

> **להפעלה:** `cd remotion && npm run dev` — בחרו `Promo2-Landscape` מהתפריט.

---

## סטוריבורד מלא

| # | קובץ | משך | תוכן מונפש | מקום ריק לנכס |
|---|---|---|---|---|
| 1 | `S1_Intro.tsx` | 3.5ש | לוגו + שרשרת 5 שלבים (הרשמה→ריקמה→משימות→אשרור→חלוקה) | — |
| 2 | `S2_Signup.tsx` | 5ש | שלבי הרשמה עם progress bar | 📱 **צילום מסך** → `public/signup.png` |
| 3 | `S3_Import.tsx` | 4.5ש | 4 אפשרויות ייבוא (URL / CV / חופשי / AI) | 🎨 **תמונת AI** → `public/import-art.png` |
| 4 | `S4_Rikma.tsx` | 5ש | תגיות עריכה + אנימציית טיוטה→אישור→LIVE | 📱 **צילום מסך** → `public/rikma-edit.png` |
| 5 | `S5_Tasks.tsx` | 6ש | כרטיסי משימה + משאב חד-פעמי + משאב חודשי + טיימר | 📱 **צילום מסך** → `public/task-create.png` |
| 6 | `S6_Negotiation.tsx` | 5.5ש | בועות צ'אט שותף↔מועמד | 🎬 **קליפ AI** → `public/negotiation.mp4` |
| 7 | `S7_Approval.tsx` | 5ש | 4 שותפים מאשרים ✓ → נעילת פנקס | — |
| 8 | `S8_Products.tsx` | 7ש | זרימה: לקוח קונה→מוצר→ביצוע→תקשורת→סגירה | 📱 **צילום מסך** → `public/product.png` |
| 9 | `S9_Revenue.tsx` | 5ש | ברים מתמלאים עם % לכל חבר, סכום מתגלגל | — |
| 10 | `S10_CTA.tsx` | 4ש | לוגו + כפתור ירוק + 1lev1.com | — |

---

## פרומפטים לכל Placeholder

### 📱 צילומי מסך מהאתר

הקובץ `1lev1 Onboarding Flow.html` (שורש הפרויקט) מכיל את מסכי ה-Onboarding בדפדפן.
פתחו אותו ב-Chrome (File → Open), לחצו **F12 → Device Toolbar → iPhone 14 Pro Max**,
בצעו Screenshot של המסכים הבאים:

| נכס | מסך לצלם | תיקיית יעד |
|---|---|---|
| `public/signup.png` | M1 "כניסה מהירה" + M2 "בחירת מסלול" (שניהם) | `remotion/public/` |
| `public/rikma-edit.png` | "אישור פרויקט" / עריכת הריקמה | `remotion/public/` |
| `public/task-create.png` | יצירת משימה / משאב | `remotion/public/` |
| `public/product.png` | בניית מוצר / ניהול לקוח | `remotion/public/` |

**אחרי שמירת PNG** — פתחו את הקובץ הרלוונטי ב-`scenes2/` וכתבו:
```tsx
// החליפו את:
<Placeholder kind="screenshot" label="..." prompt="..." />
// ב:
<Img src={staticFile('signup.png')} style={{width: 640, height: 700, objectFit: 'cover', borderRadius: 24}} />
```

---

### 🎨 תמונת AI — סצנה 3 (ייבוא נתונים)

**כלי:** Midjourney v7 / FLUX / Ideogram

**פרומפט (אנגלית):**
```
Minimalist flat digital illustration: a lightning bolt pulling data streams
(CV document, LinkedIn logo, URL icon, AI brain) into a glowing user profile card.
Dark navy background #1e2145, teal accent #5be2a9, gold accent #bf953f.
Clean geometric shapes, no text, no people, smooth gradients.
Aspect ratio 9:11 for portrait. Style: modern tech product illustration.
```

**שמירה:** `remotion/public/import-art.png` (580×640px)

---

### 🎬 קליפ AI — סצנה 6 (מו"מ)

**כלי:** Runway Gen-4 / Kling / Sora

**פרומפט (אנגלית):**
```
Two business silhouettes sit on opposite sides of a glowing translucent table.
They exchange golden light-beam message packets back and forth in slow motion.
Dark futuristic room with teal and gold ambient lighting.
No dialogue, no text overlay, seamlessly loopable, 5 seconds, cinematic.
Camera: static wide shot. Style: corporate AI product film.
```

**פורמט:** MP4, 1920×1080, ≤5ש, ללא אודיו

**שימוש בקוד (`S6_Negotiation.tsx`):**
```tsx
// החליפו את ה-<Placeholder> ב:
import {Video} from 'remotion';
<Video src={staticFile('negotiation.mp4')} startFrom={0} style={{width: 600, height: 620, borderRadius: 24, objectFit: 'cover'}} />
```

---

## צ'קליסט לפני הרינדור הסופי

- [ ] כל 4 צילומי המסך שמורים ב-`remotion/public/`
- [ ] תמונת ה-AI של ייבוא הנתונים שמורה
- [ ] קליפ ה-AI של המו"מ שמור וה-`<Placeholder>` הוחלף ב-`<Video>`
- [ ] בדקו RTL בכל הסצנות — הטקסט צריך להיות מיושר ימינה
- [ ] הוסיפו מוזיקת רקע: `remotion/public/music2.mp3` ← הדליקו `WITH_MUSIC = true` ב-`Promo2.tsx`
- [ ] הריצו `npx tsc --noEmit` — חייב לצאת נקי
- [ ] רינדרו: `npm run render2` (ראו `package.json` שעודכן)
- [ ] בדקו את הוידאו עם subtitle/קריינות לפני פרסום

---

## תסריט קריינות מסונכרן

| סצנה | טקסט לקריינות |
|---|---|
| 1 | "ב-1💗1, כל תהליך ניהול הפרויקט — בהסכמה מלאה." |
| 2 | "הרשמה בדקות: מייל, אימות, ובחירת מסלול." |
| 3 | "ייבוא נתונים מהיר — הדביקו לינק, העלו CV, או תנו תיאור. ה-AI עושה את השאר." |
| 4 | "מגדירים את הריקמה, עורכים פרטים, ומפרסמים — אחרי שכל השותפים אישרו." |
| 5 | "יוצרים משימות עם טיימר, ומשאבים — חד פעמיים או חודשיים." |
| 6 | "מנהלים מו"מ עם המועמדים ישירות בפלטפורמה — שקוף לכולם." |
| 7 | "כל תנאי וכל השמה עוברים אשרור פה-אחד לפני שנרשמים סופית." |
| 8 | "לקוח קנה? הפלטפורמה יוצרת את המשימות אוטומטית, החברים מבצעים, ואתם מנהלים מול הלקוח — מתוך האתר." |
| 9 | "הכסף מחולק לפי תרומה יחסית — הוגן, שקוף, ואוטומטי." |
| 10 | "הקימו ריקמה עכשיו, בחינם. 1lev1.com." |

**הקלטה:** הכניסו קובץ WAV/MP3 ל-`remotion/public/vo2.mp3` ואז
הוסיפו `<Audio src={staticFile('vo2.mp3')} />` ישירות ב-`Promo2.tsx`.

---

## כיצד לשנות תזמונים

```ts
// remotion/src/Promo2.tsx
export const SCENES2 = [105, 150, 135, 150, 180, 165, 150, 210, 150, 120] as const;
//                       S1   S2   S3   S4   S5   S6   S7   S8   S9   S10
// ערכים בפריימים @ 30fps. 30 פריימים = 1 שניה.
```

---

## רינדור — פקודות

הוסיפו לתחתית `remotion/package.json` (תחת `scripts`):

```json
"render2": "remotion render Promo2-Landscape out/promo2-landscape.mp4",
"render2:vertical": "remotion render Promo2-Vertical out/promo2-vertical.mp4",
"render2:square": "remotion render Promo2-Square out/promo2-square.mp4"
```

```bash
cd remotion
npm run render2            # 1920x1080
npm run render2:vertical   # 1080x1920 — Reels
npm run render2:square     # 1080x1080 — Feed
```
