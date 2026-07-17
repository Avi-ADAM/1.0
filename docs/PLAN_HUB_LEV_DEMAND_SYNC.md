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

## 4. סבב 2 — זהות-מקור בכל נקודות המגע (2026-07-16)

הצורך: משימה/משאב פתוחים יכולים להגיע משלושה מקורות — ריקמה (project), משאלה
(concierge / ratson) או מאגד ביקוש (maagad) — וכל נקודות התצוגה היו מוטות-ריקמה.

### סכמה (1.0b, ענף העבודה)

- `open-mission.maagad` + `open-mashaabim.maagad` — relation `manyToOne` אל
  `maagad` (+ צד הופכי `maagad.open_missions` / `maagad.open_mashaabims`).
- `source` enum בשניהם: `project | concierge | maagad`.
- **סדר דיפלוי**: 1.0b קודם, ואז `npm run types:update` + דיפלוי 1.0 —
  qids 209/212 בוחרים עכשיו `maagad` ו-ratson; עד דיפלוי הבקאנד הם נכשלים
  בשקט (allSettled ב-levDataLoader) וההצעות ריקות זמנית. הקריאות בעמודי
  הפרט (`getOpenMissionMaagad`/`getOpenMashaabimMaagad`) עטופות try/catch
  נפרד — העמודים ממשיכים לעבוד.

### עמודי הפרט (הגעה בלחיצה מ-/demand)

- `availableMission/[id]`: כותרת/זהות לפי מקור (ריקמה / 🤝 מאגד / 🌟 קונסיירז'
  + שם המשאלה), קישור ראוי — `/project`, `/maagad/[id]`, או **`/wish/[id]`**
  (העמוד הציבורי; הקישור הישן ל-`/concierge/[id]` היה עמוד-הבעלים).
  משימת-מאגד לא רוכבת על `applyToMission` (אין project ואין ratson) — ה-CTA
  מפנה להצעת-סף בעמוד המאגד.
- `availiableResorce/[id]`: היה קורס על משאב בלי project (גישה ישירה
  ל-`project.data.attributes`); עכשיו זהות-מקור מלאה + qid 50 מחזיר
  `source`/`ratson`. זרימת ה-Askm הישנה דורשת ריקמה — למקור משאלה/מאגד
  מוצג CTA לעמוד המקור.

### קלפי הלב (sugestmi / sugestma)

- qids 209/212 מעשירים ב-`ratson`+`maagad`; ה-builders מעבירים
  `ratsonId/Name`, `maagadId/Name`, `source`.
- `buildResourceSuggestionsFromMatchRecords` הפיל כל משאב בלי project
  ("legacy rule") — עכשיו משאיר גם מקור משאלה/מאגד.
- `processSuggestions`/`processResourceSuggestions` ממתגים: `מאגד · <שם>` /
  `קונסירג׳`, ומחשבים `sourceHref` (לחיצה על הזהות → `/wish` או `/maagad`
  במקום דיאלוג הריקמה) ו-`offerHref` (כשה-flow הרגיל לא זמין — הכפתור הראשי
  הופך לקישור "להצעה בעמוד המקור"; דחייה נשארת). מועבר דרך cards.svelte
  ו-newcoinui.svelte → projectSuggestor/mashsuggest → sugestmi/sugestma.

### הערה על משאלות → לב

פרסום משימות ממשאלה (concierge) כבר קיים: `publishWishNeedToCommunity` יוצר
open-mission עם `ratson` + מזין את מנוע ההתאמות. סבב זה השלים את התצוגה
וההפניות; מה שנותר פתוח הוא זרימת יצירה של צרכים **ממאגד** (ראה §5).

## 5. המשך (לא בסשן זה)

| # | תוצר | הערות |
|---|---|---|
| F1 | זרימת יצירה: מאגד מפרסם משימה/משאב פתוחים | הסכמה והתצוגה מוכנות (§4); חסר action בסגנון `publishWishNeedToCommunity` שמציב `maagad` + `source='maagad'` ומפעיל את מנוע ההתאמות |
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
