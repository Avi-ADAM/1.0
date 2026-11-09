# "דווקא יש לו" — סרטון 6 במסמך הרעיונות

25 שניות, אנכי 1080×1920, 30fps. האנימציה כולה ב-`index.html` (HTML/CSS, בלי ספריות);
`../render.mjs` מצלם אותה פריים אחר פריים ל-mp4.

```bash
cd video-tutorials
node promo/render.mjs god-partner            # -> out/promo/god-partner.mp4
node promo/render.mjs god-partner --stills   # כמה תמונות לבדיקה מהירה
```

תצוגה חיה: לפתוח את `index.html` בדפדפן (לולאה), או `index.html?t=12` לעצור על שנייה 12.

## סצנות

| זמן | מה רואים | קריינות (אם מקליטים קול) |
|---|---|---|
| 0–4.6 | בועת דיבור: "אם שותפות הייתה טובה, גם לאלוהים היה שותף." — כולם, תמיד | "אם שותפות הייתה טובה, גם לאלוהים היה שותף. נכון?" |
| 4.6–5.4 | קו ורוד מוחק את הבועה, "רגע." | "רגע." |
| 5.4–11 | קלף: "שלשה שותפין הן באדם", תרשים הקב״ה / אביו / אמו ← אדם. קידושין ל ע״ב | "התלמוד אומר: לכל אדם יש שלושה שותפים — הקדוש ברוך הוא, אביו ואמו." |
| 11–15.5 | "כל דיין שדן דין אמת לאמיתו נעשה שותף להקב״ה במעשה בראשית". שבת י ע״א | "ושופט שפוסק בצדק — נעשה שותף שלו בבריאה." |
| 15.5–20.8 | "הוא לא בלי שותפים. הוא פשוט בוחר אותם בקפידה, וקובע מראש מה כל אחד מביא." טבעת + שעות / טנדר / כסף עם אחוזים | "הוא לא בלי שותפים. הוא בוחר אותם בקפידה — וקובע מראש מה כל אחד מביא." |
| 20.8–25 | 1lev1 · "רקמה: שותפות עם כללים" · 1lev1.com | "רקמה. שותפות עם כללים. 1lev1." |

## תמונות מגמיני (לא חובה — הסרטון עובד גם בלעדיהן)

שומרים כ-JPG בתיקייה `assets/` בשמות האלה ומרנדרים שוב; הקוד מוסיף אותן אוטומטית
כרקע (עם הכהיה ותנועת זום איטית). כל התמונות ביחס **9:16**.

**`assets/s1.jpg` — רקע לפתיחה (0–4.6)**
> Vertical 9:16 cinematic photo, Israeli café at dusk, a middle-aged man leaning back in his chair
> with a confident smirk, mid-sentence, gesturing with one hand, a friend opposite him seen from
> behind and out of focus. Warm tungsten lights, deep purple and navy shadows, shallow depth of field.
> The upper-middle third of the frame is calm and uncluttered (a speech bubble will be placed there).
> No text, no logos, no letters anywhere in the image.

**`assets/s3.jpg` — טקסטורה לסצנות התלמוד (5.4–15.5)** — מוצגת בשקיפות 35%, אז עדיף שקטה
> Vertical 9:16 top-down photo of an old open Talmud volume on a wooden study table in a beit midrash,
> soft morning light from a window, warm parchment and honey tones, very shallow depth of field so the
> page text is completely blurred and unreadable, lots of empty soft space, gentle vignette.
> No readable letters, no people.

## וידאו מגמיני (Veo) — הפתיח החי (בשימוש עכשיו)

`assets/s1.mp4` (720×1280, 10 שניות) הוא רקע הסצנה הראשונה. הוא מתחיל מהשנייה ה-2 של
הקליפ (`CLIP_IN` ב-`index.html`), כי שם מתחיל הדיבור; הבועה כתובה בקצב שלו (שורה 1 ב-1.0–2.4,
שורה 2 ב-2.8–4.1), והסאונד של הקליפ נחתך ב-4.6 על "רגע." (`window.AUDIO`, ו-`render.mjs`
מצמיד אותו). קליפ חדש באורך אחר → לבדוק את התזמון עם
`node promo/probe-clip.mjs promo/god-partner/assets/s1.mp4` (גיליון פריימים + עקומת עוצמה).

> Vertical 9:16, 5 seconds. Israeli café at dusk. A middle-aged man leans back, smirks and says
> confidently to his friend, in Hebrew: "אם שותפות הייתה טובה, גם לאלוהים היה שותף."
> His friend raises an eyebrow. Slow push-in on the man's face. Warm tungsten light, purple-navy
> shadows, cinematic, shallow depth of field. No on-screen text.

> כתוביות בעברית ש-Veo מייצר בעצמו יוצאות לרוב שבורות — לכן "No on-screen text";
> את הטקסט שמים בעריכה.

## סאונד

`window.AUDIO` ב-`index.html` מתאר שלושה קטעים, ו-`render.mjs` חותך, מפייד וממקם אותם:

| בסרטון | מקור | מה |
|---|---|---|
| 0–4.2 | `assets/s1.mp4` מ-2.0 | הקול שלו מבית הקפה |
| 4.15–4.65 | `assets/scratch.mp3` מ-6.65 | שריטת תקליט, נחתכת על "רגע." |
| 4.65–5.4 | — | שקט |
| 5.4–25 | `assets/music.mp3` מ-25.5 | המוזיקה; הכניסה הגדולה שלה (35.5 בקובץ) נופלת על "הוא לא בלי שותפים" (15.5), פייד-אאוט מ-23.2 |

## לפני פרסום

- [ ] קידושין ל ע״ב — לאמת את הנוסח מול ספריא (שבת י ע״א נבדק מול מקורות ברשת)
- [ ] המספרים בטבעת (45% / 20% / 35%) הם דוגמה להמחשה, לא חישוב אמיתי
