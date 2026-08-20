# src-tauri — מעטפת המובייל

מעטפת Tauri v2 שאורזת את `www.1lev1.com` לאפליקציית אנדרואיד (ובהמשך iOS).
התכנית המלאה נמצאת ב-[`../docs/PLAN_TAURI_MOBILE.md`](../docs/PLAN_TAURI_MOBILE.md).
המסמך הזה מסביר רק את מה שלא מובן מאליו כשפותחים את התיקייה.

## הרצה

```bash
npm run android:apk       # APK ל-arm64 (debug) — הכי מהיר לאיטרציה
npm run android:install   # מתקין את ה-APK האחרון על המכשיר המחובר
npm run android:dev       # hot-reload מול מכשיר מחובר
npm run android:build     # כל הארכיטקטורות, release
```

דורש `JAVA_HOME` (ה-JBR של Android Studio), `ANDROID_HOME`, `NDK_HOME` ו-Rust
עם ארבעת יעדי אנדרואיד (`rustup target add aarch64-linux-android …`).

## שלוש נקודות שמפתיעות

**1. ה-WebView טוען אתר חי, לא נכסים ארוזים.**
`app.windows[0].url` מצביע על `https://www.1lev1.com/?app=1`. זו הסיבה שהאימות
פשוט עובד: ה-origin הוא האתר עצמו, ולכן ה-cookie ‏(`jwt`, HttpOnly, same-origin)
נשלח כרגיל — בלי CORS, בלי Bearer, בלי לגעת ב-`/api/send` או `/api/action`.
`build.frontendDist` מצביע על `./shell` — מעטפת מקומית זעירה שמשמשת כמסך
ה-offline; אין `beforeBuildCommand`, כי אין סיבה לבנות את SvelteKit לתוך ה-bundle.

> מסלול ה-SPA (adapter-static, `npm run build:mobile`, `$lib/platform`) **לא
> נמחק** — הוא נשאר כמסלול ההמשך, ל-offline/local-first ולפלאגינים נייטיביים.
> `tauri.spa.conf.json` מחזיק את ההפרש. מה שהוא דורש לפני שהוא שמיש מתועד
> בשלבים 1–2 של התכנית: `/api/auth/me`, guards בצד לקוח, CORS ו-Bearer.

**2. `gen/android/` נמצא ב-git בכוונה.**
זה לא פלט build אלא קוד מקור: שם עורכים את `AndroidManifest.xml`, את
`res/values*/` ואת `MainActivity.kt`. מתעלמים רק מ-`gen/schemas` ומתיקיות
ה-build שבתוכו — ראה `.gitignore`.

> ⚠️ `npx tauri android init` **דורס** את `res/values/strings.xml` ומחזיר את
> `app_name` ל-`1lev1`. אם הרצתם אותו מחדש, החזירו את "1לב1".

**3. אין הרשאות IPC לתוכן מרוחק — וזו החלטה.**
`capabilities/default.json` (עם `core:default`) חלה רק על תוכן מקומי; capability
בלי שדה `remote` לא נותנת דבר לאתר. האתר לא צריך כרגע שום IPC, ולכן לא נוצרה
capability מרוחקת.

> לפי התיעוד של Tauri, בלינוקס ובאנדרואיד Tauri **לא מבחין בין `<iframe>` מוטמע
> לבין החלון עצמו**. באתר יש הטמעות YouTube (`growpage.svelte`,
> `VideoModal.svelte`). לכן אם יתווסף בעתיד `capabilities/mobile.json` עם
> `remote.urls` — בלי wildcards, והרשאות מינימליות בלבד; הניחו שכל iframe בעמוד
> יכול להגיע לכל מה שנפתח שם.

## מזהה האפליקציה

`world.onelev1.app` (‏debug מקבל סיומת `.debug`, כך ששתי הגרסאות חיות במקביל).

> ה-Capacitor הישן (`android/`, `capacitor.config.ts`) השתמש ב-`world.1lev1.app`.
> **זה שם חבילה לא חוקי** — מקטע בשם חבילה של Java/Android לא יכול להתחיל בספרה,
> ולכן הפרויקט הזה מעולם לא נבנה (`android/app/src/main/java/world/1lev1/app/`
> אפילו לא מתקמפל). אין רישום קיים ב-Play, ולכן היה חופשי לבחור מזהה תקין.
> **המזהה ננעל לצמיתות בפרסום הראשון ל-Google Play — אין לשנותו.**

## אייקון ומסך פתיחה

**המקור לאייקון הוא `app-icon.png`** — המטבע של 1💗1, נמשך מה-`maskable_icon`
שב-`static/manifest_with_new_routes.json`. לחידוש: `npx tauri icon src-tauri/app-icon.png`.

`tauri icon` מקלקל שני דברים, ושניהם מתוקנים בקבצי XML (ולכן שורדים הרצה חוזרת
רק אם לא דורסים אותם):

| מה | למה |
|---|---|
| `values/ic_launcher_background.xml` | `tauri icon` מחזיר אותו ל-`#fff` בכל הרצה. הצבע הנכון הוא `#EEE8AA`. |
| ההקדמה של האייקון האדפטיבי | `tauri icon` פורש את הסמל על כל ה-108dp; מסכת המשגר חותכת 18dp מכל צד ומגלחת את שפת המטבע. `drawable/ic_launcher_foreground_inset.xml` ממקם אותו ב-65dp (‏≈60%) בתוך האזור הבטוח, ו-`mipmap-anydpi-v26/ic_launcher.xml` מצביע עליו. |

**מסך הפתיחה** בנוי על `androidx.core:core-splashscreen` ולכן זהה מ-API 24 ועד
היום (מ-31 זה ה-splash של המערכת, מתחת לזה הספרייה מחקה אותו):

| מה | איפה |
|---|---|
| `Theme.Lev1.Splash` (רקע, אייקון, `postSplashScreenTheme`) | `res/values/themes.xml` |
| ה-theme של ה-Activity | `AndroidManifest.xml` |
| `installSplashScreen()` + תנאי ההשארה | `MainActivity.kt` |
| הרקע במצב לילה | `res/values-night/colors.xml` |

`MainActivity` **משאיר את מסך הפתיחה עד שהאתר המרוחק צויר**, ולכל היותר
`SPLASH_TIMEOUT_MS`. בלי זה נראה מסך ריק בין ירידת ה-splash לבין הציור הראשון
של ה-WebView — הוא טוען אתר ברשת, לא נכסים מקומיים.

שלושה דברים שהתבררו במדידה על מכשיר (בפרויקט האח 106_ezrachi) ומיושמים כאן:

1. **`webView.progress` חסר תועלת.** הוא 100 כבר על המסמך הריק, לפני שהאתר
   התחיל להיטען. לכן שואלים את המסמך עצמו — `CONTENT_PROBE` מחזיר
   `protocol|readyState|מספר הילדים של body`.
2. **אסור לשרשר את הפולינג דרך ה-callback של `evaluateJavascript`.** כשאין עדיין
   מסמך, WebView פשוט לא קורא לו, והבדיקה מתה בניסיון הראשון.
3. **יצרנים מסוימים (MIUI) מחשיכים בכוח צבע בהיר במצב לילה.** לכן יש
   `values-night/colors.xml` עם צבע כהה משלנו — צבע שכבר כהה לא עובר את ההמרה.

`adb logcat -s Lev1Splash:I` נותן את התזמון המדויק בלי לבנות מחדש.

## לבדוק שינוי באתר לפני שהוא נפרס

האפליקציה טוענת אתר חי, ולכן שינוי מקומי ב-`src/` **לא** יופיע בה עד לפריסה.
כדי לבדוק לפני: העתיקו את `tauri.dev-local.json.example` ל-`tauri.dev-local.json`
(לא בגיט), שימו בו את ה-IP המקומי, ואז:

```bash
npx vite dev --host 0.0.0.0
npx tauri android build --debug --apk --target aarch64 --config ./src-tauri/tauri.dev-local.json
```

הנתיב ב-`--config` נפתר יחסית **לשורש הריפו**, לא ל-`src-tauri`.

> ⚠️ **אל תדרסו את ה-identifier ב-`--config`.** Tauri קושר את `gen/android`
> ל-identifier יחיד — הוא מוטבע ב-`build.gradle.kts` כ-`applicationId`/`namespace`
> וגם במבנה תיקיות ה-Java — ודריסה נכשלת ב-
> `Error Project directory ... does not match the bundle identifier`.

## חתימה ל-release

`app/build.gradle.kts` קורא `gen/android/keystore.properties` אם הוא קיים (לא
בגיט). בלעדיו בנייה ב-release עוברת אבל מפיקה חבילה לא חתומה, ש-Google Play ידחה.

```properties
storeFile=C:/path/מחוץ/לריפו/1lev1-release.jks
storePassword=…
keyAlias=1lev1
keyPassword=…
```
