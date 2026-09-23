# PLAN — מידע משותף לרקמה: מסמכים · תמונות · קישורים · סיסמאות

> **סטטוס: שלב 1 בפרודקשן. שלב 2 מומש בקוד, ממתין לדיפלוי.** אין תלות ב-R2:
> ברירת המחדל היא תיקייה פרטית על השרת שלנו.
> שלב 3 (כספת E2E) כפוף לשער ההחלטה של תכנית ה-DB המבוזר
> ([PLAN_serverless_p2p_data.md](./PLAN_serverless_p2p_data.md) — הוחלט לממש עד S2b בלבד;
> S3+ דורש החלטה נפרדת).

## 0. תמצית

רקמה צריכה מקום אחד למידע המשותף שלה. שלושת סוגי המידע שונים מהותית ולכן
מקבלים שלושה פתרונות שונים על ציר עלות/רגישות:

| סוג | גודל | רגישות | פתרון |
|---|---|---|---|
| קישורים (Drive, Docs, אתרים) | ~0 | נמוכה | רשומות Strapi — כמעט חינם, מיידי |
| מסמכים ותמונות | MB–GB | בינונית | object storage זול (R2/B2) מאחורי בדיקת חברוּת |
| סיסמאות וסודות | KB | קריטית | **רק E2E** — אירועים חתומים ומוצפנים ב-space; לעולם לא כקובץ ב-Strapi |

עיקרון מנחה: **"אחסון עיוור"** — השרת מחזיק bytes, המפתחות והסודות נעים רק
בשכבת ה-E2E שכבר קיימת (`src/lib/space/e2e/`). כך אחסון זול ופרטיות לא מתנגשים.

## 1. מה קיים היום (אין להמציא מחדש)

- **העלאת קבצים:** `src/routes/api/upload/+server.ts` — proxy מאומת ל-Strapi upload.
  מגבלות: 15MB לקובץ, whitelist‏ (תמונות, PDF, Word). ⚠️ יש לוודא: קבצי Strapi
  ב-`/uploads/*` הם **ציבוריים לכל מי שמחזיק URL** — לא מתאים כמות-שהוא למסמכים רגישים.
- **קישור דרייב:** `Project.drivelink` — שדה יחיד, נערך ב-`EditProjectDetails.svelte`,
  כבר בעברית "לינק לגוגל דרייב של הרקמה". זו רמת אינטגרציית-גוגל הקיימת.
- **תמונות פרויקט:** `Project.pics` (media multiple) — קיים אך משמש לפרופיל, לא לספרייה.
- **DB מבוזר + E2E:** `src/lib/space/` — רפליקה local-first, relay עיוור,
  ו-`publishSealed()`/`rotateEpoch()` ב-`src/lib/space/e2e/` (kem/epoch/seal).
  ה-relay מוכח-בטסט שלא רואה byte קריא (`sealedRelay.test.ts`).
- **הרשאות/הסכמות:** חברוּת ברקמה = `project.user_1s`; שינויים רגישים רוכבים על
  `Decision` (עיקרון-על — לא ממציאים הצבעות חדשות).
- **טאבים ב-moach:** `src/routes/(reg)/moach/[projectId]/+layout.svelte` — מערך
  `tabs`; טאב חדש = route חדש + שורה במערך + תרגומים.

## 2. השוואת אפשרויות אחסון קבצים

| אפשרות | עלות חודשית (50GB) | egress | מאמץ | הערכה |
|---|---|---|---|---|
| **A. Strapi כמו היום** (דיסק השרת) | כלול באחסון הקיים | כלול | 0 | טוב ל-MVP; לא סקיילבילי, קבצים ציבוריים ב-URL |
| **B. Cloudflare R2** (S3-compatible) | ‎~$0.75‎ (10GB ראשונים חינם) | **חינם** | נמוך — provider ל-Strapi או presigned ישיר | ⭐ המומלץ לאחסון זול |
| **C. Backblaze B2** | ‎~$0.30‎ (10GB חינם) | חינם עד פי 3 מהאחסון (דרך CF) | נמוך | הזול ביותר; API פחות נוח מ-R2 |
| **D. Google Drive — קישורים בלבד** | 0 (מכסת החברים) | — | ~0 | ⭐ נתיב מקביל מיידי: הקבצים אצל גוגל, אצלנו רק רשומת קישור |
| **E. Google Drive API מלא** (OAuth, Shared Drive) | 0–תלוי Workspace | — | **גבוה** (OAuth לכל חבר, refresh tokens, quota) | לא מומלץ עכשיו — תלות כבדה תמורת מעט |
| **F. IPFS + pinning** (Pinata וכו') | ‎~$10+‎ | תלוי gateway | גבוה | יקר ומורכב מ-R2 בלי יתרון אמיתי לרקמות |
| **G. P2P טהור** (WebRTC בין חברים) | 0 | 0 | גבוה | ❌ כפתרון יחיד — זמינות רק כששני צדדים online; ✅ כאופטימיזציה עתידית |

**מסקנת עלויות:** רקמה טיפוסית (מאות מסמכים, אלפי תמונות) עולה **סנטים** ב-R2/B2.
העלות אינה החסם — הארכיטקטורה כן. לכן הבחירה היא B (או C) + D במקביל, ו-G רק
כשכבת האצה עתידית.

### למה לא גוגל כפתרון הליבה

- דורש חשבון גוגל מכל חבר רקמה + ניהול שיתוף ידני מחוץ למערכת (ההרשאות אצל
  גוגל לא יודעות מי חבר רקמה; עזיבת חבר לא מסירה גישה).
- אי אפשר E2E — גוגל רואה הכל; פוסל אותו לסיסמאות מראש.
- אבל: בחינם, מוכר למשתמשים, ותומך עריכה שיתופית (Docs/Sheets) שאין לנו.
  לכן **נשאר כנתיב קישורים** (אפשרות D) — לא כבקאנד.

## 3. מודל דאטה

### 3.1 Strapi — content-type חדש: `space-doc`

(לאחר הוספה ב-Strapi: `npm run types:update` ועדכון QIDS ב-`src/routes/api/send/qids.js`.)

| שדה | טיפוס | הערות |
|---|---|---|
| `project` | relation → Project | הרקמה |
| `name` | string | שם תצוגה |
| `note` | text | תיאור חופשי |
| `kind` | enum: `file` \| `image` \| `link` | סיסמאות **לא** כאן |
| `file` | media (single) | ל-`file`/`image` |
| `url` | string | ל-`link` (Drive, Docs, כל דבר) |
| `folder` | string | נתיב לוגי פשוט ("חוזים/2026"); בלי עץ תיקיות אמיתי בשלב 1 |
| `uploadedBy` | relation → User | מי העלה |
| `archived` | boolean | מחיקה רכה — עקבי עם `Machshir.archived` |

### 3.2 סיסמאות — **אין** content-type. אירועי space חתומים ומוצפנים

פריט סוד = אירוע `sealed` ב-space של הרקמה (פורמט `ConsentEvent` הקיים):

```js
await replica.publishSealed(userId, {
  action: 'vault.set',            // או 'vault.remove'
  subject: { type: 'vault', id: itemId },
  predicate: { name, username, secret, url, note }
});
```

- ה-projection (last-writer-wins לפי DAG, כמו שאר ה-space) בונה את רשימת הפריטים.
- Strapi/relay מחזיקים **ciphertext בלבד** — עומד בטסט הקיים של `sealedRelay`.
- הסרת חבר = `rotateEpoch` ⇒ סודות עתידיים חסומים בפניו. **מדיניות חובה ב-UI:**
  E2E לא מוחק את העבר — בהסרת חבר להציג צ'קליסט "החליפו את הסיסמאות שהוא הכיר".
- שינוי הרשאות גישה לכספת ראוי לרכב על `Decision` (kind חדש) — לא ממציאים הצבעה.

## 4. ארכיטקטורת "אחסון עיוור" לקבצים רגישים (שלב מאוחר)

לקבצים שהרקמה מסמנת כרגישים: הצפנה בצד לקוח לפני ההעלאה.

```
קובץ → AES-GCM (מפתח אקראי לקובץ) → ciphertext ל-R2 (השרת עיוור)
מפתח הקובץ → predicate של אירוע sealed ('vault.fileKey') → רק חברי ה-epoch מפענחים
```

זה מרכיב את שני החלקים שכבר יש לנו (object storage + sealed events) בלי המצאות.
P2P‏ (WebRTC) נכנס כאן, אם בכלל, רק כהאצת הורדה בין חברים online — לא כאחסון.

## 5. UI — טאב `docs` ב-moach

- route חדש: `src/routes/(reg)/moach/[projectId]/docs/+page.svelte` + שורה במערך
  `tabs` ב-layout (תרגום he/en/ar כמו השאר).
- מבנה העמוד: סינון לפי `kind` (מסמכים / תמונות / קישורים / 🔒 כספת), קיבוץ לפי
  `folder`, כפתור העלאה (משתמש ב-`/api/upload` הקיים), כפתור "הוסף קישור".
- כרטיס הכספת מופיע רק כשה-space של הרקמה ב-E2E‏ (יש אירוע `epoch.rotate`) —
  אחרת מציג הסבר + כפתור הפעלה (שקורא ל-`fetchKemRecipients`+`rotateEpoch`).
- את `drivelink` הקיים מציגים בראש לשונית הקישורים (לא שוברים כלום).

## 6. שלבי ביצוע

### שלב 1 — MVP: מסמכים, תמונות וקישורים — ✅ בפרודקשן

| מה | איפה |
|---|---|
| content-type‏ `space-doc` + יחס `Project.space_docs` | `1.0b/src/api/space-doc/`, `1.0b/src/api/project/…/schema.json` |
| קריאה (qid, חברים בלבד) | `325projectSpaceDocs` ב-`qids.js`; שומר ב-`guards.js`; רשומה ב-`qidsAccess.js` |
| כתיבה (Unified Action System) | `src/lib/server/actions/configs/spaceDocs.ts` — `createSpaceDoc` / `updateSpaceDoc` / `archiveSpaceDoc` |
| עיצוב נתונים טהור + טסטים | `src/lib/spaceDocs/spaceDocs.ts` |
| טאב `docs` | `src/routes/(reg)/moach/[projectId]/docs/`, `src/lib/components/rikmaDocs/` |
| whitelist מורחב ל-`/api/upload` | xlsx/pptx/odf/txt/csv/zip נוספו; 15MB נשאר |
| תרגומים | `rikmaDocs.json` ×5 + `moach.layout.docs` ×5, עם שער ניתוב ב-`routes.js` |

שלוש הכרעות שנלקחו תוך כדי המימוש ולא היו בטיוטה:

- **`draftAndPublish: false`.** לספרייה אין טיוטה, ושורה לא-מפורסמת פשוט הייתה
  נעלמת מהחברים שזה עתה העלו אותה.
- **ארכוב ישיר, בלי `Decision`.** זרימת `archiveObject` קיימת כי ארכוב משימה או
  משאב מבטל התחייבות שמישהו צובר עליה שעות או אחוזים; מסמך לא צובר דבר,
  ו-PLAN_OBJECT_ARCHIVAL מונה במפורש את סוגי האובייקטים שהיא מכסה.
- **קישור נבדק בכתיבה.** רק `http(s)` — קישור שמור מוצג כעוגן שכל הרקמה לוחצת
  עליו, ולכן `javascript:`/`data:` כאן הוא XSS מאוחסן נגד השותפים. נחסם
  בפעולה (`safeUrl`) וגם בנרמול לקריאה (`isSafeHref`), משני הצדדים.

**Exit (לבדיקה אחרי הדיפלוי):** חבר מעלה PDF ותמונה, מוסיף קישור Drive; חבר אחר
רואה ומוריד; מי שאינו חבר מקבל 403 מה-API; חבר ברקמה א' לא יכול לערוך מסמך של
רקמה ב' גם אם הוא מנחש מזהה (מכוסה בטסט `spaceDocs.test.ts`).

### שלב 2 — אחסון פרטי — ✅ מומש (ממתין לדיפלוי + הגדרה)

**שינוי ראשון מהטיוטה (בעקבות §7):** Strapi מאחסן ב-**Cloudinary**, וה-provider
גלובלי (`1.0b/config/plugins.js`) — כל המדיה הציבורית עוברת בו. החלפתו ב-bucket
פרטי הייתה שוברת אותה. לכן הספרייה **עוקפת את ה-upload של Strapi**.

**שינוי שני:** R2 דורש כרטיס אשראי, ואין. לכן האחסון הפרטי נכתב מאחורי **ממשק
אחד עם שני דרייברים** (`src/lib/server/storage/index.ts`), ובחירת הדרייבר היא
משתנה סביבה — לא קוד:

| דרייבר | מתי | מה צריך |
|---|---|---|
| **local** ⭐ ברירת המחדל | `SPACE_DOCS_DIR` מוגדר | תיקייה על ה-VPS. אפס תלות, אפס עלות, אפס קונטיינר נוסף |
| **s3** | `S3_ENDPOINT` או `R2_ACCOUNT_ID` | כל אחסון תואם-S3: MinIO/Garage בדוקר, R2, B2 |
| (אין) | לא מוגדר כלום | נשאר שלב 1: העלאה דרך Strapi ל-Cloudinary, ציבורי ב-URL |

```
דפדפן → POST /api/v1/space-docs/upload-url   (חברוּת + whitelist + תקרה + מקום בדיסק)
      ← { key: rikma/<pid>/<uuid>/<name>, url מוחלט, תקף 10 דק' }
דפדפן → PUT ישיר לכתובת הזו — לשרת ה-API או ל-bucket; הבייטים לא עוברים ב-Vercel
דפדפן → createSpaceDoc { storageKey, fileName, mime, sha256 }
      שרת: prefix של המפתח = הרקמה? הקובץ באמת הגיע? הגודל נלקח מהאחסון, לא מהדפדפן
פתיחה → GET /api/v1/space-docs/<id>/file → חברוּת מול locals.uid → 302 לכתובת חתומה ל-5 דק'
```

**הדרייבר המקומי בפירוט.** ל-R2 יש presigned URL; לתיקייה על השרת אין, אז
`blobToken.ts` הוא התחליף: HMAC קצר-חיים שאומר "המפתח הזה, הכיוון הזה, עד הרגע
הזה" ותו לא. `/api/v1/space-docs/blob` מכבד אותו בלי session ובלי DB:

- `PUT` — כותב ל-`.part` וממתג בשם רק כשהכול הגיע, כך ש-חיבור שנפל לא משאיר
  קובץ חתוך שמישהו יוריד כאילו הוא הקובץ. הגודל נאכף פעמיים: מ-`Content-Length`
  לפני הבייט הראשון, ושוב על הזרם עצמו.
- `GET` — מזרים בחזרה עם השם והסוג הנכונים. תמונות inline, כל השאר כהורדה,
  **SVG לעולם לא inline** (מסמך שיכול להריץ סקריפט).
- `HEAD` — הגודל האמיתי, וזה מה ש-`createSpaceDoc` סומך עליו.

הסוד נגזר מ-`ADMINMONTHER` שכבר קיים על שרת ה-API (`blobSecret()`), כדי לא
להוסיף עוד סוד לדיפלוי. הכתובות מוחלטות כי הבייטים חייבים להגיע ל-VPS, לא
ל-Vercel. אין צורך ב-CORS על שום bucket: הכול `/api/*`, ו-hooks כבר מטפל בו.

| מה | איפה |
|---|---|
| בחירת דרייבר, כרטיס העלאה, כתובת הורדה, אימות הגעה | `src/lib/server/storage/index.ts` |
| תיקייה על השרת: נתיבים, כתיבה אטומית, סטרימינג, מקום פנוי | `src/lib/server/storage/local.ts` |
| כרטיסי blob חתומים | `src/lib/server/storage/blobToken.ts` |
| S3 כלשהו (R2/MinIO/Garage) + חתימת SigV4 | `src/lib/server/storage/r2.ts`, `s3presign.ts` |
| endpoints | `…/space-docs/upload-url/`, `…/space-docs/blob/`, `…/space-docs/[id]/file/` |
| החלטת הגשה (טהורה, נבדקת) | `src/lib/server/spaceDocs/serve.ts` |
| qid הגשה (serviceAdmin בלבד) | `326spaceDocForServe` |
| שדות | `space-doc.storageKey / fileName / mime / size / sha256` |

החלטות:
- **כבוי כברירת מחדל.** בלי `SPACE_DOCS_DIR` ובלי `S3_*` הטאב מתנהג כמו שלב 1.
- **שורות שלב 1 לא הועברו** — הן עדיין ב-Cloudinary וציבוריות ב-URL. רק קבצים
  חדשים הולכים לאחסון הפרטי.
- **תקרה 100MB** (`SPACE_DOCS_MAX_MB`), כי הבייטים לא עוברים בשרת האפליקציה.
- **חבר שעזב מאבד גישה בלחיצה הבאה** — הכתובת החתומה נוצרת בכל לחיצה.
- **מעבר בין דרייברים** = העתקת התיקייה ל-bucket ושינוי env. המפתחות
  (`storageKey`) זהים בשני הדרייברים, ולכן השורות ב-DB לא משתנות.

**הגדרה — דרייבר מקומי (מומלץ, ללא עלות):**
1. **קודם** לדפלוי את `1.0b` (השדות `storageKey/fileName/mime/size/sha256`).
   qid 325 מבקש אותם, ולכן frontend לפני backend מציג "לא הצלחנו לטעון את המדף".
2. `docker-compose.api.yml` כבר מגדיר `SPACE_DOCS_DIR=/data/space-docs` ואת
   ה-volume‏ `space-docs`. להריץ `docker-compose -f docker-compose.api.yml up -d`.
3. `BODY_SIZE_LIMIT` הועלה ל-110M (adapter-node), ו-nginx כבר על 100M.
4. `npm run types:update`.
5. **גיבוי** — ה-volume הזה הוא הדבר היחיד על הקופסה שאינו נגזר מ-Strapi:
   `docker run --rm -v api_space-docs:/d -v "$PWD":/b alpine tar czf /b/space-docs-$(date +%F).tgz -C /d .`

**הגדרה — אחסון תואם-S3 בדוקר (אם רוצים), בלי שינוי קוד:**
הוספת שירות (MinIO או Garage) ל-compose, ואז
`S3_ENDPOINT=http://minio:9000`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
`S3_BUCKET`. שווה לשקול רק כשיהיו כמה שרתים או כשהדיסק המקומי לא יספיק —
על קופסה עם ~1.9GB RAM, קונטיינר אחסון נוסף הוא המחיר האמיתי כאן, לא הדיסק.

**Exit (לבדיקה אחרי הדיפלוי):** קובץ שהועלה אינו נגיש בלי כרטיס חתום; נפתח דרך
האפליקציה לחבר בלבד; לא-חבר מקבל 404 זהה לקובץ שלא קיים; מפתח של רקמה אחרת
נדחה בכתיבה ובקריאה (מכוסה ב-`serve.test.ts`, `local.test.ts`,
`blob.integration.test.ts`, `spaceDocs.test.ts`).

### שלב 3 — כספת סיסמאות E2E — **מותנה בהחלטת S3 של תכנית ה-DB המבוזר**
1. projection‏ `vault` ב-spaceStore (על `vault.set`/`vault.remove` sealed).
2. UI כספת בטאב docs: רשימה, העתקה ללוח, הוספה/עריכה; הפעלת E2E לרקמה.
3. צ'קליסט רוטציית סיסמאות בהסרת חבר (§3.2).
4. **Exit:** סוד שנכתב במכשיר א' נקרא במכשיר ב' של חבר אחר; ב-DB/relay אין
   plaintext (בדיקה בסגנון `sealedRelay.test.ts`); מוסר לא קורא סודות חדשים.

### שלב 4 — אופציונלי, ללא התחייבות
- קבצים רגישים מוצפני-לקוח (§4); ~~העלאה ישירה presigned ל-R2~~ (נכנס לשלב 2);
  ~~האצת P2P ב-WebRTC~~ — נבנתה כפיילוט מדידה: [PLAN_P2P_PILOT.md](./PLAN_P2P_PILOT.md).

## 7. סיכונים ושאלות פתוחות

- ~~**היכן Strapi מאחסן כיום?**~~ נבדק: Cloudinary, provider גלובלי — ראו שלב 2.
- **מכסות:** להחליט אם יש תקרת אחסון לרקמה (soft quota בשרת) לפני שפותחים העלאות חופשי.
- **סיסמאות לפני S3:** אם ההחלטה על E2E מתעכבת — **לא** לממש כספת "בינתיים ב-Strapi".
  סוד ב-plaintext ב-DB הוא חוב שאי אפשר לפרוע. עדיף שהפיצ'ר יחכה.
- **גיבוי:** R2/B2 הם עותק יחיד; לקבוע sync חודשי לבאקט משני (rclone) לפני שרקמות
  מסתמכות על זה כארכיון היחיד שלהן.
