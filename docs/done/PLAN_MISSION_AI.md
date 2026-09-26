# PLAN — יצירת משימה בסיוע AI (Mission AI Authoring)

מטרה: לאפשר יצירת משימה (`mission.svelte`) בכל ארבעת המסלולים, כשכולם מתנקזים
למנוע אחד משותף — בדיוק כמו `createProjectTool` אבל למשימה, ובתוספת אינטליגנציה
בטופס עצמו.

ארבעת המסלולים:
1. **טופס ידני + השלמות חכמות** — `mission.svelte` עם הצעות AI חיות.
2. **סיוע AI בתוך הטופס** — הצעת כישורים/תפקידים/דרכי-עבודה מתוך השם+התיאור,
   שיפור התיאור, ותרגום לכמה שפות.
3. **Onboarding מובנה** — אשף שלב-אחר-שלב שמשתמש באותו מנוע.
4. **יצירה אוטונומית מלאה** — דרך MCP ודרך הבוט.

---

## 0. מה כבר קיים (נשען עליו, לא בונים מחדש)

| רכיב | קובץ | תפקיד |
|------|------|------|
| טופס משימה | `src/lib/components/prPr/mission.svelte` | כולל `hydrateFromMissionName` (מילוי מתבנית), `SkillSelector`, `RichText`, ושליחה ל-`createMission` |
| יצירת משימה בשרת | `src/lib/server/actions/configs/createMission.ts` | 4 ענפים (Pendm / OpenMission+Ask / OpenMission / Mesimabetahalich); מקבל **IDs מפוענחים** |
| תבנית משימה גלובלית | `createMissionTemplate.ts` → `21createMission` | רשומת `Mission` בקטלוג (i18n-enabled: `locale`, `localizations`, `synonyms`, `embedding_id`) |
| בורר כישורים | `ui/SkillSelector.svelte` → `ui/VocabSelector.svelte` | זיהוי כפילויות סמנטי חי דרך Pinecone (`checkDuplicate`), יצירה צד-שרת + תרגום אוטומטי |
| מנוע התאמה וקטורי | `src/lib/embed/matcher.ts` (`matchCategory`/`matchAllCategories`) + `embed/pinecone.ts` | namespaces: `skills/roles/work_ways/missions/vallues`; מחזיר matched / suggestion / new |
| העשרה מול הקיים | `src/lib/server/ai/enrichWish.ts` | תבנית best-effort: וקטור→fallback, אף פעם לא זורק |
| חילוץ Gemini→prefill | `src/routes/api/analyze-business/+server.ts` | התבנית להעתיק עבור `/api/mission/suggest` |
| חילוץ מלא→התאמה | `src/mastra/workflows/analyze-cv.ts` | תבנית ה-onboarding: extract → `matchAllCategories` → 3 קבוצות |
| לוקליזציית Strapi | `src/routes/api/translations/+server.ts` | יוצר localizations לכל ה-locales דרך Groq |
| כלי MCP (prefill URL) | `src/mastra/tools/createProjectTool.ts` | מחזיר `/me?action=createproject&...` — אדם מאשר |
| כלי MCP (יצירה ישירה) | `src/mastra/tools/createTaskTool.ts` | מריץ `actionService` עם `mcpContext` + admin token |
| צרכן ה-URL | `src/routes/(reg)/me/+page.svelte` (`$effect` על `action`) | קורא params → ממלא store → פותח טופס |
| נקודת עיגון הטופס | `src/routes/(reg)/moach/[projectId]/+layout.svelte` | כאן `mission.svelte` רץ → כאן ייכנס `action=createmission` |

---

## 1. השדרה המרכזית — `resolveMissionSpec` (שרת)

קובץ חדש: `src/lib/server/mission/resolveMissionSpec.ts`

מקבל "מפרט משימה" חופשי (שמות בלבד) ומחזיר IDs מפוענחים — בדיוק מה
ש-`createMission` דורש. זה הלב שמשרת את המסלול האוטונומי.

```ts
interface MissionSpecInput {
  name: string;
  descrip?: string;
  skills?: string[]; roles?: string[]; workways?: string[]; vallues?: string[];
  nhours?: number; valph?: number; iskvua?: boolean;
  dateStart?: string; dateEnd?: string; location?: {...};
  checklist?: {...}[];
  lang: 'he'|'en'|'ar';
}
interface ResolvedMissionSpec {
  skillIds: string[]; roleIds: string[]; workwayIds: string[]; vallueIds: string[];
  suggestions: {...};           // suggestion-tier hits (similarity 0.72–0.88) לתצוגה
  newlyCreated: {...};          // פריטים שנוצרו (כי היו 'new')
  matchedMissionId?: string;    // אם השם נמצא בקטלוג → שימוש חוזר במקום כפילות
}
```

לוגיקה (מבוססת על `matchCategory` ו-`enrichWish`):
- לכל קטגוריה → `matchCategory(names, namespace)`:
  - `matched` → קח `existingId`.
  - `suggestion` → החזר להצגה (לא יוצר אוטומטית).
  - `new` → צור דרך `/api/vocab/create` (כמו ב-`VocabSelector.createNew`), שמחזיר id
    + מפעיל תרגום. שמור id.
- בדוק `matchCategory([name], 'missions')` כדי לזהות תבנית קיימת → `matchedMissionId`
  (מונע הפרה של ה-unique constraint, בדיוק כמו `hydrateFromMissionName`).
- best-effort בכל שלב: כשל בוקטור → fallback לשם הגולמי (כמו `safeMatchCategory`).

> מסלול הטופס (1+2) **לא** חייב את ה-resolver: ב-`mission.svelte` כבר יש
> `find_skill_id`/`find_role_id`/`find_workway_id` שמפענחים שמות→IDs מול ה-store,
> ו-`VocabSelector` כבר יוצר חדשים + מתרגם. ה-resolver נחוץ למסלול האוטונומי (4)
> שם אין store בצד-לקוח.

---

## 2. סיוע AI בתוך הטופס (מסלול 2)

### 2א. הצעת כישורים מהשם+התיאור
נקודת קצה חדשה: `POST /api/mission/suggest` (להעתיק את `analyze-business`).

- קלט: `{ name, descrip, lang }`.
- Gemini מחלץ אטומית: `skills` (אטומי! כמו ב-`analyze-cv`), `roles`, `workways`,
  `vallues`, ו**תיאור משופר** מוצע.
- מריץ `matchAllCategories` → `matched` (קיימים) / `suggestions` / `newItems`.
- מחזיר גם משימות-קטלוג דומות (`missions` namespace / keyword דרך `200findMissionsBySkill`)
  כדי להציע "השתמש בתבנית קיימת".

ב-`mission.svelte`:
- כפתור **"✨ הצע לי"** ליד שם/תיאור. בלחיצה → קריאה → צ'יפים שהמשתמש מאשר
  → דוחפים ל-`miData[0].selectedSkills/Roles/Workways` (אותו מסלול כמו
  `hydrateFromMissionName`, שורות 211–257).
- מצב חי אופציונלי: debounce 500ms על `missionName`+`descrip` (כמו
  `VocabSelector.onSearchInput`) שמרענן הצעות — מתחת לסף נמוך כדי לא להציף.
- זה **מרחיב** את `hydrateFromMissionName` הקיים: תבנית מדויקת קודם, ואם אין —
  הצעות סמנטיות.

### 2ב. שיפור ותרגום תיאור
נקודת קצה: `POST /api/mission/describe` `{ text, mode: 'improve'|'translate', lang }`.
- `improve` → Gemini משכתב HTML עשיר יותר באותה שפה.
- `translate` → מחזיר `{he,en,ar}` לתצוגה מקדימה.

ב-`mission.svelte` מתחת ל-`RichText` (שורה 930): שני כפתורים — **"שפר עם AI"**
(מחליף `miData[0].descrip` עם undo) ו-**"תרגם"** (תצוגה מקדימה לפני אישור).

---

## 3. פרסום רב-לשוני מקושר ל-Strapi (מסלול 2/כולם)

בהצלחת `createMission`, אם נוצרה רשומת `Mission` חדשה (לא `existingMissionId`):
- הפעל `POST /api/translations` עם
  `{ contentType: 'missions', entryId: missionId, sourceLocale: lang }` — **בדיוק**
  כמו ש-`VocabSelector` מפעיל אחרי יצירת ערך-אוצר-מילים חדש (שורות 234–240).
  זה יוצר localizations ל-`missionName`+`descrip`+`synonyms` בכל ה-locales דרך Groq.
- כישורים/תפקידים חדשים שנוצרו בטופס — `VocabSelector` כבר מתרגם אותם.
- אופציונלי: שמור `synonyms` שה-AI חילץ על רשומת ה-`Mission`.

> תואם ל-memory: היצירה תמיד ב-locale ברירת-מחדל; ה-localizations נוספים אחר-כך.

**אימות נדרש:** ה-content-type slug ב-REST של `Mission` (ל-`/api/{contentType}/{id}/localizations`).
לבדוק ב-Strapi (כנראה `missions`). יש לוודא שהאסימון `STRAPI_TOKEN` רשאי.

---

## 4. יצירה אוטונומית — MCP + בוט (מסלול 4)

שני כלים, מקבילים לשתי התבניות הקיימות:

### 4א. `prepareMissionTool` (כמו `createProjectTool` — אדם מאשר)
- מחזיר URL prefill: `/moach/{projectId}?action=createmission&name=...&skills=...&...`.
- דורש `projectId`; אם חסר — קודם `findUserProjectsTool` לבחירה.
- **חדש:** צרכן `action=createmission` ב-`moach/[projectId]/+layout.svelte`
  (מראה את `/me` שורות 460–485): קורא params → ממלא `miData[0]` → פותח `mission.svelte`.
- יתרון: AI מכין הכל, המשתמש רואה ב-`mission.svelte` עם כל ההצעות החכמות לפני פרסום.

### 4ב. `createMissionTool` (כמו `createTaskTool` — יצירה ישירה)
- מריץ `actionService.executeAction('createMission', ...)` עם `getMcpContext()` + admin token.
- **לפני** היצירה: `resolveMissionSpec` (§1) מפענח שמות→IDs ויוצר חדשים. זה הצומת
  שבו "בחירת הכישורים" של המנוע האוטונומי משתמשת ב-Pinecone בדיוק כמו הטופס.
- דורש `projectId`.

שניהם נרשמים ב-`src/routes/api/mcp/+server.ts` (`toolsToExpose`, שורות 112–127).

### 4ג. הבוט (`src/routes/api/bot/+server.js`)
הבוט הוא Gemini ישיר. להוסיף יכולת "צור משימה" שקוראת לאותו `resolveMissionSpec`
+ `actionService`, או שמחזירה את ה-prefill URL (4א) להמשך בטוח.

---

## 5. Onboarding מובנה (מסלול 3)

אשף (למשל `/onboard/mission` או צעד בזרימת ה-onboard הקיימת) שמשתמש באותו מנוע:
1. שם המשימה →
2. `/api/mission/suggest` מציע תיאור+כישורים+תפקידים →
3. תצוגת 3 פאנלים (matched / suggestions / new) — **לעשות reuse** למצגת שכבר
   בנויה ל-onboarding מ-`analyze-cv` →
4. אישור → `createMission` (+ §3 לוקליזציה).

---

## 6. סדר ביצוע מוצע

| # | משימה | סטטוס |
|---|-------|--------|
| 1 | **`resolveMissionSpec`** (`src/lib/server/mission/resolveMissionSpec.ts`) | ✅ **בוצע** |
| 2 | **`/api/mission/suggest`** (`src/routes/api/mission/suggest/+server.ts`) | ✅ **בוצע** |
| 2 | **`/api/mission/describe`** (`src/routes/api/mission/describe/+server.ts`) | ✅ **בוצע** |
| 3 | **שיפורי `mission.svelte`** — כפתורי ✨ הצע, 🪄 שפר, 🌍 תרגם + Undo + פאנל תוצאות AI | ✅ **בוצע** |
| 4 | **לוקליזציה אחרי יצירה** — fire-and-forget ב-`createMission.ts` אחרי `createMission` חדש | ✅ **בוצע** |
| 5 | **`action=createmission` צרכן** ב-`moach/[projectId]/create/+page.svelte` | ✅ **בוצע** |
| 5 | **`prepareMissionTool`** (`src/mastra/tools/prepareMissionTool.ts`) + רישום ב-MCP | ✅ **בוצע** |
| 6 | **`createMissionTool`** (`src/mastra/tools/createMissionTool.ts`) + רישום ב-MCP | ✅ **בוצע** |
| 6 | **`choosMission.svelte`** — מקבל `name`+`initialDescrip` props מ-create page | ✅ **בוצע** |
| 7 | **אשף ה-onboarding** (§5) — reuse של מנועים 1–4 בזרימת onboard | ⏳ טרם בוצע |

## 7. נקודות לאימות לפני קוד
- slug ה-REST של `Mission` עבור endpoint הלוקליזציה (§3) — **נוצל `missions`** (ניחוש סביר, יש לאמת ב-Strapi).
- ספי ה-Pinecone (`MATCH=0.88`, `SUGGESTION=0.72` ב-`matcher.ts`) — נשמרו כמות שהם; למסלול האוטונומי suggestion-tier נכלל ב-IDs כ-best-effort.

## 8. מה שנוצר בסשן זה (סיכום קבצים)

### קבצים חדשים
| קובץ | תיאור |
|------|--------|
| `src/lib/server/mission/resolveMissionSpec.ts` | ליבת הרזולוציה: שמות→IDs דרך Pinecone, יצירת vocab חדש |
| `src/routes/api/mission/suggest/+server.ts` | POST — Gemini מחלץ skills/roles/workways + matchAllCategories |
| `src/routes/api/mission/describe/+server.ts` | POST — mode: improve (שיפור תיאור) או translate (he/en/ar) |
| `src/mastra/tools/prepareMissionTool.ts` | MCP tool: מחזיר URL prefill לטופס משימה (אדם מאשר) |
| `src/mastra/tools/createMissionTool.ts` | MCP tool: יצירה אוטונומית ישירה דרך actionService |

### קבצים שעודכנו
| קובץ | שינוי |
|------|--------|
| `src/lib/components/prPr/mission.svelte` | AI state + handlers + כפתורי ✨/🪄/🌍 + פאנל הצעות + Undo |
| `src/lib/components/prPr/choosMission.svelte` | props: `name`, `initialDescrip`; מעביר `initialSpec` ל-Mission |
| `src/routes/(reg)/moach/[projectId]/create/+page.svelte` | `$effect` צרכן `action=createmission`; prefill state |
| `src/lib/server/actions/configs/createMission.ts` | fire-and-forget `/api/translations` אחרי יצירת Mission חדשה |
| `src/routes/api/mcp/+server.ts` | רישום `prepareMissionTool` + `createMissionTool` ב-`toolsToExpose` |
