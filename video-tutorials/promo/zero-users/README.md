# "בניתי אפליקציה בסוף שבוע. משתמשים: 0" — סרטון 8 במסמך הרעיונות

27 שניות, אנכי 1080×1920, 30fps. קהל: ויבקודרים. עם קריינות: Adam על ElevenLabs v3, אותו קול
כמו במדריך הקונסיירז'. `narrate.py` מייצר את `assets/narration/n1–n5.mp3`, כל סצנה מתוזמנת למילים
שלה (הזמנים כתובים בהערות ב-`seek`), ו-`window.AUDIO` ממקם אותן. בטבלה למטה הזמנים של לפני הקריינות
(20 שניות); הסדר והתוכן זהים.

```bash
../../OpenMontage/.venv/Scripts/python.exe promo/zero-users/narrate.py --force n3   # לייצר שורה אחת מחדש
``` האנימציה כולה ב-`index.html`, ו-`../render.mjs`
מצלם אותה ל-mp4 (אותו מנוע כמו `god-partner`).

```bash
cd video-tutorials
node promo/render.mjs zero-users            # -> out/promo/zero-users.mp4
node promo/render.mjs zero-users --stills --at=1.6,4.4,8.2,13.6,16.9,19.6
```

תצוגה חיה: לפתוח את `index.html` בדפדפן, או `index.html?t=13` כדי לעצור על שנייה 13.

## סצנות

| זמן | מה רואים | קריינות (אם מקליטים) |
|---|---|---|
| 0–5 | דשבורד "האתר באוויר", מונה משתמשים 0. העכבר לוחץ "רענון" 6 פעמים ומהר יותר, השעון קופץ משבת בלילה ל"שבוע אחרי", וה-0 מאפיר | "בניתי אפליקציה בסוף שבוע. משתמשים: אפס." |
| 5–9.4 | קוד גולל ברקע. "AI כתב לך את הקוד ✓" ← "הוא לא ימכור אותו בשבילך." | "AI כתב לך את הקוד. הוא לא ימכור אותו בשבילך." |
| 9.3–15 | "פותחים משימה פתוחה ברקמה": כרטיס "מחפשת איש/אשת מכירות", תמורה "אחוזים ברקמה" ו"משכורת" נמחקת. דנה מציעה את עצמה, הכפתורים הם אישור · שיחה · הצעה נגדית (אין דחייה), נלחץ אישור ← "שותפה חדשה ברקמה" | "פותחים משימה פתוחה: מחפשת איש מכירות, תמורת אחוזים ולא משכורת." |
| 15–17.9 | "עכשיו יש לך שותפה שיש לה סיבה שזה יצליח." המונה זז 0 → 31 | "עכשיו יש לך שותפה שיש לה סיבה שזה יצליח." |
| 17.8–20 | 1lev1 · "שותפות במקום משכורת" (שם הסדרה מהמסמך) · 1lev1.com | "שותפות במקום משכורת. 1lev1." |

## פרומפטים לגמיני (לא חובה, הסרטון עובד גם בלעדיהם)

**`assets/s1.jpg`: רקע לפתיחה (0–5).** מוצג מטושטש ומוכהה מאחורי חלון הדשבורד.
> Vertical 9:16 cinematic photo, a young developer alone at a desk late at night, lit only by a laptop
> screen and a desk lamp, empty energy-drink cans and a pizza box, leaning back with hands on the head,
> staring at the screen. Dark purple and navy room, warm screen glow on the face, shallow depth of field.
> The centre of the frame is calm (a UI window will be placed over it). No readable text on the screen,
> no logos, no letters anywhere.

**`assets/clicks.mp3`: אפקט (0–5).**
> Sound effect, 5 seconds: a single computer mouse clicking, slow at first and then faster and faster
> (six clicks in total, accelerating), in a silent room at night, then a tiny disappointed exhale. No music.

**`assets/music.mp3`: פסקול מ-5.0 עד הסוף (15 שניות).**
> Instrumental, 15 seconds, no vocals. Modern lo-fi electronic for a short vertical social video.
> 0–4s: minimal, a ticking hi-hat and a muted synth pulse, a bit stuck and nerdy.
> 4–10s: a warm bass line and claps enter, a feeling of a plan coming together.
> 10–15s: bright, confident groove with a short rising synth, resolving on a clean final hit.
> Around 110 BPM. Tasteful, not epic, no drops, no lyrics.

אחרי ששומרים את הקבצים ב-`assets/`, מוסיפים אותם ל-`window.AUDIO` ב-`index.html`
(יש שם דוגמה בהערה) ומרנדרים שוב. אם האורכים לא מדויקים, `node promo/probe-clip.mjs <file>`
מראה עקומת עוצמה כדי לבחור נקודת חיתוך.

## לפני פרסום

- [ ] "דנה", "6 שנים במכירות" ומונה המשתמשים בסוף הם המחשה, לא נתונים אמיתיים
- [ ] קישור בתיאור: עמוד שמסביר איך פותחים רקמה ומפרסמים משימה פתוחה, לא סתם עמוד הבית
