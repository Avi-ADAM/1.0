# ארכוב ועריכה של אובייקטים בריקמה (Object Archival & Edit)

> **סטטוס: תכנית לאישור.** אין עדיין יישום. הפאזות למטה נכתבו כדי שאפשר
> יהיה לאשר/לתקן אותן לפני שכותבים שורת קוד.

## Context — למה זה נבנה

לריקמה יש היום תהליך יצירה מובנה ומוסכם לכל אובייקט:

| אובייקט | ישות pending | הצבעות | נגו | timegrama | קלף לב |
|---|---|---|---|---|---|
| משימה פתוחה | `pendm` | `users` (`projects.vots`) | `negopendmission` | ✔ | `pandingMesima` |
| משאב פתוח | `pmash` | `users` | `nego-mash` | ✔ | `pmas` |
| מתנה/מוצר | `matanotpend` | — | `nego` | ✔ | — |

אבל **אחרי** שהאובייקט נוצר אין שום תהליך מובנה להסרה או לעריכה שלו. מי
שרוצה להסיר משימה פתוחה שכבר לא רלוונטית, לסגור משימה בתהליך שנתקעה, או
להוריד מוצר מהמדף — אין לו דרך. בריקמה של אדם אחד זה לא נורא (הכול שלו,
הכול מיידי), אבל בריקמה של כמה אנשים **הסרת אובייקט היא שינוי בחוזה
המשותף** ולכן חייבת לעבור את אותו שער הסכמה שהיצירה עברה.

### עקרון — הסרה = פתיחת קיום האובייקט לדיון

> ארכוב אינו פעולה חד-צדדית, הוא **הצעה**: "אני מציע שהאובייקט הזה יחדל
> להיות צורך של הריקמה". בהתאם לעקרונות-העל:
>
> - **אין "לא" מוחלט.** לחבר ריקמה יש שלוש דרכים להגיב להצעת ארכוב:
>   **אישור** (תמיכה מלאה בהסרה) · **צ'אט** (בירור דרך ה-`forums` של
>   ה-Decision) · **משא-ומתן** — שימוש ברכיבי ה-nego כדי להציע נוסחה
>   חליפית: *האובייקט לא יוסר, אבל פרטיו ישתנו*. "אני מתנגד להסרה" מתבטא
>   כסבב נגדי במצב `keep`, לא כווטו.
> - **שתיקה היא הסכמה, בקצב הריקמה.** הצעת הארכוב עומדת ל-`restime` של
>   הפרויקט דרך `timegrama`. אין תגובה ⇒ הגרסה העומדת מבשילה. סבב נגדי
>   מאפס את השעון.
> - **רוכבים על `Decision`.** לא מומצא מודל הצבעה חדש ולא נוצרת קולקציית
>   pending חדשה: שני `kind` חדשים (`archiveObject`, `editObject`) על
>   `Decision` הקיים, עם ה-`vots`/`votes`, ה-`timegrama`, ה-`forums`
>   וצינור הקלפים של עמוד הלב שכבר קיימים.
> - **ריקמת יחיד = מיידי.** כשקבוצת המסכימים פרט ליוזם ריקה, הפעולה מוחלת
>   ישירות בלי Decision בכלל (אותו כלל שכבר מתקיים דה-פקטו ב-`voteOnPendm`
>   כש-`totalMembers === 1`).

### שתי צירים שחשוב לא לבלבל ביניהם

| ציר | מי בעליו | מי מסכים |
|---|---|---|
| **המחויבות שלי** — משימה/משאב בתהליך שרשומים על שמי | אני | ריבוני: אני יכול להשתחרר (`release`) |
| **הצורך של הריקמה** — שהאובייקט בכלל קיים | הריקמה | הסכמת כלל החברים |

לכן `scope: 'release'` (משימה בתהליך חוזרת לבריכה הפתוחה — הצורך נשאר)
נבדל מ-`scope: 'archive'` (האובייקט מפסיק להיות צורך). לשחרור של משימה
**בלי שעות שנצברו** אין למי להסכים חוץ מהמבצע עצמו — זו הצהרה ריבונית
מיידית, כמו "הכסף אצלי" ב-saleClaim. ברגע שנצברו שעות — גם השחרור הופך
לדיון, כי יש לו השלכה כספית על הריקמה.

---

## מיפוי המצב הקיים

### למה `archived` תפוס ואסור למחזר אותו

השדה `archived` קיים כבר על רוב האובייקטים, אבל **משמעותו "לא בבריכה
הפתוחה", לא "הוסר"**:

- `open-mission.archived = true` נכתב כשההצעה **נתפסה**:
  `finalizeAskAcceptance.ts:164`, `finalizeJoinAcceptance.ts:202`,
  `applyToMission.ts:248`, ובמסלול ההצעה-לאדם-ספציפי גם ברגע היצירה
  (`voteOnPendm.ts` — `isRishon: true, rishon: …, archived: true`).
- `pendm.archived` / `pmash.archived` = ההצבעה הסתיימה (בהסכמה או בדחייה).
- `decision.archived` = ההחלטה הבשילה.
- `matanot.archived` = כבר בשימוש ל-soft-delete ריבוני של מוצר אישי
  (`archivePersonalMatanot.ts`, qid `255setMatanotArchived`).

מיחזור השדה ליעד ארכוב ייצור התנגשות ישירה: משימה שנתפסה תיראה כמוסרת,
ומשימה שהוסרה תיראה כנתפסה. לכן — **שדה חדש ונפרד**.

### תשתיות קיימות שהתכנית נשענת עליהן

**Decision:** `kind` enum, `vots` (`projects.vots` עם `order` = סבב),
`votes` (קולקציית `vote`), `negom` (component `desision.negom`),
`negodes` (component `projects.negodes` — כבר מכיל `newHours`!),
`timegrama` (oneToOne), `forums` (manyToMany), `archived`, ו-`moreHours`
+ `newHours` — שרידים של תהליך "עוד שעות" שנבנה חלקית ומעולם לא חובר
ל-`kind`. התכנית הזו סוגרת אותו כ-`editObject`.

**קונסנזוס:** `voteOnDecision.ts` (מפוצל per-kind, עם התקדים הדו-צדדי של
`saleClaim`), `getDecisionDetails.ts`, `addVote` עם `type:'decision'`.

**שתיקה כהסכמה:** `/api/timegrama/+server.js` → `whatami === 'decision'`
→ `src/routes/api/timegrama/decision.svelte`. הענף הגנרי שם כבר מיישם
"לפחות כן אחד ואף לא מפורש ⇒ מחילים", והענף של `saleClaim` מיישם
"הגרסה העומדת מבשילה". שני הענפים הם התבנית לשני ה-kinds החדשים.

**נגו (UI):** `src/lib/components/prPr/negoPend.svelte` +
`negoM.svelte` + רכיבי `src/lib/components/conf/` (`text`, `number`,
`dateNego`, `kindOfnego`, `barb`, `VersionHistory`, `actsNego`) — עריכת
שדה-שדה עם הגרסה הקודמת כ-reference, ניהול `ordern` ואיפוס `timegrama`.

**עמוד הלב:** `extractDecisions` (`levDataExtractors.ts:1062`),
slice `decisions` (qid `87levSliceDecisions`, `levSliceRegistry.ts:130`,
ani `hachla`), `decisionMaking.svelte`, קלף `cards/hachlata.svelte`.
`saleClaim` הוסיף אליהם payload ייעודי בלי לפתוח ani חדש — אותה גישה כאן.

**סילוק שעות:** `closeFiniapruval.ts` יודע כבר להמיר שעות שנצברו
ל-`finnished-mission` (qids `113createFinnishedMissionForTimerSave`,
`114updateFinnishedMissionHours`, `115updateMissionTotalHoursSaved`) —
זה בדיוק מנגנון ה-`credit` שהתכנית צריכה, ואין לשכפל אותו.

**restime:** `Project.restime` + `calcDeadlineMs` ב-`configs/actionUtils.js`
(ו-`calcX` המקומי ב-`completeMission.ts`).

---

## מודל הנתונים

### 1. שדה מחזור-חיים חדש — `lifecycle`

**שדה סקלרי אחד** על כל אובייקט שניתן לארכב (לא קומפוננטה — כדי שאפשר
יהיה לסנן עליו בזול בכל שאילתה):

```
lifecycle: enumeration [ active, archiveProposed, archived, released ]
           # ללא default; null = legacy = פעיל
```

על: `open-mission`, `mesimabetahalich`, `open-mashaabim`,
`mashabetahalich`, `matanot`.

- `null` / `active` — פעיל. כל האובייקטים הקיימים היום (grandfathering).
- `archiveProposed` — יש Decision פתוח. האובייקט **עדיין פעיל לכל דבר**,
  אבל מוצג עם chip "בדיון להסרה" ואי-אפשר לפתוח עליו הצעת ארכוב שנייה.
- `archived` — הוסר. לא מופיע ברשימות, לא נשלף למאצ'ינג, לא ניתן לפעולה.
  אף פעם לא נמחק — כל ההיסטוריה (`finnished-mission`, `sale`, `haluka`)
  ממשיכה להצביע עליו.
- `released` — רק ל-`mesimabetahalich`/`mashabetahalich`: המבצע השתחרר,
  הצורך חזר לבריכה הפתוחה.

`mashabetahalich.status_mashab` (`draft|active|paused|closed|cancelled`)
**נשאר תפעולי** — `lifecycle` הוא ציר נפרד ובלעדי לארכוב.

### 2. Decision — שני kinds חדשים + יעד

```
kind        += 'archiveObject'   # הצעה להסיר
            += 'editObject'      # הצעה לשנות פרטים (כולל "עוד שעות")

targetKind   enumeration [ openMission, missionInProgress,
                           openResource, resourceInProgress, matanot ]
archWhy      text                # נימוק היוזם

# יעד — relation אחד לכל טיפוס, בדיוק כמו התבנית של timegrama.whatami
archOpenMission       manyToOne → api::open-mission.open-mission
archMesimabetahalich  manyToOne → api::mesimabetahalich.mesimabetahalich
archOpenMashaabim     manyToOne → api::open-mashaabim.open-mashaabim
archMashabetahalich   manyToOne → api::mashabetahalich.mashabetahalich
archMatanot           manyToOne → api::matanot.matanot

negoarch     component desision.negoarch (repeatable)   # הסבבים
```

הצד ההופכי בכל אחת מחמש הקולקציות: `archive_decisions` (oneToMany →
decision, `mappedBy` המתאים). oneToMany ולא oneToOne — כדי שאפשר יהיה
לפתוח הצעה שנייה בעתיד אחרי שהראשונה הבשילה ל-`keep`.

> **למה relation לכל טיפוס ולא polymorphic:** Strapi v4 לא תומך בזה
> נורמלית, וזו כבר התבנית של `timegrama` (relation לכל יעד + `whatami`
> כדיסקרימינטור) ושל `Decision` עצמו (`sale`, `matanot`, `moreHours`).

### 3. קומפוננטת הסבבים — `desision.negoarch`

מודלת לפי `desision.negom` (שמשמש את `pmash` ואת `saleClaim`), בתוספת
השדות הייחודיים לארכוב:

```
ordern         integer                       # מספר הסבב
mode           enumeration [ archive, keep ] # ארכוב מלא / השארה עם שינוי
why            text                          # למה הסבב הזה
proposedBy     relation oneToOne → users-permissions.user
zman           datetime

# הערכים המוצעים כש-mode = keep
name           string
descrip        text
hm             decimal      # שעות / כמות
price          decimal      # perhour / מחיר ליחידה
kindOf         enumeration [ total, monthly, yearly, perUnit, rent ]
sqadualed      datetime
sqadualedf     datetime

# סילוק שעות/מסירות שנצברו (רק לאובייקט בתהליך)
hoursOutcome   enumeration [ credit, waive, transfer ]
hoursToCredit  decimal
transferTo     relation oneToOne → api::mesimabetahalich.mesimabetahalich
```

**סבב 1** נוצר תמיד על-ידי היוזם: `mode: 'archive'` בהצעת ארכוב,
`mode: 'keep'` בהצעת עריכה. **סבב נגדי** של חבר אחר יכול להפוך את ה-mode
לשני הכיוונים — וזה בדיוק המנגנון שהמשתמש ביקש: "מו״מ = האובייקט לא יוסר
אבל הפרטים ישתנו".

**כלל ההבשלה** (זהה ל-`voteOnPendm` + saleClaim): הגרסה העומדת היא סבב
`max(ordern)`. היא מבשילה כשכל חברי הריקמה חתומים על אותו `order`
ב-`vots`, או כשה-`timegrama` פוקע בלי "לא" מפורש. הצעת סבב = הסכמת המציע
לאותו סבב.

### 4. אין שינוי ב-vote / timegrama / forum

`decision.vots`, `decision.votes`, `timegrama.decision`,
`decision.forums` — כולם קיימים ומחווטים. אפס עבודה.

### 5. אחרי השינויים ב-1.0b

`npm run types:update` ב-`1.0` (מעדכן `src/generated/graphql.ts`,
`STRAPI_SCHEMA_REFERENCE.md`, `src/lib/generated/contentTypes.d.ts`,
`components.d.ts`).

---

## מה קורה בהבשלה — לפי סוג יעד

מודול משותף אחד: **`src/lib/server/archive/apply.ts`**, שמקבל
`exec(query, variables)` כפרמטר כדי ששלושת מסלולי ההפעלה ישתמשו בו:
(1) הענף ב-`voteOnDecision`, (2) ה-handler של ה-timegrama
(`decision.svelte`, שרץ מול `SendToAdmin`+`ADMINMONTHER`), (3) המסלול
המיידי של ריקמת יחיד. שכפול הלוגיקה בין השלושה הוא באג שמחכה לקרות.

### `openMission` — משימה פתוחה

`mode: archive` → `lifecycle: 'archived'` + סגירת הזנב:
`ask`ים פתוחים עליה נסגרים (`archived`) וה-`timegrama` שלהם `done`;
`match-suggestion`ים נמחקים/מסומנים; המועמדים מקבלים התראה מנומקת;
`negopendmission` פתוחים נסגרים. **`archived` לא נגעים בו.**
`mode: keep` → החלת הערכים (`name`, `descrip`, `noofhours`, `perhour`,
`sqadualed`, `dates`).

### `missionInProgress` — משימה בתהליך (`mesimabetahalich`)

לפני הכול: אם יש `activeTimer` — הוא נעצר ונשמר; `finiapruval` פתוח
נסגר. אחר כך לפי `hoursOutcome` של הסבב העומד:

| outcome | מה קורה |
|---|---|
| `credit` | יצירת/עדכון `finnished-mission` על `hoursToCredit` × `perhour` המוסכם (אותו מסלול של `closeFiniapruval` isTimerSave — qids 113/114/115), עדכון `totalHoursSaved`, ואז `lifecycle: 'archived'` |
| `waive` | ויתור מוסכם — אין `finnished-mission`, `lifecycle: 'archived'` |
| `transfer` | השעות נזקפות ל-`transferTo` (משימה בתהליך אחרת של אותו מבצע), ואז `lifecycle: 'archived'` |

`scope: 'release'` → `lifecycle: 'released'` + החזרת הצורך לבריכה:
ה-`open_mission` המקורי (אם קיים) חוזר ל-`archived: false, isRishon:
false, rishon: null`, אחרת נוצרת משימה פתוחה חדשה מהשדות של המשימה
בתהליך. השעות מסולקות באותם שלושה outcomes.

`mode: keep` (= `editObject`, וגם "מו״מ שמנצח" על הצעת ארכוב) → החלת
`hm`→`hoursassinged`, `price`→`perhour`, `name`, `descrip`,
`sqadualed`/`sqadualedf`→`start`/`dates`.

### `openResource` / `resourceInProgress`

מקבילים: משאב פתוח → `lifecycle: 'archived'` + סגירת `askm`/`hatzaa`
פתוחים. משאב בתהליך → סילוק `quantityDelivered`/שעות שנצברו באותם שלושה
outcomes (הצד המקביל ל-`finnished-mission` הוא `maap`), ואז ארכוב.

> ⚠️ **נקודה לאישור**: מסלול הסילוק של משאב בתהליך פחות ממופה מזה של
> משימה. אם זה מסבך — פאזה 3 יכולה לצאת עם משימות בלבד ולהוסיף משאבים
> בפאזה 3ב'.

### `matanot` — מתנה / מוצר

`lifecycle: 'archived'`. **מכירות קיימות ממשיכות להצביע עליו** — לעולם
לא מחיקה. מוצר אישי (`origin: 'personal'` + `owner_user` = אני) נשאר
ריבוני-מיידי דרך `archivePersonalMatanot` הקיים; רק מוצר של ריקמה עובר
את ה-Decision. אם יש `monter` פעילים (מנויים) — הם נסגרים והלקוחות
מקבלים התראה, וזה נכנס לטקסט הקלף ("3 מנויים פעילים ייסגרו").

---

## המסלול המהיר (Fast lane) — אובייקט רדום

המשתמש ביקש הפרדה: משימה בתהליך שנצברו בה שעות ⇐ דיון גם על מה עושים עם
השעות; משימה שרק אושרה ולא קרה בה כלום זמן רב ⇐ ארכוב בלי סיבוך.

**הגדרת "רדום"** (קבוע משותף `src/lib/archive/dormancy.ts`):

```
dormant = howmanyhoursalready ∈ {0, null}
        && finnished_missions.length === 0
        && activeTimer == null
        && updatedAt < now - DORMANT_DAYS      # ברירת מחדל: 30 יום
```

מה זה משנה בפועל:

1. **UI** — הדראוור נפתח בלי בלוק סילוק השעות בכלל, עם טקסט אחד
   ("לא נעשתה כאן פעילות מאז {תאריך}") ונימוק אופציונלי.
2. **נימוק** — חובה קשיחה רק כשיש שעות שנצברו; ברדום זה שדה מומלץ עם
   nudge, לא חוסם.
3. **המבצע עצמו** ברדום: שחרור (`release`) הוא הצהרה ריבונית מיידית —
   בלי Decision, בלי המתנה. ארכוב הצורך עצמו עדיין דורש את הריקמה.
4. **קלף הלב** מציג את הגרסה המקוצרת (`archobj-dormant`) בעדיפות נמוכה
   יותר, כי אין לו דחיפות כספית.

---

## פאזות יישום

### פאזה 0 — סכימה וטיפוסים

**1.0b (branch `claude/object-archival-process-sdo5a2` מ-`origin/shabab`):**
- `src/api/decision/content-types/decision/schema.json`: שני ה-kinds,
  `targetKind`, חמשת ה-relations, `archWhy`, `negoarch`.
- `src/components/desision/negoarch.json` — קומפוננטה חדשה.
- `lifecycle` + `archive_decisions` בחמש הקולקציות.

**1.0:** `npm run types:update`, ואז `npm run check`.

**Exit:** הסכימה עולה, ה-codegen עובר, `STRAPI_SCHEMA_REFERENCE.md` מעודכן.

### פאזה 1 — פתיחת הצעה + ריקמת יחיד + כיבוד `lifecycle` בסינון

**Actions חדשים:**

`proposeObjectArchive.ts`
```
params: { targetKind, targetId, projectId, scope: 'archive'|'release',
          why?, hoursOutcome?, hoursToCredit?, transferToId? }
authRules: [ jwt, projectMember(projectIdParam:'projectId') ]
```
1. שליפת היעד (qid לפי `targetKind`) + אימות שהוא `active`/`null`
   ושאין עליו Decision פתוח.
2. ולידציה: `why` חובה כשיש שעות שנצברו; `hoursOutcome` חובה לאובייקט
   בתהליך שאינו רדום; `transferTo` חייב להיות משימה בתהליך של אותו מבצע.
3. **מסלול מיידי**: אם `members.length === 1` (או `scope === 'release'`
   על אובייקט רדום שהיוזם הוא המבצע) → קריאה ישירה ל-`archive/apply.ts`,
   `lifecycle` סופי, בלי Decision.
4. אחרת: `Decision` (`kind: 'archiveObject'`, `targetKind`, relation
   ליעד, `archWhy`) + `negoarch[0]` (`ordern: 1`, `mode: 'archive'`,
   `proposedBy`, `hoursOutcome`…) + `vots: [{what:true, order:1, …}]`
   של היוזם + `timegrama { whatami:'decision', date: now +
   calcDeadlineMs(restime) }` + `lifecycle: 'archiveProposed'` על היעד.
5. Notification לכלל חברי הריקמה (`channels: socket, push`,
   `metadata.url: 'lev'`), ולמבצע האובייקט בנפרד בעדיפות גבוהה.

`proposeObjectEdit.ts` — אותו דבר עם `kind: 'editObject'` ו-
`negoarch[0].mode = 'keep'` + הערכים המוצעים. פתוח לבעל האובייקט
(`users_permissions_user`) ולכל חבר ריקמה.

**סינון — הסריקה שאסור לפספס.** בכל מקום שמציג אובייקטים חיים צריך
`lifecycle: { ne: "archived" }` (ו-`released` היכן שרלוונטי). רשימת
המשפחות לבדיקה:
- `src/routes/api/send/qids.js` — כל שאילתות `openMissions`,
  `mesimabetahaliches`, `openMashaabims`, `mashabetahaliches`,
  `matanots` (כולל ה-slices של הלב `87lev*` ו-`209levMatchSuggestions`).
- `src/lib/server/matching/engine.ts` — לא לייצר match-suggestion
  לאובייקט מארוכב, ולנקות suggestions קיימים בהבשלה.
- `moach`: `open/`, `progress/`, `main/`, `kanban/`, `gantt/`,
  `planningBoards.ts`, `loadCatalog.ts`.
- `hamatanot.svelte` + דפי המתנה הציבוריים.
- `levProcessors.ts` / `levMissionProcessors.js` — סינון הגנתי גם בצד
  הלקוח (snapshot ישן יכול להחזיק אובייקט שכבר אורכב).

**Exit:** אפשר לפתוח הצעת ארכוב; בריקמת יחיד האובייקט נעלם מיד; בריקמה
מרובה נוצר Decision פתוח והאובייקט מסומן "בדיון".

### פאזה 2 — הצבעה, מו״מ וקלף בעמוד הלב

**`voteOnDecision.ts`** — ענף `kind === 'archiveObject' | 'editObject'`:
היקף הקונסנזוס הוא **כלל-ריקמתי** (בשונה מ-`saleClaim` הדו-צדדי). הצבעה
נכנסת ל-`vots` ב-`order` העומד; כשכל החברים חתומים על אותו סבב →
`archive/apply.ts` על הגרסה העומדת, `Decision.archived: true`,
`timegrama.done: true`, התראה לכולם.

**`counterObjectChange.ts`** (חדש, לפי תבנית `submitNegoMission` +
`counterSaleClaim`):
```
params: { decisionId, projectId, ordern, mode, why?,
          newValues?, hoursOutcome?, hoursToCredit?, transferToId? }
```
מוסיף `negoarch[N+1]`, `vots {what:true, order:N+1}` של המציע, סוגר את
ה-`timegrama` הישן ופותח חדש (**איפוס שעון**), מתריע לשאר החברים.

**עמוד הלב** — הרחבה של הצינור הקיים, לא ani חדש:
- qid `87levSliceDecisions`: להוסיף `kind`s חדשים, `targetKind`,
  `negoarch`, `archWhy` ואת שדות היעד לתצוגה (שם, שעות שנצברו, מבצע).
- `extractDecisions` (`levDataExtractors.ts`): payload `archive` על
  `DecisionData` (סבב עומד, mode, hoursOutcome, מי הציע, כמה חתמו, זמן
  שנותר, האם אני כבר חתום על הסבב העומד).
- קלף חדש `src/lib/components/lev/cards/ArchiveObjectCard.svelte` לפי
  קונבנציות `HOWTO_ADD_LEV_OBJECT.md` (CardHeader זהוב, `onUser` במודל,
  `onChat` דרך `decision.forums`), עם שלושת הכפתורים:
  **לב** = מסכים לגרסה העומדת · **צ'אט** = בירור · **כף-מאזניים** = מו״מ.
- דראוור מו״מ `src/lib/components/lev/negoArchive.svelte` מרכיבי `conf/`:
  מתג `mode` (ארכוב / השארה עם שינוי), שדות הערכים prefilled מהסבב העומד
  עם הגרסה הקודמת כ-reference, ובלוק סילוק שעות (רדיו credit/waive/
  transfer + סכום + בורר משימת יעד) שמוצג רק כשיש שעות.
- `levSocketHandler.ts` — רענון חי, `levStores`/`levDerived` אם נוסף ani
  נפרד לגרסה הרדומה.

**Exit:** פינג-פונג מלא בשני דפדפנים: A מציע לארכב משימה בתהליך עם 12
שעות; B פותח מו״מ ומציע `keep` עם 8 שעות מזוכות; A מאשר → המשימה נשארת,
השעות עודכנו, ה-Decision arch.

### פאזה 3 — שתיקה כהסכמה + סילוק בפועל + מסך ארכיון

- **`src/routes/api/timegrama/decision.svelte`**: ענף לשני ה-kinds →
  אותו `archive/apply.ts` (דרך ה-`exec` של `SendToAdmin`), עם
  `confirmedBy: 'timeout'`-equivalent בתיעוד ה-Decision.
- **סילוק שעות בפועל** — שלושת ה-outcomes, כולל עצירת טיימר פעיל וסגירת
  `finiapruval` פתוח לפני הארכוב.
- **מסך ארכיון** בתוך `moach/[projectId]` (לפי תקדים
  `SplitsArchive.svelte` / `SiteShareArchive.svelte`): כל האובייקטים
  המארוכבים, הנימוק, מי יזם, איך הבשיל (הצבעה/שתיקה), קישור ל-Decision
  ולשעות שזוכו. **שום דבר לא באמת נעלם.**
- **chips** בכל מקום שהאובייקט מוצג: "בדיון להסרה · סבב N · נותרו 14ש׳"
  / "בארכיון · {תאריך}".
- **i18n**: namespace חדש `archive` בחמש השפות
  (`src/lib/translations/<locale>/archive.json`) + רישום ב-`routes.js`;
  `npm run check:i18n` + `npm run check:script`.

**Exit:** הצעה שאיש לא הגיב לה מבשילה לבד בתום ה-restime; שעות שנצברו
מופיעות כ-`finnished-mission` ונכנסות לחלוקה; האובייקט נראה בארכיון.

### פאזה 4 — עריכה יזומה + חתימות

- **`editObject` מלא**: כפתור "בקש עדכון" ב-`missionInProgress.svelte`
  ובדף `moach/[projectId]/progress/[missionId]` — תוספת שעות, עדכון
  שווי שעתי, תאריכים. בריקמת יחיד מיידי, אחרת אותו קלף/מו״מ/timegrama.
  זה גם מה שסוגר סופית את `Decision.moreHours`/`newHours` הישנים.
- **אירועים חתומים** (`src/lib/consent/`): action חדש אחד
  `object.archive.propose`; `proposal.counter`, `decision.vote`,
  `consensus.timeout` הקיימים מקבלים שימוש חדש. specs ב-
  `src/lib/consent/specs/objectArchive.ts`, `shadowSignFromCookie`
  בלקוח, reducer + `ProjectState.objects[].lifecycle` ב-projection.
  אכיפה קריפטוגרפית בהתאם לפאזה 4 של `PLAN_user_sovereign_consent`.

---

## החלטות ונקודות שצריכות את אישורך

1. **שם השדה `lifecycle`** (במקום `isArchived`), עם
   `active|archiveProposed|archived|released`. חלופה: `objectState`.
2. **שני kinds** (`archiveObject` + `editObject`) ולא אחד — כי הצעת
   עריכה יזומה קוראת רע תחת "ארכוב", גם אם המכניקה זהה.
3. **קונסנזוס כלל-ריקמתי** (כמו `pendm`), לא דו-צדדי. בריקמת יחיד —
   מיידי. האם רצוי סף נמוך יותר (למשל: מספיק שאין "לא" אחרי restime,
   בלי לדרוש חתימה של כולם)? — ברירת המחדל בתכנית היא **פה-אחד או
   שתיקה**, זהה ליצירה.
4. **`scope: 'release'` ריבוני** לאובייקט רדום ללא שעות — המבצע משחרר
   מיד והצורך חוזר לבריכה. לאישורך: זו הפרשנות שלי ל"בלי סיבוך".
5. **`DORMANT_DAYS = 30`** — הפרמטר שמפריד "רדום" מ"פעיל". אפשר לגזור
   אותו מ-`restime` במקום קבוע (למשל ×10).
6. **חובת נימוק** — קשיחה רק כשיש שעות שנצברו, מומלצת בשאר.
7. **משאב בתהליך** — מסלול הסילוק שלו פחות ממופה; מוצע לפצל לפאזה 3ב'
   אם הוא מסבך את היציאה של פאזה 3.
8. **מונים/מנויים (`monter`)** על מוצר מארוכב — נסגרים והלקוחות מקבלים
   התראה. לאישור.

---

## תכנית אימות

### Unit (Vitest)
- `proposeObjectArchive`: ריקמת יחיד → `lifecycle: 'archived'` מיידית בלי
  Decision; ריקמה מרובה → Decision + `negoarch[0]` + vote order 1 +
  timegrama + `archiveProposed`; יעד שכבר `archived` → נדחה; הצעה שנייה
  על אובייקט ב-`archiveProposed` → נדחית; שעות > 0 בלי `why` → נדחה.
- `voteOnDecision` (ענף archive): חתימה של כל החברים על הסבב העומד →
  החלה + `Decision.archived`; חתימה על סבב ישן → נדחית; לא-חבר → נדחה.
- `counterObjectChange`: `negoarch[1]` עם `mode:'keep'`, vote order 2,
  timegrama ישן `done` וחדש פתוח; הבשלה של `keep` → האובייקט **נשאר**
  והערכים הוחלו.
- `archive/apply.ts` per targetKind: `credit` יוצר `finnished-mission`
  נכון; `waive` לא יוצר; `transfer` זוקף למשימת היעד; `release` מחזיר
  את ה-open-mission לבריכה; ארכוב משימה פתוחה סוגר את ה-`ask`ים.
- `dormancy.ts`: משימה עם שעות אינה רדומה; משימה עם טיימר פעיל אינה
  רדומה; משימה בת יומיים אינה רדומה.
- `extractDecisions`: ממפה רק הצעות פתוחות שבהן אני עוד לא חתום על הסבב
  העומד.

### Integration
- happy path: propose → כולם מאשרים → archived + סינון מכל הרשימות.
- nego path: propose(archive) → counter(keep, 8ש׳) → approve → האובייקט
  חי עם ערכים חדשים ו-`finnished-mission` על 8 שעות.
- timeout path: propose → אין תגובה → הבשלה אוטומטית בענף ה-timegrama.
- הגנה: `getProjectFinancials`/חלוקות לא סופרים אובייקט מארוכב פעמיים
  (השעות נספרות דרך ה-`finnished-mission` בלבד).

### Manual (שני דפדפנים)
1. A מציע לארכב משימה פתוחה שאין עליה מועמדים → B רואה קלף, מאשר →
   המשימה נעלמת מ-`moach/open` ומהמאצ'ינג, מופיעה בארכיון עם הנימוק.
2. A מציע לארכב משימה בתהליך של B עם 12 שעות שנצברו, `credit` על 12 →
   B פותח מו״מ, מציע `keep` עם `hoursassinged` מוקטן → A מאשר → המשימה
   נשארת, השעות לא זוכו, הקלף נסגר לשניהם.
3. משימה רדומה (0 שעות, 40 יום ללא פעילות) — B (המבצע) לוחץ "שחרור" →
   מיידי, בלי קלף לאיש, והצורך חוזר לבריכה הפתוחה.
4. ריקמת יחיד — ארכוב מוצר → מיידי.
5. שתיקה — A מציע, איש לא מגיב, אחרי פקיעת ה-timegrama האובייקט מארוכב
   ומסומן "אושר בשתיקה".
