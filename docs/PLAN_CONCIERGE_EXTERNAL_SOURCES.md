# תכנית: השלמת היצע ממקורות חיצוניים לקונסיירז' (External Offers)

> תכנית בלבד — בלי קוד. נכתב: 2026-07-29.
> משלים את [PLAN_CONCIERGE.md](./PLAN_CONCIERGE.md) — לא מחליף. מניח היכרות עם
> הפייפליין הקיים: `extractWish` → `enrichWish` → מסך הגיבוש `/concierge/[id]`.

---

## 0. העיקרון

היום הקונסיירז' מציע רק ממה שקיים **בתוך** הפלטפורמה: אנשים לפי כישורים,
משאבים פנויים (Sp), משימות מהספרייה ומוצרים (matanot). זה הלב של המערכת ותמיד
יישאר קודם. אבל כשלמשאלה יש צורך שאין לו שום מענה פנימי, המשתמשת נתקעת —
והשירות מרגיש חלקי.

**הפיצ'ר:** אחרי (ורק אחרי) ההצעות הפנימיות, המערכת משלימה את **הפערים בלבד**
בהצעות שנאספו מרחבי האינטרנט, מסוננות לפי הדרישות, המיקום והשפה של המשאלה.

### שלושה עקרונות-על

1. **פנימי קודם, חיצוני משלים.** הצעה חיצונית מוצגת רק לצורך (משימה/משאב/מוצר)
   שאין לו כיסוי פנימי מספק. ההיצע החיצוני לעולם לא מתחרה בהיצע של חברי
   הקהילה — הוא ממלא חורים.
2. **מצביעים, לא מעתיקים** (זכויות יוצרים). מציגים **מטא-דאטה עובדתית מינימלית**
   — כותרת, דומיין, משפט תיאור קצר, מחיר אם פורסם — ו**מפנים לאתר המקור**.
   לא מעתיקים תוכן, לא מסכמים תוכן מהותי, לא מציגים תמונות מהאתר, לא נותנים
   חוויית "קריאה אצלנו". פירוט מלא ב-§3.
3. **החוץ הוא הזדמנות גיוס.** כרטיס חיצוני הוא גם דרך להראות לקהילה מה חסר
   אצלנו, ובעתיד (E5) — להזמין את הספק החיצוני להצטרף כחבר/ריקמה.

---

## 1. איפה זה משתלב בפלאו הקיים

### 1.1 מה קיים היום (נקודות העגינה)

| שכבה | קובץ | רלוונטיות |
| --- | --- | --- |
| חילוץ חי | `POST /api/concierge-extract` → `extractWish` (Mastra + Gemini flash-lite) | מוציא `missions/resources/skills/categories` — אלו "הצרכים" שנחפש להם |
| גראונדינג פנימי | `src/lib/server/ai/enrichWish.ts` (qids 200/201/202/203/270) | מגדיר מה "מכוסה פנימית"; ההשלמה החיצונית רצה על מה שנשאר |
| התמדה | `ratson.ai_meta` (JSON) — ה-enrichment נשמר ביצירה ונקרא ב-`/[id]` בלי חישוב מחדש | אותו פטרן בדיוק ל-cache של הצעות חיצוניות |
| מסך גיבוש | `/concierge/[id]` — `PLAN_ROWS`: שורה לכל משימה/משאב + ספקים ממוינים | ההצעות החיצוניות נכנסות **בסוף כל שורה**, מקופלות |
| מיקום | `ratson.lat/lng/radius/location_hint/isOnline` (ר' PLAN_LOCATION_MAPS) | פילטר המיקום של החיפוש החיצוני |
| Job log | `ratson-match-job` (`mode: keyword/vector/ai_full`) | מוסיפים `mode: 'external'` לתצפיתיות ול-debounce |

### 1.2 איפה זה **לא** רץ

- **לא** במסלול ההקלדה החי של `/concierge/new` (debounce 1.2s). חיפוש רשת לוקח
  שניות ועולה כסף — אסור שיהיה על מסלול-מקש. ב-new מותר לכל היותר טיזר סטטי
  ("במסך הגיבוש נחפש עבורך גם ברשת").
- **לא** בצד לקוח. כל הקריאות לספקי חיפוש — שרת בלבד, מפתחות ב-`$env/static/private`,
  דרך ה-fetch הגלובלי המפוקץ' של `hooks.server.js` (תואם `npm run check:proxy`).

### 1.3 הפלאו המוצע

```
/concierge/[id] load
  ├─ קריאת ai_meta.enrichment (פנימי, קיים)
  ├─ gap detection: אילו PLAN_ROWS בלי ספק פנימי / עם כיסוי חלש   ← סינכרוני, זול
  └─ אם יש פערים:
       ├─ cache טרי ב-ai_meta.external?  → הצג מיד
       └─ אחרת → כפתור/טעינה עצלה: action `fetchExternalOffers`
              1. בניית שאילתות (צורך + מיקום + שפה)
              2. SearchProvider.search()          ← Gemini grounding / Tavily / Brave
              3. נורמליזציה + סינון LLM (רלוונטיות, מיקום, איכות דומיין)
              4. dedupe מול הצעות פנימיות
              5. שמירה ל-ai_meta.external + רשומת ratson-match-job(mode='external')
              6. החזרת ExternalOffer[] ל-UI
```

ברירת מחדל UX: הפאנל החיצוני נטען **עצל** (אחרי שהמסך הפנימי כבר עומד), עם
מצב-טעינה "מחפשת ברשת…". רענון ידני בכפתור "🔎 חפשי שוב ברשת" (עם debounce —
ר' §6).

---

## 2. Gap detection — מתי צורך נחשב "לא מכוסה"

מודול טהור וניתן לבדיקה: `src/lib/server/concierge/coverage.ts`.

קלט: ה-extraction + ה-enrichment השמורים. פלט לכל פריט
(`extracted_mission` / `extracted_resource` / מוצר מבוקש):

| מצב | קריטריון | חיפוש חיצוני? |
| --- | --- | --- |
| `covered` | יש שורת BOM משובצת, או ≥1 ספק פנימי עם score מעל סף | לא |
| `weak` | יש התאמות פנימיות אבל כולן מתחת לסף / בלי זמינות / מחוץ לרדיוס | כן, מסומן "יש גם אצלנו" |
| `uncovered` | אפס התאמות פנימיות | כן |

כללים:

- פריטי `importance='must'` קודמים בתקציב החיפוש; `nice` נחפשים רק אם נשאר
  מקום במכסה (§6).
- משאלה עם `isOnline=true` מוותרת על פילטר מיקום; אחרת נגזר ביטוי-מיקום
  מ-`location_hint` (עדיף — טקסט חופשי שהמשתמשת כתבה) או מעיגול lat/lng
  לרמת יישוב/אזור. **לעולם לא שולחים קואורדינטות מדויקות לספק חיצוני** (§7).
- פריט שהמשתמשת סימנה ידנית "אל תחפשי בחוץ" (E3) — מדולג.

---

## 3. גדרות משפטיות ואתיות (זכויות יוצרים) — מחייב

זה הסעיף שכל מימוש חייב לעמוד בו; הוא מתורגם ל-type קשיח ול-lint בקוד.

### 3.1 מה מותר להציג

`ExternalOffer` מכיל **אך ורק**:

| שדה | מגבלה |
| --- | --- |
| `title` | כותרת הדף/העסק כפי שהספק החזיר, עד 120 תווים |
| `snippet` | משפט תיאור **עובדתי** אחד, עד 200 תווים, מתוך ה-snippet של מנוע החיפוש (לא מתוך גוף הדף) |
| `url` + `domain` | קישור המקור, חובה, נפתח בטאב חדש |
| `price` / `currency` | רק אם פורסמו במפורש בתוצאת החיפוש |
| `locationLabel` | שם יישוב/אזור כפי שפורסם |
| `matchedNeed` | לאיזה פריט במשאלה זה שויך (פנימי שלנו) |
| `score`, `provider`, `fetchedAt` | מטא-דאטה תפעולית שלנו |

### 3.2 מה אסור

- ❌ להעתיק גוף תוכן, רשימות מחירים מלאות, תנאים, ביקורות או תמונות מהאתר.
- ❌ לסכם או לנסח-מחדש תוכן מהותי מהאתר (ה-LLM **מדרג ומסנן** תוצאות —
  לעולם לא **מחבר** תיאור משלו על סמך תוכן הדף). מה שאין ב-snippet של מנוע
  החיפוש — לא מוצג.
- ❌ להציג או לאגור מידע רגיש: פרטי קשר אישיים שנקצרו, מחירים שהושגו מאחורי
  התחברות, תוכן מדפים עם paywall.
- ❌ scraping ישיר של אתרים. עובדים רק מול **API של ספק חיפוש** שהסדיר את
  שאלת השימוש (Gemini grounding / Tavily / Brave) — לא fetch לדפי היעד.
- ❌ להציג הצעה חיצונית בלי קישור מקור חי. אין URL ⇒ אין כרטיס.

### 3.3 שקיפות ללקוחה

- כל כרטיס חיצוני נושא badge קבוע: **"מקור חיצוני — לא באחריות 1lev1"** + דומיין.
- דיסקליימר קצר בראש מדור "מהרשת": המידע נאסף אוטומטית ממנועי חיפוש, ייתכנו
  אי-דיוקים, העסקה נסגרת מול האתר החיצוני ולא דרך הפלטפורמה.
- קישורים: `target="_blank" rel="noopener nofollow"`.
- cache קצר (TTL 7 ימים, §6) כדי לא להציג מידע שהתיישן, וכפתור "דווחי על קישור
  שבור/לא רלוונטי" שמוריד את הכרטיס מה-cache.

---

## 4. ארכיטקטורה

### 4.1 שכבת ספקי חיפוש — `src/lib/server/concierge/searchProviders/`

```typescript
export interface ExternalSearchProvider {
  id: 'gemini' | 'tavily' | 'brave';
  available(): boolean;                       // יש מפתח env?
  search(q: ExternalQuery): Promise<RawExternalResult[]>;
}

export interface ExternalQuery {
  need: string;            // "צלם אירועים" — מנורמל, בלי PII
  locationLabel?: string;  // "אזור חיפה" — גס בלבד
  language: string;        // ratson.language → he/en/ru
  kind: 'mission' | 'resource' | 'product';
}
```

מימושים, לפי סדר עדיפות:

1. **`geminiGroundingProvider`** (ברירת מחדל, E0) — `GEMINI_API_KEY` כבר קיים
   ומשולב (`@ai-sdk/google` דרך `createModel.ts`). קריאה אחת עם כלי
   `googleSearch` (search grounding) מחזירה תוצאות + `groundingMetadata` עם
   URL-ים אמיתיים. אפס ספק חדש, אפס מפתח חדש. **חוק זהב:** משתמשים רק
   בתוצאות שיש להן URL ב-groundingMetadata — טקסט חופשי של המודל בלי עיגון
   נזרק (הגנת הזיה, §9.1).
2. **`tavilyProvider` / `braveProvider`** (E4, אופציונלי) — מנועי search-API
   ייעודיים עם snippets נקיים ופרמטרי locale; נכנסים רק אם איכות Gemini לא
   מספיקה. נשלטים ב-env: `TAVILY_API_KEY` / `BRAVE_SEARCH_API_KEY`.

בחירת ספק: `resolveExternalProvider()` — הראשון הזמין לפי
`CONCIERGE_EXTERNAL_PROVIDER` (env) ואז לפי הסדר למעלה. אין ספק זמין ⇒
הפיצ'ר כבוי בשקט (degrade כמו Pinecone ב-`enrichWish`).

### 4.2 הצינור — `src/lib/server/concierge/externalOffers.ts`

פונקציות טהורות + נקודת כניסה אחת:

| פונקציה | תפקיד | בדיקות |
| --- | --- | --- |
| `detectGaps(extraction, enrichment, planRows)` | §2 | unit + pbt |
| `buildQueries(gaps, ratsonGeo, language)` | צורך→שאילתה; קיצוץ למכסה; בלי PII | unit |
| `normalizeResults(raw, provider)` | אכיפת §3.1 בקוד: קיצוץ שדות, השמטת כרטיסים בלי URL, ניקוי HTML | unit |
| `rankAndFilter(offers, wish)` | קריאת LLM אחת (flash-lite): דירוג רלוונטיות/מיקום, פסילת ספאם-SEO ואגרגטורים ריקים. המודל מקבל **רק** את המטא-דאטה המנורמלת ומחזיר ids+scores — לא טקסט חדש | unit עם mock |
| `dedupeAgainstInternal(offers, enrichment)` | לא מציגים אתר של ספק שכבר הוצע פנימית | unit |
| `fetchExternalOffers(wish)` | האורקסטרציה + כתיבת cache | integration |

### 4.3 Action + API

בהתאם לכלל "כל הכתיבות דרך ה-Unified Action System":

- **Action חדש:** `src/lib/server/actions/configs/fetchExternalOffers.ts`
  - קלט: `{ ratsonId, force?: boolean }`.
  - הרשאות: `authRules` — בעלת המשאלה בלבד (`custom` על
    `ratson.users_permissions_users`, כמו שאר actions של הקונסיירז').
  - ולידציה: הפיצ'ר דלוק (`CONCIERGE_EXTERNAL !== 'off'`), מכסות (§6),
    debounce (אין ריצה < שעה מ-`ai_meta.external.fetchedAt` אלא אם `force`
    וה-cooldown הקצר עבר).
  - ביצוע: הצינור של §4.2 → כתיבת `ai_meta.external` דרך qid
    `100updateRatson` (שדה `ai_meta` כבר קיים במוטציה) → רשומת
    `ratson-match-job` עם `mode:'external'`.
  - רישום ב-`configs/index.ts` + מניפסט static authz (`ActionConfig.access`).
- **קריאה:** אין endpoint חדש — `/concierge/[id]/+page.server.ts` כבר טוען את
  `ai_meta`; מוסיפים את `external` לאובייקט שנשלח ל-UI. הטעינה העצלה מה-UI
  קוראת ל-action דרך `/api/action` הקיים.

### 4.4 מבנה ה-cache — `ratson.ai_meta.external`

```jsonc
{
  "version": 1,
  "fetchedAt": "2026-07-29T10:00:00Z",
  "provider": "gemini",
  "queries": [{ "need": "צלם אירועים", "locationLabel": "אזור חיפה" }],
  "gaps": [{ "kind": "mission", "idx": 2, "coverage": "uncovered" }],
  "offers": [ /* ExternalOffer[], עד 5 לצורך, עד 15 סה"כ */ ],
  "dismissed": ["<offerId>"]        // דיווחי "לא רלוונטי/שבור" של המשתמשת
}
```

`offerId = hash(url)` — יציב בין ריצות, מאפשר dismiss ו-dedupe.
אין שינוי סכמה ב-Strapi בכלל ל-MVP (הכל בתוך ה-JSON הקיים); התוספת היחידה
בהמשך: ערך enum `external` ל-`ratson-match-job.mode`.

---

## 5. UI

### 5.1 `/concierge/[id]` — מסך הגיבוש (העיקר)

- בכל `PLAN_ROW` עם פער: אחרי רשימת הספקים הפנימיים, מקטע מקופל
  **"מהרשת (N)"**. פתיחה מציגה כרטיסי `ExternalOfferCard`.
- שורה `covered` — אין מדור חיצוני בכלל. שורה `weak` — המדור קיים אבל תמיד
  אחרי הפנימי, עם הכיתוב "יש גם הצעות מהקהילה למעלה".
- **`ExternalOfferCard.svelte`** (`src/lib/components/concierge/`):
  badge "מקור חיצוני" · title · domain + favicon (מ-service של favicon לפי
  דומיין, לא מהאתר) · snippet · מחיר/מיקום אם קיימים · CTA ראשי
  **"פתחי באתר המקור ↗"** · פעולות משנה: "📌 שמרי כהערה בשורה" (מוסיף
  קישור+כותרת ל-`notes` של הפריט דרך `updateRatsonExtraction` הקיים) ·
  "🚫 לא רלוונטי" (dismiss).
- כפתור מדור עליון: "🔎 השלימי מהרשת" (כשאין cache) / "רועננה לאחרונה לפני X,
  חפשי שוב" (עם cache) — קורא ל-`fetchExternalOffers`.
- **אין** מסלול הזמנה/תשלום פנימי על כרטיס חיצוני. הפער בין "שמרי כהערה"
  ל"הזמנה אמיתית" הוא בדיוק המקום שבו מציעים במקביל "📣 פרסמי לקהילה"
  (הקיים) — הקהילה תמיד מקבלת את ההזדמנות.

### 5.2 `/concierge/new`

טיזר בלבד: כשהחילוץ החי מזהה צרכים שאין להם matches, שורת טקסט סטטית
"לא נמצא הכל אצלנו — במסך הגיבוש אחפש עבורך גם ברשת". בלי קריאות רשת.

### 5.3 `/wish/[id]` הציבורי

לא מציגים הצעות חיצוניות לצופים אנונימיים ב-MVP (זה מידע עבודה של בעלת
המשאלה, וגם חוסך שאלות attribution כלפי צד ג').

### 5.4 i18n

מפתחות חדשים ב-`concierge.json` × he/en/ru (badge, דיסקליימר, CTA, מצבי
טעינה/ריק/שגיאה).

---

## 6. עלויות, מכסות ו-debounce

| מנגנון | ערך התחלתי (env-configurable) |
| --- | --- |
| TTL cache | 7 ימים (`CONCIERGE_EXTERNAL_TTL_H=168`) |
| Debounce פר-משאלה | ריצה אחת לשעה מקסימום (כמו match jobs) |
| מכסת שאילתות פר-ריצה | עד 4 צרכים (musts קודם), שאילתה אחת לצורך |
| מכסה יומית פר-משתמשת | 10 ריצות (`CONCIERGE_EXTERNAL_DAILY_USER=10`) |
| תקרת עלות יומית גלובלית | מונה ריצות גלובלי; מעבר לתקרה ⇒ הפיצ'ר מחזיר "נסי מאוחר יותר" |
| Flag ראשי | `CONCIERGE_EXTERNAL=off/on` — ברירת מחדל `off` עד E2 |

הריצה כולה: קריאת חיפוש אחת לצורך + קריאת דירוג-LLM אחת (flash-lite) —
סדר גודל של אגורות לריצה עם Gemini.

---

## 7. פרטיות

- לספק החיצוני נשלחים **רק**: שם הצורך המנורמל, תווית מיקום גסה, שפה.
  לעולם לא: שם משתמשת, טקסט המשאלה המלא, קואורדינטות מדויקות, תקציב, פרטי
  קשר. `buildQueries` הוא השער היחיד החוצה — unit test שמוודא שאין שדות
  אסורים בפלט שלו.
- `location_hint` חופשי עלול להכיל כתובת מדויקת ("רחוב X 12") — `buildQueries`
  מקצץ לרמת יישוב (רשימת יישובים קיימת / geo-utils של PLAN_LOCATION_MAPS).
- ריצות נרשמות ב-`ratson-match-job` בלי תוכן השאילתות המלא (רק counts+ספק).

---

## 8. מיילסטונים

| # | תמצית | תוצר | flag |
| --- | --- | --- | --- |
| **E0** | תשתית: `searchProviders/` + `geminiGroundingProvider` + `normalizeResults` + `detectGaps`/`buildQueries` — הכל עם unit tests (ספק ממוקק) | ספריית שרת עובדת, בלי UI | – |
| **E1** | Action `fetchExternalOffers` + cache ב-`ai_meta.external` + debounce/מכסות + `ratson-match-job(mode='external')` | ריצה מקצה-לקצה מ-curl/action | `CONCIERGE_EXTERNAL=on` (dev) |
| **E2** | UI במסך הגיבוש: מדור "מהרשת" פר-שורה, `ExternalOfferCard`, כפתור השלמה, dismiss, "שמרי כהערה", i18n ×3, דיסקליימר | הפיצ'ר שמיש ללקוחה | `CONCIERGE_EXTERNAL=on` |
| **E3** | איכות: `rankAndFilter` LLM, dedupe מול פנימי, קיצוץ מיקום חכם, opt-out פר-פריט, טיזר ב-`/new` | פחות רעש, יותר פגיעות | – |
| **E4** | ספקים נוספים (Tavily/Brave) מאחורי אותו interface + A/B איכות | עצמאות מספק יחיד | `CONCIERGE_EXTERNAL_PROVIDER` |
| **E5** (עתידי) | "הזמיני את הספק להצטרף" — כרטיס חיצוני → הזמנת onboarding לספק (מייל/קישור), וכשמצטרף ההצעה הופכת פנימית; סטטיסטיקת פערים ("מה הכי חסר בקהילה") למסך moach/admin | לולאת הגיוס נסגרת | נפרד |

E0–E2 = MVP. כל מיילסטון עצמאי ו-shippable; כיבוי ה-flag מחזיר את המצב הקיים
בדיוק.

---

## 9. סיכונים ופתרונות

1. **הזיות LLM** — מודל שממציא "עסק" שלא קיים. פתרון: הצעה חיה רק אם הגיעה
   עם URL אמיתי מה-provider (grounding metadata / תוצאת API); ה-LLM בשלב
   הדירוג מקבל ids ומחזיר ids — אין לו יכולת להוסיף תוכן.
2. **תוצאות ספאם/SEO/אגרגטורים** — `rankAndFilter` פוסל, ובנוסף blocklist
   דומיינים ב-config (מתעדכן מדיווחי "לא רלוונטי").
3. **קישורים מתים / מידע שהתיישן** — TTL קצר, כפתור דיווח, ותאריך "נאסף
   ב-…" על הכרטיס. לא מאמתים קישורים ב-fetch יזום (ר' §3.2 — לא ניגשים
   לאתרי יעד).
4. **חשיפה משפטית** — §3 נאכף בקוד (`normalizeResults` קושח + type קשיח בלי
   שדות תוכן), לא רק בנוהל. שינוי עתידי שמוסיף שדה תוכן ייתקע ב-review.
5. **עלויות בורחות** — מכסות §6 + מונה גלובלי + flag כיבוי מיידי.
6. **קניבליזציה של הכלכלה הפנימית** — סדר תצוגה קשיח (פנימי תמיד קודם),
   חיפוש חיצוני רק לפערים, dedupe, ו"פרסמי לקהילה" לצד כל מדור חיצוני.
7. **תלות בספק יחיד** — interface אחיד (§4.1); Gemini הוא מימוש, לא הארכיטקטורה.
8. **תוכן לא הולם בתוצאות** — SafeSearch פרמטר אצל הספקים + פסילת קטגוריות
   ב-`rankAndFilter`.

---

## 10. קבצים שייגעו (best estimate)

### חדשים — Server

- `src/lib/server/concierge/coverage.ts` (+ `coverage.test.ts`, `coverage.pbt.test.ts`)
- `src/lib/server/concierge/externalOffers.ts` (+ tests)
- `src/lib/server/concierge/searchProviders/index.ts` (interface + resolver)
- `src/lib/server/concierge/searchProviders/gemini.ts`
- `src/lib/server/concierge/searchProviders/tavily.ts` (E4)
- `src/lib/server/actions/configs/fetchExternalOffers.ts` (+ integration test)

### עריכה

- `src/lib/server/actions/configs/index.ts` — רישום ה-action + access manifest.
- `src/routes/(reg)/concierge/[id]/+page.server.ts` — חשיפת `ai_meta.external` +
  תוצאות ה-gap detection ל-UI.
- `src/routes/(reg)/concierge/[id]/+page.svelte` — מדור "מהרשת" ב-PLAN_ROWS.
- `src/lib/components/concierge/ExternalOfferCard.svelte` (חדש).
- `src/routes/(reg)/concierge/new/+page.svelte` — טיזר (E3).
- `src/lib/translations/{he,en,ru}/concierge.json` — מחרוזות.
- Strapi (בהמשך, לא חוסם MVP): enum `external` ב-`ratson-match-job.mode` →
  `npm run types:update`.

### env חדשים

`CONCIERGE_EXTERNAL`, `CONCIERGE_EXTERNAL_PROVIDER`,
`CONCIERGE_EXTERNAL_TTL_H`, `CONCIERGE_EXTERNAL_DAILY_USER`,
(`TAVILY_API_KEY` / `BRAVE_SEARCH_API_KEY` — E4 בלבד).

---

## 11. בדיקות

- **Unit:** `detectGaps` (כיסוי מלא/חלש/ריק), `buildQueries` (מכסות, קיצוץ
  מיקום, **אין PII בפלט**), `normalizeResults` (השמטת חסרי-URL, קיצוץ אורכים,
  ניקוי HTML), `dedupeAgainstInternal`.
- **PBT (fast-check):** נורמליזציה לעולם לא מחזירה שדה מעל המגבלה / כרטיס בלי
  URL, לכל קלט ספק שרירותי.
- **Integration:** ה-action עם ספק ממוקק — כתיבת cache, debounce, מכסה יומית,
  הרשאות (רק בעלת המשאלה).
- **ידני לפני E2:** עשר משאלות אמיתיות בעברית עם מיקומים שונים — בדיקת
  רלוונטיות, שפה ומיקום של התוצאות.
