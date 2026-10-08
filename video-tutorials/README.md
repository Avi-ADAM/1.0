# סרטוני הדרכה — הקלטות שאפשר להסריט מחדש

כל סרטון הדרכה/פרסומת של האתר מתחיל כאן כקובץ JSON שמתאר את המהלך: מי
לוחץ על מה, באיזה סדר, ומה הקריין אומר בכל סצנה. כשהאתר משתנה — מריצים שוב
את אותו קובץ ומקבלים צילום חדש, מתוזמן מחדש, בלי לצלם ידנית.

ההרכבה (קריינות, כתוביות, מוזיקה, זומים) נעשית ב-OpenMontage
(`../../OpenMontage`, pipeline `screen-demo`), שקורא את הקליפים ואת
`timeline.json` שהמקליט כותב.

## התקנה (פעם אחת)

```bash
cd video-tutorials
npm install
npx playwright install chromium
```

צריך גם ffmpeg. אם `ffmpeg` לא ב-PATH, המקליט משתמש בזה שמגיע עם Remotion
של OpenMontage, או בנתיב שב-`FFMPEG`.

## התחברות — פעם אחת לכל משתמש

הסשנים מוגדרים ב-`sessions.json`: `guest` (אורחת), `customer` (לקוחה בדיקה 3),
`sup1` / `sup2` (שני ספקים). לכל אחד host משלו (`customer.localhost:5173` וכו'),
כך שכולם מחוברים בבת אחת. שרת הפיתוח צריך לרוץ על 5173.

```bash
npm run login -- customer sup1 sup2
```

נפתח חלון לכל משתמש; מתחברים בו ידנית. ברגע שה-cookie נוצר, המצב נשמר
ל-`.auth/<session>.json` (ב-gitignore) — סיסמאות לא נשמרות ולא נקראות מ-`.env`.
כשהקלטה אומרת שסשן לא מחובר, מריצים שוב.

## הקלטה

```bash
npm run record -- flows/concierge-e2e.json              # הכל
npm run record -- flows/concierge-e2e.json --scene s02-write-wish
npm run record -- flows/concierge-e2e.json --from s06-customer-chooses --vars out/concierge-e2e/<run>/vars.json
npm run record -- flows/concierge-e2e.json --dry        # רק בודק שהסלקטורים עדיין תופסים
```

> ב-Git Bash: `MSYS_NO_PATHCONV=1` לפני הפקודה, אחרת נתיבים כמו `/wish/new` נהרסים.

הפלט ב-`out/<flow>/<run>/`:

| קובץ | מה |
|---|---|
| `scene-<id>.mp4` | קליפ לכל סצנה, 1920×1080, 30fps, H.264 |
| `timeline.json` | לכל צעד: מתי התחיל ונגמר בתוך הקליפ, איפה האלמנט היה על המסך (`box`), איפה הסמן (`cursor`), ו-`mark`. מכאן מתזמנים קריינות, כתוביות, זומים והדגשות |
| `vars.json` | ערכים שנשמרו בדרך (`wishId`, `dealId`…) — להקלטה חוזרת של סצנה בודדת |
| `error-*.png` / `error-*.aria.yml` | אם צעד נכשל: צילום מסך ועץ הנגישות של הדף באותו רגע — בדרך כלל מספיק כדי לתקן את הסלקטור |

## איך זה נראה טוב

- **1920×1080 עם פריסה של מחשב נייד:** הדף מוצג ב-viewport של 1280×720 ומוגדל
  פי 1.5 (CSS zoom), כך שהטקסט גדול וקריא והצילום חד ב-1080p.
- **סמן מונפש ואדוות לחיצה** — בצילום headless אין סמן של מערכת ההפעלה.
- **`setup`** רץ לפני שהמצלמה מתחילה, כך שהקליפ נפתח על דף טעון.
- **warmup** — Vite מקמפל כל דף בביקור הראשון (עד 20 שניות של מסך לבן);
  המקליט פותח כל דף פעם אחת מראש.

## כתיבת flow

ראו `flow.schema.json` ואת `flows/concierge-e2e.json`. סצנה:

```json
{
  "id": "s02-write-wish",
  "session": "customer",
  "narration": "הטקסט שהקריין יגיד בסצנה הזאת",
  "setup": [{ "do": "goto", "url": "/wish/new" }],
  "steps": [
    { "do": "type", "target": { "role": "textbox", "name": "/במשפט אחד/" }, "text": "${wishTitle}" },
    { "do": "click", "target": { "role": "button", "name": "פרסום המשאלה" }, "mark": "publish" },
    { "do": "waitForUrl", "match": "/concierge/\\d+" },
    { "do": "save", "as": "wishId", "fromUrl": "/concierge/(\\d+)" }
  ]
}
```

**סלקטורים** — לפי סדר עדיפות: `role`+`name` (שורד את רוב העיצובים מחדש) ←
`text` / `label` / `placeholder` ← `testid` ← `css` (הכי שביר). `name` יכול
להיות `"/regex/"`. `{ "any": [...] }` — הראשון שמופיע, לתקופת מעבר בין שני
נוסחים של אותו כפתור.

**לגלות את השמות:** `npm run inspect -- customer /concierge/123` כותב צילום
מסך ועץ נגישות (role + שם לכל אלמנט) ל-`out/inspect/`.

**צעדים:** `goto` `reload` `click` `hover` `check` `type` `fill` `select`
`upload` `press` `scroll` `wait` `waitFor` `waitForUrl` `highlight` `save`
`assert` `screenshot` `mark`.

**סצנה מאחורי הקלעים** (`"record": false`) מזיזה את הסיפור קדימה בלי לצלם —
למשל הספק השני שמגיש הצעה, כשהסרט כבר הראה איך מגישים.

**`localStorage`** (בסצנה או ב-`defaults`) — מה שדפדפן של חבר אמיתי כבר זוכר,
נקבע לפני שהאתר נטען: `{"lev:view": "list"}` פותח את הלב בתצוגת רשימה (בתצוגת
המטבעות רוב הכרטיסים מחוץ למסך), `{"moachGuide_${rikmaId}": "done"}` מדלג על
חלון המדריך של מוח הרקמה. גם המפתחות עוברים החלפת `${…}`.

**פעולה בודדת בלי דפדפן גלוי:** `node action.mjs sup2 refreshMySuggestions` מריץ
פעולה של מערכת הפעולות בשם המשתמש (מתוך הקונטקסט שלו, עם העוגייה שלו). שימושי
בין צילומים — למשל לחשב מחדש התאמות אחרי שינוי כישורים. פרמטרים כ-JSON בארגומנט
שלישי; ב-PowerShell 5.1 המירכאות נבלעות, אז מ-Bash.

**בחירת טייקים:** `out/<flow>/takes.json` אומר לעריכה איזה טייק של כל סצנה
נכנס לסרט (`"run"`), ואם רק חלק ממנו (`"useSteps": "0-7"`). צילום מחדש של
סצנה לא מחליף את הבחירה עד שמעדכנים את הקובץ.

## נתונים

ההקלטה עובדת מול שרת הפיתוח המקומי, שמדבר עם ה-Strapi **האמיתי**: כל הרצה של
flow שיוצר משאלה יוצרת שורות אמיתיות בפרודקשן. לכן כותרות כוללות
`(הדגמה ${RUN})`, והמשתמשים הם משתמשי הבדיקה בלבד.
