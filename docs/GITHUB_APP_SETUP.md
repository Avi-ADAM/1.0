# הגדרת ה-GitHub App של 1lev1 — מדריך שדה אחרי שדה

מלווה את [`PLAN_CODE_RIKMA.md`](PLAN_CODE_RIKMA.md) §3.3 (שלב S2). עושים את זה פעם אחת.

---

## 0. איזה host? — `api.1lev1.com`, לכל מה שקשור ל-GitHub

| | `www.1lev1.com` (Vercel) | `api.1lev1.com` (VPS) |
|---|---|---|
| תפקיד | דפים ב-SSR | הפרוקסי המאובטח שמול Strapi |
| secrets של GitHub | **לא** מחזיק אף אחד | מחזיק את כולם |
| מה רץ שם ב-S2 | הדפים: טאב "קוד" והגדרות | `connect`, `callback`, `webhook`, `status` |

למה api:
- **המפתח הפרטי וה-client secret יושבים רק בשרת.** Vercel לא צריך אף משתנה חדש, כי
  `SSR_API_BASE` כבר מפנה אותו ל-api.
- **עוגיית ההתחברות (`jwt`) יושבת על `.1lev1.com`**, ולכן api.1lev1.com מזהה את המשתמש שמגיע מ-www.
- **ה-nginx של api מעביר כל נתיב ל-`sveltekit-api`**, ו-`ORIGIN=https://api.1lev1.com`.
- **המשתמש חוזר ל-www.** הכפתורים ב-www שולחים אותו ל-api, ואחרי GitHub הוא מוחזר לדף שממנו יצא.
  כתובת החזרה מאומתת מול רשימת ה-origins המורשים (`src/lib/server/corsOrigins.js`).

> כלל אצבע: בכל מקום בטופס שכתוב URL, חוץ מ-Homepage, הכתובת מתחילה ב-`https://api.1lev1.com/`.

---

## 1. יצירת ה-App

GitHub → התמונה שלך → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**.

> כדאי ליצור את ה-App תחת **ארגון** (organization) של 1lev1 ולא תחת חשבון אישי, אם יש כזה.
> כך הבעלות לא תלויה באדם אחד. אפשר גם להעביר App לארגון בהמשך (Advanced → Transfer ownership).

### פרטים בסיסיים

| שדה | מה למלא | הערות |
|---|---|---|
| **GitHub App name** | `1lev1` (או `1lev1 Rikma` אם השם תפוס) | השם צריך להיות ייחודי בכל GitHub. ממנו נגזר ה-**slug** שייכנס ל-`GITHUB_APP_SLUG` |
| **Description** | `Connect a rikma's repositories to 1lev1: contributions become consented, fairly shared value.` | מוצג למי שמתקין |
| **Homepage URL** | `https://www.1lev1.com` | ✅ מה שכבר שמת, מצוין |

### Identifying and authorizing users

| שדה | מה לסמן / למלא | למה |
|---|---|---|
| **Callback URL** (לפעמים מופיע כ-"User authorization callback URL" / "Redirect URI") | `https://api.1lev1.com/api/v1/github/callback` | **כן, רלוונטי ונדרש.** לכאן GitHub מחזיר את המשתמש גם אחרי קישור חשבון וגם אחרי התקנה. הכתובת חייבת להיות בדיוק זו |
| **Expire user authorization tokens** | אפשר להשאיר מסומן (ברירת המחדל) | אנחנו משתמשים בטוקן של המשתמש פעם אחת, בתוך הבקשה עצמה, ולא שומרים אותו. ה-refresh token לא משחק תפקיד |
| **Request user authorization (OAuth) during installation** | ✅ **לסמן — חובה** | בלי זה GitHub לא מחזיר `code` אחרי ההתקנה, ואז אי אפשר לוודא שההתקנה באמת שייכת למשתמש. החיבור ייכשל עם "לא התקבלה התקנה מ-GitHub" |
| **Enable Device Flow** | ❌ לא לסמן | נועד לאפליקציות CLI והתקנים בלי דפדפן. לא בשימוש |

### Post installation

| שדה | מה לעשות | למה |
|---|---|---|
| **Setup URL (optional)** | ⚠️ **להשאיר ריק** — למחוק את מה ששמת | כשמסמנים את "Request user authorization during installation", GitHub מתעלם מ-Setup URL ושולח ל-Callback URL. אם השדה נעול אחרי הסימון, זה תקין |
| **Redirect on update** | ✅ **לסמן — נדרש לכפתור "עריכת הרשאות ב-GitHub"** | הכפתור שולח את החבר בכוונה למסך ההתקנה כדי להוסיף מאגרים. בלי הסימון, אחרי Save הוא נשאר ב-GitHub ולא חוזר לבורר. ("חיבור מאגר" הרגיל לא תלוי בזה: הוא עובר דרך OAuth ומגיע ישר לבורר, §3.3) |

### Webhook

| שדה | מה למלא |
|---|---|
| **Active** | ✅ מסומן |
| **Webhook URL** | `https://api.1lev1.com/api/v1/github/webhook` |
| **Webhook secret** | מחרוזת אקראית ארוכה (ר' למטה). אותו ערך בדיוק נכנס ל-`GITHUB_WEBHOOK_SECRET` |
| **SSL verification** | Enable (ברירת המחדל) |

יצירת secret:

```bash
openssl rand -hex 32
```

או ב-PowerShell:

```powershell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
```

> ⚠️ **content type.** אם יש בטופס בחירה בין `application/json` ל-`application/x-www-form-urlencoded`,
> לבחור **`application/json`**. ה-webhook מצפה ל-JSON.

---

## 2. Permissions — מה לבקש

**העיקרון:** מינימום הרשאות (PLAN_CODE_RIKMA §7). מצד שני, **הוספת הרשאה אחרי שהתקינו את ה-App
מחייבת כל מתקין לאשר מחדש** (GitHub שולח לו בקשה). לכן כדאי לבקש כבר עכשיו את מה ש-S3 ו-S4
יצטרכו בוודאות, ולא יותר.

### Repository permissions

| הרשאה | רמה | מתי צריך | למה |
|---|---|---|---|
| **Metadata** | **Read-only** | S2 — עכשיו | חובה בכל App (GitHub מסמן אותה אוטומטית). שם המאגר, ענף ראשי, רישיון |
| **Issues** | **Read and write** | S3 | issue הופך למטלה. כשהמטלה נסגרת ב-1lev1 כותבים comment על ה-issue |
| **Pull requests** | **Read-only** | S4 | PR ממוזג ו-reviews פותחים תביעת עבודה |
| כל השאר | **No access** | — | |

בשלבים מאוחרים יותר, כשיגיעו, תתווסף בקשת אישור נפרדת: **Checks** ו-**Dependabot alerts** (Read, §4.4)
ו-**Contents** (Read, ל-Genesis מההיסטוריה ב-S8). לא מבקשים אותן עכשיו.

> **Administration, Secrets, Workflows, Actions, Contents: write** — **אף פעם לא.** ה-App לא כותב
> קוד ולא נוגע בהגדרות של המאגר.

### Organization permissions

**כלום.** No access בכל השורות.

### Account permissions

**כלום.** בלי **Email addresses** ובלי אף הרשאה אחרת. זיהוי המשתמש (`GET /user`: מזהה ו-login)
עובד בלי הרשאות חשבון, ולפי §7 לא שומרים אימיילים.

### Enterprise permissions

כלום.

---

## 3. Subscribe to events

רשימת האירועים בטופס תלויה בהרשאות שנבחרו. לכן לפני בחירת ההרשאות רואים רק שלושה
(Installation target, Meta, Security advisory).

- **`installation` ו-`installation_repositories` נשלחים לכל App אוטומטית.** הם לא מופיעים ברשימה ולא
  צריך לסמן אותם. בדיוק בהם S2 משתמש.
- **S3 — לסמן `Issues`.** issue עם התווית `1lev1` נפתח כמטלה, סגירה שלו מודיעה לרקמה, וסימון המטלה
  כבוצעה כותב comment (לכן Issues: **Read and write**). שינוי מנויים לאירועים **לא** דורש אישור מחדש
  מהמתקינים.
- **S4 — לסמן `Pull request` ו-`Pull request review`.** PR ממוזג של חבר מקושר, או review שאישר
  או ביקש שינויים, שולח לו הודעה שאפשר להגיש על העבודה שעות מלשונית הקוד. השרת לא רושם שום דבר
  בעצמו. ההרשאה Pull requests: **Read-only** מספיקה. בלי המנויים האלה לשונית הקוד עדיין מציגה את
  העבודה (היא קוראת מ-GitHub בכל פתיחה), רק ההודעה לא נשלחת.
- **Issue comment — לא.** להשאיר לא מסומן (השרת עונה 202 ומתעלם; זה רק רעש).
- **Installation target, Meta, Security advisory:** לא לסמן.

---

## 4. Where can this GitHub App be installed?

**Any account** ✅. רקמות אחרות צריכות להתקין את ה-App על המשתמשים והארגונים **שלהן**.
"Only on this account" מתאים רק ל-App ניסיוני.

לוחצים **Create GitHub App**.

---

## 5. אחרי היצירה — איסוף הערכים

בדף ה-App (**General**):

| ערך בדף | משתנה env | הערות |
|---|---|---|
| **App ID** (מספר) | `GITHUB_APP_ID` | |
| **Client ID** (מתחיל ב-`Iv…`) | `GITHUB_APP_CLIENT_ID` | |
| **Client secrets → Generate a new client secret** | `GITHUB_APP_CLIENT_SECRET` | ⚠️ מוצג **פעם אחת**. להעתיק מיד |
| **Public link** `https://github.com/apps/<slug>` | `GITHUB_APP_SLUG` | רק החלק שאחרי `/apps/` |
| **Private keys → Generate a private key** | `GITHUB_APP_PRIVATE_KEY` | יורד קובץ `.pem`. ר' למטה |
| ה-secret מסעיף ה-Webhook | `GITHUB_WEBHOOK_SECRET` | |

### המפתח הפרטי בשורה אחת

קובץ `.env` לא מחזיק ערך רב-שורתי בנוחות, אז הופכים את ה-PEM לשורה אחת עם `\n` מילולי
(הקוד ממיר בחזרה, ומסיר גם גרשיים אם נכנסו):

```bash
awk 'NF {sub(/\r/, ""); printf "%s\\n", $0}' 1lev1.2026-09-15.private-key.pem
```

או ב-PowerShell:

```powershell
(Get-Content .\1lev1.2026-09-15.private-key.pem -Raw).Trim() -replace "`r?`n", '\n'
```

> 🔒 אחרי שהערך נכנס לשרת: **למחוק את קובץ ה-`.pem` מהמחשב**, ולא לשמור אותו בשום repo.
> אם דלף, מוחקים את המפתח בדף ה-App ומייצרים חדש.

---

## 6. איפה שמים את המשתנים

**רק בשרת ה-API** — `/home/ubuntu/api/.env` (הקונטיינר `sveltekit-api`):

```env
GITHUB_APP_ID=123456
GITHUB_APP_SLUG=1lev1
GITHUB_APP_CLIENT_ID=Iv23li...
GITHUB_APP_CLIENT_SECRET=...
GITHUB_APP_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----\n
GITHUB_WEBHOOK_SECRET=...
```

אחר כך מפעילים מחדש את הקונטיינר (`deploy.ps1` מסנכרן את ה-`.env`).

**ב-Vercel לא מוסיפים כלום.** הדפים שם שואלים את `api.1lev1.com/api/v1/github/status` אם החיבור מוגדר.

בדיקה שהשרת רואה את ההגדרה:

```bash
curl https://api.1lev1.com/api/v1/github/status
```

צריך לחזור `{"configured":true,"webhook":true}`.

---

## 7. Strapi — הרשאות

אחרי פריסת `1.0b` (ה-collection החדש `project-repo` והשדות `githubId`, `githubLogin`, `githubLinkedAt` ב-User):

1. **Settings → API Tokens →** הטוקן של השרת (`ADMINMONTHER`) → **project-repo**:
   `find`, `findOne`, `create`, `update`.
2. לוודא שאותו טוקן יכול לעדכן **Users-permissions → User** (`update`). קישור חשבון כותב לשם.
3. **Authenticated role: לא צריך כלום.** כל הקריאות והכתיבות עוברות דרך טוקן השירות.

---

## 8. בדיקה מקצה לקצה

1. **Webhook:** בדף ה-App → **Advanced → Recent Deliveries**. GitHub שולח `ping` מיד עם יצירת ה-App.
   אם השרת עוד לא היה פרוס, ה-ping יופיע כנכשל. אחרי הפריסה לוחצים **Redeliver** ומצפים ל-**200**.
   - `401` = ה-secret בשרת לא זהה לזה שב-App.
   - `503` = `GITHUB_WEBHOOK_SECRET` חסר בשרת.
2. **קישור חשבון:** נכנסים ל-`www.1lev1.com` → הגדרות → "קישור חשבון GitHub" → מאשרים ב-GitHub →
   חוזרים להגדרות עם "חשבון ה-GitHub קושר".
3. **חיבור מאגרים:** מוח של רקמה → זרימות → **קוד** → "חיבור מאגרים מ-GitHub" → בוחרים מאגר
   ומתקינים → חוזרים לטאב עם הרשימה.
4. **הוספה והסרה:** ב-GitHub, בהגדרות ההתקנה, מוסיפים או מסירים מאגר. הרשימה בטאב מתעדכנת.

### תקלות נפוצות

| הודעה / סימפטום | סיבה |
|---|---|
| GitHub: *The redirect_uri is not associated with this application* | ה-Callback URL ב-App לא זהה ל-`https://api.1lev1.com/api/v1/github/callback` |
| "עבר יותר מדי זמן" | עברו יותר מ-10 דקות, או שהעוגייה לא נשמרה (דפדפן חוסם עוגיות) |
| "לא התקבלה התקנה מ-GitHub" | לא סומן **Request user authorization (OAuth) during installation** |
| "החיבור התחיל ממשתמש אחר" | המשתמש התנתק או החליף חשבון באמצע, או שכבר אינו חבר ברקמה |
| "חלק מהמאגרים כבר מחוברים לרקמה אחרת" | מכוון: מאגר שייך לרקמה אחת. הרקמה השנייה צריכה לנתק אותו קודם |
| הכפתור אומר "החיבור לא הוגדר" | משתנה חסר ב-`/home/ubuntu/api/.env`. בודקים עם `curl …/status` |

---

## 9. פיתוח מקומי (אופציונלי)

לא מחברים את ה-App של הייצור ל-localhost. יוצרים **App נפרד**, למשל `1lev1-dev`:
- Callback: `http://localhost:5173/api/v1/github/callback`
- Webhook: דרך מנהרה (למשל `https://smee.io`), כי GitHub לא מגיע ל-localhost
- הערכים של ה-App הזה נכנסים ל-`.env` המקומי
