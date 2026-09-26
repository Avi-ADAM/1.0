# שדרוג Strapi 4 → 5: האם צריך, איך, כמה, ומה יכול להשתבש

> **סטטוס**: טיוטה לדיון, 2026-09-25. נמצאת זמנית בשורש הריפו (לא ב-`docs/`),
> כי סוכן אחר מסווג כרגע את `docs/`. להעביר ידנית כשמתאים.
>
> **קהל**: מקבל ההחלטה, והסוכנים שיבצעו. כל מספר כאן נמדד בריפו ב-25.9.2026,
> חוץ ממה שמסומן **[לאמת]**. אלה הנחות שבודקים ב-spikes של P1.

---

## 0. בקצרה

1. **כן, צריך לשדרג, וזה לא נובע מהפיצ'רים של v5.** הסיבה היא ש-v4 כבר לא נתמך:
   - תמיכת האבטחה ב-Strapi 4 הסתיימה ב-9.6.2026. הגרסה האחרונה שיצאה היא 4.26.2.
   - **אנחנו רצים על 4.20.0**, כלומר גם בלי חמשת תיקוני ה-CVE האחרונים שיצאו
     ל-v4. אחד מהם בדרגת CVSS 9.3 (SQLi ב-Content-Type Builder), ואחר חושף מידע
     רגיש דרך סינון על relations.
   - Strapi 4 דורש Node ≤20 (`engines` ב-`package.json`, `FROM node:20-alpine`),
     ו-Node 20 עצמו יצא מתמיכה באפריל 2026. אי אפשר להעלות את גרסת Node בלי
     לשדרג את Strapi. Strapi 5 רץ על Node 22/24/26.
2. **התכנית המבוזרת לא מייתרת את Strapi בעתיד הנראה לעין.** שער S2b
   (`PLAN_serverless_p2p_data.md` §1) קובע ש-Strapi נשאר מקור אמת או read-model,
   ושאין מעבר ל-S3 בלי החלטה מחודשת. גם ב-S4 נשארים בצד השרת auth, העלאות קבצים,
   גילוי/שוק (קטגוריה ג'), נתוני עזר, התאמות, תרגומים ומפתחות API. גם השכבה
   המבוזרת עצמה משתקפת ל-Strapi (`consent-event`, `sealed-envelope`, `space-doc`).
   שנים של שרת לא נתמך זה לא מצב סביר.
3. **התכנית המבוזרת כן משנה את הדרך לשדרג.** לא כדאי לשכתב את ~5,000 נקודות
   הגישה `.attributes` ב-616 קבצי הלקוח לצורה של v5. זה בדיוק מסלול הקריאה ש-S2
   יחליף ב-projections מקומיים. במקום זה, את השינוי מבודדים **בגבול אחד בצד השרת**:
   מתאם ב-fetch-patch של `hooks.server.js`, שכל קריאת שרת→Strapi כבר עוברת דרכו.
   מאחורי המתאם Strapi 5 מדבר v5 נייטיב, ומולו הלקוח ממשיך לדבר "v4" בלי שינוי.
   צורת v4 הופכת לחוזה שלנו ולא של Strapi, וזה בדיוק התפר ש-S2 צריך בכל מקרה.
4. **המזהה המספרי נשאר הזהות של הפלטפורמה, בלי פשרות.** אירועים חתומים מכילים
   `project:42` לנצח (`spaceIdForProject`, ובנוסף `subject.id`). המזהה המספרי מופיע
   גם ב-URLs, במיילים, בהערות `from_project=…`, במפתחות API וב-MCP. ב-GraphQL של
   Strapi 5 אין `id` מספרי בכלל, גם לא ב-compat mode. לכן `documentId` הוא פרט מימוש
   פנימי של המתאם.
5. **צעד מיידי שאינו תלוי בשום דבר אחר** (שלב P0): שדרוג 4.20.0 → 4.26.2. סיכון
   נמוך, בתוך אותו major.
6. **היקף העבודה**: כ-25–35 סשנים של סוכן, מתוכם כ-60% ניתנים להרצה במקביל. זמן
   קלנדרי של 3–6 שבועות, שנקבע בעיקר ע"י שערים אנושיים, rehearsal על עותק של ה-DB
   ו-deploys, ולא ע"י זמן העבודה של הסוכנים.
7. **הסיכון המרכזי** הוא שמיגרציית ה-DB של v5 היא **חד-כיוונית**. v4 לא עולה על DB
   שכבר הומר. לכן עושים rehearsal כפול על fork, חלון תחזוקה עם הקפאת כתיבות, ו-go/no-go
   מבוסס differential testing.

---

## 1. האם צריך בכלל? הניתוח המלא

### 1.1 מה Strapi עושה היום, ומה נשאר לו לאורך סולם ההדחה

| תפקיד | היום (S0/S1) | ב-S2b (היעד המחייב) | ב-S4 (אם יוחלט) |
|---|---|---|---|
| נתוני רקמה (קטגוריה א') | מקור אמת | read-model/cache ליד projection | ciphertext או מוחלף |
| נתונים אישיים (ב') | מקור אמת | מקור אמת | לוג אישי, חלקית |
| שוק/גילוי (ג') | מקור אמת | מקור אמת | אינדקסר, **נשאר שרת** |
| נתוני עזר (ד') | מקור אמת | מקור אמת | bundle, אבל עדיין צריך מקום לערוך אותם |
| auth / users-permissions | מלא | מלא | הרשמה, **נשאר** |
| העלאות (Cloudinary) | מלא | מלא | **נשאר** |
| admin panel ככלי support ותיקוני דאטה | מלא | מלא (השער מדגיש את הערך הזה) | יורד |
| מראות של השכבה המבוזרת | `consent-event`, `sealed-envelope`, `space-doc` | כנ"ל | כנ"ל |

**מסקנה**: לא קיים תרחיש שבו Strapi נעלם לפני שנת 2027 ואילך. גם בתרחיש האופטימי
ביותר נשאר שרת עם auth, גילוי ונתוני עזר.

### 1.2 שלוש האפשרויות

| אפשרות | משמעות | הכרעה |
|---|---|---|
| **א. להישאר על v4** | רק 4.20 → 4.26.2 ולהמשיך | ✗ כמצב קבוע. ✔ כצעד מיידי (P0). אין תיקוני אבטחה לעולם, ו-Node 20 כבר EOL |
| **ב. Strapi 5 עם מתאם בגבול השרת** | backend נייטיב ב-v5, והמתאם מתרגם את "דיאלקט v4" שלנו | ✔ **מומלץ** |
| **ג. Strapi 5 עם שכתוב הלקוח לנייטיב** | 529 qids ו-616 קבצים עוברים ל-v5 | ✗ עבודה כפולה, כי ה-projections יחליפו את אותו קוד. מקסימום בקוד חדש |
| **ד. יציאה מ-Strapi** (Postgres + השרת שלנו) | כתיבה מחדש של auth, admin, 529 qids ל-SQL | ✗ כרגע. יקר פי כמה מ-ב'. אבל ב' מוזיל את ד' בעתיד, כי הלקוח כבר לא קשור לצורה של Strapi |

---

## 2. מה נמדד (25.9.2026)

### Backend (`1.0b`)
- `@strapi/strapi` **4.20.0**, בגרסאות פלאגינים מקובעות על 4.20.0. Node 20 ב-Docker.
- **115** content-types ב-`src/api`, ו-**35** components.
- **86** טיפוסים עם `draftAndPublish: true`.
- **32** טיפוסים עם `localized: true`, **כולל טיפוסי ליבה**: `project, mission,
  timer, tosplit, haluka, act, matanot, mashaabim, open-mission, sheirut…`.
- קוד מותאם דק מאוד: 0 lifecycles, 0 controllers/services שאינם factory,
  4 קריאות `entityService` (2 policies, 1 extension, 1 מוערת), הרחבת
  users-permissions אחת (`email-confirmation-login`, **untracked** ב-git),
  cron אחד עם GraphQL בצורת v4 (`config/cron-tasks.js`).
- פלאגינים: `graphql, i18n, users-permissions, sentry, color-picker,
  provider-upload-cloudinary, email nodemailer/sendgrid, strapi-plugin-io,
  strapi-plugin-fcm (extension), strapi-content-type-explorer,
  strapi-plugin-entity-relationship-chart`.
- ה-DB הוא Postgres מנוהל ב-Aiven, עם deploy של blue/green ו-alias יציב בשם `strapi`.
- ⚠ `config/database.js` (תצורת dev) מכיל סיסמת Postgres שנכנסה ל-git. אם היא
  משמשת במקום נוסף, צריך לסובב אותה. זה לא קשור לשדרוג, אבל שמתי לב לזה בדרך.

### Frontend (`1.0main`)
- **529** qids ב-`qids.js` (16,133 שורות). המילה `attributes` מופיעה בו **1,987**
  פעמים, `pagination` מופיעה **243** פעמים, יש **111** סינונים על `id`, **114**
  mutations של update/delete לפי `id`, **106** mutations של create, 7 fragments
  ו-3 מיונים לפי `id`.
- **5,076** גישות `.attributes` ב-**616** קבצים.
- **51** קבצי שרת קוראים ל-`/graphql`. **כולם** עוברים דרך `globalThis.fetch`
  המוטלא ב-`hooks.server.js` (חותמת `x-strapi-gate`). זו נקודת החנק הקיימת.
- `publicationState` **לא נמצא בשימוש** מחוץ ל-generated. כל כתיבה קובעת
  `publishedAt` בעצמה (217 מופעים ב-`src/lib/server`). ⇒ **D&P לא משמש כפיצ'ר.**
  הוא רק "מס" על כל create.
- כ-11 קריאות REST ישירות ל-`STRAPI_URL/api/…`, וכ-28 קבצים שנוגעים ב-`/api/auth|users|upload`.

### צרכנים חיצוניים ל-Strapi
- `magik-meetings`: fallback ישיר ל-`/graphql` ב-`src/lib/send/sendTo.svelte`.
- `consensus1lev1`: `routes/api/places/+server.ts` קורא ל-`STRAPI_URL/graphql`
  **[לאמת: איזה Strapi]**.
- `1lev1-mcp`: עובר דרך `api/send` ו-`api/action`, ולכן מוגן ע"י המתאם.

---

## 3. מה v5 שובר אצלנו, בפועל

| שינוי ב-v5 | איפה זה פוגע אצלנו | עוצמה |
|---|---|---|
| GraphQL שטוח, בלי `data`/`attributes` | כל 529 ה-qids וכל 5,076 הגישות | מאסיבי, אבל מכני |
| **`id` מספרי לא נחשף ב-GraphQL, גם לא ב-`v4CompatibilityMode`** | URLs, אירועים חתומים, מיילים, הערות site-share, 111 סינונים, 114 mutations | **קריטי** |
| mutations וקלטי relation לפי `documentId` | 106 creates עם relations, 114 updates/deletes | גבוה |
| רשימות בלי `meta`; `pagination` עובר רק ל-`*_connection` | 243 מופעים | בינוני |
| `publicationState` → `status` | לא בשימוש אצלנו ✔ | נמוך |
| **D&P**: draft ו-published הן שורות נפרדות, ופרסום יוצר שורה חדשה, כלומר **`id` מספרי חדש** **[לאמת]** | כל 86 הטיפוסים. `id` לא יציב = שבירת זהות | **קריטי** |
| **i18n**: document אחד משתרע על כמה locales, עם שורה לכל locale | 32 טיפוסים, כולל project ו-mission | גבוה **[לאמת]** |
| `v4CompatibilityMode` לא תואם באמת: צורת relations שונה (#22322, נסגר "not planned") | כל מי שחשב ש-compat mode מספיק | גבוה, ולכן לא נשענים עליו |
| REST שטוח (`/users/me`, auth, upload) | כ-40 קבצים | בינוני. יש header `Strapi-Response-Format: v4` **[לאמת]** |
| הוסרו mutations של upload ו-`create…Localization` מ-GraphQL | לא נמצא שימוש ✔ **[לאמת upload]** | נמוך |
| `entityService` deprecated → Document Service | 4 מקומות ב-backend | נמוך |
| Node 22+, Postgres ≥14 | Dockerfile, Aiven **[לאמת גרסה]** | נמוך |
| פלאגינים: io, fcm, explorer, ER-chart | אולי אין להם גרסת v5 | בינוני. חלק פשוט להסיר |

---

## 4. האסטרטגיה: גבול דק, לא שכתוב

### עקרונות

1. **`id` מספרי = זהות הפלטפורמה.** המתאם מבטיח שכל תשובה מחזירה אותו מזהה
   מספרי כמו קודם, וכל קלט מספרי מתורגם ל-`documentId` בצד השרת בלבד.
2. **D&P כבוי לפני המיגרציה**, בכל טיפוס שלא משתמש בו באמת, כלומר כנראה בכולם.
   ככה יש שורה אחת לכל document, `id` יציב לתמיד, ומיגרציית הנתונים של v5 לא
   מכפילה שורות. **מבצעים את זה ב-v4**, אחרי ביקורת drafts (P1-S5).
3. **i18n כבוי בטיפוסים שאינם תוכן מתורגם.** תרגום תוכן שמשתמשים כתבו נעשה ב-T3
   (`src/lib/translation/`), לא ב-locales של Strapi. זה מחייב ביקורת (P1-S6), כי כיבוי
   i18n מוחק שורות שאינן ב-default locale.
4. **מתאם אחד, במקום אחד** (`src/lib/server/strapi5/`), שמופעל מה-fetch-patch
   לפי דגל env `STRAPI_API=4|5`. **אותו build** של האפליקציה רץ מול v4 ומול v5, וזה
   מה שמאפשר blue/green, rollback והשוואה ישירה.
5. **האמת היא differential testing**: אותו snapshot של נתונים, v4 מול v5+מתאם,
   כל qid, ו-deep-equal אחרי נרמול.
6. **קוד חדש** ב-backend נכתב נייטיב ב-v5 (Document Service). הלקוח לא עובר מיגרציה.
   הוא יעבור ל-projections בכל מקרה.

### המתאם: מה הוא עושה

```
client ──qid──► /api/send ──v4 GraphQL──► fetch-patch ──┐
                                                         │ STRAPI_API=5
                          ┌──────────────────────────────┘
                          ▼
          transpile(query AST)  ─ data/attributes out, id→legacyId+documentId,
                                  list+pagination→_connection, id filters→documentId
          mapVariables(vars)    ─ numeric ids → documentId, according to input types (introspection)
                          ▼
                    Strapi 5 /graphql
                          ▼
          reshape(response)     ─ wrap back into {data:{id,attributes}}, relations {data:…},
                                  pageInfo→meta.pagination, id = legacyId
                          ▼
                 same bytes as v4 (the test's goal)
```

- **`legacyId`**: שדה GraphQL שמוסיפים דרך `extensionService` ב-Strapi 5 לכל
  טיפוס, ונפתר מ-`parent.id`. **[לאמת ב-S2]**: האם אפשר גם לסנן ולמיין לפיו. אם
  לא, המתאם מתרגם סינון לפי `id` ל-`documentId: {in: […]}` דרך מפת מזהים.
- **מפת מזהים** (`idmap`): route קטן ב-Strapi 5, `POST /api/_idmap {uid, ids}` →
  `documentIds` ובחזרה, עם batching ו-cache. אחרי כיבוי D&P והפעלת i18n רק בטיפוסים
  שבאמת צריכים, המיפוי **בלתי משתנה**, ולכן cache-forever.
- **טיפול לא-שקט**: שאילתה שהמתאם לא מזהה את הצורה שלה (fragment מסוג חדש, alias
  מורכב) **נכשלת בקול** ונכתבת ללוג. אסור שהיא תחזיר ריק.
- **החוזה הקפוא**: עותק של הסכמה של v4 נשמר ב-`src/generated/v4-wire/`.
  `validate:qids` והטיפוסים של הלקוח ממשיכים מולו. סכמת v5 נפרדת משמשת רק את המתאם.

---

## 5. שלבים

כל שלב מסתיים ב-**שער** (✋ = אישור אנושי). "סשן" = משימת סוכן ממוקדת אחת עם טסטים.

### P0: חירום אבטחה, 4.20.0 → 4.26.2 (לא תלוי בשום דבר)
- bump לכל `@strapi/*` ל-4.26.2 ולפלאגינים התואמים, build, והעלאה לצבע הלא-פעיל.
- smoke: login, יצירת משימה, טיימר, חלוקה, העלאת קובץ ו-chat.
- **סוכן**: 1 סשן. **סיכון**: נמוך. **Rollback**: התמונה הקודמת, בלי שינוי DB
  (אין מדריכי מיגרציה של v4 אחרי 4.15.5).
- ✋ deploy.

**סטטוס (26.9.2026): מוכן ב-`1.0b` ב-working tree, לא עבר commit ולא deploy.**
- כל חבילות `@strapi/*` הן 4.26.2, ו-`npm ls` נקי (עותק יחיד מכל אחת).
  `package-lock.json` ו-`yarn.lock` עודכנו שניהם (Docker משתמש ב-npm ci, ו-Render ב-yarn).
- הבנייה עוברת. עלה מקומית מול ה-DB המקומי, על **Node 22** (4.26.2 תומך עד 22.x).
- סכמת GraphQL זהה ל-4.20 בכל מה שהאפליקציה משתמשת בו. ההבדל היחיד הוא הסרה של
  טיפוסי Content Releases (בטא, לא בשימוש).
- כל 565 ה-qids אומתו מול הסכמה החיה של 4.26.2: 552 תקינים. 13 הנותרים שבורים
  **גם ב-4.20** (שדות לא קיימים, `$uid` שלא בשימוש, Int מול Float). אין אף רגרסיה.
- smoke: relations מקוננים, סינון, pagination, locale, mutation, auth/local, ו-route
  ההרחבה `email-confirmation-login`.
- **תיקון אבטחה שנכלל**: `users-permissions.register.allowedFields = ["chezin","cuntries"]`.
  בלעדיו (וגם ב-4.20) ההרשמה קיבלה כל שדה כתיב של User, ו-proxy ההרשמה מעביר
  את ה-body כמו שהוא. כלומר הרשמה עם `projects_1s:[42]` הייתה מצטרפת לרקמה.
  נבדק מקומית: `projects_1s` נזרק, ו-`cuntries` נשמר.
- הוסרה אפשרות `cors.enabled` המיושנת מ-`config/middlewares.js` (dev).
- **נשאר (P0b, נפרד)**: `FROM node:22-alpine` ב-Dockerfile ועדכון `engines`. יש
  לבדוק לפני כן את `better-sqlite3@9.1.1`, שאין לו prebuild ל-Node 22 על musl
  (ה-DB הוא Postgres, כך שכנראה אפשר להסיר אותו).

### P1: spikes ומדידות, בלי נגיעה בפרודקשן (ניתן להרצה במקביל)
| # | Spike | התוצר |
|---|---|---|
| S1 | fork של ה-DB ב-Aiven, והרצת `npx @strapi/upgrade major` + מיגרציה | זמן ריצה, שגיאות, גודל. **קובע את אורך חלון התחזוקה** |
| S2 | הוספת `legacyId` ב-GraphQL extension, ובדיקה של filter ו-sort | הכרעה: legacyId או מיפוי מלא |
| S3 | התנהגות D&P ב-v5: האם `id` משתנה בפרסום, מה ברירת המחדל של create | אישור עיקרון 2 |
| S4 | `v4CompatibilityMode`: מה בדיוק שונה מול v4 בכ-20 qids מייצגים | הכרעה סופית: מתאם נייטיב או compat+תיקונים |
| S5 | **ביקורת drafts**: כמה שורות עם `publishedAt IS NULL` יש בכל טבלה; אילו mutations משמיטות `publishedAt` (שורות "מוסתרות" בכוונה?) | רשימת טיפוסים לכיבוי D&P, והחלטה על כל draft (לפרסם או למחוק) |
| S6 | **ביקורת i18n**: כמה שורות לא-default בכל אחד מ-32 הטיפוסים; התנהגות relations בין locales | רשימת טיפוסים לכיבוי i18n |
| S7 | פלאגינים: האם io עדיין בשימוש (הזמן-אמת עבר ל-`socket-server`)? fcm? | רשימה של מה משודרג ומה מוסר |
| S8 | צרכנים חיצוניים: לוגים של nginx ל-`/graphql` לפי מקור; magik-meetings; consensus1lev1 | רשימת צרכנים ותכנית לכל אחד |
| S9 | גרסת Postgres ב-Aiven; תוקף JWT קיים אחרי השדרוג | כן או לא |

- **סוכן**: 8–10 סשנים, רובם במקביל. **✋ שער go/no-go** על בסיס מסמך ממצאים.

### P2: הכנות בצד v4 (כל אחת נפרסת בנפרד ומקטינה את הסיכון של v5)
- כיבוי D&P בטיפוסים שאושרו ב-S5, אחרי טיפול ב-drafts. ✋ זו פעולת דאטה בפרודקשן.
- כיבוי i18n בטיפוסים שאושרו ב-S6. ✋ כנ"ל.
- הקפאת סכמת v4 ל-`src/generated/v4-wire/`, והפניית `validate:qids` ו-codegen אליה.
- **corpus** להשוואה: הקלטה של qid + variables (מנוקים מ-PII) מתעבורה אמיתית,
  או סינתזה מטסטי ה-actions. בנוסף, רשימת תרחישי כתיבה (flows) להרצה חוזרת.
- commit לכל מה שעדיין untracked או uncommitted ב-`1.0b`, כי המיגרציה חייבת לצאת
  ממצב נקי.
- **סוכן**: 3–4 סשנים.

### P3: backend על Strapi 5 (ענף ב-`1.0b`, staging בלבד)
- `@strapi/upgrade major` (codemods), Node 22 ב-Dockerfile, `package.json`.
- port של `users-permissions/strapi-server.js`, של 2 policies (`entityService` →
  `strapi.documents`), של ה-cron ושל ה-config (`graphql.config`, `io`, `sentry`, `upload`).
- הוספת `legacyId` לכל הטיפוסים באופן גנרי (לולאה על `strapi.contentTypes`),
  ו-route של `_idmap`.
- הסרה של explorer, ER-chart ו-io (לפי S7). ports לשאר.
- הרצה מול fork מומר של ה-DB (מ-S1).
- **סוכן**: 3–5 סשנים. ✋ review.

### P4: המתאם (`1.0main`, `src/lib/server/strapi5/`)
- `transpile.ts` (AST דרך `graphql-js`), `mapVariables.ts`, `reshape.ts`, `idmap.ts`.
  כולם פונקציות טהורות.
- חיבור ב-fetch-patch של `hooks.server.js` מאחורי `STRAPI_API=5`. כשהדגל כבוי
  אין שום שינוי התנהגות.
- REST: `/users/me`, auth ו-upload עוברים דרך header v4 או reshape.
- טסטים: golden לכל אחד מ-529 ה-qids (צורת קלט ופלט), property-based
  (fast-check) על `reshape`, ולוג שנכשל בקול על כל צורה לא מוכרת.
- **סוכן**: 4–6 סשנים. זה הלב, ורוב ההשקעה צריכה להיות כאן. אפשר לחלק את ה-qids
  בין סוכנים לפי קבוצות.

### P5: אימות דיפרנציאלי (ההוכחה)
- שני מופעים על **אותו snapshot**: v4 על fork A, ו-v5+מתאם על fork B (המומר).
- harness שמריץ את כל ה-qids עם ה-corpus, ומשווה deep-equal אחרי נרמול (סדר
  ו-timestamps של מיגרציה).
- כתיבות: מריצים כל flow על שני ה-forks ומשווים את הקריאות שאחריו. בנוסף, טסט
  שמוודא ש**קבוצת ה-`id` המספריים זהה בדיוק** לפני המיגרציה ואחריה, בכל טבלה.
- `npm test`, `npm run check`, ו-e2e בדפדפן עם `claude_user_1/2` על ה-flows המרכזיים
  (lev, moach, חלוקה, מכירה, צ'אט, onboarding, concierge).
- p95 latency מול v4. תקציב: עד +15% (המתאם ו-idmap).
- **סוכן**: 3–5 סשנים + איטרציות תיקון. ✋ go/no-go: 0 הבדלים לא מוסברים.

### P6: Cutover
- הודעה מראש וחלון תחזוקה: באנר read-only וחסימת כתיבות ב-`/api/send`
  ו-`/api/action`. האורך לפי S1, פלוס מרווח.
- גיבוי Aiven + נקודת PITR ← מיגרציה על ה-DB של פרודקשן ← v5 בצבע הלא-פעיל ←
  `STRAPI_API=5` ב-app ← smoke ← העברת ה-alias ← פתיחת כתיבות.
- **Rollback**: **לפני** שנכנסה כתיבה אחת ל-v5 חוזרים ל-v4 + DB משוחזר מהגיבוי,
  בלי אובדן. **אחרי** כתיבות, רק תיקון קדימה. לכן פותחים כתיבות רק אחרי smoke מלא.
- **סוכן**: סשן אחד (runbook ובדיקות). ✋ הביצוע עצמו אנושי.

### P7: אחרי
- ניטור של לוג "צורה לא מוכרת" במתאם במשך שבועיים.
- פירוק v4 מהתשתית אחרי N ימים יציבים.
- עדכון `CLAUDE.md`: שני generated schemas, המתאם, והכלל "קוד backend חדש = Document Service".
- **סוכן**: 1–2 סשנים.

---

## 6. הערכת היקף, לעבודת סוכנים

| שלב | סשנים | מקביליות | שערים אנושיים | קלנדרי (הערכה) |
|---|---|---|---|---|
| P0 | 1 | — | deploy | 1–2 ימים |
| P1 | 8–10 | גבוהה (8 spikes עצמאיים) | go/no-go | 3–5 ימים |
| P2 | 3–4 | בינונית | 2 פעולות דאטה בפרודקשן | 3–5 ימים |
| P3 | 3–5 | נמוכה | review | 2–4 ימים |
| P4 | 4–6 | גבוהה (קבוצות qids) | review | 4–7 ימים |
| P5 | 3–5 + איטרציות | בינונית | go/no-go | 4–7 ימים |
| P6 | 1 | — | ביצוע | חלון אחד |
| P7 | 1–2 | — | — | שבועיים ניטור |
| **סה"כ** | **~25–35** | | **~7 שערים** | **3–6 שבועות** |

**למה העבודה הזו מתאימה לסוכנים**: היא מכנית ברובה (הסרת wrappers, מיפוי מזהים),
והמפרט הוא בדיקה אובייקטיבית (deep-equal מול v4). אפשר לפצל את 529 ה-qids לקבוצות
בלתי תלויות, וטסטים קיימים מגנים על השאר.

**איפה סוכנים חלשים כאן, ולכן צריך אדם**: פעולות על DB של פרודקשן (כיבוי D&P או
i18n, המיגרציה עצמה), החלטות לגבי drafts ו-locales קיימים (האם זה דאטה אמיתי?),
תזמון חלון התחזוקה, ואישור go/no-go.

**מה מנפח את ההערכה**: אם S2 נכשל (אי אפשר לסנן לפי `legacyId`), אם S3 או S6
מגלים שימוש אמיתי ב-drafts או ב-locales, ואם יש צרכן חיצוני נוסף שלא ידענו עליו.
כל אחד מאלה מוסיף 3–8 סשנים.

---

## 7. מרשם סיכונים

| # | סיכון | הסתברות | השפעה | מיתון | גילוי |
|---|---|---|---|---|---|
| R1 | מיגרציה חד-כיוונית; אחרי כתיבות אין rollback | ודאי (מהותי) | קריטית | rehearsal ×2 על fork, חלון, PITR, פתיחת כתיבות רק אחרי smoke | S1, P5 |
| R2 | `id` מספרי משתנה או נעלם (D&P, locales) ⇒ אירועים חתומים, URLs וקישורים במייל נשברים | גבוהה בלי מיתון | **קריטית** | כיבוי D&P ו-i18n לפני, `legacyId`, טסט "קבוצת ids זהה" | P5 |
| R3 | המתאם מפספס צורת שאילתה ⇒ **ריק שקט** | בינונית | גבוהה | corpus מלא, fail-loud, לוג צורות לא מוכרות | P5, P7 |
| R4 | כיבוי D&P חושף שורות שהוסתרו בכוונה, או מוחק drafts אמיתיים | בינונית | גבוהה | ביקורת S5, החלטה פר-טיפוס, גיבוי | S5 |
| R5 | כיבוי i18n מוחק שורות לא-default שהן דאטה אמיתי | נמוכה-בינונית | גבוהה | ביקורת S6 | S6 |
| R6 | פלאגין בלי גרסת v5 (fcm, io) | בינונית | בינונית | הסרה או חלופה, S7 | S7 |
| R7 | ביצועים: overhead של המתאם ו-N+1 ב-idmap | בינונית | בינונית | batching, cache-forever, תקציב p95 | P5 |
| R8 | צרכן חיצוני נשבר (magik-meetings, consensus1lev1, אחר) | בינונית | בינונית | S8 ולוגי nginx | S8, P7 |
| R9 | **עבודה מקבילה**: סוכנים אחרים משנים את סכמת `1.0b` באמצע (shifts, concierge…) | **גבוהה** | גבוהה | הקפאת שינויי סכמה ב-`1.0b` מ-P3 עד P6, או port שיטתי + rebase | git log |
| R10 | JWTs קיימים לא תקפים אחרי השדרוג ⇒ כולם מתנתקים | נמוכה | נמוכה | אותו `JWT_SECRET`, S9. כ-fallback, התנתקות מבוקרת | S9 |
| R11 | באגים ב-v5 עצמו (לדוגמה media relations לפי documentId, #25060) | בינונית | בינונית | נעילה לגרסה מסוימת, בדיקה ב-P5 | P5 |
| R12 | churn של generated types ⇒ רעש ב-`svelte-check` | גבוהה | נמוכה | סכמת v4 קפואה כחוזה של הלקוח | P2 |
| R13 | המתאם הופך ל"שכבה נצחית" שאף אחד לא מבין | בינונית | בינונית | פונקציות טהורות, תיעוד, והוא ממילא יתכווץ ככל ש-S2 מעביר קריאות ל-projections | — |

---

## 8. הקשר לתכנית המבוזרת

- **השדרוג משתלם בלי קשר לתכנית המבוזרת** (אבטחה ו-Node). **המתאם משתלם בזכותה**:
  הוא הופך את Strapi לפרט מימוש מאחורי חוזה שלנו. זו בדיוק ההגדרה של S2
  ("Strapi = read-model/cache"), וזה גם מוזיל כל יציאה עתידית.
- **לא לעשות**: שכתוב של קריאות הלקוח לצורה נייטיב של v5. ה-projections יחליפו אותן.
- **כן לעשות**: collections חדשים וקוד backend חדש נייטיב ב-v5.
- **תזמון**: לא לחפוף את ה-cutover (P6) עם הפעלת genesis או S2b למשתמשים אמיתיים.
  שני שינויי זהות-נתונים באותו שבוע זה יותר מדי.
- **אינווריאנט חדש שנשען על הקיים**: HANDOFF §3.1 ("אירוע חתום הוא לנצח") מחייב
  שה-`id` המספרי של כל project ו-user יישאר זהה לתמיד. R2 הוא לא רק באג UI,
  אלא הפרה של אינווריאנט קריפטוגרפי.

---

## 9. החלטות שנדרשות ממך

1. **לאשר את P0 עכשיו** (4.26.2). בלתי תלוי בכל השאר.
2. **מדיניות D&P**: לכבות בכל הטיפוסים, בכפוף לביקורת S5?
3. **מדיניות i18n**: לכבות בטיפוסי ליבה (project, mission, timer, tosplit, haluka…),
   בכפוף ל-S6?
4. **חלון תחזוקה**: מקובל? מה האורך המרבי? (הערך יתבהר ב-S1.)
5. **מתאם מול שכתוב**: ההמלצה היא מתאם.
6. **הקפאת סכמה ב-`1.0b`** מ-P3 עד P6: מקובל? איך מתאמים עם הסוכנים האחרים?

---

## 10. פתוח לאימות (מסומן [לאמת] לאורך המסמך)

- האם `id` מספרי משתנה בפרסום ב-v5 D&P, ומה ברירת המחדל של create ב-GraphQL (S3).
- אפשרות סינון ומיון לפי שדה extension (`legacyId`) (S2).
- התנהגות i18n ו-relations בין locales ב-v5 (S6).
- header `Strapi-Response-Format: v4` ל-REST.
- האם ל-4.20 → 4.26.2 יש מיגרציות DB (משפיע על ה-rollback של P0).
- גרסת Postgres ב-Aiven.
- לאיזה Strapi `consensus1lev1` מתחבר.

---

## מקורות

- [Strapi v4 bug support ending (changelog)](https://feedback.strapi.io/changelog/notice-strapi-v4-bug-support-coverage-is-ending-in-october)
- [Strapi release roundup, March–June 2026 (v4 EOL, 5 CVEs)](https://strapi.io/blog/strapi-release-roundup-everything-that-changed-between-march-and-june-2026)
- [endoflife.date/strapi](https://endoflife.date/strapi): v4 security עד 9.6.2026, 4.26.2 אחרונה, v5 5.55.1
- [GraphQL API updated in v5 (breaking change + v4CompatibilityMode)](https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/graphql-api-updated)
- [documentId instead of id](https://docs.strapi.io/cms/migration/v4-to-v5/breaking-changes/use-document-id)
- [compat mode relations differ, #22322](https://github.com/strapi/strapi/issues/22322)
- [media relations by documentId, #25060](https://github.com/strapi/strapi/issues/25060)
- [Strapi 5 CLI installation requirements (Node 22/24/26, PG ≥14)](https://docs.strapi.io/cms/installation/cli)
- בריפו: `docs/PLAN_serverless_p2p_data.md` §1–2, `docs/HANDOFF_DISTRIBUTED_DB.md` §1, §3,
  `docs/PLAN_action_migration_vs_p2p.md`
