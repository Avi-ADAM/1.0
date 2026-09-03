# PLAN — מ-MCP ל-Skill מפורסם: ערוץ רכישה וכלי עבודה

איך הופכים את שרת ה-MCP הקיים (`/api/mcp`) ל-**Skill** שאפשר לפרסם, כך שהוא
משרת שני קהלים בבת אחת: מפתח שמעולם לא שמע על 1lev1 ופוגש אותה בתוך הסוכן שלו,
ומשתמש קיים שרוצה להפעיל את הריקמה שלו בלי לפתוח דפדפן.

מסמכים קשורים: [`PLAN_AI_ERA.md`](PLAN_AI_ERA.md) (שלב 3ב'),
[`PLAN_EXTERNAL_TASKS_API.md`](PLAN_EXTERNAL_TASKS_API.md),
[`MOACH_AI_AGENT_GUIDE.md`](../MOACH_AI_AGENT_GUIDE.md).

---

## חלק א' — למה Skill ולא רק MCP

MCP נותן **ידיים**, Skill נותן **שיקול דעת**. סוכן שמחובר ל-MCP שלנו מקבל 20
כלים עם תיאור של שורה, בלי מושג מה זו ריקמה, שאסור להצביע בשם מישהו, ושתיקון
טיימר שגוי הוא תיקון של אחוזי בעלות. Skill הוא התיקיה שמלמדת אותו את זה — והיא
גם היחידה שניתנת לפרסום, לגילוי ולהתקנה בקליק.

חלוקת התפקידים:

| שכבה | מה נותנת | איפה חיה |
|---|---|---|
| שרת MCP | הכלים עצמם, אימות, scoping | `src/routes/api/mcp/` (קיים) |
| `npx 1lev1-mcp` | חיבור בקליק **+ התקנת ה-Skill** | npm, `1lev1-mcp` — ריפו `Avi-ADAM/1lev1-mcp` |
| **Skill** | מודל העולם, הרצפים, גבולות ההסכמה | ✅ [`Avi-ADAM/1lev1-agent`](https://github.com/Avi-ADAM/1lev1-agent) |
| **Plugin + Marketplace** | הגילוי וההפצה | ✅ אותו ריפו, ציבורי |

**מקור האמת ל-Skill הוא `1lev1-agent`.** החבילה ב-npm נושאת עותק (כדי
שההתקנה לא תדרוש רשת נוספת), ומסונכרנת ב-`npm run sync:skill`. אל תערוך את
`skills/` שבתוך `1lev1-mcp` ישירות — הוא ידרס.

**מה שהתברר בפועל על "plugin אחד שאורז הכל":** ה-plugin **לא** מכיל `.mcp.json`.
הוא היה צריך מפתח מ-`${LEV1_API_KEY}` שכמעט לאיש לא מוגדר, ולצידו ה-CLI כותב
ערך שני עם מפתח אמיתי — שני שרתים, אחד שבור, והסוכן רואה כל כלי פעמיים. לכן:
**נתיב חיבור אחד בלבד — ה-CLI.** ה-plugin מספק גילוי + Skill; ההוראה הראשונה
ב-`SKILL.md` היא לבדוק את החיבור ולהציע את `npx 1lev1-mcp` אם הוא חסר.

---

## חלק ב' — מה כבר קיים ומה חוסם

### קיים ועובד

- שרת MCP עם שני מצבים: לא-מאומת (`getPlatformInfo`, `howToConnect`) ומאומת
  (~20 כלים). המצב הלא-מאומת הוא **נכס שיווקי** — סוכן יכול לספר על הפלטפורמה
  לפני שמישהו נרשם.
- זרימת חיבור מלאה: `npx 1lev1-mcp` → `/mcp-connect` עם callback ל-localhost →
  מפתח נכתב לקונפיג. הכל בנוי.
- מפתחות עם scopes, revoked, allowed_origins ו-`lastUsedAt` ב-`apiKeys.ts`.
- זהות פר-בקשה בטוחה (`mcpContext.ts`, AsyncLocalStorage).

### חוסם — חייב תיקון לפני פרסום

1. **אוסף `api-keys` ב-Strapi ריק — אפס שורות.** זו סיבת השורש לכך שהמפתח
   שב-`.mcp.json` לא עובד. אומת ב-29.8.2026 מול הפרודקשן: הלוג מראה
   `[API Keys] Verifying key for userId: 1` → `Generated hash: f35daa33fa...` →
   `GraphQL request status: 200` → **`GraphQL returned 0 matching keys`**.
   כלומר מנגנון האימות תקין לגמרי; פשוט אין מה למצוא.
   - נשלל: draft/publish על ה-content-type (אין `publishedAt`, אין
     `publicationState` — לא מדובר בשורות שנוצרו כטיוטה).
   - נשלל: NONCE שונה — אין שורות כלל, לא שורות עם hash אחר.
   - **הבדיקה המכרעת שנותרה, וחייבת להיעשות ידנית:** להריץ `npx 1lev1-mcp`,
     לאשר בדפדפן, ואז לבדוק אם נוצרה שורה. אם POST `/api/api-keys` נכשל
     (הרשאת `api-key.create` לתפקיד Authenticated ב-Strapi היא החשוד המרכזי),
     אף משתמש לא יצליח להתחבר לעולם.
   - בלוג של 28 שעות אין **אף** בקשה ל-`/api/api-keys` או `/mcp-connect`, וכל
     36 הבקשות ל-`/api/mcp` הן מ-curl של הבדיקה הזו. אף משתמש אמיתי מעולם
     לא התחבר.
2. ✅ **בוצע — `findUserProjectsTool`.** `userId` הפך לאופציונלי ונופל חזרה
   ל-`getMcpContext().userId`. תוך כדי התגלתה **חור הרשאות**: הכלי רץ עם
   ה-service token עבור קריאות חיצוניות, כך שמפתח API יכול היה להעביר
   `userId` שרירותי ולקרוא את רשימת הריקמות של **כל** משתמש. עכשיו קורא חיצוני
   מוגבל לזהות שהמפתח אומת אליה, והבוט הפנימי (JWT) ממשיך כרגיל.
   בדיקות: `src/mastra/tools/findUserProjectsTool.test.ts` (6, עוברות).
3. ✅ **בוצע — הסרת `ask_*` / `run_*`.** `agents` ו-`workflows` כבר לא נחשפים
   ב-MCP. `MCPServer` היה ממיר כל agent ל-`ask_<key>` וכל workflow ל-`run_<key>`,
   כך שסוכן חיצוני קיבל את `ask_enhancedBotAgent`, `ask_IntentAgent`,
   `run_chatWorkflow` — הסוכן הפנימי של האתר בתוך הלולאה של הקורא. כלים
   מפורשים בלבד.
4. ✅ **בוצע חלקית — `createTaskTool`.** עדיין כותב עם `ADMINMONTHER`, אבל
   כבר לא נחשף כברירת מחדל (ראה 5). המעבר למצב הצעה נשאר לשלב 2 של
   `PLAN_AI_ERA`.
5. ✅ **בוצע — סינון לפי scopes.** הכלים מסווגים לפי רדיוס הפגיעה:
   `read` ו-`prepare` תמיד; `selfWrite` (טיימרים — נוגע רק בבעל המפתח) תמיד;
   **`sharedWrite` (`createTaskTool`, `createMissionTool`) רק עם scope
   `mcp:write`**. הקו זהה לעיקרון של הפלטפורמה: מה שנוגע רק בך פתוח, מה
   שמטיל מחויבות על אדם אחר דורש הרשאה מפורשת. מפתח מ-`npx 1lev1-mcp` נוצר
   בלי scopes ולכן מקבל את הסט הבטוח.
6. ✅ **בוצע — `/api/mcp/[apiKey]` הוצא משימוש.** מחזיר 410 עם הוראות למעבר
   ל-Bearer. מעבר לדליפת המפתח ללוגים, הוא שכפל את לוגיקת החשיפה ולכן היה
   **עוקף** את המגבלות החדשות — השארתו בחיים הייתה הופכת אותן לקישוט.
   אף מפתח מעולם לא אומת מולו (האוסף ריק), אז שום דבר לא נשבר.

### כדאי, לא חוסם

- `getProjectContextTool` (שלב 1 ב-`PLAN_AI_ERA`) נחשף גם ב-MCP — הוא מה שהופך
  "מה קורה בריקמה" מארבע קריאות לאחת.
- תיאורי כלים באנגלית עקבית. היום יש עברית באמצע תיאור (`createProjectTool`).
- `url`: `https://api.1lev1.com/api/mcp` — **נבדק ותקין**. זו האינסטנס הייעודי
  של ה-API (adapter-node מאחורי nginx, `location /api/` → `sveltekit-api:3000`),
  והבחירה בו ב-`1lev1-mcp` נכונה. הערה לתיעוד: בדיקה מרשת עם איבוד חבילות
  נראית כמו "השרת לא זמין" — זמני `connect` של 1/3/7/15 שניות הם
  SYN retransmission בנתיב, לא תקלה בשרת. הצד השרתי מחזיר SYN-ACK ב-80
  מיקרו-שניות (אומת ב-tcpdump).

---

## חלק ג' — ה-Skill שנבנה

✅ **פורסם** ב-[`github.com/Avi-ADAM/1lev1-agent`](https://github.com/Avi-ADAM/1lev1-agent)
(ציבורי). זה מקור האמת — אין עותק בריפו הזה, בכוונה, כדי שלא ייווצר drift.

```
1lev1-agent/                             ← הריפו הוא גם marketplace וגם מכיל את ה-plugin
  .claude-plugin/marketplace.json        ← ההפצה
  README.md                              ← דף הנחיתה
  LICENSE                                ← MIT
  plugins/1lev1/
    .claude-plugin/plugin.json
    skills/1lev1-platform/
      SKILL.md                           ← מתי, איך, ומה אסור
      references/concepts.md             ← מילון + מודל ההסכמה
      references/tools.md                ← מפת כלים, קלטים, מלכודות
      references/connect.md              ← חיבור, מפתחות, תקלות
```

התקנה:

```
/plugin marketplace add Avi-ADAM/1lev1-agent
/plugin install 1lev1@1lev1
```

עקרונות שנכנסו ל-`SKILL.md` ואסור לאבד בעריכות:

- **בדיקת חיבור ראשונה.** אם רק `getPlatformInfo`/`howToConnect` קיימים — לא
  להמציא דאטה, להציע `npx 1lev1-mcp`. זו נקודת ההמרה של משתמש חדש.
- **אין כתיבה חד-צדדית.** הסוכן לא מצביע, לא חותם על חלוקה ולא מקבל הצעה בשם
  אף אחד. כל דבר משותף חוזר כ-URL ממולא לאישור אנושי באתר.
- **שעות הן בעלות.** טיימר על המשימה הלא נכונה הוא אחוז בעלות לא נכון —
  ה-Skill מחייב אישור מפורש על כל רישום ידני ועל בחירה בין משימות דומות.
- **`ask_*` / `run_*` — לא להשתמש.** גם אם הם נחשפים היום.
- **שפה ושמות.** לענות בשפת המשתמש; לא להמציא שם עברי; להדהד שמות כפי שהוחזרו.

---

## חלק ד' — פרסום והפצה

### 1. ריפו ציבורי — `Avi-ADAM/1lev1-agent`

הריפו הוא גם marketplace וגם מכיל את ה-plugin. התקנה:

```
/plugin marketplace add Avi-ADAM/1lev1-agent
/plugin install 1lev1@1lev1
```

זה הפורמט הרשמי של Claude Code, והוא היחיד שנותן התקנה בשתי שורות.

### 2. ערוצי גילוי

| ערוץ | מה נדרש |
|---|---|
| רשימות skills/plugins קהילתיות (awesome-claude-code וכו') | PR עם שורה + לינק |
| רג'יסטרי MCP ציבורי | `server.json` עם `remotes` (לא `packages` — ה-CLI אינו שרת); המצב הלא-מאומת נותן demo בלי הרשמה |
| npm | לקשר את `1lev1-mcp` לריפו ה-plugin ב-`repository` וב-README |
| דף באתר — `/ai` או `/mcp` | "חבר את Claude/Cursor ל-1lev1 בשתי דקות". שלב 3ב'5 ב-`PLAN_AI_ERA` |
| README של ריקמות ציבוריות | badge "מנוהל ב-1lev1" עם לינק להתקנה |

### 3. משפך הרכישה — למה זה מביא משתמשים

```
מפתח מתקין plugin (או שואל את הסוכן על 1lev1)
   → getPlatformInfo עונה בלי הרשמה
   → ה-Skill מציע: "להפוך את הריפו הזה לריקמה?"
   → createProjectTool מחזיר URL ממולא
   → הרשמה + יצירת ריקמה בדפדפן
   → npx 1lev1-mcp → משתמש מחובר
   → כל שותף שהוא מזמין נכנס באותה דרך
```

הטריז הוא **הצוות הקטן בלי הסכם**: שלושה אנשים על ריפו משותף שלא דיברו על מה
קורה אם ייכנס כסף. ה-Skill מציע להם מבנה — משימות, שעות, חלוקה מוסכמת — בתוך
הכלי שבו הם כבר עובדים.

### 4. מדדים

- התקנות plugin (כוכבי הריפו הם proxy גרוע — למדוד `npx 1lev1-mcp` runs).
- מפתחות MCP שנוצרו מ-callback של ה-CLI, מול כאלה שנוצרו ידנית.
- מפתחות עם `lastUsedAt` בשבוע האחרון — משתמשים חיים, לא נרשמים.
- ריקמות שנוצרו מ-URL עם `?action=createproject` שמקורו בסוכן.
- שעות שנרשמו דרך `timerActionTool` מול דרך ה-UI.

---

## חלק ה' — סדר ביצוע

**גל 0 — פתיחת הדלת (חוסם הכל).** ✅ `findUserProjectsTool` תוקן;
`agents`/`workflows` הוסרו מהחשיפה. ❌ **נותר החסם היחיד:** אוסף `api-keys` ריק.
הבדיקה: להריץ `npx 1lev1-mcp`, לאשר, ולראות אם נוצרה שורה. אם לא — לבדוק את
הרשאת `api-key.create` לתפקיד Authenticated ב-Strapi. עד שזה נפתר, כל השאר
מדבר אל דלת נעולה.

**גל 1 — הקשחה.** ✅ סינון לפי scopes (`mcp:write`) ב-`/api/mcp`; ✅ הוצאת
`/api/mcp/[apiKey]` משימוש (410). ⬜ נותר: rate limiting פר-מפתח,
`touchLastUsed` בכל קריאת MCP (קיים ב-`apiKeys.ts`, לא מחובר לנתיב ה-MCP).

**גל 2 — פרסום.** ✅ הריפו הציבורי עלה. ✅ **`1lev1-mcp@2.0.0` פורסם ל-npm
ב-30.8.2026** — הסעיף הזה תיעד "נותר לפרסם `1.0.4`, הטוקן פג" והיה פשוט לא
מעודכן; `registry.npmjs.org` מראה `dist-tags.latest = 2.0.0`, וגרסאות
1.0.0/1.0.1/1.0.2 לפניה. אין 1.0.4 ולא היה. ✅ תיקון המניפסטים לסכימה.
✅ **השרת רשום ברג'יסטרי ה-MCP הרשמי** (3.9.2026,
`io.github.Avi-ADAM/1lev1`). ⬜ נותר: תיאור ו-topics לריפו `1lev1-agent`
(ראה חלק ו') — החסם היחיד שנשאר בצד ה-plugin; PR לרשימות; דף `/ai` באתר.

**גל 3 — העמקה.** `getProjectContextTool` ב-MCP; דפוס ההצעה-ואישור מ-שלב 2 של
`PLAN_AI_ERA` על הפעולות הכבדות; Skill שני ייעודי ל-`/api/v1/tasks` (גשר
issues↔מטלות) לקהל שכבר יש לו ריקמה.

---

## חלק ו' — גילוי: למה 1lev1 לא מופיע ב-buildwithclaude

`buildwithclaude.com/plugins?q=1lev1` מחזיר ריק (2.9.2026). זה **לא** אומר
שמשהו שבור — זו שאלה של איך האינדוקס עובד ומה עוד חסר לריפו.

### איך האינדוקס באמת עובד

buildwithclaude (`davepoon/buildwithclaude`) הוא **קטלוג קהילתי**, לא
ה-marketplace הרשמי של Anthropic. הוא לא דורש הרשמה ואין לו טופס הגשה — ה-PR
ב-`CONTRIBUTING.md` הוא רק ל-agents/commands/hooks שנכנסים לריפו שלו עצמו.
marketplace-ים חיצוניים נסרקים אוטומטית מ-GitHub. מה שנצפה ב-API שלו:

| עובדה | מה למדנו |
|---|---|
| `/api/marketplaces` מחזיר `total: 17784` | הקטלוג רחב, לא מסונן ידנית |
| `lastIndexedAt` של הרשומות התחתונות = היום, `05:03Z` | יש סריקה **יומית** |
| רשומות עם `stars: 0`, `pluginCount: 0`, `description: ""` נמצאות בפנים | **אין סף כוכבים ואין דרישת איכות** |
| `description` ו-`categories` של רשומה = ה-description וה-**topics** של ריפו ה-GitHub, לא של `marketplace.json` | הקטלוג מושך מטא-דאטה מ-GitHub |
| `/api/marketplaces?q=1lev1` → `{"marketplaces":[],"total":0}` | הריפו פשוט עוד לא נסרק |

התנאי היחיד להיכנס: ריפו **ציבורי** עם `.claude-plugin/marketplace.json`
בשורש, שהסורק מוצא דרך חיפוש ב-GitHub.

### מה מצב `Avi-ADAM/1lev1-agent` בפועל

✅ ציבורי · ✅ `.claude-plugin/marketplace.json` בשורש · ✅
`plugins/1lev1/.claude-plugin/plugin.json` · ✅ `skills/1lev1-platform/SKILL.md`
· ✅ LICENSE · ✅ README.

**הקומיט הראשון הוא מ-30.8.2026 — הריפו בן שלושה ימים.** ההסבר הפשוט ביותר
לחוסר הופעה הוא שחיפוש הקוד של GitHub עוד לא אינדקס ריפו חדש, קטן וללא כוכבים,
ולכן הסורק היומי לא ראה אותו. זה נפתר מעצמו — אבל שלושה דברים מגדילים משמעותית
את הסיכוי, ואחד מהם היה באג של ממש:

1. **✅ תוקן — `marketplace.json` לא תאם לסכימה.** `description` ו-`version`
   ישבו בתוך `metadata` במקום ברמה העליונה, ולרשומת ה-plugin חסרו
   `author`, `license`, `homepage` ו-`repository` — שדות שהתיעוד הרשמי מגדיר
   כנדרשים ברשומת plugin. פרסר מחמיר היה מדלג על הרשומה; פרסר סלחני היה מציג
   plugin בלי תיאור ובלי בעלים. שני המניפסטים עודכנו ל-0.1.1 עם `$schema`.
2. **⬜ לריפו אין `description` ואין `topics` ב-GitHub.** אלה בדיוק שני השדות
   שהקטלוג מעתיק (`description`, `categories`). בלעדיהם הכרטיס בקטלוג יוצא ריק
   גם אחרי שייסרק, וגם חיפוש `q=1lev1` נשען עליהם. להוסיף topics:
   `claude-code`, `claude-code-plugin`, `claude-plugin`, `agent-skills`,
   `mcp`, `mcp-server`, `partnership`, `equity`.
3. **⬜ אין קישורים נכנסים.** הסורקים מגיעים לריפו דרך רשימות. PR ל-
   `awesome-claude-code`, `hesreallyhim/awesome-claude-code`, ורשימות
   plugins/skills — הוא גם ערוץ גילוי אנושי וגם מה שמכניס את הריפו לאינדקס
   של GitHub מהר יותר.

### ✅ ה-MCP — ערוץ נפרד, ורשום

הקטלוג מציג גם ~6,250 שרתי MCP, והם **לא** מגיעים מ-`marketplace.json` אלא
מרג'יסטרי MCP ציבוריים. זה ערוץ נפרד לגמרי, ובמקרה שלנו הוא דווקא החזק יותר:
המצב הלא-מאומת מחזיר `getPlatformInfo` בלי שום הרשמה, כלומר כל מי שמדפדף
ברג'יסטרי יכול לנסות אותנו בקליק.

**פורסם ב-3.9.2026 17:28Z ל-`registry.modelcontextprotocol.io`** כ-
`io.github.Avi-ADAM/1lev1` — `status: active`, `isLatest: true`.

**רושמים את השרת המרוחק, לא את חבילת ה-npm.** `1lev1-mcp` ב-npm הוא **לא**
שרת MCP — הוא CLI שפותח דפדפן, מאמת, וכותב קונפיג. רישום שלו כ-`packages` היה
גורם ללקוח רג'יסטרי להריץ אותו כשרת stdio ולקבל זרימת דפדפן במקום פרוטוקול.
הרשומה הנכונה היא `remotes` בלבד — בדיוק הצורה של `ac.inference.sh/mcp`
שכבר רשומה שם. `server.json` יושב ב-`Avi-ADAM/1lev1-mcp` (ענף **`master`**,
לא `main` — בניגוד ל-`1lev1-agent`).

**למה `io.github` ולא `com.1lev1`.** בדף ה-MCP של buildwithclaude הכרטיס מציג
`title` + `description` בלבד; ה-`name` עם ה-namespace לא מוצג שם כלל — הוא
מזהה, לא כותרת. `com.1lev1/mcp` היה דורש **TXT על ה-apex של `1lev1.com`**
(`v=MCPv1; k=ed25519; p=…`, SPF-style, לא תחת selector), ושם כבר יושבות שלוש
רשומות — SPF של Zoho, `google-site-verification` ו-`zoho-verification`. עריכה
שדורסת אותן במקום להוסיף מפילה את אימות המייל היוצא. התמורה לא הצדיקה את
הסיכון. המחיר: **שם ברג'יסטרי אי אפשר לשנות** — מעבר ל-`com.1lev1` בעתיד הוא
רשומה חדשה והישנה מסומנת deprecated.

שתי מלכודות ששילמנו עליהן, כדי שלא יחזרו:

1. **קאסינג.** הפרסום נדחה ב-403: `You have permission to publish:
   io.github.Avi-ADAM/*. Attempting to publish: io.github.avi-adam/1lev1`.
   הרג'יסטרי גוזר את ה-namespace משם חשבון ה-GitHub **מילה במילה**, בלי
   lowercase. כל הדוגמאות בתיעוד משתמשות בחשבונות שכבר קטנים, וזה מסתיר את
   ההבדל.
2. **`description` מוגבל ל-100 תווים** בסכימה. הנוכחי: 89.

בנוסף: `awesome-mcp-servers` וכיוצא בו — PR עם שורה.

### מה שלא יעזור

- **להוסיף `marketplace.json` לריפו הזה (`Avi-ADAM/1.0`).** מקור האמת הוא
  `1lev1-agent` בכוונה — ראה חלק ג'. שני marketplace-ים עם אותו `name: "1lev1"`
  יתחרו זה בזה.
- **ה-`.claude/skills/` שבריפו הזה.** אלה skills של צד שלישי שהותקנו לפיתוח
  (`skills-lock.json`), לא שלנו, ואין להם שום קשר לגילוי.
- **`.mcp.json` שבשורש.** זו הגדרה מקומית לפיתוח, לא מניפסט שמתפרסם לשום מקום.
  ⚠️ הוא גם מכיל מפתח `Bearer` בתוך ריפו ציבורי — לבטל ולהעביר למשתנה סביבה.
