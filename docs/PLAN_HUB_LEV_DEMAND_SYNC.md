# חיבור המאגד ↔ עמוד הלב ↔ hub — Plan v1

> נכתב: 2026-07-16. משלים את [PLAN_DISCOVERY_MAP.md](./PLAN_DISCOVERY_MAP.md)
> (המפה הציבורית `/demand`), [PLAN_HOMEPAGE_MASTER.md](./PLAN_HOMEPAGE_MASTER.md)
> (ה-hub) ו-[PLAN_MATCH_SUGGESTIONS.md](./PLAN_MATCH_SUGGESTIONS.md) (המלצות הלב).

## 1. הבעיה — שתי ישויות שלא מדברות

המאגד (מפת הביקוש, `/demand`) ועמוד הלב חיו כשני עולמות נפרדים:

- **מאגד → לב/hub:** משאלות, מאגדי-ביקוש והצעות-סף לא הופיעו בשום מקום מחוץ
  ל-`/demand` — מי שנמצא בלב או ב-hub לא ידע שהם קיימים.
- **רקמות → מאגד:** משימות ומשאבים פתוחים מרקמות נמשכו אמנם ל-`/demand`
  (qids 221/222), אבל ה-normalizers **הפילו** כל פריט בלי מיקום שאינו מסומן
  אונליין — ורוב משימות הרקמות הן בדיוק כאלה. בפועל: "משימות מרקמות לא
  מופיעות במאגד".

המאגד הוא לא רק פיצ'ר איסוף-ביקוש — הוא פיצ'ר **מפה** שיכול לשרת את הלב.

## 2. מה מומש (סשן זה)

### כיוון א — כל ביקוש הרקמות מופיע במאגד

`src/lib/server/map/normalizeMapItems.ts`: משימה/משאב ללא מיקום נחשבים
**גלובליים** (`isOnline: true`) במקום להיעלם — הם מופיעים ברצועת
"🌐 אונליין / גלובלי" של `/demand`. זהה לסמנטיקת המנוע ההתאמות
(`matching/geo.ts`: פריט לא-ממוקם מתאים לכולם). נבדק ב-`normalizeMapItems.test.ts`.

### כיוון ב — המפה של המאגד בתוך עמוד הלב

- **`src/lib/server/map/loadMapData.ts`** — ה-load של `/demand` חולץ ל-helper
  משותף (`loadDiscoveryMapData`); הפרטיות נשארת בשרת.
- **`GET /api/map-data`** — אותן שכבות מנורמלות כ-JSON (cache ציבורי 60ש׳);
  אנונימי קורא דרך service token כמו העמוד הציבורי.
- **`src/lib/components/lev/LevDemandPanel.svelte`** — כפתור צף 🗺️ בלב שפותח
  bottom-sheet עם `DiscoveryMap` המלא: שש השכבות (משאלות, מאגדים, הצעות-סף,
  משימות, משאבים, מוצרים), צ'יפים להדלקה/כיבוי, רשימת גלובלי, וקישור לעמוד
  המלא. הכל נטען **עצל** — ה-fetch וה-bundle של המפה לא מכבידים על טעינת הלב.
- תרגומי `demand` נטענים עכשיו גם ב-route של lev (`translations/index.js`).

### כיוון ג — הביקוש מציץ מה-hub

- **qids `279demandCounts` + `280maagadDemandCounts`** — ספירות בלבד
  (meta.pagination.total) באותם פילטרים של שכבות המפה; 280 מופרד ו-guarded
  כמו 223 עד שקולקציות המאגד חיות בכל דיפלוי.
- **`hub/+page.server.ts`** — `streamed.demand` (`HubDemandSummary`).
- **`DemandMapTeaser.svelte`** — כרטיס ב-hub עם סה"כ ומוני-מיני פר-סוג
  (🧺🤝📣🛠️📦🎁), קישור ל-`/demand`. מוצג גם למשתמש חדש — המפה הציבורית היא
  מנוע-הגיוס (PLAN_SHARED_PURCHASE §6.2).

**אין שינויי סכמה** — הכל פרונט; ריפו 1.0b לא נגעה.

## 3. עקרון

מקור אמת אחד לשכבות המפה: qids 220–223/269 → `loadDiscoveryMapData` →
normalizers. כל עמוד שרוצה "לראות ביקוש" צורך את זה — לא שאילתות
מקבילות משלו. ספירות (hub) הן qids נפרדים קלים באותם פילטרים.

## 4. המשך (לא בסשן זה)

| # | תוצר | הערות |
|---|---|---|
| F1 | מאגדים/משאלות כ-match-suggestions בלב | הרחבת `match-suggestion` (סכמה: relation ל-maagad/ratson + kind חדש) + טריגרים ב-`openMaagad`/`joinMaagad`; ההצעה תופיע כקלף לב אמיתי, לא רק במפה |
| F2 | מרכוז המפה בלב על מיקום המשתמש | נקודות ה-user קיימות בפרופיל; ה-panel יקבל center |
| F3 | ספירות חיות ב-hub (socket) | היום זה snapshot ב-load |
| F4 | badge "חדש באזורך" על ה-FAB בלב | דורש השוואת snapshot מקומי |

## 5. אימות

- `vitest` — `normalizeMapItems.test.ts` (13) עובר; אין רגרסיות מול base
  (אותם 27 כשלונות קיימים-מראש בסוויטות לא קשורות).
- `npm run validate:qids` — 0 שגיאות (אזהרת `AsksInput` קיימת-מראש).
- `svelte-check` — אפס שגיאות חדשות בקבצים שנגעו בהם (הקיימות זהות ל-base).
- ידני: `/demand` — משימת רקמה בלי מיקום מופיעה בגלובלי; `/lev` — FAB פותח
  מפה עם כל השכבות; `/hub` — הכרטיס מציג ספירות ומקשר למפה.
