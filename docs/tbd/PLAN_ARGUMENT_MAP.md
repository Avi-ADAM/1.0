# מפת טיעונים: מודל נתונים לחקירה שמתפצלת

> **סטטוס: tbd. מסמך תכנון, לא נכתב בעקבותיו קוד.** נכתב 2026-11-01.
>
> מסמכים קשורים: [`PLAN_OBJECT_ARCHIVAL.md`](../done/PLAN_OBJECT_ARCHIVAL.md) (מודל
> ההסכמה שכאן *לא* חל), [`PLAN_central_rikma_definition.md`](./PLAN_central_rikma_definition.md),
> אתר ההסכמה `agreement.1lev1.com` (`CONSENSUS_PROXY_SECRET` ב-`src/lib/server/authz/principal.ts`).

---

## 0. הרעיון במשפט אחד

רקמה של חוקרים, או כל מי שמגיע מבחוץ, בונה **מפה** של שאלות, עמדות, טיעונים
וראיות. המפה **לא** מכריעה. היא שומרת כל נתיב פתוח עד שמי שהולך בו מגיע לסופו,
ומאפשרת לחבר שני נתיבים כשהטיעונים מצדיקים את זה. אותו מבנה מתאים למחקר חי
(פיזיקה, רפואה) וגם לסיכום ידע שכבר הצטבר (אלפי שנות פילוסופיה).

## 1. האם לבנות בתוך 1lev1? ההמלצה: אתר נפרד עם גשר צר

### 1.1 למה לא בתוך 1lev1

1. **העיקרון הפוך.** עקרונות העל של 1lev1 (`CLAUDE.md`) קובעים: שתיקה היא הסכמה,
   כל החלטה רוכבת על `Decision`, והתוצאה אחידה לכל הרקמה (או fork). כאן המטרה היא
   ההפך: **ריבוי נתיבים**, ושום דבר לא "מאושר אוטומטית" כשאין תגובה. אם שני
   עקרונות על סותרים זה את זה באותו קוד, מישהו יחבר בעתיד `restime` לטיעון, ואז
   טיעון שלא ענו עליו בזמן "יאושר". זה בדיוק הבאג שאסור שיקרה.
2. **הקהל שונה.** מפת פילוסופיה ציבורית נועדה לקוראים אנונימיים, למנועי חיפוש
   ולתורמים מזדמנים. 1lev1 בנוי סביב חברות, אחוזים וכסף. את הנוכחות הציבורית
   עדיף לבנות בלי מעטפת האישורים, `(reg)` ו-`authz`.
3. **צורת הנתונים שונה.** זה גרף עם קשתות מטיפוסים שונים, מהדורות של כל צומת
   ועוגנים בתוך טקסט עשיר. ב-Strapi/GraphQL כל קשת תהיה content-type עם relations,
   וכל שליפה של תת-עץ תצטרך N שאילתות. ב-Postgres זה `WITH RECURSIVE` אחד.
4. **רישיון ואחריות.** ידע ציבורי צריך רישיון פתוח (CC BY-SA), ייצוא ומזהים
   יציבים. אלה לא שייכים לאתר שמחזיק נתונים כספיים של רקמות.
5. **כבר יש תקדים.** אתר ההסכמה רץ בנפרד ומדבר עם 1lev1 דרך principal מצומצם
   (`isConsensusRequest`). אפשר לבנות כאן בדיוק לפי אותה תבנית.

### 1.2 מה כן מחבר (הגשר)

| בכיוון | מה עובר |
|---|---|
| זהות | התחברות עם חשבון 1lev1 (OAuth/OIDC). אפשר גם להתחבר בלי חשבון 1lev1. |
| רקמה ← מפה | רקמה יכולה **להחזיק מרחב** (`Space.ownerRikma`): מרחב פרטי או ציבורי, וחברי הרקמה הם העורכים שלו. |
| מפה ← רקמה | עבודת מחקר היא עבודה: אפשר לקשר צומת או ענף ל**משימה** ברקמה, והשעות וההון נספרים כרגיל ב-1lev1. המפה עצמה לא יודעת כלום על כסף. |
| מפה ← רקמה | ענף שהגיע לנקודת החלטה מעשית ("נריץ את הניסוי של X") **פותח** משימה או משאב פתוחים ב-1lev1 דרך ה-Action System, עם principal מצומצם כמו של אתר ההסכמה. |

כלומר, אם החקירה מגיעה למסקנה, ההחלטה על פיה עוברת לרקמה, ושם ההחלטה כן
אחידה. החקירה עצמה לא חייבת להיות אחידה.

## 2. מושגים

המבנה נשען על IBIS (Issue-Based Information System: שאלה, עמדה, טיעון), ומחשבים
מכירים אותו כבר משנות ה-70. כדאי לייצא גם ל-AIF (Argument Interchange Format)
כדי שהמפה לא תהיה סגורה.

| צומת (`kind`) | מה זה | דוגמה |
|---|---|---|
| `question` | שאלה פתוחה או בעיה | "מה גורם לתופעה Z?" |
| `position` | עמדה, תשובה מוצעת לשאלה | "הפתרון כנראה X" |
| `argument` | טיעון בעד או נגד צומת אחר | "X מסביר גם את התצפית W" |
| `evidence` | ראיה: מקור, ניסוי, נתון, ציטוט | מאמר, DOI, טבלת תוצאות |
| `synthesis` | איחוד של כמה עמדות | "X ו-Y הם שני מקרים של X′" |
| `document` | טקסט עשיר שבנוי מצמתים (ראו §4) | מאמר סקירה של הרקמה |

**ענף (X.x, X.y)** הוא `position` עם קשת `refines` לעמדת האב, ולא סוג נפרד.
העומק לא מוגבל.

## 3. קשתות: גרף ולא עץ

אותו טיעון יכול לתמוך בשתי עמדות, ואותה ראיה יכולה לשמש עשרה טיעונים. לכן הנתונים
הם **גרף**, והעץ הוא רק *תצוגה* שנבנית מצומת שורש שהקורא בוחר.

| קשת (`rel`) | מ → אל | משמעות |
|---|---|---|
| `answers` | position → question | העמדה עונה על השאלה |
| `refines` | position → position | פיצול או חידוד (X.x ← X) |
| `supports` / `opposes` | argument → כל צומת | בעד / נגד |
| `premise` | claim → argument | הנחה שהטיעון נשען עליה. כך אפשר לתקוף הנחה בודדת ולא את הטיעון כולו |
| `cites` | argument → evidence | הטיעון מסתמך על הראיה |
| `synthesizes` | synthesis → position (×N) | איחוד |
| `equivalent` | node ↔ node | כפילות, אותו טיעון בניסוח אחר |
| `raises` | כל צומת → question | הטיעון מעלה שאלה חדשה |

### 3.1 הוספת טיעון באמצע

`A supports C` נעשה `A supports B`, `B supports C`. השינוי לא דורס כלום: הקשת
הישנה מקבלת `supersededBy`, ושתי הקשתות החדשות נוצרות באותה טרנזקציה. ההיסטוריה
נשארת, וכל מי שהגיב ל-A→C רואה שבינתיים נוסף ביניהם שלב.

### 3.2 איחוד (merge) בלי מחיקה

כשהטיעונים של צד אחד "התקבלו", לא מוחקים את הצד השני:
- נוצר צומת `synthesis` עם קשתות `synthesizes` לשני הענפים, **או**
- ענף אחד מסומן `absorbedInto` של האחר.

הענף המאוחד נשאר במפה כ"נתיב שנחקר והוביל לכאן". גם זה ידע, ולפעמים בדיוק הידע
שמישהו יחפש בעוד עשר שנים.

## 4. "החלק הזה במסמך לא נכון לי": מסמך כתצוגה של צמתים

המטרה היא לא להציע שינוי טקסט. מסמך הוא רצף בלוקים, וכל בלוק טענה הוא צומת
(`position`/`argument`). כשמסמנים קטע ולוחצים "לא מסכים/ה":

1. נוצר עוגן על הקטע (Text Quote Selector בסגנון W3C Web Annotation: הטקסט עצמו,
   קידומת וסיומת, ומספר המהדורה). העוגן שורד עריכות קטנות.
2. נפתח צומת חדש: `argument` עם `opposes` לטענה המעוגנת, או `position` חלופית
   (`refines`/`answers` לאותה שאלה). המשתמש בוחר.
3. המסמך מציג סימון בשוליים, והקורא בוחר באיזה נתיב לקרוא: המקור, החלופה או
   שניהם זה לצד זה.

ככה המסמך לא "נשבר". אפשר לקרוא אותו בכל פעם לאורך נתיב אחר במפה.

## 5. אין "אמת" מחושבת אחת: עמדות אישיות ומצב מבני

אף הצבעה לא קובעת מה נכון. במקום זה יש שלוש שכבות נפרדות:

1. **עמדה אישית** (`Stance`): משתמש מסמן על צומת `agree | disagree | unsure`
   ובאיזו ודאות (0–1). העמדה פרטית כברירת מחדל, ואפשר לפרסם אותה.
2. **מצב מבני**, שמחושב מהגרף ולא מהצבעה:
   - `unchallenged`: אין `opposes`.
   - `contested`: יש `opposes` שלא נענה.
   - `answered`: כל `opposes` נענה בטיעון נגד (רקורסיבית).
   - `unsupported`: אין `supports` ואין `cites`.
   
   המצב אומר **איפה החקירה עומדת**, ולא מי צודק.
3. **סטטוס חקירה של ענף**, שמי שהולכים בענף קובעים: `exploring | concluded |
   deadEnd | parked`, ותמיד עם נימוק. "מבוי סתום" הוא תוצאה ראויה ולא כישלון.

**עדשות (lens):** אפשר לצפות במפה "דרך העיניים של" אדם, רקמה או אסכולה, כלומר
להדגיש את הצמתים שהם מקבלים. זו הדרך להציג "הקאנטיאנים חושבים כך, והתועלתנים
כך" בלי שהמערכת תכריע ביניהם.

## 6. ייחוס מול תרומה: ידע היסטורי

כדי לסכם פילוסופיה צריך להבדיל בין **מי טען** לבין **מי הכניס את זה למפה**:

- `contributedBy`: המשתמש שכתב את הצומת.
- `attributedTo`: ישות חיצונית (קאנט, מאמר, אסכולה) עם מקור (`evidence` עם `cites`).

כך מפה ציבורית יכולה לייצג את "הוויכוח בין יום לקאנט" כוויכוח שלהם, בלי
להעמיד פנים שהם חתומים על זה.

## 7. טיוטת סכמה (Postgres)

```sql
create table space (
  id uuid primary key,
  slug text unique not null,
  title text not null,
  visibility text not null check (visibility in ('public','members','private')),
  license text not null default 'CC-BY-SA-4.0',
  owner_rikma_id text,               -- project id ב-1lev1, אופציונלי
  created_at timestamptz not null default now()
);

create table node (
  id uuid primary key,
  space_id uuid not null references space,
  kind text not null check (kind in ('question','position','argument','evidence','synthesis','document')),
  current_rev int not null default 1,
  inquiry_status text check (inquiry_status in ('exploring','concluded','deadEnd','parked')),
  inquiry_note text,
  absorbed_into uuid references node,
  attributed_to text,                -- "Kant", "Hume 1748", …
  created_by uuid not null,
  created_at timestamptz not null default now()
);

-- כל עריכה היא מהדורה חדשה, ושום דבר לא נדרס
create table node_rev (
  node_id uuid references node,
  rev int,
  title text not null,               -- הטענה במשפט אחד
  body jsonb,                        -- טקסט עשיר (ProseMirror/Tiptap JSON)
  lang text not null,
  author_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (node_id, rev)
);

create table edge (
  id uuid primary key,
  space_id uuid not null references space,
  rel text not null check (rel in ('answers','refines','supports','opposes','premise','cites','synthesizes','equivalent','raises')),
  from_node uuid not null references node,
  to_node uuid not null references node,
  to_rev int,                        -- המהדורה שהקשת התייחסה אליה: "היעד השתנה מאז שטענת"
  anchor jsonb,                      -- עוגן טקסט (§4), אם הקשת מכוונת לקטע
  superseded_by uuid references edge,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create index on edge (to_node, rel) where superseded_by is null;
create index on edge (from_node, rel) where superseded_by is null;

create table stance (
  user_id uuid,
  node_id uuid references node,
  value text not null check (value in ('agree','disagree','unsure')),
  confidence real check (confidence between 0 and 1),
  public boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, node_id)
);
```

הקשת `to_rev` חשובה במיוחד: אם הטענה שתקפת נערכה מאז, המערכת מציגה "הטענה
השתנתה מאז שהגבת", ולא ממשיכה להציג טיעון נגד גרסה שכבר לא קיימת.

## 8. סטאק מוצע לאתר הנפרד

- SvelteKit + Svelte 5, כמו כאן, כדי שהידע והרכיבים יעברו בין הפרויקטים.
- Postgres (עם `WITH RECURSIVE` לתתי-עצים), Drizzle או Kysely.
- Tiptap/ProseMirror לטקסט עשיר עם marks לעוגנים.
- תצוגת עץ או גרף: עץ מתקפל כברירת מחדל, וגרף (d3-force / cytoscape) לצפייה
  במבנה כולו.
- i18n מהיום הראשון: `node_rev.lang`, ובהמשך שכבת תרגום בסגנון T3 של 1lev1.

## 9. שלבים

| שלב | מה | היקף |
|---|---|---|
| P0 | מרחב, צמתים, קשתות, מהדורות. תצוגת עץ, הוספת טיעון בעד/נגד, ענף X.x | MVP |
| P1 | עמדות אישיות, מצב מבני, סטטוס חקירה, `insert-between`, `synthesis` | |
| P2 | מסמך עשיר עם עוגנים ("החלק הזה לא נכון לי") | |
| P3 | התחברות עם 1lev1, מרחב של רקמה, קישור ענף למשימה | הגשר |
| P4 | ייחוס היסטורי, עדשות, ייצוא AIF/Argdown, SEO למרחבים ציבוריים | ידע ציבורי |

## 10. שאלות פתוחות

1. **מי רשאי לערוך צומת של מישהו אחר?** ההצעה: אף אחד. מגיבים בטיעון או
   מציעים `refines`. רק המחבר מוציא מהדורה חדשה, ותיקוני ניסוח קטנים עוברים
   כהצעה שהמחבר מאשר.
2. **צומת שהוצב במקום הלא נכון** (תחת עמדה שהוא לא קשור אליה): "הצעת העברה"
   שהמחבר מאשר, או כלל מחמיר יותר במרחבים ציבוריים.
3. **כפילויות במרחב ציבורי גדול:** קשת `equivalent`, ואולי זיהוי דמיון סמנטי
   (embeddings) שמציע "כבר נטען כאן".
4. **AI:** האם מותר לייבא מפה שלמה מסיכום אוטומטי (לדוגמה פילוסופיה)? ההצעה:
   כן, אבל כל צומת כזה מסומן `aiDrafted` עד שאדם עובר עליו ומאמץ אותו.
5. **שם ודומיין** לאתר.
