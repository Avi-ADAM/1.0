# בדיקת תלויות — 2026-10-14

## מסקנה

בוצע ניקוי ועדכון ממוקד, **לא שדרוג גורף ולא אישור שהפרויקט נקי מחולשות**.
בשורש הוסרו 24 תלויות ישירות ללא שימוש פעיל ונוספו 9 הצהרות חסרות: מספר התלויות הישירות ירד מ־144 ל־129. מספר הרשומות הנעולות ב־`package-lock.json` ירד מ־1,981 ל־1,743 (כולל תלויות עקיפות וחבילות לפלטפורמות אחרות; לא גודל bundle).

נבדקו ארבעת פרויקטי npm: השורש, `socket-server`, `remotion`, `video-tutorials`.
הבדיקה כללה imports בקוד ובבדיקות, imports דינמיים, קובצי תצורה, CSS, סקריפטי CLI, peer dependencies ותיעוד הפריסה. היעדר import לבדו **לא** שימש הוכחה שחבילה מיותרת.

`src-tauri/Cargo.toml`, קוד Rust וקובצי Gradle נבדקו סטטית בלבד. לא בוצעו `cargo audit/update`, בדיקת גרסאות מול מאגרי Rust/Android או בנייה נייטיבית: כלי Rust/Android והגישה למאגרי החבילות שלהם אינם זמינים בסביבה זו. אין כאן אישור לעדכניות התלויות הנייטיביות.

## ממצאי אבטחה

ספירת **חבילות מושפעות** כפי שדווחה על ידי `npm audit --json`, כולל שרשראות של תלויות עקיפות; זו אינה ספירה של פרצות ייחודיות או הוכחה לניצול בפועל.

| פרויקט / היקף | לפני | אחרי | קריטיות לפני → אחרי |
| --- | ---: | ---: | ---: |
| שורש, כולל כלי פיתוח | 159 | 106 | 9 → 5 |
| שורש, `--omit=dev` | 106 | 35 | 7 → 2 |
| Socket server, כולל כלי פיתוח | 15 | 0 | 2 → 0 |
| Remotion, כולל כלי פיתוח | 23 | 0 | 13 → 0 |
| Video tutorials | 0 | 0 | 0 → 0 |

בשורש נותרו 68 התראות בדרגת high, 22 moderate ו־11 low, נוסף על 5 critical. בחתך production: ‏13 high, ‏13 moderate, ‏7 low ו־2 critical.
חלק מהירידה בחתך production נובע מהעברת כלי פיתוח ל־`devDependencies`, ולא מתיקון החולשות שלהם. סיווג npm גם אינו מבטיח שקוד של devDependency לא נכלל ב־bundle; יש להתייחס גם לסריקה המלאה.

## מה הוסר ולמה

| חבילות | ראיות להסרה |
| --- | --- |
| `@sentry/sveltekit` | ה־plugin וה־hooks היו מושבתים בהערות. הוסר גם ה־import הלא־בשימוש ב־`vite.config.js` ובלוק ה־plugin המושבת. |
| `firebase` | כל ההפניות בקובצי layout הן הערות/JSDoc; אין אינטגרציה פעילה. |
| `@graphql-codegen/introspection` | `codegen.ts` מפעיל רק את plugin ה־TypeScript, שנשאר. |
| `@threlte/preprocess`, `svelte-sequential-preprocessor` | אינם מופעלים בתצורת Svelte ואין שימוש בקוד. |
| `jsdom` | סביבת הבדיקות היא `happy-dom`; ההפניה היחידה היא הערה. |
| `patch-package` | אין תיקיית patches או patches מנוהלים ב־Git. הוסר גם `postinstall` ועודכן ההסבר ב־Dockerfile. |
| `mkcert` | אין סקריפט שמשתמש בו; תצורת HTTPS המקומית מושבתת. |
| `postcss-load-config` | אין שימוש ישיר; Vite מנהל את התלות הדרושה לו בעצמו. |
| `svelte-sitemap` | אין CLI script, תצורה או import; אזכורים בתוכניות עתידיות בלבד. |
| `svelte-viewport-info` | אזכורים בהערות בקובצי `.backup` ו־`.dead` בלבד. |
| `tailwindcss-animate` | אינו רשום כ־plugin ב־Tailwind ואין import ב־CSS. |
| `@svelte-plugins/datepicker`, `@tiptap/extension-floating-menu`, `blueimp-canvas-to-blob`, `buffer`, `cookie`, `jquery`, `kit-sw-workbox`, `local-access`, `lodash.has`, `lodash.isequal`, `svelte-forms-lib`, `svelte-gestures` | אין שימוש פעיל בקוד, בתצורה או בסקריפטים. `Buffer` הגלובלי של Node אינו import של חבילת `buffer`, והשימוש ב־cookies של SvelteKit אינו מצריך תלות ישירה ב־`cookie`. |

הסרת תלות ישירה אינה מחייבת היעלמות מוחלטת מעץ החבילות: למשל, חבילת cookie עדיין עשויה להידרש על ידי ספרייה אחרת.

## הצהרות חסרות וסיווג תלויות

נוספו כתלויות runtime מפורשות, לפי הגרסאות שכבר היו נעולות:

- `zod` — סכמות וכלי Mastra משתמשים בה ישירות.
- `@mastra/loggers` — `src/mastra/index.ts`.
- `d3-interpolate` — `src/lib/func/animation.ts`.
- `dayjs` — רכיבי מכירות וכלי עזר.
- `runed` — רכיב חיתוך התמונה.
- `pdfjs-dist` — import ישיר של ה־PDF worker ב־`analyze-cv.ts`. **נעול בדיוק ל־`5.4.296`, כמו התלות של `pdf-parse@2.4.5`**, כדי למנוע אי־התאמה בין מנוע ה־PDF ל־worker. יש לעדכן את שניהם יחד.

נוספו כלי פיתוח שהיו חסרים: `@vitest/ui@3.2.7` עבור `test:ui`, ו־`playwright` / `@playwright/test` בגרסה `1.63.0` עבור כלי האימות הקיימים. גרסת Playwright זהה לזו שב־`video-tutorials`. דפדפנים לא הורדו ולא הופעלו תרחישים כנגד האתר החי.

`dotenv` הועבר לתלות runtime משום שמודולים בצד השרת מייבאים `dotenv/config`.
`@capacitor/cli`, `@tailwindcss/vite`, `cssnano`, `jsrepo`, `mastra` (ה־CLI), `postcss`, `prettier`, `prettier-plugin-svelte`, `vite` הועברו ל־`devDependencies`. חבילות `@mastra/*` הנדרשות לשרת נשארו ב־runtime.

## עדכונים שבוצעו

הגרסאות בטבלה הן הגרסאות הנעולות בפועל, לא רק הטווחים ב־manifest.

| אזור | חבילות | לפני → אחרי |
| --- | --- | --- |
| שורש | `@capacitor/android`, `@capacitor/core`, `@capacitor/cli` | 6.2.1 → 6.2.2 |
| שורש | `vite` | 6.4.3 → 6.4.4 |
| שורש | `postcss` | 8.5.14 → 8.5.30 |
| שורש | `moment` | 2.30.1 → 2.31.0 |
| שורש | `socket.io-client` | 4.8.3 → 4.8.4 |
| שורש | תלויות עקיפות | עדכון ממוקד של `proxy-addr`, `shell-quote`, `ws`, `engine.io-client`, `socket.io-parser` בתוך הטווחים המותרים |
| Socket server | `socket.io`, `socket.io-client` | 4.8.1 → 4.8.4 |
| Socket server | `jsonwebtoken` | 9.0.2 → 9.0.3 |
| Socket server | `vitest` | 1.6.1 → 5.0.4; שדרוג major מאומת בכל 37 הבדיקות |
| Socket server | `@types/node`, `tsx` | 20.19.25 → 24.19.2; ‏4.20.6 → 4.23.15 |
| Socket server | תלויות נוספות | רענון בתוך הטווחים הקיימים; ה־manifest של dotenv עודכן ל־`^16.6.1` (כבר היה נעול ל־16.6.1) |
| Remotion | `remotion`, `@remotion/cli`, `@remotion/google-fonts`, `@remotion/transitions` | 4.0.380 → 4.0.535, כולן נעולות לאותה גרסה |

Dockerfiles של השורש וה־Socket server יושרו ל־Node 24, בהתאם ל־`engines.node` של הפרויקט הראשי. ל־Socket server נוספה אותה דרישת Node. לא בוצעה בניית image בסביבה זו; יש לוודא גם שסביבת Render/השרת הידנית משתמשת ב־Node 24.

נשמרו שני lockfiles בשורש: מסמכי הפרויקט מציינים שימוש ב־Yarn ב־Render, ולכן `yarn.lock` לא נמחק. npm עדכן גם אותו, והתקנת Yarn קפואה אומתה בתיקיית בדיקה נפרדת. בטווח הארוך רצוי לאחד את מנהל החבילות, אך רק אחרי אימות הגדרות הפריסה.

## מה נשאר לטיפול — לפי עדיפות

1. **חולשות critical בתלויות runtime:**
   - `maplibre-gl@5.24.0`: נדרש מעבר לגרסה מתוקנת בקו 6 ובדיקת רכיבי המפה וה־popup. [Advisory](https://github.com/advisories/GHSA-jrc7-96c5-q579).
   - `swiper@8.4.7`: נדרש שדרוג גדול או החלפת האינטגרציה. קו Swiper החדש אינו תחליף ישיר לרכיבי Svelte הישנים שבהם משתמש האתר. [Advisory](https://github.com/advisories/GHSA-hmx5-qpq5-p643).
2. **Vitest בשורש:** `3.2.7` נשאר עם חולשות, כולל `tinypool`. יש לתכנן מעבר של שני פרויקטי הבדיקות (unit/components) ל־5, יחד עם `@vitest/ui` ובדיקת התאימות ל־Vite. השרת העצמאי כבר עבר ל־5; הצלחתו אינה מוכיחה תאימות לכל בדיקות Svelte. אין לחשוף את שרת ה־UI לרשת לא מהימנה.
3. **Capacitor CLI / tar:** תיקון מלא דורש החלפה/שדרוג של הכלי. לא הוסר Capacitor: `docs/inprogress/PLAN_TAURI_MOBILE.md` דורש להמתין לאימות ה־APK של Tauri. גם `android/` וקובץ התצורה עדיין קיימים.
4. **Nodemailer, GraphQL Codegen, Tiptap, jsrepo, SvelteKit/adapter-vercel ו־Mastra:** נשארו התראות, חלקן דורשות major. אין להפעיל `npm audit fix --force` ללא בדיקת שינויים ב־API. בחלק מהמקרים npm מציע אפילו downgrade (למשל mammoth), שאינו תיקון אוטומטי בטוח.
5. **Peer dependencies לא תקינות/חסרות:** `npm ls --depth=0` עובר, אבל `npm ls --all` אינו עובר. `.npmrc` מכיל `legacy-peer-deps=true`, ולכן התקנה מוצלחת אינה הוכחת תאימות:
   - `svelte-gantt@4.5.0` מצהיר על Svelte 4, בעוד הפרויקט משתמש ב־5.
   - תלויות `@threlte/extras` דורשות Three לפחות 0.170, בעוד שנעול 0.168; גם `@types/three` חסר ל־maath.
   - חלק מתלויות Mastra/כלי AI ישנים דורשים Zod 3, בעוד שהשורש משתמש ב־4.
   - ל־`hono-openapi` חסרים peers: `@standard-community/standard-json`, `@standard-community/standard-openapi`, `@types/json-schema`, `openapi-types`.
   - שרשרת jsrepo מציגה אי־התאמה ב־valibot. Yarn מציג גם peer חסר של `@hono/node-server` תחת כלי Mastra.
   - יש ליישר את המשפחות הללו ביחד, ולא להסיר את `legacy-peer-deps` לפני שהן תוקנו.
6. **Tailwind כפול:** PostCSS מפעיל Tailwind 3, ו־Vite מפעיל את plugin של Tailwind 4. שניהם מוגדרים בפועל, לכן לא נמחק אחד מהם. צריך לאחד pipeline עם בדיקות חזותיות לפני שדרוג Tailwind/`tailwind-merge`.
7. **מועמדים לאישור נוסף:** `@tauri-apps/api` אינו מיובא כרגע אך מופיע בתוכנית המובייל; `bufferutil` ו־`utf-8-validate` עשויים לשמש האצה אופציונלית ל־WebSocket ללא import של האפליקציה. לא הוסרו על בסיס חיפוש טקסט בלבד.
8. **טיפוסי Strapi:** קובצי `.d.ts` שנוצרו מה־backend מייבאים `@strapi/strapi`, שאינו תלות של ה־frontend. לא נוספה מערכת Strapi שלמה רק כדי להשקיט שגיאת טיפוסים; צריך להסדיר יצירת/שיתוף טיפוסים.
9. **Native:** קובצי Android הישנים כוללים Gradle plugin ‏4.2.1, SDK ‏30 ו־jcenter. יש להחליט על סיום המעבר ל־Tauri לפני השקעה בעדכונם. אין import מפורש של `serde`/`serde_json` בקוד Rust הקטן, אבל לא הוסרו ללא אימות של קוד שנוצר ושל בנייה נייטיבית.

## אימות שבוצע

הבדיקות הורצו עם Node ‏24.21.0 ו־npm ‏10.9.8.

| בדיקה | תוצאה |
| --- | --- |
| `npm ci --no-audit --no-fund` בכל ארבעת הפרויקטים | עבר, ללא מחיקת/יצירה ידנית של רשומות lock |
| שורש: `npm test -- --maxWorkers=2`, לפני ואחרי התקנה נקייה סופית | בשתי הריצות: 420 קבצים עברו, 14 נכשלו; 5,046 בדיקות עברו ו־54 נכשלו. רשימות `FAIL` זהות, לא רק המספרים. |
| שורש: `npm run build` | לפני ואחרי נעצר באותה שגיאה: `API_KEY_NONCE` חסר. אין אישור לבניית production מלאה. לא הוזנו סודות ולא הופעלו שירותי production. |
| שורש: `npm run check` | הריצה המקורית נתקלה במחסור בזיכרון. אחרי הניקוי, עם `NODE_OPTIONS=--max-old-space-size=3072`, הושלמה עם 1,350 שגיאות ו־1,351 אזהרות ב־314 קבצים. אין השוואת baseline מלאה לטיפוסים; אין טענה שכל השגיאות קדמו לשינוי. |
| שורש: `npm ls --depth=0` | עבר; סריקת העץ המלאה עדיין נכשלת בגלל ה־peers המפורטים לעיל. |
| Yarn 1.22.22: `yarn install --frozen-lockfile --ignore-scripts --non-interactive --registry https://registry.npmjs.org` | עבר בתיקייה נפרדת, עם אזהרות peers. lifecycle scripts לא נבדקו ב־Yarn. |
| Socket server: `npm test -- --maxWorkers=2` | כל 37 הבדיקות עברו לאחר `npm ci` הסופי. |
| Socket server: `npm run build` | עבר. |
| Remotion: `tsc --noEmit` ו־`remotion bundle` | עברו לאחר `npm ci`; לא בוצע רינדור וידאו/הורדת דפדפן. |
| Video tutorials | התקנה נקייה ובדיקת תחביר לכל קובצי `.mjs` עברו. לא בוצעה הקלטה מול האתר החי. |
| `git diff --check` | עבר. |

## בדיקה חוזרת

מתוך כל תיקייה שבה יש `package.json`:

```sh
npm ci
npm outdated --include=dev
npm audit
npm audit --omit=dev
npm ls --all
```

ל־`npm outdated` ול־`npm audit` עשוי להיות exit code ‏1 כאשר נמצאו פערים/חולשות — זהו ממצא ולא בהכרח כשל תקשורת. יש להשוות את הגרסה **הנעולה** מול `wanted` (הטווח המותר) ומול `latest` (עשוי לדרוש migration), ולא להסיק ש־`^` ב־manifest מעדכן התקנות `npm ci` אוטומטית.

## מלאי גרסאות לאחר השינוי
צילום מצב של npm registry במועד הבדיקה. `wanted` הוא הגבוה ביותר בטווח המוצהר; `latest` אינו בהכרח יעד שדרוג תואם. טבלה זו מתעדת גם חבילות שטרם עודכנו, ולא מהווה אישור תאימות.

<details>
<summary>האפליקציה הראשית</summary>

| חבילה | סוג | נעולה | wanted | latest |
| --- | --- | --- | --- | --- |
| `@1lev1/svelte-share` | runtime | 0.0.9 | 0.0.9 | 0.1.2 |
| `@ai-sdk/google` | runtime | 3.0.71 | 3.0.132 | 4.0.95 |
| `@ai-sdk/groq` | runtime | 3.0.39 | 3.0.74 | 4.0.60 |
| `@ai-sdk/openai` | runtime | 3.0.63 | 3.0.127 | 4.0.93 |
| `@capacitor/android` | runtime | 6.2.2 | 6.2.2 | 8.5.3 |
| `@capacitor/core` | runtime | 6.2.2 | 6.2.2 | 8.5.3 |
| `@event-calendar/day-grid` | runtime | 3.12.0 | 3.12.0 | 3.12.0 |
| `@event-calendar/interaction` | runtime | 3.12.0 | 3.12.0 | 3.12.0 |
| `@fontsource/fira-mono` | runtime | 5.2.7 | 5.3.0 | 5.3.0 |
| `@fullcalendar/core` | runtime | 6.1.20 | 6.1.21 | 7.1.2 |
| `@fullcalendar/daygrid` | runtime | 6.1.20 | 6.1.21 | 6.1.21 |
| `@fullcalendar/interaction` | runtime | 6.1.20 | 6.1.21 | 6.1.21 |
| `@fullcalendar/timegrid` | runtime | 6.1.20 | 6.1.21 | 6.1.21 |
| `@google/generative-ai` | runtime | 0.24.1 | 0.24.1 | 0.24.1 |
| `@internationalized/date` | runtime | 3.12.1 | 3.12.4 | 3.12.4 |
| `@lucide/svelte` | runtime | 0.525.0 | 0.525.0 | 1.57.0 |
| `@mastra/core` | runtime | 1.32.1 | 1.77.0 | 1.77.0 |
| `@mastra/libsql` | runtime | 1.10.0 | 1.26.1 | 1.26.1 |
| `@mastra/loggers` | runtime | 1.1.1 | 1.3.7 | 1.3.7 |
| `@mastra/mcp` | runtime | 1.7.0 | 1.18.0 | 2.4.0 |
| `@mastra/memory` | runtime | 1.17.5 | 1.37.1 | 1.37.1 |
| `@mastra/pg` | runtime | 1.10.0 | 1.10.0 | 1.31.1 |
| `@number-flow/svelte` | runtime | 0.3.13 | 0.3.13 | 0.4.2 |
| `@pinecone-database/pinecone` | runtime | 7.2.0 | 7.2.0 | 9.0.0 |
| `@tauri-apps/api` | runtime | 2.11.1 | 2.12.3 | 2.12.3 |
| `@tiptap/core` | runtime | 2.27.2 | 2.27.3 | 3.32.0 |
| `@tiptap/extension-bubble-menu` | runtime | 2.27.2 | 2.27.3 | 3.32.0 |
| `@tiptap/extension-highlight` | runtime | 2.27.2 | 2.27.3 | 3.32.0 |
| `@tiptap/extension-link` | runtime | 2.27.2 | 2.27.3 | 3.32.0 |
| `@tiptap/extension-text-align` | runtime | 2.27.2 | 2.27.3 | 3.32.0 |
| `@tiptap/extension-underline` | runtime | 2.27.2 | 2.27.3 | 3.32.0 |
| `@tiptap/html` | runtime | 2.27.2 | 2.27.3 | 3.32.0 |
| `@tiptap/pm` | runtime | 2.27.2 | 2.27.3 | 3.32.0 |
| `@tiptap/starter-kit` | runtime | 2.27.2 | 2.27.3 | 3.32.0 |
| `@vercel/analytics` | runtime | 1.6.1 | 1.6.1 | 2.0.1 |
| `axios` | runtime | 1.20.0 | 1.20.0 | 1.20.0 |
| `bits-ui` | runtime | 2.18.1 | 2.19.5 | 2.19.5 |
| `clsx` | runtime | 2.1.1 | 2.1.1 | 2.1.1 |
| `d3-array` | runtime | 3.2.4 | 3.2.4 | 3.2.4 |
| `d3-format` | runtime | 3.1.2 | 3.1.2 | 3.1.2 |
| `d3-geo` | runtime | 3.1.1 | 3.1.1 | 3.1.1 |
| `d3-hierarchy` | runtime | 3.1.2 | 3.1.2 | 3.1.2 |
| `d3-interpolate` | runtime | 3.0.1 | 3.0.1 | 3.0.1 |
| `d3-scale` | runtime | 4.0.2 | 4.0.2 | 4.0.2 |
| `d3-shape` | runtime | 3.2.0 | 3.2.0 | 3.2.0 |
| `date-fns` | runtime | 3.6.0 | 3.6.0 | 4.4.0 |
| `dayjs` | runtime | 1.11.20 | 1.11.23 | 1.11.23 |
| `dotenv` | runtime | 17.4.2 | 17.4.2 | 18.0.7 |
| `fetch-to-node` | runtime | 2.1.0 | 2.1.0 | 2.1.0 |
| `mammoth` | runtime | 1.12.0 | 1.13.0 | 1.13.0 |
| `maplibre-gl` | runtime | 5.24.0 | 5.24.0 | 6.14.0 |
| `moment` | runtime | 2.31.0 | 2.31.0 | 2.31.0 |
| `nodemailer` | runtime | 6.10.1 | 6.10.1 | 10.1.1 |
| `pdf-parse` | runtime | 2.4.5 | 2.4.5 | 2.4.5 |
| `pdfjs-dist` | runtime | 5.4.296 | 5.4.296 | 6.4.299 |
| `progressbar-svelte` | runtime | 1.0.0 | 1.0.0 | 1.0.0 |
| `push.js` | runtime | 1.0.12 | 1.0.12 | 1.0.12 |
| `runed` | runtime | 0.35.1 | 0.35.1 | 0.37.1 |
| `socket.io-client` | runtime | 4.8.4 | 4.8.4 | 4.8.4 |
| `svelte-accessible-dialog` | runtime | 2.1.3 | 2.1.3 | 2.1.3 |
| `svelte-agnostic-draggable` | runtime | 0.2.0 | 0.2.0 | 0.2.0 |
| `svelte-confetti` | runtime | 2.3.2 | 2.3.2 | 2.3.2 |
| `svelte-copy` | runtime | 2.0.0 | 2.0.0 | 2.0.0 |
| `svelte-easy-crop` | runtime | 4.0.1 | 4.0.1 | 5.0.1 |
| `svelte-gantt` | runtime | 4.5.0 | 4.5.0 | 4.5.0 |
| `svelte-scrollto-element` | runtime | 3.1.0 | 3.1.0 | 3.1.0 |
| `svelte-sonner` | runtime | 0.3.28 | 0.3.28 | 1.2.1 |
| `svelte-toolbelt` | runtime | 0.9.3 | 0.9.3 | 0.10.6 |
| `svelte-touch-to-mouse` | runtime | 1.0.0 | 1.0.0 | 1.0.0 |
| `svelte-tour` | runtime | 1.0.7 | 1.0.7 | 1.0.7 |
| `sveltekit-i18n` | runtime | 2.4.2 | 2.4.2 | 3.4.1 |
| `svelty-email` | runtime | 0.1.1 | 0.1.1 | 0.1.1 |
| `svelty-picker` | runtime | 5.2.12 | 5.2.12 | 6.1.6 |
| `swiper` | runtime | 8.4.7 | 8.4.7 | 14.3.0 |
| `tailwind-merge` | runtime | 2.6.1 | 2.6.1 | 3.7.0 |
| `tailwind-variants` | runtime | 1.0.0 | 1.0.0 | 3.3.1 |
| `telegraf` | runtime | 4.16.3 | 4.16.3 | 4.16.3 |
| `three` | runtime | 0.168.0 | 0.168.0 | 0.186.1 |
| `topojson-client` | runtime | 3.1.0 | 3.1.0 | 3.1.0 |
| `vaul-svelte` | runtime | 1.0.0-next.7 | 1.0.0-next.7 | 0.3.2 |
| `web-push` | runtime | 3.6.7 | 3.6.7 | 3.6.7 |
| `yootils` | runtime | 0.3.1 | 0.3.1 | 0.3.1 |
| `yup` | runtime | 1.7.1 | 1.7.1 | 1.7.1 |
| `zod` | runtime | 4.4.3 | 4.6.7 | 4.6.7 |
| `@capacitor/cli` | dev | 6.2.2 | 6.2.2 | 8.5.3 |
| `@event-calendar/core` | dev | 3.12.0 | 3.12.0 | 5.17.1 |
| `@event-calendar/time-grid` | dev | 3.12.0 | 3.12.0 | 3.12.0 |
| `@graphql-codegen/cli` | dev | 6.1.2 | 6.1.2 | 7.4.6 |
| `@graphql-codegen/typescript` | dev | 5.0.8 | 5.0.8 | 6.1.2 |
| `@playwright/test` | dev | 1.63.0 | 1.63.0 | 1.64.0 |
| `@sveltejs/adapter-node` | dev | 5.5.4 | 5.5.7 | 6.0.0 |
| `@sveltejs/adapter-static` | dev | 3.0.10 | 3.0.10 | 4.0.0 |
| `@sveltejs/adapter-vercel` | dev | 5.10.3 | 5.10.3 | 7.0.0 |
| `@sveltejs/kit` | dev | 2.70.3 | 2.70.3 | 3.0.1 |
| `@sveltejs/vite-plugin-svelte` | dev | 5.1.1 | 5.1.1 | 7.3.1 |
| `@tailwindcss/vite` | dev | 4.3.0 | 4.3.3 | 4.3.3 |
| `@tauri-apps/cli` | dev | 2.11.4 | 2.12.2 | 2.12.2 |
| `@testing-library/jest-dom` | dev | 6.9.1 | 6.9.1 | 7.0.1 |
| `@testing-library/svelte` | dev | 5.3.1 | 5.4.2 | 5.4.2 |
| `@threlte/core` | dev | 8.5.14 | 8.6.1 | 8.6.1 |
| `@threlte/extras` | dev | 9.16.0 | 9.22.1 | 9.22.1 |
| `@vitest/ui` | dev | 3.2.7 | 3.2.7 | 5.0.4 |
| `autoprefixer` | dev | 10.5.0 | 10.6.1 | 10.6.1 |
| `bufferutil` | dev | 4.1.0 | 4.1.0 | 4.1.0 |
| `cssnano` | dev | 7.1.9 | 7.1.9 | 9.8.0 |
| `fast-check` | dev | 4.7.0 | 4.10.2 | 4.10.2 |
| `graphql` | dev | 16.14.0 | 16.14.2 | 17.0.2 |
| `happy-dom` | dev | 20.9.0 | 20.14.6 | 21.0.1 |
| `jsrepo` | dev | 2.5.2 | 2.5.2 | 3.8.1 |
| `layercake` | dev | 8.4.4 | 8.4.4 | 11.0.0 |
| `mastra` | dev | 1.8.1 | 1.34.1 | 1.34.1 |
| `playwright` | dev | 1.63.0 | 1.63.0 | 1.64.0 |
| `postcss` | dev | 8.5.30 | 8.5.30 | 8.5.30 |
| `prettier` | dev | 3.8.3 | 3.9.10 | 3.9.10 |
| `prettier-plugin-svelte` | dev | 3.5.1 | 3.5.2 | 4.1.1 |
| `svead` | dev | 0.0.4 | 0.0.4 | 0.1.0 |
| `svelte` | dev | 5.56.10 | 5.56.10 | 5.57.2 |
| `svelte-animated-headline` | dev | 2.0.0 | 2.0.0 | 2.0.0 |
| `svelte-calendar` | dev | 3.1.6 | 3.1.6 | 3.1.6 |
| `svelte-check` | dev | 4.6.0 | 4.7.6 | 4.7.6 |
| `svelte-multiselect` | dev | 11.7.0 | 11.8.0 | 11.8.0 |
| `svelte-range-slider-pips` | dev | 3.2.2 | 3.2.2 | 4.1.1 |
| `svelte-share-buttons-component` | dev | 3.0.0 | 3.0.0 | 3.0.0 |
| `tailwindcss` | dev | 3.4.19 | 3.4.19 | 4.3.3 |
| `typescript` | dev | 5.9.3 | 5.9.3 | 7.0.2 |
| `utf-8-validate` | dev | 5.0.10 | 5.0.10 | 6.0.6 |
| `vite` | dev | 6.4.4 | 6.4.4 | 8.3.4 |
| `vite-plugin-devtools-json` | dev | 1.0.0 | 1.1.2 | 1.1.2 |
| `vitest` | dev | 3.2.7 | 3.2.7 | 5.0.4 |

</details>

<details>
<summary>Socket server</summary>

| חבילה | סוג | נעולה | wanted | latest |
| --- | --- | --- | --- | --- |
| `dotenv` | runtime | 16.6.1 | 16.6.1 | 18.0.7 |
| `jsonwebtoken` | runtime | 9.0.3 | 9.0.3 | 9.0.3 |
| `socket.io` | runtime | 4.8.4 | 4.8.4 | 4.8.4 |
| `@types/jsonwebtoken` | dev | 9.0.10 | 9.0.10 | 9.0.10 |
| `@types/node` | dev | 24.19.2 | 24.19.2 | 26.6.5 |
| `socket.io-client` | dev | 4.8.4 | 4.8.4 | 4.8.4 |
| `tsx` | dev | 4.23.15 | 4.23.15 | 4.23.15 |
| `typescript` | dev | 5.9.3 | 5.9.3 | 7.0.2 |
| `vitest` | dev | 5.0.4 | 5.0.4 | 5.0.4 |

</details>

<details>
<summary>Remotion</summary>

| חבילה | סוג | נעולה | wanted | latest |
| --- | --- | --- | --- | --- |
| `@remotion/google-fonts` | runtime | 4.0.535 | 4.0.535 | 4.0.535 |
| `@remotion/transitions` | runtime | 4.0.535 | 4.0.535 | 4.0.535 |
| `react` | runtime | 19.0.0 | 19.0.0 | 19.3.0 |
| `react-dom` | runtime | 19.0.0 | 19.0.0 | 19.3.0 |
| `remotion` | runtime | 4.0.535 | 4.0.535 | 4.0.535 |
| `@remotion/cli` | dev | 4.0.535 | 4.0.535 | 4.0.535 |
| `@types/react` | dev | 19.0.0 | 19.0.0 | 19.3.0 |
| `typescript` | dev | 5.5.4 | 5.5.4 | 7.0.2 |

</details>

<details>
<summary>Video tutorials</summary>

| חבילה | סוג | נעולה | wanted | latest |
| --- | --- | --- | --- | --- |
| `playwright` | dev | 1.63.0 | 1.64.0 | 1.64.0 |

</details>
