# כיוון הדף לפי השפה: אנגלית, ספרדית ורוסית נבנות משמאל לימין

> מצב: `inprogress/` — **שלב 0 בנוי (2026-11-19) ותוקן (2026-11-25); שלב 1 בנוי
> (2026-11-25)** חוץ מ־1.2 (ניקוי `dir={$isRtl…}`, נדחה לסוף). שלבים 2–4 ו־`check:dir`
> עוד לא התחילו. נכתב 2026-11-18 אחרי בדיקת האתר באנגלית:
> טופס טיוטת הרקמה (`BlueprintReview`) ועוד הרבה טפסים נפרשים מימין לשמאל
> גם כשהשפה `en`.
>
> משלים את [PLAN_EN_READINESS](../inprogress/PLAN_EN_READINESS.md): שם תורגם
> **הטקסט**; כאן מתוקן **הכיוון**. אפשר לעבוד על שניהם במקביל, אבל שלב 0 כאן
> משנה את ברירת המחדל של כל האתר, אז הוא נכנס לבד ונבדק לבד.

---

## למה זה קורה (שורש הבעיה)

שלושה דברים, ושניים מהם גלובליים:

1. **`src/app.postcss:1668`** — `body { direction: rtl; }` לכל השפות. כל רכיב
   שלא הצהיר `dir` בעצמו יורש RTL, גם באנגלית. זה בדיוק מה שקורה ב־
   `src/lib/components/assistant/BlueprintReview.svelte`: אין בו `dir` אחד על
   מיכל, אז הוא כולו RTL.
2. **`<html>` לא מקבל `dir` בצד השרת.** `src/app.html:2` הוא
   `<html lang=%lang% …>` בלבד, ו־`hooks.server.js` (`transformPageChunk`,
   סביב שורה 578) מחליף רק `%lang%`. ה־`dir` נקבע ב־JS רק בשני מקומות, ורק
   כשמשתמש **מחליף** שפה: `src/lib/components/onboard/LangSwitch.svelte:26`
   ו־`src/routes/(reg)/me/settings/+page.svelte:42`. מי שנכנס עם `?lang=en` או
   עם עוגייה — לא עובר דרכם בכלל. ועם רשימות LTR כפולות (`['en','ru','es']`
   פעמיים).
3. **פיצוי מקומי בכל רכיב.** בגלל 1+2, ~220 קבצים כותבים
   `dir={$isRtl ? 'rtl' : 'ltr'}` על המיכל שלהם, ו־~50 קבצים כותבים
   `dir="rtl"` קבוע (88 מופעים). כל מקום שנשכח — שבור באנגלית.

מעבר לזה יש שכבה שנייה, שתתגלה ברגע שהכיוון הגלובלי יתוקן: עיצוב **פיזי**
(שמאל/ימין) שנכתב בהנחה שהדף RTL — `ml-*`/`pr-*`, `text-right`, `left-*`,
`rounded-l`, `margin-left:` ב־CSS, חיצים `←`. ב־RTL הם נראים נכון, ב־LTR הם
הפוכים.

### היקף (ספירה ב־2026-11-18, קבצי `.svelte` חיים, בלי `.dead`/`.unused`/`.backup`)

| דפוס | מופעים | קבצים |
|---|---|---|
| `dir="rtl"` / `dir='rtl'` קבוע | 88 | ~50 |
| `dir={$isRtl ? …}` מקומי (פיצוי) | — | ~220 |
| `direction: rtl` ב־CSS | 9 | 7 (+`app.postcss`, `styles/onboard.css:45`) |
| Tailwind פיזי `ml-/mr-/pl-/pr-` | ~405 | 25 |
| `text-right` / `text-left` | 38 | 15 |
| `left-*` / `right-*` (מיקום) | 65 | 29 |
| `rounded-l/r/tl/tr…`, `border-l/r` | 72 | 14 |
| CSS `margin/padding-left/right:` | 52 | 23 |
| CSS `left:`/`right:` עם ערך | 155 | 82 |
| CSS `text-align: left/right` | 24 | 14 |
| `rotate-180` / `scaleX(-1)` (היפוך אייקונים) | 30 | 25 |
| **סה״כ קבצים עם עיצוב פיזי כלשהו** | | **169** |

כבר לוגי (לא לגעת): ~340 מופעים של `margin-inline`/`padding-inline`/`inset-inline`/
`text-align: start|end` ב־133 קבצים, ו־66 מופעים של `ms-/me-/ps-/pe-/start-/end-`.

הקבצים הכבדים ביותר (סדר עבודה בשלב 3):

```
113 lib/components/process/lifecycle/ProcessLifecycle.svelte
 82 routes/(reg)/moach/[projectId]/sales/manage/pipeline/+page.svelte
 72 lib/components/process/lifecycle/SaleLifecycle.svelte
 40 routes/(reg)/moach/[projectId]/sales/manage/products/+page.svelte
 26 lib/components/prPr/betaha.svelte
 18 lib/components/moach/PresenceBar.svelte
 17 lib/chat/components/ProductList.svelte
 13 lib/components/main/amana.svelte
 13 lib/chat/components/MissionList.svelte
  9 routes/(reg)/me/+page.svelte, lib/components/main/growpage.svelte
```

---

## עקרונות

- **מקור אמת אחד לכיוון: `<html dir>`**, שנקבע בשרת ומתעדכן בלקוח כשהשפה
  משתנה. רכיב לא מחליט את כיוון הממשק בעצמו.
- **רשימת שפות RTL אחת**: `isRtl` ב־`src/lib/translations/index.js:60` (`he`, `ar`)
  הוא היחיד. להוציא פונקציה טהורה `dirOf(locale)` לקובץ משותף (ללא תלות ב־store),
  שהשרת, ה־layout, `LangSwitch` ו־`me/settings` כולם קוראים לה. למחוק את
  `LTR_LOCALES` / `ltrLocales` המקומיים.
- **עיצוב לוגי, לא פיזי.** Tailwind 3.4 (המותקן) תומך ב־`ms-/me-/ps-/pe-`,
  `start-/end-`, `text-start/end`, `rounded-s/e`, `border-s/e`, וגם בווריאנטים
  `rtl:` / `ltr:` — אין צורך בפלאגין. ב־CSS: `margin-inline-start`,
  `inset-inline-start`, `text-align: start`.
- **`dir="auto"` רק על טקסט שחברים כתבו (UGC)**, על האלמנט של הטקסט עצמו
  (`<p>`, `<span>`, `<input>`), **לעולם לא על מיכל של פריסה**. `dir="auto"` על
  `<div>` מחשב את הכיוון מהאות החזקה הראשונה בתוכו — שם רקמה בעברית יהפוך את
  כל הטופס האנגלי ל־RTL. היום יש 7 מיכלים כאלה (למשל
  `assistant/RikmaPreview.svelte:100`).
- **`dir="ltr"` קבוע נשאר במקומו** כשהתוכן באמת LTR בכל שפה: קישורים, מיילים,
  קוד, מספרי טלפון, IBAN, מפתחות API (למשל `BlueprintReview.svelte:529,715,816`).
- **מה שלא נוגעים בו:** מיילים (`src/lib/components/mail/*`) ותשלומי התראות —
  שם הכיוון נקבע לפי שפת **הנמען**, לא לפי `$locale`. כרטיסי OG
  (`src/lib/server/og/cards.ts`) — אותו דבר, לפי שפת הדף שנוצר. רק לוודא שהם
  לא נשענים על `body` של האתר.

---

## שלבים

### שלב 0 — הכיוון הגלובלי (קטן, משנה הכול; נכנס ונבדק לבד) — ✅ בנוי 2026-11-19

מה נעשה: `src/lib/translations/dir.js` (`dirOf`, `RTL_LOCALES`) + `dir.test.ts`;
`isRtl` נגזר ממנו; `app.html` → `dir="%dir%"` ו־`hooks.server.js` מחליף אותו;
`direction: rtl` נמחק מ־`body` (`app.postcss`) ומ־`.onboard-root .screen`
(`onboard.css`); `$effect` אחד ב־`src/routes/+layout.svelte` מסנכרן
`<html dir/lang>` לפי `$locale`, והקביעה הידנית ורשימות ה־LTR נמחקו מ־
`LangSwitch` ומ־`me/settings`; ה־`Toaster` מקבל `dir` ו־`direction:` אמיתי
(במקום `dir:` שאינו CSS); `/guid` לא נגע ב־document בעצמו — רק עודכנה הערה.
נבדק: SSR עם עוגיית `lang` נותן `dir="rtl"` ל־he/ar ו־`dir="ltr"` ל־en/es.
**תיקון 2026-11-25:** `lang` ב־`hooks.server.js` היה משתנה **ברמת המודול**. בזמן
שהדף מרונדר, ה־loaders שלו שולחים בקשות פנימיות ל־`/api/send` (בלי `?lang`)
דרך אותו hook, והן דרסו אותו לפני ש־`transformPageChunk` קרא אותו — הטקסט יצא
באנגלית תחת `<html lang="he" dir="rtl">` (נראה ב־`/availableMission/181?lang=en`).
עכשיו `const lang` מקומי לבקשה. נבדק בדפדפן: `en` → `ltr`, `he` → `rtl`.

| # | מה | איפה |
|---|---|---|
| 0.1 | פונקציה טהורה `dirOf(locale): 'rtl' \| 'ltr'` + `RTL_LOCALES = ['he','ar']`, עם בדיקת יחידה. `isRtl` נגזר ממנה. | קובץ חדש, למשל `src/lib/translations/dir.js`; `src/lib/translations/index.js` |
| 0.2 | `app.html`: `<html lang=%lang% dir=%dir% …>`; `hooks.server.js` מחליף `%dir%` ב־`dirOf(lang)`. | `src/app.html:2`, `src/hooks.server.js` ליד `.replaceAll('%lang%', lang)` |
| 0.3 | למחוק `direction: rtl` מ־`body`. במקומו — כלום (הדפדפן יורש מ־`<html dir>`). | `src/app.postcss:1668` |
| 0.4 | סנכרון בלקוח במקום אחד: ב־root layout, `$effect` (או subscribe) על `$locale` שקובע `document.documentElement.dir` ו־`lang`. למחוק את הקביעה הידנית מ־`LangSwitch` ומ־`me/settings` (או להשאיר קריאה ל־`dirOf` בלבד). | `src/routes/+layout.svelte`, `src/lib/components/onboard/LangSwitch.svelte:14,26`, `src/routes/(reg)/me/settings/+page.svelte:32,42` |
| 0.5 | `styles/onboard.css:45` — `.onboard-root { direction: rtl }` → להסיר (יורש מ־html). לבדוק את מסכי האונבורדינג באנגלית אחרי. | `src/lib/styles/onboard.css` |
| 0.6 | ה־toast ב־root layout (`style: dir: …`, שורה ~287) — `dir:` אינו מאפיין CSS; להחליף ב־`direction:` או להסיר אם יורש. | `src/routes/+layout.svelte:287` |
| 0.7 | `/guid` מחליף `documentElement` dir/lang בעצמו (הערה ב־`src/routes/guid/+page.svelte:7`) — לוודא שלא מתנגש עם 0.4 ושהוא משחזר ביציאה. | `src/routes/guid/+page.svelte` |

**בדיקה לשלב 0:** בכל אחת מ־5 השפות, כניסה ישירה (`?lang=en`, עוגייה, ומשתמש
מחובר עם שפה שמורה) — `document.documentElement.dir` נכון **ב־HTML של ה־SSR**
(view-source), לא רק אחרי הידרציה. החלפת שפה ב־`LangSwitch` וב־`/me/settings`
הופכת את הדף בלי רענון. בעברית ובערבית — אף מסך לא השתנה ויזואלית (זה הסיכון
העיקרי של 0.3: רכיב שנשען בשקט על `body` RTL ונמצא בתוך מיכל עם `dir` אחר).

### שלב 1 — `dir="rtl"` קבוע ו־`dir="auto"` על מיכלים — ✅ בנוי 2026-11-25 (חוץ מ־1.2)

מה נעשה: 55 תכונות `dir="rtl"` נמחקו מ־37 קבצים (מיכלי ממשק; בעברית/ערבית זה
no-op, כי `<html>` כבר RTL). נשארו במכוון: `main/translatehe.svelte` (עברית
מקור), עמודת `{he}` ב־`guid/ai`, `searchtest` (דף פיתוח), וסלקטורים `[dir='rtl']`
ב־CSS. `dir="auto"` הורד מ־7 מיכלים (`AssistantPanel`, `RikmaPreview` — שבו טקסט
החברים כבר נושא `dir="auto"` משלו, `AgentSignup`, `InviteResultCard`, שני
`focus-chip` בלב, `offer/[key]`); נשארו `OutreachPanel .gr-msg` (הוא הטקסט עצמו)
ו־`ProfilePanel .gr-preview` (תצוגה מקדימה של תוכן החבר). `direction: rtl` ב־CSS
נמחק מ־`DealTimeline`, `chat/+page` (וה־textarea קיבל `dir="auto"`) ו־`love` (3);
`TimersCalendar` (`.fc-direction-rtl`) ו־`AuthorityBadge` (`.curved-text.rtl`)
מותנים בכיוון — נשארו. ב־`availableMission/[id]` הומרו גם `mr-3`→`ms-3`,
`ml-1`→`me-1`, `lg:rounded-r`→`lg:rounded-e`.

1. **`dir="rtl"` / `dir='rtl'` קבוע** (88 מופעים, ~50 קבצים; הרשימה המלאה —
   `grep -rlE "dir=[\"']rtl[\"']" src --include=*.svelte`). לכל מופע להחליט:
   - מיכל של ממשק → **למחוק** את התכונה (יורש מ־html).
   - טקסט שהוא תמיד עברית (למשל ציטוט עברי בדף `about`, `translatehe.svelte`,
     `tikunolam.svelte` שמציגים עברית במכוון) → להשאיר, עם הערה קצרה למה.
   - טקסט של חבר → `dir="auto"` על האלמנט עצמו.
   - קבצים שכבר מתים (`.dead`, `.unused`, `.backup`) — לא לגעת.
   - קבצי בדיקה (`*.test.ts`) ו־`service-worker.js` — לבדוק מה הם בודקים/מייצרים;
     לא לשנות בלי סיבה.
2. **`dir={$isRtl ? 'rtl' : 'ltr'}` מקומי** (~220 קבצים): אחרי שלב 0 הם מיותרים.
   למחוק **רק** כשהם על מיכל ממשק שלא יוצא מהעץ. **להשאיר** כשהרכיב מרונדר
   מחוץ ל־`<html>` הרגיל — `Portal`ים ל־body, דיאלוגים של bits-ui, toasts,
   iframe — כי שם הם עדיין חלק מהעץ אבל כדאי לוודא; אם יורשים נכון — למחוק.
   זה ניקוי, לא תיקון; עדיפות נמוכה מ־1.1, ומותר לדחות אותו לסוף.
3. **`dir="auto"` על מיכל פריסה** (7 מקומות —
   `grep -rnE '<(div|section|main|form|article)[^>]*dir="auto"' src --include=*.svelte`):
   להוריד מהמיכל ולהעביר לאלמנטי הטקסט של החבר בתוכו. ראשון:
   `src/lib/components/assistant/RikmaPreview.svelte:100`.
4. **`direction: rtl` ב־CSS של רכיבים** (`AuthorityBadge`, `TimersCalendar`,
   `DealTimeline`, `chat/+page`, `love/+page`): להחליף בירושה או ב־`:dir(rtl)`.

### שלב 2 — המסכים שלקוח אנגלי פוגש ראשון (P0)

סדר לפי מה שמשתמש חדש באנגלית רואה. לכל מסך: לפתוח ב־`?lang=en`, לתקן כל
עיצוב פיזי לעיצוב לוגי, לפתוח שוב ב־`he` ולוודא שלא נשבר.

| # | מסך | קבצים עיקריים |
|---|---|---|
| 2.1 | **טיוטת רקמה** (הדיווח המקורי) | `src/lib/components/assistant/BlueprintReview.svelte`, `RikmaPreview.svelte`; נתיבים: `moach/import/[sessionId]`, `moach/[projectId]/import/[sessionId]`, `preview/rikma/[shareKey]`, `preview/rikma/studio/[token]` |
| 2.2 | אונבורדינג | `src/routes/(reg)/onboard/**`, `src/lib/components/onboard/**`, `src/lib/styles/onboard.css` |
| 2.3 | הקונסירז' / משאלות | `src/routes/(reg)/concierge/**`, `src/routes/(regandnon)/wish/[id]`, `src/routes/made-for-you`, `src/routes/deals/**` |
| 2.4 | טפסי יצירה | `src/lib/components/addnew/**` (`addNewNeed` עם 6 `dir="rtl"`, `addNewMission`, `baci`, `AiFill` — החץ ב־`AiFill.svelte:150` כבר תלוי־כיוון, תבנית טובה), `quick-create/QuickCreateLauncher.svelte`, `moach/[projectId]/create` |
| 2.5 | דפים ציבוריים | `rikmaPublic/RikmaPage.svelte`, `availableMission/[id]`, `availiableResorce/[id]`, `user/[id]`, `faq`, `about` |
| 2.6 | רכיבי בסיס שכל טופס משתמש בהם | `src/lib/celim/ui/**` (`dateandtimeinput`, `daterange`, `dialog`, `input/textInput`, `richText`), `celim/tooltip*.svelte`, `celim/switch.svelte` |

### שלב 3 — הלב, המוח ומסכי העבודה (P1)

לפי טבלת הקבצים הכבדים למעלה: `process/lifecycle/*Lifecycle.svelte`,
`moach/[projectId]/sales/manage/**`, `prPr/**` (`betaha`, `negoM`, `Kanbanboard`,
`mission`, `whowhat`, `bethas`), `moach/PresenceBar`, `lev/**` וכרטיסי
`lev/cards/**`, `chat/components/**`, `negotiation/**`, `conf/**`, `timers/**`.

### שלב 4 — השאר (P2)

כל קובץ שנותר ב־169 (`main/**`, `bot/Bot`, `migration-dashboard`, `love`, …).
דפי פיתוח/בדיקה (`searchtest`, `migration-dashboard`) — רק אם זול.

---

## איך מתרגמים עיצוב פיזי ללוגי

| פיזי | לוגי | הערה |
|---|---|---|
| `ml-4` / `mr-4` | `ms-4` / `me-4` | **רק** כשהכוונה "לפני/אחרי הטקסט". ב־RTL `ml` היה בפועל "אחרי", אז בדרך כלל `ml` → `me`, `mr` → `ms`. לבדוק כל מקרה בעין. |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` | אותו כלל. |
| `-ml-*` | `-ms-*` / `-me-*` | |
| `left-0` / `right-0` | `start-0` / `end-0` | מיקום אבסולוטי של תגית/כפתור סגירה. |
| `text-right` / `text-left` | `text-start` / `text-end` | `text-right` בקוד שנכתב ל־RTL = `text-start`. |
| `rounded-l-*` / `rounded-r-*` | `rounded-s-*` / `rounded-e-*` | |
| `border-l` / `border-r` | `border-s` / `border-e` | |
| `space-x-reverse` | בדרך כלל למחוק | flex כבר מתהפך עם `dir`. |
| `margin-left:` | `margin-inline-start:` | |
| `left: 8px` | `inset-inline-start: 8px` | |
| `text-align: right` | `text-align: start` | |
| `←` / `→` כחץ "הבא/חזור" | `{$isRtl ? '←' : '→'}` או אייקון עם `rtl:rotate-180` | |
| `rotate-180` / `scaleX(-1)` שנועד להפוך אייקון לעברית | `rtl:rotate-180` / `rtl:-scale-x-100` | אם ההיפוך קבוע היום, באנגלית הוא הפוך. |

**לא להמיר:** מרכוז (`mx-auto`, `left-1/2 -translate-x-1/2`), `left-0 right-0`
יחד (מתיחה לרוחב מלא), אנימציות/גרפים/SVG שהכיוון בהם הוא נתון (ציר זמן
מספרי, גרף, מפה, החוגה של הטיימר), ו־`transform: translateX` — שם צריך
`rtl:` במפורש אם בכלל.

**ספריות צד שלישי:** לבדוק שמקבלות כיוון — `TimersCalendar` (כבר ריאקטיבי לפי
`PLAN_EN_READINESS` 2.10), richText/TipTap (`defaultAlignment` כבר תלוי
`$isRtl`), date pickers, Swiper/גלילה אופקית (memory: ה־deck בלב משתמש
ב־scroll-snap; ב־LTR כיוון הגלילה מתהפך, לבדוק שהשקופית הראשונה היא באמת
הראשונה).

---

## שמירה שזה לא חוזר: `npm run check:dir`

סקריפט חדש `scripts/check-dir.mjs` במבנה של `scripts/check-ui-hebrew.mjs`
(רשימת `ROOTS` של מסכים שכבר נוקו; מסך נכנס לרשימה כשהוא גמור). נכשל על:

1. `dir="rtl"` / `dir='rtl'` קבוע, אלא אם בשורה (או בשורה שמעליה) הערה
   `<!-- dir-ok: … -->` עם סיבה.
2. `dir="auto"` על `div|section|main|form|article|ul|table`.
3. Tailwind פיזי: `\b-?(ml|mr|pl|pr)-`, `\btext-(left|right)\b`,
   `\b(left|right)-(?!1/2)`, `\brounded-(l|r|tl|tr|bl|br)\b`, `\bborder-(l|r)\b`.
4. CSS פיזי בתוך `<style>`: `(margin|padding|border)-(left|right)\s*:`,
   `text-align:\s*(left|right)`, `direction:\s*rtl`.
5. גלובלית (בלי ROOTS): `direction: rtl` על `body`/`html` ב־`app.postcss`, ו־
   `app.html` בלי `dir=%dir%`.

אותו `dir-ok` מכסה את החריגים המוצדקים (מרכוז, גרף). להוסיף ל־`CLAUDE.md`
שורה בטבלת הפקודות ופסקה קצרה בסעיף ה־i18n ("הטקסט ב־`$t()`; הכיוון
מ־`<html dir>`; עיצוב לוגי בלבד"), ולהוסיף לשמירה ב־`PLAN_EN_READINESS`
(שורה ב"איך מודדים התקדמות").

---

## בדיקה (לכל שלב)

- `npm run check`, `npm test`, `npm run check:i18n`, `npm run check:dir`.
- דפדפן (שרת הפיתוח על 5173): כל מסך שנגעו בו ב־`?lang=en` **ו־**`?lang=he`,
  ברוחב מובייל (375) ושולחן. צילום מסך לפני/אחרי בשתי השפות למסכי שלב 2.
- ספציפית לשלב 0: view-source של `/`, `/onboard`, `/moach/…/import/…` ב־`en` —
  `<html … dir="ltr">`; ב־`he`/`ar` — `dir="rtl"`.
- נקודות שנוטות להישבר אחרי 0.3: toasts, דיאלוגים ב־Portal, ה־footer הקבוע
  (`mobileFooter`), דק הכרטיסים בלב, תפריטים נפתחים (`left-0` שהיה צריך להיות
  `end-0`).

## הגדרת "גמור"

- כל 5 השפות מקבלות `dir` נכון מה־SSR; אין `direction: rtl` גלובלי.
- `check:dir` עובר על כל המסכים של שלבים 2–3, והם ב־`ROOTS`.
- אין `dir="rtl"` קבוע בלי `dir-ok`.
- עברית וערבית נראות כמו לפני (צילומי לפני/אחרי).

## שאלות פתוחות

1. ערבית — לוודא עם דובר/ת שהמסכים שתוקנו נראים נכון ב־RTL ערבי (מספרים,
   סימני פיסוק), לא רק בעברית.
2. מה עושים עם טקסט שחבר כתב בעברית בתוך ממשק אנגלי (שם רקמה, תיאור) —
   `dir="auto"` על האלמנט מספיק, או שגם `<bdi>` בתוך משפטים מתורגמים
   (`$t('…', { name })`)? המלצה: `<bdi>` סביב שמות שמשתלבים בתוך משפט.
