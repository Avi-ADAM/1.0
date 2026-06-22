# תכנית: משא ומתן בין מועמדים לחברי פרויקט (openMission / openMashaabim)

מסמך מעקב למימוש מו"מ על תנאי שותפות בהצעות הפתוחות של הריקמה, במקביל למו"מ
הפנימי הקיים (pendm / pmash).

עודכן לאחרונה: 2026-06-21 · ענף: `main`

---

## 1. רקע ומודל

במו"מ הפנימי (`pendm`/`pmash`) בעלי-הזכות מנהלים מו"מ זה עם זה, וההצעה החדשה
**דורסת** את הישות (מותר — זה פנימי). כאן המצב שונה:

- המו"מ הוא בין **מועמד חיצוני** ל**פרויקט קיים** (ריקמה).
- ל־openMission/openMashaabim אחד יכולים להיות **כמה מועמדים במקביל**, כל אחד
  עם הצעה משלו → **אסור לדרוס** את ההצעה הפתוחה.
- לכל מועמד יש `Ask`/`Askm` משלו. ההצעה המתוקנת של המועמד נשמרת כ**סבב**
  (`Negopendmission` למשימה, `NegoMash` למשאב) **המקושר ל־Ask/Askm**. ה־
  openMission/openMashaabim נשאר נקי כעוגן בסיס.
- המו"מ **דו-צדדי לסירוגין**: מועמד מציע → בעלי-הזכות מצביעים או מציעים הצעת
  ביניים → המועמד מכריע, וחוזר חלילה.
- מצב המו"מ (סבב נוכחי, של מי התור, סטטוס) **נגזר מהסבבים** — אין שדות מצב
  סקלריים על Ask/Askm.

### מסלול isRishon (הצעה-עצמית)
כשחבר ריקמה יוצר הצעה ישירות (`isSelfProposal`/`isRishon`) — זה זהה למו"מ
הפנימי הקיים (`submitNegoMash`/`submitNegoMission` על pmash/pendm). נשמר כמסלול
נפרד.

---

## 2. סטטוס סכמת Strapi — ✅ הושלם

נוסף ואומת מול `src/generated/STRAPI_SCHEMA_REFERENCE.md`:

| טבלה | שדות שנוספו |
|------|-------------|
| `nego-mash` | `open_mashaabim` (m2o), `askm` (m2o), `ordern` (Int), `proposedBy` (enum candidate/project), `status` (enum proposed/accepted/countered/rejected/withdrawn) |
| `negopendmission` | `ask` (m2o), `ordern` (Int), `proposedBy` (enum), `status` (enum) |
| `askm` | `nego_mashes` (o2m → nego-mash) |
| `ask` | `negopendmissions` (o2m → negopendmission) |

> הערה: **לא** נוספו `currentRound`/`turn`/`negotiationStatus` על Ask/Askm —
> ובכוונה. המצב נגזר מהסבבים.

---

## 3. צד המשאבים (openMashaabim) — ✅ הושלם

זרימה מלאה: מועמד מציע הצעה מקבילה → בעלי-זכות מצביעים/מציעים ביניים → אישור
מחיל את התנאים המנוצחים.

### שרת
- **`src/routes/api/send/qids.js`** (קטע `negoQids`):
  - `negoCreateNegoMashRound` — יוצר סבב `NegoMash` עם `open_mashaabim`+`askm`+
    `ordern`/`proposedBy`/`status` (משמש גם מסלול pmash פנימי).
  - `getAskmNegoRounds` — קורא את סבבי ה־`nego_mashes` (ordern:desc) + `vots`.
  - `applyRoundToOpenMashaabim` — `updateOpenMashaabim` עם התנאים המנוצחים.
- **`src/lib/server/actions/configs/proposeOnOpenMashaabim.ts`** — מועמד יוצר
  Askm (`125createAskm`) + סבב `NegoMash` ראשון (`proposedBy=candidate`,
  `ordern=0`). לא נוגע ב־OpenMashaabim.
- **`src/lib/server/actions/configs/counterOnAskm.ts`** — בעל-זכות מוסיף סבב
  ביניים (`proposedBy=project`, `ordern+1`) + הצבעתו ל־`vots` של ה־Askm.
- **`src/lib/server/actions/helpers/runResourceAskmAcceptance.ts`** — בעת אישור,
  מחיל את תנאי הסבב האחרון על ה־OpenMashaabim (לפני createMaap+ארכוב), כך
  שהמימוש משתמש בתנאים המנוצחים. ללא סבבים → תנאי הבסיס נשמרים.
- רישום: `configs/index.ts`; טייפים: `src/lib/client/actionClient.ts`.

### UI
- **`src/lib/components/prPr/negoPend.svelte`** — נוסף prop אופציונלי `onSubmit`.
  כשקיים, הטופס מעביר את ה־diff להורה במקום לקרוא `submitNegoMash`.
- **`src/lib/components/lev/mashsuggest.svelte`** (כרטיס מועמד) — כפתור "הצעה
  מקבילה" פותח `<Nego>` ושולח דרך `proposeOnOpenMashaabim`.
- **`src/lib/components/lev/cards/sugestma.svelte`** — נוסף כפתור "הצעה מקבילה".
- **`src/lib/components/lev/reqtom.svelte`** (כרטיס בעל-זכות) — `<Nego>` נפתח
  לכל בעל-זכות (לא רק `isRishon`) ומנותב ל־`counterOnAskm`; `isRishon` ממשיך
  במסלול pmash הפנימי.

---

## 4. צד המשימות (openMission) — ⏳ לביצוע

מקביל לחלוטין לצד המשאבים. הישויות והקשרים כבר קיימים ב־Strapi (סעיף 2).

### 4.1 תיקון קריטי — `submitNegoMission.ts` דורס את ה-OpenMission
ב־`src/lib/server/actions/configs/submitNegoMission.ts`, מסלול "OpenMission"
(`isAsk !== 0`, שורה ~182) קורא `negoUpdateOpenMission` ש**דורס את ה-OpenMission**
ומעדכן `vots` ב-Ask. לפי המודל החדש זה שגוי (כמה מועמדים) — צריך:
- ליצור סבב `Negopendmission` מקושר ל-`ask` (במקום לדרוס), `proposedBy=candidate`.
- לעדכן רק את `vots` של ה-Ask הספציפי.

### 4.2 שאילתות חדשות (`qids.js`)
- `negoCreateNegopendmissionRound` — להרחיב את `negoCreateNegopendmission`
  הקיים עם `ask` + `ordern`/`proposedBy`/`status` (האנומים:
  `ENUM_NEGOPENDMISSION_PROPOSEDBY`, `ENUM_NEGOPENDMISSION_STATUS`).
- `getAskNegoRounds` — קריאת `negopendmissions` (ordern:desc) + `vots` של Ask.
- `applyRoundToOpenMission` — `updateOpenMission` עם התנאים המנוצחים
  (name, descrip, hearotMeyuchadot, noofhours, perhour, dates, sqadualed,
  skills, tafkidims, work_ways, location).

### 4.3 Actions חדשים
- `proposeOnOpenMission` — מקביל ל-`proposeOnOpenMashaabim`: יוצר Ask + סבב
  `Negopendmission` ראשון (`proposedBy=candidate`). מודל לפי `applyToMission.ts`.
- `counterOnAsk` — מקביל ל-`counterOnAskm` (`proposedBy=project`).
- לרשום ב-`configs/index.ts` ולהוסיף טייפים ל-`actionClient.ts`.

### 4.4 מימוש (acceptance)
- `src/routes/api/timegrama/ask.svelte` (וכן `finalizeAskAcceptance.ts`):
  כשמתקבל אישור — להחיל את תנאי הסבב המאושר האחרון לפני יצירת
  `Mesimabetahalich`, במקום העתקת תנאי ה-OpenMission הגולמיים. (כיום ask.svelte
  מעתיק את שדות ה-open_mission verbatim.)

### 4.5 UI
- **`src/lib/components/lev/projectSuggestor.svelte`** (כרטיס מועמד) — יש כבר
  ענף `masa` + `<Nego>` (שורה ~375) וכפתור nego ב-comment (שורה ~2790). לחבר
  כפתור פעיל ש-`onNego` → פותח Nego → `proposeOnOpenMission`.
- **`src/lib/components/lev/cards/sugestmi.svelte`** — יש `onNego`+`nego()`
  אבל **חסר כפתור** (כמו ב-sugestma לפני התיקון). להוסיף כפתור "הצעה מקבילה".
- **`reqtojoin.svelte` / `reqtosherut.svelte`** (כרטיסי בעל-זכות למשימות) —
  לאפשר פתיחת `<Nego>` + ניתוב ל-`counterOnAsk`.

---

## 5. משימות חוצות-נושא (שני הצדדים) — ⏳ לביצוע

1. **טעינת תנאי המועמד לכרטיס בעל-הזכות** — שאילתות ה-askm/ask בעמוד הלב
   טוענות כיום רק את בסיס ה-open_mashaabim/open_mission. להוסיף `nego_mashes`/
   `negopendmissions` לבחירה כדי ש-`reqtom`/`reqtojoin` יציגו את ההצעה האחרונה
   של המועמד (כרגע מוצגים props הבסיס). מקור: `qids.js` שאילתות עמוד הלב
   (סביב askms filters archived).
2. **חישוב סבב/תור בצד הלקוח** — helper שגוזר מ-`nego_mashes`/`negopendmissions`:
   `currentRound = max(ordern)`, `turn` מ-`proposedBy` של הסבב האחרון,
   `status` מהסבבים. להזין ל-`ordern`/`orderon` של ה-Nego.
3. **תיקון isRishon ב-reqtom** — במסלול הפנימי מועבר ל-Nego `pendId={id}`
   (id של ה-Askm) במקום `pmashId`. כשמדובר ב-isRishon להעביר `pmashId`.
   (תקלה קיימת מלפני השינוי, אך כדאי לתקן.)
4. **דפים קבועים** — להוסיף כפתור "הצעה מקבילה" גם ב:
   - `src/routes/(regandnon)/availiableResorce/[id]` (משאב)
   - `src/routes/(regandnon)/availableMission/[id]` (משימה)
   - דף ה-openmashaabim הקבוע (אם/כשקיים).

---

## 6. רשימת תיוג מהירה

- [x] סכמת Strapi (rounds + relations)
- [x] משאבים: proposeOnOpenMashaabim + counterOnAskm + מימוש + UI
- [x] משימות: תיקון submitNegoMission (לא לדרוס) → סבב מקושר ל-Ask
- [x] משימות: proposeOnOpenMission + counterOnAsk + שאילתות (negoCreateNegopendmissionRound / getAskNegoRounds / applyRoundToOpenMission)
- [x] משימות: מימוש ב-finalizeAskAcceptance מתנאי הסבב (best-effort, כמו runResourceAskmAcceptance)
- [x] משימות: UI (projectSuggestor + sugestmi + reqtojoin + negoM.onSubmit)
- [ ] טעינת nego_mashes/negopendmissions לכרטיסי בעל-הזכות
- [ ] helper חישוב סבב/תור בצד הלקוח
- [ ] תיקון pendId ל-isRishon ב-reqtom
- [ ] כפתורים בדפים הקבועים
