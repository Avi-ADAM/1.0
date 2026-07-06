# תצוגת חלק־האתר בעמוד המוח (moach/[projectId]/sales)

> נכתב: 2026-07-04 · משלים את [PLAN_SITE_SHARE.md](./PLAN_SITE_SHARE.md) ו‑
> [PLAN_SITE_SHARE_PER_MEMBER.md](./PLAN_SITE_SHARE_PER_MEMBER.md).
> **סטטוס: מיושם.**

## הבעיה

בדף הלב (`/lev`) הכל עובד — כל בקשות חלק־האתר מוצגות יפה ומוחזרות לאתר. אבל
ב**מוח של הרקמה הראשית עצמה** (עמוד המכירות של הפרויקט, `/moach/[projectId]/sales`)
הכנסות חלק־האתר הוצגו בצורה לא ברורה:

- **"מוצר לא ידוע"** — הכנסת חלק־אתר נרשמת כ‑`Sale` **ללא מוצר מקושר** (`matanot=null`),
  אז `getMatanaName()` נפל ל"מוצר לא ידוע".
- **הערה לא קריאה** — כל הפרטים נדחסו למחרוזת גולמית:
  `site-share · less · proposed=0.96 · reason="…" · paid=0.84 · from_project=54 · halukas=46`.
- **"Invalid Date"** — המוטציה `206createPlatformSale` לא הגדירה שדה `date`.

## פורמט ההערה (מקור: `createPlatformSale.ts`)

```
site-share [· <less|more> · proposed=<n> · reason="<טקסט>"] · paid=<n>
          [· from_project=<rikmaId>] [· halukas=<id,id,…>]
```

- בלי התאמה (`as_is`) → יש רק `paid` (ואולי `from_project`/`halukas`).
- `less`/`more` = המשלם ביקש לתת פחות / הציע לתת יותר, עם `proposed` + `reason`.

## הפתרון (מיושם)

| # | שינוי | קובץ |
|---|---|---|
| 1 | פרסר טהור + טיפוסים ל‑note | `src/lib/revenue/parseSiteShareNote.ts` (+ `.test.ts`) |
| 2 | כרטיס תצוגה קריא (סכום, רקמת מקור, נימוק, מס' העברות) | `src/lib/components/prPr/SiteShareSaleNote.svelte` |
| 3 | שילוב במוח: שם מוצר "חלק האתר", כרטיס במקום note גולמי, סיכום שורה בטבלה+CSV, תיקון תאריך | `src/lib/components/prPr/hamatanot.svelte` |
| 4 | תיקון מקור: הגדרת `date` בעת יצירת מכירת פלטפורמה | `src/routes/api/send/qids.js` (`206createPlatformSale`) |
| 5 | תרגומים he/en/ar/ru תחת `project.hamatanot.siteShare.*` | `src/lib/translations/*/project.json` |

עקרונות:

- **זיהוי דרך ה‑note** (`isSiteShareNote`) — מכירת חלק־אתר = הערה שמתחילה ב‑`site-share`.
- הפרסר עמיד: `reason` בין מרכאות מחולץ לפני הפיצול (יכול להכיל ` · `), מפתחות
  לא־מוכרים מתעלמים כדי לתמוך בתוספות עתידיות, וכל מחרוזת שאינה `site-share` → `null`.
- תיקון ה‑`date` תקף ל**מכירות חדשות**; לרשומות ישנות עם `date` ריק יש נפילה ל‑`—`
  (`formatSaleDate`).

## בדיקות

`src/lib/revenue/parseSiteShareNote.test.ts` — 7 בדיקות (as-is, less/more,
reason עם מפריד, ריבוי halukas, שמירת raw, guard). כל חבילת `src/lib/revenue/`
ירוקה.
