# תכנית: הצעה עצמית לריקמה (Self-Nomination)

אדם שמתחבר לכיוון של ריקמה מציע את עצמו מהדף הציבורי `/project/[id]`:
"קבלו אותי להיות חלק מכם בתנאים האלה". ההצעה יוצרת **משימה או משאב שהמועמד
עצמו חיבר**, ומפעילה את מכונת המו"מ הקיימת של מועמדים
(`docs/PLAN_NEGOTIATION_CANDIDATES.md`) — עם הבדל אחד מהותי: אם ההצעה לא
מבשילה, הריקמה רשאית **לבטל את המשימה/המשאב כליל**, כי הם מעולם לא היו שלה.

נוצר: 2026-07-07 · עודכן: 2026-07-17 · סטטוס: **מומש חלקית** (ר' ★ למטה)

הבהרה חשובה: ההצעה העצמית רלוונטית ל**כל** סוג ריקמה — מסחרית, התנדבותית
או כל רוח אחרת. הקשר ל-PLAN_VOLUNTEER_RIKMA (סעיף 6) הוא רק בקצב האישור.

## ★ סטטוס מימוש (2026-07-17)

**הכרעת UI**: במקום מודאל על הדף הציבורי (§4.1 המקורי) — **דף ייעודי**
`/project/[id]/join`: עמוד עומד-בפני-עצמו עם טופס דו-מסלולי
("אני אעשה…" משימה / "אני אביא…" משאב), ערכי הריקמה כהקשר, הסבר
"איך זה עובד" (כולל restime), הפניית חברים למוח והפניית אורחים להרשמה.
דף הפרויקט הציבורי עוצב מחדש עם שני "שערים": 💗 תמיכה (`/support`) ·
🤝 הצטרפות (`/join`).

**בנוי ✅**
- S2: `nominateSelfMission` · `nominateSelfResource` ·
  `dismissSelfNomination` (כולל `mode:'withdraw'` למועמד) — רשומים
  ב-`configs/index.ts`. Ask/Askm בלי הצבעה (Path A), timegrama נדחה
  להצבעת חבר ראשונה (המנגנון הקיים ב-`addVote`), Mission entity נוצר
  כתבנית שהמועמד חיבר (נדרש ל-finalizer).
- S3 (חלקי): `source:'selfNomination'` מסונן מרשימות `availableMission`
  (qids 27–30, עם or-null כדי לא להעלים legacy) ומרשימת המשימות בדף
  הציבורי + דף התמיכה (qids 49/213).
- S4: דף `/project/[id]/join` + השערים בדף הציבורי + קישור מדף התמיכה.
- qids: 214–218 (יצירת OpenMission/OpenMashaabim/Sp להצעה עצמית +
  שאילתות ההקשר לביטול).

**חסם סכמה (S1)**: להוסיף ב-Strapi את הערך `selfNomination` ל-enum
`source` של `open-mission` ו-`open-mashaabim`, ואז `npm run types:update`.
עד אז הפעולות מחזירות שגיאה מוסברת. (שינוי אדמין של דקות.)

**נותר**: S5 (באדג' 🌱 + כפתור ביטול/משיכה בכרטיסי הלב — extractors:
`source`), S6 בדיקות unit לפעולות, S7 גילוי (hub), וסינון ה-processors
בלב (§4.3 סיפא).

---

## 1. המודל

### 1.1 מה שונה מהמו"מ הקיים על הצעות פתוחות

| | הצעה פתוחה רגילה | הצעה עצמית |
|---|---|---|
| מי יוצר את ה-OpenMission/OpenMashaabim | הריקמה (pendm/pmash) או קונסיירז' | **המועמד** |
| הבסיס (baseline) | תנאי הריקמה | **תנאי המועמד** |
| מועמדים מקבילים | כן — לכן הבסיס נשאר נקי | לא — ההצעה אישית לחלוטין |
| בכישלון | רק ה-Ask/Askm מתארכב; ההצעה נשארת פתוחה | **כל ה-OpenMission/OpenMashaabim מתארכב** |
| נראות ציבורית | מופיע ב-`availableMission`/`availiableResorce` ובדף הפרויקט | **לא מופיע בשום רשימה ציבורית** |

### 1.2 למה זה עדיין רוכב על אותה מכונה

ברגע שנוצרו OpenMission + Ask (או OpenMashaabim + Askm), כל השאר קיים כבר:

- **שער דו-צדדי** — `src/lib/server/nego/negoGate.ts` (`computeNegoGate`).
  אין סבב ⇒ מצב-בסיס: נדרשת הצבעת-בעד של חבר-ריקמה אחד + העדר `false`.
  כאן "אין סבב" הוא בדיוק המצב ההתחלתי: הבסיס = הצעת המועמד, והבקשה עצמה
  היא הסכמת המועמד (takerYes מובלע — Path A במסמך המו"מ).
- **timegrama נדחה** — נוצר רק בהצבעת-בעד ראשונה של חבר
  (`ensureCandidacyTimegrama`), בדיוק כמו מועמד חיצוני ב-Path A/B.
  שתיקה היא הסכמה בקצב הריקמה (`restime`) — רק אחרי שחבר נענה.
- **הצעה נגדית של הריקמה** — `counterOnAsk`/`counterOnAskm` (B2), והמועמד
  משיב עם `acceptCounterOnAsk(m)` או `candidateCounterOnAsk(m)`. פינג-פונג
  קיים, ללא שינוי.
- **מימוש** — `finalizeAskAcceptance` / `runResourceAskmAcceptance` +
  ה-finalizers `api/timegrama/ask.svelte`/`askm.svelte` עובדים כמו שהם,
  כי הם מחילים את הסבב האחרון על הבסיס — והבסיס כאן ממילא של המועמד.
- **כרטיסי לב** — ה-Ask שייך לפרויקט ⇒ נטען ב-`83levMainUserQuery`
  (project-scoped) ומופיע לחברי הריקמה ב-`reqtom`/`reqtojoin`; ולמועמד
  (user-scoped) ב-`projectSuggestor`/`mashsuggest`. נדרש רק באדג' "הצעה עצמית".

**לא ממציאים מכונת-הצבעה חדשה** (עקרון-על): ההסכמה היא vots על ה-Ask/Askm,
רוחב-ריקמה, כמו כל מועמדות.

### 1.3 עקרון "אין לא מוחלט" מול ביטול המשימה

הביטול המלא איננו וטו על טענה של חבר — הוא הסרה של הצעה יזומה מבחוץ, מקבילה
ל-`declined`/`usersNotRelevant` שקיימים היום על OpenMission. ההבחנה:

- על **תוכן ההצעה** אין "לא": ה-UI מציג תמיד אשר · שוחח (פורום) · הצע נגדית.
- על **עצם הקשר** מותר לריקמה לומר "לא רלוונטי לנו כרגע" — ואז המשימה
  שהמועמד יצר לא נשארת זבל פתוח אצל הריקמה, אלא מתארכבת כולה.
- כפתור הביטול מנוסח בהתאם ("לא מתאים לנו כרגע", עם הודעה מכבדת למועמד),
  ומופיע משני לאפשרויות ההידברות.

---

## 2. שינויי סכמה (Strapi)

מינימליים — אין קולקציה חדשה:

| טבלה | שינוי |
|------|-------|
| `open-mission` | ערך enum חדש ל-`source`: `selfNomination` (קיימים: `concierge`, `project`) |
| `open-mashaabim` | ערך enum חדש ל-`source`: `selfNomination` |

זהות המועמד נגזרת מ-`ask.users_permissions_user` / `askm.users_permissions_user`
— אין צורך בשדה יוזם על ההצעה עצמה. (אופציה: לאכלס גם `rishon` על OpenMission
לתאימות תצוגה, אבל `isRishon` שמור למסלול הפנימי — עדיף לא לערבב.)

לאחר השינוי: `npm run types:update`.

---

## 3. פעולות שרת (actions)

### 3.1 `nominateSelfMission` (חדש)

`src/lib/server/actions/configs/nominateSelfMission.ts`, במתכונת
`openMissionProposalHandler` אבל הפוך בשלב הראשון:

1. אימות: המבקש **אינו** חבר ריקמה (`128getProjectMembersAndRestime`);
   חבר מופנה למסלול הפנימי (isRishon) הקיים.
2. יצירת `OpenMission` עם תנאי המועמד (name, descrip, noofhours, perhour,
   skills, work_ways, location…), `source:'selfNomination'`,
   `project: projectId`, `publishedAt: now`.
3. יצירת `Ask` (`81.5createAsk`) עם הצבעת-בעד של המועמד — כמו
   `applyToMission` (Path A). **בלי סבב-0** — הבסיס הוא כבר הצעת המועמד.
4. עדכון `user.askeds` (`81updateAskeds`).
5. **בלי timegrama** — נדחה להצבעת חבר ראשונה (המנגנון ב-`addVote` /
   `ensureCandidacyTimegrama` קיים).
6. נוטיפיקציה לחברי הריקמה (`specificUsers`, socket+push):
   "מישהו מציע את עצמו לריקמה שלכם".

### 3.2 `nominateSelfResource` (חדש)

מקביל על צד המשאב: `ensureSpId` (החילוץ הקיים מ-`availiableResorce/[id]` —
בוחר SP קיים של המשתמש או יוצר חדש) → יצירת `OpenMashaabim`
(`source:'selfNomination'`) → `Askm` עם הצבעת המועמד + `sp`.

### 3.3 `dismissSelfNomination` (חדש) — הביטול המלא

ההבדל היחיד במכונה. חבר ריקמה מפעיל:

1. אימות: המפעיל חבר ריקמה; ה-OpenMission/OpenMashaabim הוא
   `source:'selfNomination'` (על הצעה רגילה הפעולה נכשלת — שם רק
   `declineMissionRequest`/`declineAskmRequest` הקיימים, שמארכבים Ask בלבד).
2. ארכוב ה-Ask/Askm + ביטול timegrama פעיל (`cancelCandidacyTimegrama`).
3. ארכוב ה-OpenMission/OpenMashaabim עצמו.
4. נוטיפיקציה מכבדת למועמד, עם הזמנה להמשיך לעקוב אחרי הריקמה.

בנוסף — **משיכת ההצעה ע"י המועמד** (`withdrawSelfNomination` או פרמטר על
אותו handler): אותם צעדים, מופעל ע"י המועמד עצמו.

### 3.4 מה לא נוגעים בו

`counterOnAsk(m)`, `acceptCounterOnAsk(m)`, `candidateCounterOnAsk(m)`,
`finalizeAskAcceptance`, `runResourceAskmAcceptance`, negoGate, timegrama —
ללא שינוי. רק לוודא שה-finalizer שמארכב "asks אחרים ואת ה-OpenMission" בקבלה
(`ask.svelte`) מתנהג נכון גם כאן (יש רק ask אחד — טריוויאלי).

רישום: `configs/index.ts` + טייפים ב-`client/actionClient.ts` לשלוש הפעולות.

---

## 4. UI

### 4.1 הדף הציבורי `/project/[id]` — נקודת הכניסה

`src/routes/(regandnon)/project/[id]/+page.svelte`:

- CTA חדש בולט אחרי סקשן הערכים: **"מתחבר/ת לכיוון? הציעו את עצמכם לריקמה"**.
- לא-רשומים: ה-CTA מוביל להרשמה (עם `redirect` חזרה לדף), כמו כרטיס ההזמנה
  הקיים.
- חבר ריקמה: ה-CTA מוסתר (יש לו את המוח).
- לחיצה פותחת מודאל דו-שלבי:
  1. **מה אני מציע** — משימה ("אני אעשה…") או משאב ("אני אביא…").
  2. **התנאים שלי** — טופס במתכונת `<NegoM>`/`<Nego>` הקיימים
     (name, descrip, שעות/מחיר או שדות משאב, מיומנויות). ערכי הריקמה
     מוצגים לצד הטופס כהקשר.
- שליחה → `nominateSelfMission`/`nominateSelfResource` → אישור
  "ההצעה נשלחה — לריקמה יש [restime] להגיב מרגע שחבר ייענה".

### 4.2 כרטיסי הלב

- **לחברי הריקמה** (`reqtom`/`reqtojoin`): הכרטיס הקיים + באדג' "הצעה עצמית
  🌱" (לפי `source`, לטעון ב-extractors). כפתורים: אשר · הצעה נגדית (B2
  הקיים) · צ'אט (forum) · **"לא מתאים כרגע"** → `dismissSelfNomination`.
- **למועמד** (`projectSuggestor`/`mashsuggest`): הכרטיס הקיים של "ההצעות
  שלי" עם הבאנר הקיים להצעה נגדית; בנוסף כפתור "משוך את ההצעה".
- שעון `timetToTimegrama` מוצג כרגיל כשה-timegrama נוצר.

### 4.3 סינון מרשימות ציבוריות

`source:'selfNomination'` מסונן החוצה מ:
- רשימת `open_missions` בדף הציבורי `/project/[id]` (סעיף "משימות פנויות"),
- `availableMission` / `availiableResorce` (listing + ישיר: דף `[id]` יציג
  אבל בלי כפתורי מועמדות לאחרים),
- כל מקור אחר שמציג הצעות פתוחות (`hub`, suggestions בלב — ה-processors
  `processSuggestions`/`processResourceSuggestions` מדלגים על selfNomination
  שאינו של המשתמש הנוכחי).

---

## 5. הערת אגב שהופכת לשלב: גילוי ריקמות (Discovery)

ההצעה העצמית שווה משהו רק אם אנשים מגיעים לדפי ריקמות. היום אין שום עמוד
רשימת-פרויקטים — רק `/project/[id]` ישיר. חומרי ההתאמה כבר קיימים בסכמה:
`project.vallues` ↔ `user.vallues`, `open_missions.skills` ↔ `user.skills`,
`tafkidims`, `location`/`radius`, `cuntries`.

בסדר עולה של השקעה:

1. **P1 — "ריקמות שמתחברות אליך" בהאב** (`(reg)/hub`): סקשן של עד 5 ריקמות
   לפי חיתוך ערכים משותפים (`user.vallues ∩ project.vallues`, משוקלל בחפיפת
   skills מול המשימות הפתוחות). כל כרטיס → `/project/[id]`. זה המקום שכבר
   נטען idle-time.
2. **P2 — עמוד גילוי `/projects`** (ציבורי, `(regandnon)`): רשימת ריקמות עם
   פילטור לפי ערכים (Vallue) ותחומים, חיפוש טקסטואלי. זה גם דף SEO-כניסה.
3. **P3 — הצעה בפרופיל ובאונבורדינג**: בסוף מסלול onboarding (יש
   `onboarding_track`) ובדף `/user/[id]` של עצמך — "ריקמות בכיוון שלך".
4. **P4 — התאמה יזומה בסגנון קונסיירז'**: ג'וב תקופתי (במתכונת
   `RatsonMatchJob`) שמזהה חיתוך גבוה משתמש↔ריקמה ושולח נוטיפיקציה. רק אחרי
   שיש דאטה מ-P1–P3.

P1 הוא תנאי מספיק להשקת הפיצ'ר; P2+ עצמאיים.

---

## 6. חיבור לתכנית הריקמה ההתנדבותית

ר' `docs/PLAN_VOLUNTEER_RIKMA.md`. נקודת החיבור: כשהריקמה היא
`spirit:'volunteer'` עם `joinPolicy` מקל, הצעה עצמית יכולה להתאשר מהר יותר
(restime קצר / הצבעת חבר יחיד מממשת מיד). המנגנון כאן לא משתנה — רק
הפרמטרים שהשער קורא.

---

## 7. שלבי ביצוע

- [ ] **S1 סכמה**: `source:selfNomination` בשני ה-enums + `types:update`.
- [ ] **S2 פעולות**: `nominateSelfMission`, `nominateSelfResource`,
      `dismissSelfNomination` (+withdraw) + רישום + טייפים.
- [ ] **S3 סינון**: selfNomination מחוץ לרשימות ציבוריות ול-processors.
- [ ] **S4 UI כניסה**: CTA + מודאל בדף הציבורי.
- [ ] **S5 UI לב**: באדג' + כפתור ביטול/משיכה בכרטיסים (extractors: `source`).
- [ ] **S6 בדיקות**: unit ל-actions (מתכונת `updateTask.test.ts`) + מעבר
      ידני על 3 התרחישים: אישור בשתיקה, פינג-פונג נגדי, ביטול מלא.
- [ ] **S7 גילוי P1**: סקשן ריקמות מותאמות בהאב.
