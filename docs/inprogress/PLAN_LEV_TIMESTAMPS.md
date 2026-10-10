# PLAN — תאריך ושעה על כל פריט בעמוד הלב

> מצב: **inprogress** · נכתב 2026-10-08 · T1–T2 בנויים (2026-10-08), T3–T5 פתוחים

## 1. הבעיה

עמוד הלב מראה היום **מתי משהו נגמר** (ספירה לאחור של ה-`timegrama` ב-`LevRow`, ובחלק
מהכרטיסים המלאים), אבל כמעט אף פעם לא **מתי הוא התחיל**: מתי פורסמה המשימה שהוצעה לי,
מתי נשלחה בקשת ההצטרפות, מתי נפתחה החלוקה, מתי נרשמה המכירה. בלי זה אי אפשר להבחין
בין בקשה שהגיעה לפני דקה לבין בקשה ששוכבת שבועיים, ואי אפשר להבין למה השעון של
"שתיקה היא הסכמה" עומד איפה שהוא עומד — הצעת נגד מאפסת אותו, וזה לא נראה בשום מקום.

היום יש תאריכים רק בפינות בודדות, כל אחת בפורמט אחר:
`sugestma.svelte`/`sugestmi.svelte` (`roundDate.toLocaleDateString`), `hachlata.svelte`,
`ArchiveObjectCard.svelte` (בלי `$lang`!), `inpro.svelte`, `pending.svelte` (`sqadualed`).

## 2. עקרונות

1. **כל פריט מראה אירוע אחד — "מתי זה הגיע אליי"**, עם הפועל שמתאים לסוג:
   פורסמה / נשלחה / הוצע / הוגשה / נפתחה / התחילה / נרשמה. לא `createdAt` גנרי.
2. **מו"מ מראה גם את הסבב האחרון** ("הצעת נגד לפני 3 שעות"), כי הוא זה שאיפס את
   שעון השתיקה. שני זמנים לכל היותר בכרטיס — המקור והסבב האחרון.
3. **אין תאריך מזויף.** אם השדה חסר — לא מציגים כלום. היום יש ב-`levProcessors.ts`
   כמה `new Date(x.zman || x.createdAt || new Date())` (שורות ~239, 255, 338, 797,
   817) שמציגים "עכשיו" כשאין מידע. אסור שהם יזינו את השדה החדש.
4. **פורמט אחד לכל העמוד**, דרך פונקציה טהורה אחת ורכיב אחד. יחסי לקרוב, מוחלט לרחוק,
   והמלא תמיד בריחוף/`title`.
5. **"לפני" ≠ "עוד".** הספירה לאחור הקיימת (`lev.list.time.*`, עם אייקון שעון) נשארת
   של הדדליין. זמן ההגעה מוצג בלי אייקון שעון, בצבע מושתק, בניסוח "לפני…" — כדי שאי
   אפשר יהיה לבלבל בין השניים.

## 3. כללי הפורמט — `formatWhen(at, now, locale)`

| מרחק | תצוגה קצרה (he) | הערה |
|---|---|---|
| פחות מדקה | עכשיו | |
| פחות משעה | לפני 12 דק׳ | `Intl.RelativeTimeFormat` |
| היום | היום, 14:30 | |
| אתמול | אתמול, 14:30 | `numeric:'auto'` נותן "אתמול" בכל 5 השפות |
| עד 6 ימים | יום ג׳, 14:30 | `weekday:'short'` |
| השנה | 3 באוק׳ | בלי שעה |
| שנה אחרת | 3 באוק׳ 2025 | |

- התצוגה המלאה (ל-`title` ול-`aria`): `יום שישי, 3 באוקטובר 2026, 14:30`.
- מחזיר `{ short, full, iso }` → נרנדר כ-`<time datetime={iso} title={full}>`.
- אזור זמן: של הדפדפן. נתוני הלב נטענים בצד הלקוח, אז אין סכנת hydration mismatch —
  אבל הרכיב בכל זאת מרנדר רק ב-`browser`.
- ריבוי ברוסית/ערבית — `Intl` מטפל. **לא** כותבים דקדוק ריבוי ביד (בניגוד ל-`dOne`/`d`
  של הספירה לאחור, שנכתב ביד).
- רענון: מוסיפים ל-`$lib/stores/clock.svelte.ts` getter בשם `minutes` (מעוגל לדקה),
  וה-`$derived` של הרכיב קורא ממנו. **אין `setInterval` בכרטיס** (ראו זיכרון "Lev shared
  clock").

## 4. מודל הנתונים — שדה אחד על `DisplayItem`

```ts
// src/lib/utils/levProcessors.ts
export interface ItemWhen {
  at: string;              // ISO — האירוע שהביא את הפריט אליי
  lastAt?: string;         // ISO — הסבב האחרון במו"מ, אם יש ושונה מ-at
  lastBy?: 'me' | 'them';  // מי הגיש את הסבב האחרון
}
export interface DisplayItem { /* … */ when?: ItemWhen }
```

- כל processor ממלא `when` במקום אחד, דרך עוזר טהור `itemWhen(at, rounds?)` שמסנן ערכים
  לא תקינים ומחזיר `undefined` כשאין `at`.
- קורא אחד ב-`cardKinds.js`: `rowWhen(item)` — בדיוק כמו `rowTimegrama(item)` היום, כדי
  ששלוש התצוגות (כרטיסים / רשימה / מטבעות) יסכימו.
- `created_at` שהוא היום על פריטי Decision (`hachla`/`archObject`/`stipend`) עובר ל-`when`.

**הפועל לא שמור בנתונים — הוא נגזר מה-`ani`**, כי בעברית, בערבית וברוסית הוא מתוזמן
לפי מין שם העצם: משימה *פורסמה*, משאב *פורסם*, בקשה *נשלחה*. לכן מפתח תרגום **לכל
סוג**, לא לכל פועל:

```json
// src/lib/translations/he/lev.json
"when": {
  "meData": "פורסמה {{time}}",
  "huca": "פורסם {{time}}",
  "askedcoin": "נשלחה {{time}}",
  "lastRound": { "me": "הצעת נגד שלך {{time}}", "them": "הצעת נגד {{time}}" }
}
```

שם הפרמטר `{{time}}` — שני תווים ומעלה ובסוגריים כפולים (ראו CLAUDE.md, i18n).

## 5. המלאי — כל סוג, האירוע שלו, ואם הנתון כבר מגיע

✅ = השדה כבר בשאילתה וב-extractor · 🟡 = בשאילתה, לא מגיע ל-DisplayItem · ❌ = חסר בשאילתה

| `ani` | הכרטיס | האירוע (he) | מקור | מצב | סבב אחרון |
|---|---|---|---|---|---|
| `meData` | הצעה למשימה | **פורסמה** | `open_mission.createdAt` ב-`209levMatchSuggestions` | ❌ | — |
| `huca` | הצעה למשאב | **פורסם** | `open_mashaabim.createdAt` ב-`212levResourceMatchSuggestions` | ❌ | — |
| `askedcoin` | בקשת הצטרפות למשימה (Ask) | **נשלחה** | `asks.createdAt` (user + project) | 🟡 | `negopendmissions.createdAt` ✅ |
| `askedm` | בקשה לספק משאב (Askm) | **נשלחה** | `askms.createdAt` | 🟡 | `nego_mashes.createdAt` ✅ |
| `pends` | משימה חדשה להצבעה (Pendm) | **הוצעה** | `pendms.createdAt` | 🟡 (מגיע כ-`createdAt`) | `negopendmissions.createdAt` ✅ |
| `pmashes` | משאב חדש להצבעה (Pmash) | **הוצע** | `pmashes.createdAt` | 🟡 (`created_at`) | `nego_mashes.createdAt` ✅ |
| `wegets` | בקשת משאב (Maap) | **נשלחה** | `maaps.createdAt` | 🟡 | — |
| `fiapp` | אישור סיום משימה (Finiapruval) | **הוגש** | `finiapruvals.createdAt` | ❌ | סבב ב-`vots` (`zman`) |
| `mtaha` | משימה בביצוע | **התחילה** | `mesimabetahaliches.createdAt` | ❌ | — |
| `haluk` | חלוקת רווחים (Tosplit) | **נפתחה** | `tosplits.createdAt` | ❌ (ה-extractor קורא `attrs.createdAt` שלא נשאל → `undefined` היום) | — |
| `vidu` | העברה לאישור (Haluka) | **סומנה כהועברה** | `halukas.createdAt` | ❌ | — |
| `walcomen` | ברוכים הבאים לרקמה | **הצטרפת** | `welcom_tops.createdAt` | ❌ | — |
| `hachla` / `archObject` / `stipend` | החלטה | **נפתחה** | `decisions.createdAt` | 🟡 (`created_at`) | `vots` (`order` = סבב) |
| `sheirutp` | בקשת שירות ממתינה | **נשלחה** | `sheirutpends.createdAt` | 🟡 | — |
| `sale` / `buy` | מכירה / רכישה (Sheirut) | **נרשמה** (+ "מתחיל ב-" מ-`startDate` הקיים) | `sheiruts.createdAt` (user + project) | ❌ | — |
| `wishoffer` | הצעה על משאלה | **הוצעה** | `ratson_proposals.createdAt` | 🟡 | `ratson_willingness_entry` (`agree:false`) |
| `stipendpay` / `stipendconfirm` / `stipendtransfer` / `stipendaccrued` | מלגת מחיה | **מחזור** `cycleStart–cycleEnd` (+ "נשלח" ל-confirm) | action `getStipendWork` | 🟡 — `createdAt` בפרגמנט אחד, לא בכולם | — |
| `sitesharepay` | חלק האתר לתשלום | **התחייבת** | action `getSiteSharePayables` | ❌ | — |
| `sitesharedecide` | החלטת חלק-אתר | **אושרה אוטומטית** | action `getOpenSiteShareDecisions` | ❌ | — |
| `shift*` | משמרות | **חלון המשמרת עצמו** (התחלה–סוף), לא `createdAt` | `levShifts.ts` | לבדוק | — |

## 6. היכן זה מוצג

| תצוגה | מיקום | הערות |
|---|---|---|
| כרטיס מלא | `CardHeader.svelte` — prop חדש `when?: ItemWhen` + `ani`, שורה קטנה מתחת ל-`cardTitle` | כל הכרטיסים שמשתמשים ב-CardHeader מקבלים את זה בחינם. שלושה שלא משתמשים בו: `CustomerPayment`, `SheirutHalukaCard`, `welcomeToCard` — חיווט ידני. |
| רשימה (`LevRow`) | **בפס התחתון** (`foot`), אחרי שם הרקמה: `רקמה · לפני 3 שעות` | הפס העליון כבר מחזיק את הספירה לאחור; הגובה של השורה קבוע (`content-visibility`), אז אסור להוסיף שורה לגוף. ה-`minmax(0,1fr)` של `who` כבר חותך גלישה. |
| מטבעות (`LevCoin`) | רק ב-`aria-label`/`title` | אין מקום לטקסט על המטבע; ב-`LevSheet` שנפתח — כמו בכרטיס המלא. |
| היסטוריית מו"מ בתוך כרטיס | `sugestma`/`sugestmi`/`hachlata`/`ArchiveObjectCard`/`inpro` | מחליפים את ה-`toLocaleDateString` המפוזרים ב-`<When>` — אותו פורמט בכל מקום, ו-`ArchiveObjectCard` מפסיק להתעלם מהשפה. |

רכיב אחד: `src/lib/components/lev/When.svelte`

```svelte
<When at={item.when?.at} labelKey={`lev.when.${item.ani}`} />
<!-- → <time datetime="2026-10-08T11:30:00Z" title="יום חמישי, 8 באוקטובר 2026, 14:30">נשלחה לפני 12 דק׳</time> -->
```

צבע: טקסט מושתק על משטח כרטיס — `surfaceMuted` (ראו "Theme-aware card surface tokens");
בכותרת הכהה של CardHeader — `--gold-l` (ראו "Dark-bg label contrast"). לא `--tm`.

## 7. שלבים

### T1 — פורמט ורכיב (בלי לגעת בנתונים) ✅
- `src/lib/time/formatWhen.ts` + `formatWhen.test.ts`: `now` קבוע, כל 7 המדרגות, כל 5
  השפות, קלט לא תקין → `null`, תאריך עתידי (שעון לא מסונכרן) → "עכשיו", לא "בעוד".
- `clock.minutes` ב-`clock.svelte.ts`.
- `When.svelte`.
- מפתחות `lev.when.*` בחמש השפות (`he`/`en`/`ar`/`ru`/`es`), כולל מין דקדוקי לכל סוג.

### T2 — סוגים שהנתון כבר מגיע (🟡) ✅

> **מה נבנה בפועל:** `src/lib/time/formatWhen.ts`, `clock.minutes`,
> `src/lib/components/lev/When.svelte`, `levItemContext.js` (LevCard מפרסם את הפריט,
> CardHeader קורא — בלי לחווט 30 כרטיסים), `itemWhen()` ב-levProcessors,
> `rowWhen`/`whenLabel`/`WHEN_KINDS` ב-cardKinds.js, `lev.when.*` בחמש השפות.
> ברשימה מוצג הביטוי בלבד ("לפני 12 דק׳") ליד שם הרקמה, המשפט המלא ב-tooltip;
> במטבע — ב-`aria-label` וב-`title`. בדיקות: `formatWhen.test.ts`,
> `whenLabel.test.ts`, `levProcessors.when.test.ts`, `When.svelte.test.ts`.
> השעון מעוגל לדקה, אז הביטוי יכול לפגר אחרי השעון האמיתי עד 59 שניות.
> **לא נבדק חי בדפדפן** (Chrome לא נשאר על localhost בסשן הזה) — הרינדור נבדק
> בבדיקות קומפוננטה.

`askedcoin`, `askedm`, `pends`, `pmashes`, `wegets`, `hachla`/`archObject`/`stipend`,
`sheirutp`, `wishoffer`.
- `itemWhen()` + `when` ב-processors; `rowWhen()` ב-`cardKinds.js` + בדיקה ב-`cardKinds.test.ts`
  שעוברת על `RENDERABLE_ANIS` ומוודאת שלכל סוג יש מפתח `lev.when.<ani>` (אותו חוזה כמו
  `rowContent.test.ts`).
- חיווט ב-`CardHeader`, `LevRow`, `LevCoin`.

### T3 — הוספת השדות החסרים (❌)
- `83levMainUserQuery`: `createdAt` על `mesimabetahaliches`, `finiapruvals`, `tosplits`,
  `halukas` (שני המקומות), `welcom_tops`, `sheiruts` (user + project).
- `209levMatchSuggestions` → `open_mission.createdAt`; `212levResourceMatchSuggestions` →
  `open_mashaabim.createdAt`.
- **שאילתות ה-slice (`87levSlice*` ב-`levSliceRegistry.ts`) חייבות לקבל את אותם שדות.**
  הן מה שמרענן פריט אחרי אירוע סוקט — אם רק 83 יקבל `createdAt`, התאריך ייעלם מהכרטיס
  בפעם הראשונה שמישהו מצביע עליו.
- actions: `getSiteSharePayables`, `getOpenSiteShareDecisions` מחזירים `createdAt`;
  `getStipendWork` — `createdAt` בכל שלושת הפרגמנטים (`awaiting`/`owedOut`/`owedIn`).
- extractors מעבירים את השדה; `SNAPSHOT_VERSION` ב-`levStores.ts` עולה (9 → 10), אחרת
  snapshot שמור בלי השדות יוצג בלי תאריכים עד הרענון הבא.
- `createdAt` קיים על כל collection ב-Strapi, אבל **`validate:qids` בודק רק mutations** —
  שדה שגוי בשאילתה ייצא בשקט. בודקים כל שאילתה ששונתה בדפדפן (Claude in Chrome על
  `localhost:5173`, כי Strapi נעול למפתח).

### T4 — הסבב האחרון
- `lastAt`/`lastBy` מסבבי המו"מ שכבר נמשכים (`negopendmissions`, `nego_mashes`,
  `vots.order`, `ratson_willingness_entry`).
- בכרטיס המלא: שורה שנייה "הצעת נגד לפני 3 שעות". ברשימה — רק `at` (אין מקום), אבל
  אם `lastAt` חדש מ-24 שעות, הוא מחליף את `at` בפס התחתון ("הצעת נגד לפני 3 שעות"),
  כי זה מה שרלוונטי לשעון.
- איחוד ה-`roundDate` הקיים ב-`sugestma`/`sugestmi` ל-`<When>`.

### T5 — (אופציונלי, דורש החלטה) מיון בתוך פס
היום הסדר בתוך פס עדיפות (`PRIORITY_BAND`) נקבע ע"י מספר המצביעים. אפשר להוסיף שובר
שוויון: החדש ראשון (או הישן ראשון — מה שמחכה הכי הרבה זמן). זה משנה את מה שהמשתמש רואה
ראשון, אז לא נכנס בלי החלטה מפורשת.

## 8. בדיקות וסגירה
- `npm test` (formatWhen, cardKinds, rowContent), `npm run check`.
- `npm run check:i18n` — מוודא שאין `{time}` במקום `{{time}}` ושה-namespace `lev` נטען.
- `npm run check:script` — חמש שפות של פעלים חדשים = סיכון לאותיות מעורבבות.
- בדפדפן (5173 בלבד) עם משתמשי הבדיקה 256/258/261: בקשת הצטרפות טרייה מציגה "נשלחה עכשיו"
  ומתעדכנת ל"לפני דקה" בלי רענון; הצעת נגד מעדכנת את `lastAt` אחרי אירוע סוקט (בודק את
  שאילתות ה-slice); RTL + ערבית + רוסית; מצב כהה; שורת רשימה במובייל לא משנה גובה.
- `docs/HOWTO_ADD_LEV_OBJECT.md` — סעיף בצ'קליסט: "processor ממלא `when`, ומפתח
  `lev.when.<ani>` בחמש השפות". `docs/LEV_CARD_CONVENTIONS.md` §7 (Header) — ה-prop החדש.

## 9. מה מחוץ לתחום
- שינוי הספירה לאחור הקיימת או מנגנון ה-`timegrama`.
- תאריכים בעמודי moach / hub / deals (הרכיב והפונקציה ישמשו אותם אחר כך).
- אזור זמן של הרקמה (כרגע הכול בזמן המקומי של הקורא).
