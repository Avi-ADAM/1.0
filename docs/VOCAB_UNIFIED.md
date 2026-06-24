# מערכת אוצר-מילים מאוחדת (Skills / Values / Roles)

מטרה: **מקום אחד** לבחירה ויצירה של כישורים / ערכים / תפקידים בכל האתר —
הרשמה, אונבורדינג, יצירת משימה, יצירת פרויקט, עריכת פרופיל. אותו עיצוב, אותה
השלמה אוטומטית סמנטית, אותו cache, ואותו מסלול אבטחה (דרך הפרוקסי, בלי Strapi
ישיר בלקוח).

## רכיב יחיד

```svelte
<script>
  import VocabSelector from '$lib/components/ui/VocabSelector.svelte';
  let chosen = $state([]);
</script>

<VocabSelector kind="skills"  bind:selected={chosen} />
<VocabSelector kind="vallues" bind:selected={chosen} />
<VocabSelector kind="roles"   bind:selected={chosen} />
```

`kind` ∈ `skills | vallues | roles` (ראה `src/lib/vocab/vocabKinds.ts`).
Props: `selected` (bindable, מערך מחרוזות), `placeholder`, `color`, `autoCreate`,
`onadd`, `onremove`.

**תאימות לאחור:** `SkillSelector` / `ValueSelector` / `RoleSelector` הם כעת
עטיפות דקות מעל `VocabSelector` עם ה-props המקוריים (`selectedSkills` וכו'), כך
שכל מקומות הקריאה הקיימים ממשיכים לעבוד ללא שינוי.

## איך זה עובד

- **קריאת הקטלוג:** `GET /api/vocab/list?kind=…` (טוקן שרת, עובד גם אנונימית
  בהרשמה). התוצאה נשמרת ב-store המשותף (`mi.js`) ונמשכת **פעם אחת** — שאר
  המופעים משתמשים ב-cache.
- **זיהוי כפילויות סמנטי:** בזמן הקלדה, `checkDuplicate` (Pinecone embeddings)
  מזהיר על פריט זהה/דומה ומציע לבחור את הקיים במקום ליצור כפילות.
- **יצירה:** `POST /api/vocab/create { kind, label, lang, createdBy }` —
  בצד שרת בלבד. יוצר ב-Strapi → **מודרציה** → אם נקי: מאנדקס וקטור + מודיע
  לבעלים → מחזיר את הפריט. הלקוח אז מפעיל תרגום אוטומטי לכל השפות
  (`/api/translations`, ברקע).

## שרת המודרציה

`src/lib/server/vocab/moderation.ts` + `POST /api/vocab/moderate`.

- `screenLabel(label)` — בדיקה דטרמיניסטית (קישורים, פרטי קשר, ספאם, רשימת
  מילים חסומות הניתנת להרחבה). ללא תלות ב-LLM חיצוני.
- אם פריט מסומן: **מאוכסן (unpublish ב-Strapi — נשמר אך לא מפורסם)** ונשלחת
  הודעת טלגרם לבעלים (`NEW_TELEGRAM` + `TELEGRAM_BOT_TOKEN_NEW`). הבעלים יכול
  לבדוק ולפרסם מחדש או למחוק.
- `/api/vocab/moderate`: מצב dry-run (`{label}`) להחזרת ורדיקט, או
  `{kind,id,label}` לבדיקה+אכסון של פריט קיים — מתאים ל-cron או בדיקה ידנית.

המודרציה רצה **inline** בכל יצירה (`/api/vocab/create`), כך שלא ניתן לעקוף אותה.

## מה נותר לאימוץ מלא

- להחליף שימושים ישירים ב-`addnew/*` (addNewSkill, addnewval, addNewRole …)
  שעדיין יוצרים דרך GraphQL ישיר — להפנותם ל-`VocabSelector`/`/api/vocab/create`.
- workways: להוסיף `kind: 'work_ways'` ל-`vocabKinds` ולהגר את `addnewWorkway`.
- (אופציונלי) כפתורי Approve/Archive אינטראקטיביים בהודעת הטלגרם של הבעלים.
