# תכנית: 1לב1 כתוכנה ל-Windows (Tauri v2, שלב ראשון של הדסקטופ)

מסמך עבודה לסוכן שבונה את גרסת ה-Windows. לקרוא קודם את
[`src-tauri/README.md`](../../src-tauri/README.md) ואת
[`PLAN_TAURI_MOBILE.md`](../inprogress/PLAN_TAURI_MOBILE.md) — הדסקטופ **ממשיך** את
המעטפת שכבר עובדת באנדרואיד, הוא לא פרויקט חדש.

דף ההורדה כבר קיים (`/download`) ומחכה רק לפרסום הראשון — ראו §7, החוזה ביניהם.

---

## 0. העיקרון: אותה מעטפת, אותו `src-tauri`, בלי לשבור את אנדרואיד

- **פרויקט Tauri אחד.** לא לפתוח `src-tauri-desktop` ולא להעתיק קבצים. מה ששונה
  ב-Windows הולך ל-`src-tauri/tauri.windows.conf.json` — Tauri ממזג אותו אוטומטית
  מעל `tauri.conf.json` בבנייה ל-Windows בלבד.
  > ⚠️ המיזוג הוא JSON Merge Patch (RFC 7396): **מערכים מוחלפים בשלמותם**. מי
  > שדורס את `app.windows` חייב לכתוב את כל אובייקט החלון מחדש — כולל `label: "main"`
  > ו-`url` — אחרת החלון יאבד את הכתובת.
- **ה-identifier נשאר `world.onelev1.app`.** ב-Windows הוא קובע את תיקיית הנתונים
  (`%LOCALAPPDATA%\world.onelev1.app\`), ובתוכה את פרופיל WebView2 עם ה-cookie של
  ההתחברות. שינוי שלו אחרי פרסום = כל המשתמשים מתנתקים ומקבלים התקנה שנייה.
- **המעטפת טוענת את האתר החי**, כמו באנדרואיד. האימות (cookie `jwt`, HttpOnly,
  same-origin) עובד בלי לגעת ב-`/api/send`/`/api/action`. **לא** לעבור עכשיו למסלול
  ה-SPA — הוא דורש את שלבים 1–2 של תכנית המובייל.
- **תלויות דסקטופ בלבד** ב-`Cargo.toml` תחת
  `[target.'cfg(not(any(target_os = "android", target_os = "ios")))'.dependencies]`,
  והרישום שלהן ב-`lib.rs` תחת `#[cfg(desktop)]`. אחרי כל שינוי לוודא ש-`cargo check`
  עובר גם ליעד אנדרואיד (`--target aarch64-linux-android`) — או לפחות שאין שינוי
  שנוגע בו.
- **לא לגעת ב-`gen/android/`** ולא להריץ `tauri android init`.

## 1. החלון

ב-`tauri.conf.json` החלון בגודל טלפון (420×900). ב-`tauri.windows.conf.json`:

- גודל דסקטופ: `width: 1280, height: 820, minWidth: 380, minHeight: 600, center: true`.
- **`dragDropEnabled: false` — חובה.** ב-Windows ברירת המחדל של Tauri בולעת את ה-
  HTML5 drag & drop של העמוד, והקנבן, גרירת קבצים להעלאה וכל `ondrop` באתר מפסיקים
  לעבוד בשקט.
- `title: "1לב1"` (כמו היום), ואייקון מ-`icons/icon.ico` הקיים.
- **זכירת גודל ומיקום**: `tauri-plugin-window-state`.
- **מופע יחיד**: `tauri-plugin-single-instance` — לחיצה שנייה על האייקון מביאה את
  החלון הקיים לקדמה, לא פותחת חלון שני עם אותו פרופיל WebView2.
- **User-Agent מזהה**: להוסיף לחלון `userAgent` שמסתיים ב-`1lev1-desktop/<גרסה>`
  (את ה-UA המלא של WebView2 לשמור, רק להוסיף סיומת). כך האתר יוכל בהמשך להסתיר את
  הפניות ל-`/download` בתוך האפליקציה עצמה. `?app=1` שב-URL לא נקרא היום בשום מקום
  באתר — לא לבנות עליו.

## 2. אופליין — המעטפת לא עובדת היום בדסקטופ

`shell/index.html` (מסך "אין חיבור") **לא מחובר לשום דבר**: החלון נפתח ישר על
`https://www.1lev1.com`, ובלי רשת WebView2 מציג את דף השגיאה שלו. הפתרון המומלץ:
החלון ב-Windows נפתח על המעטפת המקומית (`url: "index.html"`), והיא בודקת חיבור
(`navigator.onLine` + `fetch` קצר עם timeout ל-`https://www.1lev1.com/favicon.ico`,
`mode: 'no-cors'`) ואז `location.replace('https://www.1lev1.com/')`. בלי חיבור —
מציגה את המסר הקיים וכפתור "נסו שוב". לשמור על המסר בעברית כמו היום.

## 3. קישורים חיצוניים, חלונות קופצים והורדות

אתר שרץ בתוך חלון ייעודי מתנהג אחרת מדפדפן. לבדוק ולטפל:

- **כל origin שאינו `1lev1.com` (וסאב-דומיינים שלו)** — YouTube, WhatsApp, GitHub,
  Google Maps, אתרי רקמות חיצוניים, `mailto:`/`tel:` — נפתח **בדפדפן ברירת המחדל**
  דרך `tauri-plugin-opener`, מ-Rust (handler על ניווט / חלון חדש), לא בתוך החלון.
- `target="_blank"` / `window.open` לכתובת פנימית — לנווט באותו חלון או לפתוח חלון
  Tauri נוסף; לא להשאיר חלון WebView2 יתום.
- **הורדת קבצים** (חשבוניות, ייצוא, קבצי רקמה) — לוודא שקובץ שנלחץ באתר באמת נשמר
  ל-Downloads ושהמשתמש רואה את זה.
- ההטמעות של YouTube (`growpage.svelte`, `VideoModal.svelte`) צריכות להמשיך לעבוד
  בתוך העמוד.

## 4. אבטחה — אפס IPC לתוכן מרוחק

ההחלטה מ-README נשארת: **אין capability עם `remote.urls`**. האתר לא צריך IPC.
כל מה שהדסקטופ מוסיף (בדיקת עדכונים, פתיחת קישורים, window-state, single-instance)
רץ **מ-Rust**, ולא נחשף ל-JavaScript של האתר. אם בעתיד באמת צריך פקודה — הרשאה אחת
מינימלית, בלי wildcards, ובהנחה שכל iframe בעמוד יכול להגיע אליה.

## 5. עדכונים אוטומטיים (חובה כבר בגרסה הראשונה)

אחרי שמשתמש התקין גרסה שאין בה updater, אין דרך להביא אותו לגרסה הבאה מלבד שיחזור
לאתר. לכן:

1. `tauri-plugin-updater` (+ `tauri-plugin-process` להפעלה מחדש).
2. זוג מפתחות: `npx tauri signer generate`. **המפתח הפרטי וסיסמתו רק ב-GitHub
   Secrets** (`TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`),
   המפתח הציבורי ב-`plugins.updater.pubkey`. אובדן המפתח הפרטי = אין עוד עדכונים
   למי שכבר התקין. לשמור עותק מחוץ ל-GitHub.
3. `bundle.createUpdaterArtifacts: true`; `plugins.updater.endpoints` מצביע על
   **אותו `latest.json`** שדף ההורדה קורא (§7). `windows.installMode: "passive"`.
4. הבדיקה מ-Rust ב-`setup`: בעלייה ופעם בכמה שעות; כשיש עדכון — דיאלוג נייטיבי
   "יש גרסה חדשה, להתקין ולהפעיל מחדש?" (בעברית), לא התקנה כפויה באמצע עבודה.

## 6. המתקין

ב-`tauri.windows.conf.json` → `bundle`:

- `targets: ["nsis", "msi"]`. ה-NSIS (`…-setup.exe`) הוא ההורדה הראשית; ה-MSI
  לארגונים/התקנה מנוהלת.
- `windows.nsis.installMode: "currentUser"` — בלי UAC ובלי הרשאות מנהל (דף ההורדה
  אומר את זה במפורש למשתמשים — לא לשנות בלי לעדכן את `download.install.s2`).
- `windows.nsis.languages: ["Hebrew", "English"]`, `displayLanguageSelector: true`.
- `windows.webviewInstallMode`: `downloadBootstrapper` (ברירת המחדל) מספיק — WebView2
  מותקן ב-Windows 11 ובכמעט כל Windows 10 מעודכן.
- `publisher`, `copyright`, `shortDescription` — שיופיעו נכון ב"אפליקציות מותקנות".
- **גרסה**: `version` ב-`tauri.conf.json` משותף לאנדרואיד ול-Windows. MSI דורש גרסה
  מספרית (`major.minor.patch`, בלי `-beta`). להעלות גרסה בכל release.

### חתימת קוד (SmartScreen)

בלי חתימה Windows מציג "Windows הגן על המחשב שלך" — דף ההורדה כבר מסביר איך לעבור
אותו, כך שאפשר לפרסם גרסה ראשונה לא חתומה. לגרסה שפונה לקהל רחב: **Azure Trusted
Signing** (הכי זול ונתמך ישירות ב-`bundle.windows.signCommand`) או תעודת OV. זו
החלטה עם עלות — להעלות אותה לבעלים, לא לקנות.

## 7. החוזה עם דף ההורדה (`/download`)

הדף כבר בנוי (`src/routes/download/`, `src/lib/download/release.js`,
`src/lib/server/download/releases.js`). הוא **לא** מכיר את GitHub — הוא קורא את
מניפסט העדכונים:

| | |
|---|---|
| `DESKTOP_RELEASE_MANIFEST_URL` | כתובת ה-`latest.json` (https). זה כל מה שצריך כדי שהכפתור יופיע. |
| `ANDROID_DOWNLOAD_URL` | אופציונלי — דף Play או APK ישיר. |

- הדף מחפש ב-`platforms` את `windows-x86_64-nsis` / `windows-x86_64` עם קובץ `.exe`,
  ואת `windows-x86_64-msi` עם `.msi`. כתובת שאינה https, או חבילת `.zip` של v1,
  **לא תוצג** — זה בכוונה.
- `notes` מוצג כטקסט ("מה חדש"), `pub_date` כתאריך הפרסום.
- קישורים קבועים: `/download/windows`, `/download/windows-msi`, `/download/android` —
  תמיד מפנים לגרסה האחרונה. לקישורים במייל ובתוך האפליקציה להשתמש בהם.
- בלי משתנה סביבה — הדף מציג "בקרוב" ולא נשבר.

### איפה הקבצים יושבים

**אם הריפו פרטי, נכסים של GitHub Release לא ניתנים להורדה ציבורית** — לא לקבצים
ולא ל-`latest.json`. אז ה-CI צריך להעלות את ה-`.exe`, ה-`.msi` וה-`latest.json`
לאחסון ציבורי (bucket/CDN, או ריפו releases ציבורי נפרד), ו-`DESKTOP_RELEASE_MANIFEST_URL`
מצביע לשם. אם הריפו ציבורי: `https://github.com/<owner>/<repo>/releases/latest/download/latest.json`.

## 8. CI — אין בנייה ל-Windows בסביבת הסוכן

סביבת הענן של Claude היא Linux; מתקין NSIS/MSI אמין נבנה רק על Windows. לכן:

- `.github/workflows/desktop-windows.yml`, `runs-on: windows-latest`,
  `tauri-apps/tauri-action@v0`, מופעל על tag `desktop-v*` ועל `workflow_dispatch`.
- Node 22, `npm ci`, `dtolnay/rust-toolchain@stable`, `swatinem/rust-cache`.
- ה-secrets של §5 כ-env; יצירת release + `latest.json` (`includeUpdaterJson: true`).
- **אין `beforeBuildCommand`** — לא בונים את SvelteKit לתוך ה-bundle (כמו באנדרואיד).
- בסביבת הסוכן אפשר רק `cargo check` (ואולי `cargo check --target x86_64-pc-windows-msvc`
  אם ה-target מותקן). כל טענה "המתקין עובד" חייבת לבוא מריצת CI ירוקה ומבדיקה על
  מחשב Windows אמיתי.

## 9. מחוץ לתחום של השלב הזה

התראות מערכת (Web Push לא עובד ב-WebView2; דורש IPC או ערוץ נפרד), tray, הפעלה עם
Windows, deep links (`onelev1://`), macOS ו-Linux, מסלול ה-SPA/אופליין מלא, חתימת
מפתחות בחומרה (R1 — דורש את ה-SPA, ראו תכנית המובייל).

## 10. קריטריון קבלה

על מחשב Windows 10 ועל Windows 11, מהקובץ שה-CI הפיק:

1. ההתקנה עוברת בלי הרשאות מנהל, בעברית, ומוסיפה קיצור לתפריט התחל.
2. התחברות, `/lev`, יצירת משימה, צ'אט וגרירה בקנבן — עובדים.
3. סגירה ופתיחה: עדיין מחובר, והחלון חוזר לגודל ולמיקום שלו.
4. לחיצה שנייה על האייקון לא פותחת מופע שני.
5. קישור חיצוני נפתח בדפדפן; סרטון YouTube מוטמע מתנגן בעמוד.
6. בלי רשת: מסך "אין חיבור", ו"נסו שוב" עובד כשהרשת חוזרת.
7. גרסה x.y.(z+1) שפורסמה מתגלה ומותקנת מתוך האפליקציה.
8. `/download` עם `DESKTOP_RELEASE_MANIFEST_URL` מציג את הגרסה ומוריד את המתקין;
   `/download/windows` מפנה אליו.
9. בניית האנדרואיד לא השתנתה (`npm run android:apk` עדיין עובד, ו-`gen/android` לא נגע).
