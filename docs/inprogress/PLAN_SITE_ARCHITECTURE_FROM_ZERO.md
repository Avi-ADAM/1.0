# גלגל הרצון — ארכיטקטורת האתר מ‑0 + תכנית ביצוע לסוכן

> גרסה 2 · 2026-07-10 · ענף: `claude/website-structure-redesign-5ym2q6`
>
> המסמך הזה הוא **גם** תפיסת‑העל של מבנה האתר (חשיבה מאפס) **וגם** תכנית עבודה
> ברת‑ביצוע: כל משימה מפרטת קבצים, צעדים, קוד לשימוש חוזר וקריטריוני קבלה, כך
> שסוכן אחר יכול לקחת משימה בודדת ולבצע אותה בלי לקרוא את כל בסיס הקוד.
>
> מסמכים משלימים (לא מוחלפים): `PLAN_HOMEPAGE_MASTER.md` (דף הבית),
> `PLAN_central_page.md` (Hub/kind), `PLAN_DISCOVERY_MAP.md` (מפת `/demand`),
> `PLAN_SHARED_PURCHASE.md` (maagad), `PLAN_CONCIERGE.md`,
> `PLAN_rikma_as_state_machine.md`, `HOWTO_LEV_QUANTUM_LOADING.md`.

---

## חלק 0 — כללי עבודה לסוכן המבצע (חובה לקרוא לפני כל משימה)

1. **קרא קודם:** `CLAUDE.md` ו‑`AGENTS.md` בשורש. אל תנחש צורת ישות Strapi —
   קרא את `src/generated/STRAPI_SCHEMA_REFERENCE.md` ואת `src/lib/generated/contentTypes.d.ts`.
2. **כל פעולת שרת** (יצירה/עדכון/מחיקה) עוברת דרך ה‑Unified Action System:
   `src/lib/server/actions/` (`actionService.executeAction`). לא קוראים ל‑Strapi ישירות.
3. **שאילתות GraphQL** יושבות ב‑`src/routes/api/send/qids.js` וממוספרות. הבלוק
   200–235 תפוס. **שאילתות חדשות מתחילות מ‑240**, append‑only, לעולם לא משנים qid קיים.
4. **i18n:** כל טקסט חדש נכנס ל‑`src/lib/translations/{he,en,ar}/<feature>.json`
   (קובץ לפי פיצ'ר; ראה `demand.json` כדוגמה). אין מחרוזות קשיחות ברכיבים. RTL חובה.
5. **לעולם לא מוחקים route — מפנים.** כל שינוי כתובת מוסיף שורה לטבלת ההפניות
   (משימה T0.2). קישורי פוש/מייל/טלגרם ישנים חייבים להמשיך לעבוד.
6. **אימות לפני commit:** `npm run check` (svelte-check) + `npx vitest run`.
   רכיבי Svelte חדשים מריצים דרך ה‑svelte MCP autofixer אם זמין.
7. **קבוצות ה‑routes:** `(reg)` = דורש התחברות (ה‑layout שומר), `(regandnon)` =
   ציבורי עם זיהוי אופציונלי. דפים ציבוריים חדשים → `(regandnon)`.
8. **אל תיגע** ב: `src/routes/api/**` (פרט להוספת qids), לוגיקת האימות ב‑hooks,
   ובזרימות site-share (ראה CLAUDE.md).

---

## חלק א' — התפיסה: גלגל, לא קו

### מה האתר יוצר

> **האתר הופך רצון לשותפות דינמית שמגשימה אותו.** רקמות = שותפויות עם קבלת
> החלטות בהסכמה מלאה: כל החלטה עוברת אישור · שיחה · מו"מ עד חתימה משותפת,
> ושתיקה היא הסכמה בקצב הרקמה (`restime`).

חמישה פעלים מרכיבים את המחזור:

```
        לבקש  ·  להתאגד  ·  להסכים  ·  לעשות  ·  לחלוק
```

### התיקון הפרקטלי: לגלגל יש כמה דלתות

המציאות שהאתר תומך בה אינה קו ייצור שמתחיל תמיד בלקוח — היא **גלגל שנכנסים
אליו מכל דלת**:

```
מסלול ביקוש:  לקוח מבקש → ביקוש מתאגד (maagad) → רקמה נוצרת → עשייה → ערך
מסלול יוזמה:  יזם מקים רקמה → מגייס שותפים → בונים יחד → מוצאים לקוחות → ערך
מסלול הצטרפות: נותן שירות מגלה ביקוש/מיזם קיים → מצטרף → עשייה → ערך
```

והפרקטליות עמוקה מזה: **"אני מחפש שותפים למיזם" הוא בעצמו רצון** (ratson).
משאלת לקוח ("אני רוצה סל ירקות") ומשאלת יזם ("אני רוצה להקים מאפייה שיתופית")
הן אותו אטום — רק שבאחת המבוקש הוא מוצר ובשנייה המבוקש הוא אנשים. כל משימה
פתוחה היא מיני‑ביקוש; כל מכירה היא מיני‑מחזור הסכמה; רקמה יכולה להיות לקוחה
של רקמה אחרת; ו‑1lev1 עצמה היא רקמה שמשתתפת ברווחים (site-share).

### שלושה כובעים, אטום אחד

| כובע | דלת הכניסה | הדף הביתי |
|---|---|---|
| **לקוח / מבקש** | "בקש משהו" → `/wish/new` | המשאלות והעסקאות שלו |
| **נותן שירות / מצטרף** | "גלה" → `/demand` (מפה) | התיבה + הרקמות שלו |
| **יזם** | "הקם מיזם" → קומפוזר במצב מיזם / רקמה חדשה | דף הרקמה שלו |

> **תובנת המפתח (ללא שינוי):** ההחלטה היא האטום. הכול מתנקז ל‑`Decision`/votes
> עם timegrama. ולכן במרכז: **תיבת החלטות** אישית + **כתובת קנונית לכל הסכמה**.
> שני אלה אדישים לגמרי לשאלה מאיזו דלת נכנסת לגלגל — וזה מה שהופך את השלד ליציב.

---

## חלק ב' — מפת האתר האידיאלית

### הניווט הראשי (חבר מחובר) — לפי הפעלים

```
✨ התחל (בקש/הקם) · 🗺 גלה · 🧬 הרקמות שלי · 📥 התיבה (3!) · 👤 אני
```

### מרחב 1 — הסיפור (ציבורי)

| דף | תוכן | קישורים |
|---|---|---|
| `/` הבית | גלילה ארוכה + 3D (לפי PLAN_HOMEPAGE_MASTER), עם **שלוש דלתות** ב‑Hero וב‑CTA: "בקש משהו" · "הצטרף למיזם" · "הקם מיזם". היזם הוא פרסונה שלישית מלאה: כאב ("יש חזון, אין צוות ואין הון להעסיק"), הבטחה ("גייס שותפים תמורת אחוזים, לא משכורות") | `/wish/new` · `/demand` · `/wish/new?kind=venture` |
| `/how` (היום `/guid`) | סיור מוצר: טוגל לקוח/שותף/יזם × אנוש/סוכן‑AI, צילומים אמיתיים, מילון | כל תחנה → הדף האמיתי |
| `/consensus` ⭐ חדש | **דף הראווה של הכתר** — מנוע ההסכמה: "אין אצלנו לא" (אישור·שיחה·מו"מ), שתיקה‑כהסכמה בקצב הרקמה, סבבי פינג‑פונג עד חתימה על אותה גרסה, דמו חי | `/hascama` · `/wish/new` |
| `/hascama` | האמנה + חתימה (convention/aitifaqia כבר מופנים אליו ב‑hooks) | `/love` |
| `/love` | מפת החותמים החיה | `/hascama` |
| `/faq` `/about` | קיימים | — |

### מרחב 2 — שוק הביקוש (ציבורי — המשפך)

| דף | תוכן | קישורים |
|---|---|---|
| `/wish/new` | **קומפוזר אחד, שתי הסתעפויות**: "מה תרצה שיקרה?" → 🛒 מוצר/חוויה (המסלול הקיים) או 🌱 מיזם — מחפש שותפים (מסלול חדש: החילוץ מפיק תפקידים/משימות במקום רכיבי מוצר, והפרסום מציע הקמת רקמה + משימות פתוחות) | `/wish/[id]` · יצירת רקמה |
| `/wish/[id]` | הרצון + רכיבים + Harmony Ring + הצטרפות; במצב מיזם: תפקידים מבוקשים | `/maagad/[id]` · `/project/[id]` |
| `/demand` (alias `/discover`) | המפה: 🧺 מחפשים‑יחד · 🛠 נותנים‑שירות · 🌱 **מיזמים מחפשים שותפים** (עדשה/שכבה שלישית) | `/wish/[id]` · `/maagad/[id]` · `/mission/[id]` · `/project/[id]` |
| `/maagad/[id]` | ביקוש מצטבר, progress לסף, הצעות‑סף, חתימות | `/deals/[id]` |
| `/deals` | שוק העסקאות; בכל דף: "לא מצאת? **בקש**" → `/wish/new` | `/deals/[id]` |
| `/mission/[id]` `/resource/[id]` | כתובות קנוניות למשימה/משאב פתוחים (היום availableMission / availiableResorce) | ההרקמה שלהם |

### מרחב 3 — הרקמה (חברים + פנים ציבוריות)

`/moach/[projectId]` (בעתיד alias `/rikma/[id]`) — **הניווט הדו‑שכבתי כבר קיים
בקוד** (`+layout.svelte` שורות 312‑321). נדרש רק יישור הקבוצות לפעלים:

| קבוצה (יעד) | טאבים | היום |
|---|---|---|
| **הדופק** (main) | main + פס מכונת‑מצבים + "ממתין לי כאן" | `main` |
| **🤝 הסכמות** | votes, wishes | `votes` לחוד, `wishes` תחת opps |
| **🛠 עשייה** | progress, acts, kanban, gantt, timers, shifts, processes, chains | `work` + `flows` (שתי קבוצות) |
| **💰 ערך** | sales, split, services, demand — **תפקיד כפול**: לרקמת‑ביקוש "נהל מה שמכרנו"; לרקמת‑יוזמה **מנוע מציאת לקוחות** (עדשת הביקוש) | `money` + demand תחת opps |
| **👥 אנשים** | חברים/תפקידים, פורום, הפנים הציבוריות | מפוזר |

ובנוסף: **`/project/[id]`** (ציבורי, קיים) משודרג ל"דף הצטרפות" — המקבילה
המדויקת של `/wish/[id]` במסלול היוזמה: מה המיזם, טבעת תפקידים (מה מכוסה/חסר),
משימות פתוחות, CTA הצטרפות. זה הדף שיזם משתף.

### מרחב 4 — האני

| דף | תוכן | הערה |
|---|---|---|
| **`/hub` = "התיבה"** | תיבת ההחלטות — הבית של המחובר: KPI + זרם לפי דחיפות‑שעון, מכל הרקמות | קיים! נשאר ב‑URL `/hub`; `/me` תפוס ע"י הפרופיל — לא מזיזים |
| `/me` | פרופיל, זהות, מכשירים | קיים |
| `/me/work` (עתידי) | עבודה חוצת‑רקמות: myacts + timers + myCalander | קיבוץ בלבד |
| `/deals` "שלי" | הכובע הצרכני | קיים |

### שכבת העצמים — כתובת קנונית לכל דבר

```
/decision/[type]/[id]  ← ⭐ דף ההחלטה: התוכן, הסבבים, מי חתם, שעון restime,
                          שלוש הפעולות. כל פוש/מייל/טלגרם מקשר לכאן.
/mission/[id] · /resource/[id] · /user/[id] · /meeting/[id] · /gift/[id]
```

### מדדים — שני משפכים ונקודת המפגש

- משפך ביקוש: `wish_start → wish_publish → maagad_join → rikma_created → decision_signed`
- משפך יוזמה: `rikma_created → mission_opened → partner_joined → first_sale`
- **מדד הבריאות:** כמה רקמות‑יוזמה מצאו לקוח ראשון דרך המפה, וכמה משאלות מצאו
  רקמה קיימת במקום להקים חדשה. וגם: פוש→חתימה על החלטה < 15 שניות.

---

## חלק ג' — מצב נוכחי: עובדות מאומתות מהקוד (2026-07-10)

הסוכן המבצע יכול לסמוך על העובדות הבאות בלי לבדוק שוב:

| # | עובדה | מיקום |
|---|---|---|
| F1 | `hooks.server.js` כבר עושה הפניות שרת: `/convention`+`/aitifaqia`→`/hascama` (303); `/`+מחובר→`/lev`; `/lev`+אורח→`/` | `src/hooks.server.js:123-170` |
| F2 | ה‑Hub בנוי: `+page.server.ts` עם `HubKpi`/`HubFeedItem`/`HubSummary`, סף דחיפות 24h, ו‑deep‑link `/lev?focus=<ani>&project=<id>` | `src/routes/(reg)/hub/+page.server.ts` |
| F3 | הלב תומך בטעינה קוונטית: qids `87levSlice{Decisions,Halukas,Pends,Mtaha,Sales,Purchases,Sheirutp,Wegets,Fiapp,AskedResources}` + פרמטרי `?focus=&project=` בעמוד | `qids.js`, `(reg)/lev/+page.svelte:65-206`, `docs/HOWTO_LEV_QUANTUM_LOADING.md` |
| F4 | למוח כבר יש ניווט דו‑שכבתי: 6 קבוצות `main/work/flows/money/opps/votes`, זיכרון תת‑טאב אחרון פר קבוצה, ובאדג' הצבעות פתוחות | `(reg)/moach/[projectId]/+layout.svelte:312-371` |
| F5 | `/wish/new` (ציבורי, אורח) ו‑`/concierge/new` (מחובר) הם אותו רכיב `WishForm` עם `anon` | שני ה‑`+page.svelte` + `src/lib/components/concierge/WishForm.svelte` |
| F6 | ל‑WishForm כבר יש: חילוץ משימות (`extractedMissions`/`matchedMissions`), התאמת אנשים לפי כישורים, ו־kinds של יוזמת קנייה משותפת (PLAN_SHARED_PURCHASE S0) | `WishForm.svelte:88-146,255,1550` |
| F7 | `/demand` בנוי עם שתי עדשות `join`/`supply`, מפת שכבות `LENS_LAYERS`, deep‑links `?lens=&layers=&c=` | `(regandnon)/demand/+page.svelte:28-190`, `src/lib/map/discoveryTypes.ts` |
| F8 | ניווט מובייל: hub · moach · chat · concierge(מרכזי) · deals · lev — שישה יעדים, שלושה מהם "בתים" מתחרים | `src/lib/components/footer/mobileFooter.svelte:150-310` |
| F9 | `deals` חי בעולם עיצוב נפרד: `AppHeader.svelte` משלו (לוגו deals, זהב) עם קישורי חזרה hub/lev/moach | `src/lib/components/AppHeader.svelte` |
| F10 | כרטיסי ההחלטה קיימים כרכיבים עצמאיים: `hachlata`, `haluka`, `pending`, `sugestma`, `sugestmi`, `dowegeot`, `didigetCard`, `reqtojoin`, `welcomeToCard`, `SaleCard`, `fini`, `pma`, `inpro`… | `src/lib/components/lev/cards/` |
| F11 | דף ציבורי לרקמה קיים | `(regandnon)/project/[id]` |
| F12 | דף מו"מ AI קיים | `/negotiation/[id]` + `$lib/negotiation/*` |
| F13 | תרגומים: קובץ JSON פר פיצ'ר, שלוש שפות | `src/lib/translations/{he,en,ar}/` |
| F14 | qids תפוסים עד 235; המספור הבא 240+ | `src/routes/api/send/qids.js` |

### הפערים, לפי סדר כאב

1. **שלושה "בתים" מתחרים למשתמש מחובר** — `/` מפנה ל‑`/lev`, הפוטר מציע גם
   `/hub` וגם `/lev`, ו‑`newlev`/`oldlev` עוד חיים. אין תיבה אחת.
2. **אין כתובת להחלטה** — ה‑deep‑link הכי טוב היום הוא `/lev?focus=…` (רשימה
   מסוננת), לא פריט בודד. אי אפשר לשלוח קישור ל"ההצבעה הזאת".
3. **מסלול היוזמה לא מסופר** — היכולות קיימות (רקמה, משימות פתוחות, מפה) אבל אין
   דלת "הקם מיזם" בבית, אין מצב מיזם בקומפוזר, ואין עדשת מיזמים במפה.
4. **קבוצות המוח לא מיושרות לפעלים** — wishes תחת opps במקום עם votes; demand
   תחת opps במקום עם money; אין קבוצת "אנשים".
5. **המשפך מפוצל ויזואלית** — deals עם הדר משלו; concierge כפילות של wish.
6. **מרחב הסיפור** — אין `/consensus`; `guid` תיעוד יבש; שורש מלא שאריות
   (`test-*`, `searchtest`, `newfront`, `migration-dashboard`, `testi`, `jenia`…).
7. **שמות** — `availiableResorce`, `myCalander` (שגיאות כתיב), moach/רקמות.

### טבלת גורל (כל route קיים)

| Route | גורל | יעד / משימה |
|---|---|---|
| `/lev` | נשאר כמנוע תצוגה ממוקדת; יורד מהניווט | T1.4 |
| `/newlev`, `/oldlev`, `/testi`, `/searchtest`, `/test-*`, `/migration-dashboard`, `/newfront`, `/jenia` | ארכוב | T0.3 |
| `/hub` | ⬆ הופך ל"תיבה" — הבית של המחובר | T1.4 |
| `/moach*` | נשאר; קבוצות מתיישרות לפעלים; alias `/rikma` בהמשך | T2.1‑T2.3 |
| `/demand` | נשאר; + עדשת מיזמים + alias `/discover` | T3.2 |
| `/wish/*` | נשאר; + מצב מיזם | T3.1 |
| `/concierge/*` | הפניה ל‑`/wish/*` | T3.5 |
| `/deals` | נשאר; מתיישר לניווט הכללי | T3.3 |
| `/negotiation/[id]` | נשאר; מקושר מדף ההחלטה | T1.2 |
| `/availableMission/[id]`, `/availiableResorce/[id]` | כתובת חדשה + הפניה | T3.4 |
| `/guid` | ⬆ `/how` (לפי PLAN_HOMEPAGE_MASTER §8) | T4.2 |
| `/hascama`, `/love`, `/faq`, `/about`, `/gift`, `/meeting`, `/user`, `/project`, `/give`, `/grow`, `/quorum`, `/maagad` | נשארים | — |
| `/me`, `/myacts`, `/timers`, `/newTimers`, `/myCalander`, `/sales-center` | נשארים; קיבוץ `/me/work` בשלב 5 | T5.3 |

---

## חלק ד' — תכנית הביצוע

> כל משימה עצמאית וניתנת לביצוע בנפרד. סדר מומלץ: T0 → T1 → T2 → T3 → T4 → T5,
> אבל בתוך שלב אין תלות בין משימות אלא אם צוין. סוכן: בצע משימה אחת, ודא
> קריטריונים, commit נפרד עם המזהה (למשל `feat(T1.2): decision page`).

### שלב 0 — תשתית שמות והפניות

#### T0.1 — מילון מונחים
- **צור** `docs/GLOSSARY.md`: רקמה (rikma/project/moach), משאלה (wish/ratson),
  מאגד (maagad), התיבה (hub), החלטה (Decision + כל נושאי votes: ask/askm/haluka/
  pendm/tosplit/sheirutpend/fiapp), חמשת הפעלים, שלושת הכובעים, restime, timegrama.
  לכל מונח: שם עברי קנוני, שם קוד, אזכור קבצים.
- **קבלה:** הקובץ קיים; כל מונח מכיל שם עברי + שם קוד + מיקום בקוד.

#### T0.2 — מודול הפניות מרכזי
- **צור** `src/lib/redirects.js` שמייצא `resolveRedirect(pathname): string | null`
  עם טבלה אחת (exact + prefix), למשל:
  ```js
  const EXACT = { '/discover': '/demand', '/how': '/guid' };
  const PREFIX = [ ['/concierge', '/wish'], ['/rikma', '/moach'] ]; // דוגמה; מאוכלס בהדרגה ע"י משימות אחרות
  ```
- **חבר** ב‑`src/hooks.server.js` מוקדם ב‑handle (לפני בדיקות ה‑auth, אחרי חישוב
  lang): אם `resolveRedirect` מחזיר יעד — `Response` עם status **308** ו‑Location
  (שומר method + query). העבר לשם גם את ההפניות הקשיחות הקיימות
  (`/convention`,`/aitifaqia`→`/hascama`).
- **בדיקת יחידה:** `src/lib/redirects.test.js` (vitest) — exact, prefix עם זנב
  (`/concierge/new`→`/wish/new`), ושימור query string.
- **קבלה:** `npx vitest run src/lib/redirects.test.js` ירוק; `/convention` עדיין
  מפנה ל‑`/hascama`; אין שינוי התנהגות אחר.

#### T0.3 — ניקוי שורש
- **העבר** את התוכן של `test-lev-socket`, `test-mastra-v2`, `test-migration`,
  `test-socket`, `testi`, `searchtest`, `migration-dashboard`, `newfront`, `jenia`
  לספרייה `src/routes/(dev)/` עם `+layout.server.js` שזורק 404 בפרודקשן
  (`if (!dev) error(404)`). **אל תמחק קוד.**
- **קבלה:** `npm run check` ירוק; ב‑build פרודקשן הנתיבים מחזירים 404; ב‑dev עובדים.

### שלב 1 — האטום והתיבה (התועלת הגבוהה ביותר)

#### T1.1 — qids לפריט‑החלטה בודד
- **הוסף** ל‑`qids.js` שאילתות `240one{Ask,Askm,Haluka,Decision,Pendm,Tosplit,Sheirutpend,Fiapp}`
  (מספרים 240‑247): כל אחת מקבלת `$id` ומחזירה את אותם שדות שהסלייס המקביל
  `87levSlice*` מחזיר (העתק את בחירת השדות משם), + `project { data { id attributes
  { projectName user_1s { data { id } } restime } } }` לבדיקת שייכות.
- **קבלה:** `npm run check` ירוק; קריאת `sendToSer` ידנית לכל qid מחזירה פריט.

#### T1.2 — דף ההחלטה `/decision/[type]/[id]`
- **צור** `src/routes/(regandnon)/decision/[type]/[id]/+page.server.js`:
  1. מיפוי `type→qid` (הטיפוסים מ‑T1.1; `error(404)` לטיפוס לא מוכר).
  2. שליפה; בדיקת גישה: `locals.uid` נמצא ב‑`project.user_1s` **או** משתתף
     בילטרלי (saleClaim — ראה CLAUDE.md); אחרת `error(403)` (ולאורח — redirect
     ל‑`/login?next=`).
  3. עיבוד ל‑DisplayItem: **השתמש בפונקציות הקיימות** ב‑
     `src/lib/components/lev/levProcessors.ts` (אל תכתוב עיבוד חדש).
- **צור** `+page.svelte`: רינדור כרטיס הלב המתאים (F10) במסך מלא. מיפוי
  type→component לפי אותו מיפוי שכבר קיים ב‑`cards/cards.svelte` (חפש שם את
  ה‑switch על `ani`). מתחת לכרטיס: שם הרקמה (קישור ל‑`/moach/[id]`), שעון
  restime, וכפתור "לכל התיבה" → `/hub`. אם הפריט במו"מ פעיל — קישור
  ל‑`/negotiation/[id]` (F12).
- **i18n:** `translations/{he,en,ar}/decision.json` (כותרות, שגיאות 403/404, CTA).
- **קבלה:** פתיחת החלטה אמיתית בדפדפן מציגה את הכרטיס והפעולות עובדות (הצבעה
  נרשמת); משתמש זר מקבל 403; אורח מנותב ל‑login וחוזר אחרי התחברות.

#### T1.3 — התראות מקשרות לדף ההחלטה
- **אתר** את בוני הקישורים: `grep -rn "lev?focus\|/lev'" src/lib/server` +
  `src/lib/server/actions/notifications/` (ה‑Notification Orchestrator).
- **החלף** יעד לכל התראה שנושאה פריט‑הסכמה בודד: `/decision/<type>/<id>`.
  התראות סיכום (יש כמה פריטים) ממשיכות ל‑`/hub`.
- **קבלה:** בדיקת יחידה על בונה הקישור; פוש/מייל שנשלח בפיתוח מכיל את ה‑URL החדש.

#### T1.4 — התיבה הופכת לבית
- **שנה** ב‑`hooks.server.js`: `/` + מחובר → `/hub` (במקום `/lev`); הוסף
  `/lev` + אורח → `/` נשאר. **אל** תפנה `/lev` למחובר — הוא נשאר כתצוגה ממוקדת.
- **עדכן** `mobileFooter.svelte` (F8): כפתור ה‑lev (💗) מוסר, `/hub` מקבל את
  האייקון והתווית "התיבה" (i18n: `nav.json`), והקישור הפנימי מהתיבה ללב
  (`/lev?focus=…`) נשאר כפי שהוא (F2/F3).
- **הוסף** באנר קטן ב‑`/lev` (למי שמגיע מסימניה): "הבית החדש שלך הוא התיבה" +
  קישור. `newlev`/`oldlev` → הפניה ל‑`/hub` דרך T0.2.
- **קבלה:** התחברות → נוחתים ב‑`/hub`; מהפוטר אין דרך "ללכת לאיבוד" בין בתים;
  `/lev?focus=decisions&project=X` עדיין עובד.

### שלב 2 — הרקמה מתיישרת לפעלים

#### T2.1 — קיבוץ מחדש של הטאבים (i18n בלבד כמעט)
- **ערוך** את `groups` ב‑`(reg)/moach/[projectId]/+layout.svelte:316-321` אל:
  ```js
  { id: 'main',   tabs: ['main'] },
  { id: 'agree',  tabs: ['votes', 'wishes'] },                                  // 🤝 הסכמות
  { id: 'do',     tabs: ['progress', 'acts', 'kanban', 'gantt', 'timers', 'shifts', 'processes', 'chains'] }, // 🛠 עשייה
  { id: 'value',  tabs: ['sales', 'split', 'services', 'demand'] },             // 💰 ערך
  { id: 'people', tabs: ['people'] }                                            // 👥 (T2.4)
  ```
  שמור על מנגנון "זיכרון תת‑טאב אחרון" הקיים (F4) ועל הבאדג'.
- **i18n:** תוויות הקבוצות ב‑`moach.json` בשלוש שפות (הסכמות/עשייה/ערך/אנשים).
- **קבלה:** כל 14 תת‑הדפים נגישים; refresh על כל URL קיים עובד (הכתובות לא השתנו).

#### T2.2 — "הדופק": מצב הרקמה + ממתין‑לי‑כאן
- **ב‑main** (`moach/[projectId]/main`): הוסף בראש (א) פס מצב מכונת‑מצבים לפי
  `PLAN_rikma_as_state_machine.md` — נגזר מנתונים קיימים (יש חברים? משימות
  פעילות? מכירות? חלוקות?) בלי שדה חדש ב‑Strapi; (ב) רשימת "ממתין לי כאן" —
  שימוש חוזר בלוגיקת ה‑Hub (F2): חלץ מ‑`hub/+page.server.ts` את בניית ה‑feed
  לפונקציה משותפת `src/lib/server/hubFeed.ts` וסנן לפי `projectId`; כל פריט
  מקשר ל‑`/decision/[type]/[id]` (תלוי T1.2).
- **קבלה:** הדופק מציג מצב + פריטים ממתינים אמיתיים; ה‑Hub ממשיך לעבוד (אותה
  פונקציה, שני צרכנים).

#### T2.3 — עדשת הביקוש כ"מנוע לקוחות" לרקמת‑יוזמה
- **ב‑`moach/[projectId]/demand`** (קיים, F7/M3 של PLAN_DISCOVERY_MAP): הוסף
  כותרת‑הקשר דו‑מצבית (i18n): אם לרקמה אין עדיין מכירות — "כאן מוצאים את
  הלקוחות הראשונים: זה הביקוש שהשוק מבקש ואתם יודעים לתת"; אחרת הכותרת הקיימת.
  + CTA "הצע" בולט לכל פריט.
- **קבלה:** רקמה בלי מכירות רואה את הניסוח היזמי; עם מכירות — הרגיל.

#### T2.4 — טאב אנשים + דף ההצטרפות
- **צור** `moach/[projectId]/people/+page.svelte`: רשימת `user_1s` (שדות מ‑
  `STRAPI_SCHEMA_REFERENCE.md`), קישור לפורום הרקמה, וקישור בולט לדף הציבורי.
- **שדרג** את `(regandnon)/project/[id]` ל"דף הצטרפות": תיאור, חברים, משימות
  פתוחות של הרקמה (שאילתה קיימת — ראה `221mapOpenMissions` כמקור לשדות; אם צריך
  פילטר לפי project צור qid `248projectOpenMissions`), טבעת תפקידים (אילו
  כישורים מכוסים ע"י חברים / מבוקשים במשימות — חישוב לקוח פשוט), ו‑CTA
  "הצטרף" → זרימת reqtojoin הקיימת (כרטיס `reqtojoin.svelte`, F10).
- **קבלה:** שיתוף `/project/[id]` לאורח מציג דף מלא עם CTA; לחיצה על הצטרפות
  לאורח → login → חזרה.

### שלב 3 — איחוד המשפך + מסלול היוזמה

#### T3.1 — מצב מיזם בקומפוזר (הדלת השלישית) 🌱
- **ב‑`WishForm.svelte`** (F5/F6): הוסף בחירה ראשונה בראש הטופס (radio, i18n):
  🛒 "אני רוצה מוצר/חוויה" (ברירת מחדל — זרימה קיימת, אפס שינוי) ·
  🌱 "אני רוצה להקים מיזם ולמצוא שותפים".
- במצב מיזם: (א) הפרומפט של החילוץ מקבל הנחיה לחלץ **תפקידים ומשימות** —
  ה‑endpoint הקיים כבר מחזיר `missions` (F6), רק חדד את ה‑copy; (ב) מסך
  ה"מה הבנתי" מציג תפקידים במקום רכיבי מוצר; (ג) כפתור הפרסום הופך ל"הקם
  רקמה ופרסם משימות": אתר את action יצירת הפרויקט הקיים
  (`grep -rn "crProject\|createProject" src/lib/server/actions src/routes/api/send/qids.js`)
  והפעל אותו + יצירת open‑missions מהחילוץ (action קיים ליצירת משימה פתוחה —
  אתר עם `grep -rn "openMission\|open-mission" src/lib/server/actions`).
  שמור על ratson שנוצר ממילא וקשר אותו לרקמה (שדה `open-mission.ratson` קיים — F/DISCOVERY §0).
- **הוסף** תמיכה ב‑query param: `/wish/new?kind=venture` פותח ישר במצב מיזם.
- **קבלה:** מסלול מוצר ללא רגרסיה (בדיקה ידנית מלאה); מסלול מיזם מסתיים ברקמה
  חדשה עם משימות פתוחות שנראות ב‑`/demand` בעדשת הספק.

#### T3.2 — עדשת מיזמים במפה
- **ב‑`src/lib/map/discoveryTypes.ts` + `(regandnon)/demand/+page.svelte`** (F7):
  הוסף עדשה שלישית `venture` 🌱 ל‑`LENS_LAYERS`: שכבת המשימות הפתוחות
  והמשאבים המבוקשים **מקובצת לפי רקמה** (pin לרקמה עם מונה "מחפשים 3 שותפים"),
  פופאפ → `/project/[id]` (דף ההצטרפות מ‑T2.4). deep‑link `?lens=venture` נתמך
  אוטומטית ע"י המנגנון הקיים.
- **i18n:** `demand.json` — `lens_venture` בשלוש שפות.
- **קבלה:** שלוש עדשות עובדות; `?lens=venture` משחזר מצב; פריט אונליין מופיע
  ברשימה ולא במפה (כלל קיים).

#### T3.3 — deals מתיישר
- **החלף** את `AppHeader.svelte` בתוך עמודי deals בניווט הכללי (אותו הדר/פוטר
  כמו שאר `(regandnon)`) תוך שמירת מיתוג הזהב בתוכן העמוד עצמו. הקישור החוזר:
  "לא מצאת? בקש" → `/wish/new` בכל עמוד deals (רכיב קטן `AskInsteadBanner.svelte`
  ב‑`$lib/components/deals/`).
- **קבלה:** ניווט אחיד; אפס קישורים שבורים מ‑deals החוצה.

#### T3.4 — כתובות קנוניות למשימה/משאב
- **צור** `(regandnon)/mission/[id]` ו‑`(regandnon)/resource/[id]` שפשוט
  מייצאים‑מחדש את הדפים הקיימים (import של רכיב הדף מ‑`availableMission/[id]`
  אחרי חילוצו לרכיב משותף תחת `$lib/components/openItems/`).
- **הוסף** ל‑T0.2: `/availableMission`→`/mission`, `/availiableResorce`→`/resource` (prefix).
- **קבלה:** שתי הכתובות החדשות עובדות; הישנות מפנות 308; sitemap מעודכן.

#### T3.5 — concierge → wish
- **הוסף** ל‑T0.2: `['/concierge', '/wish']` (prefix). ודא ש‑`/wish/[id]` מכסה
  את יכולות `/concierge/[id]` למשתמש מחובר (השווה את שני הדפים; אם חסר —
  העבר את הרכיב החסר לפני ההפניה). עדכן את הפוטר (F8): כפתור המרכז מנווט
  ל‑`/wish/new`.
- **קבלה:** כל זרימת קונסיירז' עובדת תחת `/wish/*`; אין import שבור.

### שלב 4 — הסיפור

#### T4.1 — דף הבית: שלוש דלתות
- מיושם לפי `PLAN_HOMEPAGE_MASTER.md` (הוא המפרט; לא משוכפל כאן), עם עדכון אחד
  שנובע מהמסמך הזה: בלוק ה‑Hero ובלוק ה‑CTA הסופי מציגים **שלוש דלתות** ולא
  שתיים — "בקש משהו" (`/wish/new`) · "הצטרף למיזם" (`/demand?lens=venture`) ·
  "הקם מיזם" (`/wish/new?kind=venture`); ובלוק 6 ("איך זה עובד") מוצג כגלגל עם
  שלוש כניסות, לא כקו.
- **קבלה:** לפי הקריטריונים שם + שלושת הקישורים חיים.

#### T4.2 — `/consensus` — דף הראווה של מנוע ההסכמה
- **צור** `(regandnon)/consensus/+page.svelte` + `consensus.json` (he/en/ar):
  1. Hero: "אין אצלנו 'לא'" — שלוש הפעולות (אשר · שוחח · הצע‑נגד).
  2. הסבר שתיקה‑כהסכמה בקצב הרקמה (restime/timegrama) עם שעון מדגים.
  3. **דמו סבב מו"מ אינטראקטיבי** — שימוש חוזר ברכיבי `$lib/negotiation/*`
     (F12) במצב mock (ללא שרת), או GIF מוקלט אם הרכיבים דורשים דאטה חי.
  4. הקישור הפילוסופי → `/hascama`, והמעשי → `/wish/new`.
- **קישור** מהבית (בלוק הפיצ'רים), מ‑`/how`, ומה‑Footer.
- **קבלה:** הדף עובר בשלוש שפות, RTL תקין, בלי תלות בהתחברות, נכלל ב‑sitemap.

#### T4.3 — `/guid` → `/how`
- alias ב‑T0.2 (`/how`→`/guid` בשלב ראשון, היפוך בהמשך) + יישום התוכן לפי
  PLAN_HOMEPAGE_MASTER §8, בתוספת הטוגל המשולש לקוח/שותף/יזם.

### שלב 5 — ליטוש ומדידה

#### T5.1 — SEO
- sitemap כולל: `decision` (noindex! פרטי), `mission`, `resource`, `consensus`,
  `how`; מחריג `(dev)`. hreflang + OG לדפים החדשים. עדכון `static/llms.text`
  לתיאור הגלגל ושלוש הדלתות.

#### T5.2 — אנליטיקס שני המשפכים
- אירועי `@vercel/analytics`: משפך ביקוש `wish_start, wish_publish, maagad_join,
  decision_signed`; משפך יוזמה `venture_start, rikma_created, mission_opened,
  partner_joined, first_sale`; + `decision_opened_from_push`.
- **קבלה:** האירועים נורים (בדיקה ב‑dev console) בנקודות הנכונות.

#### T5.3 — `/me/work` (אופציונלי, אחרון)
- קיבוץ `myacts`+`timers`+`myCalander` תחת `/me/work` עם תת‑טאבים (אותו דפוס
  כמו layout המוח, F4). הישנים מפנים.

---

## נספח — ראשי פרקים ל‑commit ולבדיקה ידנית של כל שלב

| שלב | בדיקת עשן ידנית (5 דקות) |
|---|---|
| 0 | `/convention` מפנה; `npm run check` + vitest ירוקים; test-routes מחזירים 404 ב‑build |
| 1 | פוש על הצבעה → `/decision/...` → הצבעה נקלטת; login → `/hub`; `/lev?focus=` חי |
| 2 | כל 14 תת‑דפי המוח נגישים מהקבוצות החדשות; "ממתין לי כאן" תואם לתיבה |
| 3 | משאלת מוצר E2E ללא רגרסיה; משאלת מיזם → רקמה+משימות → נראית במפה בעדשת 🌱 |
| 4 | `/consensus` בשלוש שפות; שלוש הדלתות בבית מקשרות נכון |
| 5 | sitemap תקין; אירועי אנליטיקס נורים |

## שורה תחתונה

האתר האידיאלי הוא **גלגל רצון עם שלוש דלתות** — לקוח שמבקש, שותף שמצטרף, יזם
שמקים — וכולן מתנקזות לאותו אטום: הסכמה עם כתובת ותיבה. הבדיקה מול הקוד מגלה
שהמערכת קרובה מהצפוי: התיבה בנויה, הניווט הדו‑שכבתי ברקמה קיים, הקומפוזר כבר
מחלץ משימות. העבודה שנותרה היא בעיקרה חיבורים — דף החלטה אחד, יישור קבוצות,
דלת יוזמה, ודף אחד שמספר את סיפור הכתר.
