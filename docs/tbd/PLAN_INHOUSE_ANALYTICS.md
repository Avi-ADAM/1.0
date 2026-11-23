# PLAN_INHOUSE_ANALYTICS — אנליטיקס על השרת שלנו (Umami), כולל משפך ההסכמה

> מצב: **tbd**. נכתב 2026-11-23. זה שלב VA של [PLAN_VPS_ONLY](../inprogress/PLAN_VPS_ONLY.md): משימה
> שעומדת בפני עצמה, ואפשר לעשות אותה **עוד לפני** שהדפים עוזבים את Vercel (V3).
>
> **2026-11-23: A0–A2 חיים בשרת** (§7). Umami רץ ב-`https://pulse.1lev1.com`, והאתר שולח אליו מהדיפלוי הבא
> של Vercel. נשאר: A3 (משפך ו-Goals בדשבורד), ואחרי שבועיים במקביל, A4.

## 0. למה

היום:
- `src/routes/+layout.js` → `inject()` של `@vercel/analytics`: צפיות בדפים, מכשיר, מדינה, דפדפן.
- `src/lib/components/main/amana.svelte` → אירוע אחד, `track('tryToSign')`.
- `privacy.json` (`li3`) מצהיר על Vercel Analytics כספק צד שלישי.

הבעיות:
1. **צד שלישי.** המידע יושב אצל Vercel, וזה סעיף בהצהרת הפרטיות ושאלה בכל דיון על עוגיות והסכמה.
2. **בסיסי מדי.** אין משפך. לא יודעים כמה מגיעים ל-`/hascama`, כמה יוצאים להסכמה המורחבת
   ב-`agreement.1lev1.com`, כמה **חוזרים** משם (`?agreed=true`), כמה נעצרים בטופס, וכמה עוזבים את דף
   הבית בלי ללחוץ על כלום.
3. **נעלם ב-V6.** כשהדפים עוברים ל-VPS, `@vercel/analytics` כבר לא עובד. אם לא נקים חלופה לפני V5,
   ייווצר חור בנתונים בדיוק בשבוע שבו הכי חשוב להשוות לפני/אחרי.

## 1. הכלי: Umami (קוד פתוח, לא בונים מאפס)

| | **Umami** | Plausible CE | Matomo |
|---|---|---|---|
| רישיון | MIT | AGPL | GPL |
| מסד נתונים | **Postgres, וכבר יש לנו** (`mastra-postgres`) | ClickHouse + Postgres (עוד שירות כבד) | MySQL/MariaDB + PHP |
| זיכרון | כ-150–250MB | ClickHouse לבד 1GB+ | בינוני-כבד |
| עוגיות | **בלי**. session = hash של IP+UA+אתר עם salt שמתחלף | בלי | עם, אלא אם מכבים |
| משפכים | **כן** (Funnel report), וגם Journeys, Retention, Goals | Funnels בגרסה בתשלום בלבד | כן (plugin) |
| אירועים עם מאפיינים | כן (`umami.track(name, data)`) | כן | כן |
| מכשיר / מדינה / דפדפן / מקור | כן (GeoLite מובנה) | כן | כן |
| דשבורד | מובנה, משתמשים והרשאות, קישור שיתוף לקריאה בלבד, API | מובנה | מובנה, כבד |

**ההחלטה: Umami.** הוא נשען על ה-Postgres שכבר רץ, ה-image קטן, משפכים כלולים בחינם, ובלי עוגיות
אין צורך בבאנר הסכמה בשבילו. Plausible נפסל בגלל ClickHouse ובגלל שמשפכים לא נמצאים בגרסה החינמית.
Matomo נפסל בגלל ה-PHP, ה-MySQL, והעוגיות כברירת מחדל.

לנעוץ **תגית image מדויקת** בזמן ההקמה (לא `latest`), כמו כל שירות אחר ב-compose.

## 2. מה מודדים — המשפך

כל שלב הוא pageview או אירוע ב-**האתר שלנו בלבד**, כך שהמשפך לא תלוי בשאלה מה רץ ב-`agreement.1lev1.com`.

| # | שלב | איך נמדד | איפה בקוד |
|---|---|---|---|
| 1 | נכנס לדף הבית | pageview `/` | אוטומטי |
| 2 | לחץ על משהו בבית | `home_cta` `{ cta: 'join' \| 'about' \| 'love' \| … }` | `fpage.svelte` |
| 3 | הגיע לדף ההסכמה | pageview `/hascama` | אוטומטי |
| 4a | יצא להסכמה המורחבת | `agreement_out` `{ from: 'button' \| 'infobox' }` | `goToAgreementSite()` ב-`amana.svelte` |
| 4b | **חזר** מההסכמה המורחבת | `agreement_back` (כשה-URL מגיע עם `agreed=true`) | ה-`onMount` שקורא `agreed` ב-`amana.svelte` |
| 5 | ניסה לחתום | `sign_try` `{ full: bool }` (במקום `tryToSign` של Vercel) | `handleSubmit()` |
| 6 | נכשל בבדיקה | `sign_invalid` `{ field: 'name' \| 'email' \| 'terms' \| 'taken' }` | ענפי `validate()` / `nameuse` |
| 7 | חתם | `sign_ok` `{ full: bool }` | אחרי `fetch('/api/chezin')` מוצלח, לפני `goto('/signup…')` |
| 8 | השלים הרשמה | pageview של הדף הראשון אחרי `/signup` | אוטומטי |

מה זה עונה:
- **"עוזבים את דף הבית בלי ללחוץ"**: bounce rate של `/`, ושלב 1 → 2 במשפך.
- **"הולכים להסכמה המורחבת וחוזרים?"**: יחס `agreement_back` / `agreement_out`. מי שיצא ולא חזר הוא
  נשירה שאפשר לספור.
- **"נעצרים בשלב ההסכמה?"**: שלב 3 → 5, ושלב 5 → 7 עם `sign_invalid` לפי שדה שמראה **איפה** נתקעו.
- **פילוח**: כל שלב לפי מכשיר, מדינה, שפה (`lang` נשלח כמאפיין) ומקור הגעה (referrer, UTM).

## 3. פרטיות — מה **לא** נכנס

זה החלק החשוב, כי אנליטיקס פנימי שאוסף מידע אישי גרוע מ-Vercel.

- **כתובות עם שם ומייל.** `goToAgreementSite()` שם `name` ו-`email` ב-URL, ו-`/signup?fp=…&un=…&con=…`
  נושא את השם. לכן הסקריפט נטען עם `data-exclude-search="true"` ו-`data-exclude-hash="true"`, ופונקציית
  `data-before-send` מוחקת כל query שנשאר. בגלל זה גם `agreed=true` לא יגיע לבד, ולכן הוא אירוע מפורש (4b).
- **אף פעם** שם, מייל, מזהה משתמש, `chezinId` או `fp` בתוך מאפיין של אירוע. רק enum-ים קצרים.
  עטיפה אחת (§4.2) מסננת מפתחות שלא ברשימה המותרת.
- **IP** משמש רק ל-geo ול-hash של ה-session, ולא נשמר.
- **Do Not Track**: `data-do-not-track="true"`.
- **אפליקציית המובייל (Tauri)**: לא נטען, כמו היום (`isMobileBuild`).
- **מה שנשאר לעדכן**: `privacy.json` `li3` בכל 5 השפות. "סטטיסטיקת אתר מצטברת, בלי עוגיות, על השרתים
  שלנו" במקום Vercel Analytics.

## 4. שלבים

### A0 — השירות על ה-VPS
1. DB חדש `umami` על `mastra-postgres` (משתמש נפרד, הרשאות רק על ה-DB שלו). תקציב החיבורים של V0
   (120) מספיק בהרבה.
2. שירות `umami` ב-`docker-compose.api.yml`, תגית נעוצה, `mem_limit: 384m`, רק ברשת `app-network`, בלי
   `ports:`. `APP_SECRET` ו-`DATABASE_URL` ב-`.env` של השרת (זהירות עם `$`, memory `project_vps2_migration`).
3. nginx: `pulse.1lev1.com` → `umami:3000`, certbot כמו לשאר תתי-הדומיינים. **חובה** להעביר
   `X-Forwarded-For` / `X-Real-IP`, אחרת כל המבקרים ייראו כאילו הם מגיעים מכתובת ה-proxy, והפילוח לפי מדינה
   יתקלקל.
4. שם הסקריפט וה-endpoint: `TRACKER_SCRIPT_NAME` ו-`COLLECT_API_ENDPOINT` עם שמות ניטרליים. חוסמי
   פרסומות חוסמים `umami.js` ו-`/api/send`, ובכתובת ניטרלית על תת-דומיין שלנו פחות מבקרים יאבדו.
5. רשת: DNS ב-GoDaddy, רשומת A ל-`analytics` → `91.90.82.93`.
6. גיבוי: להוסיף את ה-DB `umami` לגיבוי של `db-backups` (נמוך בעדיפות, זה לא מקור אמת).

**בדיקה:** הדשבורד נפתח, יצירת אתר `1lev1.com`, ובקשה ידנית ל-collect מחזירה 200.

### A1 — הסקריפט באתר, במקביל ל-Vercel
1. `src/app.html` או `+layout.svelte`: `<script defer src="https://pulse.1lev1.com/<name>.js"
   data-website-id=… data-domains="1lev1.com,www.1lev1.com" data-exclude-search="true" …>`. ה-ID ב-
   `PUBLIC_UMAMI_WEBSITE_ID`. אם המשתנה ריק, לא נטען כלום (ככה dev ו-preview לא מלכלכים את הנתונים).
2. ניווט SPA של SvelteKit נספר לבד, כי Umami מאזין ל-`history.pushState`.
3. **Vercel Analytics נשאר** בשלב הזה. שבועיים של שתי מערכות זו-לצד-זו כדי לוודא שהמספרים קרובים
   (הבדל של 10–20% סביר: חוסמי פרסומות, DNT).
4. CSP: אם יש `script-src` / `connect-src`, להוסיף את `pulse.1lev1.com`.

### A2 — אירועי המשפך
1. עטיפה אחת `src/lib/analytics/track.js`: `track(name, props)` שבודקת שהשם ברשימה סגורה ושהמאפיינים
   ברשימה המותרת (§3), קוראת `window.umami?.track` ולא זורקת אף פעם. בזמן A1–A3 היא קוראת גם ל-Vercel.
   קוד האפליקציה לא מייבא יותר `@vercel/analytics` ישירות.
2. האירועים של §2 ב-`fpage.svelte` וב-`amana.svelte`. `tryToSign` נשאר כ-alias עד הניקוי.
3. בדיקות: unit לעטיפה (שם לא מוכר ומפתח אסור נזרקים בשקט, ואין `window.umami` = no-op), ובדיקת
   רכיב שמוודאת ש-`goToAgreementSite` ו-`handleSubmit` קוראים לה.

### A3 — הדשבורד
1. ב-Umami: Funnel בשם "הצטרפות" עם שלבי §2 (1 → 3 → 4a → 4b → 5 → 7), ו-Goal לכל אירוע.
2. Journey מ-`/` כדי לראות לאן הולכים מי שלא נכנסו ל-`/hascama`.
3. משתמש צפייה בלבד לשותפים, או קישור שיתוף (share URL) לדשבורד הכללי.
4. אופציונלי, אחר כך: כרטיס במסך אדמין פנימי שקורא את ה-API של Umami בצד השרת (מפתח ב-`$env/dynamic/private`).

### A4 — עוזבים את Vercel Analytics
מתבצע כחלק מ-V6 של PLAN_VPS_ONLY, או לפני כן אם המספרים ב-A1 תואמים:
- להסיר את `inject()` מ-`+layout.js`, את הענף של Vercel בעטיפה, ואת `@vercel/analytics` מ-`package.json`.
- `privacy.json` × 5 שפות (§3).
- memory/docs שמזכירים Vercel Analytics.

## 5. סדר מול המעבר

```
A0 → A1 → A2 → A3          לא תלוי ב-V3, אפשר כבר עכשיו כשהדפים עוד ב-Vercel
         └── שבועיים במקביל ל-Vercel ──► V5 (DNS) ──► A4 בתוך V6
```

**הכלל:** A1–A2 חייבים לרוץ **לפני** V5, כדי שיהיו נתוני בסיס להשוואה בשבוע של המעבר.

## 6. שאלות פתוחות

1. `agreement.1lev1.com`: מאיזה repo הוא מוגש? אם נרצה לראות גם **כמה זמן** קוראים שם ואיפה עוצרים
   (לא רק יציאה וחזרה), צריך את אותו סקריפט שם, עם אותו website-id ו-`data-domains` שכולל אותו. בלי זה
   המשפך עדיין שלם מצד האתר שלנו.
2. האם למדוד גם `/concierge` ו-`/made-for-you` כמשפך שני (כניסת לקוח)? אותה תשתית, רק עוד אירועים.
3. משך שמירה: למחוק אירועים גולמיים אחרי 12/24 חודשים?
4. מי מקבל גישה לדשבורד: רק מנהל האתר, או קישור קריאה לכל שותף בפלטפורמה?

## 7. מה נבנה (2026-11-23) ומה נשאר לעשות בשרת

**בקוד:**
- 1.0main `docker-compose.api.yml`: שירות `umami` (`ghcr.io/umami-software/umami:3.4.1`, `mem_limit 384m`,
  profile `analytics`, בלי `ports:`). הסודות מוגדרים עם `:-` ולא עם `:?`, כי `api-switch.sh` מריץ compose על
  כל הקובץ בכל דיפלוי של ה-API, ומשתנה חסר היה מפיל את הדיפלוי הזה ולא רק את Umami.
- 1.0b `nginx/default.conf.template`: `pulse.1lev1.com`. בלוק 80 (certbot) תמיד, ובלוק 443 בין הסמנים
  `pulse-tls`. `render-conf.sh` מוריד את בלוק ה-443 עד שקיים `nginx/pulse-tls.on`, כי nginx לא עולה בכלל
  כשקובץ תעודה חסר, וזה היה מפיל את כל האתרים בשרת. הסקריפט מוגש ב-`/p.js` (שם ניטרלי), האירועים
  ב-`/api/send` (ברירת המחדל של Umami: `COLLECT_API_ENDPOINT` נאפה בזמן ה-build של ה-image, ולכן לא
  משנים אותו). ה-upstream הוא משתנה, כך ש-nginx עולה גם כש-`umami` כבוי.
- `src/lib/analytics/track.js`: `track()` עם רשימה סגורה (`EVENTS`), ערכים רק בתבנית `[a-z0-9_-]{1,32}`
  או boolean או מספר, שולח ל-Umami ול-Vercel. `beforeSend` מוחק query ו-hash מ-url ומ-referrer.
  `loadPulse()` לא טוען כלום כש-`PUBLIC_UMAMI_WEBSITE_ID` ריק.
- `src/lib/analytics/homeCta.js`: מאזין אחד על שורש דף הבית מתייג כל לחיצה לפי `data-cta` או לפי היעד
  (`join` לכל דפי ההסכמה, `login`, `anchor`, `external`, או החלק הראשון של הנתיב).
- `amana.svelte`: `agreement_out` (`button` / `infobox`), `agreement_back`, `sign_try`, `sign_invalid`
  (`name` / `email` / `country` / `terms` / `taken` / `already`), `sign_ok`. `tryToSign` של Vercel הוחלף ב-`sign_try`.
- נבדק: 15 בדיקות unit. בדפדפן, ב-`/hascama` מקומי, לחיצה על "חתום" עם טופס ריק שלחה `sign_try` ו-
  `sign_invalid {field:'name'}` גם ל-stub של Umami וגם ל-Vercel. דף הבית לא נבדק בדפדפן (משתמש מחובר
  מופנה ל-`/lev`). את המאזין שלו מכסה `homeCta.test.ts`.

**בשרת: הוחל 2026-11-23.**
1. DNS: רשומת A `pulse` → `91.90.82.93` (נוצרה ב-GoDaddy).
2. Postgres: role ו-DB בשם `umami` על `mastra-postgres`.
3. `~/api/.env`: `UMAMI_DB_PASSWORD`, `UMAMI_APP_SECRET`, `UMAMI_2FA_KEY` נוצרו בשרת עצמו (גיבוי של ה-.env
   הקודם ב-`~/api/.env.bak-umami-*`).
4. `docker compose -f docker-compose.api.yml --profile analytics up -d --no-deps umami`: healthy, כל ה-migrations
   עברו. משיכת ה-image מ-GHCR נקטעה פעם אחת ב-IPv6 והצליחה בניסיון חוזר.
5. 1.0b `64a2456`: `git pull` + `render-conf.sh` + `nginx -t` + `nginx -s reload` בלבד (בלי `deploy.ps1`, שמגלגל גם
   את Strapi). מצב ה-gate נשמר (`closed`).
6. certbot webroot ל-`pulse.1lev1.com` (מתחדש לבד דרך `reload-docker-nginx.sh`), `touch nginx/pulse-tls.on`,
   render ו-reload. נבדק: הדשבורד, `/p.js` ו-`/api/heartbeat` מחזירים 200. גם `api` עונה 200, ו-`tovmeod` 403
   (ה-gate סגור, כמו קודם).
7. **סיסמת ה-admin הוחלפה בלי להתחבר**: hash של bcrypt נכתב ישירות לטבלה `user`. הסיסמה נמצאת רק ב-
   `~/api/.umami_admin_password` (`600`). ההתחברות עם `admin` / `umami` מחזירה עכשיו 401. מומלץ להחליף אותה
   בדשבורד אחרי הכניסה הראשונה.
8. האתר `1lev1.com` נוצר בטבלה `website` (`recorder_enabled = false`, בלי הקלטת sessions), id
   `90036726-6c43-46dd-978d-cd2f1122e54e`. ה-id **נמצא בקוד** (`PULSE_WEBSITE_ID` ב-`track.js`) ולא במשתנה של
   Vercel: הוא לא סוד, ו-`data-domains` כבר מונע שליחה מכל host חוץ מ-1lev1.com. `PUBLIC_UMAMI_WEBSITE_ID` דורס
   אותו, וערך ריק מכבה.
9. A3: Funnel ו-Goals בדשבורד.
