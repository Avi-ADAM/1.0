# PLAN — זיכרון שיחה מובנה לצ'אט (Mastra Memory)

> **סטטוס: מיושם (2026-08-05).** השלב שאחרי
> [`PLAN_MASTRA_STORAGE.md`](PLAN_MASTRA_STORAGE.md): שם נבנה האחסון המתמיד
> (קונטיינר Postgres ייעודי), כאן הוא מחובר סוף-סוף לצ'אט.
> זהו סעיף 4 של שלב 1 ב-[`PLAN_AI_ERA.md`](PLAN_AI_ERA.md).

---

## 1. מה היה חסר

האחסון עבד — telemetry ו-workflow snapshots נכתבו ל-Postgres — אבל
`mastra_threads` ו-`mastra_messages` נשארו ריקים, כי **אף agent לא הגדיר
`memory:`**. ההיסטוריה הגיעה מהלקוח בכל בקשה (`history` ב-body), וזה גרר שלוש
בעיות:

1. **אין המשכיות** — הלקוח שומר ב-`localStorage`; דפדפן אחר, מכשיר אחר או
   ניקוי אחסון = הבוט פוגש אותך בפעם הראשונה.
2. **ההיסטוריה מגיעה מסוננת** — הקוד היה חייב להשליך כל הודעה עם tool-call לפני
   ששלח אותה למודל, כי thought_signature של Gemini לא שרד את הסיבוב דרך הלקוח.
   כלומר המודל לא ראה מה הוא עצמו עשה בתור הקודם.
3. **אין פרופיל** — גם אם השיחה נשמרת, אין שום דבר *מובנה*: כדי לדעת "מה השם
   שלו" צריך לקרוא מחדש 10 הודעות טקסט חופשי בכל תור.

## 2. מה קיים עכשיו

שני דברים נפרדים נשמרים לכל משתמש, שניהם בקונטיינר ה-Postgres של Mastra:

| | scope | מה נשמר | מי כותב |
|---|---|---|---|
| **היסטוריית הודעות** | thread (שיחה) | 10 התורות האחרונים, כולל קריאות כלים | אוטומטית ע"י Mastra בסוף כל תור |
| **זיכרון עבודה (מובנה)** | resource (**המשתמש**, חוצה שיחות) | אובייקט JSON לפי סכימת zod | הסוכן, דרך הכלי `updateWorkingMemory` |

### 2.1 הסכימה — למה JSON ולא markdown

Mastra תומך בשתי צורות של working memory: תבנית markdown (המודל כותב מחדש את
כל הבלוק) או **סכימה** (המודל שולח רק את השדות שהשתנו, merge אוטומטי). בחרנו
סכימה, ב-`src/mastra/lib/chatMemory.ts`:

```ts
displayName, language, activeProject{id,name,role}, currentFocus,
skills[], goals[], followUps[], preferences{tone,workHours,notes}, facts[]
```

הסיבה היא לא נוחות אלא **שלב 4**: הסיכום היומי וההצעות הפרואקטיביות צריכים
לקרוא את הפרופיל בקוד (`resource.workingMemory` → `JSON.parse`), לא לבקש
מ-LLM לחלץ שם פרויקט מתוך פסקה. סכימה גם מוזילה: merge semantics = המודל
מחזיר שדה אחד במקום לשכתב את כל הבלוק בכל עדכון.

### 2.2 מי מקבל זיכרון

`memory: getChatMemory()` נוסף לחמישה סוכנים — help, timer, navigation, sale,
task. **לא** ל-`intent-agent` (מסווג טהור שמחזיר JSON; זיכרון רק היה מייקר
אותו ומזהם את ה-thread) ולא ל-`nonreg-bot` (אנונימי — אין זהות יציבה לתלות בה
resource). כולם חולקים instance אחד של `Memory` ואת אותו thread, כך שניתוב
מ-help ל-timer באמצע שיחה לא מאבד את החוט.

הטקסט שמסביר לסוכן מתי לעדכן את הזיכרון (`workingMemoryInstructions`) יושב
במקום אחד ומצורף לכל אחד מהם — אחרת כל סוכן היה מפתח סגנון כתיבה משלו לתוך
אותו פרופיל.

### 2.3 thread ו-resource — ואיך זה בטוח

```
resource = `user-${userId}`            ← הפרופיל נודד עם המשתמש
thread   = `u${userId}-${clientKey}`   ← השיחה
```

`clientKey` נוצר בדפדפן (`chatStore.threadId()`, נשמר ב-`localStorage`) ונשלח
כ-`threadId` בגוף הבקשה. הוא **קלט לא מהימן**, ולכן:

- מתקבל רק אם הוא תואם `^[A-Za-z0-9_-]{8,64}$` — אחרת נופלים ל-`default`;
- הוא תמיד מקבל את הקידומת `u<userId>` מה-cookie, כך ש-`../u99-abcdef` שנשלח
  ע"י משתמש 42 מגיע ל-`u42-default` ולעולם לא ל-thread של 99;
- Mastra עצמו אוכף בעלות thread↔resource בקריאה.

הכפתור "שיחה חדשה" (`chatMessages.clear()`) מייצר `clientKey` חדש — אחרת
ניקוי מקומי היה מנקה את המסך והשרת היה ממשיך את השיחה הישנה כאילו כלום.

### 2.4 מה השתנה בזרימת הבקשה

ב-`routeToAgent` (`src/mastra/workflows/chat-workflow.ts`):

- **כשזיכרון פעיל**: לסוכן נשלחת **רק ההודעה הנוכחית**. את ההיסטוריה מזריק
  Mastra מהאחסון. לשלוח את שתיהן זו טעות אמיתית ולא כפילות תמימה — כל תור היה
  נשמר פעמיים, וחותמות הזמן של הלקוח היו מערבבות את סדר ה-thread.
- **תקציר הפרויקט** (`buildProjectContextPreamble`) עבר מהודעת המשתמש
  ל-`system` של הקריאה. הוא נבנה מחדש בכל בקשה; אילו נשאר משורשר להודעה, כל
  snapshot היה נשמר לנצח בתוך ה-thread ומזדקן שם.
- `analyzeIntent` ממשיך לעבוד על ההיסטוריה מהלקוח — הוא מסווג, לא משוחח, ואין
  סיבה לשלם על קריאת אחסון בשבילו.

### 2.5 מתגים

| env | ברירת מחדל | משמעות |
|---|---|---|
| `MASTRA_DB_URL` | `:memory:` | בלי URL מתמיד **הזיכרון כבוי לגמרי** — אחסון שמת עם התהליך ומתחזה לזיכרון גרוע מאין זיכרון. |
| `MASTRA_MEMORY` | (ריק) | `off` = כיבוי מיידי בלי דיפלוי; חוזרים להיסטוריה מהלקוח. |

## 3. אימות

```bash
# מי כבר מדבר עם הבוט
docker exec mastra-postgres psql -U mastra_user -d mastra \
  -c 'select id, "resourceId", "createdAt" from mastra_threads order by "createdAt" desc limit 10;'

# כמה הודעות נשמרו
docker exec mastra-postgres psql -U mastra_user -d mastra \
  -c 'select count(*) from mastra_messages;'

# הפרופיל המובנה של משתמש
docker exec mastra-postgres psql -U mastra_user -d mastra \
  -c "select \"workingMemory\" from mastra_resources where id = 'user-42';"
```

בדיקות: `src/mastra/lib/chatMemory.test.ts` מכסה את גבולות ה-scope (כיבוי
בברירת מחדל, kill switch, אנונימי, מפתח מזויף). ריצת אינטגרציה מול libSQL
אמיתי (thread → הודעות → `mastra_resources`) בוצעה ידנית ואומתה לפני המסירה.

## 4. מה זה **לא** עושה

- **אין semantic recall.** הוא דורש vector store, וה-image בשרת הוא
  `postgres:16-alpine` בלי pgvector. זה שלב 1.5 של `PLAN_AI_ERA` והמעבר הוא
  החלפת image ל-`pgvector/pgvector:pg16` (אותו volume) + `CREATE EXTENSION`.
- **אין observational memory.** Mastra מציע שכבה שמריצה agents של תצפית
  ורפלקציה על השיחה. היא מוסיפה קריאות LLM לכל תור — לא לפני שיש מדידה של
  העלות הנוכחית.
- **`/api/mastra-v2` לא עודכן.** זה נתיב legacy שמשמש רק את
  `/test-mastra-v2`; הוא לא שולח `threadId` ולכן נופל ל-thread `default` של
  המשתמש. עובד, פשוט לא נפרד לפי שיחה.
- **`generateTitle` כבוי** — כותרת thread שנוצרת ב-LLM היא קריאה נוספת לכל
  שיחה חדשה, ואף UI עדיין לא מציג כותרות.

## 5. מה חייב לקרות אחר כך

1. **ניקוי/שימור (retention).** `PLAN_MASTRA_STORAGE.md` §5 כבר סימן שאין מנגנון
   ניקוי; עד היום זה היה תיאורטי כי הטבלאות היו ריקות. מעכשיו הן גדלות עם כל
   תור של כל משתמש. צריך מחיקה מתוזמנת של threads ישנים (הפרופיל ב-
   `mastra_resources` קטן ויכול להישאר).
2. **גיבוי.** אותו §6 — עכשיו יש שם דאטה שאובדנה מורגשת למשתמש, לא רק traces.
3. **חשיפת הפרופיל למשתמש.** זיכרון שהמשתמש לא יכול לראות או למחוק הוא בעיה,
   לא פיצ'ר. מסך "מה הבוט יודע עליי" + כפתור מחיקה, מעל
   `memory.updateWorkingMemory` / `deleteThread`.
4. **שלב 4** קורא את `mastra_resources` לסיכום היומי ולהצעות — זו הסיבה שהזיכרון
   מובנה מלכתחילה.
